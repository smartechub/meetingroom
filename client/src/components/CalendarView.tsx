import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Users,
  Monitor,
  Wifi,
  Video,
  Phone,
  Coffee,
  Projector,
  Filter,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { format, addDays, subDays, isToday, startOfDay, endOfDay } from "date-fns";

interface Room {
  id: number;
  name: string;
  capacity: number;
  description: string | null;
  equipment: string[];
  imageUrl: string | null;
  isActive: boolean;
}

interface Booking {
  id: number;
  title: string;
  description: string | null;
  roomId: number;
  userId: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  room: Room;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [capacityFilter, setCapacityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (direction === 'prev') {
      setCurrentDate(prev => subDays(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };

  const scrollToCurrentTime = () => {
    if (currentTimeRef.current && timelineRef.current) {
      const scrollLeft = currentTimeRef.current.offsetLeft - timelineRef.current.offsetWidth / 2 + 40;
      timelineRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = 300;
      const scrollLeft = timelineRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      timelineRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesCapacity = capacityFilter === "all" || 
        (capacityFilter === "small" && room.capacity <= 4) ||
        (capacityFilter === "medium" && room.capacity > 4 && room.capacity <= 10) ||
        (capacityFilter === "large" && room.capacity > 10);
      
      const matchesSearch = searchTerm === "" ||
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCapacity && matchesSearch;
    });
  }, [rooms, capacityFilter, searchTerm]);

  useEffect(() => {
    if (isToday(currentDate) && !roomsLoading && !bookingsLoading && currentTimeRef.current && timelineRef.current) {
      const timer = setTimeout(() => {
        scrollToCurrentTime();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentDate, roomsLoading, bookingsLoading, filteredRooms.length]);

  const getBookingsForRoomAndTime = (roomId: number, hour: number) => {
    const dayStart = startOfDay(currentDate);
    const slotStart = new Date(dayStart);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(dayStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return bookings.filter((booking) => {
      if (booking.roomId !== roomId) return false;
      if (booking.status === 'cancelled') return false;

      const bookingStart = new Date(booking.startDateTime);
      const bookingEnd = new Date(booking.endDateTime);

      return (
        (bookingStart < slotEnd && bookingEnd > slotStart)
      );
    });
  };

  const getEquipmentIcon = (equipment: string) => {
    const eq = equipment.toLowerCase();
    if (eq.includes('projector') || eq.includes('screen')) return <Projector className="w-3 h-3" />;
    if (eq.includes('video') || eq.includes('camera')) return <Video className="w-3 h-3" />;
    if (eq.includes('phone') || eq.includes('telephone')) return <Phone className="w-3 h-3" />;
    if (eq.includes('whiteboard') || eq.includes('board')) return <Monitor className="w-3 h-3" />;
    if (eq.includes('wifi') || eq.includes('internet')) return <Wifi className="w-3 h-3" />;
    if (eq.includes('coffee') || eq.includes('refreshment')) return <Coffee className="w-3 h-3" />;
    return <Monitor className="w-3 h-3" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500/80 hover:bg-blue-600/80 dark:bg-blue-600/80 dark:hover:bg-blue-700/80';
      case 'pending':
        return 'bg-amber-500/80 hover:bg-amber-600/80 dark:bg-amber-600/80 dark:hover:bg-amber-700/80';
      default:
        return 'bg-gray-500/80 hover:bg-gray-600/80 dark:bg-gray-600/80 dark:hover:bg-gray-700/80';
    }
  };

  const calculateBookingWidth = (booking: Booking, hour: number) => {
    const bookingStart = new Date(booking.startDateTime);
    const bookingEnd = new Date(booking.endDateTime);
    const dayStart = startOfDay(currentDate);
    const slotStart = new Date(dayStart);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(dayStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const effectiveStart = bookingStart > slotStart ? bookingStart : slotStart;
    const effectiveEnd = bookingEnd < slotEnd ? bookingEnd : slotEnd;

    const durationInSlot = effectiveEnd.getTime() - effectiveStart.getTime();
    const slotDuration = 60 * 60 * 1000;
    const percentage = (durationInSlot / slotDuration) * 100;

    const startOffset = bookingStart < slotStart ? 0 : 
      ((bookingStart.getTime() - slotStart.getTime()) / slotDuration) * 100;

    return { width: percentage, left: startOffset };
  };

  if (roomsLoading || bookingsLoading) {
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
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Room Scheduler</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="ml-1">Previous Day</span>
                </Button>
                <Button 
                  variant={isToday(currentDate) ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => navigateDate('today')}
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateDate('next')}
                >
                  <span className="mr-1">Next Day</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold">
                  {format(currentDate, 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollTimeline('left')}
                    title="Scroll left"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => scrollTimeline('right')}
                    title="Scroll right"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Capacities</SelectItem>
                    <SelectItem value="small">Small (1-4)</SelectItem>
                    <SelectItem value="medium">Medium (5-10)</SelectItem>
                    <SelectItem value="large">Large (11+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-auto">
            <div className="inline-block min-w-full">
              <div className="flex">
                <div className="w-64 flex-shrink-0 bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700">
                  <div className="h-12 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 font-semibold text-sm">
                    Rooms
                  </div>
                  <div>
                    {filteredRooms.map((room) => (
                      <div 
                        key={room.id} 
                        className="min-h-20 border-b border-gray-200 dark:border-slate-700 p-3 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="font-medium text-sm truncate">{room.name}</div>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-600 dark:text-slate-400">
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Users className="w-3 h-3" />
                            <span>{room.capacity}</span>
                          </div>
                          {room.equipment && room.equipment.length > 0 && (
                            <>
                              <span className="flex-shrink-0">•</span>
                              <div className="flex items-start space-x-1 flex-1 min-w-0">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getEquipmentIcon(room.equipment[0])}
                                </div>
                                <span className="whitespace-normal break-words leading-tight">
                                  {room.equipment.join(', ')}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {room.description && (
                          <div className="text-xs text-gray-500 dark:text-slate-500 truncate mt-1">
                            {room.description}
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredRooms.length === 0 && (
                      <div className="p-8 text-center text-gray-500 dark:text-slate-400 text-sm">
                        No rooms match your filters
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto" ref={timelineRef}>
                  <div className="grid grid-cols-24" style={{ gridTemplateColumns: 'repeat(24, minmax(80px, 1fr))' }}>
                    {timeSlots.map((hour) => {
                      const currentHour = new Date().getHours();
                      const isCurrentHour = isToday(currentDate) && hour === currentHour;
                      return (
                        <div
                          key={hour}
                          ref={isCurrentHour ? currentTimeRef : null}
                          className={`border-r border-gray-200 dark:border-slate-700 last:border-r-0 ${isCurrentHour ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                          <div className="h-12 border-b border-gray-200 dark:border-slate-700 flex items-center justify-center bg-gray-50 dark:bg-slate-800 px-2">
                            <span className={`text-xs font-medium ${isCurrentHour ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-slate-400'}`}>
                              {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    {filteredRooms.map((room) => (
                      <div key={room.id} className="flex">
                        <div className="grid grid-cols-24" style={{ gridTemplateColumns: 'repeat(24, minmax(80px, 1fr))' }}>
                          {timeSlots.map((hour) => {
                            const roomBookings = getBookingsForRoomAndTime(room.id, hour);
                            const currentHour = new Date().getHours();
                            const isCurrentHour = isToday(currentDate) && hour === currentHour;
                            return (
                              <div
                                key={`${room.id}-${hour}`}
                                className={`min-h-20 border-r border-b border-gray-200 dark:border-slate-700 last:border-r-0 relative hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${isCurrentHour ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900'}`}
                              >
                                {roomBookings.map((booking) => {
                                  const { width, left } = calculateBookingWidth(booking, hour);
                                  const bookingStart = new Date(booking.startDateTime);
                                  const bookingEnd = new Date(booking.endDateTime);
                                  const isFirstSlot = bookingStart.getHours() === hour || 
                                    (bookingStart < new Date(startOfDay(currentDate).setHours(hour, 0, 0, 0)) && hour === 0);
                                  
                                  return (
                                    <div
                                      key={booking.id}
                                      className={`absolute top-1 bottom-1 ${getStatusColor(booking.status)} rounded px-2 py-1 text-white text-xs cursor-pointer transition-all shadow-sm`}
                                      style={{ 
                                        left: `${left}%`, 
                                        width: `${width}%`,
                                        zIndex: 10
                                      }}
                                      title={`${booking.title}\n${format(bookingStart, 'h:mm a')} - ${format(bookingEnd, 'h:mm a')}\n${booking.user.email}`}
                                    >
                                      {isFirstSlot && width > 15 && (
                                        <div className="font-medium truncate">
                                          {booking.title}
                                        </div>
                                      )}
                                      {isFirstSlot && width > 25 && (
                                        <div className="text-[10px] opacity-90 truncate">
                                          {format(bookingStart, 'h:mm a')} - {format(bookingEnd, 'h:mm a')}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-slate-400">Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-slate-400">Pending</span>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-slate-500">
          Showing {filteredRooms.length} of {rooms.length} rooms
        </div>
      </div>
    </div>
  );
}
