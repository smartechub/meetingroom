import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, Info, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function CalendarSyncDemo() {
  const [, navigate] = useLocation();
  const [provider, setProvider] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setProvider(urlParams.get("provider") || "");
    setMessage(urlParams.get("message") || "");
  }, []);

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case "outlook":
        return {
          name: "Microsoft Outlook",
          icon: "📧",
          color: "blue",
          docs: "https://docs.microsoft.com/en-us/graph/auth/",
          requirements: [
            "Microsoft Azure App Registration",
            "Microsoft Graph API permissions",
            "OAuth 2.0 redirect URI configuration",
            "Client ID and Client Secret setup"
          ]
        };
      case "google":
        return {
          name: "Google Calendar",
          icon: "📅",
          color: "red",
          docs: "https://developers.google.com/calendar/api/quickstart",
          requirements: [
            "Google Cloud Project setup",
            "Calendar API enabled",
            "OAuth 2.0 credentials",
            "Authorized redirect URIs"
          ]
        };
      default:
        return {
          name: "Calendar Provider",
          icon: "📅",
          color: "gray",
          docs: "#",
          requirements: []
        };
    }
  };

  const providerInfo = getProviderInfo(provider);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/calendar-sync")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Calendar Sync</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Calendar Sync Demo</span>
              <Badge variant="secondary">Development Mode</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                This is a demonstration of the calendar sync feature. The actual integration requires proper OAuth configuration with the calendar provider.
              </AlertDescription>
            </Alert>

            {provider && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{providerInfo.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{providerInfo.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Calendar integration setup
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Production Setup Required
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {message}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Required Setup Steps:</h4>
                  <ul className="space-y-2">
                    {providerInfo.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    What Calendar Sync Would Do:
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Sync room bookings to your personal calendar</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Automatically block time slots when you have meetings</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Send meeting reminders through your calendar app</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Keep room reservations in sync with your schedule</span>
                    </li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={() => navigate("/calendar-sync")}
                    variant="outline"
                  >
                    Back to Settings
                  </Button>
                  <Button 
                    onClick={() => window.open(providerInfo.docs, "_blank")}
                    variant="secondary"
                  >
                    View Documentation
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}