import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <h3 className="mb-2 font-serif text-lg font-semibold text-terreta-dark md:text-xl">
        {title}
      </h3>
      <p className="mb-4 max-w-md text-sm text-terreta-secondary">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full bg-terreta-accent px-5 py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};
