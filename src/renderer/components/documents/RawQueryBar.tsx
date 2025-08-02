import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, 
  AlertCircle, 
  Clock,
  Code2,
  Database,
  Search,
  Hash,
  Wand2,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConnection } from '@/renderer/contexts/ConnectionContext';
import { turbopufferService } from '@/renderer/services/turbopufferService';
import { useDocumentsStore } from '@/renderer/stores/documentsStore';
import { useSettings } from '@/renderer/contexts/SettingsContext';

interface RawQueryBarProps {
  namespaceId: string;
}

export const RawQueryBar: React.FC<RawQueryBarProps> = ({ namespaceId }) => {
  const { activeConnection } = useConnection();
  const { toast } = useToast();
  const { setRawQueryResults, clearDocuments, attributes } = useDocumentsStore();
  const { settings } = useSettings();
  const [query, setQuery] = useState('{\n  "rank_by": ["id", "asc"],\n  "top_k": 100,\n  "include_attributes": true\n}');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const editorRef = useRef<any>(null);

  // Track system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Resolve the current theme
  const getResolvedTheme = (): 'light' | 'dark' => {
    if (!settings) return 'light';
    
    switch (settings.appearance.theme) {
      case 'dark': return 'dark';
      case 'light': return 'light';
      case 'system': return systemPrefersDark ? 'dark' : 'light';
      default: return 'light';
    }
  };

  const resolvedTheme = getResolvedTheme();
  const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs';

  // Update Monaco Editor theme when app theme changes
  useEffect(() => {
    if (editorRef.current) {
      const monaco = editorRef.current.getModel()?.languages?.monaco || window.monaco;
      if (monaco) {
        monaco.editor.setTheme(monacoTheme);
      }
    }
  }, [monacoTheme]);

  const executeQuery = async () => {
    if (!activeConnection) {
      toast.error('No connection', {
        description: 'Please select a connection first',
      });
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);
      clearDocuments();

      // Parse and validate JSON
      let parsedQuery;
      try {
        parsedQuery = JSON.parse(query);
      } catch (err) {
        const jsonError = err instanceof Error ? err.message : 'Parse error';
        throw new Error(`Invalid JSON syntax: ${jsonError}. Please check your brackets, quotes, and commas.`);
      }

      // Validate required fields
      if (!parsedQuery.rank_by && !parsedQuery.aggregate_by) {
        throw new Error('Query must include either "rank_by" or "aggregate_by" field.');
      }

      // Get connection details with API key
      const connectionDetails = await window.electronAPI.getConnectionForUse(activeConnection.id);
      
      // Initialize client
      await turbopufferService.initializeClient(connectionDetails.apiKey, connectionDetails.region);
      
      // Get the client and execute raw query
      const client = turbopufferService.getClient();
      if (!client) {
        throw new Error('Failed to initialize TurboPuffer client');
      }

      const namespace = client.namespace(namespaceId);
      
      // Execute the query
      const response = await namespace.query(parsedQuery);

      // Update documents store with raw query results
      if (response.rows) {
        setRawQueryResults(response.rows, response);
        toast.success('Query executed successfully', {
          description: `Returned ${response.rows.length} documents`,
        });
      } else if (response.aggregations) {
        setRawQueryResults([], response);
        toast.success('Aggregation completed', {
          description: 'Check the results in the table below',
        });
      }

    } catch (err) {
      console.error('Query execution error:', err);
      
      let errorMessage = 'Unknown error occurred';
      
      // Handle different types of errors
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Extract more details from TurboPuffer API errors
        if (err.message.includes('400') || err.message.includes('Bad Request')) {
          errorMessage = 'Invalid query format. Please check your JSON syntax and query structure.';
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (err.message.includes('404') || err.message.includes('Not Found')) {
          errorMessage = 'Namespace not found. Please check the namespace name.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Query timeout. Try reducing the query complexity or top_k value.';
        }
      }
      
      setError(errorMessage);
      
      toast.error('Query failed', {
        description: errorMessage,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const examples = [
    {
      name: 'List All Documents',
      description: 'Get all documents ordered by ID',
      icon: <Database className="h-4 w-4" />,
      query: {
        rank_by: ["id", "asc"],
        top_k: 100,
        include_attributes: true
      }
    },
    {
      name: 'Vector Search',
      description: 'Find similar documents using vector similarity',
      icon: <Search className="h-4 w-4" />,
      query: {
        rank_by: ["vector", "ANN", [0.1, 0.2, 0.3]],
        top_k: 10,
        include_attributes: ["id", "title"]
      }
    },
    {
      name: 'Count Documents',
      description: 'Get total document count with aggregation',
      icon: <Hash className="h-4 w-4" />,
      query: {
        aggregate_by: {
          "total_count": ["Count", "id"]
        }
      }
    },
    {
      name: 'BM25 Text Search',
      description: 'Full-text search using BM25 algorithm',
      icon: <Code2 className="h-4 w-4" />,
      query: {
        rank_by: ["content", "BM25", "search query"],
        top_k: 10,
        include_attributes: ["id", "title", "content"]
      }
    },
    {
      name: 'Filtered Query',
      description: 'Query with filters and ordering',
      icon: <Database className="h-4 w-4" />,
      query: {
        rank_by: ["timestamp", "desc"],
        top_k: 100,
        filters: ["And", [
          ["timestamp", "Gte", 1709251200],
          ["status", "Eq", "published"]
        ]],
        include_attributes: ["id", "title", "timestamp"]
      }
    }
  ];

  const loadExample = (exampleQuery: any) => {
    setQuery(JSON.stringify(exampleQuery, null, 2));
    setError(null);
  };

  return (
    <div className="border-b bg-background">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="m-4 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4 p-4">
        {/* Query Input Section */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">JSON Query</CardTitle>
                  <CardDescription>
                    Write your TurboPuffer query in JSON format
                  </CardDescription>
                </div>
                <Button
                  onClick={executeQuery}
                  disabled={isExecuting || !query.trim()}
                  className="gap-2"
                >
                  {isExecuting ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isExecuting ? 'Executing...' : 'Execute Query'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <Editor
                  height="200px"
                  defaultLanguage="json"
                  value={query}
                  onChange={(value) => setQuery(value || '')}
                  theme={monacoTheme}
                  options={{
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    folding: true,
                    bracketPairColorization: { enabled: true },
                    suggest: { 
                      showKeywords: true,
                      showSnippets: true,
                      showMethods: true,
                      showFunctions: true,
                      showConstructors: true,
                      showFields: true,
                      showVariables: true,
                      showClasses: true,
                      showStructs: true,
                      showInterfaces: true,
                      showModules: true,
                      showProperties: true,
                      showEvents: true,
                      showOperators: true,
                      showUnits: true,
                      showValues: true,
                      showConstants: true,
                      showEnums: true,
                      showEnumMembers: true,
                      showColors: true,
                      showFiles: true,
                      showReferences: true,
                      showFolders: true,
                      showTypeParameters: true,
                      insertMode: 'replace',
                      filterGraceful: true,
                      snippetsPreventQuickSuggestions: false
                    },
                    quickSuggestions: {
                      other: true,
                      comments: false,
                      strings: true
                    },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: 'on',
                    wordWrap: 'on',
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace'
                  }}
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    
                    // Add JSON validation and formatting
                    editor.addAction({
                      id: 'format-json',
                      label: 'Format JSON',
                      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
                      run: () => {
                        editor.getAction('editor.action.formatDocument')?.run();
                      }
                    });

                    // Add manual trigger for suggestions
                    editor.addAction({
                      id: 'trigger-suggest',
                      label: 'Trigger Suggestions',
                      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space],
                      run: () => {
                        editor.getAction('editor.action.triggerSuggest')?.run();
                      }
                    });

                    // Add comprehensive TurboPuffer intellisense
                    monaco.languages.registerCompletionItemProvider('json', {
                      triggerCharacters: ['"', ':', '[', '{', ',', ' '],
                      provideCompletionItems: (model, position) => {
                        try {
                          const textUntilPosition = model.getValueInRange({
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                          });

                          console.log('Monaco completion triggered:', textUntilPosition);

                          const suggestions = [];

                          // Always add some basic suggestions for testing
                          suggestions.push({
                            label: 'TEST_SUGGESTION',
                            kind: monaco.languages.CompletionItemKind.Text,
                            insertText: 'TEST_SUGGESTION',
                            documentation: 'Test suggestion to verify intellisense is working'
                          });

                        // Root-level query parameters
                        const rootParams = [
                          { label: 'rank_by', detail: 'array', documentation: 'How to rank documents. Required unless aggregate_by is set.' },
                          { label: 'top_k', detail: 'number', documentation: 'Number of documents to return. Maximum: 1200.' },
                          { label: 'filters', detail: 'array', documentation: 'Exact filters for attributes (SQL WHERE clause).' },
                          { label: 'include_attributes', detail: 'array|boolean', documentation: 'Attributes to return. Use true for all attributes.' },
                          { label: 'aggregate_by', detail: 'object', documentation: 'Aggregations to compute. Cannot be used with rank_by.' },
                          { label: 'queries', detail: 'array', documentation: 'Array of query objects for multi-queries (max 16).' },
                          { label: 'vector_encoding', detail: '"float"|"base64"', documentation: 'Vector encoding format. Default: "float".' },
                          { label: 'consistency', detail: 'object', documentation: 'Read consistency level: {"level": "strong"|"eventual"}.' }
                        ];

                        // Filter operators
                        const filterOperators = [
                          'Eq', 'NotEq', 'In', 'NotIn', 'Contains', 'NotContains', 
                          'ContainsAny', 'NotContainsAny', 'Lt', 'Lte', 'Gt', 'Gte',
                          'Glob', 'NotGlob', 'IGlob', 'NotIGlob', 'ContainsAllTokens'
                        ];

                        // Logical operators
                        const logicalOperators = ['And', 'Or', 'Not'];

                        // Ranking functions
                        const rankingFunctions = ['ANN', 'BM25', 'Sum', 'Max', 'Product'];

                        // Get available field names from schema
                        const fieldNames = ['id', ...attributes.map(attr => attr.name)];

                        // Detect context and provide appropriate suggestions
                        if (textUntilPosition.includes('"rank_by"')) {
                          // Ranking function suggestions
                          rankingFunctions.forEach(func => {
                            suggestions.push({
                              label: func,
                              kind: monaco.languages.CompletionItemKind.Function,
                              insertText: `"${func}"`,
                              documentation: getRankingFunctionDoc(func)
                            });
                          });

                          // Add common ranking patterns
                          suggestions.push({
                            label: 'vector-ann',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '["vector", "ANN", [0.1, 0.2, 0.3]]',
                            documentation: 'Vector similarity search with query vector'
                          });

                          suggestions.push({
                            label: 'bm25-search',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '["content", "BM25", "search query"]',
                            documentation: 'BM25 full-text search'
                          });

                          suggestions.push({
                            label: 'order-by-asc',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '["id", "asc"]',
                            documentation: 'Order by attribute ascending'
                          });

                          suggestions.push({
                            label: 'order-by-desc',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '["timestamp", "desc"]',
                            documentation: 'Order by attribute descending'
                          });

                          // Add field names for ranking
                          fieldNames.forEach(field => {
                            suggestions.push({
                              label: field,
                              kind: monaco.languages.CompletionItemKind.Field,
                              insertText: `"${field}"`,
                              documentation: `Field name: ${field}`
                            });
                          });
                        } 
                        else if (textUntilPosition.includes('"filters"')) {
                          // Filter operator suggestions
                          filterOperators.forEach(op => {
                            suggestions.push({
                              label: op,
                              kind: monaco.languages.CompletionItemKind.Operator,
                              insertText: `"${op}"`,
                              documentation: getFilterOperatorDoc(op)
                            });
                          });

                          // Logical operator suggestions
                          logicalOperators.forEach(op => {
                            suggestions.push({
                              label: op,
                              kind: monaco.languages.CompletionItemKind.Keyword,
                              insertText: `"${op}"`,
                              documentation: getLogicalOperatorDoc(op)
                            });
                          });

                          // Common filter patterns
                          suggestions.push({
                            label: 'and-filter',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '["And", [\n  ["field", "Eq", "value"],\n  ["field2", "Gt", 100]\n]]',
                            documentation: 'AND condition with multiple filters'
                          });

                          suggestions.push({
                            label: 'or-filter',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '["Or", [\n  ["field", "Eq", "value1"],\n  ["field", "Eq", "value2"]\n]]',
                            documentation: 'OR condition with multiple filters'
                          });

                          // Add field names for filtering
                          fieldNames.forEach(field => {
                            suggestions.push({
                              label: field,
                              kind: monaco.languages.CompletionItemKind.Field,
                              insertText: `"${field}"`,
                              documentation: `Field name: ${field}`
                            });
                          });
                        }
                        else if (textUntilPosition.includes('"include_attributes"')) {
                          // Add field names for include_attributes
                          fieldNames.forEach(field => {
                            suggestions.push({
                              label: field,
                              kind: monaco.languages.CompletionItemKind.Field,
                              insertText: `"${field}"`,
                              documentation: `Field name: ${field}`
                            });
                          });

                          // Add special boolean values
                          suggestions.push({
                            label: 'true',
                            kind: monaco.languages.CompletionItemKind.Value,
                            insertText: 'true',
                            documentation: 'Include all attributes'
                          });

                          suggestions.push({
                            label: 'false',
                            kind: monaco.languages.CompletionItemKind.Value,
                            insertText: 'false',
                            documentation: 'Include no attributes (only id)'
                          });
                        }
                        else if (textUntilPosition.includes('"aggregate_by"')) {
                          suggestions.push({
                            label: 'count-aggregation',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: '{\n  "total_count": ["Count", "id"]\n}',
                            documentation: 'Count documents aggregation'
                          });
                        }
                        else {
                          // Root level suggestions
                          rootParams.forEach(param => {
                            suggestions.push({
                              label: param.label,
                              kind: monaco.languages.CompletionItemKind.Property,
                              insertText: `"${param.label}": `,
                              documentation: `${param.detail} - ${param.documentation}`
                            });
                          });

                          // Common query templates
                          suggestions.push({
                            label: 'basic-query',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: JSON.stringify({
                              rank_by: ["id", "asc"],
                              top_k: 100,
                              include_attributes: true
                            }, null, 2),
                            documentation: 'Basic document listing query'
                          });

                          suggestions.push({
                            label: 'vector-search',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: JSON.stringify({
                              rank_by: ["vector", "ANN", [0.1, 0.2, 0.3]],
                              top_k: 10,
                              include_attributes: ["id", "title"]
                            }, null, 2),
                            documentation: 'Vector similarity search'
                          });

                          suggestions.push({
                            label: 'filtered-query',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: JSON.stringify({
                              rank_by: ["timestamp", "desc"],
                              top_k: 100,
                              filters: ["And", [
                                ["timestamp", "Gte", 1709251200],
                                ["status", "Eq", "published"]
                              ]],
                              include_attributes: ["id", "title", "timestamp"]
                            }, null, 2),
                            documentation: 'Query with filters and ordering'
                          });

                          suggestions.push({
                            label: 'bm25-search',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: JSON.stringify({
                              rank_by: ["content", "BM25", "search query"],
                              top_k: 10,
                              include_attributes: ["id", "title", "content"]
                            }, null, 2),
                            documentation: 'BM25 full-text search'
                          });

                          suggestions.push({
                            label: 'aggregation',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: JSON.stringify({
                              aggregate_by: {
                                "total_count": ["Count", "id"]
                              }
                            }, null, 2),
                            documentation: 'Count aggregation query'
                          });

                          suggestions.push({
                            label: 'multi-query',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: JSON.stringify({
                              queries: [
                                {
                                  rank_by: ["vector", "ANN", [1.0, 0.0]],
                                  top_k: 10
                                },
                                {
                                  rank_by: ["content", "BM25", "search text"],
                                  top_k: 10
                                }
                              ]
                            }, null, 2),
                            documentation: 'Multi-query for hybrid search'
                          });
                        }

                        console.log('Monaco suggestions:', suggestions);
                        return { suggestions };

                        } catch (error) {
                          console.error('Monaco completion error:', error);
                          return { suggestions: [] };
                        }

                        function getRankingFunctionDoc(func: string): string {
                          const docs: Record<string, string> = {
                            'ANN': 'Approximate Nearest Neighbor - for vector similarity search',
                            'BM25': 'BM25 full-text search algorithm',
                            'Sum': 'Sum the scores of multiple sub-queries',
                            'Max': 'Use maximum score of sub-queries',
                            'Product': 'Multiply values for field weighting/boosting'
                          };
                          return docs[func] || '';
                        }

                        function getFilterOperatorDoc(op: string): string {
                          const docs: Record<string, string> = {
                            'Eq': 'Exact match. If null, matches documents missing the attribute',
                            'NotEq': 'Not equal. If null, matches documents with the attribute',
                            'In': 'Matches any values in the provided array',
                            'NotIn': 'Does not match any values in the provided array',
                            'Contains': 'Array attribute contains the value',
                            'NotContains': 'Array attribute does not contain the value',
                            'ContainsAny': 'Array attribute contains any of the values',
                            'NotContainsAny': 'Array attribute does not contain any of the values',
                            'Lt': 'Less than (numeric/lexicographic/datetime)',
                            'Lte': 'Less than or equal (numeric/lexicographic/datetime)',
                            'Gt': 'Greater than (numeric/lexicographic/datetime)',
                            'Gte': 'Greater than or equal (numeric/lexicographic/datetime)',
                            'Glob': 'Unix-style glob pattern matching',
                            'NotGlob': 'Does not match Unix-style glob pattern',
                            'IGlob': 'Case-insensitive glob pattern matching',
                            'NotIGlob': 'Does not match case-insensitive glob pattern',
                            'ContainsAllTokens': 'All tokens in string are present (requires full-text search)'
                          };
                          return docs[op] || '';
                        }

                        function getLogicalOperatorDoc(op: string): string {
                          const docs: Record<string, string> = {
                            'And': 'All conditions must match',
                            'Or': 'At least one condition must match',
                            'Not': 'Condition must not match'
                          };
                          return docs[op] || '';
                        }
                      }
                    });
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  💡 Tip: Use <code className="bg-muted px-1 rounded">include_attributes: true</code> to return all fields, or specify an array like <code className="bg-muted px-1 rounded">["id", "title"]</code>
                </span>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>
                    <kbd className="bg-muted px-1 rounded text-xs">Ctrl+Space</kbd> suggestions
                  </span>
                  <span>
                    <kbd className="bg-muted px-1 rounded text-xs">Ctrl+Shift+F</kbd> format
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Examples Section */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Query Examples</CardTitle>
              <CardDescription>
                Click to load common query patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {examples.map((example, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => loadExample(example.query)}
                  className="w-full justify-start text-left h-auto p-3"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-0.5">{example.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs">{example.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {example.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};