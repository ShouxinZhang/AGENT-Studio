/**
 * Chat 模块导出
 * 
 * 该模块提供完整的聊天功能，包括：
 * 
 * 组件：
 * - ChatInterface: 聊天界面主组件（推荐直接使用）
 * - MessageBubble: 消息气泡组件
 * - ChatInput: 输入框组件
 * - EmptyState: 空状态组件
 * - LoadingIndicator: 加载指示器
 * - ErrorDisplay: 错误展示组件
 * 
 * Hooks：
 * - useChatLogic: 聊天核心逻辑 Hook（如需自定义 UI 可单独使用）
 * 
 * 工具函数：
 * - getMessageText: 从消息对象提取纯文本
 * 
 * 使用示例：
 * ```tsx
 * import { ChatInterface } from "@/components/features/chat";
 * 
 * function App() {
 *   return <ChatInterface />;
 * }
 * ```
 */

export { ChatInterface } from "./ChatInterface";
export { useChatLogic, getMessageText } from "./hooks/useChatLogic";
export * from "./components";
