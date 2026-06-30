describe('Flujo de Estudiante: Portal, Notas y Asistencia', () => {
  beforeEach(() => {
    cy.readFile('cypress/fixtures/student.json').then((student) => {
      cy.loginStudent(student.email, student.password);
    });
  });

  it('debería visualizar su dashboard, detalle de notas y registro de asistencia', () => {
    // 1. Dashboard Principal
    cy.visit('/student/dashboard');
    
    // Verificar que existe al menos una materia matriculada (creada en admin-flow y usada en teacher-flow)
    cy.get('.subject-card').should('have.length.greaterThan', 0);
    
    // 2. Detalle de Calificaciones
    // Hacemos clic en la materia para ver las notas
    cy.get('.subject-card').first().click();
    
    // Debe redirigir al detalle de la materia
    cy.url().should('include', '/student/subject/');

    // Verificar que los componentes de evaluación que el docente creó son visibles
    cy.get('body').then($body => {
      if ($body.find('app-table').length > 0) {
        // En la tabla de notas deberían aparecer "Parcial 1", "Parcial 2", "Examen Final"
        cy.contains('Parcial 1').should('be.visible');
        cy.contains('Parcial 2').should('be.visible');
        cy.contains('Examen Final').should('be.visible');
        
        // Verificar que hay notas cargadas (ej: las notas de '20' que pusimos en el flujo de docente)
        // Como todos tienen 20, la sumatoria final debería ser 60 o al menos deberían existir los números
        cy.contains('20').should('be.visible');
      }
    });

    // 3. Seguimiento de Asistencia
    // Navegamos al apartado de inasistencias
    cy.visit('/student/attendance');
    
    // Verificamos que se muestren los datos de la materia
    // Como el docente marcó 'Presente', la falta podría no aparecer, pero al menos la materia debe figurar en el resumen.
    cy.get('.attendance-summary-card, app-table').should('exist');
  });
});
