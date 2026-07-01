describe('Gestión de Usuarios y Matrículas (Administrador)', () => {
  beforeEach(() => {
    cy.loginAdmin();
    cy.wait(1500);
  });

  it('debería asignar el nuevo docente a la primera materia de la lista', () => {
    cy.readFile('cypress/fixtures/teacher.json').then((teacher) => {
      cy.visit('/admin/subjects').wait(1500);

      cy.get('app-table').should('exist');
      cy.contains('button', 'Editar').first().click().wait(1500);

      cy.get('select[title="Docente"]').select(`${teacher.name} ${teacher.lastName}`).wait(1500);
      cy.get('select[title="Estado de la Materia"]').select('Publicada').wait(1500);
      cy.contains('app-subject-form button', 'Guardar Materia').click().wait(1500);
    });
  });

  it('debería matricular al estudiante en la primera carrera y en la primera materia', () => {
    cy.readFile('cypress/fixtures/student.json').then((student) => {
      cy.visit('/admin/users').wait(1500);
      cy.contains('button.tab-btn', 'Estudiantes').click().wait(1500);

      cy.contains('tr', student.name).within(() => {
        cy.get('button[title="Expediente Académico"]').click().wait(1500);
      });

      cy.get('select[name="degreeToAssign"] option:not([disabled])').should('have.length.greaterThan', 0);
      cy.get('select[name="degreeToAssign"]').then(($select) => {
        const optionVal = $select.find('option:not([disabled])').eq(0).val();
        if (optionVal) cy.get('select[name="degreeToAssign"]').select(optionVal).wait(1500);
      });

      cy.contains('button', 'Matricular en Carrera').click().wait(1500);
      cy.contains('span.status-badge', 'Activo').should('be.visible');
      cy.get('app-modal').contains('button', 'Cerrar').click().wait(1500);

      cy.visit('/admin/enrollments').wait(1500);
      cy.get('.subject-item').first().click().wait(1500);
      cy.contains('button', 'Matricular Alumno').click().wait(1500);

      cy.get('select').eq(0).contains('option', `${student.name} ${student.lastName} (CI: ${student.ci})`).should('exist');
      cy.get('select').eq(0).select(`${student.name} ${student.lastName} (CI: ${student.ci})`).wait(1500);
      cy.contains('button', 'Confirmar Matrícula').click().wait(1500);

      cy.get('.students-table').should('contain', student.name);
    });
  });
});
