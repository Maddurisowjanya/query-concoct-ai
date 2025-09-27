import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatabaseConfig {
  url: string;
  key: string;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  
  return { url, key };
};

const callGeminiAPI = async (prompt: string, context: string): Promise<any> => {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Context from documents and data sources:\n${context}\n\nUser question: ${prompt}\n\nPlease provide a comprehensive research report with:\n1. Key takeaways (as bullet points)\n2. Sources used\n3. Citations\n4. Summary\n\nFormat your response as JSON with keys: summary, key_takeaways (array), sources (array), citations (array)`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, key } = getDatabaseConfig();
    const supabase = createClient(url, key);
    
    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { question } = await req.json();
    
    if (!question) {
      throw new Error('No question provided');
    }

    console.log(`Processing research query for user ${user.id}: ${question}`);

    const startTime = Date.now();

    // Create initial report entry
    const { data: reportData, error: reportError } = await supabase
      .from('research_reports')
      .insert({
        user_id: user.id,
        question: question,
        status: 'processing'
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report insert error:', reportError);
      throw new Error(`Failed to create report: ${reportError.message}`);
    }

    // Track question usage
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        action_type: 'question',
        credits_used: 1,
        metadata: {
          question: question,
          report_id: reportData.id
        }
      });

    // Get user's documents for context
    const { data: documents } = await supabase
      .from('documents')
      .select('content_text, filename')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // Get live data sources for context
    const { data: dataSources } = await supabase
      .from('data_sources')
      .select('title, content, url, source_type')
      .limit(10);

    // Build context from documents and data sources
    let context = 'Available documents:\n';
    if (documents && documents.length > 0) {
      context += documents.map(doc => `${doc.filename}: ${doc.content_text?.substring(0, 500)}...`).join('\n\n');
    } else {
      context += 'No user documents available.\n';
    }

    context += '\n\nLive data sources:\n';
    if (dataSources && dataSources.length > 0) {
      context += dataSources.map(source => `${source.title} (${source.source_type}): ${source.content?.substring(0, 300)}...`).join('\n\n');
    }

    console.log('Built context, calling Gemini API...');

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(question, context);
    
    let parsedResponse;
    try {
      // Try to parse as JSON first
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response from text
        parsedResponse = {
          summary: geminiResponse.substring(0, 500),
          key_takeaways: [geminiResponse],
          sources: dataSources?.map(s => s.title) || ['Live data sources'],
          citations: dataSources?.map(s => s.url).filter(Boolean) || []
        };
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback response
      parsedResponse = {
        summary: geminiResponse,
        key_takeaways: [geminiResponse],
        sources: ['Gemini AI Analysis'],
        citations: []
      };
    }

    const processingTime = Date.now() - startTime;

    // Update report with results
    const { data: updatedReport, error: updateError } = await supabase
      .from('research_reports')
      .update({
        summary: parsedResponse.summary,
        key_takeaways: parsedResponse.key_takeaways,
        sources: parsedResponse.sources,
        citations: parsedResponse.citations,
        status: 'completed',
        processing_time_ms: processingTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Report update error:', updateError);
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    // Track report completion
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        action_type: 'report',
        credits_used: 2,
        metadata: {
          report_id: updatedReport.id,
          processing_time_ms: processingTime,
          question: question
        }
      });

    console.log(`Research query completed in ${processingTime}ms:`, updatedReport.id);

    return new Response(JSON.stringify({
      success: true,
      report: updatedReport,
      processing_time_ms: processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in research-query function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});