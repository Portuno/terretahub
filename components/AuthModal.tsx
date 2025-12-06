import React, { useState } from 'react';
import { X, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthUser } from '../types';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        // REGISTER LOGIC
        const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
        
        // Verificar si el username ya existe
        const { data: existingProfiles, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', cleanUsername)
          .limit(1);

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 es "no rows returned", que es esperado si no existe
          throw new Error('Error al verificar el usuario.');
        }

        if (existingProfiles && existingProfiles.length > 0) {
          throw new Error('El usuario ya existe.');
        }

        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              username: cleanUsername,
            }
          }
        });

        if (authError) {
          throw new Error(authError.message || 'Error al crear la cuenta.');
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario.');
        }

        // El trigger automáticamente crea el perfil, pero esperamos un momento
        // y luego lo obtenemos
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`;
        
        // Obtener el perfil creado por el trigger
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error('Error al crear el perfil. Intenta nuevamente.');
        }

        // Construir objeto de usuario para el estado
        const newUser: AuthUser = {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar || avatarUrl,
        };

        onLoginSuccess(newUser);
        onClose();
      } else {
        // LOGIN LOGIC
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          throw new Error('Credenciales incorrectas.');
        }

        if (!authData.user) {
          throw new Error('Error al iniciar sesión.');
        }

        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error('Error al cargar el perfil.');
        }

        const safeUser: AuthUser = {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
        };

        onLoginSuccess(safeUser);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-terreta-dark/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#F9F6F0] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-terreta-dark/40 hover:text-terreta-dark p-1">
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="font-serif text-3xl text-terreta-dark mb-2">
              {isRegistering ? 'Únete a Terreta' : 'Bienvenido'}
            </h2>
            <p className="text-sm text-gray-500 font-sans">
              {isRegistering ? 'Crea tu perfil y conecta con la comunidad.' : 'Ingresa para gestionar tu Link-in-bio.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg text-center">{error}</div>}

            {isRegistering && (
              <>
                <div className="relative group">
                  <User size={18} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#D97706]" />
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#D97706] outline-none text-sm transition-all"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="relative group">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">@</span>
                  <input
                    type="text"
                    placeholder="usuario (slug)"
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#D97706] outline-none text-sm transition-all"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="relative group">
              <Mail size={18} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#D97706]" />
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#D97706] outline-none text-sm transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock size={18} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#D97706]" />
              <input
                type="password"
                placeholder="Contraseña"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#D97706] outline-none text-sm transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terreta-dark text-white font-bold py-3 rounded-lg hover:bg-[#2C1E1A] transition-all flex items-center justify-center gap-2 mt-2 shadow-md"
            >
              {loading ? 'Procesando...' : (
                <>
                  {isRegistering ? 'Crear Cuenta' : 'Ingresar'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-[#D97706] font-bold hover:underline uppercase tracking-wide"
            >
              {isRegistering ? '¿Ya tienes cuenta? Ingresa aquí' : '¿No tienes cuenta? Regístrate gratis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
