describe('Autenticación de Administrador', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  it('debería mostrar error con credenciales incorrectas', () => {
    cy.visit('/login').wait(1500);
    cy.get('input[type="text"]').type('error@nur.edu.bo').wait(1500);
    cy.get('input[type="password"]').type('wrongpass').wait(1500);
    cy.get('button[type="submit"]').click().wait(1500);

    cy.get('.error-banner').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('debería iniciar sesión con credenciales correctas y luego cerrar sesión', () => {
    cy.loginAdmin();
    cy.wait(1500);

    cy.url().should('include', '/admin/dashboard');
    cy.get('.welcome-name').should('contain', 'Admin');

    cy.contains('button', 'Cerrar Sesión').click({ force: true }).wait(1500);
    cy.contains('button', 'Sí, cerrar sesión').click().wait(1500);

    cy.url().should('include', '/login');
  });
});
