swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "LibStock API",
        "description": "API for managing containers, categories, and items in a personal library/inventory system",
        "version": "1.0.0",
        "contact": {
            "name": "LibStock",
            "url": "https://github.com/your-username/libstock"
        }
    },
    "host": "localhost:5000",
    "basePath": "/api",
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Example: 'Authorization: Bearer {token}'"
        },
        "Session": {
            "type": "apiKey",
            "name": "session",
            "in": "cookie",
            "description": "Flask session cookie"
        }
    },
    "security": [
        {"Bearer": []},
        {"Session": []}
    ],
    "tags": [
        {
            "name": "User",
            "description": "User operations"
        },
        {
            "name": "Containers",
            "description": "Container management"
        },
        {
            "name": "Categories",
            "description": "Category management within containers"
        },
        {
            "name": "Items",
            "description": "Item management within containers"
        },
        {
            "name": "Media",
            "description": "File upload and retrieval"
        }
    ]
}

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/docs"
}