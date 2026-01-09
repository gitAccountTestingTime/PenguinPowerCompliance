import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all compliance account types (optionally filtered by state)
router.get('/account-types', authenticate, async (req: AuthRequest, res) => {
  try {
    const { state } = req.query;
    
    const accountTypes = await prisma.complianceAccountType.findMany({
      where: state ? { state: String(state).toUpperCase(), isActive: true } : { isActive: true },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
    });
    
    res.json(accountTypes);
  } catch (error) {
    console.error('Error fetching account types:', error);
    res.status(500).json({ error: 'Failed to fetch account types' });
  }
});

// Get all compliance submissions for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const submissions = await prisma.complianceSubmission.findMany({
      where: { userId: req.userId },
      include: { complianceAccountType: true },
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
      complianceAccountTypeId,
      entityName,
      registrationNumber,
      submittedOn,
      filingDate,
      expirationDate,
      duration,
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
        complianceAccountTypeId: complianceAccountTypeId || null,
        entityName,
        registrationNumber,
        submittedOn: submittedOn ? new Date(submittedOn) : null,
        filingDate: filingDate ? new Date(filingDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        duration,
        status: status || 'ACTIVE',
        filingStorageLink,
        compliancePageLink,
        passwordManagerLink,
        notes,
        userId: req.userId!,
      },
      include: { complianceAccountType: true },
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
    if (data.submittedOn) data.submittedOn = new Date(data.submittedOn);
    if (data.filingDate) data.filingDate = new Date(data.filingDate);
    if (data.expirationDate) data.expirationDate = new Date(data.expirationDate);

    const submission = await prisma.complianceSubmission.update({
      where: { id, userId: req.userId },
      data,
      include: { complianceAccountType: true },
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
