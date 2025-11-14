# Dual Connect - Full-Stack Educational Platform

## 🎯 Project Overview

**Dual Connect** is a comprehensive full-stack web platform designed to connect international families from third countries with dual education and study program opportunities in Germany. The platform features user authentication, application tracking, multilingual support, and powerful search capabilities.

## ✨ What's New - Full Platform Features

This is now a **complete full-stack application** with:
- ✅ PostgreSQL database with 17 tables
- ✅ RESTful API backend (Node.js + Express)
- ✅ JWT authentication system
- ✅ User dashboard with application tracking
- ✅ 14 frontend pages with full functionality
- ✅ PWA support (offline capability, installable)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Docker containerization for easy deployment

## 🐳 Quick Start with Docker

### Frontend Only (Static Site)
```bash
docker-compose up
# Access at http://localhost:8080
```

### Full Stack (Database + API + Frontend)
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env and set secure passwords

# 2. Start all services
docker-compose -f docker-compose.full-stack.yml up -d

# 3. Wait 30 seconds for services to be ready, then seed database
docker exec -it dualconnect_api npm run seed

# 4. Access the platform
# Frontend: http://localhost:8080
# API: http://localhost:3000/api
# Login: demo@dualconnect.de / Demo123!
```

**See [FULL_STACK_DOCKER.md](FULL_STACK_DOCKER.md) for complete deployment guide**

## 🏗️ Architecture

```
┌─────────────────┐
│    Frontend     │  nginx (Port 8080)
│   (HTML/CSS/JS) │  - 14 pages
│                 │  - Progressive Web App
└────────┬────────┘
         │
         │ HTTP/JSON
         ▼
┌─────────────────┐
│   Backend API   │  Node.js + Express (Port 3000)
│                 │  - RESTful endpoints
│  - Auth (JWT)   │  - Authentication
│  - Programs     │  - Business logic
│  - Applications │
│  - Bookmarks    │
└────────┬────────┘
         │
         │ SQL
         ▼
