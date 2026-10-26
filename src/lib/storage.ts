import { supabase } from './supabase';

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  maxWidth?: number;
  quality?: number;
  onProgress?: (percent: number) => void;
}

export interface UploadResult {
  url: string;
  path: string;
  originalName: string;
  size: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const CAR_SILHOUETTE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240' fill='none'%3E%3Crect width='400' height='240' fill='%230F172A'/%3E%3Cpath d='M60 148L110 85H290L340 148H360C368 148 375 155 375 163V178H25V163C25 155 32 148 40 148H60Z' fill='%23334155'/%3E%3Cpath d='M118 95L82 140H190V95H118Z' fill='%231E293B'/%3E%3Cpath d='M210 95V140H318L282 95H210Z' fill='%231E293B'/%3E%3Ccircle cx='110' cy='178' r='30' fill='%23D62828' stroke='%23FFFFFF' stroke-width='6'/%3E%3Ccircle cx='290' cy='178' r='30' fill='%23D62828' stroke='%23FFFFFF' stroke-width='6'/%3E%3Ccircle cx='110' cy='178' r='12' fill='%23FFFFFF'/%3E%3Ccircle cx='290' cy='178' r='12' fill='%23FFFFFF'/%3E%3Ctext x='200' y='225' fill='%2394A3B8' font-family='sans-serif' font-size='13' font-weight='600' text-anchor='middle'%3EOFFICINA DJENEKA%3C/text%3E%3C/svg%3E";

/**
 * Valide le fichier (format et taille)
 */
export function validateImageFile(file: File, maxSizeMB = 5): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Format non supporté (${file.type || 'inconnu'}). Seules les images JPG, PNG et WebP sont acceptées.`,
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Cette image dépasse ${maxSizeMB} Mo (${fileSizeMB} Mo). Veuillez choisir un fichier plus léger.`,
    };
  }

  return { valid: true };
}

/**
 * Compresse l'image dans le navigateur via Canvas :
 * - Redimensionne à 1600 px max de large/haut tout en préservant le ratio
 * - Convertit en format WebP avec qualité 0.82
 * Optimisé pour la rapidité sur réseau mobile ivoirien.
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Si c'est déjà un WebP léger de petite taille, pas besoin de ré-encoder
    if (file.type === 'image/webp' && file.size < 500 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calcul des proportions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) {
        reject(new Error('Impossible d\'initialiser le contexte de compression graphique.'));
        return;
      }

      // Lissage de haute qualité
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback si WebP n'est pas supporté par le navigateur
            canvas.toBlob(
              (fallbackBlob) => {
                if (fallbackBlob) resolve(fallbackBlob);
                else reject(new Error('Erreur lors de la conversion de l\'image.'));
              },
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Impossible de lire le fichier image sélectionné.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Génère un chemin de fichier unique et propre :
 * `${folder}/${Date.now()}-${random}.webp`
 */
export function generateCleanStoragePath(folder = 'misc', ext = 'webp'): string {
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_\-]/g, '').toLowerCase() || 'misc';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${sanitizedFolder}/${timestamp}-${randomStr}.${ext}`;
}

/**
 * Extrait le chemin relatif dans le bucket à partir d'une URL Supabase Storage
 * Ex: https://.../storage/v1/object/public/media/rental/123-abc.webp -> "rental/123-abc.webp"
 */
export function extractStoragePathFromUrl(url: string, bucket = 'media'): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const searchPath = `/storage/v1/object/public/${bucket}/`;
    const searchSignPath = `/storage/v1/object/sign/${bucket}/`;

    if (urlObj.pathname.includes(searchPath)) {
      const idx = urlObj.pathname.indexOf(searchPath);
      return decodeURIComponent(urlObj.pathname.substring(idx + searchPath.length));
    }

    if (urlObj.pathname.includes(searchSignPath)) {
      const idx = urlObj.pathname.indexOf(searchSignPath);
      return decodeURIComponent(urlObj.pathname.substring(idx + searchSignPath.length));
    }

    // Cas d'une URL avec format alternatif /storage/v1/object/${bucket}/...
    const directPattern = new RegExp(`/storage/v1/object/(?:public/)?${bucket}/(.+)`);
    const match = urlObj.pathname.match(directPattern);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }

    return null;
  } catch {
    // Si ce n'est pas une URL valide complète (déjà un chemin relatif)
    if (url.includes('/') && !url.startsWith('http')) {
      return url;
    }
    return null;
  }
}

/**
 * Envoie une image vers Supabase Storage avec compression préalable
 */
export async function uploadImageToStorage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    bucket = 'media',
    folder = 'rental',
    maxSizeMB = 5,
    maxWidth = 1600,
    quality = 0.82,
    onProgress,
  } = options;

  // 1. Validation
  const validation = validateImageFile(file, maxSizeMB);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (onProgress) onProgress(20);

  // 2. Compression en WebP
  let compressedBlob: Blob;
  try {
    compressedBlob = await compressImageToWebP(file, maxWidth, maxWidth, quality);
  } catch (err: any) {
    console.warn('Compression échouée, utilisation du fichier d\'origine:', err);
    compressedBlob = file;
  }

  if (onProgress) onProgress(50);

  // 3. Préparation du chemin propre
  const path = generateCleanStoragePath(folder, 'webp');

  // 4. Envoi vers Supabase Storage
  const { error } = await supabase.storage.from(bucket).upload(path, compressedBlob, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    const errorMsg = error.message || '';
    if (
      errorMsg.toLowerCase().includes('violates row-level security') ||
      errorMsg.toLowerCase().includes('policy')
    ) {
      throw new Error(
        "Vous n'avez pas le droit d'envoyer des photos. Reconnectez-vous en tant qu'administrateur ou membre du personnel."
      );
    }
    throw new Error(`Échec de l'envoi de l'image : ${errorMsg}`);
  }

  if (onProgress) onProgress(90);

  // 5. Récupération de l'URL publique
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  if (onProgress) onProgress(100);

  return {
    url: publicUrl,
    path,
    originalName: file.name,
    size: compressedBlob.size,
  };
}

/**
 * Supprime une photo de Supabase Storage à partir de son URL ou de son chemin
 */
export async function deleteImageFromStorage(
  urlOrPath: string,
  bucket = 'media'
): Promise<boolean> {
  const path = extractStoragePathFromUrl(urlOrPath, bucket) || urlOrPath;
  if (!path) return false;

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn(`Impossible de supprimer le fichier ${path} du bucket ${bucket}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Erreur suppression storage:`, err);
    return false;
  }
}

/**
 * Supprime plusieurs photos du Storage
 */
export async function deleteImagesFromStorage(
  urls: string[],
  bucket = 'media'
): Promise<number> {
  const paths = urls
    .map((u) => extractStoragePathFromUrl(u, bucket))
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return 0;

  try {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.warn('Erreur suppression multiple storage:', error.message);
      return 0;
    }
    return data ? data.length : paths.length;
  } catch (err) {
    console.warn('Exception suppression multiple storage:', err);
    return 0;
  }
}
