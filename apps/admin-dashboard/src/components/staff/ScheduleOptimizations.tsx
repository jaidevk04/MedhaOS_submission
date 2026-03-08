import { Sparkles, ArrowRight } from 'lucide-react';
import { ScheduleOptimization } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ScheduleOptimizationsProps {
  optimizations: ScheduleOptimization[];
}

export function ScheduleOptimizations({ optimizations }: ScheduleOptimizationsProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Schedule Optimization Suggestions
          </h3>
          <p className="text-sm text-gray-600">
            AI-powered staffing recommendations
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {optimizations.map((opt) => (
          <div
            key={opt.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{opt.department}</h4>
                  <Badge
                    variant={
                      opt.implementationEffort === 'low'
                        ? 'success'
                        : opt.implementationEffort === 'medium'
                        ? 'warning'
                        : 'critical'
                    }
                  >
                    {opt.implementationEffort.toUpperCase()} EFFORT
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">{opt.suggestion}</p>
                <p className="text-xs text-success font-medium">
                  ✓ {opt.expectedBenefit}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="primary">
                Apply Suggestion <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
