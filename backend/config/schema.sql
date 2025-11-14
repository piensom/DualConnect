-- Dual Connect Platform Database Schema
-- PostgreSQL implementation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  country_of_origin VARCHAR(100),
  phone VARCHAR(50),
  preferred_language VARCHAR(10) DEFAULT 'de',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
  company_id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  street_address VARCHAR(255),
  website_url VARCHAR(255),
  company_size VARCHAR(50),
  description TEXT,
  logo_url VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programs table
CREATE TABLE programs (
  program_id SERIAL PRIMARY KEY,
  program_name VARCHAR(255) NOT NULL,
  program_type VARCHAR(50) NOT NULL,
  field_of_study VARCHAR(100),
  duration_months INTEGER,
  language_requirement VARCHAR(10),
  salary_range VARCHAR(100),
  start_date DATE,
  application_deadline DATE,
  company_id INTEGER REFERENCES companies(company_id),
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact persons table
CREATE TABLE contact_persons (
  contact_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  languages_spoken TEXT[],
  specialization VARCHAR(100),
  company_id INTEGER REFERENCES companies(company_id),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE applications (
  application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  program_id INTEGER REFERENCES programs(program_id),
  status VARCHAR(50) DEFAULT 'draft',
  cover_letter TEXT,
  cv_url VARCHAR(255),
  additional_documents TEXT[],
  notes TEXT,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks table
CREATE TABLE bookmarks (
  bookmark_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  program_id INTEGER REFERENCES programs(program_id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, program_id)
);

-- Funding options table
CREATE TABLE funding_options (
  funding_id SERIAL PRIMARY KEY,
  funding_name VARCHAR(255) NOT NULL,
  funding_type VARCHAR(100),
  eligible_countries TEXT[],
  amount_range VARCHAR(100),
  requirements TEXT,
  application_url VARCHAR(255),
  deadline DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Program funding relationships
CREATE TABLE program_funding (
  program_id INTEGER REFERENCES programs(program_id),
  funding_id INTEGER REFERENCES funding_options(funding_id),
  PRIMARY KEY (program_id, funding_id)
);

-- Blog posts table
CREATE TABLE blog_posts (
  post_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES users(user_id),
  category VARCHAR(100),
  tags TEXT[],
  featured_image VARCHAR(255),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success stories table
CREATE TABLE success_stories (
  story_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  program_id INTEGER REFERENCES programs(program_id),
  title VARCHAR(255) NOT NULL,
  story TEXT NOT NULL,
  photo_url VARCHAR(255),
  video_url VARCHAR(255),
  country_of_origin VARCHAR(100),
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ table
CREATE TABLE faqs (
  faq_id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  language VARCHAR(10) DEFAULT 'de',
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Glossary table
CREATE TABLE glossary (
  term_id SERIAL PRIMARY KEY,
  term VARCHAR(255) NOT NULL,
  definition TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'de',
  category VARCHAR(100),
  related_terms TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email subscriptions table
CREATE TABLE email_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(user_id),
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- City information table
CREATE TABLE cities (
  city_id SERIAL PRIMARY KEY,
  city_name VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  population INTEGER,
  cost_of_living_index DECIMAL(5,2),
  average_rent_1br INTEGER,
  average_rent_2br INTEGER,
  public_transport_monthly INTEGER,
  description TEXT,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checklists table
CREATE TABLE checklists (
  checklist_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  items JSONB NOT NULL,
  target_audience VARCHAR(100),
  language VARCHAR(10) DEFAULT 'de',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User checklist progress table
CREATE TABLE user_checklist_progress (
  progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  checklist_id INTEGER REFERENCES checklists(checklist_id),
  completed_items JSONB DEFAULT '[]',
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, checklist_id)
);

-- Create indexes for better performance
CREATE INDEX idx_programs_company ON programs(company_id);
CREATE INDEX idx_programs_type ON programs(program_type);
CREATE INDEX idx_programs_field ON programs(field_of_study);
CREATE INDEX idx_programs_active ON programs(is_active);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_program ON applications(program_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_published ON blog_posts(is_published);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
