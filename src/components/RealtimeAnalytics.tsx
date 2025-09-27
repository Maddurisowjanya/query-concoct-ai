import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Brain, 
  DollarSign, 
  Database, 
  Clock, 
  RefreshCw, 
  TrendingUp,
  FileText,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { backendAgent, AgentMetrics } from '../services/backendAgent';
import { flexpriceService, UsageStats } from '../services/flexpriceService';
import { pathwayService } from '../services/pathwayService';
import { databaseService } from '../services/databaseService';
import { useAuth } from '@/hooks/useAuth';

interface RealtimeData {
  agentMetrics: AgentMetrics;
  usageStats: UsageStats;
  pathwayMetrics: any;
  hourlyData: Array<{ hour: number; cost: number; reports: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const RealtimeAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<RealtimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateData = async () => {
      const agentMetrics = backendAgent.getAgentMetrics();
      let usageStats = flexpriceService.getUsageStats();
      const pathwayMetrics = pathwayService.getRealtimeMetrics();
      const flexpriceMetrics = flexpriceService.getRealTimeMetrics();

      // If user is logged in, merge with real database data
      if (user && databaseService.isUserLoggedIn()) {
        try {
          const dbUsageStats = await databaseService.getUserUsageStats();
          if (dbUsageStats) {
            usageStats = {
              ...usageStats,
              totalQueries: dbUsageStats.totalQueries,
              totalReports: dbUsageStats.totalReports,
              totalCredits: dbUsageStats.totalCredits,
            };
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }

      const hourlyData = flexpriceMetrics.hourlyUsage.map(item => ({
        hour: item.hour,
        cost: item.cost,
        reports: Math.floor(item.cost / 0.25)
      }));

      setData({
        agentMetrics,
        usageStats,
        pathwayMetrics,
        hourlyData
      });
      setLastUpdate(new Date());
      setIsLoading(false);
    };

    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefreshData = async () => {
    setIsLoading(true);
    await pathwayService.refreshAllSources();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      await backendAgent.generateSampleReports();
    } catch (error) {
      console.error('Failed to generate sample reports:', error);
    }
    setIsLoading(false);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sourceTypeData = Object.entries(data.pathwayMetrics.sourceTypes).map(([type, count]) => ({
    name: type,
    value: count
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Real-Time Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Live monitoring of query processing and billing metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live
          </Badge>
          <span className="text-sm text-gray-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={handleGenerateReport} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          Generate Sample Reports
        </Button>
        <Button 
          onClick={handleRefreshData} 
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data Sources
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.agentMetrics.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              +{data.usageStats.dailyUsage.filter(e => e.type === 'report').length} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.usageStats.totalCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Balance: ${data.usageStats.currentBalance.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pathwayMetrics.totalSources}</div>
            <p className="text-xs text-muted-foreground">
              {data.pathwayMetrics.recentUpdates} updated recently
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.agentMetrics.avgProcessingTime)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Per query response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time Updates</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.agentMetrics.realtimeUpdates}</div>
            <p className="text-xs text-muted-foreground">
              In the last hour
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Flexprice Billing Counter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.usageStats.totalQueries}
              </div>
              <p className="text-sm text-blue-600">Queries Processed</p>
              <p className="text-xs text-gray-500">
                → {data.usageStats.totalQueries} credits used
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.usageStats.totalReports}
              </div>
              <p className="text-sm text-green-600">Reports Generated</p>
              <p className="text-xs text-gray-500">
                → {data.usageStats.totalReports} credits used
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${data.usageStats.totalCredits.toFixed(2)}
              </div>
              <p className="text-sm text-purple-600">Total Spent</p>
              <p className="text-xs text-gray-500">
                Pay-per-use billing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hourly Usage & Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'cost' ? `$${value}` : value,
                    name === 'cost' ? 'Cost' : 'Reports'
                  ]}
                />
                <Bar dataKey="cost" fill="#8884d8" name="cost" />
                <Bar dataKey="reports" fill="#82ca9d" name="reports" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Source Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.usageStats.dailyUsage.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center gap-2">
                  {event.type === 'query' ? (
                    <Brain className="h-4 w-4 text-blue-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-green-500" />
                  )}
                  <span className="capitalize">{event.type}</span>
                  {event.metadata?.query && (
                    <span className="text-sm text-gray-500 truncate max-w-xs">
                      "{event.metadata.query.substring(0, 50)}..."
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">${event.cost.toFixed(2)}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Gemini AI: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Flexprice: Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Pathway: Mock Mode</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};