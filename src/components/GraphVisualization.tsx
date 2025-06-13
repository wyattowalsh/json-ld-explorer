import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, 
  Network, GitBranch, Share2, Target
} from 'lucide-react';
import { Graph } from '@/types';
import { cn } from '@/lib/utils';

interface GraphVisualizationProps {
  graph: Graph;
  className?: string;
}

export const GraphVisualization = memo(({ graph, className }: GraphVisualizationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('w-full', className)}
    >
      <Card className="border-2 border-slate-200/60 dark:border-slate-700/60 shadow-xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Graph Visualization
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Interactive JSON-LD relationship explorer
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <GitBranch className="h-3 w-3 mr-1" />
                {graph.nodes.length} nodes
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <Share2 className="h-3 w-3 mr-1" />
                {graph.links.length} links
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t border-slate-200/60 dark:border-slate-700/60">
            {/* Controls */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Zoom In
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <ZoomOut className="h-4 w-4 mr-1" />
                    Zoom Out
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button variant="outline" size="sm" className="h-8">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <Target className="h-4 w-4 mr-1" />
                    Center
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="h-8">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <Maximize2 className="h-4 w-4 mr-1" />
                    Fullscreen
                  </Button>
                </div>
              </div>
            </div>

            {/* Graph Container */}
            <div className="relative h-[600px] bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
              {graph.nodes.length > 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Network className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                      Graph Visualization Ready
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      {graph.nodes.length} nodes, {graph.links.length} relationships
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Network className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                      No Graph Data
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Load JSON-LD data to visualize relationships
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

GraphVisualization.displayName = 'GraphVisualization';
