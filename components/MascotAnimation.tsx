import React, { useEffect, useState } from 'react';

export interface MascotAnimationData {
  collection: string;
  items: Array<{
    name: string;
    transparent_image?: string;
    image?: string;
    video?: string;
    animation_webm?: string;
    animation_mov?: string;
  }>;
}

interface MascotAnimationProps {
  animationData: MascotAnimationData;
  duration?: number; // Duración en segundos
  text?: string;
  onComplete?: () => void;
}

export const MascotAnimation: React.FC<MascotAnimationProps> = ({
  animationData,
  duration = 8,
  text = '',
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = duration * 1000; // Convertir a milisegundos
    let animationFrameId: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(currentProgress);

      if (elapsed < totalDuration) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [duration, onComplete]);

  if (!isVisible || !animationData.items || animationData.items.length === 0) {
    return null;
  }

  const animation = animationData.items[0];
  // Preferir animation_webm, luego video, luego image
  const mediaUrl = animation.animation_webm || animation.video || animation.image || animation.transparent_image;

  return (
    <div className="fixed inset-0 bg-terreta-bg z-50 flex items-center justify-center animate-fade-in">
      <div className="flex flex-col items-center justify-center max-w-md w-full px-6">
        {/* Mascot Animation */}
        <div className="relative w-full max-w-sm mb-8">
          {animation.animation_webm || animation.video ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            >
              <source src={mediaUrl} type={animation.animation_webm ? 'video/webm' : 'video/mp4'} />
              {animation.video && animation.animation_webm && (
                <source src={animation.video} type="video/mp4" />
              )}
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt={animation.name}
              className="w-full h-auto"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Text */}
        {text && (
          <div className="text-center mb-6">
            <p className="text-xl font-serif font-bold text-terreta-dark animate-pulse">
              {text}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full max-w-xs h-1 bg-terreta-border rounded-full overflow-hidden">
          <div
            className="h-full bg-terreta-accent transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
