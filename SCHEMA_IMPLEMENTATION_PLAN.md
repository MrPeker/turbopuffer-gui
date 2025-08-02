# TurboPuffer GUI Schema Implementation Plan

## Problem Statement

The TurboPuffer GUI currently has a non-functional Schema Designer page with mock data. Users need two distinct schema management features:

1. **Schema Page** - Manage schemas for existing namespaces with real TurboPuffer API integration
2. **Schema Designer** - Standalone schema design tool for development workflows (offline-capable)

## Solution Overview

Split the current SchemaDesignerPage into two focused components:
- Refactor existing component for namespace-bound schema management
- Create new standalone schema designer for development workflows
- Implement full TurboPuffer schema API integration
- Support both basic and advanced users with progressive disclosure

---

## Feature 1: Schema Page (Namespace Management)

### Functional Requirements

**Core Schema Operations:**
- Auto-load current schema when namespace selected: `src/renderer/services/namespaceService.ts:101-115`
- Display schema with visual distinction between inferred vs. explicitly set attributes
- Support all TurboPuffer attribute types: `string`, `int`, `uint`, `uuid`, `datetime`, `bool`, arrays, vectors
- Enable real-time schema updates via TurboPuffer API: `src/renderer/services/namespaceService.ts:117-130`
- Handle HTTP 202 responses with polling and progress indicators for index building

**Advanced Full-Text Search Configuration:**
- Progressive disclosure: basic checkbox → advanced collapsible section
- Support all languages: arabic, danish, dutch, english, finnish, french, german, greek, hungarian, italian, norwegian, portuguese, romanian, russian, spanish, swedish, tamil, turkish
- Tokenizer options: word_v2, word_v1, word_v0, pre_tokenized_array
- BM25 tuning parameters: k1 (float > 0, default 1.2), b (float 0-1, default 0.75)
- Stemming, stopword removal, case sensitivity toggles

**Vector Configuration:**
- Support f16/f32 vector types with dimension specification
- ANN (Approximate Nearest Neighbor) toggle
- Clear dimension input validation

**Validation & Error Handling:**
- Real-time validation following existing patterns: `src/renderer/components/documents/DocumentsPage.tsx:82-98`
- Schema compatibility checks before applying changes
- Clear error messaging for incompatible schema changes
- Warning for non-reversible operations (type changes, deletions)

### Technical Requirements

**File Modifications:**
- Update `src/renderer/components/schema/SchemaDesignerPage.tsx` → rename to `SchemaPage.tsx`
- Integrate with existing `namespaceService.ts` methods
- Update `src/renderer/components/layout/Sidebar.tsx:61-67` - change label to "Schema", keep `requiresNamespace: true`
- Update route in `src/renderer/App.tsx:32`

**API Integration Pattern:**
```typescript
// Following existing service pattern in namespaceService.ts
const schema = await namespaceService.getNamespaceSchema(namespaceId);
const updatedSchema = await namespaceService.updateNamespaceSchema(namespaceId, schema);
```

**State Management:**
- Follow existing patterns in `src/renderer/components/documents/DocumentsPage.tsx`
- Loading states, error handling, refresh functionality
- Real-time validation without excessive API calls

---

## Feature 2: Schema Designer (Standalone)

### Functional Requirements

**Core Design Features:**
- Works offline without TurboPuffer connection
- Full schema design with all TurboPuffer attribute types and options
- Real-time example data generation based on schema
- Import/export schemas as JSON files
- Copy schema as code snippets (JSON, TypeScript interface)

**Developer Workflow Support:**
- Schema validation without API calls
- Template/example schemas for common use cases
- Schema comparison and diff visualization
- Shareable schema URLs/files

**Progressive Disclosure:**
- Same advanced full-text search UI as Schema page
- Collapsible sections for complex configurations
- Help tooltips and documentation links

### Technical Requirements

**New Component:**
- Create `src/renderer/components/schema/StandaloneSchemaDesigner.tsx`
- No connection/namespace dependencies
- Local state management (no server persistence)

**Navigation Updates:**
- Add to `src/renderer/components/layout/Sidebar.tsx` in new "Developer Tools" section
- No `requiresConnection` or `requiresNamespace` flags
- New route in `src/renderer/App.tsx`: `/schema-designer`

**File Operations:**
- JSON import/export using existing file dialog patterns
- Schema validation using TypeScript types from `src/types/namespace.ts`

---

## Implementation Approach

### Phase 1: Refactor Existing Schema Page
1. Rename `SchemaDesignerPage.tsx` → `SchemaPage.tsx`
2. Remove mock data, integrate with `namespaceService`
3. Implement real-time schema loading and updates
4. Add HTTP 202 polling mechanism
5. Update navigation and routing

### Phase 2: Enhance Schema Management
1. Add schema validation and compatibility checking
2. Implement progressive disclosure for advanced options
3. Add inferred vs. explicit attribute distinction
4. Polish error handling and user feedback

### Phase 3: Create Standalone Designer
1. Build new `StandaloneSchemaDesigner.tsx` component
2. Implement offline functionality
3. Add import/export capabilities
4. Create example data generation
5. Add developer-focused features

