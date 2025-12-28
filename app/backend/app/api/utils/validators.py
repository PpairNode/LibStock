from app.utils import MAX_SIZE_NAME, MAX_SIZE_TEXT, MAX_SIZE_TAGS_LIST

# Keys to check for size validation
KEY_SIZE_CHECKS = ['owner', 'name', 'serie', 'description', 'location', 'tags', 'comment', 'edition']


def validate_item_data(data):
    """Validate item data fields - returns error message or None"""
    # Validate name specifically
    item_name = data.get('name', '').strip()
    if not item_name or len(item_name) > MAX_SIZE_NAME:
        return f"Invalid item name length ({MAX_SIZE_NAME} characters maximum)"
    
    # Validate text fields
    for key in KEY_SIZE_CHECKS:
        value = data.get(key, "")
        if value and len(str(value)) > MAX_SIZE_TEXT:
            return f"{key} too long (max {MAX_SIZE_TEXT} characters)"
    
    # Validate tags
    tags = data.get("tags", [])
    if not isinstance(tags, list):
        return "Tags must be a list"
    if len(tags) > MAX_SIZE_TAGS_LIST:
        return f"Too many tags (max {MAX_SIZE_TAGS_LIST})"
    for tag in tags:
        if tag and len(str(tag)) > MAX_SIZE_NAME:
            return f"Tag too long (max {MAX_SIZE_NAME} characters)"
    
    return None  # No error