import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { HomeChatbot } from './HomeChatbot';
import type { AuthUser } from '../types';

export const ChatbotPage: React.FC = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() as { user: AuthUser | null };
  const user = outletContext?.user ?? null;

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="flex h-full max-h-screen w-full flex-col overflow-hidden px-4 py-4 font-sans md:px-8">
      <HomeChatbot user={user} onBack={handleBackToHome} />
    </div>
  );
};
