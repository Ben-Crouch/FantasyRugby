"""
Shared utilities for Fantasy Rugby API views

This module contains common functions used across multiple view modules.
"""

import time
import gzip
import json
from django.http import JsonResponse


# Simple in-memory cache for query results
query_cache = {}
CACHE_DURATION = 30  # Cache for 30 seconds


def get_cached_result(cache_key):
    """Get cached result if it exists and hasn't expired"""
    if cache_key in query_cache:
        result, timestamp = query_cache[cache_key]
        if time.time() - timestamp < CACHE_DURATION:
            return result
        else:
            del query_cache[cache_key]
    return None


def set_cached_result(cache_key, result):
    """Cache a result with current timestamp"""
    query_cache[cache_key] = (result, time.time())


def compressed_response(data, status_code=200):
    """Return a compressed JSON response"""
    try:
        # Convert data to JSON string
        json_data = json.dumps(data)
        
        # Compress the data
        compressed_data = gzip.compress(json_data.encode('utf-8'))
        
        # Create response with compressed data
        response = JsonResponse(compressed_data, safe=False)
        response['Content-Encoding'] = 'gzip'
        response['Content-Type'] = 'application/json'
        response.status_code = status_code
        
        return response
    except Exception as e:
        # Fallback to regular JSON response if compression fails
        return JsonResponse(data, status=status_code)
