import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/ui/card';
import {
  FileText,
  Users,
  Truck,
  MapPin,
  Package,
  BarChart3,
  TrendingUp,
  Calendar,
} from 'lucide-react';

export default function ReportingIndex() {
  const reports = [
    {
      title: 'Collection Report',
      description: 'Detailed collection statistics, trends, and analysis',
      icon: Package,
      href: route('admin.reporting.collection-report'),
      color: 'bg-blue-500',
    },
    {
      title: 'Collector Performance Report',
      description: 'Individual and team collector performance metrics',
      icon: Truck,
      href: route('admin.reporting.collector-performance-report'),
      color: 'bg-green-500',
    },
    {
      title: 'Route Performance Report',
      description: 'Route efficiency, completion rates, and assignments',
      icon: MapPin,
      href: route('admin.reporting.route-performance-report'),
      color: 'bg-purple-500',
    },
    {
      title: 'Waste Type Analysis',
      description: 'Breakdown and analysis by waste type categories',
      icon: BarChart3,
      href: route('admin.reporting.waste-type-analysis-report'),
      color: 'bg-orange-500',
    },
    {
      title: 'Resident Participation Report',
      description: 'Resident engagement and participation statistics',
      icon: Users,
      href: route('admin.reporting.resident-participation-report'),
      color: 'bg-teal-500',
    },
    {
      title: 'Collection Request Report',
      description: 'Request status, trends, and fulfillment metrics',
      icon: FileText,
      href: route('admin.reporting.collection-request-report'),
      color: 'bg-red-500',
    },
    {
      title: 'Executive Summary',
      description: 'High-level overview and key performance indicators',
      icon: TrendingUp,
      href: route('admin.reporting.executive-summary-report'),
      color: 'bg-indigo-500',
    },
  ];

  const breadcrumbs = [
    { name: 'Dashboard', href: route('admin.dashboard') },
    { name: 'Reporting' },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Reporting" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => {
            const Icon = report.icon;
            return (
              <Link key={index} href={report.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`${report.color} p-3 rounded-lg text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {report.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Custom Date Ranges</p>
                  <p>Filter reports by specific date periods</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BarChart3 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Detailed Analytics</p>
                  <p>Comprehensive data breakdowns and trends</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Performance Metrics</p>
                  <p>Track key performance indicators</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Export Ready</p>
                  <p>Reports formatted for easy sharing</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

