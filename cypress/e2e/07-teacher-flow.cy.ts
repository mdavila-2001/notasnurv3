describe('Flujo de Docente: Evaluación y Asistencia', () => {
  beforeEach(() => {
    cy.readFile('cypress/fixtures/teacher.json').then((teacher) => {
      cy.loginTeacher(teacher.email, teacher.password);
    });
  });

  it('debería configurar el plan de evaluación, tomar asistencia y cargar notas', () => {
    // 1. Verificar Dashboard y seleccionar la primera materia disponible
    cy.visit('/teacher/dashboard');
    cy.get('.subject-card').should('have.length.greaterThan', 0);
    
    // Entrar al detalle de la primera materia
    cy.get('.subject-card').first().click();

    // 2. Configuración del Plan de Evaluación
    // Navegar a la pestaña de Plan de Evaluación
    cy.contains('button.tab-btn', 'Configuración del Plan').click();

    // Si la materia ya tiene plan, el botón "Finalizar Configuración" puede no estar visible,
    // o el mensaje "Configuración completa" puede aparecer.
    cy.get('body').then($body => {
      // Si el botón Crear Plan existe, le damos clic
      if ($body.find('app-button:contains("Crear Plan de Evaluación")').length > 0) {
        cy.contains('app-button', 'Crear Plan de Evaluación').click();
      }

      // Si los componentes no suman 100% aún, los agregamos
      if ($body.find('.empty-components').length > 0 || $body.find('span:contains("Faltan")').length > 0) {
        // Añadir Parcial 1
        cy.get('input[placeholder="Nombre del componente"]').clear().type('Parcial 1');
        cy.get('input[placeholder="Peso (%)"]').clear().type('30');
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Primer parcial');
        cy.contains('app-button', 'Agregar').click();

        // Añadir Parcial 2
        cy.get('input[placeholder="Nombre del componente"]').clear().type('Parcial 2');
        cy.get('input[placeholder="Peso (%)"]').clear().type('30');
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Segundo parcial');
        cy.contains('app-button', 'Agregar').click();

        // Añadir Examen Final
        cy.get('input[placeholder="Nombre del componente"]').clear().type('Examen Final');
        cy.get('input[placeholder="Peso (%)"]').clear().type('40');
        cy.get('input[placeholder="Descripción (opcional)"]').clear().type('Evaluación final');
        cy.contains('app-button', 'Agregar').click();

        // Guardar el plan
        cy.contains('app-button', 'Finalizar Configuración').click();
      }
    });

    // 3. Tomar Asistencia
    cy.contains('button.tab-btn', 'Asistencia').click();
    
    // Verificar que hay estudiantes en la lista
    cy.get('app-table').should('exist');
    
    // Por simplicidad en la prueba, marcamos "Presente" a todos o al primero (haciendo clic en el botón de estado)
    // El sistema por defecto podría tenerlos "Pendiente", al hacer clic en el botón pasa a Presente.
    cy.get('body').then($body => {
        if($body.find('button.status-btn.pending').length > 0) {
            cy.get('button.status-btn.pending').first().click(); // Cambia a "Presente"
        }
    });
    
    // Guardar asistencia
    cy.contains('app-button', 'Guardar Lista').click();
    cy.contains('Confirmar Guardado').should('be.visible');
    cy.contains('app-modal app-button', 'Sí, guardar').click();
    
    // 4. Carga de Notas
    // Volvemos al Dashboard para usar el acceso directo rápido a "Notas"
    cy.visit('/teacher/dashboard');
    cy.get('.subject-card').first().within(() => {
        cy.contains('button', 'Notas').click();
    });

    // Verificar que estemos en la grilla de notas
    cy.get('.grade-grid-page').should('be.visible');

    // Ingresar notas válidas para el primer estudiante en la lista
    // Encontramos todos los inputs de nota de la primera fila
    cy.get('.student-cell').first().parents('tr').find('input[type="number"]').each(($input, index) => {
        // Para no fallar la validación de máximo, ponemos un valor seguro como 20 para todos los componentes
        cy.wrap($input).clear().type('20');
        // trigger blur para que se guarden temporalmente
        cy.wrap($input).blur();
    });

    // Guardar Notas
    cy.contains('app-button', 'Guardar todas las notas').click();
    cy.contains('app-modal app-button', 'Sí, guardar').click();
  });
});
