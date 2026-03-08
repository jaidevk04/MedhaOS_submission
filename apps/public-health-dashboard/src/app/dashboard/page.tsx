'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Users, MapPin } from 'lucide-react';
import { IndiaHeatmap } from '@/components/IndiaHeatmap';
import { OutbreakAlerts } from '@/components/OutbreakAlerts';
import { OutbreakTimeline } from '@/components/OutbreakTimeline';
import { ResourceAllocation } from '@/components/ResourceAllocation';
import { SyndromicTrends } from '@/components/SyndromicTrends';
import { MediaScanning } from '@/components/MediaScanning';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Public Health Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Real-time disease surveillance and outbreak prediction across India
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Outbreaks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-600">+2 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Districts</CardTitle>
            <MapPin className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-gray-600">Across 8 states</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RRT Deployed</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600">Teams active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-gray-600">2-4 week forecast</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* India Disease Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>India Disease Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <IndiaHeatmap />
          </CardContent>
        </Card>

        {/* Outbreak Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Outbreak Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <OutbreakAlerts />
          </CardContent>
        </Card>

        {/* Outbreak Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Outbreak Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OutbreakTimeline />
          </CardContent>
        </Card>
      </div>

      {/* Additional Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceAllocation />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Syndromic Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <SyndromicTrends />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media Scanning</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaScanning />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
