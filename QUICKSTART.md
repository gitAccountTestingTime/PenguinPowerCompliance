# Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Install Dependencies
```powershell
npm install
cd client
npm install
cd ..
```

### Step 2: Setup Database
```powershell
npm run prisma:generate
npm run prisma:migrate
```
When asked for migration name, enter: `init`

### Step 2.5: (Optional) Seed Sample Data
```powershell
npm run prisma:seed
```
This adds sample state resources to help you get started!

### Step 3: Run the Application
```powershell
npm run dev
```

### Step 4: Access the Application
Open your browser and go to: http://localhost:3000

### Step 5: Create Your Account
1. Click "Don't have an account? Register"
2. Enter your details
3. Start managing your compliance!

## What to Do First

1. **Add Sample Resources**: Go to Resources → Add a few state compliance guides
2. **Create Submissions**: Go to Compliance Submissions → Add your existing registrations
3. **Try Nexus Analysis**: Go to Determine Nexus → Upload a sample CSV file
4. **Check Dashboard**: Return to Home to see your alerts and to-do items

## Sample CSV for Nexus Testing

A sample CSV file is included in `sample-data/employee-census.csv`

Or create your own file called `test.csv` with this content:
```
Employee,State,Location
John Doe,CA,Los Angeles
Jane Smith,NY,New York
Bob Johnson,TX,Houston
Alice Williams,FL,Miami
```

## Need Help?

See the full README.md for detailed documentation.
