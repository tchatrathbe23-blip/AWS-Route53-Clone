import PlaceholderView from '@/components/PlaceholderView';
import { Layers } from 'lucide-react';

export default function ProfilesPage() {
  return (
    <PlaceholderView
      title="Route 53 Profiles"
      icon={Layers}
      description="Manage and share DNS configurations, private hosted zones, and Resolver rules across multiple AWS accounts."
    />
  );
}
