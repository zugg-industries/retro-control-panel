(function () {
    const closeBtn = document.querySelector(".titlebar-close");
    const win = document.querySelector(".window");
    if (!closeBtn || !win) return;

    let rafId = null;
    let spawnTimer = null;
    let bgFadeId = null;

    const rand = (min, max) => Math.random() * (max - min) + min;
    const randInt = (min, max) => Math.floor(rand(min, max + 1));

    // HSV -> RGB for cycling
    function hsvToRgb(h, s, v) {
        const c = v * s;
        const hp = (h / 60) % 6;
        const x = c * (1 - Math.abs((hp % 2) - 1));
        let r = 0,
            g = 0,
            b = 0;

        if (0 <= hp && hp < 1)[r, g, b] = [c, x, 0];
        else if (1 <= hp && hp < 2)[r, g, b] = [x, c, 0];
        else if (2 <= hp && hp < 3)[r, g, b] = [0, c, x];
        else if (3 <= hp && hp < 4)[r, g, b] = [0, x, c];
        else if (4 <= hp && hp < 5)[r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];

        const m = v - c;
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function stopLoops() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;

        if (spawnTimer) clearTimeout(spawnTimer);
        spawnTimer = null;

        if (bgFadeId) cancelAnimationFrame(bgFadeId);
        bgFadeId = null;
    }

    closeBtn.addEventListener("click", () => {
        stopLoops();

        win.classList.add("zugg-mode");
        win.innerHTML = `
      <div class="zugg-stage">
        <div class="bubble-layer" aria-hidden="true"></div>
        <div class="zugg-text">created by Zugg</div>

        <div class="wizard-wrap" aria-hidden="true">
          <div class="zugg-flash"></div>
          <img class="zugg-wizard" src="img/zugg-cast.gif" alt="">
        </div>
      </div>
    `;

        const stage = win.querySelector(".zugg-stage");
        const layer = win.querySelector(".bubble-layer");
        const wizardWrap = win.querySelector(".wizard-wrap");
        const wizard = win.querySelector(".zugg-wizard");
        if (!stage || !layer || !wizardWrap || !wizard) return;

        const getStageRect = () => stage.getBoundingClientRect();

        // one-line: flash around wizard
        function flashWizard() {
            wizardWrap.classList.add("flash");
            setTimeout(() => wizardWrap.classList.remove("flash"), 120);
        }

        function getEmitPoint() {
            const s = getStageRect();
            const w = wizard.getBoundingClientRect();
            return {
                x: (w.left - s.left) + (w.width * 0.78),
                y: (w.top - s.top) + (w.height * 0.35),
            };
        }

        // -------- settings --------
        const bubbles = [];
        const maxBubbles = 50;
        const speedMult = 4;
        const castSpeedMult = 1.5;
        const bubbleGain = 0.2;

        // spell sounds (1–6)
        const spellSounds = Array.from({
                length: 6
            }, (_, i) =>
            new Audio(`sound/spell-${i + 1}.mp3`)
        );
        spellSounds.forEach(a => (a.preload = "auto"));

        function playSpawnSound() {
            const base = spellSounds[Math.floor(Math.random() * spellSounds.length)];
            const sfx = base.cloneNode(); // allow overlap
            sfx.volume = bubbleGain;
            sfx.play().catch(() => {});
        }

        // background only changes on cast
        let bgHue = Math.random() * 360;
        const bgHueStep = 28; // jump per cast
        const bgFadeMs = 220;

        function setBgHue(hue) {
            stage.style.background = hsvToRgb(hue, 0.25, 0.96);
        }

        function bumpBackgroundOnCast() {
            const from = bgHue;
            bgHue = (bgHue + bgHueStep + rand(-18, 18) + 360) % 360;
            const to = bgHue;

            if (bgFadeId) cancelAnimationFrame(bgFadeId);

            const start = performance.now();
            const fade = (now) => {
                const p = Math.min(1, (now - start) / bgFadeMs);
                const s = p * p * (3 - 2 * p); // smoothstep
                const hue = (from + (to - from) * s + 360) % 360;
                setBgHue(hue);

                if (p < 1) bgFadeId = requestAnimationFrame(fade);
                else bgFadeId = null;
            };

            bgFadeId = requestAnimationFrame(fade);
        }

        // initial background once
        setBgHue(bgHue);

        function spawnBubble() {
            // cap at 50
            if (bubbles.length >= maxBubbles) {
                const old = bubbles.shift();
                if (old && old.el) old.el.remove();
            }

            const el = document.createElement("div");
            el.className = "bubble";

            const size = randInt(12, 34);
            el.style.width = size + "px";
            el.style.height = size + "px";
            layer.appendChild(el);

            const {
                x,
                y
            } = getEmitPoint();

            // always rightward with variance
            let vx = rand(1.2, 3.8) * speedMult;
            let vy = rand(-2.2, 2.2) * speedMult;

            // color cycling per bubble
            const hueBase = rand(0, 360);
            const hueSpeed = rand(1.5, 6.5);
            const sat = rand(0.75, 1);
            const val = rand(0.85, 1);

            bubbles.push({
                el,
                size,
                x,
                y,
                vx,
                vy,
                hueBase,
                hueSpeed,
                sat,
                val
            });

            flashWizard();
            bumpBackgroundOnCast();
            playSpawnSound();
        }

        function scheduleNextSpawn() {
            const delay = rand(300, 2000) / castSpeedMult;
            spawnTimer = setTimeout(() => {
                spawnBubble();
                scheduleNextSpawn();
            }, delay);
        }

        // start
        spawnBubble();
        scheduleNextSpawn();

        // movement loop (NO background update here)
        let t = 0;

        function tick() {
            const r = getStageRect();
            const w = r.width;
            const h = r.height;

            t += 1;

            for (const b of bubbles) {
                b.x += b.vx;
                b.y += b.vy;

                if (b.x <= 0) {
                    b.x = 0;
                    b.vx *= -1;
                }
                if (b.y <= 0) {
                    b.y = 0;
                    b.vy *= -1;
                }
                if (b.x >= w - b.size) {
                    b.x = w - b.size;
                    b.vx *= -1;
                }
                if (b.y >= h - b.size) {
                    b.y = h - b.size;
                    b.vy *= -1;
                }

                b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;

                const hue = (b.hueBase + t * b.hueSpeed) % 360;
                b.el.style.background = hsvToRgb(hue, b.sat, b.val);
            }

            rafId = requestAnimationFrame(tick);
        }

        tick();
    });
})();