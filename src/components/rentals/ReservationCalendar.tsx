import React, { useState, useEffect } from 'react';
import { RentalVehicle } from '../../types';
import { rentalsApi, reservationsApi, getDatesBetween } from '../../services/api';
import { formatFCFA, validateIvorianPhone } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Upload,
  ShieldCheck,
  Clock,
  Car,
  FileCheck,
} from 'lucide-react';
import { Button } from '../common/Button';

interface ReservationCalendarProps {
  vehicle: RentalVehicle;
  onSuccess?: () => void;
}

export const ReservationCalendar: React.FC<ReservationCalendarProps> = ({ vehicle, onSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Current viewed month
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1)); // October 2026 default or current
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState<boolean>(true);

  // Selected date range
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Booking form states
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [licenseUploaded, setLicenseUploaded] = useState(false);
  const [idCardUploaded, setIdCardUploaded] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Sync user info if user logs in
  useEffect(() => {
    if (user) {
      if (!clientName) setClientName(user.name);
      if (!clientPhone) setClientPhone(user.phone);
      if (!clientEmail) setClientEmail(user.email);
    }
  }, [user]);

  // Load unavailable dates
  const loadVehicleDates = async () => {
    setLoadingDates(true);
    try {
      const dates = await rentalsApi.getUnavailableDates(vehicle.id);
      setUnavailableDates(dates);
    } catch {
      setUnavailableDates(vehicle.unavailableDates || []);
    } finally {
      setLoadingDates(false);
    }
  };

  useEffect(() => {
    loadVehicleDates();
  }, [vehicle.id]);

  // Helper date formatting YYYY-MM-DD
  const formatISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar matrix calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week for 1st day (0 is Sun, we want Monday = 0)
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();

  // Handle day click
  const handleDayClick = (dayStr: string, isUnavailable: boolean, isPast: boolean) => {
    if (isUnavailable || isPast) return;
    setDateError(null);

    // If both set or neither set -> start fresh
    if (!startDate || (startDate && endDate)) {
      setStartDate(dayStr);
      setEndDate(null);
    } else {
      // startDate is set, selecting endDate
      if (dayStr < startDate) {
        // user clicked an earlier date, make it new startDate
        setStartDate(dayStr);
        setEndDate(null);
      } else {
        // Check if range contains any unavailable date
        const range = getDatesBetween(startDate, dayStr);
        const hasCollision = range.some((d) => unavailableDates.includes(d));

        if (hasCollision) {
          setDateError(
            'La période sélectionnée chevauche des jours déjà réservés ou en maintenance. Veuillez choisir une autre plage.'
          );
          showToast('Certaines dates dans cette plage sont indisponibles.', 'error');
        } else {
          setEndDate(dayStr);
        }
      }
    }
  };

  // Calculations
  const selectedDaysCount = startDate && endDate ? getDatesBetween(startDate, endDate).length : startDate ? 1 : 0;
  const hasWeeklyDiscount = selectedDaysCount >= 7 && vehicle.weeklyDiscountPercent > 0;
  const applicableDailyRate = hasWeeklyDiscount
    ? Math.round(vehicle.pricePerDay * (1 - vehicle.weeklyDiscountPercent / 100))
    : vehicle.pricePerDay;
  const calculatedTotal = selectedDaysCount * applicableDailyRate;

  // Submit booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      showToast('Veuillez sélectionner une date de début et de fin sur le calendrier.', 'warning');
      return;
    }

    if (!user) {
      showToast('Veuillez vous connecter pour confirmer votre réservation.', 'warning');
      // Save pending rental intent in sessionStorage
      sessionStorage.setItem('pending_rental_redirect', `/location/${vehicle.id}`);
      navigate('/connexion');
      return;
    }

    if (!clientName.trim() || !clientPhone.trim()) {
      showToast('Veuillez renseigner votre nom et votre numéro de téléphone.', 'error');
      return;
    }

    if (!validateIvorianPhone(clientPhone)) {
      showToast('Numéro de téléphone invalide (10 chiffres requis, ex: 07 78 03 03 75).', 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast('Veuillez accepter les conditions de location pour continuer.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await reservationsApi.createReservation({
        vehicleId: vehicle.id,
        userId: user.id,
        clientName,
        clientPhone,
        clientEmail: clientEmail || user.email,
        startDate,
        endDate,
        notes,
        licenseFile: licenseUploaded ? 'permis_conduire_valide.pdf' : 'permis_fourni_en_agence.pdf',
        idCardFile: idCardUploaded ? 'cni_passeport_valide.pdf' : 'cni_fourni_en_agence.pdf',
      });

      setBookingSuccess(true);
      showToast('Votre demande de réservation a été enregistrée avec succès !', 'success');
      await loadVehicleDates();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la réservation';
      setDateError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-[#1B2A6B] to-[#121E4D] text-white p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <CalendarIcon className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg md:text-xl">Disponibilité & Réservation Directe</h3>
              <p className="text-xs text-blue-200">Sélectionnez vos dates pour {vehicle.name}</p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-3 py-1 rounded-full border border-emerald-500/30">
            Mise à jour en temps réel
          </span>
        </div>
      </div>

      <div className="p-5 md:p-7 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CALENDAR COLUMN */}
        <div className="lg:col-span-7 space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-heading font-bold text-base capitalize text-slate-800">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs py-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-500" />
              <span className="text-slate-600 font-medium">Libre (cliquable)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#D62828] border border-red-700" />
              <span className="text-slate-600 font-medium">Réservé</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-slate-400" />
              <span className="text-slate-600 font-medium">Maintenance / Bloqué</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-200/80 rounded-2xl p-3 bg-slate-50/40">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mer</span>
              <span>Jeu</span>
              <span>Ven</span>
              <span>Sam</span>
              <span>Dim</span>
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading offset */}
              {Array.from({ length: firstDayWeekday }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 sm:h-12" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(year, month, dayNum);
                const dayStr = formatISO(d);

                const todayISO = formatISO(new Date());
                const isPast = dayStr < todayISO;
                const isUnavailable = unavailableDates.includes(dayStr);

                // Range selection status
                const isStart = startDate === dayStr;
                const isEnd = endDate === dayStr;
                const isInRange =
                  startDate && endDate && dayStr >= startDate && dayStr <= endDate;

                // Color classes
                let statusClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer';

                if (isUnavailable) {
                  statusClass = 'bg-[#D62828] text-white border-red-700 cursor-not-allowed opacity-90';
                } else if (isPast) {
                  statusClass = 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60';
                }

                if (isStart || isEnd) {
                  statusClass = 'bg-[#1B2A6B] text-white font-bold ring-2 ring-[#1B2A6B] ring-offset-1 z-10';
                } else if (isInRange) {
                  statusClass = 'bg-blue-100 text-[#1B2A6B] font-semibold border-blue-300';
                }

                return (
                  <button
                    key={dayStr}
                    type="button"
                    disabled={isUnavailable || isPast}
                    onClick={() => handleDayClick(dayStr, isUnavailable, isPast)}
                    title={
                      isUnavailable
                        ? 'Jour réservé / indisponible'
                        : isPast
                        ? 'Date passée'
                        : `Disponible le ${dayNum}`
                    }
                    className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm font-medium border transition-all duration-150 ${statusClass}`}
                  >
                    <span>{dayNum}</span>
                    {isUnavailable && <span className="text-[9px] uppercase tracking-tighter opacity-80">Occupé</span>}
                    {isStart && <span className="text-[8px] uppercase tracking-tighter">Départ</span>}
                    {isEnd && <span className="text-[8px] uppercase tracking-tighter">Retour</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Error Banner */}
          {dateError && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 text-[#D62828] shrink-0" />
              <p>{dateError}</p>
            </div>
          )}

          {/* Quick Selection Helper */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              {startDate ? `Départ : ${startDate}` : 'Cliquez sur une date de début'}
            </span>
            <span>
              {endDate ? `Retour : ${endDate}` : startDate ? 'Cliquez sur la date de fin' : ''}
            </span>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setDateError(null);
                }}
                className="text-[#D62828] font-medium hover:underline cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY & FORM COLUMN */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          {bookingSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="font-heading font-bold text-xl text-emerald-900 mb-2">
                Demande transmise avec succès !
              </h4>
              <p className="text-sm text-emerald-800 mb-6 leading-relaxed">
                Votre réservation pour le véhicule <strong>{vehicle.name}</strong> a été enregistrée en statut <em>« En attente »</em>. Notre équipe à Bingerville vous contactera sous 30 minutes pour la confirmation.
              </p>
              <div className="space-y-2 w-full">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/espace-client')}
                >
                  Voir dans mon Espace Client
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setBookingSuccess(false);
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  Faire une autre réservation
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Live Cost Summary Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Récapitulatif de la location
                </h4>
                
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Tarif de base journalier</span>
                    <span className="font-semibold">{formatFCFA(vehicle.pricePerDay)} / jour</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Durée sélectionnée</span>
                    <span className="font-bold text-[#1B2A6B]">
                      {selectedDaysCount > 0 ? `${selectedDaysCount} jour(s)` : '0 jour'}
                    </span>
                  </div>

                  {hasWeeklyDiscount && (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg">
                      <span>Remise semaine (≥ 7 jours)</span>
                      <span>-{vehicle.weeklyDiscountPercent}% appliqué</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Caution restituée</span>
                    <span className="font-medium text-slate-600">{formatFCFA(vehicle.deposit)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-500">Total estimé</span>
                      <p className="text-[11px] text-slate-400">Paiement sur place ou Wave/Orange Money</p>
                    </div>
                    <span className="text-xl font-heading font-extrabold text-[#1B2A6B]">
                      {formatFCFA(calculatedTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Identification details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom & Prénoms <span className="text-[#D62828]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Kouassi Jean-Marc"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Téléphone (10 chiffres) <span className="text-[#D62828]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: 07 78 03 03 75"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@domaine.ci"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                    />
                  </div>
                </div>

                {/* Simulated Document Uploads */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div
                    onClick={() => {
                      setLicenseUploaded(!licenseUploaded);
                      showToast(
                        licenseUploaded ? 'Permis retiré' : 'Permis de conduire chargé avec succès',
                        'info'
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-colors ${
                      licenseUploaded
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-dashed border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {licenseUploaded ? (
                      <FileCheck className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    ) : (
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                    )}
                    <span className="text-xs font-medium block">
                      {licenseUploaded ? 'Permis joint ✓' : 'Joindre Permis'}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setIdCardUploaded(!idCardUploaded);
                      showToast(
                        idCardUploaded ? 'Pièce retirée' : 'Pièce d’identité chargée avec succès',
                        'info'
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-colors ${
                      idCardUploaded
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-dashed border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idCardUploaded ? (
                      <FileCheck className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    ) : (
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                    )}
                    <span className="text-xs font-medium block">
                      {idCardUploaded ? 'CNI jointe ✓' : 'Joindre CNI / Passeport'}
                    </span>
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#1B2A6B] focus:ring-[#1B2A6B] w-4 h-4 cursor-pointer"
                    />
                    <span>
                      J'accepte les conditions de location (restitution avec le plein, respect des limitations et caution obligatoire).
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit CTA (Red accent as per guidelines) */}
              <Button
                type="submit"
                variant="danger"
                size="lg"
                loading={submitting}
                className="w-full font-bold uppercase tracking-wider text-sm"
              >
                Envoyer la demande de réservation
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
