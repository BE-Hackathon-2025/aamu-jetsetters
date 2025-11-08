import { useState, useRef, useEffect } from 'react';
import ChatMessage from '../../components/admin/ChatMessage';
import ModelOutput from '../../components/admin/ModelOutput';
import LogDataPanel from '../../components/admin/LogDataPanel';
import { openAIService } from '../../services/openai.service';
import { chatbotConfig } from '../../config/chatbot.config';
import './AIAnalystChat.css';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

function AIAnalystChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I\'m your AI Analyst for Sentra water quality monitoring. I can help you analyze anomalies, diagnose issues, and provide insights on water quality data. How can I assist you today?',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestedPrompts, setShowSuggestedPrompts] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = chatbotConfig.predefinedPrompts;

  useEffect(() => {
    if (shouldAutoScroll && !isStreaming && messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages, shouldAutoScroll, isStreaming]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = inputValue.trim();
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputValue('');
      setIsLoading(true);

      if (!openAIService.isConfigured()) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: '⚠️ OpenAI API key not configured. Please add your API key to the .env file and restart the server.\n\nAdd this to frontend/.env:\nVITE_OPENAI_API_KEY=your-api-key-here',
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      if (chatbotConfig.hyperparameters.streamResponse) {
        setIsStreaming(true);
        setShouldAutoScroll(true);
        const streamingMessageId = (Date.now() + 1).toString();
        let fullContent = '';

        const streamingMessage: Message = {
          id: streamingMessageId,
          role: 'ai',
          content: '',
        };
        setMessages((prev) => [...prev, streamingMessage]);

        try {
          const stream = openAIService.streamMessage(userMessage);

          for await (const chunk of stream) {
            if (!chunk.done && chunk.content) {
              fullContent += chunk.content;
              setMessages((prev) => 
                prev.map((msg) =>
                  msg.id === streamingMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              );
              
              if (shouldAutoScroll && messagesContainerRef.current) {
                const container = messagesContainerRef.current;
                container.scrollTop = container.scrollHeight;
              }
            }
          }
        } catch (error: any) {
          console.error('Streaming error:', error);
          setMessages((prev) => 
            prev.map((msg) =>
              msg.id === streamingMessageId
                ? { ...msg, content: `Error: ${error.message || 'Failed to get response'}` }
                : msg
            )
          );
        }

        setIsStreaming(false);
        setIsLoading(false);
      } else {
        const response = await openAIService.sendMessage(userMessage);

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: response.success 
            ? response.message || 'No response received'
            : `Error: ${response.error || 'Failed to get response'}`,
        };

        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      }
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    setShowSuggestedPrompts(false);
  };

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    const summaryPrompt = 'Generate a comprehensive incident summary based on current anomalies, alerts, and system status. Include severity assessment, affected areas, and recommended actions.';
    
    if (!openAIService.isConfigured()) {
      alert('OpenAI API key not configured. Please add your API key to the .env file.');
      setIsLoading(false);
      return;
    }

    const response = await openAIService.sendMessage(summaryPrompt);
    
    if (response.success && response.message) {
      const summaryMessage: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: `**Incident Summary:**\n\n${response.message}`,
      };
      setMessages((prev) => [...prev, summaryMessage]);
    }
    
    setIsLoading(false);
  };

  const handleClearChat = () => {
    openAIService.clearHistory();
    setMessages([
      {
        id: '1',
        role: 'ai',
        content: 'Chat history cleared. How can I assist you?',
      },
    ]);
  };

  return (
    <div className="ai-analyst-page">
      <div className="ai-chat-section">
        <div className="chat-header">
          <h2 className="chat-title">AI Analyst</h2>
        </div>

        <div 
          className={`chat-messages ${isStreaming ? 'streaming' : ''}`} 
          ref={messagesContainerRef} 
          onScroll={handleScroll}
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} role={message.role} content={message.content} />
          ))}
          {isLoading && !isStreaming && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showSuggestedPrompts && (
          <div className="suggested-prompts">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                className="prompt-button"
                onClick={() => handleSuggestedPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="chat-controls">
          <button className="clear-chat-btn" onClick={handleClearChat} disabled={isLoading}>
            Clear Chat
          </button>
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Message AI Analyst..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            disabled={isLoading}
          />
          <button 
            className="send-button" 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="ai-right-panel">
        <button 
          className="generate-summary-btn" 
          onClick={handleGenerateSummary}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Incident Summary'}
        </button>

        <ModelOutput
          anomalyScore={0.85}
          severityLevel="High"
          predictedFailurePoint="Pump PU1"
          confidence={92}
          lastUpdated="2024-07-26 10:15:30 UTC"
        />

        <LogDataPanel />
      </div>
    </div>
  );
}

export default AIAnalystChat;

