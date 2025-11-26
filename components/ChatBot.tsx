
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { generateChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi there! I'm LetEX AI 🤖✨. I can help you understand physics, describe simulations, or just chat about science! \n\nAsk me anything, like \"**What is a black hole?**\" or \"**Show me a nebula**\"! 🚀",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Pass last 10 messages for context to keep it lightweight
      const history = messages.slice(-10);
      const responseText = await generateChatResponse(history, userMsg.content);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat Error", error);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  // Parser to render **text** as Blue and ![alt](url) as Images
  const renderContent = (content: string) => {
    // 1. Split by image regex
    const parts = content.split(/(!\[.*?\]\(.*?\))/g);
    
    return parts.map((part, index) => {
      // Check if this part is an image
      const imgMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        return (
          <img 
            key={index} 
            src={imgMatch[2]} 
            alt={imgMatch[1]} 
            className="rounded-lg shadow-md my-2 w-full h-auto max-h-48 object-cover border border-slate-200" 
            loading="lazy"
          />
        );
      }

      // 2. Parse bold text for blue highlighting
      // We split by **
      const textParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {textParts.map((subPart, subIndex) => {
            if (subPart.startsWith('**') && subPart.endsWith('**')) {
              return (
                <strong key={subIndex} className="text-blue-600 font-bold">
                  {subPart.slice(2, -2)}
                </strong>
              );
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      {/* Glassmorphism Container */}
      <div className="flex-1 flex flex-col bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Icons.Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">LetEX AI</h3>
              <span className="text-blue-100 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> 
                Online & Ready
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}
                `}
              >
                {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start w-full">
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about physics, space, or simulation..."
              className="w-full bg-slate-100 text-slate-700 placeholder-slate-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-12"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`
                absolute right-2 p-2 rounded-lg transition-all
                ${!input.trim() || isTyping 
                  ? 'text-slate-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}
              `}
            >
              <Icons.Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
