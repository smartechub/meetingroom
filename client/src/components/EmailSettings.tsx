import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Mail, 
  Server, 
  Settings, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  Bell,
  Key
} from "lucide-react";

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().min(1, "SMTP port is required"),
  smtpUsername: z.string().min(1, "SMTP username is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  fromEmail: z.string().email("Valid email is required"),
  fromName: z.string().min(1, "From name is required"),
  enableBookingNotifications: z.boolean(),
  enableReminders: z.boolean(),
  enablePasswordReset: z.boolean(),
});

type EmailSettingsForm = z.infer<typeof emailSettingsSchema>;

export default function EmailSettings() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const { data: emailSettings, isLoading } = useQuery({
    queryKey: ['/api/email-settings'],
    retry: false,
  });

  const form = useForm<EmailSettingsForm>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
      fromEmail: "",
      fromName: "Room Booking System",
      enableBookingNotifications: true,
      enableReminders: true,
      enablePasswordReset: true,
    },
  });

  // Reset form when email settings data is loaded
  React.useEffect(() => {
    if (emailSettings) {
      form.reset({
        smtpHost: emailSettings.smtpHost || "",
        smtpPort: emailSettings.smtpPort || 587,
        smtpUsername: emailSettings.smtpUsername || "",
        smtpPassword: emailSettings.smtpPassword || "",
        fromEmail: emailSettings.fromEmail || "",
        fromName: emailSettings.fromName || "Room Booking System",
        enableBookingNotifications: emailSettings.enableBookingNotifications ?? true,
        enableReminders: emailSettings.enableReminders ?? true,
        enablePasswordReset: emailSettings.enablePasswordReset ?? true,
      });
    }
  }, [emailSettings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EmailSettingsForm) => {
      return await apiRequest("/api/email-settings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-settings'] });
      toast({
        title: "Success",
        description: "Email settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email settings",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/email-settings/test", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email connection test successful",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Email connection test failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailSettingsForm) => {
    updateMutation.mutate(data);
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    testConnectionMutation.mutate();
    setTimeout(() => setIsTestingConnection(false), 2000);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Settings</h1>
        <p className="text-gray-600 dark:text-slate-400">
          Configure email notifications and SMTP settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>SMTP Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure your email server settings for sending notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host *</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    {...form.register("smtpHost")}
                  />
                  {form.formState.errors.smtpHost && (
                    <p className="text-sm text-red-600">{form.formState.errors.smtpHost.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port *</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    placeholder="587"
                    {...form.register("smtpPort", { valueAsNumber: true })}
                  />
                  {form.formState.errors.smtpPort && (
                    <p className="text-sm text-red-600">{form.formState.errors.smtpPort.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username *</Label>
                  <Input
                    id="smtpUsername"
                    placeholder="your-email@example.com"
                    {...form.register("smtpUsername")}
                  />
                  {form.formState.errors.smtpUsername && (
                    <p className="text-sm text-red-600">{form.formState.errors.smtpUsername.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password *</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder="••••••••"
                    {...form.register("smtpPassword")}
                  />
                  {form.formState.errors.smtpPassword && (
                    <p className="text-sm text-red-600">{form.formState.errors.smtpPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email *</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="noreply@yourcompany.com"
                    {...form.register("fromEmail")}
                  />
                  {form.formState.errors.fromEmail && (
                    <p className="text-sm text-red-600">{form.formState.errors.fromEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name *</Label>
                  <Input
                    id="fromName"
                    placeholder="Room Booking System"
                    {...form.register("fromName")}
                  />
                  {form.formState.errors.fromName && (
                    <p className="text-sm text-red-600">{form.formState.errors.fromName.message}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || testConnectionMutation.isPending}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isTestingConnection ? "Testing..." : "Test Connection"}
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>
              Configure which email notifications to send
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="booking-notifications">Booking Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Send emails when bookings are created, updated, or cancelled
                </p>
              </div>
              <Switch
                id="booking-notifications"
                checked={form.watch("enableBookingNotifications")}
                onCheckedChange={(checked) => form.setValue("enableBookingNotifications", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reminders">Booking Reminders</Label>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Send reminder emails before scheduled bookings
                </p>
              </div>
              <Switch
                id="reminders"
                checked={form.watch("enableReminders")}
                onCheckedChange={(checked) => form.setValue("enableReminders", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="password-reset">Password Reset</Label>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Allow users to reset their passwords via email
                </p>
              </div>
              <Switch
                id="password-reset"
                checked={form.watch("enablePasswordReset")}
                onCheckedChange={(checked) => form.setValue("enablePasswordReset", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Email Templates</span>
            </CardTitle>
            <CardDescription>
              Common email templates used by the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Available Templates:</strong>
                  <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                    <li>Booking Confirmation</li>
                    <li>Booking Cancellation</li>
                    <li>Booking Reminder</li>
                    <li>Password Reset</li>
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