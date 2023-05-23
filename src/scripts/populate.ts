import { createClient } from '@supabase/supabase-js'
import { Configuration, OpenAIApi } from 'openai'
import { supabaseClient } from './lib/supabase'

async function generateEmbeddings() {
  const configuration = new Configuration({ apiKey: '<YOUR_OPENAI_KEY>' })
  const openAi = new OpenAIApi(configuration)

  const documents = await getDocuments() // Your custom function to load docs

  // Assuming each document is a string
  for (const document of documents) {
    // OpenAI recommends replacing newlines with spaces for best results
    const input = document.replace(/\n/g, ' ')

    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input,
    })

    const [{ embedding }] = embeddingResponse.data.data

    // In production we should handle possible errors
    await supabaseClient.from('documents').insert({
      content: document,
      embedding,
    })
  }
}