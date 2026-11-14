import { describe, expect, it } from 'vitest';
import { coldStart, eventDescription, reduceGuide } from '../lib/guideChat';

describe('guía', () => {
  it('llega a enviar la quedada en menos de seis turnos', () => {
    const now = new Date(2026, 10, 14, 12, 0, 0);
    const zones = ['Ruzafa', 'Centro', 'El Carmen'];
    let model = coldStart();
    let turns = 0;
    const step = (input: { text?: string; actionId?: string }) => {
      turns += 1;
      model = reduceGuide(model, input, { now, zones });
    };

    step({ text: 'quiero organizar una quedada el jueves' });
    step({ text: 'Mate con la Terreta' });
    step({ actionId: 'slot:Ruzafa|19:00' });
    step({ actionId: 'publicar' });
    step({ actionId: 'confirmar' });

    expect(model.state).toBe('ejecucion');
    expect(model.event.date).toBe('2026-11-19');
    expect(model.event.time).toBe('19:00');
    expect(model.event.zone).toBe('Ruzafa');
    expect(eventDescription(model.event).length).toBeGreaterThanOrEqual(20);
    expect(turns).toBeLessThan(6);
    expect(model.message.toLowerCase()).not.toContain('publicada');
  });
});
