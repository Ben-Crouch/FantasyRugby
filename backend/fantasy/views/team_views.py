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
        
        # Generate/update fixtures for the league after team is added
        try:
            generate_league_fixtures_auto(client, league_id)
            print(f"DEBUG: Fixtures generated/updated for league {league_id}")
        except Exception as fixture_error:
            print(f"WARNING: Failed to generate fixtures: {fixture_error}")
            # Don't fail the join operation if fixture generation fails
        
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


def generate_league_fixtures_auto(client, league_id):
    """
    Automatically generate/update fixtures for a league when teams are added
    """
    try:
        # Get teams in the league
        teams_sql = f"""
        SELECT id, team_name, team_owner_user_id
        FROM default.league_teams 
        WHERE league_id = {league_id}
        ORDER BY id
        """
        
        teams_result = client.execute_sql(teams_sql)
        
        if not teams_result or 'result' not in teams_result or 'data_array' not in teams_result['result']:
            print(f"DEBUG: No teams found for league {league_id}")
            return False
        
        teams = []
        for row in teams_result['result']['data_array']:
            team_id, team_name, user_id = row
            teams.append({
                "id": team_id,
                "name": team_name,
                "user_id": user_id
            })
        
        if len(teams) < 2:
            print(f"DEBUG: Not enough teams ({len(teams)}) to generate fixtures for league {league_id}")
            return False
        
        # Get tournament_id for this league
        league_sql = f"""
        SELECT tournament_id 
        FROM default.user_created_leagues 
        WHERE id = {league_id}
        """
        
        league_result = client.execute_sql(league_sql)
        
        if not league_result or 'result' not in league_result or 'data_array' not in league_result['result']:
            print(f"DEBUG: Could not get tournament_id for league {league_id}")
            return False
        
        tournament_id = league_result['result']['data_array'][0][0]
        
        # Get tournament weeks
        weeks_sql = f"""
        SELECT Week, `Week Date`
        FROM default.tournament_weeks 
        WHERE Tournament_ID = {tournament_id}
        ORDER BY `Week Date`
        """
        
        weeks_result = client.execute_sql(weeks_sql)
        
        if not weeks_result or 'result' not in weeks_result or 'data_array' not in weeks_result['result']:
            print(f"DEBUG: No weeks found for tournament {tournament_id}")
            return False
        
        weeks_data = weeks_result['result']['data_array']
        
        # Generate round-robin fixtures
        fixtures = generate_round_robin_fixtures_auto(teams, len(weeks_data))
        
        if not fixtures:
            print(f"DEBUG: Failed to generate fixtures for league {league_id}")
            return False
        
        # Clear existing fixtures for this league
        clear_sql = f"DELETE FROM default.league_fixtures WHERE league_id = {league_id}"
        client.execute_sql(clear_sql)
        
        # Insert new fixtures
        fixtures_created = 0
        for i, fixture in enumerate(fixtures):
            if i < len(weeks_data):
                week_data = weeks_data[i]
                week_name = week_data[0]
                week_date = week_data[1]
                
                # Determine if this is a playoff week (last 2 weeks)
                is_playoff = i >= len(weeks_data) - 2
                
                insert_sql = f"""
                INSERT INTO default.league_fixtures 
                (league_id, tournament_id, week_number, week_date, home_team_id, away_team_id, 
                 home_team_name, away_team_name, is_playoff)
                VALUES (
                    {league_id},
                    {tournament_id},
                    {fixture['week']},
                    '{week_date}',
                    {fixture['home_team_id']},
                    {fixture['away_team_id']},
                    '{fixture['home_team_name']}',
                    '{fixture['away_team_name']}',
                    {is_playoff}
                )
                """
                
                client.execute_sql(insert_sql)
                fixtures_created += 1
        
        print(f"DEBUG: Generated {fixtures_created} fixtures for league {league_id}")
        return True
        
    except Exception as e:
        print(f"ERROR in generate_league_fixtures_auto: {e}")
        return False


def generate_round_robin_fixtures_auto(teams, weeks_available):
    """Generate round-robin fixtures for teams (auto version)"""
    if len(teams) < 2:
        return []
    
    fixtures = []
    num_teams = len(teams)
    
    # If odd number of teams, add a "bye" team
    if num_teams % 2 == 1:
        teams.append({"id": "BYE", "name": "BYE"})
        num_teams += 1
    
    # Generate round-robin fixtures
    for week in range(num_teams - 1):
        week_fixtures = []
        
        # Rotate teams (except first team)
        if week > 0:
            teams[1:] = teams[2:] + [teams[1]]
        
        # Create matches for this week
        for i in range(num_teams // 2):
            home_team = teams[i]
            away_team = teams[num_teams - 1 - i]
            
            if home_team["id"] != "BYE" and away_team["id"] != "BYE":
                week_fixtures.append({
                    'home_team_id': home_team["id"],
                    'away_team_id': away_team["id"],
                    'home_team_name': home_team["name"],
                    'away_team_name': away_team["name"],
                    'week': week + 1
                })
        
        fixtures.extend(week_fixtures)
    
    return fixtures
