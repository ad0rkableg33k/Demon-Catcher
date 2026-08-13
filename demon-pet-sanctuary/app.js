/**
 * DEMON PET SANCTUARY - CORE LOGIC
 * Manages 3D Rendering (Three.js), Tamagotchi Stats, and Quest Systems.
 */

// --- STATE MANAGEMENT ---
const state = {
    souls: 50,
    demon: {
        level: 1,
        exp: 0,
        expNeeded: 100,
        stage: 'Baby', // Baby, Teen, Adult
        stats: {
            hunger: 80, // 0-100
            mood: 80,   // 0-100
            energy: 100 // 0-100
        },
        isSleeping: false
    },
    quests: [],
    trackers: {
        timesFed: 0,
        timesPlayed: 0
    }
};

// --- DOM ELEMENTS ---
const els = {
    soulCount: document.getElementById('soul-count'),
    hungerBar: document.getElementById('stat-hunger'),
    moodBar: document.getElementById('stat-mood'),
    energyBar: document.getElementById('stat-energy'),
    btnFeed: document.getElementById('btn-feed'),
    btnPlay: document.getElementById('btn-play'),
    btnSleep: document.getElementById('btn-sleep'),
    questList: document.getElementById('quest-list'),
    demonLevel: document.getElementById('demon-level'),
    demonStage: document.getElementById('demon-stage'),
    expFill: document.getElementById('exp-fill'),
    canvasContainer: document.getElementById('pet-canvas')
};

// --- THREE.JS SETUP ---
let scene, camera, renderer, demonGroup, particles;

function init3D() {
    scene = new THREE.Scene();
    
    // Camera
    const aspect = els.canvasContainer.clientWidth / els.canvasContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 6;
    camera.position.y = 1;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(els.canvasContainer.clientWidth, els.canvasContainer.clientHeight);
    els.canvasContainer.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xff00ff, 1.2, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pinkLight = new THREE.PointLight(0xff007f, 1, 100);
    pinkLight.position.set(-5, 0, 5);
    scene.add(pinkLight);

    // Base Demon Mesh
    createDemonGeometry();

    // Background Particles (Ambiance)
    createParticles();

    // Interaction (Clicking the 3D pet)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    els.canvasContainer.addEventListener('click', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        // Raycast against all children of the demon group
        if (demonGroup) {
            const intersects = raycaster.intersectObjects(demonGroup.children, true);
            if (intersects.length > 0) {
                interactWithDemon();
            }
        }
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        if (!els.canvasContainer) return;
        camera.aspect = els.canvasContainer.clientWidth / els.canvasContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(els.canvasContainer.clientWidth, els.canvasContainer.clientHeight);
    });

    animate3D();
}

// Procedurally generated Kawaii Baby Demon
function createKawaiiDemon() {
    const group = new THREE.Group();

    // Main Body (Chubby Sphere)
    const bodyGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xff007f, shininess: 80 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Eyes (Big Anime Eyes)
    const eyeGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0b }); // Black base
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.5, 0.3, 1.35);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.5, 0.3, 1.35);

    // Eye Highlights (Kawaii Sparkles)
    const highlightGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const hlLeft = new THREE.Mesh(highlightGeo, highlightMat);
    hlLeft.position.set(-0.08, 0.1, 0.2);
    leftEye.add(hlLeft);
    
    const hlRight = new THREE.Mesh(highlightGeo, highlightMat);
    hlRight.position.set(-0.08, 0.1, 0.2);
    rightEye.add(hlRight);

    group.add(leftEye);
    group.add(rightEye);

    // Blush
    const blushGeo = new THREE.CircleGeometry(0.2, 16);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Magenta blush
    
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.8, -0.1, 1.25);
    leftBlush.rotation.y = -0.3;
    leftBlush.rotation.x = -0.1;
    group.add(leftBlush);
    
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.8, -0.1, 1.25);
    rightBlush.rotation.y = 0.3;
    rightBlush.rotation.x = -0.1;
    group.add(rightBlush);

    // Horns (Charcoal cones)
    const hornGeo = new THREE.ConeGeometry(0.25, 0.8, 16);
    const hornMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 100 });
    
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.6, 1.4, 0.5);
    leftHorn.rotation.z = 0.3;
    leftHorn.rotation.x = 0.2;
    group.add(leftHorn);
    
    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(0.6, 1.4, 0.5);
    rightHorn.rotation.z = -0.3;
    rightHorn.rotation.x = 0.2;
    group.add(rightHorn);

    // Little Bat Wings
    const wingGeo = new THREE.ConeGeometry(0.6, 1.5, 3);
    const wingMat = new THREE.MeshPhongMaterial({ color: 0xff00ff, flatShading: true }); // Magenta wings
    
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-1.6, 0.2, -0.2);
    leftWing.rotation.z = Math.PI / 2 + 0.3;
    leftWing.rotation.y = -0.2;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(1.6, 0.2, -0.2);
    rightWing.rotation.z = -Math.PI / 2 - 0.3;
    rightWing.rotation.y = 0.2;
    group.add(rightWing);

    return group;
}

