import React, { useState } from 'react';
import { Message, Role } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { Bot, User, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.User;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-[#21262d] text-indigo-400 border border-[#30363d]'
        }`}>
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        {/* Content */}
        <div className={`flex flex-col gap-2 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Attachment Preview (Image) */}
          {message.attachment && (
            <div className="mb-2 overflow-hidden rounded-2xl border border-[#30363d] shadow-2xl max-w-[400px]">
              <img 
                src={message.attachment.previewUrl} 
                alt="User attachment" 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <div className={`group relative px-5 py-4 rounded-[1.5rem] text-sm md:text-base leading-relaxed ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
              : 'bg-[#161b22] border border-[#30363d] text-gray-200 rounded-tl-none shadow-sm'
          }`}>
            <MarkdownRenderer content={message.text} />
            
            {/* Copy Button */}
            {!isUser && message.text && (
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-[#0d1117]/50 hover:bg-[#0d1117] text-gray-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            )}
          </div>
          
          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;