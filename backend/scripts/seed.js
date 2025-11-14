const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Read existing JSON data
    const programsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../database/sample-data/programs.json'), 'utf8')
    );
    const companiesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../database/sample-data/companies.json'), 'utf8')
    );
    const contactsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../database/sample-data/contact_persons.json'), 'utf8')
    );
    const fundingData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../database/sample-data/funding_options.json'), 'utf8')
    );

    // Read additional data files
    let additionalCompaniesData = [];
    let additionalProgramsData = [];
    let moreCompaniesData = [];
    let moreProgramsData = [];
    let evenMoreCompaniesData = [];
    let evenMoreProgramsData = [];
    let finalCompaniesData = [];
    let finalProgramsData = [];

    try {
      additionalCompaniesData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../database/sample-data/additional-companies.json'), 'utf8')
      );
      additionalProgramsData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../database/sample-data/additional-programs.json'), 'utf8')
      );
      console.log(`📥 Found ${additionalCompaniesData.length} additional companies and ${additionalProgramsData.length} additional programs`);
    } catch (err) {
      console.log('ℹ️  No additional data files found');
    }

    try {
      moreCompaniesData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../database/sample-data/more-companies.json'), 'utf8')
      );
      moreProgramsData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../database/sample-data/more-programs.json'), 'utf8')
      );
      console.log(`📥 Found ${moreCompaniesData.length} more companies and ${moreProgramsData.length} more programs`);
    } catch (err) {
      console.log('ℹ️  No more data files found');
    }

    try {
      evenMoreCompaniesData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../database/sample-data/even-more-companies.json'), 'utf8')
      );
      evenMoreProgramsData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../database/sample-data/even-more-programs.json'), 'utf8')
      );
      console.log(`📥 Found ${evenMoreCompaniesData.length} even more companies and ${evenMoreProgramsData.length} even more programs`);
    } catch (err) {
      console.log('ℹ️  No even more data files found');
    }

    try {
      finalCompaniesData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../database/sample-data/final-companies.json'), 'utf8')
      );
      finalProgramsData = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../database/sample-data/final-programs.json'), 'utf8')
      );
      console.log(`📥 Found ${finalCompaniesData.length} final companies and ${finalProgramsData.length} final programs`);
    } catch (err) {
      console.log('ℹ️  No final data files found');
    }

    // Merge all data
    const allCompanies = [...companiesData, ...additionalCompaniesData, ...moreCompaniesData, ...evenMoreCompaniesData, ...finalCompaniesData];
    const allPrograms = [...programsData, ...additionalProgramsData, ...moreProgramsData, ...evenMoreProgramsData, ...finalProgramsData];

    console.log(`\n📊 Total: ${allCompanies.length} companies and ${allPrograms.length} programs\n`);

    // Seed companies
    console.log('📦 Seeding companies...');
    for (const company of allCompanies) {
      await pool.query(
        `INSERT INTO companies (company_id, company_name, industry, city, state, postal_code,
         street_address, website_url, company_size, description, logo_url, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (company_id) DO NOTHING`,
        [
          company.company_id,
          company.company_name,
          company.industry,
          company.city || company.address_city,
          company.state || company.address_state,
          company.postal_code || company.address_postal,
          company.street_address || company.address_street,
          company.website_url || company.website,
          company.company_size || company.size_employees,
          company.description || company.description_en || null,
          null, null, null
        ]
      );
    }
    console.log(`✓ Seeded ${allCompanies.length} companies\n`);

    // Seed programs
    console.log('📚 Seeding programs...');
    for (const program of allPrograms) {
      await pool.query(
        `INSERT INTO programs (program_id, program_name, program_type, field_of_study,
         duration_months, language_requirement, salary_range, company_id, description,
         requirements, benefits, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
         ON CONFLICT (program_id) DO NOTHING`,
        [
          program.program_id, program.program_name, program.program_type,
          program.field_of_study, program.duration_months, program.language_requirement,
          program.salary_range || '800-1200 EUR/month', program.company_id,
          program.description || program.description_en || `Join ${program.program_name} and start your career in ${program.field_of_study}!`,
          program.requirements || `German language level ${program.language_requirement}, High school diploma or equivalent`,
          program.benefits || 'Health insurance, Paid vacation, Professional development opportunities',
        ]
      );
    }
    console.log(`✓ Seeded ${allPrograms.length} programs\n`);

    // Seed contact persons
    console.log('👥 Seeding contact persons...');
    for (const contact of contactsData) {
      await pool.query(
        `INSERT INTO contact_persons (contact_id, first_name, last_name, position, email,
         phone, languages_spoken, specialization, company_id, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT (contact_id) DO NOTHING`,
        [
          contact.contact_id, contact.first_name, contact.last_name,
          contact.position || 'Program Advisor', contact.email, contact.phone,
          contact.languages_spoken, contact.specialization, contact.company_id
        ]
      );
    }
    console.log(`✓ Seeded ${contactsData.length} contact persons\n`);

    // Seed funding options
    console.log('💰 Seeding funding options...');
    for (const funding of fundingData) {
      await pool.query(
        `INSERT INTO funding_options (funding_id, funding_name, funding_type,
         eligible_countries, amount_range, requirements, application_url, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (funding_id) DO NOTHING`,
        [
          funding.funding_id, funding.funding_name, funding.funding_type,
          funding.eligible_countries || ['All'], funding.amount_range,
          funding.requirements, funding.application_url || 'https://example.com',
          funding.description || `Information about ${funding.funding_name}`
        ]
      );
    }
    console.log(`✓ Seeded ${fundingData.length} funding options\n`);

    // Create demo users
    console.log('🔑 Creating demo users...');
    const demoPassword = await bcrypt.hash('Demo123!', 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, country_of_origin, preferred_language, role, is_verified)
       VALUES
         ('demo@dualconnect.de', $1, 'Demo', 'User', 'Turkey', 'de', 'user', true),
         ('admin@dualconnect.de', $1, 'Admin', 'User', 'Germany', 'de', 'admin', true)
       ON CONFLICT (email) DO NOTHING`,
      [demoPassword]
    );
    console.log('✓ Created demo users\n');

    // Seed FAQs
    console.log('❓ Seeding FAQs...');
    const faqs = [
      {
        question: 'Was ist eine Ausbildung?',
        answer: 'Eine Ausbildung ist ein duales Bildungssystem in Deutschland, bei dem Sie gleichzeitig in einem Unternehmen arbeiten und eine Berufsschule besuchen. Sie verdienen Geld, während Sie lernen!',
        category: 'Basics',
        language: 'de'
      },
      {
        question: 'What is Ausbildung?',
        answer: 'Ausbildung is a dual education system in Germany where you work at a company and attend vocational school at the same time. You earn money while learning!',
        category: 'Basics',
        language: 'en'
      },
      {
        question: 'Welche Deutschkenntnisse brauche ich?',
        answer: 'Für die meisten Ausbildungen benötigen Sie mindestens Deutschkenntnisse auf B1-Niveau. Einige Programme akzeptieren auch A2.',
        category: 'Requirements',
        language: 'de'
      },
      {
        question: 'How can I apply?',
        answer: 'Create an account, browse programs, save your favorites, and submit applications directly through our platform. We will guide you through each step!',
        category: 'Application',
        language: 'en'
      }
    ];

    for (const faq of faqs) {
      await pool.query(
        `INSERT INTO faqs (question, answer, category, language, is_published)
         VALUES ($1, $2, $3, $4, true)`,
        [faq.question, faq.answer, faq.category, faq.language]
      );
    }
    console.log(`✓ Seeded ${faqs.length} FAQs\n`);

    // Seed glossary terms
    console.log('📖 Seeding glossary...');
    const glossaryTerms = [
      { term: 'Ausbildung', definition: 'Dual vocational training combining work and school', language: 'de' },
      { term: 'Duales Studium', definition: 'Dual study program combining university and company work', language: 'de' },
      { term: 'BAföG', definition: 'Federal financial aid for students in Germany', language: 'de' },
      { term: 'IHK', definition: 'Chamber of Commerce and Industry', language: 'de' },
      { term: 'Berufsschule', definition: 'Vocational school', language: 'de' },
      { term: 'Visa', definition: 'Official document allowing entry to Germany', language: 'en' }
    ];

    for (const term of glossaryTerms) {
      await pool.query(
        `INSERT INTO glossary (term, definition, language)
         VALUES ($1, $2, $3)`,
        [term.term, term.definition, term.language]
      );
    }
    console.log(`✓ Seeded ${glossaryTerms.length} glossary terms\n`);

    // Seed cities
    console.log('🏙️ Seeding cities...');
    const cities = [
      { city_name: 'Berlin', state: 'Berlin', population: 3769000, cost_of_living_index: 73.5, average_rent_1br: 1200, average_rent_2br: 1700, public_transport_monthly: 86 },
      { city_name: 'Munich', state: 'Bavaria', population: 1472000, cost_of_living_index: 85.3, average_rent_1br: 1600, average_rent_2br: 2300, public_transport_monthly: 70 },
      { city_name: 'Hamburg', state: 'Hamburg', population: 1841000, cost_of_living_index: 76.2, average_rent_1br: 1300, average_rent_2br: 1800, public_transport_monthly: 109 },
      { city_name: 'Frankfurt', state: 'Hesse', population: 753000, cost_of_living_index: 79.8, average_rent_1br: 1400, average_rent_2br: 2000, public_transport_monthly: 90 },
      { city_name: 'Stuttgart', state: 'Baden-Württemberg', population: 635000, cost_of_living_index: 77.1, average_rent_1br: 1200, average_rent_2br: 1650, public_transport_monthly: 85 }
    ];

    for (const city of cities) {
      await pool.query(
        `INSERT INTO cities (city_name, state, population, cost_of_living_index, average_rent_1br, average_rent_2br, public_transport_monthly, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [city.city_name, city.state, city.population, city.cost_of_living_index,
         city.average_rent_1br, city.average_rent_2br, city.public_transport_monthly,
         `${city.city_name} is a vibrant city in ${city.state} with many opportunities for dual education programs.`]
      );
    }
    console.log(`✓ Seeded ${cities.length} cities\n`);

    // Seed checklists
    console.log('✅ Seeding checklists...');
    const checklists = [
      {
        title: 'Bewerbungs-Checkliste',
        description: 'Alles was Sie für Ihre Bewerbung brauchen',
        category: 'Application',
        target_audience: 'Applicants',
        language: 'de',
        items: [
          { id: 1, text: 'Lebenslauf erstellen', completed: false },
          { id: 2, text: 'Motivationsschreiben schreiben', completed: false },
          { id: 3, text: 'Zeugnisse übersetzen lassen', completed: false },
          { id: 4, text: 'Deutschzertifikat besorgen', completed: false },
          { id: 5, text: 'Bewerbung absenden', completed: false }
        ]
      },
      {
        title: 'Visa Checklist',
        description: 'Documents needed for your visa application',
        category: 'Visa',
        target_audience: 'Applicants',
        language: 'en',
        items: [
          { id: 1, text: 'Valid passport', completed: false },
          { id: 2, text: 'Acceptance letter from company', completed: false },
          { id: 3, text: 'Proof of accommodation', completed: false },
          { id: 4, text: 'Health insurance', completed: false },
          { id: 5, text: 'Financial proof', completed: false },
          { id: 6, text: 'Book visa appointment', completed: false }
        ]
      }
    ];

    for (const checklist of checklists) {
      await pool.query(
        `INSERT INTO checklists (title, description, category, target_audience, language, items)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [checklist.title, checklist.description, checklist.category, checklist.target_audience,
         checklist.language, JSON.stringify(checklist.items)]
      );
    }
    console.log(`✓ Seeded ${checklists.length} checklists\n`);

    console.log('✅ Database seeded successfully!\n');
    console.log('Demo credentials:');
    console.log('  User: demo@dualconnect.de / Demo123!');
    console.log('  Admin: admin@dualconnect.de / Demo123!\n');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seed
seed();
