describe('Gestión de Usuarios y Matrículas (Administrador)', () => {
  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería asignar el nuevo docente a la primera materia de la lista', () => {
    cy.readFile('cypress/fixtures/teacher.json').then((teacher) => {
      cy.visit('/admin/subjects');
      
      cy.get('app-table').should('exist');
      cy.contains('button', 'Editar').first().click();

      cy.get('select[title="Docente"]').select(`${teacher.name} ${teacher.lastName}`);
      cy.contains('app-subject-form button', 'Guardar Materia').click();
    });
  });

  it('debería matricular al estudiante en la primera carrera y en la primera materia', () => {
    cy.readFile('cypress/fixtures/student.json').then((student) => {
      cy.visit('/admin/users');
      cy.contains('button.tab-btn', 'Estudiantes').click();
      
      cy.contains('tr', student.name).within(() => {
        cy.get('button[title="Expediente Académico"]').click();
      });

      cy.get('select[name="degreeToAssign"] option:not([disabled])').should('have.length.greaterThan', 0);
      cy.get('select[name="degreeToAssign"]').then(($select) => {
        const optionVal = $select.find('option:not([disabled])').eq(0).val();
        if (optionVal) cy.get('select[name="degreeToAssign"]').select(optionVal);
      });

      cy.contains('button', 'Matricular en Carrera').click();
      cy.contains('span.status-badge', 'Activo').should('be.visible');
      cy.get('app-modal').contains('button', 'Cerrar').click();

      cy.visit('/admin/enrollments');
      cy.get('.subject-item').first().click();
      cy.contains('button', 'Matricular Alumno').click();
      
      cy.get('select').eq(0).contains('option', `${student.name} ${student.lastName} (CI: ${student.ci})`).should('exist');
      cy.get('select').eq(0).select(`${student.name} ${student.lastName} (CI: ${student.ci})`);
      cy.contains('button', 'Confirmar Matrícula').click();

      cy.get('.students-table').should('contain', student.name);
    });
  });
});
