import React, { useState } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import { validatePoll } from '../lib/agoraUtils';

interface PollCreatorProps {
  onSave: (poll: { question: string; options: string[]; expiresAt?: string | null }) => void;
  onCancel: () => void;
}

export const PollCreator: React.FC<PollCreatorProps> = ({ onSave, onCancel }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [expiresAt, setExpiresAt] = useState('');
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

    onSave({
      question: question.trim(),
      options: options.map(opt => opt.trim()).filter(opt => opt.length > 0),
      expiresAt: expiresAt.trim() || null
    });
  };

  return (
    <div className="bg-terreta-card border border-terreta-border rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-terreta-dark">Crear Encuesta</h3>
        <button
          onClick={onCancel}
          className="text-terreta-secondary hover:text-terreta-dark transition-colors"
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
              onClick={handleAddOption}
              className="mt-2 flex items-center gap-1 text-sm text-terreta-accent hover:text-terreta-dark transition-colors"
            >
              <Plus size={16} />
              Agregar opción
            </button>
          )}
        </div>

        {/* Expiration Date */}
        <div>
          <label className="block text-sm font-medium text-terreta-dark mb-2 flex items-center gap-2">
            <Calendar size={16} />
            Fecha de expiración (opcional)
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full bg-terreta-bg/50 border-terreta-border border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-terreta-accent outline-none text-terreta-dark"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-terreta-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
          >
            Crear Encuesta
          </button>
          <button
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
