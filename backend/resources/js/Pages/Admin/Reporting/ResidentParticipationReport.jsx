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
import { Users, Filter, Download, TrendingUp } from 'lucide-react';

export default function ResidentParticipationReport() {
  const { 
    participating_residents, 
    total_residents, 
    participating_count, 
    participation_rate,
    participation_by_barangay,
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
    router.get(route('admin.reporting.resident-participation-report'), filters, {
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
    { name: 'Resident Participation Report' },
  ];

  return (
    <AuthenticatedLayout breadcrumbs={breadcrumbs}>
      <Head title="Resident Participation Report" />

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Residents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(total_residents)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Participating Residents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(participating_count)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Participation Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{participation_rate}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${participation_rate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {participation_by_barangay && participation_by_barangay.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Participation by Barangay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Barangay</th>
                      <th className="text-right p-2">Total Residents</th>
                      <th className="text-right p-2">Participating</th>
                      <th className="text-right p-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participation_by_barangay.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.barangay}</td>
                        <td className="p-2 text-right">{formatNumber(item.total_residents)}</td>
                        <td className="p-2 text-right">{formatNumber(item.participating_residents)}</td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${item.participation_rate}%` }}
                              />
                            </div>
                            <span className="font-medium w-12">{item.participation_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {participating_residents && participating_residents.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Participating Residents</CardTitle>
              <CardDescription>Residents with collections in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participating_residents.slice(0, 20).map((resident) => (
                  <div key={resident.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{resident.name}</p>
                        <p className="text-sm text-gray-500">{resident.barangay}</p>
                        <p className="text-xs text-gray-400">{resident.full_address}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(resident.total_collections)} collections</p>
                        <p className="text-sm text-gray-500">{formatWeight(resident.total_weight)}</p>
                      </div>
                    </div>
                    {resident.bins && resident.bins.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-1">Bins: {resident.bins.length}</p>
                        <div className="flex flex-wrap gap-1">
                          {resident.bins.map((bin) => (
                            <Badge key={bin.id} variant="outline" className="text-xs">
                              {bin.name} ({formatNumber(bin.collections_count)})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No participating residents found for the selected period</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

