import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, Network, Database, TrendingUp, 
  Download, Share, RefreshCw, Sparkles
} from 'lucide-react';
import { DataLoader } from './DataLoader';
import { StatsPanel } from './StatsPanel';
import { GraphVisualization } from './GraphVisualization';
import { JSONLDProcessor } from '@/utils/dataProcessing';
import { GraphAnalyticsEngine } from '@/utils/graphAnalytics';
import { JSONLDData, Graph, DataStats, GraphAnalytics } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function Dashboard() {
  const [data, setData] = useState<JSONLDData | JSONLDData[] | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [graphAnalytics, setGraphAnalytics] = useState<GraphAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'complete'>('idle');
  const { toast } = useToast();

  const processData = async (jsonldData: JSONLDData | JSONLDData[]) => {
    setIsLoading(true);
    setProcessingState('processing');
    
    try {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const processor = new JSONLDProcessor(jsonldData);
      const processedGraph = processor.getGraph();
      const stats = processor.getDataStats();
      
      const analyticsEngine = new GraphAnalyticsEngine(processedGraph);
      const analytics = analyticsEngine.calculateAnalytics();
      
      setData(jsonldData);
      setGraph(processedGraph);
      setDataStats(stats);
      setGraphAnalytics(analytics);
      setProcessingState('complete');
      
      toast({
        title: "Data processed successfully",
        description: `Generated graph with ${processedGraph.nodes.length} nodes and ${processedGraph.links.length} connections`,
      });
    } catch (error) {
      console.error('Error processing data:', error);
      toast({
        title: "Processing error",
        description: "Failed to process the JSON-LD data",
        variant: "destructive",
      });
      setProcessingState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!graph || !dataStats || !graphAnalytics) return;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      graph,
      dataStats,
      graphAnalytics,
      metadata: {
        nodeCount: graph.nodes.length,
        linkCount: graph.links.length,
        density: graphAnalytics.density,
        clustering: graphAnalytics.clustering
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jsonld-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Analysis data has been downloaded",
    });
  };

  const handleReset = () => {
    setData(null);
    setGraph(null);
    setDataStats(null);
    setGraphAnalytics(null);
    setProcessingState('idle');
    
    toast({
      title: "Data cleared",
      description: "Ready to load new data",
    });
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
        <div className="container mx-auto px-4 py-8">
          <DataLoader onDataLoaded={processData} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <Database className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  JSON-LD Explorer
                </h1>
                <p className="text-muted-foreground">
                  Advanced data analytics and visualization
                </p>
              </div>
            </motion.div>
            <AnimatePresence>
              {processingState === 'complete' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Analysis Complete
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!graph}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </motion.div>

        {/* Processing State */}
        <AnimatePresence>
          {processingState === 'processing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-8"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                    />
                    <div>
                      <p className="font-medium">Processing JSON-LD data...</p>
                      <p className="text-sm text-muted-foreground">
                        Analyzing structure, calculating graph metrics, and preparing visualizations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <AnimatePresence>
          {graph && dataStats && graphAnalytics && processingState === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="visualization" className="flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    Visualization
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <StatsPanel dataStats={dataStats} graphAnalytics={graphAnalytics} />
                </TabsContent>

                <TabsContent value="visualization" className="space-y-6">
                  <GraphVisualization graph={graph} />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Advanced Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Centrality Analysis</h3>
                            <div className="space-y-2">
                              {Object.entries(graphAnalytics.centralityMeasures.betweenness)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([nodeId, value]) => (
                                  <div key={nodeId} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                    <span className="text-sm font-medium truncate">
                                      {nodeId.length > 30 ? nodeId.substring(0, 30) + '...' : nodeId}
                                    </span>
                                    <Badge variant="secondary">{value.toFixed(3)}</Badge>
                                  </div>
                                ))}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Community Structure</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-4 bg-muted/50 rounded">
                                <p className="text-2xl font-bold">
                                  {new Set(Object.values(graphAnalytics.communities)).size}
                                </p>
                                <p className="text-sm text-muted-foreground">Communities</p>
                              </div>
                              <div className="text-center p-4 bg-muted/50 rounded">
                                <p className="text-2xl font-bold">
                                  {(graphAnalytics.clustering * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-muted-foreground">Clustering</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}