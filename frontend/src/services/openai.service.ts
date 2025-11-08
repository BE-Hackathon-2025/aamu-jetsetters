import { chatbotConfig } from '../config/chatbot.config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatCompletionResponse {
  success: boolean;
  message?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

class OpenAIService {
  private apiKey: string;
  private model: string;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    this.apiKey = chatbotConfig.openai.apiKey;
    this.model = chatbotConfig.openai.model;
    
    this.conversationHistory.push({
      role: 'system',
      content: chatbotConfig.systemPrompt,
      timestamp: new Date(),
    });
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  addUserMessage(content: string): void {
    this.conversationHistory.push({
      role: 'user',
      content,
      timestamp: new Date(),
    });

    const maxHistory = chatbotConfig.hyperparameters.maxConversationHistory;
    if (this.conversationHistory.length > maxHistory) {
      this.conversationHistory = [
        this.conversationHistory[0],
        ...this.conversationHistory.slice(-maxHistory + 1),
      ];
    }
  }

  addAssistantMessage(content: string): void {
    this.conversationHistory.push({
      role: 'assistant',
      content,
      timestamp: new Date(),
    });
  }

  async sendMessage(userMessage: string): Promise<ChatCompletionResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.',
      };
    }

    this.addUserMessage(userMessage);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          max_tokens: chatbotConfig.hyperparameters.maxTokens,
          temperature: chatbotConfig.hyperparameters.temperature,
          top_p: chatbotConfig.hyperparameters.topP,
          frequency_penalty: chatbotConfig.hyperparameters.frequencyPenalty,
          presence_penalty: chatbotConfig.hyperparameters.presencePenalty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '';

      this.addAssistantMessage(assistantMessage);

      return {
        success: true,
        message: assistantMessage,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get response from AI',
      };
    }
  }

  async *streamMessage(userMessage: string): AsyncGenerator<StreamChunk> {
    if (!this.isConfigured()) {
      yield {
        content: 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.',
        done: true,
      };
      return;
    }

    this.addUserMessage(userMessage);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          max_tokens: chatbotConfig.hyperparameters.maxTokens,
          temperature: chatbotConfig.hyperparameters.temperature,
          top_p: chatbotConfig.hyperparameters.topP,
          frequency_penalty: chatbotConfig.hyperparameters.frequencyPenalty,
          presence_penalty: chatbotConfig.hyperparameters.presencePenalty,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenAI API request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          this.addAssistantMessage(fullMessage);
          yield { content: '', done: true };
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              this.addAssistantMessage(fullMessage);
              yield { content: '', done: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              
              if (content) {
                fullMessage += content;
                yield { content, done: false };
              }
            } catch (e) {
              console.warn('Failed to parse stream chunk:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('OpenAI streaming error:', error);
      yield {
        content: `Error: ${error.message || 'Failed to get response from AI'}`,
        done: true,
      };
    }
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory.filter(msg => msg.role !== 'system');
  }

  clearHistory(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: chatbotConfig.systemPrompt,
        timestamp: new Date(),
      },
    ];
  }

  updateSystemPrompt(newPrompt: string): void {
    if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
      this.conversationHistory[0].content = newPrompt;
    }
  }
}

export const openAIService = new OpenAIService();

