// Dual Connect - Main JavaScript

// Load JSON data
let programs = [];
let companies = [];
let contacts = [];
let funding = [];
let requirements = [];

// Initialize data loading
async function loadData() {
    try {
        const API_URL = 'http://localhost:3000/api';

        const [programsRes, companiesRes] = await Promise.all([
            fetch(`${API_URL}/programs?limit=200`),
            fetch(`${API_URL}/companies?limit=200`)
        ]);

        const programsData = await programsRes.json();
        const companiesData = await companiesRes.json();

        programs = programsData.programs || programsData;
        companies = companiesData.companies || companiesData;

        // For backward compatibility, still try to load contacts, funding, requirements
        try {
            const [contactsRes, fundingRes, requirementsRes] = await Promise.all([
                fetch('../../database/sample-data/contact_persons.json'),
                fetch('../../database/sample-data/funding_options.json'),
                fetch('../../database/sample-data/requirements.json')
            ]);
            contacts = await contactsRes.json();
            funding = await fundingRes.json();
            requirements = await requirementsRes.json();
        } catch (err) {
            console.log('Optional data not loaded:', err.message);
        }

        console.log(`Data loaded successfully: ${programs.length} programs, ${companies.length} companies`);
        console.log('First program:', programs[0]);
        console.log('First company:', companies[0]);
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}

// Get company by ID
function getCompanyById(id) {
    return companies.find(c => c.company_id === id);
}

// Get contact by ID
function getContactById(id) {
    return contacts.find(c => c.contact_id === id);
}

// Get requirements for program
function getRequirementsForProgram(programId) {
    return requirements.filter(r => r.program_id === programId);
}

// Format program card HTML
function createProgramCard(program) {
    const company = getCompanyById(program.company_id);
    const programType = program.program_type === 'Duales Studium' ? '📋 Duales Studium' : '📋 Ausbildung';

    return `
        <div class="program-card" onclick="window.location.href='program-detail.html?id=${program.program_id}'">
            <div class="program-header">
                <h3>${program.program_name}</h3>
                <span class="program-type-badge">${programType}</span>
            </div>
            <div class="program-company">
                ${company ? company.company_name : 'Company'} · ${company ? company.city + ', ' + company.state : 'Location'}
            </div>
            <div class="program-meta">
                <span class="meta-item">⏱ ${program.duration_months} months</span>
                <span class="meta-item">🗣 ${program.language_requirement}</span>
                <span class="meta-item">📍 ${company ? company.city : 'City'}</span>
            </div>
            <p class="program-description">${program.description_en || program.description_de}</p>
            <div class="program-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='program-detail.html?id=${program.program_id}'">View Details →</button>
                <button class="btn-icon" onclick="event.stopPropagation(); toggleSave(${program.program_id})" title="Save program">♥</button>
            </div>
        </div>
    `;
}

// Filter programs
function filterPrograms(filters) {
    return programs.filter(program => {
        const company = getCompanyById(program.company_id);

        // Filter by field
        if (filters.field && filters.field !== 'all') {
            if (program.field_of_study !== filters.field) return false;
        }

        // Filter by location
        if (filters.location && filters.location !== 'all') {
            if (!company || company.city !== filters.location) return false;
        }

        // Filter by language
        if (filters.language && filters.language !== 'all') {
            const langLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const maxLevel = filters.language;
            const programLevelIndex = langLevels.indexOf(program.language_requirement);
            const maxLevelIndex = langLevels.indexOf(maxLevel);
            if (programLevelIndex > maxLevelIndex) return false;
        }

        // Filter by type
        if (filters.type && filters.type !== 'all') {
            if (program.program_type !== filters.type) return false;
        }

        // Filter by international-friendly
        if (filters.international && company) {
            if (!company.international_friendly) return false;
        }

        return true;
    });
}

// Toggle save program
function toggleSave(programId) {
    const saved = localStorage.getItem('savedPrograms') || '[]';
    let savedList = JSON.parse(saved);

    if (savedList.includes(programId)) {
        savedList = savedList.filter(id => id !== programId);
        console.log('Removed from saved');
    } else {
        savedList.push(programId);
        console.log('Added to saved');
    }

    localStorage.setItem('savedPrograms', JSON.stringify(savedList));
}

// Get URL parameter
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Export functions for use in pages
window.DualConnect = {
    loadData,
    getCompanyById,
    getContactById,
    getRequirementsForProgram,
    createProgramCard,
    filterPrograms,
    toggleSave,
    getUrlParameter,
    programs,
    companies,
    contacts,
    funding,
    requirements
};
