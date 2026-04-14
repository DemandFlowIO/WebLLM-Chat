import { CreateMLCEngine, MLCEngine, InitProgressCallback } from "@mlc-ai/web-llm";
import { Message, Role, Attachment, ModelConfig } from "../types";

export const AVAILABLE_MODELS: ModelConfig[] = [
  // --- DeepSeek ---
  {
    id: "DeepSeek-R1-Distill-Qwen-7B-q4f32_1-MLC",
    name: "DeepSeek R1 Distill Qwen 7B",
    description: "DeepSeek's distilled model based on Qwen 7B. High performance reasoning.",
    vram: 5200,
    url: "https://huggingface.co/mlc-ai/DeepSeek-R1-Distill-Qwen-7B-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/DeepSeek-R1-Distill-Qwen-7B-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.3GB",
    family: "DeepSeek"
  },
  {
    id: "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC",
    name: "DeepSeek R1 Distill Llama 8B",
    description: "DeepSeek's distilled model based on Llama 3 8B. Excellent instruction following.",
    vram: 5600,
    url: "https://huggingface.co/mlc-ai/DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.7GB",
    family: "DeepSeek"
  },
  // --- Llama 3.2 ---
  {
    id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    name: "Llama 3.2 1B Instruct",
    description: "Meta's ultra-lightweight 1B model. Extremely fast on almost any device.",
    vram: 1200,
    url: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3.2-1B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "0.8GB",
    family: "Llama"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    name: "Llama 3.2 3B Instruct",
    description: "Meta's 3B model. Great balance of intelligence and speed for mobile/web.",
    vram: 2800,
    url: "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "1.8GB",
    family: "Llama"
  },
  // --- Llama 3.1 ---
  {
    id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    name: "Llama 3.1 8B Instruct",
    description: "Meta's flagship 8B model with improved reasoning and long context.",
    vram: 5600,
    url: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3.1-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.7GB",
    family: "Llama"
  },
  // --- Gemma 2 ---
  {
    id: "gemma-2-2b-it-q4f32_1-MLC",
    name: "Gemma 2 2B",
    description: "Google's lightweight, state-of-the-art model. Balanced for speed and quality.",
    vram: 2200,
    url: "https://huggingface.co/mlc-ai/gemma-2-2b-it-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/gemma-2-2b-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "1.4GB",
    family: "Gemma"
  },
  {
    id: "gemma-2-9b-it-q4f32_1-MLC",
    name: "Gemma 2 9B",
    description: "Google's 9B model. Highly capable and competitive with much larger models.",
    vram: 6200,
    url: "https://huggingface.co/mlc-ai/gemma-2-9b-it-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/gemma-2-9b-it-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "5.4GB",
    family: "Gemma"
  },
  // --- Qwen 2.5 ---
  {
    id: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
    name: "Qwen 2.5 0.5B",
    description: "Alibaba's tiny but mighty 0.5B model. Perfect for simple tasks and low-end hardware.",
    vram: 800,
    url: "https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2.5-0.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "0.4GB",
    family: "Qwen"
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
    name: "Qwen 2.5 1.5B",
    description: "Alibaba's 1.5B model. Excellent performance-to-size ratio.",
    vram: 1800,
    url: "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2.5-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "1.1GB",
    family: "Qwen"
  },
  {
    id: "Qwen2.5-3B-Instruct-q4f32_1-MLC",
    name: "Qwen 2.5 3B",
    description: "Alibaba's 3B model. Very smart for its size, handles complex instructions well.",
    vram: 3200,
    url: "https://huggingface.co/mlc-ai/Qwen2.5-3B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2.5-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "2.1GB",
    family: "Qwen"
  },
  {
    id: "Qwen2.5-7B-Instruct-q4f32_1-MLC",
    name: "Qwen 2.5 7B",
    description: "Alibaba's flagship 7B model. Top-tier performance in its class.",
    vram: 5400,
    url: "https://huggingface.co/mlc-ai/Qwen2.5-7B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2.5-7B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.5GB",
    family: "Qwen"
  },
  // --- Phi 3.5 ---
  {
    id: "Phi-3.5-mini-instruct-q4f32_1-MLC",
    name: "Phi-3.5 Mini",
    description: "Microsoft's latest mini model. High quality reasoning in a small package.",
    vram: 3200,
    url: "https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Phi-3.5-mini-instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "2.2GB",
    family: "Phi"
  },
  // --- Mistral ---
  {
    id: "Mistral-7B-Instruct-v0.3-q4f32_1-MLC",
    name: "Mistral 7B v0.3",
    description: "The latest Mistral 7B model. Excellent reasoning and instruction following.",
    vram: 5600,
    url: "https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.3-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Mistral-7B-Instruct-v0.3-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.1GB",
    family: "Mistral"
  },
  // --- SmolLM2 ---
  {
    id: "SmolLM2-135M-Instruct-q4f32_1-MLC",
    name: "SmolLM2 135M",
    description: "HuggingFace's ultra-tiny model. Good for basic chat and extremely low resources.",
    vram: 400,
    url: "https://huggingface.co/mlc-ai/SmolLM2-135M-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/SmolLM2-135M-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "0.1GB",
    family: "SmolLM"
  },
  {
    id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
    name: "SmolLM2 360M",
    description: "HuggingFace's small model. Surprisingly capable for its size.",
    vram: 700,
    url: "https://huggingface.co/mlc-ai/SmolLM2-360M-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/SmolLM2-360M-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "0.3GB",
    family: "SmolLM"
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f32_1-MLC",
    name: "SmolLM2 1.7B",
    description: "HuggingFace's 1.7B model. Great for mobile and web applications.",
    vram: 1800,
    url: "https://huggingface.co/mlc-ai/SmolLM2-1.7B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/SmolLM2-1.7B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "1.1GB",
    family: "SmolLM"
  },
  // --- Additional Popular Models ---
  {
    id: "Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC",
    name: "Qwen 2.5 Coder 7B",
    description: "Specialized model for coding tasks. Top-tier performance in code generation.",
    vram: 5400,
    url: "https://huggingface.co/mlc-ai/Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Qwen2.5-Coder-7B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.5GB",
    family: "Qwen"
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC",
    name: "TinyLlama 1.1B Chat",
    description: "A compact 1.1B model that's surprisingly chatty and fast.",
    vram: 1000,
    url: "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/TinyLlama-1.1B-Chat-v1.0-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "0.7GB",
    family: "Llama"
  },
  {
    id: "Mistral-7B-Instruct-v0.2-q4f32_1-MLC",
    name: "Mistral 7B v0.2",
    description: "The previous stable version of Mistral 7B. Reliable and well-tested.",
    vram: 5600,
    url: "https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.2-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Mistral-7B-Instruct-v0.2-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "4.1GB",
    family: "Mistral"
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f32_1-MLC",
    name: "Phi-3 Mini 4k",
    description: "The original Phi-3 mini model. Excellent efficiency and capability.",
    vram: 3200,
    url: "https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f32_1-MLC/",
    wasmUrl: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Phi-3-mini-4k-instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    size: "2.2GB",
    family: "Phi"
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