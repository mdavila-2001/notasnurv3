describe('Flujo de Docente: Toma de Asistencia y Calificación', () => {
  beforeEach(() => {
    cy.readFile('cypress/fixtures/teacher.json').then((teacher) => {
      cy.loginTeacher(teacher.email, teacher.password);
      cy.wait(1500);
    });
  });

  it('debería tomar la asistencia de los estudiantes', () => {
    cy.visit('/teacher/dashboard').wait(1500);
    cy.get('.subject-card').should('have.length.greaterThan', 0);
    cy.get('.subject-card').first().click().wait(1500);

    cy.contains('app-button.tab-btn', 'Asistencia').click().wait(1500);
    
    cy.get('.attendance-table').should('exist');
    
    cy.get('body').then($body => {
      if ($body.find('app-button.attendance-chip').length > 0) {
        cy.contains('app-button.attendance-chip', 'Falta').find('button').click().wait(1500);
      }
    });
    
    cy.contains('app-button', 'Guardar Asistencia del Día').find('button').click().wait(1500);
  });

  it('debería validar los límites de nota máxima permitida en los componentes', () => {
    cy.visit('/teacher/dashboard').wait(1500);
    cy.get('.subject-card').should('have.length.greaterThan', 0);
    cy.get('.subject-card').first().within(() => {
      cy.contains('button', 'Notas').click().wait(1500);
    });

    cy.get('.grade-grid-page').should('be.visible');

    // El primer componente es "1er Parcial" con peso de 20. Escribimos 25 (inválido).
    cy.get('.student-cell').first().parents('tr').find('input[type="number"]').first().clear().type('25').wait(500);
    cy.get('.student-cell').first().parents('tr').find('input[type="number"]').first().blur().wait(1500);

    // Debería mostrar el mensaje de error de valor máximo en el input
    cy.contains('.error-message', 'El valor máximo es 20').should('be.visible');

    // El botón de guardar todas las notas debería estar deshabilitado
    cy.contains('app-button', 'Guardar todas las notas').find('button').should('be.disabled');
  });

  it('debería permitir guardar notas válidas correctamente', () => {
    cy.visit('/teacher/dashboard').wait(1500);
    cy.get('.subject-card').should('have.length.greaterThan', 0);
    cy.get('.subject-card').first().within(() => {
      cy.contains('button', 'Notas').click().wait(1500);
    });

    cy.get('.grade-grid-page').should('be.visible');

    // Ingresar notas válidas dentro del límite para todos los campos:
    // Parcial 1 (max 20) -> 20
    // Parcial 2 (max 20) -> 20
    // Controles (max 10) -> 10
    // Trabajos Prácticos (max 35) -> 30
    // Examen Final (max 15) -> 15
    const grades = ['20', '20', '10', '30', '15'];
    
    cy.get('.student-cell').first().parents('tr').find('input[type="number"]').each(($input, index) => {
      cy.wrap($input).clear().type(grades[index]).wait(500);
      cy.wrap($input).blur();
    });
    cy.wait(1500);

    cy.contains('app-button', 'Guardar todas las notas').find('button').should('not.be.disabled');
    cy.contains('app-button', 'Guardar todas las notas').find('button').click().wait(1500);
    cy.contains('app-modal app-button', 'Sí, guardar').find('button').click().wait(1500);
  });
});
