class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print(f"Processing request: {request.method} {request.path}")
        response = self.get_response(request)
        
        print(f"Before adding CORS headers: {response.headers}")
        # Headers CORS
        response["Access-Control-Allow-Origin"] = "http://localhost:5173"  # Especifica el origen del frontend
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-CSRFToken, Accept, Origin"
        response["Access-Control-Allow-Credentials"] = "true"
        
        if request.method == "OPTIONS":
            print("Handling OPTIONS request")
            response.status_code = 200
            response.content = b""
        
        print(f"After adding CORS headers: {response.headers}")
        return response