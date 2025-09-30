from django.core.management.base import BaseCommand
from fantasy.databricks_rest_client import DatabricksRestClient


class Command(BaseCommand):
    help = 'Update league_teams table schema to include statistics columns'

    def handle(self, *args, **options):
        client = DatabricksRestClient()
        
        self.stdout.write("Updating league_teams table schema...")
        
        try:
            # Add new columns to the existing table
            sql_commands = [
                "ALTER TABLE default.league_teams ADD COLUMN wins INT DEFAULT 0",
                "ALTER TABLE default.league_teams ADD COLUMN losses INT DEFAULT 0", 
                "ALTER TABLE default.league_teams ADD COLUMN draws INT DEFAULT 0",
                "ALTER TABLE default.league_teams ADD COLUMN points_for INT DEFAULT 0",
                "ALTER TABLE default.league_teams ADD COLUMN points_against INT DEFAULT 0",
                "ALTER TABLE default.league_teams ADD COLUMN league_points INT DEFAULT 0"
            ]
            
            for sql in sql_commands:
                self.stdout.write(f"Executing: {sql}")
                result = client.execute_sql(sql)
                if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                    self.stdout.write(self.style.SUCCESS(f'✓ Successfully executed: {sql}'))
                else:
                    self.stdout.write(self.style.ERROR(f'✗ Failed to execute: {sql}'))
                    self.stdout.write(f"Result: {result}")
            
            # Verify the table structure
            self.stdout.write("\nVerifying table structure...")
            verify_sql = "DESCRIBE default.league_teams"
            result = client.execute_sql(verify_sql)
            
            if result and 'result' in result and result['result'].get('data_array'):
                self.stdout.write("Current table structure:")
                for row in result['result']['data_array']:
                    self.stdout.write(f"  {row[0]} - {row[1]}")
            
            self.stdout.write(self.style.SUCCESS('✓ League teams table schema updated successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Failed to update table schema: {str(e)}'))
            return
