from django.urls import path
from .views import user_leagues, league_teams, join_league, team_statistics, rugby_players, complete_draft, get_team_players, update_player_position, start_draft, get_draft_status, waiver_claims, process_waivers, trade_proposals, respond_to_trade, tournaments, chat_messages, chat_participants, update_read_status, tournament_availability, league_fixtures, next_matchup
from .admin_views import remove_team_from_league, get_league_admin, is_user_league_admin
from .authentication import register, login, refresh_token, verify_token, logout
from .views.draft_views import debug_database

urlpatterns = [
    # REST API endpoints
    path('user-leagues/', user_leagues, name='user_leagues'),
    path('user-leagues/<int:league_id>/join_league/', join_league, name='join_league'),
    path('league-teams/', league_teams, name='league_teams'),
    path('team-statistics/', team_statistics, name='team_statistics'),
    path('rugby-players/', rugby_players, name='rugby_players'),
    path('tournaments/', tournaments, name='tournaments'),
    path('tournament-availability/', tournament_availability, name='tournament_availability'),
    path('league-fixtures/', league_fixtures, name='league_fixtures'),
    path('next-matchup/', next_matchup, name='next_matchup'),
    path('leagues/<int:league_id>/complete-draft/', complete_draft, name='complete_draft'),
    path('leagues/<int:league_id>/start-draft/', start_draft, name='start_draft'),
    path('leagues/<int:league_id>/draft-status/', get_draft_status, name='get_draft_status'),
    path('leagues/<int:league_id>/waiver-claims/', waiver_claims, name='waiver_claims'),
    path('leagues/<int:league_id>/process-waivers/', process_waivers, name='process_waivers'),
    path('leagues/<int:league_id>/trades/', trade_proposals, name='trade_proposals'),
    path('trades/<str:trade_id>/respond/', respond_to_trade, name='respond_to_trade'),
    path('league-teams/<int:team_id>/players/', get_team_players, name='get_team_players'),
    path('league-teams/<int:team_id>/players/<int:player_id>/', update_player_position, name='update_player_position'),
    # Chat endpoints
    path('leagues/<int:league_id>/chat/messages/', chat_messages, name='chat_messages'),
    path('leagues/<int:league_id>/chat/participants/', chat_participants, name='chat_participants'),
    path('leagues/<int:league_id>/chat/users/<int:user_id>/read-status/', update_read_status, name='update_read_status'),
    # League admin endpoints
    path('admin/leagues/<int:league_id>/teams/<int:team_id>/remove/', remove_team_from_league, name='remove_team'),
    path('admin/leagues/<int:league_id>/admin-info/', get_league_admin, name='get_league_admin'),
    path('admin/leagues/<int:league_id>/users/<int:user_id>/is-admin/', is_user_league_admin, name='is_user_admin'),
    # Authentication endpoints
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/refresh/', refresh_token, name='refresh_token'),
    path('auth/verify/', verify_token, name='verify_token'),
    path('auth/logout/', logout, name='logout'),
    # Debug endpoints
    path('debug/database/', debug_database, name='debug_database'),
]
