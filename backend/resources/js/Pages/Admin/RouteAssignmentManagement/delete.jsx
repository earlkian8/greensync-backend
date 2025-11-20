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

const DeleteRouteAssignment = ({ setShowDeleteModal, assignment }) => {
  const handleDelete = (e) => {
    e.preventDefault();

    router.delete(
      route('admin.route-assignment-management.destroy', assignment.id),
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
            toast.error('Failed to delete route assignment. Please try again.');
          }
        }
      }
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Pending',
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

  return (
    <Dialog open onOpenChange={setShowDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Route Assignment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this route assignment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-zinc-50 border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Assignment Date:</span>
            <span className="text-sm text-zinc-900">{formatDate(assignment.assignment_date)}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Route:</span>
            <span className="text-sm text-zinc-900 text-right">
              {assignment.route?.route_name}
              <br />
              <span className="text-xs text-zinc-600">{assignment.route?.barangay}</span>
            </span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Collector:</span>
            <span className="text-sm text-zinc-900 text-right">
              {assignment.collector?.name}
              <br />
              <span className="text-xs text-zinc-600">{assignment.collector?.phone_number}</span>
            </span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-zinc-700">Schedule:</span>
            <span className="text-sm text-zinc-900">{assignment.schedule?.schedule_name || '---'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-700">Status:</span>
            {getStatusBadge(assignment.status)}
          </div>
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
              Delete Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRouteAssignment;