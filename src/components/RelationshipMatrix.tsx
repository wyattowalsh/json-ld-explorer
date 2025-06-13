import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap,
  GitBranch,
  Network,
  TrendingUp,
  ArrowRight,
  Circle,
  Square,
  Triangle
} from 'lucide-react';

interface RelationshipMatrixProps {
  data: unknown;
}

interface Entity {
  id: string;
  type: string;
  properties: string[];
}

interface Relationship {
  source: string;
  target: string;
  property: string;
  type: 'direct' | 'reference' | 'nested';
}

interface MatrixData {
  entities: Entity[];
  relationships: Relationship[];
  matrix: number[][];
  propertyTypes: Record<string, number>;
  connectionStrength: Record<string, number>;
}

const RELATIONSHIP_COLORS = {
  direct: '#3B82F6',
  reference: '#10B981',
  nested: '#F59E0B'
};

export function RelationshipMatrix({ data }: RelationshipMatrixProps) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [matrixView, setMatrixView] = useState<'heat' | 'network' | 'flow'>('heat');

  const matrixData = useMemo(() => {
    const analyzeRelationships = (jsonData: unknown): MatrixData => {
      const entities: Entity[] = [];
      const relationships: Relationship[] = [];
      const entityMap = new Map<string, number>();
      const propertyTypes: Record<string, number> = {};

      const traverse = (obj: unknown, path = '', parentId?: string) => {
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => traverse(item, `${path}[${index}]`, parentId));
        } else if (obj && typeof obj === 'object') {
          const objData = obj as Record<string, unknown>;
          const entityId = objData['@id'] as string || `entity_${entities.length}`;
          const entityType = objData['@type'] as string || 'Unknown';
          
          if (!entityMap.has(entityId)) {
            const properties = Object.keys(objData).filter(key => !key.startsWith('@'));
            entities.push({
              id: entityId,
              type: entityType,
              properties
            });
            entityMap.set(entityId, entities.length - 1);
          }

          // Analyze relationships
          Object.entries(objData).forEach(([key, value]) => {
            if (!key.startsWith('@')) {
              propertyTypes[key] = (propertyTypes[key] || 0) + 1;

              // Direct object reference
              if (typeof value === 'object' && value && '@id' in (value as Record<string, unknown>)) {
                const targetId = (value as Record<string, unknown>)['@id'] as string;
                relationships.push({
                  source: entityId,
                  target: targetId,
                  property: key,
                  type: 'direct'
                });
              }
              // URI reference
              else if (typeof value === 'string' && (value.startsWith('http') || value.includes(':'))) {
                relationships.push({
                  source: entityId,
                  target: value,
                  property: key,
                  type: 'reference'
                });
              }
              // Nested relationship
              else if (parentId && entityId !== parentId) {
                relationships.push({
                  source: parentId,
                  target: entityId,
                  property: 'contains',
                  type: 'nested'
                });
              }

              traverse(value, `${path}.${key}`, entityId);
            }
          });
        }
      };

      traverse(jsonData);

      // Build adjacency matrix
      const matrix: number[][] = Array(entities.length).fill(null).map(() => Array(entities.length).fill(0));
      const connectionStrength: Record<string, number> = {};

      relationships.forEach(rel => {
        const sourceIndex = entityMap.get(rel.source);
        const targetIndex = entityMap.get(rel.target);
        
        if (sourceIndex !== undefined && targetIndex !== undefined) {
          matrix[sourceIndex][targetIndex]++;
          
          const key = `${rel.source}-${rel.target}`;
          connectionStrength[key] = (connectionStrength[key] || 0) + 1;
        }
      });

      return {
        entities,
        relationships,
        matrix,
        propertyTypes,
        connectionStrength
      };
    };

    return analyzeRelationships(data);
  }, [data]);

  const getEntityConnections = (entityId: string) => {
    return matrixData.relationships.filter(rel => 
      rel.source === entityId || rel.target === entityId
    );
  };

  const getConnectionStrength = (sourceId: string, targetId: string) => {
    const key1 = `${sourceId}-${targetId}`;
    const key2 = `${targetId}-${sourceId}`;
    return (matrixData.connectionStrength[key1] || 0) + (matrixData.connectionStrength[key2] || 0);
  };

  const maxConnections = Math.max(...Object.values(matrixData.connectionStrength), 1);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Relationship Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of entity relationships and connection patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-blue-600">{matrixData.entities.length}</div>
              <div className="text-sm text-muted-foreground">Total Entities</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-green-600">{matrixData.relationships.length}</div>
              <div className="text-sm text-muted-foreground">Total Relations</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-orange-600">
                {Object.keys(matrixData.propertyTypes).length}
              </div>
              <div className="text-sm text-muted-foreground">Property Types</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round((matrixData.relationships.length / Math.max(matrixData.entities.length, 1)) * 100) / 100}
              </div>
              <div className="text-sm text-muted-foreground">Avg Relations/Entity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Relationship Matrix
          </CardTitle>
          <CardDescription>
            Interactive matrix showing connections between entities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={matrixView} onValueChange={(value) => setMatrixView(value as typeof matrixView)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="heat">Heat Map</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="flow">Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="heat" className="space-y-4">
              <ScrollArea className="h-96 w-full">
                <div className="grid gap-1 p-4" style={{ 
                  gridTemplateColumns: `repeat(${matrixData.entities.length + 1}, minmax(0, 1fr))` 
                }}>
                  {/* Header row */}
                  <div />
                  {matrixData.entities.map((entity, i) => (
                    <div 
                      key={i} 
                      className="text-xs p-1 text-center rotate-45 origin-bottom-left"
                      title={entity.id}
                    >
                      {entity.id.slice(-8)}
                    </div>
                  ))}
                  
                  {/* Matrix rows */}
                  {matrixData.matrix.map((row, i) => (
                    <React.Fragment key={i}>
                      <div 
                        className="text-xs p-1 text-right pr-2"
                        title={matrixData.entities[i]?.id}
                      >
                        {matrixData.entities[i]?.id.slice(-8)}
                      </div>
                      {row.map((cell, j) => (
                        <motion.div
                          key={`${i}-${j}`}
                          className="aspect-square border border-border cursor-pointer rounded-sm"
                          style={{
                            backgroundColor: cell > 0 
                              ? `hsl(${240 - (cell / Math.max(...matrixData.matrix.flat(), 1)) * 60}, 100%, ${70 + (cell / Math.max(...matrixData.matrix.flat(), 1)) * 20}%)`
                              : 'transparent'
                          }}
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                          onClick={() => {
                            if (cell > 0) {
                              setSelectedEntity(matrixData.entities[i]?.id || null);
                            }
                          }}
                          title={cell > 0 ? `${cell} connections` : 'No connection'}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matrixData.entities.slice(0, 20).map((entity) => {
                  const connections = getEntityConnections(entity.id);
                  return (
                    <motion.div
                      key={entity.id}
                      className="p-4 border border-border rounded-lg cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedEntity(
                        selectedEntity === entity.id ? null : entity.id
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{entity.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {connections.length} connections
                        </span>
                      </div>
                      <div className="text-sm font-medium mb-2">
                        {entity.id.length > 30 ? `${entity.id.slice(0, 30)}...` : entity.id}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {connections.slice(0, 3).map((conn, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 text-xs text-muted-foreground"
                          >
                            {conn.type === 'direct' && <Circle className="h-2 w-2 fill-blue-500" />}
                            {conn.type === 'reference' && <Square className="h-2 w-2 fill-green-500" />}
                            {conn.type === 'nested' && <Triangle className="h-2 w-2 fill-orange-500" />}
                            {conn.property}
                          </div>
                        ))}
                        {connections.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{connections.length - 3}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="flow" className="space-y-4">
              <div className="space-y-2">
                {Object.entries(matrixData.propertyTypes)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([property, count]) => (
                    <motion.div
                      key={property}
                      className="flex items-center gap-4 p-3 border border-border rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{property}</div>
                        <div className="text-sm text-muted-foreground">
                          Used in {count} relationships
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 bg-blue-500 rounded"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(matrixData.propertyTypes))) * 100}px` 
                          }}
                        />
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Entity Details */}
      {selectedEntity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Entity Details
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntity(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const entity = matrixData.entities.find(e => e.id === selectedEntity);
                const connections = getEntityConnections(selectedEntity);
                
                if (!entity) return null;
                
                return (
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium mb-2">Entity Information</div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">ID:</span>
                          <span className="font-mono text-sm">{entity.id}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant="outline">{entity.type}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">Properties:</span>
                          <span>{entity.properties.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium mb-2">Connections ({connections.length})</div>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {connections.map((conn, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: RELATIONSHIP_COLORS[conn.type] }}
                              />
                              <span className="font-medium">{conn.property}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground font-mono">
                                {conn.target.length > 20 ? `${conn.target.slice(0, 20)}...` : conn.target}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {conn.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Legend & Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-medium mb-3">Relationship Types</div>
              <div className="space-y-2">
                {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{type}</span>
                    <span className="text-muted-foreground">
                      ({matrixData.relationships.filter(r => r.type === type).length})
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-3">Top Properties</div>
              <div className="space-y-1">
                {Object.entries(matrixData.propertyTypes)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([property, count]) => (
                    <div key={property} className="flex justify-between text-sm">
                      <span>{property}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}