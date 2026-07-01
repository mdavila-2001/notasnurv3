import { faker } from '@faker-js/faker';

describe('Registro de Docente de Pruebas (Administrador)', () => {
  const teacherName = faker.person.firstName();
  const teacherLastName = faker.person.lastName();
  let teacherCi = '';
  const teacherPassword = '12345678';

  before(() => {
    cy.readFile('cypress/fixtures/last-teacher-ci.json').then((data) => {
      const lastCi = data?.ci ? Number(data.ci) : 101000;
      const nextCi = lastCi + 1;
      teacherCi = nextCi.toString();
      cy.writeFile('cypress/fixtures/last-teacher-ci.json', { ci: nextCi });
    });
  });

  beforeEach(() => {
    cy.loginAdmin();
    cy.wait(1500);
  });

  it('debería registrar un nuevo docente dinámico y guardar los datos', () => {
    cy.visit('/admin/users').wait(1500);
    cy.contains('button.tab-btn', 'Docentes').click().wait(1500);
    cy.contains('button', 'Registrar Nuevo Docente').click().wait(1500);

    cy.get('input[placeholder="Ej: Juan"]').type('René').wait(1500);
    cy.get('input[placeholder="Ej: Perez"]').type('Muñoz Ørberg').wait(1500);
    cy.get('input[placeholder="usuario@nur.edu.bo"]').should('have.value', 'rmunozorberg@nur.edu.bo');

    cy.get('input[placeholder="Ej: Juan"]').clear().type(teacherName).wait(1500);
    cy.get('input[placeholder="Ej: Perez"]').clear().type(teacherLastName).wait(1500);
    
    cy.get('input[placeholder="usuario@nur.edu.bo"]').should('contain.value', '@nur.edu.bo');

    cy.get('input[placeholder="usuario@nur.edu.bo"]').invoke('val').then((val) => {
      const generatedEmail = val as string;
      
      cy.get('input[placeholder="1234567"]').type(teacherCi).wait(1500);
      cy.get('input[placeholder="Mínimo 8 caracteres"]').type(teacherPassword).wait(1500);
      cy.contains('app-modal button', 'Guardar en Base de Datos').click().wait(1500);
      
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
