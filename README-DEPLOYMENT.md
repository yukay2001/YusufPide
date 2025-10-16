# Deployment Guide - Pideci Management Panel

This guide explains how to deploy the Pideci Management Panel to various platforms, with specific instructions for Vercel, Netlify, Railway, and other hosting providers.

---

## ⚠️ **IMPORTANT: Platform Recommendation**

**🚂 Railway is HIGHLY RECOMMENDED for this project** due to its native TypeScript monorepo support and built-in PostgreSQL.

### Why Railway?
- ✅ **Native TypeScript Support** - No configuration needed
- ✅ **Built-in PostgreSQL** - Database included
- ✅ **Simple Deployment** - Works out of the box
- ✅ **No Module Issues** - Handles monorepo structure perfectly
- ⚡ **5-minute setup** - Fastest deployment option

### Why NOT Vercel?
- ❌ **TypeScript Monorepo Issues** - Complex serverless function setup
- ❌ **Module Import Errors** - Cannot resolve `../server/` imports in `api/` folder
- ❌ **External Database Required** - No built-in PostgreSQL
- ⚠️ **Known Issue:** "Unexpected token" and module resolution errors

**TL;DR:** If you want a hassle-free deployment → Use Railway! 🚂

For detailed Railway setup, see **[README-RAILWAY.md](./README-RAILWAY.md)** ⭐

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deploying to Vercel](#deploying-to-vercel)
- [Deploying to Railway](#deploying-to-railway)
- [Deploying to Render](#deploying-to-render)
- [Deploying to Your Own Server](#deploying-to-your-own-server)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

Before deploying, ensure you have:

1. **PostgreSQL Database** - You'll need a PostgreSQL database (version 14+)
   - [Neon](https://neon.tech) - Free tier available
   - [Supabase](https://supabase.com) - Free tier available
   - [Railway](https://railway.app) - PostgreSQL included
   - [Render](https://render.com) - PostgreSQL available

2. **GitHub Account** - To deploy from a repository

3. **Node.js 18+** - For local development and testing

---

## Environment Variables

Create a `.env` file based on `.env.example` with these required variables:

```env
# Database Configuration (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# Alternative individual database credentials
PGHOST=your-database-host
PGPORT=5432
PGUSER=your-database-user
PGPASSWORD=your-database-password
PGDATABASE=your-database-name

# Session Secret (Required - Change this!)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Environment
NODE_ENV=production

# Port (optional - some platforms set this automatically)
PORT=5000
```

### Getting Database Credentials

#### Neon (Recommended for Vercel)
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Use it as your `DATABASE_URL`

#### Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to Project Settings > Database
3. Copy the connection string (use "Connection pooling" mode)
4. Use it as your `DATABASE_URL`

---

## Deploying to Vercel

**Important:** This project uses Node.js 20.x. The `.node-version` file specifies this automatically for Vercel.

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/pideci-panel.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - **Framework Preset**: Other
     - **Build Command**: Leave empty (vercel.json handles this)
     - **Output Directory**: `dist/public`
     - **Install Command**: `npm install`

3. **Add Environment Variables**
   In Vercel project settings, add:
   ```
   DATABASE_URL=your-postgresql-connection-string
   SESSION_SECRET=your-secret-key
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be available at `https://your-project.vercel.app`

### Option 2: Deploy using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add NODE_ENV

# Deploy to production
vercel --prod
```

---

## Deploying to Railway

Railway includes PostgreSQL, making it an excellent choice for full-stack deployment.

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL**
   - Click "New" in your project
   - Select "Database" > "PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` variable

4. **Add Environment Variables**
   - Go to your web service variables
   - Add `SESSION_SECRET`
   - Add `NODE_ENV=production`

5. **Configure Build**
   - Build Command: `npm run build`
   - Start Command: `npm start`

6. **Deploy**
   - Railway will automatically deploy
   - Your app will be available at the generated Railway URL

---

## Deploying to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Dashboard > New > PostgreSQL
   - Note the Internal Database URL

3. **Create Web Service**
   - Dashboard > New > Web Service
   - Connect your GitHub repository
   - Configure:
     - **Name**: pideci-panel
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

4. **Add Environment Variables**
   ```
   DATABASE_URL=[Your Render PostgreSQL URL]
   SESSION_SECRET=[Your secret key]
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically

---

## Deploying to Your Own Server

### Using PM2 (Production Process Manager)

1. **Install Node.js and npm** on your server

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Clone your repository**
   ```bash
   git clone https://github.com/yourusername/pideci-panel.git
   cd pideci-panel
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Create `.env` file** with your environment variables

6. **Build the application**
   ```bash
   npm run build
   ```

7. **Start with PM2**
   ```bash
   pm2 start npm --name "pideci-panel" -- start
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx (optional)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Database Setup

After deploying, you need to initialize the database:

### 1. Push Database Schema

```bash
# Install dependencies first
npm install

# Push schema to database
npm run db:push
```

Or if you get conflicts:
```bash
npm run db:push -- --force
```

### 2. Access Your Application

The first time you access the application, it will automatically:
- Create initial permissions and roles
- Create default admin user: `admin` / `admin123`
- Create default categories
- Seed initial products
- Create the first business session

### 3. Change Default Password

**Important**: After first login, immediately:
1. Go to "Kullanıcılar" (Users)
2. Edit the admin user
3. Change the password from `admin123` to a secure password

---

## Post-Deployment

### Security Checklist

- [ ] Change default admin password
- [ ] Set strong `SESSION_SECRET` environment variable
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Regularly backup your database
- [ ] Keep dependencies updated

### Monitoring

- Check application logs in your platform's dashboard
- Monitor database connections
- Set up alerts for errors

### Scaling

For production use with multiple users:
- Use connection pooling for database (already configured)
- Consider using a CDN for static assets
- Monitor performance and scale resources as needed

---

## Troubleshooting

### Build Fails
- Ensure all environment variables are set
- Check that `DATABASE_URL` is accessible from the deployment platform
- Verify Node.js version is 18 or higher

### Database Connection Errors
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check database is accessible from the deployment platform
- For Neon/Supabase, ensure you're using the connection pooling URL

### Session Issues
- Ensure `SESSION_SECRET` is set
- Verify database has the `session` table (created automatically by connect-pg-simple)
- Check that cookies are enabled in your browser

### Application Not Starting
- Check logs in your platform dashboard
- Verify all required environment variables are set
- Ensure database schema has been pushed (`npm run db:push`)

---

## Support

For issues:
1. Check logs in your deployment platform
2. Review environment variables
3. Verify database connectivity
4. Check GitHub issues for similar problems

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
