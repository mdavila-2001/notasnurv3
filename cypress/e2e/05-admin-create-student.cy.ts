import { faker } from '@faker-js/faker';

describe('Registro de Estudiante de Pruebas (Administrador)', () => {
  const studentName = faker.person.firstName();
  const studentLastName = faker.person.lastName();
  let studentCi = '';
  const studentPassword = '1234';

  before(() => {
    // Leer el ultimo CI base 202000, incrementarlo y actualizar el fixture
    cy.readFile('cypress/fixtures/last-student-ci.json').then((data) => {
      const lastCi = data && data.ci ? Number(data.ci) : 202000;
      const nextCi = lastCi + 1;
      studentCi = nextCi.toString();
      cy.writeFile('cypress/fixtures/last-student-ci.json', { ci: nextCi });
    });
  });

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('debería registrar un nuevo estudiante con CI incremental y guardar los datos', () => {
    cy.visit('/admin/users');
    cy.contains('button.tab-btn', 'Estudiantes').click();
    cy.contains('button', 'Registrar Nuevo Estudiante').click();

    cy.get('input[placeholder="Ej: Juan"]').type(studentName);
    cy.get('input[placeholder="Ej: Perez"]').type(studentLastName);
    cy.get('input[placeholder="1234567"]').type(studentCi);
    
    // Verificar que el correo del estudiante se autogeneró correctamente a partir del CI
    cy.get('input[placeholder="usuario@nur.edu.bo"]').should('have.value', `${studentCi}@nur.edu.bo`);

    cy.get('input[placeholder="Mínimo 8 caracteres"]').type(studentPassword);
    cy.contains('app-modal button', 'Guardar en Base de Datos').click();

    // Verificar en la tabla de estudiantes
    cy.get('.docentes-table').should('contain', studentName);

    // Guardar los datos generados para el estudiante en un archivo fixture
    cy.writeFile('cypress/fixtures/student.json', {
      name: studentName,
      lastName: studentLastName,
      ci: studentCi,
      email: `${studentCi}@nur.edu.bo`,
      password: studentPassword
    });
  });
});
