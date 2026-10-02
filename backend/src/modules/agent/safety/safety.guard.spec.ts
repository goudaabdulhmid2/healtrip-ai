import { SafetyGuard } from './safety.guard';

describe('SafetyGuard', () => {
  const guard = new SafetyGuard();

  it('detects the demonstrated English urgent scenario', () => {
    expect(
      guard.assess('I have severe chest pain and difficulty breathing').level,
    ).toBe('URGENT');
  });

  it('detects an Arabic urgent message', () => {
    expect(
      guard.assess('أعاني من ألم شديد في الصدر وصعوبة شديدة في التنفس').level,
    ).toBe('URGENT');
  });

  it('does not classify an explicitly negated chest-pain phrase as urgent', () => {
    expect(guard.assess('لا يوجد ألم في الصدر').level).toBe('ROUTINE');
  });

  it('allows a normal provider-search request', () => {
    expect(guard.assess('Find a cardiologist in Madinah').level).toBe(
      'ROUTINE',
    );
  });
});
