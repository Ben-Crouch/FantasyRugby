from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Tournament(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'tournaments'
        managed = False
    
    def __str__(self):
        return self.name


class UserCreatedLeague(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_leagues')
    max_teams = models.IntegerField(default=10)
    max_players_per_team = models.IntegerField(default=15)
    is_public = models.BooleanField(default=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='leagues')
    league_code = models.CharField(max_length=8, unique=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'user_created_leagues'
        managed = False
    
    def __str__(self):
        return f"{self.name} (by {self.created_by.username})"


class LeagueTeam(models.Model):
    league = models.ForeignKey(UserCreatedLeague, on_delete=models.CASCADE, related_name='teams')
    team_name = models.CharField(max_length=100)
    team_owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='league_teams')
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    points_for = models.IntegerField(default=0)
    points_against = models.IntegerField(default=0)
    league_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'league_teams'
        managed = False
    
    def __str__(self):
        return f"{self.team_name} in {self.league.name}"


class LeagueTeamPlayer(models.Model):
    league_team = models.ForeignKey(LeagueTeam, on_delete=models.CASCADE, related_name='players')
    player_id = models.BigIntegerField()  # References your existing rugby_players table
    position = models.CharField(max_length=50)
    added_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'league_team_players'
        managed = False
        unique_together = ('league_team', 'player_id')
    
    def __str__(self):
        return f"Player {self.player_id} in {self.league_team.team_name}"


class FantasyTeam(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fantasy_teams')
    name = models.CharField(max_length=100)
    league = models.ForeignKey(UserCreatedLeague, on_delete=models.CASCADE, related_name='fantasy_teams')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'fantasy_teams'
        managed = False
    
    def __str__(self):
        return f"{self.name} ({self.league.name})"


class TeamStatistics(models.Model):
    league_team = models.ForeignKey(LeagueTeam, on_delete=models.CASCADE, related_name='statistics')
    league_id = models.BigIntegerField()
    
    # Basic Statistics
    matches_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    points_for = models.IntegerField(default=0)
    points_against = models.IntegerField(default=0)
    points_difference = models.IntegerField(default=0)
    league_points = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'team_statistics'
        managed = False
    
    def __str__(self):
        return f"Stats for {self.league_team.team_name}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate points_difference
        self.points_difference = self.points_for - self.points_against
        super().save(*args, **kwargs)


class AuthUser(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField()
    password_hash = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'auth_users'
        managed = False
    
    def __str__(self):
        return self.username

