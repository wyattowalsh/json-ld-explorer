import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

// UI components & icons
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings, RotateCcw, Network, Download, Maximize2, Minimize2,
  Eye, EyeOff, Zap, Target, GitBranch, Share2, Info
} from 'lucide-react';

import { Graph, VisualizationMode } from '@/types';

interface GraphVisualizationProps {
  graph: Graph;
}

interface NodeHoverInfo {
  node: any;
  x: number;
  y: number;
}

const VISUALIZATION_MODES: VisualizationMode[] = [
  { id: 'force2d', name: 'Force 2D', description: '2D force-directed layout', dimension: '2D', type: 'force' },
  { id: 'force3d', name: 'Force 3D', description: '3D force-directed layout', dimension: '3D', type: 'force' },
  { id: 'circular', name: 'Circular', description: 'Circular arrangement', dimension: '2D', type: 'circular' },
  { id: 'hierarchy', name: 'Hierarchy', description: 'Hierarchical tree layout', dimension: '2D', type: 'hierarchy' }
];

export function GraphVisualization({ graph }: GraphVisualizationProps) {
  // ─── State & Refs ────────────────────────────────────────────────────────
  const [currentMode, setCurrentMode] = useState<VisualizationMode>(VISUALIZATION_MODES[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [nodeSize, setNodeSize] = useState<[number]>([12]);
  const [linkOpacity, setLinkOpacity] = useState<[number]>([0.8]);
  const [showLabels, setShowLabels] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<NodeHoverInfo | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [linkDistance, setLinkDistance] = useState<[number]>([100]);
  const [chargeStrength, setChargeStrength] = useState<[number]>([300]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const height = isFullscreen 
          ? window.innerHeight - 60
          : mobile ? Math.min(window.innerHeight * 0.7, 600) : 800;
        const width = isFullscreen 
          ? window.innerWidth - 40 
          : rect.width - 40;
        setDimensions({ width, height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isFullscreen]);

  // ─── Graph Processing & Handlers ─────────────────────────────────────────
  const processedGraph = useMemo(() => {
    // Enhanced node processing with better visual properties
    const enhancedNodes = graph.nodes.map(node => ({
      ...node,
      val: nodeSize[0] + (node.properties ? Object.keys(node.properties).length * 2 : 0),
      color: getEnhancedNodeColor(node.type),
      label: node.name || node.id,
      description: generateNodeDescription(node)
    }));

    // Enhanced link processing
    const enhancedLinks = graph.links.map(link => ({
      ...link,
      color: getEnhancedLinkColor(link.type),
      width: link.weight ? Math.max(1, link.weight * 3) : 2,
      label: formatRelationshipLabel(link.type)
    }));

    return {
      nodes: enhancedNodes,
      links: enhancedLinks
    };
  }, [graph, nodeSize]);

  const handleNodeHover = useCallback((node: any, prevNode: any) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setHoveredNode(null);
      return;
    }

    // Get mouse position for tooltip
    const event = window.event as MouseEvent;
    if (event) {
      setHoveredNode({
        node,
        x: event.clientX,
        y: event.clientY
      });
    }

    // Highlight connected nodes and links
    const connectedNodes = new Set<string>([node.id]);
    const connectedLinks = new Set<string>();
    
    graph.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (sourceId === node.id || targetId === node.id) {
        connectedNodes.add(sourceId);
        connectedNodes.add(targetId);
        connectedLinks.add(`${sourceId}-${targetId}`);
      }
    });

    setHighlightNodes(connectedNodes);
    setHighlightLinks(connectedLinks);
  }, [graph]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
    
    // Center on clicked node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, [selectedNode]);

  const resetCamera = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
      setSelectedNode(null);
    }
  }, []);

  // ─── Enhanced Visual Functions ───────────────────────────────────────────
  const getEnhancedNodeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'Person': '#FF6B6B',
      'Organization': '#4ECDC4', 
      'Place': '#45B7D1',
      'Event': '#96CEB4',
      'CreativeWork': '#FFEAA7',
      'Product': '#DDA0DD',
      'Service': '#98D8C8',
      'Action': '#F7DC6F',
      'Thing': '#AED6F1',
      'Reference': '#E67E22',
      'Value': '#BDC3C7',
      'Number': '#3498DB',
      'Boolean': '#9B59B6'
    };
    return colorMap[type] || '#95A5A6';
  };

  const getEnhancedLinkColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'worksFor': '#3498DB',
      'knowsAbout': '#E74C3C',
      'colleague': '#F39C12',
      'alumniOf': '#9B59B6',
      'employee': '#27AE60',
      'contains': '#95A5A6',
      'relatedTo': '#34495E'
    };
    return colorMap[type] || '#BDC3C7';
  };

  const formatRelationshipLabel = (type: string): string => {
    return type.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  };

  const generateNodeDescription = (node: any): string => {
    const props = node.properties || {};
    const descriptions = [];
    
    if (props.jobTitle) descriptions.push(`Job: ${props.jobTitle}`);
    if (props.industry) descriptions.push(`Industry: ${props.industry}`);
    if (props.foundingDate) descriptions.push(`Founded: ${props.foundingDate}`);
    if (props.numberOfEmployees) descriptions.push(`Employees: ${props.numberOfEmployees}`);
    if (props.knowsAbout && Array.isArray(props.knowsAbout)) {
      descriptions.push(`Skills: ${props.knowsAbout.slice(0, 3).join(', ')}`);
    }
    
    return descriptions.join(' • ') || `${node.type} entity`;
  };

  // ─── Custom Canvas Renderers ──────────────────────────────────────────────
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHighlighted = highlightNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const size = node.val || nodeSize[0];
    const fontSize = Math.max(10, size / 2);
    
    // Draw node with enhanced styling
    ctx.save();
    
    // Glow effect for highlighted/selected nodes
    if (isHighlighted || isSelected) {
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.9;
    }
    
    // Main node circle
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fill();
    
    // Border for selected/highlighted nodes
    if (isHighlighted || isSelected) {
      ctx.strokeStyle = isSelected ? '#FFD700' : '#FFFFFF';
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.stroke();
    }
    
    // Inner highlight
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(node.x, node.y - size * 0.3, size * 0.6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
    
    // Always show labels for better UX
    if (showLabels && globalScale > 0.5) {
      ctx.save();
      ctx.fillStyle = '#2C3E50';
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Text background for better readability
      const textWidth = ctx.measureText(node.label).width;
      const textHeight = fontSize;
      const padding = 4;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(
        node.x - textWidth/2 - padding,
        node.y + size + 8 - textHeight/2 - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );
      
      // Text
      ctx.fillStyle = '#2C3E50';
      ctx.fillText(node.label, node.x, node.y + size + 12);
      
      // Type badge for highlighted nodes
      if (isHighlighted && node.type) {
        ctx.font = `${fontSize * 0.7}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillText(node.type, node.x, node.y + size + 26);
      }
      
      ctx.restore();
    }
  }, [highlightNodes, selectedNode, nodeSize, showLabels]);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!showLinks) return;
    
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const linkId = `${sourceId}-${targetId}`;
    const isHighlighted = highlightLinks.has(linkId);
    
    const source = link.source;
    const target = link.target;
    
    ctx.save();
    
    // Enhanced link styling
    ctx.strokeStyle = isHighlighted ? '#E74C3C' : (link.color || '#BDC3C7');
    ctx.lineWidth = isHighlighted ? 4 : (link.width || 2);
    ctx.globalAlpha = isHighlighted ? 1 : linkOpacity[0];
    
    // Curved links for better visual appeal
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(
      source.x + dx/2 + dy * 0.2,
      source.y + dy/2 - dx * 0.2,
      target.x,
      target.y
    );
    ctx.stroke();
    
    // Arrow for direction
    if (isHighlighted && globalScale > 0.8) {
      const angle = Math.atan2(dy, dx);
      const arrowLength = 15;
      const arrowAngle = 0.5;
      
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(
        target.x - arrowLength * Math.cos(angle - arrowAngle),
        target.y - arrowLength * Math.sin(angle - arrowAngle)
      );
      ctx.lineTo(target.x, target.y);
      ctx.lineTo(
        target.x - arrowLength * Math.cos(angle + arrowAngle),
        target.y - arrowLength * Math.sin(angle + arrowAngle)
      );
      ctx.fill();
    }
    
    // Relationship label
    if (showLabels && isHighlighted && link.label && globalScale > 1) {
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 1;
      
      const fontSize = 11;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      const textWidth = ctx.measureText(link.label).width;
      const padding = 6;
      
      // Background
      ctx.fillRect(
        midX - textWidth/2 - padding,
        midY - fontSize/2 - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      );
      ctx.strokeRect(
        midX - textWidth/2 - padding,
        midY - fontSize/2 - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      );
      
      // Text
      ctx.fillStyle = '#2C3E50';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(link.label, midX, midY);
    }
    
    ctx.restore();
  }, [showLinks, linkOpacity, highlightLinks, showLabels]);

  // ─── Renderer Switch ──────────────────────────────────────────────────────
  const renderVisualization = () => {
    const commonProps = {
      ref: graphRef,
      graphData: processedGraph,
      onNodeHover: handleNodeHover,
      onNodeClick: handleNodeClick,
      linkVisibility: showLinks,
      backgroundColor: 'rgba(248, 250, 252, 0.8)',
      width: dimensions.width,
      height: dimensions.height,
      cooldownTicks: isMobile ? 50 : 100,
      d3AlphaDecay: 0.02,
      d3VelocityDecay: 0.3,
      linkDistance: linkDistance[0],
      chargeStrength: -chargeStrength[0]
    };

    if (currentMode.dimension === '3D') {
      return (
        <ForceGraph3D
          {...commonProps}
          nodeThreeObject={(node: any) => {
            const sprite = new SpriteText(node.label);
            sprite.material.depthWrite = false;
            sprite.color = node.color;
            sprite.textHeight = 8;
            sprite.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            sprite.padding = 2;
            sprite.borderWidth = 1;
            sprite.borderColor = node.color;
            return sprite;
          }}
          linkThreeObjectExtend={true}
          linkThreeObject={(link: any) => {
            if (!showLabels || !highlightLinks.has(`${link.source.id}-${link.target.id}`)) return undefined;
            
            const sprite = new SpriteText(link.label || link.type);
            sprite.color = 'rgba(0, 0, 0, 0.8)';
            sprite.textHeight = 4;
            sprite.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            return sprite;
          }}
          controlType={isMobile ? 'trackball' : 'orbit'}
          enableNavigationControls={!isMobile}
          enablePointerInteraction
        />
      );
    }

    return (
      <ForceGraph2D
        {...commonProps}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onEngineStop={() => setHighlightNodes(new Set())}
        enableNodeDrag={!isMobile}
        enablePanInteraction
        enableZoomInteraction
        minZoom={0.1}
        maxZoom={8}
        nodeRelSize={nodeSize[0]}
      />
    );
  };

  // ─── Component Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Enhanced Header with Mode Selection */}
      <Card className="glass-strong border-glass-border rounded-2xl shadow-glass overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold gradient-text">Graph Explorer</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  Interactive visualization of {graph.nodes.length} entities and {graph.links.length} relationships
                </p>
              </div>
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Visualization Mode Buttons */}
              {VISUALIZATION_MODES.map(mode => (
                <Button
                  key={mode.id}
                  size="sm"
                  variant={mode.id === currentMode.id ? 'default' : 'outline'}
                  onClick={() => setCurrentMode(mode)}
                  className="glass border-glass-border hover:bg-white/20"
                >
                  <Badge variant="secondary" className="text-xs mr-2">
                    {mode.dimension}
                  </Badge>
                  {mode.name}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="glass border-glass-border hover:bg-white/20"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Graph Container */}
      <Card className={`glass-strong border-glass-border rounded-2xl shadow-glass overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        <div
          ref={containerRef}
          className="relative"
          style={{ 
            width: isFullscreen ? '100%' : dimensions.width, 
            height: isFullscreen ? '100%' : dimensions.height 
          }}
        >
          {/* Graph Canvas */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            {renderVisualization()}
          </div>

          {/* Floating Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="glass border-glass-border hover:bg-white/20 backdrop-blur-md"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetCamera}
              className="glass border-glass-border hover:bg-white/20 backdrop-blur-md"
            >
              <Target className="w-4 h-4" />
            </Button>
          </div>

          {/* Node Hover Tooltip */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed z-50 pointer-events-none"
                style={{
                  left: hoveredNode.x + 15,
                  top: hoveredNode.y - 10,
                  transform: 'translate(0, -100%)'
                }}
              >
                <Card className="glass-strong border-glass-border shadow-glass-lg max-w-xs">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: hoveredNode.node.color }}
                        />
                        <h4 className="font-semibold text-sm">{hoveredNode.node.label}</h4>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {hoveredNode.node.type}
                      </Badge>
                      
                      {hoveredNode.node.description && (
                        <p className="text-xs text-muted-foreground">
                          {hoveredNode.node.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {highlightNodes.size - 1} connections
                        </span>
                        <span className="flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {Object.keys(hoveredNode.node.properties || {}).length} properties
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Node Panel */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute top-4 right-20 w-80 z-20"
              >
                <Card className="glass-strong border-glass-border shadow-glass-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: selectedNode.color }}
                        />
                        {selectedNode.label}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNode(null)}
                      >
                        ×
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Badge variant="outline">{selectedNode.type}</Badge>
                    
                    {selectedNode.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedNode.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Properties</h5>
                      <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                        {Object.entries(selectedNode.properties || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="font-medium text-muted-foreground">{key}:</span>
                            <span className="text-right max-w-32 truncate">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Enhanced Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-strong border-glass-border rounded-2xl shadow-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Visualization Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Visual Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Visual Properties</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Node Size: {nodeSize[0]}</Label>
                        <Slider value={nodeSize} onValueChange={setNodeSize} min={6} max={24} step={2} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Link Opacity: {linkOpacity[0].toFixed(1)}</Label>
                        <Slider value={linkOpacity} onValueChange={setLinkOpacity} min={0.1} max={1} step={0.1} />
                      </div>
                    </div>
                  </div>

                  {/* Physics Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Physics</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Link Distance: {linkDistance[0]}</Label>
                        <Slider value={linkDistance} onValueChange={setLinkDistance} min={50} max={300} step={10} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Charge Strength: {chargeStrength[0]}</Label>
                        <Slider value={chargeStrength} onValueChange={setChargeStrength} min={100} max={800} step={50} />
                      </div>
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Display Options</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch checked={showLinks} onCheckedChange={setShowLinks} />
                        <Label className="text-xs flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          Show Relationships
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={showLabels} onCheckedChange={setShowLabels} />
                        <Label className="text-xs flex items-center gap-1">
                          {showLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          Show Labels
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-glass-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    <span>Interactive graph with {graph.nodes.length} entities</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={resetCamera}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}