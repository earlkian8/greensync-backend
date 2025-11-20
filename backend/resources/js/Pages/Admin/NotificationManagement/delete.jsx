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

const DeleteNotification = ({ setShowDeleteModal, notification }) => {
  const handleDelete = (e) => {
    e.preventDefault();

    router.delete(
      route('admin.notification-management.destroy', notification.id),
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setShowDeleteModal(false);
          const flash = page.props.flash;
          if (flash && flash.error) {
            toast.error(flash.error);
          } else {
            toast.success(`Notification "${notification.title}" deleted successfully`);
          }
        },
        onError: (errors) => {
          setShowDeleteModal(false);
          if (errors.message) {
            toast.error(errors.message);
          } else {
            toast.error('Failed to delete notification. Please try again.');
          }
        }
      }
    );
  };

  return (
    <Dialog open onOpenChange={setShowDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Notification</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the notification{" "}
            <span className="font-semibold">"{notification.title}"</span>?
            This action cannot be undone and the notification will be permanently removed.
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
              Delete Notification
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteNotification;