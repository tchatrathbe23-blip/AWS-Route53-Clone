import PlaceholderView from '@/components/PlaceholderView';
import { GitFork } from 'lucide-react';

export default function ResolverPage() {
  return (
    <PlaceholderView
      title="Route 53 Resolver"
      icon={GitFork}
      description="Recursively resolve DNS queries across hybrid clouds and AWS VPC environments with custom conditional forwarding rules."
    />
  );
}
