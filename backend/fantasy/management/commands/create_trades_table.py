from django.core.management.base import BaseCommand
from fantasy.databricks_rest_client import DatabricksRestClient

class Command(BaseCommand):
    help = 'Create the trades table in Databricks'

    def handle(self, *args, **options):
        client = DatabricksRestClient()
        
        # Create trades table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS default.trades (
            id STRING,
            league_id INT,
            from_team_id STRING,
            to_team_id STRING,
            from_user_id INT,
            to_user_id INT,
            status STRING,
            proposed_at TIMESTAMP,
            responded_at TIMESTAMP,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
        """
        
        try:
            result = client.execute_sql(create_table_sql)
            self.stdout.write(self.style.SUCCESS('Successfully created trades table'))
            self.stdout.write(f'Result: {result}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating trades table: {str(e)}'))
            
        # Create trade_players table to track players involved in each trade
        create_trade_players_sql = """
        CREATE TABLE IF NOT EXISTS default.trade_players (
            id STRING,
            trade_id STRING,
            team_player_id STRING,
            from_team BOOLEAN,
            created_at TIMESTAMP
        )
        """
        
        try:
            result = client.execute_sql(create_trade_players_sql)
            self.stdout.write(self.style.SUCCESS('Successfully created trade_players table'))
            self.stdout.write(f'Result: {result}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating trade_players table: {str(e)}'))

