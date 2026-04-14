import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
      <ReactMarkdown
        components={{
          // Custom styling for code blocks if needed, utilizing Tailwind typography plugin defaults
          a: ({ node, ...props }) => (
            <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownRenderer);