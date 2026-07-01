import { faker } from '@faker-js/faker';

describe('Registro de Estudiante de Pruebas (Administrador)', () => {
  const studentName = faker.person.firstName();
  const studentLastName = faker.person.lastName();
  let studentCi = '';
  const studentPassword = '1234';

  before(() => {
    cy.readFile('cypress/fixtures/last-student-ci.json').then((data) => {
      const lastCi = data?.ci ? Number(data.ci) : 202000;
      const nextCi = lastCi + 1;
      studentCi = nextCi.toString();
      cy.writeFile('cypress/fixtures/last-student-ci.json', { ci: nextCi });
    });
  });

  beforeEach(() => {
    cy.loginAdmin();
    cy.wait(1500);
  });

  it('debería registrar un nuevo estudiante con CI incremental y guardar los datos', () => {
    cy.visit('/admin/users').wait(1500);
    cy.contains('button.tab-btn', 'Estudiantes').click().wait(1500);
    cy.contains('button', 'Registrar Nuevo Estudiante').click().wait(1500);

    cy.get('input[placeholder="Ej: Juan"]').type(studentName).wait(1500);
    cy.get('input[placeholder="Ej: Perez"]').type(studentLastName).wait(1500);
    cy.get('input[placeholder="1234567"]').type(studentCi).wait(1500);
    
    cy.get('input[placeholder="usuario@nur.edu.bo"]').should('have.value', `${studentCi}@nur.edu.bo`);

    cy.get('input[placeholder="Mínimo 8 caracteres"]').type(studentPassword).wait(1500);
    cy.contains('app-modal button', 'Guardar en Base de Datos').click().wait(1500);

    cy.get('.docentes-table').should('contain', studentName);

    cy.writeFile('cypress/fixtures/student.json', {
      name: studentName,
      lastName: studentLastName,
      ci: studentCi,
      email: `${studentCi}@nur.edu.bo`,
      password: studentPassword
    });
  });
});
