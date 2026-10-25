import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Send,
  CheckCircle,
  Building2,
  Navigation,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { InteractiveMap } from '../components/common/InteractiveMap';
import { validateIvorianPhone } from '../utils/format';
import { useToast } from '../context/ToastContext';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      showToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    if (!validateIvorianPhone(phone)) {
      showToast('Numéro de téléphone invalide (10 chiffres).', 'error');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      showToast('Votre message a bien été envoyé ! Nous vous répondrons rapidement.', 'success');
      setName('');
      setPhone('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 500);
  };

  return (
    <div className="py-10 sm:py-16 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="navy">À Votre Écoute</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#1B2A6B]">
          Contactez Officina Djeneka
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Une interrogation sur une révision, une pièce à commander ou une location de véhicule ? Passez nous voir à Bingerville ou écrivez-nous.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Info & Action cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <h2 className="text-xl font-bold font-heading text-slate-900">
              Coordonnées de l'Atelier
            </h2>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D62828] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Adresse</h4>
                  <p className="text-slate-600">
                    Bingerville, Quartier Adjin Palmeraie
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Côte d'Ivoire (Axe lagune)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Téléphone Direct</h4>
                  <a href="tel:+2250778030375" className="text-emerald-700 font-bold hover:underline">
                    +225 07 78 03 03 75
                  </a>
                  <p className="text-xs text-slate-400">Appels, SMS & Service rapide</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">WhatsApp Officiel</h4>
                  <a
                    href="https://wa.me/393490802320?text=Bonjour%20Officina%20Djeneka,%20je%20souhaite%20un%20renseignement"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#25D366] font-bold hover:underline"
                  >
                    +39 349 080 2320
                  </a>
                  <p className="text-xs text-slate-400">Devis instantané & photos</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1B2A6B] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Horaires d'Atelier</h4>
                  <p className="text-slate-600">Lundi au Samedi : 07h30 - 18h30</p>
                  <p className="text-xs text-slate-400 font-semibold text-[#D62828] mt-0.5">
                    Dépannage d'urgence : 24h/24 et 7j/7
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
              <a
                href="https://wa.me/393490802320?text=Bonjour%20Officina%20Djeneka,%20je%20vous%20contacte%20depuis%20le%20site"
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button variant="whatsapp" className="w-full">
                  Lancer la discussion WhatsApp
                </Button>
              </a>
              <a href="tel:+2250778030375" className="w-full">
                <Button variant="outline" className="w-full">
                  Appeler le standard téléphonique
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md">
          <h2 className="text-xl font-bold font-heading text-[#1B2A6B] mb-1">
            Formulaire de Message
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Envoyez votre requête écrite et nous vous recontacterons au plus vite.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom & Prénoms <span className="text-[#D62828]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Kouassi Emmanuel"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone (10 chiffres) <span className="text-[#D62828]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07 78 03 03 75"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@domaine.ci"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objet du message
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Disponibilité Prado, Devis amortisseurs..."
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Votre Message <span className="text-[#D62828]">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Détaillez votre demande ou votre véhicule..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
              />
            </div>

            <Button
              type="submit"
              variant="danger"
              size="lg"
              loading={submitting}
              className="w-full uppercase font-bold text-xs tracking-wider"
            >
              Envoyer mon message
            </Button>
          </form>
        </div>
      </div>

      {/* Interactive Map */}
      <InteractiveMap height="h-[380px]" />
    </div>
  );
};
