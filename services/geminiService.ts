
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { GeneratedSimulation, ChatMessage } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// Robust API Key retrieval that works in both Node.js and Browser environments
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return "AIzaSyA3Soixg6FGUNl_ES7nnCMH6rbGIRtvmhk";
};

const GOOGLE_API_KEY = getApiKey();

// ------------------------------------------------------------------
// SCHEMA DEFINITIONS
// ------------------------------------------------------------------
const SIMULATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title of the simulation" },
    description: { type: Type.STRING, description: "Short description of what the simulation demonstrates" },
    instructions: { type: Type.STRING, description: "User instructions for interaction" },
    code: { type: Type.STRING, description: "The complete HTML5/JS source code" },
    controls: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['slider', 'button', 'toggle'] },
          label: { type: Type.STRING },
          defaultValue: { type: Type.NUMBER, description: "Default numeric value (0 or 1 for toggle)" },
          min: { type: Type.NUMBER },
          max: { type: Type.NUMBER },
          step: { type: Type.NUMBER },
        },
        required: ["id", "type", "label", "defaultValue"]
      }
    }
  },
  required: ["title", "description", "code", "controls"]
};

// ------------------------------------------------------------------
// SYSTEM INSTRUCTIONS
// ------------------------------------------------------------------
const SIMULATION_SYSTEM_INSTRUCTION = `
You are LetEX, a world-class Simulation Architect. You build physically accurate, aesthetically minimal, web-based simulations.

### GOAL
Generate a self-contained HTML5 Canvas simulation and external controls.

### REQUIREMENTS
1. **Visual Style**: Minimalist, high contrast, clean. Background: #f8fafc.
2. **Interactivity**:
   - Use the provided controls array to define external UI.
   - In your HTML/JS, listen for 'message' events to update parameters.
   - Do NOT put UI overlays inside the canvas.
3. **Code Structure**:
   - Must be a valid HTML file with <canvas> and <script>.
   - Must handle window resize.
   - Must implement an animation loop.
   - **CRITICAL**: NEVER declare 'const' without initialization (e.g. 'const x;' is invalid). Use 'let'.
`;

const REFINE_SYSTEM_INSTRUCTION = `
You are a Senior Code Refactorer.
Update the existing HTML/JS simulation code based on the User Request.
Return the FULL updated code and controls list in valid JSON format matching the schema.

### CRITICAL RULES
1. Do not introduce syntax errors.
2. NEVER declare 'const' without initialization (e.g. 'const x;' is invalid). Use 'let' instead.
3. Preserve the existing import maps and visual style.
`;

const CHAT_SYSTEM_INSTRUCTION = `
You are LetEX AI, a friendly Virtual Lab Assistant. 
Explain physics and science concepts with emojis and blue bold text (**Concept**).
Keep responses concise.
`;

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------

const cleanAndParseJSON = (text: string): GeneratedSimulation => {
  let jsonString = text;
  
  // Cleanup markdown wrappers if present
  if (jsonString.includes('```json')) {
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
  } else if (jsonString.includes('```')) {
      jsonString = jsonString.replace(/```/g, '').trim();
  }

  // Heuristic to find JSON object if there's surrounding text
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }
  
  let data;
  try {
      data = JSON.parse(jsonString);
  } catch (e) {
      console.error("Failed to parse JSON. Raw text:", jsonString.substring(0, 200) + "...");
      throw new Error("Received malformed data from AI. Please try again.");
  }
  
  if (!data.code || !data.controls) {
      // Fallback: If title exists but code missing, throw specific error
      throw new Error("Incomplete simulation data generated.");
  }

  return data as GeneratedSimulation;
};

// ------------------------------------------------------------------
// SIMULATION ENGINE
// ------------------------------------------------------------------
export const generateWithGoogle = async (prompt: string, is3D: boolean = false): Promise<GeneratedSimulation> => {
  console.log(`[Primary] Generating via Google GenAI... 3D: ${is3D}`);
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  const config: any = {
      systemInstruction: SIMULATION_SYSTEM_INSTRUCTION,
      maxOutputTokens: 8192, // Set to 8192 (Flash safe limit) to prevent cut-off
      responseMimeType: "application/json",
      responseSchema: SIMULATION_SCHEMA
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a ${is3D ? '3D Three.js' : '2D Canvas'} simulation for: "${prompt}".`,
    config: config
  });

  const text = response.text;
  if (!text) throw new Error("No response output from Google AI.");

  return cleanAndParseJSON(text);
};

export const refineSimulationCode = async (currentSimulation: GeneratedSimulation, userPrompt: string): Promise<GeneratedSimulation> => {
  console.log(`[Refine] Refining simulation...`);
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

  const context = `
    CURRENT CODE:
    ${currentSimulation.code}

    CURRENT CONTROLS:
    ${JSON.stringify(currentSimulation.controls)}

    USER REQUEST:
    ${userPrompt}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: context,
    config: {
      systemInstruction: REFINE_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: SIMULATION_SCHEMA,
      maxOutputTokens: 8192
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI Refiner.");

  return cleanAndParseJSON(text);
};

// ------------------------------------------------------------------
// CHAT ENGINE
// ------------------------------------------------------------------
export const generateChatResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  console.log(`[Chat] Generating response for: ${newMessage}`);
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  const context = history.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n');
  const fullPrompt = `${context}\nUser: ${newMessage}\nAI:`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: fullPrompt,
    config: {
      systemInstruction: CHAT_SYSTEM_INSTRUCTION,
    }
  });

  return response.text || "I'm having trouble connecting to my neural network right now. 🔌 Please try again! 🤖";
};

// ------------------------------------------------------------------
// MAIN EXPORT
// ------------------------------------------------------------------
export const generateSimulationCode = async (prompt: string, is3D: boolean = false): Promise<GeneratedSimulation> => {
  try {
    return await generateWithGoogle(prompt, is3D);
  } catch (googleError) {
    console.error("Google AI Error:", googleError);
    throw googleError;
  }
};
