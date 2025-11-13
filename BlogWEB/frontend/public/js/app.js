import { auth } from './auth.js';
import { showLogin } from './login.js';
import { showRegister } from './register.js';
import { showComments } from './comments.js';

// Initialize app
function init() {
  renderNavbar();
  
  // Siempre mostrar comentarios (públicos)
  showComments();
}

function renderNavbar() {
  const navLinks = document.getElementById('nav-links');
  const user = auth.getUser();

  if (user) {
    navLinks.innerHTML = `
      <span>Hola, ${user.username}</span>
      <button id="comments-btn">Comentarios</button>
      <button id="logout-btn">Cerrar Sesión</button>
    `;
    
    document.getElementById('comments-btn').addEventListener('click', showComments);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
  } else {
    navLinks.innerHTML = `
      <button id="comments-btn">Ver Comentarios</button>
      <button id="login-btn">Iniciar Sesión</button>
      <button id="register-btn">Registrarse</button>
    `;
    
    document.getElementById('comments-btn').addEventListener('click', showComments);
    document.getElementById('login-btn').addEventListener('click', showLogin);
    document.getElementById('register-btn').addEventListener('click', showRegister);
  }
}

function handleLogout() {
  auth.logout();
  window.location.reload();
}

// Start the app
init();
