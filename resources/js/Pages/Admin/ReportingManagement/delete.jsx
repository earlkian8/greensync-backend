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
import { AlertTriangle } from 'lucide-react';

const DeleteReport = ({ setShowDeleteModal, report }) => {
  const handleDelete = (e) => {
    e.preventDefault();

    router.delete(
      route('admin.reporting-management.destroy', report.id),
      {
        preserveScroll: true,
        onSuccess: (page) => {
          setShowDeleteModal(false);
          const flash = page.props.flash;
          if (flash && flash.error) {
            toast.error(flash.error);
          } else {
            toast.success(`Report "${report.report_title}" deleted successfully`);
          }
        },
        onError: (errors) => {
          setShowDeleteModal(false);
          if (errors.message) {
            toast.error(errors.message);
          } else {
            toast.error('Failed to delete report. Please try again.');
          }
        }
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open onOpenChange={setShowDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={24} />
            Delete Report
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the report{" "}
            <span className="font-semibold text-zinc-800">{report.report_title}</span>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md my-4">
          <div className="space-y-2 text-sm">
            <p className="text-zinc-700">
              <span className="font-medium">Type:</span> {report.report_type}
            </p>
            <p className="text-zinc-700">
              <span className="font-medium">Period:</span> {report.report_period}
            </p>
            <p className="text-zinc-700">
              <span className="font-medium">Date Range:</span> {formatDate(report.start_date)} - {formatDate(report.end_date)}
            </p>
            <p className="text-zinc-700">
              <span className="font-medium">Status:</span>{" "}
              <span className="capitalize">{report.status}</span>
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-sm text-red-800 font-medium mb-1">Warning</p>
          <p className="text-sm text-red-700">
            This action cannot be undone. All report data and exports will be permanently removed.
          </p>
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
              Delete Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteReport;