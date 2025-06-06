# AI-Med System Deployment Guide
*Confidential - For Internal Use Only*

## Prerequisites

### Server Requirements
- Node.js 16.x or higher
- MongoDB 4.x or higher
- Redis 6.x or higher
- Nginx (for production)
- SSL Certificate
- Minimum 8GB RAM
- Minimum 50GB storage
- Linux-based OS (Ubuntu 20.04 LTS recommended)

### Domain and DNS
- Registered domain name
- DNS configuration access
- SSL certificate (Let's Encrypt recommended)

## Environment Setup

1. **Server Preparation**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
   sudo apt update
   sudo apt install -y mongodb-org
   
   # Install Redis
   sudo apt install -y redis-server
   
   # Install Nginx
   sudo apt install -y nginx
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   git clone https://github.com/your-org/ai-med-system.git
   cd ai-med-system
   
   # Install dependencies
   npm install
   
   # Create production environment file
   cp .env.example .env.production
   ```

3. **Environment Configuration**
   Edit `.env.production` with the following:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/aimed
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secure-jwt-secret
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-smtp-user
   SMTP_PASS=your-smtp-password
   ```

## Database Setup

1. **MongoDB Configuration**
   ```bash
   # Start MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # Create database user
   mongo
   use admin
   db.createUser({
     user: "aimed_admin",
     pwd: "secure_password",
     roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
   })
   ```

2. **Redis Configuration**
   ```bash
   # Configure Redis
   sudo nano /etc/redis/redis.conf
   # Set password and other security measures
   ```

## Nginx Configuration

1. **Create Nginx Configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/aimed
   ```

2. **Add the following configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
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

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/aimed /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## SSL Configuration

1. **Install Certbot:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain SSL Certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Application Deployment

1. **Build the Application:**
   ```bash
   npm run build
   ```

2. **Start the Application:**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start dist/server.js --name "aimed"
   pm2 save
   pm2 startup
   ```

## Monitoring Setup

1. **Install Monitoring Tools:**
   ```bash
   # Install monitoring tools
   npm install -g pm2-logrotate
   pm2 install pm2-logrotate
   ```

2. **Configure Log Rotation:**
   ```bash
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

## Backup Configuration

1. **Create Backup Script:**
   ```bash
   # Create backup directory
   mkdir -p /backup/aimed
   
   # Create backup script
   nano /usr/local/bin/backup-aimed.sh
   ```

2. **Add the following to the script:**
   ```bash
   #!/bin/bash
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backup/aimed"
   
   # Backup MongoDB
   mongodump --out $BACKUP_DIR/mongodb_$TIMESTAMP
   
   # Backup Redis
   redis-cli SAVE
   cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$TIMESTAMP.rdb
   
   # Compress backups
   tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz $BACKUP_DIR/mongodb_$TIMESTAMP $BACKUP_DIR/redis_$TIMESTAMP.rdb
   
   # Remove old backups (keep last 7 days)
   find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
   ```

3. **Make the script executable:**
   ```bash
   chmod +x /usr/local/bin/backup-aimed.sh
   ```

4. **Add to crontab:**
   ```bash
   crontab -e
   # Add the following line
   0 2 * * * /usr/local/bin/backup-aimed.sh
   ```

## Security Measures

1. **Configure Firewall:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

2. **Set up Fail2ban:**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

## Maintenance Procedures

1. **Regular Updates:**
   ```bash
   # Update application
   git pull
   npm install
   npm run build
   pm2 restart aimed
   
   # Update system
   sudo apt update && sudo apt upgrade -y
   ```

2. **Monitoring:**
   ```bash
   # Check application status
   pm2 status
   
   # Check logs
   pm2 logs aimed
   
   # Check system resources
   htop
   ```

## Troubleshooting

1. **Application Issues:**
   - Check PM2 logs: `pm2 logs aimed`
   - Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
   - Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`

2. **Database Issues:**
   - Check MongoDB status: `sudo systemctl status mongod`
   - Check Redis status: `sudo systemctl status redis`

3. **Network Issues:**
   - Check Nginx status: `sudo systemctl status nginx`
   - Check SSL certificate: `sudo certbot certificates`

## Emergency Procedures

1. **Application Crash:**
   ```bash
   pm2 restart aimed
   ```

2. **Database Issues:**
   ```bash
   # Restore from backup
   mongorestore /backup/aimed/mongodb_[TIMESTAMP]
   ```

3. **Server Issues:**
   ```bash
   # Reboot server
   sudo reboot
   ```

## Contact Information

For deployment support:
- Email: support@genovotechnologies.com
- Phone: +1 (555) 123-4567
- Emergency Contact: +1 (555) 987-6543

---

*This document is confidential and intended for internal use only. Do not share or distribute without explicit permission from Genovo Technologies.* 