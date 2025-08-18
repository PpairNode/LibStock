from __main__ import app
from flask import jsonify

@app.route("/api")
def hello():
    print("Route triggered: hello")
    return jsonify({
        "message": "Hello from Flask!",
        "status": "OK"
    }), 200
