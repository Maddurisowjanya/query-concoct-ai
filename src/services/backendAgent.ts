import { geminiService, QueryResult } from './geminiService';
import { flexpriceService } from './flexpriceService';
import { pathwayService, DataSource } from './pathwayService';
import { databaseService } from './databaseService';
import { fileUploadService } from './fileUploadService';

export interface ProcessedReport {
  id: string;
  query: string;
  result: QueryResult;
  sourcesUsed: DataSource[];
  processingTime: number;
  timestamp: Date;
  billingEvents: string[];
  refreshCount: number;
}

export interface AgentMetrics {
  totalReports: number;
  avgProcessingTime: number;
  sourcesProcessed: number;
  realtimeUpdates: number;
  billingEvents: number;
}

export class BackendAgent {
  private reports: Map<string, ProcessedReport> = new Map();
  private refreshCallbacks: Set<(reportId: string, updatedReport: ProcessedReport) => void> = new Set();

  constructor() {
    // Listen for data updates from Pathway
    pathwayService.onDataUpdate((update) => {
      this.handleDataSourceUpdate(update.sourceId);
    });
  }

  async processQuery(
    query: string,
    options: {
      includeOnlineData?: boolean;
      maxSources?: number;
      autoRefresh?: boolean;
      selectedFileIds?: string[];
      fileContents?: string[];
    } = {}
  ): Promise<ProcessedReport> {
    const startTime = Date.now();
    const reportId = this.generateReportId();

    console.log(`🔍 Starting query processing for: "${query}"`);
    console.log(`📋 Report ID: ${reportId}`);

    try {
      // Step 1: Bill for the query
      console.log('💰 Step 1: Billing for query...');
      const queryBilling = await flexpriceService.billQuery(query, { reportId });

      // Step 2: Search PDFs and data sources
      console.log('📚 Step 2: Searching PDFs and data sources...');
      const searchResults = await this.comprehensiveDataSearch(query, options);
      
      // Step 3: Extract and process content
      console.log('📄 Step 3: Extracting content from sources...');
      const extractedContent = await this.extractAndProcessContent(searchResults, options);
      
      // Step 4: Get online data if requested  
      let onlineData: string[] = [];
      if (options.includeOnlineData !== false) { // Default to true
        console.log('🌐 Step 4: Fetching online data...');
        onlineData = await this.searchOnlineContent(query);
      }

      // Step 5: Process with AI and generate structured report
      console.log('🤖 Step 5: Processing with Gemini AI...');
      console.log(`   📊 PDF Content: ${extractedContent.pdfContent.length} items`);
      console.log(`   🌐 Online Data: ${onlineData.length} items`);
      console.log(`   📋 Total Sources: ${searchResults.sources.length}`);
      
      const result = await this.generateStructuredReport(query, extractedContent, onlineData, searchResults.sources);
      console.log('✅ AI processing complete');
      console.log(`   📝 Summary: ${result.summary.length} chars`);
      console.log(`   🔑 Key takeaways: ${result.keyTakeaways.length}`);
      console.log(`   📖 Sources: ${result.sources.length}`);
      console.log(`   🔗 Citations: ${result.citations.length}`);

      // Step 6: Calculate complexity and bill for report
      const complexity = this.calculateComplexity(result, searchResults.sources.length);
      const reportBilling = await flexpriceService.billReport(reportId, complexity);

      // Step 7: Create processed report
      const processingTime = Date.now() - startTime;
      const processedReport: ProcessedReport = {
        id: reportId,
        query,
        result,
        sourcesUsed: searchResults.sources,
        processingTime,
        timestamp: new Date(),
        billingEvents: [queryBilling.id, reportBilling.id],
        refreshCount: 0
      };

      // Store the report
      this.reports.set(reportId, processedReport);

      // Save to database if user is logged in
      if (databaseService.isUserLoggedIn()) {
        try {
          await databaseService.saveReport(processedReport);
          await databaseService.trackUsage(queryBilling);
          await databaseService.trackUsage(reportBilling);
          await databaseService.updateAnalyticsSummary();
        } catch (error) {
          console.error('Error saving to database:', error);
        }
      }

      console.log(`✅ Report generated successfully in ${processingTime}ms`);
      return processedReport;

    } catch (error) {
      console.error('❌ Error processing query:', error);
      throw new Error(`Failed to process query: ${error}`);
    }
  }

