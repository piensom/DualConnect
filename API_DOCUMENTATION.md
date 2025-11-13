# Dual Connect API Documentation

Complete API reference for the Dual Connect Platform.

**Base URL**: `http://localhost:3000/api`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

### Register
**POST** `/auth/register`

Create a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "country_of_origin": "Turkey",
  "phone": "+49 123 456789",
  "preferred_language": "de"
}
```

**Response** (201):
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "preferred_language": "de"
  }
}
```

### Login
**POST** `/auth/login`

Authenticate and receive a JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "preferred_language": "de"
  }
}
```

### Get Current User
**GET** `/auth/me`

Get authenticated user's profile.

**Headers**: Authorization required

**Response** (200):
```json
{
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "country_of_origin": "Turkey",
    "phone": "+49 123 456789",
    "preferred_language": "de",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Profile
**PUT** `/auth/profile`

Update user profile information.

**Headers**: Authorization required

**Request Body**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+49 987 654321",
  "preferred_language": "en"
}
```

**Response** (200):
```json
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

### Change Password
**POST** `/auth/change-password`

Change user password.

**Headers**: Authorization required

**Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Response** (200):
```json
{
  "message": "Password changed successfully"
}
```

---

## Programs

### List Programs
**GET** `/programs`

Get all programs with optional filters.

