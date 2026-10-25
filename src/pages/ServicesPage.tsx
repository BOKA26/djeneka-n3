import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Cpu,
  Palette,
  Sparkles,
  ShieldCheck,
  Key,
  Snowflake,
  Truck,
  Droplets,
  Timer,
  CheckCircle2,
  Clock,
  Coins,
  Search,
  ArrowRight,
  Phone,
} from 'lucide-react';
import { servicesApi } from '../services/api';
import { ServiceItem } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { QuoteModal } from '../components/services/QuoteModal';

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  Wrench: <Wrench className="w-8 h-8 text-[#1B2A6B]" />,
  Cpu: <Cpu className="w-8 h-8 text-[#1B2A6B]" />,
  Palette: <Palette className="w-8 h-8 text-[#1B2A6B]" />,
  Sparkles: <Sparkles className="w-8 h-8 text-[#1B2A6B]" />,
  ShieldCheck: <ShieldCheck className="w-8 h-8 text-[#1B2A6B]" />,
  Key: <Key className="w-8 h-8 text-[#1B2A6B]" />,
  Snowflake: <Snowflake className="w-8 h-8 text-[#1B2A6B]" />,
  Truck: <Truck className="w-8 h-8 text-[#D62828]" />,
  Droplets: <Droplets className="w-8 h-8 text-[#1B2A6B]" />,
  Timer: <Timer className="w-8 h-8 text-[#D62828]" />,
};

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>();

  useEffect(() => {
    servicesApi.getAll().then((data) => {
      if (data && data.length > 0) setServices(data);
    });
  }, []);

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shortDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.fullDesc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenQuote = (serviceName: string) => {
    setSelectedService(serviceName);
    setQuoteModalOpen(true);
  };

  return (
    <div className="py-10 sm:py-16 space-y-12">
      {/* Page Title & Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <Badge variant="navy">Nos 10 Prestations Spécialisées</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#1B2A6B]">
          Prestations & Ateliers Mécaniques
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Du simple entretien périodique à la réfection de moteur en passant par la carrosserie haute précision. Tout est exécuté selon les normes constructeurs à Bingerville.
        </p>

        {/* Search input */}
        <div className="max-w-md mx-auto pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un service (ex: vidange, clim, peinture, clé)..."
              className="w-full text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white shadow-xs"
            />
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {filteredServices.map((srv, idx) => (
            <div
              key={srv.id}
              id={srv.slug}
              className={`bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md ${
                srv.popular ? 'ring-2 ring-[#1B2A6B]/20' : ''
              }`}
            >
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left icon & summary */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                      {SERVICE_ICONS[srv.icon] || <Wrench className="w-7 h-7 text-[#1B2A6B]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#0{idx + 1}</span>
                        <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                          {srv.name}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{srv.shortDesc}</p>
                    </div>

                    {srv.popular && (
                      <span className="ml-auto text-xs font-bold text-[#D62828] bg-rose-50 border border-rose-200 px-3 py-1 rounded-full uppercase tracking-wider">
                        Recommandé
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed font-normal">
                    {srv.fullDesc}
                  </p>

                  {/* Highlights list */}
                  {srv.highlights && srv.highlights.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Garanties et points forts :
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                        {srv.highlights.map((h, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right pricing & CTA */}
                <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Estimation Tarifaire
                      </span>
                      <p className="text-xl font-heading font-extrabold text-[#1B2A6B] mt-0.5">
                        {srv.priceEstimate}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Durée : {srv.duration}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Coins className="w-4 h-4 text-slate-400" />
                      <span>Règlement : Espèces, Wave, Orange Money</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      variant="danger"
                      className="w-full font-bold uppercase tracking-wider text-xs"
                      onClick={() => handleOpenQuote(srv.name)}
                    >
                      Demander un devis
                    </Button>
                    <a
                      href={`https://wa.me/393490802320?text=Bonjour,%20je%20suis%20intéressé(e)%20par%20le%20service%20:%20${encodeURIComponent(
                        srv.name
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full"
                    >
                      <Button variant="outline" className="w-full text-xs">
                        Question WhatsApp
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        defaultServiceName={selectedService}
      />
    </div>
  );
};
