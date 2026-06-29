declare global {
  namespace Cypress {
    interface Chainable {
      loginAdmin(): Chainable<void>;
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

export {};
