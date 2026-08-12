// --- DISCORD ACTIVITY SETUP ---
const DISCORD_CLIENT_ID = '1537067961968234597';

let discordSdk;

async function setupDiscordActivity() {
    const statusText = document.getElementById('discord-status');

    if (window.parent !== window && DISCORD_CLIENT_ID !== 'YOUR_CLIENT_ID_HERE') {
        try {
            statusText.textContent = "Connecting to the Abyss (Discord)...";
            const module = await import("https://esm.sh/@discord/embedded-app-sdk");
            discordSdk = new module.DiscordSDK(DISCORD_CLIENT_ID);
            await discordSdk.ready();
            statusText.textContent = "Bound to Discord successfully.";
            setTimeout(() => { statusText.textContent = ""; }, 3000);
        } catch (error) {
            console.error("Discord SDK Error:", error);
            statusText.textContent = "Connection to the Abyss failed. Operating locally.";
        }
    } else if (DISCORD_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
        statusText.textContent = "Running in web mode. (Discord Client ID missing)";
    } else {
        statusText.textContent = "Running in standalone web mode.";
    }
}

// --- GAME DATA ---
// prompt: sent to Pollinations for image generation
// seed:   fixed so the same demon always looks the same
const demonSpecies = [
    {
        id: 1, name: "Infernal Imp", type: "Fire", rarity: "Common", catchRate: 0.8,
        prompt: "infernal+imp+small+fire+demon+dark+fantasy+creature+glowing+red+eyes",
        seed: 101
    },
    {
        id: 2, name: "Shadow Stalker", type: "Void", rarity: "Common", catchRate: 0.7,
        prompt: "shadow+stalker+void+demon+dark+fantasy+creature+purple+smoke+claws",
        seed: 202
    },
    {
        id: 3, name: "Gore Hound", type: "Beast", rarity: "Uncommon", catchRate: 0.5,
        prompt: "gore+hound+beast+demon+hellhound+dark+fantasy+crimson+fur+fangs",
        seed: 303
    },
    {
        id: 4, name: "Banshee Wraith", type: "Spirit", rarity: "Uncommon", catchRate: 0.45,
        prompt: "banshee+wraith+spirit+ghost+demon+dark+fantasy+wailing+ethereal+pale",
        seed: 404
    },
    {
        id: 5, name: "Abyssal Leviathan", type: "Water", rarity: "Rare", catchRate: 0.25,
        prompt: "abyssal+leviathan+sea+serpent+demon+dark+fantasy+deep+ocean+monster+tentacles",
        seed: 505
    },
    {
        id: 6, name: "Soul Harvester", type: "Undead", rarity: "Rare", catchRate: 0.2,
        prompt: "soul+harvester+undead+demon+dark+fantasy+reaper+scythe+skeleton+robes",
        seed: 606
    },
    {
        id: 7, name: "Azazel's Vanguard", type: "Fallen", rarity: "Epic", catchRate: 0.1,
        prompt: "azazel+vanguard+fallen+angel+demon+dark+fantasy+black+wings+armor+magenta+glow",
        seed: 777
    },
    {
        id: 8, name: "Crimson Behemoth", type: "Flesh", rarity: "Legendary", catchRate: 0.05,
        prompt: "crimson+behemoth+flesh+demon+dark+fantasy+enormous+monster+blood+red+horns+rage",
        seed: 999
    }
];

