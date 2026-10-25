import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RentalVehicle } from '../types';
import { rentalsApi } from '../services/api';
import { formatFCFA } from '../utils/format';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Users,
  Settings2,
  Fuel,
  Wind,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const RentalsPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  useEffect(() => {
    rentalsApi.getAll().then(setVehicles);
  }, []);

  const categories = ['Tous', 'SUV', 'Berline', 'Pick-up', 'Citadine'];

  const filteredVehicles = vehicles.filter(
    (v) => selectedCategory === 'Tous' || v.category === selectedCategory
  );

  return (
    <div className="py-10 sm:py-16 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="navy">Flotte Automobile Récente</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#1B2A6B]">
          Location de Véhicules à Bingerville
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Véhicules méticuleusement révisés, climatisés et assurés tous risques. Disponibles pour particuliers, délégations d'affaires et séjours touristiques en Côte d'Ivoire.
        </p>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1B2A6B] text-white shadow-sm shadow-[#1B2A6B]/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Image banner */}
              <div className="relative h-56 bg-slate-900 overflow-hidden">
                <img
                  src={vehicle.images[0]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-[#1B2A6B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {vehicle.category}
                  </span>
                </div>
                {vehicle.weeklyDiscountPercent > 0 && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    -{vehicle.weeklyDiscountPercent}% dès 7j
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-slate-900 px-3.5 py-1.5 rounded-xl shadow-xs">
                  <span className="text-base font-extrabold text-[#1B2A6B]">
                    {formatFCFA(vehicle.pricePerDay)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium"> / jour</span>
                </div>
              </div>

              {/* Specs */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-slate-900 group-hover:text-[#1B2A6B] transition-colors">
                    {vehicle.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Année {vehicle.year} • Climatisation certifiée</p>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex flex-col items-center">
                    <Users className="w-4 h-4 text-slate-400 mb-0.5" />
                    <span className="font-bold text-slate-700">{vehicle.seats} pl.</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Settings2 className="w-4 h-4 text-slate-400 mb-0.5" />
                    <span className="font-bold text-slate-700 truncate max-w-[50px]">{vehicle.transmission}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Fuel className="w-4 h-4 text-slate-400 mb-0.5" />
                    <span className="font-bold text-slate-700">{vehicle.fuel}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Wind className="w-4 h-4 text-slate-400 mb-0.5" />
                    <span className="font-bold text-emerald-600">Clim A/C</span>
                  </div>
                </div>

                {/* Key features */}
                <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                  {vehicle.features.slice(0, 3).map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Caution restituable :</span>
                  <span className="font-semibold text-slate-700">{formatFCFA(vehicle.deposit)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Link to={`/location/${vehicle.id}`} className="block">
                <Button
                  variant="danger"
                  size="md"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                  className="w-full font-bold uppercase tracking-wider text-xs"
                >
                  Voir Disponibilités & Réserver
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
