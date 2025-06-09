import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar,
  ScatterChart, Scatter, Area, AreaChart, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Users, Network, Share2, Zap, TrendingUp, Target,
  Activity, GitBranch, Layers, Globe, BarChart3, PieChart as PieChartIcon,
  Maximize2, Download, TrendingDown
} from 'lucide-react';
import { DataStats, GraphAnalytics } from '@/types';

interface StatsPanelProps {
  dataStats: DataStats;
  graphAnalytics: GraphAnalytics;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
              {entry.payload.percentage && ` (${entry.payload.percentage}%)`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const exportChart = (chartId: string) => {
    const element = document.getElementById(chartId);
    if (element) {
      const svg = element.querySelector('svg');
      if (svg) {
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${chartId}-${Date.now()}.svg`;
        link.click();
      }
    }
  };

  const toggleChartType = (chartKey: string, newType: string) => {
    setActiveChartType(prev => ({
      ...prev,
      [chartKey]: newType
    }));
  };

export function StatsPanel({ dataStats, graphAnalytics }: StatsPanelProps) {
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [activeChartType, setActiveChartType] = useState<Record<string, string>>({
    entityTypes: 'pie',
    centrality: 'bar',
    relationships: 'bar'
  });

  const entityTypeData = Object.entries(dataStats.entityTypes).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: (count / dataStats.totalEntities * 100).toFixed(1),
    fill: COLORS[Object.keys(dataStats.entityTypes).indexOf(type) % COLORS.length]
  }));

  const relationshipData = Object.entries(dataStats.relationshipTypes).map(([type, count]) => ({
    name: type,
    count,
    percentage: (count / Object.values(dataStats.relationshipTypes).reduce((a, b) => a + b, 0) * 100).toFixed(1)
  }));

  const centralityData = Object.entries(graphAnalytics.centralityMeasures.degree)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([node, degree]) => ({
      node: node.length > 25 ? node.substring(0, 25) + '...' : node,
      fullNode: node,
      degree,
      betweenness: parseFloat(graphAnalytics.centralityMeasures.betweenness[node]?.toFixed(4) || '0'),
      closeness: parseFloat(graphAnalytics.centralityMeasures.closeness[node]?.toFixed(4) || '0'),
      eigenvector: parseFloat(graphAnalytics.centralityMeasures.eigenvector[node]?.toFixed(4) || '0')
    }));

  const degreeDistribution = Object.values(graphAnalytics.centralityMeasures.degree)
    .reduce((acc, degree) => {
      acc[degree] = (acc[degree] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

  const degreeDistributionData = Object.entries(degreeDistribution)
    .map(([degree, count]) => ({
      degree: parseInt(degree),
      count,
      percentage: (count / graphAnalytics.nodeCount * 100).toFixed(1)
    }))
    .sort((a, b) => a.degree - b.degree);

  const metricsCards = [
    {
      title: 'Total Entities',
      value: dataStats.totalEntities.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
      gradient: 'from-blue-500/20 to-blue-600/20'
    },
    {
      title: 'Graph Connections',
      value: graphAnalytics.linkCount.toLocaleString(),
      icon: Network,
      color: 'text-green-500',
      gradient: 'from-green-500/20 to-green-600/20'
    },
    {
      title: 'Graph Density',
      value: (graphAnalytics.density * 100).toFixed(2) + '%',
      icon: Share2,
      color: 'text-purple-500',
      gradient: 'from-purple-500/20 to-purple-600/20'
    },
    {
      title: 'Average Degree',
      value: graphAnalytics.averageDegree.toFixed(2),
      icon: GitBranch,
      color: 'text-orange-500',
      gradient: 'from-orange-500/20 to-orange-600/20'
    },
    {
      title: 'Clustering Coefficient',
      value: (graphAnalytics.clustering * 100).toFixed(1) + '%',
      icon: Layers,
      color: 'text-teal-500',
      gradient: 'from-teal-500/20 to-teal-600/20'
    },
    {
      title: 'Network Diameter',
      value: graphAnalytics.diameter.toString(),
      icon: Target,
      color: 'text-red-500',
      gradient: 'from-red-500/20 to-red-600/20'
    },
    {
      title: 'Schema Compliance',
      value: dataStats.schemaCompliance.toFixed(1) + '%',
      icon: Zap,
      color: 'text-yellow-500',
      gradient: 'from-yellow-500/20 to-yellow-600/20'
    },
    {
      title: 'Avg Path Length',
      value: graphAnalytics.averagePathLength.toFixed(2),
      icon: Globe,
      color: 'text-indigo-500',
      gradient: 'from-indigo-500/20 to-indigo-600/20'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricsCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient}`} />
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <metric.icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Entity Types Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Entity Types Distribution
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-md border">
                    <Button
                      variant={activeChartType.entityTypes === 'pie' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => toggleChartType('entityTypes', 'pie')}
                      className="rounded-r-none"
                    >
                      <PieChartIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={activeChartType.entityTypes === 'bar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => toggleChartType('entityTypes', 'bar')}
                      className="rounded-l-none"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportChart('entity-types-chart')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFullscreenChart('entityTypes')}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div id="entity-types-chart">
                  <ResponsiveContainer width="100%" height={320}>
                    {activeChartType.entityTypes === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={entityTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={130}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {entityTypeData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.fill}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => `${value} (${entry.payload.percentage}%)`}
                        />
                      </PieChart>
                    ) : (
                      <BarChart data={entityTypeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          radius={[4, 4, 0, 0]}
                          fill="#8884d8"
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entityTypeData.map((item, index) => (
                    <motion.div
                      key={item.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge 
                        variant="outline"
                        className="text-xs cursor-pointer transition-all"
                        style={{ 
                          borderColor: item.fill,
                          color: item.fill
                        }}
                      >
                        {item.name}: {item.value} ({item.percentage}%)
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Centrality Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Centrality Analysis
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-md border">
                    <Button
                      variant={activeChartType.centrality === 'bar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => toggleChartType('centrality', 'bar')}
                      className="rounded-r-none"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={activeChartType.centrality === 'scatter' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => toggleChartType('centrality', 'scatter')}
                      className="rounded-l-none"
                    >
                      <Target className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportChart('centrality-chart')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFullscreenChart('centrality')}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div id="centrality-chart">
                <ResponsiveContainer width="100%" height={320}>
                  {activeChartType.centrality === 'bar' ? (
                    <BarChart data={centralityData.slice(0, 10)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis 
                        dataKey="node" 
                        type="category" 
                        width={120} 
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="degree" fill="#8884d8" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="betweenness" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  ) : (
                    <ScatterChart data={centralityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="betweenness" 
                        name="Betweenness" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        dataKey="closeness" 
                        name="Closeness" 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={<CustomTooltip />}
                      />
                      <Scatter 
                        name="Nodes" 
                        dataKey="degree" 
                        fill="#8884d8"
                      />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="font-medium text-blue-600">Degree Centrality</p>
                  <p className="text-xs text-muted-foreground">Direct connections</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="font-medium text-green-600">Betweenness Centrality</p>
                  <p className="text-xs text-muted-foreground">Bridge importance</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="font-medium text-purple-600">Closeness Centrality</p>
                  <p className="text-xs text-muted-foreground">Reach efficiency</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Degree Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Degree Distribution
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFullscreenChart('degreeDistribution')}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={degreeDistributionData.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="degree" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Degree', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-2 text-center">
                <Badge variant="outline">
                  Power-law distribution indicates scale-free network
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Relationship Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Relationship Types
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-md border">
                    <Button
                      variant={activeChartType.relationships === 'bar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => toggleChartType('relationships', 'bar')}
                      className="rounded-r-none"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={activeChartType.relationships === 'radial' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => toggleChartType('relationships', 'radial')}
                      className="rounded-l-none"
                    >
                      <Target className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFullscreenChart('relationships')}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                {activeChartType.relationships === 'bar' ? (
                  <BarChart data={relationshipData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="#82ca9d" 
                      radius={[4, 4, 0, 0]}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  </BarChart>
                ) : (
                  <RadialBarChart data={relationshipData.slice(0, 8)} innerRadius="20%" outerRadius="90%">
                    <RadialBar 
                      dataKey="count" 
                      cornerRadius={4} 
                      fill="#82ca9d"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      iconSize={8}
                      width={120}
                      height={140}
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                    />
                  </RadialBarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Centrality Measures Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Network Analytics Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Max Degree</p>
                  <p className="text-lg font-bold">{graphAnalytics.maxDegree}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Min Degree</p>
                  <p className="text-lg font-bold">{graphAnalytics.minDegree}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Communities</p>
                  <p className="text-lg font-bold">
                    {new Set(Object.values(graphAnalytics.communities)).size}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Data Complexity</p>
                  <p className="text-lg font-bold">{dataStats.dataComplexity.toFixed(1)}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Top Properties</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(dataStats.propertyCount)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([property, count]) => (
                      <Badge key={property} variant="secondary" className="text-xs">
                        {property}: {count}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>

      // {/* Fullscreen Chart Modal */}
      <AnimatePresence>
        {fullscreenChart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full w-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-4">
                  <Activity className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">
                    {fullscreenChart === 'entityTypes' && 'Entity Types Distribution'}
                    {fullscreenChart === 'centrality' && 'Centrality Analysis'}
                    {fullscreenChart === 'relationships' && 'Relationship Types'}
                    {fullscreenChart === 'degreeDistribution' && 'Degree Distribution'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => exportChart(`fullscreen-${fullscreenChart}-chart`)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFullscreenChart(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Fullscreen Chart */}
              <div className="flex-1 p-6">
                <div id={`fullscreen-${fullscreenChart}-chart`} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {fullscreenChart === 'entityTypes' && activeChartType.entityTypes === 'pie' && (
                      <PieChart>
                        <Pie
                          data={entityTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={100}
                          outerRadius={200}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {entityTypeData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.fill}
                              stroke="#fff"
                              strokeWidth={3}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={60}
                          formatter={(value, entry) => (
                            <span style={{ color: entry.color, fontSize: '14px' }}>
                              {value} ({entry.payload.percentage}%)
                            </span>
                          )}
                        />
                      </PieChart>
                    )}

                    {fullscreenChart === 'entityTypes' && activeChartType.entityTypes === 'bar' && (
                      <BarChart data={entityTypeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 14 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fontSize: 14 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          radius={[8, 8, 0, 0]}
                          fill="#8884d8"
                        />
                      </BarChart>
                    )}

                    {fullscreenChart === 'centrality' && (
                      <BarChart data={centralityData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 14 }} />
                        <YAxis 
                          dataKey="node" 
                          type="category" 
                          width={200} 
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="degree" fill="#8884d8" radius={[0, 8, 8, 0]} />
                        <Bar dataKey="betweenness" fill="#82ca9d" radius={[0, 8, 8, 0]} />
                        <Bar dataKey="closeness" fill="#ffc658" radius={[0, 8, 8, 0]} />
                        <Legend />
                      </BarChart>
                    )}

                    {fullscreenChart === 'relationships' && (
                      <BarChart data={relationshipData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 14 }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fontSize: 14 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="count" 
                          fill="#82ca9d" 
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    )}

                    {fullscreenChart === 'degreeDistribution' && (
                      <AreaChart data={degreeDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="degree" 
                          tick={{ fontSize: 14 }}
                          label={{ value: 'Degree', position: 'insideBottom', offset: -20 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 14 }}
                          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                          strokeWidth={3}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}