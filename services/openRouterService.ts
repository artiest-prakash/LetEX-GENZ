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

### 2. MATERIALS & LIGHTING (NO BLACK MODELS)
- **ALWAYS** set a base \`color\` (e.g., 0xffffff) for materials, even if using a texture map.
- **NEVER** leave a material black unless requested.
- Use \`MeshStandardMaterial\` for best lighting reaction.

### 3. TEXTURE LIBRARY (MAPPING)
- **Sun**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lava/lavatile.jpg
- **Earth**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg
- **Moon**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg
- **Mars**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_1k.jpg
- **Wood**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg
- **Metal**: https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg (Use grey color + high metalness)

**CRITICAL MAPPING RULES:**
1. If the object is the **SUN**, use the Sun texture.
2. If the object is **EARTH**, use the Earth texture.

### 4. MANDATORY OUTPUT FORMAT (SPLIT-BLOCK)
Output TWO parts separated by "|||SPLIT|||".

**PART 1: METADATA (JSON)**
{
  "title": "Title",
  "description": "Short description",
  "instructions": "Controls info",
  "controls": [ ... ]
}

|||SPLIT|||

**PART 2: CODE (HTML)**
<!DOCTYPE html>
<html>
... full code ...
</html>

---
### 5. HTML SKELETON (Use this for Part 2)
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
            scene.fog = new THREE.Fog(0xf8fafc, 20, 100); // Slight fog for depth
            
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(5, 5, 10);
            
            // OPTIMIZED RENDERER
            renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio < 2, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(renderer.domElement);
            
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.maxPolarAngle = Math.PI / 2 - 0.05;

            // 2. LIGHTING (Enhanced for Visibility)
            const ambient = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(ambient);

            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); // Sky/Ground
            hemiLight.position.set(0, 20, 0);
            scene.add(hemiLight);
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
            dirLight.position.set(10, 20, 10);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 1024; // Optimized shadow map
            dirLight.shadow.mapSize.height = 1024;
            scene.add(dirLight);
            
            // Camera Light (Fill light that follows user)
            const camLight = new THREE.PointLight(0xffffff, 0.5);
            camera.add(camLight);
            scene.add(camera);

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

            // 4. POST PROCESSING (Optimized Bloom)
            const renderScene = new RenderPass(scene, camera);
            // Half-resolution bloom for mobile performance
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth/2, window.innerHeight/2), 1.5, 0.4, 0.85);
            bloomPass.threshold = 0.85;
            bloomPass.strength = 0.3;
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
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const metadata = JSON.parse(jsonStr);

    // Part 2: HTML Code
    let codeStr = parts[1].trim();
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
    switch(modelId) {
        case 'grok-2': return 'x-ai/grok-2-1212';
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
export const generateWithOpenRouter = async (prompt: string, modelId: AIModelId = 'grok-2'): Promise<GeneratedSimulation> => {
  const modelString = getModelString(modelId);
  console.log(`[OpenRouter] Generating with ${modelString} (ID: ${modelId})...`);
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "X-Title": "LetEX Virtual Lab"
  };

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
    if (modelId !== 'gemini-flash') {
        console.warn("Attempting fallback to Gemini 2.0 Flash...");
        return generateWithOpenRouter(prompt, 'gemini-flash');
    }
    throw new Error("Simulation generation failed. Please check your connection or try a simpler prompt.");
  }
};