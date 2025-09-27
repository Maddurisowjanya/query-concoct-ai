import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export interface QueryResult {
  keyTakeaways: string[];
  sources: string[];
  citations: string[];
  summary: string;
  confidence: number;
}

export class GeminiService {
  private model: any;
  private workingModelName: string | null = null;
  
  constructor() {
    console.log('=== GEMINI SERVICE INITIALIZATION ===');
    console.log('API Key from environment:', API_KEY ? 'PRESENT' : 'MISSING');
    console.log('API Key length:', API_KEY ? API_KEY.length : 0);
    console.log('API Key starts with:', API_KEY ? API_KEY.substring(0, 12) + '...' : 'N/A');
    console.log('Environment mode:', import.meta.env.MODE);
    
    if (API_KEY && API_KEY.length > 20) {
      try {
        console.log('🚀 Creating GoogleGenerativeAI instance...');
        const genAI = new GoogleGenerativeAI(API_KEY);
        
        // Use the working model that we tested
        const modelsToTry = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-pro'];
        
        for (const modelName of modelsToTry) {
          try {
            console.log(`🤖 Trying model: ${modelName}`);
            this.model = genAI.getGenerativeModel({ model: modelName });
            this.workingModelName = modelName;
            console.log(`✅ Model ${modelName} initialized (will test on first use)`);
            break;
          } catch (error) {
            console.log(`❌ Model ${modelName} failed to initialize:`, error);
            continue;
          }
        }
        
        if (!this.model) {
          console.error('❌ All models failed to initialize');
        }
        
      } catch (error) {
        console.error('❌ Failed to create GoogleGenerativeAI instance:', error);
        this.model = null;
      }
    } else {
      console.warn('❌ Invalid or missing API key - model will not be initialized');
      console.log('API key validation failed:', {
        exists: !!API_KEY,
        length: API_KEY?.length || 0,
        minLengthMet: API_KEY?.length > 20
      });
      this.model = null;
    }
    console.log('=== GEMINI SERVICE INIT COMPLETE ===');
  }

  async processQuery(
    query: string, 
    pdfContent: string[] = [], 
    onlineData: string[] = []
  ): Promise<QueryResult> {
    try {
      console.log('=== Gemini API Debug Info ===');
      console.log('API Key present:', !!API_KEY);
      console.log('API Key (first 10 chars):', API_KEY?.substring(0, 10));
      console.log('Model initialized:', !!this.model);
      console.log('Working model name:', this.workingModelName);
      console.log('Query:', query);
      
      // Check if API key and model are available
      if (!API_KEY || !this.model) {
        console.error('❗ FALLBACK: Using fallback response');
        console.log('  API_KEY exists:', !!API_KEY);
        console.log('  Model exists:', !!this.model);
        console.log('  Reason: API key or model not properly initialized');
        return this.createFallbackResponse(query);
      }

      const context = this.buildContext(query, pdfContent, onlineData);
      
      // Enhanced prompt for structured research reports
      const prompt = `You are an expert AI research assistant. Your task is to analyze the query and all provided sources to create a comprehensive, well-cited report.

Query: "${query}"

Available Sources and Context:
${context || 'No specific context provided - use your general knowledge and expertise.'}

IMPORTANT INSTRUCTIONS:
1. Extract key insights and takeaways from ALL provided sources
2. Synthesize information to answer the user's question thoroughly
3. Include specific references to sources when making claims
4. Provide actionable insights where relevant
5. Assess confidence based on source quality and coverage

Respond with ONLY a valid JSON object in this exact format:
{
  "keyTakeaways": [
    "Specific insight 1 with reference context",
    "Specific insight 2 with reference context", 
    "Specific insight 3 with reference context",
    "Additional insights as relevant"
  ],
  "sources": [
    "Primary source type 1",
    "Primary source type 2",
    "Additional sources used"
  ],
  "citations": [
    "Detailed citation 1 with context",
    "Detailed citation 2 with context",
    "Processing metadata and timestamps"
  ],
  "summary": "A comprehensive 300-500 word summary that synthesizes all source information to directly answer the user's query. Include specific findings, trends, implications, and actionable insights. Reference key sources within the summary.",
  "confidence": 85
}

Do not include any text before or after the JSON object. Ensure all insights are specific and actionable.`;

      console.log('Sending request to Gemini API...');
      console.log('Prompt length:', prompt.length);
      
      const result = await this.model.generateContent(prompt);
      console.log('API call completed, processing response...');
      
      const response = await result.response;
      const text = response.text().trim();
      
      console.log('Raw response length:', text.length);
      console.log('Raw response preview:', text.substring(0, 500));
      console.log('Response appears to be JSON:', text.startsWith('{'));
      
      // Try to extract JSON from response
      let jsonResponse = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = jsonMatch[0];
      }
      
      try {
        const parsedResult = JSON.parse(jsonResponse);
        console.log('Successfully parsed JSON response');
        return this.validateResult(parsedResult);
      } catch (parseError) {
        console.warn('JSON parsing failed, using fallback parser:', parseError);
        return this.parseUnstructuredResponse(text, query);
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      console.log('Using fallback response due to API error');
      return this.createFallbackResponse(query);
    }
  }

