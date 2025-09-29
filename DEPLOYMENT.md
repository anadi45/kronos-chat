# 🚀 Deployment Plan: NestJS Backend + React Vite Frontend on AWS (EC2 + RDS + S3 + CloudFront)

This document describes how to deploy a **NestJS backend** and **React Vite frontend** on AWS using the **cheapest and reliable setup**:

- **Frontend** → S3 + CloudFront
- **Backend** → EC2 (NestJS + PM2 + Nginx)
- **Database** → RDS (Postgres/MySQL)
- **Secrets** → AWS Systems Manager Parameter Store (or Secrets Manager)
- **CI/CD** → GitHub Actions

---

## 1. AWS Resources to Create

- EC2 instance (t3.micro, ~ $9/mo)
- RDS instance (db.t3.micro, ~ $15–20/mo)
- S3 bucket for frontend hosting
- CloudFront distribution (HTTPS + CDN)
- Parameter Store (or Secrets Manager) for environment variables
- IAM Role for EC2 (to read secrets)

---

## 2. Backend (NestJS on EC2)

### Launch EC2

- Use Amazon Linux 2023 or Ubuntu 22.04 LTS
- Assign IAM Role with access to Parameter Store/Secrets Manager
- Security Group:
  - Port 22 (SSH) → your IP only
  - Port 80 (HTTP), 443 (HTTPS) → public

### Install Dependencies

```bash
sudo apt update -y
sudo apt install -y nginx nodejs npm git
sudo npm install -g pm2
```

### Deploy NestJS App

```bash
cd /var/www/myapp
git clone <repo-url> .
npm install
npm run build
pm2 start dist/main.js --name myapp
pm2 startup
pm2 save
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

## 3. Database (RDS)

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

## 4. Frontend (React + Vite)

### Build Project

```bash
cd frontend
npm ci
npm run build
```

### Upload to S3

```bash
aws s3 sync dist/ s3://myapp-frontend-bucket --delete
```

### CloudFront Configuration

- Origin = S3 bucket
- Enable OAI/OAC for secure access
- Add custom domain with ACM certificate (us-east-1)

---

## 5. Secrets Management

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

---

## 6. CI/CD with GitHub Actions

### Frontend Deploy (`.github/workflows/frontend.yml`)

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

### Backend Deploy (`.github/workflows/backend.yml`)

```yaml
name: Deploy Backend

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
          npm ci
          npm run build
          pm2 restart myapp
          EOF
```

---

## 7. Monitoring & Cost

- **CloudWatch Logs Agent** on EC2 for logs
- **AWS Budgets** for cost alerts
- **Total Cost**: EC2 + RDS ~ $25–35/month

---

## 8. Deployment Checklist

### Prerequisites
- [ ] AWS Account setup
- [ ] Domain name registered
- [ ] GitHub repository ready
- [ ] Local AWS CLI configured

### Infrastructure Setup
- [ ] Create EC2 instance with proper IAM role
- [ ] Set up RDS database
- [ ] Create S3 bucket for frontend
- [ ] Configure CloudFront distribution
- [ ] Set up Parameter Store secrets

### Application Deployment
- [ ] Deploy backend to EC2
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Build and deploy frontend to S3
- [ ] Test all endpoints

### CI/CD Setup
- [ ] Configure GitHub Actions secrets
- [ ] Test frontend deployment pipeline
- [ ] Test backend deployment pipeline
- [ ] Set up monitoring and alerts

---

## 9. Troubleshooting

### Common Issues

**Backend not accessible:**
- Check EC2 security group rules
- Verify Nginx configuration
- Check PM2 process status: `pm2 status`

**Frontend not loading:**
- Verify S3 bucket policy
- Check CloudFront distribution status
- Ensure build files are uploaded correctly

**Database connection issues:**
- Check RDS security group
- Verify database credentials in Parameter Store
- Test connectivity from EC2 to RDS

**SSL certificate issues:**
- Ensure domain DNS points to CloudFront/EC2
- Check certificate validation in ACM
- Verify Let's Encrypt renewal

---

## 10. Security Best Practices

- Use IAM roles instead of access keys where possible
- Enable MFA for AWS root account
- Regularly rotate database passwords
- Keep EC2 instances updated
- Use VPC with private subnets for RDS
- Enable CloudTrail for audit logging
- Set up AWS Config for compliance monitoring