
import { GeneratedSimulation } from "../types";

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
- Use 'THREE.MeshStandardMaterial' or 'THREE.MeshPhysicalMaterial' for realistic lighting.
- Implement high-quality shadows (castShadow/receiveShadow).
- Use procedural textures (CanvasTexture) or reliable colors if external textures are risky.
- Ensure animations are smooth using requestAnimationFrame and delta time.

### STRICT OUTPUT FORMAT
You MUST return ONLY valid JSON.
The JSON structure must be:
{
  "title": "Simulation Title",
  "description": "Brief description",
  "instructions": "Touch/Click and drag to rotate. Pinch to zoom.",
  "code": "... full html code ...",
  "controls": [ ... ]
}

### VIRTUAL STUDIO ARCHITECTURE (MANDATORY HTML STRUCTURE)
The 'code' field MUST use the following Robust Skeleton.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { margin: 0; overflow: hidden; background-color: #ffffff; font-family: 'Segoe UI', sans-serif; }
        canvas { display: block; width: 100vw; height: 100vh; outline: none; touch-action: none; }
        #ui-layer { position: absolute; top: 0; left: 0; width: 100%; pointer-events: none; padding: 12px; box-sizing: border-box; z-index: 10; }
        #status-pill { 
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px);
            padding: 6px 12px; rounded-full; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;
            font-size: 12px; font-weight: 600; color: #475569;
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
        
        // [AI: DECLARE YOUR VARIABLES HERE USING 'let']

        try {
            // 1. SETUP
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xffffff);
            
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(10, 10, 10);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // Realistic Tone Mapping
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            document.body.appendChild(renderer.domElement);
            
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            
            // --- LIGHTING (STUDIO SETUP) ---
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
            dirLight.position.set(10, 20, 10);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.bias = -0.0001;
            scene.add(dirLight);

            // --- INFINITE FLOOR ---
            const grid = new THREE.GridHelper(200, 100, 0x94a3b8, 0xe2e8f0);
            grid.position.y = -0.01;
            scene.add(grid);
            
            const planeGeometry = new THREE.PlaneGeometry(200, 200);
            const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.1 });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            scene.add(plane);

            // --- USER CONTENT START ---
            
            // [AI: GENERATE YOUR 3D MESHES HERE]
            // IMPORTANT:
            // 1. Use 'let' for all variables.
            // 2. Use 'THREE.MeshStandardMaterial' for realism.
            
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
// API SERVICE (FALLBACK LOGIC)
// ------------------------------------------------------------------

async function callOpenRouter(model: string, prompt: string): Promise<GeneratedSimulation> {
    console.log(`[OpenRouter] Calling Model: ${model}`);
    
    const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: THREE_D_SYSTEM_INSTRUCTION },
            { role: "user", content: `Generate a High-Fidelity 3D simulation for: "${prompt}". Use realistic materials, shadows, and smooth animation. Return strict JSON.` }
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

export const generateWithOpenRouter = async (prompt: string): Promise<GeneratedSimulation> => {
  // 1. Try Claude 3.5 Haiku (Fastest)
  try {
    console.log("Attempting Primary Model: Claude 3.5 Haiku");
    return await callOpenRouter("anthropic/claude-3.5-haiku", prompt);
  } catch (error) {
    console.warn("Haiku failed, falling back to Sonnet...", error);
    
    // 2. Fallback to Claude 3.5 Sonnet (Best Quality)
    try {
        console.log("Attempting Fallback Model: Claude 3.5 Sonnet");
        return await callOpenRouter("anthropic/claude-3.5-sonnet", prompt);
    } catch (finalError) {
        console.error("All models failed:", finalError);
        throw new Error("Failed to generate 3D simulation. Please try again.");
    }
  }
};
