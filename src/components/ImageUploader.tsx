import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  Plus,
  FolderOpen,
} from 'lucide-react';
import {
  uploadImageToStorage,
  deleteImageFromStorage,
  validateImageFile,
} from '../lib/storage';
import { useToast } from '../context/ToastContext';
import { Button } from './common/Button';

export interface ImageUploaderProps {
  bucket?: string;
  folder: 'rental' | 'parts' | 'blog' | 'gallery' | 'site' | 'services' | 'documents' | string;
  value: string[] | string;
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  onUploadingChange?: (isUploading: boolean) => void;
  className?: string;
}

interface UploadingItem {
  id: string;
  name: string;
  previewUrl: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  rawFile: File;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  bucket = 'media',
  folder = 'rental',
  value,
  onChange,
  multiple = false,
  maxFiles = multiple ? 8 : 1,
  maxSizeMB = 5,
  label,
  helperText,
  onUploadingChange,
  className = '',
}) => {
  const { showToast } = useToast();

  // Standardize value into string array
  const currentUrls: string[] = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === 'string' && value.trim()
    ? [value.trim()]
    : [];

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingQueue, setUploadingQueue] = useState<UploadingItem[]>([]);
  const [deleteModalPhoto, setDeleteModalPhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadingQueue.some((item) => item.status === 'compressing' || item.status === 'uploading');

  useEffect(() => {
    if (onUploadingChange) {
      onUploadingChange(isUploading);
    }
  }, [isUploading, onUploadingChange]);

  // Traitement d'un lot de fichiers sélectionnés depuis l'ordinateur ou le téléphone
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Si mono-fichier et qu'il y a déjà une image, on remplace l'image existante
    if (!multiple) {
      const file = fileArray[0];
      const validation = validateImageFile(file, maxSizeMB);
      if (!validation.valid) {
        showToast(validation.error || 'Fichier non valide', 'error');
        return;
      }

      const queueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);
      const queueItem: UploadingItem = {
        id: queueId,
        name: file.name,
        previewUrl,
        progress: 10,
        status: 'compressing',
        rawFile: file,
      };

      setUploadingQueue([queueItem]);

      try {
        const uploadRes = await uploadImageToStorage(file, {
          bucket,
          folder,
          onProgress: (p) => {
            setUploadingQueue((prev) =>
              prev.map((it) =>
                it.id === queueId
                  ? {
                      ...it,
                      progress: p,
                      status: p >= 100 ? 'success' : 'uploading',
                    }
                  : it
              )
            );
          },
        });

        // Remplace l'image existante
        onChange([uploadRes.url]);
        setUploadingQueue([]);
        showToast('Photo téléversée depuis votre ordinateur avec succès !', 'success');
      } catch (err: any) {
        console.error('Erreur upload:', err);
        setUploadingQueue((prev) =>
          prev.map((it) =>
            it.id === queueId
              ? {
                  ...it,
                  status: 'error',
                  errorMessage: err.message || 'Échec de l\'envoi vers le stockage.',
                }
              : it
          )
        );
        showToast(err.message || 'Erreur lors de l\'envoi de la photo.', 'error');
      }
      return;
    }

    // Cas multi-fichiers
    const availableSlots = maxFiles - (currentUrls.length + uploadingQueue.length);
    if (availableSlots <= 0) {
      showToast(
        `Vous avez atteint la limite maximale de ${maxFiles} photos.`,
        'warning'
      );
      return;
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    if (filesToProcess.length < fileArray.length) {
      showToast(
        `Seuls les ${availableSlots} premiers fichiers ont été retenus (limite de ${maxFiles} photos).`,
        'info'
      );
    }

    // Valider chaque fichier
    const validItems: { file: File; id: string; previewUrl: string }[] = [];
    for (const file of filesToProcess) {
      const validation = validateImageFile(file, maxSizeMB);
      if (!validation.valid) {
        showToast(`${file.name} : ${validation.error}`, 'error');
        continue;
      }
      const queueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);
      validItems.push({ file, id: queueId, previewUrl });
    }

    if (validItems.length === 0) return;

    // Ajouter à la file d'attente
    const newQueueItems: UploadingItem[] = validItems.map((item) => ({
      id: item.id,
      name: item.file.name,
      previewUrl: item.previewUrl,
      progress: 10,
      status: 'compressing',
      rawFile: item.file,
    }));

    setUploadingQueue((prev) => [...prev, ...newQueueItems]);

    // Envoi séquentiel ou parallèle
    for (const item of validItems) {
      try {
        const uploadRes = await uploadImageToStorage(item.file, {
          bucket,
          folder,
          onProgress: (p) => {
            setUploadingQueue((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      progress: p,
                      status: p >= 100 ? 'success' : 'uploading',
                    }
                  : it
              )
            );
          },
        });

        // Succès : ajouter l'URL à la liste et retirer de la file d'attente
        onChange([...currentUrls, uploadRes.url]);
        setUploadingQueue((prev) => prev.filter((it) => it.id !== item.id));
        showToast(`${item.file.name} téléversé avec succès !`, 'success');
      } catch (err: any) {
        console.error('Erreur upload:', err);
        setUploadingQueue((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'error',
                  errorMessage: err.message || 'Échec de l\'envoi vers le stockage.',
                }
              : it
          )
        );
        showToast(err.message || `Échec pour ${item.file.name}`, 'error');
      }
    }
  };

  // Réessayer un envoi échoué
  const handleRetry = async (item: UploadingItem) => {
    setUploadingQueue((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading', progress: 15, errorMessage: undefined } : it))
    );

    try {
      const uploadRes = await uploadImageToStorage(item.rawFile, {
        bucket,
        folder,
        onProgress: (p) => {
          setUploadingQueue((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, progress: p, status: p >= 100 ? 'success' : 'uploading' } : it
            )
          );
        },
      });

      if (multiple) {
        onChange([...currentUrls, uploadRes.url]);
      } else {
        onChange([uploadRes.url]);
      }
      setUploadingQueue((prev) => prev.filter((it) => it.id !== item.id));
      showToast(`${item.name} envoyé avec succès !`, 'success');
    } catch (err: any) {
      setUploadingQueue((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'error', errorMessage: err.message || 'Nouvel échec.' } : it
        )
      );
      showToast('Nouvel échec de l\'envoi.', 'error');
    }
  };

  const handleCancelUploading = (id: string) => {
    setUploadingQueue((prev) => prev.filter((it) => it.id !== id));
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Définir la photo comme principale (la placer à l'index 0)
  const handleSetPrimary = (index: number) => {
    if (index === 0 || index >= currentUrls.length) return;
    const targetUrl = currentUrls[index];
    const rest = currentUrls.filter((_, idx) => idx !== index);
    const reordered = [targetUrl, ...rest];
    onChange(reordered);
    showToast('Photo définie comme photo principale ⭐', 'info');
  };

  // Déplacer une photo (gauche / droite)
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentUrls.length) return;

    const copy = [...currentUrls];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onChange(copy);
  };

  // Confirmation de suppression d'une photo existante
  const handleConfirmDelete = async () => {
    if (!deleteModalPhoto) return;

    const photoToDelete = deleteModalPhoto;
    const updatedUrls = currentUrls.filter((url) => url !== photoToDelete);
    onChange(updatedUrls);

    try {
      if (photoToDelete.includes('supabase.co')) {
        await deleteImageFromStorage(photoToDelete, bucket);
      }
      showToast('Photo supprimée du stockage avec succès', 'info');
    } catch (err: any) {
      console.warn('Erreur lors de la suppression du stockage:', err);
      showToast('Photo retirée de la liste', 'info');
    } finally {
      setDeleteModalPhoto(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden file inputs: Desktop file browser + Mobile camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Label section */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {label}
            {multiple && (
              <span className="text-slate-400 font-normal ml-1">
                ({currentUrls.length} / {maxFiles} photo{maxFiles > 1 ? 's' : ''})
              </span>
            )}
          </label>
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Fichiers de votre ordinateur</span>
          </span>
        </div>
      )}

      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}

      {/* Galerie des photos actuelles avec miniatures & contrôles */}
      {currentUrls.length > 0 && (
        <div className="space-y-3">
          <div className={`grid gap-3 ${multiple ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {currentUrls.map((url, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={`${url}-${idx}`}
                  className={`relative group rounded-2xl overflow-hidden border transition-all aspect-video bg-slate-900 ${
                    isPrimary && multiple
                      ? 'ring-2 ring-[#D62828] border-transparent shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Badge "Photo Principale" pour multi-fichiers */}
                  {multiple && (
                    isPrimary ? (
                      <div className="absolute top-2 left-2 z-10 bg-[#D62828] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Principale</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        title="Définir comme photo principale"
                        className="absolute top-2 left-2 z-10 bg-black/60 hover:bg-[#D62828] text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs"
                      >
                        <Star className="w-3 h-3" />
                        <span>Mettre en 1ère</span>
                      </button>
                    )
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                    {/* Réorganisation */}
                    {multiple && currentUrls.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'left')}
                          disabled={idx === 0}
                          title="Déplacer vers la gauche"
                          className="p-1 rounded bg-white/20 hover:bg-white/40 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'right')}
                          disabled={idx === currentUrls.length - 1}
                          title="Déplacer vers la droite"
                          className="p-1 rounded bg-white/20 hover:bg-white/40 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Bouton de suppression */}
                    <button
                      type="button"
                      onClick={() => setDeleteModalPhoto(url)}
                      title="Supprimer cette photo"
                      className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-xs cursor-pointer ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Boutons d'action après téléversement */}
          {!multiple && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<FolderOpen className="w-4 h-4 text-blue-600" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-bold"
              >
                Changer la photo depuis l'ordinateur
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Camera className="w-4 h-4 text-emerald-600" />}
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs"
              >
                Prendre une photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                onClick={() => setDeleteModalPhoto(currentUrls[0])}
                className="text-xs text-rose-600 hover:bg-rose-50"
              >
                Supprimer
              </Button>
            </div>
          )}

          {multiple && currentUrls.length < maxFiles && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-bold"
              >
                + Ajouter d'autres photos depuis l'ordinateur ({maxFiles - currentUrls.length} restante{maxFiles - currentUrls.length > 1 ? 's' : ''})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Camera className="w-4 h-4 text-emerald-600" />}
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs"
              >
                Appareil photo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Envois en cours dans la file d'attente (avec barres de progression) */}
      {uploadingQueue.length > 0 && (
        <div className="space-y-2">
          {uploadingQueue.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                item.status === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50/70 border-blue-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-12 h-9 rounded-lg object-cover bg-slate-900 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold truncate max-w-[200px]">{item.name}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {item.status === 'compressing' && 'Optimisation WebP...'}
                      {item.status === 'uploading' && `Téléversement (${item.progress}%)`}
                      {item.status === 'error' && 'Échec'}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        item.status === 'error' ? 'bg-red-500' : 'bg-[#1B2A6B]'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  {item.errorMessage && (
                    <p className="text-[11px] text-rose-600 mt-1">{item.errorMessage}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.status === 'error' ? (
                  <button
                    type="button"
                    onClick={() => handleRetry(item)}
                    className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-[#1B2A6B] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Réessayer</span>
                  </button>
                ) : (
                  <Loader2 className="w-4 h-4 text-[#1B2A6B] animate-spin" />
                )}

                <button
                  type="button"
                  onClick={() => handleCancelUploading(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Annuler"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone de Glisser-Déposer & Bouton principal d'envoi depuis l'ordinateur */}
      {currentUrls.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#1B2A6B] bg-blue-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-[#1B2A6B] bg-slate-50/60 hover:bg-blue-50/30'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-[#1B2A6B] flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7 text-[#1B2A6B]" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                {multiple
                  ? 'Glissez-déposez vos photos ici ou parcourez votre ordinateur'
                  : 'Glissez-déposez votre photo ici ou parcourez votre ordinateur'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Formats acceptés : <strong>JPG, PNG, WebP</strong> • Max {maxSizeMB} Mo par fichier
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="inline-flex items-center gap-2 bg-[#1B2A6B] hover:bg-[#152152] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-white" />
                <span>{multiple ? 'Choisir des photos depuis mon ordinateur' : 'Choisir une photo depuis mon ordinateur'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                disabled={isUploading}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Appareil photo</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              ⚡ Compression WebP automatique pour un affichage ultra rapide sur le site
            </p>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteModalPhoto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Supprimer définitivement la photo ?</h4>
                <p className="text-xs text-slate-500">Cette action est irréversible.</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
              <img
                src={deleteModalPhoto}
                alt="Aperçu avant suppression"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-slate-600">
              Le fichier sera retiré de l'élément et définitivement supprimé du stockage Supabase.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalPhoto(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
