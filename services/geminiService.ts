
import { GoogleGenAI } from "@google/genai";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// Paste your Google Gemini API Key between the quotes below.
// You can get one at: https://aistudio.google.com/app/apikey
const MANUALLY_ENTERED_KEY = ""; 

const getApiKey = () => {
  // 1. Check manual entry first (User Preference)
  if (MANUALLY_ENTERED_KEY) return MANUALLY_ENTERED_KEY;

  // 2. Check Vercel/Netlify/Node environment variables
  // @ts-ignore
  if (typeof process !== "undefined" && process.env && process.env.API_KEY) {
    // @ts-ignore
    return process.env.API_KEY;
  }
  
  // 3. Check Vite/Modern Bundler variables
  // @ts-ignore
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }

  return "";
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

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
   - The user will NOT click inside the canvas to change parameters (like gravity).
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
       // Update your simulation variables based on id
       if (simulationParams.hasOwnProperty(id)) {
          simulationParams[id] = value;
          // Trigger updates or resets if necessary
          if (id === 'reset') {
             resetSimulation(); 
          }
       }
     });
     \`\`\`

3. **Physics & Accuracy**:
   - Use real physics formulas (Verlet integration, Euler, or RK4).
   - Ensure specific experiments (e.g., "Double Pendulum", "Projectile Motion") use correct mathematical models.
   - Smooth animations using requestAnimationFrame.

4. **Output Format**:
   - You MUST return a single, valid JSON object.
   - DO NOT wrap the JSON in markdown code blocks (like \`\`\`json). Just return the raw JSON string.
   - Structure:
     {
       "title": "String",
       "description": "String",
       "instructions": "String (Brief usage guide)",
       "code": "String (The FULL HTML5 source code)",
       "controls": [
         { 
           "id": "String", 
           "type": "slider" | "button" | "toggle", 
           "label": "String", 
           "min": Number, 
           "max": Number, 
           "defaultValue": Number, 
           "step": Number 
         }
       ]
     }

### EXAMPLE CONTROL JSON
[
  { "id": "gravity", "type": "slider", "label": "Gravity (m/s²)", "min": 0, "max": 20, "defaultValue": 9.8, "step": 0.1 },
  { "id": "speed", "type": "slider", "label": "Time Scale", "min": 0, "max": 5, "defaultValue": 1, "step": 0.1 },
  { "id": "reset", "type": "button", "label": "Reset System" }
]
`;

export const generateSimulationCode = async (prompt: string): Promise<any> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set API_KEY in your environment variables or services/geminiService.ts");
  }

  try {
    console.log(`Generating simulation for: ${prompt}`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `Create a simulation for: "${prompt}". Ensure it is physically accurate, visually stunning, and uses the message listener protocol for controls.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Clean up potential markdown if the model ignores the instruction (safety net)
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON:", jsonString.substring(0, 100) + "...");
        throw new Error("Received malformed data from AI. Please try again.");
    }
    
    // Basic validation
    if (!data.code || !data.controls) {
        throw new Error("Incomplete simulation data generated.");
    }

    return data;

  } catch (error) {
    console.error("Error generating simulation:", error);
    throw new Error("Failed to generate simulation. The server might be busy or the request timed out. Please check your API Key.");
  }
};
