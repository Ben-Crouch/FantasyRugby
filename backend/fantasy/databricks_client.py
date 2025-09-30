import requests
import json
from django.conf import settings
from typing import Dict, List, Optional, Any


class DatabricksClient:
    """
    Client for interacting with Databricks REST API and SQL endpoints.
    """
    
    def __init__(self):
        self.workspace_url = settings.DATABRICKS_WORKSPACE_URL
        self.access_token = settings.DATABRICKS_ACCESS_TOKEN
        self.cluster_id = getattr(settings, 'DATABRICKS_CLUSTER_ID', None)
        self.warehouse_id = settings.DATABRICKS_WAREHOUSE_ID
        
        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make a request to Databricks API."""
        # Ensure workspace URL doesn't have trailing slash
        base_url = self.workspace_url.rstrip('/')
        url = f"{base_url}/api/2.0/{endpoint}"
        
        try:
            print(f"Making request to: {url}")
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=self.headers, json=data)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=self.headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            print(f"Response status: {response.status_code}")
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Databricks API request failed: {e}")
            print(f"URL was: {url}")
            return None
    
    def execute_sql(self, sql: str) -> Optional[List[Dict]]:
        """Execute SQL query using Databricks SQL endpoint."""
        endpoint = f"sql/statements"
        data = {
            "warehouse_id": self.warehouse_id,
            "statement": sql,
            "wait_timeout": "30s"
        }
        
        result = self._make_request('POST', endpoint, data)
        if result and 'result' in result:
            return result['result'].get('data_array', [])
        return None
    
    def execute_sql_simple(self, sql: str) -> bool:
        """Execute SQL query with simple success/failure response."""
        endpoint = f"sql/statements"
        data = {
            "warehouse_id": self.warehouse_id,
            "statement": sql,
            "wait_timeout": "30s"
        }
        
        result = self._make_request('POST', endpoint, data)
        return result is not None
    
    def create_table(self, table_name: str, schema: Dict[str, str]) -> bool:
        """Create a table in Databricks."""
        columns = []
        for column_name, column_type in schema.items():
            columns.append(f"{column_name} {column_type}")
        
        sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {', '.join(columns)}
        ) USING DELTA
        """
        
        return self.execute_sql_simple(sql)
    
    def insert_data(self, table_name: str, data: List[Dict]) -> bool:
        """Insert data into a Databricks table."""
        if not data:
            return True
        
        # Get column names from first record
        columns = list(data[0].keys())
        
        # Build VALUES clause
        values_list = []
        for record in data:
            values = []
            for col in columns:
                value = record.get(col)
                if value is None:
                    values.append('NULL')
                elif isinstance(value, str):
                    values.append(f"'{value.replace("'", "''")}'")
                else:
                    values.append(str(value))
            values_list.append(f"({', '.join(values)})")
        
        sql = f"""
        INSERT INTO {table_name} ({', '.join(columns)})
        VALUES {', '.join(values_list)}
        """
        
        result = self.execute_sql(sql)
        return result is not None
    
    def get_table_schema(self, table_name: str) -> Optional[List[Dict]]:
        """Get the schema of a table."""
        sql = f"DESCRIBE {table_name}"
        return self.execute_sql(sql)
    
    def query_table(self, table_name: str, filters: Optional[Dict] = None, limit: Optional[int] = None) -> Optional[List[Dict]]:
        """Query data from a table."""
        sql = f"SELECT * FROM {table_name}"
        
        if filters:
            conditions = []
            for column, value in filters.items():
                if isinstance(value, str):
                    conditions.append(f"{column} = '{value}'")
                else:
                    conditions.append(f"{column} = {value}")
            sql += f" WHERE {' AND '.join(conditions)}"
        
        if limit:
            sql += f" LIMIT {limit}"
        
        return self.execute_sql(sql)
    
    def create_authentication_and_league_tables(self) -> bool:
        """Create all necessary tables for authentication and user leagues."""
        tables_created = True
        
        # Create auth_users table (for authentication)
        schema = {
            'id': 'BIGINT GENERATED ALWAYS AS IDENTITY',
            'username': 'STRING',
            'email': 'STRING',
            'password_hash': 'STRING',
            'is_active': 'BOOLEAN',
            'created_at': 'TIMESTAMP'
        }
        tables_created &= self.create_table('auth_users', schema)
        
        # Create user_created_leagues table
        schema = {
            'id': 'BIGINT GENERATED ALWAYS AS IDENTITY',
            'name': 'STRING',
            'description': 'STRING',
            'created_by_user_id': 'BIGINT',
            'max_teams': 'INT',
            'max_players_per_team': 'INT',
            'is_public': 'BOOLEAN',
            'created_at': 'TIMESTAMP'
        }
        tables_created &= self.create_table('user_created_leagues', schema)
        
        # Create league_teams table
        schema = {
            'id': 'BIGINT GENERATED ALWAYS AS IDENTITY',
            'league_id': 'BIGINT',
            'team_name': 'STRING',
            'team_owner_user_id': 'BIGINT',
            'created_at': 'TIMESTAMP'
        }
        tables_created &= self.create_table('league_teams', schema)
        
        # Create league_team_players table
        schema = {
            'id': 'BIGINT GENERATED ALWAYS AS IDENTITY',
            'league_team_id': 'BIGINT',
            'player_id': 'BIGINT',
            'position': 'STRING',
            'added_at': 'TIMESTAMP'
        }
        tables_created &= self.create_table('league_team_players', schema)
        
        # Create fantasy_teams table
        schema = {
            'id': 'BIGINT GENERATED ALWAYS AS IDENTITY',
            'user_id': 'BIGINT',
            'name': 'STRING',
            'league_id': 'BIGINT',
            'created_at': 'TIMESTAMP'
        }
        tables_created &= self.create_table('fantasy_teams', schema)
        
        return tables_created

    def create_user_league_tables(self) -> bool:
        """Legacy method - redirects to new method"""
        return self.create_authentication_and_league_tables()
    
    def test_connection(self) -> bool:
        """Test the connection to Databricks."""
        try:
            return self.execute_sql_simple("SELECT 1 as test")
        except Exception as e:
            print(f"Databricks connection test failed: {e}")
            return False
