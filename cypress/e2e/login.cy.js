// E2E tests for user login flow

describe('User Login', () => {
  beforeEach(() => {
    cy.visit('/src/pages/login.html');
  });

  it('should display login form', () => {
    cy.get('#loginForm').should('exist');
    cy.get('#email').should('exist');
    cy.get('#password').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should show error for invalid credentials', () => {
    cy.get('#email').type('invalid@example.com');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('.toast-error').should('be.visible');
  });

  it('should successfully login with valid credentials', () => {
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('Test1234');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('.toast-success').should('be.visible');
  });

  it('should navigate to registration page', () => {
    cy.contains('Register').click();
    cy.url().should('include', '/register');
  });
});

describe('Admin Login', () => {
  beforeEach(() => {
    cy.visit('/src/pages/admin/login.html');
  });

  it('should successfully login as admin', () => {
    cy.get('#email').type('admin@dualconnect.com');
    cy.get('#password').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/admin/dashboard');
    cy.get('.admin-header').should('exist');
  });

  it('should reject non-admin users', () => {
    cy.get('#email').type('user@example.com');
    cy.get('#password').type('user123');
    cy.get('button[type="submit"]').click();

    cy.get('.error-message').should('contain', 'admin');
  });
});
