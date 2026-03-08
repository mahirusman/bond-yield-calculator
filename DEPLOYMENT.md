# Deployment Guide

This document explains how the Bond Yield Calculator was deployed to an AWS EC2 instance without a domain name.

## Live URLs

- Frontend: `https://16.25.121.8`
- Backend: `https://16.25.121.8/api/v1`
- Health check: `https://16.25.121.8/health`

## Deployment Architecture

- Server: AWS EC2 Ubuntu
- Process manager: `pm2`
- Web server: `nginx`
- Frontend hosting: static files served by `nginx`
- Backend hosting: Node.js Express app running on `127.0.0.1:3001`
- TLS/SSL: Let's Encrypt IP certificate issued with `acme.sh`
- Public IP used for browser access: `16.25.121.8`
- Private EC2 IP: `172.31.2.226`

## Why This Setup Was Used

- The frontend is served on port `443` by `nginx`.
- The backend is not exposed directly on public port `3001`.
- `nginx` proxies `/api/v1` and `/health` to the backend on `127.0.0.1:3001`.
- This avoids public port issues and gives the frontend and backend the same public origin.

## Server Access

SSH command used:

```bash
ssh -i "<pem file path>.pem" ubuntu@<ip address>.me-south-1.compute.amazonaws.com
```

## Prerequisites On The Server

Install required packages:

```bash
sudo apt-get update
sudo apt-get install -y curl nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

## Application Setup

Clone the repository:

```bash
git clone https://github.com/mahirusman/bond-yield-calculator.git
cd bond-yield-calculator
```

Install dependencies:

```bash
npm ci
```

Create backend environment file:

```bash
cat > packages/backend/.env <<EOF
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://16.25.121.8
EOF
```

Build the applications:

```bash
npm run build --workspace=packages/shared
npm run build --workspace=packages/backend
VITE_API_URL="https://16.25.121.8/api/v1" npm run build --workspace=packages/frontend
```

## Backend Process With PM2

Start the backend:

```bash
pm2 start npm --name bond-backend --cwd "$HOME/bond-yield-calculator/packages/backend" -- start
pm2 save
sudo env PATH=$PATH pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs bond-backend --lines 100
pm2 restart bond-backend --update-env
pm2 save
```

## Frontend Hosting With Nginx

Copy the frontend build output:

```bash
sudo mkdir -p /var/www/bond-yield-calculator/frontend
sudo rm -rf /var/www/bond-yield-calculator/frontend/*
sudo cp -r "$HOME/bond-yield-calculator/packages/frontend/dist/." /var/www/bond-yield-calculator/frontend/
sudo chown -R ubuntu:ubuntu /var/www/bond-yield-calculator/frontend
```

## SSL Setup With Let's Encrypt IP Certificate

This deployment does not use a domain. It uses a public IP certificate for `16.25.121.8`.

Install `acme.sh`:

```bash
curl https://get.acme.sh | sh
```

Register the account and issue the certificate:

```bash
~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
~/.acme.sh/acme.sh --register-account --server letsencrypt --accountemail ""
~/.acme.sh/acme.sh --issue -d 16.25.121.8 -w /var/www/bond-yield-calculator/frontend --server letsencrypt --cert-profile shortlived --keylength ec-256
```

Install the certificate for `nginx`:

```bash
sudo mkdir -p /etc/nginx/ssl
sudo chown ubuntu:ubuntu /etc/nginx/ssl

~/.acme.sh/acme.sh --install-cert -d 16.25.121.8 --ecc \
  --key-file /etc/nginx/ssl/16.25.121.8.key \
  --fullchain-file /etc/nginx/ssl/16.25.121.8.fullchain.pem \
  --reloadcmd "sudo systemctl reload nginx"
```

Notes:

- The IP certificate is short-lived.
- Renewal is handled by `acme.sh`.
- The ACME webroot challenge requires write access to `/var/www/bond-yield-calculator/frontend`.

## Nginx Configuration

Create `/etc/nginx/sites-available/bond-yield-calculator`:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/bond-yield-calculator/frontend;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name _;

    ssl_certificate /etc/nginx/ssl/16.25.121.8.fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/16.25.121.8.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/bond-yield-calculator/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site and reload `nginx`:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn /etc/nginx/sites-available/bond-yield-calculator /etc/nginx/sites-enabled/bond-yield-calculator
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
```

## CORS Configuration

The backend must allow the HTTPS frontend origin.

Production backend environment value:

```env
FRONTEND_URL=https://16.25.121.8
```

If CORS fails after changing this file, restart with updated environment:

```bash
pm2 restart bond-backend --update-env
```

## Update Deployment

To deploy new code:

```bash
cd ~/bond-yield-calculator
git fetch origin main
git checkout main
git pull --ff-only origin main
npm ci
npm run build --workspace=packages/shared
npm run build --workspace=packages/backend
VITE_API_URL="https://16.25.121.8/api/v1" npm run build --workspace=packages/frontend
sudo rm -rf /var/www/bond-yield-calculator/frontend/*
sudo cp -r "$HOME/bond-yield-calculator/packages/frontend/dist/." /var/www/bond-yield-calculator/frontend/
pm2 restart bond-backend --update-env
sudo systemctl reload nginx
```

## Verification Commands

Check frontend:

```bash
curl -I https://16.25.121.8
```

Check backend health:

```bash
curl https://16.25.121.8/health
```

Check API:

```bash
curl -X POST https://16.25.121.8/api/v1/bonds/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "faceValue": 1000,
    "annualCouponRate": 6,
    "marketPrice": 950,
    "yearsToMaturity": 5,
    "couponFrequency": "semi-annual"
  }'
```

## Troubleshooting

- If the browser shows a CORS error, confirm `FRONTEND_URL` is `https://16.25.121.8` and run `pm2 restart bond-backend --update-env`.
- If SSL issuance fails, confirm the ACME challenge path is writable:
  - `/var/www/bond-yield-calculator/frontend/.well-known/acme-challenge`
- If the frontend loads but API calls fail, confirm the frontend was built with:
  - `VITE_API_URL="https://16.25.121.8/api/v1"`
- If `nginx` changes do not apply, run `sudo nginx -t` and then `sudo systemctl reload nginx`.
