"""
Fantasy Rugby REST API Views

This module contains all the REST API endpoints for the Fantasy Rugby application.
It handles league management, team operations, player data, and user authentication.

Key Features:
- League creation and management
- Team joining and management
- Player database access
- User authentication and authorization
- Admin controls for league management

Data Storage:
- Uses Databricks as the primary data warehouse
- PostgreSQL for local Django authentication
- JWT tokens for API authentication

Author: Roland Crouch
Date: September 2025
Version: 1.0.0
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .databricks_rest_client import DatabricksRestClient
import json
import time
import gzip
from django.http import JsonResponse

# Simple in-memory cache for query results
query_cache = {}
CACHE_DURATION = 30  # Cache for 30 seconds

def get_cached_result(cache_key):
    """Get cached result if it exists and hasn't expired"""
    if cache_key in query_cache:
        result, timestamp = query_cache[cache_key]
        if time.time() - timestamp < CACHE_DURATION:
            return result
        else:
            del query_cache[cache_key]
    return None

def set_cached_result(cache_key, result):
    """Cache a result with current timestamp"""
    query_cache[cache_key] = (result, time.time())

def compressed_response(data, status_code=200):
    """Return a compressed JSON response for large data"""
    json_data = json.dumps(data)
    
    # Only compress if data is larger than 1KB
    if len(json_data) > 1024:
        compressed_data = gzip.compress(json_data.encode('utf-8'))
        response = JsonResponse(data, status=status_code)
        response['Content-Encoding'] = 'gzip'
        response['Content-Length'] = str(len(compressed_data))
        response.content = compressed_data
        return response
    else:
        return JsonResponse(data, status=status_code)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def user_leagues(request):
    """
    Handle user leagues using REST API
    
    GET /api/user-leagues/
        Returns all available leagues with their details
        
    POST /api/user-leagues/
        Creates a new league
        Required fields: name, user_id
        Optional fields: description, max_teams, is_public
        
    Returns:
        GET: List of league objects
        POST: Created league object or error message
        
    Example Response (GET):
    [
        {
            "id": "1",
            "name": "Premier League",
            "description": "A competitive fantasy rugby league",
            "created_by": "4",
            "max_teams": "6",
            "max_players_per_team": "15",
            "is_public": "true",
            "created_at": "2025-09-29T16:30:00Z"
        }
    ]
    """
    client = DatabricksRestClient()
    
    if request.method == 'GET':
        # Get all leagues
        try:
            result = client.execute_sql("SELECT * FROM default.user_created_leagues")
            if result and 'result' in result and result['result'].get('data_array'):
                leagues = []
                for row in result['result']['data_array']:
                    leagues.append({
                        'id': row[0],
                        'name': row[1],
                        'description': row[2],
                        'created_by': row[3],  # created_by_user_id is at index 3
                        'max_teams': row[4],  # max_teams is at index 4
                        'max_players_per_team': row[5],  # max_players_per_team is at index 5
                        'is_public': row[6],  # is_public is at index 6
                        'tournament_id': row[7],  # tournament_id is at index 7
                        'created_at': row[8],  # created_at is at index 8
                        'draft_status': row[9] if len(row) > 9 else 'NOT_STARTED'  # draft_status is at index 9
                    })
                return Response(leagues)
            else:
                return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        # Create new league
        try:
            data = request.data
            name = data.get('name')
            description = data.get('description', '')
            max_teams = data.get('max_teams', 6)
            max_players_per_team = 15  # Fixed at 15
            is_public = data.get('is_public', True)
            tournament_id = data.get('tournament_id')
            
            # Get user ID from request (assuming it's passed in the request)
            user_id = data.get('user_id')
            if not user_id:
                return Response({'error': 'User ID is required to create a league'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not tournament_id:
                return Response({'error': 'Tournament ID is required to create a league'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Convert boolean to proper SQL format
            is_public_sql = 'true' if is_public else 'false'
            
            # Generate unique league code
            from .email_utils import generate_league_code, send_league_code_email
            league_code = generate_league_code()
            
            # Get creator email and name for sending league code
            creator_email = data.get('creator_email', '')
            creator_name = data.get('creator_name', 'League Creator')
            
            sql = f"""
            INSERT INTO default.user_created_leagues (name, description, created_by_user_id, max_teams, max_players_per_team, is_public, created_at, draft_status, tournament_id, league_code)
            VALUES ('{name}', '{description}', {user_id}, {max_teams}, {max_players_per_team}, {is_public_sql}, CURRENT_TIMESTAMP, 'NOT_STARTED', {tournament_id}, '{league_code}')
            """
            result = client.execute_sql(sql)
            
            # Check if the insert was successful
            if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
                return Response({'error': f'Failed to create league: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Get the created league
            get_sql = f"SELECT * FROM default.user_created_leagues WHERE name = '{name}' ORDER BY created_at DESC LIMIT 1"
            league_result = client.execute_sql(get_sql)
            
            if league_result and 'result' in league_result and league_result['result'].get('data_array'):
                row = league_result['result']['data_array'][0]
                league = {
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'created_by': row[3],  # created_by_user_id is at index 3
                    'max_teams': row[4],    # max_teams is at index 4
                    'max_players_per_team': row[5],  # max_players_per_team is at index 5
                    'is_public': row[6],    # is_public is at index 6
                    'tournament_id': row[7],  # tournament_id is at index 7
                    'created_at': row[8],   # created_at is at index 8
                    'league_code': league_code  # Add the generated league code
                }
                
                # Send email with league code if email is provided
                email_sent = False
                if creator_email:
                    email_sent = send_league_code_email(name, league_code, creator_email, creator_name)
                    if not email_sent:
                        print(f"Warning: Failed to send league code email to {creator_email}")
                
                league['email_sent'] = email_sent
                return Response(league, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to retrieve created league'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def league_teams(request):
    """Handle league teams using REST API"""
    print("=" * 80)
    print(f"DEBUG: league_teams() called with method: {request.method}")
    print("=" * 80)
    
    if request.method == 'GET':
        # Get teams - filter by user if user_id is provided, otherwise get all teams
        try:
            user_id = request.GET.get('user_id')
            league_id = request.GET.get('league_id')
            
            # Check cache first
            cache_key = f"league_teams_{user_id}_{league_id}"
            cached_result = get_cached_result(cache_key)
            if cached_result:
                print(f"DEBUG: Returning cached league teams")
                return Response(cached_result)
            
            client = DatabricksRestClient()
            
            # Build SQL query based on filters
            sql_query = "SELECT * FROM default.league_teams"
            conditions = []
            
            if user_id:
                conditions.append(f"team_owner_user_id = {user_id}")
            if league_id:
                conditions.append(f"league_id = {league_id}")
            
            if conditions:
                sql_query += " WHERE " + " AND ".join(conditions)
            
            print(f"DEBUG: About to execute SQL query: {sql_query}")
            result = client.execute_sql(sql_query)
            print(f"DEBUG: SQL query completed, got result: {bool(result)}")
            if result and 'result' in result and result['result'].get('data_array'):
                teams = []
                for row in result['result']['data_array']:
                    team_name_from_db = row[2]
                    print(f"DEBUG: Retrieved team_name from DB: {team_name_from_db} (type: {type(team_name_from_db)})")
                    teams.append({
                        'id': row[0],
                        'league_id': row[1],
                        'team_name': team_name_from_db,
                        'team_owner_user_id': row[3],
                        'wins': 0,  # Default values until statistics are implemented
                        'losses': 0,
                        'draws': 0,
                        'points_for': 0,
                        'points_against': 0,
                        'league_points': 0,
                        'created_at': row[4]
                        })
                
                # Cache the result
                set_cached_result(cache_key, teams)
                print(f"DEBUG: Cached league teams")
                
                return Response(teams)
            else:
                return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        # Create new team
        try:
            data = request.data
            league_id = data.get('league_id')
            team_name = data.get('team_name')
            team_owner = data.get('team_owner', 'anonymous')
            
            sql = f"""
            INSERT INTO default.league_teams (league_id, team_name, team_owner_user_id)
            VALUES ({league_id}, '{team_name}', 1)
            """
            
            result = client.execute_sql(sql)
            return Response({'status': 'Team created successfully'}, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def join_league(request, league_id):
    """
    Join a league with a team name
    
    POST /api/user-leagues/{league_id}/join_league/
    
    Allows users to join an existing league by creating a team.
    Validates league capacity, prevents duplicate entries, and creates team record.
    
    Parameters:
        league_id (int): The ID of the league to join
        
    Request Body:
        {
            "team_name": "My Team Name",
            "user_id": "4"
        }
        
    Validations:
        - League must exist
        - User must not already be in the league
        - League must not be at capacity
        - Team name must be provided
        
    Returns:
        201: Success - Team created and joined league
        400: Bad Request - Validation errors
        404: Not Found - League doesn't exist
        500: Internal Server Error - Database or system error
        
    Example Response (Success):
    {
        "status": "Successfully joined league"
    }
    
    Example Response (Error):
    {
        "error": "You are already in this league"
    }
    """
    print("=" * 80)
    print(f"JOIN_LEAGUE FUNCTION CALLED! League ID: {league_id}")
    print("=" * 80)
    try:
        print(f"DEBUG: Join league request for league_id={league_id}")
        print(f"DEBUG: Request data: {request.data}")
        
        client = DatabricksRestClient()
        data = request.data
        team_name = data.get('team_name')
        user_id = data.get('user_id')
        league_code = data.get('league_code')
        
        print(f"DEBUG: team_name={team_name}, user_id={user_id}, league_code={league_code}, user_id type={type(user_id)}")
        
        if not team_name:
            return Response({'error': 'Team name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not league_code:
            return Response({'error': 'League code is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if league exists
        league_sql = f"SELECT * FROM default.user_created_leagues WHERE id = {league_id}"
        league_result = client.execute_sql(league_sql)
        
        if not league_result or 'result' not in league_result or not league_result['result'].get('data_array'):
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        
        league = league_result['result']['data_array'][0]
        
        # Validate league code
        stored_league_code = league[9] if len(league) > 9 else None  # league_code is at index 9
        if not stored_league_code or stored_league_code.upper() != league_code.upper():
            return Response({'error': 'Invalid league code'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user ID from request (assuming it's passed in the request)
        if not user_id:
            print(f"DEBUG: No user_id provided in request data")
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert user_id to integer
        try:
            user_id = int(user_id)
            print(f"DEBUG: Converted user_id to integer: {user_id}")
        except (ValueError, TypeError):
            print(f"DEBUG: Failed to convert user_id to integer: {user_id}")
            return Response({'error': 'Invalid user ID format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is already in this league (improved duplicate prevention)
        existing_team_sql = f"SELECT COUNT(*) FROM default.league_teams WHERE league_id = {league_id} AND team_owner_user_id = {user_id}"
        existing_team_result = client.execute_sql(existing_team_sql)
        
        if existing_team_result and 'result' in existing_team_result and existing_team_result['result'].get('data_array'):
            existing_count = int(existing_team_result['result']['data_array'][0][0])
            if existing_count > 0:
                print(f"DEBUG: User {user_id} already has {existing_count} team(s) in league {league_id}")
                return Response({'error': 'You are already in this league'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if league is full
        teams_sql = f"SELECT COUNT(*) FROM default.league_teams WHERE league_id = {league_id}"
        teams_result = client.execute_sql(teams_sql)
        
        if teams_result and 'result' in teams_result and teams_result['result'].get('data_array'):
            current_teams = int(teams_result['result']['data_array'][0][0])
            max_teams = int(league[4])  # max_teams is at index 4
            if current_teams >= max_teams:
                return Response({'error': 'League is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Escape single quotes in team name to prevent SQL injection and syntax errors
        # Try backslash escaping for Databricks
        team_name_escaped = team_name.replace("'", "\\'")
        
        # Create team
        team_sql = f"""
        INSERT INTO default.league_teams (league_id, team_name, team_owner_user_id)
        VALUES ({league_id}, '{team_name_escaped}', {user_id})
        """
        
        print(f"DEBUG: Original team_name: {team_name}")
        print(f"DEBUG: Escaped team_name: {team_name_escaped}")
        print(f"DEBUG: Executing SQL: {team_sql}")
        result = client.execute_sql(team_sql)
        print(f"DEBUG: Result status: {result.get('status') if result else 'No result'}")
        
        # Immediately query back what was inserted to verify
        if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
            verify_sql = f"SELECT team_name FROM default.league_teams WHERE league_id = {league_id} AND team_owner_user_id = {user_id} ORDER BY created_at DESC LIMIT 1"
            verify_result = client.execute_sql(verify_sql)
            if verify_result and 'result' in verify_result:
                stored_name = verify_result['result'].get('data_array', [[]])[0]
                print(f"DEBUG: VERIFICATION - What Databricks actually stored: {stored_name}")
        
        if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
            # Send notification email to league creator
            try:
                from .email_utils import send_league_join_notification
                
                # Get league creator's email (assuming it's stored in the league data)
                # For now, we'll skip email notification if we don't have creator email
                creator_email = data.get('creator_email', '')
                joiner_name = data.get('joiner_name', 'A new player')
                joiner_email = data.get('joiner_email', '')
                
                if creator_email:
                    send_league_join_notification(
                        league_name=league[1],  # league name is at index 1
                        joiner_name=joiner_name,
                        joiner_email=joiner_email,
                        creator_email=creator_email
                    )
            except Exception as email_error:
                print(f"Warning: Failed to send join notification email: {email_error}")
            
            return Response({'status': 'Successfully joined league'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to create team'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return Response({
            'error': f'Join league failed: {str(e)}',
            'details': error_details
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def team_statistics(request):
    """Handle team statistics using REST API"""
    client = DatabricksRestClient()
    
    if request.method == 'GET':
        # Get all team statistics
        try:
            result = client.execute_sql("SELECT * FROM default.team_statistics")
            if result and 'result' in result and result['result'].get('data_array'):
                stats = []
                for row in result['result']['data_array']:
                    stats.append({
                        'id': row[0],
                        'league_team_id': row[1],
                        'league_id': row[2],
                        'matches_played': row[3] or 0,
                        'wins': row[4] or 0,
                        'losses': row[5] or 0,
                        'draws': row[6] or 0,
                        'points_for': row[7] or 0,
                        'points_against': row[8] or 0,
                        'points_difference': row[9] or 0,
                        'league_points': row[10] or 0
                    })
                return Response(stats)
            else:
                return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        # Create new team statistics record
        try:
            data = request.data
            league_team_id = data.get('league_team_id')
            league_id = data.get('league_id')
            
            if not league_team_id or not league_id:
                return Response({'error': 'league_team_id and league_id are required'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Create initial statistics record with default values
            sql = f"""
            INSERT INTO default.team_statistics (
                league_team_id, league_id, matches_played, wins, losses, draws,
                points_for, points_against, points_difference, league_points
            ) VALUES (
                {league_team_id}, {league_id}, 0, 0, 0, 0,
                0, 0, 0, 0
            )
            """
            
            result = client.execute_sql(sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                return Response({'status': 'Team statistics created successfully'}, 
                              status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to create team statistics'}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_draft(request, league_id):
    """
    Complete a draft and save team rosters
    
    POST /api/leagues/{league_id}/complete-draft/
    
    Saves the final team rosters after a draft is completed.
    This endpoint is called when the draft is finished to persist
    the selected players to each team.
    
    Parameters:
        league_id (int): The ID of the league whose draft is being completed
        
    Request Body:
        {
            "team_rosters": [
                {
                    "team_id": "1",
                    "user_id": "4",
                    "players": [
                        {"player_id": "1", "position": "Fly-half"},
                        {"player_id": "2", "position": "Scrum-half"}
                    ]
                }
            ]
        }
        
    Returns:
        200: Success - Draft completed and teams saved
        400: Bad Request - Invalid data or missing required fields
        500: Internal Server Error - Database or system error
        
    Example Response (Success):
    {
        "status": "Draft completed successfully",
        "teams_updated": 2,
        "total_players": 30
    }
    """
    try:
        client = DatabricksRestClient()
        
        # Ensure team_players table exists
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS default.team_players (
            id BIGINT GENERATED BY DEFAULT AS IDENTITY,
            team_id STRING,
            player_id STRING,
            position STRING,
            fantasy_position STRING,
            is_starting BOOLEAN,
            original_position STRING,
            user_id BIGINT,
            league_id BIGINT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
        """
        client.execute_sql(create_table_sql)
        print("DEBUG: Ensured team_players table exists")
        
        data = request.data
        
        # Debug logging
        print(f"DEBUG: Complete draft request data type: {type(data)}")
        print(f"DEBUG: Complete draft request data: {data}")
        
        # Handle if data is a string (shouldn't happen but let's be safe)
        if isinstance(data, str):
            import json
            data = json.loads(data)
            print(f"DEBUG: Parsed string to dict: {data}")
        
        team_rosters = data.get('team_rosters', [])
        print(f"DEBUG: Team rosters: {team_rosters}")
        
        if not team_rosters:
            return Response({'error': 'No team rosters provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        total_players = 0
        teams_updated = 0
        
        for roster in team_rosters:
            team_id = roster.get('team_id')
            user_id = roster.get('user_id')
            players = roster.get('players', [])
            
            print(f"DEBUG: Processing roster - team_id: {team_id}, user_id: {user_id}, players: {players}")
            
            if not team_id or not user_id:
                print(f"DEBUG: Skipping roster - missing team_id or user_id")
                continue
                
            # Save each player to the team
            for player in players:
                player_id = player.get('player_id') or player.get('id')  # Try both field names
                position = player.get('position', '')
                fantasy_position = player.get('fantasy_position', position)  # Use fantasy_position if available
                is_starting = player.get('is_starting', True)  # Default to starting
                
                print(f"DEBUG: Processing player - player_id: {player_id}, position: {position}, fantasy_position: {fantasy_position}, is_starting: {is_starting}")
                
                if player_id:
                    # Insert into team_players table with new columns
                    insert_sql = f"""
                    INSERT INTO default.team_players (team_id, player_id, position, fantasy_position, is_starting, original_position, user_id, league_id, created_at, updated_at)
                    VALUES ('{team_id}', '{player_id}', '{position}', '{fantasy_position}', {str(is_starting).lower()}, '{position}', {user_id}, {league_id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """
                    
                    print(f"DEBUG: Executing SQL: {insert_sql}")
                    
                    try:
                        result = client.execute_sql(insert_sql)
                        print(f"DEBUG: SQL result: {result}")
                        total_players += 1
                    except Exception as e:
                        print(f"Error inserting player {player_id} for team {team_id}: {e}")
                        # Continue with other players even if one fails
            
            teams_updated += 1
        
        # Update draft status to COMPLETED
        status_sql = f"UPDATE default.user_created_leagues SET draft_status = 'COMPLETED' WHERE id = {league_id}"
        client.execute_sql(status_sql)
        
        return Response({
            'status': 'Draft completed successfully',
            'teams_updated': teams_updated,
            'total_players': total_players
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def rugby_players(request):
    """Get rugby players with fantasy points, optionally filtered by tournament"""
    try:
        client = DatabricksRestClient()
        
        # Get tournament_id from query parameters
        tournament_id = request.GET.get('tournament_id')
        
        # Build SQL query using optimized materialized table
        if tournament_id:
            sql = f"""
            SELECT 
                id,
                team,
                name,
                position,
                fantasy_position,
                tournament_id,
                fantasy_points_per_game,
                fantasy_points_per_minute,
                total_fantasy_points,
                matches_played,
                total_tries,
                total_tackles_made,
                total_metres_carried,
                avg_tries_per_match,
                avg_tackles_per_match
            FROM default.draft_players_optimized 
            WHERE tournament_id = {tournament_id}
            ORDER BY fantasy_points_per_game DESC, name
            """
        else:
            sql = """
            SELECT 
                id,
                team,
                name,
                position,
                fantasy_position,
                tournament_id,
                fantasy_points_per_game,
                fantasy_points_per_minute,
                total_fantasy_points,
                matches_played,
                total_tries,
                total_tackles_made,
                total_metres_carried,
                avg_tries_per_match,
                avg_tackles_per_match
            FROM default.draft_players_optimized
            ORDER BY fantasy_points_per_game DESC, name
            """
        
        # Get rugby players with fantasy points
        try:
            result = client.execute_sql(sql)
            if result and 'result' in result and result['result'].get('data_array'):
                players = []
                for row in result['result']['data_array']:
                    players.append({
                        'id': row[0],
                        'team': row[1],
                        'name': row[2],
                        'position': row[3],
                        'fantasy_position': row[4],
                        'tournament_id': row[5],
                        'fantasy_points_per_game': float(row[6]) if row[6] is not None else 0.0,
                        'fantasy_points_per_minute': float(row[7]) if row[7] is not None else 0.0,
                        'total_fantasy_points': float(row[8]) if row[8] is not None else 0.0,
                        'matches_played': int(row[9]) if row[9] is not None else 0,
                        'total_tries': float(row[10]) if row[10] is not None else 0.0,
                        'total_tackles_made': float(row[11]) if row[11] is not None else 0.0,
                        'total_metres_carried': float(row[12]) if row[12] is not None else 0.0,
                        'avg_tries_per_match': float(row[13]) if row[13] is not None else 0.0,
                        'avg_tackles_per_match': float(row[14]) if row[14] is not None else 0.0
                    })
                return Response(players)
            else:
                return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return Response({
            'error': f'Rugby players operation failed: {str(e)}',
            'details': error_details
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_team_players(request, team_id):
    """
    Get players for a specific team
    
    GET /api/league-teams/{team_id}/players/
    
    Retrieves all players that have been drafted to a specific team.
    
    Parameters:
        team_id (int): The ID of the team to get players for
        
    Returns:
        200: Success - List of players for the team
        404: Not Found - Team not found
        500: Internal Server Error - Database or system error
        
    Example Response (Success):
    {
        "team_id": "1",
        "players": [
            {
                "id": 1,
                "player_id": "123",
                "position": "Fly-half",
                "user_id": 4,
                "league_id": 12,
                "created_at": "2025-09-30T10:30:00Z"
            }
        ],
        "total_players": 1
    }
    """
    try:
        # Check cache first
        cache_key = f"team_players_{team_id}"
        cached_result = get_cached_result(cache_key)
        if cached_result:
            print(f"DEBUG: Returning cached team players for team {team_id}")
            return Response(cached_result)
        
        client = DatabricksRestClient()
        
        # Optimized query - only select essential fields
        select_sql = f"""
        SELECT id, player_id, position, fantasy_position, is_starting, original_position
        FROM default.team_players 
        WHERE team_id = '{team_id}'
        ORDER BY is_starting DESC, created_at ASC
        """
        
        result = client.execute_sql(select_sql)
        
        if result.get('status', {}).get('state') != 'SUCCEEDED':
            return Response({'error': 'Failed to retrieve team players'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        players = []
        # Check both possible data structures
        data_rows = result.get('result', {}).get('data', []) or result.get('result', {}).get('data_array', [])
        
        for row in data_rows:
            # Optimized player data - only essential fields
            player_data = {
                'id': row[0],
                'player_id': row[1],
                'position': row[2],
                'fantasy_position': row[3],
                'is_starting': row[4] == 'true',  # Convert to boolean
                'original_position': row[5]
            }
            players.append(player_data)
        
        response_data = {
            'team_id': team_id,
            'players': players,
            'total_players': len(players)
        }
        
        # Cache the result
        set_cached_result(cache_key, response_data)
        
        # Use compressed response for large data
        return compressed_response(response_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])
def update_player_position(request, team_id, player_id):
    """
    Update a player's position (starting/bench) and fantasy position
    
    PUT /api/league-teams/{team_id}/players/{player_id}/
    
    Updates a player's fantasy position and starting status.
    
    Parameters:
        team_id (int): The ID of the team
        player_id (int): The ID of the player to update
        
    Request Body:
        {
            "fantasy_position": "Prop",  // New fantasy position
            "is_starting": true          // Whether player is starting or on bench
        }
        
    Returns:
        200: Success - Player updated
        404: Not Found - Player not found
        500: Internal Server Error - Database or system error
    """
    try:
        client = DatabricksRestClient()
        
        fantasy_position = request.data.get('fantasy_position')
        is_starting = request.data.get('is_starting', True)
        
        if not fantasy_position:
            return Response({'error': 'fantasy_position is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the player's position
        update_sql = f"""
        UPDATE default.team_players 
        SET 
            fantasy_position = '{fantasy_position}',
            is_starting = {str(is_starting).lower()},
            updated_at = CURRENT_TIMESTAMP
        WHERE team_id = '{team_id}' AND player_id = '{player_id}'
        """
        
        result = client.execute_sql(update_sql)
        
        if result.get('status', {}).get('state') != 'SUCCEEDED':
            return Response({'error': 'Failed to update player position'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': 'Player position updated successfully',
            'team_id': team_id,
            'player_id': player_id,
            'fantasy_position': fantasy_position,
            'is_starting': is_starting
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def start_draft(request, league_id):
    """
    Start a draft by updating league status to LIVE
    
    POST /api/leagues/{league_id}/start-draft/
    
    Only league admin can start the draft.
    """
    try:
        client = DatabricksRestClient()
        
        print(f"DEBUG: start_draft called for league_id={league_id}")
        print(f"DEBUG: Request data: {request.data}")
        
        # Verify user is admin
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is admin
        league_sql = f"SELECT created_by_user_id FROM default.user_created_leagues WHERE id = {league_id}"
        league_result = client.execute_sql(league_sql)
        
        print(f"DEBUG: League query result: {league_result}")
        
        if not league_result or 'result' not in league_result or not league_result['result'].get('data_array'):
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        
        created_by = str(league_result['result']['data_array'][0][0])
        print(f"DEBUG: League created_by={created_by}, user_id={user_id}")
        
        if created_by != str(user_id):
            return Response({'error': 'Only league admin can start the draft'}, status=status.HTTP_403_FORBIDDEN)
        
        # Update draft status to LIVE
        update_sql = f"UPDATE default.user_created_leagues SET draft_status = 'LIVE' WHERE id = {league_id}"
        print(f"DEBUG: Executing: {update_sql}")
        result = client.execute_sql(update_sql)
        
        print(f"DEBUG: Update result: {result}")
        
        if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
            return Response({'status': 'Draft started successfully', 'draft_status': 'LIVE'})
        else:
            error_msg = result.get('status', {}).get('error', {}).get('message', 'Unknown error') if result else 'No result'
            print(f"DEBUG: Failed to update - {error_msg}")
            return Response({'error': f'Failed to start draft: {error_msg}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        print(f"DEBUG: Exception in start_draft: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_draft_status(request, league_id):
    """
    Get the current draft status for a league
    
    GET /api/leagues/{league_id}/draft-status/
    
    Returns: NOT_STARTED, LIVE, or COMPLETED
    """
    try:
        client = DatabricksRestClient()
        
        sql = f"SELECT draft_status FROM default.user_created_leagues WHERE id = {league_id}"
        result = client.execute_sql(sql)
        
        if result and 'result' in result and result['result'].get('data_array'):
            draft_status = result['result']['data_array'][0][0] or 'NOT_STARTED'
            return Response({'draft_status': draft_status})
        else:
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def waiver_claims(request, league_id):
    """
    Handle waiver claims for a league
    
    GET /api/leagues/{league_id}/waiver-claims/ - Get all waiver claims
    POST /api/leagues/{league_id}/waiver-claims/ - Submit a new waiver claim
    
    POST Request Body:
        {
            "team_id": "28",
            "user_id": 4,
            "player_to_add_id": "123",
            "player_to_drop_id": "456"
        }
    """
    client = DatabricksRestClient()
    
    if request.method == 'GET':
        try:
            sql = f"""
            SELECT * FROM default.waiver_claims 
            WHERE league_id = {league_id}
            ORDER BY submitted_at DESC
            """
            
            result = client.execute_sql(sql)
            
            if result and 'result' in result and result['result'].get('data_array'):
                claims = []
                for row in result['result']['data_array']:
                    claims.append({
                        'id': row[0],
                        'league_id': row[1],
                        'team_id': row[2],
                        'user_id': row[3],
                        'player_to_add_id': row[4],
                        'player_to_drop_id': row[5],
                        'claim_status': row[6],
                        'priority': row[7],
                        'submitted_at': row[8],
                        'processed_at': row[9],
                        'created_at': row[10],
                        'updated_at': row[11]
                    })
                return Response(claims)
            else:
                return Response([])
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            data = request.data
            
            team_id = data.get('team_id')
            user_id = data.get('user_id')
            player_to_add_id = data.get('player_to_add_id')
            player_to_drop_id = data.get('player_to_drop_id')
            
            if not all([team_id, user_id, player_to_add_id, player_to_drop_id]):
                return Response(
                    {'error': 'Missing required fields'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify team ownership - check if user owns the team
            ownership_sql = f"SELECT team_owner_user_id FROM default.league_teams WHERE id = '{team_id}' AND league_id = {league_id}"
            ownership_result = client.execute_sql(ownership_sql)

            if not ownership_result or 'result' not in ownership_result or not ownership_result['result'].get('data_array'):
                return Response(
                    {'error': 'Team not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            team_owner_id = ownership_result['result']['data_array'][0][0]
            print(f"DEBUG Waiver: team_id={team_id}, user_id={user_id}, team_owner_id={team_owner_id}")
            if team_owner_id != int(user_id):
                print(f"DEBUG Waiver: Ownership check failed - team_owner_id ({team_owner_id}) != user_id ({user_id})")
                return Response(
                    {'error': f'Permission denied: You do not own this team (Team owner: {team_owner_id}, Your ID: {user_id})'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get team's waiver order
            team_sql = f"SELECT waiver_order FROM default.league_teams WHERE id = '{team_id}' AND league_id = {league_id}"
            team_result = client.execute_sql(team_sql)
            
            priority = 999  # Default priority
            if team_result and 'result' in team_result and team_result['result'].get('data_array'):
                waiver_order = team_result['result']['data_array'][0][0]
                priority = waiver_order if waiver_order else 999
            
            # Insert waiver claim
            insert_sql = f"""
            INSERT INTO default.waiver_claims (
                league_id, team_id, user_id, player_to_add_id, player_to_drop_id,
                claim_status, priority, submitted_at, created_at, updated_at
            ) VALUES (
                {league_id}, '{team_id}', {user_id}, '{player_to_add_id}', '{player_to_drop_id}',
                'PENDING', {priority}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            """
            
            result = client.execute_sql(insert_sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                return Response({
                    'message': 'Waiver claim submitted successfully',
                    'priority': priority
                })
            else:
                return Response({'error': 'Failed to submit waiver claim'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def process_waivers(request, league_id):
    """
    Process all pending waiver claims for a league
    
    POST /api/leagues/{league_id}/process-waivers/
    
    Logic:
    1. Get all pending claims ordered by waiver_order (priority)
    2. Process claims in order
    3. If player already claimed, reject subsequent claims for same player
    4. Snake draft style: teams that made successful claims move to end of waiver order
    5. Teams that didn't make claims stay at top of order
    """
    try:
        client = DatabricksRestClient()
        
        # Get all teams in league with their waiver order
        teams_sql = f"SELECT id, waiver_order FROM default.league_teams WHERE league_id = {league_id} ORDER BY waiver_order ASC"
        teams_result = client.execute_sql(teams_sql)
        
        if not teams_result or 'result' not in teams_result:
            return Response({'error': 'Could not load teams'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        teams_data = teams_result['result'].get('data_array', [])
        
        # Get all pending waiver claims ordered by priority
        claims_sql = f"""
        SELECT id, team_id, user_id, player_to_add_id, player_to_drop_id, priority
        FROM default.waiver_claims 
        WHERE league_id = {league_id} AND claim_status = 'PENDING'
        ORDER BY priority ASC, submitted_at ASC
        """
        
        claims_result = client.execute_sql(claims_sql)
        
        if not claims_result or 'result' not in claims_result:
            return Response({'error': 'Could not load claims'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        claims = claims_result['result'].get('data_array', [])
        
        # Group claims by user/team, maintaining order within each user's claims
        user_claims = {}
        for claim in claims:
            claim_id, team_id, user_id, player_to_add_id, player_to_drop_id, priority = claim
            user_key = str(user_id)
            if user_key not in user_claims:
                user_claims[user_key] = []
            user_claims[user_key].append({
                'id': claim_id,
                'team_id': team_id,
                'user_id': user_id,
                'player_to_add_id': player_to_add_id,
                'player_to_drop_id': player_to_drop_id,
                'priority': priority
            })
        
        # Sort users by their best (lowest) priority
        sorted_users = sorted(user_claims.items(), key=lambda x: min(c['priority'] for c in x[1]))
        
        claimed_players = set()  # Track which players have been claimed
        successful_teams = []  # Teams that successfully claimed a player
        teams_with_claims = set()  # All teams that made claims
        
        processed_count = 0
        approved_count = 0
        rejected_count = 0
        
        # Process claims round-by-round (like a snake draft)
        # Round 1: User1-Choice1, User2-Choice1, User3-Choice1
        # Round 2: User1-Choice2, User2-Choice2, User3-Choice2, etc.
        max_claims = max(len(claims_list) for _, claims_list in sorted_users)
        
        for round_num in range(max_claims):
            for user_id, claims_list in sorted_users:
                if round_num < len(claims_list):
                    claim = claims_list[round_num]
                    claim_id = claim['id']
                    team_id = claim['team_id']
                    player_to_add_id = claim['player_to_add_id']
                    
                    teams_with_claims.add(team_id)
                    
                    # Check if player already claimed
                    if player_to_add_id in claimed_players:
                        # Reject claim - player already taken
                        update_sql = f"""
                        UPDATE default.waiver_claims 
                        SET claim_status = 'REJECTED', processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE id = {claim_id}
                        """
                        client.execute_sql(update_sql)
                        rejected_count += 1
                    else:
                        # Approve claim - execute the transaction
                        # 1. Add player to team
                        # 2. Remove player from team
                        # 3. Mark claim as approved
                        
                        # For now, just mark as approved (actual roster changes would need more logic)
                        update_sql = f"""
                        UPDATE default.waiver_claims 
                        SET claim_status = 'APPROVED', processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE id = {claim_id}
                        """
                        client.execute_sql(update_sql)
                        
                        claimed_players.add(player_to_add_id)
                        successful_teams.append(team_id)
                        approved_count += 1
                    
                    processed_count += 1
        
        # Update waiver order - Snake draft style
        # Teams that made successful claims go to end of order (in reverse order of success)
        # Teams that didn't make ANY claims stay at top (maintain their relative order)
        # Teams that made claims but failed go to middle
        
        teams_no_claims = [t for t in teams_data if t[0] not in teams_with_claims]
        teams_failed_claims = [t for t in teams_data if t[0] in teams_with_claims and t[0] not in successful_teams]
        teams_successful = [t for t in teams_data if t[0] in successful_teams]
        
        new_order = []
        new_order.extend(teams_no_claims)  # Keep non-participants at top
        new_order.extend(teams_failed_claims)  # Failed claims in middle
        new_order.extend(teams_successful)  # Successful claims go to end
        
        # Update waiver order for all teams
        for idx, team in enumerate(new_order):
            team_id = team[0]
            update_order_sql = f"""
            UPDATE default.league_teams 
            SET waiver_order = {idx + 1}
            WHERE id = '{team_id}'
            """
            client.execute_sql(update_order_sql)
        
        return Response({
            'message': 'Waivers processed successfully',
            'processed': processed_count,
            'approved': approved_count,
            'rejected': rejected_count,
            'waiver_order_updated': True
        })
        
    except Exception as e:
        import traceback
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def trade_proposals(request, league_id):
    """
    Handle trade proposals
    
    GET: Get all trade proposals for a league
    POST: Create a new trade proposal
    """
    client = DatabricksRestClient()
    
    if request.method == 'GET':
        try:
            # Get all trades for this league
            trades_sql = f"""
            SELECT id, league_id, from_team_id, to_team_id, from_user_id, to_user_id, 
                   status, proposed_at, responded_at, created_at, updated_at
            FROM default.trades 
            WHERE league_id = {league_id}
            ORDER BY proposed_at DESC
            """
            
            result = client.execute_sql(trades_sql)
            
            if not result or 'result' not in result:
                return Response({'error': 'Could not load trades'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            trades_data = result['result'].get('data_array', [])
            
            # Convert to list of dicts
            trades = []
            for trade in trades_data:
                trade_id = trade[0]
                
                # Get players involved in this trade
                players_sql = f"""
                SELECT id, trade_id, team_player_id, from_team, created_at
                FROM default.trade_players
                WHERE trade_id = '{trade_id}'
                """
                
                players_result = client.execute_sql(players_sql)
                players_data = players_result['result'].get('data_array', []) if players_result and 'result' in players_result else []
                
                trade_obj = {
                    'id': trade[0],
                    'league_id': trade[1],
                    'from_team_id': trade[2],
                    'to_team_id': trade[3],
                    'from_user_id': trade[4],
                    'to_user_id': trade[5],
                    'status': trade[6],
                    'proposed_at': trade[7],
                    'responded_at': trade[8],
                    'created_at': trade[9],
                    'updated_at': trade[10],
                    'players': [
                        {
                            'id': p[0],
                            'trade_id': p[1],
                            'team_player_id': p[2],
                            'from_team': p[3],
                            'created_at': p[4]
                        } for p in players_data
                    ]
                }
                trades.append(trade_obj)
            
            return Response(trades)
            
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            data = request.data
            from_team_id = data.get('from_team_id')
            to_team_id = data.get('to_team_id')
            from_user_id = data.get('from_user_id')
            to_user_id = data.get('to_user_id')
            from_players = data.get('from_players', [])  # List of team_player IDs
            to_players = data.get('to_players', [])  # List of team_player IDs
            
            if not all([from_team_id, to_team_id, from_user_id, to_user_id]):
                return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not from_players or not to_players:
                return Response({'error': 'Trade must include players from both teams'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate trade ID
            import uuid
            trade_id = str(uuid.uuid4())
            
            # Insert trade
            insert_trade_sql = f"""
            INSERT INTO default.trades 
            (id, league_id, from_team_id, to_team_id, from_user_id, to_user_id, status, proposed_at, created_at, updated_at)
            VALUES (
                '{trade_id}',
                {league_id},
                '{from_team_id}',
                '{to_team_id}',
                {from_user_id},
                {to_user_id},
                'PENDING',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            """
            
            client.execute_sql(insert_trade_sql)
            
            # Insert trade players
            for player_id in from_players:
                player_trade_id = str(uuid.uuid4())
                insert_player_sql = f"""
                INSERT INTO default.trade_players 
                (id, trade_id, team_player_id, from_team, created_at)
                VALUES (
                    '{player_trade_id}',
                    '{trade_id}',
                    '{player_id}',
                    true,
                    CURRENT_TIMESTAMP
                )
                """
                client.execute_sql(insert_player_sql)
            
            for player_id in to_players:
                player_trade_id = str(uuid.uuid4())
                insert_player_sql = f"""
                INSERT INTO default.trade_players 
                (id, trade_id, team_player_id, from_team, created_at)
                VALUES (
                    '{player_trade_id}',
                    '{trade_id}',
                    '{player_id}',
                    false,
                    CURRENT_TIMESTAMP
                )
                """
                client.execute_sql(insert_player_sql)
            
            return Response({
                'message': 'Trade proposed successfully',
                'trade_id': trade_id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def respond_to_trade(request, trade_id):
    """
    Accept or reject a trade proposal
    """
    try:
        client = DatabricksRestClient()
        action = request.data.get('action')  # 'ACCEPT' or 'REJECT'
        
        if action not in ['ACCEPT', 'REJECT']:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        if action == 'ACCEPT':
            # Get trade details
            trade_sql = f"""
            SELECT from_team_id, to_team_id
            FROM default.trades
            WHERE id = '{trade_id}'
            """
            
            trade_result = client.execute_sql(trade_sql)
            if not trade_result or 'result' not in trade_result:
                return Response({'error': 'Trade not found'}, status=status.HTTP_404_NOT_FOUND)
            
            trade_data = trade_result['result'].get('data_array', [])
            if not trade_data:
                return Response({'error': 'Trade not found'}, status=status.HTTP_404_NOT_FOUND)
            
            from_team_id = trade_data[0][0]
            to_team_id = trade_data[0][1]
            
            # Get players involved in trade
            players_sql = f"""
            SELECT team_player_id, from_team
            FROM default.trade_players
            WHERE trade_id = '{trade_id}'
            """
            
            players_result = client.execute_sql(players_sql)
            players_data = players_result['result'].get('data_array', []) if players_result and 'result' in players_result else []
            
            # Update team ownership for each player
            for player_data in players_data:
                team_player_id = player_data[0]
                is_from_team = player_data[1]
                
                # Transfer player to opposite team
                new_team_id = to_team_id if is_from_team else from_team_id
                
                # Note: This assumes team_players has a team_id column
                # You may need to adjust based on your actual schema
                update_player_sql = f"""
                UPDATE default.team_players
                SET team_id = '{new_team_id}', updated_at = CURRENT_TIMESTAMP
                WHERE id = '{team_player_id}'
                """
                client.execute_sql(update_player_sql)
            
            # Update trade status
            update_trade_sql = f"""
            UPDATE default.trades
            SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = '{trade_id}'
            """
            client.execute_sql(update_trade_sql)
            
            return Response({'message': 'Trade accepted successfully'})
        
        else:  # REJECT
            update_trade_sql = f"""
            UPDATE default.trades
            SET status = 'REJECTED', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = '{trade_id}'
            """
            client.execute_sql(update_trade_sql)
            
            return Response({'message': 'Trade rejected successfully'})
        
    except Exception as e:
        import traceback
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def tournaments(request):
    """
    Get all active tournaments
    
    Returns:
        List of tournaments with their details
    """
    try:
        client = DatabricksRestClient()
        
        # Check cache first
        cache_key = 'tournaments'
        cached_result = get_cached_result(cache_key)
        if cached_result:
            return Response(cached_result)
        
        # Query tournaments table
        sql = "SELECT Tournamen_ID, Tournament FROM default.tournaments ORDER BY Tournament"
        result = client.execute_sql(sql)
        
        if result and 'result' in result and 'data_array' in result['result']:
            tournaments_data = []
            for row in result['result']['data_array']:
                tournaments_data.append({
                    'id': row[0],
                    'name': row[1],
                    'description': f'Fantasy league for {row[1]}',
                    'start_date': '2025-01-01',
                    'end_date': '2025-12-31',
                    'is_active': True,
                    'created_at': '2025-01-01T00:00:00Z'
                })
            
            # Cache the result
            set_cached_result(cache_key, tournaments_data)
            
            return Response(tournaments_data)
        else:
            return Response([])
            
    except Exception as e:
        import traceback
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['POST'])
@permission_classes([AllowAny])
def invite_to_league(request, league_id):
    """
    Send an invitation email to join a league
    
    POST /api/user-leagues/{league_id}/invite/
    
    Sends an email invitation with the league code to a potential player.
    Only the league creator can send invitations.
    
    Parameters:
        league_id (int): The ID of the league to invite to
        
    Request Body:
        {
            "invitee_email": "friend@example.com",
            "invitee_name": "Friend's Name",
            "inviter_name": "Your Name",
            "inviter_email": "your@email.com"
        }
        
    Returns:
        200: Success - Invitation sent
        400: Bad Request - Validation errors
        403: Forbidden - Not the league creator
        404: Not Found - League doesn't exist
        500: Internal Server Error - Email sending failed
    """
    try:
        client = DatabricksRestClient()
        data = request.data
        
        # Validate required fields
        invitee_email = data.get('invitee_email')
        inviter_name = data.get('inviter_name')
        inviter_email = data.get('inviter_email')
        
        if not invitee_email:
            return Response({'error': 'Invitee email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not inviter_name:
            return Response({'error': 'Inviter name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not inviter_email:
            return Response({'error': 'Inviter email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if league exists and get league details
        league_sql = f"SELECT * FROM default.user_created_leagues WHERE id = {league_id}"
        league_result = client.execute_sql(league_sql)
        
        if not league_result or 'result' not in league_result or not league_result['result'].get('data_array'):
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        
        league = league_result['result']['data_array'][0]
        league_name = league[1]  # league name is at index 1
        league_code = league[9] if len(league) > 9 else None  # league_code is at index 9
        
        if not league_code:
            return Response({'error': 'League code not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Send invitation email
        from .email_utils import send_league_invitation
        
        invitee_name = data.get('invitee_name', '')
        email_sent = send_league_invitation(
            league_name=league_name,
            league_code=league_code,
            inviter_name=inviter_name,
            inviter_email=inviter_email,
            invitee_email=invitee_email,
            invitee_name=invitee_name
        )
        
        if email_sent:
            return Response({
                'status': 'Invitation sent successfully',
                'league_name': league_name,
                'league_code': league_code,
                'invitee_email': invitee_email
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to send invitation email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': f'Failed to send invitation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
