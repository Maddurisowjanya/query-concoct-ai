-- Create tables for real-time research assistant

-- User profiles for storing user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research reports table
CREATE TABLE public.research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  summary TEXT,
  key_takeaways JSONB,
  sources JSONB,
  citations JSONB,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF documents storage
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_text TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking for billing
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('question', 'report', 'pdf_upload')),
  credits_used INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live data sources (Pathway-like functionality)
CREATE TABLE public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT,
  content TEXT,
  source_type TEXT DEFAULT 'blog' CHECK (source_type IN ('blog', 'news', 'research')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics aggregation table
CREATE TABLE public.analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  total_questions INTEGER DEFAULT 0,
  total_reports INTEGER DEFAULT 0,
  total_credits_used INTEGER DEFAULT 0,
  avg_processing_time_ms FLOAT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for research_reports
CREATE POLICY "Users can view own reports" ON public.research_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.research_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.research_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for data_sources (public read)
CREATE POLICY "Everyone can view data sources" ON public.data_sources
  FOR SELECT USING (true);

-- RLS Policies for analytics_summary
CREATE POLICY "Users can view own analytics" ON public.analytics_summary
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON public.analytics_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON public.analytics_summary
  FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update analytics summary
CREATE OR REPLACE FUNCTION public.update_analytics_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics_summary (user_id, date, total_questions, total_reports, total_credits_used)
  VALUES (
    NEW.user_id,
    CURRENT_DATE,
    CASE WHEN NEW.action_type = 'question' THEN 1 ELSE 0 END,
    CASE WHEN NEW.action_type = 'report' THEN 1 ELSE 0 END,
    NEW.credits_used
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_questions = analytics_summary.total_questions + CASE WHEN NEW.action_type = 'question' THEN 1 ELSE 0 END,
    total_reports = analytics_summary.total_reports + CASE WHEN NEW.action_type = 'report' THEN 1 ELSE 0 END,
    total_credits_used = analytics_summary.total_credits_used + NEW.credits_used,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger for analytics updates
CREATE TRIGGER on_usage_tracked
  AFTER INSERT ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_analytics_summary();

-- Enable realtime for key tables
ALTER TABLE public.research_reports REPLICA IDENTITY FULL;
ALTER TABLE public.usage_tracking REPLICA IDENTITY FULL;
ALTER TABLE public.analytics_summary REPLICA IDENTITY FULL;
ALTER TABLE public.data_sources REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_summary;
ALTER PUBLICATION supabase_realtime ADD TABLE public.data_sources;

-- Create some initial data sources for demo
INSERT INTO public.data_sources (title, url, content, source_type) VALUES
('AI Research Trends 2024', 'https://example.com/ai-trends', 'Latest developments in artificial intelligence and machine learning research...', 'research'),
('Tech Industry Updates', 'https://example.com/tech-news', 'Recent technological advancements and industry news...', 'news'),
('Innovation Blog Post', 'https://example.com/innovation', 'Exploring new methodologies in data science and analytics...', 'blog');