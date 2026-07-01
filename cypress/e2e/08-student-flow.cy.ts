describe('Flujo de Estudiante: Portal, Notas y Asistencia', () => {
  beforeEach(() => {
    cy.readFile('cypress/fixtures/student.json').then((student) => {
      cy.loginStudent(student.email, student.password);
    });
  });

  it('debería visualizar su dashboard, detalle de notas y registro de asistencia', () => {
    cy.visit('/student/dashboard');
    
    cy.get('.subject-card').should('have.length.greaterThan', 0);
    cy.get('.subject-card').first().click();
    
    cy.url().should('include', '/student/subject/');

    cy.get('body').then($body => {
      if ($body.find('app-table').length > 0) {
        cy.contains('Parcial 1').should('be.visible');
        cy.contains('Parcial 2').should('be.visible');
        cy.contains('Examen Final').should('be.visible');
        cy.contains('20').should('be.visible');
      }
    });

    cy.visit('/student/attendance');
    cy.get('.attendance-summary-card, app-table').should('exist');
  });
});
