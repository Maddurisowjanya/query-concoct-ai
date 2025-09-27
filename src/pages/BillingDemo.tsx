import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  FileText, 
  MessageSquare, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Database,
  Clock
} from 'lucide-react';

import { BillingDisplay } from '../components/BillingDisplay';
import { backendAgent } from '../services/backendAgent';
import { pathwayService } from '../services/pathwayService';
import { flexpriceService } from '../services/flexpriceService';

export default function BillingDemo() {
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pathwayStats, setPathwayStats] = useState<any>(null);

  useEffect(() => {
    // Load initial data
    setRecentReports(backendAgent.getAllReports().slice(0, 3));
    setPathwayStats(pathwayService.getRealtimeMetrics());

    // Set up real-time updates
    const unsubscribe = backendAgent.onReportRefresh((reportId, updatedReport) => {
      setRecentUpdates(prev => [
        `📊 Report "${updatedReport.query.substring(0, 30)}..." updated with new data`,
        ...prev.slice(0, 4)
      ]);
      setRecentReports(prev => [updatedReport, ...prev.slice(0, 2)]);
    });

    // Listen for pathway updates
    const pathwayInterval = setInterval(() => {
      const newStats = pathwayService.getRealtimeMetrics();
      if (newStats.totalSources !== pathwayStats?.totalSources) {
        setRecentUpdates(prev => [
          `🔄 New data source added - reports will auto-refresh`,
          ...prev.slice(0, 4)
        ]);
      }
      setPathwayStats(newStats);
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(pathwayInterval);
    };
  }, []);

  const handleGenerateDemoReport = async () => {
    setIsGenerating(true);
    
    try {
      const demoQueries = [
        'Latest AI breakthroughs in 2024',
        'Quantum computing developments',
        'Blockchain enterprise adoption trends'
      ];
      
      const randomQuery = demoQueries[Math.floor(Math.random() * demoQueries.length)];
      
      const report = await backendAgent.processQuery(randomQuery, {
        includeOnlineData: true,
        maxSources: 5,
        autoRefresh: true
      });
      
      setRecentReports(prev => [report, ...prev.slice(0, 2)]);
      setRecentUpdates(prev => [
        `✨ New report generated: "${randomQuery}"`,
        `💰 Charged $0.35 (Query: $0.10 + Report: $0.25)`,
        ...prev.slice(0, 3)
      ]);
      
    } catch (error) {
      console.error('Failed to generate demo report:', error);
      setRecentUpdates(prev => [
        `❌ Failed to generate report: ${error}`,
        ...prev.slice(0, 4)
      ]);
    }
    
    setIsGenerating(false);
  };

  const handleSimulateDataUpdate = () => {
    // Manually trigger a pathway update
    const mockUpdate = {
      sourceId: 'demo-source-' + Date.now(),
      changeType: 'added' as const,
      newContent: 'Breaking: New AI research published - revolutionizing natural language processing capabilities.',
      timestamp: new Date()
    };
    
    // This would normally be handled by the pathway service automatically
    setRecentUpdates(prev => [
      `📡 Live update: New blog post added to sources`,
      `🔄 Existing reports will refresh automatically`,
      ...prev.slice(0, 3)
    ]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          💰 Billing & Real-Time Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Experience live billing per question and report generation, plus see how reports automatically 
          update when new data sources arrive via Pathway integration.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Billing Display */}
        <div>
          <BillingDisplay />
        </div>

        {/* Right Column - Real-time Updates Demo */}
        <div className="space-y-4">
          {/* Live Demo Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Interactive Demo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Try these actions to see live billing and real-time updates in action:
              </p>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleGenerateDemoReport}
                  disabled={isGenerating}
                  className="w-full flex items-center gap-2"
                  size="lg"
                >
                  <FileText className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Generate New Report ($0.35)'}
                </Button>
                
                <Button 
                  onClick={handleSimulateDataUpdate}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Simulate New Data Source
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pathway Real-time Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Pathway Live Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pathwayStats && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-lg font-semibold">{pathwayStats.totalSources}</div>
                    <div className="text-gray-600">Active Sources</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{pathwayStats.recentUpdates}</div>
                    <div className="text-gray-600">Recent Updates</div>
                  </div>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                🔄 Auto-refreshes every 15 seconds • New sources every 45 seconds
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentUpdates.length > 0 ? (
                  recentUpdates.map((update, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-2 border-blue-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">Live</Badge>
                      </div>
                      <div className="mt-1">{update}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No recent activity. Try generating a report to see live updates!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.length > 0 ? (
                  recentReports.map((report, index) => (
                    <div key={report.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm truncate">
                          {report.query}
                        </div>
                        <Badge variant="secondary" className="text-xs ml-2">
                          ${(0.35).toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{report.sourcesUsed.length} sources</span>
                        <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {report.refreshCount > 0 && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Auto-refreshed {report.refreshCount}x
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No reports generated yet. Click "Generate New Report" to see them here!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Highlights */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <AlertCircle className="h-5 w-5" />
            Demo Features Implemented
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-800">✅ Billing System:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• $0.10 per question asked</li>
                <li>• $0.25 per report generated</li>
                <li>• Real-time counter updates</li>
                <li>• Usage breakdown display</li>
                <li>• Account balance tracking</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-800">✅ Real-time Updates:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Pathway live data ingestion</li>
                <li>• Auto-refresh reports on new data</li>
                <li>• Mock news/blog updates every 15s</li>
                <li>• Live activity feed</li>
                <li>• Source counter updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}