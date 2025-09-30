from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import jwt
from django.conf import settings
import re
import hashlib
import secrets
from .models import AuthUser
from .databricks_rest_client import DatabricksRestClient


# JWT Settings
JWT_SECRET_KEY = getattr(settings, 'SECRET_KEY', 'your-secret-key')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_LIFETIME = timedelta(hours=1)
JWT_REFRESH_TOKEN_LIFETIME = timedelta(days=7)


def hash_password(password):
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"


def verify_password(password, hashed_password):
    """Verify password against hash"""
    try:
        salt, stored_hash = hashed_password.split(':')
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return password_hash == stored_hash
    except:
        return False


def generate_tokens(user):
    """Generate access and refresh tokens for a user"""
    now = timezone.now()
    
    # Access token payload
    access_payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'type': 'access',
        'iat': now,
        'exp': now + JWT_ACCESS_TOKEN_LIFETIME
    }
    
    # Refresh token payload
    refresh_payload = {
        'user_id': user.id,
        'type': 'refresh',
        'iat': now,
        'exp': now + JWT_REFRESH_TOKEN_LIFETIME
    }
    
    access_token = jwt.encode(access_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return access_token, refresh_token


def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Password is strong"


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    try:
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        confirm_password = request.data.get('confirm_password', '')
        
        # Validation
        if not email or not password or not confirm_password:
            return Response({
                'success': False,
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Email validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return Response({
                'success': False,
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Password confirmation
        if password != confirm_password:
            return Response({
                'success': False,
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Password strength validation
        is_strong, strength_message = validate_password_strength(password)
        if not is_strong:
            return Response({
                'success': False,
                'error': strength_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists using REST API
        try:
            client = DatabricksRestClient()
            
            # Check if user exists by email
            existing_user = client.get_user_by_email(email)
            if existing_user and 'result' in existing_user and existing_user['result'].get('data_array'):
                return Response({
                    'success': False,
                    'error': 'User with this email already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user exists by username
            existing_user = client.get_user_by_username(email)
            if existing_user and 'result' in existing_user and existing_user['result'].get('data_array'):
                return Response({
                    'success': False,
                    'error': 'User with this email already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user using REST API
            result = client.create_user(
                username=email,
                email=email,
                password_hash=hash_password(password),
                is_active=True
            )
            
            # Get the created user
            user_data = client.get_user_by_email(email)
            if not user_data or 'result' not in user_data or not user_data['result'].get('data_array'):
                return Response({
                    'success': False,
                    'error': 'Failed to retrieve created user'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Create a mock user object for token generation
            user_row = user_data['result']['data_array'][0]
            class MockUser:
                def __init__(self, user_data):
                    self.id = user_data[0]  # Assuming first column is ID
                    self.username = user_data[1]  # Assuming second column is username
                    self.email = user_data[2]  # Assuming third column is email
            
            user = MockUser(user_row)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to create user: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user)
        
        return Response({
            'success': True,
            'message': 'User registered successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Registration failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login endpoint"""
    try:
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        
        if not email or not password:
            return Response({
                'success': False,
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user using REST API
        try:
            client = DatabricksRestClient()
            user_data = client.get_user_by_email(email)
            
            if not user_data or 'result' not in user_data or not user_data['result'].get('data_array'):
                return Response({
                    'success': False,
                    'error': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Create a mock user object
            user_row = user_data['result']['data_array'][0]
            class MockUser:
                def __init__(self, user_data):
                    self.id = user_data[0]  # Assuming first column is ID
                    self.username = user_data[1]  # Assuming second column is username
                    self.email = user_data[2]  # Assuming third column is email
                    self.password_hash = user_data[3]  # Assuming fourth column is password_hash
                    self.is_active = user_data[4]  # Assuming fifth column is is_active
            
            user = MockUser(user_row)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Database error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Verify password
        if not verify_password(password, user.password_hash):
            return Response({
                'success': False,
                'error': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({
                'success': False,
                'error': 'Account is disabled'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user)
        
        return Response({
            'success': True,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Login failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh access token endpoint"""
    try:
        refresh_token = request.data.get('refresh_token', '')
        
        if not refresh_token:
            return Response({
                'success': False,
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Decode refresh token
        try:
            payload = jwt.decode(refresh_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return Response({
                'success': False,
                'error': 'Refresh token has expired'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({
                'success': False,
                'error': 'Invalid refresh token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if payload.get('type') != 'refresh':
            return Response({
                'success': False,
                'error': 'Invalid token type'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get user from Databricks using REST API
        try:
            client = DatabricksRestClient()
            user_data = client.execute_sql(f"SELECT * FROM default.auth_users WHERE id = {payload['user_id']}")
            
            if not user_data or 'result' not in user_data or not user_data['result'].get('data_array'):
                return Response({
                    'success': False,
                    'error': 'User not found'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Create a mock user object
            user_row = user_data['result']['data_array'][0]
            class MockUser:
                def __init__(self, user_data):
                    self.id = user_data[0]
                    self.username = user_data[1]
                    self.email = user_data[2]
                    self.is_active = user_data[4]
            
            user = MockUser(user_row)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': 'User lookup failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Generate new access token
        access_token, _ = generate_tokens(user)
        
        return Response({
            'success': True,
            'access_token': access_token
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Token refresh failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def verify_token(request):
    """Verify access token endpoint"""
    try:
        # Get token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return Response({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        
        # Decode token
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return Response({
                'success': False,
                'error': 'Token has expired'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({
                'success': False,
                'error': 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if payload.get('type') != 'access':
            return Response({
                'success': False,
                'error': 'Invalid token type'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get user from Databricks using REST API
        try:
            client = DatabricksRestClient()
            user_data = client.execute_sql(f"SELECT * FROM default.auth_users WHERE id = {payload['user_id']}")
            
            if not user_data or 'result' not in user_data or not user_data['result'].get('data_array'):
                return Response({
                    'success': False,
                    'error': 'User not found'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Create a mock user object
            user_row = user_data['result']['data_array'][0]
            class MockUser:
                def __init__(self, user_data):
                    self.id = user_data[0]
                    self.username = user_data[1]
                    self.email = user_data[2]
                    self.is_active = user_data[4]
            
            user = MockUser(user_row)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': 'User lookup failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Token verification failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def logout(request):
    """User logout endpoint"""
    # For JWT tokens, logout is handled client-side by removing tokens
    # In a more complex system, you might maintain a blacklist of tokens
    return Response({
        'success': True,
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)
