import { extractMentions } from './mention-validator';

describe('extractMentions', () => {
  it('should extract a single mention from text', () => {
    const mentions = extractMentions('Hello @john, how are you?');
    expect(mentions).toEqual(['john']);
  });

  it('should extract multiple mentions from text', () => {
    const mentions = extractMentions('@alice please review this for @bob');
    expect(mentions).toEqual(['alice', 'bob']);
  });

  it('should return unique mentions only', () => {
    const mentions = extractMentions('@alice says hi to @alice');
    expect(mentions).toEqual(['alice']);
  });

  it('should return empty array when no mentions found', () => {
    const mentions = extractMentions('Hello, how are you?');
    expect(mentions).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    const mentions = extractMentions('');
    expect(mentions).toEqual([]);
  });

  it('should handle mentions with underscores and numbers', () => {
    const mentions = extractMentions('Hey @user_123 and @admin_01');
    expect(mentions).toEqual(['user_123', 'admin_01']);
  });
});
