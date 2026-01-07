import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Upload and analyze file for nexus determination
router.post('/analyze', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { fileType } = req.body; // 'payroll' or 'census'

    // Parse the file content (simplified - in production, use proper CSV/Excel parsers)
    const fileContent = req.file.buffer.toString('utf-8');
    
    // Perform nexus analysis (simplified logic)
    const analysisResults = analyzeNexus(fileContent, fileType);
    const recommendations = generateRecommendations(analysisResults);

    // Save to database
    const nexusData = await prisma.nexusData.create({
      data: {
        userId: req.userId!,
        fileName: req.file.originalname,
        fileType: fileType || 'unknown',
        analysisResults: JSON.stringify(analysisResults),
        recommendations: JSON.stringify(recommendations),
        processed: true,
      },
    });

    res.json({
      id: nexusData.id,
      analysisResults,
      recommendations,
    });
  } catch (error) {
    console.error('Error analyzing nexus:', error);
    res.status(500).json({ error: 'Failed to analyze nexus' });
  }
});

// Get nexus analysis history
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const history = await prisma.nexusData.findMany({
      where: { userId: req.userId },
      orderBy: { uploadDate: 'desc' },
    });

    const parsedHistory = history.map(item => ({
      ...item,
      analysisResults: JSON.parse(item.analysisResults),
      recommendations: item.recommendations ? JSON.parse(item.recommendations) : null,
    }));

    res.json(parsedHistory);
  } catch (error) {
    console.error('Error fetching nexus history:', error);
    res.status(500).json({ error: 'Failed to fetch nexus history' });
  }
});

// Helper function to analyze nexus (simplified version)
function analyzeNexus(fileContent: string, fileType: string) {
  // This is a simplified version. In production, implement proper parsing and analysis
  const lines = fileContent.split('\n');
  const statesFound = new Set<string>();

  // Look for state abbreviations in the data
  const stateAbbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  lines.forEach(line => {
    stateAbbreviations.forEach(state => {
      if (line.includes(state)) {
        statesFound.add(state);
      }
    });
  });

  return {
    fileType,
    totalRecords: lines.length - 1,
    statesIdentified: Array.from(statesFound),
    analysisDate: new Date().toISOString(),
  };
}

// Helper function to generate recommendations
function generateRecommendations(analysisResults: any) {
  const recommendations = analysisResults.statesIdentified.map((state: string) => ({
    state,
    action: 'Review state compliance requirements',
    priority: 'MEDIUM',
    description: `Based on ${analysisResults.fileType} data, you may need to register with ${state} state agencies.`,
  }));

  return recommendations;
}

export default router;
