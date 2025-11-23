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
  MapPin,
  Package,
  TrendingUp,
  Filter,
  Download,
  CheckCircle2,
} from 'lucide-react';

export default function RoutePerformanceReport() {
  const { routes, all_routes, start_date, end_date, selected_route_id } = usePage().props;

  const [filters, setFilters] = useState({
    start_date: start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: end_date || new Date().toISOString().split('T')[0],
    route_id: selected_route_id || '',
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    router.get(route('admin.reporting.route-performance-report'), filters, {
      preserveState: true,
      replace: true,
    });
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatWeight = (weight) => {
    const numWeight = parseFloat(weight) || 0;
    if (!numWeight || numWeight === 0) return '0 kg';
    if (numWeight >= 1000) {
      return `${(numWeight / 1000).toFixed(2)} tons`;
    }
    return `${numWeight.toFixed(2)} kg`;
  };

  const breadcrumbs = [
    { name: 'Dashboard', href: route('admin.dashboard') },
    { name: 'Reporting', href: route('admin.reporting.index') },
    { name: 'Route Performance Report' },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Route Performance Report" />

      <div className="space-y-6">
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
                <Label htmlFor="route_id">Route (Optional)</Label>
                <Select value={filters.route_id} onValueChange={(value) => handleFilterChange('route_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Routes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Routes</SelectItem>
                    {all_routes?.map((route) => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        {route.route_name} - {route.barangay}
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

        {/* Routes List */}
        {routes && routes.length > 0 ? (
          <div className="space-y-6">
            {routes.map((route) => (
              <Card key={route.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {route.route_name}
                      </CardTitle>
                      <CardDescription>
                        {route.barangay} • {route.total_stops} stops
                      </CardDescription>
                    </div>
                    <Badge variant={route.is_active ? 'default' : 'secondary'}>
                      {route.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">Total Assignments</p>
                      <p className="text-2xl font-bold">{formatNumber(route.assignments_count)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">Total Collections</p>
                      <p className="text-2xl font-bold">{formatNumber(route.total_collections)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">Total Weight</p>
                      <p className="text-2xl font-bold">{formatWeight(route.total_weight)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">Completion Rate</p>
                      <p className="text-2xl font-bold">{route.completion_rate}%</p>
                    </div>
                  </div>

                  {/* Assignments by Status */}
                  {route.assignments_by_status && Object.keys(route.assignments_by_status).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Assignments by Status</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(route.assignments_by_status).map(([status, count]) => (
                          <div key={status} className="p-3 border rounded-lg text-center">
                            <p className="text-sm text-gray-500">{status}</p>
                            <p className="text-xl font-bold">{formatNumber(count)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Assignments */}
                  {route.recent_assignments && route.recent_assignments.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Recent Assignments</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Date</th>
                              <th className="text-left p-2">Collector</th>
                              <th className="text-center p-2">Status</th>
                              <th className="text-right p-2">Collections</th>
                            </tr>
                          </thead>
                          <tbody>
                            {route.recent_assignments.map((assignment) => (
                              <tr key={assignment.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{assignment.assignment_date}</td>
                                <td className="p-2">{assignment.collector_name}</td>
                                <td className="p-2 text-center">
                                  <Badge variant="outline">{assignment.status}</Badge>
                                </td>
                                <td className="p-2 text-right">{formatNumber(assignment.collections_count)}</td>
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
              <p className="text-center text-gray-500">No route data available for the selected period</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

