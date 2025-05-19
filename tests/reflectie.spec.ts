import { validateReflectieWithAI } from '@/utils/ai';
import { Reflectie } from '@/types';

describe('Reflectie Validation', () => {
  it('should validate reflectie with high pain score', async () => {
    const reflectie: Partial<Reflectie> = {
      datum: new Date('2025-05-19'),
      notitie: 'Vandaag voel ik me redelijk goed.',
      stemming: 'goed',
      pijn_score: 16, // High pain score
      vermoeidheid_score: 8
    };

    const result = await validateReflectieWithAI(reflectie);
    expect(result).toContain('pijnscore is hoog');
  });

  it('should validate reflectie with high fatigue score', async () => {
    const reflectie: Partial<Reflectie> = {
      datum: new Date('2025-05-19'),
      notitie: 'Vandaag voel ik me redelijk goed.',
      stemming: 'goed',
      pijn_score: 8,
      vermoeidheid_score: 16 // High fatigue score
    };

    const result = await validateReflectieWithAI(reflectie);
    expect(result).toContain('vermoeidheidsscore is hoog');
  });

  it('should validate reflectie with low pain and fatigue scores', async () => {
    const reflectie: Partial<Reflectie> = {
      datum: new Date('2025-05-19'),
      notitie: 'Vandaag voel ik me goed.',
      stemming: 'goed',
      pijn_score: 3,
      vermoeidheid_score: 4
    };

    const result = await validateReflectieWithAI(reflectie);
    // The positive notitie takes precedence over the low pain/fatigue scores in the current implementation
    expect(result).toContain('overwegend positief');
  });

  it('should validate reflectie with negative text content', async () => {
    const reflectie: Partial<Reflectie> = {
      datum: new Date('2025-05-19'),
      notitie: 'Ik voel me vandaag slecht, moe en gefrustreerd. Alles is moeilijk en ik ben uitgeput.',
      stemming: 'slecht',
      pijn_score: 10,
      vermoeidheid_score: 10
    };

    const result = await validateReflectieWithAI(reflectie);
    expect(result).toContain('negatieve woorden');
  });

  it('should validate reflectie with positive text content', async () => {
    const reflectie: Partial<Reflectie> = {
      datum: new Date('2025-05-19'),
      notitie: 'Ik voel me vandaag goed, energiek en blij. Alles gaat soepel en ik ben tevreden.',
      stemming: 'goed',
      pijn_score: 5,
      vermoeidheid_score: 5
    };

    const result = await validateReflectieWithAI(reflectie);
    expect(result).toContain('overwegend positief');
  });
});
