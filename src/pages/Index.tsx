import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  BarChart3, 
  Zap, 
  DollarSign, 
  Database, 
  FileText,
  ArrowRight,
  Activity,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileComponent } from '@/components/UserProfile';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold text-white">Query Concoct AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Dashboard
                </Button>
              </Link>
              <Link to="/query">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Query Interface
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Analytics
                </Button>
              </Link>
              {!user ? (
                <Link to="/auth">
                  <Button variant="outline" className="text-gray-300 border-gray-600">
                    Sign In
                  </Button>
                </Link>
              ) : (
                <Link to="/profile">
                  <Button variant="ghost" className="text-gray-300 hover:text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-blue-400 text-blue-400">
            Real-time AI Analytics Demo
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-6">
            Query Concoct AI
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience real-time analytics with Gemini 1.5 Flash API, Flexprice billing, 
            and Pathway data ingestion. Get comprehensive reports with live data updates.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <FileText className="mr-2 h-5 w-5" />
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/query">
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <Brain className="mr-2 h-5 w-5" />
                Start Querying
              </Button>
            </Link>
            <Link to="/analytics">
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-400" />
                <CardTitle className="text-white">Gemini 1.5 Flash API</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Process queries with Google's most advanced AI model. Get structured reports 
                with key takeaways, summaries, and citations.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-400">Active & Ready</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-400" />
                <CardTitle className="text-white">Flexprice Billing</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Pay-per-use billing with real-time counters. $0.10 per query, $0.25 per report. 
                Track usage and costs in real-time.
              </p>
              <div className="mt-4 space-y-1">
                <div className="text-sm text-gray-400">Query: $0.10</div>
                <div className="text-sm text-gray-400">Report: $0.25</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-6 w-6 text-purple-400" />
                <CardTitle className="text-white">Pathway Integration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Real-time data ingestion from multiple sources. Automatic report updates 
                when new information becomes available.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-400">Mock Mode Active</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Features */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What You'll Experience</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Query Processing Pipeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  User submits natural language query
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  System searches PDFs, news, blogs, research papers
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Gemini AI analyzes and synthesizes information
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Structured report with takeaways and citations
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Real-time Updates
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  Live data sources update every 30 seconds
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  Reports automatically refresh with new data
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  Real-time billing and usage analytics
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  Live dashboard with metrics and charts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
