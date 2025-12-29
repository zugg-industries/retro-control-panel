/**
 * Bind RAM stepper arrows to increment/decrement a select.
 */
function bindRamStepper(panelSelector = ".panel.ram") {
    const panel = document.querySelector(panelSelector);
    if (!panel) return;

    const select = panel.querySelector(".ram-select");
    const up = panel.querySelector(".ram-up");
    const down = panel.querySelector(".ram-down");
    if (!select || !up || !down) return;

    const step = (dir) => {
        const i = select.selectedIndex;
        const next = i + dir;
        if (next < 0 || next >= select.options.length) return;
        select.selectedIndex = next;
        select.dispatchEvent(new Event("change", {
            bubbles: true
        }));
    };

    up.addEventListener("click", () => step(1));
    down.addEventListener("click", () => step(-1));
}
bindRamStepper(".panel.ram");

//desktop pattern
(function () {
    const patterns = document.querySelectorAll('.desktop-pattern .pattern');
    if (!patterns.length) return;

    // ensure first is active by default :-----)
    patterns.forEach((img, i) => {
        img.classList.toggle('active', i === 0);
    });

    patterns.forEach(img => {
        img.addEventListener('click', () => {
            patterns.forEach(p => p.classList.remove('active'));
            img.classList.add('active');
        });
    });
})();