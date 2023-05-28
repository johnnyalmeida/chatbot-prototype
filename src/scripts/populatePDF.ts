import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PDFLoader } from 'langchain/document_loaders';
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function getDocuments(): Promise<any[]> {
  try {
    const filePath = path.resolve('files/book1.pdf');
    const loader = new PDFLoader(filePath);
    const rawDocs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);

    return docs;
  } catch (e) {
    console.log('error', e);
  }
}

async function generateEmbeddings() {
  const configuration = new Configuration({ apiKey: process.env.OPENAI_KEY });
  const openAi = new OpenAIApi(configuration);

  const documents = await getDocuments(); // Your custom function to load docs
  // Assuming each document is a string
  for (const document of documents) {
    // OpenAI recommends replacing newlines with spaces for best results
    const input = JSON.stringify(document)
      .replace(/{|}/g, ' ')
      .replace(/"/g, '');

    const embeddingResponse = await openAi.createEmbedding({
      model: 'text-embedding-ada-002',
      input,
    });

    const [{ embedding }] = embeddingResponse.data.data;

    // In production we should handle possible errors
    await supabase.from('documents').insert({
      content: input,
      embedding,
    });
  }
}

(async () => {
  try {
    await generateEmbeddings();
    console.log('Done!');
  } catch (e) {
    console.log(e);
  }
})();
