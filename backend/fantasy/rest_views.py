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
                        'created_at': row[7],  # created_at is at index 7
                        'draft_status': row[8] if len(row) > 8 else 'NOT_STARTED'  # draft_status is at index 8
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
            
            # Get user ID from request (assuming it's passed in the request)
            user_id = data.get('user_id')
            if not user_id:
                return Response({'error': 'User ID is required to create a league'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Convert boolean to proper SQL format
            is_public_sql = 'true' if is_public else 'false'
            
            sql = f"""
            INSERT INTO default.user_created_leagues (name, description, created_by_user_id, max_teams, max_players_per_team, is_public, draft_status)
            VALUES ('{name}', '{description}', {user_id}, {max_teams}, {max_players_per_team}, {is_public_sql}, 'NOT_STARTED')
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
                    'created_at': row[7]   # created_at is at index 7
                }
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
    
    client = DatabricksRestClient()
    
    if request.method == 'GET':
        # Get all teams
        try:
            print("DEBUG: About to execute SQL query for all teams")
            result = client.execute_sql("SELECT * FROM default.league_teams")
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
        
        print(f"DEBUG: team_name={team_name}, user_id={user_id}, user_id type={type(user_id)}")
        
        if not team_name:
            return Response({'error': 'Team name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if league exists
        league_sql = f"SELECT * FROM default.user_created_leagues WHERE id = {league_id}"
        league_result = client.execute_sql(league_sql)
        
        if not league_result or 'result' not in league_result or not league_result['result'].get('data_array'):
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        
        league = league_result['result']['data_array'][0]
        
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
        
        # Check if user is already in this league
        existing_team_sql = f"SELECT * FROM default.league_teams WHERE league_id = {league_id} AND team_owner_user_id = {user_id}"
        existing_team_result = client.execute_sql(existing_team_sql)
        
        if existing_team_result and 'result' in existing_team_result and existing_team_result['result'].get('data_array'):
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
    """Get all rugby players"""
    try:
        client = DatabricksRestClient()
        
        # Get all rugby players
        try:
            result = client.execute_sql("SELECT * FROM default.rugby_players_25_26")
            if result and 'result' in result and result['result'].get('data_array'):
                players = []
                for row in result['result']['data_array']:
                    players.append({
                        'id': row[0],
                        'team': row[1],
                        'name': row[2],
                        'position': row[3],
                        'fantasy_position': row[4]
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
        client = DatabricksRestClient()
        
        # Get players for the team
        select_sql = f"""
        SELECT id, player_id, position, fantasy_position, is_starting, original_position, user_id, league_id, created_at, updated_at
        FROM default.team_players 
        WHERE team_id = '{team_id}'
        ORDER BY created_at ASC
        """
        
        result = client.execute_sql(select_sql)
        
        print(f"DEBUG: get_team_players SQL result: {result}")
        
        if result.get('status', {}).get('state') != 'SUCCEEDED':
            return Response({'error': 'Failed to retrieve team players'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        players = []
        # Check both possible data structures
        data_rows = result.get('result', {}).get('data', []) or result.get('result', {}).get('data_array', [])
        print(f"DEBUG: get_team_players data_rows: {data_rows}")
        
        for row in data_rows:
            player_data = {
                'id': row[0],
                'player_id': row[1],
                'position': row[2],
                'fantasy_position': row[3],
                'is_starting': row[4],
                'original_position': row[5],
                'user_id': row[6],
                'league_id': row[7],
                'created_at': row[8],
                'updated_at': row[9]
            }
            print(f"DEBUG: get_team_players player: {player_data}")
            players.append(player_data)
        
        return Response({
            'team_id': team_id,
            'players': players,
            'total_players': len(players)
        })
        
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
