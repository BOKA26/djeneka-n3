import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BlogPost } from '../types';
import { blogApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Clock, Calendar, ArrowRight, User } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    blogApi.getAll().then((data) => {
      setPosts(data.filter((p) => p.status === 'publie'));
    });
  }, []);

  return (
    <div className="py-10 sm:py-16 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="navy">Conseils Mécaniques & Entretien</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#1B2A6B]">
          Le Blog Officina Djeneka
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Astuces de nos maîtres-mécaniciens pour allonger la durée de vie de votre moteur face aux contraintes du climat et des routes de Côte d'Ivoire.
        </p>
      </div>

      {/* Grid of articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-60 overflow-hidden bg-slate-900">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-[#1B2A6B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {post.category}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-3">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <User className="w-3.5 h-3.5 text-[#1B2A6B]" />
                    {post.author}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 group-hover:text-[#1B2A6B] transition-colors leading-snug">
                  {post.title}
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {post.excerpt}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0">
              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#D62828] hover:underline"
              >
                Lire l'article complet
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
