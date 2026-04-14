import React, { useRef, useState } from 'react';
import { Send, ImagePlus, X, Loader2, Square } from 'lucide-react';
import { Attachment } from '../types';
import { formatBytes } from '../utils/fileUtils';

interface InputAreaProps {
  onSend: (text: string, attachment?: Attachment) => void;
  onStop?: () => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, onStop, isLoading }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && !attachment) || isLoading) return;
    
    onSend(text, attachment);
    setText('');
    setAttachment(undefined);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAttachment({
        file,
        previewUrl,
        mimeType: file.type
      });
    }
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    if (attachment) {
      URL.revokeObjectURL(attachment.previewUrl);
      setAttachment(undefined);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setText(target.value);
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  return (
    <div className="sticky bottom-0 bg-transparent p-4 z-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Attachment Preview Banner */}
        {attachment && (
          <div className="flex items-center gap-3 mb-3 p-2 bg-[#161b22] border border-[#30363d] rounded-2xl w-fit shadow-xl">
            <div className="relative w-12 h-12 overflow-hidden rounded-xl border border-[#30363d]">
              <img src={attachment.previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-300 truncate max-w-[150px]">
                {attachment.file.name}
              </span>
              <span className="text-xs text-gray-500">{formatBytes(attachment.file.size)}</span>
            </div>
            <button 
              onClick={removeAttachment}
              className="p-1.5 hover:bg-[#21262d] rounded-full text-gray-500 transition-colors ml-2"
              title="Remove attachment"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-3 items-end bg-[#161b22] border border-[#30363d] rounded-[2rem] px-4 py-3 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all">
          
          {/* File Input Trigger */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="text-gray-500 hover:text-indigo-400 transition-colors p-2 rounded-xl hover:bg-[#21262d] mb-0.5"
            title="Attach image"
          >
            <ImagePlus size={20} />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Enter to send, Shift + Enter for new line..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-[200px] py-2 text-gray-200 placeholder-gray-600 leading-relaxed text-sm md:text-base"
            rows={1}
            disabled={isLoading}
          />

          {/* Send / Stop Button */}
          {isLoading ? (
            <button
              onClick={onStop}
              className="p-2.5 rounded-xl flex items-center justify-center transition-all mb-0.5 bg-red-600/20 text-red-500 hover:bg-red-600/30 active:scale-95"
              title="Stop generation"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(!text.trim() && !attachment)}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all mb-0.5 ${
                (!text.trim() && !attachment)
                  ? 'bg-[#21262d] text-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95'
              }`}
            >
              <Send size={20} />
            </button>
          )}
        </div>
        
        <div className="text-center mt-3">
           <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
             Local AI can make mistakes. Verify important info.
           </p>
        </div>
      </div>
    </div>
  );
};

export default InputArea;