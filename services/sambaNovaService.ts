
import { GeneratedSimulation } from "../types";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const SAMBANOVA_API_KEY = "2d74e5b9-98dc-4c8c-b115-37915e1b6aba";
const SAMBANOVA_BASE_URL = "https://api.sambanova.ai/v1/chat/completions";

// ------------------------------------------------------------------
// SYSTEM INSTRUCTIONS (3D SPECIFIC)
// ------------------------------------------------------------------
const THREE_D_SYSTEM_INSTRUCTION = `
You are LetEX 3D, an expert WebGL and Three.js developer.
Your task is to generate a JSON object containing a complete, self-contained HTML file for a 3D simulation.

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

### CRITICAL CODING RULES (TO PREVENT CRASHES)
1. **NO UNINITIALIZED CONSTANTS**: 
   - ❌ WRONG: \`const planet;\` (This causes SyntaxError)
   - ✅ CORRECT: \`let planet;\`
   - ✅ CORRECT: \`const planet = new THREE.Mesh(...);\`
   - **RULE**: If you are declaring a variable that you will assign later, YOU MUST USE \`let\`.

2. **GLOBALS**: Declare all global variables (scene, objects) using \`let\` at the top of your script section.

3. **CONCISE CODE**: 
   - Use **LOOPS** and **ARRAYS** for creating multiple similar objects (like planets or particles). 
   - Do NOT write repetitive code for every single object if they share logic. This is critical to ensure the JSON fits in the response limit.

### VIRTUAL STUDIO ARCHITECTURE (MANDATORY HTML STRUCTURE)
The 'code' field MUST use the following Robust Skeleton. You MUST fill in the <script type="module"> logic correctly.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { margin: 0; overflow: hidden; background-color: #ffffff; font-family: 'Segoe UI', sans-serif; }
        canvas { display: block; width: 100vw; height: 100vh; outline: none; touch-action: none; }
        
        /* VISUAL DEBUG CONSOLE */
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
        #log-container { 
            margin-top: 8px; 
            font-family: 'Consolas', monospace; font-size: 11px; color: #64748b; 
            max-width: 300px; display: flex; flex-direction: column; gap: 2px;
            background: rgba(255,255,255,0.8); padding: 8px; rounded: 8px; display: none; /* Hidden by default unless error */
        }
        .log-entry { opacity: 0; animation: fadeIn 0.3s forwards; }
        .log-error { color: #ef4444; font-weight: bold; border-left: 2px solid #ef4444; padding-left: 4px; }
        
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes fadeIn { to { opacity: 1; } }
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
    <!-- ERROR HANDLER (Runs before module to catch syntax errors) -->
    <script>
        window.onerror = function(msg, source, lineno, colno, error) {
            const statusText = document.getElementById('status-text');
            const statusDot = document.getElementById('status-dot');
            const logBox = document.getElementById('log-container');
            
            if(statusText) statusText.textContent = "System Error";
            if(statusDot) {
                statusDot.style.background = "#ef4444";
                statusDot.style.animation = "none";
            }
            if(logBox) {
                logBox.style.display = 'flex';
                const div = document.createElement('div');
                div.className = 'log-entry log-error';
                div.textContent = '> ' + msg + ' (Line ' + lineno + ')';
                logBox.appendChild(div);
            }
            console.error(msg, error);
            return false;
        };
    </script>
</head>
<body>
    <div id="ui-layer">
        <div id="status-pill">
            <div id="status-dot"></div>
            <span id="status-text">Initializing Environment...</span>
        </div>
        <div id="log-container"></div>
    </div>

    <script type="module">
        // --- LOGGER UTILS ---
        const logBox = document.getElementById('log-container');
        function log(msg) {
            console.log(msg);
        }

        // --- MAIN LOGIC ---
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        // GLOBAL VARIABLES (Use 'let' for reassignment)
        let scene, camera, renderer, controls;
        const clock = new THREE.Clock();
        
        // --- DYNAMIC VARIABLES ---
        // [AI: Declare global variables here using 'let'. NEVER use 'const' here.]
        // Example: let cube; let speed = 1.0;

        try {
            log("Engine: Three.js r160");
            
            // 1. SETUP
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xffffff); // WHITE BACKGROUND
            // NO FOG for clear visibility
            
            // Camera (Cinematic Angle)
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(10, 10, 10);
            camera.lookAt(0, 0, 0);
            
            // Renderer (High Quality)
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer, realistic shadows
            document.body.appendChild(renderer.domElement);
            
            // Controls (Google Earth Style)
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true; // SMOOTH STOP
            controls.dampingFactor = 0.05;
            controls.enablePan = true;
            controls.enableZoom = true;
            controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going below ground
            
            log("Controls: Touch & Damping Enabled");

            // --- LIGHTING (STUDIO SETUP) ---
            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7); // Sky/Ground ambiance
            hemiLight.position.set(0, 20, 0);
            scene.add(hemiLight);
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // Key Light
            dirLight.position.set(10, 20, 10);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048; // High res shadows
            dirLight.shadow.mapSize.height = 2048;
            dirLight.shadow.camera.near = 0.5;
            dirLight.shadow.camera.far = 100;
            scene.add(dirLight);
            
            // Rim Light for 3D Pop
            const rimLight = new THREE.PointLight(0xdbeafe, 0.5);
            rimLight.position.set(-10, 5, -10);
            scene.add(rimLight);

            // --- INFINITE FLOOR ---
            // 1. Grid Helper (Large)
            const grid = new THREE.GridHelper(200, 100, 0x94a3b8, 0xe2e8f0);
            grid.position.y = 0.01; // Avoid Z-fighting
            scene.add(grid);
            
            // 2. Shadow Receiver Plane (Invisible but catches shadows)
            const planeGeometry = new THREE.PlaneGeometry(200, 200);
            const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.15 });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            scene.add(plane);

            // --- USER CONTENT START ---
            
            // [AI: GENERATE YOUR 3D MESHES HERE]
            // IMPORTANT RULES:
            // 1. Use 'let' for variables you need to update in animate() (e.g., 'let planet;').
            // 2. NEVER use 'const' without an immediate value assignment. 
            //    - INCORRECT: const x;
            //    - CORRECT: let x;  OR  const x = 10;
            // 3. Set 'castShadow = true' and 'receiveShadow = true' on ALL meshes.
            // 4. Use Arrays/Loops for repetitive objects.
            
            // --- USER CONTENT END ---

            log("Scene Ready");
            setTimeout(() => {
                const pill = document.getElementById('status-pill');
                if(pill) pill.style.opacity = '0'; // Hide loading after success
            }, 2000);

            // 2. EVENTS
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

            // 3. ANIMATION LOOP
            function animate() {
                requestAnimationFrame(animate);
                controls.update(); // REQUIRED for damping
                const time = clock.getElapsedTime();
                
                // [AI: ANIMATION LOGIC HERE (Use 'time' variable for sin/cos waves)]
                
                renderer.render(scene, camera);
            }
            animate();

        } catch (e) {
            throw e; // Let window.onerror handle it
        }
    </script>
</body>
</html>

### CONTENT GENERATION RULES
1. **CRITICAL - NO SYNTAX ERRORS**: 
   - NEVER declare a 'const' without a value (e.g., 'const myVar;' is FATAL). 
   - ALWAYS use 'let' for variable declarations to prevent this error.
2. **High Fidelity**: Use \`THREE.SphereGeometry\`, \`THREE.BoxGeometry\`, etc., with high segment counts (e.g., 64 for spheres) for smoothness.
3. **Structure**: If building a solar system, use a central Group for the sun and separate Groups for planets to handle rotation easier.
4. **Colors**: Use specific hex colors (Blue: 0x3b82f6, Orange: 0xf97316, Green: 0x10b981, Purple: 0x8b5cf6).
`;

// ------------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------------
const cleanAndParseJSON = (text: string): GeneratedSimulation => {
  let jsonString = text;

  // Cleanup markdown wrappers
  if (jsonString.includes('```json')) {
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
  } else if (jsonString.includes('```')) {
    jsonString = jsonString.replace(/```/g, '');
  }

  // Find the first '{' and last '}' to extract the JSON object
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  try {
    const data = JSON.parse(jsonString);
    if (!data.code || !data.controls) {
      throw new Error("Missing required fields (code or controls) in generated JSON.");
    }

    // --- CRITICAL FIX: Sanitizer for "const x;" Error ---
    if (data.code && typeof data.code === 'string') {
        // Fix 1: "const variable;" -> "let variable;"
        data.code = data.code.replace(/const\s+([a-zA-Z_$][\w$]*)\s*;/g, 'let $1;');
        // Fix 2: "const variable," -> "let variable," (for lists like const a, b;)
        data.code = data.code.replace(/const\s+([a-zA-Z_$][\w$]*)\s*,/g, 'let $1,');
        // Fix 3: "const variable" followed by newline (often a hallucination)
        data.code = data.code.replace(/const\s+([a-zA-Z_$][\w$]*)\s*(\r\n|\n|\r)/g, 'let $1$2');
        // Fix 4: General fallback for uninitialized consts not followed by =
        // Only matches if NOT followed by optional whitespace then =
        data.code = data.code.replace(/const\s+([a-zA-Z_$][\w$]*)(?!\s*=)/g, 'let $1');
    }

    return data as GeneratedSimulation;
  } catch (e) {
    console.error("JSON Parse Error. Raw Text:", text);
    throw new Error("Failed to parse the simulation data. Please try again.");
  }
};

// ------------------------------------------------------------------
// API SERVICE
// ------------------------------------------------------------------
export const generateWithSambaNova = async (prompt: string): Promise<GeneratedSimulation> => {
  console.log(`[SambaNova] Generating 3D Simulation for: "${prompt}"`);

  const payload = {
    model: "Meta-Llama-3.3-70B-Instruct",
    messages: [
      { role: "system", content: THREE_D_SYSTEM_INSTRUCTION },
      { role: "user", content: `Create a high-quality 3D simulation for: ${prompt}. Ensure materials are shiny/realistic and shadows are enabled. Use loops for repetitive objects.` }
    ],
    temperature: 0.1, // Low temperature for consistent code generation
    max_tokens: 8192,  // Increased from 4096 to prevent truncation
    top_p: 0.1
  };

  try {
    const response = await fetch(SAMBANOVA_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SAMBANOVA_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from SambaNova API.");
    }

    return cleanAndParseJSON(content);

  } catch (error) {
    console.error("SambaNova Generation Error:", error);
    throw error;
  }
};
