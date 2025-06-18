# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron desktop application GUI for Turbopuffer, a fast vector and full-text search engine. The application is built with:
- Electron 36.5.0 with TypeScript
- React 18 with TypeScript (JSX support)
- Adobe React Spectrum for UI components
- Vite as the build tool with React plugin
- Electron Forge for packaging and distribution
- ESLint for code linting

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run start

# Package the application
npm run package

# Build distributables (Windows, macOS, Linux)
npm run make

# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Architecture

The application follows Electron's multi-process architecture:

### Main Process (`src/main.ts`)
- Entry point for the Electron application
- Manages BrowserWindow lifecycle
- Handles platform-specific behaviors (macOS dock, Windows installer)
- Currently configured with DevTools open by default

### Preload Script (`src/preload.ts`)
- Currently empty - implement secure IPC bridges here
- Use `contextBridge` to expose APIs to the renderer process
- Never expose Node.js APIs directly to renderer

### Renderer Process (`src/renderer.tsx`)
- React-based frontend application
- Uses Adobe React Spectrum component library
- No direct Node.js access (secure by default)
- Communicate with main process through preload APIs

## Build Configuration

The project uses Vite with three separate configurations:
- `vite.main.config.ts` - Main process build
- `vite.preload.config.ts` - Preload script build  
- `vite.renderer.config.ts` - Renderer process build

Electron Forge handles packaging with security fuses enabled:
- RunAsNode: disabled
- Cookie encryption: enabled
- Node options environment variable: disabled
- Node CLI inspect arguments: disabled
- Embedded ASAR integrity validation: enabled
- Only load app from ASAR: enabled

## Turbopuffer API Integration

Turbopuffer is a vector and full-text search engine. Key API endpoints to implement:
- Authentication (`/auth`)
- Vector/document writes (`/write`)
- Search queries (`/query`)
- Namespace management (`/namespaces`, `/delete-namespace`)
- Schema management (`/schema`)
- Data export (`/export`)

API documentation is available in `turbopuffer-docs/api/`.

## React Spectrum UI Framework

The application uses Adobe React Spectrum for the UI:
- Provider component wraps the app with `defaultTheme`
- Components use semantic props (e.g., `onPress` instead of `onClick`)
- Built-in accessibility features
- Responsive design support
- Dark/light theme support via Provider

Key components available:
- Layout: Flex, Grid, View
- Buttons: Button, ActionButton, ToggleButton
- Forms: TextField, TextArea, Checkbox, Radio, Switch
- Collections: ListView, TableView, TreeView
- Overlays: Dialog, AlertDialog, Popover, Tooltip
- Navigation: Tabs, MenuBar, Breadcrumbs

## TypeScript Configuration

The project uses TypeScript with:
- Target: ESNext
- Module: CommonJS
- JSX: react-jsx (automatic runtime)
- Strict null checks: enabled (via `noImplicitAny`)
- Source maps: enabled
- Module resolution: Node
- DOM and ESNext libraries included

## Security Considerations

- Always use the preload script for IPC communication
- Never enable `nodeIntegration` or disable `contextIsolation`
- Validate all inputs from the renderer process
- Use HTTPS for Turbopuffer API communication
- Store API keys securely (consider using Electron's safeStorage API)