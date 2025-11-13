# Dual Connect - Website Sitemap

## Site Structure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      DUAL CONNECT                           │
│                     (Landing Page)                          │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─── [1] Start / Home
           │     │
           │     ├─ Hero Section (What is Dual Connect?)
           │     ├─ Quick Search Bar
           │     ├─ Popular Fields (IT, Engineering, Healthcare...)
           │     ├─ Success Stories
           │     └─ Call-to-Action (Start Searching)
           │
           ├─── [2] Program Search
           │     │
           │     ├─ Search & Filter Interface
           │     │   ├─ Filter by Field
           │     │   ├─ Filter by Location
           │     │   ├─ Filter by Language Requirement
           │     │   ├─ Filter by Program Type
           │     │   └─ Filter by Company Type
           │     │
           │     ├─ Search Results List
           │     │   ├─ Program Card (Title, Company, Location, Language)
           │     │   └─ Pagination
           │     │
           │     └─ Program Detail Page
           │         ├─ Program Overview
           │         ├─ Requirements
           │         ├─ Company Information
           │         ├─ Funding Options
           │         ├─ Contact Person
           │         └─ Apply / Save Program
           │
           ├─── [3] For Parents (Eltern-Bereich)
           │     │
           │     ├─ What is Dual Education? (Simple Explanation)
           │     ├─ Benefits for Your Child
           │     ├─ Process Overview (Timeline)
           │     ├─ Common Questions (FAQ)
           │     ├─ Success Stories from Families
           │     ├─ Financial Support Options
           │     └─ How to Support Your Child
           │
           ├─── [4] About Dual Education
           │     │
           │     ├─ Dual Education System Explained
           │     ├─ Ausbildung vs. Duales Studium
           │     ├─ Application Process Step-by-Step
           │     ├─ Language Requirements Guide
           │     ├─ Recognition of Foreign Credentials
           │     └─ Visa & Residence Information
           │
           ├─── [5] Funding & Support
           │     │
           │     ├─ Funding Options Overview
           │     ├─ BAföG Explained
           │     ├─ Scholarships & Stipends
           │     ├─ Company-Funded Programs
           │     ├─ Living Cost Calculator
           │     └─ Application Tips
           │
           ├─── [6] Contact & Help
           │     │
           │     ├─ Who Can Help? (Overview)
           │     ├─ IHK Contact Directory
           │     ├─ University Advisors
           │     ├─ Integration Support Organizations
           │     ├─ Peer Mentors
           │     └─ Contact Form
           │
           ├─── [7] Resources
           │     │
           │     ├─ Downloadable Guides
           │     ├─ Checklists
           │     ├─ Application Templates
           │     ├─ German Language Resources
           │     ├─ Useful Links
           │     └─ Glossary (Terminology)
           │
           └─── [8] About Us
                 │
                 ├─ Project Background
                 ├─ Team
                 ├─ Partners & Stakeholders
                 └─ Legal (Impressum, Privacy Policy)
