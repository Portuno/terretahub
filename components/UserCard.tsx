import React from 'react';
import { UserProfile } from '../types';

interface UserCardProps {
  user: UserProfile;
  onViewProfile?: (handle: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onViewProfile }) => {
  return (
    <div className="bg-terreta-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col items-center border border-terreta-border relative">
      
      {/* Avatar Container with Hover Effect */}
      <div className="relative group mb-4">
        <div className="w-20 h-20 rounded-full bg-terreta-sidebar/50 overflow-hidden border-2 border-terreta-card shadow-sm flex items-center justify-center cursor-pointer">
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        </div>
        
        {/* Large Preview Popover - Centered over avatar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-terreta-card p-1.5 rounded-2xl shadow-2xl border border-terreta-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none scale-75 group-hover:scale-100 origin-center">
             <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl bg-terreta-bg" />
        </div>
      </div>
      
      <h3 className="font-serif text-xl text-terreta-dark font-medium mb-1 text-center">
        {user.name}
      </h3>
      
      <p className="text-terreta-accent text-xs font-bold tracking-wider uppercase mb-1 text-center font-sans">
        {user.role}
      </p>
      
      <p className="text-terreta-secondary text-sm mb-6 text-center font-sans">
        {user.handle}
      </p>
      
      {user.hasLinkBio ? (
        <button 
          onClick={() => onViewProfile && onViewProfile(user.handle)}
          className="w-full bg-terreta-bg hover:bg-opacity-80 text-terreta-dark font-sans font-medium py-3 rounded-lg transition-colors text-sm border border-terreta-border"
        >
          Ver Perfil
        </button>
      ) : (
        <div className="w-full bg-terreta-bg text-terreta-secondary font-sans font-medium py-3 rounded-lg text-sm border border-terreta-border text-center">
          Perfil en Construcción
        </div>
      )}
    </div>
  );
};