
import { GoogleGenAI } from "@google/genai";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// Initialize the client strictly using process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FALLBACK DATA (Used if no API key is provided)
const DEMO_SIMULATION = {
  title: "Solar System Orbit (Demo Mode)",
  description: "A gravitational simulation of planets orbiting a star. This is running in Demo Mode because no API key was detected.",
  instructions: "Use the sliders to adjust the gravitational constant (G) and the simulation speed. Click 'Reset' to restore initial positions. This demonstrates the 16:9 layout and control system.",
  controls: [
    { "id": "g_force", "type": "slider", "label": "Gravity (G)", "min": 1, "max": 20, "defaultValue": 5, "step": 0.5 },
    { "id": "speed", "type": "slider", "label": "Sim Speed", "min": 0.1, "max": 3, "defaultValue": 1, "step": 0.1 },
    { "id": "trails", "type": "toggle", "label": "Show Trails", "defaultValue": true },
    { "id": "reset", "type": "button", "label": "Reset System" }
  ],
  code: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #0f172a; font-family: sans-serif; }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <canvas id="simCanvas"></canvas>
  <script>
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');
    
    let params = { g_force: 5, speed: 1, trails: true };
    
    // Message Listener for React Controls
    window.addEventListener('message', (e) => {
      const { id, value } = e.data;
      if (params.hasOwnProperty(id)) params[id] = value;
      if (id === 'reset') init();
    });

    let planets = [];
    
    function init() {
      planets = [
        { x: 0, y: 0, vx: 0, vy: 0, mass: 1000, color: '#fbbf24', fixed: true }, // Sun
        { x: 200, y: 0, vx: 0, vy: 2, mass: 20, color: '#3b82f6' }, // Earth
        { x: 350, y: 0, vx: 0, vy: 1.5, mass: 40, color: '#ef4444' }, // Mars
        { x: 120, y: 0, vx: 0, vy: 3.5, mass: 5, color: '#a8a29e' }  // Mercury
      ];
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    init();

    function update() {
      // Clear with trail effect
      ctx.fillStyle = params.trails ? 'rgba(15, 23, 42, 0.15)' : 'rgba(15, 23, 42, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Physics
      for (let i = 0; i < planets.length; i++) {
        let p1 = planets[i];
        if (p1.fixed) continue;

        for (let j = 0; j < planets.length; j++) {
          if (i === j) continue;
          let p2 = planets[j];
          
          let dx = p2.x - p1.x;
          let dy = p2.y - p1.y;
          let dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 5) dist = 5;

          let f = (params.g_force * p1.mass * p2.mass) / (dist * dist);
          let fx = f * (dx / dist);
          let fy = f * (dy / dist);

          p1.vx += (fx / p1.mass) * params.speed;
          p1.vy += (fy / p1.mass) * params.speed;
        }

        p1.x += p1.vx * params.speed;
        p1.y += p1.vy * params.speed;
      }

      // Draw
      for (let p of planets) {
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, Math.sqrt(p.mass), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      }
      
      requestAnimationFrame(update);
    }
    update();
  </script>
</body>
</html>
  `
};

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
  // Check for API key availability. If not present, fallback to demo mode.
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning DEMO simulation.");
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    return DEMO_SIMULATION;
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
    throw new Error("Failed to generate simulation. Please check your API Key.");
  }
};
