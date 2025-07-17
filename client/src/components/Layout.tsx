import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  CalendarPlus, 
  LayoutDashboard, 
  List, 
  Users, 
  DoorOpen, 
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Mail,
  BarChart3,
  RefreshCw
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Book Room', href: '/book', icon: CalendarPlus },
    { name: 'Calendar View', href: '/calendar', icon: Calendar },
    { name: 'My Bookings', href: '/my-bookings', icon: List },
    { name: 'Calendar Sync', href: '/calendar-sync', icon: RefreshCw },
  ];

  const adminNavigation = [
    { name: 'User Management', href: '/users', icon: Users },
    { name: 'Room Management', href: '/rooms', icon: DoorOpen },
    { name: 'Email Settings', href: '/email-settings', icon: Mail },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Audit Log', href: '/audit', icon: ClipboardList },
  ];

  const isAdmin = user?.role === 'admin';
  const isCurrentPage = (href: string) => location === href;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 shadow-lg border-r border-gray-200 dark:border-slate-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white">Room Booking</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">Corporate System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isCurrentPage(item.href)
                    ? 'text-primary bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}

          {/* Admin Section */}
          {isAdmin && (
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700 mt-4">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Administration
              </p>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isCurrentPage(item.href)
                        ? 'text-primary bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profileImageUrl || ''} alt={user?.firstName || ''} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {getPageTitle(location)}
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                {getPageSubtitle(location)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
                <Moon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              </div>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  3
                </span>
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function getPageTitle(location: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/book': 'Book Room',
    '/calendar': 'Calendar View',
    '/my-bookings': 'My Bookings',
    '/users': 'User Management',
    '/rooms': 'Room Management',
    '/audit': 'Audit Log',
  };
  return titles[location] || 'Dashboard';
}

function getPageSubtitle(location: string): string {
  const subtitles: Record<string, string> = {
    '/dashboard': 'Welcome back, manage your bookings efficiently',
    '/book': 'Schedule your meeting and reserve the perfect room',
    '/calendar': 'View all bookings in calendar format',
    '/my-bookings': 'Manage your current and upcoming bookings',
    '/users': 'Manage user accounts and permissions',
    '/rooms': 'Manage meeting rooms and their equipment',
    '/audit': 'View system activity and changes',
  };
  return subtitles[location] || 'Welcome back';
}