  private async searchDataSources(query: string, maxSources: number): Promise<DataSource[]> {
    const allSources = pathwayService.searchDataSources(query);
    
    // Prioritize by relevance and recency
    const scoredSources = allSources.map(source => ({
      source,
      score: this.calculateRelevanceScore(query, source)
    }));

    scoredSources.sort((a, b) => b.score - a.score);
    
    return scoredSources
      .slice(0, maxSources)
      .map(item => item.source);
  }

  private calculateRelevanceScore(query: string, source: DataSource): number {
    const queryWords = query.toLowerCase().split(' ');
    const sourceText = (source.title + ' ' + source.content).toLowerCase();
    
    let score = 0;
    queryWords.forEach(word => {
      if (sourceText.includes(word)) {
        score += 1;
      }
    });

    // Boost score for recent sources
    const hoursOld = (Date.now() - source.lastUpdated.getTime()) / (1000 * 60 * 60);
    const recencyBoost = Math.max(0, 10 - hoursOld); // Boost for sources less than 10 hours old
    
    return score + recencyBoost;
  }

  private calculateComplexity(result: QueryResult, sourceCount: number): number {
    let complexity = 1;
    
    // Increase complexity based on content length
    if (result.summary.length > 500) complexity += 0.5;
    if (result.keyTakeaways.length > 3) complexity += 0.3;
    
    // Increase complexity based on number of sources
    if (sourceCount > 5) complexity += 0.4;
    if (sourceCount > 10) complexity += 0.6;
    
    return Math.min(complexity, 3); // Cap at 3x complexity
  }

  private async handleDataSourceUpdate(sourceId: string): Promise<void> {
    console.log(`📡 Data source ${sourceId} updated, checking for report refreshes...`);
    
    // Find reports that used this data source
    const affectedReports = Array.from(this.reports.values()).filter(report =>
      report.sourcesUsed.some(source => source.id === sourceId)
    );

    // Refresh affected reports
    for (const report of affectedReports) {
      try {
        await this.refreshReport(report.id);
      } catch (error) {
        console.error(`Failed to refresh report ${report.id}:`, error);
      }
    }
  }

  async refreshReport(reportId: string): Promise<ProcessedReport> {
    const existingReport = this.reports.get(reportId);
    if (!existingReport) {
      throw new Error(`Report ${reportId} not found`);
    }

    console.log(`🔄 Refreshing report ${reportId}...`);
    
    try {
      // Get updated data sources
      const updatedSources = await this.searchDataSources(
        existingReport.query,
        existingReport.sourcesUsed.length
      );

      // Re-process with updated data
      const pdfContent = updatedSources
        .filter(source => source.type === 'pdf')
        .map(source => `${source.title}: ${source.content}`);

      const onlineData = updatedSources
        .filter(source => source.type !== 'pdf')
        .map(source => `${source.title}: ${source.content}`);

      const refreshedResult = await geminiService.processQuery(
        existingReport.query,
        pdfContent,
        onlineData
      );

      // Update the report
      const refreshedReport: ProcessedReport = {
        ...existingReport,
        result: refreshedResult,
        sourcesUsed: updatedSources,
        timestamp: new Date(),
        refreshCount: existingReport.refreshCount + 1
      };

      this.reports.set(reportId, refreshedReport);

      // Notify callbacks
      this.refreshCallbacks.forEach(callback => {
        callback(reportId, refreshedReport);
      });

      console.log(`✅ Report ${reportId} refreshed successfully`);
      return refreshedReport;

    } catch (error) {
      console.error(`❌ Failed to refresh report ${reportId}:`, error);
      throw error;
    }
  }

  getReport(reportId: string): ProcessedReport | undefined {
    return this.reports.get(reportId);
  }

