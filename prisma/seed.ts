import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample resources...');

  // Sample State Resources
  const resources = [
    {
      state: 'CA',
      complianceType: 'SOS Registration',
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
      state: 'NY',
      complianceType: 'SOS Registration',
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
      state: 'TX',
      complianceType: 'SOS Registration',
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
      state: 'FL',
      complianceType: 'SOS Registration',
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
      state: 'CA',
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
      state: 'WA',
      complianceType: 'SOS Registration',
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
  
  // Sample Compliance Account Types
  console.log('Seeding compliance account types...');
  
  const accountTypes = [
    // California
    {
      name: 'Employer Payroll Tax Account',
      state: 'CA',
      stateAgency: 'Employment Development Department (EDD)',
      description: 'State unemployment insurance and payroll tax account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Sales and Use Tax Permit',
      state: 'CA',
      stateAgency: 'California Department of Tax and Fee Administration (CDTFA)',
      description: 'Permit for collecting and remitting sales tax',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '1',
    },
    {
      name: 'SOS Business Entity',
      state: 'CA',
      stateAgency: 'Secretary of State',
      description: 'Business entity registration (LLC, Corporation, etc.)',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '24',
    },
    {
      name: 'Workers\' Compensation Insurance',
      state: 'CA',
      stateAgency: 'Department of Industrial Relations',
      description: 'Workers compensation coverage requirement',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '12',
    },
    
    // New York
    {
      name: 'Employer Unemployment Account',
      state: 'NY',
      stateAgency: 'Department of Labor',
      description: 'Unemployment insurance employer account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Sales Tax Certificate of Authority',
      state: 'NY',
      stateAgency: 'Department of Taxation and Finance',
      description: 'Certificate to collect and remit sales tax',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '3',
    },
    {
      name: 'Business Entity Filing',
      state: 'NY',
      stateAgency: 'Department of State',
      description: 'Business formation and registration',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '24',
    },
    {
      name: 'Withholding Tax Account',
      state: 'NY',
      stateAgency: 'Department of Taxation and Finance',
      description: 'Employer withholding tax registration',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '3',
    },
    
    // Texas
    {
      name: 'Texas Unemployment Account',
      state: 'TX',
      stateAgency: 'Texas Workforce Commission',
      description: 'Unemployment insurance employer account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Sales and Use Tax Permit',
      state: 'TX',
      stateAgency: 'Texas Comptroller of Public Accounts',
      description: 'Permit for sales and use tax collection',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '1',
    },
    {
      name: 'Certificate of Formation',
      state: 'TX',
      stateAgency: 'Secretary of State',
      description: 'Business entity formation filing',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '12',
    },
    {
      name: 'Franchise Tax Account',
      state: 'TX',
      stateAgency: 'Texas Comptroller of Public Accounts',
      description: 'Texas franchise tax reporting account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '12',
    },
    
    // Florida
    {
      name: 'Reemployment Tax Account',
      state: 'FL',
      stateAgency: 'Department of Revenue',
      description: 'Unemployment insurance tax account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Sales and Use Tax Registration',
      state: 'FL',
      stateAgency: 'Department of Revenue',
      description: 'Registration for sales tax collection',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '1',
    },
    {
      name: 'Sunbiz Entity Registration',
      state: 'FL',
      stateAgency: 'Division of Corporations',
      description: 'Business entity registration',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate', 'expirationDate']),
      defaultDuration: '12',
    },
    
    // Washington
    {
      name: 'Unemployment Insurance Account',
      state: 'WA',
      stateAgency: 'Employment Security Department',
      description: 'Employer unemployment insurance account',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'Business License (UBI)',
      state: 'WA',
      stateAgency: 'Department of Revenue',
      description: 'Unified Business Identifier and state business license',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '12',
    },
    {
      name: 'Retail Sales Tax License',
      state: 'WA',
      stateAgency: 'Department of Revenue',
      description: 'License for collecting retail sales tax',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate']),
      defaultDuration: '1',
    },
    {
      name: 'Business Entity Registration',
      state: 'WA',
      stateAgency: 'Secretary of State',
      description: 'Business formation and registration',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate']),
      defaultDuration: '12',
    },
    
    // TEST ACCOUNT TYPES - Demonstrating Dynamic Field Variations
    {
      name: 'TEST: Minimal Fields Only',
      state: 'CA',
      stateAgency: 'Test Agency - California',
      description: 'Test account type with only entity name required',
      requiredFields: JSON.stringify(['entityName']),
      defaultDuration: '0',
    },
    {
      name: 'TEST: Links Only Account',
      state: 'NY',
      stateAgency: 'Test Agency - New York',
      description: 'Test account type requiring only link fields',
      requiredFields: JSON.stringify(['filingStorageLink', 'compliancePageLink', 'passwordManagerLink']),
      defaultDuration: '12',
    },
    {
      name: 'TEST: Dates Required',
      state: 'TX',
      stateAgency: 'Test Agency - Texas',
      description: 'Test account type focusing on date tracking',
      requiredFields: JSON.stringify(['filingDate', 'expirationDate']),
      defaultDuration: '6',
    },
    {
      name: 'TEST: Registration Focus',
      state: 'FL',
      stateAgency: 'Test Agency - Florida',
      description: 'Test account type for registration number and entity tracking',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber']),
      defaultDuration: '24',
    },
    {
      name: 'TEST: Document Storage',
      state: 'WA',
      stateAgency: 'Test Agency - Washington',
      description: 'Test account type for document management',
      requiredFields: JSON.stringify(['entityName', 'filingStorageLink', 'filingDate']),
      defaultDuration: '3',
    },
    {
      name: 'TEST: Full Compliance Portal',
      state: 'IL',
      stateAgency: 'Test Agency - Illinois',
      description: 'Test account type for portal access tracking',
      requiredFields: JSON.stringify(['registrationNumber', 'compliancePageLink', 'passwordManagerLink', 'expirationDate']),
      defaultDuration: '1',
    },
    {
      name: 'TEST: Basic Identity',
      state: 'OH',
      stateAgency: 'Test Agency - Ohio',
      description: 'Test account type with just entity and filing date',
      requiredFields: JSON.stringify(['entityName', 'filingDate']),
      defaultDuration: '12',
    },
    {
      name: 'TEST: Annual Renewal',
      state: 'PA',
      stateAgency: 'Test Agency - Pennsylvania',
      description: 'Test account type for tracking annual renewals',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'expirationDate', 'filingStorageLink']),
      defaultDuration: '12',
    },
    {
      name: 'TEST: Secure Access',
      state: 'GA',
      stateAgency: 'Test Agency - Georgia',
      description: 'Test account type for secure portal with credentials',
      requiredFields: JSON.stringify(['compliancePageLink', 'passwordManagerLink']),
      defaultDuration: '36',
    },
    {
      name: 'TEST: Comprehensive Tracking',
      state: 'NC',
      stateAgency: 'Test Agency - North Carolina',
      description: 'Test account type requiring all fields',
      requiredFields: JSON.stringify(['entityName', 'registrationNumber', 'filingDate', 'expirationDate', 'filingStorageLink', 'compliancePageLink', 'passwordManagerLink']),
      defaultDuration: '12',
    },
    {
      name: 'TEST: Expiration Only',
      state: 'MI',
      stateAgency: 'Test Agency - Michigan',
      description: 'Test account type tracking only expiration',
      requiredFields: JSON.stringify(['expirationDate']),
      defaultDuration: '24',
    },
    {
      name: 'TEST: No Extra Fields',
      state: 'NJ',
      stateAgency: 'Test Agency - New Jersey',
      description: 'Test account type with no additional fields beyond defaults',
      requiredFields: JSON.stringify([]),
      defaultDuration: '0',
    },
  ];
  
  for (const accountType of accountTypes) {
    await prisma.complianceAccountType.upsert({
      where: {
        name_state: {
          name: accountType.name,
          state: accountType.state,
        },
      },
      update: accountType,
      create: accountType,
    });
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
