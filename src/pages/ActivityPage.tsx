import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ActivitySquare, Users, Car, User } from 'lucide-react';
import { useActivityLog } from '../hooks/useActivityLog';
import { useOrg } from '../context/OrgContext';
import { SearchBar, SelectFilter } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { TableRowSkeleton } from '../components/ui/LoadingSkeleton';
import { formatDateTime, timeAgo } from '../utils';

const entityColors: Record<string, string> = {
  driver: 'bg-primary-500',
  vehicle: 'bg-secondary-500',
  user: 'bg-success',
  org: 'bg-warning',
};

const entityIcons: Record<string, React.ElementType> = {
  driver: Users,
  vehicle: Car,
  user: User,
  org: ActivitySquare,
};

const entityLabels: Record<string, string> = {
  driver: 'Sürücü',
  vehicle: 'Araç',
  user: 'Kullanıcı',
  org: 'Kurum',
};

export const ActivityPage: React.FC = () => {
  const { currentOrg } = useOrg();
  const { logs, loading } = useActivityLog(currentOrg?.id, 200);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const filtered = useMemo(() => {
    let result = [...logs];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.action.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.performedBy.toLowerCase().includes(q)
      );
    }
    if (entityFilter) result = result.filter(l => l.entityType === entityFilter);
    return result;
  }, [logs, search, entityFilter]);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Aktivite Günlüğü</h1>
          <p className="text-sm text-white/40 mt-1">{filtered.length} kayıt · {currentOrg?.name}</p>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Aktivite ara..." className="flex-1 min-w-48" />
        <SelectFilter
          value={entityFilter}
          onChange={setEntityFilter}
          options={[
            { value: 'driver', label: 'Sürücüler' },
            { value: 'vehicle', label: 'Araçlar' },
            { value: 'org', label: 'Kurum' },
          ]}
          placeholder="Tüm Türler"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {['Tür', 'İşlem', 'Açıklama', 'Kim Yaptı', 'Zaman'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}>
                  <EmptyState icon={ActivitySquare} title="Aktivite bulunamadı" />
                </td></tr>
              ) : (
                filtered.map((log, idx) => {
                  const Icon = entityIcons[log.entityType] || ActivitySquare;
                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="table-row-hover"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${entityColors[log.entityType] || 'bg-white/10'}/20`}>
                            <Icon size={12} className="text-white/60" />
                          </div>
                          <span className="text-xs text-white/50">
                            {entityLabels[log.entityType] || log.entityType}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${entityColors[log.entityType] || 'bg-white/30'}`} />
                          <span className="text-sm font-medium text-white">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/50 max-w-xs truncate">{log.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/60">{log.performedBy}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white/50">{timeAgo(log.timestamp)}</p>
                        <p className="text-[10px] text-white/25">{formatDateTime(log.timestamp as Date)}</p>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