  getAllReports(): ProcessedReport[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  getAgentMetrics(): AgentMetrics {
    const reports = this.getAllReports();
    const billingStats = flexpriceService.getUsageStats();
    const pathwayMetrics = pathwayService.getRealtimeMetrics();

    const totalProcessingTime = reports.reduce((sum, report) => sum + report.processingTime, 0);
    const avgProcessingTime = reports.length > 0 ? totalProcessingTime / reports.length : 0;

    const sourcesProcessed = reports.reduce((sum, report) => sum + report.sourcesUsed.length, 0);

    return {
      totalReports: reports.length,
      avgProcessingTime,
      sourcesProcessed,
      realtimeUpdates: pathwayMetrics.recentUpdates,
      billingEvents: billingStats.totalQueries + billingStats.totalReports
    };
  }

  onReportRefresh(callback: (reportId: string, updatedReport: ProcessedReport) => void): () => void {
    this.refreshCallbacks.add(callback);
    
    return () => {
      this.refreshCallbacks.delete(callback);
    };
  }

  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Enhanced data search methods
  private async comprehensiveDataSearch(query: string, options: any) {
    try {
      console.log('   🔍 Searching internal data sources...');
      const internalSources = await this.searchDataSources(query, options.maxSources || 10);
      
      console.log('   📁 Searching uploaded files...');
      const fileSources = await this.searchUploadedFiles(query, options);
      
      return {
        sources: [...internalSources, ...fileSources],
        searchQuery: query,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('   ❌ Error in comprehensive data search:', error);
      return {
        sources: [],
        searchQuery: query,
        timestamp: new Date()
      };
    }
  }

  private async searchUploadedFiles(query: string, options: any) {
    const fileSources: DataSource[] = [];
    
    try {
      // Search selected file IDs
      if (options.selectedFileIds && options.selectedFileIds.length > 0) {
        console.log(`     📄 Processing ${options.selectedFileIds.length} selected files...`);
        for (const fileId of options.selectedFileIds) {
          try {
            const content = await fileUploadService.getFileContent(fileId);
            if (content && this.contentMatchesQuery(content, query)) {
              fileSources.push({
                id: fileId,
                title: `User Document ${fileId}`,
                content: content,
                type: 'pdf',
                lastUpdated: new Date(),
                relevanceScore: this.calculateContentRelevance(content, query)
              });
            }
          } catch (error) {
            console.error(`     ❌ Error loading file ${fileId}:`, error);
          }
        }
      }
      
      // Search direct file contents
      if (options.fileContents && options.fileContents.length > 0) {
        console.log(`     📄 Processing ${options.fileContents.length} direct file contents...`);
        options.fileContents.forEach((content: string, index: number) => {
          try {
            if (content && this.contentMatchesQuery(content, query)) {
              fileSources.push({
                id: `direct-file-${index}`,
                title: `Uploaded Document ${index + 1}`,
                content: content,
                type: 'pdf',
                lastUpdated: new Date(),
                relevanceScore: this.calculateContentRelevance(content, query)
              });
            }
          } catch (error) {
            console.error(`     ❌ Error processing file content ${index}:`, error);
          }
        });
      }
      
      return fileSources.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
    } catch (error) {
      console.error('   ❌ Error searching uploaded files:', error);
      return [];
    }
  }

  private async extractAndProcessContent(searchResults: any, options: any) {
    console.log('   📄 Extracting content from PDF sources...');
    const pdfContent = searchResults.sources
      .filter((source: DataSource) => source.type === 'pdf')
      .map((source: DataSource) => this.formatSourceContent(source));
    
    console.log('   📊 Extracting content from other sources...');
    const otherContent = searchResults.sources
      .filter((source: DataSource) => source.type !== 'pdf')
      .map((source: DataSource) => this.formatSourceContent(source));
    
    return {
      pdfContent,
      otherContent,
      totalSources: searchResults.sources.length,
      extractionTime: new Date()
    };
  }

  private async searchOnlineContent(query: string): Promise<string[]> {
    console.log('   🌐 Searching online content...');
    
    // Use Gemini's online search capability
    const onlineResults = await geminiService.searchOnlineContent(query);
    
    // Add real-time data from Pathway if available
    const pathwayData = pathwayService.searchDataSources(query)
      .filter(source => source.type === 'api' || source.type === 'web')
      .map(source => `${source.title}: ${source.content}`);
    
    return [...onlineResults, ...pathwayData];
  }

  private async generateStructuredReport(
    query: string,
    extractedContent: any,
    onlineData: string[],
    sources: DataSource[]
  ): Promise<QueryResult> {
    try {
      console.log('   🎯 Building enhanced context for AI...');
      
      // Combine all content types safely
      const allPdfContent = [
        ...(extractedContent.pdfContent || []),
        ...(extractedContent.otherContent || [])
      ];
      
      console.log('   🤖 Calling Gemini with enhanced prompt...');
      const result = await geminiService.processQuery(query, allPdfContent, onlineData || []);
      
      // Enhance the result with better source attribution
      const enhancedResult = await this.enhanceResultWithSources(result, sources || [], onlineData || []);
      
      return enhancedResult;
      
    } catch (error) {
      console.error('   ❌ Error generating structured report:', error);
      
      // Return a fallback result if AI processing fails
      return {
        keyTakeaways: [
          `Analysis of "${query}" could not be completed due to processing error`,
          'Please try again or contact support if the issue persists',
          'Some data sources may be temporarily unavailable'
        ],
        sources: sources.map((source, index) => `[${index + 1}] ${source.title}`),
        citations: [
          'Error in AI processing prevented full analysis',
          `Query processed on ${new Date().toLocaleDateString()}`,
          `${sources.length} sources were available for analysis`
        ],
        summary: `The query "${query}" could not be fully processed due to a system error. The system attempted to analyze ${sources.length} available sources but encountered an issue during AI processing. Please try submitting your query again.`,
        confidence: 0
      };
    }
  }

  private async enhanceResultWithSources(
    result: QueryResult,
    sources: DataSource[],
    onlineData: string[]
  ): Promise<QueryResult> {
    console.log('   📚 Enhancing result with source attribution...');
    
    // Generate better source references
    const enhancedSources = sources.map((source, index) => {
      const sourceType = source.type === 'pdf' ? 'Document' : 'Data Source';
      return `[${index + 1}] ${sourceType}: ${source.title}`;
    });
    
    // Add online data sources with proper names and URLs
    const onlineSources = onlineData.map((data, index) => {
      // Extract source name from the data string (format: "Source Name - Title (URL)")
      const sourceName = data.split(' - ')[0] || `Online Source ${index + 1}`;
      return `[${sources.length + index + 1}] ${sourceName}`;
    });
    
    // Generate detailed citations with actual source information
    const enhancedCitations = [
      ...sources.map(source => {
        const timestamp = source.lastUpdated.toLocaleDateString();
        return `${source.title} (${source.type.toUpperCase()}, last updated: ${timestamp})`;
      }),
      ...onlineData.map((data, index) => {
        // Extract full citation information from the data string
        if (data.includes('(http')) {
          // Format: "Source Name - Title (URL)"
          const parts = data.match(/(.*?) - "(.*?)" \((.*?)\)/);
          if (parts) {
            return `${parts[1]}: "${parts[2]}" - ${parts[3]} (retrieved: ${new Date().toLocaleDateString()})`;
          }
        }
        return `${data} (retrieved: ${new Date().toLocaleDateString()})`;
      }),
      `Analysis processed by Gemini 2.0 Flash Experimental on ${new Date().toLocaleDateString()}`
    ];
    
    return {
      ...result,
      sources: [...enhancedSources, ...onlineSources],
      citations: enhancedCitations
    };
  }

  // Utility methods
  private contentMatchesQuery(content: string, query: string): boolean {
    const queryWords = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    // Check if at least 30% of query words appear in content
    const matches = queryWords.filter(word => contentLower.includes(word));
    return matches.length >= Math.max(1, queryWords.length * 0.3);
  }
  
  private calculateContentRelevance(content: string, query: string): number {
    const queryWords = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    let relevanceScore = 0;
    queryWords.forEach(word => {
      const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length;
      relevanceScore += occurrences;
    });
    
    // Normalize by content length to avoid bias towards longer documents
    return relevanceScore / (content.length / 1000);
  }
  
  private formatSourceContent(source: DataSource): string {
    const sourceType = source.type.toUpperCase();
    const timestamp = source.lastUpdated.toLocaleDateString();
    return `[${sourceType}] ${source.title} (${timestamp}):\n${source.content}`;
  }

  // Demo methods
  async generateSampleReports(): Promise<void> {
    const sampleQueries = [
      'What are the latest developments in neural networks?',
      'How is machine learning being applied in healthcare?',
      'What are the current trends in blockchain technology?'
    ];

    console.log('🎯 Generating sample reports...');

    for (const query of sampleQueries) {
      try {
        await this.processQuery(query, {
          includeOnlineData: true,
          maxSources: 5,
          autoRefresh: true
        });
      } catch (error) {
        console.error(`Failed to generate sample report for: ${query}`, error);
      }
    }

    console.log(`✅ Generated ${sampleQueries.length} sample reports`);
  }
}

export const backendAgent = new BackendAgent();