-- ============================================================================
-- OFFICINA DJENEKA - CONFIGURATION STORAGE POUR LE BUCKET PUBLIC "media"
-- Fichier : supabase/storage_media.sql
-- Idempotent : Peut être exécuté plusieurs fois dans le SQL Editor de Supabase
-- ============================================================================

-- 1. VÉRIFICATION DES FONCTIONS DE SÉCURITÉ (security definer, anti-récursion)
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select role into v_role
  from public.profiles
  where id = auth.uid()
  limit 1;

  return coalesce(v_role = 'admin', false);
end;
$$;

create or replace function public.is_staff()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select role into v_role
  from public.profiles
  where id = auth.uid()
  limit 1;

  return coalesce(v_role in ('admin', 'mecanicien', 'receptionniste'), false);
end;
$$;

-- 2. CRÉATION OU MISE À JOUR DU BUCKET PUBLIC "media"
-- Taille max : 5 Mo (5242880 octets), types MIME : JPEG, PNG, WebP, GIF
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. CRÉATION DU BUCKET PRIVÉ "documents" (pour les états des lieux & pièces clients)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

-- 4. POLITIQUES DE SÉCURITÉ SUR storage.objects POUR LE BUCKET "media"
-- Nettoyage des anciennes politiques pour garantir l'idempotence
drop policy if exists "media_public_read" on storage.objects;
drop policy if exists "media_staff_insert" on storage.objects;
drop policy if exists "media_staff_update" on storage.objects;
drop policy if exists "media_admin_delete" on storage.objects;

drop policy if exists "Public Access for Media" on storage.objects;
drop policy if exists "Staff can upload media" on storage.objects;
drop policy if exists "Staff can update media" on storage.objects;
drop policy if exists "Admin can delete media" on storage.objects;

-- 4.1 Lecture publique : Tout le monde (y compris les visiteurs anonymes) peut voir les photos
create policy "media_public_read"
  on storage.objects
  for select
  using (bucket_id = 'media');

-- 4.2 Envoi de fichiers : Réservé aux membres authentifiés du personnel (admin, mécanicien, réceptionniste)
create policy "media_staff_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_staff());

-- 4.3 Modification de fichiers : Réservé au personnel
create policy "media_staff_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'media' and public.is_staff());

-- 4.4 Suppression de fichiers : Réservé exclusivement à l'administrateur
create policy "media_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- 5. POLITIQUES POUR LE BUCKET "documents" (États des lieux et contrats)
drop policy if exists "documents_staff_access" on storage.objects;
create policy "documents_staff_access"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'documents' and public.is_staff())
  with check (bucket_id = 'documents' and public.is_staff());

-- 6. COLONNES DE SUPPORT DANS rental_vehicles
-- S'assure que les colonnes photo_principale et photos existent bien
alter table if exists public.rental_vehicles
  add column if not exists photo_principale text,
  add column if not exists photos text[] default '{}'::text[];

-- Si photo_principale est vide mais que photos contient des images, initialiser
update public.rental_vehicles
set photo_principale = photos[1]
where photo_principale is null and array_length(photos, 1) > 0;

-- 7. COMMENT VÉRIFIER DANS LA CONSOLE SUPABASE :
-- 1. Allez dans le menu de gauche : Storage -> Buckets
-- 2. Vérifiez que le bucket "media" est présent avec le badge "Public"
-- 3. Cliquez sur "Configuration" ou "Policies" sur le bucket media :
--    - SELECT : public_read (ouvert à tous)
--    - INSERT : media_staff_insert (authentifié + is_staff)
--    - UPDATE : media_staff_update (authentifié + is_staff)
--    - DELETE : media_admin_delete (authentifié + is_admin)
