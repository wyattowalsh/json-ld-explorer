import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart3, 
  Network, 
  FileText, 
  TrendingUp, 
  Zap, 
  Globe, 
  AlertCircle, 
  Loader2,
  Eye,
  Download,
  Share2,
  Sparkles,
  Brain,
  Target
} from 'lucide-react';

import { DataLoader } from './DataLoader';
import { StatsPanel } from './StatsPanel';
import { GraphVisualization } from './GraphVisualization';
import { JsonViewer } from './JsonViewer';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { SchemaExplorer } from './SchemaExplorer';
import { RelationshipMatrix } from './RelationshipMatrix';
import { SemanticInsights } from './SemanticInsights';
import { JSONLDProcessor } from '@/utils/dataProcessing';
import { GraphAnalyticsEngine } from '@/utils/graphAnalytics';
import { DataStats, JSONLDData, GraphAnalytics as GraphAnalyticsType, Graph as GraphType } from '@/types';

interface DashboardMetrics {
  totalObjects: number;
  totalProperties: number;
  uniqueTypes: number;
  maxDepth: number;
  contexts: number;
  relationships: number;
}

export function Dashboard() {
  const [jsonldData, setJsonldData] = useState<unknown>(null);
  const [processedDataStats, setProcessedDataStats] = useState<DataStats | null>(null);
  const [graphAnalytics, setGraphAnalytics] = useState<GraphAnalyticsType | null>(null);
  const [processedGraph, setProcessedGraph] = useState<GraphType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('data');
  const [viewMode, setViewMode] = useState<'explore' | 'analyze' | 'visualize'>('explore');

  const metrics = useMemo(() => {
    if (!jsonldData) return null;
    
    const calculateMetrics = (data: unknown): DashboardMetrics => {
      let totalObjects = 0;
      let totalProperties = 0;
      const uniqueTypes = new Set<string>();
      let maxDepth = 0;
      const contexts = new Set<string>();
      let relationships = 0;

      const traverse = (obj: unknown, depth = 0) => {
        if (depth > maxDepth) maxDepth = depth;
        
        if (Array.isArray(obj)) {
          obj.forEach(item => traverse(item, depth + 1));
        } else if (obj && typeof obj === 'object') {
          totalObjects++;
          const objData = obj as Record<string, unknown>;
          
          Object.entries(objData).forEach(([key, value]) => {
            totalProperties++;
            
            if (key === '@type' && typeof value === 'string') {
              uniqueTypes.add(value);
            }
            
            if (key === '@context' && typeof value === 'string') {
              contexts.add(value);
            }
            
            if (key.startsWith('http') || key.includes(':')) {
              relationships++;
            }
            
            traverse(value, depth + 1);
          });
        }
      };

      traverse(data);
      
      return {
        totalObjects,
        totalProperties,
        uniqueTypes: uniqueTypes.size,
        maxDepth,
        contexts: contexts.size,
        relationships
      };
    };

    return calculateMetrics(jsonldData);
  }, [jsonldData]);

  const handleDataLoad = useCallback((data: unknown) => {
    try {
      setJsonldData(data);
      setError(null);
      setIsLoading(false);

      if (data) {
        const processor = new JSONLDProcessor();
        const stats = processor.generateDataStats(data as JSONLDData | JSONLDData[]);
        setProcessedDataStats(stats);

        const graph = processor.processJSONLD(data as JSONLDData | JSONLDData[]);
        setProcessedGraph(graph); // Store the processed graph
        const analyticsEngine = new GraphAnalyticsEngine();
        const analytics = analyticsEngine.analyzeGraph(graph);
        setGraphAnalytics(analytics);
      } else {
        setProcessedDataStats(null);
        setGraphAnalytics(null);
        setProcessedGraph(null); // Reset processed graph
      }
      
      if (activeTab === 'data') {
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('Error processing loaded data:', err);
      setError('Failed to process loaded data');
      setIsLoading(false);
    }
  }, [activeTab]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
    setJsonldData(null);
  }, []);

  const exportData = useCallback(() => {
    if (!jsonldData) return;
    
    const dataStr = JSON.stringify(jsonldData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jsonld-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [jsonldData]);

  const shareData = useCallback(async () => {
    if (!jsonldData) return;
    
    try {
      await navigator.share({
        title: 'JSON-LD Data',
        text: 'Check out this JSON-LD data visualization',
        url: window.location.href
      });
    } catch {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [jsonldData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white"
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-8 w-8" />
              <h1 className="text-5xl font-black tracking-tight">
                JSON-LD Explorer
              </h1>
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Discover, analyze, and visualize semantic data with cutting-edge tools. 
              Unlock insights from structured data like never before.
            </p>
            
            {/* Quick Stats Bar */}
            {metrics && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4 mt-6"
              >
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Target className="h-4 w-4 mr-2" />
                  {metrics.totalObjects} Objects
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Network className="h-4 w-4 mr-2" />
                  {metrics.uniqueTypes} Types
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Globe className="h-4 w-4 mr-2" />
                  {metrics.relationships} Relations
                </Badge>
              </motion.div>
            )}

            {/* Action Buttons */}
            {jsonldData && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center gap-4 mt-6"
              >
                <Button 
                  onClick={exportData}
                  variant="secondary" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={shareData}
                  variant="secondary" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* View Mode Selector */}
        {jsonldData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <div className="inline-flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border">
              {[
                { key: 'explore', label: 'Explore', icon: Eye },
                { key: 'analyze', label: 'Analyze', icon: BarChart3 },
                { key: 'visualize', label: 'Visualize', icon: Network }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  onClick={() => setViewMode(key as typeof viewMode)}
                  variant={viewMode === key ? "default" : "ghost"}
                  className={`relative px-6 py-3 ${
                    viewMode === key 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoading && !jsonldData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-16"
          >
            <Card className="p-8 text-center max-w-md mx-auto">
              <CardContent className="space-y-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Loading Career Data</h3>
                  <p className="text-muted-foreground">
                    Fetching and analyzing JSON-LD structure...
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-white dark:bg-slate-800 shadow-lg rounded-xl">
              <TabsTrigger value="data" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 py-3">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="graph" className="flex items-center gap-2 py-3">
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Graph</span>
              </TabsTrigger>
              <TabsTrigger value="schema" className="flex items-center gap-2 py-3">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Schema</span>
              </TabsTrigger>
              <TabsTrigger value="relations" className="flex items-center gap-2 py-3">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Relations</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 py-3">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-6">
              <DataLoader onDataLoad={handleDataLoad} onError={handleError} />
              {jsonldData && (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Raw JSON-LD Data
                    </CardTitle>
                    <CardDescription>
                      Interactive JSON viewer with syntax highlighting and collapsible nodes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <JsonViewer data={jsonldData} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              {processedDataStats && graphAnalytics ? (
                <StatsPanel dataStats={processedDataStats} graphAnalytics={graphAnalytics} />
              ) : (
                <Card className="p-12 text-center">
                  <CardContent>
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Data Loaded</h3>
                    <p className="text-muted-foreground">
                      Load JSON-LD data to see comprehensive analytics and insights.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {jsonldData ? (
                <AdvancedAnalytics data={jsonldData} />
              ) : (
                <Card className="p-12 text-center">
                  <CardContent>
                    <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                    <p className="text-muted-foreground">
                      Load data to explore advanced analytics and statistical insights.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="graph" className="space-y-6">
              {processedGraph ? ( // Use processedGraph here
                <GraphVisualization graph={processedGraph} />
              ) : (
                <Card className="p-12 text-center">
                  <CardContent>
                    <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Interactive Graph</h3>
                    <p className="text-muted-foreground">
                      Load data to explore interactive network visualizations.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="schema" className="space-y-6">
              {jsonldData ? (
                <SchemaExplorer data={jsonldData} />
              ) : (
                <Card className="p-12 text-center">
                  <CardContent>
                    <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Schema Explorer</h3>
                    <p className="text-muted-foreground">
                      Load data to explore schema structure and semantic relationships.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="relations" className="space-y-6">
              {jsonldData ? (
                <RelationshipMatrix data={jsonldData} />
              ) : (
                <Card className="p-12 text-center">
                  <CardContent>
                    <Zap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Relationship Matrix</h3>
                    <p className="text-muted-foreground">
                      Load data to explore entity relationships and connections.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {jsonldData ? (
                <SemanticInsights data={jsonldData} />
              ) : (
                <Card className="p-12 text-center">
                  <CardContent>
                    <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Semantic Insights</h3>
                    <p className="text-muted-foreground">
                      Load data to discover semantic patterns and AI-powered insights.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
