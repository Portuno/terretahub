import React, { useState, useEffect } from 'react';
import { CheckCircle, BarChart3 } from 'lucide-react';
import { Poll, PollResult } from '../types';
import { supabase } from '../lib/supabase';
import { calculatePollResults } from '../lib/agoraUtils';

interface PollDisplayProps {
  poll: Poll;
  currentUserId: string | null;
  onVote?: () => void;
}

export const PollDisplay: React.FC<PollDisplayProps> = ({ poll, currentUserId, onVote }) => {
  const [results, setResults] = useState<PollResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    // Verificar si la encuesta ha expirado
    if (poll.expiresAt) {
      const expiresDate = new Date(poll.expiresAt);
      const now = new Date();
      setHasExpired(now > expiresDate);
    }

    // Cargar votos y resultados
    loadPollData();
  }, [poll.id]);

  const loadPollData = async () => {
    try {
      // Cargar todos los votos
      const { data: votes } = await supabase
        .from('poll_votes')
        .select('option_index, user_id')
        .eq('poll_id', poll.id);

      if (votes) {
        setTotalVotes(votes.length);
        const results = calculatePollResults(poll.options, votes);
        setResults(results);

        // Verificar si el usuario actual votó
        if (currentUserId) {
          const userVoteData = votes.find(v => v.user_id === currentUserId);
          if (userVoteData) {
            setUserVote(userVoteData.option_index);
          }
        }
      }
    } catch (error) {
      console.error('Error loading poll data:', error);
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!currentUserId || userVote !== null || hasExpired || isVoting) {
      return;
    }

    setIsVoting(true);
    try {
      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: poll.id,
          user_id: currentUserId,
          option_index: optionIndex
        });

      if (error) throw error;

      setUserVote(optionIndex);
      await loadPollData();
      if (onVote) onVote();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error al votar. Intenta nuevamente.');
    } finally {
      setIsVoting(false);
    }
  };

  const showResults = userVote !== null || hasExpired || totalVotes > 0;

  return (
    <div className="bg-terreta-bg/50 border border-terreta-border rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-terreta-dark">{poll.question}</h4>
        {hasExpired && (
          <span className="text-xs text-red-500 font-medium">Expirada</span>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const result = results.find(r => r.optionIndex === index);
          const percentage = result?.percentage || 0;
          const voteCount = result?.voteCount || 0;
          const isSelected = userVote === index;

          return (
            <div key={index}>
              {showResults ? (
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-terreta-dark font-medium flex items-center gap-2">
                      {option}
                      {isSelected && (
                        <CheckCircle size={14} className="text-terreta-accent" />
                      )}
                    </span>
                    <span className="text-xs text-terreta-secondary">
                      {voteCount} votos ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-terreta-border rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isSelected ? 'bg-terreta-accent' : 'bg-terreta-accent/60'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleVote(index)}
                  disabled={isVoting}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-terreta-accent bg-terreta-accent/10'
                      : 'border-terreta-border hover:bg-terreta-bg'
                  }`}
                >
                  <span className="text-sm text-terreta-dark">{option}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showResults && (
        <div className="mt-3 pt-3 border-t border-terreta-border flex items-center justify-between text-xs text-terreta-secondary">
          <span>{totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}</span>
          {poll.expiresAt && !hasExpired && (
            <span>
              Expira: {new Date(poll.expiresAt).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
