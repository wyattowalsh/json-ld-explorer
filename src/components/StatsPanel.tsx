import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, Network, Share2, Zap, TrendingUp, Target,
  Activity, GitBranch, Layers, Globe
} from 'lucide-react';
import { DataStats, GraphAnalytics } from '@/types';

interface StatsPanelProps {
  dataStats: DataStats;
  graphAnalytics: GraphAnalytics;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function StatsPanel({ dataStats, graphAnalytics }: StatsPanelProps) {
  const entityTypeData = Object.entries(dataStats.entityTypes).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: (count / dataStats.totalEntities * 100).toFixed(1)
  }));

  const relationshipData = Object.entries(dataStats.relationshipTypes).map(([type, count]) => ({
    name: type,
    count
  }));

  const centralityData = Object.entries(graphAnalytics.centralityMeasures.degree)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([node, degree]) => ({
      node: node.length > 20 ? node.substring(0, 20) + '...' : node,
      degree,
      betweenness: graphAnalytics.centralityMeasures.betweenness[node]?.toFixed(3) || '0',
      closeness: graphAnalytics.centralityMeasures.closeness[node]?.toFixed(3) || '0'
    }));

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
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Entity Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={entityTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {entityTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2">
                  {entityTypeData.map((item, index) => (
                    <Badge 
                      key={item.name} 
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: COLORS[index % COLORS.length] }}
                    >
                      {item.name}: {item.percentage}%
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Nodes by Degree */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Nodes by Degree
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={centralityData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="node" type="category" width={100} />
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => `Node: ${label}`}
                  />
                  <Bar dataKey="degree" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Relationship Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Relationship Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={relationshipData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
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
  );
}