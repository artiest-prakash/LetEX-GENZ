
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import Bytez from "bytez.js";
import { GeneratedSimulation, ChatMessage } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// Fallback key provided by user for immediate stability on Vercel
const GOOGLE_API_KEY = process.env.API_KEY || "AIzaSyA3Soixg6FGUNl_ES7nnCMH6rbGIRtvmhk";
const BYTEZ_API_KEY = "e6b8a35abc212f3d60a7672c8d8e2e9f";

// ------------------------------------------------------------------
// SYSTEM INSTRUCTIONS
// ------------------------------------------------------------------
const SIMULATION_SYSTEM_INSTRUCTION = `
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

     let isPaused = false;

     window.addEventListener('message', (event) => {
       const { id, value } = event.data;
       
       if (id === 'set_paused') {
         isPaused = value;
         return;
       }

       if (simulationParams.hasOwnProperty(id)) {
          simulationParams[id] = value;
          if (id === 'reset') { /* reset logic */ }
       }
     });

     function animate() {
        if (!isPaused) {
           update(); // Update physics only if not paused
        }
        draw(); // Always draw
        requestAnimationFrame(animate);
     }
     requestAnimationFrame(animate);
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

const CHAT_SYSTEM_INSTRUCTION = `
You are LetEX AI, a friendly and highly intelligent Virtual Lab Assistant. 🧪✨
Your goal is to explain physics, science, and simulation concepts in a fun, engaging way.

### VISUAL & STYLE RULES:
1. **Friendly Persona**: Use emojis (🚀, ⚛️, 🔬, ✨) frequently to keep the tone light and futuristic.
2. **Blue Highlighting**: You MUST wrap key scientific terms, formulas, or important concepts in **double asterisks** (e.g., **Quantum Mechanics**). The UI will render these in a beautiful Blue color.
3. **Image Generation**: If the user asks for an image or if a visual would help explain a concept, generate a Markdown image using the Pollinations AI URL format: 
   \`![Alt Text](https://image.pollinations.ai/prompt/{descriptive_keywords})\`
   Replace {descriptive_keywords} with a clear English description of the image (e.g., 'solar_system_orbit_planets_realistic').
4. **Brevity**: Keep responses concise but informative. Avoid writing huge walls of text.

### EXAMPLE:
User: "Explain gravity."
AI: "Gravity is the **fundamental force** that attracts two bodies with mass! 🌍✨ It's what keeps us grounded on Earth and makes planets orbit the Sun. According to **General Relativity**, it's actually the curvature of **spacetime**! 🌌
![Gravity Spacetime](https://image.pollinations.ai/prompt/spacetime_curvature_gravity_physics_3d_render)"
`;

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------

const cleanAndParseJSON = (text: string): GeneratedSimulation => {
  let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

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
// SIMULATION ENGINE (Google Primary)
// ------------------------------------------------------------------
const generateWithGoogle = async (prompt: string): Promise<GeneratedSimulation> => {
  console.log(`[Primary] Generating via Google GenAI (Gemini 2.5 Flash)...`);
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a simulation for: "${prompt}". Return ONLY valid JSON. No conversational text.`,
    config: {
      systemInstruction: SIMULATION_SYSTEM_INSTRUCTION,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response output from Google AI.");

  return cleanAndParseJSON(text);
};

// ------------------------------------------------------------------
// CHAT ENGINE
// ------------------------------------------------------------------
export const generateChatResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  console.log(`[Chat] Generating response for: ${newMessage}`);
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  // Format history for context (simplified)
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
// FALLBACK ENGINE (Bytez)
// ------------------------------------------------------------------
const generateWithBytez = async (prompt: string): Promise<GeneratedSimulation> => {
  console.log(`[Fallback] Generating via Bytez SDK...`);
  
  let sdk;
  try {
    sdk = new Bytez(BYTEZ_API_KEY);
  } catch (e) {
    throw new Error("Bytez SDK failed to initialize.");
  }

  const model = sdk.model("google/gemini-2.5-flash");

  const messages = [
    { "role": "system", "content": SIMULATION_SYSTEM_INSTRUCTION },
    { "role": "user", "content": `Create a simulation for: "${prompt}". Return ONLY valid JSON.` }
  ];

  const { error, output } = await model.run(messages);

  if (error) {
    throw new Error("Bytez API Error: " + JSON.stringify(error));
  }
  
  if (!output) {
    throw new Error("No output from Bytez.");
  }

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
    return await generateWithGoogle(prompt);
  } catch (googleError) {
    console.warn("Primary AI Engine failed. Switching to Fallback...", googleError);
    try {
      return await generateWithBytez(prompt);
    } catch (bytezError) {
      console.error("Fallback AI Engine failed.", bytezError);
      throw new Error(
        "Simulation generation failed on both primary and fallback engines. Please try again later."
      );
    }
  }
};
