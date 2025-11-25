import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import Bytez from "bytez.js";
import { GeneratedSimulation } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// Fallback key provided by user for immediate stability on Vercel
const GOOGLE_API_KEY = process.env.API_KEY || "AIzaSyA3Soixg6FGUNl_ES7nnCMH6rbGIRtvmhk";
const BYTEZ_API_KEY = "e6b8a35abc212f3d60a7672c8d8e2e9f";

// ------------------------------------------------------------------
// SYSTEM INSTRUCTION
// ------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `
You are LetEX, a world-class Simulation Architect. You build physically accurate, aesthetically minimal, web-based simulations.

### GOAL
Generate a self-contained HTML5 Canvas simulation AND a definition of external controls (sliders, buttons) that manipulate it.

### CRITICAL REQUIREMENTS
1. **Visual Style**: 
   - MINIMALIST & CLEAN. 
   - Background: White (#ffffff) or very light grey (#f8fafc).
   - Objects: High contrast, flat design or subtle gradients. Blue/Cyan theme preferred.
   - NO text overlays inside the canvas unless they are labels attached to objects. Use the external UI for data.
   - **Responsive**: The canvas should resize to fit the window or container.

2. **Interactivity Protocol (External Controls)**:
   - The user will NOT click inside the canvas to change parameters.
   - The user will use EXTERNAL sliders/buttons provided in the 'controls' JSON field.
   - **YOUR HTML CODE MUST LISTEN FOR MESSAGES**:
     Include this exact logic in your <script>:
     \`\`\`javascript
     // Initialize default parameters
     let simulationParams = {
       // ... match the IDs in your controls list
     };

     window.addEventListener('message', (event) => {
       const { id, value } = event.data;
       if (simulationParams.hasOwnProperty(id)) {
          simulationParams[id] = value;
          if (id === 'reset') { /* reset logic */ }
       }
     });
     \`\`\`

3. **Output Format**:
   - You MUST return a single, valid JSON object.
   - DO NOT wrap the JSON in markdown code blocks. Just return the raw JSON string.
   - Structure:
     {
       "title": "String",
       "description": "String",
       "instructions": "String",
       "code": "String (The FULL HTML5 source code)",
       "controls": [ { "id": "String", "type": "slider" | "button" | "toggle", "label": "String", "min": Number, "max": Number, "defaultValue": Number, "step": Number } ]
     }
`;

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------

/**
 * Robustly parses JSON from AI response, handling markdown blocks 
 * and conversational text wrapper.
 */
const cleanAndParseJSON = (text: string): GeneratedSimulation => {
  let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

  // Advanced Extraction: Find the outer brackets
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }
  
  let data;
  try {
      data = JSON.parse(jsonString);
  } catch (e) {
      console.error("Failed to parse JSON:", jsonString.substring(0, 100) + "...");
      throw new Error("Received malformed data from AI.");
  }
  
  if (!data.code || !data.controls) {
      throw new Error("Incomplete simulation data generated.");
  }

  return data as GeneratedSimulation;
};

// ------------------------------------------------------------------
// PRIMARY ENGINE: GOOGLE SDK
// ------------------------------------------------------------------
const generateWithGoogle = async (prompt: string): Promise<GeneratedSimulation> => {
  console.log(`[Primary] Generating via Google GenAI (Gemini 2.5 Flash)...`);
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a simulation for: "${prompt}". Return ONLY valid JSON. No conversational text.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response output from Google AI.");

  return cleanAndParseJSON(text);
};

// ------------------------------------------------------------------
// FALLBACK ENGINE: BYTEZ SDK
// ------------------------------------------------------------------
const generateWithBytez = async (prompt: string): Promise<GeneratedSimulation> => {
  console.log(`[Fallback] Generating via Bytez SDK...`);
  
  let sdk;
  try {
    sdk = new Bytez(BYTEZ_API_KEY);
  } catch (e) {
    throw new Error("Bytez SDK failed to initialize.");
  }

  // We use a high-quality model on Bytez as fallback. 
  // 'google/gemini-2.5-flash' is often available, or we could use 'meta-llama/Meta-Llama-3-70B-Instruct'
  const model = sdk.model("google/gemini-2.5-flash");

  const messages = [
    { "role": "system", "content": SYSTEM_INSTRUCTION },
    { "role": "user", "content": `Create a simulation for: "${prompt}". Return ONLY valid JSON.` }
  ];

  const { error, output } = await model.run(messages);

  if (error) {
    throw new Error("Bytez API Error: " + JSON.stringify(error));
  }
  
  if (!output) {
    throw new Error("No output from Bytez.");
  }

  // Handle Bytez output format (can be object or string)
  let rawText = '';
  if (typeof output === 'object' && output !== null && 'content' in output) {
    rawText = (output as any).content;
  } else if (typeof output === 'string') {
    rawText = output;
  } else {
    rawText = JSON.stringify(output);
  }

  return cleanAndParseJSON(rawText);
};

// ------------------------------------------------------------------
// MAIN EXPORT
// ------------------------------------------------------------------
export const generateSimulationCode = async (prompt: string): Promise<GeneratedSimulation> => {
  try {
    // 1. Try Primary (Google)
    return await generateWithGoogle(prompt);
  } catch (googleError) {
    console.warn("Primary AI Engine failed. Switching to Fallback...", googleError);
    
    try {
      // 2. Try Fallback (Bytez)
      return await generateWithBytez(prompt);
    } catch (bytezError) {
      console.error("Fallback AI Engine failed.", bytezError);
      throw new Error(
        "Simulation generation failed on both primary and fallback engines. Please try again later."
      );
    }
  }
};