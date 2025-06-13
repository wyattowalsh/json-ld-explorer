export interface JSONLDData {
  '@context'?: string | object;
  '@type'?: string;
  '@id'?: string;
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  group?: number;
  size?: number;
  color?: string;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  weight?: number;
  value?: number;
  color?: string;
}

export interface Graph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphAnalytics {
  nodeCount: number;
  linkCount: number;
  density: number;
  averageDegree: number;
  maxDegree: number;
  minDegree: number;
  clustering: number;
  centralityMeasures: {
    betweenness: Record<string, number>;
    closeness: Record<string, number>;
    degree: Record<string, number>;
    eigenvector: Record<string, number>;
  };
  communities: Record<string, number>;
  diameter: number;
  averagePathLength: number;
}

export interface DataStats {
  totalEntities: number;
  entityTypes: Record<string, number>;
  propertyCount: Record<string, number>;
  relationshipTypes: Record<string, number>;
  dataComplexity: number;
  schemaCompliance: number;
}

export interface VisualizationMode {
  id: string;
  name: string;
  description: string;
  dimension: '2D' | '3D';
  type: 'force' | 'hierarchy' | 'circular' | 'matrix' | 'radial' | 'grid' | 'spiral' | 'cluster' | 'arc';
}