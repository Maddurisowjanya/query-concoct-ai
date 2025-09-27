import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { testGeminiAPIKey, validateGeminiSetup } from '../utils/testGeminiAPI';

const GeminiDebug: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGeminiAPI = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('Starting Gemini API test...');
      const result = await geminiService.processQuery('What is machine learning?');
      console.log('Test completed:', result);
      setTestResult(result);
    } catch (err) {
      console.error('Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSimpleAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Running comprehensive API test...');
      const result = await testGeminiAPIKey();
      
      if (result.success) {
        console.log('✅ API test successful');
        setTestResult({ 
          type: 'comprehensive',
          success: true,
          response: result.response,
          apiKeyValid: result.apiKeyValid
        });
      } else {
        console.log('❌ API test failed:', result.error);
        setError(`API Test Failed: ${result.error}`);
        setTestResult({
          type: 'comprehensive',
          success: false,
          error: result.error,
          apiKeyValid: result.apiKeyValid
        });
      }
    } catch (err) {
      console.error('Test execution failed:', err);
      setError(err instanceof Error ? err.message : 'Test execution failed');
    } finally {
      setLoading(false);
    }
  };
  
  const validateSetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Running full setup validation...');
      const result = await validateGeminiSetup();
      
      setTestResult({
        type: 'validation',
        ...result
      });
      
      if (!result.success) {
        setError(`Setup Validation Failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Validation failed:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Gemini API Debug Panel</h2>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testGeminiAPI}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 mb-2"
        >
          {loading ? 'Testing...' : 'Test Gemini Service'}
        </button>
        
        <button 
          onClick={testSimpleAPI}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2 mb-2"
        >
          {loading ? 'Testing...' : 'Test API Key'}
        </button>
        
        <button 
          onClick={validateSetup}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mr-2 mb-2"
        >
          {loading ? 'Validating...' : 'Full Validation'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {testResult && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Test Result:</h3>
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>API Key Status:</strong> {import.meta.env.VITE_GEMINI_API_KEY ? '✅ Present' : '❌ Missing'}</p>
        <p><strong>API Key Length:</strong> {import.meta.env.VITE_GEMINI_API_KEY?.length || 0} characters</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
      </div>
    </div>
  );
};

export default GeminiDebug;