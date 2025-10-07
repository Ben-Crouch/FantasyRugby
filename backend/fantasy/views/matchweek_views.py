"""
Matchweek management views for Fantasy Rugby API

This module handles all matchweek-related operations including:
- Tournament availability checking
- Fixture generation and management
- Matchup data retrieval
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result
from datetime import datetime
import random

@api_view(['GET'])
@permission_classes([AllowAny])
def tournament_availability(request):
    """
    Check which tournaments are available for new leagues (4+ weeks remaining)
    
    Returns:
        List of available tournaments with weeks remaining
    """
    try:
        client = DatabricksRestClient()
        
        cache_key = 'tournament_availability'
        cached_result = get_cached_result(cache_key)
        if cached_result:
            return Response(cached_result)
        
        # Get current date
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        # Query tournaments with weeks remaining
        sql = f"""
        SELECT 
            t.Tournamen_ID,
            t.Tournament,
            COUNT(tw.`Week Date`) as total_weeks,
            MIN(tw.`Week Date`) as first_week,
            MAX(tw.`Week Date`) as last_week
        FROM default.tournaments t
        LEFT JOIN default.tournament_weeks tw ON t.Tournamen_ID = tw.Tournament_ID
        GROUP BY t.Tournamen_ID, t.Tournament
        ORDER BY t.Tournament
        """
        
        result = client.execute_sql(sql)
        
        if result and 'result' in result and 'data_array' in result['result']:
            available_tournaments = []
            
            for row in result['result']['data_array']:
                tournament_id, name, total_weeks, first_week, last_week = row
                
                # Calculate weeks remaining manually
                try:
                    current_date_obj = datetime.now().date()
                    last_week_date = datetime.strptime(str(last_week), '%Y-%m-%d').date()
                    weeks_remaining = max(0, (last_week_date - current_date_obj).days // 7)
                except:
                    weeks_remaining = 0
                
                # Only include tournaments with 4+ weeks remaining
                if weeks_remaining >= 4:
                    available_tournaments.append({
                        'id': tournament_id,
                        'name': name,
                        'total_weeks': total_weeks,
                        'weeks_remaining': weeks_remaining,
                        'first_week': first_week,
                        'last_week': last_week,
                        'is_available': True
                    })
            
            # Cache for 1 hour
            set_cached_result(cache_key, available_tournaments, 3600)
            
            return Response(available_tournaments)
        else:
            return Response([])
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def league_fixtures(request):
    """
    Get all fixtures for a league
    
    Query parameters:
    - league_id: League ID
    """
    try:
        client = DatabricksRestClient()
        
        league_id = request.GET.get('league_id')
        
        if not league_id:
            return Response({
                'error': 'league_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        sql = f"""
        SELECT 
            id,
            week_number,
            week_date,
            home_team_id,
            away_team_id,
            home_team_name,
            away_team_name,
            home_team_points,
            away_team_points,
            is_playoff
        FROM default.league_fixtures 
        WHERE league_id = {league_id}
        ORDER BY week_number, id
        """
        
        result = client.execute_sql(sql)
        
        if result and 'result' in result and 'data_array' in result['result']:
            fixtures = []
            for row in result['result']['data_array']:
                fixtures.append({
                    'id': row[0],
                    'week_number': row[1],
                    'week_date': row[2],
                    'home_team_id': row[3],
                    'away_team_id': row[4],
                    'home_team_name': row[5],
                    'away_team_name': row[6],
                    'home_team_points': row[7] if row[7] is not None else 0.0,
                    'away_team_points': row[8] if row[8] is not None else 0.0,
                    'is_playoff': row[9]
                })
            
            return Response(fixtures)
        else:
            return Response([])
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def next_matchup(request):
    """
    Get the next upcoming matchup for a user's team
    
    Query parameters:
    - league_id: League ID
    - user_id: User ID
    """
    try:
        client = DatabricksRestClient()
        
        league_id = request.GET.get('league_id')
        user_id = request.GET.get('user_id')
        
        if not league_id or not user_id:
            return Response({
                'error': 'league_id and user_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user's team
        team_sql = f"""
        SELECT id, team_name
        FROM default.league_teams 
        WHERE league_id = {league_id} AND team_owner_user_id = {user_id}
        LIMIT 1
        """
        
        team_result = client.execute_sql(team_sql)
        
        if not team_result or 'result' not in team_result or 'data_array' not in team_result['result']:
            return Response({
                'error': 'User team not found in this league'
            }, status=status.HTTP_404_NOT_FOUND)
        
        team_id, team_name = team_result['result']['data_array'][0]
        
        # Get next upcoming fixture for this team
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        fixture_sql = f"""
        SELECT 
            id,
            week_number,
            week_date,
            home_team_id,
            away_team_id,
            home_team_name,
            away_team_name,
            home_team_points,
            away_team_points,
            is_playoff
        FROM default.league_fixtures 
        WHERE league_id = {league_id} 
        AND week_date >= '{current_date}'
        AND (home_team_id = {team_id} OR away_team_id = {team_id})
        ORDER BY week_date
        LIMIT 1
        """
        
        fixture_result = client.execute_sql(fixture_sql)
        
        if fixture_result and 'result' in fixture_result and 'data_array' in fixture_result['result']:
            row = fixture_result['result']['data_array'][0]
            
            # Determine if user's team is home or away
            is_home = row[3] == team_id
            opponent_team_id = row[4] if is_home else row[3]
            opponent_team_name = row[6] if is_home else row[5]
            
            matchup = {
                'fixture_id': row[0],
                'week_number': row[1],
                'week_date': row[2],
                'user_team': {
                    'id': team_id,
                    'name': team_name,
                    'is_home': is_home,
                    'points': row[7] if is_home else row[8]
                },
                'opponent_team': {
                    'id': opponent_team_id,
                    'name': opponent_team_name,
                    'is_home': not is_home,
                    'points': row[8] if is_home else row[7]
                },
                'is_playoff': row[9]
            }
            
            return Response(matchup)
        else:
            return Response({
                'message': 'No upcoming fixtures found'
            })
            
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_round_robin_fixtures(teams, weeks_available):
    """Generate round-robin fixtures for teams"""
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
