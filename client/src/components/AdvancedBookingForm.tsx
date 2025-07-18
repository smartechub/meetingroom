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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, X, Plus, Upload, Users, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function AdvancedBookingForm() {
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
        body: JSON.stringify({
          startDateTime,
          endDateTime,
        }),
      });
      setRoomAvailability(response);
    } catch (error) {
      console.error('Error checking room availability:', error);
      setRoomAvailability([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Watch for changes in start/end times
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'startDateTime' || name === 'endDateTime') {
        if (value.startDateTime && value.endDateTime) {
          checkRoomAvailability(value.startDateTime, value.endDateTime);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
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
    let attachmentName;
    if (attachmentFile) {
      try {
        const uploadResult = await uploadFileMutation.mutateAsync(attachmentFile);
        attachmentUrl = uploadResult.url;
        attachmentName = attachmentFile.name;
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
      attachmentName,
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
              <span>Book Room</span>
            </CardTitle>
            <p className="text-gray-600 dark:text-slate-400">
              Schedule your meeting and reserve the perfect room
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Add Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter meeting title"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Participants */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Add Contacts / Groups / Emails</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter email address"
                    value={participantEmail}
                    onChange={(e) => setParticipantEmail(e.target.value)}
                    onKeyPress={handleParticipantKeyPress}
                  />
                  <Button type="button" onClick={addParticipant} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.watch('participants').length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('participants').map((email, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => removeParticipant(email)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Each participant will receive a booking notification email
                </p>
              </div>

              {/* Date & Time */}
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

              {/* Room Selection */}
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
                
                {roomAvailability.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                      Select an available room below. Green indicates the room is available, red indicates it's already booked.
                    </div>
                    <Select onValueChange={(value) => form.setValue('roomId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a room..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roomAvailability.map((room) => (
                          <SelectItem 
                            key={room.id} 
                            value={room.id.toString()}
                            disabled={!room.available}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span>{room.name}</span>
                                <span className="text-sm text-gray-500">({room.capacity} people)</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {room.available ? (
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Available</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-red-600">
                                    <XCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Unavailable</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {roomAvailability.some(room => !room.available) && (
                      <div className="text-xs text-red-600">
                        Note: Some rooms are unavailable due to existing bookings for this time slot.
                      </div>
                    )}
                  </div>
                ) : (
                  <Select onValueChange={(value) => form.setValue('roomId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a room..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roomsLoading ? (
                        <SelectItem value="loading" disabled>Loading rooms...</SelectItem>
                      ) : (
                        rooms.map((room: any) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{room.name} ({room.capacity} people)</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {form.formState.errors.roomId && (
                  <p className="text-sm text-red-600">{form.formState.errors.roomId.message}</p>
                )}
              </div>

              {/* Repeat Options */}
              <div className="space-y-2">
                <Label>Repeat</Label>
                <Select onValueChange={(value) => form.setValue('repeatType', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select repeat option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom Days</SelectItem>
                  </SelectContent>
                </Select>
                
                {form.watch('repeatType') === 'custom' && (
                  <div className="mt-3">
                    <Label>Select Days</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {weekDays.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={form.watch('customDays').includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCustomDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Attachment */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Add Attachment</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                    className="hidden"
                    id="file-upload"
                  />
                  <Label 
                    htmlFor="file-upload" 
                    className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Choose File</span>
                  </Label>
                  {attachmentFile && (
                    <span className="text-sm text-gray-600">{attachmentFile.name}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Support for PDF, DOCX, XLSX, PNG, JPG files
                </p>
              </div>

              {/* Reminder Option */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remindMe"
                    checked={form.watch('remindMe')}
                    onCheckedChange={(checked) => form.setValue('remindMe', !!checked)}
                  />
                  <Label htmlFor="remindMe" className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span>Remind Me</span>
                  </Label>
                </div>
                {form.watch('remindMe') && (
                  <Select onValueChange={(value) => form.setValue('reminderTime', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reminder time" />
                    </SelectTrigger>
                    <SelectContent>
                      {reminderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-500">
                  Trigger email notification before the meeting
                </p>
              </div>

              {/* Meeting Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Meeting Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter meeting description (optional)"
                  {...form.register('description')}
                  rows={3}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBookingMutation.isPending}>
                  {createBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}