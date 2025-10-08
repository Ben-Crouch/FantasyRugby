from django.core.management.base import BaseCommand
from fantasy.databricks_client import DatabricksClient

class Command(BaseCommand):
    help = 'Add tournament_id column to rugby_players_25_26 table and populate with tournament data'

    def handle(self, *args, **options):
        client = DatabricksClient()
        
        try:
            # Add tournament_id column to rugby_players_25_26 table
            sql = "ALTER TABLE default.rugby_players_25_26 ADD COLUMN tournament_id BIGINT"
            
            result = client.execute_sql(sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                self.stdout.write(
                    self.style.SUCCESS('Successfully added tournament_id column to rugby_players_25_26 table')
                )
                
                # Now populate the tournament_id based on team names
                # This is a simple mapping - in a real scenario, you'd have more sophisticated logic
                self.stdout.write('Populating tournament_id based on team names...')
                
                # Map teams to tournaments (this is a simplified mapping)
                team_tournament_mapping = {
                    # Gallagher Premiership teams
                    'Bath': 1, 'Bristol': 1, 'Exeter': 1, 'Gloucester': 1, 'Harlequins': 1, 
                    'Leicester': 1, 'London Irish': 1, 'Newcastle': 1, 'Northampton': 1, 
                    'Sale': 1, 'Saracens': 1, 'Wasps': 1, 'Worcester': 1,
                    
                    # Six Nations teams
                    'England': 2, 'France': 2, 'Ireland': 2, 'Italy': 2, 'Scotland': 2, 'Wales': 2,
                    
                    # Autumn Internationals teams (same as Six Nations for now)
                    'South Africa': 3, 'New Zealand': 3, 'Australia': 3, 'Argentina': 3
                }
                
                # Update tournament_id for each team
                for team, tournament_id in team_tournament_mapping.items():
                    update_sql = f"UPDATE default.rugby_players_25_26 SET tournament_id = {tournament_id} WHERE Team = '{team}'"
                    result = client.execute_sql(update_sql)
                    if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                        self.stdout.write(f'Updated tournament_id for team: {team}')
                    else:
                        self.stdout.write(f'Failed to update tournament_id for team: {team}')
                
                self.stdout.write(
                    self.style.SUCCESS('Successfully populated tournament_id for rugby players')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'Failed to add tournament_id column: {result}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error adding tournament_id column: {str(e)}')
            )

