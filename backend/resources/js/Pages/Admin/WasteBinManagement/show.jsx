import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Separator } from '@/Components/ui/separator';
import { 
  QrCode, 
  User, 
  Package, 
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const ShowWasteBin = ({ setShowViewModal, wasteBin }) => {
  const InfoRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-zinc-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        <p className={`text-sm text-zinc-900 ${className}`}>{value || '---'}</p>
      </div>
    </div>
  );

  const getBinTypeColor = (type) => {
    const colors = {
      'biodegradable': 'bg-green-100 text-green-800',
      'non-biodegradable': 'bg-gray-100 text-gray-800',
      'recyclable': 'bg-blue-100 text-blue-800',
      'hazardous': 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'damaged': 'bg-red-100 text-red-800',
      'full': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open onOpenChange={setShowViewModal}>
      <DialogContent className="w-[95vw] max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-zinc-800">Waste Bin Details</DialogTitle>
              <DialogDescription className="text-zinc-600">
                View complete information about this waste bin
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* QR Code Section */}
          <div className="lg:col-span-1 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">QR Code</h3>
            <div className="flex flex-col items-center">
              <div className="w-40 h-40 border-4 border-zinc-200 rounded-lg p-2 mb-4 flex items-center justify-center bg-white">
                <QrCode className="h-32 w-32 text-zinc-800" />
              </div>
              <p className="text-lg font-mono font-bold text-zinc-900 text-center">{wasteBin.qr_code}</p>
              <Separator className="my-4 w-full" />
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Bin Type:</span>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${getBinTypeColor(wasteBin.bin_type)}`}>
                    {wasteBin.bin_type.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(wasteBin.status)}`}>
                    {wasteBin.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Bin Information</h3>
            
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Basic Details</h4>
              <InfoRow 
                icon={Package} 
                label="Bin Name" 
                value={wasteBin.name} 
              />
              <InfoRow 
                icon={QrCode} 
                label="QR Code" 
                value={wasteBin.qr_code}
                className="font-mono"
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Resident Information</h4>
              <InfoRow 
                icon={User} 
                label="Resident Name" 
                value={wasteBin.resident?.name} 
              />
              <InfoRow 
                icon={User} 
                label="Resident Email" 
                value={wasteBin.resident?.email} 
              />
              <InfoRow 
                icon={User} 
                label="Barangay" 
                value={wasteBin.resident?.barangay} 
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Tracking Information</h4>
              <InfoRow 
                icon={Calendar} 
                label="Registered At" 
                value={formatDate(wasteBin.registered_at)} 
              />
              <InfoRow 
                icon={CheckCircle} 
                label="Last Collected" 
                value={formatDate(wasteBin.last_collected)} 
              />
              <InfoRow 
                icon={Calendar} 
                label="Created At" 
                value={formatDate(wasteBin.created_at)} 
              />
              <InfoRow 
                icon={Calendar} 
                label="Last Updated" 
                value={formatDate(wasteBin.updated_at)} 
              />
            </div>
          </div>

          {/* Associated Records */}
          <div className="lg:col-span-3 border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-800 mb-4">Associated Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-600 font-medium">Collection Requests</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {wasteBin.collection_requests?.length || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-600 font-medium">QR Collections</p>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {wasteBin.qr_collections?.length || 0}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${
                wasteBin.status === 'active' ? 'bg-green-50' : 
                wasteBin.status === 'full' ? 'bg-yellow-50' :
                wasteBin.status === 'damaged' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={`h-5 w-5 ${
                    wasteBin.status === 'active' ? 'text-green-600' : 
                    wasteBin.status === 'full' ? 'text-yellow-600' :
                    wasteBin.status === 'damaged' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                  <p className={`text-sm font-medium ${
                    wasteBin.status === 'active' ? 'text-green-600' : 
                    wasteBin.status === 'full' ? 'text-yellow-600' :
                    wasteBin.status === 'damaged' ? 'text-red-600' : 'text-gray-600'
                  }`}>Current Status</p>
                </div>
                <p className={`text-2xl font-bold capitalize ${
                  wasteBin.status === 'active' ? 'text-green-900' : 
                  wasteBin.status === 'full' ? 'text-yellow-900' :
                  wasteBin.status === 'damaged' ? 'text-red-900' : 'text-gray-900'
                }`}>
                  {wasteBin.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShowWasteBin;