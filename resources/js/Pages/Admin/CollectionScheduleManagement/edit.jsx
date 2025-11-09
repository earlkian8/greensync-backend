import { useForm } from '@inertiajs/react';
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
import { Switch } from '@/Components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/Components/ui/textarea';
import { useState, useEffect } from 'react';

const EditCollectionSchedule = ({ schedule, setShowEditModal }) => {
  const { data, setData, post, errors, processing } = useForm({
    barangay: schedule?.barangay || '',
    collection_day: schedule?.collection_day || '',
    collection_time: schedule?.collection_time || '',
    waste_type: schedule?.waste_type || '',
    frequency: schedule?.frequency || 'weekly',
    is_active: schedule?.is_active ?? true,
    notes: schedule?.notes || '',
    _method: 'PUT'
  });

  useEffect(() => {
    if (schedule) {
      // Format time to HH:mm if it's in datetime format
      let formattedTime = schedule.collection_time;
      if (formattedTime && formattedTime.includes('T')) {
        formattedTime = formattedTime.split('T')[1].substring(0, 5);
      }

      setData({
        barangay: schedule.barangay || '',
        collection_day: schedule.collection_day || '',
        collection_time: formattedTime || '',
        waste_type: schedule.waste_type || '',
        frequency: schedule.frequency || 'weekly',
        is_active: schedule.is_active ?? true,
        notes: schedule.notes || '',
        _method: 'PUT'
      });
    }
  }, [schedule]);

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.collection-schedule-management.update', schedule.id), {
      onSuccess: () => {
        setShowEditModal(false);
        toast.success('Collection Schedule Updated Successfully!');
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

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const wasteTypes = [
    { value: 'biodegradable', label: 'Biodegradable' },
    { value: 'non-biodegradable', label: 'Non-Biodegradable' },
    { value: 'recyclable', label: 'Recyclable' },
    { value: 'special', label: 'Special' },
    { value: 'all', label: 'All Types' },
  ];
  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <Dialog open onOpenChange={setShowEditModal}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Edit Collection Schedule</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Update the details for the collection schedule below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

          {/* Barangay */}
          <div>
            <Label className="text-zinc-800">Barangay </Label>
            <Input
              type="text"
              value={data.barangay}
              onChange={e => setData('barangay', e.target.value)}
              placeholder="Enter barangay name"
              className={inputClass(errors.barangay)}
            />
            <InputError message={errors.barangay} />
          </div>

          {/* Collection Day */}
          <div>
            <Label className="text-zinc-800">Collection Day </Label>
            <Select value={data.collection_day} onValueChange={(value) => setData('collection_day', value)}>
              <SelectTrigger className={inputClass(errors.collection_day)}>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.collection_day} />
          </div>

          {/* Collection Time */}
          <div>
            <Label className="text-zinc-800">Collection Time </Label>
            <Input
              type="time"
              value={data.collection_time}
              onChange={e => setData('collection_time', e.target.value)}
              className={inputClass(errors.collection_time)}
            />
            <InputError message={errors.collection_time} />
          </div>

          {/* Waste Type */}
          <div>
            <Label className="text-zinc-800">Waste Type </Label>
            <Select value={data.waste_type} onValueChange={(value) => setData('waste_type', value)}>
              <SelectTrigger className={inputClass(errors.waste_type)}>
                <SelectValue placeholder="Select waste type" />
              </SelectTrigger>
              <SelectContent>
                {wasteTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.waste_type} />
          </div>

          {/* Frequency */}
          <div>
            <Label className="text-zinc-800">Frequency </Label>
            <Select value={data.frequency} onValueChange={(value) => setData('frequency', value)}>
              <SelectTrigger className={inputClass(errors.frequency)}>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.frequency} />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-zinc-800">Notes</Label>
            <Textarea
              value={data.notes}
              onChange={e => setData('notes', e.target.value)}
              placeholder="Enter any additional notes or instructions..."
              className={inputClass(errors.notes)}
              rows={4}
            />
            <InputError message={errors.notes} />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={data.is_active}
              onCheckedChange={(checked) => setData('is_active', checked)}
              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400"
            />
            <Label htmlFor="is_active" className="text-zinc-800 cursor-pointer">
              {data.is_active ? 'Active' : 'Inactive'}
            </Label>
          </div>

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
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
              Update Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCollectionSchedule;