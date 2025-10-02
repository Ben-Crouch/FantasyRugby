"""
Team management views for Fantasy Rugby API

This module handles all team-related operations including:
- Joining leagues
- Team statistics
- Team player management
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result


@api_view(['POST'])
@permission_classes([AllowAny])
def join_league(request, league_id):
    """
    Allow a user to join a league by creating a team
    """
    try:
        data = request.data
        team_name = data.get('team_name')
        user_id = data.get('user_id')
        
        if not team_name or not user_id:
            return Response({'error': 'Team name and user ID are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print("=" * 80)
        print(f"JOIN_LEAGUE FUNCTION CALLED! League ID: {league_id}")
        print("=" * 80)
        
        client = DatabricksRestClient()
        
        print(f"DEBUG: Join league request for league_id={league_id}")
        print(f"DEBUG: Request data: {data}")
        print(f"DEBUG: team_name={team_name}, user_id={user_id}, user_id type={type(user_id)}")
        
        # Convert user_id to integer if it's a string
        try:
            user_id = int(user_id)
            print(f"DEBUG: Converted user_id to integer: {user_id}")
        except (ValueError, TypeError):
            return Response({'error': 'Invalid user ID format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Escape team name to prevent SQL injection
        escaped_team_name = team_name.replace("'", "''")
        print(f"DEBUG: Original team_name: {team_name}")
        print(f"DEBUG: Escaped team_name: {escaped_team_name}")
        
        sql = f"""
        INSERT INTO default.league_teams (league_id, team_name, team_owner_user_id)
        VALUES ({league_id}, '{escaped_team_name}', {user_id})
        """
        
        print(f"DEBUG: Executing SQL: \n{sql}")
        
        result = client.execute_sql(sql)
        print(f"DEBUG: Result status: {result.get('status') if result else 'None'}")
        
        if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
            return Response({'error': f'Failed to join league: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Verify the team was created by querying it back
        verify_sql = f"SELECT team_name FROM default.league_teams WHERE league_id = {league_id} AND team_owner_user_id = {user_id} ORDER BY id DESC LIMIT 1"
        verify_result = client.execute_sql(verify_sql)
        
        if verify_result and 'result' in verify_result and verify_result['result'].get('data_array'):
            stored_team_name = verify_result['result']['data_array'][0][0]
            print(f"DEBUG: VERIFICATION - What Databricks actually stored: {[stored_team_name]}")
        
        return Response({'message': 'Successfully joined league'}, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"ERROR in join_league: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def team_statistics(request):
    """
    Handle team statistics operations
    
    GET: Retrieve team statistics
    POST: Update team statistics
    """
    if request.method == 'GET':
        try:
            team_id = request.GET.get('team_id')
            league_id = request.GET.get('league_id')
            
            if not team_id and not league_id:
                return Response({'error': 'Either team_id or league_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            client = DatabricksRestClient()
            
            if team_id:
                sql = f"SELECT * FROM default.team_statistics WHERE team_id = {team_id}"
            else:
                sql = f"SELECT * FROM default.team_statistics WHERE league_id = {league_id}"
            
            result = client.execute_sql(sql)
            
            if result and 'result' in result and result['result'].get('data_array'):
                stats = []
                for row in result['result']['data_array']:
                    stats.append({
                        'id': row[0],
                        'team_id': row[1],
                        'league_id': row[2],
                        'points': row[3],
                        'wins': row[4],
                        'losses': row[5],
                        'draws': row[6],
                        'goals_for': row[7],
                        'goals_against': row[8],
                        'created_at': row[9],
                        'updated_at': row[10]
                    })
                return Response(stats)
            else:
                return Response([])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            data = request.data
            team_id = data.get('team_id')
            league_id = data.get('league_id')
            points = data.get('points', 0)
            wins = data.get('wins', 0)
            losses = data.get('losses', 0)
            draws = data.get('draws', 0)
            goals_for = data.get('goals_for', 0)
            goals_against = data.get('goals_against', 0)
            
            if not team_id or not league_id:
                return Response({'error': 'Team ID and League ID are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            client = DatabricksRestClient()
            
            # Check if team statistics already exist
            check_sql = f"SELECT id FROM default.team_statistics WHERE team_id = {team_id} AND league_id = {league_id}"
            check_result = client.execute_sql(check_sql)
            
            if check_result and 'result' in check_result and check_result['result'].get('data_array'):
                # Update existing statistics
                sql = f"""
                UPDATE default.team_statistics 
                SET points = {points}, wins = {wins}, losses = {losses}, draws = {draws}, 
                    goals_for = {goals_for}, goals_against = {goals_against}, updated_at = CURRENT_TIMESTAMP
                WHERE team_id = {team_id} AND league_id = {league_id}
                """
            else:
                # Insert new statistics
                sql = f"""
                INSERT INTO default.team_statistics (team_id, league_id, points, wins, losses, draws, goals_for, goals_against, created_at, updated_at)
                VALUES ({team_id}, {league_id}, {points}, {wins}, {losses}, {draws}, {goals_for}, {goals_against}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """
            
            result = client.execute_sql(sql)
            
            if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
                return Response({'error': f'Failed to update team statistics: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({'message': 'Team statistics updated successfully'}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
