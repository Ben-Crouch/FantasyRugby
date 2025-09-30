# 🏉 Fantasy Rugby Application

A comprehensive fantasy rugby management system built with Django REST API backend and React frontend, featuring real-time player data, league management, and draft functionality.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Fantasy Rugby is a full-stack web application that allows users to create and manage fantasy rugby leagues. Users can create leagues, join existing ones, draft players, and manage their teams throughout the season. The application integrates with Databricks for data storage and provides a modern, responsive user interface.

### Key Capabilities

- **League Management**: Create, join, and manage fantasy rugby leagues
- **Player Database**: Access to comprehensive rugby player statistics
- **Draft System**: Snake draft functionality for team building
- **Team Management**: Build and manage fantasy teams
- **User Authentication**: Secure JWT-based authentication system
- **Admin Controls**: League administrators can manage drafts and settings

## ✨ Features

### 🏆 League Management
- Create custom leagues with configurable settings
- Join public or private leagues
- Set maximum teams and players per team
- League visibility controls (public/private)

### 👥 Team Management
- Create and manage fantasy teams
- Join multiple leagues
- Track team performance
- Team statistics and analytics

### 🎯 Draft System
- Snake draft functionality
- Real-time draft updates
- Player selection interface
- Draft order management

### 📊 Player Database
- Comprehensive rugby player statistics
- Player search and filtering
- Position-based categorization
- Performance metrics

### 🔐 Authentication & Security
- JWT token-based authentication
- User registration and login
- Password security
- Session management

## 🛠 Technology Stack

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Local database for authentication
- **Databricks** - Data warehouse for application data
- **JWT** - Authentication tokens
- **Python 3.13** - Programming language

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling framework
- **JavaScript ES6+** - Programming language

### Data & Infrastructure
- **Databricks** - Cloud data platform
- **REST API** - Service communication
- **CORS** - Cross-origin resource sharing
- **Environment Variables** - Configuration management

## 📁 Project Structure

```
Rugby Fantasy/
├── backend/                    # Django backend application
│   ├── fantasy/               # Main Django app
│   │   ├── __init__.py
│   │   ├── admin.py           # Django admin configuration
│   │   ├── admin_views.py     # Admin-specific API views
│   │   ├── authentication.py # Authentication utilities
│   │   ├── databricks_client.py # Databricks integration
│   │   ├── databricks_rest_client.py # REST API client
│   │   ├── models.py          # Database models
│   │   ├── rest_views.py      # Main API endpoints
│   │   ├── serializers.py     # Data serialization
│   │   ├── urls.py           # URL routing
│   │   └── views.py          # Additional views
│   ├── rugby_fantasy/        # Django project settings
│   │   ├── __init__.py
│   │   ├── settings.py       # Django configuration
│   │   ├── urls.py          # Main URL routing
│   │   └── wsgi.py          # WSGI configuration
│   ├── manage.py             # Django management script
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Virtual environment
├── frontend/                  # React frontend application
│   ├── public/               # Static files
│   │   └── index.html        # Main HTML template
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   │   ├── FantasyTeam.js
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── Navbar.js
│   │   │   ├── Navigation.js
│   │   │   ├── PlayerList.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── TeamList.js
│   │   ├── contexts/         # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── pages/            # Page components
│   │   │   ├── Draft.js
│   │   │   ├── LeagueDashboard.js
│   │   │   ├── LeagueSelection.js
│   │   │   ├── Login.js
│   │   │   ├── MyLeagues.js
│   │   │   └── Register.js
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── App.js            # Main App component
│   │   ├── App.css           # App styles
│   │   └── index.js          # Entry point
│   ├── package.json          # Node.js dependencies
│   └── package-lock.json     # Dependency lock file
├── Archive/                   # Archived data and files
└── README.md                 # This file
```

## 🚀 Setup & Installation

### Prerequisites

