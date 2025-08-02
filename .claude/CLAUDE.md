# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a third-party open-source Electron desktop client for Turbopuffer, a fast vector and full-text search engine. This GUI is not affiliated with Turbopuffer Inc. The application is built with:

- Electron 36.5.0 with TypeScript
- React 18 with TypeScript (JSX support)
- swc-react (React wrappers for Spectrum Web Components) for UI components
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
- Uses swc-react component library (React wrappers for Spectrum Web Components)
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
- API keys are encrypted using Electron's safeStorage API
- Credentials are stored in OS-native keychains (macOS Keychain, Windows DPAPI, Linux Secret Service)

## UI Component Library - swc-react

This project uses **swc-react**, React wrapper components for Spectrum Web Components (SWC), providing Adobe's Spectrum Design System in React.

### Architecture

- **swc-react**: React wrappers using @lit/react
- **Spectrum Web Components**: Native Web Components built with Lit
- **Adobe Spectrum**: Industry-standard design system
- **Theme Provider**: Required wrapper for all components (`@swc-react/theme`)

### Required Setup

All components must be wrapped in Theme provider with required CSS imports:

- `@spectrum-web-components/theme/theme-light.js`
- `@spectrum-web-components/theme/scale-medium.js`

### Available Components (62 total)

#### Core UI Components

- **Layout**: `accordion`, `card`, `divider`, `split-view`, `tabs`
- **Navigation**: `breadcrumbs`, `menu`, `sidenav`, `top-nav`
- **Actions**: `action-bar`, `action-button`, `action-group`, `action-menu`, `button`, `button-group`
- **Feedback**: `alert-banner`, `alert-dialog`, `badge`, `illustrated-message`, `status-light`, `toast`, `tooltip`

#### Form Components

- **Input**: `checkbox`, `combobox`, `number-field`, `radio`, `search`, `slider`, `switch`, `textfield`
- **Selection**: `picker`, `picker-button`, `tags`
- **Support**: `field-group`, `field-label`, `help-text`, `contextual-help`

#### Data Display

- **Content**: `asset`, `avatar`, `icon`, `thumbnail`
- **Tables**: `table`
- **Progress**: `meter`, `progress-bar`, `progress-circle`

#### Color Tools

- **Pickers**: `color-area`, `color-field`, `color-wheel`, `color-slider`
- **Display**: `color-handle`, `color-loupe`, `swatch`

#### Overlays & Dialogs

- **Containers**: `dialog`, `overlay`, `popover`, `tray`
- **Utilities**: `dropzone`, `infield-button`, `underlay`

### Development Guidelines

1. **Import Strategy**: Import components individually (`@swc-react/button`, not barrel imports)
2. **Type Safety**: Use exported TypeScript types (e.g., `ButtonType`) for event handlers
3. **Theme Consistency**: Use Spectrum design tokens for colors, spacing, typography
4. **Accessibility**: Built-in ARIA compliance and keyboard navigation
5. **Performance**: Components are lazy-loaded and tree-shakeable
6. **No Custom CSS**: Don't write custom CSS unless explicitly specified. The components should be enough
