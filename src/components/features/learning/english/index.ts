// Main module component
export { EnglishLearningModule } from './EnglishLearningModule';

// Sub-components (for advanced usage)
export { WordSidebar } from './components/WordSidebar';
export { WordDetail } from './components/WordDetail';
export { MarkdownEditor } from './components/MarkdownEditor';
export { GraffitiToolbar } from './components/GraffitiToolbar';
export { GraffitiCanvas } from './components/GraffitiCanvas';

// Hooks
export { useEnglishLearning } from './hooks/useEnglishLearning';

// Types
export type { WordEntry, Stroke, GraffitiTool, GraffitiState, GraffitiActions } from './types';

// Data (for testing or customization)
export { MOCK_DB, GRAFFITI_COLORS } from './data/mockData';
