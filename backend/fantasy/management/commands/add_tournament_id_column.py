from django.core.management.base import BaseCommand
from fantasy.databricks_client import DatabricksClient

class Command(BaseCommand):
    help = 'Add tournament_id column to user_created_leagues table'

    def handle(self, *args, **options):
        client = DatabricksClient()
        
        try:
            # Add tournament_id column to user_created_leagues table
            sql = "ALTER TABLE default.user_created_leagues ADD COLUMN tournament_id BIGINT"
            
            result = client.execute_sql(sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                self.stdout.write(
                    self.style.SUCCESS('Successfully added tournament_id column to user_created_leagues table')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'Failed to add tournament_id column: {result}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error adding tournament_id column: {str(e)}')
            )
