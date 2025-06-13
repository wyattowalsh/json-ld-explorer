import React from 'react';
import { Graph, DataStats, GraphAnalytics } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, CheckCircle, Info, Lightbulb } from 'lucide-react';

interface SemanticInsightsProps {
  graph: Graph | null;
  dataStats: DataStats | null;
  graphAnalytics: GraphAnalytics | null;
}

interface Insight {
  id: string;
  title: string;
  description: string | React.ReactNode;
  severity: 'info' | 'warning' | 'suggestion' | 'error';
  category: string;
  details?: React.ReactNode;
}

const generateConnectivityInsights = (graph: Graph, analytics: GraphAnalytics): Insight[] => {
  const insights: Insight[] = [];
  if (!analytics || !graph || !graph.nodes || !analytics.centralityMeasures) return insights;

  const degreeThreshold = analytics.averageDegree > 0 ? analytics.averageDegree * 1.5 + 3 : 5; // Adjusted threshold
  const hubs = Object.entries(analytics.centralityMeasures.degree)
    .filter(([_, degree]) => degree > degreeThreshold)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (hubs.length > 0) {
    insights.push({
      id: 'hub-nodes',
      title: 'Key Connectors (Hub Nodes)',
      description: `Found ${hubs.length} node(s) with notably high connectivity. These may act as central points in your data.`,
      severity: 'info',
      category: 'Connectivity Patterns',
      details: (
        <ul className="list-disc pl-5 space-y-1">
          {hubs.map(([nodeId, degree]) => {
            const node = graph.nodes.find(n => n.id === nodeId);
            return <li key={nodeId}><span className="font-medium">{node?.label || nodeId}</span> (Connections: {degree})</li>;
          })}
        </ul>
      )
    });
  }

  const isolatedNodes = graph.nodes.filter(node => (analytics.centralityMeasures.degree[node.id] || 0) === 0);
  if (isolatedNodes.length > 0 && isolatedNodes.length < graph.nodes.length) { // Avoid showing if all nodes are isolated
     insights.push({
      id: 'isolated-nodes',
      title: 'Potentially Isolated Entities',
      description: `${isolatedNodes.length} entity/entities appear to have no connections within this dataset. This might be expected or could indicate missing links.`,
      severity: 'warning',
      category: 'Data Quality Checks',
      details: (
        <>
          <p>First few isolated entities:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            {isolatedNodes.slice(0,5).map(node => <li key={node.id}>{node.label || node.id}</li>)}
            {isolatedNodes.length > 5 && <li>...and {isolatedNodes.length - 5} more.</li>}
          </ul>
        </>
      )
    });
  }
  
  if (analytics.density < 0.01 && graph.nodes.length > 10) { // Example threshold for sparse graph
    insights.push({
      id: 'sparse-graph',
      title: 'Sparse Connectivity',
      description: `The graph density is very low (${(analytics.density * 100).toFixed(2)}%), suggesting entities are not highly interconnected.`,
      severity: 'suggestion',
      category: 'Connectivity Patterns',
    });
  }


  return insights;
};

const generateSchemaUsageInsights = (dataStats: DataStats, graph: Graph): Insight[] => {
  const insights: Insight[] = [];
  if (!dataStats || !dataStats.entityTypes || !graph || !graph.nodes) return insights;

  const topTypes = Object.entries(dataStats.entityTypes)
    .sort(([,a], [,b]) => b-a)
    .slice(0,3);
  if (topTypes.length > 0) {
    insights.push({
      id: 'dominant-types',
      title: 'Dominant Entity Types',
      description: `The most frequently occurring entity types are: ${topTypes.map(([type, count]) => `${type} (${count} instances)`).join(', ')}.`,
      severity: 'info',
      category: 'Schema & Content Structure',
    });
  }
  
  const typeDiversity = Object.keys(dataStats.entityTypes).length;
  if (typeDiversity <= 2 && graph.nodes.length > 10) {
     insights.push({
      id: 'low-type-diversity',
      title: 'Low Entity Type Diversity',
      description: `The dataset primarily consists of only ${typeDiversity} type(s) of entities. This might be normal for specialized datasets.`,
      severity: 'info',
      category: 'Schema & Content Structure',
    });
  } else if (typeDiversity > 10) { // Example threshold for high diversity
     insights.push({
      id: 'high-type-diversity',
      title: 'High Entity Type Diversity',
      description: `The dataset contains a wide variety of entity types (${typeDiversity} distinct types), indicating a complex or heterogeneous data model.`,
      severity: 'info',
      category: 'Schema & Content Structure',
    });
  }

  return insights;
};