┌─────────────────┐
│   PostgreSQL    │  (Port 5432)
│                 │  - 17 tables
│  - Users        │  - Normalized schema
│  - Programs     │  - Indexes & triggers
│  - Companies    │
└─────────────────┘
```

## 📱 Platform Features

### 🔐 User Features
- **User Registration & Login** - Secure JWT authentication
- **Personal Dashboard** - Track applications, bookmarks, notifications
- **Application Management** - Create, edit, track application status
- **Bookmarks** - Save favorite programs
- **Profile Management** - Update personal information, change password
- **Notifications** - Real-time updates on application status

### 🔍 Program Discovery
- **Advanced Search** - Filter by field, location, language requirement
- **Program Comparison** - Compare up to 5 programs side-by-side
- **Program Details** - Complete information with funding options
- **Recommendations** - Get similar program suggestions
- **Statistics** - View popularity and application numbers

### 📚 Information Resources
- **FAQ Section** - Expandable questions in multiple languages
- **Glossary** - Educational terms explained
- **Blog** - Articles, tips, and news
- **Success Stories** - Real experiences from international students
- **For Parents** - Simplified explanations (B1 language level)

### 🏙️ Tools & Calculators
- **City Comparison** - Compare cost of living in German cities
- **Budget Calculator** - Estimate monthly expenses
- **Checklists** - Application and visa document checklists
- **Contact Directory** - Find advisors by specialization and language

### 🌍 Multi-Language Support
- German (Deutsch)
- English
- Turkish (Türkçe)
- Arabic (العربية)
- Spanish (Español)

### 📱 Progressive Web App (PWA)
- **Offline Support** - Browse cached content without internet
- **Installable** - Add to home screen on mobile devices
- **Push Notifications** - Get updates on applications (optional)
- **Fast Loading** - Service worker caching

## 🗂️ Project Structure

```
DualConnect/
├── backend/                    # Node.js API server
│   ├── config/                 # Database config & schema
│   │   ├── database.js         # PostgreSQL connection
│   │   └── schema.sql          # Database schema (17 tables)
│   ├── middleware/             # Express middleware
│   │   └── auth.js             # JWT authentication
│   ├── routes/                 # API endpoints (14 route files)
│   │   ├── auth.js             # Registration, login, profile
│   │   ├── programs.js         # Program search & details
│   │   ├── applications.js     # Application management
│   │   ├── bookmarks.js        # Save favorites
│   │   ├── blog.js             # Blog posts
│   │   ├── faq.js              # FAQ system
│   │   ├── glossary.js         # Terms dictionary
│   │   ├── cities.js           # City information
│   │   ├── checklists.js       # Document checklists
│   │   ├── notifications.js    # User notifications
│   │   └── ...                 # 14 routes total
│   ├── scripts/                # Utility scripts
│   │   └── seed.js             # Database seeding
│   ├── package.json            # Dependencies
│   ├── server.js               # Express server
│   └── Dockerfile              # Backend container
├── src/                        # Frontend source code
│   ├── pages/                  # HTML pages (14 pages)
│   │   ├── index.html          # Landing page
│   │   ├── search.html         # Program search
│   │   ├── program-detail.html # Program details
│   │   ├── login.html          # User login
│   │   ├── register.html       # User registration
│   │   ├── dashboard.html      # User dashboard
│   │   ├── faq.html            # FAQ page
│   │   ├── stories.html        # Success stories
│   │   ├── blog.html           # Blog listing
│   │   ├── glossary.html       # Terms glossary
│   │   ├── compare.html        # Program comparison
│   │   ├── city-compare.html   # City comparison
│   │   ├── parents.html        # Parent information
│   │   └── contact.html        # Contact advisors
│   ├── scripts/                # JavaScript files
│   │   ├── api.js              # API client library
│   │   ├── auth.js             # Authentication logic
│   │   ├── dashboard.js        # Dashboard functionality
│   │   ├── main.js             # Shared utilities
│   │   └── ...                 # Page-specific scripts
│   ├── styles/                 # CSS stylesheets
│   │   ├── main.css            # Global styles
│   │   ├── auth.css            # Login/register styles
│   │   ├── dashboard.css       # Dashboard styles
│   │   └── ...                 # Page-specific styles
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
├── database/                   # Data model documentation
│   ├── schema/                 # Schema documentation
│   │   └── database-schema.md  # Table definitions
│   ├── er-diagram/             # Entity-relationship diagrams
│   │   └── er-diagram.md       # Visual schema representation
│   └── sample-data/            # JSON sample data
│       ├── programs.json       # 10 programs
│       ├── companies.json      # 10 companies
│       ├── contact_persons.json
│       ├── funding_options.json
│       ├── requirements.json
│       └── applicants.json
├── docs/                       # Project documentation
│   ├── project-brief.md        # Project overview
│   ├── swot-analysis.md        # Competitive analysis
│   ├── team-roles.md           # Team structure
│   └── development-timeline.md # Phased development plan
├── testing/                    # Testing documentation
│   ├── usability-test-plan.md
│   └── feedback-checklist.md
├── docker-compose.yml          # Frontend-only Docker setup
├── docker-compose.full-stack.yml # Complete stack setup
├── Dockerfile                  # Frontend container
├── nginx.conf                  # Web server config
├── .env.example                # Environment template
├── API_DOCUMENTATION.md        # Complete API reference
├── FULL_STACK_DOCKER.md       # Full deployment guide
├── DOCKER.md                   # Frontend Docker guide
├── DELIVERABLES.md            # Project deliverables
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js 4
- **Database**: PostgreSQL 15
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling, CSS Grid, Flexbox
- **Vanilla JavaScript** - No frameworks (educational purpose)
- **Service Worker** - PWA functionality
- **Responsive Design** - Mobile-first approach

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: nginx (Alpine Linux)
- **Reverse Proxy**: Configured for API routing
- **Data Persistence**: Docker volumes
- **Health Checks**: All services monitored

## 📊 Database Schema (17 Tables)

1. **users** - User accounts with authentication
2. **companies** - Training partner organizations
3. **programs** - Dual education programs
4. **contact_persons** - Advisors and mentors
5. **applications** - User program applications
6. **bookmarks** - Saved programs
7. **funding_options** - Financial aid information
8. **program_funding** - Program-funding relationships
9. **blog_posts** - Blog articles
10. **success_stories** - User testimonials
11. **faqs** - Frequently asked questions
12. **glossary** - Educational terms
13. **cities** - City information and costs
14. **checklists** - Document lists
15. **user_checklist_progress** - User checklist tracking
16. **notifications** - User notifications
17. **email_subscriptions** - Newsletter subscribers

**Full schema**: [backend/config/schema.sql](backend/config/schema.sql)

## 🚀 API Endpoints (47 endpoints across 14 routes)

### Authentication (`/api/auth`)
- `POST /register` - Create account
- `POST /login` - User login
- `GET /me` - Get current user
- `PUT /profile` - Update profile
- `POST /change-password` - Change password

