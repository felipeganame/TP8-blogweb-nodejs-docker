import { api } from './api.js';
import { auth } from './auth.js';

export async function showComments() {
  const mainContent = document.getElementById('main-content');
  const user = auth.getUser();

  mainContent.innerHTML = `
    <div class="comments-container">
      <h2>Comentarios</h2>
      <div id="comments-error"></div>
      
      ${user ? `
        <div class="comment-form">
          <h3>Nuevo Comentario</h3>
          <form id="comment-form">
            <div class="form-group">
              <textarea id="comment-content" placeholder="Escribe tu comentario..." required></textarea>
            </div>
            <button type="submit" class="btn">Publicar Comentario</button>
          </form>
        </div>
      ` : `
        <div class="info-message" style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong>💬 ¿Quieres comentar?</strong><br>
          Inicia sesión o regístrate para poder escribir comentarios.
        </div>
      `}
      
      <div id="comments-list" class="comments-list">
        <p>Cargando comentarios...</p>
      </div>
    </div>
  `;

  if (user) {
    document.getElementById('comment-form').addEventListener('submit', handleCreateComment);
  }

  await loadComments();
}

async function loadComments() {
  const commentsList = document.getElementById('comments-list');
  const user = auth.getUser();

  try {
    const comments = await api.getComments();
    
    if (comments.length === 0) {
      commentsList.innerHTML = '<div class="empty-state">No hay comentarios aún. ¡Sé el primero en comentar!</div>';
      return;
    }

    commentsList.innerHTML = comments.map(comment => `
      <div class="comment-card">
        <div class="comment-header">
          <span class="comment-author">${comment.authorUsername}</span>
          <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        <div class="comment-content">${escapeHtml(comment.content)}</div>
        ${user && user._id === comment.author ? `
          <div class="comment-actions">
            <button class="btn btn-danger btn-small" onclick="deleteComment('${comment._id}')">Eliminar</button>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    commentsList.innerHTML = `<div class="error">Error al cargar comentarios: ${error.message}</div>`;
  }
}

async function handleCreateComment(e) {
  e.preventDefault();
  
  const content = document.getElementById('comment-content').value;
  const errorDiv = document.getElementById('comments-error');

  try {
    await api.createComment(content);
    document.getElementById('comment-content').value = '';
    errorDiv.innerHTML = '<div class="success">Comentario publicado exitosamente</div>';
    setTimeout(() => errorDiv.innerHTML = '', 3000);
    await loadComments();
  } catch (error) {
    errorDiv.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

window.deleteComment = async function(commentId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
    return;
  }

  try {
    await api.deleteComment(commentId);
    await loadComments();
  } catch (error) {
    alert('Error al eliminar comentario: ' + error.message);
  }
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
