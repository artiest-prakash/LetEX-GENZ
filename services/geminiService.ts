import { GoogleGenAI } from "@google/genai";
import { GeneratedSimulation, ChatMessage, AIModelId } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // Fallback placeholder - ideally this should come from env or user input if open source
  return "AIzaSyA3Soixg6FGUNl_ES7nnCMH6rbGIRtvmhk";
};

const GOOGLE_API_KEY = getApiKey();

// ------------------------------------------------------------------
// SYSTEM INSTRUCTIONS (2D SPLIT-BLOCK)
// ------------------------------------------------------------------
const SIMULATION_SYSTEM_INSTRUCTION = `
You are LetEX, an expert Physics Simulation Engine using HTML5 Canvas (2D Context).

### GOAL
Generate a self-contained HTML5 Canvas simulation.

### STRICT OUTPUT FORMAT (SPLIT-BLOCK)
To ensure the code is generated correctly, you MUST output the response in TWO parts separated by the delimiter "|||SPLIT|||".

**PART 1: METADATA (JSON)**
{
  "title": "Title",
  "description": "Description",
  "instructions": "Instructions",
  "controls": [ 
    {"id": "speed", "type": "slider", "label": "Speed", "defaultValue": 1, "min": 0, "max": 5, "step": 0.1} 
  ]
}

|||SPLIT|||

**PART 2: CODE (HTML)**
<!DOCTYPE html>
<html>
... full code ...
</html>

### CODING RULES (2D ONLY)
1. **2D ONLY**: Use 'canvas.getContext("2d")'. DO NOT use Three.js.
2. **Visual Style**: Minimalist, scientific. Background: #f8fafc (Slate 50). Objects: Blue/Cyan/Orange.
3. **Architecture**:
   - Must handle window resize.
   - Must implement an animation loop using requestAnimationFrame.
   - Listen for 'message' events to update parameters.
   - NEVER declare 'const' without initialization. Use 'let'.
`;

const CHAT_SYSTEM_INSTRUCTION = `
You are LetEX AI, a friendly Virtual Lab Assistant. 
Explain physics and science concepts with emojis and blue bold text (**Concept**).
Keep responses concise.
`;

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------

const cleanAndParseSplitResponse = (text: string): GeneratedSimulation => {
  try {
    const parts = text.split("|||SPLIT|||");
    
    if (parts.length < 2) {
      // Fallback: Try to find JSON and HTML manually
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/);
      
      if (jsonMatch && htmlMatch) {
         return {
            title: "Generated Simulation",
            description: "AI Generated Scene",
            instructions: "Interact with the simulation.",
            code: htmlMatch[0],
            controls: JSON.parse(jsonMatch[0]).controls || []
         };
      }
      throw new Error("Response did not contain the split delimiter.");
    }

    // Part 1: JSON Metadata
    let jsonStr = parts[0].trim();
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const metadata = JSON.parse(jsonStr);

    // Part 2: HTML Code
    let codeStr = parts[1].trim();
    codeStr = codeStr.replace(/```html/g, '').replace(/```/g, '').trim();

    return {
      title: metadata.title || "Untitled 2D Simulation",
      description: metadata.description || "A physics simulation.",
      instructions: metadata.instructions || "Use controls to interact.",
      code: codeStr,
      controls: metadata.controls || []
    };

  } catch (e) {
    console.error("Split Parse Error (2D):", e);
    throw new Error("Failed to parse the 2D simulation data.");
  }
};

// ------------------------------------------------------------------
// SIMULATION ENGINE
// ------------------------------------------------------------------
export const generateWithGoogle = async (prompt: string): Promise<GeneratedSimulation> => {
  console.log(`[Primary] Generating 2D Simulation via Google GenAI...`);
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', // Upgraded to 2.0 Flash for speed/quality
        contents: `Create a 2D Canvas physics simulation for: "${prompt}". Remember the |||SPLIT||| format.`,
        config: {
            systemInstruction: SIMULATION_SYSTEM_INSTRUCTION,
            maxOutputTokens: 8192,
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response output from Google AI.");

    return cleanAndParseSplitResponse(text);
  } catch (error: any) {
    console.error("Google AI Error:", error);
    
    if (error.message?.includes('SAFETY')) {
        throw new Error("The simulation request was flagged by safety filters.");
    }
    throw error;
  }
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
    model: 'gemini-2.0-flash',
    contents: context,
    config: {
      systemInstruction: SIMULATION_SYSTEM_INSTRUCTION, // Reuse split strategy
      maxOutputTokens: 8192
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI Refiner.");

  return cleanAndParseSplitResponse(text);
};

// ------------------------------------------------------------------
// CHAT ENGINE
// ------------------------------------------------------------------
export const generateChatResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  
  const context = history.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n');
  const fullPrompt = `${context}\nUser: ${newMessage}\nAI:`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: fullPrompt,
    config: {
      systemInstruction: CHAT_SYSTEM_INSTRUCTION,
    }
  });

  return response.text || "I'm having trouble connecting to my neural network right now.";
};

// ------------------------------------------------------------------
// MAIN EXPORT
// ------------------------------------------------------------------
export const generateSimulationCode = async (prompt: string, is3D: boolean = false, modelId?: AIModelId): Promise<GeneratedSimulation> => {
  if (is3D) {
      throw new Error("Use generateWithOpenRouter for 3D requests.");
  }
  
  try {
    return await generateWithGoogle(prompt);
  } catch (googleError) {
    console.error("Google AI Error:", googleError);
    throw googleError;
  }
};