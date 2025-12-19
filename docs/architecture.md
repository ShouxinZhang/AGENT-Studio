# Agent Studio Architecture

## Goals

- 保持前后端模块边界清晰，便于扩展新的 Agent 能力与工具链。
- 对话状态与设置状态分离管理，保证 UI 响应与持久化稳定。
- 后端 API 专注于模型编排与推理参数校验，前端专注体验与状态。

## Module Map

```
src/
  app/
    api/chat/route.ts        # AI SDK + OpenRouter 的流式对话入口
    layout.tsx               # 字体与全局样式
    page.tsx                 # 入口页面（渲染 StudioPage）
  components/
    studio-page.tsx          # 页面组合器，承载三栏布局
  features/
    chat/
      components/            # 对话区、输入框、对话列表等 UI
      store/                 # 对话与设置状态管理
      utils/                 # 标题/预览/Token 估算等逻辑
    settings/
      components/            # 右侧设置面板 UI
      model/                 # 模型选项与描述
  lib/
    ai/openrouter.ts         # OpenRouter Provider
    storage/                 # 本地持久化封装
    utils/                   # 通用工具
```

## Data Flow

1. `StudioProvider` 初始化时读取本地存储并注入状态。
2. `ConversationList` 切换对话，`ChatPanel` 绑定当前对话。
3. `ChatPanel` 调用 AI SDK 的 `useChat`，将 `settings` 作为请求体发送到 `/api/chat`。
4. `/api/chat` 组合系统提示词 + 对话消息，调用 OpenRouter 模型并流式返回。
5. 前端收到流式消息后更新对话状态，同时持久化到本地。

## Backend API

`POST /api/chat`

请求体：

```
{
  "messages": [{ "role": "user", "content": "..." }],
  "settings": {
    "model": "anthropic/claude-3.5-sonnet",
    "temperature": 0.7,
    "maxTokens": 2048,
    "topP": 0.9
  }
}
```

响应为 AI SDK 的流式数据流，供 `useChat` 消费。

## Extensibility

- 新工具调用：在 `api/chat/route.ts` 中接入工具，并在 `ChatSettings` 中增加开关。
- 多 Agent 编排：新增 `features/agents` 模块并在 `StudioState` 中维护当前 Agent。
- 远端存储：替换 `lib/storage`，接入数据库或 Supabase。
