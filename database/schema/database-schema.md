# Dual Connect - Database Schema

## Overview

The Dual Connect database is designed to support the connection between international families and dual education opportunities in Germany. The schema includes 6 core tables with clear relationships to enable efficient searching, filtering, and information management.

## Entity-Relationship Overview

```
┌─────────────────┐         ┌─────────────────┐
│    PROGRAMS     │◄───────►│    COMPANIES    │
│                 │   offers │                 │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ has_many                  │ employs
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   REQUIREMENTS  │         │  CONTACT_PERSONS│
│                 │         │                 │
└─────────────────┘         └─────────────────┘
         ▲
         │
         │ eligible_for
         │
┌────────┴────────┐         ┌─────────────────┐
│  APPLICANTS     │◄───────►│  FUNDING_OPTIONS│
│                 │  applies │                 │
└─────────────────┘         └─────────────────┘
```

---

## Table Definitions

### 1. PROGRAMS

Stores information about dual education and dual study programs.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| program_id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique program identifier |
| program_name | VARCHAR(200) | NOT NULL | Official program name |
| program_type | ENUM | NOT NULL | 'Ausbildung', 'Duales Studium', 'Praktikum' |
| field_of_study | VARCHAR(100) | NOT NULL | Industry/field (e.g., IT, Healthcare, Engineering) |
| duration_months | INTEGER | NOT NULL | Program length in months |
| degree_awarded | VARCHAR(100) | NULL | Qualification received upon completion |
| language_requirement | VARCHAR(50) | NOT NULL | Required German level (A1-C2) |
| description_de | TEXT | NOT NULL | German description |
| description_en | TEXT | NULL | English description |
| start_dates | VARCHAR(100) | NOT NULL | Available start dates (e.g., "September, March") |
| application_deadline | VARCHAR(100) | NOT NULL | Application deadline info |
| website_url | VARCHAR(255) | NULL | Official program website |
| company_id | INTEGER | FOREIGN KEY | References COMPANIES(company_id) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date |

**Indexes:**
- INDEX on `program_type`
- INDEX on `field_of_study`
- INDEX on `company_id`

---

### 2. COMPANIES

Stores information about companies offering training positions.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| company_id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique company identifier |
| company_name | VARCHAR(200) | NOT NULL | Official company name |
| company_type | ENUM | NOT NULL | 'Großunternehmen', 'Mittelstand', 'Startup', 'Handwerk' |
| industry | VARCHAR(100) | NOT NULL | Primary industry sector |
| size_employees | VARCHAR(50) | NULL | Company size (e.g., "50-250", "1000+") |
| address_street | VARCHAR(200) | NOT NULL | Street address |
| address_city | VARCHAR(100) | NOT NULL | City |
| address_state | VARCHAR(100) | NOT NULL | German state (Bundesland) |
| address_postal | VARCHAR(10) | NOT NULL | Postal code |
| phone | VARCHAR(50) | NULL | Contact phone |
| email | VARCHAR(100) | NULL | General contact email |
| website | VARCHAR(255) | NULL | Company website |
| description_de | TEXT | NULL | Company description (German) |
| description_en | TEXT | NULL | Company description (English) |
| offers_housing_support | BOOLEAN | DEFAULT FALSE | Provides housing assistance |
| offers_language_courses | BOOLEAN | DEFAULT FALSE | Provides German language training |
| international_friendly | BOOLEAN | DEFAULT FALSE | Explicitly welcomes international applicants |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date |

**Indexes:**
- INDEX on `address_city`
- INDEX on `address_state`
- INDEX on `industry`

---

### 3. CONTACT_PERSONS

Stores contact information for program advisors, company recruiters, and stakeholders.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| contact_id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique contact identifier |
| first_name | VARCHAR(100) | NOT NULL | Contact's first name |
| last_name | VARCHAR(100) | NOT NULL | Contact's last name |
| role | VARCHAR(100) | NOT NULL | Job title/role |
| organization_type | ENUM | NOT NULL | 'Company', 'IHK', 'University', 'Government', 'NGO' |
| company_id | INTEGER | FOREIGN KEY, NULL | References COMPANIES(company_id) if applicable |
| email | VARCHAR(100) | NOT NULL | Contact email |
| phone | VARCHAR(50) | NULL | Direct phone number |
| office_hours | VARCHAR(200) | NULL | Available contact hours |
| languages_spoken | VARCHAR(200) | NULL | Comma-separated languages (e.g., "Deutsch, English, Arabic") |
| specialization | VARCHAR(200) | NULL | Area of expertise |
| available_for_consultation | BOOLEAN | DEFAULT TRUE | Open to direct inquiries |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date |

**Indexes:**
- INDEX on `organization_type`
- INDEX on `company_id`

---

### 4. FUNDING_OPTIONS

Stores information about financial support, scholarships, and funding programs.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| funding_id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique funding identifier |
| funding_name | VARCHAR(200) | NOT NULL | Official name of funding program |
| provider | VARCHAR(200) | NOT NULL | Organization providing funding |
| funding_type | ENUM | NOT NULL | 'Scholarship', 'BAföG', 'Stipendium', 'Company_Funded', 'Other' |
| amount_euro | DECIMAL(10,2) | NULL | Monthly/total amount in EUR |
| eligibility_criteria | TEXT | NOT NULL | Who can apply |
| application_process | TEXT | NOT NULL | How to apply |
| deadline_info | VARCHAR(200) | NULL | Application deadlines |
| renewable | BOOLEAN | DEFAULT FALSE | Can be renewed/extended |
| covers_tuition | BOOLEAN | DEFAULT FALSE | Covers education costs |
| covers_living | BOOLEAN | DEFAULT FALSE | Covers living expenses |
| requires_work_commitment | BOOLEAN | DEFAULT FALSE | Requires working for sponsor after graduation |
| website_url | VARCHAR(255) | NULL | Application website |
| contact_email | VARCHAR(100) | NULL | Contact for questions |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date |

