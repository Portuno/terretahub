import React, { useState } from 'react';
import { AuthUser, Property } from '../types';
import { supabase } from '../lib/supabase';
import { Toast } from './Toast';
import { PropertiesGallery } from './PropertiesGallery';
import { PropertyEditor } from './PropertyEditor';
import { uploadPropertyImagesToStorage, uploadPropertyVideosToStorage } from '../lib/propertyImageUtils';
import { generatePropertySlug } from '../lib/propertyUtils';

interface PropertiesPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const PropertiesPage: React.FC<PropertiesPageProps> = ({ user, onOpenAuth }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  type PropertyFormValues = Omit<
    Property,
    | 'id'
    | 'ownerId'
    | 'slug'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'videoUrls'
  > & {
    images: (File | string)[];
    videos: File[];
    contactEmail?: string | null;
    contactPhone?: string | null;
    contactWebsite?: string | null;
  };

  const handlePropertySave = async (formValues: PropertyFormValues) => {
    if (isSaving) {
      return;
    }

    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      setIsSaving(true);
      // 1. Crear fila mínima como draft para obtener id
      const { data: draftRow, error: insertError } = await supabase
        .from('properties')
        .insert({
          owner_id: user.id,
          title: formValues.title,
          description: formValues.description,
          operation_type: formValues.operationType,
          property_type: formValues.propertyType,
          status: 'draft',
          price: formValues.price,
          currency: formValues.currency,
          price_period: formValues.pricePeriod,
          deposit_amount: formValues.depositAmount ?? null,
          bills_included: formValues.billsIncluded,
          bedrooms: formValues.bedrooms ?? null,
          bathrooms: formValues.bathrooms ?? null,
          size_m2: formValues.sizeM2 ?? null,
          floor: formValues.floor ?? null,
          furnished: formValues.furnished,
          pets_allowed: formValues.petsAllowed,
          address: formValues.address ?? null,
          neighborhood: formValues.neighborhood ?? null,
          city: formValues.city ?? null,
          country: formValues.country ?? null,
          video_urls: [],
          external_link: formValues.externalLink ?? null,
          contact_email: formValues.contactEmail ?? null,
          contact_phone: formValues.contactPhone ?? null,
          contact_website: formValues.contactWebsite ?? null,
          images: [],
          slug: 'temp',
          available_from: formValues.availableFrom ?? null,
        })
        .select('id')
        .single();

      if (insertError || !draftRow) {
        console.error('[PropertiesPage] Error creating draft property:', insertError);
        alert('Error al crear la propiedad. Intenta nuevamente.');
        return;
      }

      const propertyId: string = draftRow.id;

      // 2. Subir imágenes a Storage (si las hay)
      const imageUrls =
        formValues.images && formValues.images.length > 0
          ? await uploadPropertyImagesToStorage(user.id, propertyId, formValues.images)
          : [];

      // 3. Subir vídeos a Storage (máx. 2)
      const videoUrls =
        formValues.videos && formValues.videos.length > 0
          ? await uploadPropertyVideosToStorage(user.id, propertyId, formValues.videos.slice(0, 2))
          : [];

      // 3. Generar slug definitivo
      const slug = generatePropertySlug(formValues.title, propertyId);

      // 4. Actualizar propiedad con todos los datos y publicarla
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          images: imageUrls,
          video_urls: videoUrls,
          status: 'published',
          slug,
          contact_email: formValues.contactEmail ?? null,
          contact_phone: formValues.contactPhone ?? null,
          contact_website: formValues.contactWebsite ?? null,
        })
        .eq('id', propertyId);

      if (updateError) {
        console.error('[PropertiesPage] Error publishing property:', updateError);
        alert('La propiedad se creó, pero hubo un error al publicarla. Intenta editarla más tarde.');
        return;
      }

      setShowToast(true);
      setIsCreating(false);
    } catch (err: any) {
      console.error('[PropertiesPage] Exception saving property:', err);
      alert('Error inesperado al guardar la propiedad. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCreating && user) {
    return (
      <PropertyEditor
        user={user}
        onCancel={() => setIsCreating(false)}
        onSave={handlePropertySave}
        isSaving={isSaving}
      />
    );
  }

  return (
    <>
      <PropertiesGallery
        user={user}
        onCreateProperty={user ? () => setIsCreating(true) : onOpenAuth}
      />
      {showToast && (
        <Toast
          message="¡Propiedad publicada!"
          secondaryMessage="Tu espacio ya está visible para la comunidad de Terreta Hub."
          onClose={() => setShowToast(false)}
          duration={6000}
          variant="terreta"
        />
      )}
    </>
  );
};

