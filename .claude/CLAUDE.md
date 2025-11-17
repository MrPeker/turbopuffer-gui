# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Third-party open-source Electron desktop GUI for Turbopuffer (vector and full-text search engine). Built with:

- **Electron 36.5.0** - Multi-process architecture with security fuses
- **React 19** with TypeScript
- **Vite** - Build tool with separate configs for main/preload/renderer
- **Radix UI + Tailwind CSS** - UI component library (shadcn/ui)
- **Zustand** - State management with Immer middleware
- **React Router 7** - HashRouter for Electron compatibility
- **Turbopuffer SDK** (`@turbopuffer/turbopuffer`) - Official client library

## Development Commands

```bash
npm install          # Install dependencies
npm run start        # Start development server with hot reload
npm run package      # Package application (without installer)
npm run make         # Build distributables (Windows/macOS/Linux)
npm run lint         # Run ESLint
npm run lint -- --fix # Fix linting issues
```

## Architecture Overview

### 1. Electron Multi-Process Architecture

**Main Process** (`src/main.ts` + `src/main/`)
- Window lifecycle management
- IPC handler registration via `src/main/ipc/*.ts`
- Services: `credentialService` (encrypted storage), `settingsService`, `queryHistoryService`
- DevTools open by default in development

**Preload Script** (`src/preload.ts`)
- Bridges main ↔ renderer via `contextBridge.exposeInMainWorld('electronAPI', ...)`
- Typed APIs: `ConnectionAPI`, `SettingsAPI`, `QueryHistoryAPI`, `AppAPI`
- Never expose Node.js APIs directly

**Renderer Process** (`src/renderer/`)
- React application with no Node.js access
- All main process communication via `window.electronAPI.*`

### 2. State Management Architecture

The app uses a **hybrid state management** approach:

**React Context** (for global, cross-cutting concerns):
- `ConnectionContext` - Connection selection, test, save/delete
- `NamespaceContext` - Current namespace selection, recent namespaces
- `SettingsContext` - App settings (API logging, timeouts, retries)

**Zustand Stores** (for feature-specific state):
- `documentsStore.ts` - Documents list, filters, pagination, attribute discovery
  - Uses Immer for immutable updates
  - Per-namespace caching for attributes and documents
  - Filter history (saved + recent filters)
  - Pagination with cursor-based navigation

**Important Pattern**: Zustand stores are scoped to the current connection + namespace. When these change, stores reset relevant state.

### 3. Service Layer Architecture

**Renderer Services** (`src/renderer/services/`)
- `turbopufferService.ts` - Singleton wrapper for Turbopuffer SDK
  - Client initialization with region + API key
  - Request logging (none/basic/detailed/verbose)
  - Applies settings for timeout, retries, custom endpoints
- `documentService.ts` - Document CRUD operations
- `namespaceService.ts` - Namespace operations
- `attributeDiscoveryService.ts` - Discovers available attributes from sample documents
- `searchService.ts` - Search and filter operations
- `settingsService.ts` - Settings CRUD via IPC

**Main Services** (`src/main/services/`)
- `credentialService.ts` - Encrypted credential storage using Electron's `safeStorage`
  - Stores API keys encrypted in OS keychain
  - Connection metadata stored in `connections.json`
- `settingsService.ts` - Settings persistence to `settings.json`
- `queryHistoryService.ts` - Per-connection/namespace query history storage

### 4. IPC Communication Pattern

All IPC follows this pattern:

1. **Renderer** calls `window.electronAPI.methodName(...)`
2. **Preload** invokes `ipcRenderer.invoke('channel:name', ...)`
3. **Main** handles via `ipcMain.handle('channel:name', async (event, ...) => {...})`

Channels are namespaced: `connection:*`, `settings:*`, `queryHistory:*`, `app:*`

### 5. Routing Architecture