**Indexes:**
- INDEX on `funding_type`
- INDEX on `provider`

---

### 5. REQUIREMENTS

Stores specific requirements for programs (academic, language, legal).

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| requirement_id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique requirement identifier |
| program_id | INTEGER | FOREIGN KEY | References PROGRAMS(program_id) |
| requirement_type | ENUM | NOT NULL | 'Academic', 'Language', 'Legal', 'Technical', 'Medical' |
| requirement_name | VARCHAR(200) | NOT NULL | Short name |
| description_de | TEXT | NOT NULL | German description |
| description_en | TEXT | NULL | English description |
| is_mandatory | BOOLEAN | DEFAULT TRUE | Required vs. recommended |
| documentation_needed | TEXT | NULL | Documents to provide |
| alternative_fulfillment | TEXT | NULL | Alternative ways to meet requirement |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date |

**Indexes:**
- INDEX on `program_id`
- INDEX on `requirement_type`

---

### 6. APPLICANTS

Stores applicant profile information (for demonstration purposes).

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| applicant_id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique applicant identifier |
| first_name | VARCHAR(100) | NOT NULL | Applicant's first name |
| last_name | VARCHAR(100) | NOT NULL | Applicant's last name |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Contact email |
| phone | VARCHAR(50) | NULL | Contact phone |
| date_of_birth | DATE | NOT NULL | Birth date |
| country_of_origin | VARCHAR(100) | NOT NULL | Home country |
| current_location | VARCHAR(100) | NULL | Current city/country |
| german_level | ENUM | NOT NULL | 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native' |
| education_level | VARCHAR(100) | NOT NULL | Highest education completed |
| field_of_interest | VARCHAR(100) | NOT NULL | Preferred industry/field |
| preferred_location | VARCHAR(100) | NULL | Preferred German city/region |
| visa_status | ENUM | NOT NULL | 'None', 'Tourist', 'Student', 'Work', 'Residence' |
| needs_housing_support | BOOLEAN | DEFAULT FALSE | Requires housing assistance |
| needs_language_support | BOOLEAN | DEFAULT FALSE | Requires language training |
| available_start_date | DATE | NULL | Earliest possible start date |
| notes | TEXT | NULL | Additional information |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update date |

**Indexes:**
- INDEX on `field_of_interest`
- INDEX on `german_level`
- INDEX on `country_of_origin`

---

## Relationships

### One-to-Many Relationships

1. **COMPANIES → PROGRAMS**
   - One company can offer multiple programs
   - `PROGRAMS.company_id` references `COMPANIES.company_id`

2. **COMPANIES → CONTACT_PERSONS**
   - One company can have multiple contact persons
   - `CONTACT_PERSONS.company_id` references `COMPANIES.company_id`

3. **PROGRAMS → REQUIREMENTS**
   - One program can have multiple requirements
   - `REQUIREMENTS.program_id` references `PROGRAMS.program_id`

### Many-to-Many Relationships (Junction Tables)

4. **PROGRAMS ↔ FUNDING_OPTIONS** (via `PROGRAM_FUNDING`)
   - Multiple programs can be eligible for multiple funding options
   - Requires junction table: `PROGRAM_FUNDING(program_id, funding_id)`

5. **APPLICANTS ↔ PROGRAMS** (via `APPLICATIONS`)
   - Applicants can apply to multiple programs
   - Requires junction table: `APPLICATIONS(applicant_id, program_id, status, application_date)`

---

## Data Integrity Rules

1. **Foreign Key Constraints**: All foreign keys use `ON DELETE CASCADE` to maintain referential integrity
2. **Email Validation**: Email fields should validate proper format at application level
3. **Date Validation**: Birth dates, start dates must be logical
4. **Enum Values**: Strictly enforce allowed values for status fields
5. **Required Fields**: NULL constraints ensure data completeness

---

## Query Examples

### Find all IT programs in Berlin
```sql
SELECT p.*, c.company_name, c.address_city
FROM PROGRAMS p
JOIN COMPANIES c ON p.company_id = c.company_id
WHERE p.field_of_study = 'IT'
  AND c.address_city = 'Berlin';
```

### Get programs with B1 or lower language requirement
```sql
SELECT program_name, language_requirement, field_of_study
FROM PROGRAMS
WHERE language_requirement IN ('A1', 'A2', 'B1');
```

### Find contacts for a specific company
```sql
SELECT first_name, last_name, role, email, languages_spoken
FROM CONTACT_PERSONS
WHERE company_id = 5;
```

---

## Future Enhancements

1. **User Authentication Table**: Add user accounts for applicants
2. **Saved Searches**: Store search preferences
3. **Application Tracking**: Full application workflow management
4. **Messaging System**: In-platform communication
5. **Document Management**: Upload and store application documents
6. **Reviews/Ratings**: Allow applicants to rate programs

---

*This schema provides a solid foundation for the MVP while remaining extensible for future features.*
