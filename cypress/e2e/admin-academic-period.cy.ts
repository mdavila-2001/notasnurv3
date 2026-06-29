describe('Gestión de Periodos Académicos (Administrador)', () => {
  const randomYear = 2027 + Math.floor(Math.random() * 9);

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería crear una nueva gestión anual', () => {
    cy.visit('/admin/managements');
    cy.contains('button', 'Nueva Gestión').click();

    // Llenar el formulario usando el atributo title generado por app-input
    cy.get('input[title="Año"]').clear().type(randomYear.toString());
    cy.contains('app-management-form button', 'Guardar').click();

    // Verificar que aparezca en la lista
    cy.get('app-table').should('contain', randomYear.toString());
  });

  it('debería crear un nuevo semestre asociado a la gestión creada', () => {
    cy.visit('/admin/semesters');
    cy.contains('button', 'Nuevo Semestre').click();

    // Seleccionar la gestión creada
    cy.get('select[title="Gestión"]').select(randomYear.toString());

    // Seleccionar el número de semestre (1 o 2)
    cy.get('select[title="Número"]').select('1');

    // Configurar fechas de inicio y fin acordes al año
    cy.get('input[title="Fecha inicio"]').type(`${randomYear}-02-01`);
    cy.get('input[title="Fecha fin"]').type(`${randomYear}-06-30`);

    cy.contains('app-semester-form button', 'Guardar').click();

    // Verificar que el semestre aparezca en la lista
    cy.get('app-table').should('contain', `${randomYear}-1`);
  });
});
