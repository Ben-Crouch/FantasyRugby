"""
Trade management views for Fantasy Rugby API

This module handles all trade-related operations including:
- Trade proposals
- Trade responses
- Trade history
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result, query_cache


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def trade_proposals(request, league_id):
    """
    Handle trade proposals for a league
    
    GET: Retrieve all trade proposals for a league
    POST: Create a new trade proposal
    """
    if request.method == 'GET':
        try:
            client = DatabricksRestClient()
            
            # Check cache first
            cache_key = f'trade_proposals_{league_id}'
            cached_result = get_cached_result(cache_key)
            if cached_result:
                return Response(cached_result)
            
            sql = f"""
            SELECT tp.id, tp.league_id, tp.from_team_id, tp.to_team_id, tp.players_offered, 
                   tp.players_requested, tp.status, tp.created_at, tp.responded_at,
                   lt1.team_name as from_team_name, lt2.team_name as to_team_name
            FROM default.trade_proposals tp
            LEFT JOIN default.league_teams lt1 ON tp.from_team_id = lt1.id
            LEFT JOIN default.league_teams lt2 ON tp.to_team_id = lt2.id
            WHERE tp.league_id = {league_id}
            ORDER BY tp.created_at DESC
            """
            
            result = client.execute_sql(sql)
            
            if result and 'result' in result and result['result'].get('data_array'):
                trades = []
                for row in result['result']['data_array']:
                    trades.append({
                        'id': row[0],
                        'league_id': row[1],
                        'from_team_id': row[2],
                        'to_team_id': row[3],
                        'players_offered': row[4],
                        'players_requested': row[5],
                        'status': row[6],
                        'created_at': row[7],
                        'responded_at': row[8],
                        'from_team_name': row[9],
                        'to_team_name': row[10]
                    })
                
                # Cache the result
                set_cached_result(cache_key, trades)
                return Response(trades)
            else:
                return Response([])
                
        except Exception as e:
            print(f"ERROR in trade_proposals GET: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            data = request.data
            from_team_id = data.get('from_team_id')
            to_team_id = data.get('to_team_id')
            players_offered = data.get('players_offered', [])
            players_requested = data.get('players_requested', [])
            
            if not from_team_id or not to_team_id:
                return Response({'error': 'From team ID and To team ID are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if from_team_id == to_team_id:
                return Response({'error': 'Cannot trade with yourself'}, status=status.HTTP_400_BAD_REQUEST)
            
            client = DatabricksRestClient()
            
            # Convert player lists to JSON strings
            import json
            players_offered_json = json.dumps(players_offered)
            players_requested_json = json.dumps(players_requested)
            
            # Insert the trade proposal
            sql = f"""
            INSERT INTO default.trade_proposals (league_id, from_team_id, to_team_id, players_offered, players_requested, status, created_at)
            VALUES ({league_id}, {from_team_id}, {to_team_id}, '{players_offered_json}', '{players_requested_json}', 'PENDING', CURRENT_TIMESTAMP)
            """
            
            result = client.execute_sql(sql)
            
            if not result or 'status' not in result or result['status'].get('state') != 'SUCCEEDED':
                return Response({'error': f'Failed to create trade proposal: {result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Clear cache
            cache_key = f'trade_proposals_{league_id}'
            if cache_key in query_cache:
                del query_cache[cache_key]
            
            return Response({'message': 'Trade proposal created successfully'}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"ERROR in trade_proposals POST: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def respond_to_trade(request, trade_id):
    """
    Respond to a trade proposal (accept or reject)
    """
    try:
        data = request.data
        response = data.get('response')  # 'ACCEPTED' or 'REJECTED'
        
        if response not in ['ACCEPTED', 'REJECTED']:
            return Response({'error': 'Response must be ACCEPTED or REJECTED'}, status=status.HTTP_400_BAD_REQUEST)
        
        client = DatabricksRestClient()
        
        # Get the trade proposal details
        get_trade_sql = f"""
        SELECT league_id, from_team_id, to_team_id, players_offered, players_requested, status
        FROM default.trade_proposals 
        WHERE id = {trade_id}
        """
        
        trade_result = client.execute_sql(get_trade_sql)
        
        if not trade_result or 'result' not in trade_result or not trade_result['result'].get('data_array'):
            return Response({'error': 'Trade proposal not found'}, status=status.HTTP_404_NOT_FOUND)
        
        trade_data = trade_result['result']['data_array'][0]
        league_id = trade_data[0]
        from_team_id = trade_data[1]
        to_team_id = trade_data[2]
        players_offered = trade_data[3]
        players_requested = trade_data[4]
        current_status = trade_data[5]
        
        if current_status != 'PENDING':
            return Response({'error': 'Trade proposal has already been responded to'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the trade status
        update_sql = f"""
        UPDATE default.trade_proposals 
        SET status = '{response}', responded_at = CURRENT_TIMESTAMP
        WHERE id = {trade_id}
        """
        
        update_result = client.execute_sql(update_sql)
        
        if not update_result or 'status' not in update_result or update_result['status'].get('state') != 'SUCCEEDED':
            return Response({'error': f'Failed to update trade status: {update_result}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # If accepted, process the trade
        if response == 'ACCEPTED':
            try:
                import json
                players_offered_list = json.loads(players_offered) if players_offered else []
                players_requested_list = json.loads(players_requested) if players_requested else []
                
                # Move players from offering team to receiving team
                for player_id in players_offered_list:
                    # Remove from offering team
                    remove_sql = f"""
                    DELETE FROM default.team_players 
                    WHERE team_id = {from_team_id} AND player_id = {player_id}
                    """
                    client.execute_sql(remove_sql)
                    
                    # Add to receiving team
                    add_sql = f"""
                    INSERT INTO default.team_players (team_id, player_id, position, fantasy_position, is_starting)
                    SELECT {to_team_id}, {player_id}, rp.Position, rp.Fantasy_Position, false
                    FROM default.rugby_players_25_26 rp
                    WHERE rp.Player_ID = {player_id}
                    """
                    client.execute_sql(add_sql)
                
                # Move players from receiving team to offering team
                for player_id in players_requested_list:
                    # Remove from receiving team
                    remove_sql = f"""
                    DELETE FROM default.team_players 
                    WHERE team_id = {to_team_id} AND player_id = {player_id}
                    """
                    client.execute_sql(remove_sql)
                    
                    # Add to offering team
                    add_sql = f"""
                    INSERT INTO default.team_players (team_id, player_id, position, fantasy_position, is_starting)
                    SELECT {from_team_id}, {player_id}, rp.Position, rp.Fantasy_Position, false
                    FROM default.rugby_players_25_26 rp
                    WHERE rp.Player_ID = {player_id}
                    """
                    client.execute_sql(add_sql)
                
            except Exception as e:
                print(f"Error processing trade: {str(e)}")
                # Revert trade status to PENDING if processing failed
                revert_sql = f"""
                UPDATE default.trade_proposals 
                SET status = 'PENDING', responded_at = NULL
                WHERE id = {trade_id}
                """
                client.execute_sql(revert_sql)
                return Response({'error': f'Failed to process trade: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Clear cache
        cache_key = f'trade_proposals_{league_id}'
        if cache_key in query_cache:
            del query_cache[cache_key]
        
        return Response({'message': f'Trade proposal {response.lower()} successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"ERROR in respond_to_trade: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
