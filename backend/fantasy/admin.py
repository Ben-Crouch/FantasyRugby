from django.contrib import admin
from .models import UserCreatedLeague, LeagueTeam, LeagueTeamPlayer, FantasyTeam, AuthUser


@admin.register(UserCreatedLeague)
class UserCreatedLeagueAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'max_teams', 'max_players_per_team', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'description', 'created_by__username']
    readonly_fields = ['created_at']


@admin.register(LeagueTeam)
class LeagueTeamAdmin(admin.ModelAdmin):
    list_display = ['team_name', 'league', 'team_owner', 'created_at']
    list_filter = ['league', 'created_at']
    search_fields = ['team_name', 'league__name', 'team_owner__username']
    readonly_fields = ['created_at']


@admin.register(LeagueTeamPlayer)
class LeagueTeamPlayerAdmin(admin.ModelAdmin):
    list_display = ['league_team', 'player_id', 'position', 'added_at']
    list_filter = ['position', 'added_at']
    search_fields = ['league_team__team_name', 'league_team__league__name']
    readonly_fields = ['added_at']


@admin.register(FantasyTeam)
class FantasyTeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'league', 'created_at']
    list_filter = ['league', 'created_at']
    search_fields = ['name', 'user__username', 'league__name']
    readonly_fields = ['created_at']


@admin.register(AuthUser)
class AuthUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['username', 'email']
    readonly_fields = ['created_at']

