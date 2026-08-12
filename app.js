// ── DISCORD ──────────────────────────────────────────────
const DISCORD_CLIENT_ID = '1537067961968234597';
let discordSdk;

async function setupDiscordActivity() {
    const statusText = document.getElementById('discord-status');
    if (window.parent !== window && DISCORD_CLIENT_ID !== 'YOUR_CLIENT_ID_HERE') {
        try {
            statusText.textContent = "Binding to Discord...";
            const module = await import("https://esm.sh/@discord/embedded-app-sdk");
            discordSdk = new module.DiscordSDK(DISCORD_CLIENT_ID);
            await discordSdk.ready();
            statusText.textContent = "Bound to Discord.";
            setTimeout(() => { statusText.textContent = ""; }, 3000);
        } catch (e) {
            console.error("Discord SDK Error:", e);
            statusText.textContent = "Abyss connection failed. Operating locally.";
        }
    } else {
        statusText.textContent = "Running in standalone web mode.";
    }
}

// ── DATA ─────────────────────────────────────────────────
const AMULETS = [
    { id: 'soul',   name: 'Soul Amulet',      unlockLevel: 1,  bonus: 0,    emoji: '🔮' },
    { id: 'void',   name: 'Void Amulet',       unlockLevel: 3,  bonus: 0.10, emoji: '🌑' },
    { id: 'blood',  name: 'Blood Pact',         unlockLevel: 6,  bonus: 0.20, emoji: '🩸' },
    { id: 'sigil',  name: 'Sigil of Azazel',   unlockLevel: 10, bonus: 0.35, emoji: '⛧' },
];

// minAmulet: which amulet id is required to attempt a catch
const DEMONS = [
    { id:1, name:"Infernal Imp",       type:"Fire",   rarity:"Common",    catchRate:0.8,  minAmulet:'soul',  prompt:"infernal+imp+small+fire+demon+dark+fantasy+creature+glowing+red+eyes",             seed:101 },
    { id:2, name:"Shadow Stalker",     type:"Void",   rarity:"Common",    catchRate:0.7,  minAmulet:'soul',  prompt:"shadow+stalker+void+demon+dark+fantasy+purple+smoke+claws",                        seed:202 },
    { id:3, name:"Gore Hound",         type:"Beast",  rarity:"Uncommon",  catchRate:0.5,  minAmulet:'soul',  prompt:"gore+hound+beast+demon+hellhound+dark+fantasy+crimson+fur+fangs",                  seed:303 },
    { id:4, name:"Banshee Wraith",     type:"Spirit", rarity:"Uncommon",  catchRate:0.45, minAmulet:'soul',  prompt:"banshee+wraith+spirit+ghost+demon+dark+fantasy+wailing+ethereal+pale",             seed:404 },
    { id:5, name:"Abyssal Leviathan",  type:"Water",  rarity:"Rare",      catchRate:0.25, minAmulet:'void',  prompt:"abyssal+leviathan+sea+serpent+demon+dark+fantasy+deep+ocean+monster+tentacles",   seed:505 },
    { id:6, name:"Soul Harvester",     type:"Undead", rarity:"Rare",      catchRate:0.2,  minAmulet:'void',  prompt:"soul+harvester+undead+demon+dark+fantasy+reaper+scythe+skeleton+robes",            seed:606 },
    { id:7, name:"Azazel's Vanguard",  type:"Fallen", rarity:"Epic",      catchRate:0.1,  minAmulet:'blood', prompt:"azazel+vanguard+fallen+angel+demon+dark+fantasy+black+wings+armor+magenta+glow",   seed:777 },
    { id:8, name:"Crimson Behemoth",   type:"Flesh",  rarity:"Legendary", catchRate:0.05, minAmulet:'sigil', prompt:"crimson+behemoth+flesh+demon+dark+fantasy+enormous+monster+blood+red+horns+rage",  seed:999 },
];

const AMULET_ORDER = ['soul','void','blood','sigil'];

const XP_PER_LEVEL = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];

