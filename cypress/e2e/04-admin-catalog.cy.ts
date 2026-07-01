describe('Gestión de Catálogo Académico (Administrador)', () => {
  const randomSuffix = Math.floor(Math.random() * 10000).toString();
  const facultyName = `Facultad de Test ${randomSuffix}`;
  const facultyCode = `FT${randomSuffix.slice(0, 2)}`;
  const degreeName = `Carrera de Test ${randomSuffix}`;
  const degreeCode = `CT${randomSuffix.slice(0, 2)}`;
  const subjectName = `Materia de Test ${randomSuffix}`;
  const subjectCode = `MAT-${randomSuffix.slice(0, 4)}`;

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería crear una nueva facultad', () => {
    cy.visit('/admin/faculties').wait(1500);
    cy.contains('button', 'Nueva Facultad').click().wait(1500);

    cy.get('input[title="Nombre de la Facultad"]').type(facultyName).wait(1500);
    cy.get('input[title="Código"]').type(facultyCode).wait(1500);
    cy.contains('app-faculty-form button', 'Guardar').click().wait(1500);

    cy.get('app-table').should('contain', facultyName);
  });

  it('debería crear una nueva carrera asociada a la facultad creada', () => {
    cy.visit('/admin/degrees').wait(1500);
    cy.contains('button', 'Nueva Carrera').click().wait(1500);

    cy.get('select[title="Seleccionar facultad"]').select(facultyName).wait(1500);
    cy.get('input[title="Nombre de la Carrera"]').type(degreeName).wait(1500);
    cy.get('input[title="Código"]').type(degreeCode).wait(1500);
    cy.contains('app-degree-form button', 'Guardar').click().wait(1500);

    cy.get('app-table').should('contain', degreeName);
  });

  it('debería crear una nueva materia', () => {
    cy.visit('/admin/subjects').wait(1500);
    cy.contains('button', 'Nueva Materia').click().wait(1500);

    cy.get('input[title="Código de Materia"]').type(subjectCode).wait(1500);
    cy.get('input[title="Nombre de Materia"]').type(subjectName).wait(1500);
    
    cy.get('select[title="Modalidad"]').select('FACE_TO_FACE').wait(1500);
    cy.get('input[title="Capacidad (cupos)"]').clear().type('10').wait(1500);

    cy.get('select[title="Semestre"] option:not([disabled])').should('have.length.greaterThan', 0);
    cy.get('select[title="Semestre"]').then(($select) => {
      const optionVal = $select.find('option:not([disabled])').eq(0).val();
      if (optionVal) {
        cy.get('select[title="Semestre"]').select(optionVal).wait(1500);
      }
    });

    cy.get('select[title="Docente"] option:not([disabled])').should('have.length.greaterThan', 0);
    cy.get('select[title="Docente"]').then(($select) => {
      const optionVal = $select.find('option:not([disabled])').eq(0).val();
      if (optionVal) {
        cy.get('select[title="Docente"]').select(optionVal).wait(1500);
      }
    });

    cy.get('select[title="Estado de la Materia"]').select('DRAFT').wait(1500);
    cy.contains('app-subject-form button', 'Guardar Materia').click().wait(1500);

    cy.get('app-table').should('contain', subjectName);
  });
});
