from django.core.management.base import BaseCommand
from fantasy.databricks_rest_client import DatabricksRestClient


class Command(BaseCommand):
    help = 'Add waiver_order column to league_teams table'

    def handle(self, *args, **options):
        client = DatabricksRestClient()
        
        self.stdout.write("Adding waiver_order column to league_teams table...")
        
        try:
            # Step 1: Add waiver_order column
            sql = "ALTER TABLE default.league_teams ADD COLUMN waiver_order INT"
            
            self.stdout.write(f"Step 1: {sql}")
            result = client.execute_sql(sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                self.stdout.write(self.style.SUCCESS('✓ Successfully added waiver_order column'))
            else:
                self.stdout.write(self.style.ERROR('✗ Failed to add waiver_order column'))
                self.stdout.write(f"Result: {result}")
                return
            
            # Step 2: Initialize waiver order for each league
            # For each league, set waiver_order based on current standings (worst team gets first waiver)
            init_sql = """
            UPDATE default.league_teams t1
            SET waiver_order = (
                SELECT COUNT(*) + 1 - ROW_NUMBER() OVER (
                    PARTITION BY league_id 
                    ORDER BY league_points ASC, points_for - points_against ASC
                )
                FROM default.league_teams t2
                WHERE t2.league_id = t1.league_id AND t2.id = t1.id
            )
            WHERE waiver_order IS NULL
            """
            
            self.stdout.write(f"\nStep 2: Initializing waiver order based on standings...")
            result = client.execute_sql(init_sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                self.stdout.write(self.style.SUCCESS('✓ Successfully initialized waiver order'))
            else:
                self.stdout.write(self.style.WARNING('⚠ Could not initialize waiver order'))
                self.stdout.write(f"Result: {result}")
            
            # Verify the table structure
            self.stdout.write("\nVerifying table structure...")
            verify_sql = "DESCRIBE default.league_teams"
            result = client.execute_sql(verify_sql)
            
            if result and 'result' in result and 'data_array' in result['result']:
                self.stdout.write(self.style.SUCCESS('\nTable columns:'))
                for row in result['result']['data_array']:
                    self.stdout.write(f"  - {row[0]} ({row[1]})")
            
            self.stdout.write(self.style.SUCCESS('\n✓ Migration completed successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))
            import traceback
            self.stdout.write(traceback.format_exc())



