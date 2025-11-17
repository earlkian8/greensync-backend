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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/Components/ui/textarea';
import { useState } from 'react';

const CreateReport = ({ setShowCreateModal }) => {
  const barangays = usePage().props.barangays || [];
  const collectors = usePage().props.collectors || [];

  const { data, setData, post, errors, processing } = useForm({
    report_title: '',
    report_type: '',
    report_period: '',
    start_date: '',
    end_date: '',
    description: '',
    filters: {
      barangay: '',
      collector_id: '',
      waste_type: '',
      status: '',
    }
  });

  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    post(route('admin.reporting-management.store'), {
      onSuccess: () => {
        setShowCreateModal(false);
        toast.success('Report created successfully and is being generated');
      },
      onError: (errors) => {
        toast.error('Failed to create report. Please check the form.');
      }
    });
  };

  const inputClass = (error) =>
    "w-full border text-sm rounded-md px-4 py-2 focus:outline-none " +
    (error
      ? "border-red-500 ring-2 ring-red-400 focus:border-red-500 focus:ring-red-500"
      : "border-zinc-300 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-800");

  const reportTypes = [
    { value: 'collection_summary', label: 'Collection Summary' },
    { value: 'collector_performance', label: 'Collector Performance' },
    { value: 'resident_activity', label: 'Resident Activity' },
    { value: 'waste_bin_status', label: 'Waste Bin Status' },
    { value: 'route_efficiency', label: 'Route Efficiency' },
    { value: 'schedule_compliance', label: 'Schedule Compliance' },
    { value: 'barangay_statistics', label: 'Barangay Statistics' },
    { value: 'waste_type_analysis', label: 'Waste Type Analysis' },
    { value: 'monthly_overview', label: 'Monthly Overview' },
  ];

  const reportPeriods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <Dialog open onOpenChange={setShowCreateModal}>
      <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800">Create Report</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Generate a new report by selecting the type and date range below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">

          {/* Report Title */}
          <div>
            <Label className="text-zinc-800">Report Title </Label>
            <Input
              type="text"
              value={data.report_title}
              onChange={e => setData('report_title', e.target.value)}
              placeholder="e.g., October 2024 Collection Summary"
              className={inputClass(errors.report_title)}
            />
            <InputError message={errors.report_title} />
          </div>

          {/* Report Type */}
          <div>
            <Label className="text-zinc-800">Report Type </Label>
            <Select value={data.report_type} onValueChange={(value) => setData('report_type', value)}>
              <SelectTrigger className={inputClass(errors.report_type)}>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.report_type} />
          </div>

          {/* Report Period */}
          <div>
            <Label className="text-zinc-800">Report Period </Label>
            <Select value={data.report_period} onValueChange={(value) => setData('report_period', value)}>
              <SelectTrigger className={inputClass(errors.report_period)}>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {reportPeriods.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.report_period} />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-800">Start Date </Label>
              <Input
                type="date"
                value={data.start_date}
                onChange={e => setData('start_date', e.target.value)}
                className={inputClass(errors.start_date)}
              />
              <InputError message={errors.start_date} />
            </div>
            <div>
              <Label className="text-zinc-800">End Date </Label>
              <Input
                type="date"
                value={data.end_date}
                onChange={e => setData('end_date', e.target.value)}
                className={inputClass(errors.end_date)}
              />
              <InputError message={errors.end_date} />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-zinc-800">Description</Label>
            <Textarea
              value={data.description}
              onChange={e => setData('description', e.target.value)}
              placeholder="Add any notes or description for this report..."
              className={inputClass(errors.description)}
              rows={3}
            />
            <InputError message={errors.description} />
          </div>
          

          {/* Buttons */}
          <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white transition"
              disabled={processing}
            >
              {processing ? 'Generating...' : 'Generate Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReport;