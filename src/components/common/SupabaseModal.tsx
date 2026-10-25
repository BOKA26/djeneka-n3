import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';
import {
  getSupabaseConfig,
  updateSupabaseConfig,
  resetSupabaseConfig,
  testSupabaseConnection,
  syncAllMockDataToSupabase,
  SUPABASE_SQL_SCHEMA,
  isValidSupabaseUrl,
  normalizeSupabaseUrl,
  ConnectionStatus,
} from '../../services/api';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Code2,
  ChevronDown,
  ChevronUp,
  Check,
  KeyRound,
  Info,
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const currentConfig = getSupabaseConfig();

  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      // Auto test current connection
      runTest(cfg);
    }
  }, [isOpen]);

  const runTest = async (cfgToTest?: { url: string; anonKey: string }) => {
    setTesting(true);
    const candidate = cfgToTest || { url, anonKey };
    const cleaned = {
      url: normalizeSupabaseUrl(candidate.url),
      anonKey: candidate.anonKey.trim(),
    };
    const res = await testSupabaseConnection(cleaned);
    setStatus(res);
    setTesting(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      showToast('Veuillez renseigner l’URL et la clé publique Supabase.', 'error');
      return;
    }

    if (!isValidSupabaseUrl(cleanUrl)) {
      showToast('L’URL Supabase est invalide (doit débuter par https://, ex: https://xxxx.supabase.co).', 'error');
      return;
    }

    try {
      setUrl(cleanUrl);
      setAnonKey(cleanKey);
      updateSupabaseConfig({
        url: cleanUrl,
        anonKey: cleanKey,
      });

      showToast('Configuration Supabase enregistrée !', 'success');
      await runTest({ url: cleanUrl, anonKey: cleanKey });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur de configuration', 'error');
    }
  };

  const handleReset = async () => {
    resetSupabaseConfig();
    const cfg = getSupabaseConfig();
    setUrl(cfg.url);
    setAnonKey(cfg.anonKey);
    showToast('Paramètres Supabase réinitialisés.', 'info');
    await runTest(cfg);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    showToast('Script SQL copié dans le presse-papiers !', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const res = await syncAllMockDataToSupabase();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'warning');
      }
    } catch {
      showToast('Erreur inattendue lors de la synchronisation.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connexion Base de Données Supabase"
      subtitle="Connectez votre projet Supabase PostgreSQL pour synchroniser pièces, réservations, dépannages et devis"
      maxWidth="xl"
    >
      <div className="space-y-6 text-sm">
        {/* Status Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            testing
              ? 'bg-blue-50/50 border-blue-200 text-blue-900'
              : status?.connected
              ? status.missingTables && status.missingTables.length > 0
                ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/60 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {testing ? (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mt-0.5 shrink-0" />
            ) : status?.connected ? (
              status.missingTables && status.missingTables.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              )
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {testing
                    ? 'Test de connectivité en cours...'
                    : status?.connected
                    ? status.missingTables && status.missingTables.length > 0
                      ? 'Connecté (Tables à initialiser)'
                      : 'Connecté et Opérationnel'
                    : 'Non Connecté / Mode Local Secours'}
                </span>
                <button
                  type="button"
                  onClick={() => runTest()}
                  disabled={testing}
                  className="text-xs font-semibold underline hover:opacity-80 cursor-pointer"
                >
                  Tester à nouveau
                </button>
              </div>
              <p className="mt-1 text-xs leading-relaxed opacity-90">
                {status?.message || 'Vérification de la liaison avec le serveur Supabase...'}
              </p>
              <div className="mt-2 text-[11px] font-mono opacity-75 truncate">
                Projet : {url || 'Non défini'}
              </div>
            </div>
          </div>
        </div>

        {/* Guide Identifiants Supabase */}
        <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
            <KeyRound className="w-4 h-4 text-[#1B2A6B]" />
            <span>Quels identifiants devez-vous renseigner ?</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
            <li>
              <strong>1. URL du projet :</strong> Dans Supabase &gt; <em>Project Settings &gt; Data API</em> &gt; copiez <strong>Project URL</strong> (ex: <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[10px]">https://xxxx.supabase.co</code>).
            </li>
            <li>
              <strong>2. Clé API anon (publique) :</strong> Au même endroit sous <em>Project API Keys</em> &gt; copiez <strong>anon public</strong> (commence par <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[10px]">eyJhbG...</code> ou <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[10px]">sb_publishable_...</code>).
            </li>
            <li className="text-amber-700 font-medium">
              ⚠️ <strong>Ne JAMAIS utiliser la clé <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">service_role</code></strong> (seule la clé publique anonyme est autorisée côté navigateur).
            </li>
          </ul>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL du Projet Supabase (Project URL)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://votre-projet.supabase.co"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:border-[#1B2A6B] focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Disponible dans Supabase : <strong>Project Settings &gt; API &gt; Project URL</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clé Publique Anon (Project API anon key)
            </label>
            <textarea
              rows={2}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:border-[#1B2A6B] focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Clé publique sûre pour le front-end (jamais la clé <code>service_role</code>).
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm">
                Enregistrer & Appliquer
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => runTest()} disabled={testing}>
                Tester
              </Button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Réinitialiser par défaut
            </button>
          </div>
        </form>

        {/* Action Panel: SQL & Sync */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Initialisation des Tables SQL
              </h4>
              <p className="text-xs text-slate-500">
                Créez en 1 clic les tables (parts, rentals, reservations, quotes, emergencies...)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopySql}
            >
              {copiedSql ? 'Copié !' : 'Copier le Script SQL'}
            </Button>
          </div>

          {/* Sync Button */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-xs text-slate-800 block">
                Synchroniser les données démo vers Supabase
              </span>
              <span className="text-[11px] text-slate-500 block">
                Injecte les 24 pièces, 6 véhicules de location, avis et articles dans vos tables Supabase.
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSyncData}
              disabled={syncing}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />}
            >
              {syncing ? 'Synchronisation...' : 'Injecter les données'}
            </Button>
          </div>

          {/* Toggle SQL schema display */}
          <div>
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-1.5 text-xs text-[#1B2A6B] font-semibold hover:underline cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>{showSql ? 'Masquer le script SQL' : 'Afficher le script SQL complet'}</span>
              {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSql && (
              <div className="mt-2 relative">
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono max-h-56 overflow-y-auto leading-relaxed">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-2 right-2 px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-medium transition-colors"
                >
                  {copiedSql ? 'Copié !' : 'Copier'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3 Step Supabase instructions */}
        <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-950 space-y-1.5">
          <span className="font-bold block text-blue-900">Guide rapide en 3 étapes :</span>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900/90">
            <li>
              Rendez-vous sur{' '}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold inline-flex items-center gap-0.5"
              >
                Supabase Dashboard <ExternalLink className="w-3 h-3 inline" />
              </a>{' '}
              et créez ou ouvrez votre projet.
            </li>
            <li>Ouvrez l'onglet <strong>SQL Editor</strong>, collez le script copié ci-dessus et cliquez sur <strong>Run</strong>.</li>
            <li>Copiez l'URL et la clé <code>anon</code> depuis <strong>Project Settings &gt; API</strong> et collez-les ici.</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
};
