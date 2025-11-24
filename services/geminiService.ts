
import { GoogleGenAI } from "@google/genai";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// Initialize the client using process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const generateSimulationCode = async (prompt: string): Promise<any> => {
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
    
    // Clean up potential markdown if the model ignores the instruction
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON:", jsonString.substring(0, 100) + "...");
        throw new Error("Received malformed data from AI. Please try again.");
    }
    
    if (!data.code || !data.controls) {
        throw new Error("Incomplete simulation data generated.");
    }

    return data;

  } catch (error) {
    console.error("Error generating simulation:", error);
    throw new Error("Failed to generate simulation. Please check your API Key settings.");
  }
};
