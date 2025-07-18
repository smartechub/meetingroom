import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Calendar, 
  Link, 
  Unlink, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Settings,
  ExternalLink
} from "lucide-react";

export default function CalendarSync() {
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: calendarSyncs = [], isLoading } = useQuery({
    queryKey: ['/api/calendar-sync'],
    retry: false,
  });

  const connectMutation = useMutation({
    mutationFn: async ({ provider }: { provider: string }) => {
      return await apiRequest(`/api/calendar-sync/connect/${provider}`, {
        method: "POST",
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-sync'] });
      // Redirect to demo page showing OAuth setup requirements
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect calendar",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      return await apiRequest(`/api/calendar-sync/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-sync'] });
      toast({
        title: "Success",
        description: "Calendar disconnected successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect calendar",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      return await apiRequest(`/api/calendar-sync/${id}/sync`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-sync'] });
      toast({
        title: "Success",
        description: "Calendar synchronized successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync calendar",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (provider: string) => {
    setSyncingProvider(provider);
    connectMutation.mutate({ provider });
  };

  const handleDisconnect = (id: number) => {
    disconnectMutation.mutate({ id });
  };

  const handleSync = (id: number) => {
    syncMutation.mutate({ id });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
        );
      case 'outlook':
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
        );
      default:
        return <Calendar className="w-6 h-6" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Microsoft Outlook';
      default:
        return provider;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar Sync</h1>
        <p className="text-gray-600 dark:text-slate-400">
          Connect your external calendars to sync bookings automatically
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link className="w-5 h-5" />
              <span>Connected Calendars</span>
            </CardTitle>
            <CardDescription>
              Manage your connected calendar accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calendarSyncs.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-slate-400">No calendars connected yet</p>
                <p className="text-sm text-gray-400 dark:text-slate-500">Connect your first calendar to start syncing</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calendarSyncs.map((sync: any) => (
                  <div key={sync.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getProviderIcon(sync.provider)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {getProviderName(sync.provider)}
                          </span>
                          <Badge variant={sync.isActive ? "default" : "secondary"}>
                            {sync.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          Connected on {new Date(sync.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(sync.id)}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(sync.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Add New Calendar</span>
            </CardTitle>
            <CardDescription>
              Connect a new calendar service to sync your bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {getProviderIcon('google')}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Google Calendar</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Sync with your Google Calendar
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleConnect('google')}
                  disabled={connectMutation.isPending && syncingProvider === 'google'}
                  className="w-full"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {connectMutation.isPending && syncingProvider === 'google' ? 'Connecting...' : 'Connect Google Calendar'}
                </Button>
              </div>

              <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {getProviderIcon('outlook')}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Microsoft Outlook</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Sync with your Outlook calendar
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleConnect('outlook')}
                  disabled={connectMutation.isPending && syncingProvider === 'outlook'}
                  className="w-full"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {connectMutation.isPending && syncingProvider === 'outlook' ? 'Connecting...' : 'Connect Outlook'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5" />
              <span>Sync Settings</span>
            </CardTitle>
            <CardDescription>
              Configure how your calendars sync with the booking system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sync Behavior:</strong>
                  <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                    <li>New bookings are automatically added to your connected calendars</li>
                    <li>Cancelled bookings are removed from your calendars</li>
                    <li>Modified bookings are updated in real-time</li>
                    <li>Sync runs every 5 minutes to ensure consistency</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Privacy & Security:</strong>
                  <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                    <li>Only booking-related events are synced</li>
                    <li>Your calendar data is encrypted and secure</li>
                    <li>You can disconnect at any time</li>
                    <li>No personal calendar events are accessed</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}