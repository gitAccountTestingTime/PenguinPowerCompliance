import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test user for development
  console.log('Creating test user...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });
  console.log('Test user created: test@example.com / password123');

  // Create Compliance Scopes (50 US States + Federal)
  console.log('Creating compliance scopes...');
  const usStates = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'US', name: 'Federal', scopeType: 'FEDERAL' },
  ];

  for (const state of usStates) {
    await prisma.complianceScope.upsert({
      where: { code: state.code },
      update: {},
      create: {
        code: state.code,
        name: state.name,
        scopeType: (state as any).scopeType || 'STATE',
        isActive: true,
      },
    });
  }

  console.log(`Created/Updated ${usStates.length} compliance scopes`);

  // Get scope IDs for use in resources and account types
  const caScope = await prisma.complianceScope.findUnique({ where: { code: 'CA' } });
  const nyScope = await prisma.complianceScope.findUnique({ where: { code: 'NY' } });
  const txScope = await prisma.complianceScope.findUnique({ where: { code: 'TX' } });
  const flScope = await prisma.complianceScope.findUnique({ where: { code: 'FL' } });
  const waScope = await prisma.complianceScope.findUnique({ where: { code: 'WA' } });

  // Validate all scopes exist
  if (!caScope || !nyScope || !txScope || !flScope || !waScope) {
    throw new Error('Failed to create required compliance scopes');
  }

  // Sample State Resources
  console.log('Seeding state resources...');
  const resources = [
    {
      scopeId: caScope!.id,
      complianceType: 'SOS Business Entity',
      title: 'California Secretary of State Business Registration',
      description:
        'All businesses operating in California must register with the Secretary of State. This includes LLCs, corporations, and foreign entities doing business in the state. The registration establishes your legal right to conduct business in California.',
      requiredDocuments:
        'Articles of Organization/Incorporation, Statement of Information, Registered Agent designation',
      filingFrequency: 'Initial filing, then biennial updates',
      fees: '$70 filing fee + $20 Statement of Information',
      portalLink: 'https://bizfileonline.sos.ca.gov/',
      additionalNotes:
        'Statement of Information must be filed within 90 days of registration and every 2 years thereafter.',
    },
    {
      scopeId: nyScope!.id,
      complianceType: 'Business Entity Filing',
      title: 'New York Department of State Business Registration',
      description:
        'Foreign and domestic entities must file with the NY Department of State. LLCs must also publish notice of formation in designated newspapers.',
      requiredDocuments:
        'Articles of Organization, Certificate of Publication, Registered Agent information',
      filingFrequency: 'Initial filing, biennial reports',
      fees: '$200 filing fee + publication costs ($1,000-$1,500)',
      portalLink: 'https://www.dos.ny.gov/corporations/',
      additionalNotes:
        'Publication requirement must be completed within 120 days of filing.',
    },
    {
      scopeId: txScope!.id,
      complianceType: 'Certificate of Formation',
      title: 'Texas Secretary of State Business Filing',
      description:
        'All entities conducting business in Texas must register with the Secretary of State and obtain a certificate of authority.',
      requiredDocuments:
        'Certificate of Formation, Registered Agent designation, Beneficial Ownership Information',
      filingFrequency: 'Initial filing, annual reports (franchises)',
      fees: '$300 filing fee',
      portalLink: 'https://www.sos.state.tx.us/corp/index.shtml',
      additionalNotes: 'Texas requires annual franchise tax reports for most entities.',
    },
    {
      scopeId: flScope!.id,
      complianceType: 'Sunbiz Entity Registration',
      title: 'Florida Department of State Division of Corporations',
      description:
        'Florida requires all business entities to register with the Division of Corporations. This includes filing articles and maintaining an active registered agent.',
      requiredDocuments:
        'Articles of Organization/Incorporation, Registered Agent designation, Annual Report',
      filingFrequency: 'Initial filing, annual reports',
      fees: '$125 filing fee + $138.75 annual report',
      portalLink: 'https://dos.myflorida.com/sunbiz/',
      additionalNotes:
        'Annual reports are due by May 1st each year. Late fees apply after deadline.',
    },
    {
      scopeId: caScope!.id,
      complianceType: 'Unemployment Insurance',
      title: 'California Employment Development Department (EDD) Registration',
      description:
        'Employers with employees in California must register with the EDD for unemployment insurance and state payroll tax purposes.',
      requiredDocuments:
        'Federal EIN, business formation documents, employee information',
      filingFrequency: 'Quarterly wage reports, annual tax returns',
      fees: 'Variable based on wages and experience rating',
      portalLink: 'https://www.edd.ca.gov/',
      additionalNotes:
        'Registration must be completed within 15 days of paying wages over $100.',
    },
    {
      scopeId: waScope!.id,
      complianceType: 'Business Entity Registration',
      title: 'Washington Secretary of State Business Licensing',
      description:
        'Washington requires business registration with the Secretary of State and may require additional local business licenses.',
      requiredDocuments: 'Certificate of Formation, UBI application, Registered Agent',
      filingFrequency: 'Initial filing, annual reports',
      fees: '$200 filing fee',
      portalLink: 'https://www.sos.wa.gov/corps/',
      additionalNotes:
        'Washington issues a Unified Business Identifier (UBI) number for state tax purposes.',
    },
  ];

  for (const resource of resources) {
    await prisma.stateResource.create({
      data: resource,
    });
  }

  console.log(`Created ${resources.length} sample resources`);
  
  // Get additional scope IDs for test account types
  const ilScope = await prisma.complianceScope.findUnique({ where: { code: 'IL' } });
  const ohScope = await prisma.complianceScope.findUnique({ where: { code: 'OH' } });
  const paScope = await prisma.complianceScope.findUnique({ where: { code: 'PA' } });
  const gaScope = await prisma.complianceScope.findUnique({ where: { code: 'GA' } });
  const ncScope = await prisma.complianceScope.findUnique({ where: { code: 'NC' } });
  const miScope = await prisma.complianceScope.findUnique({ where: { code: 'MI' } });
  const njScope = await prisma.complianceScope.findUnique({ where: { code: 'NJ' } });

  // Validate all additional scopes exist
  if (!ilScope || !ohScope || !paScope || !gaScope || !ncScope || !miScope || !njScope) {
    throw new Error('Failed to create required compliance scopes for test account types');
  }
  
  // Sample Compliance Account Types
  console.log('Seeding compliance account types...');
  
  const accountTypes = [
    // California
    {
      name: 'Employer Payroll Tax Account',
      scopeId: caScope!.id,
      agency: 'Employment Development Department (EDD)',
      description: 'State unemployment insurance and payroll tax account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Sales and Use Tax Permit',
      scopeId: caScope!.id,
      agency: 'California Department of Tax and Fee Administration (CDTFA)',
      description: 'Permit for collecting and remitting sales tax',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '1',
    },
    {
      name: 'SOS Business Entity',
      scopeId: caScope!.id,
      agency: 'Secretary of State',
      description: 'Business entity registration (LLC, Corporation, etc.)',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '24',
    },
    {
      name: 'Workers\' Compensation Insurance',
      scopeId: caScope!.id,
      agency: 'Department of Industrial Relations',
      description: 'Workers compensation coverage requirement',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '12',
    },
    
    // New York
    {
      name: 'Employer Unemployment Account',
      scopeId: nyScope!.id,
      agency: 'Department of Labor',
      description: 'Unemployment insurance employer account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Sales Tax Certificate of Authority',
      scopeId: nyScope!.id,
      agency: 'Department of Taxation and Finance',
      description: 'Certificate to collect and remit sales tax',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '3',
    },
    {
      name: 'Business Entity Filing',
      scopeId: nyScope!.id,
      agency: 'Department of State',
      description: 'Business formation and registration',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '24',
    },
    {
      name: 'Withholding Tax Account',
      scopeId: nyScope!.id,
      agency: 'Department of Taxation and Finance',
      description: 'Employer withholding tax registration',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '3',
    },
    
    // Texas
    {
      name: 'Texas Unemployment Account',
      scopeId: txScope!.id,
      agency: 'Texas Workforce Commission',
      description: 'Unemployment insurance employer account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Sales and Use Tax Permit',
      scopeId: txScope!.id,
      agency: 'Texas Comptroller of Public Accounts',
      description: 'Permit for sales and use tax collection',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '1',
    },
    {
      name: 'Certificate of Formation',
      scopeId: txScope!.id,
      agency: 'Secretary of State',
      description: 'Business entity formation filing',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '12',
    },
    {
      name: 'Franchise Tax Account',
      scopeId: txScope!.id,
      agency: 'Texas Comptroller of Public Accounts',
      description: 'Texas franchise tax reporting account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '12',
    },
    
    // Florida
    {
      name: 'Reemployment Tax Account',
      scopeId: flScope!.id,
      agency: 'Department of Revenue',
      description: 'Unemployment insurance tax account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Sales and Use Tax Registration',
      scopeId: flScope!.id,
      agency: 'Department of Revenue',
      description: 'Registration for sales tax collection',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '1',
    },
    {
      name: 'Sunbiz Entity Registration',
      scopeId: flScope!.id,
      agency: 'Division of Corporations',
      description: 'Business entity registration',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate', 'expirationDate']),
      defaultDuration: '12',
    },
    
    // Washington
    {
      name: 'Unemployment Insurance Account',
      scopeId: waScope!.id,
      agency: 'Employment Security Department',
      description: 'Employer unemployment insurance account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Business License (UBI)',
      scopeId: waScope!.id,
      agency: 'Department of Revenue',
      description: 'Unified Business Identifier and state business license',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '12',
    },
    {
      name: 'Retail Sales Tax License',
      scopeId: waScope!.id,
      agency: 'Department of Revenue',
      description: 'License for collecting retail sales tax',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '1',
    },
    {
      name: 'Business Entity Registration',
      scopeId: waScope!.id,
      agency: 'Secretary of State',
      description: 'Business formation and registration',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '12',
    },
    
    // TEST ACCOUNT TYPES - Demonstrating Dynamic Field Variations
    {
      name: 'TEST: Minimal Fields Only',
      scopeId: caScope!.id,
      agency: 'Test Agency - California',
      description: 'Test account type with only entity name required',
      requiredFields: JSON.stringify(['entityName']),
      defaultDuration: '0',
    },
    {
      name: 'TEST: Links Only Account',
      scopeId: nyScope!.id,
      agency: 'Test Agency - New York',
      description: 'Test account type requiring only link fields',
      requiredFields: JSON.stringify(['compliancePageLink', 'passwordManagerLink']),
      defaultDuration: '12',
    },
    {
      name: 'TEST: Dates Required',
      scopeId: txScope!.id,
      agency: 'Test Agency - Texas',
      description: 'Test account type focusing on date tracking',
      requiredFields: JSON.stringify(['filingDate', 'expirationDate']),
      defaultDuration: '6',
    },
    {
      name: 'TEST: Registration Focus',
      scopeId: flScope!.id,
      agency: 'Test Agency - Florida',
      description: 'Test account type for registration number and entity tracking',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '24',
    },
    {
      name: 'TEST: Document Storage',
      scopeId: waScope!.id,
      agency: 'Test Agency - Washington',
      description: 'Test account type for document management',
      requiredFields: JSON.stringify(['entityName', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'TEST: Full Compliance Portal',
      scopeId: ilScope!.id,
      agency: 'Test Agency - Illinois',
      description: 'Test account type for portal access tracking',
      requiredFields: JSON.stringify(['registrationNumber', 'compliancePageLink', 'passwordManagerLink', 'expirationDate']),
      defaultDuration: '1',
    },
    {
      name: 'TEST: Basic Identity',
      scopeId: ohScope!.id,
      agency: 'Test Agency - Ohio',
      description: 'Test account type with just entity and filing date',
      requiredFields: JSON.stringify(['entityName', 'filingDate']),
      defaultDuration: '12',
    },
    {
      name: 'TEST: Annual Renewal',
      scopeId: paScope!.id,
      agency: 'Test Agency - Pennsylvania',
      description: 'Test account type for tracking annual renewals',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '12',
    },
    {
      name: 'TEST: Secure Access',
      scopeId: gaScope!.id,
      agency: 'Test Agency - Georgia',
      description: 'Test account type for secure portal with credentials',
      requiredFields: JSON.stringify(['compliancePageLink', 'passwordManagerLink']),
      defaultDuration: '36',
    },
    {
      name: 'TEST: Comprehensive Tracking',
      scopeId: ncScope!.id,
      agency: 'Test Agency - North Carolina',
      description: 'Test account type requiring all fields',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate', 'expirationDate', 'compliancePageLink', 'passwordManagerLink']),
      defaultDuration: '12',
    },
    {
      name: 'TEST: Expiration Only',
      scopeId: miScope!.id,
      agency: 'Test Agency - Michigan',
      description: 'Test account type tracking only expiration',
      requiredFields: JSON.stringify(['expirationDate']),
      defaultDuration: '24',
    },
    {
      name: 'TEST: No Extra Fields',
      scopeId: njScope!.id,
      agency: 'Test Agency - New Jersey',
      description: 'Test account type with no additional fields beyond defaults',
      requiredFields: JSON.stringify([]),
      defaultDuration: '0',
    },
  ];
  
  for (const accountType of accountTypes) {
    try {
      await prisma.complianceAccountType.upsert({
        where: {
          name_scopeId_agency: {
            name: accountType.name,
            scopeId: accountType.scopeId,
            agency: accountType.agency,
          },
        },
        update: accountType,
        create: accountType,
      });
    } catch (error) {
      console.error(`Failed to create/update account type: ${accountType.name} - ${accountType.agency}`, error);
      throw error;
    }
  }
  
  console.log(`Created/Updated ${accountTypes.length} compliance account types`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
