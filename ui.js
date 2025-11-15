// scripts/ui.js
function showPanel(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = visible ? "block" : "none";
}

// --- Tooltip system (custom, styled)
const Tooltip = (() => {
  const el = document.createElement("div");
  el.id = "tooltip";
  document.body.appendChild(el);

  let visible = false;

  function show(html, x, y) {
    el.innerHTML = html; // allow HTML + line breaks
    el.style.left = (x + 12) + "px";
    el.style.top  = (y + 12) + "px";
    el.classList.add("show");
    visible = true;
  }

  function move(x, y) {
    if (!visible) return;
    el.style.left = (x + 12) + "px";
    el.style.top  = (y + 12) + "px";
  }

  function hide() {
    el.classList.remove("show");
    visible = false;
  }

  window.addEventListener("mousemove", e => move(e.clientX, e.clientY));

  return {
    bind(elm, textOrFn) {
      const getText = (typeof textOrFn === "function") ? textOrFn : () => textOrFn;
      elm.addEventListener("mouseenter", e => show(getText(), e.clientX, e.clientY));
      elm.addEventListener("mousemove",  e => move(e.clientX, e.clientY));
      elm.addEventListener("mouseleave", hide);
    },
    hide,
  };
})();
