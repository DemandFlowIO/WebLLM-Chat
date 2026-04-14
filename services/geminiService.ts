import { CreateMLCEngine, MLCEngine, InitProgressCallback } from "@mlc-ai/web-llm";
import { Message, Role, Attachment, ModelConfig } from "../types";

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "gemma-2-2b-it-q4f32_1-MLC",
    name: "Gemma 2 2B",
    description: "Google's lightweight, state-of-the-art model. Balanced for speed and quality.",
    vram: 3000,
    url: "https://huggingface.co/mlc-ai/gemma-2-2b-it-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/gemma-2-2b-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "1.4GB"
  },
  {
    id: "Llama-3-8B-Instruct-q4f32_1-MLC-1k",
    name: "Llama 3 8B (1k)",
    description: "Meta's powerful 8B model optimized for lower VRAM with 1k context.",
    vram: 5300,
    url: "https://huggingface.co/mlc-ai/Llama-3-8B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.7GB"
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f32_1-MLC-1k",
    name: "Phi-3 Mini (1k)",
    description: "Microsoft's highly capable small model. Very fast and efficient.",
    vram: 3200,
    url: "https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Phi-3-mini-4k-instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "2.2GB"
  },
  {
    id: "Mistral-7B-Instruct-v0.3-q4f32_1-MLC",
    name: "Mistral 7B v0.3",
    description: "The latest Mistral 7B model. Excellent reasoning and instruction following.",
    vram: 5600,
    url: "https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.3-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Mistral-7B-Instruct-v0.3-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.1GB"
  },
  {
    id: "Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC",
    name: "Hermes 2 Pro Llama 3",
    description: "Fine-tuned Llama 3 for better tool use and creative writing.",
    vram: 6000,
    url: "https://huggingface.co/mlc-ai/Hermes-2-Pro-Llama-3-8B-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.7GB"
  }
];

let engine: MLCEngine | null = null;
let isInitializing = false;
let shouldAbortInit = false;

/**
 * Initializes the local WebGPU model.
 */
export const initLocalModel = async (
  modelConfig: ModelConfig,
  onProgress: (progress: string, percent?: number) => void
): Promise<void> => {
  if (engine || isInitializing) return;
  
  isInitializing = true;
  shouldAbortInit = false;
  try {
    const initProgressCallback: InitProgressCallback = (report) => {
      if (shouldAbortInit) {
        throw new Error("INIT_ABORTED");
      }
      onProgress(report.text, report.progress);
    };
    
    const config = { 
      initProgressCallback,
      appConfig: {
        useIndexedDBCache: true,
        model_list: [
          {
            model_id: modelConfig.id,
            model_lib: modelConfig.wasmUrl, 
            model: modelConfig.url,
            vram_required_MB: modelConfig.vram,
            low_resource_required: true,
          } as any
        ]
      }
    };

    // Simple retry logic for transient fetch errors
    let lastError: any = null;
    for (let i = 0; i < 3; i++) {
      if (shouldAbortInit) throw new Error("INIT_ABORTED");
      try {
        console.log(`Starting initialization attempt ${i + 1} for ${modelConfig.id}...`);
        engine = await CreateMLCEngine(modelConfig.id, config);
        console.log("Engine initialized successfully");
        isInitializing = false;
        return;
      } catch (error: any) {
        if (error.message === "INIT_ABORTED") throw error;
        console.error(`Initialization attempt ${i + 1} failed for ${modelConfig.id}:`, error.message || error);
        lastError = error;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw lastError;
  } catch (error: any) {
    if (error.message === "INIT_ABORTED") {
      console.log("Initialization aborted by user");
    } else {
      console.error("Failed to initialize WebLLM:", error);
    }
    isInitializing = false;
    shouldAbortInit = false;
    throw error;
  }
};

/**
 * Aborts the current initialization process.
 */
export const abortModelInit = () => {
  if (isInitializing) {
    shouldAbortInit = true;
  }
};

/**
 * Streams the response from the local WebGPU model.
 */
export const streamGeminiResponse = async function* (
  history: Message[],
  newMessage: string,
  systemPrompt?: string,
  newAttachment?: Attachment,
  signal?: AbortSignal
) {
  if (!engine) {
    throw new Error("Model is not initialized yet.");
  }

  // Prepare messages in OpenAI format for WebLLM
  const chatHistory = history.map(msg => ({
    role: msg.role === Role.User ? 'user' : 'assistant',
    content: msg.text
  }));

  // Handle current message
  let content = newMessage;
  if (newAttachment) {
    content += `\n\n[System Note: User attached an image named "${newAttachment.file.name}". This local model cannot see images directly, but you should acknowledge the user provided one.]`;
  }

  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push(...chatHistory);
  messages.push({ role: 'user', content: content });

  try {
    const chunks = await engine.chat.completions.create({
      messages: messages as any,
      stream: true,
      temperature: 0.7,
      max_tokens: 1024, 
    });

    for await (const chunk of chunks) {
      if (signal?.aborted) {
        break;
      }
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    console.error("WebLLM Generation Error:", error);
    throw error;
  }
};

/**
 * Resets the engine to allow switching models.
 */
export const resetEngine = async () => {
  if (engine) {
    await engine.unload();
    engine = null;
  }
};