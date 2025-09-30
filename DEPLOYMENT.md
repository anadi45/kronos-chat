# 🚀 Deployment Plan: NestJS Backend + React Vite Frontend on AWS (EC2 + RDS + S3 + CloudFront)

This document describes how to deploy a **NestJS backend** and **React Vite frontend** on AWS using the **cheapest and reliable setup**:

- **Frontend** → S3 + CloudFront (or Docker on EC2)
- **Backend** → EC2 (Docker + Nginx)
- **Database** → RDS (Postgres/MySQL)
- **Secrets** → AWS Systems Manager Parameter Store (or Secrets Manager)
- **CI/CD** → GitHub Actions

---

## 1. AWS Resources to Create

- EC2 instance (t3.micro, ~ $9/mo)
- RDS instance (db.t3.micro, ~ $15–20/mo)
- S3 bucket for frontend hosting (optional if using Docker)
- CloudFront distribution (HTTPS + CDN)
- Parameter Store (or Secrets Manager) for environment variables
- IAM Role for EC2 (to read secrets)
- Elastic Container Registry (ECR) - optional for private Docker images

---

## 2. Backend (NestJS with Docker on EC2)

### Launch EC2

- Use Amazon Linux 2023 or Ubuntu 22.04 LTS
- Assign IAM Role with access to Parameter Store/Secrets Manager
- Security Group:
  - Port 22 (SSH) → your IP only
  - Port 80 (HTTP), 443 (HTTPS) → public

### Install Docker & Docker Compose

```bash
# For Ubuntu
sudo apt update -y
sudo apt install -y docker.io docker-compose nginx
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# For Amazon Linux 2023
sudo yum update -y
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
```

### Create Dockerfile for NestJS

Create `Dockerfile` in your NestJS project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: nestjs-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=${DATABASE_HOST}
      - DATABASE_PORT=${DATABASE_PORT}
      - DATABASE_USER=${DATABASE_USER}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_NAME=${DATABASE_NAME}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Deploy with Docker

```bash
cd /var/www/myapp
git clone <repo-url> .

# Build and run
docker-compose up -d --build

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down
```

### Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/myapp.conf`:

```nginx
server {
    listen 80;
    server_name api.myapp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable config:

```bash
sudo ln -s /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.myapp.com
```

---

## 3. Alternative: Using ECR (Elastic Container Registry)

### Push to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name myapp-backend

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t myapp-backend .
docker tag myapp-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/myapp-backend:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/myapp-backend:latest
```

### Pull and run on EC2

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Pull and run
docker pull <account-id>.dkr.ecr.us-east-1.amazonaws.com/myapp-backend:latest
docker run -d -p 3000:3000 --name backend --restart always <account-id>.dkr.ecr.us-east-1.amazonaws.com/myapp-backend:latest
```

---

## 4. Database (RDS)

1. Launch RDS (Postgres/MySQL) in private subnet
2. Create DB + user
3. Store credentials in Secrets Manager or Parameter Store

Example secret JSON:

```json
{
  "username": "myuser",
  "password": "mypassword",
  "host": "mydb.abcdefgh.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "mydb"
}
```

4. Security group: allow EC2 → RDS port (5432/3306)

---

## 5. Frontend Options

### Option A: S3 + CloudFront (Cheapest)

#### Build Project

```bash
cd frontend
npm ci
npm run build
```

#### Upload to S3

```bash
aws s3 sync dist/ s3://myapp-frontend-bucket --delete
```

#### CloudFront Configuration

- Origin = S3 bucket
- Enable OAI/OAC for secure access
- Add custom domain with ACM certificate (us-east-1)

### Option B: Docker on EC2 (If you need server-side features)

#### Create Dockerfile for React Vite

Create `Dockerfile` in your frontend directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Create nginx.conf for frontend

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Update docker-compose.yml to include frontend

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: nestjs-backend
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=${DATABASE_HOST}
      - DATABASE_PORT=${DATABASE_PORT}
      - DATABASE_USER=${DATABASE_USER}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_NAME=${DATABASE_NAME}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - app-network

  frontend:
    build: ./frontend
    container_name: react-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## 6. Secrets Management

Use Parameter Store (cheapest) or Secrets Manager.

Store values like `/myapp/DB_URL`, `/myapp/JWT_SECRET`.

EC2 IAM Role must allow `ssm:GetParameter`.

### Example Node.js fetch:

```typescript
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: process.env.AWS_REGION });

async function getSecret(name: string) {
  const res = await ssm.send(new GetParameterCommand({ 
    Name: name, 
    WithDecryption: true 
  }));
  return res.Parameter?.Value;
}
```

### Load secrets into Docker

Create a script `load-secrets.sh`:

```bash
#!/bin/bash

export DATABASE_HOST=$(aws ssm get-parameter --name "/myapp/DB_HOST" --with-decryption --query "Parameter.Value" --output text)
export DATABASE_PASSWORD=$(aws ssm get-parameter --name "/myapp/DB_PASSWORD" --with-decryption --query "Parameter.Value" --output text)
export JWT_SECRET=$(aws ssm get-parameter --name "/myapp/JWT_SECRET" --with-decryption --query "Parameter.Value" --output text)

