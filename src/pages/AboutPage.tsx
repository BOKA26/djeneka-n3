import React from 'react';
import { Badge } from '../components/common/Badge';
import { ShieldCheck, Award, Users, Wrench, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="py-10 sm:py-16 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="navy">À Propos d'Officina Djeneka</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#1B2A6B]">
          Performance & Fiabilité Automobile
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Fondé avec la volonté d'apporter aux automobilistes de Côte d'Ivoire un niveau d'exigence technique et de rigueur digne des plus grands centres européens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
          <h2 className="text-2xl font-bold font-heading text-slate-900">
            Notre Mission à Bingerville
          </h2>
          <p>
            Implanté à Adjin Palmeraie, <strong>Officina Djeneka (Garage Moderne)</strong> comble le fossé entre les petits ateliers de rue et les concessionnaires aux tarifs prohibitifs.
          </p>
          <p>
            Nous offrons une transparence absolue : chaque pièce remplacée est présentée au client, nos diagnostics sont imprimés et chaque devis est scrupuleusement respecté avant tout début de travaux.
          </p>
          <p>
            Notre parc de machines comprend des bancs électroniques multimarques récents, une cabine de peinture automobile étuvée pressurisée, et une station automatique de recyclage et charge de climatisation.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zéro pièce contrefaite</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Garantie de réparation</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Personnel formé continuellement</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Respect des délais convenus</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200">
          <img
            src="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80"
            alt="Officina Djeneka Atelier Bingerville"
            className="w-full h-96 object-cover"
          />
        </div>
      </div>
    </div>
  );
};
