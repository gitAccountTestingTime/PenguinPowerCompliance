# Testing Checklist for Penguin Power Compliance Manager

## ✅ Pre-Testing Setup

- [ ] All dependencies installed (`npm install` in root and `client/`)
- [ ] Database initialized (`npm run prisma:migrate`)
- [ ] Application running (`npm run dev`)
- [ ] Browser open at http://localhost:3000

## 1. Authentication Testing

### Registration
- [ ] Navigate to login page
- [ ] Click "Don't have an account? Register"
- [ ] Fill in name, email, and password
- [ ] Click Register button
- [ ] Verify successful registration and automatic login
- [ ] Verify redirect to home dashboard

### Login
- [ ] Logout from current session
- [ ] Enter valid credentials
- [ ] Click Login button
- [ ] Verify successful login
- [ ] Verify redirect to home dashboard

### Session Persistence
- [ ] Login successfully
- [ ] Refresh the page
- [ ] Verify still logged in

### Protected Routes
- [ ] Logout
- [ ] Try to access /compliance directly
- [ ] Verify redirect to /login

## 2. Home Dashboard Testing

### Initial State
- [ ] View empty to-do list message
- [ ] View "No expiring submissions" (or existing alerts)
- [ ] Click all three Quick Action buttons
- [ ] Verify navigation works

### With Data
- [ ] Create some compliance submissions with near expiration dates
- [ ] Verify they appear in alerts section
- [ ] Create some to-do items
- [ ] Verify they appear in to-do list

### To-Do List Functionality
- [ ] Check a to-do item checkbox
- [ ] Verify it gets line-through styling
- [ ] Uncheck the item
- [ ] Verify styling reverts
- [ ] Click Delete on a to-do
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] Verify item removed

## 3. Determine Nexus Testing

### File Upload
- [ ] Navigate to Determine Nexus page
- [ ] Select "Payroll Data" type
- [ ] Click file input (no file selected)
- [ ] Click "Analyze Nexus" button
- [ ] Verify error message appears

### Valid Analysis
- [ ] Use sample-data/employee-census.csv
- [ ] Select "Census Data" type
- [ ] Choose the file
- [ ] Click "Analyze Nexus"
- [ ] Wait for analysis to complete
- [ ] Verify results display:
  - File type shown
  - Total records count
  - States identified list

### Recommendations
- [ ] Verify recommendations appear
- [ ] Click "Add to To-Do" on one recommendation
- [ ] Verify success alert
- [ ] Navigate to Home
- [ ] Verify item appears in to-do list
- [ ] Return to Determine Nexus
- [ ] Upload file again
- [ ] Click "Add All to To-Do List"
- [ ] Verify success alert
- [ ] Check Home for new items

## 4. Compliance Submissions Testing

### View Empty State
- [ ] Navigate to Compliance Submissions
- [ ] Verify empty state message
- [ ] Verify "Add Submission" button visible

### Create Submission
- [ ] Click "+ Add Submission"
- [ ] Verify modal opens
- [ ] Fill in required fields:
  - Compliance Type: "SOS Registration"
  - State: "CA"
  - State Agency: "Secretary of State"
  - Entity Name: "Test Company LLC"
  - Registration Number: "12345678"
  - Status: "Active"
- [ ] Add dates:
  - Filing Date: (select a past date)
  - Expiration Date: (select a future date)
- [ ] Add links:
  - Filing Storage: "https://sharepoint.com/test"
  - Compliance Portal: "https://sos.ca.gov"
  - Password Manager: "https://1password.com"
- [ ] Add notes: "Test submission notes"
- [ ] Click "Create"
- [ ] Verify modal closes
- [ ] Verify submission appears in table

### Edit Submission
- [ ] Click "Edit" on the submission
- [ ] Verify modal opens with existing data
- [ ] Change status to "Expired"
- [ ] Click "Update"
- [ ] Verify modal closes
- [ ] Verify status badge updated

### Delete Submission
- [ ] Click "Delete" on a submission
- [ ] Verify confirmation dialog
- [ ] Click OK
- [ ] Verify submission removed from table

