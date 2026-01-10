#!/bin/bash

# ===================================
# Agent Studio 全栈重启脚本
# 自动重启 Python 后端 (8000) 和 Next.js 前端 (3115)
# ===================================

# 配置
FRONTEND_PORT=3115
BACKEND_PORT=8000
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend/game-py"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Agent Studio 全栈重启脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 切换到项目目录
cd "$PROJECT_DIR" || exit 1
echo -e "${GREEN}📁 工作目录: $PROJECT_DIR${NC}"

# ==========================================
# 函数: 停止指定端口的进程
# ==========================================
kill_port() {
    local port=$1
    local name=$2
    echo -e "\n${YELLOW}🔄 检查并停止 $name (端口 $port)...${NC}"
    
    local pids=""
    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -tiTCP:$port -sTCP:LISTEN 2>/dev/null | tr '\n' ' ')
    fi

    if [ -z "$pids" ] && command -v ss >/dev/null 2>&1; then
        pids=$(ss -ltnp "sport = :$port" 2>/dev/null | awk -F'pid=' 'NR>1 && NF>1 {print $2}' | awk -F',' '{print $1}' | tr '\n' ' ')
    fi

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}   发现进程 PID: $pids，正在终止...${NC}"
        kill -9 $pids 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}   ✅ $name 已停止${NC}"
    else
        echo -e "${GREEN}   ✅ 端口 $port 未被占用${NC}"
    fi
}

# 1. 停止旧进程
kill_port $BACKEND_PORT "Python Backend"
kill_port $FRONTEND_PORT "Next.js Frontend"

# 2. 启动 Python 后端
echo -e "\n${YELLOW}🚀 启动 Python 后端...${NC}"
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR" || exit 1
    
    # 检查虚拟环境
    if [ -d ".venv" ]; then
        source .venv/bin/activate
        echo -e "${GREEN}   ✅ 已激活虚拟环境${NC}"
    else
        echo -e "${YELLOW}   ⚠️  未找到 venv，尝试使用系统 Python${NC}"
    fi

    # 后台启动
    nohup python main.py > backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}   ✅ 后端已在后台启动 (PID: $BACKEND_PID)${NC}"
    echo -e "${GREEN}   📝 日志: backend/backend.log${NC}"
    
    # 切回根目录
    cd "$PROJECT_DIR" || exit 1
else
    echo -e "${RED}   ❌ 未找到 backend 目录!${NC}"
fi

# 3. 检查前端依赖
echo -e "\n${YELLOW}🔄 检查前端依赖...${NC}"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}   ⚠️  依赖需更新，运行 npm install...${NC}"
    npm install
fi

# 4. 启动前端
echo -e "\n${YELLOW}🚀 启动 Next.js 前端...${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   前端: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${GREEN}   后端: http://localhost:$BACKEND_PORT${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 捕获 Ctrl+C 以同时关闭后端
trap "kill $BACKEND_PID 2>/dev/null; echo -e '\n${RED}🛑 已停止所有服务${NC}'; exit" INT

npm run dev -- -p $FRONTEND_PORT
