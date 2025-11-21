import { router } from '@inertiajs/react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/Components/ui/dialog"
import { Button } from '@/Components/ui/button';

const DeleteCollectionRequest = ({ setShowDeleteModal, request }) => {
  const handleDelete = (e) => {
    e.preventDefault();

    router.delete(
      route('admin.collection-request-management.destroy', request.id),
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setShowDeleteModal(false);
          const flash = page.props.flash;
          if (flash && flash.error) {
            toast.error(flash.error);
          } 
        },
        onError: (errors) => {
          setShowDeleteModal(false);
          if (errors.message) {
            toast.error(errors.message);
          } else {
            toast.error('Failed to delete collection request. Please try again.');
          }
        }
      }
    );
  };

  const formatDate = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Pending',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[priority] || 'bg-gray-100 text-gray-800'}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  return (
    <Dialog open onOpenChange={setShowDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collection Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this collection request? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-zinc-50 border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Request Type:</span>
            <span className="text-sm text-zinc-900 font-semibold">{request.request_type}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Resident:</span>
            <span className="text-sm text-zinc-900 text-right">
              {request.resident?.name}
              <br />
              <span className="text-xs text-zinc-600">{request.resident?.phone_number}</span>
            </span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Waste Bin:</span>
            <span className="text-sm text-zinc-900 text-right">
              {request.waste_bin?.name || request.waste_bin?.qr_code || '---'}
              <br />
              <span className="text-xs text-zinc-600">{request.waste_bin?.qr_code || '---'}</span>
            </span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Preferred Date:</span>
            <span className="text-sm text-zinc-900">{formatDate(request.preferred_date)}</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Preferred Time:</span>
            <span className="text-sm text-zinc-900">{formatTime(request.preferred_time)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-700">Priority:</span>
            {getPriorityBadge(request.priority)}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-700">Status:</span>
            {getStatusBadge(request.status)}
          </div>

          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Assigned Collector:</span>
            <span className="text-sm text-zinc-900 text-right">
              {request.collector ? (
                <>
                  {request.collector.name}
                  <br />
                  <span className="text-xs text-zinc-600">{request.collector.phone_number}</span>
                </>
              ) : (
                <span className="text-zinc-400 italic">Not assigned</span>
              )}
            </span>
          </div>

          {request.description && (
            <div className="pt-2 border-t">
              <span className="text-sm font-medium text-zinc-700 block mb-1">Description:</span>
              <p className="text-sm text-zinc-900 bg-white p-2 rounded border">
                {request.description}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleDelete} className="flex flex-col gap-4">
          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
            >
              Delete Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCollectionRequest;