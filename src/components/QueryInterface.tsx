import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Loader2, 
  FileText, 
  ExternalLink, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  File,
  Trash2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { backendAgent, ProcessedReport } from '../services/backendAgent';
import { simpleFileService, SimpleUploadedFile } from '../services/simpleFileService';

interface QueryState {
  isProcessing: boolean;
  currentReport: ProcessedReport | null;
  processingSteps: string[];
  error: string | null;
}

export const QueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<QueryState>({
    isProcessing: false,
    currentReport: null,
    processingSteps: [],
    error: null
  });
  
  const [reports, setReports] = useState<ProcessedReport[]>([]);
  const [refreshingReports, setRefreshingReports] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<SimpleUploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [suggestedQuestions] = useState([
    'What are the key insights from this document?',
    'Summarize the main findings',
    'What are the most important takeaways?',
    'Extract the key data points',
    'What recommendations does this document make?'
  ]);

  useEffect(() => {
    const existingReports = backendAgent.getAllReports();
    setReports(existingReports);
    
    // Load existing files from the service
    const existingFiles = simpleFileService.getFiles();
    setUploadedFiles(existingFiles);
    console.log('📁 Loaded existing files:', existingFiles.length);

    const unsubscribe = backendAgent.onReportRefresh((reportId, updatedReport) => {
      setReports(prev => prev.map(report => 
        report.id === reportId ? updatedReport : report
      ));
      setRefreshingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    });

    return () => unsubscribe();
  }, []);


  const handleRefreshReport = async (reportId: string) => {
    setRefreshingReports(prev => new Set(prev).add(reportId));
    
    try {
      await backendAgent.refreshReport(reportId);
    } catch (error) {
      console.error('Failed to refresh report:', error);
      setRefreshingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setActiveTab('file');
    setState(prev => ({ ...prev, error: null })); // Clear any previous errors
    
    for (const file of acceptedFiles) {
      try {
        // Validate file first
        const validation = simpleFileService.validateFile(file);
        if (!validation.isValid) {
          setState(prev => ({
            ...prev,
            error: validation.error || 'File validation failed'
          }));
          continue;
        }

        const uploadedFile = await simpleFileService.processFile(file);
        setUploadedFiles(prev => [uploadedFile, ...prev]);
      } catch (error) {
        console.error('File processing failed:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'File processing failed'
        }));
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
    maxSize: 10 * 1024 * 1024
  });

  const handleDeleteFile = (fileId: string) => {
    const success = simpleFileService.deleteFile(fileId);
    if (success) {
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const handleFileQuery = async (customQuery?: string) => {
    const queryText = customQuery || query;
    if (!queryText.trim() || uploadedFiles.length === 0) return;
    
    console.log('📝 Starting file-based query...');
    console.log('Query:', queryText);
    console.log('Uploaded files:', uploadedFiles.length);
    
    // Get file contents directly for processing
    const fileContents: string[] = [];
    uploadedFiles.forEach(file => {
      if (file.content && file.status === 'completed') {
        const formattedContent = `File: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024).toFixed(1)} KB\nContent:\n${file.content}`;
        fileContents.push(formattedContent);
        console.log(`  📄 Including file: ${file.name} (${file.content.length} chars)`);
      } else {
        console.warn(`  ⚠️ Skipping file: ${file.name} (Status: ${file.status})`);
      }
    });
    
    console.log(`Total file contents to send: ${fileContents.length}`);
    console.log('File contents preview:', fileContents.map(c => c.substring(0, 100) + '...'));
    
    await handleQuery(queryText, [], fileContents);
  };

  const handleTextQuery = async () => {
    if (!query.trim()) return;
    await handleQuery(query);
  };

  const handleQuery = async (queryText: string, fileIds: string[] = [], fileContents: string[] = []) => {
    setState({
      isProcessing: true,
      currentReport: null,
      processingSteps: ['Initializing query processing...'],
      error: null
    });

    try {
      const steps = [
        'Initializing query processing...',
        'Billing query through Flexprice...',
        'Searching data sources via Pathway...',
        'Extracting relevant content...',
        'Processing with Gemini 1.5 Flash...',
        'Generating structured report...',
        'Billing report generation...',
        'Finalizing results...'
      ];

      let stepIndex = 0;
      const stepInterval = setInterval(() => {
        if (stepIndex < steps.length - 1) {
          stepIndex++;
          setState(prev => ({
            ...prev,
            processingSteps: [...prev.processingSteps, steps[stepIndex]]
          }));
        }
      }, 800);

      const report = await backendAgent.processQuery(queryText, {
        includeOnlineData: true,
        maxSources: 8,
        autoRefresh: true,
        selectedFileIds: fileIds,
        fileContents: fileContents
      });

      clearInterval(stepInterval);

      setState({
        isProcessing: false,
        currentReport: report,
        processingSteps: [...steps, '✅ Report generated successfully!'],
        error: null
      });

      setReports(prev => [report, ...prev]);
      setQuery('');
      
      // Clear uploaded files after successful query
      if (fileIds.length > 0 || fileContents.length > 0) {
        setUploadedFiles([]);
        simpleFileService.clearAllFiles();
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingSteps: [...prev.processingSteps, '❌ Error generating report']
      }));
    }
  };

  const renderReport = (report: ProcessedReport) => {
    const isRefreshing = refreshingReports.has(report.id);
    
    return (
      <Card key={report.id} className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{report.query}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {report.processingTime}ms
                </span>
                <span>{new Date(report.timestamp).toLocaleString()}</span>
                <Badge variant="outline">
                  {report.sourcesUsed.length} sources
                </Badge>
                {report.refreshCount > 0 && (
                  <Badge variant="secondary">
                    Refreshed {report.refreshCount}x
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() => handleRefreshReport(report.id)}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Confidence:</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${report.result.confidence}%` }}
                ></div>
              </div>
              <span className="text-sm">{report.result.confidence}%</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Key Takeaways
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {report.result.keyTakeaways.map((takeaway, index) => (
                <li key={index}>{takeaway}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Summary
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {report.result.summary}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-purple-500" />
              Sources ({report.sourcesUsed.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {report.sourcesUsed.map((source) => (
                <div key={source.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {source.type}
                    </Badge>
                    <span className="font-medium truncate">{source.title}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                    {source.content.substring(0, 100)}...
                  </p>
                  <span className="text-xs text-gray-500">
                    Updated: {source.lastUpdated.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {report.result.citations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Citations
              </h3>
              <ul className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {report.result.citations.map((citation, index) => (
                  <li key={index}>{citation}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Query Concoct AI
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ask questions and get comprehensive reports with real-time data analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Type Question
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload & Ask
              </TabsTrigger>
            </TabsList>

            {/* Text Query Tab */}
            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., What are the latest developments in artificial intelligence?"
                    disabled={state.isProcessing}
                    className="min-h-[100px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleTextQuery();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleTextQuery}
                  disabled={state.isProcessing || !query.trim()}
                  className="flex items-center gap-2 self-end"
                >
                  {state.isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {state.isProcessing ? 'Processing...' : 'Generate Report'}
                </Button>
              </div>
            </TabsContent>

            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-4 mt-4">
              {/* File Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : uploadedFiles.length > 0
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
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
                ) : uploadedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-green-600 dark:text-green-400">
                      {uploadedFiles.length} file(s) uploaded successfully!
                    </p>
                    <p className="text-xs text-gray-500">
                      Click to add more files or ask a question below
                    </p>
                  </div>
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

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Uploaded Files:</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {file.status}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Input for Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Quick Questions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((q, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileQuery(q)}
                          disabled={state.isProcessing}
                          className="text-xs"
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Or ask your own question:</h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Textarea
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="What would you like to know about these files?"
                          disabled={state.isProcessing}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button
                        onClick={() => handleFileQuery()}
                        disabled={state.isProcessing || !query.trim()}
                        className="flex items-center gap-2 self-end"
                      >
                        {state.isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Analyze Files
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {state.isProcessing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                Processing Query...
              </h3>
              <div className="space-y-1">
                {state.processingSteps.map((step, index) => (
                  <div key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    {index === state.processingSteps.length - 1 && !step.includes('✅') && !step.includes('❌') ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-red-800 dark:text-red-200">
                Error Processing Query
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {state.currentReport && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Latest Report</h2>
          {renderReport(state.currentReport)}
        </div>
      )}

      {reports.length > 0 && !state.currentReport && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Reports</h2>
          {reports.map(renderReport)}
        </div>
      )}

    </div>
  );
};