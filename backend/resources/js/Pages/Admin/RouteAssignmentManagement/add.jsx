import { useForm, usePage } from '@inertiajs/react';
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
import { useState, useMemo } from 'react';

const AddRouteAssignment = ({ setShowAddModal }) => {
  const { routes, collectors, schedules } = usePage().props;

  const { data, setData, post, errors, processing } = useForm({
    route_id: '',
    collector_id: '',
    schedule_id: '',
    assignment_date: '',
    status: 'pending',
    start_time: '',
    end_time: '',
    notes: '',
  });

  // Get selected route to filter schedules
  const selectedRoute = useMemo(() => {
    return routes?.find(r => r.id.toString() === data.route_id) || null;
  }, [data.route_id, routes]);

  // Get all schedules (no filtering by barangay)
  const allSchedules = useMemo(() => {
    return schedules || [];
  }, [schedules]);

  // Get selected schedule
  const selectedSchedule = useMemo(() => {
    return allSchedules?.find(s => s.id.toString() === data.schedule_id) || null;
  }, [data.schedule_id, allSchedules]);

  // Calculate next date for the schedule's collection day
  const getNextDateForDay = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = days.indexOf(dayName);
    if (dayIndex === -1) return '';

    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = dayIndex - currentDay;

    if (daysUntil < 0) {
      daysUntil += 7; // Next week
    } else if (daysUntil === 0) {
      daysUntil = 7; // Next week if today
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.route-assignment-management.store'), {
      onSuccess: () => {
        setShowAddModal(false);
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
    <Dialog open onOpenChange={setShowAddModal}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Add Route Assignment</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Create a new route assignment for a collector.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Route */}
          <div className="md:col-span-2">
            <Label className="text-zinc-800">Route </Label>
            <Select 
              value={data.route_id} 
              onValueChange={(value) => {
                setData('route_id', value);
              }}
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
            {selectedRoute && (
              <p className="text-xs text-zinc-500 mt-1">
                Barangay: {selectedRoute.barangay} | Stops: {selectedRoute.total_stops || 0}
              </p>
            )}
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
              onValueChange={(value) => {
                setData('schedule_id', value);
                // Auto-fill assignment date based on schedule's collection day
                const schedule = allSchedules.find(s => s.id.toString() === value);
                if (schedule && !data.assignment_date) {
                  const nextDate = getNextDateForDay(schedule.collection_day);
                  if (nextDate) {
                    setData('assignment_date', nextDate);
                  }
                }
              }}
            >
              <SelectTrigger className={inputClass(errors.schedule_id)}>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                {allSchedules && allSchedules.length > 0 ? (
                  allSchedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                      {schedule.collection_day} at {schedule.collection_time} ({schedule.frequency})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No schedules available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.schedule_id} />
            {selectedSchedule && (
              <p className="text-xs text-zinc-500 mt-1">
                Collection Day: {selectedSchedule.collection_day} | Time: {selectedSchedule.collection_time}
              </p>
            )}
          </div>

          {/* Assignment Date */}
          <div>
            <Label className="text-zinc-800">Assignment Date </Label>
            <Input
              type="date"
              value={data.assignment_date}
              onChange={e => setData('assignment_date', e.target.value)}
              className={inputClass(errors.assignment_date)}
              min={new Date().toISOString().split('T')[0]}
            />
            <InputError message={errors.assignment_date} />
            {selectedSchedule && data.assignment_date && (
              (() => {
                const selectedDate = new Date(data.assignment_date);
                const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
                const matches = dayName === selectedSchedule.collection_day;
                return (
                  <p className={`text-xs mt-1 ${matches ? 'text-green-600' : 'text-yellow-600'}`}>
                    {matches 
                      ? `✓ Date matches schedule's ${selectedSchedule.collection_day}` 
                      : `⚠ Date is ${dayName}, but schedule is ${selectedSchedule.collection_day}`}
                  </p>
                );
              })()
            )}
          </div>

          {/* Status */}
          <div>
            <Label className="text-zinc-800">Status</Label>
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
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white transition"
              disabled={processing}
            >
              Add Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRouteAssignment;