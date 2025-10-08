"""
Tournament management views for Fantasy Rugby API

This module handles all tournament-related operations including:
- Retrieving tournaments
- Tournament data management
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..databricks_rest_client import DatabricksRestClient
from .utils import get_cached_result, set_cached_result


@api_view(['GET'])
@permission_classes([AllowAny])
def tournaments(request):
    """
    Get all active tournaments
    
    Returns:
        List of tournaments with their details
    """
    try:
        client = DatabricksRestClient()
        
        cache_key = 'tournaments'
        cached_result = get_cached_result(cache_key)
        if cached_result:
            return Response(cached_result)
        
        # Query tournaments table with existing columns
        sql = "SELECT Tournamen_ID, Tournament FROM default.tournaments ORDER BY Tournament"
        result = client.execute_sql(sql)
        
        if result and 'result' in result and 'data_array' in result['result']:
            tournaments_data = []
            for row in result['result']['data_array']:
                tournaments_data.append({
                    'id': row[0],
                    'name': row[1],
                    'description': f'Fantasy league for {row[1]}',  # Dummy description
                    'start_date': '2025-01-01',  # Dummy date
                    'end_date': '2025-12-31',    # Dummy date
                    'is_active': True,
                    'created_at': '2025-01-01T00:00:00Z'
                })
            
            set_cached_result(cache_key, tournaments_data)
            
            return Response(tournaments_data)
        else:
            return Response([])
            
    except Exception as e:
        import traceback
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

