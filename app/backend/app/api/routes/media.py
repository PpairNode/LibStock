import secrets
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


@api_bp.route('/upload/image', methods=['POST'])
@limiter.limit("10 per hour")
@login_required
def upload_image():
    """
    Upload an image file
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
        description: Image file to upload (png, jpg, jpeg, gif)
    responses:
      200:
        description: Image uploaded successfully
        schema:
          type: object
          properties:
            image_path:
              type: string
              example: "a1b2c3d4e5f6.png"
      400:
        description: Invalid file or file type
      401:
        description: Not authenticated
      413:
        description: File too large (max 16MB)
      429:
        description: Too many requests (max 10 per hour)
    """
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "No file provided"}), 400
    
    new_name = allowed_rename_file(file.filename)
    if new_name is None:
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(new_name)
    path = Path(UPLOAD_FOLDER) / filename
    
    # Verify path traversal protection
    if not str(path.resolve()).startswith(str(Path(UPLOAD_FOLDER).resolve())):
        return jsonify({"error": "Invalid path"}), 400
    
    file.save(str(path))
    return jsonify({"image_path": filename}), 200