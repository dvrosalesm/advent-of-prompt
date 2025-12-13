import { generateText as vercelGenerateText } from "ai";
import { google } from "@ai-sdk/google";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================================
// TYPES
// ============================================================================

export type GeminiModel =
  | "gemini-2.0-flash-exp"
  | "gemini-2.0-flash"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export interface TextGenerationOptions {
  model?: GeminiModel;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ImageGenerationOptions {
  prompt: string;
  n?: number;
}

export interface TextGenerationResult {
  text: string;
  model: string;
}

export interface ImageGenerationResult {
  images: {
    url?: string;
    base64?: string;
  }[];
  model: string;
}

export interface VisionAnalysisResult {
  text: string;
  model: string;
}

export interface ImageComparisonResult {
  similarityScore: number; // 0-100
  reasoning: string;
  matchingElements: string[];
  missingElements: string[];
  isPass: boolean;
}

// ============================================================================
// DEFAULT MODEL
// ============================================================================

const DEFAULT_MODEL: GeminiModel = "gemini-2.0-flash";

// ============================================================================
// TEXT GENERATION
// ============================================================================

/**
 * Generate text using Gemini
 */
export async function generateText(
  options: TextGenerationOptions
): Promise<TextGenerationResult> {
  const {
    prompt,
    systemPrompt,
    maxTokens,
    temperature = 0.7,
  } = options;

  const model = options.model || DEFAULT_MODEL;

  const result = await vercelGenerateText({
    model: google(model),
    prompt,
    system: systemPrompt,
    maxOutputTokens: maxTokens,
    temperature,
  });

  return {
    text: result.text,
    model,
  };
}

/**
 * Generate text with Gemini
 */
export async function generateWithGemini(
  prompt: string,
  options?: Partial<Omit<TextGenerationOptions, "prompt">>
): Promise<TextGenerationResult> {
  return generateText({
    prompt,
    ...options,
  });
}

// ============================================================================
// IMAGE GENERATION - Using Imagen 3 via REST API
// ============================================================================

/**
 * Generate images using Google Imagen 3 via REST API
 */
export async function generateImage(
  prompt: string,
  options?: Partial<ImageGenerationOptions>
): Promise<ImageGenerationResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required for image generation");
  }

  const n = options?.n || 1;

  // Use the Imagen 3 REST API endpoint
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: n,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Imagen API error:", errorText);

    // Check for rate limit
    if (response.status === 429) {
      console.log("Imagen rate limited, trying Gemini fallback...");
    }

    // Fallback: Try using Gemini 2.0 Flash with native image generation
    return generateImageWithGemini(prompt, options);
  }

  const data = await response.json();

  const images = data.predictions?.map((pred: { bytesBase64Encoded: string }) => ({
    base64: pred.bytesBase64Encoded,
  })) || [];

  return {
    images,
    model: "imagen-3",
  };
}

/**
 * Helper to sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fallback: Generate images using Gemini 2.0 Flash experimental
 * Note: This uses Gemini's text-to-image capability with retry logic
 */
async function generateImageWithGemini(
  prompt: string,
  options?: Partial<ImageGenerationOptions>,
  retryCount: number = 0
): Promise<ImageGenerationResult> {
  const maxRetries = 3;
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

  // Use Gemini 2.0 Flash experimental which has image generation
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      // @ts-expect-error - responseModalities may not be in types yet
      responseModalities: ["Text", "Image"],
    },
  });

  try {
    const result = await model.generateContent(
      `Generate an image based on this description: ${prompt}`
    );

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts || [];

    const images: { base64?: string }[] = [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        images.push({
          base64: part.inlineData.data,
        });
      }
    }

    if (images.length === 0) {
      throw new Error("No images generated");
    }

    return {
      images,
      model: "gemini-2.0-flash-exp",
    };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("Gemini image generation error:", error);

    // Handle rate limiting with retry
    if (err.status === 429 && retryCount < maxRetries) {
      const waitTime = Math.pow(2, retryCount + 1) * 5000; // 10s, 20s, 40s
      console.log(`Rate limited. Retrying in ${waitTime / 1000}s... (attempt ${retryCount + 1}/${maxRetries})`);
      await sleep(waitTime);
      return generateImageWithGemini(prompt, options, retryCount + 1);
    }

    // Check for rate limit error in message
    if (err.status === 429 || (err.message && err.message.includes("429"))) {
      throw new Error("Rate limit exceeded. Please wait a minute and try again. (Free tier limit reached)");
    }

    throw new Error("Image generation failed. Please try again.");
  }
}

// ============================================================================
// VISION / IMAGE ANALYSIS
// ============================================================================

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeImage(
  imageBase64: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<VisionAnalysisResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  return {
    text: result.response.text(),
    model: DEFAULT_MODEL,
  };
}

/**
 * Analyze an image from URL using Gemini Vision
 */
export async function analyzeImageFromUrl(
  imageUrl: string,
  prompt: string
): Promise<VisionAnalysisResult> {
  // Fetch the image and convert to base64
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = response.headers.get("content-type") || "image/png";

  return analyzeImage(base64, prompt, mimeType);
}

/**
 * Compare two images and score their similarity
 */
export async function compareImages(
  targetBase64: string,
  generatedBase64: string,
  passingScore: number = 70
): Promise<ImageComparisonResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

  const systemPrompt = `You are an expert image comparison AI. You will compare two images and provide a detailed similarity analysis.
        
Respond ONLY with a valid JSON object in this exact format:
{
  "similarityScore": <number 0-100>,
  "reasoning": "<brief explanation of overall similarity>",
  "matchingElements": ["<element1>", "<element2>", ...],
  "missingElements": ["<element1>", "<element2>", ...]
}

Consider these aspects when scoring:
- Subject matter (what's in the image) - 40 points
- Composition and layout - 20 points  
- Style and mood - 20 points
- Colors and lighting - 10 points
- Small details - 10 points

Be fair but thorough. A score of 70+ means the generated image captures the essence of the target.`;

  const result = await model.generateContent([
    systemPrompt,
    "Compare these two images. The first is the TARGET image that needs to be recreated. The second is the GENERATED image from a user's prompt. How similar are they?",
    {
      inlineData: {
        mimeType: "image/png",
        data: targetBase64,
      },
    },
    {
      inlineData: {
        mimeType: "image/png",
        data: generatedBase64,
      },
    },
  ]);

  const content = result.response.text();

  try {
    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      similarityScore: parsed.similarityScore || 0,
      reasoning: parsed.reasoning || "Could not analyze images",
      matchingElements: parsed.matchingElements || [],
      missingElements: parsed.missingElements || [],
      isPass: (parsed.similarityScore || 0) >= passingScore,
    };
  } catch {
    return {
      similarityScore: 0,
      reasoning: "Error parsing comparison result",
      matchingElements: [],
      missingElements: [],
      isPass: false,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ai = {
  // Text generation
  generateText,
  generateWithGemini,

  // Image generation
  generateImage,

  // Vision / Image analysis
  analyzeImage,
  analyzeImageFromUrl,
  compareImages,

  // Constants
  DEFAULT_MODEL,
};

export default ai;
