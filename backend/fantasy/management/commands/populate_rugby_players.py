from django.core.management.base import BaseCommand
from fantasy.databricks_client import DatabricksClient

class Command(BaseCommand):
    help = 'Populate rugby players table with sample data'

    def handle(self, *args, **options):
        client = DatabricksClient()
        
        # Sample rugby players data with tournament assignments
        players_data = [
            # Gallagher Premiership players (tournament_id = 1)
            {'name': 'Owen Farrell', 'team': 'Saracens', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 1},
            {'name': 'Maro Itoje', 'team': 'Saracens', 'position': 'Lock', 'fantasy_position': 'Lock', 'tournament_id': 1},
            {'name': 'Tom Curry', 'team': 'Sale', 'position': 'Flanker', 'fantasy_position': 'Back Row', 'tournament_id': 1},
            {'name': 'Ellis Genge', 'team': 'Bristol', 'position': 'Prop', 'fantasy_position': 'Prop', 'tournament_id': 1},
            {'name': 'Jamie George', 'team': 'Saracens', 'position': 'Hooker', 'fantasy_position': 'Hooker', 'tournament_id': 1},
            {'name': 'Henry Slade', 'team': 'Exeter', 'position': 'Centre', 'fantasy_position': 'Centre', 'tournament_id': 1},
            {'name': 'Jonny May', 'team': 'Gloucester', 'position': 'Wing', 'fantasy_position': 'Back Three', 'tournament_id': 1},
            {'name': 'Anthony Watson', 'team': 'Bath', 'position': 'Wing', 'fantasy_position': 'Back Three', 'tournament_id': 1},
            {'name': 'Ben Youngs', 'team': 'Leicester', 'position': 'Scrum-half', 'fantasy_position': 'Scrum-half', 'tournament_id': 1},
            {'name': 'Kyle Sinckler', 'team': 'Bristol', 'position': 'Prop', 'fantasy_position': 'Prop', 'tournament_id': 1},
            
            # Six Nations players (tournament_id = 2)
            {'name': 'Antoine Dupont', 'team': 'France', 'position': 'Scrum-half', 'fantasy_position': 'Scrum-half', 'tournament_id': 2},
            {'name': 'Johnny Sexton', 'team': 'Ireland', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 2},
            {'name': 'Finn Russell', 'team': 'Scotland', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 2},
            {'name': 'Dan Biggar', 'team': 'Wales', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 2},
            {'name': 'Paolo Garbisi', 'team': 'Italy', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 2},
            {'name': 'Stuart Hogg', 'team': 'Scotland', 'position': 'Fullback', 'fantasy_position': 'Back Three', 'tournament_id': 2},
            {'name': 'Hugo Keenan', 'team': 'Ireland', 'position': 'Fullback', 'fantasy_position': 'Back Three', 'tournament_id': 2},
            {'name': 'Damian Penaud', 'team': 'France', 'position': 'Wing', 'fantasy_position': 'Back Three', 'tournament_id': 2},
            {'name': 'Josh Adams', 'team': 'Wales', 'position': 'Wing', 'fantasy_position': 'Back Three', 'tournament_id': 2},
            {'name': 'Garry Ringrose', 'team': 'Ireland', 'position': 'Centre', 'fantasy_position': 'Centre', 'tournament_id': 2},
            
            # Autumn Internationals players (tournament_id = 3)
            {'name': 'Handre Pollard', 'team': 'South Africa', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 3},
            {'name': 'Beauden Barrett', 'team': 'New Zealand', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 3},
            {'name': 'Nicolas Sanchez', 'team': 'Argentina', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 3},
            {'name': 'Quade Cooper', 'team': 'Australia', 'position': 'Fly-half', 'fantasy_position': 'Fly-half', 'tournament_id': 3},
            {'name': 'Faf de Klerk', 'team': 'South Africa', 'position': 'Scrum-half', 'fantasy_position': 'Scrum-half', 'tournament_id': 3},
            {'name': 'Aaron Smith', 'team': 'New Zealand', 'position': 'Scrum-half', 'fantasy_position': 'Scrum-half', 'tournament_id': 3},
            {'name': 'Cheslin Kolbe', 'team': 'South Africa', 'position': 'Wing', 'fantasy_position': 'Back Three', 'tournament_id': 3},
            {'name': 'Rieko Ioane', 'team': 'New Zealand', 'position': 'Centre', 'fantasy_position': 'Centre', 'tournament_id': 3},
            {'name': 'Eben Etzebeth', 'team': 'South Africa', 'position': 'Lock', 'fantasy_position': 'Lock', 'tournament_id': 3},
            {'name': 'Brodie Retallick', 'team': 'New Zealand', 'position': 'Lock', 'fantasy_position': 'Lock', 'tournament_id': 3},
        ]
        
        try:
            # Insert players
            for i, player in enumerate(players_data, 1):
                sql = f"""
                INSERT INTO default.rugby_players_25_26 (Player ID, Team, Player Name, Position, Fantasy Position, tournament_id)
                VALUES ({i}, '{player['team']}', '{player['name']}', '{player['position']}', '{player['fantasy_position']}', {player['tournament_id']})
                """
                
                result = client.execute_sql(sql)
                if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully created player: {player["name"]} ({player["team"]})')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to create player: {player["name"]} - {result}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS('Successfully populated rugby players table')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error populating rugby players: {str(e)}')
            )