// Quest templates — pool to pick from daily
const QUEST_POOL = [
    { id:'catch_common',   title:'Catch 2 Common demons',         icon:'👹', xp:50,  type:'catch_rarity',  target:'Common',   goal:2 },
    { id:'catch_uncommon', title:'Catch an Uncommon demon',        icon:'🔥', xp:70,  type:'catch_rarity',  target:'Uncommon', goal:1 },
    { id:'catch_rare',     title:'Catch a Rare or higher demon',   icon:'💧', xp:120, type:'catch_rarity',  target:'Rare+',    goal:1 },
    { id:'attempts_5',     title:'Attempt 5 captures',             icon:'🎯', xp:40,  type:'attempts',      target:null,       goal:5 },
    { id:'catch_fire',     title:'Catch a Fire-type demon',        icon:'🔥', xp:60,  type:'catch_type',    target:'Fire',     goal:1 },
    { id:'catch_void',     title:'Catch a Void-type demon',        icon:'🌑', xp:60,  type:'catch_type',    target:'Void',     goal:1 },
    { id:'catch_spirit',   title:'Catch a Spirit-type demon',      icon:'👻', xp:60,  type:'catch_type',    target:'Spirit',   goal:1 },
    { id:'catch_3_any',    title:'Catch 3 demons of any kind',     icon:'⛧', xp:80,  type:'catch_any',     target:null,       goal:3 },
    { id:'use_void_amulet',title:'Use a Void Amulet or higher',    icon:'🌑', xp:40,  type:'use_amulet',    target:'void',     goal:1 },
    { id:'flee_0',         title:'Catch without fleeing once',     icon:'💪', xp:50,  type:'no_flee_catch', target:null,       goal:1 },
];

// ── HELPERS ──────────────────────────────────────────────
function pollinationsUrl(prompt, seed, w, h) {
    return `https://image.pollinations.ai/prompt/${prompt}?width=${w}&height=${h}&seed=${seed}&model=flux&nologo=true`;
}

function amuletIndex(id) { return AMULET_ORDER.indexOf(id); }
function canCatch(demon, amuletId) { return amuletIndex(amuletId) >= amuletIndex(demon.minAmulet); }

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getXpForLevel(lvl) { return XP_PER_LEVEL[Math.min(lvl, XP_PER_LEVEL.length - 1)]; }

function levelFromXp(xp) {
    let lvl = 1;
    for (let i = 1; i < XP_PER_LEVEL.length; i++) {
        if (xp >= XP_PER_LEVEL[i]) lvl = i + 1;
        else break;
    }
    return Math.min(lvl, 10);
}

// ── AUDIO ─────────────────────────────────────────────────
let audioCtx = null;
function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playCatch() {
    const ctx = getCtx();
    // low rumble sweep up = demonic acceptance
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.4);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 1.5);
}

function playFail() {
    const ctx = getCtx();
    // short dissonant buzz — not the same as catch
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
}

