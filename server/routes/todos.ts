import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all todos for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const todos = await prisma.todoItem.findMany({
      where: { 
        userId: req.userId,
        // Don't show dismissed or deferred items
        AND: [
          { dismissedAt: null },
          {
            OR: [
              { deferredUntil: null },
              { deferredUntil: { lte: new Date() } }
            ]
          }
        ]
      },
      orderBy: [
        { itemType: 'desc' }, // TASK before FLAGGED_ITEM
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      include: {
        relatedSubmission: true,
      },
    });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Create todo
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, priority, dueDate, relatedSubmissionId, itemType } = req.body;
    
    const todo = await prisma.todoItem.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        itemType: itemType || 'TASK', // Default to TASK for user-created items
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.userId!,
        relatedSubmissionId,
      },
    });
    
    res.json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate, dismissedAt, deferredUntil } = req.body;
    
    const todo = await prisma.todoItem.update({
      where: { id, userId: req.userId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(dismissedAt !== undefined && { dismissedAt: dismissedAt ? new Date(dismissedAt) : null }),
        ...(deferredUntil !== undefined && { deferredUntil: deferredUntil ? new Date(deferredUntil) : null }),
      },
    });
    
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await prisma.todoItem.delete({
      where: { id, userId: req.userId },
    });
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
