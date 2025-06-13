import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  TreeMap,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Target,
  Zap,
  Brain,
  Globe
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  data: unknown;
}

interface AnalyticsData {
  typeDistribution: Array<{ name: string; value: number; color: string }>;
  propertyFrequency: Array<{ property: string; count: number }>;
  depthAnalysis: Array<{ depth: number; objects: number }>;
  contextUsage: Array<{ context: string; usage: number }>;
  complexityMetrics: {
    averageProperties: number;
    maxProperties: number;
    minProperties: number;
    totalComplexity: number;
    semanticRichness: number;
  };
  relationshipTypes: Array<{ type: string; count: number; percentage: number }>;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export function AdvancedAnalytics({ data }: AdvancedAnalyticsProps) {
  const analytics = useMemo(() => {
    const analyzeData = (jsonData: unknown): AnalyticsData => {
      const typeCount = new Map<string, number>();
      const propertyCount = new Map<string, number>();
      const depthCount = new Map<number, number>();
      const contextCount = new Map<string, number>();
      const relationshipCount = new Map<string, number>();
      
      let totalObjects = 0;
      let totalProperties = 0;
      let propertyLengths: number[] = [];

      const traverse = (obj: unknown, depth = 0) => {
        if (Array.isArray(obj)) {
          obj.forEach(item => traverse(item, depth));
        } else if (obj && typeof obj === 'object') {
          totalObjects++;
          const objData = obj as Record<string, unknown>;
          let objectProperties = 0;
          
          depthCount.set(depth, (depthCount.get(depth) || 0) + 1);

          Object.entries(objData).forEach(([key, value]) => {
            totalProperties++;
            objectProperties++;
            propertyCount.set(key, (propertyCount.get(key) || 0) + 1);

            // Type analysis
            if (key === '@type') {
              const types = Array.isArray(value) ? value : [value];
              types.forEach(type => {
                if (typeof type === 'string') {
                  typeCount.set(type, (typeCount.get(type) || 0) + 1);
                }
              });
            }

            // Context analysis
            if (key === '@context') {
              if (typeof value === 'string') {
                contextCount.set(value, (contextCount.get(value) || 0) + 1);
              } else if (typeof value === 'object' && value) {
                Object.keys(value as Record<string, unknown>).forEach(ctx => {
                  contextCount.set(ctx, (contextCount.get(ctx) || 0) + 1);
                });
              }
            }

            // Relationship analysis
            if (key.includes(':') || key.startsWith('http')) {
              const relType = key.split(':')[0] || key.split('/').pop() || 'unknown';
              relationshipCount.set(relType, (relationshipCount.get(relType) || 0) + 1);
            }

            traverse(value, depth + 1);
          });

          propertyLengths.push(objectProperties);
        }
      };

      traverse(jsonData);

      // Calculate complexity metrics
      const avgProps = propertyLengths.length > 0 ? 
        propertyLengths.reduce((a, b) => a + b, 0) / propertyLengths.length : 0;
      const maxProps = Math.max(...propertyLengths, 0);
      const minProps = Math.min(...propertyLengths, 0);
      const semanticRichness = (typeCount.size + contextCount.size) / Math.max(totalObjects, 1);

      return {
        typeDistribution: Array.from(typeCount.entries())
          .map(([name, value], index) => ({
            name: name.split('/').pop() || name,
            value,
            color: COLORS[index % COLORS.length]
          }))
          .sort((a, b) => b.value - a.value),
        
        propertyFrequency: Array.from(propertyCount.entries())
          .map(([property, count]) => ({
            property: property.length > 20 ? property.substring(0, 17) + '...' : property,
            count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),

        depthAnalysis: Array.from(depthCount.entries())
          .map(([depth, objects]) => ({ depth, objects }))
          .sort((a, b) => a.depth - b.depth),

        contextUsage: Array.from(contextCount.entries())
          .map(([context, usage]) => ({
            context: context.length > 25 ? context.substring(0, 22) + '...' : context,
            usage
          }))
          .sort((a, b) => b.usage - a.usage)
          .slice(0, 10),

        complexityMetrics: {
          averageProperties: Math.round(avgProps * 100) / 100,
          maxProperties: maxProps,
          minProperties: minProps,
          totalComplexity: Math.round((avgProps + maxProps + typeCount.size) * 100) / 100,
          semanticRichness: Math.round(semanticRichness * 100) / 100
        },

        relationshipTypes: Array.from(relationshipCount.entries())
          .map(([type, count]) => ({
            type: type.length > 15 ? type.substring(0, 12) + '...' : type,
            count,
            percentage: Math.round((count / Math.max(totalProperties, 1)) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
      };
    };

    return analyzeData(data);
  }, [data]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Complexity Metrics Overview */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Complexity & Semantic Analysis
            </CardTitle>
            <CardDescription>
              Deep insights into data structure complexity and semantic richness
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.complexityMetrics.averageProperties}
                </div>
                <div className="text-sm text-muted-foreground">Avg Properties</div>
                <Progress 
                  value={(analytics.complexityMetrics.averageProperties / analytics.complexityMetrics.maxProperties) * 100} 
                  className="h-2" 
                />
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.complexityMetrics.maxProperties}
                </div>
                <div className="text-sm text-muted-foreground">Max Properties</div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.complexityMetrics.totalComplexity}
                </div>
                <div className="text-sm text-muted-foreground">Total Complexity</div>
                <Progress 
                  value={Math.min((analytics.complexityMetrics.totalComplexity / 100) * 100, 100)} 
                  className="h-2" 
                />
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.complexityMetrics.semanticRichness}
                </div>
                <div className="text-sm text-muted-foreground">Semantic Richness</div>
                <Progress 
                  value={Math.min(analytics.complexityMetrics.semanticRichness * 20, 100)} 
                  className="h-2" 
                />
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-red-600">
                  {analytics.typeDistribution.length}
                </div>
                <div className="text-sm text-muted-foreground">Unique Types</div>
                <Progress 
                  value={Math.min((analytics.typeDistribution.length / 10) * 100, 100)} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Type Distribution
              </CardTitle>
              <CardDescription>
                Distribution of different entity types in your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Property Frequency */}
        <motion.div variants={itemVariants}>
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Property Frequency
              </CardTitle>
              <CardDescription>
                Most commonly used properties across all entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.propertyFrequency} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="property" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Depth Analysis */}
        <motion.div variants={itemVariants}>
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Structural Depth
              </CardTitle>
              <CardDescription>
                Object distribution across nesting levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.depthAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="depth" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="objects" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Relationship Types Radar */}
        <motion.div variants={itemVariants}>
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Relationship Patterns
              </CardTitle>
              <CardDescription>
                Analysis of relationship types and their usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analytics.relationshipTypes}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="type" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Usage"
                    dataKey="count"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Context Usage */}
      {analytics.contextUsage.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Context Usage Analysis
              </CardTitle>
              <CardDescription>
                Most frequently used contexts and vocabularies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.contextUsage.map((ctx, index) => (
                  <div key={ctx.context} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{ctx.context}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={(ctx.usage / Math.max(...analytics.contextUsage.map(c => c.usage))) * 100} 
                        className="w-32 h-2" 
                      />
                      <Badge variant="secondary" className="min-w-[3rem] text-center">
                        {ctx.usage}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}