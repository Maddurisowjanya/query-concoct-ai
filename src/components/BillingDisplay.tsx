import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  FileText, 
  MessageSquare, 
  Zap
} from 'lucide-react';

import { flexpriceService, UsageStats } from '../services/flexpriceService';

interface BillingDisplayProps {
  className?: string;
}

export const BillingDisplay: React.FC<BillingDisplayProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  
  useEffect(() => {
    const updateStats = () => {
      const currentStats = flexpriceService.getUsageStats();
      setStats(currentStats);
    };
    
    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, []);


  if (!stats) {
    return <div>Loading billing info...</div>;
  }

  const queryCost = 0.1;
  const reportCost = 0.25;
  const totalQuestions = stats.totalQueries;
  const totalReports = stats.totalReports;
  
  // Calculate actual credits used (in dollars)
  const totalCreditsUsed = (totalQuestions * queryCost) + (totalReports * reportCost);
  
  console.log('📊 Billing Debug:');
  console.log('  Questions:', totalQuestions);
  console.log('  Reports:', totalReports);
  console.log('  Credits Used:', totalCreditsUsed);
  console.log('  Total from service:', stats.totalCredits);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Credit Counter */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Usage Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <div className="text-3xl font-bold text-blue-700">
            ${totalCreditsUsed.toFixed(2)} Credits Used
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span>{totalQuestions} questions</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-green-500" />
              <span>{totalReports} reports</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Billing Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              $0.10 per question
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              $0.25 per report
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.currentBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Remaining credits
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Today's Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Today's Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.dailyUsage.length > 0 ? (
              stats.dailyUsage.slice(0, 5).map((event, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    {event.type === 'query' ? (
                      <MessageSquare className="h-3 w-3 text-blue-500" />
                    ) : (
                      <FileText className="h-3 w-3 text-green-500" />
                    )}
                    <span className="capitalize">{event.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">${event.cost.toFixed(2)}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No usage today yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};