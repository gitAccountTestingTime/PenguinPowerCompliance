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
    if (state) {
      // Look up scope by code
      where.scope = { code: (state as string).toUpperCase() };
    }
    if (complianceType) {
      // Use contains for more flexible matching (case-sensitive in SQLite)
      where.complianceType = { 
        contains: complianceType as string
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    console.log('Resource query where clause:', where);
    
    const resources = await prisma.stateResource.findMany({
      where,
      include: { scope: true },
      orderBy: [{ scopeId: 'asc' }, { complianceType: 'asc' }],
    });

    console.log(`Found ${resources.length} resources for state: ${state}, type: ${complianceType}`);
    if (resources.length > 0) {
      console.log('First resource:', resources[0].title);
    }

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
      include: { scope: true },
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

    // Look up scope by code
    const scope = await prisma.complianceScope.findUnique({
      where: { code: state.toUpperCase() },
    });

    if (!scope) {
      return res.status(400).json({ error: 'Invalid state/scope code' });
    }

    const resource = await prisma.stateResource.create({
      data: {
        scopeId: scope.id,
        complianceType,
        title,
        description,
        requiredDocuments,
        filingFrequency,
        fees,
        portalLink,
        additionalNotes,
      },
      include: { scope: true },
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
