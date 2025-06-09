
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, Network, Database, TrendingUp, 
  Download, Share, RefreshCw, Sparkles, ChevronDown, ChevronUp
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
  const [showStats, setShowStats] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();

  const handleDataLoad = async (loadedData: JSONLDData | JSONLDData[]) => {
    try {
      setIsLoading(true);
      setProcessingState('processing');
      setData(loadedData);

      console.log('Processing loaded data:', loadedData);

      // Process the data
      const processor = new JSONLDProcessor();
      const processedGraph = processor.processJSONLD(loadedData);
      
      console.log('Generated graph:', processedGraph);
      
      if (!processedGraph || !processedGraph.nodes || !processedGraph.links) {
        throw new Error('Failed to generate valid graph from data');
      }

      const stats = processor.generateDataStats(loadedData);

      // Generate analytics only if we have a valid graph
      const analyticsEngine = new GraphAnalyticsEngine();
      const analytics = analyticsEngine.analyzeGraph(processedGraph);

      setGraph(processedGraph);
      setDataStats(stats);
      setGraphAnalytics(analytics);
      setProcessingState('complete');

      toast({
        title: "Data processed successfully!",
        description: `Generated graph with ${processedGraph.nodes.length} nodes and ${processedGraph.links.length} links.`,
      });
    } catch (error) {
      console.error('Error processing data:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "There was an error processing your JSON-LD data.",
        variant: "destructive",
      });
      setProcessingState('idle');
      setData(null);
      setGraph(null);
      setDataStats(null);
      setGraphAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <Network className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              JSON-LD Graph Explorer
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visualize and explore your linked data with advanced graph algorithms and interactive controls
          </p>
        </motion.div>

        {/* Data Loader */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DataLoader 
            onDataLoaded={handleDataLoad} 
            isLoading={isLoading}
            processingState={processingState}
          />
        </motion.div>

        {/* Main Visualization Area */}
        <AnimatePresence>
          {graph && dataStats && graphAnalytics && processingState === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Quick Stats Bar */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Network className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">{graph.nodes.length} Nodes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Share className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold">{graph.links.length} Links</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold">{Object.keys(dataStats.entityTypes).length} Types</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">Density: {(graphAnalytics.density * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStats(!showStats)}
                        className="bg-white/80"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Stats
                        {showStats ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="bg-white/80"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analytics
                        {showAnalytics ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Expandable Stats Panel */}
              <AnimatePresence>
                {showStats && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StatsPanel dataStats={dataStats} graphAnalytics={graphAnalytics} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expandable Analytics Panel */}
              <AnimatePresence>
                {showAnalytics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
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
                )}
              </AnimatePresence>

              {/* Main Graph Visualization - Full Width and Prominent */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative"
              >
                <GraphVisualization graph={graph} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <Card className="w-96">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-6 h-6 text-blue-600" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold">Processing Data...</h3>
                      <p className="text-sm text-muted-foreground">
                        {processingState === 'processing' 
                          ? 'Analyzing your JSON-LD data and building the graph...'
                          : 'Loading...'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome State */}
        {!data && processingState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <div className="space-y-6">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-muted-foreground">Ready to Explore</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Upload your JSON-LD data above to start visualizing your linked data graph with advanced analytics and interactive controls.
                </p>
              </div>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">Multiple Layout Algorithms</Badge>
                <Badge variant="outline">3D Visualization</Badge>
                <Badge variant="outline">Advanced Analytics</Badge>
                <Badge variant="outline">Interactive Navigation</Badge>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
