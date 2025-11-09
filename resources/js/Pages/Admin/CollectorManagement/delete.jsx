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

const DeleteCollector = ({ setShowDeleteModal, collector }) => {
  const handleDelete = (e) => {
    e.preventDefault();

    router.delete(
      route('admin.collector-management.destroy', collector.id),
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setShowDeleteModal(false);
          const flash = page.props.flash;
          if (flash && flash.error) {
            toast.error(flash.error);
          } else {
            toast.success(`Collector "${collector.name}" deleted successfully`);
          }
        },
        onError: (errors) => {
          setShowDeleteModal(false);
          if (errors.message) {
            toast.error(errors.message);
          } else {
            toast.error('Failed to delete collector. Please try again.');
          }
        }
      }
    );
  };

  return (
    <Dialog open onOpenChange={setShowDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collector</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the collector{" "}
            <span className="font-semibold">{collector.name}</span>
            {" "}(Employee ID: {collector.employee_id})? 
            This action cannot be undone and all associated data will be permanently removed.
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
              Delete Collector
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCollector;