-- Create trigger for automatic commission calculation on new bookings
CREATE TRIGGER calculate_booking_commission_trigger
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_booking_commission();

-- Create trigger for updating commission status on payment/cancellation
CREATE TRIGGER update_commission_on_payment_trigger
AFTER UPDATE ON public.bookings
FOR EACH ROW
WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR OLD.booking_status IS DISTINCT FROM NEW.booking_status)
EXECUTE FUNCTION public.update_commission_on_payment();