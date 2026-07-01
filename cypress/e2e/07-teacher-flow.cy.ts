describe('Flujo de Docente: Evaluación y Asistencia', () => {
  beforeEach(() => {
    cy.readFile('cypress/fixtures/teacher.json').then((teacher) => {
      cy.loginTeacher(teacher.email, teacher.password);
    });
  });

  it('debería configurar el plan de evaluación, tomar asistencia y cargar notas', () => {
    cy.visit('/teacher/dashboard');
    cy.get('.subject-card').should('have.length.greaterThan', 0);
    cy.get('.subject-card').first().click();

    cy.contains('button.tab-btn', 'Configuración del Plan').click();

    cy.get('body').then($body => {
      if ($body.find('app-button:contains("Crear Plan de Evaluación")').length > 0) {
        cy.contains('app-button', 'Crear Plan de Evaluación').click();
      }

      if ($body.find('.empty-components').length > 0 || $body.find('span:contains("Faltan")').length > 0) {
        cy.get('input[placeholder="Nombre del componente"]').clear().type('Parcial 1');
        cy.get('input[placeholder="Peso (%)"]').clear().type('30');
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Primer parcial');
        cy.contains('app-button', 'Agregar').click();

        cy.get('input[placeholder="Nombre del componente"]').clear().type('Parcial 2');
        cy.get('input[placeholder="Peso (%)"]').clear().type('30');
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Segundo parcial');
        cy.contains('app-button', 'Agregar').click();

        cy.get('input[placeholder="Nombre del componente"]').clear().type('Examen Final');
        cy.get('input[placeholder="Peso (%)"]').clear().type('40');
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Evaluación final');
        cy.contains('app-button', 'Agregar').click();

        cy.contains('app-button', 'Finalizar Configuración').click();
      }
    });

    cy.contains('button.tab-btn', 'Asistencia').click();
    
    cy.get('app-table').should('exist');
    
    cy.get('body').then($body => {
        if($body.find('button.status-btn.pending').length > 0) {
            cy.get('button.status-btn.pending').first().click();
        }
    });
    
    cy.contains('app-button', 'Guardar Lista').click();
    cy.contains('Confirmar Guardado').should('be.visible');
    cy.contains('app-modal app-button', 'Sí, guardar').click();
    
    cy.visit('/teacher/dashboard');
    cy.get('.subject-card').first().within(() => {
        cy.contains('button', 'Notas').click();
    });

    cy.get('.grade-grid-page').should('be.visible');

    cy.get('.student-cell').first().parents('tr').find('input[type="number"]').each(($input, index) => {
        cy.wrap($input).clear().type('20');
        cy.wrap($input).blur();
    });

    cy.contains('app-button', 'Guardar todas las notas').click();
    cy.contains('app-modal app-button', 'Sí, guardar').click();
  });
});
