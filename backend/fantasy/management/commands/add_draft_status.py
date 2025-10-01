from django.core.management.base import BaseCommand
from fantasy.databricks_rest_client import DatabricksRestClient


class Command(BaseCommand):
    help = 'Add draft_status column to user_created_leagues table'

    def handle(self, *args, **options):
        client = DatabricksRestClient()
        
        self.stdout.write("Adding draft_status column to user_created_leagues table...")
        
        try:
            # Step 1: Add draft_status column (without default - Databricks limitation)
            # Possible values: 'NOT_STARTED', 'LIVE', 'COMPLETED'
            sql = "ALTER TABLE default.user_created_leagues ADD COLUMN draft_status STRING"
            
            self.stdout.write(f"Step 1: {sql}")
            result = client.execute_sql(sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                self.stdout.write(self.style.SUCCESS('✓ Successfully added draft_status column'))
            else:
                self.stdout.write(self.style.ERROR('✗ Failed to add draft_status column'))
                self.stdout.write(f"Result: {result}")
                return
            
            # Step 2: Update existing rows to have 'NOT_STARTED' status
            update_sql = "UPDATE default.user_created_leagues SET draft_status = 'NOT_STARTED' WHERE draft_status IS NULL"
            
            self.stdout.write(f"\nStep 2: {update_sql}")
            result = client.execute_sql(update_sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                self.stdout.write(self.style.SUCCESS('✓ Successfully updated existing leagues'))
            else:
                self.stdout.write(self.style.WARNING('⚠ Could not update existing leagues'))
                self.stdout.write(f"Result: {result}")
            
            # Verify the table structure
            self.stdout.write("\nVerifying table structure...")
            verify_sql = "DESCRIBE default.user_created_leagues"
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

