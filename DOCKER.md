# Dual Connect - Docker Deployment Guide

## 🐳 Quick Start with Docker

The easiest way to run Dual Connect is using Docker. The application is containerized with nginx and ready to run with a single command.

---

## Prerequisites

Make sure you have Docker installed:
- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (optional but recommended): Usually included with Docker Desktop

Check your installation:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Running with Docker Compose (Recommended)

### Option 1: Quick Start
```bash
# Navigate to project directory
cd DualConnect

# Start the application
docker-compose up

# Application will be available at:
# http://localhost:8080
```

### Option 2: Run in Background
```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 3: Rebuild After Changes
```bash
# Rebuild and start
docker-compose up --build

# Or rebuild without cache
docker-compose build --no-cache
docker-compose up
```

---

## 🐋 Running with Docker (Without Compose)

### Build the Image
```bash
docker build -t dualconnect:latest .
```

### Run the Container
```bash
docker run -d \
  --name dualconnect-web \
  -p 8080:80 \
  dualconnect:latest
```

### Access the Application
Open your browser and navigate to:
```
http://localhost:8080
```

### Manage the Container
```bash
# View logs
docker logs dualconnect-web

# Stop the container
docker stop dualconnect-web

# Start the container
docker start dualconnect-web

# Remove the container
docker rm dualconnect-web
```

---

## 🔧 Configuration

### Change Port
Edit `docker-compose.yml` and modify the ports section:
```yaml
ports:
  - "3000:80"  # Change 3000 to your desired port
```

### Development Mode
For development with live reload, use volume mounting (already configured in docker-compose.yml):
```yaml
volumes:
  - ./src:/usr/share/nginx/html:ro
  - ./database/sample-data:/usr/share/nginx/html/database/sample-data:ro
```

This allows you to edit files locally and see changes without rebuilding.

---

## 📦 Image Details

### Base Image
- **nginx:alpine** - Lightweight nginx server (~23MB)

### Exposed Ports
- **80** - HTTP (mapped to 8080 on host by default)

### Volume Mounts
- `/usr/share/nginx/html` - Website files
- `/usr/share/nginx/html/database/sample-data` - JSON data files

### Health Check
The container includes a health check that runs every 30 seconds:
```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' dualconnect-web
```

---

## 🌐 Accessing Different Pages

Once running, you can access:

- **Landing Page**: http://localhost:8080/
- **Search Programs**: http://localhost:8080/search.html
- **Program Details**: http://localhost:8080/program-detail.html?id=1
- **For Parents**: http://localhost:8080/parents.html
- **Contact**: http://localhost:8080/contact.html

---

## 🛠️ Troubleshooting

### Port Already in Use
If port 8080 is already in use:
```bash
# Use a different port
docker-compose down
# Edit docker-compose.yml to change port
docker-compose up
```

Or specify port when running manually:
```bash
docker run -d -p 3000:80 --name dualconnect-web dualconnect:latest
```

### Container Won't Start
```bash
# Check logs
docker-compose logs

# Or for manual run
docker logs dualconnect-web
```

### Page Not Loading
1. Check container is running:
   ```bash
   docker ps
   ```

2. Check health status:
   ```bash
   docker inspect dualconnect-web | grep Health -A 10
   ```

3. Verify nginx is running:
   ```bash
   docker exec dualconnect-web nginx -t
   ```

### JSON Data Not Loading
If you see "Error loading data" in the browser:

1. Check browser console for CORS errors
2. Verify data files are mounted:
   ```bash
   docker exec dualconnect-web ls -la /usr/share/nginx/html/database/sample-data/
   ```

3. Check nginx configuration:
   ```bash
   docker exec dualconnect-web cat /etc/nginx/conf.d/default.conf
   ```

---

## 🔒 Production Deployment

### Build Production Image
```bash
# Build without dev volumes
docker build -t dualconnect:production .
```

### Run Production Container
```bash
docker run -d \
  --name dualconnect-prod \
  -p 80:80 \
  --restart unless-stopped \
  dualconnect:production
```

### Deploy to Cloud

#### Docker Hub
```bash
# Tag image
docker tag dualconnect:latest yourusername/dualconnect:latest

# Push to Docker Hub
docker push yourusername/dualconnect:latest

# Pull on server
docker pull yourusername/dualconnect:latest
docker run -d -p 80:80 yourusername/dualconnect:latest
```

#### AWS ECS / Azure Container Instances / GCP Cloud Run
The image can be deployed to any container platform. See respective platform documentation.

---

## 📊 Resource Usage

### Image Size
- **nginx:alpine base**: ~23 MB
- **Application files**: ~2 MB
- **Total image size**: ~25 MB

### Runtime Resources
- **Memory**: ~10-20 MB
- **CPU**: Minimal (static files only)

---

## 🧪 Testing the Docker Setup

### Quick Test Script
```bash
#!/bin/bash
# test-docker.sh

echo "Building Docker image..."
docker-compose build

echo "Starting container..."
docker-compose up -d

echo "Waiting for container to be healthy..."
sleep 5

echo "Testing homepage..."
curl -f http://localhost:8080/ > /dev/null && echo "✓ Homepage works" || echo "✗ Homepage failed"

echo "Testing search page..."
curl -f http://localhost:8080/search.html > /dev/null && echo "✓ Search page works" || echo "✗ Search page failed"

echo "Testing JSON data..."
curl -f http://localhost:8080/database/sample-data/programs.json > /dev/null && echo "✓ JSON data works" || echo "✗ JSON data failed"

echo "Stopping container..."
docker-compose down

echo "Test complete!"
```

---

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up --build -d
```

### View Logs
```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi dualconnect:latest

# Clean up all unused Docker resources
docker system prune -a
```

---

## 💡 Tips

1. **Development**: Use volume mounts for live editing
2. **Production**: Build image without volumes for immutability
3. **Monitoring**: Use `docker stats` to monitor resource usage
4. **Scaling**: Can easily scale with Kubernetes or Docker Swarm
5. **Backup**: Database files are in JSON, easy to back up

---

## 📚 Further Reading

- [Docker Documentation](https://docs.docker.com/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/)

---

**Ready to Deploy!** 🚀

Your Dual Connect application is now fully containerized and ready to run anywhere Docker is supported.
