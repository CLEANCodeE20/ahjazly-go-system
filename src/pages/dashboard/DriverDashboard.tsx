import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  Home,
  LogOut,
  MapPin,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Navigation,
  Phone,
  User,
  Loader2,
  Route as RouteIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface TripRecord {
  trip_id: number;
  route_id: number | null;
  bus_id: number | null;
  driver_id: number | null;
  departure_time: string;
  arrival_time: string | null;
  status: string | null;
  base_price: number;
}

interface RouteRecord {
  route_id: number;
  origin_city: string;
  destination_city: string;
  distance_km: number | null;
  estimated_duration_hours: number | null;
}

interface BusRecord {
  bus_id: number;
  license_plate: string;
  model: string | null;
  capacity: number | null;
}

interface PassengerRecord {
  passenger_id: number;
  full_name: string;
  phone_number: string | null;
  trip_id: number | null;
  seat_id: number | null;
  passenger_status: string | null;
}

const DriverDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);

  const { data: trips, loading: tripsLoading, update: updateTrip } = useSupabaseCRUD<TripRecord>({
    tableName: 'trips',
    primaryKey: 'trip_id',
    initialFetch: true
  });

  const { data: routes } = useSupabaseCRUD<RouteRecord>({
    tableName: 'routes',
    primaryKey: 'route_id',
    initialFetch: true
  });

  const { data: buses } = useSupabaseCRUD<BusRecord>({
    tableName: 'buses',
    primaryKey: 'bus_id',
    initialFetch: true
  });

  const { data: passengers } = useSupabaseCRUD<PassengerRecord>({
    tableName: 'passengers',
    primaryKey: 'passenger_id',
    initialFetch: true
  });

  // Filter today's and upcoming trips
  const todayTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return trips.filter(trip => {
      const tripDate = new Date(trip.departure_time);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime() && 
             (trip.status === 'scheduled' || trip.status === 'in_progress');
    }).sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
  }, [trips]);

  const upcomingTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return trips.filter(trip => {
      const tripDate = new Date(trip.departure_time);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() > today.getTime() && trip.status === 'scheduled';
    }).sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime())
      .slice(0, 5);
  }, [trips]);

  const getRouteInfo = (routeId: number | null) => {
    const route = routes.find(r => r.route_id === routeId);
    return route || null;
  };

  const getBusInfo = (busId: number | null) => {
    const bus = buses.find(b => b.bus_id === busId);
    return bus || null;
  };

  const getTripPassengers = (tripId: number) => {
    return passengers.filter(p => p.trip_id === tripId);
  };

  const handleStartTrip = async (tripId: number) => {
    try {
      await updateTrip(tripId, { status: 'in_progress' } as never);
      toast.success("تم بدء الرحلة بنجاح");
    } catch (error) {
      console.error('Error starting trip:', error);
      toast.error("حدث خطأ أثناء بدء الرحلة");
    }
  };

  const handleCompleteTrip = async (tripId: number) => {
    try {
      await updateTrip(tripId, { status: 'completed' } as never);
      toast.success("تم إكمال الرحلة بنجاح");
    } catch (error) {
      console.error('Error completing trip:', error);
      toast.error("حدث خطأ أثناء إكمال الرحلة");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">مجدولة</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">جارية</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">مكتملة</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return null;
    }
  };

  if (tripsLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Bus className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">لوحة السائق</h1>
              <p className="text-xs text-muted-foreground">مرحباً بك</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <LogOut className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto pb-24">
        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <RouteIcon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{todayTrips.length}</p>
            <p className="text-xs text-muted-foreground">رحلات اليوم</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Users className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {todayTrips.reduce((sum, trip) => sum + getTripPassengers(trip.trip_id).length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">الركاب</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {trips.filter(t => t.status === 'completed').length}
            </p>
            <p className="text-xs text-muted-foreground">مكتملة</p>
          </div>
        </div>

        {/* Today's Trips */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            رحلات اليوم
          </h2>

          {todayTrips.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Bus className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">لا توجد رحلات مجدولة لليوم</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayTrips.map((trip) => {
                const route = getRouteInfo(trip.route_id);
                const bus = getBusInfo(trip.bus_id);
                const tripPassengers = getTripPassengers(trip.trip_id);
                const isExpanded = selectedTrip === trip.trip_id;

                return (
                  <div
                    key={trip.trip_id}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setSelectedTrip(isExpanded ? null : trip.trip_id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(trip.status)}
                          <span className="text-sm text-muted-foreground">
                            رحلة #{trip.trip_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(trip.departure_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{route?.origin_city || 'غير محدد'}</span>
                          </div>
                        </div>
                        <Navigation className="w-4 h-4 text-muted-foreground rotate-90" />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 text-sm justify-end">
                            <span className="font-medium">{route?.destination_city || 'غير محدد'}</span>
                            <MapPin className="w-4 h-4 text-red-600" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4" />
                          <span>{bus?.license_plate || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{tripPassengers.length} راكب</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        {/* Action Buttons */}
                        <div className="p-4 bg-muted/30 flex gap-2">
                          {trip.status === 'scheduled' && (
                            <Button 
                              className="flex-1" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTrip(trip.trip_id);
                              }}
                            >
                              <PlayCircle className="w-4 h-4 ml-2" />
                              بدء الرحلة
                            </Button>
                          )}
                          {trip.status === 'in_progress' && (
                            <Button 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteTrip(trip.trip_id);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4 ml-2" />
                              إنهاء الرحلة
                            </Button>
                          )}
                        </div>

                        {/* Passengers List */}
                        <div className="p-4">
                          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            قائمة الركاب ({tripPassengers.length})
                          </h3>

                          {tripPassengers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              لا يوجد ركاب مسجلين
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {tripPassengers.map((passenger) => (
                                <div
                                  key={passenger.passenger_id}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground text-sm">
                                        {passenger.full_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        مقعد {passenger.seat_id || '-'}
                                      </p>
                                    </div>
                                  </div>
                                  {passenger.phone_number && (
                                    <a
                                      href={`tel:${passenger.phone_number}`}
                                      className="p-2 rounded-lg bg-primary/10 text-primary"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Phone className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              الرحلات القادمة
            </h2>

            <div className="space-y-3">
              {upcomingTrips.map((trip) => {
                const route = getRouteInfo(trip.route_id);
                const tripDate = new Date(trip.departure_time);

                return (
                  <div
                    key={trip.trip_id}
                    className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {route?.origin_city} → {route?.destination_city}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tripDate.toLocaleDateString('ar-SA')} - {tripDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {getStatusBadge(trip.status)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link
            to="/driver"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
              location.pathname === '/driver' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">الرئيسية</span>
          </Link>
          <Link
            to="/driver"
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">الجدول</span>
          </Link>
          <Link
            to="/driver"
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">حسابي</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default DriverDashboard;
