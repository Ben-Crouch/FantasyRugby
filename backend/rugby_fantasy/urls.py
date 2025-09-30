"""
URL configuration for rugby_fantasy project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('fantasy.urls')),
]