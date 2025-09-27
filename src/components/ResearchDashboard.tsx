import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Upload, 
  FileText, 
  Brain, 
  Zap, 
  Clock, 
  ChartBar,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import heroImage from "@/assets/hero-research.jpg";

interface Report {
  id: string;
  question: string;
  summary: string;
  sources: number;
  timestamp: Date;
  status: 'completed' | 'processing' | 'failed';
}

const ResearchDashboard = () => {
  const [question, setQuestion] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reports] = useState<Report[]>([
    {
      id: "1",
      question: "What are the latest trends in AI-powered research tools?",
      summary: "Recent developments show increased focus on multimodal AI systems that can process text, images, and audio simultaneously. Key trends include real-time knowledge integration, citation accuracy improvements, and user-friendly interfaces for non-technical users.",
      sources: 12,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed'
    },
    {
      id: "2", 
      question: "How does pathway integration improve research accuracy?",
      summary: "Pathway integration enables incremental data ingestion and real-time updates to research outputs. This approach reduces latency by 60% and improves accuracy by maintaining fresh information from multiple sources.",
      sources: 8,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'completed'
    }
  ]);

  // Mock usage stats
  const usageStats = {
    reportsGenerated: 23,
    creditsUsed: 23,
    creditsRemaining: 77,
    successRate: 96
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setIsProcessing(true);
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setQuestion("");
    }, 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="AI Research Assistant" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        
        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Smart Research Assistant
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Generate structured, evidence-based reports with fresh data and reliable citations
            </p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI-Powered Analysis
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Real-time Updates
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Trusted Citations
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue="research" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Research Tab */}
          <TabsContent value="research" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Question Input */}
              <div className="lg:col-span-2">
                <Card className="shadow-elegant border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      Ask Your Research Question
                    </CardTitle>
                    <CardDescription>
                      Enter your research question and upload relevant documents for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleQuestionSubmit} className="space-y-4">
                      <Textarea
                        placeholder="What would you like to research? e.g., 'What are the latest developments in quantum computing applications?'"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="min-h-[120px] bg-input/50 border-border/50 focus:border-primary/50"
                      />
                      
                      {/* File Upload */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Upload Documents (Optional)</label>
                        <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag files here or click to browse
                          </p>
                          <Input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button variant="outline" size="sm" asChild>
                            <label htmlFor="file-upload" className="cursor-pointer">
                              Choose Files
                            </label>
                          </Button>
                        </div>
                        
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-primary" />
                                <span>{file.name}</span>
                                <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        variant="hero" 
                        size="lg" 
                        disabled={!question.trim() || isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <Clock className="h-4 w-4 animate-spin" />
                            Generating Report...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4" />
                            Generate Research Report
                          </>
                        )}
                      </Button>
                    </form>

                    {isProcessing && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Processing your research...</span>
                          <span>60%</span>
                        </div>
                        <Progress value={60} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Analyzing documents and gathering fresh data from online sources
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Usage Stats */}
              <div className="space-y-6">
                <Card className="shadow-elegant border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChartBar className="h-5 w-5 text-primary" />
                      Usage Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Reports Generated</span>
                        <Badge variant="glow">{usageStats.reportsGenerated}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Credits Used</span>
                        <span className="text-sm font-medium">{usageStats.creditsUsed}/100</span>
                      </div>
                      <Progress value={usageStats.creditsUsed} className="h-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="text-sm font-medium text-success">{usageStats.successRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elegant border-border/50 bg-gradient-subtle">
                  <CardHeader>
                    <CardTitle className="text-lg">Live Data Integration</CardTitle>
                    <CardDescription>
                      Connected to real-time news and research sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-success">
                      <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                      Active • Last update 2 min ago
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Research Reports</h2>
              <Badge variant="outline">{reports.length} reports</Badge>
            </div>

            <div className="grid gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="shadow-elegant border-border/50 hover:shadow-glow transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-lg">{report.question}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{report.timestamp.toLocaleString()}</span>
                          <span>{report.sources} sources</span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            <span className="capitalize">{report.status}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{report.summary}</p>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-2">
                        <Badge variant="secondary">AI Generated</Badge>
                        <Badge variant="outline">Cited</Badge>
                      </div>
                      <Button variant="glow" size="sm">
                        View Full Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-elegant border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{usageStats.reportsGenerated}</div>
                  <p className="text-xs text-success mt-1">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Credits Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{usageStats.creditsUsed}</div>
                  <p className="text-xs text-muted-foreground mt-1">of 100 available</p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{usageStats.successRate}%</div>
                  <p className="text-xs text-success mt-1">Exceptional performance</p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">10.2</div>
                  <p className="text-xs text-muted-foreground mt-1">per report</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResearchDashboard;