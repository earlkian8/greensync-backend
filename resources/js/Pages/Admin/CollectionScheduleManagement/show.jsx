import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Separator } from '@/Components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2,
  Repeat,
  FileText,
  User,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const ShowCollectionSchedule = ({ setShowViewModal, schedule }) => {
  const InfoRow = ({ icon: Icon, label, value, valueClass = "" }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-zinc-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        <p className={`text-sm text-zinc-900 ${valueClass}`}>{value || '---'}</p>
      </div>
    </div>
  );

  const formatTime = (time) => {
    if (!time) return 'N/A';
    if (time.includes('T')) {
      const timeStr = time.split('T')[1].substring(0, 5);
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getWasteTypeLabel = (type) => {
    const labels = {
      'biodegradable': 'Biodegradable',
      'non-biodegradable': 'Non-Biodegradable',
      'recyclable': 'Recyclable',
      'special': 'Special',
      'all': 'All Types'
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      'weekly': 'Weekly',
      'bi-weekly': 'Bi-Weekly',
      'monthly': 'Monthly'
    };
    return labels[frequency] || frequency;
  };

  const getWasteTypeColor = (type) => {
    const colors = {
      'biodegradable': 'bg-green-100 text-green-800',
      'non-biodegradable': 'bg-gray-100 text-gray-800',
      'recyclable': 'bg-blue-100 text-blue-800',
      'special': 'bg-purple-100 text-purple-800',
      'all': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-zinc-100 text-zinc-800';
  };

  return (
    <Dialog open onOpenChange={setShowViewModal}>
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-zinc-800">Collection Schedule Details</DialogTitle>
              <DialogDescription className="text-zinc-600">
                View complete information about this collection schedule
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Schedule Summary */}
          <div className="lg:col-span-1 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Schedule Summary</h3>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4">
                <Calendar className="h-16 w-16 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 text-center">{schedule.barangay}</h2>
              <p className="text-sm text-zinc-600 text-center mt-1">{schedule.collection_day}</p>
              <p className="text-lg font-semibold text-green-600 text-center mt-1">
                {formatTime(schedule.collection_time)}
              </p>
              <Separator className="my-4 w-full" />
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    schedule.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {schedule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Waste Type:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getWasteTypeColor(schedule.waste_type)}`}>
                    {getWasteTypeLabel(schedule.waste_type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Created:</span>
                  <span className="text-sm text-zinc-900">
                    {new Date(schedule.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Schedule Information</h3>
            
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Basic Details</h4>
              <InfoRow 
                icon={MapPin} 
                label="Barangay" 
                value={schedule.barangay}
                valueClass="font-semibold"
              />
              <InfoRow 
                icon={Calendar} 
                label="Collection Day" 
                value={schedule.collection_day}
                valueClass="font-semibold"
              />
              <InfoRow 
                icon={Clock} 
                label="Collection Time" 
                value={formatTime(schedule.collection_time)}
                valueClass="font-semibold"
              />
              <InfoRow 
                icon={Trash2} 
                label="Waste Type" 
                value={getWasteTypeLabel(schedule.waste_type)}
              />
              <InfoRow 
                icon={Repeat} 
                label="Frequency" 
                value={getFrequencyLabel(schedule.frequency)}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Additional Information</h4>
              {schedule.creator && (
                <InfoRow 
                  icon={User} 
                  label="Created By" 
                  value={`${schedule.creator.name} (${schedule.creator.email})`}
                />
              )}
              {schedule.notes && (
                <InfoRow 
                  icon={FileText} 
                  label="Notes" 
                  value={schedule.notes}
                />
              )}
              {!schedule.notes && (
                <div className="flex items-start gap-3 py-2">
                  <FileText className="h-5 w-5 text-zinc-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-600">Notes</p>
                    <p className="text-sm text-zinc-400 italic">No notes provided</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Associated Records */}
          <div className="lg:col-span-3 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Associated Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Route Assignments</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {schedule.route_assignments?.length || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Total routes using this schedule
                </p>
              </div>
              <div className={`p-4 rounded-lg ${
                schedule.is_active ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`text-sm font-medium ${
                  schedule.is_active ? 'text-green-600' : 'text-red-600'
                }`}>
                  Schedule Status
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {schedule.is_active ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <p className="text-lg font-bold text-green-900">Active</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600" />
                      <p className="text-lg font-bold text-red-900">Inactive</p>
                    </>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  schedule.is_active ? 'text-green-600' : 'text-red-600'
                }`}>
                  {schedule.is_active 
                    ? 'This schedule is currently in use' 
                    : 'This schedule is not being used'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowCollectionSchedule;