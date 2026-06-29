describe('Gestión de Usuarios y Matrículas (Administrador)', () => {
  const randomSuffix = Math.floor(Math.random() * 10000).toString();
  const facultyName = `Facultad E2E ${randomSuffix}`;
  const facultyCode = `FE${randomSuffix.slice(0, 2)}`;
  const degreeName = `Carrera E2E ${randomSuffix}`;
  const degreeCode = `CE${randomSuffix.slice(0, 2)}`;
  const subjectName = `Materia E2E ${randomSuffix}`;
  const subjectCode = `ME-${randomSuffix.slice(0, 4)}`;

  const teacherName = `Docente E2E ${randomSuffix}`;
  const teacherLastName = `ApellidoT ${randomSuffix}`;
  const teacherCi = `11${randomSuffix.padEnd(5, '0')}`;
  const teacherEmail = `teacher_${randomSuffix}@nur.edu.bo`;

  const studentName = `Estudiante E2E ${randomSuffix}`;
  const studentLastName = `ApellidoE ${randomSuffix}`;
  const studentCi = `22${randomSuffix.padEnd(5, '0')}`;
  const studentEmail = `${studentCi}@nur.edu.bo`; // El frontend lo autogenera a partir del CI

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería ejecutar el flujo completo de catálogo, registro de usuarios y matriculación', () => {
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

    // 3. Crear Materia (Inicialmente sin docente asignado, o asignado temporalmente)
    cy.visit('/admin/subjects');
    cy.contains('button', 'Nueva Materia').click();
    cy.get('input[title="Código de Materia"]').type(subjectCode);
    cy.get('input[title="Nombre de Materia"]').type(subjectName);
    cy.get('select[title="Modalidad"]').select('FACE_TO_FACE');
    cy.get('input[title="Capacidad (cupos)"]').clear().type('10');

    // Seleccionar Semestre
    cy.get('select[title="Semestre"]').then(($select) => {
      const optionVal = $select.find('option:not([disabled])').eq(0).val();
      if (optionVal) cy.get('select[title="Semestre"]').select(optionVal);
    });

    // Seleccionar Docente temporal (cualquiera existente de momento)
    cy.get('select[title="Docente"]').then(($select) => {
      const optionVal = $select.find('option:not([disabled])').eq(0).val();
      if (optionVal) cy.get('select[title="Docente"]').select(optionVal);
    });

    cy.get('select[title="Estado de la Materia"]').select('PUBLISHED'); // Debe estar publicada para aparecer en Matrículas
    cy.contains('app-subject-form button', 'Guardar Materia').click();
    cy.get('app-table').should('contain', subjectName);

    // 4. Crear Nuevo Docente en la pestaña de Docentes
    cy.visit('/admin/users');
    cy.contains('button.tab-btn', 'Docentes').click();
    cy.contains('button', 'Registrar Nuevo Docente').click();

    cy.get('input[placeholder="Ej: Juan"]').type(teacherName);
    cy.get('input[placeholder="Ej: Perez"]').type(teacherLastName);
    cy.get('input[placeholder="usuario@nur.edu.bo"]').type(teacherEmail);
    cy.get('input[placeholder="1234567"]').type(teacherCi);
    cy.get('input[placeholder="Mínimo 8 caracteres"]').type('Password123');
    cy.contains('app-modal button', 'Guardar en Base de Datos').click();
    
    // Verificar que se listó
    cy.get('.docentes-table').should('contain', teacherName);

    // 5. Asignar el nuevo Docente a la Materia creada
    cy.visit('/admin/subjects');
    // Buscamos la fila de nuestra materia y hacemos clic en Editar
    cy.contains('tr', subjectName).within(() => {
      cy.contains('button', 'Editar').click();
    });
    // Cambiar al nuevo docente
    cy.get('select[title="Docente"]').select(`${teacherName} ${teacherLastName}`);
    cy.contains('app-subject-form button', 'Guardar Materia').click();

    // 6. Crear Nuevo Estudiante
    cy.visit('/admin/users');
    cy.contains('button.tab-btn', 'Estudiantes').click();
    cy.contains('button', 'Registrar Nuevo Estudiante').click();

    cy.get('input[placeholder="Ej: Juan"]').type(studentName);
    cy.get('input[placeholder="Ej: Perez"]').type(studentLastName);
    cy.get('input[placeholder="1234567"]').type(studentCi); // Esto autogenera el email en el input de abajo
    cy.get('input[placeholder="Mínimo 8 caracteres"]').type('Password123');
    cy.contains('app-modal button', 'Guardar en Base de Datos').click();

    // Verificar en la tabla de estudiantes
    cy.get('.docentes-table').should('contain', studentName);

    // 7. Matricular Estudiante en la Carrera (Crear su expediente académico)
    cy.contains('tr', studentName).within(() => {
      cy.get('button[title="Expediente Académico"]').click();
    });
    // En el modal de expediente académico, seleccionar carrera y hacer clic en Matricular
    cy.get('select[name="degreeToAssign"]').select(degreeName);
    cy.contains('button', 'Matricular en Carrera').click();
    cy.contains('span.status-badge', 'Activo').should('be.visible');
    cy.contains('button', 'Cerrar').click();

    // 8. Matricular Estudiante en la Materia (Inscripción)
    cy.visit('/admin/enrollments');
    // Seleccionar materia de la lista izquierda
    cy.get('.subject-item').contains(subjectName).click();
    // Hacer clic en Matricular Alumno en panel derecho
    cy.contains('button', 'Matricular Alumno').click();
    // Seleccionar de la nómina
    cy.get('select').eq(0).select(`${studentName} ${studentLastName} (CI: ${studentCi})`);
    // Confirmar matrícula
    cy.contains('button', 'Confirmar Matrícula').click();

    // Verificar que aparece en la tabla derecha de alumnos matriculados
    cy.get('.students-table').should('contain', studentName);
  });
});
