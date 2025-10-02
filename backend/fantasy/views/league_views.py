"""
League management views for Fantasy Rugby API

This module handles all league-related operations including:
- Creating and retrieving leagues
- League team management
- League statistics
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def user_leagues(request):
    """
    Handle user league operations
    
    GET: Retrieve all leagues for a user
    POST: Create a new league
    """
    if request.method == 'GET':
        try:
            client = DatabricksRestClient()
            
            # Check cache first
            cache_key = 'user_leagues'
            cached_result = get_cached_result(cache_key)
            if cached_result:
                return Response(cached_result)
            
            result = client.execute_sql("SELECT * FROM default.user_created_leagues")
            if result and 'result' in result and result['result'].get('data_array'):
                leagues = []
                for row in result['result']['data_array']:
                    leagues.append({
                        'id': row[0],
                        'name': row[1],
                        'description': row[2],
                        'created_by': row[3],
                        'max_teams': row[4],
                        'max_players_per_team': row[5],
                        'is_public': row[6],
                        'tournament_id': row[9],
                        'created_at': row[7],
                        'draft_status': row[8]
                    })
                
                # Cache the result
                set_cached_result(cache_key, leagues)
                return Response(leagues)
            else:
                return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            client = DatabricksRestClient()
            data = request.data
            name = data.get('name')
            description = data.get('description', '')
            max_teams = data.get('max_teams', 6)
            max_players_per_team = 15
            is_public = data.get('is_public', True)
            tournament_id = data.get('tournament_id')
            
            user_id = data.get('user_id')
            if not user_id:
                return Response({'error': 'User ID is required to create a league'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not tournament_id:
                return Response({'error': 'Tournament ID is required to create a league'}, status=status.HTTP_400_BAD_REQUEST)
            
            is_public_sql = 'true' if is_public else 'false'
            
            sql = f"""
            INSERT INTO default.user_created_leagues (name, description, created_by_user_id, max_teams, max_players_per_team, is_public, created_at, draft_status, tournament_id)
            VALUES ('{name}', '{description}', {user_id}, {max_teams}, {max_players_per_team}, {is_public_sql}, CURRENT_TIMESTAMP, 'NOT_STARTED', {tournament_id})
            """
            result = client.execute_sql(sql)
            
            if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
                return Response({'error': f'Failed to create league: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            get_sql = f"SELECT * FROM default.user_created_leagues WHERE name = '{name}' ORDER BY created_at DESC LIMIT 1"
            league_result = client.execute_sql(get_sql)
            
            if league_result and 'result' in league_result and league_result['result'].get('data_array'):
                row = league_result['result']['data_array'][0]
                league = {
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'created_by': row[3],
                    'max_teams': row[4],
                    'max_players_per_team': row[5],
                    'is_public': row[6],
                    'tournament_id': row[9],
                    'created_at': row[7],
                    'draft_status': row[8]
                }
                return Response(league, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to retrieve created league'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def league_teams(request):
    """
    Handle league team operations
    
    GET: Retrieve teams for a specific league
    POST: Create a new team in a league
    """
    if request.method == 'GET':
        try:
            league_id = request.GET.get('league_id')
            user_id = request.GET.get('user_id')
            
            if not league_id and not user_id:
                return Response({'error': 'Either League ID or User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            client = DatabricksRestClient()
            
            # Build SQL query based on parameters
            if league_id:
                sql = f"SELECT * FROM default.league_teams WHERE league_id = {league_id}"
                cache_key = f'league_teams_{league_id}'
            else:  # user_id
                sql = f"SELECT * FROM default.league_teams WHERE team_owner_user_id = {user_id}"
                cache_key = f'user_teams_{user_id}'
            
            # Check cache first
            cached_result = get_cached_result(cache_key)
            if cached_result:
                return Response(cached_result)
            
            print("=" * 80)
            print("DEBUG: league_teams() called with method: GET")
            print("=" * 80)
            
            print(f"DEBUG: About to execute SQL query: {sql}")
            
            result = client.execute_sql(sql)
            print(f"DEBUG: SQL query completed, got result: {result is not None}")
            
            if result and 'result' in result and result['result'].get('data_array'):
                teams = []
                for row in result['result']['data_array']:
                    team_name = row[2]  # team_name is the third column
                    print(f"DEBUG: Retrieved team_name from DB: {team_name} (type: {type(team_name)})")
                    teams.append({
                        'id': row[0],
                        'league_id': row[1],
                        'team_name': team_name,
                        'team_owner_user_id': row[3]
                    })
                
                # Cache the result
                set_cached_result(cache_key, teams)
                print("DEBUG: Cached league teams")
                return Response(teams)
            else:
                return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            data = request.data
            league_id = data.get('league_id')
            team_name = data.get('team_name')
            team_owner_user_id = data.get('team_owner_user_id')
            
            if not all([league_id, team_name, team_owner_user_id]):
                return Response({'error': 'League ID, team name, and team owner user ID are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            client = DatabricksRestClient()
            
            sql = f"""
            INSERT INTO default.league_teams (league_id, team_name, team_owner_user_id)
            VALUES ({league_id}, '{team_name}', {team_owner_user_id})
            """
            result = client.execute_sql(sql)
            
            if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
                return Response({'error': f'Failed to create team: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({'message': 'Team created successfully'}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
