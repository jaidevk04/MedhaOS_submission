import { AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Bottleneck, Recommendation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BottlenecksAndRecommendationsProps {
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
}

export function BottlenecksAndRecommendations({
  bottlenecks,
  recommendations,
}: BottlenecksAndRecommendationsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bottlenecks */}
      <div className="bg-white rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-error" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Identified Bottlenecks
            </h3>
            <p className="text-sm text-gray-600">
              {bottlenecks.length} areas need attention
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {bottlenecks.map((bottleneck) => (
            <div
              key={bottleneck.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{bottleneck.area}</h4>
                <Badge
                  variant={
                    bottleneck.severity === 'high'
                      ? 'critical'
                      : bottleneck.severity === 'medium'
                      ? 'warning'
                      : 'info'
                  }
                >
                  {bottleneck.severity.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {bottleneck.description}
              </p>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Impact:</span> {bottleneck.impact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Optimization Recommendations
            </h3>
            <p className="text-sm text-gray-600">
              AI-powered process improvements
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <Badge
                      variant={
                        rec.priority === 'high'
                          ? 'critical'
                          : rec.priority === 'medium'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{rec.category}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-success font-medium">
                  {rec.expectedImpact}
                </p>
                <Button size="sm" variant="outline">
                  Implement <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
