import React from 'react';
import type { AuthUser } from '../types';
import { PlaceholderPage } from './PlaceholderPage';

interface FrameHackPageProps {
  user: AuthUser | null;
  onOpenAuth: (referrerUsername?: string) => void;
}

export const FrameHackPage: React.FC<FrameHackPageProps> = ({ user: _user, onOpenAuth: _onOpenAuth }) => {
  return <PlaceholderPage title="FrameHack" />;
};

