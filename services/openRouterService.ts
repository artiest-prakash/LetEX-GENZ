
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
You are LetEX 3D, an expert WebGL and Three.js developer.
Your task is to generate a JSON object containing a complete, self-contained HTML file for a 3D simulation.

### GOAL: CREATE A VISUAL MASTERPIECE
You are building a "Virtual Laboratory". It must look premium, scientific, and realistic.
1. **VISUALS**: 
   - **Background**: Use a clean, lab-white/slate environment (#f1f5f9).
   - **Materials**: ALWAYS use \`MeshStandardMaterial\` or \`MeshPhysicalMaterial\`.
   - **Textures**: You MUST use textures for planets, ground, and materials. Do not use plain colors for complex objects.
   - **Glow**: The environment has \`UnrealBloomPass\` enabled. Use \`emissive\` colors (e.g., 0x00ff00) with high intensity to make lasers/energy glow.
   
2. **COMPLEX OBJECTS (CRITICAL)**:
   - If asked for a **Planet** (Earth, Mars), you **MUST** use the textures provided in the \`TEXTURE_LIBRARY\` below.
   - If asked for a **Complex Organism** (Human, Dog, Robot), do **NOT** try to load an external .obj/.glb file (it will fail). 
   - **INSTEAD**, use **Geometric Composition**: Build the object using \`THREE.Group\`, \`CylinderGeometry\` (limbs), \`BoxGeometry\` (torso), and \`SphereGeometry\` (joints).
   - Example: A "Robot" is a Group containing cubes and cylinders.

### TEXTURE LIBRARY (USE THESE URLS)
- **Earth**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg
- **Earth Normal**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg
- **Moon**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg
- **Mars**: https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg
- **Sun**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/snowflake2.png (Use for glow)
- **Water**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg
- **Concrete**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg
- **Grid**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/uv_grid_opengl.jpg

### STRICT OUTPUT FORMAT
You MUST return ONLY valid JSON.
{
  "title": "Simulation Title",
  "description": "Brief description",
  "instructions": "Touch/Click and drag to rotate. Pinch to zoom.",
  "code": "... full html code ...",
  "controls": [ 
      { "id": "speed", "type": "slider", "label": "Speed", "defaultValue": 1, "min": 0, "max": 5, "step": 0.1 },
      { "id": "glow", "type": "toggle", "label": "Toggle Bloom", "defaultValue": 1 }
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
        body { margin: 0; overflow: hidden; background-color: #f1f5f9; font-family: 'Segoe UI', sans-serif; }
        canvas { display: block; width: 100vw; height: 100vh; outline: none; touch-action: none; }
        #ui-layer { position: absolute; top: 0; left: 0; width: 100%; pointer-events: none; padding: 12px; box-sizing: border-box; z-index: 10; }
        #status-pill { 
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(8px);
            padding: 6px 12px; rounded-full; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;
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
            <span id="status-text">Synthesizing Lab...</span>
        </div>
    </div>

    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

        // GLOBAL VARIABLES
        let scene, camera, renderer, controls, composer;
        const clock = new THREE.Clock();
        
        // [AI: DECLARE YOUR GLOBAL VARIABLES HERE USING 'let']

        try {
            // 1. SETUP
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf1f5f9); // Lab White
            scene.fog = new THREE.Fog(0xf1f5f9, 20, 100); // Soft fade
            
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(5, 5, 8);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Realistic shadows
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
            document.body.appendChild(renderer.domElement);
            
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // --- POST PROCESSING (BLOOM) ---
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
            bloomPass.threshold = 0.9; // Only very bright things glow
            bloomPass.strength = 0.6;
            bloomPass.radius = 0.5;

            composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);
            
            // --- LIGHTING (STUDIO) ---
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
            dirLight.position.set(10, 20, 10);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            scene.add(dirLight);

            // --- INFINITE FLOOR (LAB STYLE) ---
            const grid = new THREE.GridHelper(200, 100, 0xcbd5e1, 0xe2e8f0);
            grid.position.y = 0.01;
            scene.add(grid);
            
            const planeGeo = new THREE.PlaneGeometry(200, 200);
            const planeMat = new THREE.MeshStandardMaterial({ 
                color: 0xf1f5f9, 
                roughness: 0.1, // Slightly reflective
                metalness: 0.1 
            });
            const plane = new THREE.Mesh(planeGeo, planeMat);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            scene.add(plane);

            // --- USER CONTENT START ---
            
            // [AI: GENERATE YOUR 3D MESHES HERE]
            // TIP 1: Use 'THREE.TextureLoader().load(URL)' for textures.
            // TIP 2: Use 'THREE.Group' to compose complex objects (Human, Car, Dog).
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
                composer.setSize(window.innerWidth, window.innerHeight);
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
                
                // [AI: ANIMATION LOGIC HERE]
                
                // Use composer for bloom
                composer.render();
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
        default: return 'anthropic/claude-3.5-haiku';
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
            { role: "user", content: `Generate a Masterpiece 3D simulation for: "${prompt}". Use textures and complex geometry. Return strict JSON.` }
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
  const modelString = getOpenRouterModelString(modelId);
  
  try {
    return await callOpenRouter(modelString, prompt);
  } catch (error) {
    console.warn(`${modelString} failed, attempting fallback to Haiku...`, error);
    try {
        return await callOpenRouter("anthropic/claude-3.5-haiku", prompt);
    } catch (finalError) {
        throw new Error("Failed to generate 3D simulation. Please try again.");
    }
  }
};
