import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Documents } from './documents.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Configuration, OpenAIApi } from 'openai';
import { createClient } from '@supabase/supabase-js';
import GPT3Tokenizer from 'gpt3-tokenizer';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Documents) private readonly repo: Repository<Documents>,
    private configService: ConfigService,
  ) {}

  async processPrompt(search: string): Promise<string> {
    const supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY'),
    );
    // Search query is passed in request payload
    // OpenAI recommends replacing newlines with spaces for best results
    const input = search.replace(/\n/g, ' ');

    const apiKey = this.configService.get('OPENAI_KEY');
    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);

    // Generate a one-time embedding for the query itself
    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input,
    });

    const [{ embedding }] = embeddingResponse.data.data;

    const res = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78, // Choose an appropriate threshold for your data
      match_count: 2, // Choose the number of matches
    });

    const contextText = this.getContextText(res);

    const prompt = this.buildPrompt(contextText, search);

    const MAX_TOKEN_COMPLETION = this.configService.get('MAX_TOKEN_COMPLETION');
    let completionResponse;
    try {
      completionResponse = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        max_tokens: Number(MAX_TOKEN_COMPLETION),
        temperature: 0.2, // Set to 0 for deterministic results
      });
    } catch (e) {
      console.log('==========================');
      console.log(e.response.data);
      console.log('==========================');
    }

    const {
      choices: [{ text }],
    } = completionResponse.data;

    return text;
  }

  getContextText(documents): string {
    const MAX_TOKEN_CONTEXT = this.configService.get('MAX_TOKEN_CONTEXT');
    const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });
    let tokenCount = 0;
    let contextText = '';
    // Concat matched documents
    for (let i = 0; i < documents.data.length; i++) {
      const document = documents.data[i];
      const content = document.content;
      const encoded = tokenizer.encode(content);
      tokenCount += encoded.text.length;
      // Limit context max tokens
      if (tokenCount > Number(MAX_TOKEN_CONTEXT)) {
        break;
      }
      contextText += `${content.trim()}\n---\n`;
    }

    return contextText;
  }

  // buildPrompt(contextText, search): string {
  //   const prompt = `You are a SCC and SEL lesson planner virtual assistant for teachers developed by Everyday Speech, you will be asked to plan a lesson and you will use the material data providade in 
  //   the Context section to plan the best lesson, the output should be friendly and easy to read.
  //   If you are unsure and the answer is not included in the context, say
  //   "Sorry, I don't know how to help with that. Would you like to talk to a Support Agent?"
  //   Context section:
  //   ${contextText}

  //   Request: """
  //   ${search} 
  //   """
  //   `;

  //   return prompt;
  // }
  buildPrompt(contextText, search): string {
    const prompt = `You are are a virtual assistant from Educar Intercâmbio, a company to help Brazilian students to study in Buenos Aires, Argentina.
    You will be answering very polite and helpful to any request the user have using the context section information, you can fill in the gaps using knowledge you have.
    The request is in Brazilian Portuguese or Spanish and you you reply in the same language as the reques.
    Context Section: 
    ${contextText}

    Request: """
    ${search} 
    """
    `;

    return prompt;
  }
}
