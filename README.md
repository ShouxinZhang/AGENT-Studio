Agent Studio 基于 Next.js + React + Tailwind + Vercel AI SDK + OpenRouter，实现可扩展的对话式工作台。

## Getting Started

1. 准备环境变量（复制 `.env.example` 为 `.env.local` 并填入 OpenRouter Key）。
2. 安装依赖并启动开发服务器：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## Features

- 三栏式 Agent Studio 界面：对话列表 / 对话工作区 / 模型设置。
- 对话系统与设置系统拆分，支持本地持久化。
- AI SDK + OpenRouter 流式对话接口。

## Architecture

详细模块化设计与数据流见 `docs/architecture.md`。

## Environment

关键环境变量：

```
OPENROUTER_API_KEY=...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_APP_NAME=Agent Studio
```
