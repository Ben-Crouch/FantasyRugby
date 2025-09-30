from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .databricks_rest_client import DatabricksRestClient


@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_team_from_league(request, league_id, team_id):
    """Remove a team from a league (league admin only)"""
    try:
        client = DatabricksRestClient()
        
        # First, verify the user is the league admin
        # Get league info to check created_by
        league_sql = f"SELECT * FROM default.user_created_leagues WHERE id = {league_id}"
        league_result = client.execute_sql(league_sql)
        
        if not league_result or 'result' not in league_result or not league_result['result'].get('data_array'):
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        
        league = league_result['result']['data_array'][0]
        league_admin_id = league[2]  # created_by is at index 2
        
        # TODO: Get current user from JWT token and verify they are the admin
        # For now, we'll allow the operation (you can add JWT verification later)
        
        # Check if team exists in the league
        team_sql = f"SELECT * FROM default.league_teams WHERE id = {team_id} AND league_id = {league_id}"
        team_result = client.execute_sql(team_sql)
        
        if not team_result or 'result' not in team_result or not team_result['result'].get('data_array'):
            return Response({'error': 'Team not found in this league'}, status=status.HTTP_404_NOT_FOUND)
        
        # Delete the team
        delete_sql = f"DELETE FROM default.league_teams WHERE id = {team_id} AND league_id = {league_id}"
        result = client.execute_sql(delete_sql)
        
        if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
            return Response({'status': 'Team removed from league successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Failed to remove team from league'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_league_admin(request, league_id):
    """Get league admin information"""
    try:
        client = DatabricksRestClient()
        
        # Get league info
        league_sql = f"SELECT * FROM default.user_created_leagues WHERE id = {league_id}"
        league_result = client.execute_sql(league_sql)
        
        if not league_result or 'result' not in league_result or not league_result['result'].get('data_array'):
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        
        league = league_result['result']['data_array'][0]
        admin_id = league[3]  # created_by_user_id is at index 3
        
        # Get admin user info
        admin_sql = f"SELECT username, email FROM default.auth_users WHERE id = {admin_id}"
        admin_result = client.execute_sql(admin_sql)
        
        if admin_result and 'result' in admin_result and admin_result['result'].get('data_array'):
            admin_data = admin_result['result']['data_array'][0]
            return Response({
                'admin_id': admin_id,
                'admin_username': admin_data[0],
                'admin_email': admin_data[1]
            })
        else:
            return Response({'error': 'Admin user not found'}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def is_user_league_admin(request, league_id, user_id):
    """Check if a user is the admin of a specific league"""
    try:
        client = DatabricksRestClient()
        
        # Get league info
        league_sql = f"SELECT * FROM default.user_created_leagues WHERE id = {league_id}"
        league_result = client.execute_sql(league_sql)
        
        if not league_result or 'result' not in league_result or not league_result['result'].get('data_array'):
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        
        league = league_result['result']['data_array'][0]
        admin_id = league[3]  # created_by_user_id is at index 3
        
        is_admin = str(admin_id) == str(user_id)
        
        return Response({
            'is_admin': is_admin,
            'league_admin_id': admin_id,
            'user_id': user_id
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

