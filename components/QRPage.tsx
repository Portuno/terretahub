import React, { useEffect, useMemo, useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import type { AuthUser, QRCodeRecord, QRCodeType, QRInternalLinkType, Project, Event } from '../types';
import { Link as LinkIcon, FileText, QrCode, Copy, Check, Trash2, ExternalLink, Loader2 } from 'lucide-react';

interface QRPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

type QRFormType = 'external' | 'internal' | 'pdf';

type InternalCategory = 'profile' | 'link_bio' | 'project' | 'event';

interface QRFormState {
  title: string;
  description: string;
  type: QRFormType;
  externalUrl: string;
  internalCategory: InternalCategory;
  selectedProjectId: string;
  selectedEventId: string;
}

const createInitialFormState = (): QRFormState => ({
  title: '',
  description: '',
  type: 'external',
  externalUrl: '',
  internalCategory: 'profile',
  selectedProjectId: '',
  selectedEventId: '',
});

const createRandomId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://terretahub.com';
};

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const getQRCodeTypeFromForm = (formType: QRFormType): QRCodeType => {
  if (formType === 'pdf') {
    return 'pdf';
  }
  if (formType === 'internal') {
    return 'internal_link';
  }
  return 'external_link';
};

const getInternalTypeFromCategory = (category: InternalCategory): QRInternalLinkType => {
  if (category === 'profile') {
    return 'profile';
  }
  if (category === 'link_bio') {
    return 'link_bio';
  }
  if (category === 'project') {
    return 'project';
  }
  return 'event';
};

const getInternalUrl = (user: AuthUser, category: InternalCategory, options: { project?: Project | null; event?: Event | null }): string => {
  const baseUrl = getBaseUrl();
  if (category === 'profile') {
    return `${baseUrl}/p/${user.username}`;
  }
  if (category === 'link_bio') {
    return `${baseUrl}/p/${user.username}`;
  }
  if (category === 'project' && options.project) {
    const slug = options.project.id
      ? options.project.id
      : options.project.name
      ? options.project.name
      : '';
    if (!slug) {
      return '';
    }
    return `${baseUrl}/proyecto/${slug}`;
  }
  if (category === 'event' && options.event) {
    if (!options.event.slug || !options.event.organizer?.username) {
      return '';
    }
    return `${baseUrl}/evento/${options.event.organizer.username}/${options.event.slug}`;
  }
  return '';
};

