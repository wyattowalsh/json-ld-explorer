import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Copy,
  Download,
  Expand,
  Minimize2, // Changed from Compress
  Filter
} from 'lucide-react';

interface JsonViewerProps {
  data: unknown;
}

interface JsonNode {
  key: string;
  value: unknown;
  type: string;
  path: string;
  level: number;
}

export function JsonViewer({ data }: JsonViewerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);

  const jsonNodes = useMemo(() => {
    const nodes: JsonNode[] = [];
    
    const traverse = (obj: unknown, path = 'root', level = 0, key = '') => {
      const nodeType = Array.isArray(obj) ? 'array' : typeof obj;
      
      nodes.push({
        key: key || 'root',
        value: obj,
        type: nodeType,
        path,
        level
      });

      if (obj && typeof obj === 'object') {
        const entries = Array.isArray(obj) 
          ? obj.map((item, index) => [index.toString(), item])
          : Object.entries(obj as Record<string, unknown>);

        entries.forEach(([k, v]) => {
          const childPath = `${path}.${k}`;
          traverse(v, childPath, level + 1, k);
        });
      }
    };

    traverse(data);
    return nodes;
  }, [data]);

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return jsonNodes;
    
    const matchingPaths = new Set<string>();
    
    // Find nodes that match the search term
    jsonNodes.forEach(node => {
      const searchValue = searchTerm.toLowerCase();
      const keyMatches = node.key.toLowerCase().includes(searchValue);
      const valueMatches = typeof node.value === 'string' && 
        node.value.toLowerCase().includes(searchValue);
      
      if (keyMatches || valueMatches) {
        matchingPaths.add(node.path);
        
        // Add parent paths to show context
        let parentPath = node.path;
        while (parentPath.includes('.')) {
          parentPath = parentPath.substring(0, parentPath.lastIndexOf('.'));
          matchingPaths.add(parentPath);
        }
      }
    });

    return showOnlyMatches 
      ? jsonNodes.filter(node => matchingPaths.has(node.path))
      : jsonNodes;
  }, [jsonNodes, searchTerm, showOnlyMatches]);

  const toggleExpansion = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const expandAll = () => {
    setExpandedPaths(new Set(jsonNodes.map(node => node.path)));
  };

  const collapseAll = () => {
    setExpandedPaths(new Set(['root']));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const downloadJson = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jsonld-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderValue = (value: unknown, type: string) => {
    if (value === null) {
      return <span className="text-gray-500 italic">null</span>;
    }
    
    if (value === undefined) {
      return <span className="text-gray-500 italic">undefined</span>;
    }

    switch (type) {
      case 'string':
        return <span className="text-green-600 dark:text-green-400">"{value as string}"</span>;
      case 'number':
        return <span className="text-blue-600 dark:text-blue-400">{value as number}</span>;
      case 'boolean':
        return <span className="text-purple-600 dark:text-purple-400">{value ? 'true' : 'false'}</span>;
      case 'array':
        return <span className="text-gray-600 dark:text-gray-400">[{(value as unknown[]).length} items]</span>;
      case 'object': {
        const objKeys = Object.keys(value as Record<string, unknown>);
        return <span className="text-gray-600 dark:text-gray-400">&#123;{objKeys.length} keys&#125;</span>;
      }
      default:
        return <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'array': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'object': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'string': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'number': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'boolean': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const shouldShowNode = (node: JsonNode) => {
    const parentPath = node.path.substring(0, node.path.lastIndexOf('.')) || 'root';
    return node.level === 0 || expandedPaths.has(parentPath);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Interactive JSON Viewer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={expandAll} variant="outline" size="sm">
              <Expand className="h-4 w-4 mr-2" />
              Expand All
            </Button>
            <Button onClick={collapseAll} variant="outline" size="sm">
              <Minimize2 className="h-4 w-4 mr-2" /> {/* Changed from Compress */}
              Collapse All
            </Button>
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button onClick={downloadJson} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search keys and values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showOnlyMatches ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyMatches(!showOnlyMatches)}
            disabled={!searchTerm}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 font-mono text-sm">
            <AnimatePresence>
              {filteredNodes.map((node) => {
                if (!shouldShowNode(node)) return null;
                
                const isExpandable = node.type === 'object' || node.type === 'array';
                const isExpanded = expandedPaths.has(node.path);
                
                return (
                  <motion.div
                    key={node.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-start gap-2 py-1 hover:bg-muted/50 rounded px-2"
                    style={{ marginLeft: `${node.level * 20}px` }}
                  >
                    {/* Expand/Collapse Button */}
                    {isExpandable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-6 w-6"
                        onClick={() => toggleExpansion(node.path)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    ) : (
                      <div className="w-6" />
                    )}

                    {/* Key */}
                    <span className="text-blue-600 dark:text-blue-400 font-medium min-w-0">
                      {node.key}:
                    </span>

                    {/* Type Badge */}
                    <Badge variant="secondary" className={`text-xs ${getTypeColor(node.type)}`}>
                      {node.type}
                    </Badge>

                    {/* Value */}
                    <div className="flex-1 min-w-0">
                      {renderValue(node.value, node.type)}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