Uses `HashRouter` (required for Electron file:// protocol):

```
/connections              - ConnectionsPage
/namespaces               - NamespacesPage (list all namespaces)
/namespaces/:namespaceId  - DocumentsPage (view documents in namespace)
/documents                - DocumentsPage (requires namespace context)
/schema                   - SchemaPage
/schema-designer          - StandaloneSchemaDesigner
/settings                 - SettingsPage
```

**Layout**: All routes render inside `<MainLayout>` which provides:
- Sidebar navigation
- Status bar
- Connection/namespace selection UI

### 6. Data Flow Example: Loading Documents

```
DocumentsPage → useDocumentsStore() → store.loadDocuments()
  ↓
documentsStore.ts → documentService.queryDocuments()
  ↓
documentService.ts → turbopufferService.getClient().namespace(id).query()
  ↓
turbopufferService.ts → Turbopuffer SDK (initialized with API key + region)
  ↓
Turbopuffer API → Response
  ↓
documentsStore updates (via Immer): documents, totalCount, nextCursor
  ↓
DocumentsPage re-renders with new data
```

## UI Component System

**Component Library**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- Components in `src/components/ui/` are pre-built shadcn components
- Feature components in `src/renderer/components/`
- Use Tailwind utility classes for styling
- Theme configured via CSS variables in `src/renderer/index.css`

**Tailwind Configuration** (`tailwind.config.js`):
- HSL-based design tokens: `--border`, `--primary`, `--muted`, etc.
- Dark mode: `class`-based (toggle via `next-themes`)
- Custom sidebar color palette
- Border radius via `--radius` variable

**Important**: No custom CSS unless necessary. Use Tailwind utilities and shadcn components.

## Filter System Architecture

The filter system supports two modes:

**1. Simple Filter Bar** (`FilterBar.tsx`, `FilterBuilder.tsx`):
- Visual UI for building filters attribute-by-attribute
- Converts to `SimpleFilter[]` in `documentsStore`
- Converted to Turbopuffer filter syntax via `filterConversion.ts`

**2. Raw Query Bar** (`RawQueryBar.tsx`):
- Monaco editor for writing raw Turbopuffer filter JSON
- Bypasses Simple Filter system
- Directly sent to Turbopuffer API

**Filter Type System**:
- `SimpleFilter` - UI representation (attribute, operator, value, displayValue)
- `TurbopufferFilter` - API representation (nested objects with operators)
- Conversion utilities in `src/renderer/utils/filterConversion.ts`
- Type checking in `src/renderer/utils/filterTypeConversion.ts`

## Security Considerations

- API keys encrypted using Electron's `safeStorage` (OS-native encryption)
- Stored in OS keychain (macOS Keychain, Windows DPAPI, Linux Secret Service)
- Connection metadata (names, regions) stored unencrypted in `connections.json`
- Settings stored unencrypted in `settings.json`
- Context isolation enabled, `nodeIntegration` disabled
- All IPC communication validated in main process handlers

## Build Configuration

**Vite Configurations**:
- `vite.main.config.ts` - Main process (Node.js environment)
- `vite.preload.config.ts` - Preload script (limited Node.js)
- `vite.renderer.config.ts` - Renderer (browser environment, React)

**Electron Forge** (`forge.config.ts`):
- Makers: ZIP, Squirrel (Windows), DEB, RPM
- Security fuses enabled (RunAsNode disabled, ASAR integrity validation, etc.)
- Auto-unpack natives plugin for native modules

## Key Files to Understand

- `src/renderer/stores/documentsStore.ts` - Central state for document viewing
- `src/renderer/services/turbopufferService.ts` - API client management
- `src/preload.ts` - Complete IPC surface area
- `src/main/services/credentialService.ts` - Encrypted credential storage
- `src/renderer/contexts/ConnectionContext.tsx` - Connection lifecycle
- `src/renderer/utils/filterConversion.ts` - Filter transformation logic

## Common Patterns

**Adding a new IPC handler**:
1. Define types in `src/types/`
2. Add handler in `src/main/ipc/` or inline in `src/main.ts`
3. Expose in `src/preload.ts` via `contextBridge`
4. Update `window.electronAPI` type declaration
5. Call from renderer via `window.electronAPI.*`

**Adding a new Zustand store**:
1. Create in `src/renderer/stores/`
2. Use `create()` with `devtools`, `subscribeWithSelector`, `immer` middleware
3. Enable MapSet support: `enableMapSet()` if using Map/Set
4. Export typed hooks: `const useMyStore = create<MyState>()(...))`

**Adding a new route**:
1. Create page component in `src/renderer/components/`
2. Add route in `src/renderer/App.tsx` inside `<Route path="/" element={<MainLayout />}>`
3. Use `HashRouter` compatible paths (no query params in routing)
