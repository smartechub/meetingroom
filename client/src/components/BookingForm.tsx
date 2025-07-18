import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, X, Plus, Upload, Users, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RoomSelector from "./RoomSelector";

const bookingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  roomId: z.string().min(1, "Room selection is required"),
  startDateTime: z.string().min(1, "Start date and time is required"),
  endDateTime: z.string().min(1, "End date and time is required"),
  description: z.string().optional(),
  participants: z.array(z.string().email("Invalid email address")).default([]),
  repeatType: z.enum(["none", "daily", "weekly", "custom"]).default("none"),
  customDays: z.array(z.number().min(0).max(6)).default([]), // 0 = Sunday, 6 = Saturday
  remindMe: z.boolean().default(false),
  reminderTime: z.number().default(15),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookingForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [participantEmail, setParticipantEmail] = useState("");
  const [roomAvailability, setRoomAvailability] = useState<Array<{
    id: number;
    name: string;
    capacity: number;
    description: string;
    available: boolean;
    conflictReason: string | null;
  }>>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['/api/rooms'],
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: "",
      roomId: "",
      startDateTime: "",
      endDateTime: "",
      description: "",
      participants: [],
      repeatType: "none",
      customDays: [],
      remindMe: false,
      reminderTime: 15,
    },
  });

  const reminderOptions = [
    { value: 5, label: "5 minutes before" },
    { value: 10, label: "10 minutes before" },
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 120, label: "2 hours before" },
    { value: 1440, label: "1 day before" },
  ];

  const weekDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  // Helper functions for participants
  const addParticipant = () => {
    if (participantEmail && participantEmail.includes('@')) {
      const currentParticipants = form.getValues('participants') || [];
      if (!currentParticipants.includes(participantEmail)) {
        form.setValue('participants', [...currentParticipants, participantEmail]);
        setParticipantEmail("");
      }
    }
  };

  const removeParticipant = (emailToRemove: string) => {
    const currentParticipants = form.getValues('participants') || [];
    form.setValue('participants', currentParticipants.filter(email => email !== emailToRemove));
  };

  const handleParticipantKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addParticipant();
    }
  };

  // Helper functions for custom days
  const toggleCustomDay = (dayValue: number) => {
    const currentDays = form.getValues('customDays') || [];
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(day => day !== dayValue)
      : [...currentDays, dayValue].sort();
    form.setValue('customDays', newDays);
  };

  // Function to check room availability
  const checkRoomAvailability = async (startDateTime: string, endDateTime: string) => {
    if (!startDateTime || !endDateTime) {
      setRoomAvailability([]);
      return;
    }

    setCheckingAvailability(true);
    try {
      const response = await apiRequest('/api/rooms/availability', {
        method: 'POST',
        body: JSON.stringify({ startDateTime, endDateTime })
      });
      console.log('Room availability response:', response);
      setRoomAvailability(response);
    } catch (error) {
      console.error('Error checking availability:', error);
      setRoomAvailability([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Watch for changes in date/time fields
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === 'startDateTime' || name === 'endDateTime') {
        const { startDateTime, endDateTime } = values;
        if (startDateTime && endDateTime) {
          checkRoomAvailability(startDateTime, endDateTime);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData & { attachmentUrl?: string }) => {
      const response = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      navigate('/my-bookings');
    },
    onError: (error: any) => {
      let errorMessage = "Failed to create booking";
      
      // Handle specific error cases
      if (error.message?.includes("conflict") || error.message?.includes("already booked")) {
        errorMessage = "This room is already booked for the selected time. Please choose a different time or room.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
  });



  const onSubmit = async (data: BookingFormData) => {
    // Check if selected room is available
    if (roomAvailability.length > 0) {
      const selectedRoom = roomAvailability.find(room => room.id.toString() === data.roomId);
      if (selectedRoom && !selectedRoom.available) {
        toast({
          title: "Room Unavailable",
          description: "The selected room is not available for this time slot. Please choose a different room or time.",
          variant: "destructive",
        });
        return;
      }
    }

    let attachmentUrl;
    if (attachmentFile) {
      try {
        const uploadResult = await uploadFileMutation.mutateAsync(attachmentFile);
        attachmentUrl = uploadResult.url;
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to upload attachment",
          variant: "destructive",
        });
        return;
      }
    }

    createBookingMutation.mutate({
      ...data,
      roomId: parseInt(data.roomId),
      attachmentUrl,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png'];
      if (allowedTypes.includes(file.type)) {
        setAttachmentFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF, DOCX, PPT, JPG, or PNG file",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Book a Meeting Room</span>
            </CardTitle>
            <p className="text-gray-600 dark:text-slate-400">
              Schedule your meeting and reserve the perfect room for your needs.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter meeting title"
                    {...form.register('title')}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomId">Select Room *</Label>
                  {checkingAvailability && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Checking room availability for your selected time...
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRoomSelectorOpen(true)}
                    className="w-full justify-start text-left h-10 px-3 py-2"
                    disabled={(!Array.isArray(roomAvailability) || roomAvailability.length === 0) && checkingAvailability}
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {form.watch('roomId') ? 
                          (Array.isArray(roomAvailability) ? roomAvailability.find(r => r.id.toString() === form.watch('roomId'))?.name : null) || 
                          rooms.find((r: any) => r.id.toString() === form.watch('roomId'))?.name ||
                          'Selected Room'
                          : 'Choose a room...'
                        }
                      </span>
                    </div>
                  </Button>
                  
                  {Array.isArray(roomAvailability) && roomAvailability.length > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Available rooms: {roomAvailability.filter(room => room.available).length}</span>
                        <span>Unavailable rooms: {roomAvailability.filter(room => !room.available).length}</span>
                      </div>
                    </div>
                  )}
                  
                  {form.formState.errors.roomId && (
                    <p className="text-sm text-red-600">{form.formState.errors.roomId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDateTime">Start Date & Time *</Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    {...form.register('startDateTime')}
                  />
                  {form.formState.errors.startDateTime && (
                    <p className="text-sm text-red-600">{form.formState.errors.startDateTime.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDateTime">End Date & Time *</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    {...form.register('endDateTime')}
                  />
                  {form.formState.errors.endDateTime && (
                    <p className="text-sm text-red-600">{form.formState.errors.endDateTime.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Repeat Options</Label>
                <RadioGroup
                  defaultValue="none"
                  onValueChange={(value) => form.setValue('repeatType', value as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">No Repeat</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Daily</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Custom Days</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Meeting Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of the meeting..."
                  rows={4}
                  {...form.register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label>Attachment</Label>
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    id="attachment"
                    accept=".pdf,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="attachment" className="cursor-pointer">
                    <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                      PDF, DOCX, PPT, JPG, PNG (max 10MB)
                    </p>
                  </label>
                  {attachmentFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {attachmentFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remindMe"
                    onCheckedChange={(checked) => form.setValue('remindMe', checked as boolean)}
                  />
                  <Label htmlFor="remindMe">Send me email reminder</Label>
                </div>
                <Select
                  onValueChange={(value) => form.setValue('reminderTime', parseInt(value))}
                  defaultValue="15"
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createBookingMutation.isPending || uploadFileMutation.isPending}
                >
                  {createBookingMutation.isPending ? 'Booking...' : 'Book Room'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Room Selector Dialog */}
      <RoomSelector
        isOpen={isRoomSelectorOpen}
        onClose={() => setIsRoomSelectorOpen(false)}
        rooms={(() => {
          const roomsToPass = Array.isArray(roomAvailability) && roomAvailability.length > 0 ? roomAvailability : rooms.map((room: any) => ({
            ...room,
            available: true,
            conflictReason: null
          }));
          console.log('Rooms being passed to RoomSelector:', roomsToPass);
          return roomsToPass;
        })()}
        onSelect={(roomId) => form.setValue('roomId', roomId)}
        selectedRoomId={form.watch('roomId')}
      />
    </div>
  );
}
