# AGENT Studio

AGENT Studio is a modern AI agent development and interaction workbench, designed to provide developers with a feature-rich general-purpose Agent framework with enhanced control.

## ⚡ Quick Start

### Method 1: One-Click Start (Recommended)

The project includes an automation script, which is recommended for direct use:

```bash
chmod +x restart.sh
./restart.sh
```

This script will automatically: Clear port 3115 occupancy -> Check/Install dependencies -> Start development server.

### Method 2: Manual Start

```bash
npm install
npm run dev
```

## ✦ Key Features

- **Modern Intelligent Dialogue**: Supports multi-conversation management, Markdown rendering, and streaming responses.
- **Flexible Configuration**: Integrated with OpenRouter, supporting custom model parameters and system prompts.
- **Automated Operations**: Built-in `restart.sh` script for automatic port cleaning, dependency checking, and one-click restart.
- **Elegant UI/UX**: Built with Tailwind CSS 4, supporting responsive layouts (Less critical).
- **Persistent Storage**: State management using Zustand (Less critical).

## ◈ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org)
- **AI Engine**: [Vercel AI SDK](https://sdk.vercel.ai)
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand

---

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
</p>
