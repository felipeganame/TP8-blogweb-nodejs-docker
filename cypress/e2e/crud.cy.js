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

  // Lista para rastrear comentarios creados durante los tests
  const createdCommentIds = [];
  const createdUserTokens = [];

  beforeEach(() => {
    // Limpiar cookies y localStorage antes de cada test
    cy.clearCookies();
    cy.clearLocalStorage();
    // Visitar la página principal
    cy.visit('/');
    // Esperar a que la aplicación se cargue
    cy.get('#app', { timeout: 10000 }).should('exist');
  });

  /**
   * TEST 1: Cargar página principal y verificar elementos básicos
   */
  describe('Test 1: Cargar página principal', () => {
    it('Debe cargar la página principal correctamente', () => {
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
      // Esperar a que se carguen los comentarios
      cy.contains('Comentarios', { timeout: 10000 }).should('be.visible');
      
      // Verificar que existe el botón de ver comentarios
      cy.get('#comments-btn').should('be.visible');
      
      cy.log('✅ Sección de comentarios visible');
    });
  });

  /**
   * TEST 2: Crear nuevo registro (registro de usuario y comentario)
   */
  describe('Test 2: Crear nuevo registro', () => {
    it('Debe registrar un nuevo usuario exitosamente', () => {
      // Hacer click en el botón "Registrarse" del navbar
      cy.get('#register-btn', { timeout: 10000 }).should('be.visible').click();
      
      // Esperar a que aparezca el formulario de registro
      cy.contains('h2', 'Registrarse', { timeout: 5000 }).should('be.visible');
      
      // Llenar el formulario de registro
      cy.get('#username').clear().type(testUser.username);
      cy.get('#email').clear().type(testUser.email);
      cy.get('#password').clear().type(testUser.password);
      
      // Enviar el formulario
      cy.get('#register-form button[type="submit"]').click();
      
      // Verificar que el registro fue exitoso
      // El usuario debería ver su nombre en el navbar después del reload
      cy.contains(`Hola, ${testUser.username}`, { timeout: 10000 }).should('be.visible');
      
      cy.log('✅ Usuario registrado exitosamente');
    });

    it('Debe crear un nuevo comentario después de registrarse', () => {
      const uniqueUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!'
      };
      
      // Registrar usuario primero
      cy.get('#register-btn', { timeout: 10000 }).should('be.visible').click();
      
      cy.get('#username').clear().type(uniqueUser.username);
      cy.get('#email').clear().type(uniqueUser.email);
      cy.get('#password').clear().type(uniqueUser.password);
      cy.get('#register-form button[type="submit"]').click();
      
      // Esperar a que se complete el registro y recargue la página
      cy.contains(`Hola, ${uniqueUser.username}`, { timeout: 10000 }).should('be.visible');
      
      // Buscar el formulario de comentarios
      cy.get('#comment-content', { timeout: 5000 }).should('be.visible').clear().type(testComment.content);
      
      // Publicar comentario
      cy.get('#comment-form button[type="submit"]').click();
      
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
      const uniqueUser = {
        username: `testuser_edit_${Date.now()}`,
        email: `edit_${Date.now()}@example.com`,
        password: 'Password123!'
      };
      
      // Registrar usuario primero
      cy.get('#register-btn', { timeout: 10000 }).should('be.visible').click();
      
      cy.get('#username').clear().type(uniqueUser.username);
      cy.get('#email').clear().type(uniqueUser.email);
      cy.get('#password').clear().type(uniqueUser.password);
      cy.get('#register-form button[type="submit"]').click();
      
      // Esperar a que se complete el registro
      cy.contains(`Hola, ${uniqueUser.username}`, { timeout: 10000 }).should('be.visible');
      
      // Crear comentario
      cy.get('#comment-content', { timeout: 5000 }).should('be.visible').clear().type('Comentario a eliminar');
      cy.get('#comment-form button[type="submit"]').click();
      
      // Esperar a que se cree el comentario
      cy.contains('Comentario a eliminar', { timeout: 10000 }).should('be.visible');
      
      // Buscar y hacer click en el botón de eliminar
      cy.contains('button', 'Eliminar', { timeout: 5000 }).should('be.visible').click();
      
      // Confirmar la eliminación
      cy.on('window:confirm', () => true);
      
      // Verificar que el comentario ya no existe
      cy.contains('Comentario a eliminar').should('not.exist');
      
      cy.log('✅ Comentario eliminado exitosamente');
    });

    it('Debe poder crear un comentario actualizado después de eliminar', () => {
      const uniqueUser = {
        username: `testuser_update_${Date.now()}`,
        email: `update_${Date.now()}@example.com`,
        password: 'Password123!'
      };
      
      // Registrar usuario
      cy.get('#register-btn', { timeout: 10000 }).should('be.visible').click();
      cy.get('#username').clear().type(uniqueUser.username);
      cy.get('#email').clear().type(uniqueUser.email);
      cy.get('#password').clear().type(uniqueUser.password);
      cy.get('#register-form button[type="submit"]').click();
      
      // Esperar registro
      cy.contains(`Hola, ${uniqueUser.username}`, { timeout: 10000 }).should('be.visible');
      
      // Crear nuevo comentario (simulando actualización)
      cy.get('#comment-content', { timeout: 5000 }).should('be.visible').clear().type(editedComment.content);
      cy.get('#comment-form button[type="submit"]').click();
      
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
      // Ir a registro
      cy.get('#register-btn', { timeout: 10000 }).should('be.visible').click();
      
      // Intentar registrar con email inválido
      cy.get('#username').clear().type('testuser');
      cy.get('#email').clear().type('emailinvalido');
      cy.get('#password').clear().type('12345');
      
      // El formulario HTML5 debería prevenir el envío
      cy.get('#email:invalid').should('exist');
      
      cy.log('✅ Validación de email funcionando correctamente');
    });

    it('Debe mostrar error al intentar registrar con contraseña corta', () => {
      // Ir a registro
      cy.get('#register-btn', { timeout: 10000 }).should('be.visible').click();
      
      // Intentar con contraseña muy corta
      cy.get('#username').clear().type('testuser');
      cy.get('#email').clear().type('test@example.com');
      cy.get('#password').clear().type('123');
      
      // Verificar que el campo tiene el atributo minlength
      cy.get('#password').should('have.attr', 'minlength', '6');
      
      // Verificar la longitud del valor ingresado
      cy.get('#password').should('have.value', '123');
      cy.get('#password').invoke('val').should('have.length.lessThan', 6);
      
      // Intentar enviar el formulario - el navegador debería prevenir el envío
      cy.get('#register-form button[type="submit"]').click();
      
      // Verificar que no se redirigió (se quedó en el formulario de registro)
      cy.contains('h2', 'Registrarse', { timeout: 3000 }).should('be.visible');
      
      // Verificar que no hay mensaje de bienvenida (no se registró)
      cy.contains('Hola,').should('not.exist');
      
      cy.log('✅ Validación de contraseña funcionando correctamente');
    });

    it('Debe mostrar error al intentar comentar sin estar logueado', () => {
      // Verificar que no hay formulario de comentarios para usuarios no logueados
      cy.get('#comment-content').should('not.exist');
      
      // Verificar que hay mensaje para iniciar sesión
      cy.contains('Inicia sesión', { timeout: 5000 }).should('be.visible');
      
      cy.log('✅ Correctamente previene comentar sin login');
    });

    it('Debe manejar correctamente la navegación entre login y registro', () => {
      // Ir a login
      cy.get('#login-btn', { timeout: 10000 }).should('be.visible').click();
      cy.contains('h2', 'Iniciar Sesión', { timeout: 5000 }).should('be.visible');
      
      // Ir a registro desde login
      cy.get('#goto-register').should('be.visible').click();
      cy.contains('h2', 'Registrarse', { timeout: 5000 }).should('be.visible');
      
      // Volver a login
      cy.get('#goto-login').should('be.visible').click();
      cy.contains('h2', 'Iniciar Sesión', { timeout: 5000 }).should('be.visible');
      
      cy.log('✅ Navegación entre formularios funciona correctamente');
    });

    it('Debe manejar timeout de red simulado', () => {
      // Interceptar llamadas de API para simular timeout
      cy.intercept('POST', '**/api/auth/register', {
        delay: 5000,
        statusCode: 500,
        body: { error: 'Network timeout' }
      }).as('registerTimeout');
      
      // Ir a registro
      cy.get('#register-btn', { timeout: 10000 }).should('be.visible').click();
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('Password123!');
      cy.get('#register-form button[type="submit"]').click();
      
      // Debería mostrar algún tipo de error
      cy.wait('@registerTimeout');
      cy.get('#register-error', { timeout: 10000 }).should('be.visible');
      
      cy.log('✅ Manejo de timeout verificado');
    });
  });

  // Cleanup después de todos los tests
  after(() => {
    cy.log('🧹 Iniciando limpieza de datos de prueba...');
    
    const apiUrl = Cypress.config('baseUrl').replace(':3000', ':8080');
    
    // Llamar al endpoint de limpieza
    cy.request({
      method: 'DELETE',
      url: `${apiUrl}/api/test/cleanup`,
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200) {
        cy.log(`✅ Limpieza exitosa:`);
        cy.log(`   - Usuarios eliminados: ${response.body.deleted.users}`);
        cy.log(`   - Comentarios eliminados: ${response.body.deleted.comments}`);
      } else {
        cy.log(`⚠️ No se pudo limpiar: ${response.body.message || 'Error desconocido'}`);
      }
    });
    
    // Limpiar localStorage y cookies
    cy.clearLocalStorage();
    cy.clearCookies();
    
    cy.log('✅ Tests completados');
  });
});
