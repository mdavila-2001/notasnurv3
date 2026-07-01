describe('Gestión de Periodos Académicos (Administrador)', () => {
  let yearToUse = 2027;

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería crear una nueva gestión anual o identificar una existente', () => {
    cy.visit('/admin/managements').wait(1500);

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
        cy.contains('button', 'Nueva Gestión').click().wait(1500);
        cy.get('input[title="Año"]').clear().type(yearToUse.toString()).wait(1500);
        cy.contains('app-management-form button', 'Guardar').click().wait(1500);
        cy.get('app-table').should('contain', yearToUse.toString());
      } else {
        yearToUse = 2027 + Math.floor(Math.random() * 10);
        cy.log(`Todos los años de prueba ya existen. Reutilizando: ${yearToUse}`);
      }
    });
  });

  it('debería crear un nuevo semestre asociado a la gestión', () => {
    cy.visit('/admin/semesters').wait(1500);

    cy.get('body').then($body => {
      const text = $body.text();

      if (text.includes(`${yearToUse}-1`) || (text.includes(yearToUse.toString()) && text.includes('1'))) {
        cy.log(`El semestre para la gestión ${yearToUse} ya existe. Omitiendo creación.`);
      } else {
        cy.contains('button', 'Nuevo Semestre').click().wait(1500);
        cy.get('select[title="Gestión"]').select(yearToUse.toString()).wait(1500);
        cy.get('select[title="Número"]').select('1').wait(1500);
        cy.get('input[title="Fecha inicio"]').type(`${yearToUse}-01-15`).wait(1500);
        cy.get('input[title="Fecha fin"]').type(`${yearToUse}-06-30`).wait(1500);
        cy.contains('app-semester-form button', 'Guardar').click().wait(1500);
        
        cy.get('app-table')
          .should('contain', yearToUse.toString())
          .and('contain', '1');
      }
    });
  });
});
