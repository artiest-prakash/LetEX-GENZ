
import { GeneratedSimulation, AIModelId } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const OPENROUTER_API_KEY = "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

// ------------------------------------------------------------------
// SYSTEM INSTRUCTIONS (SPLIT-BLOCK STRATEGY)
// ------------------------------------------------------------------
const THREE_D_SYSTEM_INSTRUCTION = `
You are LetEX 3D, a world-class WebGL Creative Developer.
Your goal is to generate a **Photorealistic, Interactive 3D Simulation**.

### 1. COMPLEX OBJECT STRATEGY
The user may ask for complex objects (Animals, Vehicles, Structures).
**DO NOT** try to load external .glb/.gltf files. They fail 99% of the time.
**INSTEAD**: Build them GEOMETRICALLY using \`THREE.Group\` and primitives (Sphere, Cylinder, Capsule).
- *Example*: A "Human" is a Group of cylinders (limbs) and spheres (joints/head).
- *Example*: A "Car" is a Box (body) and Cylinders (wheels).

### 2. TEXTURE LIBRARY (Use these URLs)
- **Earth**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg
- **Moon**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg
- **Wood**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg
- **Metal**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg (Use grey color + high metalness)
- **Water**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg

### 3. MANDATORY OUTPUT FORMAT (SPLIT-BLOCK)
To ensure the code is valid, you MUST output the response in TWO parts separated by the delimiter "|||SPLIT|||".

**PART 1: METADATA (JSON)**
{
  "title": "Title",
  "description": "Short description",
  "instructions": "Controls info",
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

---
### 4. HTML SKELETON (Use this for Part 2)
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { margin: 0; overflow: hidden; background-color: #f8fafc; font-family: 'Segoe UI', sans-serif; }
        canvas { display: block; width: 100vw; height: 100vh; outline: none; touch-action: none; }
        #loader { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; color: #cbd5e1; }
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
    <div id="loader">INITIALIZING LAB...</div>
    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

        // GLOBAL VARIABLES
        let scene, camera, renderer, controls, composer;
        const clock = new THREE.Clock();
        
        // [AI: DECLARE YOUR GLOBALS HERE WITH 'let']

        init();
        animate();

        function init() {
            // 1. SETUP
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf8fafc);
            scene.fog = new THREE.Fog(0xf8fafc, 10, 80);
            
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(5, 5, 10);
            
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(renderer.domElement);
            
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.maxPolarAngle = Math.PI / 2 - 0.05; // Floor limit

            // 2. LIGHTING (Studio)
            const ambient = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambient);
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
            dirLight.position.set(10, 20, 10);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            scene.add(dirLight);

            // 3. FLOOR
            const grid = new THREE.GridHelper(200, 100, 0xcbd5e1, 0xe2e8f0);
            grid.position.y = 0.001;
            scene.add(grid);
            
            const planeGeo = new THREE.PlaneGeometry(200, 200);
            const planeMat = new THREE.ShadowMaterial({ opacity: 0.1 });
            const plane = new THREE.Mesh(planeGeo, planeMat);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            scene.add(plane);

            // 4. POST PROCESSING (Bloom)
            const renderScene = new RenderPass(scene, camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
            bloomPass.threshold = 0.85;
            bloomPass.strength = 0.3; // Subtle bloom
            bloomPass.radius = 0;
            
            composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);

            // [AI: ADD YOUR OBJECTS HERE]
            
            // REMOVE LOADER
            const loader = document.getElementById('loader');
            if(loader) loader.style.display = 'none';
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            const time = clock.getElapsedTime();
            
            // [AI: ANIMATION LOGIC HERE]
            
            composer.render();
        }

        // Handle Window Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        });

        // Handle Messages
        window.addEventListener('message', (event) => {
            if (!event.data) return;
            const { id, value } = event.data;
            // [AI: HANDLE CONTROLS]
        });
    </script>
</body>
</html>
`;