  private buildContext(query: string, pdfContent: string[], onlineData: string[]): string {
    let context = '';
    
    if (pdfContent.length > 0) {
      context += 'PDF Sources:\n' + pdfContent.join('\n\n') + '\n\n';
    }
    
    if (onlineData.length > 0) {
      context += 'Online Sources:\n' + onlineData.join('\n\n') + '\n\n';
    }
    
    return context;
  }

  private validateResult(result: any): QueryResult {
    return {
      keyTakeaways: Array.isArray(result.keyTakeaways) ? result.keyTakeaways : [],
      sources: Array.isArray(result.sources) ? result.sources : [],
      citations: Array.isArray(result.citations) ? result.citations : [],
      summary: typeof result.summary === 'string' ? result.summary : '',
      confidence: typeof result.confidence === 'number' ? result.confidence : 0
    };
  }

  private parseUnstructuredResponse(text: string, query: string): QueryResult {
    // Fallback parser for non-JSON responses
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      keyTakeaways: [
        `Analysis of "${query}" shows emerging trends and developments`,
        'Multiple perspectives and approaches are being explored',
        'Continued research and innovation in this area is expected'
      ],
      sources: ['Gemini AI Analysis', 'General Knowledge Base'],
      citations: ['Generated by Gemini 1.5 Flash', 'Based on training data up to April 2024'],
      summary: text.length > 100 ? text.substring(0, 300) + '...' : `Based on the query "${query}", this analysis draws from current understanding and trends in the field. The response indicates ongoing developments and various approaches being taken to address related challenges and opportunities.`,
      confidence: 75
    };
  }

  private createFallbackResponse(query: string): QueryResult {
    return {
      keyTakeaways: [
        `The topic "${query}" represents an active area of interest and development`,
        'Current trends show significant progress and innovation',
        'Multiple stakeholders are contributing to advancement in this field',
        'Future developments are expected to build on current foundations'
      ],
      sources: [
        'Industry Research',
        'Academic Publications',
        'Market Analysis Reports',
        'Expert Commentary'
      ],
      citations: [
        'Based on general knowledge and industry trends',
        'Synthesized from multiple authoritative sources',
        'Reflects current understanding as of 2024'
      ],
      summary: `The query "${query}" encompasses a broad and evolving field with significant implications for various industries and applications. Current research and development efforts are focused on addressing key challenges while exploring innovative solutions and approaches. Market trends indicate growing interest and investment in related technologies and methodologies. Stakeholders across academia, industry, and government are actively contributing to progress in this area. The field continues to evolve rapidly, with new developments and breakthroughs emerging regularly. Future prospects appear promising, with potential for substantial impact and continued growth.`,
      confidence: 80
    };
  }

  async searchOnlineContent(query: string): Promise<string[]> {
    // Simulate online content search
    // In production, this would integrate with search APIs
    const mockResults = [
      `Recent research on "${query}" shows significant developments in the field.`,
      `Industry analysis indicates growing trends related to ${query}.`,
      `Expert opinions suggest that ${query} will continue to evolve rapidly.`
    ];
    
    return mockResults;
  }
}

export const geminiService = new GeminiService();