# Data Structure Documentation

This document describes the database schema and data models used in LibStock.

---

## Database: MongoDB

LibStock uses MongoDB as its database backend. The database consists of four main collections:

`users` - User accounts
`containers` - Top-level organizational units
`categories` - Subdivisions within containers
`items` - Individual inventory items

---

## Collections

### Users Collection

Stores user authentication and profile information.

#### Schema

```json
{
  "_id": ObjectId,
  "username": String,
  "password": String (bcrypt hashed)
}
```

---

### Containers Collection

Top-level organizational units that group related items.

#### Schema

```json
{
  "_id": ObjectId,
  "name": String,
  "admin_id": ObjectId,
  "member_ids": [ObjectId]
}
```

---

### Categories Collection

Subdivisions within containers for organizing items.

#### Schema

```json
{
  "_id": ObjectId,
  "name": String,
  "container_id": ObjectId
}
```

---

### 4. Items Collection

Individual inventory items with detailed metadata.

#### Schema

```json
{
  "_id": ObjectId,
  "container_id": ObjectId,
  "category_id": ObjectId,
  "name": String,
  "owner": String,
  "serie": String,
  "description": String,
  "value": Number,
  "date_created": String,
  "date_added": DateTime,
  "location": String,
  "creator": String,
  "tags": [String],
  "image_path": String,
  "comment": String,
  "condition": String,
  "number": Number,
  "edition": String
}
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────┐
│  Users  │
└────┬────┘
     │
     │ admin_id, member_ids
     │
     ↓
┌────────────┐
│ Containers │
└─────┬──────┘
      │
      │ container_id
      │
      ↓
┌────────────┐
│ Categories │
└─────┬──────┘
      │
      │ category_id
      │
      ↓
┌───────┐
│ Items │
└───────┘
```

---

## Data Flow Examples

### Creating a Complete Inventory

```
1. Create User
   ↓
2. Create Container
   ↓
3. Create Categories (at least one)
   ↓
5. Create Items
```

### Deleting a Container (Cascade Effect)

```
Delete Container
   ↓
├─→ Delete all Categories in Container
│      ↓
│      └─→ Delete all Items in each Category
│             ↓
│             └─→ Delete associated Images
└─→ Container deleted
```

### Querying Items with Filters

```
1. User selects Container
   ↓
2. System fetches Categories for Container
   ↓
3. User selects Category (or "---")
   ↓
4. System fetches Items filtered by:
   - container_id
   - category_id (if selected)
   - search compound
   ↓
5. Display items with category names resolved
```

---

## File Storage

### Image Files

Images are stored in the filesystem, not in the database.

**Storage Location:** `/path/to/UPLOAD_FOLDER/`

**Naming Convention:** Random hex string + original extension
- Example: `a1b2c3d4e5f6789.png`

**Database Reference:** Only the filename is stored in `items.image_path`

**Cleanup:** Images are automatically deleted when the associated item is deleted

---

## Validation Summary

### Container Validation
- Name: 256 characters
- Unique name per user

### Category Validation
- Name: 256 characters (auto UPPERCASE)
- Unique name per container
- Container must exist

### Item Validation
- Name: 256 characters
- Owner: 4096 characters
- Value: positive number (2 decimals)
- Category: must exist in same container
- Description: max 4096 characters
- Comment: max 4096 characters
- Tags: max 20 tags, each max 256 chars
- Condition: must be valid enum value
- Number: positive/negative integer
