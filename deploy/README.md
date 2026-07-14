# Blog Deployment

This deployment runs the whole project on one Linux server:

- Web: `http://SERVER_IP/`
- Admin: `http://SERVER_IP/admin/`
- API: proxied behind `http://SERVER_IP/api/`
- Uploads: proxied behind `http://SERVER_IP/uploads/`

## Recommended Server

Use a small Ubuntu server first:

- Ubuntu 22.04 LTS or 24.04 LTS
- 2 CPU cores
- 2 GB RAM or more
- 40 GB disk or more
- Open security-group/firewall ports: `22`, `80`

No domain is required for the first deployment. Use the public server IP.

For a first deployment, choose any mainstream cloud vendor that provides an Ubuntu cloud server. The important part is not the vendor, but these settings:

- Image: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- Public IP: required
- Security group / firewall: allow inbound `22` and `80`
- Login method: password or SSH key

After the site is stable, you can buy a domain and point it to the same server IP.

## First Deploy

Install Docker and the Compose plugin on the server, then upload or clone this repository.

Official references:

- Docker Engine for Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Docker Compose plugin: https://docs.docker.com/compose/install/linux/

Common Ubuntu install commands:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo docker run hello-world
docker compose version
```

```bash
cd /opt/blog
docker compose up -d --build
docker compose ps
```

Open:

```text
http://SERVER_IP/
http://SERVER_IP/admin/
```

Default admin account:

```text
admin@example.com
admin123
```

## Data Persistence

The compose file keeps data in Docker volumes:

- `server_data`: users, posts, music JSON data
- `server_uploads`: uploaded music files

Do not delete these volumes unless you intentionally want to clear production data.

## Update Deployment

After pushing new code to GitHub, SSH into the server:

```bash
cd /opt/blog
git pull
docker compose up -d --build
docker compose ps
```

## Logs

```bash
docker compose logs -f server
docker compose logs -f web
```

## Backup Data

```bash
docker compose exec server tar -czf /tmp/blog-data-backup.tgz data uploads
docker cp $(docker compose ps -q server):/tmp/blog-data-backup.tgz ./blog-data-backup.tgz
```