### Programs (`/api/programs`)
- `GET /` - List programs with filters
- `GET /:id` - Program details
- `POST /compare` - Compare programs
- `GET /:id/recommendations` - Similar programs

### Applications (`/api/applications`)
- `GET /my-applications` - User's applications
- `POST /` - Create application
- `PUT /:id` - Update application
- `DELETE /:id` - Delete application
- `GET /stats/overview` - Statistics

**+ 10 more route groups** - See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 📖 Getting Started

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd DualConnect
```

2. **Choose your setup**

#### Option A: Frontend Only (Static)
```bash
docker-compose up
# Access at http://localhost:8080
```

#### Option B: Full Stack (Development)
```bash
# Start database only
docker-compose -f docker-compose.full-stack.yml up -d postgres

# Install and run backend
cd backend
npm install
cp .env.example .env  # Edit with your settings
npm run dev

# Open frontend in browser or use local server
cd ../src/pages
python -m http.server 8080
```

#### Option C: Complete Docker Stack (Production-like)
```bash
# Set up environment
cp .env.example .env
# Edit .env with secure values

# Start everything
docker-compose -f docker-compose.full-stack.yml up -d

# Seed database (wait 30 seconds first)
docker exec -it dualconnect_api npm run seed

# Access at http://localhost:8080
```

### Demo Credentials (after seeding)

- **User**: demo@dualconnect.de / Demo123!
- **Admin**: admin@dualconnect.de / Demo123!

## 📚 Documentation

- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with examples
- **[FULL_STACK_DOCKER.md](FULL_STACK_DOCKER.md)** - Full-stack deployment guide
- **[DOCKER.md](DOCKER.md)** - Frontend-only Docker guide
- **[DELIVERABLES.md](DELIVERABLES.md)** - Project deliverables summary

## 🧪 Testing

### Backend API Tests
```bash
cd backend

# Test health endpoint
curl http://localhost:3000/health

# Test public endpoints
curl http://localhost:3000/api/programs
curl http://localhost:3000/api/faq
curl http://localhost:3000/api/glossary

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@dualconnect.de","password":"Demo123!"}'
```

### Frontend Testing
1. Open http://localhost:8080
2. Test user flows:
   - Browse programs without login
   - Register new account
   - Login and access dashboard
   - Create application
   - Bookmark programs
   - View FAQ and glossary

## 🎓 Educational Context

This platform demonstrates:
- **Full-stack development** - Frontend, backend, database integration
- **RESTful API design** - Clean endpoints, proper HTTP methods
- **Authentication & Authorization** - JWT tokens, protected routes
- **Database design** - Normalized schema, relationships, indexes
- **Responsive design** - Mobile-first CSS
- **Progressive Web Apps** - Service workers, offline support
- **DevOps** - Docker containerization, multi-service orchestration
- **Security** - Password hashing, CORS, rate limiting
- **Best practices** - Error handling, validation, documentation

## 👥 Simulated Team Structure

- **Project Lead** - Timeline, coordination, reviews
- **Backend Developer** - API, database, authentication
- **Frontend Developer** - UI, UX, JavaScript
- **Database Designer** - Schema, relationships, optimization
- **UX/UI Designer** - Wireframes, user flows, accessibility
- **DevOps Engineer** - Docker, deployment, monitoring
- **Content Specialist** - FAQs, blog, translations
- **QA Tester** - Testing, bug tracking, feedback

## 🌍 Target Audience

**Primary**: International families from third countries seeking dual education opportunities in Germany

**Secondary**:
- Vocational schools and universities
- Training companies
- IHK and career advisors
- Migration support organizations

## 📈 Project Statistics

- **14 Frontend Pages** - Complete user interface
- **47 API Endpoints** - Full backend functionality
- **17 Database Tables** - Comprehensive data model
- **5 Languages Supported** - Multilingual platform
- **60+ Sample Records** - Realistic demo data
- **1000+ Lines** Backend code
- **2000+ Lines** Frontend code
- **Fully Dockerized** - One-command deployment

## 📝 License

Educational project for training purposes.

## 🙏 Acknowledgments

Built as a training project to demonstrate modern full-stack web development for educational platforms serving international families.

---

**Built with care for international families seeking opportunities in Germany** 🇩🇪

**Tech Stack**: PostgreSQL • Node.js • Express • JWT • HTML5 • CSS3 • JavaScript • Docker • nginx • PWA
