# Dual Connect - MVP Platform

## 🎯 Project Overview

**Dual Connect** is an educational web platform designed to connect international applicant families from third countries with dual education and dual study program opportunities in Germany.

## 📋 Project Purpose

This training project aims to:
- Simplify access to dual education programs for international families
- Provide comprehensive information about vocational training and study opportunities
- Connect families with relevant stakeholders (IHK, universities, companies)
- Offer parent-friendly guidance in multiple languages

## 🐳 Quick Start with Docker (Recommended)

The easiest way to run Dual Connect locally:

```bash
# Clone the repository
git clone <repository-url>
cd DualConnect

# Start with Docker Compose
docker-compose up

# Open browser to http://localhost:8080
```

**That's it!** The full application will be running with all features.

For detailed Docker instructions, see [DOCKER.md](DOCKER.md)

### Alternative: Open Locally Without Docker
```bash
# Navigate to source folder
cd src/pages

# Open index.html in your browser
# Note: Some features require a web server for JSON loading
```

## 🏗️ Project Structure

```
DualConnect/
├── docs/                      # Project documentation
│   ├── project-brief.md       # 1-page project summary
│   ├── swot-analysis.md       # Analysis of existing platforms
│   ├── team-roles.md          # Team member responsibilities
│   ├── development-timeline.md # 6-block phased plan
│   └── presentation/          # Presentation materials
├── database/                  # Data model and sample data
│   ├── schema/                # Database schema definitions
│   ├── er-diagram/            # Entity-relationship diagrams
│   └── sample-data/           # Sample datasets (JSON/CSV)
├── design/                    # UX/UI design files
│   ├── wireframes/            # Low-fidelity wireframes
│   ├── sitemap/               # Website structure
│   └── user-flows/            # User journey maps
├── src/                       # Source code
│   ├── pages/                 # HTML pages
│   ├── styles/                # CSS stylesheets
│   ├── scripts/               # JavaScript files
│   └── assets/                # Images and media
├── testing/                   # Testing and QA
│   ├── usability-test.md      # Test scenarios
│   └── feedback-checklist.md  # Evaluation criteria
└── README.md                  # This file
```

## 🚀 Key Features

### For Families
- **Program Search**: Filter dual education programs by field, location, requirements
- **Parent Section**: Simplified explanations in accessible language
- **Requirement Checker**: Understand eligibility and application steps
- **Funding Information**: Overview of financial support options

### For Partners
- **Company Profiles**: Showcase training opportunities
- **Contact Management**: Connect with IHK, universities, advisors
- **Resource Library**: Access forms, guides, and checklists

## 👥 Simulated Team Structure (5-7 Members)

- **Project Lead**: Timeline management, coordination, reviews
- **Content/Research**: Vocational fields, requirements, funding
- **Database Designer**: Schema, ER diagrams, data logic
- **UX/UI Designer**: Wireframes, navigation, accessibility
- **Developer**: Frontend implementation, data integration
- **Networking Coordinator**: Stakeholder relationships, partnerships
- **Documentation Specialist**: Reports, presentations, materials
- **QA Tester**: Usability testing, feedback collection

## 📅 Development Phases (6 Blocks × 5-6 weeks)

1. **Block A - Kickoff & Research**: Project brief, benchmarking, SWOT analysis
2. **Block B - Concept & Data Model**: Define entities, relationships, fields
3. **Block C - UX Prototype**: Wireframes, user flows for families
4. **Block D - Data Integration**: Import/export, demo database
5. **Block E - MVP Testing**: Usability tests, feedback, improvements
6. **Block F - Finalization**: Final report, presentation, lessons learned

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **Server**: nginx (Alpine Linux)
- **Container**: Docker + Docker Compose
- **Data Format**: JSON for flexibility and easy integration
- **Design Tools**: Figma-compatible wireframes, ASCII diagrams
- **Documentation**: Markdown for portability

## 📖 Getting Started

### 1. Run with Docker (Recommended)
```bash
docker-compose up
# Access at http://localhost:8080
```
See [DOCKER.md](DOCKER.md) for full Docker documentation.

### 2. View the Documentation
```bash
cd docs/
# Read project-brief.md for overview
# Review swot-analysis.md for market analysis
```

### 3. Explore the Database Schema
```bash
cd database/schema/
# Review table definitions and relationships
```

### 4. Browse the Website Files
```bash
cd src/pages/
# index.html - Landing page
# search.html - Program search with filters
# program-detail.html - Detailed program view
# parents.html - Parent information (simple language)
# contact.html - Advisor directory
```

## 🎓 Educational Context

This project is designed for:
- **Vocational training students** learning web development
- **Project-based learning** with real-world application
- **Team collaboration** with clear role distribution
- **Iterative development** with regular handoffs between blocks

## 📊 Deliverables

- [x] Project brief (1 page)
- [x] Website sitemap + wireframes
- [x] ER diagram + data schema
- [x] 10 sample datasets per table
- [x] Presentation outline
- [x] Usability test plan

## 🌍 Target Audience

**Primary**: International families from third countries seeking dual education opportunities in Germany

**Secondary**:
- Vocational schools and universities offering dual programs
- Companies providing training positions
- IHK and career advisors
- Integration and migration support organizations

## 📝 License

Educational project for training purposes.

## 📧 Contact

This is a training project demonstrating platform development for educational programs.

---

**Built with care for international families seeking opportunities in Germany** 🇩🇪
