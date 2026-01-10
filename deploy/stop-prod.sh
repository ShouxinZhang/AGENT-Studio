#!/bin/bash
# 停止所有 Agent Studio 服务

echo "🛑 停止服务..."
pkill -f 'learning-server' 2>/dev/null || true
pkill -f 'next-server' 2>/dev/null || true
pkill -f 'node.*next' 2>/dev/null || true

echo "✅ 服务已停止"

# 可选：停止数据库
# docker stop agent-studio-postgres