```

---

## Navigation Structure

### Main Navigation (Header)

```
┌───────────────────────────────────────────────────────────┐
│  DUAL CONNECT [Logo]                                      │
│                                                           │
│  [Home] [Search Programs] [For Parents] [Funding]        │
│  [Contact] [Resources]                    [DE/EN] [🔍]   │
└───────────────────────────────────────────────────────────┘
```

### Footer Navigation

```
┌───────────────────────────────────────────────────────────┐
│  About                Quick Links        Support          │
│  ├─ About Project    ├─ Search          ├─ FAQ           │
│  ├─ Team             ├─ For Parents     ├─ Contact       │
│  └─ Partners         └─ Funding         └─ Help          │
│                                                           │
│  Resources           Legal                               │
│  ├─ Downloads        ├─ Impressum                        │
│  ├─ Glossary         ├─ Privacy                          │
│  └─ Links            └─ Terms                            │
└───────────────────────────────────────────────────────────┘
```

---

## Page Hierarchy Details

### 1. Landing Page (`/` or `/index.html`)
**Purpose**: First impression, orientation, immediate search access

**Key Elements**:
- Hero banner with value proposition
- Quick search functionality
- Browse by popular categories
- Trust indicators (partner logos)
- Statistics (programs available, companies, success rate)
- Call-to-action buttons

**Target Users**: All visitors (first-time and returning)

---

### 2. Program Search (`/search.html`)
**Purpose**: Find suitable dual education programs

**Key Elements**:
- Advanced filter panel (left sidebar)
- Search results grid/list (main area)
- Sort options (relevance, date, location, language)
- Save/favorite functionality
- Results counter
- Mobile-responsive filters

**Sub-pages**:
- **Program Detail** (`/program-detail.html?id={program_id}`)
  - Full program description
  - Detailed requirements
  - Company profile
  - Contact information
  - Related programs

**Target Users**: Applicants actively searching for programs

---

### 3. For Parents (`/parents.html`)
**Purpose**: Simplify dual education concept for non-expert parents

**Key Elements**:
- Simple language (B1 level)
- Visual diagrams (timeline, process flow)
- FAQ accordion
- Video explainers (if budget allows)
- Success testimonials
- Parent-to-parent advice

**Target Users**: Parents of applicants with limited German education system knowledge

---

### 4. About Dual Education (`/about-dual-education.html`)
**Purpose**: Educational content about the dual system

**Key Elements**:
- Comparison tables (Ausbildung vs. Studium)
- Infographics
- Step-by-step guides
- Glossary integration
- Recognition process explained

**Target Users**: Applicants and parents seeking detailed information

---

### 5. Funding & Support (`/funding.html`)
**Purpose**: Financial information and aid options

**Key Elements**:
- Funding options database (searchable)
- Eligibility checkers
- Cost calculator
- Application deadline calendar
- Tips from successful applicants

**Target Users**: Applicants concerned about financing

---

### 6. Contact & Help (`/contact.html`)
**Purpose**: Connect users with human support

**Key Elements**:
- Contact directory (filterable by type, location, language)
- Direct contact cards (email, phone)
- Office hours display
- Contact form
- Chat widget (optional)

**Target Users**: Users needing personalized guidance

---

### 7. Resources (`/resources.html`)
**Purpose**: Downloadable materials and tools

**Key Elements**:
- Document library
- Checklist templates
- Application form examples
- Language learning links
- External resource links

**Target Users**: Applicants in application preparation phase

---

### 8. About Us (`/about.html`)
**Purpose**: Project transparency and credibility

**Key Elements**:
- Project mission and vision
- Team introductions (with photos)
- Partner logos and descriptions
- Legal information

**Target Users**: Stakeholders, partners, curious users

---

## User Journeys

### Journey 1: New International Applicant

```
Landing Page → "For Parents" → "About Dual Education" →
"Program Search" → Program Detail → "Funding" → "Contact"
```

**Goal**: Understand system, find program, get financial info, connect with advisor

---

### Journey 2: Parent Researching for Child

```
Landing Page → "For Parents" → FAQ → Success Stories →
"Program Search" (exploration) → "Contact" (advisor)
```

**Goal**: Understand if dual education is right for child, find trusted advisor

---

### Journey 3: Applicant with Specific Field in Mind

```
Landing Page → Quick Search (IT) → Search Results →
Program Detail → Check Requirements → Apply / Save → "Funding"
```

**Goal**: Find specific program quickly, check eligibility, apply

---

### Journey 4: Parent Seeking Financial Information

```
Landing Page → "For Parents" → "Funding & Support" →
Cost Calculator → Funding Options → Contact Financial Advisor
```

**Goal**: Understand costs and available financial aid

---

## Mobile Navigation Structure

### Hamburger Menu (Mobile)

```
☰ Menu
├─ Home
├─ Search Programs
├─ For Parents
│   ├─ What is Dual Education?
│   ├─ FAQ
│   └─ Success Stories
├─ Funding
├─ Contact
├─ Resources
│   ├─ Downloads
│   └─ Glossary
└─ Language: DE/EN
```

---

## Search & Filter Logic

### Program Search Filters

**Primary Filters** (always visible):
- Field of Study (dropdown/multiselect)
- Location (city/state selector)
- Language Requirement (A1-C2)
- Program Type (Ausbildung / Duales Studium / Praktikum)

**Secondary Filters** (collapsible):
- Company Size
- Start Date
- Duration
- International-Friendly
- Housing Support Available
- Language Courses Offered

**Search Bar**: Free text search across program name, company, description

---

## Accessibility & Usability Notes

1. **Language Switcher**: Prominent DE/EN toggle (top right)
2. **Breadcrumbs**: Show navigation path on all pages except homepage
3. **Search Bar**: Available on every page (header)
4. **Mobile-First**: Responsive design prioritizing mobile users
5. **High Contrast**: Ensure WCAG AA compliance for visually impaired
6. **Keyboard Navigation**: All interactive elements accessible via keyboard
7. **Skip to Content**: Link for screen reader users

---

## Content Management

### Static Pages
- Landing Page
- About Us
- For Parents
- Legal pages

### Dynamic/Database-Driven Pages
- Program Search Results
- Program Detail
- Funding Options
- Contact Directory

### Downloadable Content
- PDF guides (German/English)
- Checklist templates
- Application examples

---

*This sitemap serves as the blueprint for navigation architecture and information hierarchy for the Dual Connect platform.*
