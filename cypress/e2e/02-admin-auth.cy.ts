describe('Autenticación de Administrador', () => {
  beforeEach(() => {
    // Limpiar localStorage y sessionStorage para asegurar un estado limpio
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  it('debería mostrar error con credenciales incorrectas', () => {
    cy.visit('/login');
    cy.get('input[type="text"]').type('error@nur.edu.bo');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();

    // Debería mostrar un banner de error
    cy.get('.error-banner').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('debería iniciar sesión con credenciales correctas y luego cerrar sesión', () => {
    // Usamos el comando personalizado loginAdmin
    cy.loginAdmin();

    // Debería estar en el dashboard de admin
    cy.url().should('include', '/admin/dashboard');
    cy.get('.welcome-name').should('contain', 'Admin');

    // Cerrar sesión
    cy.contains('button', 'Cerrar Sesión').click({ force: true });
    cy.contains('button', 'Sí, cerrar sesión').click();

    // Debería redirigir al login
    cy.url().should('include', '/login');
  });
});
