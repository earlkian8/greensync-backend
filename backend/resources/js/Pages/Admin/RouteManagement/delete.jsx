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

const DeleteRoute = ({ setShowDeleteModal, route: routeData }) => {
  const handleDelete = (e) => {
    e.preventDefault();

    router.delete(
      route('admin.route-management.destroy', routeData.id),
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setShowDeleteModal(false);
          const flash = page.props.flash;
          if (flash && flash.error) {
            toast.error(flash.error);
          } else {
            toast.success(`Route "${routeData.route_name}" deleted successfully`);
          }
        },
        onError: (errors) => {
          setShowDeleteModal(false);
          if (errors.message) {
            toast.error(errors.message);
          } else {
            toast.error('Failed to delete route. Please try again.');
          }
        }
      }
    );
  };

  return (
    <Dialog open onOpenChange={setShowDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Route</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the route{" "}
            <span className="font-semibold">{routeData.route_name}</span>
            {" "}({routeData.barangay})? 
            This action cannot be undone and will permanently remove the route along with all {route.total_stops} stops and any associated assignments.
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
              Delete Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRoute;