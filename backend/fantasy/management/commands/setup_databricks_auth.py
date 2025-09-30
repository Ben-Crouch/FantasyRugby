from django.core.management.base import BaseCommand
from fantasy.databricks_client import DatabricksClient


class Command(BaseCommand):
    help = 'Set up Databricks tables for user authentication and leagues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-connection',
            action='store_true',
            help='Test the connection to Databricks before creating tables',
        )

    def handle(self, *args, **options):
        client = DatabricksClient()
        
        if options['test_connection']:
            self.stdout.write("Testing Databricks connection...")
            if client.test_connection():
                self.stdout.write(self.style.SUCCESS('✓ Databricks connection successful'))
            else:
                self.stdout.write(self.style.ERROR('✗ Databricks connection failed'))
                return
        
        self.stdout.write("Creating Databricks tables for authentication and leagues...")
        
        if client.create_authentication_and_league_tables():
            self.stdout.write(self.style.SUCCESS('✓ All tables created successfully'))
        else:
            self.stdout.write(self.style.ERROR('✗ Failed to create some tables'))
            return
        
        self.stdout.write("Databricks authentication and league setup completed!")
