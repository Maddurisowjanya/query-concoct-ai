import React, { useState } from 'react';
import { backendAgent } from '../services/backendAgent';

const WorkflowDemo: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const sampleQueries = [
    'Latest developments in ML?',
    'How is AI transforming healthcare?',
    'What are the key trends in blockchain technology?',
    'Explain quantum computing advances',
    'Current state of renewable energy adoption'
  ];

  const testWorkflow = async (testQuery?: string) => {
    const queryToTest = testQuery || query;
    if (!queryToTest.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);

    // Capture console logs
    const originalLog = console.log;
    const capturedLogs: string[] = [];
    
    console.log = (...args) => {
      const logMessage = args.join(' ');
      capturedLogs.push(logMessage);
      setLogs([...capturedLogs]);
      originalLog(...args);
    };

    try {
      console.log('🚀 Starting Enhanced Backend Agent Workflow Test');
      console.log('=' .repeat(60));
      
      const startTime = Date.now();
      
      // Test the enhanced workflow
      const report = await backendAgent.processQuery(queryToTest, {
        includeOnlineData: true,
        maxSources: 8,
        autoRefresh: false,
        fileContents: [
          'Sample document content about machine learning and AI developments...',
          'Research paper excerpt on recent ML breakthroughs...'
        ]
      });

      const endTime = Date.now();
      
      console.log('=' .repeat(60));
      console.log(`✅ Workflow completed in ${endTime - startTime}ms`);
      console.log('📋 Final Report Generated');
      console.log(`   📊 Processing time: ${report.processingTime}ms`);
      console.log(`   📚 Sources used: ${report.sourcesUsed.length}`);
      console.log(`   🔄 Refresh count: ${report.refreshCount}`);
      
      setResult(report);
      
    } catch (err) {
      console.error('❌ Workflow failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      console.log = originalLog;
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔬 Enhanced Backend Agent Workflow Demo</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            This demo showcases the enhanced backend agent workflow:
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>User Input:</strong> User types a question</li>
              <li><strong>PDF Search:</strong> Searches PDFs + uploaded documents</li>
              <li><strong>Online Search:</strong> Searches online data sources</li>
              <li><strong>Content Extraction:</strong> Extracts and summarizes insights</li>
              <li><strong>Source Attribution:</strong> Adds references/citations</li>
              <li><strong>Structured Output:</strong> Returns report with key takeaways, sources, citations</li>
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter your query:</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question to test the workflow..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && !loading && testWorkflow()}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => testWorkflow()}
              disabled={loading || !query.trim()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? '🔄 Processing...' : '🚀 Test Workflow'}
            </button>
            
            <div className="text-sm text-gray-600 self-center">
              Or try a sample:
            </div>
            
            {sampleQueries.map((sampleQuery, index) => (
              <button
                key={index}
                onClick={() => testWorkflow(sampleQuery)}
                disabled={loading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded disabled:opacity-50"
              >
                {sampleQuery}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">📝 Live Processing Logs</h3>
          <div className="max-h-64 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">📊 Generated Report</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🔑 Key Takeaways</h4>
              <ul className="space-y-2">
                {result.result.keyTakeaways.map((takeaway: string, index: number) => (
                  <li key={index} className="bg-blue-50 p-2 rounded text-sm">
                    • {takeaway}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📚 Sources</h4>
              <ul className="space-y-1">
                {result.result.sources.map((source: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600">
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">📝 Summary</h4>
            <p className="bg-gray-50 p-4 rounded text-sm leading-relaxed">
              {result.result.summary}
            </p>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">🔗 Citations</h4>
            <ul className="space-y-1">
              {result.result.citations.map((citation: string, index: number) => (
                <li key={index} className="text-xs text-gray-500">
                  [{index + 1}] {citation}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Confidence:</strong> {result.result.confidence}%
              </div>
              <div>
                <strong>Processing:</strong> {result.processingTime}ms
              </div>
              <div>
                <strong>Sources:</strong> {result.sourcesUsed.length}
              </div>
              <div>
                <strong>Generated:</strong> {result.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDemo;