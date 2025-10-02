"""
Player management views for Fantasy Rugby API

This module handles all player-related operations including:
- Retrieving rugby players
- Team player management
- Player position updates
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result, query_cache


@api_view(['GET'])
@permission_classes([AllowAny])
def rugby_players(request):
    """Get rugby players, optionally filtered by tournament"""
    try:
        client = DatabricksRestClient()
        
        # Get tournament_id from query parameters
        tournament_id = request.GET.get('tournament_id')
        
        # Build SQL query
        if tournament_id:
            sql = f"SELECT * FROM default.rugby_players_25_26 WHERE tournament_id = {tournament_id}"
        else:
            sql = "SELECT * FROM default.rugby_players_25_26"
        
        # Get rugby players
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
                        'tournament_id': row[5] if len(row) > 5 else None
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
            'error': str(e),
            'traceback': error_details
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_team_players(request, team_id):
    """
    Get all players for a specific team
    """
    try:
        client = DatabricksRestClient()
        
        # Check cache first
        cache_key = f'team_players_{team_id}'
        cached_result = get_cached_result(cache_key)
        if cached_result:
            print(f"DEBUG: Cached team players for team {team_id}")
            return Response(cached_result)
        
        print(f"DEBUG: get_team_players called with team_id: {team_id}")
        
        # Get team players from the team_players table
        sql = f"""
        SELECT tp.player_id, tp.position, tp.fantasy_position, tp.is_starting, rp.name, rp.team
        FROM default.team_players tp
        LEFT JOIN default.rugby_players_25_26 rp ON tp.player_id = rp.Player_ID
        WHERE tp.team_id = {team_id}
        ORDER BY tp.is_starting DESC, tp.position
        """
        
        result = client.execute_sql(sql)
        
        if result and 'result' in result and result['result'].get('data_array'):
            players = []
            data_rows = result['result']['data_array']
            print(f"DEBUG: get_team_players data_rows: {data_rows}")
            
            for row in data_rows:
                players.append({
                    'id': row[0],
                    'position': row[1],
                    'fantasy_position': row[2],
                    'is_starting': row[3],
                    'name': row[4] if row[4] else 'Unknown Player',
                    'team': row[5] if row[5] else 'Unknown Team'
                })
            
            # Cache the result
            set_cached_result(cache_key, {'players': players})
            print(f"DEBUG: Cached team players for team {team_id}")
            return Response({'players': players})
        else:
            return Response({'players': []})
            
    except Exception as e:
        print(f"ERROR in get_team_players: {str(e)}")
        import traceback
        error_details = traceback.format_exc()
        return Response({
            'error': str(e),
            'traceback': error_details
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])
def update_player_position(request, team_id, player_id):
    """
    Update a player's position (starting/bench) for a specific team
    """
    try:
        data = request.data
        is_starting = data.get('is_starting')
        position = data.get('position')
        
        if is_starting is None:
            return Response({'error': 'is_starting field is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        client = DatabricksRestClient()
        
        # Build the SQL update query
        update_fields = [f"is_starting = {str(is_starting).lower()}"]
        if position:
            update_fields.append(f"position = '{position}'")
        
        sql = f"""
        UPDATE default.team_players 
        SET {', '.join(update_fields)}
        WHERE team_id = {team_id} AND player_id = {player_id}
        """
        
        result = client.execute_sql(sql)
        
        if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
            return Response({'error': f'Failed to update player position: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Clear cache for this team
        cache_key = f'team_players_{team_id}'
        if cache_key in query_cache:
            del query_cache[cache_key]
        
        return Response({'message': 'Player position updated successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"ERROR in update_player_position: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
