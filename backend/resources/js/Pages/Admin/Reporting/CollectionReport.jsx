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
  Package,
  TrendingUp,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';

export default function CollectionReport() {
  const { summary, grouped_data, top_collectors, start_date, end_date, group_by } = usePage().props;

  const [filters, setFilters] = useState({
    start_date: start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: end_date || new Date().toISOString().split('T')[0],
    group_by: group_by || 'day',
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    router.get(route('admin.reporting.collection-report'), filters, {
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
    { name: 'Collection Report' },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Collection Report" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collection Report</h1>
            <p className="text-gray-600 mt-1">Detailed collection statistics and trends</p>
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
                <Label htmlFor="group_by">Group By</Label>
                <Select value={filters.group_by} onValueChange={(value) => handleFilterChange('group_by', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary?.total_collections)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWeight(summary?.total_weight)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Weight</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWeight(summary?.average_weight)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Types</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.collections_by_status?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Grouped Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Trends</CardTitle>
            <CardDescription>Collections grouped by {filters.group_by}</CardDescription>
          </CardHeader>
          <CardContent>
            {grouped_data && grouped_data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Period</th>
                      <th className="text-right p-2">Count</th>
                      <th className="text-right p-2">Total Weight</th>
                      <th className="text-right p-2">Visual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped_data.map((item, index) => {
                      const maxCount = Math.max(...grouped_data.map(i => i.count || 0));
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{item.period}</td>
                          <td className="p-2 text-right">{formatNumber(item.count)}</td>
                          <td className="p-2 text-right">{formatWeight(item.total_weight)}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${Math.min((item.count / maxCount) * 100, 100)}%`
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No data available for the selected period</p>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        {summary?.collections_by_status && summary.collections_by_status.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Collections by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.collections_by_status.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <Badge variant="outline">{item.collection_status}</Badge>
                    <span className="font-medium">{formatNumber(item.count)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waste Type Breakdown */}
        {summary?.collections_by_type && summary.collections_by_type.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Collections by Waste Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.collections_by_type.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.waste_type}</p>
                      <p className="text-sm text-gray-500">{formatWeight(item.total_weight)}</p>
                    </div>
                    <span className="font-medium">{formatNumber(item.count)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Collectors */}
        {top_collectors && top_collectors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Collectors</CardTitle>
              <CardDescription>Highest performing collectors for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {top_collectors.map((collector, index) => (
                  <div key={collector.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{collector.name}</p>
                        <p className="text-sm text-gray-500">{collector.employee_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(collector.collections_count)} collections</p>
                      <p className="text-sm text-gray-500">{formatWeight(collector.total_weight)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

