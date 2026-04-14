export enum Role {
  User = 'user',
  Model = 'model'
}

export interface Attachment {
  file: File;
  previewUrl: string;
  base64?: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachment?: Attachment;
  timestamp: number;
  isError?: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  systemPrompt?: string;
  createdAt: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  vram: number;
  url: string;
  wasmUrl: string;
  size: string;
  family?: string;
}