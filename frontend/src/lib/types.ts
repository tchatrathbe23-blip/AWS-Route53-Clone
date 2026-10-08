export interface User {
  id: string;
  username: string;
  email: string;
  account_id: string;
  created_at: string;
}

export interface HostedZone {
  id: string;
  name: string;
  type: string;
  comment?: string;
  vpc_id?: string;
  vpc_region?: string;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DnsRecord {
  id: string;
  hosted_zone_id: string;
  name: string;
  type: string;
  ttl: number;
  routing_policy: string;
  weight?: number;
  health_check_id?: string;
  is_alias: boolean;
  alias_target?: string;
  records: string[];
  created_at: string;
  updated_at: string;
}

export interface HostedZoneDetail extends HostedZone {
  records: DnsRecord[];
}
