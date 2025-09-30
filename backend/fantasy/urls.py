from django.urls import path
from .rest_views import user_leagues, league_teams, join_league, team_statistics, rugby_players
from .admin_views import remove_team_from_league, get_league_admin, is_user_league_admin
from .authentication import register, login, refresh_token, verify_token, logout

urlpatterns = [
    # REST API endpoints
    path('user-leagues/', user_leagues, name='user_leagues'),
    path('user-leagues/<int:league_id>/join_league/', join_league, name='join_league'),
    path('league-teams/', league_teams, name='league_teams'),
    path('team-statistics/', team_statistics, name='team_statistics'),
    path('rugby-players/', rugby_players, name='rugby_players'),
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
]
