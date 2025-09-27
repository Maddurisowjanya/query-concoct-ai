import axios from 'axios';

const FLEXPRICE_API_URL = import.meta.env.VITE_FLEXPRICE_API_URL;

export interface BillingEvent {
  id: string;
  type: 'query' | 'report';
  timestamp: Date;
  cost: number;
  metadata?: any;
}

export interface UsageStats {
  totalQueries: number;
  totalReports: number;
  totalCredits: number;
  currentBalance: number;
  dailyUsage: BillingEvent[];
}

export class FlexpriceService {
  private events: BillingEvent[] = [];
  private totalCredits = 0;
  private balance = 100; // Starting balance

  // Pricing configuration
  private pricing = {
    query: 0.1,    // $0.10 per query
    report: 0.25   // $0.25 per report
  };

  async billQuery(query: string, metadata?: any): Promise<BillingEvent> {
    const event: BillingEvent = {
      id: this.generateId(),
      type: 'query',
      timestamp: new Date(),
      cost: this.pricing.query,
      metadata: { query, ...metadata }
    };

    this.events.push(event);
    this.totalCredits += event.cost;
    this.balance -= event.cost;

    // In production, this would make an actual API call to Flexprice
    await this.sendToFlexprice(event);
    
    return event;
  }

  async billReport(reportId: string, complexity: number = 1): Promise<BillingEvent> {
    const cost = this.pricing.report * complexity;
    
    const event: BillingEvent = {
      id: this.generateId(),
      type: 'report',
      timestamp: new Date(),
      cost,
      metadata: { reportId, complexity }
    };

    this.events.push(event);
    this.totalCredits += event.cost;
    this.balance -= event.cost;

    await this.sendToFlexprice(event);
    
    return event;
  }

  getUsageStats(): UsageStats {
    const queries = this.events.filter(e => e.type === 'query');
    const reports = this.events.filter(e => e.type === 'report');
    
    // Get today's events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyUsage = this.events.filter(e => 
      new Date(e.timestamp) >= today
    );

    return {
      totalQueries: queries.length,
      totalReports: reports.length,
      totalCredits: this.totalCredits,
      currentBalance: this.balance,
      dailyUsage
    };
  }

  getRealTimeMetrics() {
    const stats = this.getUsageStats();
    
    return {
      ...stats,
      costBreakdown: {
        queries: stats.totalQueries * this.pricing.query,
        reports: stats.totalReports * this.pricing.report
      },
      hourlyUsage: this.getHourlyUsage(),
      projectedDailyCost: this.calculateProjectedDailyCost()
    };
  }

  private getHourlyUsage() {
    const hourlyData = new Array(24).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.events.forEach(event => {
      const eventDate = new Date(event.timestamp);
      if (eventDate >= today) {
        const hour = eventDate.getHours();
        hourlyData[hour] += event.cost;
      }
    });
    
    return hourlyData.map((cost, hour) => ({ hour, cost }));
  }

  private calculateProjectedDailyCost(): number {
    const todayEvents = this.events.filter(e => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(e.timestamp) >= today;
    });
    
    const currentHour = new Date().getHours();
    const todayCost = todayEvents.reduce((sum, e) => sum + e.cost, 0);
    
    if (currentHour === 0) return todayCost;
    
    return (todayCost / (currentHour + 1)) * 24;
  }

  private async sendToFlexprice(event: BillingEvent): Promise<void> {
    try {
      // In production, this would be a real API call
      console.log('Billing event sent to Flexprice:', event);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Uncomment for actual Flexprice integration:
      /*
      await axios.post(`${FLEXPRICE_API_URL}/billing/events`, {
        event_id: event.id,
        event_type: event.type,
        amount: event.cost,
        timestamp: event.timestamp,
        metadata: event.metadata
      });
      */
    } catch (error) {
      console.error('Failed to send billing event to Flexprice:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Real-time subscription for billing events
  onBillingUpdate(callback: (stats: UsageStats) => void): () => void {
    const interval = setInterval(() => {
      callback(this.getUsageStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }

  // Add credits (for demo purposes)
  addCredits(amount: number): void {
    this.balance += amount;
  }
}

export const flexpriceService = new FlexpriceService();