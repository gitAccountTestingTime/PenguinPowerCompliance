import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all state resources
router.get('/', authenticate, async (req, res) => {
  try {
    const { state, complianceType, search } = req.query;

    const where: any = {};
    if (state) where.state = state as string;
    if (complianceType) where.complianceType = complianceType as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const resources = await prisma.stateResource.findMany({
      where,
      orderBy: [{ state: 'asc' }, { complianceType: 'asc' }],
    });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Get resource by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await prisma.stateResource.findUnique({
      where: { id },
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// Create state resource (admin functionality)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      state,
      complianceType,
      title,
      description,
      requiredDocuments,
      filingFrequency,
      fees,
      portalLink,
      additionalNotes,
    } = req.body;

    const resource = await prisma.stateResource.create({
      data: {
        state,
        complianceType,
        title,
        description,
        requiredDocuments,
        filingFrequency,
        fees,
        portalLink,
        additionalNotes,
      },
    });

    res.json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// Update state resource
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const resource = await prisma.stateResource.update({
      where: { id },
      data,
    });

    res.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// Delete state resource
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.stateResource.delete({
      where: { id },
    });

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

export default router;
