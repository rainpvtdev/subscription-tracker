# Subscription Tracker Application

A full-stack web application for tracking subscription services with PostgreSQL database support.

## Features

- User authentication (login, registration)
- Subscription management (add, edit, delete)
- Dashboard with subscription analytics
- Dark/light theme support with persistent preferences
- PostgreSQL database integration
- Dedicated subscriptions page with:
  - Advanced filtering and search functionality
  - Pagination (10 items per page)
  - Modal form for subscription management
  - Real-time updates
- Responsive design with modern UI components
- Theme toggle accessibility (sidebar and floating options)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd SubscriptionTracker
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (copy from template)
```bash
cp .env.example .env
```

4. Configure your environment variables as described in the Environment Setup section

## Environment Setup

The application uses environment variables for configuration. Make sure the following variables are set:

```
# Database configuration (automatically set by  PostgreSQL integration)
DATABASE_URL=postgres://username:password@hostname:port/database_name
PGHOST=hostname
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name
PGPORT=port
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:8080  # or your actual frontend URL

# Session secret
SESSION_SECRET=your_session_secret

# Data migration (optional)
STORAGE_PATH=./data
BACKUP_PATH=./backup
BACKUP_FILES=false
```

## Database Setup and Migration

### Setting Up the Database

To set up the PostgreSQL database tables:
== create database ==
npx tsx scripts/create-database.ts


```bash
node scripts/setup-database.js
```

This script runs `drizzle-kit push` to create or update the database tables based on your schema.

### Migrating from In-Memory to PostgreSQL

The application initially uses in-memory storage. To migrate this data to PostgreSQL:

1. First, ensure your database tables are created using the setup script above
```bash
 node scripts/generate-sample-data.js
```

2. Run the migration script:

```bash
node scripts/migrate-to-postgres.js
```

This script will:
- Read data from JSON files (if they exist)
- Insert the data into PostgreSQL
- Back up or remove the original files based on your configuration

## Usage Guide

### Dashboard

The dashboard provides an overview of your subscriptions with:
- Quick statistics and analytics
- Recent subscription cards
- Upcoming payments
- Filter by status (active/inactive)
- Theme toggle for dark/light mode

### Subscriptions Page

The dedicated subscriptions page (`/subscriptions`) offers:
- Full-width table view of all subscriptions
- Advanced filtering capabilities:
  - Search by name
  - Filter by status
  - Sort by date, name, or amount
- Pagination with 10 items per page
- Subscription management:
  - Add new subscriptions via modal form
  - Edit existing subscriptions
  - Delete subscriptions
  - Toggle subscription status

### Theme Management

The application supports comprehensive theme management:
- Theme persistence across sessions
- Multiple toggle locations:
  - Sidebar dropdown
  - Floating button on dashboard
- System theme detection
- Smooth theme transitions
- Accessible color schemes

## Development Guide

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run tests
npm test

# Generate database types
npm run generate-types

# Lint code
npm run lint
```

### Code Organization

The project follows a modular architecture:

#### Frontend (`/client`)
- `/components`: Reusable UI components
- `/pages`: Main application views
- `/hooks`: Custom React hooks
- `/utils`: Helper functions
- `/styles`: Global styles and Tailwind configuration

#### Backend (`/server`)
- `/routes`: API endpoints
- `/middleware`: Express middleware
- `/storage`: Data storage implementations
- `/auth`: Authentication logic
- `/types`: TypeScript type definitions

#### Shared (`/shared`)
- `schema.ts`: Database schema definitions
- `types.ts`: Shared TypeScript types

### Best Practices

1. **Code Style**
   - Follow TypeScript best practices
   - Use ESLint for code linting
   - Follow component composition patterns

2. **State Management**
   - Use React Query for server state
   - Local state with React hooks
   - Persistent storage for theme preferences

3. **Testing**
   - Unit tests for utilities
   - Integration tests for API endpoints
   - Component testing with React Testing Library

## API Documentation

### Authentication Endpoints

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/status
```

### Subscription Endpoints

```
GET    /api/subscriptions       # List all subscriptions
POST   /api/subscriptions       # Create new subscription
GET    /api/subscriptions/:id   # Get subscription details
PUT    /api/subscriptions/:id   # Update subscription
DELETE /api/subscriptions/:id   # Delete subscription
```

### Request/Response Examples

#### Create Subscription
```json
POST /api/subscriptions
{
  "name": "Netflix",
  "amount": 15.99,
  "billingCycle": "monthly",
  "startDate": "2025-01-01",
  "status": "active"
}
```

#### List Subscriptions
```json
GET /api/subscriptions?page=1&limit=10&status=active
Response:
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

## Deployment

### Prerequisites

1. **Node.js Environment**
   - Node.js v16 or higher
   - npm or yarn package manager
   - PostgreSQL v13 or higher

2. **Environment Setup**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd SubscriptionTracker

   # Install dependencies
   npm install

   # Copy environment template
   cp .env.example .env
   ```

3. **Configure Environment Variables**
   ```env
   # Database configuration
   DATABASE_URL=postgres://username:password@hostname:port/database_name
   PGHOST=hostname
   PGUSER=username
   PGPASSWORD=password
   PGDATABASE=database_name
   PGPORT=port

   # Session configuration
   SESSION_SECRET=your_secure_session_secret

   # Optional: Email configuration for reminders
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   ```

