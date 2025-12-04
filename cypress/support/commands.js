// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- Custom command to login --
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/');
  cy.get('#login-btn', { timeout: 10000 }).should('be.visible').click();
  cy.get('#email', { timeout: 5000 }).should('be.visible').type(email);
  cy.get('#password').type(password);
  cy.get('#login-form button[type="submit"]').click();
  cy.contains('Hola,', { timeout: 10000 }).should('be.visible');
});

// -- Custom command to register --
Cypress.Commands.add('register', (username, email, password) => {
  cy.visit('/');
  cy.get('#register-btn', { timeout: 10000 }).should('be.visible').click();
  cy.get('#username', { timeout: 5000 }).should('be.visible').type(username);
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('#register-form button[type="submit"]').click();
  cy.contains(`Hola, ${username}`, { timeout: 10000 }).should('be.visible');
});

// -- Custom command to create comment --
Cypress.Commands.add('createComment', (content) => {
  cy.get('#comment-content', { timeout: 5000 }).should('be.visible').clear().type(content);
  cy.get('#comment-form button[type="submit"]').click();
  cy.contains(content, { timeout: 10000 }).should('be.visible');
});

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
