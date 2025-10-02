"""
Draft management views for Fantasy Rugby API

This module handles all draft-related operations including:
- Starting drafts
- Completing drafts
- Draft status tracking
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_draft(request, league_id):
    """
    Complete the draft by saving all team rosters
    """
    try:
        data = request.data
        team_rosters = data.get('team_rosters', [])
        
        if not team_rosters:
            return Response({'error': 'Team rosters are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        client = DatabricksRestClient()
        
        # Clear existing team players for this league
        clear_sql = f"""
        DELETE FROM default.team_players 
        WHERE team_id IN (
            SELECT id FROM default.league_teams WHERE league_id = {league_id}
        )
        """
        clear_result = client.execute_sql(clear_sql)
        
        if not clear_result or 'status' not in clear_result or clear_result['status'].get('state') != 'SUCCEEDED':
            print(f"Warning: Failed to clear existing team players: {clear_result}")
        
        # Insert new team rosters
        for team_roster in team_rosters:
            team_id = team_roster.get('team_id')
            players = team_roster.get('players', [])
            
            if not team_id or not players:
                continue
            
            for player in players:
                player_id = player.get('id')
                position = player.get('position', '')
                fantasy_position = player.get('fantasy_position', '')
                is_starting = player.get('is_starting', False)
                
                if not player_id:
                    continue
                
                insert_sql = f"""
                INSERT INTO default.team_players (team_id, player_id, position, fantasy_position, is_starting)
                VALUES ({team_id}, {player_id}, '{position}', '{fantasy_position}', {str(is_starting).lower()})
                """
                
                result = client.execute_sql(insert_sql)
                if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
                    print(f"Warning: Failed to insert player {player_id} for team {team_id}: {result}")
        
        # Update league draft status to COMPLETED
        update_sql = f"""
        UPDATE default.user_created_leagues 
        SET draft_status = 'COMPLETED' 
        WHERE id = {league_id}
        """
        update_result = client.execute_sql(update_sql)
        
        if not update_result or 'status' not in update_result or update_result['status'].get('state') != 'SUCCEEDED':
            return Response({'error': f'Failed to update draft status: {update_result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'message': 'Draft completed successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"ERROR in complete_draft: {str(e)}")
        import traceback
        error_details = traceback.format_exc()
        return Response({
            'error': str(e),
            'traceback': error_details
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def start_draft(request, league_id):
    """
    Start the draft for a league
    """
    try:
        client = DatabricksRestClient()
        
        # Update league draft status to LIVE
        sql = f"""
        UPDATE default.user_created_leagues 
        SET draft_status = 'LIVE' 
        WHERE id = {league_id}
        """
        result = client.execute_sql(sql)
        
        if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
            return Response({'error': f'Failed to start draft: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'message': 'Draft started successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"ERROR in start_draft: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_draft_status(request, league_id):
    """
    Get the current draft status for a league
    """
    try:
        client = DatabricksRestClient()
        
        # Check cache first
        cache_key = f'draft_status_{league_id}'
        cached_result = get_cached_result(cache_key)
        if cached_result:
            return Response(cached_result)
        
        sql = f"SELECT draft_status FROM default.user_created_leagues WHERE id = {league_id}"
        result = client.execute_sql(sql)
        
        if result and 'result' in result and result['result'].get('data_array'):
            draft_status = result['result']['data_array'][0][0]
            response_data = {'draft_status': draft_status}
            
            # Cache the result
            set_cached_result(cache_key, response_data)
            return Response(response_data)
        else:
            return Response({'draft_status': 'NOT_STARTED'})
            
    except Exception as e:
        print(f"ERROR in get_draft_status: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
