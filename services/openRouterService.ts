
import { GeneratedSimulation, AIModelId } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const OPENROUTER_API_KEY = "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

// ------------------------------------------------------------------
// SYSTEM INSTRUCTIONS (3D SPECIFIC - MASTERPIECE MODE)
// ------------------------------------------------------------------
const THREE_D_SYSTEM_INSTRUCTION = `
You are LetEX 3D, a world-class WebGL Creative Developer.
Your goal is to generate a **Photorealistic, Interactive 3D Simulation**.

### 1. VISUAL AESTHETICS (LAB THEME)
- **Background**: Use a professional "Virtual Lab" white/slate background (#f8fafc).
- **Lighting**: Use a 3-point studio setup (Key, Fill, Rim lights) + Ambient Light.
- **Post-Processing**: ENABLE \`UnrealBloomPass\`. High intensity for energy/lasers, subtle for objects.
- **Materials**: Use \`MeshStandardMaterial\` or \`MeshPhysicalMaterial\` with roughness/metalness maps.

### 2. COMPLEX OBJECT STRATEGY (PHASE-WISE COMPOSITION)
The user may ask for "A dog", "A human", or "A car". **DO NOT** try to load .glb/.gltf files (they fail).
Instead, **BUILD THEM GEOMETRICALLY** using a Phase-Wise approach:

**Example: How to build a "Penguin"**
\`\`\`javascript
function createPenguin() {
    const penguinGroup = new THREE.Group();
    
    // 1. Body (Capsule/Cylinder)
    const bodyGeo = new THREE.CapsuleGeometry(1, 2, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    penguinGroup.add(body);

    // 2. Belly (White Sphere)
    const bellyGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.z = 0.5;
    belly.scale.set(1, 1.2, 0.5);
    penguinGroup.add(belly);

    // 3. Beak (Cone)
    const beakGeo = new THREE.ConeGeometry(0.2, 0.5, 32);
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 1.5, 0.8);
    beak.rotation.x = Math.PI / 2;
    penguinGroup.add(beak);

    return penguinGroup;
}
\`\`\`
*Apply this logic to ANY complex object requested.*

### 3. TEXTURE LIBRARY (RELIABLE ASSETS)
Use these EXACT URLs. Do not hallucinate others.
- **Earth**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg
- **Moon**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg
- **Mars**: https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg
- **Wood**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg
- **Rough Metal**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg
- **Water**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg
- **Brick**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_diffuse.jpg
- **Grass**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg

### 4. STRICT OUTPUT FORMAT
Return **ONLY** valid JSON. No markdown, no "Here is the code".
{
  "title": "Title",
  "description": "Description",
  "instructions": "Controls info",
  "code": "... full html ...",
  "controls": [ ... ]
}

### 5. MANDATORY HTML SKELETON
Use this HTML structure in the \`code\` field.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { margin: 0; overflow: hidden; background-color: #f8fafc; font-family: 'Segoe UI', sans-serif; }
        canvas { display: block; width: 100vw; height: 100vh; outline: none; touch-action: none; }
        #ui-layer { position: absolute; top: 0; left: 0; width: 100%; pointer-events: none; padding: 12px; z-index: 10; }
        #status-pill { 
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px);
            padding: 8px 16px; rounded-full; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
            font-size: 13px; font-weight: 600; color: #475569;
        }
        #status-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    </style>
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
            <span id="status-text">Initializing Lab Environment...</span>
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
        
        // [AI: DECLARE YOUR GLOBALS HERE WITH 'let']

        try {
            // 1. SETUP
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf8fafc); // Lab White
            
            // Fog for depth (subtle white)
            scene.fog = new THREE.Fog(0xf8fafc, 20, 100);
            
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(6, 6, 10);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            document.body.appendChild(renderer.domElement);
            
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI / 2 - 0.05; // Floor limit

            // --- POST PROCESSING ---
            const renderScene = new RenderPass(scene, camera);
            // Bloom: Resolution, Strength, Radius, Threshold
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
            bloomPass.threshold = 0.85; 
            bloomPass.strength = 0.4; // Subtle bloom
            bloomPass.radius = 0.2;

            composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);
            
            // --- LIGHTING ---
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambientLight);
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
            dirLight.position.set(15, 25, 15);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.bias = -0.0001;
            scene.add(dirLight);

            // --- INFINITE FLOOR ---
            // 1. Grid
            const grid = new THREE.GridHelper(200, 100, 0xcbd5e1, 0xe2e8f0);
            grid.position.y = 0.001;
            scene.add(grid);
            
            // 2. Shadow Catcher
            const planeGeo = new THREE.PlaneGeometry(200, 200);
            const planeMat = new THREE.ShadowMaterial({ opacity: 0.05, color: 0x000000 });
            const plane = new THREE.Mesh(planeGeo, planeMat);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            scene.add(plane);

            // --- USER CONTENT START ---
            
            // [AI: GENERATE CONTENT HERE. Use 'let' variables.]
            
            // --- USER CONTENT END ---

            setTimeout(() => {
                const pill = document.getElementById('status-pill');
                if(pill) pill.style.opacity = '0';
            }, 1500);

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
                
                composer.render();
            }
            animate();

        } catch (e) {
            console.error(e);
            document.getElementById('status-text').textContent = "Error: " + e.message;
            document.getElementById('status-dot').style.background = 'red';
        }
    </script>
</body>
</html>
`;

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------
const cleanAndParseJSON = (text: string): GeneratedSimulation => {
  let jsonString = text.trim();

  // If the model replies with "Here is the JSON: ```json ... ```", extract it.
  const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = jsonString.match(codeBlockRegex);
  
  if (match) {
    jsonString = match[1];
  } else {
    // Fallback: Try to find the outer braces
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const data = JSON.parse(jsonString);
    
    // Auto-fix "const" errors using Regex
    if (data.code && typeof data.code === 'string') {
        data.code = data.code
            .replace(/const\s+([a-zA-Z_$][\w$]*)\s*;/g, 'let $1;')
            .replace(/const\s+([a-zA-Z_$][\w$]*)\s*(\r\n|\n|\r)/g, 'let $1$2')
            .replace(/const\s+([a-zA-Z_$][\w$]*)\s*,/g, 'let $1,');
    }

    if (!data.code || !data.controls) {
        throw new Error("JSON missing 'code' or 'controls' fields.");
    }

    return data as GeneratedSimulation;
  } catch (e) {
    console.error("JSON Parse Error on text:", text);
    throw new Error("The AI generated invalid data. Please try again.");
  }
};

