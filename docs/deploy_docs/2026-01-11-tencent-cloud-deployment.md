# Agent Studio 腾讯云部署报告

**部署日期**: 2026-01-11  
**部署人员**: wudizhe001  
**服务器**: 腾讯云 CVM (Ubuntu 24.04 LTS)

---

## 1. 部署概览

| 项目 | 配置 |
|------|------|
| 公网 IP | 101.33.32.196 |
| 域名 | https://agent.wudizhe.com |
| HTTPS | Let's Encrypt（自动续期，到期 2026-04-10） |

---

## 2. 服务架构

```
                    ┌─────────────────┐
                    │   Nginx (80/443)│
                    │  反向代理 + SSL  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  Next.js   │  │  Go 后端   │  │ PostgreSQL │
     │   :3115    │  │   :8081    │  │   :5432    │
     │  (前端)    │  │(learning)  │  │  (Docker)  │
     └────────────┘  └────────────┘  └────────────┘
```

---

## 3. 部署组件

### 3.1 基础设施
- **Docker**: 29.1.4
- **Node.js**: 20.19.6
- **Go**: 1.22.2
- **Nginx**: 1.24.0
- **PostgreSQL**: 16-alpine (Docker)

### 3.2 服务端口（仅内部）
| 服务 | 端口 | 说明 |
|------|------|------|
| Nginx | 80, 443 | 对外入口 |
| Next.js | 3115 | 前端（内部） |
| Go API | 8081 | 后端（内部） |
| PostgreSQL | 5432 | 数据库（内部） |

---

## 4. 目录结构

```
~/apps/AGENT-Studio/
├── deploy/
│   ├── start-prod.sh    # 生产环境启动脚本
│   └── stop-prod.sh     # 停止服务脚本
├── logs/
│   ├── nextjs.log       # 前端日志
│   └── learning-go.log  # Go 后端日志
├── backend/
│   ├── infra/postgres/  # 数据库 Docker Compose
│   └── learning-go/     # Go 后端源码
└── .next/               # Next.js 构建产物
```

---

## 5. 运维命令

### 启动所有服务
```bash
ssh agent-studio-tencent
cd ~/apps/AGENT-Studio
./deploy/start-prod.sh
```

### 停止服务
```bash
./deploy/stop-prod.sh
```

### 更新代码并重启
```bash
cd ~/apps/AGENT-Studio
git pull
npm run build
./deploy/start-prod.sh
```

### 查看日志
```bash
# 前端日志
tail -f ~/apps/AGENT-Studio/logs/nextjs.log

# Go 后端日志
tail -f ~/apps/AGENT-Studio/logs/learning-go.log

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 数据库操作
```bash
# 进入 PostgreSQL
docker exec -it agent-studio-postgres psql -U agent_studio -d agent_studio

# 查看数据库状态
docker ps | grep postgres
```

---

## 6. Nginx 配置

配置文件位置: `/etc/nginx/sites-available/agent-studio`

```nginx
server {
    server_name agent.wudizhe.com;

    location / {
        proxy_pass http://127.0.0.1:3115;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /learning/ {
        proxy_pass http://127.0.0.1:8081/learning/;
        # ... headers
    }

    # SSL 由 Certbot 自动管理
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/agent.wudizhe.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agent.wudizhe.com/privkey.pem;
}
```

---

## 7. SSL 证书

- **签发机构**: Let's Encrypt
- **到期时间**: 2026-04-10
- **自动续期**: 已配置（Certbot timer）

手动续期命令:
```bash
sudo certbot renew --dry-run  # 测试
sudo certbot renew            # 实际续期
```

---

## 8. 本地 SSH 配置

`~/.ssh/config`:
```
Host agent-studio-tencent
    HostName 101.33.32.196
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 30
```

连接命令:
```bash
ssh agent-studio-tencent
```

---

## 9. 待优化项

- [ ] 配置 systemd 服务（开机自启、崩溃自动重启）
- [ ] 配置日志轮转（logrotate）
- [ ] 添加监控告警
- [ ] 配置防火墙规则
- [ ] SSH 安全加固（禁用密码登录、更换端口）

---

## 10. 故障排查

### 服务无法访问
1. 检查服务状态: `./deploy/start-prod.sh`
2. 检查 Nginx: `sudo systemctl status nginx`
3. 检查端口: `sudo lsof -i :80 -i :443 -i :3115 -i :8081`

### 数据库连接失败
1. 检查 Docker: `docker ps | grep postgres`
2. 重启数据库: `cd backend/infra/postgres && docker compose restart`

### HTTPS 证书问题
1. 检查证书: `sudo certbot certificates`
2. 强制续期: `sudo certbot renew --force-renewal`