// Builds a Pollinations image URL
function pollinationsUrl(prompt, seed, width, height) {
    return `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
}

// --- AUDIO ---
let audioCtx = null;

function playDemonicRoar() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc      = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1.5);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {

    setupDiscordActivity();

    // State
    let myDemons         = JSON.parse(localStorage.getItem('demonCollectionActivity')) || [];
    let currentEncounter = null;

    // DOM refs (safe here — DOM is ready)
    const navExplore         = document.getElementById('nav-explore');
    const navCollection      = document.getElementById('nav-collection');
    const viewExplore        = document.getElementById('view-explore');
    const viewCollection     = document.getElementById('view-collection');
    const btnExplore         = document.getElementById('btn-explore');
    const btnThrowAmulet     = document.getElementById('btn-throw-amulet');
    const btnFlee            = document.getElementById('btn-flee');
    const explorePrompt      = document.getElementById('explore-prompt');
    const wildDemonContainer = document.getElementById('wild-demon-container');
    const wildDemonName      = document.getElementById('wild-demon-name');
    const wildDemonClass     = document.getElementById('wild-demon-class');
    const wildDemonImage     = document.getElementById('wild-demon-image');
    const encounterLog       = document.getElementById('encounter-log');
    const collectionGrid     = document.getElementById('collection-grid');
    const emptyCollection    = document.getElementById('empty-collection');

    // --- NAVIGATION ---
    navExplore.addEventListener('click', () => switchView(viewExplore, navExplore));
    navCollection.addEventListener('click', () => {
        switchView(viewCollection, navCollection);
        renderCollection();
    });

    function switchView(targetView, targetNav) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.game-nav button').forEach(b => b.classList.remove('active'));
        targetView.classList.add('active');
        targetNav.classList.add('active');
    }

    // --- ENCOUNTER ---
    btnExplore.addEventListener('click', triggerEncounter);

    function triggerEncounter() {
        explorePrompt.classList.add('hidden');
        wildDemonContainer.classList.remove('hidden');

        const roll = Math.random();
        let index  = 0;
        if (roll > 0.5)       index = Math.floor(Math.random() * 2);
        else if (roll > 0.15) index = Math.floor(Math.random() * 2) + 2;
        else if (roll > 0.05) index = Math.floor(Math.random() * 2) + 4;
        else if (roll > 0.01) index = 6;
        else                  index = 7;

        currentEncounter = { ...demonSpecies[index] };

        wildDemonName.textContent  = currentEncounter.name;
        wildDemonClass.textContent = `[ ${currentEncounter.type} | ${currentEncounter.rarity} ]`;
        wildDemonImage.src         = pollinationsUrl(currentEncounter.prompt, currentEncounter.seed, 250, 250);
        encounterLog.textContent   = `A wild ${currentEncounter.name} emerged from the rift!`;

        btnThrowAmulet.disabled = false;
        btnFlee.disabled        = false;
        wildDemonImage.classList.remove('shake');
    }

    // --- CAPTURE ---
    btnThrowAmulet.addEventListener('click', attemptCapture);

    function attemptCapture() {
        if (!currentEncounter) return;

        btnThrowAmulet.disabled  = true;
        btnFlee.disabled         = true;
        encounterLog.textContent = "Throwing Void Amulet...";
        wildDemonImage.classList.add('shake');

        setTimeout(() => {
            wildDemonImage.classList.remove('shake');
            const catchRoll = Math.random();

            if (catchRoll <= currentEncounter.catchRate) {
                playDemonicRoar();
                encounterLog.textContent = `Caught! ${currentEncounter.name} is now bound to you.`;
                saveDemon(currentEncounter);
                setTimeout(resetEncounter, 2500);
            } else {
                const fleeRoll = Math.random();
                if (fleeRoll < 0.3) {
                    encounterLog.textContent = `The amulet shattered! ${currentEncounter.name} fled into the shadows.`;
                    setTimeout(resetEncounter, 2500);
                } else {
                    encounterLog.textContent = `The demon broke free! Try again.`;
                    btnThrowAmulet.disabled  = false;
                    btnFlee.disabled         = false;
                }
            }
        }, 1500);
    }

    // --- FLEE ---
    btnFlee.addEventListener('click', () => {
        encounterLog.textContent = "You retreated into the darkness.";
        setTimeout(resetEncounter, 1000);
    });

    function resetEncounter() {
        currentEncounter = null;
        wildDemonContainer.classList.add('hidden');
        explorePrompt.classList.remove('hidden');
    }

    // --- SAVE / RENDER ---
    function saveDemon(demon) {
        const boundDemon = {
            ...demon,
            dateCaught: new Date().toLocaleDateString(),
            level: Math.floor(Math.random() * 10) + 1
        };
        myDemons.push(boundDemon);
        localStorage.setItem('demonCollectionActivity', JSON.stringify(myDemons));
    }

    function renderCollection() {
        collectionGrid.innerHTML = '';

        if (myDemons.length === 0) {
            emptyCollection.classList.remove('hidden');
            collectionGrid.classList.add('hidden');
            return;
        }

        emptyCollection.classList.add('hidden');
        collectionGrid.classList.remove('hidden');

        myDemons.forEach((demon) => {
            const card     = document.createElement('div');
            card.className = 'demon-card';
            card.innerHTML = `
                <img src="${pollinationsUrl(demon.prompt, demon.seed, 150, 120)}" alt="${demon.name}">
                <h3>${demon.name}</h3>
                <p>Lvl ${demon.level} | ${demon.type}</p>
                <p style="margin-top: 5px; color: #555;">${demon.dateCaught}</p>
            `;
            collectionGrid.appendChild(card);
        });
    }
});
