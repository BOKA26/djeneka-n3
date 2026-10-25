import React from 'react';
import { Intervention } from '../../types';
import { formatFCFA } from '../../utils/format';
import { Wrench, Calendar, Gauge, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { useToast } from '../../context/ToastContext';

interface TimelineProps {
  interventions: Intervention[];
  currentMileage: number;
  nextServiceMileage: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  interventions,
  currentMileage,
  nextServiceMileage,
}) => {
  const { showToast } = useToast();

  const handleDownloadInvoice = (inv: Intervention) => {
    showToast(
      `Téléchargement de la facture #${inv.id} (${inv.vehicleName} - ${inv.date}) en cours...`,
      'info'
    );
  };

  const kmRemaining = Math.max(0, nextServiceMileage - currentMileage);
  const progressPercent = Math.min(100, Math.round(((7000 - kmRemaining) / 7000) * 100));

  return (
    <div className="space-y-6">
      {/* Next Service Mileage Indicator */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Statut de Maintenance
            </span>
            <div className="flex items-center gap-2 mt-1">
              <h4 className="text-base font-bold text-slate-900">
                Prochaine vidange recommandée :
              </h4>
              <Badge variant={kmRemaining <= 1000 ? 'danger' : kmRemaining <= 2500 ? 'warning' : 'success'}>
                {kmRemaining > 0 ? `dans ${kmRemaining.toLocaleString('fr-FR')} km` : 'Échéance dépassée !'}
              </Badge>
            </div>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-xs text-slate-500">Kilométrage actuel</span>
            <p className="text-lg font-bold text-[#1B2A6B]">{currentMileage.toLocaleString('fr-FR')} km</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 85
                ? 'bg-[#D62828]'
                : progressPercent >= 60
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
          <span>Dernière révision</span>
          <span>Cible : {nextServiceMileage.toLocaleString('fr-FR')} km</span>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 ml-4 sm:ml-6 space-y-8 my-6">
        {interventions.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4">Aucune intervention enregistrée pour ce véhicule.</p>
        ) : (
          interventions.map((inv) => (
            <div key={inv.id} className="relative group">
              {/* Timeline marker icon */}
              <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-8 h-8 rounded-full bg-white border-2 border-[#1B2A6B] flex items-center justify-center text-[#1B2A6B] shadow-xs group-hover:scale-110 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>

              {/* Event Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {inv.date}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-blue-50 text-[#1B2A6B] px-2.5 py-1 rounded-md font-mono">
                      <Gauge className="w-3.5 h-3.5 text-[#1B2A6B]" />
                      {inv.mileage.toLocaleString('fr-FR')} km
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total réglé</span>
                    <p className="text-base font-extrabold text-[#1B2A6B]">{formatFCFA(inv.cost)}</p>
                  </div>
                </div>

                {/* Services performed */}
                <div className="mb-3">
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Prestations réalisées
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {inv.services.map((srv, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 font-medium px-2.5 py-1 rounded-lg border border-emerald-100"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Parts replaced */}
                {inv.partsChanged && inv.partsChanged.length > 0 && (
                  <div className="mb-3 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Pièces et fournitures changées :
                    </span>
                    <ul className="text-xs text-slate-700 list-disc list-inside space-y-0.5">
                      {inv.partsChanged.map((part, idx) => (
                        <li key={idx}>{part}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes and Mechanic */}
                <div className="text-xs text-slate-600 italic bg-amber-50/50 p-3 rounded-xl border border-amber-100 mb-4">
                  <span className="font-semibold text-amber-900 not-italic">Rapport technicien ({inv.mechanicName}) : </span>
                  {inv.notes}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">ID intervention : #{inv.id}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => handleDownloadInvoice(inv)}
                  >
                    Télécharger la facture
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
