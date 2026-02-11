'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp?: string;
}

// Component to render formatted message content
function FormattedMessage({ content }: { content: string }) {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let isList = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines but preserve spacing
    if (!trimmedLine) {
      elements.push(
        <div key={`space-${index}`} className="h-2" />
      );
      return;
    }

    // Handle headings (## Heading)
    if (trimmedLine.startsWith('##')) {
      const heading = trimmedLine.replace(/^##\s*/, '');
      elements.push(
        <h3 key={`heading-${index}`} className="font-bold text-base mt-3 mb-2">
          {renderInlineFormatting(heading)}
        </h3>
      );
      return;
    }

    // Handle bullet points
    if (trimmedLine.startsWith('- ')) {
      if (!isList) {
        isList = true;
      }
      const bulletText = trimmedLine.replace(/^-\s*/, '');
      elements.push(
        <li key={`bullet-${index}`} className="ml-4 list-disc">
          {renderInlineFormatting(bulletText)}
        </li>
      );
      return;
    }

    // Close list if we were in one
    if (isList) {
      isList = false;
    }

    // Regular paragraph
    elements.push(
      <p key={`para-${index}`} className="mb-2">
        {renderInlineFormatting(trimmedLine)}
      </p>
    );
  });

  return <div className="space-y-1">{elements}</div>;
}

// Helper to render inline formatting (bold, links, etc)
function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Match **bold**, [link](url), and plain URLs
  const regex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+)|(\S+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold** text
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold">
          {match[1]}
        </strong>
      );
    } else if (match[2] && match[3]) {
      // [link text](url)
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#FF8C00] hover:underline font-medium"
        >
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      // Plain URL
      parts.push(
        <a
          key={`url-${match.index}`}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#FF8C00] hover:underline break-all"
        >
          {match[4]}
        </a>
      );
    } else if (match[5]) {
      // Regular word
      parts.push(match[5]);
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: 'Hello! 👋 Welcome to CenterPoint Energy Assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add timestamps after hydration to prevent mismatch
  useEffect(() => {
    setIsHydrated(true);
    setMessages((prevMessages) =>
      prevMessages.map((msg, index) => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toLocaleTimeString(),
      }))
    );
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Save the input before clearing
    const userInput = input;

    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const lambdaUrl = process.env.NEXT_PUBLIC_LAMBDA_URL;

      if (!lambdaUrl) {
        throw new Error('Lambda URL is not configured. Please set NEXT_PUBLIC_LAMBDA_URL environment variable.');
      }

      // Build request payload with conversation_id if available
      const payload: any = {
        message: userInput,
        customer_name: 'CenterPoint',
      };

      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      console.log('Sending request to Lambda:', payload);

      const response = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Lambda response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Lambda response data:', data);

      // Extract conversation_id if this is the first message
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Extract response from the Lambda response format
      // Lambda can return responses in different formats depending on invocation type
      let botResponse = '';
      let responseData = data;

      // If response is wrapped in a body field (HTTP invocation), parse it
      if (typeof data.body === 'string') {
        try {
          responseData = JSON.parse(data.body);
        } catch (e) {
          responseData = data;
        }
      }

      // Extract the actual response from various possible formats
      if (responseData.message && responseData.message.content) {
        botResponse = responseData.message.content;
        // Also save conversation_id if present
        if (responseData.conversation_id && !conversationId) {
          setConversationId(responseData.conversation_id);
        }
      } else if (responseData.response) {
        botResponse = responseData.response;
      } else if (responseData.body && typeof responseData.body === 'string') {
        botResponse = responseData.body;
      } else if (data.message && data.message.content) {
        botResponse = data.message.content;
      } else {
        console.warn('Unexpected response format:', data);
        botResponse = 'Unable to process your request.';
      }

      const botMessage: Message = {
        role: 'bot',
        content: botResponse,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      console.error('Error details:', err);
      setError(errorMessage);

      // Add error message to chat
      const errorBotMessage: Message = {
        role: 'bot',
        content: `❌ Error: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#003366] to-[#004D80] shadow-md z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">CenterPoint Energy Assistant</h1>
          <p className="text-sm text-orange-200 mt-1">Your energy solutions partner</p>
        </div>
      </header>

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto pt-24 pb-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-[#003366] text-white rounded-br-none shadow-sm'
                    : 'bg-white text-gray-900 rounded-bl-none shadow-sm border border-gray-200'
                } break-words`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm lg:text-base">{msg.content}</p>
                ) : (
                  <div className="text-sm lg:text-base">
                    <FormattedMessage content={msg.content} />
                  </div>
                )}
                {isHydrated && msg.timestamp && (
                  <span
                    className={`text-xs mt-2 block ${
                      msg.role === 'user' ? 'text-orange-200' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 px-4 py-3 rounded-lg rounded-bl-none shadow-sm border border-gray-200">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-[#FF8C00] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#FF8C00] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-[#FF8C00] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {error && !isLoading && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder="Type your message here..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-900"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-[#FF8C00] text-white rounded-lg font-medium hover:bg-[#E67E22] transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
