"""
Waiver management views for Fantasy Rugby API

This module handles all waiver-related operations including:
- Waiver claims
- Waiver processing
- Waiver order management
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result, query_cache


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def waiver_claims(request, league_id):
    """
    Handle waiver claims for a league
    
    GET: Retrieve all waiver claims for a league
    POST: Create a new waiver claim
    """
    if request.method == 'GET':
        try:
            client = DatabricksRestClient()
            
            # Check cache first
            cache_key = f'waiver_claims_{league_id}'
            cached_result = get_cached_result(cache_key)
            if cached_result:
                return Response(cached_result)
            
            sql = f"""
            SELECT wc.id, wc.league_id, wc.team_id, wc.player_id, wc.players_to_drop, 
                   wc.priority, wc.status, wc.created_at, lt.team_name, rp.name as player_name
            FROM default.waiver_claims wc
            LEFT JOIN default.league_teams lt ON wc.team_id = lt.id
            LEFT JOIN default.rugby_players_25_26 rp ON wc.player_id = rp.Player_ID
            WHERE wc.league_id = {league_id}
            ORDER BY wc.priority ASC, wc.created_at ASC
            """
            
            result = client.execute_sql(sql)
            
            if result and 'result' in result and result['result'].get('data_array'):
                claims = []
                for row in result['result']['data_array']:
                    claims.append({
                        'id': row[0],
                        'league_id': row[1],
                        'team_id': row[2],
                        'player_id': row[3],
                        'players_to_drop': row[4],
                        'priority': row[5],
                        'status': row[6],
                        'created_at': row[7],
                        'team_name': row[8],
                        'player_name': row[9]
                    })
                
                # Cache the result
                set_cached_result(cache_key, claims)
                return Response(claims)
            else:
                return Response([])
                
        except Exception as e:
            print(f"ERROR in waiver_claims GET: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            data = request.data
            team_id = data.get('team_id')
            player_id = data.get('player_id')
            players_to_drop = data.get('players_to_drop', [])
            
            if not team_id or not player_id:
                return Response({'error': 'Team ID and Player ID are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            client = DatabricksRestClient()
            
            # Get the next priority number for this league
            priority_sql = f"""
            SELECT COALESCE(MAX(priority), 0) + 1 
            FROM default.waiver_claims 
            WHERE league_id = {league_id}
            """
            priority_result = client.execute_sql(priority_sql)
            priority = 1
            if priority_result and 'result' in priority_result and priority_result['result'].get('data_array'):
                priority = priority_result['result']['data_array'][0][0]
            
            # Convert players_to_drop to JSON string
            import json
            players_to_drop_json = json.dumps(players_to_drop)
            
            # Insert the waiver claim
            sql = f"""
            INSERT INTO default.waiver_claims (league_id, team_id, player_id, players_to_drop, priority, status, created_at)
            VALUES ({league_id}, {team_id}, {player_id}, '{players_to_drop_json}', {priority}, 'PENDING', CURRENT_TIMESTAMP)
            """
            
            result = client.execute_sql(sql)
            
            if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
                return Response({'error': f'Failed to create waiver claim: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Clear cache
            cache_key = f'waiver_claims_{league_id}'
            if cache_key in query_cache:
                del query_cache[cache_key]
            
            return Response({'message': 'Waiver claim created successfully'}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"ERROR in waiver_claims POST: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def process_waivers(request, league_id):
    """
    Process all pending waiver claims for a league
    """
    try:
        client = DatabricksRestClient()
        
        # Get all pending waiver claims for this league
        get_claims_sql = f"""
        SELECT id, team_id, player_id, players_to_drop, priority
        FROM default.waiver_claims 
        WHERE league_id = {league_id} AND status = 'PENDING'
        ORDER BY priority ASC, created_at ASC
        """
        
        claims_result = client.execute_sql(get_claims_sql)
        
        if not claims_result or 'result' not in claims_result or not claims_result['result'].get('data_array'):
            return Response({'message': 'No pending waiver claims found'}, status=status.HTTP_200_OK)
        
        processed_claims = []
        
        for claim in claims_result['result']['data_array']:
            claim_id = claim[0]
            team_id = claim[1]
            player_id = claim[2]
            players_to_drop = claim[3]
            priority = claim[4]
            
            try:
                # Parse players_to_drop JSON
                import json
                players_to_drop_list = json.loads(players_to_drop) if players_to_drop else []
                
                # Check if team has space for the new player
                team_players_sql = f"""
                SELECT COUNT(*) FROM default.team_players WHERE team_id = {team_id}
                """
                team_count_result = client.execute_sql(team_players_sql)
                current_player_count = 0
                if team_count_result and 'result' in team_count_result and team_count_result['result'].get('data_array'):
                    current_player_count = team_count_result['result']['data_array'][0][0]
                
                # If team is at capacity, drop the specified players first
                if current_player_count >= 15 and players_to_drop_list:
                    for drop_player_id in players_to_drop_list:
                        drop_sql = f"""
                        DELETE FROM default.team_players 
                        WHERE team_id = {team_id} AND player_id = {drop_player_id}
                        """
                        client.execute_sql(drop_sql)
                
                # Add the new player to the team
                add_player_sql = f"""
                INSERT INTO default.team_players (team_id, player_id, position, fantasy_position, is_starting)
                SELECT {team_id}, {player_id}, rp.Position, rp.Fantasy_Position, false
                FROM default.rugby_players_25_26 rp
                WHERE rp.Player_ID = {player_id}
                """
                
                add_result = client.execute_sql(add_player_sql)
                
                if add_result and 'status' in add_result and add_result['status'].get('state') == 'SUCCEEDED':
                    # Update claim status to APPROVED
                    update_sql = f"""
                    UPDATE default.waiver_claims 
                    SET status = 'APPROVED' 
                    WHERE id = {claim_id}
                    """
                    client.execute_sql(update_sql)
                    
                    processed_claims.append({
                        'claim_id': claim_id,
                        'status': 'APPROVED',
                        'player_id': player_id,
                        'team_id': team_id
                    })
                else:
                    # Update claim status to REJECTED
                    update_sql = f"""
                    UPDATE default.waiver_claims 
                    SET status = 'REJECTED' 
                    WHERE id = {claim_id}
                    """
                    client.execute_sql(update_sql)
                    
                    processed_claims.append({
                        'claim_id': claim_id,
                        'status': 'REJECTED',
                        'player_id': player_id,
                        'team_id': team_id
                    })
                    
            except Exception as e:
                print(f"Error processing claim {claim_id}: {str(e)}")
                # Update claim status to REJECTED
                update_sql = f"""
                UPDATE default.waiver_claims 
                SET status = 'REJECTED' 
                WHERE id = {claim_id}
                """
                client.execute_sql(update_sql)
        
        # Clear cache
        cache_key = f'waiver_claims_{league_id}'
        if cache_key in query_cache:
            del query_cache[cache_key]
        
        return Response({
            'message': f'Processed {len(processed_claims)} waiver claims',
            'processed_claims': processed_claims
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"ERROR in process_waivers: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
