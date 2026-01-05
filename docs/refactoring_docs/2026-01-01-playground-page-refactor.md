# Playground Game Page 重构日志

**日期**: 2026-01-01  
**作者**: GitHub Copilot  
**影响范围**: `src/app/playground/[gameId]/page.tsx` 及相关组件

---

## 1. 问题分析

### 原有架构问题

原始的 `page.tsx` 文件存在典型的 **"God Component"** 反模式，单文件承担了过多职责：

| 问题类型 | 具体表现 |
|---------|---------|
| **状态管理混乱** | 连接状态、游戏状态、UI 状态、设置状态全部混合在一个组件中 |
| **业务逻辑耦合** | API 通信、键盘处理、游戏循环、渲染逻辑全部内联 |
| **类型定义内嵌** | `RenderPayload`, `BackendState`, `StartResponse` 等类型定义在页面文件中 |
| **难以测试** | 逻辑与 UI 紧密耦合，无法单独测试业务逻辑 |
| **代码复用性差** | 其他页面无法复用游戏会话管理、键盘控制等逻辑 |

### 原始文件行数

```
src/app/playground/[gameId]/page.tsx: ~580 行
```

---

## 2. 重构方案

采用 **Feature-based Architecture**，将代码按功能模块拆分：

```
src/components/features/playground/
├── index.ts                    # 统一导出
├── types.ts                    # API 类型定义
├── hooks/
│   ├── useGameSession.ts       # 游戏会话管理
│   ├── useGameLoop.ts          # 游戏主循环
│   └── useGameKeyboard.ts      # 键盘控制
└── components/
    ├── GameCanvas.tsx          # 游戏画布渲染
    ├── GameHeader.tsx          # 顶部导航栏
    ├── GameStats.tsx           # 统计信息展示
    └── GameSidebar.tsx         # 侧边控制面板
```

---

## 3. 新增文件详解

### 3.1 类型定义 (`types.ts`)

将 API 交互相关的类型抽离：

```typescript
export type RenderPayload =
    | { mode: "frame"; frame?: string | null }
    | { mode: "scene"; scene: unknown };

export type BackendState = {
    observation?: unknown;
    reward?: number;
    done?: boolean;
    truncated?: boolean;
    info?: unknown;
    frame?: string | null;
    render?: RenderPayload;
};

export type StartResponse = {
    session_id: string;
    state: BackendState;
};

export type StepResponse = BackendState;
```

### 3.2 Hooks

#### `useGameSession.ts` - 游戏会话管理

**职责**:
- 后端健康检查 (每 5 秒轮询)
- 游戏启动 (`startGame`)
- 动作发送 (`sendAction`)
- 状态同步 (`applyBackendState`)

**返回值**:
```typescript
{
    isConnected: boolean;
    sessionId: string | null;
    frame: string | null;
    scene: GameScene | null;
    totalReward: number;
    steps: number;
    isPlaying: boolean;
    startGame: (config: Record<string, unknown>) => Promise<void>;
    sendAction: (action: number) => Promise<void>;
}
```

#### `useGameLoop.ts` - 游戏主循环

**职责**: 根据游戏速度设置，定时发送自动步进动作 (`action: -1`)

```typescript
export function useGameLoop(
    isPlaying: boolean,
    sessionId: string | null,
    gameId: string,
    speed: number,
    sendAction: (action: number) => void
)
```

#### `useGameKeyboard.ts` - 键盘控制

**职责**: 监听键盘事件，根据游戏类型分发到对应的控制处理器

```typescript
export function useGameKeyboard(
    isPlaying: boolean,
    gameId: string,
    sendAction: (action: number) => void
)
```

### 3.3 Components

#### `GameCanvas.tsx` - 游戏画布

**职责**:
- 计算画布尺寸 (响应式)
- 根据游戏类型调用对应渲染器
- 支持 Frame 模式 (base64 图片) 和 Scene 模式 (Canvas 绘制)

#### `GameHeader.tsx` - 顶部导航

**职责**: 展示游戏名称、emoji、返回按钮、连接状态指示灯

#### `GameStats.tsx` - 统计信息

**职责**: 展示分数、行数 (Tetris)、等级 (Tetris)、步数

#### `GameSidebar.tsx` - 侧边面板

**职责**:
- Tab 切换 (Controls / Settings)
- 游戏控制按钮
- 手动控制面板 (触摸设备)
- 游戏设置面板
- 显示缩放控制

---

## 4. 重构后的 Page 组件

```typescript
export default function GamePage() {
    const params = useParams();
    const gameId = decodeURIComponent(params.gameId as string);
    const gameConfig = getGameById(gameId);
    
    // 游戏会话逻辑 (Hook)
    const {
        isConnected, sessionId, frame, scene,
        steps, isPlaying, startGame, sendAction
    } = useGameSession(gameId);
    
    // UI 状态 (本地)
    const [showPanel, setShowPanel] = useState(true);
    const [snakeSettings, setSnakeSettings] = useState<SnakeSettings>(...);
    const [tetrisSettings, setTetrisSettings] = useState<TetrisSettings>(...);
    const [displayScale, setDisplayScale] = useState<number>(...);
    const [viewport, setViewport] = useState({ w: 1200, h: 800 });

    // 游戏循环 & 键盘控制 (Hooks)
    useGameLoop(isPlaying, sessionId, gameId, currentSpeed, sendAction);
    useGameKeyboard(isPlaying, gameId, sendAction);

    // 渲染
    return (
        <div className="h-screen w-full ...">
            <GameHeader ... />
            <div className="flex-1 flex">
                <main>
                    <GameStats ... />
                    <GameCanvas ... />
                </main>
                <GameSidebar ... />
            </div>
        </div>
    );
}
```

**重构后行数**: ~140 行 (减少 ~76%)

---

## 5. 额外修改

### ESLint 配置更新

在 `eslint.config.mjs` 中禁用 `@next/next/no-img-element` 规则：

```javascript
{
    rules: {
        // Allow <img> for dynamic base64 data URIs
        "@next/next/no-img-element": "off",
    },
}
```

**原因**: Next.js 的 `<Image>` 组件不适用于动态 base64 数据 URI，游戏帧渲染需要使用原生 `<img>` 标签。

---

## 6. 架构优势

| 方面 | 改进 |
|-----|------|
| **可测试性** | Hooks 可独立测试，UI 组件可用 Storybook 隔离测试 |
| **可复用性** | `useGameSession` 可被其他需要游戏会话的页面复用 |
| **可维护性** | 每个文件职责单一，修改影响范围可控 |
| **可扩展性** | 添加新游戏只需实现对应的 renderer/controls/settings |
| **代码组织** | 遵循 Feature-based 结构，与 `chat` 模块风格一致 |

---

## 7. 文件变更清单

### 新增文件

```
src/components/features/playground/
├── index.ts
├── types.ts
├── hooks/
│   ├── useGameSession.ts
│   ├── useGameLoop.ts
│   └── useGameKeyboard.ts
└── components/
    ├── GameCanvas.tsx
    ├── GameHeader.tsx
    ├── GameStats.tsx
    └── GameSidebar.tsx
```

### 修改文件

```
src/app/playground/[gameId]/page.tsx  (重写)
eslint.config.mjs                      (添加规则)
```

---

## 8. 后续建议

1. **状态持久化**: 考虑将游戏设置迁移到 Zustand store (`useGameSettingsStore`)
2. **错误处理**: 添加 Error Boundary 和 Toast 通知
3. **性能优化**: 对 `GameCanvas` 使用 `React.memo` 避免不必要的重渲染
4. **类型安全**: 为不同游戏的 config 定义更精确的类型
