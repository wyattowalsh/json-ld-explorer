import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, Network, Database, TrendingUp, 
  Download, Share, RefreshCw, Sparkles, ChevronDown, ChevronUp,
  Zap, Target, GitBranch, Users
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

  const handleDataLoad = useCallback((loadedData: JSONLDData | JSONLDData[]) => {
    setIsLoading(true);
    setProcessingState('processing');

    try {
      console.log('Processing loaded data:', loadedData);

      // Validate data before processing
      if (!loadedData) {
        throw new Error('No data provided');
      }

      const processor = new JSONLDProcessor();
      const processedGraph = processor.processJSONLD(loadedData);

      console.log('Generated graph:', processedGraph);
      console.log('Graph nodes count:', processedGraph.nodes?.length || 0);
      console.log('Graph links count:', processedGraph.links?.length || 0);
      
      const stats = processor.generateDataStats(loadedData);

      console.log('Generated stats:', stats);

      // Validate graph structure
      if (!processedGraph || !processedGraph.nodes || !Array.isArray(processedGraph.nodes)) {
        throw new Error('Invalid graph structure generated');
      }

      if (processedGraph.nodes.length === 0) {
        throw new Error('No nodes generated from data');
      }

      const analyticsEngine = new GraphAnalyticsEngine();
      const analytics = analyticsEngine.analyzeGraph(processedGraph);

      setData(loadedData);
      setGraph(processedGraph);
      setDataStats(stats);
      setGraphAnalytics(analytics);
      setProcessingState('complete');

      toast({
        title: "Data processed successfully",
        description: `Generated ${processedGraph.nodes.length} nodes and ${processedGraph.links?.length || 0} links`,
      });

    } catch (error) {
      console.error('Error processing data:', error);
      setProcessingState('idle');
      setData(null);
      setGraph(null);
      setDataStats(null);
      setGraphAnalytics(null);
      toast({
        title: "Error processing data",
        description: error instanceof Error ? error.message : "Failed to process data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-conic from-transparent via-blue-500 to-transparent opacity-20"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-purple-400/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-blue-400/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-indigo-400/15 to-transparent rounded-full blur-2xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="container-fluid space-y-fluid-md relative z-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-fluid-sm py-fluid-lg"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <motion.div 
              className="p-3 sm:p-4 bg-gradient-primary rounded-2xl sm:rounded-3xl shadow-glow hover:shadow-glow-lg transition-all duration-300 hover-scale"
              whileHover={{ rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Network className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </motion.div>
            <div className="text-center sm:text-left">
              <h1 className="text-fluid-3xl sm:text-fluid-4xl font-display font-bold gradient-text">
                JSON-LD Graph Explorer
              </h1>
              <p className="text-fluid-base text-muted-foreground max-w-2xl mx-auto sm:mx-0 leading-relaxed">
                Visualize and explore your linked data with advanced graph algorithms and interactive controls
              </p>
            </div>
          </div>
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

        {/* Main Content Area */}
        <AnimatePresence>
          {graph && dataStats && graphAnalytics && processingState === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Enhanced Quick Stats Bar */}
              <Card className="glass-strong border-glass-border rounded-2xl shadow-glass hover:shadow-glass-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  {/* Mobile Layout */}
                  <div className="block lg:hidden space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <motion.div 
                        className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/20 hover-scale"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold">{graph.nodes.length} Entities</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/20 hover-scale"
                        whileHover={{ scale: 1.02 }}
                      >
                        <GitBranch className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold">{graph.links.length} Links</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/20 hover-scale"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Database className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold">{Object.keys(dataStats.entityTypes).length} Types</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/20 hover-scale"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold">{(graphAnalytics.density * 100).toFixed(1)}%</span>
                      </motion.div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStats(!showStats)}
                        className="glass border-glass-border hover:bg-white/20 flex-1"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                        {showStats ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:flex items-center justify-between">
                    <div className="flex items-center gap-6 xl:gap-8">
                      <motion.div 
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/20 hover-scale"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-lg">{graph.nodes.length}</p>
                          <p className="text-xs text-muted-foreground">Entities</p>
                        </div>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/20 hover-scale"
                        whileHover={{ scale: 1.02 }}
                      >
                        <GitBranch className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="font-semibold text-lg">{graph.links.length}</p>
                          <p className="text-xs text-muted-foreground">Relationships</p>
                        </div>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/20 hover-scale"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Database className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-semibold text-lg">{Object.keys(dataStats.entityTypes).length}</p>
                          <p className="text-xs text-muted-foreground">Entity Types</p>
                        </div>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/20 hover-scale"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Target className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-lg">{(graphAnalytics.density * 100).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Graph Density</p>
                        </div>
                      </motion.div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStats(!showStats)}
                        className="glass border-glass-border hover:bg-white/20 hover-glow"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Advanced Analytics
                        {showStats ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Graph Visualization - Hero Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative"
              >
                <GraphVisualization graph={graph} />
              </motion.div>

              {/* Expandable Analytics Panel */}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <Card className="w-96 glass-strong border-glass-border shadow-glass-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="p-2 bg-gradient-primary rounded-xl"
                      >
                        <Zap className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold">Processing Data...</h3>
                        <p className="text-sm text-muted-foreground">
                          {processingState === 'processing' 
                            ? 'Analyzing your JSON-LD data and building the graph...'
                            : 'Loading and validating data...'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Processing Steps */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Processing Steps</span>
                        <span className="capitalize">{processingState}</span>
                      </div>
                      <div className="flex space-x-1">
                        <motion.div 
                          className={`h-2 w-8 rounded ${processingState !== 'idle' ? 'bg-gradient-primary' : 'bg-muted'}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                        />
                        <motion.div 
                          className={`h-2 w-8 rounded ${processingState === 'processing' || processingState === 'complete' ? 'bg-gradient-primary' : 'bg-muted'}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 }}
                        />
                        <motion.div 
                          className={`h-2 w-8 rounded ${processingState === 'complete' ? 'bg-gradient-success' : 'bg-muted'}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Welcome State */}
        {!data && processingState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-fluid-xl"
          >
            <div className="space-y-fluid-lg max-w-4xl mx-auto">
              <motion.div 
                className="mx-auto w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-primary rounded-3xl sm:rounded-4xl flex items-center justify-center shadow-glow animate-float hover-glow"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white" />
              </motion.div>
              <div className="space-y-4 px-4">
                <h2 className="text-fluid-2xl font-display font-bold gradient-text">Ready to Explore Your Data</h2>
                <p className="text-fluid-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Upload your JSON-LD data above to start visualizing your linked data graph with beautiful, interactive visualizations and advanced analytics.
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto px-4">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge variant="outline" className="glass border-glass-border hover-scale text-xs sm:text-sm p-2 sm:p-3">
                    Interactive 2D/3D Views
                  </Badge>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge variant="outline" className="glass border-glass-border hover-scale text-xs sm:text-sm p-2 sm:p-3">
                    Rich Hover Metadata
                  </Badge>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge variant="outline" className="glass border-glass-border hover-scale text-xs sm:text-sm p-2 sm:p-3">
                    Relationship Mapping
                  </Badge>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge variant="outline" className="glass border-glass-border hover-scale text-xs sm:text-sm p-2 sm:p-3">
                    Advanced Analytics
                  </Badge>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}