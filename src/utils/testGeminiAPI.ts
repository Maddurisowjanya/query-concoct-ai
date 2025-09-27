// Simple Gemini API test utility
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function testGeminiAPIKey(): Promise<{
  success: boolean;
  error?: string;
  response?: string;
  apiKeyValid: boolean;
  modelTested?: string;
}> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  console.log('🧪 Testing Gemini API Key...');
  console.log('API Key present:', !!apiKey);
  console.log('API Key length:', apiKey?.length || 0);
  
  if (!apiKey) {
    return {
      success: false,
      error: 'API key not found in environment variables',
      apiKeyValid: false
    };
  }
  
  if (apiKey.length < 30) {
    return {
      success: false,
      error: 'API key appears to be too short (should be ~39 characters)',
      apiKeyValid: false
    };
  }
  
  // Try different model versions in order of preference
  const modelsToTry = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro'
  ];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`🚀 Testing model: ${modelName}`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      console.log('📡 Testing simple API call...');
      const result = await model.generateContent('Say hello world');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ Success with model: ${modelName}`);
      console.log('Response preview:', text.substring(0, 100));
      
      return {
        success: true,
        response: text,
        apiKeyValid: true,
        modelTested: modelName
      };
      
    } catch (error: any) {
      console.log(`❌ Model ${modelName} failed:`, error.message);
      
      // If it's clearly an API key issue, don't try other models
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        return {
          success: false,
          error: 'Invalid API key or authentication failed',
          apiKeyValid: false,
          modelTested: modelName
        };
      }
      
      // Continue trying other models if this one isn't available
      continue;
    }
  }
  
  // If all models failed
  return {
    success: false,
    error: 'All model versions failed. API key may be invalid or service unavailable.',
    apiKeyValid: false
  };
}

export async function validateGeminiSetup() {
  console.log('🔍 Validating Gemini API setup...');
  
  const result = await testGeminiAPIKey();
  
  console.log('📊 Validation Results:');
  console.log('  Success:', result.success);
  console.log('  API Key Valid:', result.apiKeyValid);
  if (result.error) console.log('  Error:', result.error);
  if (result.response) console.log('  Response Length:', result.response.length);
  
  return result;
}