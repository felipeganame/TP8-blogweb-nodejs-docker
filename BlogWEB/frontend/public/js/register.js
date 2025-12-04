import { api } from './api.js';
import { auth } from './auth.js';

export function showRegister() {
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="form-container">
      <h2>Registrarse</h2>
      <div id="register-error"></div>
      <form id="register-form">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input type="text" id="username" required minlength="3">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" required>
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" required minlength="6">
        </div>
        <button type="submit" class="btn">Registrarse</button>
        <button type="button" class="link-btn" id="goto-login">¿Ya tienes cuenta? Inicia sesión</button>
      </form>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('goto-login').addEventListener('click', async () => {
    const { showLogin } = await import('./login.js');
    showLogin();
  });
}

async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('register-error');

  try {
    const data = await api.register({ username, email, password });
    auth.setUser(data);
    window.location.reload();
  } catch (error) {
    errorDiv.innerHTML = `<div class="error">${error.message}</div>`;
  }
}
