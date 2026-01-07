# Penguin Power Compliance Manager

A state compliance manager command center web application designed to help companies manage and track various state agency compliance registrations.

## 🎯 Features

- **User Authentication**: Secure login and registration with JWT tokens
- **Dashboard Home**: View alerts for expiring registrations and manage your to-do list
- **Determine Nexus**: Upload payroll or census data to analyze state compliance obligations
- **Compliance Submissions**: Manage your existing state compliance submissions with links to storage, portals, and password managers
- **Submission Resources**: Searchable database of state-specific compliance guides and processes

## 🛠️ Tech Stack

- **Frontend**: React with TypeScript, Vite
- **Backend**: Node.js with Express, TypeScript
- **Database**: SQLite (local development), Prisma ORM
- **Authentication**: JWT with bcrypt password hashing

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
cd c:\Users\Owner\Documents\GitHub\PenguinPowerCompliance
```

### 2. Install Dependencies

Install root dependencies:
```bash
npm install
```

Install client dependencies:
```bash
cd client
npm install
cd ..
```

### 3. Setup Environment Variables

Copy the example environment file:
```bash
copy .env.example .env
```

Edit `.env` and update the values as needed:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=3001
NODE_ENV=development
```

### 4. Initialize Database

Generate Prisma client:
```bash
npm run prisma:generate
```

Create and migrate the database:
```bash
npm run prisma:migrate
```

When prompted for a migration name, you can use: `init`

### 5. Start the Application

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

## 📱 Usage

### First Time Setup

1. Navigate to http://localhost:3000
2. Click "Don't have an account? Register"
3. Create your account
4. You'll be automatically logged in and redirected to the dashboard

### Main Features

#### Home Dashboard
- View expiring compliance registrations
- Manage your to-do list
- Quick navigation to other features

#### Determine Nexus
1. Navigate to "Determine Nexus"
2. Select data type (Payroll or Census)
3. Upload a CSV or Excel file with employee location data
4. Review the analysis and recommendations
5. Add recommendations to your to-do list

#### Compliance Submissions
1. Navigate to "Compliance Submissions"
2. Click "+ Add Submission" to create a new entry
3. Fill in the details:
   - Compliance type (e.g., "SOS Registration")
   - State and agency information
   - Entity and registration details
   - Links to filing storage, compliance portals, and password managers
4. Edit or delete submissions as needed

#### Submission Resources
1. Navigate to "Resources"
2. Browse or search for state-specific compliance guides
3. Filter by state or compliance type
4. Click "View Details" to see full information
5. Add new resources with "+ Add Resource"

## 🗂️ Project Structure

```
PenguinPowerCompliance/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
├── server/                   # Express backend
│   ├── routes/              # API routes
│   │   ├── auth.ts         # Authentication
│   │   ├── compliance.ts   # Compliance submissions
│   │   ├── nexus.ts        # Nexus analysis
│   │   ├── resources.ts    # State resources
│   │   └── todos.ts        # To-do items
│   ├── middleware/          # Auth middleware
│   └── index.ts            # Server entry point
├── prisma/
│   └── schema.prisma       # Database schema
├── package.json            # Root package file
├── tsconfig.json          # TypeScript config
└── README.md
```

## 🔧 Development Scripts

### Root Level
- `npm run dev` - Run both frontend and backend
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Client Directory
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production

## 🗄️ Database Schema

The application uses the following main models:

- **User**: User accounts and authentication
- **TodoItem**: User task list items
- **ComplianceSubmission**: State compliance submission records
- **StateResource**: Compliance guides and process documentation
- **NexusData**: Historical nexus analysis results

## 🔒 Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- No sensitive compliance credentials are stored in the database
- Only links to external storage and password managers are saved

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### To-Do Items
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Compliance Submissions
- `GET /api/compliance` - Get all submissions
- `GET /api/compliance/expiring` - Get expiring submissions
- `POST /api/compliance` - Create submission
- `PUT /api/compliance/:id` - Update submission
- `DELETE /api/compliance/:id` - Delete submission

### State Resources
- `GET /api/resources` - Get all resources (with filters)
- `GET /api/resources/:id` - Get single resource
- `POST /api/resources` - Create resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource

### Nexus Analysis
- `POST /api/nexus/analyze` - Upload and analyze file
- `GET /api/nexus/history` - Get analysis history

## 🐛 Troubleshooting

### Port already in use
If ports 3000 or 3001 are already in use, you can change them:
- Backend: Edit `PORT` in `.env`
- Frontend: Edit `server.port` in `client/vite.config.ts`

### Database issues
Reset the database:
```bash
del prisma\dev.db
npm run prisma:migrate
```

### Module not found errors
Reinstall dependencies:
```bash
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

## 🚀 Production Deployment

### Build the application
```bash
npm run build
```

### Environment Variables for Production
Update `.env` with production values:
- Use a strong `JWT_SECRET`
- Configure production database URL
- Set `NODE_ENV=production`

### Run in production
```bash
npm start
```

## 📄 License

This project is for internal use by Penguin Power Compliance.

## 🤝 Support

For issues or questions, please contact the development team.

---

Built with ❤️ for state compliance management