function playLevelUp() {
    const ctx = getCtx();
    [261, 329, 392, 523].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
    });
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, gold = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (gold ? ' gold' : '');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── MAIN ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    setupDiscordActivity();

    // ── STATE ──
    let save = JSON.parse(localStorage.getItem('demonmon_save')) || {
        xp: 0,
        activeAmulet: 'soul',
        demons: [],
        quests: null,
        questDay: null,
        questProgress: {},
        fled: false,
    };

    let currentEncounter = null;
    let sessionFled = false; // tracks if player fled THIS encounter

    function persist() {
        localStorage.setItem('demonmon_save', JSON.stringify(save));
    }

    // ── XP / LEVEL ──
    function getLevel() { return levelFromXp(save.xp); }

    function addXp(amount) {
        const prevLevel = getLevel();
        save.xp += amount;
        const newLevel = getLevel();
        persist();
        renderHunterBar();
        if (newLevel > prevLevel) {
            playLevelUp();
            showToast(`⬆ Hunter Level ${newLevel} reached!`, true);
            renderAmuletSelector(); // unlock new amulets
        }
    }

    function renderHunterBar() {
        const lvl  = getLevel();
        const xpNow  = save.xp;
        const xpThis = getXpForLevel(lvl - 1);
        const xpNext = getXpForLevel(lvl);
        const pct  = lvl >= 10 ? 100 : Math.round(((xpNow - xpThis) / (xpNext - xpThis)) * 100);

        document.getElementById('hunter-level-label').textContent = `Hunter Lv.${lvl}`;
        document.getElementById('xp-fill').style.width = pct + '%';
        document.getElementById('xp-label').textContent =
            lvl >= 10 ? 'MAX' : `${xpNow - xpThis} / ${xpNext - xpThis} XP`;
    }

    // ── QUESTS ──
    function ensureQuests() {
        const today = getTodayKey();
        if (save.questDay !== today) {
            // Pick 3 random quests from pool
            const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
            save.quests        = shuffled.slice(0, 3).map(q => ({ ...q, progress: 0, done: false }));
            save.questDay      = today;
            save.questProgress = {};
            persist();
        }
    }

    function trackQuest(type, payload) {
        if (!save.quests) return;
        let changed = false;
        save.quests.forEach(q => {
            if (q.done) return;
            let hit = false;
            if (q.type === 'catch_rarity' && type === 'catch') {
                if (q.target === 'Rare+') {
                    hit = ['Rare','Epic','Legendary'].includes(payload.rarity);
                } else {
                    hit = payload.rarity === q.target;
                }
            } else if (q.type === 'catch_type'  && type === 'catch') { hit = payload.type === q.target; }
            else if (q.type === 'catch_any'      && type === 'catch') { hit = true; }
            else if (q.type === 'attempts'       && type === 'attempt') { hit = true; }
            else if (q.type === 'use_amulet'     && type === 'attempt') { hit = amuletIndex(payload.amulet) >= amuletIndex(q.target); }
            else if (q.type === 'no_flee_catch'  && type === 'catch')  { hit = !sessionFled; }

            if (hit) {
                q.progress = Math.min(q.progress + 1, q.goal);
                if (q.progress >= q.goal && !q.done) {
                    q.done = true;
                    addXp(q.xp);
                    showToast(`📜 Quest complete: ${q.title} (+${q.xp} XP)`, true);
                }
                changed = true;
            }
        });
        if (changed) persist();
    }

    function renderQuests() {
        ensureQuests();
        const list = document.getElementById('quest-list');
        list.innerHTML = '';

        save.quests.forEach(q => {
            const pct = Math.round((q.progress / q.goal) * 100);
            const card = document.createElement('div');
            card.className = 'quest-card' + (q.done ? ' complete' : '');
            card.innerHTML = `
                <div class="quest-icon">${q.icon}</div>
                <div class="quest-info">
                    <div class="quest-title">${q.title}</div>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="quest-status">${q.done ? 'Complete' : `${q.progress} / ${q.goal}`}</div>
                </div>
                <div class="quest-reward">+${q.xp} XP</div>
            `;
            list.appendChild(card);
        });

        // reset countdown
        const now       = new Date();
        const midnight  = new Date(now); midnight.setHours(24,0,0,0);
        const diff      = midnight - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        document.getElementById('quest-reset-info').textContent =
            `Resets in ${h}h ${m}m`;
    }

    // ── AMULET SELECTOR ──
    function renderAmuletSelector() {
        const lvl = getLevel();
        const container = document.getElementById('amulet-selector');
        container.innerHTML = '';
        AMULETS.forEach(a => {
            const locked  = lvl < a.unlockLevel;
            const active  = save.activeAmulet === a.id;
            const btn     = document.createElement('button');
            btn.className = 'amulet-option' + (active ? ' active' : '') + (locked ? ' locked' : '');
            btn.innerHTML = `${a.emoji} ${a.name}<span class="amulet-tier">Lv.${a.unlockLevel} unlock${a.bonus > 0 ? ' · +' + Math.round(a.bonus*100) + '% catch' : ''}</span>`;
            btn.disabled  = locked;
            btn.addEventListener('click', () => {
                if (locked) return;
                save.activeAmulet = a.id;
                persist();
                renderAmuletSelector();
            });
            container.appendChild(btn);
        });
    }

    // ── NAVIGATION ──
    const navIds   = ['explore','quests','collection','dex'];
    navIds.forEach(id => {
        document.getElementById(`nav-${id}`).addEventListener('click', () => {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.game-nav button').forEach(b => b.classList.remove('active'));
            document.getElementById(`view-${id}`).classList.add('active');
            document.getElementById(`nav-${id}`).classList.add('active');
            if (id === 'quests')      renderQuests();
            if (id === 'collection') renderCollection();
            if (id === 'dex')        renderDex();
        });
    });

    // ── ENCOUNTER ──
    document.getElementById('btn-explore').addEventListener('click', triggerEncounter);

    function triggerEncounter() {
        document.getElementById('explore-prompt').classList.add('hidden');
        document.getElementById('wild-demon-container').classList.remove('hidden');
        sessionFled = false;

        const roll = Math.random();
        let index  = 0;
        if (roll > 0.5)       index = Math.floor(Math.random() * 2);
        else if (roll > 0.15) index = Math.floor(Math.random() * 2) + 2;
        else if (roll > 0.05) index = Math.floor(Math.random() * 2) + 4;
        else if (roll > 0.01) index = 6;
        else                  index = 7;

        currentEncounter = { ...DEMONS[index] };

        const img      = document.getElementById('wild-demon-image');
        const loading  = document.getElementById('img-loading');
        const warning  = document.getElementById('amulet-warning');
        const throwBtn = document.getElementById('btn-throw-amulet');

        document.getElementById('wild-demon-name').textContent  = currentEncounter.name;
        document.getElementById('wild-demon-class').textContent = `[ ${currentEncounter.type} ]`;

        const rarityEl = document.getElementById('wild-demon-rarity');
        rarityEl.textContent  = currentEncounter.rarity;
        rarityEl.className    = `rarity-badge rarity-${currentEncounter.rarity}`;

        // image loading state
        img.classList.add('hidden');
        loading.classList.remove('hidden');
        img.onload  = () => { loading.classList.add('hidden'); img.classList.remove('hidden'); };
        img.onerror = () => { loading.textContent = '[ image unavailable ]'; };
        img.src     = pollinationsUrl(currentEncounter.prompt, currentEncounter.seed, 250, 250);

        document.getElementById('encounter-log').textContent =
            `A wild ${currentEncounter.name} emerged from the rift!`;

        // check amulet requirement
        const canAttempt = canCatch(currentEncounter, save.activeAmulet);
        const required   = AMULETS.find(a => a.id === currentEncounter.minAmulet);
        if (!canAttempt) {
            warning.textContent = `Requires ${required.name} or higher to bind.`;
            warning.classList.remove('hidden');
            throwBtn.disabled = true;
        } else {
            warning.classList.add('hidden');
            throwBtn.disabled = false;
        }

        document.getElementById('btn-flee').disabled = false;
        img.classList.remove('shake');
    }

    // ── CAPTURE ──
    document.getElementById('btn-throw-amulet').addEventListener('click', attemptCapture);

    function attemptCapture() {
        if (!currentEncounter) return;
        const throwBtn = document.getElementById('btn-throw-amulet');
        const fleeBtn  = document.getElementById('btn-flee');
        const log      = document.getElementById('encounter-log');
        const img      = document.getElementById('wild-demon-image');

        throwBtn.disabled = true;
        fleeBtn.disabled  = true;
        log.textContent   = "Throwing amulet...";
        img.classList.add('shake');

        // track attempt for quests
        trackQuest('attempt', { amulet: save.activeAmulet });

        setTimeout(() => {
            img.classList.remove('shake');
            const activeAmulet = AMULETS.find(a => a.id === save.activeAmulet);
            const rate   = Math.min(currentEncounter.catchRate + activeAmulet.bonus, 0.95);
            const roll   = Math.random();

            if (roll <= rate) {
                playCatch();
                log.textContent = `Caught! ${currentEncounter.name} is now bound to you.`;
                saveDemon(currentEncounter);
                trackQuest('catch', { rarity: currentEncounter.rarity, type: currentEncounter.type });
                addXp(getRarityXp(currentEncounter.rarity));
                setTimeout(resetEncounter, 2500);
            } else {
                const escaped = Math.random() < 0.3;
                if (escaped) {
                    playFail();
                    log.textContent = `The amulet shattered! ${currentEncounter.name} fled into the shadows.`;
                    setTimeout(resetEncounter, 2500);
                } else {
                    playFail();
                    log.textContent = `The demon broke free! Try again.`;
                    throwBtn.disabled = false;
                    fleeBtn.disabled  = false;
                }
            }
        }, 1500);
    }

    function getRarityXp(rarity) {
        return { Common:10, Uncommon:20, Rare:40, Epic:80, Legendary:200 }[rarity] || 10;
    }

    // ── FLEE ──
    document.getElementById('btn-flee').addEventListener('click', () => {
        sessionFled = true;
        document.getElementById('encounter-log').textContent = "You retreated into the darkness.";
        setTimeout(resetEncounter, 1000);
    });

    function resetEncounter() {
        currentEncounter = null;
        document.getElementById('wild-demon-container').classList.add('hidden');
        document.getElementById('explore-prompt').classList.remove('hidden');
    }

    // ── SAVE DEMON ──
    function saveDemon(demon) {
        save.demons.push({
            ...demon,
            dateCaught: new Date().toLocaleDateString(),
            level: Math.floor(Math.random() * 10) + 1
        });
        persist();
    }

    // ── COLLECTION ──
    function renderCollection() {
        const grid  = document.getElementById('collection-grid');
        const empty = document.getElementById('empty-collection');
        grid.innerHTML = '';

        if (save.demons.length === 0) {
            empty.classList.remove('hidden');
            grid.classList.add('hidden');
            return;
        }
        empty.classList.add('hidden');
        grid.classList.remove('hidden');

        save.demons.forEach(demon => {
            const card = document.createElement('div');
            card.className = 'demon-card';
            card.innerHTML = `
                <img src="${pollinationsUrl(demon.prompt, demon.seed, 150, 120)}"
                     alt="${demon.name}"
                     onerror="this.style.opacity='0.2'">
                <h3>${demon.name}</h3>
                <div class="card-type">${demon.type} · Lv.${demon.level}</div>
                <div class="card-rarity rarity-badge rarity-${demon.rarity}">${demon.rarity}</div>
            `;
            grid.appendChild(card);
        });
    }

    // ── BEAST-A-DEX ──
    function renderDex() {
        const grid = document.getElementById('dex-grid');
        const prog = document.getElementById('dex-progress');
        grid.innerHTML = '';

        const caughtIds = new Set(save.demons.map(d => d.id));
        const total     = DEMONS.length;
        const caught    = caughtIds.size;
        prog.textContent = `${caught} / ${total} demons recorded`;

        DEMONS.forEach(demon => {
            const seen = caughtIds.has(demon.id);
            const card = document.createElement('div');
            card.className = 'dex-card ' + (seen ? 'seen' : 'unseen');

            const imgSrc = pollinationsUrl(demon.prompt, demon.seed, 150, 120);

            card.innerHTML = `
                ${seen ? '<div class="dex-caught-badge">BOUND</div>' : ''}
                <img src="${seen ? imgSrc : imgSrc}"
                     alt="${seen ? demon.name : '???'}"
                     onerror="this.style.opacity='0.1'">
                <h3>${seen ? demon.name : '???'}</h3>
                <div class="dex-type">${seen ? `${demon.type} · ${demon.rarity}` : `${demon.type} · ???`}</div>
                <div class="card-rarity rarity-badge rarity-${demon.rarity}" style="margin-top:4px">${demon.rarity}</div>
            `;

            // Show minimum amulet even for unseen (hint)
            if (!seen) {
                const req = AMULETS.find(a => a.id === demon.minAmulet);
                const hint = document.createElement('div');
                hint.style.cssText = 'font-size:0.58rem;color:var(--text-dim);margin-top:4px;letter-spacing:1px;';
                hint.textContent = `Needs: ${req.name}`;
                card.appendChild(hint);
            }

            grid.appendChild(card);
        });
    }

    // ── BOOT ──
    renderHunterBar();
    renderAmuletSelector();
    ensureQuests();
});
