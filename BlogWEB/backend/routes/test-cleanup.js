import express from 'express';
import Comment from '../models/Comment.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Endpoint para limpiar datos de prueba
 * Solo disponible en ambientes de test/development
 */
router.delete('/cleanup', async (req, res) => {
  // Solo permitir en ambientes no productivos
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      message: 'Endpoint no disponible en producción' 
    });
  }

  try {
    console.log('🧹 Iniciando limpieza de datos de prueba...');

    // Eliminar usuarios de prueba (que empiezan con 'testuser_')
    const deletedUsers = await User.deleteMany({
      username: { $regex: /^testuser_/i }
    });

    // Eliminar comentarios de usuarios de prueba
    const deletedComments = await Comment.deleteMany({
      authorUsername: { $regex: /^testuser_/i }
    });

    console.log(`✅ Limpieza completada:`);
    console.log(`  - Usuarios eliminados: ${deletedUsers.deletedCount}`);
    console.log(`  - Comentarios eliminados: ${deletedComments.deletedCount}`);

    res.json({
      message: 'Limpieza completada exitosamente',
      deleted: {
        users: deletedUsers.deletedCount,
        comments: deletedComments.deletedCount
      }
    });
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    res.status(500).json({ 
      message: 'Error al limpiar datos de prueba', 
      error: error.message 
    });
  }
});

export default router;
