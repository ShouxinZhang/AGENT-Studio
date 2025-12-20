#!/bin/bash

# ===================================
# Agent Studio 重启脚本
# 自动检测依赖并重启开发服务器
# ===================================

# 配置
PORT=3105
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Agent Studio 重启脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 切换到项目目录
cd "$PROJECT_DIR" || exit 1
echo -e "${GREEN}📁 工作目录: $PROJECT_DIR${NC}"

# 步骤1: 停止占用端口的进程
echo -e "\n${YELLOW}🔄 步骤1: 检查并停止端口 $PORT 上的进程...${NC}"
get_pids_on_port() {
    local pids=""

    if command -v lsof >/dev/null 2>&1; then
        pids=$(lsof -tiTCP:$PORT -sTCP:LISTEN 2>/dev/null | tr '\n' ' ')
    fi

    if [ -z "$pids" ] && command -v ss >/dev/null 2>&1; then
        pids=$(ss -ltnp "sport = :$PORT" 2>/dev/null | awk -F'pid=' 'NR>1 && NF>1 {print $2}' | awk -F',' '{print $1}' | tr '\n' ' ')
    fi

    echo "$pids"
}

PID=$(get_pids_on_port)
if [ -n "$PID" ]; then
    echo -e "${YELLOW}   发现进程 PID: $PID，正在终止...${NC}"
    kill -9 $PID 2>/dev/null || true

    for i in {1..10}; do
        if [ -z "$(get_pids_on_port)" ]; then
            break
        fi
        sleep 1
    done

    if [ -n "$(get_pids_on_port)" ]; then
        echo -e "${RED}   ❌ 端口 $PORT 仍被占用，请手动检查${NC}"
        if command -v ss >/dev/null 2>&1; then
            ss -ltnp "sport = :$PORT" 2>/dev/null || true
        fi
        if command -v lsof >/dev/null 2>&1; then
            lsof -nP -iTCP:$PORT -sTCP:LISTEN 2>/dev/null || true
        fi
        exit 1
    fi

    echo -e "${GREEN}   ✅ 进程已终止${NC}"
else
    echo -e "${GREEN}   ✅ 端口 $PORT 未被占用${NC}"
fi

# 步骤2: 检查 node_modules 是否存在
echo -e "\n${YELLOW}🔄 步骤2: 检查依赖安装状态...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   ⚠️  未检测到 node_modules，正在安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}   ❌ npm install 失败，请检查错误信息${NC}"
        exit 1
    fi
    echo -e "${GREEN}   ✅ 依赖安装完成${NC}"
else
    # 检查 package.json 是否比 node_modules 更新
    if [ "package.json" -nt "node_modules" ]; then
        echo -e "${YELLOW}   ⚠️  package.json 已更新，正在更新依赖...${NC}"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}   ❌ npm install 失败，请检查错误信息${NC}"
            exit 1
        fi
        echo -e "${GREEN}   ✅ 依赖更新完成${NC}"
    else
        echo -e "${GREEN}   ✅ 依赖已是最新状态${NC}"
    fi
fi

# 步骤3: 启动开发服务器
echo -e "\n${YELLOW}🚀 步骤3: 启动开发服务器 (端口: $PORT)...${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}   服务器启动中，访问地址: http://localhost:$PORT${NC}"
echo -e "${BLUE}========================================${NC}\n"

npm run dev -- -p $PORT
