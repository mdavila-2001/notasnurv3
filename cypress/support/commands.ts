declare global {
  namespace Cypress {
    interface Chainable {
      loginAdmin(): Chainable<void>;
      loginTeacher(email?: string, password?: string): Chainable<void>;
      loginStudent(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAdmin', () => {
  cy.visit('/login');
  cy.get('input[type="text"]').type('admin@nur.edu.bo');
  cy.get('input[type="password"]').type('admin123');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('loginTeacher', (email?: string, password?: string) => {
  cy.visit('/login');
  cy.get('input[type="text"]').type(email || 'docenteprueba@nur.edu.bo');
  cy.get('input[type="password"]').type(password || '12345678');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('loginStudent', (email?: string, password?: string) => {
  cy.visit('/login');
  cy.get('input[type="text"]').type(email || '20202001@nur.edu.bo');
  cy.get('input[type="password"]').type(password || '1234');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

export {};
