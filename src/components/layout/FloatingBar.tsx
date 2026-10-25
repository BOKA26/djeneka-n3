import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, AlertTriangle } from 'lucide-react';

export const FloatingBar: React.FC = () => {
  const whatsappUrl = 'https://wa.me/393490802320?text=Bonjour%20Officina%20Djeneka,%20je%20souhaite%20un%20renseignement%20ou%20une%20intervention';

  return (
    <>
      {/* 1. Desktop & Tablet Floating WhatsApp Button (bottom-right) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-2xl shadow-emerald-500/30 items-center gap-2.5 transition-all duration-300 hover:scale-105 group"
        aria-label="Contacter Officina Djeneka sur WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white text-transparent group-hover:rotate-12 transition-transform" />
        <span className="font-semibold text-xs tracking-wide pr-1">WhatsApp Direct</span>
      </a>

      {/* 2. Mobile Bottom Fixed Bar with 3 Large Touch Buttons (min 44px) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-2 py-2 flex items-center gap-2 safe-area-pb">
        {/* Call button */}
        <a
          href="tel:+2250778030375"
          className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-colors active:scale-95"
          aria-label="Appeler le garage"
        >
          <Phone className="w-4 h-4 text-emerald-600" />
          <span>Appeler</span>
        </a>

        {/* WhatsApp button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[48px] bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs transition-colors active:scale-95"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-white text-transparent" />
          <span>WhatsApp</span>
        </a>

        {/* Urgent Breakdown Button (Red) */}
        <Link
          to="/depannage"
          className="flex-1 min-h-[48px] bg-[#D62828] hover:bg-[#B71C1C] text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-md shadow-[#D62828]/25 transition-colors active:scale-95"
          aria-label="Dépannage urgent"
        >
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>Dépannage</span>
        </Link>
      </div>
    </>
  );
};
