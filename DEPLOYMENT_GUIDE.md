# 🚀 Fantasy Rugby Deployment Guide

This guide covers deploying the Fantasy Rugby application to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Security Considerations](#security-considerations)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

## ✅ Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended) or macOS
- **Python**: 3.8+ (3.13 recommended)
- **Node.js**: 16+ (18+ recommended)
- **PostgreSQL**: 12+ (14+ recommended)
- **Memory**: 2GB+ RAM
- **Storage**: 10GB+ available space

### External Services
- **Databricks**: Active workspace with SQL warehouse
- **Domain**: Registered domain name (optional)
- **SSL Certificate**: For HTTPS (recommended)

## 🐍 Backend Deployment

### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install additional dependencies
sudo apt install git curl wget -y
```

### 2. Application Setup

```bash
# Clone the repository
git clone https://github.com/Ben-Crouch/FantasyRugby.git
cd FantasyRugby

# Create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install production dependencies
pip install gunicorn psycopg2-binary
```

### 3. Database Configuration

```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE fantasy_rugby;
CREATE USER fantasy_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE fantasy_rugby TO fantasy_user;
\q
```

### 4. Environment Configuration

Create `/opt/fantasy-rugby/backend/.env`:

```env
# Production Settings
DEBUG=False
SECRET_KEY=your-super-secure-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,localhost

# Database
DATABASE_URL=postgresql://fantasy_user:secure_password@localhost:5432/fantasy_rugby

# Databricks
DATABRICKS_WORKSPACE_URL=https://your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your_production_token
DATABRICKS_WAREHOUSE_ID=your_production_warehouse_id

# Security
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 5. Django Configuration

```bash
# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser
```

### 6. Gunicorn Configuration

Create `/opt/fantasy-rugby/backend/gunicorn.conf.py`:

```python
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
```

### 7. Systemd Service

Create `/etc/systemd/system/fantasy-rugby.service`:

```ini
[Unit]
Description=Fantasy Rugby Django Application
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/fantasy-rugby/backend
Environment=PATH=/opt/fantasy-rugby/backend/venv/bin
ExecStart=/opt/fantasy-rugby/backend/venv/bin/gunicorn --config gunicorn.conf.py rugby_fantasy.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable fantasy-rugby
sudo systemctl start fantasy-rugby
sudo systemctl status fantasy-rugby
```

## ⚛️ Frontend Deployment

### 1. Build Application

```bash
cd frontend

# Install dependencies
npm install

# Create production environment file
echo "REACT_APP_API_URL=https://api.yourdomain.com" > .env.production

# Build for production
npm run build
```

### 2. Nginx Configuration

Create `/etc/nginx/sites-available/fantasy-rugby`:

```nginx
# Upstream for Django backend
upstream django_backend {
    server 127.0.0.1:8000;
}

# Main server block
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API routes
    location /api/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Static files
    location /static/ {
        alias /opt/fantasy-rugby/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # React app
    location / {
        root /opt/fantasy-rugby/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 3. Enable Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/fantasy-rugby /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🗄️ Database Setup

### PostgreSQL Optimization

Edit `/etc/postgresql/14/main/postgresql.conf`:

```conf
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100

# Logging
log_statement = 'mod'
log_min_duration_statement = 1000
```

### Database Backup

Create `/opt/fantasy-rugby/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/fantasy-rugby/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="fantasy_rugby"

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U fantasy_user $DB_NAME > $BACKUP_DIR/fantasy_rugby_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/fantasy_rugby_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: fantasy_rugby_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /opt/fantasy-rugby/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /opt/fantasy-rugby/backup.sh
```

## 🔧 Environment Configuration

### Production Environment Variables

#### Backend (.env)
```env
# Django
DEBUG=False
SECRET_KEY=your-super-secure-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://fantasy_user:secure_password@localhost:5432/fantasy_rugby

# Databricks
DATABRICKS_WORKSPACE_URL=https://your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your_production_token
DATABRICKS_WAREHOUSE_ID=your_production_warehouse_id

# Security
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECURE_SSL_REDIRECT=True
SECURE_PROXY_SSL_HEADER=('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

#### Frontend (.env.production)
```env
REACT_APP_API_URL=https://api.yourdomain.com
GENERATE_SOURCEMAP=false
```

## 🔒 Security Considerations

### 1. SSL/TLS Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. Database Security

```sql
-- Create read-only user for reporting
CREATE USER fantasy_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE fantasy_rugby TO fantasy_readonly;
GRANT USAGE ON SCHEMA public TO fantasy_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO fantasy_readonly;
```

### 4. Application Security

```python
# In settings.py
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

## 📊 Monitoring & Logging

### 1. Application Logs

```bash
# View Django logs
sudo journalctl -u fantasy-rugby -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Database Monitoring

```bash
# Monitor database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Monitor database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('fantasy_rugby'));"
```

### 3. System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop
iotop
nethogs
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check service status
sudo systemctl status fantasy-rugby

# Check logs
sudo journalctl -u fantasy-rugby -n 50

# Check configuration
sudo nginx -t
```

#### 2. Database Connection Issues
```bash
# Test database connection
sudo -u postgres psql -c "SELECT version();"

# Check database exists
sudo -u postgres psql -l | grep fantasy_rugby
```

#### 3. Static Files Not Loading
```bash
# Check static files
ls -la /opt/fantasy-rugby/backend/staticfiles/

# Collect static files
cd /opt/fantasy-rugby/backend
source venv/bin/activate
python manage.py collectstatic --noinput
```

#### 4. CORS Issues
```bash
# Check CORS settings
grep -r "CORS" /opt/fantasy-rugby/backend/

# Verify allowed origins
python manage.py shell
>>> from django.conf import settings
>>> print(settings.CORS_ALLOWED_ORIGINS)
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_league_teams_league_id ON league_teams(league_id);
CREATE INDEX idx_league_teams_user_id ON league_teams(user_id);
CREATE INDEX idx_user_created_leagues_created_by ON user_created_leagues(created_by_user_id);
```

#### 2. Caching
```python
# Add to settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

#### 3. CDN Configuration
```nginx
# Add to Nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (HAProxy, Nginx)
- Multiple application servers
- Database read replicas
- Redis for session storage

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

---

**Last Updated**: September 2025  
**Version**: 1.0.0  
**Author**: Roland Crouch
