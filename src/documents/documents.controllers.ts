import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { DocumentService } from './documents.service';
import { Documents } from './documents.entity';
import { ConfigService } from '@nestjs/config';
import { Configuration, OpenAIApi } from 'openai';
import { createClient } from '@supabase/supabase-js';
import stripIndent from 'strip-indent';
import GPT3Tokenizer from 'gpt3-tokenizer';

@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private configService: ConfigService,
  ) {}

  @Get()
  async searchVector(
    @Query('search') search: string,
    @Query('limit', ParseIntPipe) limit: number,
  ): Promise<any> {
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

    // const results = await this.documentService.searchVector(embedding, limit);

    // In production we should handle possible errors
    const res = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78, // Choose an appropriate threshold for your data
      match_count: 10, // Choose the number of matches
    });

    // console.log('RES', res.data);
    const result = [];
    res.data.forEach((element) => {
      const item = {
        id: element.id,
        content: element.content,
      };

      result.push(item);
    });

    const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });
    let tokenCount = 0;
    let contextText = '';

    // Concat matched documents
    for (let i = 0; i < result.length; i++) {
      const document = result[i];
      const content = document.content;
      const encoded = tokenizer.encode(content);
      tokenCount += encoded.text.length;

      // Limit context to max 1500 tokens (configurable)
      if (tokenCount > 2000) {
        break;
      }

      contextText += `${content.trim()}\n---\n`;
    }

    const prompt = `You are a very enthusiastic and fun Everyday Speech virtual assistant to help teachers building lesson plans! Given the following content materials from Everyday Speech, answer the question using only that information,
    outputted in human readable format. If you are unsure and the answer
    is not explicitly written in the context, say
    "Sorry, I don't know how to help with that. Would you like to talk to a Support Agent?"
    Context sections:
    ${contextText}

    Question: """
    ${search} 
    """
    Answer providing a lesson plan based in the materials in the context section, providing the title, a short description, and the reference link for each material.
    All content piece has a duration, the sum of the durations for each content can't be higher that the time limit of a lesson, if the question doesn't include a time limit, consider it to be five minutes.
    Total Duration can't be longer than the time limit: 
    `;

    // In production we should handle possible errors
    const completionResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 2000, // Choose the max allowed tokens in completion
      temperature: 0, // Set to 0 for deterministic results
    });

    const {
      id,
      choices: [{ text }],
    } = completionResponse.data;

    // return new Response(JSON.stringify(), {
    //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    // });

    return { id, text };
  }
}
