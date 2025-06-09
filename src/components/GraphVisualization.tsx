// GraphVisualization.tsx
// Make sure to install the sprite‐text package:
//    npm install three-spritetext
// and if you run into Vite pre‐bundle issues, add to vite.config.ts:
//    optimizeDeps: { include: ['three-spritetext'] }

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
import { Settings, RotateCcw, Network, Download } from 'lucide-react';

import { Graph, VisualizationMode } from '@/types';

interface GraphVisualizationProps {
  graph: Graph;
}

const VISUALIZATION_MODES: VisualizationMode[] = [
  { id: 'force2d',   name: 'Force 2D',       description: '2D force-directed',   dimension: '2D', type: 'force' },
  { id: 'force3d',   name: 'Force 3D',       description: '3D force-directed',   dimension: '3D', type: 'force' },
  { id: 'circular',  name: 'Circular 2D',    description: 'Circular layout',     dimension: '2D', type: 'circular' },
  { id: 'hierarchy', name: 'Hierarchy 2D',   description: 'Hierarchical tree',    dimension: '2D', type: 'hierarchy' },
  { id: 'radial',    name: 'Radial 2D',      description: 'Radial tree',         dimension: '2D', type: 'radial' },
  { id: 'grid',      name: 'Grid 2D',        description: 'Grid layout',         dimension: '2D', type: 'grid' },
  { id: 'spiral',    name: 'Spiral 2D',      description: 'Spiral arrangement',  dimension: '2D', type: 'spiral' },
  { id: 'cluster',   name: 'Cluster 2D',     description: 'Community clusters',  dimension: '2D', type: 'cluster' },
  { id: 'arc',       name: 'Arc Diagram',    description: 'Arc diagram view',    dimension: '2D', type: 'arc' },
  { id: 'matrix',    name: 'Matrix View',    description: 'Adjacency matrix',    dimension: '2D', type: 'matrix' }
];

