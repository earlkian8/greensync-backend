import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/Components/ui/dialog"
import { Button } from '@/Components/ui/button';
import { Download, FileText, Calendar, User, BarChart3, TrendingUp, Package, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ViewReport = ({ setShowViewModal, report, onExport }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      generating: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getReportTypeName = (type) => {
    const types = {
      collection_summary: 'Collection Summary',
      collector_performance: 'Collector Performance',
      resident_activity: 'Resident Activity',
      waste_bin_status: 'Waste Bin Status',
      route_efficiency: 'Route Efficiency',
      schedule_compliance: 'Schedule Compliance',
      barangay_statistics: 'Barangay Statistics',
      waste_type_analysis: 'Waste Type Analysis',
      monthly_overview: 'Monthly Overview',
      custom: 'Custom Report'
    };
    return types[type] || type;
  };

  const renderReportData = () => {
    if (!report.report_data || report.status !== 'completed') {
      return null;
    }

    const data = report.report_data;

    switch (report.report_type) {
      case 'collection_summary':
        return renderCollectionSummary(data);
      case 'collector_performance':
        return renderCollectorPerformance(data);
      case 'resident_activity':
        return renderResidentActivity(data);
      case 'waste_bin_status':
        return renderWasteBinStatus(data);
      case 'route_efficiency':
        return renderRouteEfficiency(data);
      case 'schedule_compliance':
        return renderScheduleCompliance(data);
      case 'barangay_statistics':
        return renderBarangayStatistics(data);
      case 'waste_type_analysis':
        return renderWasteTypeAnalysis(data);
      case 'monthly_overview':
        return renderMonthlyOverview(data);
      default:
        return null;
    }
  };

  const renderCollectionSummary = (data) => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Requests" 
          value={data.total_requests || 0} 
          icon={<Package className="text-blue-600" size={20} />}
        />
        <MetricCard 
          title="Completed" 
          value={data.completed_requests || 0} 
          icon={<TrendingUp className="text-green-600" size={20} />}
          color="green"
        />
        <MetricCard 
          title="Pending" 
          value={data.pending_requests || 0} 
          icon={<Package className="text-yellow-600" size={20} />}
          color="yellow"
        />
        <MetricCard 
          title="Avg. Completion Time" 
          value={`${data.average_completion_time || 0}h`} 
          icon={<BarChart3 className="text-purple-600" size={20} />}
          color="purple"
        />
      </div>

      {/* By Status */}
      {data.by_status && data.by_status.length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
            <BarChart3 size={18} />
            Requests by Status
          </h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_status.map((item, idx) => {
                  const percentage = data.total_requests > 0 
                    ? ((item.count / data.total_requests) * 100).toFixed(1)
                    : 0;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium capitalize">{item.status}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-zinc-600">{percentage}%</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* By Waste Type */}
      {data.by_waste_type && data.by_waste_type.length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
            <Package size={18} />
            Requests by Waste Type
          </h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waste Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_waste_type.map((item, idx) => {
                  const percentage = data.total_requests > 0 
                    ? ((item.count / data.total_requests) * 100).toFixed(1)
                    : 0;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium capitalize">{item.waste_type}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-zinc-600">{percentage}%</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      {data.daily_breakdown && data.daily_breakdown.length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
            <Calendar size={18} />
            Daily Breakdown
          </h4>
          <div className="bg-zinc-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.daily_breakdown.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDateShort(item.date)}</TableCell>
                    <TableCell className="text-right font-medium">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  const renderCollectorPerformance = (data) => (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Collectors" 
          value={data.total_collectors || 0} 
          icon={<Users className="text-blue-600" size={20} />}
        />
        <MetricCard 
          title="Avg. Completion Rate" 
          value={`${(data.average_completion_rate || 0).toFixed(1)}%`} 
          icon={<TrendingUp className="text-green-600" size={20} />}
          color="green"
        />
      </div>

      {/* Top Performers */}
      {data.top_performers && data.top_performers.length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
            <TrendingUp size={18} />
            Top Performers
          </h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collector</TableHead>
                  <TableHead className="text-right">Assignments</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_performers.map((collector, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{collector.collector_name}</p>
                        <p className="text-xs text-zinc-500">{collector.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{collector.total_assignments}</TableCell>
                    <TableCell className="text-right">{collector.completed_assignments}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600 font-medium">{collector.completion_rate}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* All Collectors */}
      {data.collectors && data.collectors.length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3 flex items-center gap-2">
            <Users size={18} />
            All Collectors Performance
          </h4>
          <div className="bg-zinc-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collector</TableHead>
                  <TableHead className="text-right">Assignments</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Collections</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Avg. Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.collectors.map((collector, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{collector.collector_name}</p>
                        <p className="text-xs text-zinc-500">{collector.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{collector.total_assignments}</TableCell>
                    <TableCell className="text-right">{collector.completed_assignments}</TableCell>
                    <TableCell className="text-right">{collector.total_collections}</TableCell>
                    <TableCell className="text-right">
                      <span className={collector.completion_rate >= 80 ? 'text-green-600 font-medium' : 'text-zinc-600'}>
                        {collector.completion_rate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{collector.average_duration} min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  const renderResidentActivity = (data) => (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Residents" 
          value={data.total_residents || 0} 
          icon={<Users className="text-blue-600" size={20} />}
        />
        <MetricCard 
          title="Active Residents" 
          value={data.active_residents || 0} 
          icon={<TrendingUp className="text-green-600" size={20} />}
          color="green"
        />
        <MetricCard 
          title="Verified" 
          value={data.verified_residents || 0} 
          icon={<Users className="text-purple-600" size={20} />}
          color="purple"
        />
        <MetricCard 
          title="Total Bins" 
          value={data.total_bins_registered || 0} 
          icon={<Package className="text-orange-600" size={20} />}
          color="orange"
        />
      </div>

      {/* By Barangay */}
      {data.by_barangay && Object.keys(data.by_barangay).length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Residents by Barangay</h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barangay</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.by_barangay).map(([barangay, count], idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{barangay}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Top Requesters */}
      {data.top_requesters && data.top_requesters.length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Top Requesters</h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.top_requesters.map((resident, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{resident.name}</TableCell>
                    <TableCell>{resident.barangay}</TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      {resident.request_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  const renderWasteBinStatus = (data) => (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Bins" 
          value={data.total_bins || 0} 
          icon={<Package className="text-blue-600" size={20} />}
        />
        <MetricCard 
          title="Active" 
          value={data.active_bins || 0} 
          icon={<TrendingUp className="text-green-600" size={20} />}
          color="green"
        />
        <MetricCard 
          title="Full" 
          value={data.full_bins || 0} 
          icon={<Package className="text-yellow-600" size={20} />}
          color="yellow"
        />
        <MetricCard 
          title="Damaged" 
          value={data.damaged_bins || 0} 
          icon={<Package className="text-red-600" size={20} />}
          color="red"
        />
      </div>

      {/* By Status */}
      {data.by_status && Object.keys(data.by_status).length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Bins by Status</h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.by_status).map(([status, count], idx) => {
                  const percentage = data.total_bins > 0 
                    ? ((count / data.total_bins) * 100).toFixed(1)
                    : 0;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium capitalize">{status}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-zinc-600">{percentage}%</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* By Type */}
      {data.by_type && Object.keys(data.by_type).length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Bins by Type</h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.by_type).map(([type, count], idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium capitalize">{type}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  const renderRouteEfficiency = (data) => (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Routes" 
          value={data.total_routes || 0} 
          icon={<BarChart3 className="text-blue-600" size={20} />}
        />
        <MetricCard 
          title="Completed Assignments" 
          value={data.completed_assignments || 0} 
          icon={<TrendingUp className="text-green-600" size={20} />}
          color="green"
        />
        <MetricCard 
          title="Avg. Completion Rate" 
          value={`${(data.average_completion_rate || 0).toFixed(1)}%`} 
          icon={<BarChart3 className="text-purple-600" size={20} />}
          color="purple"
        />
      </div>

      {/* Route Statistics */}
      {data.route_statistics && data.route_statistics.length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Route Statistics</h4>
          <div className="bg-zinc-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead className="text-right">Stops</TableHead>
                  <TableHead className="text-right">Assignments</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Avg. Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.route_statistics.map((route, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{route.route_name}</TableCell>
                    <TableCell>{route.barangay}</TableCell>
                    <TableCell className="text-right">{route.total_stops}</TableCell>
                    <TableCell className="text-right">{route.total_assignments}</TableCell>
                    <TableCell className="text-right">{route.completed}</TableCell>
                    <TableCell className="text-right">
                      <span className={route.completion_rate >= 80 ? 'text-green-600 font-medium' : 'text-zinc-600'}>
                        {route.completion_rate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{route.avg_duration} min</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  const renderScheduleCompliance = (data) => (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Schedules" 
          value={data.total_schedules || 0} 
          icon={<Calendar className="text-blue-600" size={20} />}
        />
        <MetricCard 
          title="Total Assignments" 
          value={data.total_assignments || 0} 
          icon={<BarChart3 className="text-purple-600" size={20} />}
          color="purple"
        />
        <MetricCard 
          title="Compliance Rate" 
          value={`${(data.compliance_rate || 0).toFixed(1)}%`} 
          icon={<TrendingUp className="text-green-600" size={20} />}
          color="green"
        />
      </div>

      {/* By Day */}
      {data.by_day && Object.keys(data.by_day).length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Schedules by Day</h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">Schedules</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.by_day).map(([day, count], idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium capitalize">{day}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* By Waste Type */}
      {data.by_waste_type && Object.keys(data.by_waste_type).length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Schedules by Waste Type</h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waste Type</TableHead>
                  <TableHead className="text-right">Schedules</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.by_waste_type).map(([type, count], idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium capitalize">{type}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  const renderBarangayStatistics = (data) => (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          title="Total Barangays" 
          value={data.total_barangays || 0} 
          icon={<BarChart3 className="text-blue-600" size={20} />}
        />
        {data.most_active && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-xs text-green-700 font-medium mb-1">MOST ACTIVE</p>
            <p className="text-2xl font-bold text-green-800">{data.most_active.barangay}</p>
            <p className="text-sm text-green-600">{data.most_active.total_requests} requests</p>
          </div>
        )}
      </div>

      {/* Barangay Data */}
      {data.barangay_data && data.barangay_data.length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Barangay Details</h4>
          <div className="bg-zinc-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barangay</TableHead>
                  <TableHead className="text-right">Residents</TableHead>
                  <TableHead className="text-right">Verified</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Bins</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.barangay_data.map((barangay, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{barangay.barangay}</TableCell>
                    <TableCell className="text-right">{barangay.total_residents}</TableCell>
                    <TableCell className="text-right">{barangay.verified_residents}</TableCell>
                    <TableCell className="text-right">{barangay.total_requests}</TableCell>
                    <TableCell className="text-right">{barangay.completed_requests}</TableCell>
                    <TableCell className="text-right">{barangay.total_bins}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  const renderWasteTypeAnalysis = (data) => (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 gap-4">
        <MetricCard 
          title="Total Collections" 
          value={data.total_collections || 0} 
          icon={<Package className="text-blue-600" size={20} />}
        />
      </div>

      {/* Most Common Type */}
      {data.most_common_type && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-xs text-blue-700 font-medium mb-1">MOST COMMON WASTE TYPE</p>
          <p className="text-2xl font-bold text-blue-800 capitalize">{data.most_common_type.waste_type}</p>
          <p className="text-sm text-blue-600">{data.most_common_type.total} collections ({data.most_common_type.percentage}%)</p>
        </div>
      )}

      {/* By Waste Type */}
      {data.by_waste_type && Object.keys(data.by_waste_type).length > 0 && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Waste Type Breakdown</h4>
          <div className="bg-zinc-50 rounded-lg p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waste Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(data.by_waste_type).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium capitalize">{item.waste_type}</TableCell>
                    <TableCell className="text-right">{item.total}</TableCell>
                    <TableCell className="text-right">{item.completed}</TableCell>
                    <TableCell className="text-right">{item.pending}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-blue-600 font-medium">{item.percentage}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  const renderMonthlyOverview = (data) => (
    <div className="space-y-6">
      {/* Collection Summary */}
      {data.collection_summary && (
        <div>
          <h4 className="font-semibold text-zinc-800 mb-3">Collection Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Requests" 
              value={data.collection_summary.total_requests || 0} 
              icon={<Package className="text-blue-600" size={20} />}
            />
            <MetricCard 
              title="Completed" 
              value={data.collection_summary.completed_requests || 0} 
              icon={<TrendingUp className="text-green-600" size={20} />}
              color="green"
            />
            <MetricCard 
              title="Pending" 
              value={data.collection_summary.pending_requests || 0} 
              icon={<Package className="text-yellow-600" size={20} />}
              color="yellow"
            />
            <MetricCard 
              title="Avg. Time" 
              value={`${data.collection_summary.average_completion_time || 0}h`} 
              icon={<BarChart3 className="text-purple-600" size={20} />}
              color="purple"
            />
          </div>
        </div>
      )}

      {/* System Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.collector_stats && (
          <>
            <MetricCard 
              title="Total Collectors" 
              value={data.collector_stats.total || 0} 
              icon={<Users className="text-blue-600" size={20} />}
            />
            <MetricCard 
              title="Active Collectors" 
              value={data.collector_stats.active || 0} 
              icon={<Users className="text-green-600" size={20} />}
              color="green"
            />
          </>
        )}
        {data.resident_stats && (
          <>
            <MetricCard 
              title="Total Residents" 
              value={data.resident_stats.total || 0} 
              icon={<Users className="text-purple-600" size={20} />}
              color="purple"
            />
            <MetricCard 
              title="Verified Residents" 
              value={data.resident_stats.verified || 0} 
              icon={<Users className="text-indigo-600" size={20} />}
              color="indigo"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.bin_stats && (
          <>
            <MetricCard 
              title="Total Bins" 
              value={data.bin_stats.total || 0} 
              icon={<Package className="text-orange-600" size={20} />}
              color="orange"
            />
            <MetricCard 
              title="Active Bins" 
              value={data.bin_stats.active || 0} 
              icon={<Package className="text-green-600" size={20} />}
              color="green"
            />
          </>
        )}
        {data.route_stats && (
          <>
            <MetricCard 
              title="Total Routes" 
              value={data.route_stats.total || 0} 
              icon={<BarChart3 className="text-cyan-600" size={20} />}
              color="cyan"
            />
            <MetricCard 
              title="Active Routes" 
              value={data.route_stats.active || 0} 
              icon={<BarChart3 className="text-teal-600" size={20} />}
              color="teal"
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open onOpenChange={setShowViewModal}>
      <DialogContent className="w-[95vw] max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-800 flex items-center gap-2">
            <FileText size={24} />
            {report.report_title}
          </DialogTitle>
          <DialogDescription className="text-zinc-600">
            View detailed report information and export options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Status and Type */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadge(report.status)}`}>
                {report.status}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-600">Type</p>
              <p className="font-medium text-zinc-800">{getReportTypeName(report.report_type)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Period</p>
              <p className="font-medium text-zinc-800 capitalize">{report.report_period}</p>
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-zinc-50 p-4 rounded-md">
            <div className="flex items-start gap-3">
              <Calendar className="text-zinc-600 mt-1" size={20} />
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-1">Date Range</p>
                <p className="text-zinc-600">
                  {formatDate(report.start_date)} - {formatDate(report.end_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-2">Description</p>
              <p className="text-zinc-600 text-sm">{report.description}</p>
            </div>
          )}

          {/* Generated By */}
          {report.generated_by && (
            <div className="bg-zinc-50 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <User className="text-zinc-600 mt-1" size={20} />
                <div>
                  <p className="text-sm font-medium text-zinc-700 mb-1">Generated By</p>
                  <p className="text-zinc-600">{report.generated_by.name}</p>
                  {report.generated_at && (
                    <p className="text-sm text-zinc-500 mt-1">
                      {formatDate(report.generated_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Applied Filters */}
          {report.filters && Object.keys(report.filters).filter(key => report.filters[key]).length > 0 && (
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-2">Applied Filters</p>
              <div className="bg-zinc-50 p-4 rounded-md space-y-2">
                {Object.entries(report.filters).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-600 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm font-medium text-zinc-800">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          {report.summary_stats && Object.keys(report.summary_stats).length > 0 && (
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-3">Summary Statistics</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(report.summary_stats).map(([key, value]) => (
                  <div key={key} className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 rounded-md">
                    <p className="text-xs text-zinc-600 uppercase mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-bold text-zinc-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Report Data */}
          {report.status === 'completed' && (
            <div>
              <p className="text-sm font-medium text-zinc-700 mb-3">Report Details</p>
              {renderReportData()}
            </div>
          )}

          {/* Failed Status Message */}
          {report.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-md">
              <p className="text-sm font-medium text-red-900 mb-1">Report Generation Failed</p>
              <p className="text-sm text-red-700">
                There was an error generating this report. Please try creating it again or contact support if the issue persists.
              </p>
            </div>
          )}

          {/* Generating Status Message */}
          {report.status === 'generating' && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-1">Report is Being Generated</p>
              <p className="text-sm text-blue-700">
                This report is currently being generated. Please check back in a few moments.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowViewModal(false)}
          >
            Close
          </Button>
          {report.status === 'completed' && onExport && (
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onExport(report)}
            >
              <Download size={16} className="mr-2" />
              Export Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Reusable MetricCard Component
const MetricCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100',
    green: 'from-green-50 to-green-100',
    yellow: 'from-yellow-50 to-yellow-100',
    red: 'from-red-50 to-red-100',
    purple: 'from-purple-50 to-purple-100',
    orange: 'from-orange-50 to-orange-100',
    indigo: 'from-indigo-50 to-indigo-100',
    cyan: 'from-cyan-50 to-cyan-100',
    teal: 'from-teal-50 to-teal-100',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 rounded-lg`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-zinc-700 font-medium uppercase">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-zinc-800">{value}</p>
    </div>
  );
};

export default ViewReport;