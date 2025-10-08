from django.core.management.base import BaseCommand
from fantasy.databricks_client import DatabricksClient
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Populate tournaments table with sample data'

    def handle(self, *args, **options):
        client = DatabricksClient()
        
        # Sample tournaments data
        tournaments = [
            {
                'name': 'Six Nations 2025',
                'description': 'The annual Six Nations Championship featuring England, France, Ireland, Italy, Scotland, and Wales',
                'start_date': '2025-02-01',
                'end_date': '2025-03-15',
                'is_active': True
            },
            {
                'name': 'Rugby World Cup 2025',
                'description': 'The 2025 Rugby World Cup featuring the best teams from around the world',
                'start_date': '2025-09-08',
                'end_date': '2025-10-25',
                'is_active': True
            },
            {
                'name': 'Premiership Rugby 2024-25',
                'description': 'English Premiership Rugby season 2024-25',
                'start_date': '2024-10-12',
                'end_date': '2025-06-14',
                'is_active': True
            },
            {
                'name': 'Champions Cup 2024-25',
                'description': 'European Rugby Champions Cup featuring top clubs from across Europe',
                'start_date': '2024-12-08',
                'end_date': '2025-05-24',
                'is_active': True
            },
            {
                'name': 'U20 Six Nations 2025',
                'description': 'Under-20 Six Nations Championship',
                'start_date': '2025-02-01',
                'end_date': '2025-03-15',
                'is_active': True
            }
        ]
        
        try:
            # Insert tournaments
            for tournament in tournaments:
                sql = f"""
                INSERT INTO default.tournaments (name, description, start_date, end_date, is_active, created_at)
                VALUES ('{tournament['name']}', '{tournament['description']}', '{tournament['start_date']}', '{tournament['end_date']}', {tournament['is_active']}, CURRENT_TIMESTAMP)
                """
                
                result = client.execute_sql(sql)
                if result and 'status' in result and result['status'].get('state') == 'SUCCEEDED':
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully created tournament: {tournament["name"]}')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to create tournament: {tournament["name"]}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS('Successfully populated tournaments table')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error populating tournaments: {str(e)}')
            )

