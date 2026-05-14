/**
 * Live theme helpers.
 * The studio's `brand_color` (hex) gets converted to HSL components and pushed
 * into `--primary` (and `--ring`) so the entire app re-themes the moment a
 * studio owner changes their brand color in Branding settings.
 */

function hexToHsl(hex) {
  if (!hex) return null;
  const m = hex.replace("#", "").trim();
  if (![3, 6].includes(m.length)) return null;
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function applyBrandColor(hex) {
  const hsl = hexToHsl(hex);
  if (!hsl) return;
  const root = document.documentElement;
  const tuple = `${hsl.h} ${hsl.s}% ${Math.max(12, Math.min(30, hsl.l))}%`;
  root.style.setProperty("--primary", tuple);
  root.style.setProperty("--ring", tuple);
}

export function resetBrandColor() {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
}