### Production Build

1. **Build the Application**
   ```bash
   # Build frontend assets
   npm run build

   # Verify the build
   npm run build:verify
   ```

2. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:migrate

   # Verify database connection
   npm run db:verify
   ```

### Deployment Options

#### 1. Traditional Server Deployment

1. **Server Requirements**
   - Ubuntu 20.04 LTS or similar
   - Nginx web server
   - PM2 process manager
   - PostgreSQL database

2. **Setup Steps**
   ```bash
   # Install PM2 globally
   npm install -g pm2

   # Start the application
   pm2 start npm --name "subscription-tracker" -- start

   # Ensure app starts on system reboot
   pm2 startup
   pm2 save
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### 2. Docker Deployment

1. **Build Docker Image**
   ```bash
   # Build the image
   docker build -t subscription-tracker .

   # Run the container
   docker run -d \
     --name subscription-tracker \
     -p 8080:8080 \
     --env-file .env \
     subscription-tracker
   ```

2. **Docker Compose Setup**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "8080:8080"
       env_file: .env
       depends_on:
         - db
     db:
       image: postgres:13
       environment:
         POSTGRES_USER: ${PGUSER}
         POSTGRES_PASSWORD: ${PGPASSWORD}
         POSTGRES_DB: ${PGDATABASE}
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

#### 3. Cloud Platform Deployment

1. **Heroku Deployment**
   ```bash
   # Login to Heroku
   heroku login

   # Create a new app
   heroku create subscription-tracker

   # Add PostgreSQL addon
   heroku addons:create heroku-postgresql:hobby-dev

   # Push to Heroku
   git push heroku main

   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your_secret
   ```

2. **Railway/Render Deployment**
   - Fork the repository
   - Connect to Railway/Render
   - Configure environment variables
   - Enable automatic deployments

### Post-Deployment Checklist

1. **Security Verification**
   - [ ] SSL/TLS certificate installed
   - [ ] Environment variables properly set
   - [ ] Database backups configured
   - [ ] Rate limiting enabled
   - [ ] Security headers configured

2. **Performance Verification**
   - [ ] Database indexes created
   - [ ] Static assets compressed
   - [ ] Caching configured
   - [ ] Load testing performed

3. **Monitoring Setup**
   - [ ] Error logging configured
   - [ ] Performance monitoring enabled
   - [ ] Uptime monitoring setup
   - [ ] Database monitoring active

### Troubleshooting

1. **Database Connection Issues**
   ```bash
   # Check database connection
   npm run db:check

   # Verify migrations
   npm run db:migrate:status
   ```

2. **Application Logs**
   ```bash
   # View PM2 logs
   pm2 logs subscription-tracker

   # View Docker logs
   docker logs subscription-tracker
   ```

3. **Common Issues**
   - Database connection timeouts: Check network rules and connection limits
   - Memory issues: Adjust Node.js memory limits using `--max-old-space-size`
   - Session errors: Verify SESSION_SECRET and session store configuration

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```
3. Make your changes
4. Run tests and linting
```bash
npm run test
npm run lint
```
5. Submit a pull request

### Code Style Guidelines

- Use TypeScript strict mode
- Follow ESLint configuration
- Write unit tests for new features
- Update documentation for API changes

### Commit Guidelines

Follow conventional commits format:
```
feat: add new feature
fix: resolve bug
docs: update documentation
test: add tests
refactor: code improvements
```

## Security

### Authentication

- Session-based authentication
- CSRF protection
- Rate limiting on auth endpoints
- Secure password hashing

### Data Protection

- Input validation
- SQL injection prevention via ORM
- XSS protection
- HTTPS enforcement

## Performance Optimization

### Frontend

- Code splitting
- Lazy loading of routes
- Image optimization
- Caching strategies

### Backend

- Database query optimization
- Connection pooling
- Response compression
- Rate limiting

## Development

To start the development server:

```bash
npm run dev
```

## Architecture

### Frontend

- React with TypeScript
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- Theme management:
  - next-themes for theme handling
  - Local storage persistence (key: "subscription-tracker-theme")
  - Dark mode support via Tailwind's 'dark' class
  - Multiple theme toggle locations for better accessibility

### Backend

- Node.js with Express
- PostgreSQL database with Drizzle ORM
- Passport.js for authentication

### Storage Implementation

The application supports two storage implementations:

1. **MemStorage**: In-memory storage for development
2. **DatabaseStorage**: PostgreSQL-based storage for production

The storage implementation can be configured in `server/storage.ts` by choosing which implementation to export.

### Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── theme-provider.tsx    # Base theme configuration
│   │   ├── theme-toggle.tsx      # Dropdown theme toggle
│   │   ├── floating-theme-toggle.tsx  # Floating theme toggle
│   │   ├── subscription-table/   # Subscription management components
│   │   ├── subscription-filter/  # Filter and search components
│   │   └── subscription-form/    # Add/Edit subscription forms
│   └── pages/
│       ├── dashboard/           # Main dashboard view
│       └── subscriptions/       # Dedicated subscriptions page
server/
├── storage.ts                   # Storage implementation selector
├── database-storage.ts         # PostgreSQL storage implementation
└── mem-storage.ts             # In-memory storage implementation