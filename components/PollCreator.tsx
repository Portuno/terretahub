import React, { useState } from 'react';
import { X, Plus, Clock } from 'lucide-react';
import { validatePoll } from '../lib/agoraUtils';

interface PollCreatorProps {
  onSave: (poll: { question: string; options: string[]; expiresAt?: string | null }) => void;
  onCancel: () => void;
}

export const PollCreator: React.FC<PollCreatorProps> = ({ onSave, onCancel }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  type DurationOption = 'none' | '6h' | '12h' | '24h' | '72h' | 'custom';
  const [duration, setDuration] = useState<DurationOption>('24h');
  const [customHours, setCustomHours] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    setError(null);
    const validation = validatePoll(question, options);
    
    if (!validation.ok) {
      setError(validation.error || 'Error al validar la encuesta');
      return;
    }

    // Calcular expiresAt en función de la duración seleccionada
    let expiresAt: string | null = null;
    const now = new Date();
    const addHours = (hours: number) => {
      const d = new Date(now.getTime() + hours * 60 * 60 * 1000);
      return d.toISOString();
    };

    if (duration === '6h') {
      expiresAt = addHours(6);
    } else if (duration === '12h') {
      expiresAt = addHours(12);
    } else if (duration === '24h') {
      expiresAt = addHours(24);
    } else if (duration === '72h') {
      expiresAt = addHours(72);
    } else if (duration === 'custom') {
      const hoursNumber = Number(customHours);
      if (!Number.isNaN(hoursNumber) && hoursNumber > 0) {
        expiresAt = addHours(hoursNumber);
      }
    }

    onSave({
      question: question.trim(),
      options: options.map(opt => opt.trim()).filter(opt => opt.length > 0),
      expiresAt
    });
  };

  return (
    <div className="bg-terreta-card border-2 border-terreta-accent/40 rounded-2xl p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-terreta-dark text-lg">Crear Encuesta</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-terreta-secondary hover:text-terreta-dark transition-colors rounded-full p-1 hover:bg-terreta-bg"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-terreta-dark mb-2">
            Pregunta
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="¿Cuál es tu pregunta?"
            className="w-full bg-terreta-bg/50 border-terreta-border border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark placeholder-terreta-secondary/50 resize-none"
            rows={2}
            maxLength={200}
          />
          <p className="text-xs text-terreta-secondary mt-1">
            {question.length}/200 caracteres
          </p>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-terreta-dark mb-2">
            Opciones ({options.length}/6)
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Opción ${index + 1}`}
                  className="flex-1 bg-terreta-bg/50 border-terreta-border border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark placeholder-terreta-secondary/50"
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-2 flex items-center gap-1 text-sm text-terreta-accent hover:text-terreta-dark transition-colors"
            >
              <Plus size={16} />
              Agregar opción
            </button>
          )}
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-medium text-terreta-dark mb-2 flex items-center gap-2">
            <Clock size={16} />
            Duración de la encuesta
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            {[
              { value: '6h', label: '6 horas' },
              { value: '12h', label: '12 horas' },
              { value: '24h', label: '24 horas' },
              { value: '72h', label: '72 horas' },
              { value: 'none', label: 'Sin límite' },
              { value: 'custom', label: 'Personalizada' }
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDuration(value as DurationOption)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  duration === value
                    ? 'bg-terreta-accent text-white border-terreta-accent'
                    : 'bg-terreta-bg/50 text-terreta-secondary border-terreta-border hover:bg-terreta-bg'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {duration === 'custom' && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="Horas de duración"
                className="w-32 bg-terreta-bg/50 border-terreta-border border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark"
              />
              <span className="text-xs text-terreta-secondary">Ej: 5 = 5 horas desde ahora</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-terreta-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            Crear Encuesta
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-terreta-border rounded-lg text-terreta-dark hover:bg-terreta-bg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
