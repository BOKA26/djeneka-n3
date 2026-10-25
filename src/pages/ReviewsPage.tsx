import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import { reviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Star, MessageSquare, CheckCircle, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Link } from 'react-router-dom';

export const ReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reviewsApi.getApproved().then(setReviews);
  }, []);

  useEffect(() => {
    if (user && !authorName) {
      setAuthorName(user.name);
    }
  }, [user]);

  // Compute average rating
  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !authorName.trim()) {
      showToast('Veuillez renseigner votre nom et votre avis.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await reviewsApi.submitReview({
        authorName,
        authorVehicle: vehicle.trim() || undefined,
        rating,
        comment,
      });

      showToast(
        'Merci pour votre avis ! Il a été enregistré et sera affiché après validation par notre équipe.',
        'success'
      );
      setComment('');
      setVehicle('');
    } catch {
      showToast('Erreur lors du dépôt de votre avis.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="success">Avis Vérifiés</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#1B2A6B]">
          Avis & Retours d'Expérience Clients
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          La transparence est au cœur de notre métier. Découvrez les retours authentiques de conducteurs qui nous confient l'entretien de leurs véhicules à Bingerville.
        </p>

        {/* Global Score Card */}
        <div className="inline-flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm mt-4">
          <div className="text-3xl font-extrabold font-heading text-[#1B2A6B]">
            {averageRating} <span className="text-sm text-slate-400 font-normal">/ 5</span>
          </div>
          <div className="text-left border-l border-slate-200 pl-4">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Basé sur {reviews.length} avis certifiés</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-bold font-heading text-slate-900 mb-4">
            Derniers témoignages ({reviews.length})
          </h2>

          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{r.authorName}</h4>
                    {r.authorVehicle && (
                      <span className="text-xs text-slate-400 block">{r.authorVehicle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  « {r.comment} »
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Client Vérifié Officina Djeneka
                  </span>
                  <span>{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Submit Review Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-5 sticky top-28">
          <div>
            <span className="text-xs font-bold text-[#1B2A6B] uppercase tracking-wider">
              Votre Expérience
            </span>
            <h3 className="text-xl font-bold font-heading text-slate-900 mt-1">
              Partagez votre avis sur l'Atelier
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Votre avis sera soumis à modération avant parution publique.
            </p>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Interactive Stars */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Note globale (sur 5 étoiles) <span className="text-[#D62828]">*</span>
              </label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starVal = i + 1;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                      aria-label={`${starVal} étoiles`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= starVal
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-bold text-slate-600 ml-2">
                  {rating} / 5 étoiles
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Votre Nom ou Pseudo <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Kouassi Serge"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Véhicule ou service concerné
              </label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="Ex: Toyota RAV4 2018 (Vidange express)"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Votre commentaire détaillé <span className="text-[#D62828]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Qualité de l'accueil, respect des délais, transparence des tarifs..."
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
              Envoyer mon avis client
            </Button>

            {!user && (
              <p className="text-[11px] text-center text-slate-400">
                Vous avez déjà un compte ?{' '}
                <Link to="/connexion" className="text-[#1B2A6B] underline font-semibold">
                  Connectez-vous
                </Link>{' '}
                pour lier votre avis à votre profil.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
