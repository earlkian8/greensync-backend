# DigitalOcean Deployment Guide for GreenSync Backend

This guide will walk you through deploying your Laravel 12 application to DigitalOcean step by step.

## Prerequisites

- A DigitalOcean account
- Your domain name (optional but recommended)
- Access to your Git repository (GitHub, GitLab, etc.)
- SSH key pair for server access

---

## Step 1: Create a DigitalOcean Droplet

1. **Log in to DigitalOcean**
   - Go to https://cloud.digitalocean.com
   - Click "Create" → "Droplets"

2. **Choose Configuration:**
   - **Image**: Ubuntu 24.04 LTS (or latest LTS)
   - **Plan**: 
     - **Minimum**: Basic Plan, $12/month (1GB RAM, 1 vCPU)
     - **Recommended**: $18/month (2GB RAM, 1 vCPU) for better performance
   - **Region**: Choose closest to your users
   - **Authentication**: Select your SSH key or use password
   - **Hostname**: `greensync-server` (or your preference)

3. **Click "Create Droplet"** and wait for provisioning (about 1-2 minutes)

---

## Step 2: Initial Server Setup

### 2.1 Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

Replace `YOUR_DROPLET_IP` with your actual droplet IP address.

### 2.2 Update System Packages

```bash
apt update && apt upgrade -y
```

### 2.3 Create a Non-Root User (Recommended)

```bash
adduser greensync
usermod -aG sudo greensync
su - greensync
```

---

## Step 3: Install Required Software

### 3.1 Install PHP 8.2 and Extensions

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2-fpm php8.2-cli php8.2-common php8.2-mysql php8.2-xml php8.2-curl php8.2-mbstring php8.2-zip php8.2-gd php8.2-bcmath php8.2-sqlite3 php8.2-redis
```

### 3.2 Install Composer

```bash
cd ~
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

### 3.3 Install Node.js 20.x (for building frontend assets)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3.4 Install MySQL (Database)

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

During the secure installation:
- Set root password (remember this!)
- Remove anonymous users: Yes
- Disallow root login remotely: Yes
- Remove test database: Yes
- Reload privilege tables: Yes

### 3.5 Install Nginx (Web Server)

```bash
sudo apt install -y nginx
```

### 3.6 Install Redis (Optional but recommended for caching/queues)

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 3.7 Install Git

```bash
sudo apt install -y git
```

---

## Step 4: Configure MySQL Database

### 4.1 Create Database and User

```bash
sudo mysql -u root -p
```

Then run these SQL commands (replace `your_password` with a strong password):

```sql
CREATE DATABASE greensync_db;
CREATE USER 'greensync_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON greensync_db.* TO 'greensync_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 5: Clone and Setup Your Application

### 5.1 Clone Your Repository

```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git greensync-backend
# OR if using private repo with SSH:
# sudo git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git greensync-backend

sudo chown -R greensync:www-data /var/www/greensync-backend
cd /var/www/greensync-backend
```

### 5.2 Install PHP Dependencies

```bash
composer install --optimize-autoloader --no-dev
```

### 5.3 Install Node Dependencies and Build Assets

```bash
npm install
npm run build
```

### 5.4 Copy Environment File

```bash
cp .env.example .env
php artisan key:generate
```

### 5.5 Configure Environment Variables

```bash
nano .env
```

Update these key values:

```env
APP_NAME="GreenSync"
APP_ENV=production
APP_KEY=(already generated)
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=greensync_db
DB_USERNAME=greensync_user
DB_PASSWORD=your_strong_password_here

QUEUE_CONNECTION=database

CACHE_DRIVER=redis
SESSION_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### 5.6 Run Database Migrations

```bash
php artisan migrate --force
```

### 5.7 Set Storage Permissions

```bash
sudo chown -R www-data:www-data /var/www/greensync-backend/storage
sudo chown -R www-data:www-data /var/www/greensync-backend/bootstrap/cache
sudo chmod -R 775 /var/www/greensync-backend/storage
sudo chmod -R 775 /var/www/greensync-backend/bootstrap/cache

# Create symbolic link for storage
php artisan storage:link
```

### 5.8 Optimize Laravel

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Step 6: Configure Nginx

### 6.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/greensync
```

Paste this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/greensync-backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Increase max upload size (adjust as needed)
    client_max_body_size 10M;
}
```

Replace `yourdomain.com` with your actual domain. If you don't have a domain yet, use your droplet's IP address.

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### 6.2 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/greensync /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 7: Setup Queue Worker (Supervisor)

Since your app uses database queues, you need a worker to process them.

