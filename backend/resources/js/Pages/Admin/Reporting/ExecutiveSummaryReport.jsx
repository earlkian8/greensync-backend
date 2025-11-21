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
import { TrendingUp, TrendingDown, Filter, Download, Package, Truck, MapPin, FileText } from 'lucide-react';

export default function ExecutiveSummaryReport() {
  const { 
    metrics, 
    collections_growth, 
    weight_growth, 
    top_collectors, 
    top_routes,
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
    router.get(route('admin.reporting.executive-summary-report'), filters, {
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
    { name: 'Executive Summary Report' },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Executive Summary Report" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive Summary Report</h1>
            <p className="text-gray-600 mt-1">High-level overview and key performance indicators</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.total_collections)}</div>
              {collections_growth !== undefined && (
                <div className="flex items-center gap-1 text-xs mt-1">
                  {collections_growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={collections_growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(collections_growth).toFixed(1)}% vs previous period
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatWeight(metrics?.total_weight)}</div>
              {weight_growth !== undefined && (
                <div className="flex items-center gap-1 text-xs mt-1">
                  {weight_growth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={weight_growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(weight_growth).toFixed(1)}% vs previous period
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Collectors</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.active_collectors)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.total_routes)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(metrics?.completed_assignments)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Fulfillment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Requests</span>
                  <span className="font-medium">{formatNumber(metrics?.total_requests)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-medium">{formatNumber(metrics?.completed_requests)}</span>
                </div>
                {metrics?.total_requests > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(metrics.completed_requests / metrics.total_requests) * 100}%`
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {top_collectors && top_collectors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Collectors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {top_collectors.map((collector, index) => (
                    <div key={collector.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{index + 1}.</span>
                        <span>{collector.name}</span>
                      </div>
                      <Badge>{collector.qr_collections_count} collections</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {top_routes && top_routes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {top_routes.map((route, index) => (
                    <div key={route.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-600">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{route.route_name}</p>
                          <p className="text-xs text-gray-500">{route.barangay}</p>
                        </div>
                      </div>
                      <Badge>{route.assignments_count} assignments</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

