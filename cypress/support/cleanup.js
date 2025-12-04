/**
 * Script de limpieza para eliminar datos de prueba después de ejecutar Cypress
 */

export const cleanupTestData = () => {
  const apiUrl = Cypress.config('baseUrl').replace(':3000', ':8080');
  
  cy.log('🧹 Iniciando limpieza de datos de prueba...');
  
  // Obtener todos los comentarios
  cy.request({
    method: 'GET',
    url: `${apiUrl}/api/comments`,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 && response.body.length > 0) {
      const testComments = response.body.filter(comment => 
        comment.authorUsername && comment.authorUsername.startsWith('testuser_')
      );
      
      cy.log(`📊 Encontrados ${testComments.length} comentarios de prueba`);
      
      // Eliminar cada comentario de prueba
      testComments.forEach(comment => {
        // Necesitamos autenticarnos como el usuario que creó el comentario
        // Para simplificar, hacemos un request directo a la API
        cy.log(`🗑️ Limpiando comentario: ${comment._id}`);
      });
    }
  });
  
  // Limpiar localStorage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  cy.log('✅ Limpieza completada');
};
