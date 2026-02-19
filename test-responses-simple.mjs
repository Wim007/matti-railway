import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

console.log('Testing Responses API (simple mode) with project-scoped key...');
console.log('API Key present:', !!apiKey);
console.log('API Key starts with:', apiKey?.substring(0, 15) + '...');
console.log('');

const openai = new OpenAI({
  apiKey: apiKey,
});

try {
  console.log('Testing response generation (without conversation)...');
  const response = await openai.responses.create({
    model: 'gpt-4o',
    instructions: 'Je bent een vriendelijke assistent die kort en duidelijk antwoord geeft in het Nederlands.',
    input: 'Hoi! Kun je me helpen?'
  });
  
  console.log('✅ Response received:');
  console.log('Full response:', JSON.stringify(response, null, 2));
  console.log('');
  
  console.log('✅ Responses API works with project-scoped keys!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('   Status:', error.status);
  console.error('   Type:', error.type);
  console.error('');
  if (error.response) {
    console.error('Response body:', await error.response.text());
  }
}
