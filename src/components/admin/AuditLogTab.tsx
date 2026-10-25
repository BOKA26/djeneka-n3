import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  User,
  Database,
  ArrowRight,
  X,
} from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { auditApi } from '../../services/api';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export const AuditLogTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [tableFilter, setTableFilter] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditApi.getLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.record_id && log.record_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesTable = tableFilter === 'ALL' || log.table_name === tableFilter;

    return matchesSearch && matchesAction && matchesTable;
  });

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT':
        return '+ CRÉATION';
      case 'UPDATE':
        return 'MODIFICATION';
      case 'DELETE':
        return 'SUPPRESSION';
      default:
        return action;
    }
  };

  // Collect unique tables for filter
  const tables = Array.from(new Set(logs.map((l) => l.table_name)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1B2A6B] flex items-center gap-2">
            <History className="w-6 h-6 text-[#D62828]" />
            Journal d'Activité & Audit
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Traçabilité intégrale de toutes les opérations effectuées par les administrateurs et le personnel.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={loadLogs}
          disabled={loading}
        >
          Actualiser
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par table, email ou identifiant..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white cursor-pointer"
          >
            <option value="ALL">Toutes les actions</option>
            <option value="INSERT">Créations (INSERT)</option>
            <option value="UPDATE">Modifications (UPDATE)</option>
            <option value="DELETE">Suppressions (DELETE)</option>
          </select>

          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white cursor-pointer"
          >
            <option value="ALL">Toutes les tables</option>
            {tables.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1B2A6B]" />
            <p>Chargement des logs d'audit...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-700">Aucun événement d'audit trouvé</h4>
            <p className="text-xs text-slate-400 mt-1">
              Les modifications de données sensibles seront automatiquement consignées ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Table / Module</th>
                  <th className="py-3 px-4">ID Enregistrement</th>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-sans">
                      {new Date(log.created_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {log.table_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[140px]" title={log.record_id || ''}>
                      {log.record_id ? `${log.record_id.slice(0, 10)}...` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans truncate max-w-[180px]">
                      {log.user_email || log.user_id ? (
                        <span className="flex items-center gap-1.5" title={log.user_email || log.user_id}>
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{log.user_email || log.user_id?.slice(0, 8)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Système / SQL</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5 text-[#1B2A6B]" />}
                        onClick={() => setSelectedEntry(log)}
                      >
                        Examiner
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={`Audit : ${selectedEntry.action} sur ${selectedEntry.table_name}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Horodatage :</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedEntry.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Opérateur :</span>
                <span className="font-semibold text-slate-800">
                  {selectedEntry.user_email || selectedEntry.user_id || 'Système'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Table cible :</span>
                <span className="font-mono text-slate-800 font-semibold">{selectedEntry.table_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ID Enregistrement :</span>
                <span className="font-mono text-slate-800 text-[11px] truncate block" title={selectedEntry.record_id || ''}>
                  {selectedEntry.record_id || '-'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State Before */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    État Avant
                  </span>
                  {selectedEntry.avant ? (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">
                      Donnée d'origine
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Néant (Création)</span>
                  )}
                </div>
                <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] max-h-64 overflow-y-auto overflow-x-auto whitespace-pre-wrap">
                  {selectedEntry.avant
                    ? JSON.stringify(selectedEntry.avant, null, 2)
                    : '// Aucun état antérieur (nouvel enregistrement)'}
                </div>
              </div>

              {/* State After */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    État Après
                  </span>
                  {selectedEntry.apres ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                      Nouvelle donnée
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Néant (Supprimé)</span>
                  )}
                </div>
                <div className="bg-slate-900 text-blue-400 p-3 rounded-xl font-mono text-[11px] max-h-64 overflow-y-auto overflow-x-auto whitespace-pre-wrap">
                  {selectedEntry.apres
                    ? JSON.stringify(selectedEntry.apres, null, 2)
                    : '// Enregistrement supprimé'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedEntry(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
