import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { AuthUser } from '../types';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { theme } = useTheme();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setError('');
      setSuccess('');
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setIsRegistering(false);
      setIsForgotPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw new Error(resetError.message || 'Error al enviar el email de recuperación.');
      }

      setSuccess('Se ha enviado un email con las instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada.');
      setEmail('');
    } catch (err: any) {
      console.error('Error al recuperar contraseña:', err);
      setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Resetear el estado del formulario si hay un error previo
    if (error) {
      setError('');
    }

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

        const safeUser: AuthUser = {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
          role: (profile.role as 'normal' | 'admin') || 'normal',
        };

        onLoginSuccess(safeUser);
        onClose();
      } else {
        // LOGIN LOGIC
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          // Mostrar el mensaje de error real de Supabase
          let errorMessage = 'Credenciales incorrectas.';
          
          if (authError.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
          } else if (authError.message.includes('Invalid login credentials')) {
            errorMessage = 'Email o contraseña incorrectos.';
          } else if (authError.message.includes('User not found')) {
            errorMessage = 'No existe una cuenta con este email.';
          } else if (authError.message) {
            errorMessage = authError.message;
          }
          
          throw new Error(errorMessage);
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
          role: (profile.role as 'normal' | 'admin') || 'normal',
        };

        onLoginSuccess(safeUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Error en autenticación:', err);
      setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      // Asegurarse de que siempre se resetee el loading
      setLoading(false);
    }
  };

  // Get theme accent color for dynamic styling
  const accentColor = `rgb(var(--accent))`;
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-[rgb(var(--text-main))]/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[rgb(var(--card-bg))] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-[rgb(var(--border-color))]">
        <button onClick={onClose} className="absolute top-4 right-4 text-[rgb(var(--text-secondary))]/60 hover:text-[rgb(var(--text-main))] p-1 transition-colors">
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="font-serif text-3xl text-[rgb(var(--text-main))] mb-2">
              {isForgotPassword ? 'Recuperar Contraseña' : isRegistering ? 'Únete a Terreta' : 'Bienvenido'}
            </h2>
            <p className="text-sm text-[rgb(var(--text-secondary))] font-sans">
              {isForgotPassword 
                ? 'Ingresa tu email y te enviaremos las instrucciones para recuperar tu contraseña.'
                : isRegistering 
                ? 'Crea tu perfil y conecta con la comunidad.' 
                : 'Ingresa para gestionar tu Link-in-bio.'}
            </p>
          </div>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 font-sans">
              {error && (
                <div className="text-xs p-3 rounded-lg text-center border" 
                     style={{ 
                       backgroundColor: theme === 'fuego' || theme === 'agua' ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 242, 242)',
                       color: theme === 'fuego' || theme === 'agua' ? 'rgb(254, 202, 202)' : 'rgb(220, 38, 38)',
                       borderColor: theme === 'fuego' || theme === 'agua' ? 'rgba(239, 68, 68, 0.3)' : 'rgb(252, 165, 165)'
                     }}>
                  {error}
                </div>
              )}
              {success && (
                <div className="text-xs p-3 rounded-lg text-center border"
                     style={{ 
                       backgroundColor: theme === 'fuego' || theme === 'agua' ? 'rgba(34, 197, 94, 0.2)' : 'rgb(240, 253, 244)',
                       color: theme === 'fuego' || theme === 'agua' ? 'rgb(187, 247, 208)' : 'rgb(21, 128, 61)',
                       borderColor: theme === 'fuego' || theme === 'agua' ? 'rgba(34, 197, 94, 0.3)' : 'rgb(134, 239, 172)'
                     }}>
                  {success}
                </div>
              )}

              <div className="relative group">
                <Mail size={18} className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 group-focus-within:text-[rgb(var(--accent))] transition-colors" />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--bg-main))] border border-[rgb(var(--border-color))] rounded-lg focus:ring-1 focus:ring-[rgb(var(--accent))] outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: accentColor }}
                className="w-full text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : (
                  <>
                    Enviar Instrucciones
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                  setEmail('');
                }}
                style={{ color: accentColor }}
                className="w-full text-sm font-bold hover:underline flex items-center justify-center gap-2 mt-2 transition-all"
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4 font-sans">
                {error && (
                  <div className="text-xs p-3 rounded-lg text-center border"
                       style={{ 
                         backgroundColor: theme === 'fuego' || theme === 'agua' ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 242, 242)',
                         color: theme === 'fuego' || theme === 'agua' ? 'rgb(254, 202, 202)' : 'rgb(220, 38, 38)',
                         borderColor: theme === 'fuego' || theme === 'agua' ? 'rgba(239, 68, 68, 0.3)' : 'rgb(252, 165, 165)'
                       }}>
                    {error}
                  </div>
                )}

                {isRegistering && (
                  <>
                    <div className="relative group">
                      <User size={18} className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 group-focus-within:text-[rgb(var(--accent))] transition-colors" />
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--bg-main))] border border-[rgb(var(--border-color))] rounded-lg focus:ring-1 focus:ring-[rgb(var(--accent))] outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50"
                        value={name}
                        onChange={e => setName(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <span className="absolute left-3 top-2.5 text-[rgb(var(--text-secondary))]/60 font-bold text-sm">@</span>
                      <input
                        type="text"
                        placeholder="usuario (slug)"
                        required
                        className="w-full pl-8 pr-4 py-2.5 bg-[rgb(var(--bg-main))] border border-[rgb(var(--border-color))] rounded-lg focus:ring-1 focus:ring-[rgb(var(--accent))] outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="relative group">
                  <Mail size={18} className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 group-focus-within:text-[rgb(var(--accent))] transition-colors" />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--bg-main))] border border-[rgb(var(--border-color))] rounded-lg focus:ring-1 focus:ring-[rgb(var(--accent))] outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <Lock size={18} className="absolute left-3 top-3 text-[rgb(var(--text-secondary))]/60 group-focus-within:text-[rgb(var(--accent))] transition-colors" />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--bg-main))] border border-[rgb(var(--border-color))] rounded-lg focus:ring-1 focus:ring-[rgb(var(--accent))] outline-none text-sm transition-all text-[rgb(var(--text-main))] placeholder:text-[rgb(var(--text-secondary))]/50"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                {!isRegistering && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setPassword('');
                      }}
                      style={{ color: accentColor }}
                      className="text-xs font-bold hover:underline transition-all"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: accentColor }}
                  className="w-full text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                  }}
                  style={{ color: accentColor }}
                  className="text-xs font-bold hover:underline uppercase tracking-wide transition-all"
                >
                  {isRegistering ? '¿Ya tienes cuenta? Ingresa aquí' : '¿No tienes cuenta? Regístrate gratis'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