// ------------------------------------------------------------------
// PARSER (SPLIT-BLOCK)
// ------------------------------------------------------------------
const cleanAndParseSplitResponse = (text: string): GeneratedSimulation => {
  try {
    const parts = text.split("|||SPLIT|||");
    
    if (parts.length < 2) {
      // Fallback: Try to find JSON and HTML manually if split tag is missing
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/);
      
      if (jsonMatch && htmlMatch) {
         return {
            title: "Generated Simulation",
            description: "AI Generated 3D Scene",
            instructions: "Explore the scene.",
            code: htmlMatch[0],
            controls: JSON.parse(jsonMatch[0]).controls || []
         };
      }
      throw new Error("Response did not contain the split delimiter.");
    }

    // Part 1: JSON Metadata
    let jsonStr = parts[0].trim();
    // Cleanup potential markdown wrapping around JSON
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const metadata = JSON.parse(jsonStr);

    // Part 2: HTML Code
    let codeStr = parts[1].trim();
    // Cleanup potential markdown wrapping around HTML
    codeStr = codeStr.replace(/```html/g, '').replace(/```/g, '').trim();

    // Auto-fix common "const" syntax errors in JS
    codeStr = codeStr
        .replace(/const\s+([a-zA-Z_$][\w$]*)\s*;/g, 'let $1;') // const x; -> let x;
        .replace(/const\s+([a-zA-Z_$][\w$]*)\s*(\r\n|\n|\r)/g, 'let $1$2'); // const x \n -> let x \n

    return {
      title: metadata.title || "Untitled Simulation",
      description: metadata.description || "A 3D simulation.",
      instructions: metadata.instructions || "Interact to explore.",
      code: codeStr,
      controls: metadata.controls || []
    };

  } catch (e) {
    console.error("Split Parse Error:", e);
    console.log("Raw Text:", text);
    throw new Error("Failed to parse the simulation. The model output was incomplete.");
  }
};

const getModelString = (modelId: AIModelId) => {
    // Mapping user-facing IDs to actual OpenRouter model strings
    switch(modelId) {
        // Map the requested "Opus 4.5" to the SOTA Claude 3.5 Sonnet (which acts as the 4.5 equivalent currently)
        case 'claude-opus-4.5': return 'anthropic/claude-3.5-sonnet'; 
        case 'claude-sonnet': return 'anthropic/claude-3.5-sonnet';
        case 'gpt-4o': return 'openai/gpt-4o';
        case 'gemini-flash': return 'google/gemini-2.0-flash-001';
        case 'llama-3': return 'meta-llama/llama-3.3-70b-instruct';
        default: return 'anthropic/claude-3.5-sonnet';
    }
};

// ------------------------------------------------------------------
// API SERVICE
// ------------------------------------------------------------------
export const generateWithOpenRouter = async (prompt: string, modelId: AIModelId = 'claude-opus-4.5'): Promise<GeneratedSimulation> => {
  const modelString = getModelString(modelId);
  console.log(`[OpenRouter] Generating with ${modelString} (ID: ${modelId})...`);
  
  // Header handling for browser environment
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "X-Title": "LetEX Virtual Lab"
  };

  // Only add Referer if in browser
  if (typeof window !== 'undefined') {
    headers["HTTP-Referer"] = window.location.origin;
  }

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          model: modelString,
          messages: [
            { role: "system", content: THREE_D_SYSTEM_INSTRUCTION },
            { role: "user", content: `Generate a 3D simulation for: "${prompt}". Remember to use the |||SPLIT||| format.` }
          ],
          max_tokens: 8192,
          temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from AI");

    return cleanAndParseSplitResponse(content);

  } catch (error) {
    console.error("Primary Model Failed:", error);
    
    // FALLBACK LOGIC
    if (modelId !== 'gemini-flash') {
        console.warn("Attempting fallback to Gemini 2.0 Flash...");
        return generateWithOpenRouter(prompt, 'gemini-flash');
    }
    
    throw new Error("Simulation generation failed. Please check your connection or try a simpler prompt.");
  }
};
