"""
WSGI config for rugby_fantasy project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rugby_fantasy.settings')

application = get_wsgi_application()
