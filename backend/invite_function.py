@api_view(['POST'])
@permission_classes([AllowAny])
def invite_to_league(request, league_id):
    """
    Send an invitation email to join a league
    
    POST /api/user-leagues/{league_id}/invite/
    
    Sends an email invitation with the league code to a potential player.
    Only the league creator can send invitations.
    
    Parameters:
        league_id (int): The ID of the league to invite to
        
    Request Body:
        {
            "invitee_email": "friend@example.com",
            "invitee_name": "Friend's Name",
            "inviter_name": "Your Name",
            "inviter_email": "your@email.com"
        }
        
    Returns:
        200: Success - Invitation sent
        400: Bad Request - Validation errors
        403: Forbidden - Not the league creator
        404: Not Found - League doesn't exist
        500: Internal Server Error - Email sending failed
    """
    try:
        client = DatabricksRestClient()
        data = request.data
        
        # Validate required fields
        invitee_email = data.get('invitee_email')
        inviter_name = data.get('inviter_name')
        inviter_email = data.get('inviter_email')
        
        if not invitee_email:
            return Response({'error': 'Invitee email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not inviter_name:
            return Response({'error': 'Inviter name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not inviter_email:
            return Response({'error': 'Inviter email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if league exists and get league details
        league_sql = f"SELECT * FROM default.user_created_leagues WHERE id = {league_id}"
        league_result = client.execute_sql(league_sql)
        
        if not league_result or 'result' not in league_result or not league_result['result'].get('data_array'):
            return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        
        league = league_result['result']['data_array'][0]
        league_name = league[1]  # league name is at index 1
        league_code = league[9] if len(league) > 9 else None  # league_code is at index 9
        
        if not league_code:
            return Response({'error': 'League code not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Send invitation email
        from .email_utils import send_league_invitation
        
        invitee_name = data.get('invitee_name', '')
        email_sent = send_league_invitation(
            league_name=league_name,
            league_code=league_code,
            inviter_name=inviter_name,
            inviter_email=inviter_email,
            invitee_email=invitee_email,
            invitee_name=invitee_name
        )
        
        if email_sent:
            return Response({
                'status': 'Invitation sent successfully',
                'league_name': league_name,
                'league_code': league_code,
                'invitee_email': invitee_email
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to send invitation email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': f'Failed to send invitation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
