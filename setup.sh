#!/bin/bash

# Fantasy Rugby Application Setup Script
# This script sets up the complete development environment for the Fantasy Rugby application
# 
# Author: Roland Crouch
# Date: September 2025
# Version: 1.0.0

set -e  # Exit on any error

echo "🏉 Fantasy Rugby Application Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 is required but not installed. Please install Python 3.8+ and try again."
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js is required but not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION found"
    else
        print_error "npm is required but not installed. Please install npm and try again."
        exit 1
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up Django backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning "Creating .env file template..."
        cat > .env << EOF
# Databricks Configuration
DATABRICKS_WORKSPACE_URL=your_workspace_url_here
DATABRICKS_ACCESS_TOKEN=your_access_token_here
DATABRICKS_WAREHOUSE_ID=your_warehouse_id_here

# Django Configuration
SECRET_KEY=your_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/fantasy_rugby
EOF
        print_warning "Please update the .env file with your actual configuration values."
    fi
    
    # Run Django migrations
    print_status "Running Django migrations..."
    python manage.py migrate
    
    # Create superuser (optional)
    print_status "Creating Django superuser..."
    echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" | python manage.py shell 2>/dev/null || print_warning "Superuser may already exist or creation failed"
    
    print_success "Backend setup complete!"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up React frontend..."
    
    cd frontend
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    print_success "Frontend setup complete!"
    cd ..
}

# Create environment files
create_env_files() {
    print_status "Creating environment configuration files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
# Databricks Configuration
DATABRICKS_WORKSPACE_URL=https://your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your_personal_access_token
DATABRICKS_WAREHOUSE_ID=your_warehouse_id

# Django Configuration
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/fantasy_rugby
EOF
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api
EOF
    fi
    
    print_success "Environment files created!"
}

# Main setup function
main() {
    echo "Starting Fantasy Rugby application setup..."
    echo ""
    
    # Check prerequisites
    check_python
    check_node
    check_npm
    echo ""
    
    # Create environment files
    create_env_files
    echo ""
    
    # Setup backend
    setup_backend
    echo ""
    
    # Setup frontend
    setup_frontend
    echo ""
    
    # Final instructions
    print_success "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with your Databricks credentials"
    echo "2. Start the backend server:"
    echo "   cd backend && source venv/bin/activate && python manage.py runserver 8000"
    echo ""
    echo "3. In a new terminal, start the frontend server:"
    echo "   cd frontend && npm start"
    echo ""
    echo "4. Open http://localhost:3000 in your browser"
    echo ""
    echo "Default admin credentials:"
    echo "   Username: admin"
    echo "   Email: admin@example.com"
    echo "   Password: admin123"
    echo ""
    print_success "Happy coding! 🏉"
}

# Run main function
main "$@"
