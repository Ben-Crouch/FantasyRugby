from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import UserCreatedLeague, LeagueTeam, LeagueTeamPlayer, FantasyTeam
from .serializers import (
    UserCreatedLeagueSerializer, LeagueTeamSerializer, LeagueTeamPlayerSerializer,
    FantasyTeamSerializer, LeagueTeamDetailSerializer, UserCreatedLeagueDetailSerializer
)


class UserCreatedLeagueViewSet(viewsets.ModelViewSet):
    serializer_class = UserCreatedLeagueSerializer
    permission_classes = [AllowAny]
    queryset = UserCreatedLeague.objects.none()  # Will be overridden in get_queryset
    
    def get_queryset(self):
        # Users can see public leagues and their own leagues
        return UserCreatedLeague.objects.filter(
            Q(is_public=True) | Q(created_by=self.request.user)
        )
    
    def perform_create(self, serializer):
        # For now, we'll create without a user since we're using REST API
        # This will be handled by the REST API client
        serializer.save()
    
    @action(detail=True, methods=['get'])
    def teams(self, request, pk=None):
        league = self.get_object()
        teams = LeagueTeam.objects.filter(league=league)
        serializer = LeagueTeamSerializer(teams, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def join_league(self, request, pk=None):
        league = self.get_object()
        team_name = request.data.get('team_name')
        
        if not team_name:
            return Response({'error': 'Team name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already has a team in this league
        existing_team = LeagueTeam.objects.filter(
            league=league,
            team_owner=request.user
        ).first()
        
        if existing_team:
            return Response({'error': 'You already have a team in this league'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if league is full
        current_teams = LeagueTeam.objects.filter(league=league).count()
        if current_teams >= league.max_teams:
            return Response({'error': 'League is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        team = LeagueTeam.objects.create(
            league=league,
            team_name=team_name,
            team_owner=request.user
        )
        serializer = LeagueTeamSerializer(team)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        league = self.get_object()
        serializer = UserCreatedLeagueDetailSerializer(league)
        return Response(serializer.data)


class LeagueTeamViewSet(viewsets.ModelViewSet):
    serializer_class = LeagueTeamSerializer
    permission_classes = [AllowAny]
    queryset = LeagueTeam.objects.none()  # Will be overridden in get_queryset
    
    def get_queryset(self):
        return LeagueTeam.objects.filter(team_owner=self.request.user)
    
    def perform_create(self, serializer):
        # For now, we'll create without a user since we're using REST API
        # This will be handled by the REST API client
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def add_player(self, request, pk=None):
        team = self.get_object()
        player_id = request.data.get('player_id')
        position = request.data.get('position')
        
        if not player_id or not position:
            return Response({'error': 'Player ID and position are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if player is already in team
        existing_player = LeagueTeamPlayer.objects.filter(
            league_team=team,
            player_id=player_id
        ).first()
        
        if existing_player:
            return Response({'error': 'Player is already in this team'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if team is full
        current_players = LeagueTeamPlayer.objects.filter(league_team=team).count()
        if current_players >= team.league.max_players_per_team:
            return Response({'error': 'Team is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        LeagueTeamPlayer.objects.create(
            league_team=team,
            player_id=player_id,
            position=position
        )
        return Response({'status': 'Player added to team'})
    
    @action(detail=True, methods=['delete'])
    def remove_player(self, request, pk=None):
        team = self.get_object()
        player_id = request.data.get('player_id')
        
        if not player_id:
            return Response({'error': 'Player ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            player = LeagueTeamPlayer.objects.get(
                league_team=team,
                player_id=player_id
            )
            player.delete()
            return Response({'status': 'Player removed from team'})
        except LeagueTeamPlayer.DoesNotExist:
            return Response({'error': 'Player not found in team'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def players(self, request, pk=None):
        team = self.get_object()
        players = LeagueTeamPlayer.objects.filter(league_team=team)
        serializer = LeagueTeamPlayerSerializer(players, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def detail(self, request, pk=None):
        team = self.get_object()
        serializer = LeagueTeamDetailSerializer(team)
        return Response(serializer.data)


class FantasyTeamViewSet(viewsets.ModelViewSet):
    serializer_class = FantasyTeamSerializer
    permission_classes = [AllowAny]
    queryset = FantasyTeam.objects.none()  # Will be overridden in get_queryset
    
    def get_queryset(self):
        return FantasyTeam.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # For now, we'll create without a user since we're using REST API
        # This will be handled by the REST API client
        serializer.save()
