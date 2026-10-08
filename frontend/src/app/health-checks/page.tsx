import PlaceholderView from '@/components/PlaceholderView';
import { Activity } from 'lucide-react';

export default function HealthChecksPage() {
  return (
    <PlaceholderView
      title="Health Checks"
      icon={Activity}
      description="Monitor the health and performance of your application endpoints and automatically route traffic away from unhealthy resources."
    />
  );
}
