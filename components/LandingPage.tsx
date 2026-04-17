import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronDown, Compass, Flame, MapPinned, MessageCircle, Sparkles, Users, Wrench } from 'lucide-react';
import { THEMES, Theme, useTheme } from '../context/ThemeContext';
import { AuthUser } from '../types';
import { SectionLearningModal } from './SectionLearningModal';
import {
  completeTopicAndAwardTotes,
  fetchCompletedTotesTopics,
  fetchUserTotesSummary,
  TotesTopicKey
} from '../lib/totes';

interface DashboardOutletContext {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onOpenFeedback: () => void;
}

interface ExploreOption {
  key: TotesTopicKey;
  label: string;
  icon: React.ReactNode;
  handleAction: () => void;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, onOpenAuth, onOpenFeedback } = useOutletContext<DashboardOutletContext>();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isAnimatingView, setIsAnimatingView] = useState(false);
  const [activeTopic, setActiveTopic] = useState<TotesTopicKey | null>(null);
  const [isCompletingTopic, setIsCompletingTopic] = useState(false);
  const [totesBalance, setTotesBalance] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<Set<TotesTopicKey>>(new Set());
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const localProgressKey = user ? `terreta_totes_progress_${user.id}` : null;

  const handleGoToFinde = () => {
    navigate('/terreta');
  };

  const handleGoToExplore = () => {
    if (isAnimatingView) {
      return;
    }

    setIsAnimatingView(true);
    setTimeout(() => {
      setIsExploreOpen(true);
      setIsAnimatingView(false);
    }, 200);
  };

  const handleSelectTheme = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsThemeMenuOpen(false);
  };

  const loadTotesData = async (userId: string) => {
    const localKey = `terreta_totes_progress_${userId}`;
    let localBalance = 0;
    let localCompleted = new Set<TotesTopicKey>();

    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { balance?: number; completed?: string[] };
        localBalance = Number(parsed.balance) || 0;
        localCompleted = new Set(
          (parsed.completed ?? []).filter((topic) =>
            ['perfil', 'foro', 'mapa', 'recursos', 'comunidad', 'dominio', 'feedback'].includes(topic)
          ) as TotesTopicKey[]
        );
      }
    } catch (error) {
      console.warn('[LandingPage] No se pudo leer progreso local de totes', error);
    }

    const [summary, topics] = await Promise.all([
      fetchUserTotesSummary(userId),
      fetchCompletedTotesTopics(userId)
    ]);

    const mergedBalance = Math.max(summary.balance, localBalance);
    const mergedTopics = new Set<TotesTopicKey>([...topics, ...localCompleted]);

    setTotesBalance(mergedBalance);
    setCompletedTopics(mergedTopics);
  };

  useEffect(() => {
    setRewardMessage(null);
    if (!user) {
      setTotesBalance(0);
      setCompletedTopics(new Set());
      return;
    }

    loadTotesData(user.id);
  }, [user]);

  const handleExecuteAction = (topic: TotesTopicKey) => {
    if (topic === 'feedback') {
      onOpenFeedback();
      return;
    }

    const routeByTopic: Record<Exclude<TotesTopicKey, 'feedback'>, string> = {
      perfil: '/perfil',
      foro: '/agora',
      mapa: '/eventos',
      recursos: '/recursos',
      comunidad: '/comunidad',
      dominio: '/dominio'
    };

    if (topic === 'perfil' && !user) {
      onOpenAuth();
      return;
    }

    navigate(routeByTopic[topic]);
  };

  const handleOpenTopic = (topic: TotesTopicKey) => {
    setRewardMessage(null);
    const mustShowLearning = !user || !completedTopics.has(topic);

    if (!mustShowLearning) {
      handleExecuteAction(topic);
      return;
    }

    setActiveTopic(topic);
  };

  const handleCompleteTopic = async () => {
    if (!activeTopic) {
      return;
    }

    if (!user) {
      setActiveTopic(null);
      onOpenAuth();
      return;
    }

    if (completedTopics.has(activeTopic)) {
      const topicToNavigate = activeTopic;
      setActiveTopic(null);
      handleExecuteAction(topicToNavigate);
      return;
    }

    setIsCompletingTopic(true);
    try {
      const result = await completeTopicAndAwardTotes(activeTopic);
      const updatedTopics = new Set([...completedTopics, activeTopic]);
      setCompletedTopics(updatedTopics);

      if (result.awarded) {
        setTotesBalance(result.balance);
        setRewardMessage('+12 Totes desbloqueados');
      }

      if (localProgressKey) {
        localStorage.setItem(
          localProgressKey,
          JSON.stringify({
            balance: result.awarded ? result.balance : totesBalance,
            completed: Array.from(updatedTopics)
          })
        );
      }

      const topicToNavigate = activeTopic;
      setActiveTopic(null);
      handleExecuteAction(topicToNavigate);
    } catch (error) {
      console.error('[LandingPage] Error completing learning topic, usando fallback local:', error);
      const nextBalance = totesBalance + 12;
      const nextCompleted = new Set([...completedTopics, activeTopic]);

      setTotesBalance(nextBalance);
      setCompletedTopics(nextCompleted);
      setRewardMessage('+12 Totes desbloqueados');

      if (localProgressKey) {
        localStorage.setItem(
          localProgressKey,
          JSON.stringify({
            balance: nextBalance,
            completed: Array.from(nextCompleted)
          })
        );
      }

      const topicToNavigate = activeTopic;
      setActiveTopic(null);
      handleExecuteAction(topicToNavigate);
    } finally {
      setIsCompletingTopic(false);
    }
  };

  const options: ExploreOption[] = [
    { key: 'perfil', label: 'Perfil', icon: <User size={16} />, handleAction: () => handleOpenTopic('perfil') },
    { key: 'foro', label: 'Foro', icon: <MessageCircle size={16} />, handleAction: () => handleOpenTopic('foro') },
    { key: 'mapa', label: 'Mapa', icon: <MapPinned size={16} />, handleAction: () => handleOpenTopic('mapa') },
    { key: 'recursos', label: 'Recursos', icon: <Wrench size={16} />, handleAction: () => handleOpenTopic('recursos') },
    { key: 'comunidad', label: 'Comunidad', icon: <Users size={16} />, handleAction: () => handleOpenTopic('comunidad') },
    { key: 'dominio', label: 'Explorar (Dominios)', icon: <Compass size={16} />, handleAction: () => handleOpenTopic('dominio') }
  ];

  const activeTopicLabel = options.find((option) => option.key === activeTopic)?.label ?? 'esta sección';

  return (
    <div className="relative flex h-full min-h-[calc(100vh-56px)] w-full items-start justify-center px-4 pb-8 pt-6 md:min-h-screen md:items-center md:pt-8">
      <div className="absolute left-4 top-4 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-terreta-border bg-terreta-card/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-terreta-dark shadow-md transition-colors hover:bg-terreta-bg"
            aria-label="Seleccionar elemento visual"
            aria-expanded={isThemeMenuOpen}
            aria-haspopup="listbox"
          >
            <Sparkles size={14} className="text-terreta-accent" />
            <span>{THEMES[theme].label}</span>
            <ChevronDown size={14} className={`${isThemeMenuOpen ? 'rotate-180' : ''} transition-transform`} />
          </button>
          {isThemeMenuOpen ? (
            <>
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(false)}
                className="fixed inset-0 z-10 bg-transparent"
                aria-label="Cerrar selector de elementos"
              />
              <div
                className="absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border border-terreta-border bg-terreta-card p-2 shadow-lg"
                role="listbox"
                aria-label="Opciones de elemento"
              >
                {(Object.keys(THEMES) as Theme[]).map((themeKey) => (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => handleSelectTheme(themeKey)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      theme === themeKey
                        ? 'bg-terreta-accent/15 text-terreta-dark'
                        : 'text-terreta-dark/80 hover:bg-terreta-bg'
                    }`}
                    aria-label={`Elegir elemento ${THEMES[themeKey].label}`}
                  >
                    <span>{THEMES[themeKey].label}</span>
                    {theme === themeKey ? (
                      <span className="text-xs font-bold uppercase text-terreta-accent">Actual</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <section className="w-full max-w-md pt-14 md:max-w-xl">
        <div className="relative min-h-[560px] overflow-hidden">
          <div
            className={`absolute inset-0 transition-all duration-300 ease-out ${
              isExploreOpen ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            <h1 className="font-serif text-4xl font-bold tracking-tight text-terreta-dark md:text-5xl">
              Terreta Hub
            </h1>
            <p className="mt-3 text-base leading-relaxed text-terreta-dark/75 md:text-lg">
              Tu punto de entrada para descubrir que hacer en la Terreta.
            </p>

            <div className="mt-8 flex flex-col gap-3 md:mt-10">
              <button
                type="button"
                onClick={handleGoToFinde}
                className="w-full rounded-xl bg-terreta-accent px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90"
                aria-label="Ir a Finde en la Terreta"
              >
                Finde en la Terreta
              </button>
              <button
                type="button"
                onClick={handleGoToExplore}
                className={`w-full rounded-xl border border-terreta-border bg-terreta-bg px-4 py-3 text-sm font-bold uppercase tracking-wide text-terreta-dark transition-all hover:bg-terreta-sidebar ${
                  isAnimatingView ? 'scale-[0.99] opacity-80' : 'scale-100 opacity-100'
                }`}
                aria-label="Abrir opciones de exploración"
              >
                Explorar
              </button>
            </div>
          </div>

          <div
            className={`absolute inset-0 transition-all duration-300 ease-out ${
              isExploreOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'
            }`}
          >
            <h2 className="font-serif text-3xl font-bold tracking-tight text-terreta-dark md:text-4xl">
              Explorar
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-terreta-dark/75 md:text-base">
              Elige cómo quieres interactuar con la plataforma.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
                {options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={option.handleAction}
                    className="flex min-h-20 items-center gap-3 rounded-xl border border-terreta-border bg-terreta-bg px-4 py-4 text-left text-base font-bold uppercase tracking-wide text-terreta-dark transition-colors hover:bg-terreta-sidebar"
                    aria-label={`Abrir ${option.label}`}
                  >
                    <span className="text-terreta-accent">{option.icon}</span>
                    <span className="leading-tight">{option.label}</span>
                  </button>
                ))}
            </div>

            <button
              type="button"
              onClick={() => handleOpenTopic('feedback')}
              className="mt-3 flex min-h-16 w-full items-center justify-center gap-2 rounded-xl bg-terreta-accent px-4 py-4 text-base font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              aria-label="Abrir feedback"
            >
              <Flame size={18} />
              Feedback
            </button>

          </div>
        </div>
      </section>

      <SectionLearningModal
        isOpen={activeTopic !== null}
        topicTitle={activeTopicLabel}
        onClose={() => setActiveTopic(null)}
        onComplete={handleCompleteTopic}
        isSubmitting={isCompletingTopic}
      />
    </div>
  );
};
