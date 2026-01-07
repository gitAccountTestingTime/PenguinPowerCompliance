import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all compliance submissions for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const submissions = await prisma.complianceSubmission.findMany({
      where: { userId: req.userId },
      orderBy: { expirationDate: 'asc' },
    });
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get expiring submissions (for alerts)
router.get('/expiring', authenticate, async (req: AuthRequest, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const submissions = await prisma.complianceSubmission.findMany({
      where: {
        userId: req.userId,
        status: 'ACTIVE',
        expirationDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      orderBy: { expirationDate: 'asc' },
    });
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching expiring submissions:', error);
    res.status(500).json({ error: 'Failed to fetch expiring submissions' });
  }
});

// Create compliance submission
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      complianceType,
      state,
      stateAgency,
      entityName,
      registrationNumber,
      filingDate,
      expirationDate,
      status,
      filingStorageLink,
      compliancePageLink,
      passwordManagerLink,
      notes,
    } = req.body;

    const submission = await prisma.complianceSubmission.create({
      data: {
        complianceType,
        state,
        stateAgency,
        entityName,
        registrationNumber,
        filingDate: filingDate ? new Date(filingDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        status: status || 'ACTIVE',
        filingStorageLink,
        compliancePageLink,
        passwordManagerLink,
        notes,
        userId: req.userId!,
      },
    });

    res.json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Update compliance submission
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Convert date strings to Date objects
    if (data.filingDate) data.filingDate = new Date(data.filingDate);
    if (data.expirationDate) data.expirationDate = new Date(data.expirationDate);

    const submission = await prisma.complianceSubmission.update({
      where: { id, userId: req.userId },
      data,
    });

    res.json(submission);
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Delete compliance submission
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.complianceSubmission.delete({
      where: { id, userId: req.userId },
    });

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

export default router;
