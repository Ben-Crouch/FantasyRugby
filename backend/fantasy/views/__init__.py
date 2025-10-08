"""
Fantasy Rugby API Views Package

This package contains all the REST API view modules organized by functionality:
- league_views: League management operations
- team_views: Team operations and statistics
- player_views: Player data and team player management
- draft_views: Draft functionality
- waiver_views: Waiver system
- trade_views: Trade functionality
- tournament_views: Tournament data
- chat_views: Chat functionality
- utils: Shared utilities and caching
"""

# Import all view functions for easy access
from .league_views import user_leagues, league_teams
from .team_views import join_league, team_statistics
from .player_views import rugby_players, get_team_players, update_player_position
from .draft_views import complete_draft, start_draft, get_draft_status
from .waiver_views import waiver_claims, process_waivers
from .trade_views import trade_proposals, respond_to_trade
from .tournament_views import tournaments
from .chat_views import chat_messages, chat_participants, update_read_status
from .matchweek_views import tournament_availability, league_fixtures, next_matchup
from ..rest_views import invite_to_league

__all__ = [
    'user_leagues',
    'league_teams', 
    'join_league',
    'team_statistics',
    'rugby_players',
    'get_team_players',
    'update_player_position',
    'complete_draft',
    'start_draft',
    'get_draft_status',
    'waiver_claims',
    'process_waivers',
    'trade_proposals',
    'respond_to_trade',
    'tournaments',
    'chat_messages',
    'chat_participants',
    'update_read_status',
    'tournament_availability',
    'league_fixtures',
    'next_matchup',
    'invite_to_league'
]
