
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
You are LetEX 3D, a master of WebGL, Three.js, and Scientific Visualization. 
You build stunning, scientifically accurate 3D simulations that feel like "Google Earth" for physics/chemistry/maths.

### GOAL
Generate a self-contained HTML file using Three.js (via CDN) to visualize the requested 3D simulation.

### CRITICAL VISUAL & INTERACTION STANDARDS
1. **Libraries & Setup**: 
   - Use ES modules in a <script type="module"> block.
   - Import Three.js: \`import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';\`
   - Import OrbitControls: \`import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';\`
   - **Renderer**: Use \`antialias: true\`, \`alpha: true\`. Enable shadows: \`renderer.shadowMap.enabled = true\`.
   - **Tone Mapping**: Use \`THREE.ACESFilmicToneMapping\`.

2. **Visual Style**:
   - **Background**: Default to a dark, deep space/slate color (#020617) UNLESS the user prompt specifically implies a light environment (like a lab room). 
   - **Materials**: Use \`THREE.MeshStandardMaterial\` or \`THREE.MeshPhysicalMaterial\` with high roughness for a premium look, or 'neon' emissive materials for sci-fi looks.
   - **Colors**: Use **Blue (#3b82f6)**, **Cyan (#06b6d4)**, and **Orange (#f97316)** as primary accent colors.
   - **Lighting**: MUST include:
     - \`AmbientLight\` (soft fill).
     - \`DirectionalLight\` (main sun-like light) with \`castShadow = true\`.

3. **Interaction (Full Touch Control)**:
   - **OrbitControls**: MANDATORY.
   - **Touch Action**: You MUST add this CSS to the <style> block:
     \`body { margin: 0; overflow: hidden; background-color: #020617; } canvas { display: block; width: 100vw; height: 100vh; touch-action: none; outline: none; }\`
     (The \`touch-action: none\` is CRITICAL).
   - Configure Controls: 
     \`controls.enableDamping = true;\`
     \`controls.dampingFactor = 0.05;\`
   - **Loop**: You MUST call \`controls.update()\` inside the \`animate()\` loop.
   - **Responsive**: Listen to \`resize\` event to update camera aspect and renderer size.

4. **External Parameter Control**:
   - Implement the \`window.addEventListener('message')\` protocol (same as 2D) to update simulation variables.

5. **Output**: Return strictly valid JSON with "code" (HTML) and "controls".
`;

const REFINE_SYSTEM_INSTRUCTION = `
You are a Senior Code Refactorer for Physics Simulations. 
Your task is to EDIT existing HTML/JS simulation code based on a User Request.

1. **Analyze**: Look at the provided "CURRENT CODE". Determine if it is 2D (Canvas) or 3D (Three.js).
2. **Modify**: Apply the user's specific changes (e.g., "Add gravity", "Change color to red", "Make it faster").
3. **Preserve**: Keep the existing structure, especially the 'message' event listeners and the 'controls' logic. 
   - If 3D, preserve the OrbitControls, Lighting, and CSS (\`touch-action: none\`).
   - If 2D, preserve the canvas resize logic.
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
  // Robust cleanup to handle markdown blocks
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
      console.error("Failed to parse JSON. Raw text:", jsonString.substring(0, 200) + "...");
      throw new Error("Received malformed data from AI. Please try again.");
  }
  
  if (!data.code || !data.controls) {
      throw new Error("Incomplete simulation data generated.");
  }

  return data as GeneratedSimulation;
};

// ------------------------------------------------------------------
// SIMULATION ENGINE
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
    // Rethrow to allow the UI to catch and display
    throw googleError;
  }
};
