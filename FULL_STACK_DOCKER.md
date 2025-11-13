# Dual Connect - Full Stack Deployment Guide

This guide covers deploying the complete Dual Connect platform with PostgreSQL database, Node.js backend API, and nginx frontend.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB of available RAM
- Ports 3000, 5432, and 8080 available

### 1. Environment Configuration

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Edit `.env` and set secure values for:
- `DB_PASSWORD` - Database password (minimum 16 characters)
- `JWT_SECRET` - JWT signing key (minimum 32 characters)
- Optional: Email SMTP settings for notifications

### 2. Start All Services

```bash
docker-compose -f docker-compose.full-stack.yml up -d
```

This will start:
- **PostgreSQL** on port 5432
- **Backend API** on port 3000
- **Frontend** on port 8080

### 3. Initialize Database

Wait for services to be healthy (about 30 seconds), then seed the database:

```bash
docker exec -it dualconnect_api npm run seed
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **API**: http://localhost:3000/api
- **API Health**: http://localhost:3000/health

### Demo Credentials

After seeding:
- **User Account**: demo@dualconnect.de / Demo123!
- **Admin Account**: admin@dualconnect.de / Demo123!

## 📋 Service Details

### PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: dualconnect
- **User**: dualconnect_user
- **Schema**: Automatically initialized from `backend/config/schema.sql`
- **Data Persistence**: Volume `postgres_data`

### Backend API
- **Runtime**: Node.js 18
- **Port**: 3000
- **Framework**: Express.js
- **Authentication**: JWT tokens
- **Upload Storage**: Volume `uploads`

### Frontend
- **Server**: nginx:alpine
- **Port**: 8080
- **Static Files**: Served from `/src`
- **API Proxy**: Not configured (frontend calls API directly)

## 🔧 Management Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.full-stack.yml logs -f

# Specific service
docker-compose -f docker-compose.full-stack.yml logs -f backend
docker-compose -f docker-compose.full-stack.yml logs -f postgres
docker-compose -f docker-compose.full-stack.yml logs -f frontend
```

### Stop Services

```bash
docker-compose -f docker-compose.full-stack.yml stop
```

### Restart Services

```bash
docker-compose -f docker-compose.full-stack.yml restart
```

### Stop and Remove Everything

```bash
docker-compose -f docker-compose.full-stack.yml down
```

### Stop and Remove Including Volumes (⚠️ Deletes database data)

```bash
docker-compose -f docker-compose.full-stack.yml down -v
```

## 🗄️ Database Management

### Access PostgreSQL CLI

```bash
docker exec -it dualconnect_db psql -U dualconnect_user -d dualconnect
```

### Backup Database

```bash
docker exec dualconnect_db pg_dump -U dualconnect_user dualconnect > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker exec -i dualconnect_db psql -U dualconnect_user -d dualconnect
```

### Reset Database

```bash
docker exec -it dualconnect_db psql -U dualconnect_user -d dualconnect -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -it dualconnect_db psql -U dualconnect_user -d dualconnect < backend/config/schema.sql
docker exec -it dualconnect_api npm run seed
```

## 🔍 Health Checks

All services include health checks:

```bash
# Check service status
docker-compose -f docker-compose.full-stack.yml ps

# Check API health
curl http://localhost:3000/health

# Check database health
docker exec dualconnect_db pg_isready -U dualconnect_user
```

## 🛠️ Development Mode

For development with hot reload:

```bash
# Start only database
docker-compose -f docker-compose.full-stack.yml up -d postgres

# Run backend locally
cd backend
npm install
npm run dev

# Frontend is static, just open in browser
# Or use any local server (e.g., python -m http.server 8080)
```

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose -f docker-compose.full-stack.yml logs

# Check Docker resources
docker stats
```

### Database Connection Errors

```bash
# Verify database is running
docker-compose -f docker-compose.full-stack.yml ps postgres

# Check database logs
docker-compose -f docker-compose.full-stack.yml logs postgres

# Test connection
docker exec -it dualconnect_db pg_isready -U dualconnect_user
```

### API Not Responding

```bash
# Check if backend is running
docker-compose -f docker-compose.full-stack.yml ps backend

# Check backend logs
docker-compose -f docker-compose.full-stack.yml logs backend

# Restart backend
docker-compose -f docker-compose.full-stack.yml restart backend
```

### Port Already in Use

If ports 3000, 5432, or 8080 are already in use, edit `docker-compose.full-stack.yml` and change the port mappings:

```yaml
ports:
  - "3001:3000"  # Change host port (left side)
```

## 🔒 Security Recommendations

### For Production:

1. **Change Default Passwords**
   - Set strong `DB_PASSWORD` in `.env`
   - Set strong `JWT_SECRET` (min 32 characters)

2. **Use HTTPS**
   - Set up reverse proxy (nginx, Traefik, Caddy)
   - Obtain SSL certificates (Let's Encrypt)

3. **Restrict Database Access**
   - Remove database port mapping from `docker-compose.full-stack.yml`
   - Database should only be accessible from backend

4. **Enable CORS Properly**
   - Update `FRONTEND_URL` in backend environment
   - Restrict CORS to your actual domain

5. **Regular Backups**
   - Set up automated database backups
   - Store backups securely off-site

## 📊 Monitoring

### Resource Usage

```bash
docker stats dualconnect_db dualconnect_api dualconnect_web
```

### API Performance

```bash
# Response time test
time curl http://localhost:3000/api/programs
```

### Database Connections

```bash
docker exec dualconnect_db psql -U dualconnect_user -d dualconnect -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🌐 Scaling

### Horizontal Scaling (Multiple Backend Instances)

```bash
docker-compose -f docker-compose.full-stack.yml up -d --scale backend=3
```

Note: You'll need to set up a load balancer (nginx, HAProxy) to distribute traffic.

### Vertical Scaling (More Resources)

Edit `docker-compose.full-stack.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 📝 API Endpoints

Full API documentation available at: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

Quick reference:
- `GET /api/programs` - List all programs
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/dashboard` - User dashboard stats
- See full list in API documentation

## 🎯 Next Steps

1. Configure email notifications (SMTP settings in `.env`)
2. Set up automated backups
3. Configure reverse proxy for HTTPS
4. Set up monitoring (Prometheus, Grafana)
5. Configure CI/CD pipeline

## 📞 Support

For issues or questions:
- Check logs first
- Review troubleshooting section
- Contact: support@dualconnect.de
