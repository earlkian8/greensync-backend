import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Truck,
  Package,
  TrendingUp,
  Filter,
  Download,
} from 'lucide-react';

export default function CollectorPerformanceReport() {
  const { collectors, all_collectors, start_date, end_date, selected_collector_id } = usePage().props;

  const [filters, setFilters] = useState({
    start_date: start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: end_date || new Date().toISOString().split('T')[0],
    collector_id: selected_collector_id || '',
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    router.get(route('admin.reporting.collector-performance-report'), filters, {
      preserveState: true,
      replace: true,
    });
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatWeight = (weight) => {
    if (!weight || weight === 0) return '0 kg';
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(2)} tons`;
    }
    return `${weight.toFixed(2)} kg`;
  };

  const breadcrumbs = [
    { name: 'Dashboard', href: route('admin.dashboard') },
    { name: 'Reporting', href: route('admin.reporting.index') },
    { name: 'Collector Performance Report' },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Collector Performance Report" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collector Performance Report</h1>
            <p className="text-gray-600 mt-1">Individual and team collector performance metrics</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="collector_id">Collector (Optional)</Label>
                <Select value={filters.collector_id} onValueChange={(value) => handleFilterChange('collector_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Collectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Collectors</SelectItem>
                    {all_collectors?.map((collector) => (
                      <SelectItem key={collector.id} value={collector.id.toString()}>
                        {collector.name} ({collector.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={applyFilters} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collectors List */}
        {collectors && collectors.length > 0 ? (
          <div className="space-y-6">
            {collectors.map((collector) => (
              <Card key={collector.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        {collector.name}
                      </CardTitle>
                      <CardDescription>
                        {collector.employee_id} • {collector.email} • {collector.phone_number}
                      </CardDescription>
                    </div>
                    <Badge variant={collector.is_active ? 'default' : 'secondary'}>
                      {collector.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">Total Collections</p>
                      <p className="text-2xl font-bold">{formatNumber(collector.collections_count)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">Total Weight</p>
                      <p className="text-2xl font-bold">{formatWeight(collector.total_weight)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">Assignments</p>
                      <p className="text-2xl font-bold">{formatNumber(collector.assignments_count)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">Avg Weight/Collection</p>
                      <p className="text-2xl font-bold">{formatWeight(collector.average_weight_per_collection)}</p>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  {collector.status_breakdown && Object.keys(collector.status_breakdown).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Status Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(collector.status_breakdown).map(([status, count]) => (
                          <div key={status} className="p-3 border rounded-lg text-center">
                            <p className="text-sm text-gray-500">{status}</p>
                            <p className="text-xl font-bold">{formatNumber(count)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Waste Type Breakdown */}
                  {collector.waste_type_breakdown && Object.keys(collector.waste_type_breakdown).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Waste Type Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(collector.waste_type_breakdown).map(([type, count]) => (
                          <div key={type} className="p-3 border rounded-lg text-center">
                            <p className="text-sm text-gray-500">{type}</p>
                            <p className="text-xl font-bold">{formatNumber(count)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily Performance */}
                  {collector.daily_performance && collector.daily_performance.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Daily Performance</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Date</th>
                              <th className="text-right p-2">Collections</th>
                              <th className="text-right p-2">Weight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {collector.daily_performance.map((day, index) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-2">{new Date(day.date).toLocaleDateString()}</td>
                                <td className="p-2 text-right">{formatNumber(day.count)}</td>
                                <td className="p-2 text-right">{formatWeight(day.total_weight)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No collector data available for the selected period</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

