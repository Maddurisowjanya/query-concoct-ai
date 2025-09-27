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

const fetchExternalData = async (): Promise<any[]> => {
  // Simulate fetching from various sources (news APIs, blogs, etc.)
  // In production, this would connect to real APIs
  const mockSources = [
    {
      title: `Breaking: AI Advancement in ${new Date().getFullYear()}`,
      url: 'https://example.com/ai-news-' + Date.now(),
      content: `Recent breakthrough in artificial intelligence shows promising results. Updated at ${new Date().toISOString()}. This represents a significant step forward in machine learning research and applications.`,
      source_type: 'news'
    },
    {
      title: `Research Paper: Neural Networks Update`,
      url: 'https://example.com/research-' + Date.now(),
      content: `New findings in neural network architecture demonstrate improved performance metrics. Published today: ${new Date().toISOString()}. The study shows 15% improvement in accuracy across multiple benchmarks.`,
      source_type: 'research'
    },
    {
      title: `Tech Blog: Industry Insights ${new Date().toDateString()}`,
      url: 'https://example.com/blog-' + Date.now(),
      content: `Industry analysis reveals emerging trends in technology adoption. Current observations as of ${new Date().toISOString()} indicate growing interest in AI integration across sectors.`,
      source_type: 'blog'
    }
  ];

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockSources;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, key } = getDatabaseConfig();
    const supabase = createClient(url, key);
    
    console.log('Starting data ingestion process...');

    // Fetch new data from external sources
    const newDataSources = await fetchExternalData();
    
    let ingestedCount = 0;
    let updatedCount = 0;

    for (const source of newDataSources) {
      // Check if this source already exists (by URL)
      const { data: existing } = await supabase
        .from('data_sources')
        .select('id, last_updated')
        .eq('url', source.url)
        .single();

      if (existing) {
        // Update existing source
        const { error: updateError } = await supabase
          .from('data_sources')
          .update({
            title: source.title,
            content: source.content,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (!updateError) {
          updatedCount++;
        } else {
          console.error('Error updating source:', updateError);
        }
      } else {
        // Insert new source
        const { error: insertError } = await supabase
          .from('data_sources')
          .insert({
            title: source.title,
            url: source.url,
            content: source.content,
            source_type: source.source_type,
            last_updated: new Date().toISOString()
          });

        if (!insertError) {
          ingestedCount++;
        } else {
          console.error('Error inserting source:', insertError);
        }
      }
    }

    // Clean up old data sources (keep only latest 50)
    const { data: allSources } = await supabase
      .from('data_sources')
      .select('id')
      .order('created_at', { ascending: false });

    if (allSources && allSources.length > 50) {
      const idsToDelete = allSources.slice(50).map(s => s.id);
      await supabase
        .from('data_sources')
        .delete()
        .in('id', idsToDelete);
    }

    const result = {
      success: true,
      ingested: ingestedCount,
      updated: updatedCount,
      total_sources: ingestedCount + updatedCount,
      timestamp: new Date().toISOString()
    };

    console.log('Data ingestion completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ingest-data function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