const generateDataQualityInsights = (graph: Graph, dataStats: DataStats): Insight[] => {
  const insights: Insight[] = [];
  if (!graph || !graph.nodes || !dataStats) return insights;

  const nodesWithFewProperties = graph.nodes.filter(node => Object.keys(node.properties || {}).length < 2 && Object.keys(node.properties || {}).length > 0);
  if (nodesWithFewProperties.length > 0 && nodesWithFewProperties.length < graph.nodes.length / 3) {
    insights.push({
      id: 'sparse-nodes-properties',
      title: 'Entities with Minimal Properties',
      description: `${nodesWithFewProperties.length} entity/entities have only one descriptive property (excluding ID/type). This could be normal for certain link-heavy entities or indicate sparse data.`,
      severity: 'suggestion',
      category: 'Data Quality Checks',
      details: (
        <>
        <p>Examples of entities with minimal properties:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          {nodesWithFewProperties.slice(0,5).map(node => <li key={node.id}>{node.label || node.id} (Properties: {Object.keys(node.properties || {}).length})</li>)}
          {nodesWithFewProperties.length > 5 && <li>...and ${nodesWithFewProperties.length - 5} more.</li>}
        </ul>
        </>
      )
    });
  }
  
  const nodesWithoutLabels = graph.nodes.filter(node => !node.label && (!node.properties || !node.properties.name && !node.properties.title));
  if (nodesWithoutLabels.length > 0 && nodesWithoutLabels.length < graph.nodes.length / 2) {
    insights.push({
      id: 'unlabeled-nodes',
      title: 'Entities Lacking Clear Labels',
      description: `${nodesWithoutLabels.length} entity/entities do not have a common labeling property (e.g., name, title, rdfs:label). This can make exploration harder.`,
      severity: 'suggestion',
      category: 'Data Quality Checks',
      details: (
        <>
        <p>Examples of entities without clear labels (showing ID):</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          {nodesWithoutLabels.slice(0,5).map(node => <li key={node.id}>{node.id}</li>)}
          {nodesWithoutLabels.length > 5 && <li>...and ${nodesWithoutLabels.length - 5} more.</li>}
        </ul>
        </>
      )
    });
  }

  return insights;
};


export const SemanticInsights: React.FC<SemanticInsightsProps> = ({ graph, dataStats, graphAnalytics }) => {
  if (!graph || !dataStats || !graphAnalytics) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-primary" /> Semantic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Load and process data to generate semantic insights.</p>
        </CardContent>
      </Card>
    );
  }

  const allInsights: Insight[] = [
    ...generateConnectivityInsights(graph, graphAnalytics),
    ...generateSchemaUsageInsights(dataStats, graph),
    ...generateDataQualityInsights(graph, dataStats),
  ].filter(insight => insight !== null);

  if (allInsights.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Semantic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No specific semantic insights generated for this dataset, or the dataset appears well-structured according to basic checks.</p>
        </CardContent>
      </Card>
    );
  }

  const insightsByCategory = allInsights.reduce((acc, insight) => {
    (acc[insight.category] = acc[insight.category] || []).push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  const getSeverityIcon = (severity: Insight['severity']) => {
    switch (severity) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'info':
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const categoryOrder = ['Data Quality Checks', 'Connectivity Patterns', 'Schema & Content Structure'];

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          Semantic Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(insightsByCategory).length > 0 ? (
          <Accordion type="multiple" defaultValue={categoryOrder.filter(cat => insightsByCategory[cat])} className="w-full">
            {categoryOrder.map((category) => {
              const insights = insightsByCategory[category];
              if (!insights || insights.length === 0) return null;
              
              return (
                <AccordionItem value={category} key={category}>
                  <AccordionTrigger className="text-md font-semibold hover:no-underline">
                    {category} ({insights.length} insight{insights.length === 1 ? '' : 's'})
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="space-y-3">
                      {insights.map((insight) => (
                        <div key={insight.id} className="p-3 rounded-md border bg-background">
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
                            {getSeverityIcon(insight.severity)}
                            {insight.title}
                          </h4>
                          <div className="text-xs text-muted-foreground ml-6">{insight.description}</div>
                          {insight.details && (
                            <div className="mt-2 ml-6 p-2 bg-muted/50 rounded-md border text-xs">
                              {insight.details}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
           <p className="text-muted-foreground">No specific semantic insights generated for the current dataset.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SemanticInsights;
