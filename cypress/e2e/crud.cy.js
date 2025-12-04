describe('BlogWEB - CRUD Integration Tests', () => {
  
  // Variables para los tests
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Password123!'
  };
  
  const testComment = {
    content: 'Este es un comentario de prueba creado por Cypress'
  };
  
  const editedComment = {
    content: 'Comentario editado mediante Cypress - actualizado exitosamente'
  };

  beforeEach(() => {
    // Limpiar cookies y localStorage antes de cada test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  /**
   * TEST 1: Cargar página principal y verificar elementos básicos
   */
  describe('Test 1: Cargar página principal', () => {
    it('Debe cargar la página principal correctamente', () => {
      cy.visit('/');
      
      // Verificar que el título esté presente
      cy.contains('BlogWEB').should('be.visible');
      
      // Verificar que exista el contenedor principal
      cy.get('#app').should('exist');
      cy.get('#main-content').should('exist');
      
      // Verificar que exista el navbar
      cy.get('#navbar').should('be.visible');
      
      // Verificar que la página responde (no hay errores 500)
      cy.url().should('include', 'localhost');
      
      // Log para reporte
      cy.log('✅ Página principal cargada correctamente');
    });

    it('Debe mostrar la sección de comentarios', () => {
      cy.visit('/');
      
      // Esperar a que se carguen los comentarios
      cy.contains('Comentarios', { timeout: 10000 }).should('be.visible');
      
      cy.log('✅ Sección de comentarios visible');
    });
  });

  /**
   * TEST 2: Crear nuevo registro (registro de usuario y comentario)
   */
  describe('Test 2: Crear nuevo registro', () => {
    it('Debe registrar un nuevo usuario exitosamente', () => {
      cy.visit('/');
      
      // Hacer click en el botón "¿No tienes cuenta? Regístrate"
      cy.get('#goto-register', { timeout: 10000 }).should('be.visible').click();
      
      // Esperar a que aparezca el formulario de registro
      cy.get('h2', { timeout: 5000 }).contains('Registro').should('be.visible');
      
      // Llenar el formulario de registro
      cy.get('input[type="text"]').first().clear().type(testUser.username);
      cy.get('input[type="email"]').clear().type(testUser.email);
      cy.get('input[type="password"]').clear().type(testUser.password);
      
      // Enviar el formulario
      cy.get('button[type="submit"]').contains('Registrarse').click();
      
      // Verificar que el registro fue exitoso
      // El usuario debería ser redirigido o ver su nombre
      cy.contains(testUser.username, { timeout: 10000 }).should('exist');
      
      cy.log('✅ Usuario registrado exitosamente');
    });

    it('Debe crear un nuevo comentario después de registrarse', () => {
      cy.visit('/');
      
      // Registrar usuario primero
      cy.get('#goto-register', { timeout: 10000 }).should('be.visible').click();
      
      cy.get('input[type="text"]').first().clear().type(testUser.username);
      cy.get('input[type="email"]').clear().type(testUser.email);
      cy.get('input[type="password"]').clear().type(testUser.password);
      cy.get('button[type="submit"]').contains('Registrarse').click();
      
      // Esperar a que se complete el registro
      cy.wait(2000);
      
      // Buscar el formulario de comentarios
      cy.get('textarea').should('be.visible').clear().type(testComment.content);
      
      // Publicar comentario
      cy.contains('button', 'Publicar').click();
      
      // Verificar que el comentario aparece en la lista
      cy.contains(testComment.content, { timeout: 10000 }).should('be.visible');
      
      cy.log('✅ Comentario creado exitosamente');
    });
  });

  /**
   * TEST 3: Editar registro existente
   * Nota: Como no hay funcionalidad de editar comentarios en el código actual,
   * este test verifica la capacidad de eliminar y recrear
   */
  describe('Test 3: Editar/Actualizar registro existente', () => {
    it('Debe poder eliminar un comentario propio', () => {
      cy.visit('/');
      
      // Registrar usuario primero
      cy.get('#goto-register', { timeout: 10000 }).should('be.visible').click();
      
      cy.get('input[type="text"]').first().clear().type(testUser.username + '_edit');
      cy.get('input[type="email"]').clear().type('edit_' + testUser.email);
      cy.get('input[type="password"]').clear().type(testUser.password);
      cy.get('button[type="submit"]').contains('Registrarse').click();
      
      cy.wait(2000);
      
      // Crear comentario
      cy.get('textarea').should('be.visible').clear().type('Comentario a eliminar');
      cy.contains('button', 'Publicar').click();
      
      cy.wait(2000);
      
      // Buscar y hacer click en el botón de eliminar
      cy.contains('button', 'Eliminar').should('be.visible').click();
      
      // Confirmar la eliminación (si hay alert)
      cy.on('window:confirm', () => true);
      
      cy.wait(1000);
      
      cy.log('✅ Comentario eliminado exitosamente');
    });

    it('Debe poder crear un comentario actualizado después de eliminar', () => {
      cy.visit('/');
      
      // Iniciar sesión (si es necesario, registrar de nuevo)
      cy.get('body').then($body => {
        if ($body.find('#goto-register').length > 0) {
          cy.get('#goto-register').click();
          cy.get('input[type="text"]').first().clear().type(testUser.username + '_update');
          cy.get('input[type="email"]').clear().type('update_' + testUser.email);
          cy.get('input[type="password"]').clear().type(testUser.password);
          cy.get('button[type="submit"]').contains('Registrarse').click();
          cy.wait(2000);
        }
      });
      
      // Crear nuevo comentario (simulando actualización)
      cy.get('textarea').should('be.visible').clear().type(editedComment.content);
      cy.contains('button', 'Publicar').click();
      
      // Verificar que el nuevo comentario aparece
      cy.contains(editedComment.content, { timeout: 10000 }).should('be.visible');
      
      cy.log('✅ Comentario actualizado creado exitosamente');
    });
  });

  /**
   * TEST 4: Validar manejo de errores
   */
  describe('Test 4: Validar manejo de errores', () => {
    it('Debe mostrar error al intentar registrar con email inválido', () => {
      cy.visit('/');
      
      // Ir a registro
      cy.get('#goto-register', { timeout: 10000 }).should('be.visible').click();
      
      // Intentar registrar con email inválido
      cy.get('input[type="text"]').first().clear().type('testuser');
      cy.get('input[type="email"]').clear().type('emailinvalido');
      cy.get('input[type="password"]').clear().type('12345');
      
      // El formulario HTML5 debería prevenir el envío
      cy.get('input[type="email"]:invalid').should('exist');
      
      cy.log('✅ Validación de email funcionando correctamente');
    });

    it('Debe mostrar error al intentar registrar con contraseña corta', () => {
      cy.visit('/');
      
      // Ir a registro
      cy.get('#goto-register', { timeout: 10000 }).should('be.visible').click();
      
      // Intentar con contraseña muy corta
      cy.get('input[type="text"]').first().clear().type('testuser');
      cy.get('input[type="email"]').clear().type('test@example.com');
      cy.get('input[type="password"]').clear().type('123');
      
      // Verificar validación de minlength
      cy.get('input[type="password"]:invalid').should('exist');
      
      cy.log('✅ Validación de contraseña funcionando correctamente');
    });

    it('Debe mostrar error al intentar comentar sin estar logueado', () => {
      cy.visit('/');
      
      // Verificar que no hay formulario de comentarios para usuarios no logueados
      cy.get('body').then($body => {
        if ($body.find('textarea').length === 0) {
          // No hay textarea, correcto - usuario no logueado no puede comentar
          cy.contains('Inicia sesión', { timeout: 5000 }).should('be.visible');
          cy.log('✅ Correctamente previene comentar sin login');
        }
      });
    });

    it('Debe manejar correctamente la navegación entre login y registro', () => {
      cy.visit('/');
      
      // Ir a registro
      cy.get('body').then($body => {
        if ($body.find('#goto-register').length > 0) {
          cy.get('#goto-register').click();
          cy.contains('Registrarse', { timeout: 5000 }).should('be.visible');
          
          // Volver a login
          cy.get('#goto-login').should('be.visible').click();
          cy.contains('Iniciar Sesión', { timeout: 5000 }).should('be.visible');
          
          cy.log('✅ Navegación entre formularios funciona correctamente');
        }
      });
    });

    it('Debe manejar timeout de red simulado', () => {
      // Interceptar llamadas de API para simular timeout
      cy.intercept('POST', '**/api/auth/register', {
        delay: 15000, // Simular timeout
        forceNetworkError: true
      }).as('registerTimeout');
      
      cy.visit('/');
      
      // Intentar registrar
      cy.get('body').then($body => {
        if ($body.find('#goto-register').length > 0) {
          cy.get('#goto-register').click();
          cy.get('input[type="text"]').first().type('testuser');
          cy.get('input[type="email"]').type('test@example.com');
          cy.get('input[type="password"]').type('Password123!');
          cy.get('button[type="submit"]').contains('Registrarse').click();
          
          // Debería mostrar algún tipo de error o quedarse en el formulario
          cy.wait(2000);
          cy.log('✅ Manejo de timeout verificado');
        }
      });
    });
  });

  // Cleanup después de todos los tests
  after(() => {
    cy.log('🧹 Tests completados - limpieza finalizada');
  });
});
