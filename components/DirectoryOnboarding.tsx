import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AuthUser } from '../types';
import {
  DIRECTORY_CATEGORIES,
  CATEGORY_LABELS,
  SEEKING_OPTIONS,
  type DirectoryCategory,
  type DirectoryFocusMode,
  type SeekingOption,
  type UserDirectoryPrefs,
} from '../lib/directoryTypes';
import { getUserPrefs, listZones, upsertUserPrefs } from '../lib/directoryApi';
import { Toast } from './Toast';

interface OutletCtx {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

interface DirectoryOnboardingProps {
  onDone?: () => void;
  compact?: boolean;
}

export const DirectoryOnboarding: React.FC<DirectoryOnboardingProps> = ({ onDone, compact }) => {
  const { user, onOpenAuth } = useOutletContext<OutletCtx>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<DirectoryCategory[]>([]);
  const [seeking, setSeeking] = useState<SeekingOption[]>([]);
  const [focusMode, setFocusMode] = useState<DirectoryFocusMode>('explore');
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [zones, setZones] = useState<Array<{ id: number; name: string }>>([]);
  const [consent, setConsent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    listZones().then((r) => setZones(r.data.map((z) => ({ id: z.id, name: z.name }))));
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserPrefs(user.id).then((r) => {
      if (r.data) {
        setTags((r.data.interestTags || []).filter((t): t is DirectoryCategory =>
          (DIRECTORY_CATEGORIES as readonly string[]).includes(t)
        ));
        setSeeking((r.data.seeking || []) as SeekingOption[]);
        setFocusMode(r.data.focusMode || 'explore');
        setZoneId(r.data.zoneId);
        setConsent(r.data.consentPersonalization);
      }
    });
  }, [user?.id]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-terreta-border bg-terreta-card p-6 text-center">
        <p className="mb-3 text-sm text-terreta-dark/70">Iniciá sesión para personalizar el directorio.</p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="rounded-full bg-terreta-accent px-4 py-2 text-sm font-bold text-white"
        >
          Entrar
        </button>
      </div>
    );
  }

  const save = async (skipped: boolean) => {
    setSaving(true);
    const prefs: Partial<UserDirectoryPrefs> & { userId: string } = {
      userId: user.id,
      interestTags: tags,
      seeking,
      focusMode,
      zoneId,
      consentPersonalization: skipped ? false : consent,
      consentEmailAlerts: false,
      emailAlertsStub: true,
      onboardingSkipped: skipped,
      onboardingCompletedAt: new Date().toISOString(),
    };
    const error = await upsertUserPrefs(prefs);
    setSaving(false);
    if (error) {
      setToast(error);
      return;
    }
    onDone?.();
    navigate('/para-la-terreta');
  };

  return (
    <div className={`rounded-2xl border border-terreta-border bg-terreta-card ${compact ? 'p-4' : 'p-6'} space-y-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-terreta-dark">Para la Terreta</h2>
          <p className="text-sm text-terreta-dark/70">Onboarding corto (podés saltarlo).</p>
        </div>
        <button
          type="button"
          onClick={() => save(true)}
          className="text-xs font-semibold text-terreta-dark/50 hover:text-terreta-accent"
        >
          Saltar
        </button>
      </div>

      {step === 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Intereses</p>
          <div className="flex flex-wrap gap-2">
            {DIRECTORY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setTags((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
                }
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                  tags.includes(cat) ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-full bg-terreta-accent px-4 py-2 text-sm font-bold text-white"
          >
            Siguiente
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">¿Qué buscás?</p>
          <div className="flex flex-wrap gap-2">
            {SEEKING_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  setSeeking((prev) =>
                    prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]
                  )
                }
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  seeking.includes(opt) ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar text-terreta-dark'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(0)} className="rounded-full border border-terreta-border px-4 py-2 text-sm">
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full bg-terreta-accent px-4 py-2 text-sm font-bold text-white"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Foco vs exploración</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFocusMode('focus')}
              className={`rounded-full px-4 py-2 text-sm ${
                focusMode === 'focus' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar'
              }`}
            >
              Foco
            </button>
            <button
              type="button"
              onClick={() => setFocusMode('explore')}
              className={`rounded-full px-4 py-2 text-sm ${
                focusMode === 'explore' ? 'bg-terreta-accent text-white' : 'bg-terreta-sidebar'
              }`}
            >
              Exploración
            </button>
          </div>
          <select
            value={zoneId ?? ''}
            onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-terreta-border bg-terreta-bg px-3 py-2 text-sm"
          >
            <option value="">Zona (opcional)</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <label className="flex items-start gap-2 text-sm text-terreta-dark/80">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            Consentimiento para personalizar recomendaciones con estos datos (podés borrarlos en tu perfil).
          </label>
          <label className="flex items-start gap-2 text-sm text-terreta-dark/50">
            <input type="checkbox" disabled checked={false} className="mt-1" />
            Alertas por email (próximamente — stub)
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="rounded-full border border-terreta-border px-4 py-2 text-sm">
              Atrás
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(false)}
              className="rounded-full bg-terreta-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : null}

      {toast ? <Toast message={toast} variant="error" onClose={() => setToast('')} /> : null}
    </div>
  );
};
