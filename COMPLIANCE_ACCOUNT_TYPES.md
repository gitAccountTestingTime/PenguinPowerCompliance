# Compliance Account Types Feature

## Overview
The application now supports multiple Compliance Account Types for each state. This allows you to categorize and manage different types of compliance accounts (e.g., Employer Payroll Tax, Sales Tax Permit, SOS Registration) with state-specific configurations.

## Features

### 1. **State-Specific Account Types**
- Each state can have multiple compliance account types
- Account types are defined in the database with specific attributes:
  - Name (e.g., "Employer Payroll Tax Account")
  - State (two-letter code)
  - State Agency
  - Description
  - Required fields configuration

### 2. **Dynamic Form Behavior**
When creating or editing a compliance submission, the form uses a progressive disclosure approach:

**Step 1: Select State**
- Enter a 2-letter state code (e.g., CA, NY, TX)
- This filters the available compliance account types

**Step 2: Select Compliance Account Type**
- A dropdown appears showing all compliance account types available for that state
- Each option displays the account type name and agency
- The selection is required if account types exist for that state

**Step 3: Dynamic Form Fields**
- Once an account type is selected:
  - **Compliance Type** and **State Agency** are auto-populated (read-only)
  - Only relevant fields for that account type are displayed
  - Fields are determined by the `requiredFields` configuration in the database
  - Additional fields like notes are always available

**Smart Auto-population:**
- Compliance Type = Account Type Name
- State Agency = Automatically filled from account type
- Form adapts to show only necessary fields based on account type configuration

### 3. **Database Structure**

#### ComplianceAccountType Model
```prisma
model ComplianceAccountType {
  id                    String                 @id @default(uuid())
  name                  String                 
  state                 String                 
  stateAgency           String                 
  description           String?                
  requiredFields        String?                
  isActive              Boolean                @default(true)
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
  complianceSubmissions ComplianceSubmission[]
  
  @@unique([name, state])
}
```

#### ComplianceSubmission Model (Updated)
- Added `complianceAccountTypeId` field
- Added `complianceAccountType` relation
- Submissions can optionally link to an account type

### 4. **Pre-seeded Account Types**

The database includes account types for multiple states:

**California (CA):**
- Employer Payroll Tax Account (EDD)
- Sales and Use Tax Permit (CDTFA)
- SOS Business Entity
- Workers' Compensation Insurance

**New York (NY):**
- Employer Unemployment Account
- Sales Tax Certificate of Authority
- Business Entity Filing
- Withholding Tax Account

**Texas (TX):**
- Texas Unemployment Account
- Sales and Use Tax Permit
- Certificate of Formation
- Franchise Tax Account

**Florida (FL):**
- Reemployment Tax Account
- Sales and Use Tax Registration
- Sunbiz Entity Registration

**Washington (WA):**
- Unemployment Insurance Account
- Business License (UBI)
- Retail Sales Tax License
- Business Entity Registration

### 5. **API Endpoints**

#### Get Account Types
```
GET /api/compliance/account-types?state=CA
```
- Fetches all active compliance account types
- Optional `state` query parameter to filter by state
- Returns array of account types

#### Create Submission with Account Type
```
POST /api/compliance
{
  "state": "CA",
  "complianceAccountTypeId": "uuid-here",
  "complianceType": "Payroll Tax Filing",
  ...other fields
}
```

### 6. **User Interface**

The Compliance Submissions form now features a progressive, step-by-step workflow:

**Step 1: State Selection**
- Large, prominent input field for 2-letter state code
- Hints user to enter state to see available account types

**Step 2: Compliance Account Type Selection**
- Appears only after state is entered
- Shows dropdown with all available account types for that state
- Displays both account type name and agency in dropdown
- Shows helpful feedback (count of available types, warnings if none exist)

**Step 3: Customized Form Fields**
- Form dynamically shows only relevant fields based on selected account type
- Auto-populated fields (Compliance Type, State Agency) are read-only with gray background
- Fields are conditionally shown based on `requiredFields` JSON configuration
- Clean, uncluttered interface showing only what's needed

**Visual Feedback:**
- ✓ Green checkmarks for successful selections
- ⚠️ Warning icons for missing account types
- Read-only fields clearly indicated with gray background
- Step numbers and clear labels guide the user through the process

**Submissions Table:**
- Added **Account Type** column showing the associated compliance account type
- Displays "N/A" if no account type is linked (for legacy entries)

## Adding New Account Types

To add new account types, you can:

1. **Add to seed file** (for initial setup):
   Edit `prisma/seed.ts` and add new entries to the `accountTypes` array

2. **Add via Prisma Studio**:
   ```bash
   npm run prisma:studio
   ```
   Navigate to ComplianceAccountType table and add manually

3. **Add via API** (future enhancement):
   Could create admin endpoints to manage account types

## Benefits

1. **Consistency**: Standardize how different compliance types are tracked per state
2. **Automation**: Auto-populate common fields like agency names
3. **Organization**: Easily filter and view submissions by account type
4. **Flexibility**: Still allows manual entry for edge cases or new types
5. **Scalability**: Easy to add new states and account types as needed

## Future Enhancements

Potential improvements:
- Field validation based on `requiredFields` configuration
- Custom form fields per account type
- Account type templates for quick submission creation
- Reporting and analytics by account type
- Automated reminders based on account type filing requirements
