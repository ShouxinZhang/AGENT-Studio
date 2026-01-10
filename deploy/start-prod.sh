#!/bin/bash
# ===================================
# Agent Studio 生产环境启动脚本
# 用于腾讯云服务器部署
# ===================================

set -e

PROJECT_DIR="$HOME/apps/AGENT-Studio"
cd "$PROJECT_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Agent Studio 生产环境启动${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. 确保 Postgres 在运行
echo -e "\n${YELLOW}📦 检查 PostgreSQL...${NC}"
if ! docker ps | grep -q agent-studio-postgres; then
    echo -e "${YELLOW}   启动 PostgreSQL...${NC}"
    cd "$PROJECT_DIR/backend/infra/postgres"
    docker compose up -d
    sleep 5
fi
echo -e "${GREEN}   ✅ PostgreSQL 运行中${NC}"

# 2. 停止旧进程
echo -e "\n${YELLOW}🔄 停止旧进程...${NC}"
pkill -f 'learning-server' 2>/dev/null || true
pkill -f 'next-server' 2>/dev/null || true
pkill -f 'node.*next' 2>/dev/null || true
pkill -f 'python.*main.py' 2>/dev/null || true
pkill -f 'uvicorn' 2>/dev/null || true
sleep 2

# 3. 启动 Go 后端
echo -e "\n${YELLOW}🚀 启动 Go 后端 (learning-go)...${NC}"
cd "$PROJECT_DIR/backend/learning-go"

# 确保二进制已编译
if [ ! -f "./bin/learning-server" ]; then
    echo -e "${YELLOW}   编译中...${NC}"
    go build -o bin/learning-server ./cmd/server
fi

# 启动
export DATABASE_URL="postgresql://agent_studio:agent_studio@localhost:5432/agent_studio?sslmode=disable"
nohup ./bin/learning-server > "$PROJECT_DIR/logs/learning-go.log" 2>&1 &
GO_PID=$!
echo -e "${GREEN}   ✅ Go 后端启动 (PID: $GO_PID)${NC}"

# 4. 启动 Python 后端 (game-py)
echo -e "\n${YELLOW}🚀 启动 Python 后端 (game-py)...${NC}"
cd "$PROJECT_DIR/backend/game-py"

# 确保虚拟环境存在
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}   创建虚拟环境...${NC}"
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

nohup .venv/bin/python main.py > "$PROJECT_DIR/logs/game-py.log" 2>&1 &
PY_PID=$!
echo -e "${GREEN}   ✅ Python 后端启动 (PID: $PY_PID)${NC}"

# 5. 启动 Next.js 前端（生产模式）
echo -e "\n${YELLOW}🚀 启动 Next.js 前端...${NC}"
cd "$PROJECT_DIR"

# 确保已构建
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}   构建中...${NC}"
    npm run build
fi

mkdir -p logs
nohup npm run start -- -p 3115 > "$PROJECT_DIR/logs/nextjs.log" 2>&1 &
NEXT_PID=$!
echo -e "${GREEN}   ✅ Next.js 启动 (PID: $NEXT_PID)${NC}"

sleep 3

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}   ✅ 所有服务已启动！${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   前端: http://localhost:3115${NC}"
echo -e "${GREEN}   Go API: http://localhost:8081${NC}"
echo -e "${GREEN}   Python API: http://localhost:8000${NC}"
echo -e "${GREEN}   PostgreSQL: localhost:5432${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}   日志:${NC}"
echo -e "${YELLOW}     - logs/nextjs.log${NC}"
echo -e "${YELLOW}     - logs/learning-go.log${NC}"
echo -e "${YELLOW}     - logs/game-py.log${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查服务是否正常
echo -e "\n${YELLOW}🔍 检查服务状态...${NC}"
sleep 2
curl -s http://localhost:8081/healthz > /dev/null && echo -e "${GREEN}   ✅ Go 后端正常${NC}" || echo -e "${RED}   ❌ Go 后端异常${NC}"
curl -s http://localhost:8000/health > /dev/null && echo -e "${GREEN}   ✅ Python 后端正常${NC}" || echo -e "${RED}   ❌ Python 后端异常${NC}"
curl -s http://localhost:3115 > /dev/null && echo -e "${GREEN}   ✅ Next.js 正常${NC}" || echo -e "${RED}   ❌ Next.js 异常${NC}"