const getOpenRouterModelString = (modelId: AIModelId) => {
    switch(modelId) {
        case 'claude-sonnet': return 'anthropic/claude-3.5-sonnet';
        case 'gpt-4o': return 'openai/gpt-4o';
        case 'llama-3': return 'meta-llama/llama-3-70b-instruct';
        case 'gemini-flash': return 'google/gemini-flash-1.5';
        default: return 'anthropic/claude-3.5-haiku';
    }
};

// ------------------------------------------------------------------
// API SERVICE
// ------------------------------------------------------------------
async function callOpenRouter(modelString: string, prompt: string): Promise<GeneratedSimulation> {
    console.log(`[OpenRouter] Requesting ${modelString}...`);
    
    // Fallback headers if window is undefined (SSR)
    const origin = typeof window !== 'undefined' ? window.location.origin : "https://letex.vercel.app";

    const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": origin, // Required by OpenRouter
          "X-Title": "LetEX Virtual Lab"
        },
        body: JSON.stringify({
          model: modelString,
          messages: [
            { role: "system", content: THREE_D_SYSTEM_INSTRUCTION },
            { role: "user", content: `Generate a Masterpiece 3D simulation for: "${prompt}". Construct complex objects (like animals, vehicles) using geometric primitives grouped in THREE.Group. Return ONLY JSON.` }
          ],
          max_tokens: 8192, // CRITICAL: Ensures long code isn't cut off
          temperature: 0.6, // Balanced creativity
          top_p: 0.95
        })
    });
    
    if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter Error:", errText);
        throw new Error(`AI Provider Error (${response.status}): ${errText}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("Received empty response from AI.");
    
    return cleanAndParseJSON(content);
}

export const generateWithOpenRouter = async (prompt: string, modelId: AIModelId = 'claude-sonnet'): Promise<GeneratedSimulation> => {
  const modelString = getOpenRouterModelString(modelId);
  
  try {
    return await callOpenRouter(modelString, prompt);
  } catch (error) {
    console.warn(`Primary model ${modelString} failed. Retrying with Haiku...`, error);
    try {
        // Fallback to Haiku if Sonnet fails (cheaper, faster, often more reliable for simple JSON)
        return await callOpenRouter("anthropic/claude-3.5-haiku", prompt);
    } catch (finalError) {
        console.error("Fallback failed:", finalError);
        throw new Error("Simulation generation failed. Please check your connection or try a simpler prompt.");
    }
  }
};