### Phase 4: Advanced Features
1. Schema templates and examples
2. Code generation (TypeScript interfaces, etc.)
3. Enhanced validation and help systems
4. Schema comparison tools

---

## Acceptance Criteria

### Schema Page (Namespace Management)
- [x] Automatically loads schema when namespace selected
- [x] Displays current schema with clear visual distinction for inferred attributes
- [x] Successfully updates schema via TurboPuffer API
- [x] Handles HTTP 202 responses with polling and progress indicators
- [x] Validates schema changes before applying
- [x] Supports all TurboPuffer attribute types and configurations
- [x] Advanced full-text search options in collapsible section
- [x] Error handling follows existing application patterns

### Schema Designer (Standalone)
- [x] Works without TurboPuffer connection
- [x] Generates example data based on schema design
- [x] Imports and exports schemas as JSON files
- [x] Provides code snippets for schemas (JSON & TypeScript)
- [x] Includes same advanced configuration options as Schema page
- [x] Validates schemas without API calls
- [x] Schema templates for common use cases
- [x] Tabbed interface (Design/Preview/Code)

### Navigation & UX
- [x] "Schema" page requires namespace selection
- [x] "Schema Designer" accessible without connection
- [x] Clear labeling and organization in sidebar (Developer Tools section)
- [x] Consistent UI patterns with existing pages

## ✅ IMPLEMENTATION COMPLETE

### What Was Built

**1. Schema Page (Namespace Management) - `/schema`**
- Real TurboPuffer API integration via `namespaceService`
- Auto-loads schema when namespace is selected
- Visual distinction between inferred vs. explicitly configured attributes
- HTTP 202 polling for index building status
- Full attribute type support (string, int, uint, uuid, datetime, bool, arrays, vectors)
- Advanced full-text search configuration with collapsible UI
- Real-time validation and error handling
- Add/edit/remove attributes with proper validation

**2. Standalone Schema Designer - `/schema-designer`**
- Offline-capable schema design tool
- Three-tab interface: Design, Preview, Code
- Schema templates (E-commerce, Knowledge Base, User Profiles)
- Example data generation based on schema
- Import/export JSON schemas
- Copy as JSON or TypeScript interface
- Progressive disclosure for advanced options
- Same full-text search configuration as Schema page

**3. Navigation & Routing**
- Updated sidebar with "Schema" (requires namespace) and "Schema Designer" (no requirements)
- Added "Developer Tools" section for standalone tools
- Proper routing in App.tsx
- Consistent UI patterns with existing pages

### Key Features Implemented

- **Progressive Disclosure**: Basic options shown by default, advanced collapsed
- **Real-time Validation**: Immediate feedback on schema changes
- **HTTP 202 Handling**: Proper polling for index building status
- **Template System**: Pre-built schemas for common use cases
- **Example Data**: Generate sample data to understand schema impact
- **Code Generation**: Export as JSON or TypeScript interfaces
- **Visual Indicators**: Clear badges for inferred vs. explicit attributes
- **Error Handling**: Consistent with existing application patterns

### Files Created/Modified

**New Files:**
- `src/renderer/components/schema/SchemaPage.tsx` (refactored from SchemaDesignerPage)
- `src/renderer/components/schema/StandaloneSchemaDesigner.tsx`

**Modified Files:**
- `src/renderer/components/layout/Sidebar.tsx` - Updated navigation
- `src/renderer/App.tsx` - Added routing
- `src/renderer/stores/documentsStore.ts` - Fixed linting error

### Ready for Use

Both features are fully implemented and ready for use:
1. **Schema Page**: Manage real namespace schemas with TurboPuffer API
2. **Schema Designer**: Design and explore schemas offline for development workflows

---

## Assumptions

**API Behavior:**
- TurboPuffer SDK schema() and updateSchema() methods work as documented
- HTTP 202 responses consistently indicate index building status
- Schema validation errors provide actionable messages

**User Workflow:**
- Users primarily work with existing namespaces (not creating new ones)
- Most users will use basic features, advanced users need full configurability
- Developers want to design schemas before connecting to services

**Technical Constraints:**
- Existing type definitions in `src/types/namespace.ts` accurately represent TurboPuffer schema structure
- Current service patterns in `namespaceService.ts` are sufficient for schema operations
- Electron file dialogs available for import/export functionality

---

This specification provides a complete roadmap for implementing both schema management features while maintaining consistency with the existing TurboPuffer GUI architecture and user experience patterns.

## Requirements Discovery Answers

### Discovery Questions (Answered)
1. **Schema page auto-loads when namespace selected?** Yes
2. **Schema Designer allows export as JSON/code?** Yes  
3. **Include example data generation?** Might be (included in plan)
4. **Support advanced full-text search options?** Yes, with clever UI for both basic and advanced users
5. **Schema Designer works offline?** Yes

### Expert Questions (Answered)  
6. **Refactor existing component vs. create new?** Yes - refactor existing for namespace-bound, create new standalone
7. **Show inferred vs. explicit attributes?** Yes - visual distinction in UI
8. **HTTP 202 polling for index building?** Yes - as documented in TurboPuffer API
9. **Advanced options in collapsible section?** Yes - progressive disclosure
10. **Import/export JSON files?** Yes - for developer workflows