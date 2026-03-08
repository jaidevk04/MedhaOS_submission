'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueueStore } from '@/store/queueStore';
import { PatientQueueCard, EmergencyAlertPanel, QueueFilters } from '@/components/queue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, Clock, AlertCircle } from 'lucide-react';
import type { QueuePatient } from '@/types/patient';

export default function QueuePage() {
  const router = useRouter();
  const {
    patients,
    filter,
    sortBy,
    searchQuery,
    isLoading,
    error,
    lastUpdated,
    fetchQueue,
    fetchAlerts,
  } = useQueueStore();

  useEffect(() => {
    fetchQueue();
    fetchAlerts();

    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(() => {
      fetchQueue();
      fetchAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchQueue, fetchAlerts]);

  const filteredAndSortedPatients = useMemo(() => {
    let filtered = [...patients];

    // Apply filter
    switch (filter) {
      case 'waiting':
        filtered = filtered.filter((p) => p.status === 'waiting');
        break;
      case 'critical':
        filtered = filtered.filter((p) => p.urgency_score >= 70);
        break;
      case 'urgent':
        filtered = filtered.filter((p) => p.urgency_score >= 40 && p.urgency_score < 70);
        break;
      case 'routine':
        filtered = filtered.filter((p) => p.urgency_score < 40);
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.patient.demographics.name.toLowerCase().includes(query) ||
          p.patient.patient_id.toLowerCase().includes(query) ||
          p.patient.abha_id?.toLowerCase().includes(query) ||
          p.chief_complaint.toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          return b.urgency_score - a.urgency_score;
        case 'wait_time':
          return (
            new Date(a.triage_data.triage_timestamp).getTime() -
            new Date(b.triage_data.triage_timestamp).getTime()
          );
        case 'arrival_time':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, filter, sortBy, searchQuery]);

  const stats = useMemo(() => {
    const total = patients.length;
    const critical = patients.filter((p: QueuePatient) => p.urgency_score >= 70).length;
    const urgent = patients.filter((p: QueuePatient) => p.urgency_score >= 40 && p.urgency_score < 70).length;
    const avgWaitTime =
      patients.length > 0
        ? Math.round(
            patients.reduce((sum: number, p: QueuePatient) => {
              const waitMinutes = Math.floor(
                (new Date().getTime() - new Date(p.triage_data.triage_timestamp).getTime()) /
                  60000
              );
              return sum + waitMinutes;
            }, 0) / patients.length
          )
        : 0;

    return { total, critical, urgent, avgWaitTime };
  }, [patients]);

  const handleRefresh = () => {
    fetchQueue();
    fetchAlerts();
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Queue</h1>
          <p className="text-gray-600 mt-1">
            Real-time patient queue with urgency-based prioritization
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">In queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Critical Cases
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-gray-500 mt-1">Urgency ≥ 70</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Urgent Cases
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.urgent}</div>
            <p className="text-xs text-gray-500 mt-1">Urgency 40-69</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Wait Time
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgWaitTime}m</div>
            <p className="text-xs text-gray-500 mt-1">Current average</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Error loading queue</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Patient Queue</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Last updated: {formatLastUpdated()}</span>
                  {isLoading && (
                    <Badge variant="outline" className="animate-pulse">
                      Updating...
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <QueueFilters />

              {filteredAndSortedPatients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    {searchQuery
                      ? 'No patients match your search'
                      : 'No patients in queue'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedPatients.map((patient) => (
                    <PatientQueueCard
                      key={patient.encounter_id}
                      patient={patient}
                      onClick={() => {
                        router.push(`/dashboard/consultation/${patient.encounter_id}`);
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Emergency Alerts */}
        <div>
          <EmergencyAlertPanel />
        </div>
      </div>
    </div>
  );
}
