(() => {
    // Global master volume (0..1). This gets updated by the vslider.
    let MASTER_VOL = 0.25;

    const audioCache = new Map();

    function getAudio(src) {
        if (!audioCache.has(src)) {
            const a = new Audio(src);
            a.preload = "auto";
            audioCache.set(src, a);
        }
        return audioCache.get(src);
    }

    function clamp01(n) {
        return Math.max(0, Math.min(1, n));
    }

    function playSound(src, gain = 1) {
        const a = getAudio(src);
        a.pause();
        a.currentTime = 0;
        a.volume = clamp01(MASTER_VOL * gain);
        a.play().catch(() => {});
    }

    function bindSoundOn(selector, src, {
        gain = 1,
        event = "change",
        onlyWhenChecked = true
    } = {}) {
        const els = document.querySelectorAll(selector);
        if (!els.length) return;

        els.forEach((el) => {
            el.addEventListener(event, (e) => {
                const t = e.target;

                if (
                    onlyWhenChecked &&
                    t &&
                    (t.type === "radio" || t.type === "checkbox") &&
                    !t.checked
                ) return;

                playSound(src, gain);
            });
        });

    }

    /**
     * Speaker volume slider:
     * - updates MASTER_VOL
     * - plays quack at the new volume on input
     */
    function bindSpeakerSlider(selector = ".vslider", src = "sound/quack.mp3") {
        const slider = document.querySelector(selector);
        if (!slider) return;

        const min = Number(slider.min || 0);
        const max = Number(slider.max || 1);

        slider.addEventListener("input", () => {
            const val = Number(slider.value);

            // Map slider (e.g. 1–7) to a usable master volume range (tweak to taste)
            const norm = (val - min) / (max - min);
            MASTER_VOL = clamp01(0.10 + norm * 0.90);

            // Play feedback quack at the updated master volume
            playSound(src, 1);
        });
    }

    function init() {

        // Desktop
        bindSoundOn('.desktop-body img', 'sound/click.mp3', {
            gain: 0.5,
            event: 'click',
            onlyWhenChecked: false
        });

        // AppleTalk
        bindSoundOn("#at-connected, #at-disconnected", "sound/appletalk.mp3", {
            gain: .3
        });

        // MouseTracking
        bindSoundOn("#mt-mouse, #mt-tablet", "sound/blorp.mp3", {
            gain: 1
        });

        // Double-click speed
        bindSoundOn('.dblclick-speed input[type="radio"', "sound/doubleclick.mp3", {
            gain: 1
        });

        // Rate of insertion
        bindSoundOn('.rate-radios input[type="radio"]', "sound/drip.mp3", {
            gain: .5
        });

        // RAM on/off
        bindSoundOn('.ram-right input[type="radio"]', "sound/sosume.mp3", {
            gain: 1
        });

        // RAM up/down
        bindSoundOn('.ram-arrows .ram-arrow', "sound/click.mp3", {
            gain: 0.5,
            event: 'click',
            onlyWhenChecked: false
        });

        // Key repeat rate
        bindSoundOn('.keyboard-radios input[type="radio"]', "sound/whip.mp3", {
            gain: 1
        });

        // Speaker slider controls MASTER_VOL for everything + quack feedback
        bindSpeakerSlider(".vslider", "sound/quack.mp3");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();