'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import NotificationBanner, { AlertNotification } from '@/components/NotificationBanner';
import Modal from '@/components/Modal';
import { ApiClient } from '@/lib/api';
import { HostedZoneDetail, DnsRecord } from '@/lib/types';
import { 
  Plus, Search, RefreshCw, Trash2, Edit2, 
  Upload, Download, CheckSquare, Square, 
  ChevronLeft, ChevronRight, Info, AlertTriangle, ArrowLeft 
} from 'lucide-react';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'];

export default function HostedZoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params.id as string;

  const [zone, setZone] = useState<HostedZoneDetail | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<AlertNotification | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);

  // Record Form States
  const [recordName, setRecordName] = useState('');
  const [recordType, setRecordType] = useState('A');
  const [ttl, setTtl] = useState(300);
  const [routingPolicy, setRoutingPolicy] = useState('Simple');
  const [recordValues, setRecordValues] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchZoneData = async () => {
    setLoading(true);
    try {
      const zoneData = await ApiClient.getHostedZone(zoneId);
      setZone(zoneData);
      const recs = await ApiClient.getZoneRecords(zoneId, searchQuery, typeFilter);
      setRecords(recs);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to fetch hosted zone' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zoneId) fetchZoneData();
  }, [zoneId, typeFilter]);

  // Keyboard shortcut listener ('c' create, '/' search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setRecordName('');
        setRecordValues('');
        setCreateModalOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('record-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchZoneData();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRecords.map((r) => r.id));
    }
  };

  const toggleSelectRecord = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const values = recordValues
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await ApiClient.createRecord(zoneId, {
        name: recordName,
        type: recordType,
        ttl: Number(ttl),
        routing_policy: routingPolicy,
        records: values,
      });

      setNotification({ type: 'success', message: `Successfully created ${recordType} record` });
      setCreateModalOpen(false);
      setRecordName('');
      setRecordValues('');
      fetchZoneData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to create record' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setActionLoading(true);

    const values = recordValues
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await ApiClient.updateRecord(editingRecord.id, {
        ttl: Number(ttl),
        routing_policy: routingPolicy,
        records: values,
      });

      setNotification({ type: 'success', message: `Record ${editingRecord.name} successfully updated` });
      setEditModalOpen(false);
      fetchZoneData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update record' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await ApiClient.bulkDeleteRecords(selectedIds);
      setNotification({ type: 'success', message: `Deleted ${selectedIds.length} record(s)` });
      setSelectedIds([]);
      setDeleteModalOpen(false);
      fetchZoneData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete record(s)' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportBind = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setActionLoading(true);
    try {
      const res = await ApiClient.importBindFile(zoneId, file);
      setNotification({ type: 'success', message: res.message });
      setImportModalOpen(false);
      fetchZoneData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to import zone file' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRecords = records;
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <NotificationBanner notification={notification} onClose={() => setNotification(null)} />

      {/* Zone Details Summary Card */}
      <div className="mb-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Hosted zones', href: '/hosted-zones' },
            { label: zone?.name || 'Zone Details' },
          ]}
          title={zone?.name || 'Hosted zone'}
          description={`Hosted zone ID: ${zone?.id || ''} | ${zone?.type || ''}`}
          actions={
            <div className="flex items-center space-x-2">
              <a
                href={ApiClient.getExportUrl(zoneId, 'bind')}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export BIND</span>
              </a>
              <a
                href={ApiClient.getExportUrl(zoneId, 'json')}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </a>
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center space-x-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import zone file</span>
              </button>
            </div>
          }
        />

        {/* Zone metadata banner */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block font-medium">Zone ID</span>
            <span className="font-mono text-gray-900 dark:text-gray-100 font-semibold">{zone?.id}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block font-medium">Type</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{zone?.type}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block font-medium">Total Records</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{records.length}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block font-medium">Comment</span>
            <span className="text-gray-700 dark:text-gray-300 truncate block">{zone?.comment || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Records Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
        {/* Table Actions Header */}
        <div className="p-3.5 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50 dark:bg-slate-900/50">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                id="record-search-input"
                type="text"
                placeholder="Search records by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-blue focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 border border-gray-300 dark:border-slate-700 rounded transition"
            >
              Search
            </button>
          </form>

          <div className="flex items-center space-x-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-blue focus:outline-none"
            >
              <option value="">All record types</option>
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (selectedIds.length === 1) {
                  const rec = records.find((r) => r.id === selectedIds[0]);
                  if (rec) {
                    setEditingRecord(rec);
                    setTtl(rec.ttl);
                    setRoutingPolicy(rec.routing_policy);
                    setRecordValues(rec.records.join('\n'));
                    setEditModalOpen(true);
                  }
                }
              }}
              disabled={selectedIds.length !== 1}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Edit record
            </button>

            <button
              onClick={() => setDeleteModalOpen(true)}
              disabled={selectedIds.length === 0}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => {
                setRecordName('');
                setRecordValues('');
                setCreateModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-aws-orange hover:bg-aws-orangeHover text-white rounded shadow-sm transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create record</span>
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100/75 dark:bg-slate-800/60 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-slate-800 font-semibold select-none">
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-gray-500 hover:text-gray-700">
                    {selectedIds.length > 0 && selectedIds.length === paginatedRecords.length ? (
                      <CheckSquare className="w-4 h-4 text-aws-blue" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Record name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Routing policy</th>
                <th className="p-3">TTL (seconds)</th>
                <th className="p-3">Value/Route traffic to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-aws-blue" />
                      <span>Loading DNS records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No records found in this hosted zone.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  const isProtected = (r.type === 'NS' || r.type === 'SOA') && r.name === zone?.name;
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-blue-50/70 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectRecord(r.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-aws-blue" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                        {r.name}
                      </td>
                      <td className="p-3 font-mono font-medium text-aws-blue dark:text-blue-400">
                        {r.type}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{r.routing_policy}</td>
                      <td className="p-3 font-mono">{r.ttl}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300 font-mono text-[11px] max-w-md">
                        {r.records.map((val, idx) => (
                          <div key={idx} className="truncate">
                            {val}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            Showing {filteredRecords.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-gray-300 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-gray-700 dark:text-gray-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-gray-300 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Record */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create record" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Record name
              </label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="e.g. www, api, or leave empty"
                  value={recordName}
                  onChange={(e) => setRecordName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-r-0 border-gray-300 dark:border-slate-700 rounded-l focus:border-aws-orange focus:outline-none"
                />
                <span className="inline-flex items-center px-3 bg-gray-100 dark:bg-slate-700 text-gray-500 border border-gray-300 dark:border-slate-700 rounded-r text-[11px] truncate">
                  .{zone?.name}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Record type</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t} - {getRecordTypeDescription(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">TTL (Seconds)</label>
              <input
                type="number"
                min="0"
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Routing policy</label>
              <select
                value={routingPolicy}
                onChange={(e) => setRoutingPolicy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
              >
                <option value="Simple">Simple routing</option>
                <option value="Weighted">Weighted</option>
                <option value="Latency">Latency</option>
                <option value="Failover">Failover</option>
                <option value="Geolocation">Geolocation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder={getPlaceholderForType(recordType)}
              value={recordValues}
              onChange={(e) => setRecordValues(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">Enter each value on a new line.</p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-aws-orange hover:bg-aws-orangeHover text-white rounded font-medium disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Create records'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Record */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit record" maxWidth="max-w-2xl">
        <form onSubmit={handleEditRecord} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Record name</label>
            <input
              type="text"
              disabled
              value={editingRecord?.name || ''}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded opacity-75 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">TTL (Seconds)</label>
              <input
                type="number"
                min="0"
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Routing policy</label>
              <select
                value={routingPolicy}
                onChange={(e) => setRoutingPolicy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
              >
                <option value="Simple">Simple routing</option>
                <option value="Weighted">Weighted</option>
                <option value="Latency">Latency</option>
                <option value="Failover">Failover</option>
                <option value="Geolocation">Geolocation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
            <textarea
              required
              rows={4}
              value={recordValues}
              onChange={(e) => setRecordValues(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-aws-orange hover:bg-aws-orangeHover text-white rounded font-medium disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Record Deletion */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete record(s)">
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete <span className="font-bold text-red-600">{selectedIds.length}</span> record(s)?
            Traffic routed using these records will no longer resolve.
          </p>
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Delete records'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Import BIND File */}
      <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import DNS records from BIND zone file">
        <form onSubmit={handleImportBind} className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-400">
            Upload a standard RFC 1035 BIND zone file. The records will be parsed and imported directly into this hosted zone.
          </p>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              required
              accept=".zone,.txt,.bind"
              className="w-full text-xs text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-aws-blue hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-aws-orange hover:bg-aws-orangeHover text-white rounded font-medium disabled:opacity-50"
            >
              {actionLoading ? 'Importing...' : 'Upload & Import'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function getRecordTypeDescription(type: string): string {
  switch (type) {
    case 'A': return 'Routes traffic to an IPv4 address';
    case 'AAAA': return 'Routes traffic to an IPv6 address';
    case 'CNAME': return 'Routes traffic to another domain name';
    case 'TXT': return 'Can be used to verify domain ownership or SPF';
    case 'MX': return 'Routes traffic to mail servers';
    case 'NS': return 'Name servers for the zone';
    case 'PTR': return 'Maps an IP to a domain name';
    case 'SRV': return 'Service record specifying host and port';
    case 'CAA': return 'Certificate Authority Authorization';
    default: return '';
  }
}

function getPlaceholderForType(type: string): string {
  switch (type) {
    case 'A': return '192.0.2.1\n198.51.100.2';
    case 'AAAA': return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    case 'CNAME': return 'elb-endpoint.amazonaws.com';
    case 'MX': return '10 mail.example.com\n20 backupmail.example.com';
    case 'TXT': return '"v=spf1 include:amazonses.com ~all"';
    case 'SRV': return '10 60 5060 bigbox.example.com';
    case 'CAA': return '0 issue "letsencrypt.org"';
    default: return 'Enter values...';
  }
}
