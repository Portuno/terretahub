import { supabase } from './supabase';

export const TOTES_REWARD_PER_TOPIC = 12;

export const TOTES_TOPICS = [
  'perfil',
  'foro',
  'mapa',
  'recursos',
  'comunidad',
  'dominio',
  'feedback'
] as const;

export type TotesTopicKey = typeof TOTES_TOPICS[number];

export interface TotesSummary {
  balance: number;
  totalEarned: number;
}

export interface CompleteTopicResult {
  awarded: boolean;
  balance: number;
  totalEarned: number;
}

const DEFAULT_SUMMARY: TotesSummary = {
  balance: 0,
  totalEarned: 0
};

export const fetchUserTotesSummary = async (userId: string): Promise<TotesSummary> => {
  const { data, error } = await supabase
    .from('user_totes_wallet')
    .select('balance, total_earned')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[totes] Error loading user_totes_wallet:', error);
    return DEFAULT_SUMMARY;
  }

  if (!data) {
    return DEFAULT_SUMMARY;
  }

  return {
    balance: Number(data.balance) || 0,
    totalEarned: Number(data.total_earned) || 0
  };
};

export const fetchCompletedTotesTopics = async (userId: string): Promise<Set<TotesTopicKey>> => {
  const { data, error } = await supabase
    .from('user_totes_topic_completions')
    .select('topic_key')
    .eq('user_id', userId);

  if (error) {
    console.error('[totes] Error loading user_totes_topic_completions:', error);
    return new Set<TotesTopicKey>();
  }

  const completed = new Set<TotesTopicKey>();
  (data ?? []).forEach((row: { topic_key: string }) => {
    if (TOTES_TOPICS.includes(row.topic_key as TotesTopicKey)) {
      completed.add(row.topic_key as TotesTopicKey);
    }
  });

  return completed;
};

export const completeTopicAndAwardTotes = async (topicKey: TotesTopicKey): Promise<CompleteTopicResult> => {
  const { data, error } = await supabase.rpc('complete_totes_topic', {
    p_topic_key: topicKey,
    p_reward: TOTES_REWARD_PER_TOPIC
  });

  if (error) {
    console.error('[totes] Error completing topic:', error);
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    awarded: Boolean(row?.awarded),
    balance: Number(row?.balance) || 0,
    totalEarned: Number(row?.total_earned) || 0
  };
};
