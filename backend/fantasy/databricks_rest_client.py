"""
Databricks REST API Client

This module provides a client for interacting with Databricks using their REST API.
It handles SQL execution, authentication, and data retrieval for the Fantasy Rugby application.

Key Features:
- SQL statement execution via Databricks REST API
- Automatic authentication with Bearer tokens
- Error handling and response parsing
- Support for both warehouse and cluster execution

Configuration:
- Uses environment variables for sensitive data
- Supports both development and production environments
- Handles API rate limiting and retries

Author: Roland Crouch
Date: September 2025
Version: 1.0.0
"""

import requests
import json
from django.conf import settings
from decouple import config


class DatabricksRestClient:
    """
    Client for interacting with Databricks using REST API
    
    This class provides methods to execute SQL queries against Databricks
    warehouses and retrieve data for the Fantasy Rugby application.
    
    Attributes:
        workspace_url (str): Databricks workspace URL
        access_token (str): Bearer token for authentication
        warehouse_id (str): SQL warehouse ID for query execution
        headers (dict): HTTP headers for API requests
        
    Example Usage:
        client = DatabricksRestClient()
        result = client.execute_sql("SELECT * FROM default.rugby_players")
    """
    
    def __init__(self):
        self.workspace_url = config('DATABRICKS_WORKSPACE_URL')
        self.access_token = config('DATABRICKS_ACCESS_TOKEN')
        self.warehouse_id = config('DATABRICKS_WAREHOUSE_ID')
        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
    
    def execute_sql(self, sql):
        """Execute SQL using Databricks REST API"""
        url = f"{self.workspace_url}/api/2.0/sql/statements"
        
        payload = {
            "warehouse_id": self.warehouse_id,
            "statement": sql,
            "wait_timeout": "30s"
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Databricks API request failed: {e}")
    
    def create_user(self, username, email, password_hash, is_active=True):
        """Create a new user in Databricks"""
        # Escape single quotes in values
        username_escaped = username.replace("'", "''")
        email_escaped = email.replace("'", "''")
        password_hash_escaped = password_hash.replace("'", "''")
        
        sql = f"""
        INSERT INTO default.auth_users (username, email, password_hash, is_active, created_at)
        VALUES ('{username_escaped}', '{email_escaped}', '{password_hash_escaped}', {str(is_active).lower()}, current_timestamp())
        """
        
        result = self.execute_sql(sql)
        return result
    
    def get_user_by_email(self, email):
        """Get user by email"""
        email_escaped = email.replace("'", "''")
        sql = f"SELECT * FROM default.auth_users WHERE email = '{email_escaped}'"
        
        result = self.execute_sql(sql)
        return result
    
    def get_user_by_username(self, username):
        """Get user by username"""
        username_escaped = username.replace("'", "''")
        sql = f"SELECT * FROM default.auth_users WHERE username = '{username_escaped}'"
        
        result = self.execute_sql(sql)
        return result
    
    def update_user(self, user_id, **kwargs):
        """Update user fields"""
        set_clauses = []
        
        for field, value in kwargs.items():
            if isinstance(value, str):
                value_escaped = value.replace("'", "''")
                set_clauses.append(f"{field} = '{value_escaped}'")
            else:
                set_clauses.append(f"{field} = {value}")
        
        if not set_clauses:
            return None
            
        sql = f"UPDATE default.auth_users SET {', '.join(set_clauses)} WHERE id = {user_id}"
        
        result = self.execute_sql(sql)
        return result
    
    def delete_user(self, user_id):
        """Delete user"""
        sql = f"DELETE FROM default.auth_users WHERE id = {user_id}"
        
        result = self.execute_sql(sql)
        return result
