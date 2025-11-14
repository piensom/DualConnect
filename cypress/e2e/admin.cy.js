// E2E tests for admin panel

describe('Admin Dashboard', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/src/pages/admin/login.html');
    cy.get('#email').type('admin@dualconnect.com');
    cy.get('#password').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin/dashboard');
  });

  it('should display dashboard stats', () => {
    cy.get('.stat-card').should('have.length', 4);
    cy.get('#totalPrograms').should('not.be.empty');
    cy.get('#totalUsers').should('not.be.empty');
    cy.get('#totalApplications').should('not.be.empty');
  });

  it('should show recent activity', () => {
    cy.get('#activityList').should('exist');
    cy.get('.activity-item').should('have.length.greaterThan', 0);
  });

  it('should display system status', () => {
    cy.get('.status-item').should('have.length', 4);
    cy.get('.status-indicator.online').should('exist');
  });

  it('should navigate to programs management', () => {
    cy.contains('Programs').click();
    cy.url().should('include', '/admin/programs');
  });

  it('should refresh dashboard data', () => {
    cy.contains('Refresh').click();
    cy.get('.toast-info').should('contain', 'Refreshing');
    cy.wait(1000);
    cy.get('.toast-success').should('contain', 'refreshed');
  });
});

describe('Admin Programs Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/src/pages/admin/login.html');
    cy.get('#email').type('admin@dualconnect.com');
    cy.get('#password').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin/dashboard');

    // Navigate to programs
    cy.visit('/src/pages/admin/programs.html');
  });

  it('should display programs table', () => {
    cy.get('.data-table').should('exist');
    cy.get('.data-table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should filter programs by type', () => {
    cy.get('#filterType').select('ausbildung');
    cy.wait(500);
    cy.get('.data-table tbody tr').each(($row) => {
      cy.wrap($row).should('contain', 'Ausbildung');
    });
  });

  it('should search programs', () => {
    cy.get('#searchPrograms').type('Software');
    cy.wait(500);
    cy.get('.data-table tbody tr').each(($row) => {
      cy.wrap($row).should('contain', 'Software');
    });
  });

  it('should open create program modal', () => {
    cy.contains('Add New Program').click();
    cy.get('#programModal').should('be.visible');
    cy.get('#modalTitle').should('contain', 'Add New Program');
  });

  it('should create new program', () => {
    cy.contains('Add New Program').click();

    // Fill form
    cy.get('#programTitle').type('Test Program');
    cy.get('#programType').select('ausbildung');
    cy.get('#programField').select('IT');
    cy.get('#programCompany').select('1');
    cy.get('#programCity').type('Berlin');
    cy.get('#programState').type('Berlin');
    cy.get('#programDuration').type('36');
    cy.get('#programLanguage').select('B2');
    cy.get('#programDescription').type('This is a test program');
    cy.get('#programStatus').select('published');

    // Submit
    cy.get('#saveBtn').click();

    // Should show success message
    cy.get('.toast-success').should('contain', 'created');
  });

  it('should edit existing program', () => {
    cy.get('.btn-icon.edit').first().click();
    cy.get('#programModal').should('be.visible');
    cy.get('#modalTitle').should('contain', 'Edit Program');
    cy.get('#programTitle').should('not.be.empty');
  });

  it('should delete program with confirmation', () => {
    cy.get('.btn-icon.delete').first().click();

    // Should show confirmation dialog
    cy.on('window:confirm', () => true);

    // Should show success toast
    cy.get('.toast-success').should('contain', 'deleted');
  });

  it('should paginate programs', () => {
    cy.get('.pagination-controls button').contains('2').click();
    cy.wait(500);
    cy.get('.pagination-controls .active').should('contain', '2');
  });
});

describe('Admin Applications Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/src/pages/admin/login.html');
    cy.get('#email').type('admin@dualconnect.com');
    cy.get('#password').type('admin123');
    cy.get('button[type="submit"]').click();

    // Navigate to applications
    cy.visit('/src/pages/admin/applications.html');
  });

  it('should display applications table', () => {
    cy.get('.data-table').should('exist');
    cy.get('.data-table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should filter by status', () => {
    cy.get('#filterStatus').select('pending');
    cy.wait(500);
    cy.get('.table-badge.warning').should('exist');
  });

  it('should view application details', () => {
    cy.get('.btn-icon').first().click();
    cy.get('#applicationModal').should('be.visible');
    cy.get('#detailName').should('not.be.empty');
  });

  it('should bulk select applications', () => {
    cy.get('#selectAll').click();
    cy.get('.app-checkbox:checked').should('have.length.greaterThan', 0);
    cy.get('#bulkActions').should('be.visible');
  });

  it('should bulk update status', () => {
    // Select some applications
    cy.get('.app-checkbox').first().click();
    cy.get('.app-checkbox').eq(1).click();

    // Bulk approve
    cy.contains('Approve Selected').click();

    cy.on('window:confirm', () => true);

    cy.get('.toast-success').should('contain', 'successfully');
  });

  it('should export applications to CSV', () => {
    cy.contains('Export CSV').click();
    cy.get('.toast-success').should('contain', 'exported');
  });

  it('should quick approve application', () => {
    cy.get('.btn-icon.edit').first().click();

    cy.on('window:confirm', () => true);

    cy.get('.toast-success').should('contain', 'approved');
  });
});

describe('Admin Users Management', () => {
  beforeEach(() => {
    cy.visit('/src/pages/admin/login.html');
    cy.get('#email').type('admin@dualconnect.com');
    cy.get('#password').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.visit('/src/pages/admin/users.html');
  });

  it('should display users table', () => {
    cy.get('.data-table').should('exist');
    cy.get('.data-table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should filter by role', () => {
    cy.get('#filterRole').select('admin');
    cy.wait(500);
    cy.get('.table-badge.info').should('exist');
  });

  it('should search users', () => {
    cy.get('#searchUsers').type('test');
    cy.wait(500);
    cy.get('.data-table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should export users to CSV', () => {
    cy.contains('Export CSV').click();
    cy.get('.toast-success').should('contain', 'exported');
  });
});

describe('Admin Logout', () => {
  it('should logout successfully', () => {
    cy.visit('/src/pages/admin/login.html');
    cy.get('#email').type('admin@dualconnect.com');
    cy.get('#password').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin/dashboard');

    cy.get('.btn-logout').click();

    cy.on('window:confirm', () => true);

    cy.url().should('include', '/admin/login');
  });
});