**Query Parameters**:
- `field` - Filter by field of study (e.g., "IT", "Engineering")
- `type` - Filter by program type ("Ausbildung", "Duales Studium")
- `language` - Filter by language requirement (e.g., "B1")
- `city` - Filter by city name
- `search` - Search in program name, description, or company name
- `sortBy` - Sort field (default: "created_at")
- `sortOrder` - "ASC" or "DESC" (default: "DESC")
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response** (200):
```json
{
  "programs": [
    {
      "program_id": 1,
      "program_name": "Duales Studium Informatik",
      "program_type": "Duales Studium",
      "field_of_study": "IT",
      "duration_months": 36,
      "language_requirement": "B2",
      "salary_range": "1000-1500 EUR/month",
      "company_id": 1,
      "company_name": "Siemens AG",
      "city": "Munich",
      "state": "Bavaria",
      "logo_url": null,
      "is_bookmarked": false,
      "views_count": 123,
      "applications_count": 45
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Get Program Details
**GET** `/programs/:id`

Get detailed information about a specific program.

**Response** (200):
```json
{
  "program": {
    "program_id": 1,
    "program_name": "Duales Studium Informatik",
    "description": "Full description...",
    "requirements": "Requirements list...",
    "benefits": "Benefits list...",
    /* ... all program fields ... */
    "is_bookmarked": false
  },
  "funding_options": [
    {
      "funding_id": 1,
      "funding_name": "BAföG",
      "funding_type": "Government Aid",
      "amount_range": "Up to 861 EUR/month"
    }
  ],
  "contact_person": {
    "contact_id": 1,
    "first_name": "Maria",
    "last_name": "Schmidt",
    "email": "m.schmidt@siemens.com",
    "languages_spoken": ["German", "English"]
  }
}
```

### Compare Programs
**POST** `/programs/compare`

Compare 2-5 programs side by side.

**Request Body**:
```json
{
  "program_ids": [1, 2, 3]
}
```

**Response** (200):
```json
{
  "programs": [
    /* Array of program objects */
  ]
}
```

### Get Program Recommendations
**GET** `/programs/:id/recommendations`

Get similar programs based on field and type.

**Response** (200):
```json
{
  "recommendations": [
    /* Array of related program objects */
  ]
}
```

---

## Applications

### Get My Applications
**GET** `/applications/my-applications`

Get all applications for the authenticated user.

**Headers**: Authorization required

**Response** (200):
```json
{
  "applications": [
    {
      "application_id": "uuid",
      "program_id": 1,
      "program_name": "Duales Studium Informatik",
      "company_name": "Siemens AG",
      "status": "submitted",
      "submitted_at": "2024-01-15T10:00:00.000Z",
      "created_at": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

### Create Application
**POST** `/applications`

Create a new application.

**Headers**: Authorization required

**Request Body**:
```json
{
  "program_id": 1,
  "cover_letter": "Dear hiring manager...",
  "cv_url": "/uploads/cv.pdf",
  "notes": "Optional notes"
}
```

**Response** (201):
```json
{
  "message": "Application created successfully",
  "application": { /* application object */ }
}
```

### Update Application
**PUT** `/applications/:id`

Update an existing application.

**Headers**: Authorization required

**Request Body**:
```json
{
  "status": "submitted",
  "cover_letter": "Updated letter...",
  "notes": "Updated notes"
}
```

**Response** (200):
```json
{
  "message": "Application updated successfully",
  "application": { /* updated application object */ }
}
```

### Delete Application
**DELETE** `/applications/:id`

Delete an application.

**Headers**: Authorization required

**Response** (200):
```json
{
  "message": "Application deleted successfully"
}
```

### Get Application Statistics
**GET** `/applications/stats/overview`

Get overview of application statuses.

**Headers**: Authorization required

**Response** (200):
```json
{
  "stats": {
    "total_applications": 10,
    "draft_count": 2,
    "submitted_count": 5,
    "under_review_count": 2,
    "accepted_count": 1,
    "rejected_count": 0
  }
}
```

---

## Bookmarks

### Get Bookmarks
**GET** `/bookmarks`

Get all bookmarked programs.

**Headers**: Authorization required

**Response** (200):
```json
{
  "bookmarks": [
    {
      "bookmark_id": 1,
      "program_id": 1,
      "program_name": "Duales Studium Informatik",
      "company_name": "Siemens AG",
      "notes": "Interesting program",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Add Bookmark
**POST** `/bookmarks`

Bookmark a program.

**Headers**: Authorization required

**Request Body**:
```json
{
  "program_id": 1,
  "notes": "Interested in this"
}
```

**Response** (201):
```json
{
  "message": "Bookmark added successfully",
  "bookmark": { /* bookmark object */ }
}
```

### Remove Bookmark
**DELETE** `/bookmarks/:program_id`

Remove a bookmarked program.

**Headers**: Authorization required

**Response** (200):
```json
{
  "message": "Bookmark removed successfully"
}
```

---

## FAQ

### Get FAQs
**GET** `/faq`

Get all FAQ entries.

**Query Parameters**:
- `category` - Filter by category
- `language` - Filter by language (default: "de")

**Response** (200):
```json
{
  "faqs": [
    {
      "faq_id": 1,
      "question": "Was ist eine Ausbildung?",
      "answer": "Eine Ausbildung ist...",
      "category": "Basics",
      "language": "de"
    }
  ]
}
```

---

## Glossary

### Get Glossary Terms
**GET** `/glossary`

Get glossary terms.

**Query Parameters**:
- `language` - Filter by language (default: "de")
- `category` - Filter by category
- `letter` - Filter by first letter

**Response** (200):
```json
{
  "terms": [
    {
      "term_id": 1,
      "term": "Ausbildung",
      "definition": "Dual vocational training...",
      "language": "de",
      "related_terms": ["Duales Studium", "Berufsschule"]
    }
  ]
}
```

### Search Glossary
**GET** `/glossary/search`

Search for terms.

**Query Parameters**:
- `q` - Search query (required)
- `language` - Language (default: "de")

**Response** (200):
```json
{
  "terms": [/* matching terms */]
}
```

---

## Cities

### Get Cities
**GET** `/cities`

Get all cities.

**Response** (200):
```json
{
  "cities": [
    {
      "city_id": 1,
      "city_name": "Berlin",
      "state": "Berlin",
      "population": 3769000,
      "cost_of_living_index": 73.5,
      "average_rent_1br": 1200,
      "average_rent_2br": 1700,
      "public_transport_monthly": 86
    }
  ]
}
```

### Compare Cities
**POST** `/cities/compare`

Compare multiple cities.

**Request Body**:
```json
{
  "city_ids": [1, 2, 3]
}
```

**Response** (200):
```json
{
  "cities": [/* city objects */]
}
```

---

## Blog

### Get Blog Posts
**GET** `/blog`

Get all published blog posts.

**Query Parameters**:
- `category` - Filter by category
- `tag` - Filter by tag
- `limit` - Posts per page (default: 20)
- `offset` - Pagination offset

**Response** (200):
```json
{
  "posts": [
    {
      "post_id": 1,
      "title": "How to Apply for Ausbildung",
      "slug": "how-to-apply-for-ausbildung",
      "excerpt": "Short summary...",
      "author_first_name": "John",
      "author_last_name": "Doe",
      "category": "Tips",
      "tags": ["Ausbildung", "Application"],
      "published_at": "2024-01-01T00:00:00.000Z",
      "views_count": 500
    }
  ]
}
```

---

## Success Stories

### Get Success Stories
**GET** `/stories`

Get approved success stories.

**Query Parameters**:
- `country` - Filter by country of origin
- `featured` - "true" to get only featured stories
- `limit` - Stories per page (default: 20)

**Response** (200):
```json
{
  "stories": [
    {
      "story_id": 1,
      "title": "My Journey to Germany",
      "story": "Full story text...",
      "first_name": "Ahmed",
      "country_of_origin": "Syria",
      "program_name": "Ausbildung IT",
      "company_name": "SAP SE",
      "is_featured": true
    }
  ]
}
```

### Submit Success Story
**POST** `/stories`

Submit a new success story for approval.

**Headers**: Authorization required

**Request Body**:
```json
{
  "program_id": 1,
  "title": "My Amazing Experience",
  "story": "Full story...",
  "country_of_origin": "Turkey"
}
```

**Response** (201):
```json
{
  "message": "Success story submitted for review",
  "story": { /* story object */ }
}
```

---

## Notifications

### Get Notifications
**GET** `/notifications`

Get user notifications.

**Headers**: Authorization required

**Query Parameters**:
- `unread_only` - "true" to get only unread notifications

**Response** (200):
```json
{
  "notifications": [
    {
      "notification_id": "uuid",
      "type": "application_update",
      "title": "Application Status Changed",
      "message": "Your application status changed to 'under_review'",
      "link": "/dashboard#applications",
      "is_read": false,
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### Mark as Read
**PUT** `/notifications/:id/read`

Mark a notification as read.

**Headers**: Authorization required

**Response** (200):
```json
{
  "message": "Notification marked as read"
}
```

---

## Dashboard

### Get Dashboard Stats
**GET** `/users/dashboard`

Get dashboard statistics for authenticated user.

**Headers**: Authorization required

**Response** (200):
```json
{
  "stats": {
    "applications": {
      "total": 10,
      "submitted": 5,
      "under_review": 3,
      "accepted": 2
    },
    "bookmarks": 15,
    "unread_notifications": 3
  }
}
```

---

## Analytics

### Get Platform Statistics
**GET** `/analytics/stats`

Get overall platform statistics (public).

**Response** (200):
```json
{
  "stats": {
    "programs": {
      "total": 100,
      "active": 95
    },
    "companies": 50,
    "applications": 1000,
    "users": 500
  },
  "top_programs": [
    /* Top 10 programs by applications */
  ],
  "field_distribution": [
    { "field_of_study": "IT", "count": 30 },
    { "field_of_study": "Engineering", "count": 25 }
  ]
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

API requests are limited to 100 requests per 15 minutes per IP address.

When rate limit is exceeded:

**Response** (429):
```json
{
  "error": "Too many requests, please try again later"
}
```

---

## CORS

The API allows cross-origin requests from the configured frontend URL.

Default: `http://localhost:8080`

Configure via `FRONTEND_URL` environment variable.
