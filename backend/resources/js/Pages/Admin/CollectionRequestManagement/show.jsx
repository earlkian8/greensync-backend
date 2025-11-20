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
  AlertCircle,
  CheckCircle2,
  Package,
  Trash2,
  Image as ImageIcon,
  Phone,
  Mail,
  Compass,
  ExternalLink,
  Copy
} from 'lucide-react';

const ShowCollectionRequest = ({ setShowViewModal, request }) => {
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
      assigned: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    const labels = {
      pending: 'Pending',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    const icons = {
      pending: AlertCircle,
      assigned: User,
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

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800 border-gray-300',
      medium: 'bg-blue-100 text-blue-800 border-blue-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      urgent: 'bg-red-100 text-red-800 border-red-300',
    };
    const labels = {
      low: 'Low Priority',
      medium: 'Medium Priority',
      high: 'High Priority',
      urgent: 'Urgent Priority',
    };
    const icons = {
      low: AlertCircle,
      medium: AlertCircle,
      high: AlertCircle,
      urgent: AlertCircle,
    };
    const Icon = icons[priority] || AlertCircle;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${badges[priority] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{labels[priority] || priority}</span>
      </div>
    );
  };

  const getWasteTypeBadge = (wasteType) => {
    const badges = {
      biodegradable: 'bg-green-100 text-green-800 border-green-300',
      'non-biodegradable': 'bg-gray-100 text-gray-800 border-gray-300',
      recyclable: 'bg-blue-100 text-blue-800 border-blue-300',
      special: 'bg-purple-100 text-purple-800 border-purple-300',
      all: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    };
    const labels = {
      biodegradable: 'Biodegradable',
      'non-biodegradable': 'Non-Biodegradable',
      recyclable: 'Recyclable',
      special: 'Special Waste',
      all: 'All Types',
    };
    const icons = {
      biodegradable: Package,
      'non-biodegradable': Trash2,
      recyclable: Package,
      special: AlertCircle,
      all: Package,
    };
    const Icon = icons[wasteType] || Package;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${badges[wasteType] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{labels[wasteType] || wasteType}</span>
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

  const formatTime = (time) => {
    if (!time) return '---';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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

  const hasCoordinates = request?.latitude && request?.longitude;

  const copyCoordinates = () => {
    if (!hasCoordinates || !navigator?.clipboard) return;
    navigator.clipboard.writeText(`${request.latitude}, ${request.longitude}`);
  };

  return (
    <Dialog open onOpenChange={setShowViewModal}>
      <DialogContent className="w-[95vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-zinc-800">Collection Request Details</DialogTitle>
              <DialogDescription className="text-zinc-600">
                View complete information about this collection request
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Request Overview */}
          <div className="lg:col-span-1 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Request Overview</h3>
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 text-center">
                  {request.request_type}
                </h2>
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Status</p>
                  {getStatusBadge(request.status)}
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Priority</p>
                  {getPriorityBadge(request.priority)}
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Waste Type</p>
                  {getWasteTypeBadge(request.waste_type)}
                </div>
                <div>
                  <p className="text-xs text-zinc-600 mb-1">Created</p>
                  <p className="text-sm text-zinc-900">
                    {formatDateTime(request.created_at)}
                  </p>
                </div>
                {request.completed_at && (
                  <div>
                    <p className="text-xs text-zinc-600 mb-1">Completed</p>
                    <p className="text-sm text-zinc-900">
                      {formatDateTime(request.completed_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="lg:col-span-2 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Request Details</h3>
            
            <div className="space-y-1">
              <InfoRow 
                icon={User} 
                label="Resident" 
                value={
                  request.resident ? 
                  `${request.resident.name}` : 
                  '---'
                } 
              />
              {request.resident && (
                <>
                  <div className="flex items-start gap-3 py-2 pl-8">
                    <Phone className="h-4 w-4 text-zinc-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Phone</p>
                      <p className="text-sm text-zinc-800">{request.resident.phone_number || '---'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2 pl-8">
                    <Mail className="h-4 w-4 text-zinc-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="text-sm text-zinc-800">{request.resident.email || '---'}</p>
                    </div>
                  </div>
                </>
              )}
              
              <Separator className="my-3" />
              
              <InfoRow 
                icon={Trash2} 
                label="Waste Bin" 
                value={
                  request.waste_bin ? 
                  `${request.waste_bin.bin_identifier} - ${request.waste_bin.bin_type}` : 
                  '---'
                } 
              />
              {request.waste_bin && (
                <div className="flex items-start gap-3 py-2 pl-8">
                  <MapPin className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">Bin Location</p>
                    <p className="text-sm text-zinc-800">{request.waste_bin.location || '---'}</p>
                  </div>
                </div>
              )}
              
              <Separator className="my-3" />
              
              <InfoRow 
                icon={User} 
                label="Assigned Collector" 
                value={
                  request.collector ? 
                  `${request.collector.name} ${request.collector.employee_id ? `(ID: ${request.collector.employee_id})` : ''}` : 
                  'Not assigned'
                } 
              />
              {request.collector && (
                <div className="flex items-start gap-3 py-2 pl-8">
                  <Phone className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">Collector Phone</p>
                    <p className="text-sm text-zinc-800">{request.collector.phone_number || '---'}</p>
                  </div>
                </div>
              )}
              
              <Separator className="my-3" />
              
              <InfoRow 
                icon={Calendar} 
                label="Preferred Date" 
                value={formatDate(request.preferred_date)} 
              />
              <InfoRow 
                icon={Clock} 
                label="Preferred Time" 
                value={formatTime(request.preferred_time)} 
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Compass className="h-5 w-5 text-zinc-600" />
                <h4 className="text-sm font-semibold text-zinc-700">Location Coordinates</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    hasCoordinates ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {hasCoordinates ? 'Available' : 'Missing'}
                </span>
              </div>

              {hasCoordinates ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border rounded-md p-3 bg-white">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Latitude</p>
                    <p className="text-base font-semibold text-zinc-900">{Number(request.latitude).toFixed(6)}</p>
                  </div>
                  <div className="border rounded-md p-3 bg-white">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">Longitude</p>
                    <p className="text-base font-semibold text-zinc-900">{Number(request.longitude).toFixed(6)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCoordinates}
                    className="flex items-center justify-center gap-2 border rounded-md p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Coordinates
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border rounded-md p-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Google Maps
                  </a>
                </div>
              ) : (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md p-3">
                  This request does not include latitude/longitude. Encourage the resident to refresh their location so routing can proceed.
                </p>
              )}
            </div>

            {request.description && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-zinc-600" />
                    <h4 className="text-sm font-semibold text-zinc-700">Description</h4>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-md">
                    <p className="text-sm text-zinc-900 whitespace-pre-wrap">{request.description}</p>
                  </div>
                </div>
              </>
            )}

            {request.resolution_notes && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-zinc-600" />
                    <h4 className="text-sm font-semibold text-zinc-700">Resolution Notes</h4>
                  </div>
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <p className="text-sm text-zinc-900 whitespace-pre-wrap">{request.resolution_notes}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Request Image */}
          {request.image_url && (
            <div className="lg:col-span-3 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Request Image
              </h3>
              
              <div className="flex justify-center bg-zinc-50 rounded-lg p-4">
                <img 
                  src={request.image_url} 
                  alt="Collection Request" 
                  className="max-h-96 object-contain rounded-lg shadow-md"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowCollectionRequest;