import React from 'react';
import { Pillar } from '../types';

interface PillarCardProps {
  pillar: Pillar;
  variant: 'dark' | 'olive';
}

export const PillarCard: React.FC<PillarCardProps> = ({ pillar, variant }) => {
  const bgClass = variant === 'olive' ? 'bg-terreta-olive' : 'bg-terreta-dark';
  
  return (
    <div className={`${bgClass} text-white p-8 rounded-[12px] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-center min-h-[220px] border-t-4 border-terreta-gold/30`}>
      <h3 className="font-sans text-2xl mb-4 tracking-wide font-semibold border-b border-white/20 pb-2 inline-block w-fit">
        {pillar.area}
      </h3>
      <p className="font-sans text-white/90 leading-relaxed text-lg">
        {pillar.content}
      </p>
    </div>
  );
};