export function GraphVisualization({ graph }: GraphVisualizationProps) {
  // ─── State & Refs ────────────────────────────────────────────────────────
  const [currentMode,    setCurrentMode]    = useState<VisualizationMode>(VISUALIZATION_MODES[0]);
  const [showSettings,   setShowSettings]   = useState(false);
  const [nodeSize,       setNodeSize]       = useState<[number]>([8]);
  const [linkOpacity,    setLinkOpacity]    = useState<[number]>([0.6]);
  const [showLabels,     setShowLabels]     = useState(true);
  const [showLinks,      setShowLinks]      = useState(true);
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [isMobile,       setIsMobile]       = useState(false);
  const [dimensions,     setDimensions]     = useState({ width: 800, height: 600 });
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef     = useRef<any>(null);

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const height = mobile 
          ? Math.min(window.innerHeight * 0.6, 500) 
          : (isFullscreen ? window.innerHeight - 140 : 600);
        const width  = isFullscreen 
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
  const processedGraph = useMemo(() => graph, [graph, currentMode]);

  const handleNodeHover = useCallback((node: any) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }
    const neigh = new Set<string>();
    const links = new Set<string>();
    graph.links.forEach(link => {
      const s = typeof link.source === 'string' ? link.source : link.source.id;
      const t = typeof link.target === 'string' ? link.target : link.target.id;
      if (s === node.id || t === node.id) {
        neigh.add(s);
        neigh.add(t);
        links.add(`${s}-${t}`);
      }
    });
    setHighlightNodes(neigh);
    setHighlightLinks(links);
  }, [graph]);

  const handleNodeClick = useCallback((node: any) => {
    // zoom or detail pane
  }, []);

  const resetCamera = useCallback(() => {
    graphRef.current?.zoomToFit(400);
  }, []);

  // ─── Custom Canvas Renderers ──────────────────────────────────────────────
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = highlightNodes.has(node.id);
    const size = nodeSize[0];
    ctx.fillStyle = node.color || '#69b3a2';
    ctx.globalAlpha = isHighlighted ? 1 : 0.8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fill();
    if (isHighlighted) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (showLabels && (isHighlighted || size > 6)) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#333';
      ctx.font = `${Math.max(10, size / 2)}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x, node.y + size + 12);
    }
    ctx.globalAlpha = 1;
  }, [highlightNodes, nodeSize, showLabels]);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    if (!showLinks) return;
    const s = typeof link.source === 'string' ? link.source : link.source.id;
    const t = typeof link.target === 'string' ? link.target : link.target.id;
    const linkId = `${s}-${t}`;
    const isHighlighted = highlightLinks.has(linkId);

    // draw line
    ctx.strokeStyle = link.color || (isHighlighted ? '#ff6b6b' : '#ccc');
    ctx.lineWidth   = isHighlighted ? 3 : 1;
    ctx.globalAlpha = isHighlighted ? 1 : linkOpacity[0];
    ctx.beginPath();
    ctx.moveTo((link.source as any).x, (link.source as any).y);
    ctx.lineTo((link.target as any).x, (link.target as any).y);
    ctx.stroke();

    // draw label
    if (showLabels) {
      ctx.globalAlpha = 1;
      const label = link.label || link.name || linkId;
      const xMid  = (((link.source as any).x + (link.target as any).x) / 2);
      const yMid  = (((link.source as any).y + (link.target as any).y) / 2);
      ctx.font         = '10px Sans-Serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#222';
      ctx.fillText(label, xMid, yMid);
    }
  }, [showLinks, linkOpacity, highlightLinks, showLabels]);

  // ─── Renderer Switch ──────────────────────────────────────────────────────
  const renderVisualization = () => {
    const commonProps = {
      ref:               graphRef,
      graphData:         processedGraph,
      onNodeHover:       handleNodeHover,
      onNodeClick:       handleNodeClick,
      linkVisibility:    showLinks,
      nodeAutoColorBy:   'type',
      linkAutoColorBy:   'type',
      backgroundColor:   'rgba(0,0,0,0)',
      width:             dimensions.width,
      height:            dimensions.height
    };

    if (currentMode.dimension === '3D') {
      return (
        <ForceGraph3D
          {...commonProps}
          linkOpacity={linkOpacity[0]}
          controlType={isMobile ? 'trackball' : 'orbit'}
          enableNavigationControls={!isMobile}
          enablePointerInteraction
          nodeThreeObjectExtend
          linkThreeObjectExtend
          linkThreeObject={(link: any) => {
            const sprite = new SpriteText(link.label || link.name);
            sprite.color      = link.color || 'lightgrey';
            sprite.textHeight = 4;
            return sprite;
          }}
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
        enablePanInteraction
        enableZoomInteraction
        zoom={1}
        centerAt={[0, 0]}
      />
    );
  };

  // ─── Component Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* Mode & Dimension Buttons */}
      <div style={{
        position: 'absolute',
        top:      12,
        left:     12,
        zIndex:   10,
        display:  'flex',
        gap:      '6px'
      }}>
        {VISUALIZATION_MODES.map(mode => (
          <Button
            key={mode.id}
            size="sm"
            variant={mode.id === currentMode.id ? 'solid' : 'outline'}
            onClick={() => setCurrentMode(mode)}
          >
            <Badge variant="secondary" className="text-xs">{mode.dimension}</Badge>&nbsp;{mode.name}
          </Button>
        ))}
      </div>

      {/* Graph Canvas */}
      <div
        ref={containerRef}
        className="border rounded-lg overflow-hidden"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {renderVisualization()}
      </div>

      {/* Settings Panel */}
      <Card className="mt-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" /> Settings
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <AnimatePresence initial={false}>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Node Size: {nodeSize[0]}</Label>
                  <Slider value={nodeSize} onValueChange={setNodeSize} min={4} max={20} step={1} />
                </div>
                <div className="space-y-2">
                  <Label>Link Opacity: {linkOpacity[0].toFixed(1)}</Label>
                  <Slider value={linkOpacity} onValueChange={setLinkOpacity} min={0.1} max={1} step={0.1} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={showLinks} onCheckedChange={setShowLinks} /><Label>Show Links</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={showLabels} onCheckedChange={setShowLabels} /><Label>Show Labels</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={isFullscreen} onCheckedChange={setIsFullscreen} /><Label>Fullscreen</Label>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={resetCamera}>
                    <Network className="w-4 h-4" /> Reset View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {/* export logic */}}>
                    <Download className="w-4 h-4" /> Export
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </>
  );
}