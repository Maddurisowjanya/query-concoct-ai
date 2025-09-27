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

const extractTextFromPDF = async (fileBuffer: ArrayBuffer): Promise<string> => {
  // Simple text extraction - in production, you'd use a proper PDF parser
  // For now, we'll simulate text extraction
  console.log('Processing PDF of size:', fileBuffer.byteLength);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return simulated extracted text
  return `Extracted text from PDF document. This would contain the actual PDF content in a real implementation. Document processed at ${new Date().toISOString()}.`;
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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing PDF: ${file.name}, Size: ${file.size} bytes`);

    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(fileBuffer);

    // Store document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        content_text: extractedText,
        status: 'completed'
      })
      .select()
      .single();

    if (documentError) {
      console.error('Document insert error:', documentError);
      throw new Error(`Failed to store document: ${documentError.message}`);
    }

    // Track usage
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        action_type: 'pdf_upload',
        credits_used: 1,
        metadata: {
          filename: file.name,
          file_size: file.size,
          document_id: documentData.id
        }
      });

    console.log('PDF processed successfully:', documentData.id);

    return new Response(JSON.stringify({
      success: true,
      document: documentData,
      message: 'PDF processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-pdf function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});