### 7.1 Install Supervisor

```bash
sudo apt install -y supervisor
```

### 7.2 Create Supervisor Configuration

```bash
sudo nano /etc/supervisor/conf.d/greensync-worker.conf
```

Paste this:

```ini
[program:greensync-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/greensync-backend/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/greensync-backend/storage/logs/worker.log
stopwaitsecs=3600
```

### 7.3 Start Supervisor

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start greensync-worker:*
```

Check status:
```bash
sudo supervisorctl status
```

---

## Step 8: Setup SSL with Let's Encrypt (Recommended)

### 8.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 8.3 Auto-renewal Test

```bash
sudo certbot renew --dry-run
```

SSL certificates auto-renew via cron.

---

## Step 9: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Step 10: Final Checks

### 10.1 Test Your Application

1. Open your browser and visit `http://YOUR_DROPLET_IP` or `https://yourdomain.com`
2. You should see your Laravel application

### 10.2 Monitor Logs

```bash
# Application logs
tail -f /var/www/greensync-backend/storage/logs/laravel.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Queue worker logs
sudo tail -f /var/www/greensync-backend/storage/logs/worker.log
```

---

## Step 11: Setup Automated Deployments (Optional)

### 11.1 Create Deployment Script

```bash
cd /var/www/greensync-backend
nano deploy.sh
```

Paste:

```bash
#!/bin/bash

cd /var/www/greensync-backend

# Pull latest code
git pull origin main

# Install dependencies
composer install --optimize-autoloader --no-dev
npm install
npm run build

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queue workers
sudo supervisorctl restart greensync-worker:*

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

### 11.2 Setup GitHub Actions (Optional)

Create `.github/workflows/deploy.yml` in your repo:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: greensync
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/greensync-backend
            ./deploy.sh
```

Add secrets in GitHub: `DROPLET_IP` and `SSH_PRIVATE_KEY`.

---

## Maintenance Commands

### Clear Cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Run Migrations
```bash
php artisan migrate --force
```

### Restart Queue Workers
```bash
sudo supervisorctl restart greensync-worker:*
```

### Check Application Status
```bash
php artisan about
```

### Monitor Server Resources
```bash
htop
df -h
free -h
```

---

## Troubleshooting

### Application not loading?
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Verify permissions: `ls -la storage bootstrap/cache`

### 502 Bad Gateway?
- Check PHP-FPM status: `sudo systemctl status php8.2-fpm`
- Restart PHP-FPM: `sudo systemctl restart php8.2-fpm`

### Queue jobs not processing?
- Check supervisor status: `sudo supervisorctl status`
- Check worker logs: `tail -f storage/logs/worker.log`

### Database connection errors?
- Verify MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u greensync_user -p greensync_db`

---

## Security Best Practices

1. ✅ Keep system updated: `sudo apt update && sudo apt upgrade`
2. ✅ Use strong passwords for database
3. ✅ Set `APP_DEBUG=false` in production
4. ✅ Enable firewall (`ufw`)
5. ✅ Use SSH keys instead of passwords
6. ✅ Regular backups of database
7. ✅ Monitor logs regularly
8. ✅ Keep Composer and NPM dependencies updated

---

## Backup Strategy

### Database Backup

Create a backup script:

```bash
nano /home/greensync/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/greensync/backups"
mkdir -p $BACKUP_DIR
mysqldump -u greensync_user -p'your_password' greensync_db > $BACKUP_DIR/greensync_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "greensync_*.sql" -mtime +7 -delete
```

Make executable and add to crontab (daily at 2 AM):
```bash
chmod +x /home/greensync/backup-db.sh
crontab -e
# Add: 0 2 * * * /home/greensync/backup-db.sh
```

---

## Cost Optimization Tips

1. Start with a smaller droplet ($12/month) and scale up if needed
2. Use DigitalOcean Spaces for file storage (cheaper than increasing droplet size)
3. Enable automatic snapshots
4. Monitor usage with DigitalOcean's billing alerts

---

## Next Steps

- [ ] Setup domain DNS to point to your droplet IP
- [ ] Configure email service (Mailgun, SendGrid, etc.)
- [ ] Setup monitoring (DigitalOcean Monitoring, New Relic, etc.)
- [ ] Configure automated backups
- [ ] Setup CI/CD pipeline
- [ ] Add CDN for static assets (Cloudflare, etc.)

---

## Support Resources

- [DigitalOcean Community](https://www.digitalocean.com/community)
- [Laravel Documentation](https://laravel.com/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Deployment completed! 🚀**

Your application should now be live on DigitalOcean!


