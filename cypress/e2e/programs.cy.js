// E2E tests for programs browsing and application

describe('Programs Browsing', () => {
  beforeEach(() => {
    cy.visit('/src/pages/programs.html');
  });

  it('should display programs list', () => {
    cy.get('.programs-grid').should('exist');
    cy.get('.program-card').should('have.length.greaterThan', 0);
  });

  it('should filter programs by type', () => {
    cy.get('#filterType').select('ausbildung');
    cy.wait(500);
    cy.get('.program-card').each(($card) => {
      cy.wrap($card).find('.program-type').should('contain', 'Ausbildung');
    });
  });

  it('should filter programs by field', () => {
    cy.get('#filterField').select('IT');
    cy.wait(500);
    cy.get('.program-card').each(($card) => {
      cy.wrap($card).should('contain', 'IT');
    });
  });

  it('should search programs by keyword', () => {
    cy.get('#searchPrograms').type('Software');
    cy.wait(500);
    cy.get('.program-card').each(($card) => {
      cy.wrap($card).should('contain', 'Software');
    });
  });

  it('should display program details modal', () => {
    cy.get('.program-card').first().click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal-content').should('contain', 'Requirements');
    cy.get('.modal-content').should('contain', 'Benefits');
  });

  it('should close modal on backdrop click', () => {
    cy.get('.program-card').first().click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal').click('topLeft');
    cy.get('.modal').should('not.be.visible');
  });

  it('should bookmark a program', () => {
    // Login first
    cy.visit('/src/pages/login.html');
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('Test1234');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // Go to programs
    cy.visit('/src/pages/programs.html');
    cy.get('.bookmark-btn').first().click();
    cy.get('.toast-success').should('be.visible');
  });

  it('should paginate through programs', () => {
    cy.get('.pagination-controls button').contains('2').click();
    cy.url().should('include', 'page=2');
    cy.get('.program-card').should('exist');
  });
});

describe('Program Application', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/src/pages/login.html');
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('Test1234');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should open application form from program details', () => {
    cy.visit('/src/pages/programs.html');
    cy.get('.program-card').first().click();
    cy.get('.btn-apply').click();
    cy.url().should('include', '/apply');
  });

  it('should validate application form', () => {
    cy.visit('/src/pages/apply.html?program_id=1');

    // Try to submit empty form
    cy.get('button[type="submit"]').click();

    // Should show validation errors
    cy.get('.field-error').should('exist');
  });

  it('should submit application successfully', () => {
    cy.visit('/src/pages/apply.html?program_id=1');

    // Fill form
    cy.get('#coverLetter').type('I am very interested in this program because...');
    cy.get('#education').select('bachelor');
    cy.get('#germanLevel').select('B2');
    cy.get('#englishLevel').select('C1');

    // Submit
    cy.get('button[type="submit"]').click();

    // Should show success message
    cy.get('.toast-success').should('be.visible');
    cy.get('.toast-success').should('contain', 'Application submitted');
  });

  it('should upload CV during application', () => {
    cy.visit('/src/pages/apply.html?program_id=1');

    // Upload file
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-cv.pdf');

    // Should show file in list
    cy.get('.file-list').should('contain', 'sample-cv.pdf');
  });
});

describe('Program Comparison', () => {
  beforeEach(() => {
    cy.visit('/src/pages/compare.html');
  });

  it('should add programs to comparison', () => {
    cy.get('#programSearch').type('Software');
    cy.wait(300);
    cy.get('.search-result').first().click();

    cy.get('.selected-programs').should('contain', 'Software');
  });

  it('should compare multiple programs', () => {
    // Add first program
    cy.get('#programSearch').type('Software');
    cy.wait(300);
    cy.get('.search-result').first().click();

    // Add second program
    cy.get('#programSearch').clear().type('Data');
    cy.wait(300);
    cy.get('.search-result').first().click();

    // Should show comparison table
    cy.get('.comparison-table').should('be.visible');
    cy.get('.comparison-table th').should('have.length.greaterThan', 2);
  });

  it('should remove program from comparison', () => {
    cy.get('#programSearch').type('Software');
    cy.wait(300);
    cy.get('.search-result').first().click();

    cy.get('.program-chip .remove-btn').click();
    cy.get('.selected-programs').should('not.contain', 'Software');
  });

  it('should export comparison as CSV', () => {
    // Add programs
    cy.get('#programSearch').type('Software');
    cy.wait(300);
    cy.get('.search-result').first().click();

    // Export
    cy.get('.btn-export').click();
    cy.get('.toast-success').should('contain', 'exported');
  });
});
