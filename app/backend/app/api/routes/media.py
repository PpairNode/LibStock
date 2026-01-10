import secrets
import base64
from pathlib import Path
from flask import request, jsonify, send_from_directory
from flask_login import login_required
from werkzeug.utils import secure_filename
from app.api import api_bp
from app.utils import UPLOAD_FOLDER
from app.extensions import limiter


# File upload config
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
def allowed_rename_file(filename):
    """Generate a new secure filename with random name"""
    if '.' in filename:
        extension = filename.rsplit('.', 1)[1].lower()
        if extension in ALLOWED_EXTENSIONS:
            return secrets.token_hex() + '.' + extension
    return None


@api_bp.route('/media/<filename>')
@limiter.limit("100 per hour")
def media(filename):
    """
    Retrieve uploaded media file
    ---
    tags:
      - Media
    parameters:
      - name: filename
        in: path
        type: string
        required: true
        description: Filename of the uploaded image
        example: "a1b2c3d4e5f6.png"
    responses:
      200:
        description: File content
        content:
          image/png:
            schema:
              type: string
              format: binary
          image/jpeg:
            schema:
              type: string
              format: binary
      400:
        description: Invalid filename
      404:
        description: File not found
      429:
        description: Too many requests
    """
    try:
        safe_name = secure_filename(filename)
        if safe_name != filename:
            return jsonify({"error": "Invalid filename"}), 400
        return send_from_directory(str(Path(UPLOAD_FOLDER)), safe_name)
    except Exception as e:
        print(f"Error serving file: {e}")
        return jsonify({"error": "File not found"}), 404


@api_bp.route('/upload/image/preview', methods=['POST'])
@limiter.limit("50 per hour")  # Plus permissif car pas de sauvegarde
@login_required
def preview_image():
    """
    Convert image to base64 for preview (no server storage)
    ---
    tags:
      - Media
    security:
      - Session: []
    consumes:
      - multipart/form-data
    parameters:
      - name: image
        in: formData
        type: file
        required: true
        description: Image file to preview
    responses:
      200:
        description: Image converted to base64
        schema:
          type: object
          properties:
            image_data:
              type: string
              description: Base64 encoded image
            image_extension:
              type: string
              example: ".png"
      400:
        description: Invalid file
    """
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "No file provided"}), 400
    
    # Validate extension
    if '.' not in file.filename:
        return jsonify({"error": "Invalid file"}), 400
    
    extension = file.filename.rsplit('.', 1)[1].lower()
    allowed_extensions = {"png", "jpg", "jpeg", "gif"}
    if extension not in allowed_extensions:
        return jsonify({"error": "Invalid file type"}), 400
    
    # Convert to base64
    try:
        image_bytes = file.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        return jsonify({
            "image_data": image_base64,
            "image_extension": f".{extension}"
        }), 200
    except Exception as e:
        print(f"Error converting image: {e}")
        return jsonify({"error": "Failed to process image"}), 500