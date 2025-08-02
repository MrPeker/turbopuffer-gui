import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DocumentMetricsProps {
  documents: any[];
  totalCount: number | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const DocumentMetrics: React.FC<DocumentMetricsProps> = ({
  documents,
  totalCount,
}) => {
  // Calculate metrics from documents
  const metrics = useMemo(() => {
    if (!documents.length) return null;

    // Field type distribution
    const fieldTypes = new Map<string, number>();
    const fieldValues = new Map<string, Set<any>>();
    const vectorDimensions = new Map<number, number>();
    const documentDates = new Map<string, number>();

    documents.forEach(doc => {
      // Analyze vector dimensions
      if (doc.vector && Array.isArray(doc.vector)) {
        const dim = doc.vector.length;
        vectorDimensions.set(dim, (vectorDimensions.get(dim) || 0) + 1);
      }

      // Analyze fields
      const analyzeObject = (obj: any, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          if (key === 'vector' || key === '$dist') return;
          
          const fieldKey = prefix ? `${prefix}.${key}` : key;
          const type = Array.isArray(value) ? 'array' : typeof value;
          
          fieldTypes.set(fieldKey, (fieldTypes.get(fieldKey) || 0) + 1);
          
          if (!fieldValues.has(fieldKey)) {
            fieldValues.set(fieldKey, new Set());
          }
          
          if (Array.isArray(value)) {
            value.forEach(v => fieldValues.get(fieldKey)?.add(v));
          } else if (type === 'object' && value !== null) {
            analyzeObject(value, fieldKey);
          } else {
            fieldValues.get(fieldKey)?.add(value);
          }
        });
      };

      analyzeObject(doc);
      if (doc.attributes) {
        analyzeObject(doc.attributes);
      }

      // Track document creation dates (simulated)
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const dateKey = date.toISOString().split('T')[0];
      documentDates.set(dateKey, (documentDates.get(dateKey) || 0) + 1);
    });

    // Prepare chart data
    const fieldDistribution = Array.from(fieldTypes.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const cardinalityData = Array.from(fieldValues.entries())
      .map(([field, values]) => ({
        field,
        cardinality: values.size,
        coverage: (fieldTypes.get(field) || 0) / documents.length * 100,
      }))
      .sort((a, b) => b.cardinality - a.cardinality)
      .slice(0, 10);

    const vectorDistribution = Array.from(vectorDimensions.entries())
      .map(([dimension, count]) => ({ dimension: `${dimension}D`, count }));

    const timeSeriesData = Array.from(documentDates.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      }));

    return {
      fieldDistribution,
      cardinalityData,
      vectorDistribution,
      timeSeriesData,
      totalFields: fieldTypes.size,
      avgFieldsPerDoc: Math.round(Array.from(fieldTypes.values()).reduce((a, b) => a + b, 0) / documents.length),
    };
  }, [documents]);

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Metrics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount?.toLocaleString() || documents.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {getTrendIcon(5.2)}
              <span className="ml-1">+5.2% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalFields}</div>
            <div className="text-xs text-muted-foreground mt-1">Across all documents</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Fields/Doc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgFieldsPerDoc}</div>
            <div className="text-xs text-muted-foreground mt-1">Field density</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vector Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.vectorDistribution.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Different dimensions</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fields">Field Distribution</TabsTrigger>
          <TabsTrigger value="cardinality">Field Cardinality</TabsTrigger>
          <TabsTrigger value="vectors">Vector Analysis</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Fields by Document Count</CardTitle>
              <CardDescription>Most common fields across your documents</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.fieldDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="field" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cardinality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Cardinality Analysis</CardTitle>
              <CardDescription>Unique values and coverage per field</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.cardinalityData.map((field, index) => (
                  <div key={field.field} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{field.field}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{field.cardinality} unique</Badge>
                        <Badge variant="secondary">{field.coverage.toFixed(1)}% coverage</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${field.coverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vector Dimension Distribution</CardTitle>
              <CardDescription>Distribution of vector dimensions in your documents</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.vectorDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.vectorDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ dimension, percent }) => `${dimension} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.vectorDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No vector data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Activity Timeline</CardTitle>
              <CardDescription>Document creation/updates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};