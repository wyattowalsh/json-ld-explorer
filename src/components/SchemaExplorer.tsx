import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Globe,
  Link,
  Hash,
  Type,
  Database,
  GitBranch
} from 'lucide-react';

interface SchemaExplorerProps {
  data: unknown;
}

interface SchemaNode {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  relationships: Array<{ property: string; target: string; type: 'outgoing' | 'incoming' }>;
  contexts: string[];
  depth: number;
}

interface SchemaAnalysis {
  nodes: SchemaNode[];
  types: Set<string>;
  properties: Set<string>;
  contexts: Set<string>;
  relationships: Array<{ source: string; target: string; property: string }>;
}

export function SchemaExplorer({ data }: SchemaExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const schema = useMemo(() => {
    const analyzeSchema = (jsonData: unknown): SchemaAnalysis => {
      const nodes: SchemaNode[] = [];
      const types = new Set<string>();
      const properties = new Set<string>();
      const contexts = new Set<string>();
      const relationships: Array<{ source: string; target: string; property: string }> = [];

      const traverse = (obj: unknown, path = '', depth = 0) => {
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => traverse(item, `${path}[${index}]`, depth));
        } else if (obj && typeof obj === 'object') {
          const objData = obj as Record<string, unknown>;
          const nodeId = objData['@id'] as string || `node_${nodes.length}`;
          const nodeType = objData['@type'] as string || 'Unknown';
          const nodeContexts: string[] = [];

          // Extract contexts
          if (objData['@context']) {
            if (typeof objData['@context'] === 'string') {
              contexts.add(objData['@context']);
              nodeContexts.push(objData['@context']);
            } else if (typeof objData['@context'] === 'object') {
              Object.keys(objData['@context'] as Record<string, unknown>).forEach(ctx => {
                contexts.add(ctx);
                nodeContexts.push(ctx);
              });
            }
          }

          types.add(nodeType);

          const nodeRelationships: Array<{ property: string; target: string; type: 'outgoing' | 'incoming' }> = [];
          const nodeProperties: Record<string, unknown> = {};

          Object.entries(objData).forEach(([key, value]) => {
            properties.add(key);
            
            if (!key.startsWith('@')) {
              nodeProperties[key] = value;
              
              // Check if this property references another entity
              if (typeof value === 'object' && value && '@id' in (value as Record<string, unknown>)) {
                const targetId = (value as Record<string, unknown>)['@id'] as string;
                nodeRelationships.push({ property: key, target: targetId, type: 'outgoing' });
                relationships.push({ source: nodeId, target: targetId, property: key });
              } else if (typeof value === 'string' && (value.startsWith('http') || value.includes(':'))) {
                // Potential URI reference
                nodeRelationships.push({ property: key, target: value, type: 'outgoing' });
              }
            }

            traverse(value, `${path}.${key}`, depth + 1);
          });

          nodes.push({
            id: nodeId,
            type: nodeType,
            properties: nodeProperties,
            relationships: nodeRelationships,
            contexts: nodeContexts,
            depth
          });
        }
      };

      traverse(jsonData);
      return { nodes, types, properties, contexts, relationships };
    };

    return analyzeSchema(data);
  }, [data]);

  const filteredNodes = useMemo(() => {
    return schema.nodes.filter(node => {
      const matchesSearch = !searchTerm || 
        node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.keys(node.properties).some(prop => 
          prop.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesType = !selectedType || node.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [schema.nodes, searchTerm, selectedType]);

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Schema Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Schema Overview
          </CardTitle>
          <CardDescription>
            Structural analysis of your JSON-LD schema and relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-600">{schema.nodes.length}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Database className="h-4 w-4" />
                Entities
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-green-600">{schema.types.size}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Type className="h-4 w-4" />
                Types
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-orange-600">{schema.properties.size}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Hash className="h-4 w-4" />
                Properties
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-purple-600">{schema.relationships.length}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <GitBranch className="h-4 w-4" />
                Relations
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search entities, types, or properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedType ? "secondary" : "outline"}
                onClick={() => setSelectedType(null)}
                className="shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                All Types
              </Button>
              {Array.from(schema.types).slice(0, 3).map(type => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className="shrink-0"
                >
                  {type.split('/').pop() || type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Explorer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Entity Explorer
            <Badge variant="secondary" className="ml-2">
              {filteredNodes.length} entities
            </Badge>
          </CardTitle>
          <CardDescription>
            Explore individual entities and their properties
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              <AnimatePresence>
                {filteredNodes.map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Node Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNodeExpansion(node.id)}
                          className="p-1 h-auto"
                        >
                          {expandedNodes.has(node.id) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                        <div>
                          <div className="font-semibold text-lg">{node.id}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              <Type className="h-3 w-3 mr-1" />
                              {node.type.split('/').pop() || node.type}
                            </Badge>
                            {node.contexts.length > 0 && (
                              <Badge variant="secondary">
                                <Globe className="h-3 w-3 mr-1" />
                                {node.contexts.length} context{node.contexts.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {node.relationships.length > 0 && (
                              <Badge variant="secondary">
                                <Link className="h-3 w-3 mr-1" />
                                {node.relationships.length} relation{node.relationships.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedNodes.has(node.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-4"
                        >
                          {/* Properties */}
                          {Object.keys(node.properties).length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Properties
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(node.properties).map(([key, value]) => (
                                  <div key={key} className="bg-muted/50 rounded p-3">
                                    <div className="font-mono text-sm text-blue-600 mb-1">{key}</div>
                                    <div className="text-sm text-muted-foreground truncate">
                                      {typeof value === 'string' ? value : JSON.stringify(value)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Relationships */}
                          {node.relationships.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <GitBranch className="h-4 w-4" />
                                Relationships
                              </h4>
                              <div className="space-y-2">
                                {node.relationships.map((rel, relIndex) => (
                                  <div key={relIndex} className="flex items-center gap-2 text-sm">
                                    <Badge variant={rel.type === 'outgoing' ? 'default' : 'secondary'}>
                                      {rel.property}
                                    </Badge>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-mono text-muted-foreground">{rel.target}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contexts */}
                          {node.contexts.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Contexts
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {node.contexts.map(context => (
                                  <Badge key={context} variant="outline" className="font-mono text-xs">
                                    {context}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredNodes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No entities found</h3>
                  <p>Try adjusting your search terms or filters.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}