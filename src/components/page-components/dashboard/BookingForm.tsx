import { useState, useEffect } from "react";
//import type { IRoom } from "@/types/global";
import { useForm } from "react-hook-form";
import { getAvailableRooms } from "@/services/roomService";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface BookingFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  submitText?: string;
  disabled?: boolean;
}

const BookingForm = ({ initialData, onSubmit, submitText = "Save Booking", disabled = false }: BookingFormProps) => {
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
    defaultValues: initialData || {},
    mode: "onBlur"
  });
  const checkInDate = watch("checkInDate");
  const checkOutDate = watch("checkOutDate");
  const roomId = watch("roomId");
  const [availableRooms, setAvailableRooms] = useState<IRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!checkInDate || !checkOutDate) return setAvailableRooms([]);
      setLoadingRooms(true);
      try {
        const res = await getAvailableRooms(checkInDate, checkOutDate);
        setAvailableRooms(res.success ? res.data : []);
      } finally {
        setLoadingRooms(false);
      }
    };
    if (checkInDate && checkOutDate && checkOutDate > checkInDate) fetchRooms();
    else setAvailableRooms([]);
  }, [checkInDate, checkOutDate]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Room *</Label>
        <SelectField
          name="roomId"
          label="Room"
          placeholder={loadingRooms ? "Loading..." : "Select a room"}
          options={availableRooms.map((r: any) => ({ value: r._id, label: `${r.roomType} Room ${r.roomNumber}` }))}
          control={control}
          error={errors.roomId?.message}
          required
          disabled={loadingRooms || availableRooms.length === 0 || disabled}
        />
        {(!loadingRooms && checkInDate && checkOutDate && availableRooms.length === 0) && (
          <p className="text-sm text-destructive">No rooms available for selected dates.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Check-in Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start text-left font-normal ${errors.checkInDate ? "border-destructive" : ""}`}
              type="button"
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {checkInDate ? format(new Date(checkInDate), "MMM dd, yyyy") : <span className="text-muted-foreground">Select check-in date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={checkInDate ? new Date(checkInDate) : undefined}
              onSelect={date => setValue("checkInDate", date?.toISOString(), { shouldValidate: true })}
              disabled={date => {
                const today = new Date();
                today.setHours(0,0,0,0);
                return date < today;
              }}
            />
          </PopoverContent>
        </Popover>
        {errors.checkInDate?.message && (
          <p className="text-sm text-destructive">{String(errors.checkInDate.message)}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Check-out Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start text-left font-normal ${errors.checkOutDate ? "border-destructive" : ""}`}
              type="button"
              disabled={!checkInDate || disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {checkOutDate ? format(new Date(checkOutDate), "MMM dd, yyyy") : <span className="text-muted-foreground">Select check-out date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={checkOutDate ? new Date(checkOutDate) : undefined}
              onSelect={date => setValue("checkOutDate", date?.toISOString(), { shouldValidate: true })}
              disabled={date => {
                if (!checkInDate) return true;
                const ci = new Date(checkInDate);
                ci.setHours(0,0,0,0);
                return date <= ci;
              }}
            />
          </PopoverContent>
        </Popover>
        {errors.checkOutDate?.message && (
          <p className="text-sm text-destructive">{String(errors.checkOutDate.message)}</p>
        )}
      </div>
      {/* Add more fields as needed (guestId, customerDetails, etc.) */}
      <Button type="submit" disabled={disabled || loadingRooms || availableRooms.length === 0} className="w-full main-button-gradient">
        {submitText}
      </Button>
    </form>
  );
};

export default BookingForm;
