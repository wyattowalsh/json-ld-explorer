import { Graph, GraphAnalytics, GraphNode, GraphLink } from '@/types';

export class GraphAnalyticsEngine {
  private graph: Graph;
  private adjacencyList: Map<string, Set<string>>;
  private nodeMap: Map<string, GraphNode>;

  constructor(graph: Graph) {
    this.graph = graph;
    this.adjacencyList = new Map();
    this.nodeMap = new Map();
    this.buildAdjacencyList();
  }

  private buildAdjacencyList(): void {
    this.graph.nodes.forEach(node => {
      this.adjacencyList.set(node.id, new Set());
      this.nodeMap.set(node.id, node);
    });

    this.graph.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      this.adjacencyList.get(sourceId)?.add(targetId);
      this.adjacencyList.get(targetId)?.add(sourceId);
    });
  }

  public calculateAnalytics(): GraphAnalytics {
    const nodeCount = this.graph.nodes.length;
    const linkCount = this.graph.links.length;
    const density = this.calculateDensity();
    const degrees = this.calculateDegrees();
    
    return {
      nodeCount,
      linkCount,
      density,
      averageDegree: this.calculateAverageDegree(degrees),
      maxDegree: Math.max(...Object.values(degrees)),
      minDegree: Math.min(...Object.values(degrees)),
      clustering: this.calculateClusteringCoefficient(),
      centralityMeasures: {
        betweenness: this.calculateBetweennessCentrality(),
        closeness: this.calculateClosenessCentrality(),
        degree: degrees,
        eigenvector: this.calculateEigenvectorCentrality()
      },
      communities: this.detectCommunities(),
      diameter: this.calculateDiameter(),
      averagePathLength: this.calculateAveragePathLength()
    };
  }

  private calculateDensity(): number {
    const n = this.graph.nodes.length;
    if (n <= 1) return 0;
    return (2 * this.graph.links.length) / (n * (n - 1));
  }

  private calculateDegrees(): Record<string, number> {
    const degrees: Record<string, number> = {};
    
    this.graph.nodes.forEach(node => {
      degrees[node.id] = this.adjacencyList.get(node.id)?.size || 0;
    });
    
    return degrees;
  }

  private calculateAverageDegree(degrees: Record<string, number>): number {
    const values = Object.values(degrees);
    return values.length > 0 ? values.reduce((sum, deg) => sum + deg, 0) / values.length : 0;
  }

  private calculateClusteringCoefficient(): number {
    let totalClustering = 0;
    let validNodes = 0;

    this.graph.nodes.forEach(node => {
      const neighbors = Array.from(this.adjacencyList.get(node.id) || []);
      const degree = neighbors.length;
      
      if (degree < 2) return;

      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (this.adjacencyList.get(neighbors[i])?.has(neighbors[j])) {
            triangles++;
          }
        }
      }

      const possibleTriangles = (degree * (degree - 1)) / 2;
      totalClustering += triangles / possibleTriangles;
      validNodes++;
    });

    return validNodes > 0 ? totalClustering / validNodes : 0;
  }

  private calculateBetweennessCentrality(): Record<string, number> {
    const betweenness: Record<string, number> = {};
    const nodes = Array.from(this.nodeMap.keys());
    
    nodes.forEach(nodeId => {
      betweenness[nodeId] = 0;
    });

    nodes.forEach(source => {
      const stack: string[] = [];
      const predecessors: Map<string, string[]> = new Map();
      const distances: Map<string, number> = new Map();
      const pathCounts: Map<string, number> = new Map();
      const queue: string[] = [];

      nodes.forEach(node => {
        predecessors.set(node, []);
        distances.set(node, -1);
        pathCounts.set(node, 0);
      });

      distances.set(source, 0);
      pathCounts.set(source, 1);
      queue.push(source);

      while (queue.length > 0) {
        const current = queue.shift()!;
        stack.push(current);
        
        const neighbors = Array.from(this.adjacencyList.get(current) || []);
        neighbors.forEach(neighbor => {
          const currentDist = distances.get(current)!;
          const neighborDist = distances.get(neighbor)!;
          
          if (neighborDist < 0) {
            queue.push(neighbor);
            distances.set(neighbor, currentDist + 1);
          }
          
          if (distances.get(neighbor) === currentDist + 1) {
            pathCounts.set(neighbor, pathCounts.get(neighbor)! + pathCounts.get(current)!);
            predecessors.get(neighbor)!.push(current);
          }
        });
      }

      const delta: Map<string, number> = new Map();
      nodes.forEach(node => delta.set(node, 0));

      while (stack.length > 0) {
        const current = stack.pop()!;
        const currentPreds = predecessors.get(current)!;
        
        currentPreds.forEach(pred => {
          const contribution = (pathCounts.get(pred)! / pathCounts.get(current)!) * (1 + delta.get(current)!);
          delta.set(pred, delta.get(pred)! + contribution);
        });
        
        if (current !== source) {
          betweenness[current] += delta.get(current)!;
        }
      }
    });

    // Normalize
    const n = nodes.length;
    const normFactor = n > 2 ? 2 / ((n - 1) * (n - 2)) : 1;
    
    Object.keys(betweenness).forEach(nodeId => {
      betweenness[nodeId] *= normFactor;
    });

    return betweenness;
  }

  private calculateClosenessCentrality(): Record<string, number> {
    const closeness: Record<string, number> = {};
    const nodes = Array.from(this.nodeMap.keys());

    nodes.forEach(source => {
      const distances = this.bfs(source);
      let totalDistance = 0;
      let reachableNodes = 0;

      Object.values(distances).forEach(distance => {
        if (distance > 0) {
          totalDistance += distance;
          reachableNodes++;
        }
      });

      closeness[source] = reachableNodes > 0 ? reachableNodes / totalDistance : 0;
    });

    return closeness;
  }

  private calculateEigenvectorCentrality(): Record<string, number> {
    const nodes = Array.from(this.nodeMap.keys());
    const centrality: Record<string, number> = {};
    const tolerance = 1e-6;
    const maxIterations = 100;

    // Initialize with equal values
    nodes.forEach(nodeId => {
      centrality[nodeId] = 1;
    });

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const newCentrality: Record<string, number> = {};
      let maxChange = 0;

      nodes.forEach(nodeId => {
        newCentrality[nodeId] = 0;
        const neighbors = Array.from(this.adjacencyList.get(nodeId) || []);
        neighbors.forEach(neighbor => {
          newCentrality[nodeId] += centrality[neighbor];
        });
      });

      // Normalize
      const norm = Math.sqrt(Object.values(newCentrality).reduce((sum, val) => sum + val * val, 0));
      if (norm > 0) {
        Object.keys(newCentrality).forEach(nodeId => {
          newCentrality[nodeId] /= norm;
          maxChange = Math.max(maxChange, Math.abs(newCentrality[nodeId] - centrality[nodeId]));
        });
      }

      Object.assign(centrality, newCentrality);

      if (maxChange < tolerance) break;
    }

    return centrality;
  }

  private detectCommunities(): Record<string, number> {
    // Simple community detection using modularity optimization
    const communities: Record<string, number> = {};
    const nodes = Array.from(this.nodeMap.keys());
    
    // Initialize each node in its own community
    nodes.forEach((nodeId, index) => {
      communities[nodeId] = index;
    });

    let improved = true;
    while (improved) {
      improved = false;
      
      nodes.forEach(nodeId => {
        const neighbors = Array.from(this.adjacencyList.get(nodeId) || []);
        const communityScores: Record<number, number> = {};
        
        neighbors.forEach(neighbor => {
          const community = communities[neighbor];
          communityScores[community] = (communityScores[community] || 0) + 1;
        });
        
        const bestCommunity = Object.entries(communityScores).reduce((best, [community, score]) => {
          return score > best.score ? { community: parseInt(community), score } : best;
        }, { community: communities[nodeId], score: 0 });
        
        if (bestCommunity.community !== communities[nodeId] && bestCommunity.score > 0) {
          communities[nodeId] = bestCommunity.community;
          improved = true;
        }
      });
    }

    return communities;
  }

  private calculateDiameter(): number {
    const nodes = Array.from(this.nodeMap.keys());
    let maxDistance = 0;

    nodes.forEach(source => {
      const distances = this.bfs(source);
      const maxDist = Math.max(...Object.values(distances).filter(d => d > 0));
      maxDistance = Math.max(maxDistance, maxDist);
    });

    return maxDistance;
  }

  private calculateAveragePathLength(): number {
    const nodes = Array.from(this.nodeMap.keys());
    let totalDistance = 0;
    let pathCount = 0;

    nodes.forEach(source => {
      const distances = this.bfs(source);
      Object.values(distances).forEach(distance => {
        if (distance > 0) {
          totalDistance += distance;
          pathCount++;
        }
      });
    });

    return pathCount > 0 ? totalDistance / pathCount : 0;
  }

  private bfs(startNode: string): Record<string, number> {
    const distances: Record<string, number> = {};
    const queue: string[] = [startNode];
    const visited = new Set<string>();

    distances[startNode] = 0;
    visited.add(startNode);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = Array.from(this.adjacencyList.get(current) || []);

      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          distances[neighbor] = distances[current] + 1;
          queue.push(neighbor);
        }
      });
    }

    return distances;
  }
}