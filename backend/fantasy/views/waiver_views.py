"""
Waiver claims API endpoints with WebSocket broadcasting
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ..models import WaiverClaim, LeagueTeam, RugbyPlayer, TeamPlayer


def _get_team_position_needs(league_id, team_id):
    """Get positions still needed to fill required starting positions"""
    try:
        # Define required starting positions
        POSITION_REQUIREMENTS = {
            'Prop': 2,
            'Hooker': 1,
            'Lock': 1,
            'Back Row': 2,
            'Scrum-half': 1,
            'Fly-half': 1,
            'Centre': 1,
            'Back Three': 2
        }

        # Get team's current players
        team_players = TeamPlayer.objects.filter(
            team_id=team_id,
            league_id=league_id
        ).values_list('id', flat=True)

        # Get player fantasy positions
        players = RugbyPlayer.objects.filter(
            id__in=team_players
        ).values_list('fantasy_position', flat=True)

        # Count current positions
        current_positions = {pos: 0 for pos in POSITION_REQUIREMENTS.keys()}
        for fantasy_position in players:
            if fantasy_position in current_positions:
                current_positions[fantasy_position] += 1

        # Calculate positions still needed
        needed_positions = {}
        for position, required in POSITION_REQUIREMENTS.items():
            current = current_positions.get(position, 0)
            if current < required:
                needed_positions[position] = required - current

        return needed_positions

    except Exception as e:
        print(f"Error getting team position needs: {e}")
        return {}


def _is_bench_full(league_id, team_id):
    """Check if team's bench is full (4 or more bench players)"""
    try:
        # Count bench players for this team
        bench_count = TeamPlayer.objects.filter(
            team_id=team_id,
            league_id=league_id,
            is_starting=False
        ).count()

        return bench_count >= 4

    except Exception as e:
        print(f"Error checking if bench is full: {e}")
        return False


def broadcast_waiver_update(league_id, update_type, data):
    """Broadcast waiver update to all users in the league"""
    channel_layer = get_channel_layer()
    room_group_name = f'waivers_{league_id}'
    
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': update_type,
            'data': data
        }
    )


