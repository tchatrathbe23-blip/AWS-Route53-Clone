import { HostedZone, HostedZoneDetail, DnsRecord, User } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('route53_token');
    }
    return null;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      try {
        const data = await response.json();
        if (data.detail) {
          errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        }
      } catch (e) {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    // Check if json
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return (await response.text()) as unknown as T;
  }

  // Auth
  static async login(username: string, password: string, account_id?: string): Promise<{ access_token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, account_id: account_id || '123456789012' }),
    });
  }

  static async getMe(): Promise<User> {
    return this.request('/auth/me');
  }

  // Hosted Zones
  static async getHostedZones(search?: string, type?: string): Promise<HostedZone[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/hosted-zones${query}`);
  }

  static async getHostedZone(id: string): Promise<HostedZoneDetail> {
    return this.request(`/hosted-zones/${id}`);
  }

  static async createHostedZone(data: { name: string; type: string; comment?: string; vpc_id?: string }): Promise<HostedZone> {
    return this.request('/hosted-zones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateHostedZone(id: string, data: { comment?: string }): Promise<HostedZone> {
    return this.request(`/hosted-zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteHostedZone(id: string): Promise<{ message: string }> {
    return this.request(`/hosted-zones/${id}`, {
      method: 'DELETE',
    });
  }

  static async bulkDeleteHostedZones(zone_ids: string[]): Promise<{ message: string }> {
    return this.request('/hosted-zones/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ zone_ids }),
    });
  }

  static getExportUrl(zone_id: string, format: 'json' | 'bind'): string {
    return `${API_BASE_URL}/hosted-zones/${zone_id}/export?format=${format}`;
  }

  // DNS Records
  static async getZoneRecords(zoneId: string, search?: string, type?: string): Promise<DnsRecord[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/records/zone/${zoneId}${query}`);
  }

  static async createRecord(zoneId: string, data: {
    name: string;
    type: string;
    ttl: number;
    routing_policy?: string;
    weight?: number;
    records: string[];
    is_alias?: boolean;
    alias_target?: string;
  }): Promise<DnsRecord> {
    return this.request(`/records/zone/${zoneId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateRecord(recordId: string, data: {
    ttl?: number;
    routing_policy?: string;
    records?: string[];
  }): Promise<DnsRecord> {
    return this.request(`/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteRecord(recordId: string): Promise<{ message: string }> {
    return this.request(`/records/${recordId}`, {
      method: 'DELETE',
    });
  }

  static async bulkDeleteRecords(record_ids: string[]): Promise<{ message: string }> {
    return this.request('/records/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ record_ids }),
    });
  }

  static async importBindFile(zoneId: string, file: File): Promise<{ message: string; imported_records_count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/records/zone/${zoneId}/import-bind`, {
      method: 'POST',
      body: formData,
    });
  }
}
