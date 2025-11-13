import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Comment from '../models/Comment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all comments
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/comments - Obteniendo comentarios...');
    console.log('🔌 MongoDB connection state:', mongoose.connection.readyState);
    
    // Ordenar por _id (descendente) en lugar de createdAt
    // _id contiene un timestamp y siempre está indexado en CosmosDB
    const comments = await Comment.find()
      .sort({ _id: -1 })
      .lean()
      .exec();
    
    console.log(`✅ Comentarios obtenidos: ${comments.length}`);
    res.json(comments);
  } catch (error) {
    console.error('❌ Error al obtener comentarios:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error al obtener comentarios', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create comment
router.post('/',
  protect,
  [
    body('content').trim().notEmpty().withMessage('El contenido es requerido')
      .isLength({ max: 1000 }).withMessage('El comentario no puede exceder 1000 caracteres')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { content } = req.body;

      const comment = await Comment.create({
        content,
        author: req.user._id,
        authorUsername: req.user.username
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error al crear comentario:', error);
      res.status(500).json({ message: 'Error al crear comentario', error: error.message });
    }
  }
);

// Delete comment (only own comments)
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado para eliminar este comentario' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ message: 'Error al eliminar comentario', error: error.message });
  }
});

export default router;
