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
    cy.visit('/admin/faculties');
    cy.contains('button', 'Nueva Facultad').click();

    cy.get('input[title="Nombre de la Facultad"]').type(facultyName);
    cy.get('input[title="Código"]').type(facultyCode);
    cy.contains('app-faculty-form button', 'Guardar').click();

    cy.get('app-table').should('contain', facultyName);
  });

  it('debería crear una nueva carrera asociada a la facultad creada', () => {
    cy.visit('/admin/degrees');
    cy.contains('button', 'Nueva Carrera').click();

    // Seleccionar la facultad creada usando su selector de título
    cy.get('select[title="Seleccionar facultad"]').select(facultyName);

    cy.get('input[title="Nombre de la Carrera"]').type(degreeName);
    cy.get('input[title="Código"]').type(degreeCode);
    cy.contains('app-degree-form button', 'Guardar').click();

    cy.get('app-table').should('contain', degreeName);
  });

  it('debería crear una nueva materia', () => {
    cy.visit('/admin/subjects');
    cy.contains('button', 'Nueva Materia').click();

    cy.get('input[title="Código de Materia"]').type(subjectCode);
    cy.get('input[title="Nombre de Materia"]').type(subjectName);
    
    // Seleccionar modalidad
    cy.get('select[title="Modalidad"]').select('FACE_TO_FACE');
    
    cy.get('input[title="Capacidad (cupos)"]').clear().type('35');

    // Seleccionar semestre (tomamos la primera opción disponible después de la vacía)
    cy.get('select[title="Semestre"]').then(($select) => {
      const optionVal = $select.find('option:not([disabled])').eq(0).val();
      if (optionVal) {
        cy.get('select[title="Semestre"]').select(optionVal);
      }
    });

    // Seleccionar docente (tomamos la primera opción disponible)
    cy.get('select[title="Docente"]').then(($select) => {
      const optionVal = $select.find('option:not([disabled])').eq(0).val();
      if (optionVal) {
        cy.get('select[title="Docente"]').select(optionVal);
      }
    });

    // Seleccionar estado de materia (ej. DRAFT)
    cy.get('select[title="Estado de la Materia"]').select('DRAFT');

    cy.contains('app-subject-form button', 'Guardar Materia').click();

    // Verificar que aparezca en la lista
    cy.get('app-table').should('contain', subjectName);
  });
});
