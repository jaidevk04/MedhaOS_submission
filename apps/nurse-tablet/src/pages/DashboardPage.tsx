import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, Pill, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Tasks',
      description: 'View and manage patient tasks',
      icon: ClipboardList,
      path: '/tasks',
      color: 'bg-primary-100 text-primary-600',
    },
    {
      title: 'Patients',
      description: 'View assigned patients',
      icon: Users,
      path: '/patients',
      color: 'bg-success/10 text-success',
    },
    {
      title: 'Medications',
      description: 'Administer medications',
      icon: Pill,
      path: '/medication',
      color: 'bg-warning/10 text-warning',
    },
    {
      title: 'Communication',
      description: 'Messages and handoffs',
      icon: MessageSquare,
      path: '/communication',
      color: 'bg-info/10 text-info',
    },
  ];

  return (
    <div className="h-full p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Select an action to continue.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(action.path)}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                  <action.icon className="w-8 h-8" />
                </div>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
