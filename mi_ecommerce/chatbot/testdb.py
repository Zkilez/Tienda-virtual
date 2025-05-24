from django.http import JsonResponse
from django.db import connection

def test_connection(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM smartphones LIMIT 5")
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return JsonResponse({
            "status": "success",
            "data": results,
            "database": connection.settings_dict['NAME']
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": str(e),
            "database": connection.settings_dict['NAME']
        }, status=500)