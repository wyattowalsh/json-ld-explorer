import { JSONLDData, Graph, GraphNode, GraphLink, DataStats } from '@/types';

export class JSONLDProcessor {
  private data: JSONLDData[];
  private nodeMap: Map<string, GraphNode>;
  private links: GraphLink[];

  constructor(data: JSONLDData | JSONLDData[]) {
    // Handle nested array structures and flatten them
    this.data = this.flattenData(data);
    this.nodeMap = new Map();
    this.links = [];
    this.processData();
  }

  private flattenData(data: JSONLDData | JSONLDData[]): JSONLDData[] {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data.flatMap(item => this.flattenData(item));
    }
    
    // Check if it's a JSON-LD graph structure
    if (data['@graph'] && Array.isArray(data['@graph'])) {
      return this.flattenData(data['@graph']);
    }
    
    // Handle nested contexts and objects
    if (typeof data === 'object' && data !== null) {
      const result = [data];
      
      // Look for nested arrays or objects that might contain entities
      Object.values(data).forEach(value => {
        if (Array.isArray(value)) {
          result.push(...this.flattenData(value));
        } else if (typeof value === 'object' && value !== null && 
                   (value['@type'] || value.type || value['@id'] || value.id)) {
          result.push(...this.flattenData(value));
        }
      });
      
      return result;
    }
    
    return [data];
  }

  private processData(): void {
    this.data.forEach(entity => this.processEntity(entity));
  }

  private processEntity(entity: JSONLDData, parentId?: string): void {
    // Handle array of entities at root level
    if (Array.isArray(entity)) {
      entity.forEach(item => this.processEntity(item, parentId));
      return;
    }

    // Skip non-object entities
    if (!entity || typeof entity !== 'object') {
      return;
    }

    const id = entity['@id'] || entity.id || this.generateId();
    const type = entity['@type'] || entity.type || 'Unknown';
    
    const node: GraphNode = {
      id,
      name: this.extractName(entity),
      type,
      properties: { ...entity },
      size: this.calculateNodeSize(entity),
      group: this.getTypeGroup(type),
      color: this.getTypeColor(type)
    };

    this.nodeMap.set(id, node);

    if (parentId) {
      this.links.push({
        source: parentId,
        target: id,
        type: 'contains',
        weight: 1
      });
    }

    this.processRelationships(entity, id);
  }

  private processRelationships(entity: JSONLDData, sourceId: string): void {
    Object.entries(entity).forEach(([key, value]) => {
      if (key.startsWith('@')) return;

      if (Array.isArray(value)) {
        value.forEach(item => this.processRelationshipValue(sourceId, key, item));
      } else {
        this.processRelationshipValue(sourceId, key, value);
      }
    });
  }

  private processRelationshipValue(sourceId: string, relationshipType: string, value: any): void {
    if (typeof value === 'object' && value !== null) {
      if (value['@id'] || value.id) {
        const targetId = value['@id'] || value.id;
        this.links.push({
          source: sourceId,
          target: targetId,
          type: relationshipType,
          weight: 1
        });
        
        if (!this.nodeMap.has(targetId)) {
          this.processEntity(value);
        }
      } else if (typeof value === 'object' && Object.keys(value).length > 0) {
        // Process nested objects as child entities
        this.processEntity(value, sourceId);
      }
    } else if (typeof value === 'string' && value.startsWith('http')) {
      // Handle URL references as potential linked entities
      const targetId = value;
      if (!this.nodeMap.has(targetId)) {
        const urlNode: GraphNode = {
          id: targetId,
          name: this.extractNameFromUrl(targetId),
          type: 'Reference',
          properties: { url: targetId },
          size: 3,
          group: this.getTypeGroup('Reference'),
          color: this.getTypeColor('Reference')
        };
        this.nodeMap.set(targetId, urlNode);
      }
      
      this.links.push({
        source: sourceId,
        target: targetId,
        type: relationshipType,
        weight: 0.5
      });
    }
  }

  private extractName(entity: JSONLDData): string {
    // Try multiple common name fields
    const nameFields = [
      entity.name,
      entity.title,
      entity.label,
      entity['rdfs:label'],
      entity['schema:name'],
      entity['foaf:name'],
      entity.givenName,
      entity.familyName,
      entity.companyName,
      entity.organizationName,
      entity.jobTitle,
      entity.roleName
    ];
    
    for (const field of nameFields) {
      if (field && typeof field === 'string') {
        return field;
      }
    }
    
    // Combine first and last names if available
    if (entity.givenName && entity.familyName) {
      return `${entity.givenName} ${entity.familyName}`;
    }
    
    // Extract from ID if it's a URL
    if (entity['@id'] || entity.id) {
      const id = entity['@id'] || entity.id;
      if (typeof id === 'string') {
        const extracted = this.extractNameFromUrl(id);
        if (extracted && extracted !== id) {
          return extracted;
        }
      }
    }
    
    return entity['@type'] || entity.type || 'Unnamed Entity';
  }

  private extractNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(Boolean);
      return segments[segments.length - 1] || urlObj.hostname;
    } catch {
      return url;
    }
  }

  private calculateNodeSize(entity: JSONLDData): number {
    const baseSize = 5;
    const propertyCount = Object.keys(entity).length;
    return baseSize + Math.log(propertyCount + 1) * 2;
  }

  private getTypeGroup(type: string): number {
    const typeGroups: Record<string, number> = {
      'Person': 1,
      'Organization': 2,
      'Place': 3,
      'Event': 4,
      'CreativeWork': 5,
      'Product': 6,
      'Service': 7,
      'Action': 8,
      'Thing': 9
    };
    
    return typeGroups[type] || 0;
  }

  private getTypeColor(type: string): string {
    const typeColors: Record<string, string> = {
      'Person': '#FF6B6B',
      'Organization': '#4ECDC4',
      'Place': '#45B7D1',
      'Event': '#96CEB4',
      'CreativeWork': '#FFEAA7',
      'Product': '#DDA0DD',
      'Service': '#98D8C8',
      'Action': '#F7DC6F',
      'Thing': '#AED6F1',
      'Reference': '#E67E22'
    };
    
    return typeColors[type] || '#95A5A6';
  }

  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getGraph(): Graph {
    return {
      nodes: Array.from(this.nodeMap.values()),
      links: this.links
    };
  }

  public getDataStats(): DataStats {
    const entities = this.data;
    const entityTypes: Record<string, number> = {};
    const propertyCount: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};

    entities.forEach(entity => {
      const type = entity['@type'] || entity.type || 'Unknown';
      entityTypes[type] = (entityTypes[type] || 0) + 1;

      Object.keys(entity).forEach(key => {
        if (!key.startsWith('@')) {
          propertyCount[key] = (propertyCount[key] || 0) + 1;
        }
      });
    });

    this.links.forEach(link => {
      relationshipTypes[link.type] = (relationshipTypes[link.type] || 0) + 1;
    });

    const totalProperties = Object.values(propertyCount).reduce((sum, count) => sum + count, 0);
    const uniqueProperties = Object.keys(propertyCount).length;
    
    return {
      totalEntities: entities.length,
      entityTypes,
      propertyCount,
      relationshipTypes,
      dataComplexity: totalProperties / entities.length,
      schemaCompliance: this.calculateSchemaCompliance()
    };
  }

  private calculateSchemaCompliance(): number {
    const requiredFields = ['@type', '@id', 'name'];
    let compliance = 0;
    
    this.data.forEach(entity => {
      const hasRequired = requiredFields.some(field => 
        entity[field] || entity[field.replace('@', '')]
      );
      if (hasRequired) compliance++;
    });
    
    return this.data.length > 0 ? (compliance / this.data.length) * 100 : 0;
  }

  public static async loadFromUrl(url: string): Promise<JSONLDData | JSONLDData[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading JSON-LD data:', error);
      throw error;
    }
  }

  public static validateJSONLD(data: any): boolean {
    if (!data) return false;
    
    const entities = Array.isArray(data) ? data : [data];
    return entities.every(entity => 
      typeof entity === 'object' && 
      entity !== null &&
      Object.keys(entity).length > 0
    );
  }
}