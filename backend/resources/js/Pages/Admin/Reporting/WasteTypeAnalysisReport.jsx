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
import { BarChart3, Filter, Download } from 'lucide-react';

export default function WasteTypeAnalysisReport() {
  const { waste_type_summary, waste_type_by_day, top_collectors_by_type, start_date, end_date } = usePage().props;

  const [filters, setFilters] = useState({
    start_date: start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: end_date || new Date().toISOString().split('T')[0],
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    router.get(route('admin.reporting.waste-type-analysis-report'), filters, {
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
    { name: 'Waste Type Analysis Report' },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Waste Type Analysis Report" />

      <div className="space-y-6">
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

        {waste_type_summary && waste_type_summary.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {waste_type_summary.map((type) => (
                <Card key={type.waste_type}>
                  <CardHeader>
                    <CardTitle className="text-lg">{type.waste_type}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Collections</p>
                        <p className="text-2xl font-bold">{formatNumber(type.count)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Weight</p>
                        <p className="text-xl font-semibold">{formatWeight(type.total_weight)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Average Weight</p>
                        <p className="text-lg">{formatWeight(type.avg_weight)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {top_collectors_by_type && Object.keys(top_collectors_by_type).length > 0 && (
              <div className="space-y-4">
                {Object.entries(top_collectors_by_type).map(([type, collectors]) => (
                  collectors.length > 0 && (
                    <Card key={type}>
                      <CardHeader>
                        <CardTitle>Top Collectors - {type}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {collectors.map((collector, index) => (
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
                                <p className="font-medium">{formatNumber(collector.count)} collections</p>
                                <p className="text-sm text-gray-500">{formatWeight(collector.total_weight)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No waste type data available for the selected period</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

