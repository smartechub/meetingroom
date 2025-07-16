import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  MapPin,
  User
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday, isSameDay } from "date-fns";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['/api/bookings'],
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 24-hour format: 0 AM to 11 PM

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  const getBookingsForDateTime = (date: Date, hour: number) => {
    return bookings.filter((booking: any) => {
      const bookingStart = new Date(booking.startDateTime);
      const bookingEnd = new Date(booking.endDateTime);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      return (
        (bookingStart <= slotStart && bookingEnd > slotStart) ||
        (bookingStart < slotEnd && bookingEnd >= slotEnd) ||
        (bookingStart >= slotStart && bookingEnd <= slotEnd)
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-400';
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Calendar View</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'week' && (
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-8 bg-gray-50 dark:bg-slate-800">
                {/* Time column header */}
                <div className="border-r border-gray-200 dark:border-slate-700 h-12"></div>
                {/* Day headers */}
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="border-r border-gray-200 dark:border-slate-700 last:border-r-0 h-12 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {format(day, 'EEE')}
                      </p>
                      <p className={`text-sm ${isToday(day) ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-slate-400'}`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-8">
                {timeSlots.map((hour) => (
                  <div key={hour} className="contents">
                    {/* Time label */}
                    <div className="border-r border-b border-gray-200 dark:border-slate-700 h-16 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                      </span>
                    </div>
                    {/* Day cells */}
                    {weekDays.map((day) => {
                      const dayBookings = getBookingsForDateTime(day, hour);
                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className="border-r border-b border-gray-200 dark:border-slate-700 last:border-r-0 h-16 p-1 relative"
                        >
                          {dayBookings.map((booking: any) => (
                            <div
                              key={booking.id}
                              className={`absolute inset-1 rounded p-1 border-l-4 ${getStatusColor(booking.status)} cursor-pointer hover:shadow-md transition-shadow`}
                              title={`${booking.title} - ${booking.room.name}`}
                            >
                              <div className="text-xs font-medium truncate">
                                {booking.title}
                              </div>
                              <div className="text-xs flex items-center space-x-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{booking.room.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'month' && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-slate-400">Month view coming soon</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking legend */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 border-l-4 border-green-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-slate-400">Confirmed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-slate-400">Pending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 rounded"></div>
          <span className="text-sm text-gray-600 dark:text-slate-400">Cancelled</span>
        </div>
      </div>
    </div>
  );
}
