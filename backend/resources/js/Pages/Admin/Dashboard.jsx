import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Users,
  Truck,
  Trash2,
  MapPin,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function Dashboard() {
  const { overall_stats, period_stats, period, date_range, collection_status_breakdown, 
          waste_type_distribution, collection_request_status, recent_collections, 
          top_collectors, today_assignments, collection_trends, monthly_trends, 
          pending_requests, route_performance } = usePage().props;

  const [selectedPeriod, setSelectedPeriod] = useState(period || 'today');

  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    router.get(route('admin.dashboard'), { period: newPeriod }, {
      preserveState: true,
      replace: true,
    });
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatWeight = (weight) => {
    // Convert to number and handle null/undefined/empty values
    const numWeight = Number(weight);
    if (!numWeight || numWeight === 0 || isNaN(numWeight)) return '0 kg';
    if (numWeight >= 1000) {
      return `${(numWeight / 1000).toFixed(2)} tons`;
    }
    return `${numWeight.toFixed(2)} kg`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'collected': 'bg-blue-100 text-blue-800',
      'manual': 'bg-yellow-100 text-yellow-800',
      'successful': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getWasteTypeColor = (type) => {
    const colors = {
      'biodegradable': 'bg-green-100 text-green-800',
      'non-biodegradable': 'bg-red-100 text-red-800',
      'recyclable': 'bg-blue-100 text-blue-800',
      'special': 'bg-purple-100 text-purple-800',
      'all': 'bg-gray-100 text-gray-800',
      'mixed': 'bg-orange-100 text-orange-800',
    };
    return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const breadcrumbs = [
    { name: 'Dashboard', href: route('admin.dashboard') },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Admin Dashboard" />

      <div className="space-y-6 w-full sm:px-6 lg:px-8">
        {/* Header with Period Selector */}

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overall_stats?.total_residents)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(overall_stats?.verified_residents)} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collectors</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overall_stats?.total_collectors)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(overall_stats?.active_collectors)} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Waste Bins</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overall_stats?.total_bins)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(overall_stats?.active_bins)} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overall_stats?.total_routes)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(overall_stats?.active_routes)} active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Period Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collections ({selectedPeriod})</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(period_stats?.collections_count)}</div>
              <p className="text-xs text-muted-foreground">
                {formatWeight(period_stats?.collections_weight)} collected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Registrations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber((period_stats?.new_residents || 0) + (period_stats?.new_collectors || 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(period_stats?.new_residents)} residents, {formatNumber(period_stats?.new_collectors)} collectors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(period_stats?.collection_requests)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(pending_requests?.length || 0)} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Collection Trends (7 days) */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Trends (Last 7 Days)</CardTitle>
              <CardDescription>Daily collection count and weight</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collection_trends && collection_trends.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {collection_trends.map((trend, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 w-24">
                            <span className="text-sm font-medium">{trend.day}</span>
                            <span className="text-xs text-muted-foreground">{trend.date}</span>
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${Math.min((trend.count / Math.max(...collection_trends.map(t => t.count || 1))) * 100, 100)}%`
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{trend.count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Weight:</span>
                        <span className="font-medium">
                          {formatWeight(collection_trends.reduce((sum, t) => sum + (t.weight || 0), 0))}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collection Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Status Breakdown</CardTitle>
              <CardDescription>Status distribution for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {collection_status_breakdown && Object.keys(collection_status_breakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(collection_status_breakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(status)}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              status === 'completed' || status === 'successful' ? 'bg-green-600' :
                              status === 'collected' ? 'bg-blue-600' :
                              status === 'manual' ? 'bg-yellow-600' : 'bg-gray-600'
                            }`}
                            style={{
                              width: `${(count / Object.values(collection_status_breakdown).reduce((a, b) => a + b, 0)) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{formatNumber(count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Waste Type Distribution and Top Collectors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Waste Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Waste Type Distribution</CardTitle>
              <CardDescription>Breakdown by waste type</CardDescription>
            </CardHeader>
            <CardContent>
              {waste_type_distribution && Object.keys(waste_type_distribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(waste_type_distribution).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Badge className={getWasteTypeColor(type)}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                      </Badge>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-600"
                            style={{
                              width: `${(count / Object.values(waste_type_distribution).reduce((a, b) => a + b, 0)) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{formatNumber(count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Collectors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Collectors</CardTitle>
              <CardDescription>Highest collection count for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {top_collectors && top_collectors.length > 0 ? (
                <div className="space-y-3">
                  {top_collectors.map((collector, index) => (
                    <div key={collector.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{collector.name}</p>
                          <p className="text-xs text-muted-foreground">{collector.employee_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatNumber(collector.collections_count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Assignments and Recent Collections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's Route Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Route Assignments</CardTitle>
              <CardDescription>Active assignments for today</CardDescription>
            </CardHeader>
            <CardContent>
              {today_assignments && today_assignments.length > 0 ? (
                <div className="space-y-3">
                  {today_assignments.map((assignment) => (
                    <div key={assignment.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{assignment.route_name}</p>
                          <p className="text-sm text-muted-foreground">{assignment.collector_name}</p>
                        </div>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {assignment.collections_count} / {assignment.total_stops}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${assignment.completion_percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {assignment.completion_percentage}% complete
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No assignments for today</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Collections */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Collections</CardTitle>
              <CardDescription>Latest collection records</CardDescription>
            </CardHeader>
            <CardContent>
              {recent_collections && recent_collections.length > 0 ? (
                <div className="space-y-3">
                  {recent_collections.map((collection) => (
                    <div key={collection.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{collection.resident_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Collector: {collection.collector_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(collection.collection_timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(collection.collection_status)}>
                          {collection.collection_status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        {collection.waste_weight && (
                          <span className="text-muted-foreground">
                            Weight: {formatWeight(collection.waste_weight)}
                          </span>
                        )}
                        {collection.waste_type && (
                          <Badge className={getWasteTypeColor(collection.waste_type)} variant="outline">
                            {collection.waste_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent collections</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        {pending_requests && pending_requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Collection Requests</CardTitle>
              <CardDescription>Requests awaiting action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pending_requests.map((request) => (
                  <div key={request.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{request.resident_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Type: {request.request_type}
                        </p>
                        {request.preferred_date && (
                          <p className="text-xs text-muted-foreground">
                            Preferred: {new Date(request.preferred_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={request.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {request.priority || 'normal'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
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

