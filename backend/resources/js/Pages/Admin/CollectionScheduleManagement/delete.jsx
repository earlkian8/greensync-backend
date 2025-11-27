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

const DeleteCollectionSchedule = ({ setShowDeleteModal, schedule }) => {
  const handleDelete = (e) => {
    e.preventDefault();

    router.delete(
      route('admin.collection-schedule-management.destroy', schedule.id),
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setShowDeleteModal(false);
          const flash = page.props.flash;
          if (flash && flash.error) {
            toast.error(flash.error);
          } else {
            toast.success(`Collection schedule for ${schedule.collection_day} at ${formatTime(schedule.collection_time)} deleted successfully`);
          }
        },
        onError: (errors) => {
          setShowDeleteModal(false);
          if (errors.message) {
            toast.error(errors.message);
          } else {
            toast.error('Failed to delete collection schedule. Please try again.');
          }
        }
      }
    );
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    // If time is in datetime format
    if (time.includes('T')) {
      return time.split('T')[1].substring(0, 5);
    }
    return time;
  };

  return (
    <Dialog open onOpenChange={setShowDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collection Schedule</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the collection schedule for{" "}
            <span className="font-semibold">{schedule.collection_day}</span> at{" "}
            <span className="font-semibold">{formatTime(schedule.collection_time)}</span>? 
            This action cannot be undone and all associated route assignments will be affected.
          </DialogDescription>
        </DialogHeader>
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
              Delete Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCollectionSchedule;