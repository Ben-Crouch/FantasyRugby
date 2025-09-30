from rest_framework import serializers
from .models import UserCreatedLeague, LeagueTeam, LeagueTeamPlayer, FantasyTeam, AuthUser


class UserCreatedLeagueSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    team_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserCreatedLeague
        fields = ['id', 'name', 'description', 'created_by', 'created_by_username', 'max_teams', 'max_players_per_team', 'is_public', 'created_at', 'team_count']
        read_only_fields = ['created_by', 'created_at']
    
    def get_team_count(self, obj):
        return obj.teams.count()


class LeagueTeamSerializer(serializers.ModelSerializer):
    league_name = serializers.CharField(source='league.name', read_only=True)
    team_owner_username = serializers.CharField(source='team_owner.username', read_only=True)
    player_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LeagueTeam
        fields = ['id', 'league', 'league_name', 'team_name', 'team_owner', 'team_owner_username', 'created_at', 'player_count']
        read_only_fields = ['team_owner', 'created_at']
    
    def get_player_count(self, obj):
        return obj.players.count()


class LeagueTeamPlayerSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='league_team.team_name', read_only=True)
    league_name = serializers.CharField(source='league_team.league.name', read_only=True)
    
    class Meta:
        model = LeagueTeamPlayer
        fields = ['id', 'league_team', 'team_name', 'league_name', 'player_id', 'position', 'added_at']
        read_only_fields = ['added_at']


class FantasyTeamSerializer(serializers.ModelSerializer):
    league_name = serializers.CharField(source='league.name', read_only=True)
    owner_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = FantasyTeam
        fields = ['id', 'name', 'league', 'league_name', 'user', 'owner_username', 'created_at']
        read_only_fields = ['user', 'created_at']


class AuthUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthUser
        fields = ['id', 'username', 'email', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class LeagueTeamDetailSerializer(serializers.ModelSerializer):
    league_name = serializers.CharField(source='league.name', read_only=True)
    team_owner_username = serializers.CharField(source='team_owner.username', read_only=True)
    players = LeagueTeamPlayerSerializer(many=True, read_only=True)
    
    class Meta:
        model = LeagueTeam
        fields = ['id', 'league', 'league_name', 'team_name', 'team_owner', 'team_owner_username', 'created_at', 'players']


class UserCreatedLeagueDetailSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    teams = LeagueTeamSerializer(many=True, read_only=True)
    fantasy_teams = FantasyTeamSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserCreatedLeague
        fields = ['id', 'name', 'description', 'created_by', 'created_by_username', 'max_teams', 'max_players_per_team', 'is_public', 'created_at', 'teams', 'fantasy_teams']
