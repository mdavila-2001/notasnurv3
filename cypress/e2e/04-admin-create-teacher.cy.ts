import { faker } from '@faker-js/faker';

describe('Registro de Docente de Pruebas (Administrador)', () => {
  const teacherName = faker.person.firstName();
  const teacherLastName = faker.person.lastName();
  let teacherCi = '';
  const teacherPassword = '12345678';

  before(() => {
    cy.readFile('cypress/fixtures/last-teacher-ci.json').then((data) => {
      const lastCi = data && data.ci ? Number(data.ci) : 101000;
      const nextCi = lastCi + 1;
      teacherCi = nextCi.toString();
      cy.writeFile('cypress/fixtures/last-teacher-ci.json', { ci: nextCi });
    });
  });

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería registrar un nuevo docente dinámico y guardar los datos', () => {
    cy.visit('/admin/users');
    cy.contains('button.tab-btn', 'Docentes').click();
    cy.contains('button', 'Registrar Nuevo Docente').click();

    cy.get('input[placeholder="Ej: Juan"]').type('René');
    cy.get('input[placeholder="Ej: Perez"]').type('Muñoz Ørberg');
    cy.get('input[placeholder="usuario@nur.edu.bo"]').should('have.value', 'rmunozorberg@nur.edu.bo');

    cy.get('input[placeholder="Ej: Juan"]').clear().type(teacherName);
    cy.get('input[placeholder="Ej: Perez"]').clear().type(teacherLastName);
    
    cy.get('input[placeholder="usuario@nur.edu.bo"]').should('contain.value', '@nur.edu.bo');

    cy.get('input[placeholder="usuario@nur.edu.bo"]').invoke('val').then((val) => {
      const generatedEmail = val as string;
      
      cy.get('input[placeholder="1234567"]').type(teacherCi);
      cy.get('input[placeholder="Mínimo 8 caracteres"]').type(teacherPassword);
      cy.contains('app-modal button', 'Guardar en Base de Datos').click();
      
      cy.get('.docentes-table').should('contain', teacherName);

      cy.writeFile('cypress/fixtures/teacher.json', {
        name: teacherName,
        lastName: teacherLastName,
        ci: teacherCi,
        email: generatedEmail,
        password: teacherPassword
      });
    });
  });
});