# Run docker-compose with loaded secrets
docker-compose up -d
```

---

## 7. CI/CD with GitHub Actions

### Frontend Deploy to S3 (`.github/workflows/frontend.yml`)

```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci && npm run build
        working-directory: frontend
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE }}
          aws-region: us-east-1
      - run: aws s3 sync frontend/dist s3://myapp-frontend-bucket --delete
      - run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

### Backend Docker Deploy (`.github/workflows/backend.yml`)

```yaml
name: Deploy Backend with Docker

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.EC2_SSH_KEY }}
      
      - name: Deploy to EC2
        run: |
          ssh -o StrictHostKeyChecking=no ubuntu@${{ secrets.EC2_HOST }} << 'EOF'
          cd /var/www/myapp
          git pull origin main
          
          # Load secrets from Parameter Store
          ./load-secrets.sh
          
          # Rebuild and restart containers
          docker-compose down
          docker-compose build --no-cache
          docker-compose up -d
          
          # Clean up old images
          docker system prune -af
          EOF
```

### Alternative: Push to ECR then Deploy

```yaml
name: Deploy to ECR and EC2

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE }}
          aws-region: us-east-1
      
      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build and push to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: myapp-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ steps.login-ecr.outputs.registry }}
            docker pull ${{ steps.login-ecr.outputs.registry }}/myapp-backend:latest
            docker stop backend || true
            docker rm backend || true
            docker run -d -p 3000:3000 --name backend --restart always ${{ steps.login-ecr.outputs.registry }}/myapp-backend:latest
```

---

## 8. Docker Management Commands

### Useful Docker Commands

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View logs
docker logs backend
docker logs -f backend  # Follow logs

# Restart container
docker restart backend

# Stop and remove
docker stop backend
docker rm backend

# Clean up
docker system prune -a  # Remove all unused images
docker volume prune     # Remove unused volumes

# Execute command in container
docker exec -it backend sh

# View resource usage
docker stats
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Scale services
docker-compose up -d --scale backend=3
```

---

## 9. Monitoring & Cost

- **CloudWatch Logs Agent** on EC2 for logs
- **AWS Budgets** for cost alerts
- **Docker stats** for container monitoring
- **Total Cost**: EC2 + RDS ~ $25–35/month

### Send Docker logs to CloudWatch

Install CloudWatch agent and configure:

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/*/*.log",
            "log_group_name": "/aws/ec2/docker",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
```

---

## 10. Deployment Checklist

### Prerequisites
- [ ] AWS Account setup
- [ ] Domain name registered
- [ ] GitHub repository ready
- [ ] Local AWS CLI configured
- [ ] Docker installed locally for testing

### Infrastructure Setup
- [ ] Create EC2 instance with proper IAM role
- [ ] Install Docker and Docker Compose on EC2
- [ ] Set up RDS database
- [ ] Create S3 bucket for frontend (if using S3)
- [ ] Configure CloudFront distribution (if using S3)
- [ ] Set up Parameter Store secrets
- [ ] Create ECR repository (if using ECR)

### Application Deployment
- [ ] Create Dockerfile for backend
- [ ] Create Dockerfile for frontend (if self-hosting)
- [ ] Create docker-compose.yml
- [ ] Test Docker build locally
- [ ] Deploy backend container to EC2
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Build and deploy frontend
- [ ] Test all endpoints

### CI/CD Setup
- [ ] Configure GitHub Actions secrets
- [ ] Test frontend deployment pipeline
- [ ] Test backend deployment pipeline
- [ ] Set up monitoring and alerts

---

## 11. Troubleshooting

### Common Docker Issues

**Container won't start:**
```bash
docker logs backend
docker inspect backend
```

**Port already in use:**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Out of disk space:**
```bash
docker system df
docker system prune -a
```

**Container can't connect to RDS:**
- Check security group rules
- Verify environment variables: `docker exec backend env`
- Test connection from container: `docker exec -it backend sh`

### Common Issues

**Backend not accessible:**
- Check EC2 security group rules
- Verify Nginx configuration
- Check Docker container status: `docker ps`
- View container logs: `docker logs backend`

**Frontend not loading:**
- Verify S3 bucket policy (if using S3)
- Check CloudFront distribution status
- Ensure build files are uploaded correctly
- Check Nginx logs in frontend container (if using Docker)

**Database connection issues:**
- Check RDS security group
- Verify database credentials in Parameter Store
- Test connectivity from EC2 to RDS
- Check environment variables in Docker container

**SSL certificate issues:**
- Ensure domain DNS points to CloudFront/EC2
- Check certificate validation in ACM
- Verify Let's Encrypt renewal

---

## 12. Security Best Practices

- Use IAM roles instead of access keys where possible
- Enable MFA for AWS root account
- Regularly rotate database passwords
- Keep EC2 instances and Docker images updated
- Use VPC with private subnets for RDS
- Enable CloudTrail for audit logging
- Set up AWS Config for compliance monitoring
- Scan Docker images for vulnerabilities
- Use multi-stage builds to reduce image size
- Never store secrets in Docker images
- Use read-only file systems where possible
- Limit container resources (CPU, memory)
- Run containers as non-root user

### Dockerfile Security Example

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist
USER nodejs
EXPOSE 3000
CMD ["node", "dist/main.js"]
```