- Python 3.13+
- Node.js 16+
- npm or yarn
- PostgreSQL
- Databricks account

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ben-Crouch/FantasyRugby.git
   cd FantasyRugby
   ```

2. **Set up Python virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DATABRICKS_WORKSPACE_URL=your_workspace_url
   DATABRICKS_ACCESS_TOKEN=your_access_token
   DATABRICKS_WAREHOUSE_ID=your_warehouse_id
   SECRET_KEY=your_django_secret_key
   DEBUG=True
   ```

5. **Set up database**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run the backend server**
   ```bash
   python manage.py runserver 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register/
Register a new user
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### POST /api/auth/login/
Login user
```json
{
  "email": "string",
  "password": "string"
}
```

#### POST /api/auth/logout/
Logout user

### League Endpoints

#### GET /api/user-leagues/
Get all available leagues

#### POST /api/user-leagues/
Create a new league
```json
{
  "name": "string",
  "description": "string",
  "max_teams": 6,
  "is_public": true,
  "user_id": "string"
}
```

#### POST /api/user-leagues/{league_id}/join_league/
Join a league
```json
{
  "team_name": "string",
  "user_id": "string"
}
```

### Team Endpoints

#### GET /api/league-teams/
Get all teams

#### POST /api/league-teams/
Create a new team

### Player Endpoints

#### GET /api/rugby-players/
Get all rugby players

### Admin Endpoints

#### GET /api/admin/leagues/{league_id}/users/{user_id}/is-admin/
Check if user is league admin

## 🎨 Frontend Components

### Core Components

- **App.js** - Main application component with routing
- **Navigation.js** - Navigation bar with user controls
- **LoadingSpinner.js** - Loading indicator component

### Page Components

- **Login.js** - User authentication page
- **Register.js** - User registration page
- **LeagueSelection.js** - League creation and joining
- **LeagueDashboard.js** - League overview and management
- **Draft.js** - Player draft interface
- **MyLeagues.js** - User's league management

### Context Providers

- **AuthContext.js** - User authentication state management
- **ThemeContext.js** - Application theming

## 🗄 Database Schema

### Databricks Tables

#### user_created_leagues
- `id` (string) - Primary key
- `name` (string) - League name
- `description` (string) - League description
- `created_by_user_id` (string) - Creator user ID
- `max_teams` (int) - Maximum teams allowed
- `max_players_per_team` (int) - Players per team (fixed at 15)
- `is_public` (boolean) - Public visibility
- `created_at` (timestamp) - Creation timestamp

#### league_teams
- `id` (string) - Primary key
- `league_id` (string) - Foreign key to leagues
- `team_name` (string) - Team name
- `user_id` (string) - Team owner user ID
- `created_at` (timestamp) - Creation timestamp

#### rugby_players
- `id` (string) - Primary key
- `name` (string) - Player name
- `position` (string) - Player position
- `team` (string) - Current team
- `stats` (json) - Player statistics

### PostgreSQL Tables (Django)

- `auth_user` - Django user authentication
- `django_session` - Session management
- `django_migrations` - Migration tracking

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
DATABRICKS_WORKSPACE_URL=https://your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your_personal_access_token
DATABRICKS_WAREHOUSE_ID=your_warehouse_id
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### Frontend
The frontend uses environment variables for API configuration:
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)

### CORS Configuration

The backend is configured to allow requests from the frontend development server:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py runserver 8000
   ```

2. **Start the frontend server**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/

### Production Deployment

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Collect static files**
   ```bash
   cd backend
   python manage.py collectstatic
   ```

3. **Run migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start the production server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## 🧪 Testing

### Backend Testing
```bash
cd backend
python manage.py test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📈 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced player statistics
- [ ] League standings and rankings
- [ ] Mobile application
- [ ] Social features and chat
- [ ] Player trade functionality
- [ ] League playoffs and championships
- [ ] Advanced analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Roland Crouch**
- GitHub: [@rolandcrouch](https://github.com/rolandcrouch)
- Email: [your-email@example.com]

## 🙏 Acknowledgments

- Databricks for data platform services
- Django and React communities
- Rugby data providers
- Open source contributors

---

**Built with ❤️ for rugby fans everywhere**