function createDemonGeometry() {
    if (demonGroup) scene.remove(demonGroup);

    if (state.demon.stage === 'Baby') {
        demonGroup = createKawaiiDemon();
    } else {
        // Fallback for higher stages (Placeholder geometry for Teen/Adult)
        demonGroup = new THREE.Group();
        const geometry = new THREE.IcosahedronGeometry(2, state.demon.stage === 'Teen' ? 0 : 2); 
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff00ff, 
            shininess: 100,
            flatShading: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        demonGroup.add(mesh);
    }
    
    // Add floating animation pivot
    demonGroup.position.y = 0;
    scene.add(demonGroup);
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for ( let i = 0; i < 200; i ++ ) {
        vertices.push(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xff007f, size: 0.08 });
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function animate3D() {
    requestAnimationFrame(animate3D);
    
    const time = Date.now() * 0.001;

    if (demonGroup) {
        // Idle bobbing
        demonGroup.position.y = Math.sin(time * 2) * 0.2;
        
        // Gentle rotation
        demonGroup.rotation.y = Math.sin(time) * 0.3;
        
        // Sleep animation (slow breathing and lowered position)
        if (state.demon.isSleeping) {
            const breath = 1 + Math.sin(time * 3) * 0.03;
            demonGroup.scale.set(breath, breath * 0.9, breath);
            demonGroup.position.y -= 0.5; // Laying down
            demonGroup.rotation.z = Math.sin(time * 0.5) * 0.05;
        } else {
            // Wake normal scale
            demonGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            demonGroup.rotation.z = 0;
        }
    }

    if (particles) {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
    }

    renderer.render(scene, camera);
}

function interactWithDemon() {
    if (state.demon.isSleeping) return;
    
    // Spin animation on click interaction
    demonGroup.rotation.y += Math.PI;
    
    // Little jump
    demonGroup.position.y += 0.5;
    
    // Boost mood slightly for free petting
    state.demon.mood = Math.min(100, state.demon.mood + 2);
    updateUI();
}

// --- GAME LOGIC ---

function generateQuests() {
    state.quests = [
        { id: 1, text: "Feed the demon 3 times", target: 3, type: "feed", progress: 0, reward: 50, completed: false },
        { id: 2, text: "Play with the demon 2 times", target: 2, type: "play", progress: 0, reward: 30, completed: false }
    ];
    renderQuests();
}

function updateQuestProgress(type) {
    state.quests.forEach(q => {
        if (!q.completed && q.type === type) {
            q.progress++;
            if (q.progress >= q.target) {
                q.completed = true;
                state.souls += q.reward;
                alert(`Pact Fulfilled! Earned ${q.reward} Dark Souls.`);
            }
        }
    });
    renderQuests();
}

function addExp(amount) {
    state.demon.exp += amount;
    if (state.demon.exp >= state.demon.expNeeded) {
        levelUp();
    }
}

function levelUp() {
    state.demon.level++;
    state.demon.exp -= state.demon.expNeeded;
    state.demon.expNeeded = Math.floor(state.demon.expNeeded * 1.5);
    
    // Stage Evolution
    if (state.demon.level >= 8 && state.demon.stage !== 'Adult') {
        state.demon.stage = 'Adult';
        createDemonGeometry();
    } else if (state.demon.level >= 4 && state.demon.stage === 'Baby') {
        state.demon.stage = 'Teen';
        createDemonGeometry();
    }

    alert(`The demon has grown stronger! Reached Level ${state.demon.level}`);
}

function gameLoop() {
    // Stat decay every second
    if (!state.demon.isSleeping) {
        state.demon.hunger = Math.max(0, state.demon.hunger - 0.5);
        state.demon.mood = Math.max(0, state.demon.mood - 0.3);
        state.demon.energy = Math.max(0, state.demon.energy - 0.2);
    } else {
        state.demon.energy = Math.min(100, state.demon.energy + 5);
        state.demon.hunger = Math.max(0, state.demon.hunger - 0.1); // Sweats slightly while sleeping
    }
    updateUI();
}

// --- ACTIONS ---

els.btnFeed.addEventListener('click', () => {
    if (state.demon.isSleeping) return alert("Demon is sleeping!");
    if (state.souls < 10) return alert("Not enough Dark Souls!");
    
    state.souls -= 10;
    state.demon.hunger = Math.min(100, state.demon.hunger + 30);
    addExp(20);
    state.trackers.timesFed++;
    
    updateQuestProgress('feed');
    updateUI();
    demonGroup.scale.set(1.2, 1.2, 1.2); // Quick visual pop
});

els.btnPlay.addEventListener('click', () => {
    if (state.demon.isSleeping) return alert("Demon is sleeping!");
    if (state.demon.energy < 20) return alert("Demon is too tired to play!");

    state.demon.mood = Math.min(100, state.demon.mood + 25);
    state.demon.energy = Math.max(0, state.demon.energy - 20);
    addExp(15);
    state.trackers.timesPlayed++;
    
    updateQuestProgress('play');
    updateUI();
    demonGroup.rotation.x += Math.PI * 2; // Flip
});

els.btnSleep.addEventListener('click', () => {
    state.demon.isSleeping = !state.demon.isSleeping;
    els.btnSleep.innerText = state.demon.isSleeping ? "Wake Up" : "Toggle Sleep";
    
    // Dim lights when sleeping
    scene.children.forEach(c => {
        if (c.type === 'PointLight') c.intensity = state.demon.isSleeping ? 0.3 : 1.2;
    });
});


// --- UI UPDATES ---

function renderQuests() {
    els.questList.innerHTML = '';
    state.quests.forEach(q => {
        const li = document.createElement('li');
        li.className = `quest-item ${q.completed ? 'completed' : ''}`;
        li.innerHTML = `
            ${q.text} (Reward: ${q.reward} Souls)
            <span class="quest-progress">${q.progress} / ${q.target}</span>
        `;
        els.questList.appendChild(li);
    });
}

function updateUI() {
    els.soulCount.innerText = state.souls;
    
    // Stats
    els.hungerBar.style.width = `${state.demon.hunger}%`;
    els.moodBar.style.width = `${state.demon.mood}%`;
    els.energyBar.style.width = `${state.demon.energy}%`;

    // Colors change if low
    els.hungerBar.style.backgroundColor = state.demon.hunger < 30 ? 'red' : 'var(--hot-pink)';
    els.moodBar.style.backgroundColor = state.demon.mood < 30 ? 'red' : 'var(--hot-pink)';

    // Level & Exp
    els.demonLevel.innerText = state.demon.level;
    els.demonStage.innerText = state.demon.stage;
    const expPercent = (state.demon.exp / state.demon.expNeeded) * 100;
    els.expFill.style.width = `${expPercent}%`;

    // Button States
    els.btnFeed.disabled = state.souls < 10 || state.demon.isSleeping;
    els.btnPlay.disabled = state.demon.energy < 20 || state.demon.isSleeping;
}

// --- BOOTSTRAP ---
init3D();
generateQuests();
updateUI();
setInterval(gameLoop, 1000); // Run logic tick every 1s