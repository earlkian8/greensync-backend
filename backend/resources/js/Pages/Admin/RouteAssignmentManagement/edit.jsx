import { useForm, usePage, router } from '@inertiajs/react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/Components/ui/dialog"
import { Input } from '@/Components/ui/input';
import InputError from '@/Components/InputError';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { useEffect } from 'react';

const EditRouteAssignment = ({ assignment: assignmentData, setShowEditModal }) => {
  const { routes, collectors, schedules } = usePage().props;

  const formatDatetimeLocal = (datetime) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { data, setData, post, errors, processing } = useForm({
    route_id: assignmentData?.route_id?.toString() || '',
    collector_id: assignmentData?.collector_id?.toString() || '',
    schedule_id: assignmentData?.schedule_id?.toString() || '',
    assignment_date: formatDate(assignmentData?.assignment_date) || '',
    status: assignmentData?.status || 'pending',
    start_time: formatDatetimeLocal(assignmentData?.start_time) || '',
    end_time: formatDatetimeLocal(assignmentData?.end_time) || '',
    notes: assignmentData?.notes || '',
    _method: 'PUT'
  });

  useEffect(() => {
    if (assignmentData) {
      setData({
        route_id: assignmentData.route_id?.toString() || '',
        collector_id: assignmentData.collector_id?.toString() || '',
        schedule_id: assignmentData.schedule_id?.toString() || '',
        assignment_date: formatDate(assignmentData.assignment_date) || '',
        status: assignmentData.status || 'pending',
        start_time: formatDatetimeLocal(assignmentData.start_time) || '',
        end_time: formatDatetimeLocal(assignmentData.end_time) || '',
        notes: assignmentData.notes || '',
        _method: 'PUT'
      });
    }
  }, [assignmentData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.route-assignment-management.update', assignmentData.id), {
      onSuccess: () => {
        setShowEditModal(false);
      },
    });
  };

  const inputClass = (error, readOnly = false) =>
    "w-full border text-sm rounded-md px-4 py-2 focus:outline-none " +
    (readOnly
      ? "bg-zinc-100 text-zinc-600 cursor-not-allowed"
      : error
      ? "border-red-500 ring-2 ring-red-400 focus:border-red-500 focus:ring-red-500"
      : "border-zinc-300 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-800");

  return (
    <Dialog open onOpenChange={setShowEditModal}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Edit Route Assignment</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Update the route assignment details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Route */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Route </Label>
            <Select 
              value={data.route_id} 
              onValueChange={(value) => setData('route_id', value)}
            >
              <SelectTrigger className={inputClass(errors.route_id)}>
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                {routes && routes.length > 0 ? (
                  routes.map((route) => (
                    <SelectItem key={route.id} value={route.id.toString()}>
                      {route.route_name} - {route.barangay}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No routes available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.route_id} />
          </div>

          {/* Collector */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Collector </Label>
            <Select 
              value={data.collector_id} 
              onValueChange={(value) => setData('collector_id', value)}
            >
              <SelectTrigger className={inputClass(errors.collector_id)}>
                <SelectValue placeholder="Select collector" />
              </SelectTrigger>
              <SelectContent>
                {collectors && collectors.length > 0 ? (
                  collectors.map((collector) => (
                    <SelectItem key={collector.id} value={collector.id.toString()}>
                      {collector.name} {collector.employee_id ? `(ID: ${collector.employee_id})` : ''} - {collector.phone_number}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No collectors available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.collector_id} />
          </div>

          {/* Schedule */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Schedule </Label>
            <Select 
              value={data.schedule_id} 
              onValueChange={(value) => setData('schedule_id', value)}
            >
              <SelectTrigger className={inputClass(errors.schedule_id)}>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules && schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                      {schedule.barangay} - {schedule.collection_day} ({schedule.waste_type})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No schedules available</SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.schedule_id} />
          </div>

          {/* Assignment Date */}
          <div>
            <Label className="text-zinc-800">Assignment Date </Label>
            <Input
              type="date"
              value={data.assignment_date}
              onChange={e => setData('assignment_date', e.target.value)}
              className={inputClass(errors.assignment_date)}
            />
            <InputError message={errors.assignment_date} />
          </div>

          {/* Status */}
          <div>
            <Label className="text-zinc-800">Status </Label>
            <Select 
              value={data.status} 
              onValueChange={(value) => setData('status', value)}
            >
              <SelectTrigger className={inputClass(errors.status)}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <InputError message={errors.status} />
          </div>

          {/* Start Time */}
          <div>
            <Label className="text-zinc-800">Start Time</Label>
            <Input
              type="datetime-local"
              value={data.start_time}
              onChange={e => setData('start_time', e.target.value)}
              className={inputClass(errors.start_time)}
            />
            <InputError message={errors.start_time} />
          </div>

          {/* End Time */}
          <div>
            <Label className="text-zinc-800">End Time</Label>
            <Input
              type="datetime-local"
              value={data.end_time}
              onChange={e => setData('end_time', e.target.value)}
              className={inputClass(errors.end_time)}
            />
            <InputError message={errors.end_time} />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Notes</Label>
            <Textarea
              value={data.notes}
              onChange={e => setData('notes', e.target.value)}
              placeholder="Additional notes or instructions..."
              className={inputClass(errors.notes)}
              rows={3}
            />
            <InputError message={errors.notes} />
          </div>

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-4 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white transition"
              disabled={processing}
            >
              Update Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRouteAssignment;