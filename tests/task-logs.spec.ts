import { validateLogWithAI } from '@/utils/task-validation';
import { Task, TaskLog } from '@/types';

// Mock the logger to prevent test output pollution
jest.mock('@/lib/monitoring/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));

describe('Task Log AI Validation', () => {
  // Helper function to create a basic task log object for testing
  const createTestTaskLog = (overrides: Partial<TaskLog> = {}): Partial<TaskLog> & { user_id: string } => {
    return {
      user_id: 'test-user-id',
      task_id: 'test-task-id',
      start_tijd: new Date().toISOString(),
      energie_voor: 10,
      energie_na: 5,
      pijn_score: 5,
      vermoeidheid_score: 5,
      ...overrides} // Type assertion fixed
const typedOverrides = overrides as Record<string, unknown>
    ;;
  };

  // Helper function to create a basic task object for testing
  const createTestTask = (overrides: Partial<Task> = {}): Partial<Task> => {
    return {
      id: 'test-task-id',
      titel: 'Test Taak',
      type: 'taak',
      duur: 30,
      ...overrides} // Type assertion fixed
const typedOverrides = overrides as Record<string, unknown>
    ;;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate task log with high pain score', async () => {
    const taskLog = createTestTaskLog({
      pijn_score: 18,
      vermoeidheid_score: 5
    });

    const task = createTestTask();

    const result = await validateLogWithAI(taskLog, task);
    
    expect(result).toContain('Hoge pijn');
    expect(result).toContain('Overweeg aanpassingen');
  });

  test('should validate task log with high fatigue score', async () => {
    const taskLog = createTestTaskLog({
      pijn_score: 5,
      vermoeidheid_score: 18
    });

    const task = createTestTask();

    const result = await validateLogWithAI(taskLog, task);
    
    expect(result).toContain('Hoge vermoeidheid');
    expect(result).toContain('Overweeg aanpassingen');
  });

  test('should validate task log with both high pain and fatigue scores', async () => {
    const taskLog = createTestTaskLog({
      pijn_score: 18,
      vermoeidheid_score: 18
    });

    const task = createTestTask();

    const result = await validateLogWithAI(taskLog, task);
    
    expect(result).toContain('Hoge pijn');
    expect(result).toContain('vermoeidheid');
    expect(result).toContain('Overweeg aanpassingen');
  });

  test('should validate task log with high energy difference', async () => {
    const taskLog = createTestTaskLog({
      energie_voor: 20,
      energie_na: 5
    });

    const task = createTestTask();

    const result = await validateLogWithAI(taskLog, task);
    
    expect(result).toContain('veel energie te kosten');
    expect(result).toContain('Overweeg de duur of intensiteit aan te passen');
  });

  test('should validate task log with moderate energy difference', async () => {
    const taskLog = createTestTaskLog({
      energie_voor: 15,
      energie_na: 8
    });

    const task = createTestTask();

    const result = await validateLogWithAI(taskLog, task);
    
    expect(result).toContain('kost behoorlijk wat energie');
    expect(result).toContain('Houd dit in de gaten');
  });

  test('should suggest splitting long tasks with significant energy cost', async () => {
    const taskLog = createTestTaskLog({
      energie_voor: 15,
      energie_na: 8
    });

    const task = createTestTask({
      duur: 45
    });

    const result = await validateLogWithAI(taskLog, task);
    
    expect(result).toContain('op te delen in kortere sessies');
  });

  test('should return default message for normal logs', async () => {
    const taskLog = createTestTaskLog({
      pijn_score: 3,
      vermoeidheid_score: 3,
      energie_voor: 10,
      energie_na: 8
    });

    const task = createTestTask();

    const result = await validateLogWithAI(taskLog, task);
    
    expect(result).toContain('succesvol verwerkt');
    expect(result).toContain('Blijf uw symptomen monitoren');
  });

  test('should handle errors gracefully', async () => {
    // Use incomplete objects instead of null to test error handling more realistically
    const invalidLog = { user_id: 'test-user' } as any; // Missing required fields
    const invalidTask = {} as any; // Empty task object
    
    const result = await validateLogWithAI(invalidLog, invalidTask);
    
    expect(result).toContain('Log succesvol verwerkt');
    expect(result).toContain('Onvoldoende gegevens voor analyse');
    
    // Test with undefined values
    const resultWithUndefined = await validateLogWithAI(undefined as any, undefined as any);
    expect(resultWithUndefined).toContain('Log succesvol verwerkt');
    
    // Test with malformed data that would cause runtime errors
    const malformedLog = { 
      user_id: 'test-user',
      pijn_score: 'not-a-number', // Should be a number
      energie_voor: null,
      energie_na: undefined
    } as any;
    const resultWithMalformed = await validateLogWithAI(malformedLog, invalidTask);
    expect(resultWithMalformed).toContain('Log succesvol verwerkt');
  });
});
