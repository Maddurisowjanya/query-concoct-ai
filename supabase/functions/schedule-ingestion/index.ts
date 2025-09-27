import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

// Auto-trigger data ingestion every 5 minutes
serve(async () => {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ingest-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    });
    
    const data = await response.json();
    console.log('Scheduled ingestion completed:', data);
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});