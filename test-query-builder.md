# Query Builder Test Plan

## Features Implemented

### 1. Vector Search
- ✅ Manual vector input (comma-separated or JSON array)
- ✅ Base64 encoded vector support
- ✅ File upload for vectors (JSON or base64)
- ✅ Random vector generation (128D, 384D, 1536D)
- ✅ Top-K configuration
- ✅ Vector validation and error handling

### 2. Text Search (BM25)
- ✅ Query input field
- ✅ Field selection from namespace schema
- ✅ Field weighting (0.1x to 5x)
- ✅ Custom field addition
- ✅ Multi-field search support

### 3. Hybrid Search
- ✅ Combined vector + text search
- ✅ Multi-query execution
- ✅ Result fusion with score combination
- ✅ Hybrid match indicators in results

### 4. Filters
- ✅ Visual filter builder
- ✅ Support for all operators (Eq, NotEq, In, Lt, Gt, etc.)
- ✅ AND/OR logical groups
- ✅ Advanced mode for complex filters
- ✅ Field type detection from schema

### 5. Results Display
- ✅ Table view with sortable columns
- ✅ JSON view for raw data
- ✅ Performance metrics display
- ✅ Distance/score display
- ✅ Expandable complex values
- ✅ Copy ID functionality
- ✅ Export to JSON/CSV

### 6. Query Management
- ✅ Query history with success/failure tracking
- ✅ Save queries with names and descriptions
- ✅ Load and re-run saved queries
- ✅ Query execution time tracking
- ✅ Result count display

### 7. Additional Features
- ✅ Include/exclude attributes toggle
- ✅ Real-time JSON query preview
- ✅ Custom JSON query mode
- ✅ Namespace selection
- ✅ Error handling and validation

## Testing Instructions

1. **Vector Search Test**
   - Select a namespace
   - Choose "Vector" tab
   - Try different input methods:
     - Manual: Enter `0.1, 0.2, 0.3, 0.4`
     - JSON: Enter `[0.1, 0.2, 0.3, 0.4]`
     - Base64: Enter a base64 encoded vector
     - Use "Random 128D" button
   - Set top_k to 10
   - Click "Execute Query"

2. **Text Search Test**
   - Select "Text" tab
   - Enter a search query (e.g., "example text")
   - Select fields with full-text search enabled
   - Adjust field weights using sliders
   - Execute query

3. **Hybrid Search Test**
   - Select "Hybrid" tab
   - Configure both vector and text search
   - Execute to see combined results
   - Look for "Hybrid Match" badges

4. **Filter Test**
   - Add a condition (e.g., field = "status", operator = "Eq", value = "active")
   - Try advanced mode for complex filters
   - Add AND/OR groups

5. **Results Export**
   - After executing a query, use "Export JSON" or "Export CSV"
   - Check the downloaded file

6. **Save/Load Query**
   - After configuring a query, click "Save Query"
   - Give it a name and description
   - Go to History tab in the sidebar
   - Find your saved query and click the play button to reload it

## API Integration

The Query Builder uses the Turbopuffer JavaScript SDK to execute real queries:

```typescript
// Vector search
await ns.query({
  rank_by: ['vector', 'ANN', [0.1, 0.2, 0.3, 0.4]],
  top_k: 10,
  include_attributes: true
});

// Text search
await ns.query({
  rank_by: ['content', 'BM25', 'search query'],
  top_k: 10,
  filters: ['status', 'Eq', 'active']
});

// Multi-query for hybrid
await ns.multi_query({
  queries: [vectorQuery, textQuery]
});
```

## Known Limitations

1. Distance metric is determined by namespace configuration
2. Hybrid search uses simple score fusion (not RRF)
3. Vector dimensions must match namespace configuration
4. Base64 vectors are passed directly to API without client-side validation