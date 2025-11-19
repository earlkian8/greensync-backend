import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Separator } from '@/Components/ui/separator';
import { 
  MapPin, 
  Clock, 
  User,
  Route as RouteIcon,
  ListOrdered
} from 'lucide-react';

const ShowRoute = ({ setShowViewModal, route }) => {
  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-zinc-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        <p className="text-sm text-zinc-900">{value || '---'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open onOpenChange={setShowViewModal}>
      <DialogContent className="w-[95vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-zinc-800">Route Details</DialogTitle>
              <DialogDescription className="text-zinc-600">
                View complete information about this route
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Route Information */}
          <div className="lg:col-span-1 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Route Information</h3>
            <div className="space-y-1">
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <RouteIcon className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 text-center">{route.route_name}</h2>
                <p className="text-sm text-zinc-600 text-center mt-1">{route.barangay}</p>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    route.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {route.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Total Stops:</span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {route.total_stops}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Duration:</span>
                  <span className="text-sm text-zinc-900">
                    {route.estimated_duration ? `${route.estimated_duration} min` : '---'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Created:</span>
                  <span className="text-sm text-zinc-900">
                    {new Date(route.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div className="lg:col-span-2 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Location Details</h3>
            
            <div className="space-y-1">
              <InfoRow 
                icon={MapPin} 
                label="Barangay" 
                value={route.barangay} 
              />
              <InfoRow 
                icon={Clock} 
                label="Estimated Duration" 
                value={route.estimated_duration ? `${route.estimated_duration} minutes` : null} 
              />
              <InfoRow 
                icon={User} 
                label="Created By" 
                value={route.creator?.name || '---'} 
              />
            </div>

            {route.route_map_data && (
              <>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-zinc-700 mb-2">Map Data</h4>
                  <div className="bg-zinc-50 p-4 rounded-md">
                    <pre className="text-xs text-zinc-900 overflow-x-auto whitespace-pre-wrap break-words">
                      {route.route_map_data}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Route Stops */}
          <div className="lg:col-span-3 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Route Stops ({route.stops?.length || 0})
            </h3>
            
            {!route.stops || route.stops.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-600">No stops configured for this route</p>
              </div>
            ) : (
              <div className="space-y-3">
                {route.stops.map((stop, index) => (
                  <div key={stop.id} className="bg-zinc-50 border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{stop.stop_order}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-900 mb-2">{stop.stop_address}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-zinc-600">Latitude:</span>
                            <p className="text-zinc-900 font-mono text-xs">{stop.latitude || '---'}</p>
                          </div>
                          <div>
                            <span className="text-zinc-600">Longitude:</span>
                            <p className="text-zinc-900 font-mono text-xs">{stop.longitude || '---'}</p>
                          </div>
                          <div>
                            <span className="text-zinc-600">Est. Time:</span>
                            <p className="text-zinc-900">{stop.estimated_time || '---'}</p>
                          </div>
                          <div>
                            <span className="text-zinc-600">Notes:</span>
                            <p className="text-zinc-900">{stop.notes || '---'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments Summary */}
          <div className="lg:col-span-3 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Assignments Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Assignments</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {route.assignments_count || route.assignments?.length || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {route.assignments?.filter(a => a.status === 'completed').length || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {route.assignments?.filter(a => a.status === 'in_progress').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowRoute;