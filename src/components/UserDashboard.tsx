import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  Search, 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Loader2,
  BarChart3
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { useAuth } from '@/hooks/useAuth';
import { databaseService, StoredReport } from '@/services/databaseService';
import { fileUploadService, UploadedFile } from '@/services/fileUploadService';
import { backendAgent } from '@/services/backendAgent';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [reportsData, filesData] = await Promise.all([
        databaseService.getUserReports(),
        fileUploadService.getUserFiles()
      ]);
      
      setReports(reportsData);
      setFiles(filesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    for (const file of acceptedFiles) {
      try {
        const uploadedFile = await fileUploadService.uploadFile(file);
        if (uploadedFile) {
          setFiles(prev => [uploadedFile, ...prev]);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    
    setUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleDeleteFile = async (fileId: string) => {
    const success = await fileUploadService.deleteFile(fileId);
    if (success) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const handleNewQuery = async () => {
    if (!query.trim()) return;
    
    setProcessing(true);
    try {
      // Get content from selected files
      const fileContents: string[] = [];
      for (const fileId of selectedFiles) {
        const content = await fileUploadService.getFileContent(fileId);
        if (content) {
          fileContents.push(content);
        }
      }

      // Process query with file contents as context
      const report = await backendAgent.processQuery(query, {
        includeOnlineData: true,
        maxSources: 8,
        autoRefresh: true,
        selectedFileIds: selectedFiles
      });

      // Refresh reports to show the new one
      await loadDashboardData();
      setQuery('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredReports = reports.filter(report =>
    report.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to access your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your queries, uploads, and reports
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {reports.length} Reports
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {files.length} Files
          </Badge>
        </div>
      </div>

      {/* New Query Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Ask a Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to know? (e.g., What are the key insights from my uploaded documents?)"
            className="min-h-[100px]"
            disabled={processing}
          />
          
          {files.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Include files in analysis:</p>
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <label key={file.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(prev => [...prev, file.id]);
                        } else {
                          setSelectedFiles(prev => prev.filter(id => id !== file.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{file.filename}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleNewQuery} 
            disabled={processing || !query.trim()}
            className="flex items-center gap-2"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            {processing ? 'Processing...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Reports</h2>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No reports yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                  Start by asking a question above to generate your first report with AI-powered insights.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{report.question}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{new Date(report.created_at || '').toLocaleString()}</span>
                          {report.processing_time_ms && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {report.processing_time_ms}ms
                            </span>
                          )}
                          <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {report.summary && (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold mb-2">Summary</h4>
                          <p className="text-gray-700 dark:text-gray-300">{report.summary}</p>
                        </div>

                        {Array.isArray(report.key_takeaways) && report.key_takeaways.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Key Takeaways</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {report.key_takeaways.map((takeaway: string, index: number) => (
                                <li key={index} className="text-gray-700 dark:text-gray-300">{takeaway}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {Array.isArray(report.sources) && report.sources.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Sources</h4>
                            <div className="flex flex-wrap gap-2">
                              {report.sources.map((source: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Files</h2>
          </div>

          {/* File Upload Area */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {uploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-gray-600">Uploading files...</p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-blue-600 dark:text-blue-400">Drop files here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-400">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports: PDF, TXT, DOC, DOCX, CSV (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Files List */}
          {files.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No files uploaded yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                  Upload documents to use them as context for your queries and generate more accurate reports.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div>
                          <p className="font-medium">{file.filename}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {file.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};