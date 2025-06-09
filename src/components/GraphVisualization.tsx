import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings, Maximize2, RotateCcw, Palette, Filter,
  Eye, EyeOff, Zap, Target, Network, Minimize2, Download
} from 'lucide-react';
import { Graph, VisualizationMode } from '@/types';

interface GraphVisualizationProps {
  graph: Graph;
}

const VISUALIZATION_MODES: VisualizationMode[] = [
  { id: 'force2d', name: 'Force Layout 2D', description: 'Interactive force-directed graph', dimension: '2D', type: 'force' },
  { id: 'force3d', name: 'Force Layout 3D', description: 'Three-dimensional force graph', dimension: '3D', type: 'force' },
  { id: 'circular', name: 'Circular Layout', description: 'Nodes arranged in circles by type', dimension: '2D', type: 'circular' },
  { id: 'hierarchy', name: 'Hierarchical Layout', description: 'Tree-like hierarchical structure', dimension: '2D', type: 'hierarchy' }
];

export function GraphVisualization({ graph }: GraphVisualizationProps) {
  const [currentMode, setCurrentMode] = useState<VisualizationMode>(VISUALIZATION_MODES[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeSize, setNodeSize] = useState([8]);
  const [linkOpacity, setLinkOpacity] = useState([0.6]);
  const [showLabels, setShowLabels] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: isFullscreen ? window.innerWidth - 40 : rect.width - 40,
          height: isFullscreen ? window.innerHeight - 140 : 600
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exportGraph = () => {
    if (graphRef.current) {
      const canvas = graphRef.current.canvas();
      const link = document.createElement('a');
      link.download = `graph-visualization-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const processedGraph = useMemo(() => {
    if (currentMode.type === 'circular') {
      const nodesByType = graph.nodes.reduce((acc, node) => {
        const type = node.type || 'Unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
      }, {} as Record<string, any[]>);

      const processedNodes = graph.nodes.map((node, index) => {
        const type = node.type || 'Unknown';
        const typeNodes = nodesByType[type];
        const typeIndex = typeNodes.findIndex(n => n.id === node.id);
        const typeAngle = (typeIndex / typeNodes.length) * 2 * Math.PI;
        const typeRadius = Object.keys(nodesByType).indexOf(type) * 100 + 50;
        
        return {
          ...node,
          fx: Math.cos(typeAngle) * typeRadius,
          fy: Math.sin(typeAngle) * typeRadius,
          size: (node.size || 5) * nodeSize[0] / 8
        };
      });

      return { nodes: processedNodes, links: graph.links };
    }

    if (currentMode.type === 'hierarchy') {
      // Simple hierarchy based on node degree
      const degrees = graph.nodes.map(node => ({
        ...node,
        degree: graph.links.filter(link => 
          (typeof link.source === 'string' ? link.source : link.source.id) === node.id ||
          (typeof link.target === 'string' ? link.target : link.target.id) === node.id
        ).length
      }));

      const processedNodes = degrees.map((node, index) => ({
        ...node,
        fy: node.degree * -30, // Higher degree nodes go up
        size: (node.size || 5) * nodeSize[0] / 8
      }));

      return { nodes: processedNodes, links: graph.links };
    }

    return {
      nodes: graph.nodes.map(node => ({
        ...node,
        size: (node.size || 5) * nodeSize[0] / 8
      })),
      links: graph.links
    };
  }, [graph, currentMode, nodeSize]);

  const handleNodeHover = useCallback((node: any) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    const neighbors = new Set();
    const linkIds = new Set();

    graph.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;

      if (sourceId === node.id) {
        neighbors.add(targetId);
        linkIds.add(`${sourceId}-${targetId}`);
      }
      if (targetId === node.id) {
        neighbors.add(sourceId);
        linkIds.add(`${sourceId}-${targetId}`);
      }
    });

    neighbors.add(node.id);
    setHighlightNodes(neighbors);
    setHighlightLinks(linkIds);
  }, [graph.links]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const size = node.size || 5;
    const isHighlighted = highlightNodes.has(node.id);
    
    // Draw node
    ctx.fillStyle = node.color || '#69b3a2';
    ctx.globalAlpha = isHighlighted ? 1 : 0.8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fill();

    // Draw border for highlighted nodes
    if (isHighlighted) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw label
    if (showLabels && (isHighlighted || size > 6)) {
      ctx.fillStyle = '#333';
      ctx.font = `${Math.max(10, size / 2)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 1;
      ctx.fillText(node.name, node.x, node.y + size + 12);
    }
    
    ctx.globalAlpha = 1;
  }, [highlightNodes, showLabels]);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    if (!showLinks) return;

    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const linkId = `${sourceId}-${targetId}`;
    const isHighlighted = highlightLinks.has(linkId);

    ctx.strokeStyle = link.color || (isHighlighted ? '#ff6b6b' : '#ccc');
    ctx.lineWidth = isHighlighted ? 3 : 1;
    ctx.globalAlpha = isHighlighted ? 1 : linkOpacity[0];
    
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  }, [showLinks, linkOpacity, highlightLinks]);

  const renderVisualization = () => {
    const commonProps = {
      ref: graphRef,
      graphData: processedGraph,
      onNodeHover: handleNodeHover,
      onNodeClick: handleNodeClick,
      linkVisibility: showLinks,
      nodeLabel: 'name',
      nodeAutoColorBy: 'type',
      linkAutoColorBy: 'type',
      backgroundColor: 'rgba(0,0,0,0)',
      width: dimensions.width,
      height: dimensions.height
    };

    if (currentMode.dimension === '3D') {
      return (
        <ForceGraph3D
          {...commonProps}
          nodeThreeObject={(node: any) => {
            const geometry = new (window as any).THREE.SphereGeometry(node.size || 5);
            const material = new (window as any).THREE.MeshLambertMaterial({ 
              color: node.color || '#69b3a2',
              transparent: true,
              opacity: highlightNodes.has(node.id) ? 1 : 0.8
            });
            return new (window as any).THREE.Mesh(geometry, material);
          }}
          linkOpacity={linkOpacity[0]}
          showNavInfo={false}
          controlType="orbit"
        />
      );
    }

    return (
      <ForceGraph2D
        {...commonProps}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        cooldownTicks={100}
        onEngineStop={() => setHighlightNodes(new Set())}
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
      />
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Mode Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Graph Visualization
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportGraph}
                  disabled={!graphRef.current}
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {VISUALIZATION_MODES.map((mode) => (
                <Button
                  key={mode.id}
                  variant={currentMode.id === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentMode(mode)}
                  className="flex items-center gap-2"
                >
                  <Badge variant="secondary" className="text-xs">
                    {mode.dimension}
                  </Badge>
                  {mode.name}
                </Button>
              ))}
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border rounded-lg p-4 space-y-4 mb-4 bg-muted/50"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Node Size: {nodeSize[0]}</Label>
                      <Slider
                        value={nodeSize}
                        onValueChange={setNodeSize}
                        max={20}
                        min={2}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Link Opacity: {linkOpacity[0].toFixed(1)}</Label>
                      <Slider
                        value={linkOpacity}
                        onValueChange={setLinkOpacity}
                        max={1}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-labels"
                        checked={showLabels}
                        onCheckedChange={setShowLabels}
                      />
                      <Label htmlFor="show-labels" className="text-sm">
                        Show Labels
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-links"
                        checked={showLinks}
                        onCheckedChange={setShowLinks}
                      />
                      <Label htmlFor="show-links" className="text-sm">
                        Show Links
                      </Label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visualization Container */}
            <div 
              ref={containerRef}
              className="relative border rounded-lg overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
            >
              <div className="flex items-center justify-center" style={{ minHeight: `${dimensions.height}px` }}>
                {renderVisualization()}
              </div>
              
              {/* Info Overlay */}
              <div className="absolute top-4 left-4 space-y-2">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                  {processedGraph.nodes.length} nodes, {processedGraph.links.length} links
                </Badge>
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                  {currentMode.name}
                </Badge>
              </div>

              {/* Controls Overlay */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-background/90 backdrop-blur-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Node Info Panel */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    className="absolute bottom-4 right-4 w-72 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Node Details</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNode(null)}
                      >
                        ×
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {selectedNode.name}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {selectedNode.type}
                      </div>
                      <div>
                        <span className="font-medium">ID:</span> 
                        <span className="text-xs text-muted-foreground ml-1">
                          {selectedNode.id.length > 40 ? selectedNode.id.substring(0, 40) + '...' : selectedNode.id}
                        </span>
                      </div>
                      {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                        <div>
                          <span className="font-medium">Properties:</span>
                          <div className="mt-1 max-h-32 overflow-y-auto">
                            {Object.entries(selectedNode.properties)
                              .filter(([key]) => !key.startsWith('@'))
                              .slice(0, 5)
                              .map(([key, value]) => (
                                <div key={key} className="text-xs text-muted-foreground">
                                  <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}...
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>{currentMode.description}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span>💡 Hover over nodes to highlight connections</span>
                <span>🖱️ Click nodes for details</span>
                <span>⌨️ Press ESC to exit fullscreen</span>
                {currentMode.dimension === '3D' && <span>🔄 Drag to rotate view</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full w-full flex flex-col">
              {/* Fullscreen Header */}
              <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <Network className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Graph Visualization - Fullscreen</h2>
                  <Badge variant="outline">{currentMode.name}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportGraph}
                    disabled={!graphRef.current}
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                  >
                    <Minimize2 className="w-4 h-4" />
                    Exit Fullscreen
                  </Button>
                </div>
              </div>

              {/* Fullscreen Settings */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b p-4 bg-muted/30"
                  >
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="space-y-2">
                        <Label className="text-sm">Visualization Mode</Label>
                        <div className="flex gap-1">
                          {VISUALIZATION_MODES.map((mode) => (
                            <Button
                              key={mode.id}
                              variant={currentMode.id === mode.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentMode(mode)}
                            >
                              {mode.dimension}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Node Size: {nodeSize[0]}</Label>
                        <Slider
                          value={nodeSize}
                          onValueChange={setNodeSize}
                          max={20}
                          min={2}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Link Opacity: {linkOpacity[0].toFixed(1)}</Label>
                        <Slider
                          value={linkOpacity}
                          onValueChange={setLinkOpacity}
                          max={1}
                          min={0.1}
                          step={0.1}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="fullscreen-show-labels"
                          checked={showLabels}
                          onCheckedChange={setShowLabels}
                        />
                        <Label htmlFor="fullscreen-show-labels" className="text-sm">
                          Show Labels
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="fullscreen-show-links"
                          checked={showLinks}
                          onCheckedChange={setShowLinks}
                        />
                        <Label htmlFor="fullscreen-show-links" className="text-sm">
                          Show Links
                        </Label>
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="block text-center">
                          {processedGraph.nodes.length} nodes
                        </Badge>
                        <Badge variant="outline" className="block text-center">
                          {processedGraph.links.length} links
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fullscreen Visualization */}
              <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="h-full w-full flex items-center justify-center">
                  {renderVisualization()}
                </div>

                {/* Fullscreen Node Info Panel */}
                <AnimatePresence>
                  {selectedNode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute top-4 right-4 w-80 bg-background/95 backdrop-blur-sm border rounded-lg p-6 shadow-xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">Node Details</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedNode(null)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> 
                          <p className="text-base font-semibold">{selectedNode.name}</p>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> 
                          <Badge variant="secondary" className="ml-2">{selectedNode.type}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">ID:</span>
                          <p className="text-xs text-muted-foreground break-all">
                            {selectedNode.id}
                          </p>
                        </div>
                        {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                          <div>
                            <span className="font-medium">Properties:</span>
                            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                              {Object.entries(selectedNode.properties)
                                .filter(([key]) => !key.startsWith('@'))
                                .slice(0, 8)
                                .map(([key, value]) => (
                                  <div key={key} className="text-xs bg-muted/50 p-2 rounded">
                                    <span className="font-medium text-foreground">{key}:</span>
                                    <p className="text-muted-foreground mt-1">
                                      {String(value).substring(0, 100)}
                                      {String(value).length > 100 ? '...' : ''}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}