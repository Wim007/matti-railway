import { describe, expect, it } from 'vitest';
import OpenAI from 'openai';
import { ENV } from './_core/env';

const shouldRunOpenAiValidationTest =
  process.env.RUN_OPENAI_VALIDATION_TEST === 'true' &&
  ENV.openaiApiKey.length > 0 &&
  ENV.openaiAssistantId.length > 0;

const testIfOpenAiValidationEnabled = shouldRunOpenAiValidationTest ? it : it.skip;

describe('OpenAI Credentials Validation', () => {
  testIfOpenAiValidationEnabled('should validate OpenAI API key and Assistant ID', async () => {
    const openai = new OpenAI({
      apiKey: ENV.openaiApiKey,
    });

    // Verify API key works by creating a thread
    const thread = await openai.beta.threads.create();

    expect(thread).toBeDefined();
    expect(thread.id).toBeDefined();
    expect(thread.id).toMatch(/^thread_/);

    // Verify Assistant ID exists and is accessible
    const assistant = await openai.beta.assistants.retrieve(ENV.openaiAssistantId);

    expect(assistant).toBeDefined();
    expect(assistant.id).toBe(ENV.openaiAssistantId);
    expect(assistant.id).toMatch(/^asst_/);
  }, 20000); // 20 second timeout for API calls
});
