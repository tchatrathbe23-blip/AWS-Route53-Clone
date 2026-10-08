'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import NotificationBanner, { AlertNotification } from '@/components/NotificationBanner';
import Modal from '@/components/Modal';
import { ApiClient } from '@/lib/api';
import { HostedZone } from '@/lib/types';
import { 
  Plus, Search, RefreshCw, Trash2, Edit2, 
  ExternalLink, Download, CheckSquare, Square, 
  Globe, Info, ArrowUpDown, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function HostedZonesPage() {
  const [zones, setZones] = useState<HostedZone[]>([]);
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
  const [editingZone, setEditingZone] = useState<HostedZone | null>(null);

  // Form states
  const [domainName, setDomainName] = useState('');
  const [zoneType, setZoneType] = useState('Public hosted zone');
  const [description, setDescription] = useState('');
  const [vpcId, setVpcId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getHostedZones(searchQuery, typeFilter);
      setZones(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load hosted zones' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [typeFilter]);

  // Keyboard shortcut listener ('/' for search, 'c' for create)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setCreateModalOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('zone-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchZones();
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedZones.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedZones.map((z) => z.id));
    }
  };

  const toggleSelectZone = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const newZone = await ApiClient.createHostedZone({
        name: domainName,
        type: zoneType,
        comment: description,
        vpc_id: zoneType.includes('Private') ? vpcId : undefined,
      });
      setNotification({ type: 'success', message: `Successfully created hosted zone ${newZone.name}` });
      setCreateModalOpen(false);
      setDomainName('');
      setDescription('');
      fetchZones();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to create hosted zone' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;
    setActionLoading(true);
    try {
      await ApiClient.updateHostedZone(editingZone.id, { comment: description });
      setNotification({ type: 'success', message: `Successfully updated hosted zone ${editingZone.name}` });
      setEditModalOpen(false);
      fetchZones();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update hosted zone' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await ApiClient.bulkDeleteHostedZones(selectedIds);
      setNotification({ type: 'success', message: `Successfully deleted ${selectedIds.length} hosted zone(s)` });
      setSelectedIds([]);
      setDeleteModalOpen(false);
      fetchZones();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete hosted zone(s)' });
    } finally {
      setActionLoading(false);
    }
  };

  // Pagination logic
  const filteredZones = zones;
  const totalPages = Math.ceil(filteredZones.length / itemsPerPage) || 1;
  const paginatedZones = filteredZones.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <NotificationBanner notification={notification} onClose={() => setNotification(null)} />

      <PageHeader
        breadcrumbs={[{ label: 'Hosted zones' }]}
        title="Hosted zones"
        description="A hosted zone contains records that define how you want traffic to be routed for a domain and its subdomains."
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (selectedIds.length === 1) {
                  const z = zones.find((x) => x.id === selectedIds[0]);
                  if (z) {
                    setEditingZone(z);
                    setDescription(z.comment || '');
                    setEditModalOpen(true);
                  }
                }
              }}
              disabled={selectedIds.length !== 1}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Edit zone
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
              onClick={() => setCreateModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-aws-orange hover:bg-aws-orangeHover text-white rounded shadow-sm transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create hosted zone</span>
            </button>
          </div>
        }
      />

      {/* Cloudscape Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
        {/* Table Controls / Filters */}
        <div className="p-3.5 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50 dark:bg-slate-900/50">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                id="zone-search-input"
                type="text"
                placeholder="Find hosted zones by domain name..."
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
              <option value="">All zone types</option>
              <option value="Public hosted zone">Public hosted zone</option>
              <option value="Private hosted zone">Private hosted zone</option>
            </select>
            <button
              onClick={fetchZones}
              title="Refresh"
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100/75 dark:bg-slate-800/60 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-slate-800 font-semibold select-none">
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-gray-500 hover:text-gray-700">
                    {selectedIds.length > 0 && selectedIds.length === paginatedZones.length ? (
                      <CheckSquare className="w-4 h-4 text-aws-blue" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Domain name</th>
                <th className="p-3">Hosted zone ID</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Record count</th>
                <th className="p-3">Comment / Description</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-aws-blue" />
                      <span>Loading hosted zones...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedZones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No hosted zones found matching your query.
                  </td>
                </tr>
              ) : (
                paginatedZones.map((zone) => {
                  const isSelected = selectedIds.includes(zone.id);
                  return (
                    <tr
                      key={zone.id}
                      className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-blue-50/70 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button onClick={() => toggleSelectZone(zone.id)} className="text-gray-400 hover:text-gray-600">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-aws-blue" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-semibold">
                        <Link
                          href={`/hosted-zones/${zone.id}`}
                          className="text-aws-blue dark:text-blue-400 hover:underline flex items-center space-x-1"
                        >
                          <span>{zone.name}</span>
                        </Link>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-600 dark:text-gray-400">{zone.id}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                            zone.type.includes('Public')
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {zone.type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">{zone.record_count}</td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{zone.comment || '—'}</td>
                      <td className="p-3 text-gray-500 text-[11px]">
                        {new Date(zone.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            Showing {filteredZones.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredZones.length)} of {filteredZones.length} hosted zones
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

      {/* Modal: Create Hosted Zone */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create hosted zone">
        <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Domain name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="example.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">Enter a fully qualified domain name (FQDN).</p>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Description - optional</label>
            <textarea
              rows={2}
              placeholder="Internal domain or web app records"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <div className="space-y-2">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="Public hosted zone"
                  checked={zoneType === 'Public hosted zone'}
                  onChange={(e) => setZoneType(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Public hosted zone</div>
                  <div className="text-[11px] text-gray-500">
                    Determines how traffic is routed on the Internet.
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="Private hosted zone"
                  checked={zoneType === 'Private hosted zone'}
                  onChange={(e) => setZoneType(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Private hosted zone</div>
                  <div className="text-[11px] text-gray-500">
                    Determines how traffic is routed within an Amazon VPC.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {zoneType.includes('Private') && (
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">VPC ID</label>
              <input
                type="text"
                placeholder="vpc-0a1b2c3d4e5f67890"
                value={vpcId}
                onChange={(e) => setVpcId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
              />
            </div>
          )}

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
              {actionLoading ? 'Creating...' : 'Create hosted zone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Hosted Zone */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit hosted zone">
        <form onSubmit={handleEditZone} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Domain name</label>
            <input
              type="text"
              disabled
              value={editingZone?.name || ''}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded opacity-75 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded focus:border-aws-orange focus:outline-none"
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

      {/* Modal: Confirm Bulk Delete */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete hosted zone(s)">
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete <span className="font-bold text-red-600">{selectedIds.length}</span> selected hosted zone(s)?
            All associated records in these zones will be permanently removed.
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
              {actionLoading ? 'Deleting...' : 'Confirm delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
