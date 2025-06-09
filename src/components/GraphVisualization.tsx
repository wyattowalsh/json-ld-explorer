import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

// Ensure THREE is available globally for ForceGraph3D
if (typeof window !== 'undefined') {
  (window as any).THREE = THREE;
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings, Maximize2, RotateCcw, Palette, Filter,
  Eye, EyeOff, Zap, Target, Network, Minimize2, Download,
  Move, RotateCw, ZoomIn, ZoomOut, MousePointer, Keyboard,
  Navigation, Info, Hand, Grab
} from 'lucide-react';
import { Graph, VisualizationMode } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GraphVisualizationProps {
  graph: Graph;
}

const VISUALIZATION_MODES: VisualizationMode[] = [
  { id: 'force2d', name: 'Force Layout 2D', description: 'Interactive force-directed graph', dimension: '2D', type: 'force' },
  { id: 'force3d', name: 'Force Layout 3D', description: 'Three-dimensional force graph', dimension: '3D', type: 'force' },
  { id: 'circular', name: 'Circular Layout', description: 'Nodes arranged in circles by type', dimension: '2D', type: 'circular' },
  { id: 'hierarchy', name: 'Hierarchical Layout', description: 'Tree-like hierarchical structure', dimension: '2D', type: 'hierarchy' },
  { id: 'radial', name: 'Radial Layout', description: 'Radial tree layout from center', dimension: '2D', type: 'radial' },
  { id: 'grid', name: 'Grid Layout', description: 'Organized grid-based positioning', dimension: '2D', type: 'grid' },
  { id: 'spiral', name: 'Spiral Layout', description: 'Spiral arrangement by connectivity', dimension: '2D', type: 'spiral' },
  { id: 'cluster', name: 'Cluster Layout', description: 'Community-based clustering', dimension: '2D', type: 'cluster' },
  { id: 'arc', name: 'Arc Diagram', description: 'Linear nodes with arc connections', dimension: '2D', type: 'arc' },
  { id: 'matrix', name: 'Matrix View', description: 'Adjacency matrix representation', dimension: '2D', type: 'matrix' }
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
  const [showNavLegend, setShowNavLegend] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 300 });
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [navigationMode, setNavigationMode] = useState<'orbit' | 'fly' | 'pan'>('orbit');
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [cameraControl, setCameraControl] = useState<'trackball' | 'orbit' | 'fly'>('trackball');
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mobileHeight = mobile ? Math.min(window.innerHeight * 0.6, 500) : 600;
        setDimensions({
          width: isFullscreen ? window.innerWidth - 40 : rect.width - 40,
          height: isFullscreen ? window.innerHeight - 140 : mobileHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        return;
      }

      // Navigation shortcuts
      const moveSpeed = 20;
      const rotateSpeed = 0.1;
      const zoomSpeed = 0.1;

      switch (e.key.toLowerCase()) {
        case 'w': // Move forward/up
          if (currentMode.dimension === '3D') {
            setCameraPosition(prev => ({ ...prev, z: prev.z - moveSpeed }));
          } else {
            setPanOffset(prev => ({ ...prev, y: prev.y + moveSpeed }));
          }
          break;
        case 's': // Move backward/down
          if (currentMode.dimension === '3D') {
            setCameraPosition(prev => ({ ...prev, z: prev.z + moveSpeed }));
          } else {
            setPanOffset(prev => ({ ...prev, y: prev.y - moveSpeed }));
          }
          break;
        case 'a': // Move left
          if (currentMode.dimension === '3D') {
            setCameraPosition(prev => ({ ...prev, x: prev.x - moveSpeed }));
          } else {
            setPanOffset(prev => ({ ...prev, x: prev.x - moveSpeed }));
          }
          break;
        case 'd': // Move right
          if (currentMode.dimension === '3D') {
            setCameraPosition(prev => ({ ...prev, x: prev.x + moveSpeed }));
          } else {
            setPanOffset(prev => ({ ...prev, x: prev.x - moveSpeed }));
          }
          break;
        case 'q': // Move up (3D only)
          if (currentMode.dimension === '3D') {
            setCameraPosition(prev => ({ ...prev, y: prev.y + moveSpeed }));
          }
          break;
        case 'e': // Move down (3D only)
          if (currentMode.dimension === '3D') {
            setCameraPosition(prev => ({ ...prev, y: prev.y - moveSpeed }));
          }
          break;
        case 'arrowup': // Rotate up
          setCameraRotation(prev => ({ ...prev, x: prev.x - rotateSpeed }));
          e.preventDefault();
          break;
        case 'arrowdown': // Rotate down
          setCameraRotation(prev => ({ ...prev, x: prev.x + rotateSpeed }));
          e.preventDefault();
          break;
        case 'arrowleft': // Rotate left
          setCameraRotation(prev => ({ ...prev, y: prev.y - rotateSpeed }));
          e.preventDefault();
          break;
        case 'arrowright': // Rotate right
          setCameraRotation(prev => ({ ...prev, y: prev.y + rotateSpeed }));
          e.preventDefault();
          break;
        case 'z': // Roll left
          setCameraRotation(prev => ({ ...prev, z: prev.z - rotateSpeed }));
          break;
        case 'x': // Roll right
          setCameraRotation(prev => ({ ...prev, z: prev.z + rotateSpeed }));
          break;
        case '+':
        case '=': // Zoom in
          setZoom(prev => Math.min(prev + zoomSpeed, 5));
          break;
        case '-': // Zoom out
          setZoom(prev => Math.max(prev - zoomSpeed, 0.1));
          break;
        case 'r': // Reset view
          resetCamera();
          break;
        case 'h': // Toggle navigation help
          setShowNavLegend(!showNavLegend);
          break;
        case '1': // Orbit mode
          setNavigationMode('orbit');
          break;
        case '2': // Fly mode
          setNavigationMode('fly');
          break;
        case '3': // Pan mode
          setNavigationMode('pan');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [isFullscreen, currentMode, showNavLegend]);

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

  const resetCamera = () => {
    setCameraPosition({ x: 0, y: 0, z: 300 });
    setCameraRotation({ x: 0, y: 0, z: 0 });
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    if (graphRef.current) {
      if (currentMode.dimension === '3D') {
        graphRef.current.cameraPosition({ x: 0, y: 0, z: 300 }, { x: 0, y: 0, z: 0 }, 1000);
      } else {
        graphRef.current.zoom(1, 1000);
        graphRef.current.centerAt(0, 0, 1000);
      }
    }
  };

  const centerOnNode = (node: any) => {
    if (graphRef.current && node) {
      if (currentMode.dimension === '3D') {
        const distance = 300;
        graphRef.current.cameraPosition(
          { x: node.x + distance, y: node.y + distance, z: node.z + distance },
          node,
          2000
        );
      } else {
        graphRef.current.centerAt(node.x, node.y, 2000);
      }
    }
  };

  const processedGraph = useMemo(() => {
    const baseSize = (isMobile ? 6 : 8);
    
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
        const typeRadius = Object.keys(nodesByType).indexOf(type) * (isMobile ? 80 : 100) + 50;

        return {
          ...node,
          fx: Math.cos(typeAngle) * typeRadius,
          fy: Math.sin(typeAngle) * typeRadius,
          size: (node.size || 5) * nodeSize[0] / baseSize
        };
      });

      return { nodes: processedNodes, links: graph.links };
    }

    if (currentMode.type === 'hierarchy') {
      const degrees = graph.nodes.map(node => ({
        ...node,
        degree: graph.links.filter(link => 
          (typeof link.source === 'string' ? link.source : link.source.id) === node.id ||
          (typeof link.target === 'string' ? link.target : link.target.id) === node.id
        ).length
      }));

      const processedNodes = degrees.map((node, index) => ({
        ...node,
        fy: node.degree * (isMobile ? -20 : -30),
        size: (node.size || 5) * nodeSize[0] / baseSize
      }));

      return { nodes: processedNodes, links: graph.links };
    }

    if (currentMode.type === 'radial') {
      // Find central node (highest degree)
      const degrees = graph.nodes.map(node => {
        const degree = graph.links.filter(link => 
          (typeof link.source === 'string' ? link.source : link.source.id) === node.id ||
          (typeof link.target === 'string' ? link.target : link.target.id) === node.id
        ).length;
        return { ...node, degree };
      });

      const centralNode = degrees.reduce((max, node) => node.degree > max.degree ? node : max);
      const processedNodes = degrees.map((node, index) => {
        if (node.id === centralNode.id) {
          return { ...node, fx: 0, fy: 0, size: (node.size || 5) * nodeSize[0] / baseSize };
        }
        
        const angle = (index / graph.nodes.length) * 2 * Math.PI;
        const radius = node.degree === 0 ? (isMobile ? 120 : 150) : (isMobile ? 80 : 100);
        
        return {
          ...node,
          fx: Math.cos(angle) * radius,
          fy: Math.sin(angle) * radius,
          size: (node.size || 5) * nodeSize[0] / baseSize
        };
      });

      return { nodes: processedNodes, links: graph.links };
    }

    if (currentMode.type === 'grid') {
      const gridSize = Math.ceil(Math.sqrt(graph.nodes.length));
      const spacing = isMobile ? 60 : 80;
      
      const processedNodes = graph.nodes.map((node, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        
        return {
          ...node,
          fx: (col - gridSize / 2) * spacing,
          fy: (row - gridSize / 2) * spacing,
          size: (node.size || 5) * nodeSize[0] / baseSize
        };
      });

      return { nodes: processedNodes, links: graph.links };
    }

    if (currentMode.type === 'spiral') {
      const processedNodes = graph.nodes.map((node, index) => {
        const angle = index * 0.5;
        const radius = Math.sqrt(index) * (isMobile ? 8 : 10);
        
        return {
          ...node,
          fx: Math.cos(angle) * radius,
          fy: Math.sin(angle) * radius,
          size: (node.size || 5) * nodeSize[0] / baseSize
        };
      });

      return { nodes: processedNodes, links: graph.links };
    }

    if (currentMode.type === 'cluster') {
      // Simple clustering by type
      const nodesByType = graph.nodes.reduce((acc, node) => {
        const type = node.type || 'Unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
      }, {} as Record<string, any[]>);

      const types = Object.keys(nodesByType);
      const processedNodes = graph.nodes.map((node) => {
        const type = node.type || 'Unknown';
        const typeIndex = types.indexOf(type);
        const typeNodes = nodesByType[type];
        const nodeIndex = typeNodes.findIndex(n => n.id === node.id);
        
        const clusterAngle = (typeIndex / types.length) * 2 * Math.PI;
        const clusterRadius = isMobile ? 100 : 150;
        const nodeAngle = (nodeIndex / typeNodes.length) * 2 * Math.PI;
        const nodeRadius = isMobile ? 30 : 40;
        
        const clusterX = Math.cos(clusterAngle) * clusterRadius;
        const clusterY = Math.sin(clusterAngle) * clusterRadius;
        const nodeX = Math.cos(nodeAngle) * nodeRadius;
        const nodeY = Math.sin(nodeAngle) * nodeRadius;
        
        return {
          ...node,
          fx: clusterX + nodeX,
          fy: clusterY + nodeY,
          size: (node.size || 5) * nodeSize[0] / baseSize
        };
      });

      return { nodes: processedNodes, links: graph.links };
    }

    if (currentMode.type === 'arc') {
      const spacing = isMobile ? 40 : 60;
      const processedNodes = graph.nodes.map((node, index) => ({
        ...node,
        fx: (index - graph.nodes.length / 2) * spacing,
        fy: 0,
        size: (node.size || 5) * nodeSize[0] / baseSize
      }));

      return { nodes: processedNodes, links: graph.links };
    }

    return {
      nodes: graph.nodes.map(node => ({
        ...node,
        size: (node.size || 5) * nodeSize[0] / baseSize
      })),
      links: graph.links
    };
  }, [graph, currentMode, nodeSize, isMobile]);

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
    if (isMobile) {
      // Handle double tap for mobile
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTap < DOUBLE_TAP_DELAY) {
        // Double tap - center on node
        centerOnNode(node);
      } else {
        // Single tap - show details
        setSelectedNode(node);
      }
      setLastTap(now);
    } else {
      setSelectedNode(node);
    }
  }, [isMobile, lastTap]);

  const handleNodeRightClick = useCallback((node: any) => {
    if (!isMobile) {
      centerOnNode(node);
    }
  }, [isMobile]);

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
          linkOpacity={linkOpacity[0]}
          showNavInfo={false}
          controlType={isMobile ? 'trackball' : (cameraControl === 'pan' ? 'trackball' : cameraControl)}
          enableNavigationControls={!isMobile}
          enablePointerInteraction={true}
          onNodeRightClick={handleNodeRightClick}
          nodeThreeObjectExtend={true}
        />
      );
    }

    return (
      <ForceGraph2D
        {...commonProps}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        cooldownTicks={isMobile ? 50 : 100}
        onEngineStop={() => setHighlightNodes(new Set())}
        enableNodeDrag={!isMobile}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        zoom={zoom}
        centerAt={[panOffset.x, panOffset.y]}
        onNodeRightClick={handleNodeRightClick}
        minZoom={isMobile ? 0.5 : 0.1}
        maxZoom={isMobile ? 4 : 8}
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
                  onClick={resetCamera}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNavLegend(!showNavLegend)}
                >
                  <Navigation className="w-4 h-4" />
                  Nav Help
                </Button>
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
            {/* Mobile Mode Selection */}
            <div className="block md:hidden mb-4">
              <Select value={currentMode.id} onValueChange={(value) => {
                const mode = VISUALIZATION_MODES.find(m => m.id === value);
                if (mode) setCurrentMode(mode);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {currentMode.dimension}
                      </Badge>
                      <span className="text-sm">{currentMode.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {VISUALIZATION_MODES.map((mode) => (
                    <SelectItem key={mode.id} value={mode.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {mode.dimension}
                        </Badge>
                        <span>{mode.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Mode Selection */}
            <div className="hidden md:grid md:grid-cols-3 lg:flex lg:flex-wrap gap-2 mb-4">
              {VISUALIZATION_MODES.map((mode) => (
                <Button
                  key={mode.id}
                  variant={currentMode.id === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentMode(mode)}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm glass border-glass-border hover:bg-white/20 justify-center"
                >
                  <Badge variant="secondary" className="text-xs px-1 py-0.5">
                    {mode.dimension}
                  </Badge>
                  <span className="hidden lg:inline">{mode.name}</span>
                  <span className="lg:hidden">{mode.name.split(' ')[0]}</span>
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
                    <div className="space-y-2">
                    <Label className="text-sm">Camera Control</Label>
                      <Select value={cameraControl} onValueChange={setCameraControl}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trackball">Trackball</SelectItem>
                          <SelectItem value="orbit">Orbit</SelectItem>
                          <SelectItem value="fly">Fly</SelectItem>
                        </SelectContent>
                      </Select>
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
              className="relative border border-glass-border rounded-2xl overflow-hidden glass bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-glass"
            >
              <div className="flex items-center justify-center" style={{ 
                minHeight: `${dimensions.height}px`,
                height: window.innerWidth < 768 ? '70vh' : `${dimensions.height}px`
              }}>
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
                  onClick={resetCamera}
                  className="bg-background/90 backdrop-blur-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNavLegend(!showNavLegend)}
                  className="bg-background/90 backdrop-blur-sm"
                >
                  <Navigation className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="bg-background/90 backdrop-blur-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Navigation Legend */}
              <AnimatePresence>
                {showNavLegend && (
                  <motion.div
                    initial={{ opacity: 0, x: -300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    className="absolute top-4 left-4 w-80 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Navigation Controls
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNavLegend(false)}
                      >
                        ×
                      </Button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="font-medium mb-1 flex items-center gap-1">
                          <Keyboard className="w-3 h-3" />
                          Keyboard Controls
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                          <div><kbd className="bg-muted px-1 rounded">W/A/S/D</kbd> - Move</div>
                          <div><kbd className="bg-muted px-1 rounded">Q/E</kbd> - Up/Down (3D)</div>
                          <div><kbd className="bg-muted px-1 rounded">↑↓←→</kbd> - Rotate</div>
                          <div><kbd className="bg-muted px-1 rounded">Z/X</kbd> - Roll (3D)</div>
                          <div><kbd className="bg-muted px-1 rounded">+/-</kbd> - Zoom</div>
                          <div><kbd className="bg-muted px-1 rounded">R</kbd> - Reset view</div>
                          <div><kbd className="bg-muted px-1 rounded">H</kbd> - Toggle help</div>
                          <div><kbd className="bg-muted px-1 rounded">1/2/3</kbd> - Nav modes</div>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium mb-1 flex items-center gap-1">
                          <MousePointer className="w-3 h-3" />
                          Mouse Controls
                        </div>
                        <div className="space-y-1 text-muted-foreground">
                          <div>• Left click + drag - Pan/Rotate</div>
                          <div>• Right click node - Center on node</div>
                          <div>• Scroll wheel - Zoom in/out</div>
                          {currentMode.dimension === '3D' && (
                            <>
                              <div>• Middle click + drag - Pan camera</div>
                              <div>• Ctrl + drag - Free look mode</div>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="font-medium mb-1">Navigation Modes</div>
                        <div className="space-y-1 text-muted-foreground">
                          <div><Badge variant="secondary" className="text-xs">Orbit</Badge> - Rotate around center</div>
                          <div><Badge variant="secondary" className="text-xs">Fly</Badge> - Free camera movement</div>
                          <div><Badge variant="secondary" className="text-xs">Pan</Badge> - 2D panning mode</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            Mode: {navigationMode} | {currentMode.dimension}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
              <div className="flex items-center gap-2 sm:gap-4 mt-2 flex-wrap text-xs sm:text-sm">
                {isMobile ? (
                  <>
                    <span>👆 Tap nodes for details</span>
                    <span>👆👆 Double-tap to center</span>
                    <span>🤏 Pinch to zoom</span>
                    <span>👋 Drag to pan</span>
                  </>
                ) : (
                  <>
                    <span>💡 Hover over nodes to highlight connections</span>
                    <span>🖱️ Click nodes for details | Right-click to center</span>
                    <span>⌨️ Press H for navigation help</span>
                    <span>🎮 WASD to move | Arrow keys to rotate</span>
                    <span>🔄 Mode: {navigationMode}</span>
                  </>
                )}
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
                    onClick={resetCamera}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNavLegend(!showNavLegend)}
                  >
                    <Navigation className="w-4 h-4" />
                    Nav Help
                  </Button>
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
                      </div><div className="space-y-2">
                        <Label className="text-sm">Navigation Mode</Label>
                        <div className="flex gap-1">
                          {['orbit', 'fly', 'pan'].map((mode) => (
                            <Button
                              key={mode}
                              variant={navigationMode === mode ? "default" : "outline"}
                              size="sm"
                              onClick={() => setNavigationMode(mode as any)}
                              className="text-xs"
                            >
                              {mode}
                            </Button>
                          ))}
                        </div>
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