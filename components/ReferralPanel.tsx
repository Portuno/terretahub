import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Link as LinkIcon, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReferralPanelProps {
  userId: string;
  username: string;
  onStatsLoaded?: (stats: { totalInvited: number; conversions: number }) => void;
}

interface ReferralItem {
  id: string;
  invitee_id: string | null;
  invitee_email: string | null;
  status: string;
  created_at: string;
  invitee?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  } | null;
}

export const ReferralPanel: React.FC<ReferralPanelProps> = ({ userId, username, onStatsLoaded }) => {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const referralLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.terretahub.com';
    return `${origin}/?invitacion=${username}`;
  }, [username]);

  useEffect(() => {
    const loadReferrals = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('referrals')
          .select(`
            id,
            invitee_id,
            invitee_email,
            status,
            created_at,
            invitee:profiles!referrals_invitee_id_fkey (
              id,
              name,
              username,
              avatar
            )
          `)
          .eq('inviter_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[ReferralPanel] Error loading referrals:', error);
          setReferrals([]);
          return;
        }

        const safeData = (data || []) as ReferralItem[];
        setReferrals(safeData);

        const totalInvited = safeData.length;
        const conversions = safeData.filter(item => item.status === 'converted' || !!item.invitee_id).length;
        onStatsLoaded?.({ totalInvited, conversions });
      } catch (err) {
        console.error('[ReferralPanel] Unexpected error:', err);
        setReferrals([]);
      } finally {
        setLoading(false);
      }
    };

    loadReferrals();
  }, [userId, onStatsLoaded]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copiado`);
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      console.error('[ReferralPanel] Copy failed:', err);
      setCopyStatus('No se pudo copiar');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  return (
    <div className="bg-terreta-card border border-terreta-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-serif text-xl text-terreta-dark">Invita a tu gente</h3>
          <p className="text-sm text-terreta-secondary">Comparte tu código y link de referido.</p>
        </div>
        {copyStatus && (
          <span className="text-xs text-terreta-accent font-bold">{copyStatus}</span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-terreta-bg/60 border border-terreta-border rounded-xl p-4">
          <p className="text-xs font-bold text-terreta-secondary uppercase">Código de referido</p>
          <div className="flex items-center justify-between gap-3 mt-2">
            <span className="text-terreta-dark font-bold text-lg">@{username}</span>
            <button
              type="button"
              onClick={() => handleCopy(username, 'Código')}
              className="flex items-center gap-2 text-xs font-bold text-terreta-accent hover:text-terreta-dark transition-colors"
              aria-label="Copiar código de referido"
            >
              <Copy size={14} />
              Copiar
            </button>
          </div>
        </div>

        <div className="bg-terreta-bg/60 border border-terreta-border rounded-xl p-4">
          <p className="text-xs font-bold text-terreta-secondary uppercase">Link de invitación</p>
          <div className="flex items-center justify-between gap-3 mt-2">
            <span className="text-xs text-terreta-dark truncate">{referralLink}</span>
            <button
              type="button"
              onClick={() => handleCopy(referralLink, 'Link')}
              className="flex items-center gap-2 text-xs font-bold text-terreta-accent hover:text-terreta-dark transition-colors"
              aria-label="Copiar link de invitación"
            >
              <LinkIcon size={14} />
              Copiar
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-xs font-bold text-terreta-secondary uppercase mb-3">
          <Users size={14} />
          Usuarios referidos
        </div>
        {loading ? (
          <div className="py-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-terreta-accent"></div>
          </div>
        ) : referrals.length === 0 ? (
          <p className="text-sm text-terreta-secondary">Aún no tienes referidos. Comparte tu link para empezar.</p>
        ) : (
          <div className="space-y-3">
            {referrals.map(referral => {
              const displayName = referral.invitee?.name || referral.invitee?.username || referral.invitee_email || 'Invitado';
              const subtitle = referral.invitee?.username ? `@${referral.invitee.username}` : referral.invitee_email || '';
              const avatar = referral.invitee?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${subtitle || displayName}`;
              return (
                <div key={referral.id} className="flex items-center justify-between gap-3 bg-terreta-bg/40 border border-terreta-border rounded-xl p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-terreta-border" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-terreta-dark truncate">{displayName}</p>
                      {subtitle && <p className="text-xs text-terreta-secondary truncate">{subtitle}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    referral.status === 'converted' || referral.invitee_id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {referral.status === 'converted' || referral.invitee_id ? 'Convertido' : 'Pendiente'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
