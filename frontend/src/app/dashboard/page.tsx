import PlaceholderView from '@/components/PlaceholderView';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <PlaceholderView
      title="Dashboard"
      icon={LayoutDashboard}
      description="Route 53 Global DNS overview, query metrics, active hosted zones, and registered domains summary."
    />
  );
}
