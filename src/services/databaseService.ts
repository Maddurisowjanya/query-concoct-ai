import { supabase } from '@/integrations/supabase/client';
import { ProcessedReport } from './backendAgent';
import { BillingEvent } from './flexpriceService';
import { DataSource } from './pathwayService';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface StoredReport {
  id: string;
  user_id: string;
  question: string;
  summary: string | null;
  key_takeaways: any;
  sources: any;
  citations: any;
  processing_time_ms: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export class DatabaseService {
  private currentUserId: string | null = null;

  constructor() {
    // Listen for auth changes to update current user
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserId = session?.user?.id || null;
      
      if (event === 'SIGNED_IN' && session?.user) {
        this.createOrUpdateProfile(session.user);
      }
    });
  }

  private async createOrUpdateProfile(user: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error creating/updating profile:', error);
      } else {
        console.log('Profile created/updated successfully');
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.currentUserId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.currentUserId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async saveReport(report: ProcessedReport): Promise<string | null> {
    if (!this.currentUserId) {
      console.error('No user logged in');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('research_reports')
        .insert({
          user_id: this.currentUserId,
          question: report.query,
          summary: report.result.summary,
          key_takeaways: report.result.keyTakeaways,
          sources: report.result.sources,
          citations: report.result.citations,
          processing_time_ms: report.processingTime,
          status: 'completed',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving report:', error);
        return null;
      }

      console.log('Report saved successfully:', data.id);
      return data.id;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async getUserReports(): Promise<StoredReport[]> {
    if (!this.currentUserId) return [];

    try {
      const { data, error } = await supabase
        .from('research_reports')
        .select('*')
        .eq('user_id', this.currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reports:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async trackUsage(event: BillingEvent): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const { error } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: this.currentUserId,
          action_type: event.type,
          credits_used: event.cost,
          metadata: event.metadata
        });

      if (error) {
        console.error('Error tracking usage:', error);
      } else {
        console.log('Usage tracked successfully');
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  async getUserUsageStats(): Promise<any> {
    if (!this.currentUserId) return null;

    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', this.currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching usage stats:', error);
        return null;
      }

      const totalQueries = data?.filter(item => item.action_type === 'query').length || 0;
      const totalReports = data?.filter(item => item.action_type === 'report').length || 0;
      const totalCredits = data?.reduce((sum, item) => sum + (item.credits_used || 0), 0) || 0;

      return {
        totalQueries,
        totalReports,
        totalCredits,
        recentActivity: data?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  async saveDataSources(sources: DataSource[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_sources')
        .upsert(
          sources.map(source => ({
            id: source.id,
            title: source.title,
            source_type: source.type,
            content: source.content,
            url: source.url || null,
            last_updated: source.lastUpdated.toISOString()
          })),
          { onConflict: 'id' }
        );

      if (error) {
        console.error('Error saving data sources:', error);
      } else {
        console.log('Data sources saved successfully');
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  async getDataSources(): Promise<DataSource[]> {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error fetching data sources:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        type: item.source_type as any,
        title: item.title,
        url: item.url || undefined,
        content: item.content || '',
        lastUpdated: new Date(item.last_updated || item.created_at || new Date()),
        metadata: {}
      })) || [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  async updateAnalyticsSummary(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const usageStats = await this.getUserUsageStats();
      const reports = await this.getUserReports();
      
      const avgProcessingTime = reports.length > 0 
        ? reports.reduce((sum, report) => sum + (report.processing_time_ms || 0), 0) / reports.length
        : 0;

      const { error } = await supabase
        .from('analytics_summary')
        .upsert({
          user_id: this.currentUserId,
          date: new Date().toISOString().split('T')[0],
          total_questions: usageStats?.totalQueries || 0,
          total_reports: usageStats?.totalReports || 0,
          total_credits_used: usageStats?.totalCredits || 0,
          avg_processing_time_ms: avgProcessingTime,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });

      if (error) {
        console.error('Error updating analytics summary:', error);
      } else {
        console.log('Analytics summary updated successfully');
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  isUserLoggedIn(): boolean {
    return this.currentUserId !== null;
  }
}

export const databaseService = new DatabaseService();