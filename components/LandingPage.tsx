import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronDown, Compass, Flame, Gem, MapPinned, MessageCircle, Sparkles, User, Users, Wrench } from 'lucide-react';
import { THEMES, Theme, useTheme } from '../context/ThemeContext';
import { AuthUser } from '../types';
import { SectionLearningModal } from './SectionLearningModal';
import {
  completeTopicAndAwardTotes,
  fetchCompletedTotesTopics,
  fetchUserTotesSummary,
  TOTES_TOPICS,
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
  const [activeTopic, setActiveTopic] = useState<TotesTopicKey | null>(null);
  const [isCompletingTopic, setIsCompletingTopic] = useState(false);
  const [totesBalance, setTotesBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<Set<TotesTopicKey>>(new Set());
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);

  const handleGoToFinde = () => {
    navigate('/terreta');
  };

  const handleGoToExplore = () => {
    setIsExploreOpen((prev) => !prev);
  };

  const handleSelectTheme = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsThemeMenuOpen(false);
  };

  const loadTotesData = async (userId: string) => {
    const [summary, topics] = await Promise.all([
      fetchUserTotesSummary(userId),
      fetchCompletedTotesTopics(userId)
    ]);
    setTotesBalance(summary.balance);
    setTotalEarned(summary.totalEarned);
    setCompletedTopics(topics);
  };

  useEffect(() => {
    setRewardMessage(null);
    if (!user) {
      setTotesBalance(0);
      setTotalEarned(0);
      setCompletedTopics(new Set());
      return;
    }

    loadTotesData(user.id);
  }, [user]);

  const handleGoToProfile = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    navigate('/perfil');
  };

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

    setIsCompletingTopic(true);
    try {
      const result = await completeTopicAndAwardTotes(activeTopic);
      setTotesBalance(result.balance);
      setTotalEarned(result.totalEarned);
      if (result.awarded) {
        setCompletedTopics((prev) => new Set([...prev, activeTopic]));
        setRewardMessage('+12 Totes desbloqueados');
      }
      const topicToNavigate = activeTopic;
      setActiveTopic(null);
      handleExecuteAction(topicToNavigate);
    } catch (error) {
      console.error('[LandingPage] Error completing learning topic:', error);
      setActiveTopic(null);
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
  const completedCount = user ? completedTopics.size : 0;

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

      <button
        type="button"
        onClick={handleGoToProfile}
        className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-terreta-border bg-terreta-sidebar text-terreta-dark shadow-md transition-colors hover:bg-terreta-border/50"
        aria-label={user ? 'Abrir perfil' : 'Iniciar sesión o registrarte'}
      >
        {user ? (
          <img
            src={user.avatar}
            alt="Avatar del usuario"
            className="h-full w-full object-cover"
          />
        ) : (
          <User size={20} />
        )}
      </button>

      <section className="w-full max-w-md pt-14 md:max-w-xl">
        <div className="rounded-2xl border border-terreta-border bg-terreta-card/90 p-4 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-terreta-dark/60">Totes</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-terreta-accent">
            <Gem size={18} />
            <span className="text-2xl font-black">{totesBalance}</span>
          </div>
          <p className="mt-1 text-xs text-terreta-dark/70">
            {user
              ? `${completedCount}/${TOTES_TOPICS.length} tópicos completados · ${totalEarned} ganados`
              : 'Inicia sesión para guardar tu progreso y tus Totes'}
          </p>
          {rewardMessage ? (
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-terreta-accent">{rewardMessage}</p>
          ) : null}
        </div>

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
            className="w-full rounded-xl border border-terreta-border bg-terreta-bg px-4 py-3 text-sm font-bold uppercase tracking-wide text-terreta-dark transition-colors hover:bg-terreta-sidebar"
            aria-label="Abrir opciones de exploración"
          >
            Explorar
          </button>
        </div>

        {isExploreOpen ? (
          <div className="mt-4 rounded-2xl border border-terreta-border bg-terreta-card p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              {options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={option.handleAction}
                  className="flex min-h-14 items-center gap-2 rounded-xl border border-terreta-border bg-terreta-bg px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-terreta-dark transition-colors hover:bg-terreta-sidebar"
                  aria-label={`Abrir ${option.label}`}
                >
                  <span className="text-terreta-accent">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleOpenTopic('feedback')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-terreta-accent px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              aria-label="Abrir feedback"
            >
              <Flame size={16} />
              Feedback
            </button>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wide text-terreta-dark/60">
          <Link className="hover:text-terreta-accent" to="/terminos-y-condiciones">Términos</Link>
          <Link className="hover:text-terreta-accent" to="/politica-de-privacidad">Privacidad</Link>
          <Link className="hover:text-terreta-accent" to="/docs">Documentación</Link>
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
