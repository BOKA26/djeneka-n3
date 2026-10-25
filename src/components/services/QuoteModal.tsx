import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { quotesApi, servicesApi } from '../../services/api';
import { ServiceItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateIvorianPhone } from '../../utils/format';
import { Calendar, Car, Phone, User, MessageSquare } from 'lucide-react';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultServiceName?: string;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  defaultServiceName,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [serviceName, setServiceName] = useState(
    defaultServiceName || 'Mécanique Générale'
  );
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [clientName, setClientName] = useState(user?.name || '');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    servicesApi.getAll().then((data) => {
      if (data && data.length > 0) {
        setServicesList(data);
        if (!defaultServiceName) {
          setServiceName(data[0].name);
        }
      }
    });
  }, [defaultServiceName]);

  // Sync if defaultServiceName changes
  useEffect(() => {
    if (defaultServiceName) {
      setServiceName(defaultServiceName);
    }
  }, [defaultServiceName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleInfo.trim() || !clientName.trim() || !clientPhone.trim()) {
      showToast('Veuillez remplir les informations obligatoires.', 'error');
      return;
    }

    if (!validateIvorianPhone(clientPhone)) {
      showToast('Numéro de téléphone invalide (10 chiffres, ex: 07 78 03 03 75).', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await quotesApi.create({
        serviceName,
        vehicleInfo,
        preferredDate: preferredDate || new Date().toISOString().split('T')[0],
        clientName,
        clientPhone,
        message,
      });

      showToast('Votre demande de devis a été transmise ! Nous vous rappelons sous peu.', 'success');
      onClose();
      // Reset
      setVehicleInfo('');
      setMessage('');
    } catch {
      showToast('Erreur lors de l’envoi de la demande.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Demande de Devis Personnalisé"
      subtitle="Réponse claire et détaillée sous 2 heures ouvrées"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Prestation souhaitée <span className="text-[#D62828]">*</span>
          </label>
          <select
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
          >
            {servicesList.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.priceEstimate})
              </option>
            ))}
          </select>
        </div>

        {/* Vehicle Info */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Votre véhicule (Marque, Modèle, Année) <span className="text-[#D62828]">*</span>
          </label>
          <div className="relative">
            <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
              placeholder="Ex: Toyota RAV4 2018 Essence ou Hyundai Tucson"
              className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
            />
          </div>
        </div>

        {/* Preferred Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Date souhaitée de passage à l'atelier
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
            />
          </div>
        </div>

        {/* Client Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Votre Nom & Prénoms <span className="text-[#D62828]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: M. Kouassi"
                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Téléphone (Côte d'Ivoire) <span className="text-[#D62828]">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Ex: 07 78 03 03 75"
                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Précisions sur la panne ou le besoin
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Bruit au freinage, voyant d’huile qui clignote, révision des 80 000 km..."
              className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="danger"
            size="lg"
            loading={submitting}
            className="w-full uppercase font-bold"
          >
            Envoyer ma demande de devis gratuit
          </Button>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Sans engagement • Devis chiffré clair sans frais cachés
          </p>
        </div>
      </form>
    </Modal>
  );
};
