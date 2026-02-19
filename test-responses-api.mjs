import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

console.log('Testing Responses API with project-scoped key...');
console.log('API Key present:', !!apiKey);
console.log('API Key starts with:', apiKey?.substring(0, 15) + '...');
console.log('');

const openai = new OpenAI({
  apiKey: apiKey,
});

try {
  console.log('1. Testing conversation creation...');
  const conversation = await openai.conversations.create({
    metadata: { test: 'true', theme: 'general' }
  });
  console.log('✅ Conversation created:', conversation.id);
  console.log('');
  
  console.log('2. Testing response generation...');
  const response = await openai.responses.create({
    model: 'gpt-4o',
    conversation: conversation.id,
    instructions: 'Je bent een vriendelijke assistent die kort en duidelijk antwoord geeft in het Nederlands.',
    input: [
      { role: 'user', content: 'Hoi! Kun je me helpen?' }
    ]
  });
  
  console.log('✅ Response received:');
  console.log('   Output:', response.output_text?.substring(0, 100) + '...');
  console.log('   Model:', response.model);
  console.log('');
  
  console.log('✅ All tests passed! Responses API works with project-scoped keys.');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('   Status:', error.status);
  console.error('   Type:', error.type);
  console.error('');
  console.error('Full error:', error);
}
