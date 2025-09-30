# 🏉 Fantasy Rugby API Documentation

This document provides comprehensive documentation for the Fantasy Rugby REST API endpoints.

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Leagues](#league-endpoints)
  - [Teams](#team-endpoints)
  - [Players](#player-endpoints)
  - [Admin](#admin-endpoints)
- [Data Models](#data-models)
- [Examples](#examples)

## 🌐 Base URL

```
http://localhost:8000/api
```

## 🔐 Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

1. Register a new user: `POST /auth/register/`
2. Login: `POST /auth/login/`
3. Use the returned `access_token` in subsequent requests

## ⚠️ Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a descriptive message:

```json
{
  "error": "User ID is required to create a league"
}
```

## 🔗 Endpoints

### Authentication Endpoints

#### POST /auth/register/
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### POST /auth/login/
Login with email and password.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### POST /auth/logout/
Logout the current user.

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

#### GET /auth/verify/
Verify the current user's token.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### League Endpoints

#### GET /user-leagues/
Get all available leagues.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Premier League",
    "description": "A competitive fantasy rugby league",
    "created_by": "4",
    "max_teams": "6",
    "max_players_per_team": "15",
    "is_public": "true",
    "created_at": "2025-09-29T16:30:00Z"
  }
]
```

#### POST /user-leagues/
Create a new league.

**Request Body:**
```json
{
  "name": "My League",
  "description": "A fun fantasy rugby league",
  "max_teams": 6,
  "is_public": true,
  "user_id": "4"
}
```

**Response:**
```json
{
  "id": "2",
  "name": "My League",
  "description": "A fun fantasy rugby league",
  "created_by": "4",
  "max_teams": "6",
  "max_players_per_team": "15",
  "is_public": "true",
  "created_at": "2025-09-29T16:30:00Z"
}
```

#### POST /user-leagues/{league_id}/join_league/
Join an existing league.

**Request Body:**
```json
{
  "team_name": "My Team",
  "user_id": "4"
}
```

**Response:**
```json
{
  "status": "Successfully joined league"
}
```

### Team Endpoints

#### GET /league-teams/
Get all teams.

**Response:**
```json
[
  {
    "id": "1",
    "league_id": "1",
    "team_name": "Team Alpha",
    "user_id": "4",
    "created_at": "2025-09-29T16:30:00Z"
  }
]
```

#### POST /league-teams/
Create a new team.

**Request Body:**
```json
{
  "league_id": "1",
  "team_name": "My Team",
  "user_id": "4"
}
```

**Response:**
```json
{
  "id": "2",
  "league_id": "1",
  "team_name": "My Team",
  "user_id": "4",
  "created_at": "2025-09-29T16:30:00Z"
}
```

### Player Endpoints

#### GET /rugby-players/
Get all rugby players.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Marcus Smith",
    "position": "Fly-half",
    "team": "Harlequins",
    "stats": {
      "points": 150,
      "tries": 5,
      "conversions": 20
    }
  }
]
```

### Admin Endpoints

#### GET /admin/leagues/{league_id}/users/{user_id}/is-admin/
Check if a user is the admin of a specific league.

**Response:**
```json
{
  "is_admin": true,
  "league_admin_id": "4",
  "user_id": "4"
}
```

## 📊 Data Models

### User
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "password": "string (hashed)"
}
```

### League
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "created_by_user_id": "string",
  "max_teams": "integer",
  "max_players_per_team": "integer (fixed at 15)",
  "is_public": "boolean",
  "created_at": "timestamp"
}
```

### Team
```json
{
  "id": "string",
  "league_id": "string",
  "team_name": "string",
  "user_id": "string",
  "created_at": "timestamp"
}
```

### Player
```json
{
  "id": "string",
  "name": "string",
  "position": "string",
  "team": "string",
  "stats": "object"
}
```

## 💡 Examples

### Complete User Flow

1. **Register a new user:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

3. **Create a league:**
```bash
curl -X POST http://localhost:8000/api/user-leagues/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Fantasy League",
    "description": "A great league for friends",
    "max_teams": 6,
    "is_public": true,
    "user_id": "1"
  }'
```

4. **Join the league:**
```bash
curl -X POST http://localhost:8000/api/user-leagues/1/join_league/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "team_name": "My Team",
    "user_id": "1"
  }'
```

5. **Get all leagues:**
```bash
curl -X GET http://localhost:8000/api/user-leagues/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Configuration

### Environment Variables

The API requires the following environment variables:

```env
# Databricks Configuration
DATABRICKS_WORKSPACE_URL=https://your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your_personal_access_token
DATABRICKS_WAREHOUSE_ID=your_warehouse_id

# Django Configuration
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### CORS Configuration

The API is configured to allow requests from:
- `http://localhost:3000` (React development server)
- `http://127.0.0.1:3000`

## 📝 Notes

- All timestamps are in ISO 8601 format
- User IDs are strings in the API responses
- League and team IDs are also strings
- The `max_players_per_team` is fixed at 15 for all leagues
- All endpoints return JSON responses
- Error responses include descriptive error messages

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that your JWT token is valid and included in the Authorization header
2. **400 Bad Request**: Verify that all required fields are provided and have correct data types
3. **500 Internal Server Error**: Check the server logs for detailed error information
4. **CORS errors**: Ensure the frontend is running on the correct port (3000)

### Debug Mode

Enable debug mode by setting `DEBUG=True` in your environment variables to get more detailed error messages.

---

**Last Updated**: September 2025  
**API Version**: 1.0.0  
**Author**: Roland Crouch
