
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import Bytez from "bytez.js";
import { GeneratedSimulation, ChatMessage } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const GOOGLE_API_KEY = process.env.API_KEY || "AIzaSyA3Soixg6FGUNl_ES7nnCMH6rbGIRtvmhk";

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

const THREE_D_SYSTEM_INSTRUCTION = `
You are LetEX 3D, a master of WebGL and Three.js. You build stunning 3D simulations.

### GOAL
Generate a self-contained HTML file using Three.js (via CDN) to visualize the requested 3D simulation.

### REQUIREMENTS
1. **Libraries**: 
   - Use ES modules in a <script type="module"> block.
   - Import Three.js: import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
   - Import OrbitControls: import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

2. **Visuals & Interaction**:
   - Background: Dark (#0f172a or similar space/dark theme).
   - Use **OrbitControls** initialized on the camera and renderer.domElement. This allows the user to rotate and zoom with touch/mouse interaction.
   - Enable damping on controls (controls.enableDamping = true) and call controls.update() in the animation loop.
   - Use appropriate lighting (Ambient + Directional).

3. **Interactivity (Parameters)**:
   - MUST implement the same window.addEventListener('message') protocol as the 2D simulations for external parameter controls.
   - Support window resize event to update camera aspect and renderer size.

4. **Output**: Return strictly valid JSON with "code" (HTML) and "controls". Same JSON structure as standard simulations.
`;

const REFINE_SYSTEM_INSTRUCTION = `
You are a Senior Code Refactorer for Physics Simulations. 
Your task is to EDIT existing HTML/JS simulation code based on a User Request.

1. **Analyze**: Look at the provided "CURRENT CODE".
2. **Modify**: Apply the user's specific changes (e.g., "Add gravity", "Change color to red", "Make it faster").
3. **Preserve**: Keep the existing structure, especially the 'message' event listeners and the 'controls' logic. Do NOT break the existing external controls unless the user specifically asks to remove them.
4. **Update Controls**: If the user asks for a NEW parameter (e.g., "Add a slider for wind"), ADD it to the "controls" array and implement the logic in the code.
5. **Output**: Return the FULL updated JSON object with the new "code" and updated "controls".
6. **Format**: VALID JSON ONLY. No markdown.
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
const generateWithGoogle = async (prompt: string, is3D: boolean = false): Promise<GeneratedSimulation> => {
  console.log(`[Primary] Generating via Google GenAI (Gemini 2.5 Flash)... 3D: ${is3D}`);
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a ${is3D ? '3D Three.js' : '2D Canvas'} simulation for: "${prompt}". Return ONLY valid JSON.`,
    config: {
      systemInstruction: is3D ? THREE_D_SYSTEM_INSTRUCTION : SIMULATION_SYSTEM_INSTRUCTION,
    }
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
      systemInstruction: REFINE_SYSTEM_INSTRUCTION
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
// MAIN EXPORT
// ------------------------------------------------------------------
export const generateSimulationCode = async (prompt: string, is3D: boolean = false): Promise<GeneratedSimulation> => {
  try {
    return await generateWithGoogle(prompt, is3D);
  } catch (googleError) {
    console.error("Google AI Error:", googleError);
    // Fallback logic could go here if needed, but keeping it simple for now
    throw new Error("Simulation generation failed. Please try again.");
  }
};
