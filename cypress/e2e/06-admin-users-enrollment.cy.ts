import { faker } from '@faker-js/faker';

describe('Gestión de Usuarios y Matrículas (Administrador)', () => {
  const randomSuffix = Math.floor(Math.random() * 10000).toString();
  const facultyName = `Facultad E2E ${randomSuffix}`;
  const facultyCode = `FE${randomSuffix.slice(0, 2)}`;
  const degreeName = `Carrera E2E ${randomSuffix}`;
  const degreeCode = `CE${randomSuffix.slice(0, 2)}`;
  const subjectName = `Materia E2E ${randomSuffix}`;
  const subjectCode = `ME-${randomSuffix.slice(0, 4)}`;

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería configurar el catálogo académico (facultad, carrera, materia)', () => {
    // 1. Crear Facultad
    cy.visit('/admin/faculties');
    cy.contains('button', 'Nueva Facultad').click();
    cy.get('input[title="Nombre de la Facultad"]').type(facultyName);
    cy.get('input[title="Código"]').type(facultyCode);
    cy.contains('app-faculty-form button', 'Guardar').click();
    cy.get('app-table').should('contain', facultyName);

    // 2. Crear Carrera
    cy.visit('/admin/degrees');
    cy.contains('button', 'Nueva Carrera').click();
    cy.get('select[title="Seleccionar facultad"]').select(facultyName);
    cy.get('input[title="Nombre de la Carrera"]').type(degreeName);
    cy.get('input[title="Código"]').type(degreeCode);
    cy.contains('app-degree-form button', 'Guardar').click();
    cy.get('app-table').should('contain', degreeName);

    // 3. Crear Materia
    cy.visit('/admin/subjects');
    cy.contains('button', 'Nueva Materia').click();
    cy.get('input[title="Código de Materia"]').type(subjectCode);
    cy.get('input[title="Nombre de Materia"]').type(subjectName);
    cy.get('select[title="Modalidad"]').select('FACE_TO_FACE');
    cy.get('input[title="Capacidad (cupos)"]').clear().type('10');

    // Seleccionar Semestre
    cy.get('select[title="Semestre"] option:not([disabled])').should('have.length.greaterThan', 0);
    cy.get('select[title="Semestre"]').then(($select) => {
      const optionVal = $select.find('option:not([disabled])').eq(0).val();
      if (optionVal) cy.get('select[title="Semestre"]').select(optionVal);
    });

    // Seleccionar Docente temporal (cualquiera existente de momento)
    cy.get('select[title="Docente"] option:not([disabled])').should('have.length.greaterThan', 0);
    cy.get('select[title="Docente"]').then(($select) => {
      const optionVal = $select.find('option:not([disabled])').eq(0).val();
      if (optionVal) cy.get('select[title="Docente"]').select(optionVal);
    });

    cy.get('select[title="Estado de la Materia"]').select('PUBLISHED');
    cy.contains('app-subject-form button', 'Guardar Materia').click();
    cy.get('app-table').should('contain', subjectName);
  });

  it('debería asignar el nuevo docente a la materia creada', () => {
    // Cargar los datos del docente creados en admin-create-teacher.cy.ts
    cy.readFile('cypress/fixtures/teacher.json').then((teacher) => {
      cy.visit('/admin/subjects');
      // Buscamos la fila de nuestra materia y hacemos clic en Editar
      cy.contains('tr', subjectName).within(() => {
        cy.contains('button', 'Editar').click();
      });
      // Cambiar al nuevo docente por su nombre cargado
      cy.get('select[title="Docente"]').select(`${teacher.name} ${teacher.lastName}`);
      cy.contains('app-subject-form button', 'Guardar Materia').click();
    });
  });

  it('debería matricular al estudiante en la carrera y en la materia', () => {
    // Cargar los datos del estudiante creados en admin-create-student.cy.ts
    cy.readFile('cypress/fixtures/student.json').then((student) => {
      cy.visit('/admin/users');
      cy.contains('button.tab-btn', 'Estudiantes').click();
      cy.contains('tr', student.name).within(() => {
        cy.get('button[title="Expediente Académico"]').click();
      });
      // En el modal de expediente académico, seleccionar carrera y hacer clic en Matricular
      cy.get('select[name="degreeToAssign"]').contains('option', degreeName).should('exist');
      cy.get('select[name="degreeToAssign"]').select(degreeName);
      cy.contains('button', 'Matricular en Carrera').click();
      cy.contains('span.status-badge', 'Activo').should('be.visible');
      cy.contains('button', 'Cerrar').click();

      // Matricular Estudiante en la Materia (Inscripción)
      cy.visit('/admin/enrollments');
      cy.get('.subject-item').contains(subjectName).click();
      cy.contains('button', 'Matricular Alumno').click();
      cy.get('select').eq(0).contains('option', `${student.name} ${student.lastName} (CI: ${student.ci})`).should('exist');
      cy.get('select').eq(0).select(`${student.name} ${student.lastName} (CI: ${student.ci})`);
      cy.contains('button', 'Confirmar Matrícula').click();

      // Verificar que aparece en la tabla derecha de alumnos matriculados
      cy.get('.students-table').should('contain', student.name);
    });
  });
});
