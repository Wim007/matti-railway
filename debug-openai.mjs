import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const assistantId = process.env.OPENAI_ASSISTANT_ID;

console.log('Testing OpenAI connection...');
console.log('API Key present:', !!apiKey);
console.log('API Key starts with:', apiKey?.substring(0, 10) + '...');
console.log('Assistant ID:', assistantId);
console.log('');

const openai = new OpenAI({
  apiKey: apiKey,
});

try {
  console.log('1. Testing thread creation...');
  const thread = await openai.beta.threads.create();
  console.log('✅ Thread created:', thread.id);
  console.log('');
  
  console.log('2. Testing assistant retrieval...');
  const assistant = await openai.beta.assistants.retrieve(assistantId);
  console.log('✅ Assistant found:', assistant.id);
  console.log('   Name:', assistant.name);
  console.log('   Model:', assistant.model);
  console.log('');
  
  console.log('✅ All tests passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('   Status:', error.status);
  console.error('   Type:', error.type);
  console.error('   Code:', error.code);
  console.error('');
  console.error('Full error:', error);
}
