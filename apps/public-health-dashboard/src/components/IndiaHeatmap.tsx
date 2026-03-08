'use client';

import { useState } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';

interface DistrictData {
  id: string;
  name: string;
  state: string;
  cases: number;
  risk: 'low' | 'moderate' | 'high' | 'critical';
  x: number;
  y: number;
}

const mockDistricts: DistrictData[] = [
  { id: '1', name: 'Mumbai', state: 'Maharashtra', cases: 234, risk: 'critical', x: 35, y: 55 },
  { id: '2', name: 'Kolkata', state: 'West Bengal', cases: 156, risk: 'high', x: 75, y: 45 },
  { id: '3', name: 'Delhi', state: 'Delhi NCR', cases: 89, risk: 'moderate', x: 50, y: 25 },
  { id: '4', name: 'Bangalore', state: 'Karnataka', cases: 178, risk: 'high', x: 45, y: 75 },
  { id: '5', name: 'Chennai', state: 'Tamil Nadu', cases: 123, risk: 'high', x: 55, y: 80 },
  { id: '6', name: 'Hyderabad', state: 'Telangana', cases: 98, risk: 'moderate', x: 50, y: 65 },
  { id: '7', name: 'Pune', state: 'Maharashtra', cases: 145, risk: 'high', x: 40, y: 58 },
  { id: '8', name: 'Jaipur', state: 'Rajasthan', cases: 67, risk: 'moderate', x: 42, y: 30 },
];

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'moderate': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

export function IndiaHeatmap() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const selected = selectedDistrict ? mockDistricts.find(d => d.id === selectedDistrict) : null;

  return (
    <div className="relative h-[500px] w-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
      {/* Simplified India Map Visualization */}
      <div className="relative w-full h-full p-8">
        {/* Map outline (simplified India shape) */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
          <path
            d="M 50 10 L 60 15 L 70 20 L 75 30 L 80 45 L 75 60 L 70 75 L 60 85 L 50 90 L 40 85 L 30 75 L 25 60 L 20 45 L 25 30 L 30 20 L 40 15 Z"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.5"
          />
        </svg>

        {/* District markers */}
        {mockDistricts.map((district) => (
          <div
            key={district.id}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${district.x}%`, top: `${district.y}%` }}
            onClick={() => setSelectedDistrict(district.id)}
          >
            {/* Pulsing effect for critical/high risk */}
            {(district.risk === 'critical' || district.risk === 'high') && (
              <div className={`absolute inset-0 ${getRiskColor(district.risk)} rounded-full animate-ping opacity-75`} />
            )}
            
            {/* Main marker */}
            <div className={`relative w-6 h-6 ${getRiskColor(district.risk)} rounded-full shadow-lg flex items-center justify-center transition-transform group-hover:scale-125`}>
              <MapPin className="w-4 h-4 text-white" />
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {district.name}: {district.cases} cases
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Risk Level</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-xs text-gray-700">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-xs text-gray-700">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-xs text-gray-700">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-700">Low</span>
          </div>
        </div>
      </div>

      {/* Selected District Info */}
      {selected && (
        <div className="absolute top-4 right-4 w-64 bg-white rounded-lg p-4 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{selected.name}</h3>
              <p className="text-sm text-gray-600">{selected.state}</p>
            </div>
            <button
              onClick={() => setSelectedDistrict(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Risk Level:</span>
              <span className={`px-2 py-1 text-xs font-semibold capitalize rounded-full ${
                selected.risk === 'critical' ? 'bg-red-100 text-red-800' :
                selected.risk === 'high' ? 'bg-orange-100 text-orange-800' :
                selected.risk === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selected.risk}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Cases:</span>
              <span className="font-semibold text-gray-900">{selected.cases}</span>
            </div>

            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>Outbreak monitoring active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
