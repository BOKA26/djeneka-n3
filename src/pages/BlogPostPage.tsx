import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogPost } from '../types';
import { blogApi } from '../services/api';
import { ArrowLeft, Calendar, Clock, User, Share2, MessageCircle } from 'lucide-react';
import { Button } from '../components/common/Button';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      blogApi.getBySlug(slug).then((p) => {
        if (p) setPost(p);
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Chargement de l'article...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold font-heading mb-2">Article introuvable</h2>
        <Link to="/blog">
          <Button variant="primary">Retourner au blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1B2A6B]"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux articles
        </Link>
      </div>

      <header className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#D62828] bg-rose-50 px-3 py-1 rounded-full">
          {post.category}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-b border-slate-200 pb-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <User className="w-4 h-4 text-[#1B2A6B]" />
            Par {post.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {post.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {post.readTime}
          </span>
        </div>
      </header>

      {/* Cover Image */}
      <div className="rounded-3xl overflow-hidden h-72 sm:h-96 bg-slate-900 border border-slate-200 shadow-sm">
        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
      </div>

      {/* Article Content */}
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-4 whitespace-pre-line font-normal">
        {post.content}
      </div>

      {/* WhatsApp question banner */}
      <div className="bg-slate-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
        <div>
          <h3 className="font-heading font-bold text-lg text-slate-900">
            Une question sur l'entretien de votre véhicule ?
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Nos techniciens sont disponibles pour échanger sur vos doutes mécaniques.
          </p>
        </div>
        <a
          href={`https://wa.me/393490802320?text=Bonjour,%20j'ai%20lu%20l'article%20'${encodeURIComponent(
            post.title
          )}'%20et%20j'ai%20une%20question`}
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="whatsapp">
            Poser une question sur WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
};
