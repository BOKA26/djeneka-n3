import React, { useState } from 'react';
import { MOCK_GALLERY } from '../data/gallery';
import { GalleryItem } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Maximize2, X, Filter } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  const categories = ['Tous', 'Atelier', 'Peinture', 'Polissage', 'Location'];

  const filteredItems = MOCK_GALLERY.filter(
    (item) => selectedCategory === 'Tous' || item.category === selectedCategory
  );

  return (
    <div className="py-10 sm:py-16 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="navy">Nos Réalisations en Images</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#1B2A6B]">
          Galerie de nos Ateliers & Interventions
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Découvrez en images nos ponts élévateurs, la cabine de peinture au four étuvée, nos lustrages de précision et notre flotte de véhicules prêts à la location.
        </p>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1B2A6B] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveItem(item)}
            className="group relative h-64 sm:h-72 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs cursor-pointer"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="absolute top-3 left-3">
              <span className="bg-white/90 backdrop-blur-xs text-[#1B2A6B] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {item.category}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-white">
              <h3 className="font-heading font-bold text-sm leading-snug line-clamp-2">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                {item.description}
              </p>
            </div>

            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeItem && (
        <Modal
          isOpen={!!activeItem}
          onClose={() => setActiveItem(null)}
          title={activeItem.title}
          subtitle={`Catégorie : ${activeItem.category}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="w-full h-full object-contain mx-auto"
              />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {activeItem.description}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
