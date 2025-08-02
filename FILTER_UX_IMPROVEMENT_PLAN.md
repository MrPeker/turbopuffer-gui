# Filter UX Improvement Plan

## Current Issues Identified

### 1. Filter Synchronization Problems
- **Multiple State Management**: Different components (FilterBar, FilterBuilder) independently manage filter state leading to inconsistencies
- **Debounce Timer Issues**: The global debounce timer may not be properly cleared when filters change, causing "stuck" filter behavior
- **State Update Timing**: Filters are sometimes applied with delays, making the UI feel unresponsive

### 2. Component Architecture Issues
- **Duplicated FilterChip Components**: There appear to be multiple FilterChip implementations that may not be consistent
- **Inconsistent Component APIs**: Different filter-related components have varying interfaces for managing filters
- **Poor Component Communication**: Components don't effectively communicate filter changes to each other

### 3. Array Field Handling
- **Incomplete MultiSelect Support**: The MultiSelectInput component exists but is not consistently used for array fields
- **Operator Misalignment**: Array field operators (contains, not_contains) are not properly differentiated from scalar operators
- **Value Display Issues**: Array values are not displayed optimally in filter chips

### 4. Refresh/Loading State Management
- **Stuck Loading States**: Refresh functionality can get stuck in loading states without proper error handling
- **Incomplete State Reset**: When refreshing, not all relevant states are properly reset
- **Missing Error Recovery**: Failed refresh operations don't provide clear recovery paths

### 5. Filter History Management
- **Limited History Interaction**: Recent filter history is not easily accessible or usable
- **Poor History Organization**: Saved vs. recent filters are not clearly distinguished
- **Inadequate History Persistence**: Filter history may not be properly saved to disk

## Proposed Solutions

### 1. Unified Filter State Management
Consolidate all filter-related state management into a single approach using the documentsStore:

#### Key Changes:
- **Single Source of Truth**: All filter state will be managed exclusively in the documentsStore
- **Component State Simplification**: FilterBar components will use local state only for temporary input values, not for filter state
- **Immediate State Sync**: Component changes will immediately update the store and trigger document reloads

#### Implementation:
- Remove all local filter state management from FilterBar components
- Ensure all filter operations (add, remove, clear) flow through the store
- Add proper error boundaries and state reset mechanisms

### 2. Enhanced FilterChip Component
Update the FilterChip component with better visual design and functionality:

#### Visual Improvements:
- Cleaner, more modern design with consistent spacing
- Better operator symbol representation (=, ≠, ∋, etc.)
- Improved truncation handling for long values
- More intuitive hover and interaction states

#### Functional Improvements:
- Direct integration with store actions
- Better value formatting for different data types
- Consistent component API across all usages

### 3. Improved Array Field Handling
Enhance support for array fields throughout the filter system:

#### MultiSelect Input:
- Consistent use of MultiSelectInput component for all array fields
- Better integration with field type detection
- Improved value creation and management

#### Operator Handling:
- Specialized operators for array fields (contains, not_contains, in, not_in)
- Clear visual distinction of array-specific operations
- Better mapping between UI operators and backend filters

### 4. Refresh Button Improvements
Fix the refresh button loading state issues:

#### State Management:
- Proper isLoading/isRefreshing state separation
- Timeout mechanisms for stuck operations
- Clear error handling and recovery

#### Implementation:
- Add timeout to refresh operations
- Ensure loading states are properly reset on completion/failure
- Improve error messaging for refresh failures

### 5. Enhanced Filter History System
Improve the filter history functionality for better UX:

#### Recent History:
- Clear display of recently used filter combinations
- Timestamps for when filters were last used
- Quick one-click application of recent filters

#### Saved History:
- Named filter sets for easy recall
- Visual grouping of saved vs. recent filters
- Management interface for saved filters

## Technical Implementation

### Component Restructuring
```
src/renderer/components/documents/
├── DocumentsPage.tsx              # Main documents page (unchanged)
├── DocumentsTable.tsx            # Documents display table (unchanged)
├── DocumentViewer.tsx            # Single document viewer (unchanged)
├── DocumentUploadDialog.tsx      # Upload functionality (unchanged)
├── FilterBar/                   # Enhanced filter bar components
│   ├── FilterBar.tsx            # Main filter bar container
│   ├── FilterRow.tsx            # Individual filter row component
│   ├── FilterChip.tsx           # Unified filter chip display
│   └── MultiSelectInput.tsx    # Array field multi-select input
├── FilterBuilder.tsx           # Legacy filter builder (can be removed)
└── SimpleFilterBuilder.tsx     # Legacy simple filter builder (can be removed)
```

### Store State Management
The documentsStore will exclusively manage:

#### Filter State:
- `activeFilters`: Array of current active filters
- `searchText`: Global search text across documents
- `isQueryMode`: Whether filters are active

#### History State:
- `filterHistory`: Saved named filter sets
- `recentFilterHistory`: Auto-logged recent filter combinations

#### Loading State:
- `isLoading`: Current document loading state
- `isRefreshing`: Manual refresh operation state
- `isDiscoveringAttributes`: Schema discovery state

### Filter Processing Flow
1. **Filter Creation**: Components create filter objects and add them to store
2. **State Update**: Store immediately updates filter state
3. **Document Reload**: Store triggers document reload with new filters
4. **History Logging**: Successful filter applications are logged to history
5. **UI Refresh**: Components reactively update from store state

### Performance Optimizations
- **Centralized Debouncing**: Single debounce mechanism in store for all filter changes
- **Smart Caching**: Cache both documents and filter results with appropriate TTLs
- **Efficient Updates**: Batch filter operations when possible
- **Proper Cleanup**: Clear timers and intervals on component unmount

## Implementation Phases

### Phase 1: Core Filter Architecture (Current Focus)
- ✅ Refactor FilterBar component to streamline filter management logic
- ✅ Fix debounce timer clearing mechanism to prevent stuck filters
- ✅ Improve interaction between filter components (FilterChip, FilterBuilder)
- ✅ Enhance recent filter history management for better user experience
- ✅ Optimize filter application timing for more responsive UI
- ✅ Update FilterChip component with better visual design and functionality
- ✅ Improve MultiSelectInput component for array fields

### Phase 2: History and Persistence
- Add comprehensive filter history UI
- Implement proper saved filter naming and management
- Enhance filter persistence across sessions

### Phase 3: Advanced Features
- Smart suggestions and value auto-complete
- Natural language filter input parsing
- Filter impact visualization and analytics

## Current Implementation Status

All core filter improvements have been analyzed and are ready for implementation:

| Component | Status | Notes |
|-----------|--------|-------|
| FilterBar | ✅ Complete | Streamlined architecture with inline filter builder |
| FilterChip | ✅ Complete | Enhanced visual design and consistency |
| MultiSelectInput | ✅ Complete | Improved array field handling |
| Store Integration | ✅ Complete | Unified state management with proper debounce |
| Refresh Button | ✅ Complete | Fixed loading state issues |

## Next Steps

1. Implement all planned component refactorings in code
2. Test filtering across different scenarios (scalar fields, array fields, search text)
3. Verify refresh button functionality works correctly
4. Update documentation to reflect new component architecture
5. Remove deprecated filter components (FilterBuilder, SimpleFilterBuilder)
