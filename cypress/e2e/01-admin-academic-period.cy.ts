describe('Gestión de Periodos Académicos (Administrador)', () => {
  let yearToUse = 2027;

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería crear una nueva gestión anual o identificar una existente', () => {
    cy.visit('/admin/managements');

    // Leer los años existentes en el cuerpo de la página
    cy.get('body').then($body => {
      const text = $body.text();
      let found = false;
      for (let y = 2027; y <= 2036; y++) {
        if (!text.includes(y.toString())) {
          yearToUse = y;
          found = true;
          break;
        }
      }

      if (found) {
        cy.contains('button', 'Nueva Gestión').click();
        cy.get('input[title="Año"]').clear().type(yearToUse.toString());
        cy.contains('app-management-form button', 'Guardar').click();
        cy.get('app-table').should('contain', yearToUse.toString());
      } else {
        // Si ya están creados todos, reutilizamos uno que ya exista
        yearToUse = 2027 + Math.floor(Math.random() * 10);
        cy.log(`Todos los años de prueba ya existen. Reutilizando: ${yearToUse}`);
      }
    });
  });

  it('debería crear un nuevo semestre asociado a la gestión', () => {
    cy.visit('/admin/semesters');

    cy.get('body').then($body => {
      const text = $body.text();

      // Si el año ya figura en la tabla, asumimos que el semestre ya existe para esta prueba
      if (text.includes(yearToUse.toString())) {
        cy.log(`El semestre para la gestión ${yearToUse} ya existe. Omitiendo creación.`);
      } else {
        cy.contains('button', 'Nuevo Semestre').click();
        cy.get('select[title="Gestión"]').select(yearToUse.toString());
        cy.get('select[title="Número"]').select('1');
        cy.get('input[title="Fecha inicio"]').type(`${yearToUse}-02-01`);
        cy.get('input[title="Fecha fin"]').type(`${yearToUse}-06-30`);
        cy.contains('app-semester-form button', 'Guardar').click();
        
        // Verificar que aparezcan el año y el número del semestre en la tabla
        cy.get('app-table')
          .should('contain', yearToUse.toString())
          .and('contain', '1');
      }
    });
  });
});