@api_view(['GET', 'POST'])
# Authentication required - AllowAny removed for security
def waiver_claims(request, league_id):
    """
    Handle waiver claims for a league

    GET /api/leagues/{league_id}/waiver-claims/ - Get all waiver claims
    POST /api/leagues/{league_id}/waiver-claims/ - Submit a new waiver claim
    """
    if request.method == 'GET':
        try:
            # Get waiver claims with team and player details using Django ORM
            claims_qs = WaiverClaim.objects.filter(
                team_id__in=LeagueTeam.objects.filter(league_id=league_id).values_list('id', flat=True)
            ).select_related().order_by('priority', 'created_at')

            claims = []
            for claim in claims_qs:
                # Get team details
                try:
                    team = LeagueTeam.objects.get(id=claim.team_id)
                    team_name = team.team_name
                    team_owner_user_id = team.team_owner_id
                except LeagueTeam.DoesNotExist:
                    team_name = None
                    team_owner_user_id = None

                # Get player details
                try:
                    player = RugbyPlayer.objects.get(id=claim.player_id)
                    player_name = player.name
                    player_position = player.position
                    player_team = player.team
                except RugbyPlayer.DoesNotExist:
                    player_name = None
                    player_position = None
                    player_team = None

                claims.append({
                    'id': claim.id,
                    'team_id': claim.team_id,
                    'player_id': claim.player_id,
                    'players_to_drop': claim.players_to_drop if claim.players_to_drop else [],
                    'priority': claim.priority,
                    'bid_amount': float(claim.bid_amount) if claim.bid_amount is not None else 0.0,
                    'status': claim.status,
                    'created_at': claim.created_at.isoformat() if claim.created_at else None,
                    'team_name': team_name,
                    'team_owner_user_id': team_owner_user_id,
                    'player_name': player_name,
                    'player_position': player_position,
                    'player_team': player_team
                })

            return Response(claims)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            data = request.data

            team_id = data.get('team_id')
            player_id = data.get('player_id')
            players_to_drop = data.get('players_to_drop', [])  # List of player IDs to drop
            # SECURITY FIX: Use authenticated user instead of accepting from request body
            user_id = request.user.id
            bid_amount = data.get('bid_amount', 0)

            if not team_id or not player_id:
                return Response({
                    'error': 'team_id and player_id are required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate players_to_drop is provided and is a list
            if not isinstance(players_to_drop, list):
                return Response({
                    'error': 'players_to_drop must be a list'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Require at least one player to drop if team is at max roster size
            team_player_count = TeamPlayer.objects.filter(
                team_id=team_id,
                league_id=league_id
            ).count()

            if team_player_count >= 15 and len(players_to_drop) == 0:
                return Response({
                    'error': 'Team is at max roster size (15). You must select a player to drop.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate bid_amount is a number
            try:
                bid_amount = float(bid_amount)
                if bid_amount < 0:
                    return Response({
                        'error': 'Bid amount must be non-negative'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({
                    'error': 'Invalid bid amount'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate that all players to drop are bench players only
            if players_to_drop:
                for drop_player_id in players_to_drop:
                    try:
                        team_player = TeamPlayer.objects.get(
                            player_id=drop_player_id,
                            team_id=team_id,
                            league_id=league_id
                        )

                        # WAIVER RULE: Can only drop bench players, not starting lineup
                        if team_player.is_starting:
                            # Get player name for error message
                            try:
                                player = RugbyPlayer.objects.get(id=team_player.player_id)
                                player_name = player.name
                            except:
                                player_name = "Unknown"

                            return Response({
                                'error': f'Cannot drop {player_name} - waiver claims can only swap bench players. Starting lineup players cannot be dropped via waivers.'
                            }, status=status.HTTP_400_BAD_REQUEST)

                    except TeamPlayer.DoesNotExist:
                        return Response({
                            'error': f'Player with ID {drop_player_id} not found on your team'
                        }, status=status.HTTP_404_NOT_FOUND)

            # Get team and verify ownership
            try:
                team = LeagueTeam.objects.get(id=team_id, league_id=league_id)

                # SECURITY: Verify user owns this team
                if team.team_owner_id != user_id:
                    return Response({
                        'error': 'Permission denied: You do not own this team'
                    }, status=status.HTTP_403_FORBIDDEN)

                priority = getattr(team, 'waiver_order', 999) or 999

                # Validate team has enough FAAB budget
                if team.faab_budget is not None and bid_amount > float(team.faab_budget):
                    return Response({
                        'error': f'Insufficient FAAB budget. You have £{team.faab_budget}, but bid is £{bid_amount}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except LeagueTeam.DoesNotExist:
                return Response({
                    'error': 'Team not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Check position restrictions (same logic as draft)
            bench_full = _is_bench_full(league_id, team_id)
            position_needs = _get_team_position_needs(league_id, team_id)

            if bench_full and position_needs:
                # Get the player's position
                try:
                    player = RugbyPlayer.objects.get(id=player_id)
                    player_position = player.fantasy_position

                    # Check if this position is needed
                    if player_position not in position_needs:
                        needed_positions_str = ", ".join(position_needs.keys())
                        return Response({
                            'error': f'Bench is full. You must claim players from required positions: {needed_positions_str}'
                        }, status=status.HTTP_400_BAD_REQUEST)
                except RugbyPlayer.DoesNotExist:
                    return Response({
                        'error': 'Player not found'
                    }, status=status.HTTP_404_NOT_FOUND)

            # Create waiver claim using Django ORM
            with transaction.atomic():
                claim = WaiverClaim.objects.create(
                    league_id=league_id,
                    team_id=team_id,
                    player_id=player_id,
                    players_to_drop=players_to_drop,  # Store players to drop (bench only)
                    priority=priority,
                    bid_amount=bid_amount,
                    status='PENDING',
                    submitted_at=timezone.now()
                )

                claim_data = {
                    'team_id': team_id,
                    'player_id': player_id,
                    'players_to_drop': players_to_drop,
                    'priority': priority,
                    'bid_amount': float(bid_amount),
                    'status': 'PENDING',
                    'user_id': user_id
                }

                # Broadcast waiver claim added
                broadcast_waiver_update(league_id, 'waiver_claim_added', claim_data)

                return Response({
                    'message': 'Waiver claim submitted successfully',
                    'data': claim_data
                })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
# Authentication required
def update_waiver_priority(request, league_id, claim_id):
    """Update waiver claim priority"""
    try:
        data = request.data

        new_priority = data.get('priority')
        if new_priority is None:
            return Response({
                'error': 'priority is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update waiver claim priority using Django ORM
        try:
            claim = WaiverClaim.objects.get(id=claim_id)
            claim.priority = new_priority
            claim.save()

            # Broadcast priority update
            broadcast_waiver_update(league_id, 'waiver_priority_updated', {
                'claim_id': claim_id,
                'new_priority': new_priority
            })

            return Response({'message': 'Waiver priority updated successfully'})

        except WaiverClaim.DoesNotExist:
            return Response({
                'error': 'Waiver claim not found'
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
# Authentication required
def delete_waiver_claim(request, league_id, claim_id):
    """Delete a waiver claim"""
    try:
        # Delete waiver claim using Django ORM
        try:
            claim = WaiverClaim.objects.get(id=claim_id)
            claim.delete()

            # Broadcast claim deletion
            broadcast_waiver_update(league_id, 'waiver_claim_deleted', {
                'claim_id': claim_id
            })

            return Response({'message': 'Waiver claim deleted successfully'})

        except WaiverClaim.DoesNotExist:
            return Response({
                'error': 'Waiver claim not found'
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
# Authentication required - only league commissioner should call this
def process_waivers(request, league_id):
    """
    Process all pending waiver claims for a league using FAAB bidding

    POST /api/leagues/{league_id}/process-waivers/
    """
    try:
        from collections import defaultdict
        from decimal import Decimal

        # Get all pending waiver claims ordered by bid amount (DESC), then created_at
        pending_claims = WaiverClaim.objects.filter(
            league_id=league_id,
            status='PENDING'
        ).order_by('-bid_amount', 'created_at')

        # Group claims by player_id
        claims_by_player = defaultdict(list)
        for claim in pending_claims:
            claims_by_player[claim.player_id].append(claim)

        processed_count = 0
        approved_count = 0
        rejected_count = 0

        # Process claims in a transaction
        with transaction.atomic():
            for player_id, player_claims in claims_by_player.items():
                # Sort claims for this player (highest bid wins, earliest submission breaks ties)
                player_claims.sort(key=lambda c: (-float(c.bid_amount), c.created_at))

                # First claim is the winner
                winning_claim = player_claims[0]

                # Check if winning team has enough budget
                try:
                    team = LeagueTeam.objects.get(id=winning_claim.team_id)

                    # Validate budget (should have been validated on submission, but double-check)
                    if team.faab_budget is not None:
                        if winning_claim.bid_amount > team.faab_budget:
                            # Insufficient funds - reject claim
                            winning_claim.status = 'REJECTED'
                            winning_claim.processed_at = timezone.now()
                            winning_claim.save()
                            rejected_count += 1
                            processed_count += 1

                            # Reject all other claims for this player too
                            for claim in player_claims[1:]:
                                claim.status = 'REJECTED'
                                claim.processed_at = timezone.now()
                                claim.save()
                                rejected_count += 1
                                processed_count += 1
                            continue

                        # Deduct bid amount from team's budget
                        team.faab_budget = Decimal(str(team.faab_budget)) - Decimal(str(winning_claim.bid_amount))
                        team.save()

                    # Approve winning claim
                    winning_claim.status = 'APPROVED'
                    winning_claim.processed_at = timezone.now()
                    winning_claim.save()
                    approved_count += 1
                    processed_count += 1

                except LeagueTeam.DoesNotExist:
                    # Team not found - reject claim
                    winning_claim.status = 'REJECTED'
                    winning_claim.processed_at = timezone.now()
                    winning_claim.save()
                    rejected_count += 1
                    processed_count += 1

                # Reject all other claims for this player
                for claim in player_claims[1:]:
                    claim.status = 'REJECTED'
                    claim.processed_at = timezone.now()
                    claim.save()
                    rejected_count += 1
                    processed_count += 1

        # Broadcast waivers processed
        broadcast_waiver_update(league_id, 'waivers_processed', {
            'processed_count': processed_count,
            'approved_count': approved_count,
            'rejected_count': rejected_count
        })

        return Response({
            'message': 'Waivers processed successfully',
            'processed_count': processed_count,
            'approved_count': approved_count,
            'rejected_count': rejected_count
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)