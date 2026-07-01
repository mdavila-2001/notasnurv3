describe('Flujo de Docente: Configuración del Plan de Evaluación', () => {
  beforeEach(() => {
    cy.readFile('cypress/fixtures/teacher.json').then((teacher) => {
      cy.loginTeacher(teacher.email, teacher.password);
      cy.wait(1500);
    });
  });

  it('debería configurar el plan de evaluación para la materia', () => {
    cy.visit('/teacher/dashboard').wait(1500);
    cy.get('.subject-card').should('have.length.greaterThan', 0);
    cy.get('.subject-card').first().click().wait(1500);

    cy.contains('app-button.tab-btn', 'Plan Evaluación').click().wait(1500);

    cy.get('body').then($body => {
      if ($body.find('app-button:contains("Crear Plan de Evaluación")').length > 0) {
        cy.contains('app-button', 'Crear Plan de Evaluación').find('button').click().wait(1500);
      }

      if ($body.find('.empty-components').length > 0 || $body.find('span:contains("Faltan")').length > 0) {
        cy.get('input[placeholder="Nombre del componente"]').clear().type('1er Parcial').wait(1500);
        cy.get('input[placeholder="Peso (%)"]').clear().type('20').wait(1500);
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Primer parcial').wait(1500);
        cy.contains('app-button', 'Agregar').find('button').click().wait(1500);

        cy.get('input[placeholder="Nombre del componente"]').clear().type('2do Parcial').wait(1500);
        cy.get('input[placeholder="Peso (%)"]').clear().type('20').wait(1500);
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Segundo parcial').wait(1500);
        cy.contains('app-button', 'Agregar').find('button').click().wait(1500);

        cy.get('input[placeholder="Nombre del componente"]').clear().type('Controles de Lectura').wait(1500);
        cy.get('input[placeholder="Peso (%)"]').clear().type('10').wait(1500);
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Controles de lectura').wait(1500);
        cy.contains('app-button', 'Agregar').find('button').click().wait(1500);
        
        cy.get('input[placeholder="Nombre del componente"]').clear().type('Trabajos Prácticos').wait(1500);
        cy.get('input[placeholder="Peso (%)"]').clear().type('35').wait(1500);
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Proyecto Final').wait(1500);
        cy.contains('app-button', 'Agregar').find('button').click().wait(1500);

        cy.get('input[placeholder="Nombre del componente"]').clear().type('Examen Final').wait(1500);
        cy.get('input[placeholder="Peso (%)"]').clear().type('15').wait(1500);
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Evaluación final').wait(1500);
        cy.contains('app-button', 'Agregar').find('button').click().wait(1500);

        cy.contains('app-button', 'Finalizar Configuración').find('button').click().wait(1500);
      }
    });
  });
});
