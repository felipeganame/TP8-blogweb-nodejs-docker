import { api } from './api.js';
import { auth } from './auth.js';
import { showComments } from './comments.js';

export function showLogin() {
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="form-container">
      <h2>Iniciar Sesión</h2>
      <div id="login-error"></div>
      <form id="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" required>
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" required>
        </div>
        <button type="submit" class="btn">Iniciar Sesión</button>
        <button type="button" class="link-btn" id="goto-register">¿No tienes cuenta? Regístrate</button>
      </form>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('goto-register').addEventListener('click', () => {
    const { showRegister } = require('./register.js');
    showRegister();
  });
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');

  try {
    const data = await api.login({ email, password });
    auth.setUser(data);
    window.location.reload();
  } catch (error) {
    errorDiv.innerHTML = `<div class="error">${error.message}</div>`;
  }
}
