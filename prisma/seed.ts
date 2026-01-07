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
