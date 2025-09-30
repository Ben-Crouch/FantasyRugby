# Databricks Setup Guide

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Local Database (PostgreSQL)
DB_NAME=rugby_fantasy
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Databricks Configuration
DATABRICKS_WORKSPACE_URL=https://your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your-access-token
DATABRICKS_CLUSTER_ID=your-cluster-id
DATABRICKS_WAREHOUSE_ID=your-warehouse-id

# Databricks Database Connection
DATABRICKS_DB_NAME=rugby_db
DATABRICKS_USER=your-databricks-username
DATABRICKS_PASSWORD=your-databricks-password
DATABRICKS_HOST=your-databricks-host
DATABRICKS_PORT=5432

# SportsDev API
SPORTSDEV_API_KEY=your-sportsdev-api-key
```

## Setup Steps

1. **Install required packages:**
   ```bash
   pip install python-decouple psycopg2-binary
   ```

2. **Configure your Databricks workspace:**
   - Get your workspace URL from Databricks
   - Generate an access token in Databricks
   - Get your cluster ID and warehouse ID

3. **Set up the database tables:**
   ```bash
   python manage.py setup_databricks --test-connection
   ```

4. **Run migrations for local database:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

## Database Architecture

- **Local PostgreSQL**: Django auth, sessions, admin
- **Databricks**: User-created leagues, teams, players, fantasy teams

## API Endpoints

- `/api/user-leagues/` - Manage user-created leagues
- `/api/league-teams/` - Manage teams within leagues
- `/api/fantasy-teams/` - Manage fantasy teams

## Testing Connection

```bash
python manage.py setup_databricks --test-connection
```
