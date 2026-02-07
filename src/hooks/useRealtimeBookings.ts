import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingPayload {
  new: {
    booking_id: number;
    total_price: number;
    booking_status: string;
  };
}

export const useRealtimeBookings = (onNewBooking?: (booking: BookingPayload['new']) => void) => {
  // Use ref to hold the latest callback without triggering effect re-runs
  const onNewBookingRef = useRef(onNewBooking);

  useEffect(() => {
    onNewBookingRef.current = onNewBooking;
  }, [onNewBooking]);

  const handleNewBooking = useCallback((payload: BookingPayload) => {
    console.log("New booking received:", payload);

    toast.success("حجز جديد!", {
      description: `تم استلام حجز جديد رقم BK-${payload.new.booking_id.toString().padStart(3, '0')} بقيمة ${payload.new.total_price} ر.س`,
      duration: 5000,
    });

    // Play notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Audio play failed - likely no user interaction yet
        console.log("Could not play notification sound");
      });
    } catch (error) {
      console.log("Audio not supported");
    }

    if (onNewBookingRef.current) {
      onNewBookingRef.current(payload.new);
    }
  }, []);

  useEffect(() => {
    console.log("Setting up realtime subscription for bookings...");

    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          handleNewBooking(payload as unknown as BookingPayload);
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscription...");
      supabase.removeChannel(channel);
    };
  }, [handleNewBooking]);
};
