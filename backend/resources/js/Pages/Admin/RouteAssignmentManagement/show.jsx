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
  Calendar,
  FileText,
  Route as RouteIcon,
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  Users
} from 'lucide-react';

const ShowRouteAssignment = ({ setShowViewModal, assignment }) => {
  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-zinc-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        <p className="text-sm text-zinc-900">{value || '---'}</p>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    const icons = {
      pending: AlertCircle,
      in_progress: Clock,
      completed: CheckCircle2,
      cancelled: AlertCircle,
    };
    const Icon = icons[status] || AlertCircle;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${badges[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{labels[status] || status}</span>
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '---';
    return new Date(datetime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = () => {
    if (!assignment.start_time || !assignment.end_time) return '---';
    const start = new Date(assignment.start_time);
    const end = new Date(assignment.end_time);
    const diff = Math.abs(end - start);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open onOpenChange={setShowViewModal}>
      <DialogContent className="w-[95vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-zinc-800">Route Assignment Details</DialogTitle>
              <DialogDescription className="text-zinc-600">
                View complete information about this route assignment
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Assignment Overview */}
          <div className="lg:col-span-1 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Assignment Overview</h3>
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <CalendarCheck className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 text-center">
                  {formatDate(assignment.assignment_date)}
                </h2>
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Status</p>
                  {getStatusBadge(assignment.status)}
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-zinc-900">{calculateDuration()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Created</p>
                  <p className="text-sm text-zinc-900">
                    {formatDateTime(assignment.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="lg:col-span-2 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Assignment Details</h3>
            
            <div className="space-y-1">
              <InfoRow 
                icon={RouteIcon} 
                label="Route" 
                value={
                  assignment.route ? 
                  `${assignment.route.route_name} - ${assignment.route.barangay}` : 
                  '---'
                } 
              />
              <InfoRow 
                icon={User} 
                label="Collector" 
                value={
                  assignment.collector ? 
                  `${assignment.collector.name} (${assignment.collector.phone_number})` : 
                  '---'
                } 
              />
              <InfoRow 
                icon={Calendar} 
                label="Schedule" 
                value={assignment.schedule?.schedule_name || '---'} 
              />
              <InfoRow 
                icon={Clock} 
                label="Start Time" 
                value={formatDateTime(assignment.start_time)} 
              />
              <InfoRow 
                icon={Clock} 
                label="End Time" 
                value={formatDateTime(assignment.end_time)} 
              />
              <InfoRow 
                icon={User} 
                label="Assigned By" 
                value={assignment.assigned_by?.name || '---'} 
              />
            </div>

            {assignment.notes && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-zinc-600" />
                    <h4 className="text-sm font-semibold text-zinc-700">Notes</h4>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-md">
                    <p className="text-sm text-zinc-900 whitespace-pre-wrap">{assignment.notes}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Route Stops */}
          {assignment.route?.stops && assignment.route.stops.length > 0 && (
            <div className="lg:col-span-3 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                <ListOrdered className="h-5 w-5" />
                Route Stops ({assignment.route.stops.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignment.route.stops.map((stop) => (
                  <div key={stop.id} className="bg-zinc-50 border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">{stop.stop_order}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 break-words">{stop.stop_address}</p>
                        {stop.estimated_time && (
                          <p className="text-xs text-zinc-600 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {stop.estimated_time}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Collections Summary */}
          <div className="lg:col-span-3 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collections Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Collections</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {assignment.qr_collections?.length || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Verified</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {assignment.qr_collections?.filter(c => c.is_verified).length || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {assignment.qr_collections?.filter(c => !c.is_verified).length || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Total Weight</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {assignment.qr_collections?.reduce((sum, c) => sum + (parseFloat(c.waste_weight) || 0), 0).toFixed(2) || '0'} kg
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowRouteAssignment;