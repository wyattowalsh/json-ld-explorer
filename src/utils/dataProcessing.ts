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
    } else if (typeof value === 'string') {
      if (value.startsWith('http://') || value.startsWith('https://')) {
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
      } else if (value.trim() && !relationshipType.startsWith('@')) {
        // Create leaf nodes for meaningful string values
        const leafId = `${sourceId}_${relationshipType}_${value}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (!this.nodeMap.has(leafId)) {
          const leafNode: GraphNode = {
            id: leafId,
            name: this.extractName(value),
            type: 'Value',
            properties: { value: value, sourceProperty: relationshipType },
            size: 4,
            group: this.getTypeGroup('Value'),
            color: this.getTypeColor('Value')
          };
          this.nodeMap.set(leafId, leafNode);
        }
        
        this.links.push({
          source: sourceId,
          target: leafId,
          type: relationshipType,
          weight: 0.3
        });
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // Create leaf nodes for primitive values
      const leafId = `${sourceId}_${relationshipType}_${value}`;
      if (!this.nodeMap.has(leafId)) {
        const leafNode: GraphNode = {
          id: leafId,
          name: String(value),
          type: typeof value === 'number' ? 'Number' : 'Boolean',
          properties: { value: value, sourceProperty: relationshipType },
          size: 3,
          group: this.getTypeGroup('Value'),
          color: this.getTypeColor('Value')
        };
        this.nodeMap.set(leafId, leafNode);
      }
      
      this.links.push({
        source: sourceId,
        target: leafId,
        type: relationshipType,
        weight: 0.2
      });
    }
  }

  private extractName(entity: JSONLDData): string {
    // Handle string values directly (leaf nodes)
    if (typeof entity === 'string') {
      return this.extractNameFromUrl(entity);
    }
    
    // Handle array of values
    if (Array.isArray(entity)) {
      return entity.length > 0 ? this.extractName(entity[0]) : 'Array Value';
    }
    
    // Handle non-object entities
    if (!entity || typeof entity !== 'object') {
      return String(entity) || 'Unknown Value';
    }
    
    // Try multiple common name fields with better handling
    const nameFields = [
      entity.name,
      entity.title,
      entity.label,
      entity['rdfs:label'],
      entity['schema:name'],
      entity['foaf:name'],
      entity['dc:title'],
      entity['dcterms:title'],
      entity.givenName,
      entity.familyName,
      entity.firstName,
      entity.lastName,
      entity.companyName,
      entity.organizationName,
      entity.jobTitle,
      entity.roleName,
      entity.description,
      entity['rdfs:comment']
    ];
    
    for (const field of nameFields) {
      if (field) {
        if (typeof field === 'string' && field.trim()) {
          return field.trim();
        }
        if (typeof field === 'object' && field['@value']) {
          return String(field['@value']).trim();
        }
        if (Array.isArray(field) && field.length > 0) {
          const firstValue = field[0];
          if (typeof firstValue === 'string') {
            return firstValue.trim();
          }
          if (typeof firstValue === 'object' && firstValue['@value']) {
            return String(firstValue['@value']).trim();
          }
        }
      }
    }
    
    // Combine first and last names if available
    const firstName = entity.givenName || entity.firstName;
    const lastName = entity.familyName || entity.lastName;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    // Try to extract meaningful name from any property that looks like a name
    for (const [key, value] of Object.entries(entity)) {
      if (key.toLowerCase().includes('name') || 
          key.toLowerCase().includes('title') || 
          key.toLowerCase().includes('label')) {
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }
    
    // Extract from ID if it's a URL
    if (entity['@id'] || entity.id) {
      const id = entity['@id'] || entity.id;
      if (typeof id === 'string') {
        const extracted = this.extractNameFromUrl(id);
        if (extracted && extracted !== id && extracted.length > 1) {
          return extracted;
        }
      }
    }
    
    // Use type as fallback, but make it more readable
    const type = entity['@type'] || entity.type;
    if (type) {
      if (typeof type === 'string') {
        return this.makeReadableType(type);
      }
      if (Array.isArray(type) && type.length > 0) {
        return this.makeReadableType(String(type[0]));
      }
    }
    
    return 'Unnamed Entity';
  }

  private extractNameFromUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return String(url) || 'Unknown';
    }
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      
      if (lastSegment) {
        // Decode URI component and clean up
        const decoded = decodeURIComponent(lastSegment);
        // Replace common separators with spaces and capitalize
        return decoded
          .replace(/[-_]/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/\b\w/g, l => l.toUpperCase())
          .trim();
      }
      
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      // Not a valid URL, treat as identifier
      const cleaned = url
        .replace(/^.*[#\/]/, '') // Remove everything before last # or /
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
      
      return cleaned || url;
    }
  }

  private makeReadableType(type: string): string {
    if (!type) return 'Entity';
    
    // Remove namespace prefixes
    const withoutNamespace = type.replace(/^.*[#\/:]/, '');
    
    // Add spaces before capital letters and capitalize
    return withoutNamespace
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim() || 'Entity';
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
      'Reference': '#E67E22',
      'Value': '#BDC3C7',
      'Number': '#3498DB',
      'Boolean': '#9B59B6'
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