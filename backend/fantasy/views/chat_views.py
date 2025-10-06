"""
Chat-related API views for the Fantasy Rugby application.
Handles chat messages, participants, and reactions.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result
import json
from datetime import datetime


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def chat_messages(request, league_id):
    """
    GET: Retrieve chat messages for a league
    POST: Send a new chat message
    """
    try:
        client = DatabricksRestClient()
        
        if request.method == 'GET':
            # Get query parameters
            limit = int(request.GET.get('limit', 50))
            offset = int(request.GET.get('offset', 0))
            
            # Build SQL query to get messages with team names
            sql = f"""
            SELECT cm.id, cm.league_id, cm.user_id, cm.message, cm.timestamp, 
                   cm.message_type, cm.reply_to_id, cm.is_deleted, cm.metadata,
                   lt.team_name
            FROM default.chat_messages cm
            LEFT JOIN default.league_teams lt ON cm.user_id = lt.team_owner_user_id AND cm.league_id = lt.league_id
            WHERE cm.league_id = {league_id} AND (cm.is_deleted = false OR cm.is_deleted IS NULL)
            ORDER BY cm.timestamp DESC
            LIMIT {limit} OFFSET {offset}
            """
            
            result = client.execute_sql(sql)
            
            if result and 'result' in result and result['result'].get('data_array'):
                messages = []
                for row in result['result']['data_array']:
                    messages.append({
                        'id': row[0],
                        'league_id': row[1],
                        'user_id': row[2],
                        'message': row[3],
                        'timestamp': row[4],
                        'message_type': row[5] or 'text',
                        'reply_to_id': row[6],
                        'is_deleted': row[7] or False,
                        'metadata': row[8],
                        'username': row[9] or f'User {row[2]}',  # Use team name or fallback
                        'email': None
                    })
                
                return Response({
                    'messages': messages,
                    'has_more': len(messages) == limit
                })
            else:
                return Response({'messages': [], 'has_more': False})
        
        elif request.method == 'POST':
            # Send a new message
            data = request.data
            user_id = data.get('user_id')
            message = data.get('message', '').strip()
            message_type = data.get('message_type', 'text')
            reply_to_id = data.get('reply_to_id')
            
            if not user_id:
                return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not message:
                return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Escape single quotes in message
            message_escaped = message.replace("'", "''")
            
            # Insert new message
            insert_sql = f"""
            INSERT INTO default.chat_messages 
            (league_id, user_id, message, timestamp, message_type, reply_to_id, is_deleted, metadata)
            VALUES ({league_id}, {user_id}, '{message_escaped}', CURRENT_TIMESTAMP, '{message_type}', 
                    {reply_to_id if reply_to_id else 'NULL'}, false, NULL)
            """
            
            result = client.execute_sql(insert_sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                # Get the inserted message with team name
                get_message_sql = f"""
                SELECT cm.id, cm.league_id, cm.user_id, cm.message, cm.timestamp, 
                       cm.message_type, cm.reply_to_id, cm.is_deleted, cm.metadata,
                       lt.team_name
                FROM default.chat_messages cm
                LEFT JOIN default.league_teams lt ON cm.user_id = lt.team_owner_user_id AND cm.league_id = lt.league_id
                WHERE cm.league_id = {league_id} AND cm.user_id = {user_id}
                ORDER BY cm.timestamp DESC
                LIMIT 1
                """
                
                message_result = client.execute_sql(get_message_sql)
                
                if message_result and 'result' in message_result and message_result['result'].get('data_array'):
                    row = message_result['result']['data_array'][0]
                    new_message = {
                        'id': row[0],
                        'league_id': row[1],
                        'user_id': row[2],
                        'message': row[3],
                        'timestamp': row[4],
                        'message_type': row[5] or 'text',
                        'reply_to_id': row[6],
                        'is_deleted': row[7] or False,
                        'metadata': row[8],
                        'username': row[9] or f'User {row[2]}',  # Use team name or fallback
                        'email': None
                    }
                    
                    return Response(new_message, status=status.HTTP_201_CREATED)
                else:
                    return Response({'error': 'Message sent but could not retrieve details'}, 
                                  status=status.HTTP_201_CREATED)
            else:
                return Response({'error': f'Failed to send message: {result}'}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def chat_participants(request, league_id):
    """
    GET: Get chat participants for a league
    POST: Add a user to chat participants
    """
    try:
        client = DatabricksRestClient()
        
        if request.method == 'GET':
            sql = f"""
            SELECT cp.id, cp.league_id, cp.user_id, cp.joined_at, cp.last_read_at, cp.is_active,
                   lt.team_name
            FROM default.chat_participants cp
            LEFT JOIN default.league_teams lt ON cp.user_id = lt.team_owner_user_id AND cp.league_id = lt.league_id
            WHERE cp.league_id = {league_id} AND (cp.is_active = true OR cp.is_active IS NULL)
            ORDER BY cp.joined_at ASC
            """
            
            result = client.execute_sql(sql)
            
            if result and 'result' in result and result['result'].get('data_array'):
                participants = []
                for row in result['result']['data_array']:
                    participants.append({
                        'id': row[0],
                        'league_id': row[1],
                        'user_id': row[2],
                        'joined_at': row[3],
                        'last_read_at': row[4],
                        'is_active': row[5] or True,
                        'username': row[6] or f'User {row[2]}',  # Use team name or fallback
                        'email': None
                    })
                
                return Response({'participants': participants})
            else:
                return Response({'participants': []})
        
        elif request.method == 'POST':
            # Add user to chat participants
            data = request.data
            user_id = data.get('user_id')
            
            if not user_id:
                return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user is already a participant
            check_sql = f"""
            SELECT id FROM default.chat_participants 
            WHERE league_id = {league_id} AND user_id = {user_id}
            """
            
            check_result = client.execute_sql(check_sql)
            
            if check_result and 'result' in check_result and check_result['result'].get('data_array'):
                # User already exists, update to active
                update_sql = f"""
                UPDATE default.chat_participants 
                SET is_active = true, joined_at = CURRENT_TIMESTAMP
                WHERE league_id = {league_id} AND user_id = {user_id}
                """
                result = client.execute_sql(update_sql)
            else:
                # Insert new participant
                insert_sql = f"""
                INSERT INTO default.chat_participants 
                (league_id, user_id, joined_at, last_read_at, is_active)
                VALUES ({league_id}, {user_id}, CURRENT_TIMESTAMP, NULL, true)
                """
                result = client.execute_sql(insert_sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                return Response({'message': 'User added to chat participants'}, 
                              status=status.HTTP_201_CREATED)
            else:
                return Response({'error': f'Failed to add participant: {result}'}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])
def update_read_status(request, league_id, user_id):
    """
    Update the last read timestamp for a user in a league chat
    """
    try:
        client = DatabricksRestClient()
        
        sql = f"""
        UPDATE default.chat_participants 
        SET last_read_at = CURRENT_TIMESTAMP
        WHERE league_id = {league_id} AND user_id = {user_id}
        """
        
        result = client.execute_sql(sql)
        
        if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
            return Response({'message': 'Read status updated'})
        else:
            return Response({'error': f'Failed to update read status: {result}'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
