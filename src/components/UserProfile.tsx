import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  LogOut, 
  Settings, 
  BarChart3, 
  FileText, 
  CreditCard,
  Calendar
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { databaseService, UserProfile } from '@/services/databaseService';

export const UserProfileComponent: React.FC = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData] = await Promise.all([
        databaseService.getUserProfile(),
        databaseService.getUserUsageStats()
      ]);
      
      setProfile(profileData);
      setUsageStats(statsData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return null;
  }

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile?.full_name, profile?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {profile?.full_name || 'User'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {profile?.email || user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      Member since {formatDate(profile?.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              {usageStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {usageStats.totalQueries}
                    </div>
                    <p className="text-sm text-blue-600">Queries Asked</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {usageStats.totalReports}
                    </div>
                    <p className="text-sm text-green-600">Reports Generated</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${usageStats.totalCredits?.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-sm text-purple-600">Total Spent</p>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {usageStats?.recentActivity && usageStats.recentActivity.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {usageStats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          {activity.action_type === 'query' ? (
                            <FileText className="h-4 w-4 text-blue-500" />
                          ) : (
                            <BarChart3 className="h-4 w-4 text-green-500" />
                          )}
                          <span className="capitalize text-sm">{activity.action_type}</span>
                          <Badge variant="outline" className="text-xs">
                            ${activity.credits_used?.toFixed(2) || '0.00'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};