### Multiple Submissions
- [ ] Create 3-4 different submissions
- [ ] Vary states (CA, NY, TX, FL)
- [ ] Vary expiration dates
- [ ] Verify table displays all submissions
- [ ] Verify sorting (if implemented)

## 5. Submission Resources Testing

### Initial State (if seeded)
- [ ] Navigate to Submission Resources
- [ ] Verify sample resources display
- [ ] Count total resources shown

### Search Functionality
- [ ] Enter "California" in search box
- [ ] Verify filtered results
- [ ] Clear search
- [ ] Verify all resources return

### Filter by State
- [ ] Select "CA" from state dropdown
- [ ] Verify only CA resources show
- [ ] Select "All States"
- [ ] Verify all resources return

### Filter by Type
- [ ] Select a compliance type
- [ ] Verify filtered results
- [ ] Select "All Types"
- [ ] Verify all resources return

### Combined Filters
- [ ] Set state filter
- [ ] Set type filter
- [ ] Set search term
- [ ] Verify results match all criteria
- [ ] Clear all filters

### View Resource Details
- [ ] Click "View Details" on a resource
- [ ] Verify modal opens
- [ ] Verify all fields display:
  - Title
  - State and Type badges
  - Description
  - Required Documents
  - Filing Frequency
  - Fees
  - Portal Link (clickable)
  - Additional Notes
- [ ] Click portal link
- [ ] Verify opens in new tab
- [ ] Close modal

### Add New Resource
- [ ] Click "+ Add Resource"
- [ ] Verify modal opens
- [ ] Try to submit empty form
- [ ] Verify validation errors
- [ ] Fill in all fields:
  - State: "TX"
  - Compliance Type: "Tax Filing"
  - Title: "Texas Franchise Tax"
  - Description: "Annual franchise tax filing"
  - Required Documents: "Financial statements"
  - Filing Frequency: "Annual"
  - Fees: "$200"
  - Portal Link: "https://comptroller.texas.gov"
  - Additional Notes: "Due May 15th"
- [ ] Click "Create Resource"
- [ ] Verify modal closes
- [ ] Verify new resource appears in grid
- [ ] Filter by "TX" to confirm

## 6. Navigation Testing

### Navbar
- [ ] Verify all navigation links work:
  - Home
  - Determine Nexus
  - Compliance Submissions
  - Resources
- [ ] Verify user name displays
- [ ] Click Logout
- [ ] Verify redirect to login

### Browser Navigation
- [ ] Use browser back button
- [ ] Verify proper page history
- [ ] Use browser forward button
- [ ] Verify navigation works

### Direct URL Access
- [ ] While logged in, manually enter URLs:
  - http://localhost:3000/
  - http://localhost:3000/nexus
  - http://localhost:3000/compliance
  - http://localhost:3000/resources
- [ ] Verify all routes work

## 7. Edge Cases & Error Handling

### Large Data Sets
- [ ] Create 10+ compliance submissions
- [ ] Verify table displays properly
- [ ] Check scrolling behavior

### Long Text
- [ ] Create submission with very long notes
- [ ] Verify display and editing work
- [ ] Create resource with long description
- [ ] Verify card and modal display

### Invalid Data
- [ ] Try uploading a non-CSV file to nexus
- [ ] Verify appropriate error handling
- [ ] Try dates in wrong order (expiration before filing)
- [ ] Verify system handles it

### Network Errors
- [ ] Stop the backend server
- [ ] Try to create a submission
- [ ] Verify error message appears
- [ ] Restart backend
- [ ] Verify functionality returns

## 8. Cross-Browser Testing

Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if on Mac)

## 9. Responsive Design

Test at different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768px width)
- [ ] Mobile (375px width)

## 10. Performance Testing

- [ ] Time initial page load
- [ ] Check for console errors
- [ ] Verify no memory leaks (check DevTools)
- [ ] Test with Network throttling (Slow 3G)

## 📝 Testing Notes

Record any issues found:

| Issue | Severity | Page/Feature | Notes |
|-------|----------|--------------|-------|
|       |          |              |       |

## ✅ Sign-Off

- [ ] All critical features working
- [ ] No blocking bugs found
- [ ] Application ready for demo/deployment

**Tested by:** ________________
**Date:** ________________
**Version:** 1.0.0
