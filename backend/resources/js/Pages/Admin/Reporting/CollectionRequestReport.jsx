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
import { FileText, Filter, Download } from 'lucide-react';

export default function CollectionRequestReport() {
  const { 
    summary, 
    requests_by_type, 
    requests_by_priority, 
    requests,
    start_date,
    end_date 
  } = usePage().props;

  const [filters, setFilters] = useState({
    start_date: start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: end_date || new Date().toISOString().split('T')[0],
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    router.get(route('admin.reporting.collection-request-report'), filters, {
      preserveState: true,
      replace: true,
    });
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const breadcrumbs = [
    { name: 'Dashboard', href: route('admin.dashboard') },
    { name: 'Reporting', href: route('admin.reporting.index') },
    { name: 'Collection Request Report' },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Collection Request Report" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collection Request Report</h1>
            <p className="text-gray-600 mt-1">Request status, trends, and fulfillment metrics</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="flex items-end">
                <Button onClick={applyFilters} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary?.total_requests)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary?.pending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary?.assigned)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary?.in_progress)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary?.completed)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary?.cancelled)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests_by_type && requests_by_type.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requests by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requests_by_type.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{item.request_type}</span>
                      <Badge>{formatNumber(item.count)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {requests_by_priority && requests_by_priority.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requests by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requests_by_priority.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{item.priority || 'Normal'}</span>
                      <Badge>{formatNumber(item.count)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {requests && requests.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Resident</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-center p-2">Priority</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Collector</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{request.resident_name}</td>
                        <td className="p-2">{request.request_type}</td>
                        <td className="p-2 text-center">
                          <Badge variant={request.priority === 'high' ? 'destructive' : 'outline'}>
                            {request.priority}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </td>
                        <td className="p-2">{request.created_at}</td>
                        <td className="p-2">{request.collector_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No requests found for the selected period</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

