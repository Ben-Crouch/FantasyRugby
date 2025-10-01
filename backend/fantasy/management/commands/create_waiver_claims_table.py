from django.core.management.base import BaseCommand
from fantasy.databricks_rest_client import DatabricksRestClient

class Command(BaseCommand):
    help = 'Create waiver_claims table in Databricks'

    def handle(self, *args, **options):
        client = DatabricksRestClient()
        
        self.stdout.write('Creating waiver_claims table...')
        
        try:
            # Create waiver_claims table
            sql = """
            CREATE TABLE IF NOT EXISTS default.waiver_claims (
                id BIGINT GENERATED ALWAYS AS IDENTITY,
                league_id BIGINT NOT NULL,
                team_id STRING NOT NULL,
                user_id BIGINT NOT NULL,
                player_to_add_id STRING NOT NULL,
                player_to_drop_id STRING NOT NULL,
                claim_status STRING,
                priority INT,
                submitted_at TIMESTAMP,
                processed_at TIMESTAMP,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )
            """
            
            result = client.execute_sql(sql)
            
            if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                self.stdout.write(self.style.SUCCESS('✓ Successfully created waiver_claims table'))
            else:
                self.stdout.write(self.style.ERROR(f'Failed to create table: {result}'))
                return
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating waiver_claims table: {e}'))
            import traceback
            self.stdout.write(traceback.format_exc())
            raise
        
        self.stdout.write(self.style.SUCCESS('Waiver claims table setup complete!'))