const QRPreview: React.FC<{ value: string; title?: string }> = ({ value, title }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const fileBaseName = title ? title.replace(/\s+/g, '-').toLowerCase() : 'qr-code';
  const PNG_QR_SIZE = 512;
  const PNG_LABEL_HEIGHT = 96;
  const PNG_CANVAS_WIDTH = PNG_QR_SIZE;
  const PNG_CANVAS_HEIGHT = PNG_QR_SIZE + PNG_LABEL_HEIGHT;

  const handleCopy = async () => {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('[QRPreview] Error copying to clipboard:', error);
    }
  };

  const getSvgString = (): string | null => {
    if (!value || !containerRef.current) {
      return null;
    }
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) {
      return null;
    }
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgElement);
  };

  const handleDownloadSvg = () => {
    const svgString = getSvgString();
    if (!svgString) {
      return;
    }
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileBaseName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePngDataUrlWithWatermark = (svgString: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = PNG_CANVAS_WIDTH;
        canvas.height = PNG_CANVAS_HEIGHT;
        const context = canvas.getContext('2d');

        if (!context) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, PNG_QR_SIZE, PNG_QR_SIZE);

        const watermarkText = 'Terreta Hub';
        context.fillStyle = '#A65D46';
        context.font = 'bold 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
        context.textAlign = 'right';
        const padding = 24;
        const textY = PNG_QR_SIZE + PNG_LABEL_HEIGHT / 2 + 8;
        context.fillText(watermarkText, canvas.width - padding, textY);

        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      image.src = url;
    });
  };

  const handleDownloadPng = async () => {
    const svgString = getSvgString();
    if (!svgString) {
      return;
    }
    const dataUrl = await generatePngDataUrlWithWatermark(svgString);
    if (!dataUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileBaseName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = async () => {
    const svgString = getSvgString();
    if (!svgString) {
      return;
    }
    const dataUrl = await generatePngDataUrlWithWatermark(svgString);
    if (!dataUrl) {
      return;
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgAspectRatio = PNG_CANVAS_HEIGHT / PNG_CANVAS_WIDTH;
    const maxImgWidth = pageWidth - 40; // 20mm de margen a cada lado
    const imgWidth = Math.min(120, maxImgWidth);
    const imgHeight = imgWidth * imgAspectRatio;

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);

    pdf.save(`${fileBaseName}.pdf`);
  };

  if (!value) {
    return (
      <div className="flex flex-col items-center justify-center h-full rounded-2xl border border-dashed border-terreta-border bg-terreta-card/40 px-6 py-8 text-center">
        <QrCode className="mb-3 text-terreta-dark/30" size={32} />
        <p className="text-sm text-terreta-dark/70">
          Completa el formulario para previsualizar tu código QR.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-terreta-border bg-terreta-card/60 p-4 md:p-6 h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-terreta-accent">
            Previsualización
          </p>
          {title ? (
            <p className="text-sm font-semibold text-terreta-dark line-clamp-1">
              {title}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-full border border-terreta-border bg-terreta-bg px-3 py-1.5 text-xs font-semibold text-terreta-dark hover:bg-terreta-sidebar transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copiado' : 'Copiar URL'}</span>
          </button>
          <div className="inline-flex items-center gap-1 rounded-full bg-terreta-accent px-1 py-1 text-xs font-semibold text-white">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="rounded-full px-2 py-0.5 hover:bg-terreta-dark/20 transition-colors"
            >
              SVG
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              className="rounded-full px-2 py-0.5 hover:bg-terreta-dark/20 transition-colors"
            >
              PNG
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-full px-2 py-0.5 hover:bg-terreta-dark/20 transition-colors"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div
          ref={containerRef}
          className="inline-flex items-center justify-center rounded-2xl bg-white p-4 shadow-md"
        >
          <QRCode value={value} size={192} level="Q" />
        </div>
      </div>

      <div className="flex w-full justify-end">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-terreta-dark/60">
          Terreta Hub
        </span>
      </div>

      <div className="rounded-xl bg-terreta-bg px-3 py-2 text-xs text-terreta-dark/70 break-all">
        {value}
      </div>
    </div>
  );
};

const DownloadIcon: React.FC = () => {
  return <ExternalLink size={14} />;
};

export const QRPage: React.FC<QRPageProps> = ({ user, onOpenAuth }) => {
  const [formState, setFormState] = useState<QRFormState>(createInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodes, setQrCodes] = useState<QRCodeRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [pdfTargetUrl, setPdfTargetUrl] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | QRCodeType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    const handleLoad = async () => {
      setIsLoadingList(true);
      try {
        const { data, error } = await supabase
          .from('qr_codes')
          .select(
            'id, user_id, type, title, description, target_url, internal_type, internal_ref, file_path, is_active, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[QRPage] Error loading QR codes:', error);
          return;
        }

        if (!data) {
          setQrCodes([]);
          return;
        }

        const mapped: QRCodeRecord[] = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          type: row.type,
          title: row.title,
          description: row.description ?? null,
          targetUrl: row.target_url,
          internalType: row.internal_type ?? null,
          internalRef: row.internal_ref ?? null,
          filePath: row.file_path ?? null,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        setQrCodes(mapped);
      } catch (error) {
        console.error('[QRPage] Exception loading QR codes:', error);
      } finally {
        setIsLoadingList(false);
      }
    };

    handleLoad();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleLoadProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, author_id, name, slogan, description, images, video_url, website, categories, technologies, phase, status, created_at')
          .eq('author_id', user.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[QRPage] Error loading projects for internal links:', error);
          return;
        }

        if (!data) {
          setProjects([]);
          return;
        }

        const mapped: Project[] = data.map((row: any) => ({
          id: row.id,
          authorId: row.author_id,
          name: row.name,
          slogan: row.slogan ?? '',
          description: row.description,
          images: Array.isArray(row.images) ? row.images : [],
          videoUrl: row.video_url ?? undefined,
          website: row.website ?? undefined,
          categories: Array.isArray(row.categories) ? row.categories : [],
          technologies: Array.isArray(row.technologies) ? row.technologies : [],
          phase: row.phase,
          status: row.status,
          createdAt: row.created_at,
        }));

        setProjects(mapped);
      } catch (error) {
        console.error('[QRPage] Exception loading projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    const handleLoadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select(
            'id, organizer_id, title, slug, description, location, location_url, start_date, end_date, image_url, category, is_online, max_attendees, registration_required, admission_type, attendee_question, date_public, date_placeholder, duration_minutes, location_public, location_placeholder, status, created_at, updated_at'
          )
          .eq('organizer_id', user.id)
          .eq('status', 'published')
          .order('start_date', { ascending: false });

        if (error) {
          console.error('[QRPage] Error loading events for internal links:', error);
          return;
        }

        if (!data) {
          setEvents([]);
          return;
        }

        const organizerIds = Array.from(new Set(data.map((row: any) => row.organizer_id)));
        let organizersById: Map<string, { id: string; name: string; username: string; avatar: string }> = new Map();

        if (organizerIds.length > 0) {
          const { data: organizers } = await supabase
            .from('profiles')
            .select('id, name, username, avatar')
            .in('id', organizerIds);

          organizers?.forEach((profile: any) => {
            organizersById.set(profile.id, {
              id: profile.id,
              name: profile.name ?? 'Usuario',
              username: profile.username ?? 'usuario',
              avatar:
                profile.avatar ??
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username ?? 'user'}`,
            });
          });
        }

        const mapped: Event[] = data.map((row: any) => {
          const organizer = organizersById.get(row.organizer_id);
          return {
            id: row.id,
            organizerId: row.organizer_id,
            organizer: {
              id: organizer?.id,
              name: organizer?.name ?? 'Usuario',
              avatar:
                organizer?.avatar ??
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${organizer?.username ?? 'user'}`,
              username: organizer?.username ?? 'usuario',
            },
            title: row.title,
            slug: row.slug ?? '',
            description: row.description ?? '',
            location: row.location ?? '',
            locationUrl: row.location_url ?? '',
            startDate: row.start_date,
            endDate: row.end_date,
            imageUrl: row.image_url ?? undefined,
            category: row.category ?? '',
            isOnline: row.is_online,
            maxAttendees: row.max_attendees ?? undefined,
            registrationRequired: row.registration_required ?? false,
            admissionType: row.admission_type ?? 'open',
            attendeeQuestion: row.attendee_question ?? '',
            datePublic: row.date_public ?? true,
            datePlaceholder: row.date_placeholder ?? '',
            durationMinutes: row.duration_minutes ?? undefined,
            locationPublic: row.location_public ?? true,
            locationPlaceholder: row.location_placeholder ?? '',
            status: row.status,
            attendeeCount: 0,
            isUserRegistered: false,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });

        setEvents(mapped);
      } catch (error) {
        console.error('[QRPage] Exception loading events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    handleLoadProjects();
    handleLoadEvents();
  }, [user]);

  const selectedProject = useMemo(() => {
    if (!formState.selectedProjectId) {
      return null;
    }
    return projects.find((project) => project.id === formState.selectedProjectId) ?? null;
  }, [formState.selectedProjectId, projects]);

  const selectedEvent = useMemo(() => {
    if (!formState.selectedEventId) {
      return null;
    }
    return events.find((event) => event.id === formState.selectedEventId) ?? null;
  }, [formState.selectedEventId, events]);

  const currentFormTargetUrl = useMemo(() => {
    if (!user) {
      return '';
    }

    if (formState.type === 'external') {
      return normalizeUrl(formState.externalUrl);
    }

    if (formState.type === 'internal') {
      return getInternalUrl(user, formState.internalCategory, {
        project: selectedProject,
        event: selectedEvent,
      });
    }

    if (formState.type === 'pdf') {
      return pdfTargetUrl;
    }

    return '';
  }, [user, formState, selectedProject, selectedEvent, pdfTargetUrl]);

  const selectedQr = useMemo(
    () => qrCodes.find((item) => item.id === selectedQrId) ?? null,
    [qrCodes, selectedQrId]
  );

  const previewValue = currentFormTargetUrl || selectedQr?.targetUrl || '';
  const previewTitle = formState.title || selectedQr?.title || '';

  const handleFieldChange = <K extends keyof QRFormState>(field: K, value: QRFormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTypeChange = (type: QRFormType) => {
    if (type === formState.type) {
      return;
    }
    setFormState((prev) => ({
      ...prev,
      type,
    }));
    if (type !== 'pdf') {
      setPdfTargetUrl('');
      setPdfUploadProgress('idle');
    }
  };

  const handleFilterChange = (value: 'all' | QRCodeType) => {
    setFilterType(value);
  };

  const filteredQrCodes = useMemo(() => {
    if (filterType === 'all') {
      return qrCodes;
    }
    return qrCodes.filter((item) => item.type === filterType);
  }, [qrCodes, filterType]);

  const handleCopyExistingUrl = async (id: string, url: string) => {
    if (!url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error('[QRPage] Error copying existing QR URL:', error);
    }
  };

  const handleDeactivateQr = async (id: string) => {
    if (!user) {
      return;
    }
    const confirmMessage =
      '¿Seguro que quieres desactivar este código QR? Dejará de estar disponible para nuevos escaneos.';
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[QRPage] Error deactivating QR code:', error);
        window.alert('Error al desactivar el QR. Intenta de nuevo más tarde.');
        return;
      }

      setQrCodes((prev) => prev.filter((item) => item.id !== id));
      if (selectedQrId === id) {
        setSelectedQrId(null);
      }
    } catch (error) {
      console.error('[QRPage] Exception deactivating QR code:', error);
      window.alert('Error al desactivar el QR. Intenta de nuevo más tarde.');
    }
  };

  const handlePdfChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    if (file.type !== 'application/pdf') {
      window.alert('Por favor selecciona un archivo PDF válido.');
      return;
    }

    setPdfUploadProgress('uploading');

    try {
      const extension = file.name.split('.').pop() || 'pdf';
      const filePath = `qr_pdfs/${user.id}/${createRandomId()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('qr_assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[QRPage] Error uploading PDF:', uploadError);
        setPdfUploadProgress('error');
        window.alert('Error al subir el PDF. Revisa el bucket `qr_assets` en Supabase.');
        return;
      }

      const { data: publicData } = supabase.storage.from('qr_assets').getPublicUrl(filePath);
      if (!publicData || !publicData.publicUrl) {
        setPdfUploadProgress('error');
        window.alert('No se pudo obtener la URL pública del PDF.');
        return;
      }

      setPdfTargetUrl(publicData.publicUrl);
      setPdfUploadProgress('uploaded');
    } catch (error) {
      console.error('[QRPage] Exception uploading PDF:', error);
      setPdfUploadProgress('error');
      window.alert('Error inesperado al subir el PDF.');
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!formState.title.trim()) {
      window.alert('El título es obligatorio.');
      return;
    }

    const targetUrl = currentFormTargetUrl;
    if (!targetUrl) {
      window.alert('Debes definir un destino válido para el QR.');
      return;
    }

    const qrType = getQRCodeTypeFromForm(formState.type);
    const internalType =
      formState.type === 'internal' ? getInternalTypeFromCategory(formState.internalCategory) : null;
    let internalRef: string | null = null;
    let filePath: string | null = null;

    if (formState.type === 'internal') {
      if (formState.internalCategory === 'project' && selectedProject) {
        internalRef = selectedProject.id;
      }
      if (formState.internalCategory === 'event' && selectedEvent) {
        internalRef = selectedEvent.id;
      }
      if (formState.internalCategory === 'profile' || formState.internalCategory === 'link_bio') {
        internalRef = user.username;
      }
    }

    if (formState.type === 'pdf') {
      if (!pdfTargetUrl) {
        window.alert('Primero debes subir un PDF para generar el QR.');
        return;
      }
      const baseUrl = getBaseUrl();
      if (pdfTargetUrl.startsWith(baseUrl)) {
        filePath = pdfTargetUrl;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        user_id: user.id,
        type: qrType,
        title: formState.title.trim(),
        description: formState.description.trim() || null,
        target_url: targetUrl,
        internal_type: internalType,
        internal_ref: internalRef,
        file_path: filePath,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('qr_codes')
        .insert(payload)
        .select(
          'id, user_id, type, title, description, target_url, internal_type, internal_ref, file_path, is_active, created_at, updated_at'
        )
        .single();

      if (error) {
        console.error('[QRPage] Error creating QR code:', error);
        window.alert('Error al crear el QR. Intenta de nuevo más tarde.');
        return;
      }

      const newRecord: QRCodeRecord = {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        targetUrl: data.target_url,
        internalType: data.internal_type ?? null,
        internalRef: data.internal_ref ?? null,
        filePath: data.file_path ?? null,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setQrCodes((prev) => [newRecord, ...prev]);
      setSelectedQrId(newRecord.id);
      setFormState((prev) => ({
        ...createInitialFormState(),
        type: prev.type,
      }));
      setPdfTargetUrl('');
      setPdfUploadProgress('idle');
    } catch (error) {
      console.error('[QRPage] Exception creating QR code:', error);
      window.alert('Error inesperado al crear el QR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="flex h-full flex-col items-center justify-center py-8">
        <div className="max-w-md rounded-2xl border border-terreta-border bg-terreta-card/80 px-6 py-8 text-center shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-terreta-accent/10 text-terreta-accent">
            <QrCode size={24} />
          </div>
          <h1 className="mb-2 font-serif text-2xl font-semibold text-terreta-dark">
            Crea tus códigos QR
          </h1>
          <p className="mb-4 text-sm text-terreta-dark/70">
            Inicia sesión para crear, guardar y gestionar tus códigos QR para enlaces, proyectos,
            eventos y PDFs dentro de Terreta Hub.
          </p>
          <button
            type="button"
            onClick={() => onOpenAuth()}
            className="inline-flex items-center justify-center rounded-full bg-terreta-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90"
          >
            Iniciar sesión
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-terreta-dark">
            Creador de códigos QR
          </h1>
          <p className="mt-1 text-sm md:text-base text-terreta-dark/70">
            Genera códigos QR persistentes para compartir enlaces externos, recursos de Terreta
            (perfil, proyectos, eventos) y PDFs. Todos tus QR se guardan para que puedas usarlos en
            cartelería, redes o material físico.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-terreta-border bg-terreta-card/70 p-4 md:p-6"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-terreta-accent">
                Nuevo QR
              </p>
              <p className="text-sm text-terreta-dark/70">
                Define el tipo de destino y los detalles básicos del QR.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-terreta-border bg-terreta-bg p-1">
              <button
                type="button"
                onClick={() => handleTypeChange('external')}
                aria-pressed={formState.type === 'external'}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  formState.type === 'external'
                    ? 'bg-terreta-accent text-white'
                    : 'text-terreta-dark/70 hover:bg-terreta-card'
                }`}
              >
                <LinkIcon size={14} />
                <span>Enlace externo</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('internal')}
                aria-pressed={formState.type === 'internal'}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  formState.type === 'internal'
                    ? 'bg-terreta-accent text-white'
                    : 'text-terreta-dark/70 hover:bg-terreta-card'
                }`}
              >
                <QrCode size={14} />
                <span>Enlace Terreta</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('pdf')}
                aria-pressed={formState.type === 'pdf'}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  formState.type === 'pdf'
                    ? 'bg-terreta-accent text-white'
                    : 'text-terreta-dark/70 hover:bg-terreta-card'
                }`}
              >
                <FileText size={14} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-terreta-dark">
                Título *
              </label>
              <input
                type="text"
                value={formState.title}
                onChange={(event) => handleFieldChange('title', event.target.value)}
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm text-terreta-dark outline-none transition-colors focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent"
                placeholder="Ej: QR para mi perfil público"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-terreta-dark">
                Descripción
              </label>
              <input
                type="text"
                value={formState.description}
                onChange={(event) => handleFieldChange('description', event.target.value)}
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm text-terreta-dark outline-none transition-colors focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent"
                placeholder="Nota interna para recordar dónde lo usarás"
              />
            </div>
          </div>

          {formState.type === 'external' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-terreta-dark">
                URL externa *
              </label>
              <input
                type="url"
                value={formState.externalUrl}
                onChange={(event) => handleFieldChange('externalUrl', event.target.value)}
                className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm text-terreta-dark outline-none transition-colors focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent"
                placeholder="https://tusitio.com/landing"
              />
              <p className="text-xs text-terreta-dark/60">
                Asegúrate de que la URL incluya <span className="font-semibold">http://</span> o{' '}
                <span className="font-semibold">https://</span>. Si no, la completaremos con
                https:// automáticamente.
              </p>
            </div>
          ) : null}

          {formState.type === 'internal' ? (
            <div className="flex flex-col gap-3 rounded-xl bg-terreta-bg/60 p-3 md:p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-terreta-dark">
                    Enlace interno de Terreta
                  </p>
                  <p className="text-xs text-terreta-dark/70">
                    Elige qué recurso quieres enlazar: tu perfil, link-in-bio, proyectos o eventos.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-terreta-border bg-terreta-card p-1">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('internalCategory', 'profile')}
                    aria-pressed={formState.internalCategory === 'profile'}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      formState.internalCategory === 'profile'
                        ? 'bg-terreta-accent text-white'
                        : 'text-terreta-dark/70 hover:bg-terreta-bg'
                    }`}
                  >
                    Perfil público
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('internalCategory', 'link_bio')}
                    aria-pressed={formState.internalCategory === 'link_bio'}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      formState.internalCategory === 'link_bio'
                        ? 'bg-terreta-accent text-white'
                        : 'text-terreta-dark/70 hover:bg-terreta-bg'
                    }`}
                  >
                    Link-in-bio
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('internalCategory', 'project')}
                    aria-pressed={formState.internalCategory === 'project'}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      formState.internalCategory === 'project'
                        ? 'bg-terreta-accent text-white'
                        : 'text-terreta-dark/70 hover:bg-terreta-bg'
                    }`}
                  >
                    Proyecto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('internalCategory', 'event')}
                    aria-pressed={formState.internalCategory === 'event'}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      formState.internalCategory === 'event'
                        ? 'bg-terreta-accent text-white'
                        : 'text-terreta-dark/70 hover:bg-terreta-bg'
                    }`}
                  >
                    Evento
                  </button>
                </div>
              </div>

              {formState.internalCategory === 'project' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-terreta-dark">
                    Proyecto publicado
                  </label>
                  {isLoadingProjects ? (
                    <div className="flex items-center gap-2 text-xs text-terreta-dark/70">
                      <Loader2 className="animate-spin text-terreta-accent" size={16} />
                      <span>Cargando tus proyectos...</span>
                    </div>
                  ) : projects.length === 0 ? (
                    <p className="text-xs text-terreta-dark/70">
                      No tienes proyectos publicados todavía. Crea uno en la sección{' '}
                      <span className="font-semibold">Proyectos</span> y vuelve aquí para generar su
                      QR.
                    </p>
                  ) : (
                    <select
                      value={formState.selectedProjectId}
                      onChange={(event) =>
                        handleFieldChange('selectedProjectId', event.target.value)
                      }
                      className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm text-terreta-dark outline-none transition-colors focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent"
                    >
                      <option value="">Selecciona un proyecto...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : null}

              {formState.internalCategory === 'event' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-terreta-dark">
                    Evento publicado
                  </label>
                  {isLoadingEvents ? (
                    <div className="flex items-center gap-2 text-xs text-terreta-dark/70">
                      <Loader2 className="animate-spin text-terreta-accent" size={16} />
                      <span>Cargando tus eventos...</span>
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-xs text-terreta-dark/70">
                      No tienes eventos publicados todavía. Crea uno en la sección{' '}
                      <span className="font-semibold">Eventos</span> y vuelve aquí para generar su
                      QR.
                    </p>
                  ) : (
                    <select
                      value={formState.selectedEventId}
                      onChange={(event) => handleFieldChange('selectedEventId', event.target.value)}
                      className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm text-terreta-dark outline-none transition-colors focus:border-terreta-accent focus:ring-1 focus:ring-terreta-accent"
                    >
                      <option value="">Selecciona un evento...</option>
                      {events.map((eventItem) => (
                        <option key={eventItem.id} value={eventItem.id}>
                          {eventItem.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : null}

              {formState.internalCategory === 'profile' || formState.internalCategory === 'link_bio' ? (
                <div className="rounded-lg bg-terreta-card/80 px-3 py-2 text-xs text-terreta-dark/80">
                  <p className="font-semibold">
                    Enlace sugerido:{' '}
                    <span className="font-mono text-terreta-accent">
                      {getInternalUrl(user, formState.internalCategory, {
                        project: null,
                        event: null,
                      })}
                    </span>
                  </p>
                  <p className="mt-1">
                    Perfecto para tarjetas personales, CVs, presentaciones y material físico.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {formState.type === 'pdf' ? (
            <div className="flex flex-col gap-2 rounded-xl bg-terreta-bg/60 p-3 md:p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-terreta-dark">
                Archivo PDF *
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="w-full cursor-pointer rounded-lg border border-dashed border-terreta-border bg-terreta-card px-3 py-2 text-xs text-terreta-dark/80 file:mr-3 file:rounded-md file:border-0 file:bg-terreta-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:border-terreta-accent/60"
              />
              {pdfUploadProgress === 'uploading' ? (
                <p className="flex items-center gap-2 text-xs text-terreta-dark/70">
                  <Loader2 className="animate-spin text-terreta-accent" size={14} />
                  Subiendo PDF a Supabase Storage...
                </p>
              ) : null}
              {pdfUploadProgress === 'uploaded' && pdfTargetUrl ? (
                <p className="text-xs text-terreta-dark/80">
                  PDF subido correctamente. URL asociada:{' '}
                  <span className="break-all font-mono text-terreta-accent">{pdfTargetUrl}</span>
                </p>
              ) : null}
              {pdfUploadProgress === 'error' ? (
                <p className="text-xs text-red-500">
                  Hubo un problema al subir el PDF. Revisa la configuración del bucket
                  <span className="font-semibold"> qr_assets</span> en Supabase.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-full bg-terreta-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Creando QR...
                </>
              ) : (
                <>
                  <QrCode className="mr-2" size={16} />
                  Crear QR
                </>
              )}
            </button>
          </div>
        </form>

        <QRPreview value={previewValue} title={previewTitle} />
      </div>

      <section className="mt-2 flex flex-col gap-3 rounded-2xl border border-terreta-border bg-terreta-card/60 p-4 md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-terreta-accent">
              Tus códigos QR
            </p>
            <p className="text-sm text-terreta-dark/70">
              Reutiliza tus QR para campañas recurrentes. Puedes copiar el enlace, previsualizarlos
              o desactivarlos cuando ya no los quieras usar.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-terreta-border bg-terreta-bg p-1">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-terreta-accent text-white'
                  : 'text-terreta-dark/70 hover:bg-terreta-card'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('external_link')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterType === 'external_link'
                  ? 'bg-terreta-accent text-white'
                  : 'text-terreta-dark/70 hover:bg-terreta-card'
              }`}
            >
              Enlaces
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('internal_link')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterType === 'internal_link'
                  ? 'bg-terreta-accent text-white'
                  : 'text-terreta-dark/70 hover:bg-terreta-card'
              }`}
            >
              Terreta
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('pdf')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterType === 'pdf'
                  ? 'bg-terreta-accent text-white'
                  : 'text-terreta-dark/70 hover:bg-terreta-card'
              }`}
            >
              PDFs
            </button>
          </div>
        </div>

        {isLoadingList ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-sm text-terreta-dark/70">
              <Loader2 className="animate-spin text-terreta-accent" size={18} />
              <span>Cargando tus códigos QR...</span>
            </div>
          </div>
        ) : filteredQrCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-terreta-border bg-terreta-bg/60 px-4 py-8 text-center">
            <QrCode className="mb-1 text-terreta-dark/25" size={28} />
            <p className="text-sm font-medium text-terreta-dark">
              Aún no has creado ningún código QR.
            </p>
            <p className="text-xs text-terreta-dark/70">
              Empieza creando uno arriba para tu perfil, tus proyectos o tus eventos.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredQrCodes.map((item) => {
              const isSelected = selectedQrId === item.id;
              const isCopied = copiedId === item.id;
              const createdLabel = new Date(item.createdAt).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const typeLabel =
                item.type === 'pdf'
                  ? 'PDF'
                  : item.type === 'internal_link'
                  ? 'Terreta'
                  : 'Enlace';

              return (
                <article
                  key={item.id}
                  className={`flex flex-col gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? 'border-terreta-accent bg-terreta-card shadow-md'
                      : 'border-terreta-border bg-terreta-card/70 hover:border-terreta-accent/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedQrId(item.id)}
                    className="text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-terreta-accent">
                          {typeLabel}
                        </p>
                        <p className="text-sm font-semibold text-terreta-dark line-clamp-2">
                          {item.title}
                        </p>
                        {item.description ? (
                          <p className="text-xs text-terreta-dark/70 line-clamp-2">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-terreta-dark/60">Creado el {createdLabel}</p>
                    <p className="mt-1 line-clamp-2 break-all text-[11px] text-terreta-dark/70">
                      {item.targetUrl}
                    </p>
                  </button>

                  <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopyExistingUrl(item.id, item.targetUrl)}
                      className="inline-flex items-center gap-1 rounded-full bg-terreta-bg px-2.5 py-1 font-semibold text-terreta-dark hover:bg-terreta-sidebar"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedQrId(item.id)}
                        className="rounded-full bg-terreta-bg px-2 py-1 font-semibold text-terreta-dark hover:bg-terreta-sidebar"
                      >
                        Ver QR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeactivateQr(item.id)}
                        className="inline-flex items-center justify-center rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
};

