
import { GeneratedSimulation, AIModelId } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const OPENROUTER_API_KEY = "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

// ------------------------------------------------------------------
// SYSTEM INSTRUCTIONS (3D SPECIFIC - OPTIMIZED FOR CLAUDE)
// ------------------------------------------------------------------
const THREE_D_SYSTEM_INSTRUCTION = `
You are LetEX 3D, an expert WebGL and Three.js developer powered by Claude.
Your task is to generate a JSON object containing a complete, self-contained HTML file for a 3D simulation.

### GOAL
Create a **Photorealistic**, **High-Fidelity**, and **Interactive** 3D simulation.
1. **VISUALS**: 
   - NEVER use basic colors (e.g., Color(0xff0000)). 
   - ALWAYS use **MeshStandardMaterial** with \`roughness\`, \`metalness\`, and \`map\`.
   - Use the provided \`createProceduralTexture()\` helper function to generate realistic surfaces (rock, noise, grid) dynamically.
   - Use **PointLights** and **SpotLights** to create dramatic shadows.
2. **INTERACTIVITY**:
   - You MUST define at least 2-3 controls in the \`controls\` array (e.g., Speed, Radius, Gravity, Color).
   - The simulation MUST listen for these controls.

### STRICT OUTPUT FORMAT
You MUST return ONLY valid JSON.
{
  "title": "Simulation Title",
  "description": "Brief description",
  "instructions": "Touch/Click and drag to rotate. Pinch to zoom.",
  "code": "... full html code ...",
  "controls": [ 
      { "id": "speed", "type": "slider", "label": "Rotation Speed", "defaultValue": 1, "min": 0, "max": 5, "step": 0.1 },
      { "id": "scale", "type": "slider", "label": "Object Scale", "defaultValue": 1, "min": 0.1, "max": 3, "step": 0.1 }
  ]
}

### VIRTUAL STUDIO ARCHITECTURE (MANDATORY HTML STRUCTURE)
The 'code' field MUST use the following Robust Skeleton.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { margin: 0; overflow: hidden; background-color: #0f172a; font-family: 'Segoe UI', sans-serif; }
        canvas { display: block; width: 100vw; height: 100vh; outline: none; touch-action: none; }
        #ui-layer { position: absolute; top: 0; left: 0; width: 100%; pointer-events: none; padding: 12px; box-sizing: border-box; z-index: 10; }
        #status-pill { 
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
            padding: 6px 12px; rounded-full; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid #334155;
            font-size: 12px; font-weight: 600; color: #94a3b8;
            transition: opacity 0.5s;
        }
        #status-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    </style>
    <!-- STRICT IMPORT MAP -->
    <script type="importmap">
    {
        "imports": {
            "three": "https://esm.sh/three@0.160.0",
            "three/addons/": "https://esm.sh/three@0.160.0/examples/jsm/"
        }
    }
    </script>
</head>
<body>
    <div id="ui-layer">
        <div id="status-pill">
            <div id="status-dot"></div>
            <span id="status-text">Building Scene...</span>
        </div>
    </div>

    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        // GLOBAL VARIABLES
        let scene, camera, renderer, controls;
        const clock = new THREE.Clock();
        
        // [AI: DECLARE YOUR GLOBAL VARIABLES HERE USING 'let']

        // --- TEXTURE GENERATOR HELPER ---
        function createProceduralTexture(type = 'noise', color = '#ffffff') {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 512, 512);
            
            if (type === 'noise') {
                for (let i = 0; i < 50000; i++) {
                    ctx.fillStyle = \`rgba(255,255,255,\${Math.random() * 0.1})\`;
                    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
                }
            } else if (type === 'grid') {
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 512; i+=32) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
                }
            } else if (type === 'stripe') {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                for (let i = 0; i < 512; i+=64) ctx.fillRect(0, i, 512, 32);
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        try {
            // 1. SETUP
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0f172a); // Deep Space Blue
            scene.fog = new THREE.FogExp2(0x0f172a, 0.02);
            
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(8, 8, 8);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
            document.body.appendChild(renderer.domElement);
            
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            
            // --- LIGHTING (CINEMATIC) ---
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(ambientLight);
            
            const mainLight = new THREE.SpotLight(0xffffff, 20);
            mainLight.position.set(10, 20, 10);
            mainLight.angle = Math.PI / 4;
            mainLight.penumbra = 0.5;
            mainLight.castShadow = true;
            mainLight.shadow.mapSize.width = 2048;
            mainLight.shadow.mapSize.height = 2048;
            scene.add(mainLight);

            const rimLight = new THREE.PointLight(0x3b82f6, 5); // Blue Rim
            rimLight.position.set(-10, 5, -10);
            scene.add(rimLight);

            // --- INFINITE FLOOR ---
            const grid = new THREE.GridHelper(200, 100, 0x1e293b, 0x1e293b);
            scene.add(grid);
            
            const planeGeo = new THREE.PlaneGeometry(200, 200);
            const planeMat = new THREE.MeshStandardMaterial({ 
                color: 0x0f172a, 
                roughness: 0.8, 
                metalness: 0.2 
            });
            const plane = new THREE.Mesh(planeGeo, planeMat);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            scene.add(plane);

            // --- USER CONTENT START ---
            
            // [AI: GENERATE YOUR 3D MESHES HERE]
            // TIP 1: Use 'createProceduralTexture("noise", "#ff0000")' for materials.
            // TIP 2: Use 'THREE.MeshStandardMaterial' always.
            // TIP 3: Use 'let' variables.
            
            // --- USER CONTENT END ---

            setTimeout(() => {
                const pill = document.getElementById('status-pill');
                if(pill) pill.style.opacity = '0';
            }, 2000);

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            window.addEventListener('message', (event) => {
                if (!event.data) return;
                const { id, value } = event.data;
                // [AI: HANDLE CONTROL UPDATES HERE]
            });

            function animate() {
                requestAnimationFrame(animate);
                controls.update();
                const time = clock.getElapsedTime();
                const delta = clock.getDelta();
                
                // [AI: ANIMATION LOGIC HERE]
                
                renderer.render(scene, camera);
            }
            animate();

        } catch (e) {
            console.error(e);
        }
    </script>
</body>
</html>
`;

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------
const cleanAndParseJSON = (text: string): GeneratedSimulation => {
  let jsonString = text;
  if (jsonString.includes('```json')) {
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
  } else if (jsonString.includes('```')) {
    jsonString = jsonString.replace(/```/g, '');
  }

  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  try {
    const data = JSON.parse(jsonString);
    
    // Fix common syntax errors
    if (data.code && typeof data.code === 'string') {
        data.code = data.code.replace(/const\s+([a-zA-Z_$][\w$]*)\s*;/g, 'let $1;');
        data.code = data.code.replace(/const\s+([a-zA-Z_$][\w$]*)\s*,/g, 'let $1,');
    }

    if (!data.code || !data.controls) {
        throw new Error("Incomplete JSON");
    }

    return data as GeneratedSimulation;
  } catch (e) {
    console.error("JSON Parse Error:", text);
    throw new Error("Failed to parse simulation data.");
  }
};

// ------------------------------------------------------------------
// API SERVICE
// ------------------------------------------------------------------

const getOpenRouterModelString = (modelId: AIModelId) => {
    switch(modelId) {
        case 'claude-sonnet': return 'anthropic/claude-3.5-sonnet';
        case 'gpt-4o': return 'openai/gpt-4o';
        case 'llama-3': return 'meta-llama/llama-3-70b-instruct';
        case 'gemini-flash': return 'google/gemini-flash-1.5';
        default: return 'anthropic/claude-3.5-haiku'; // Default fallback
    }
};

async function callOpenRouter(modelString: string, prompt: string): Promise<GeneratedSimulation> {
    console.log(`[OpenRouter] Calling Model: ${modelString}`);
    
    const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://letex.vercel.app", 
          "X-Title": "LetEX Virtual Lab"
        },
        body: JSON.stringify({
          model: modelString,
          messages: [
            { role: "system", content: THREE_D_SYSTEM_INSTRUCTION },
            { role: "user", content: `Generate a High-Fidelity 3D simulation for: "${prompt}". Use createProceduralTexture() for materials. Include at least 2 controls. Return strict JSON.` }
          ],
          response_format: { type: "json_object" } 
        })
      });
    
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter API Error: ${err}`);
      }
    
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) throw new Error("No content from API");
      
      return cleanAndParseJSON(content);
}

export const generateWithOpenRouter = async (prompt: string, modelId: AIModelId = 'claude-sonnet'): Promise<GeneratedSimulation> => {
  // Use selected model, or fallback logic
  const modelString = getOpenRouterModelString(modelId);
  
  try {
    return await callOpenRouter(modelString, prompt);
  } catch (error) {
    console.warn(`${modelString} failed, attempting fallback to Haiku...`, error);
    // Hard fallback if primary fails
    try {
        return await callOpenRouter("anthropic/claude-3.5-haiku", prompt);
    } catch (finalError) {
        throw new Error("Failed to generate 3D simulation. Please try again.");
    }
  }
};
