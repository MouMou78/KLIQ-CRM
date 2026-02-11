import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Video, User } from "lucide-react";
import { format } from "date-fns";

const DEMO_DURATION = 30; // minutes
const BUFFER_TIME = 5; // minutes after each demo

export default function BookDemo() {
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBooking, setIsBooking] = useState(false);

  // Fetch sales managers (users with role "Sales Manager")
  const { data: managers, isLoading: loadingManagers } = trpc.users.list.useQuery();
  
  // Fetch availability for selected manager and date
  const { data: availability, isLoading: loadingAvailability } = trpc.calendar.getAvailability.useQuery(
    {
      userId: selectedManager ? parseInt(selectedManager) : 0,
      date: selectedDate || new Date(),
    },
    {
      enabled: !!selectedManager && !!selectedDate,
    }
  );

  const bookDemoMutation = trpc.calendar.bookDemo.useMutation({
    onSuccess: (data) => {
      toast.success("Demo booked successfully!", {
        description: `Google Meet link: ${data.meetLink}`,
      });
      setSelectedTime("");
      setIsBooking(false);
    },
    onError: (error) => {
      toast.error("Failed to book demo", {
        description: error.message,
      });
      setIsBooking(false);
    },
  });

  const handleBookDemo = async () => {
    if (!selectedManager || !selectedDate || !selectedTime) {
      toast.error("Please select a manager, date, and time");
      return;
    }

    setIsBooking(true);
    bookDemoMutation.mutate({
      managerId: parseInt(selectedManager),
      date: selectedDate,
      time: selectedTime,
      duration: DEMO_DURATION,
    });
  };

  const salesManagers = managers?.filter(
    (user) => user.role === "Sales Manager" || user.role === "owner"
  ) || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Book a Demo</h1>
        <p className="text-muted-foreground">
          Schedule a demo call with one of our sales managers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Selection */}
        <div className="space-y-6">
          {/* Sales Manager Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Sales Manager
              </CardTitle>
              <CardDescription>
                Choose who you'd like to meet with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sales manager" />
                </SelectTrigger>
                <SelectContent>
                  {loadingManagers ? (
                    <SelectItem value="loading" disabled>
                      Loading managers...
                    </SelectItem>
                  ) : salesManagers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No managers available
                    </SelectItem>
                  ) : (
                    salesManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id.toString()}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
              <CardDescription>
                Pick a date for your demo
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Time Slots & Booking */}
        <div className="space-y-6">
          {/* Time Slot Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Time Slots
              </CardTitle>
              <CardDescription>
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date first"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedManager ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Please select a sales manager first
                </p>
              ) : !selectedDate ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Please select a date
                </p>
              ) : loadingAvailability ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Loading availability...
                </p>
              ) : !availability || availability.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No available time slots for this date
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {availability.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? "default" : "outline"}
                      onClick={() => setSelectedTime(slot)}
                      className="w-full"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Summary */}
          {selectedManager && selectedDate && selectedTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manager:</span>
                    <span className="font-medium">
                      {salesManagers.find(m => m.id.toString() === selectedManager)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(selectedDate, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{DEMO_DURATION} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meeting:</span>
                    <span className="font-medium">Google Meet</span>
                  </div>
                </div>

                <Button
                  onClick={handleBookDemo}
                  disabled={isBooking}
                  className="w-full"
                  size="lg"
                >
                  {isBooking ? "Booking..." : "Confirm Booking"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  A Google Meet link will be generated and sent to both parties
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
