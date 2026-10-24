// Shared color math retained from the suite's existing theme engine.
EXP.SiteColor = (() => {
  const cache=new Map(),transformCache=new Map();
  let context;
  function parse(value) {
    const raw = String(value || '').trim();
    if (!raw || /^(transparent|none|inherit|initial|unset|currentcolor)$/i.test(raw)) return null;
    const key = raw.toLowerCase();
    if (cache.has(key)) return cache.get(key);
    try {
      context ||= (() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        return canvas.getContext('2d', { willReadFrequently: true });
      })();
      if (!context) return null;
      context.fillStyle = '#000';
      context.fillStyle = raw;
      const normalized = String(context.fillStyle);
      let result = null;
      if (/^#[0-9a-f]{6}$/i.test(normalized)) {
        result = {
          r: parseInt(normalized.slice(1, 3), 16),
          g: parseInt(normalized.slice(3, 5), 16),
          b: parseInt(normalized.slice(5, 7), 16),
          a: 1,
        };
      } else {
        const match = normalized.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i);
        if (match) result = { r: +match[1], g: +match[2], b: +match[3], a: match[4] === undefined ? 1 : +match[4] };
        // The canvas keeps oklch()/oklab()/lab()/color() as written, so paint a pixel and read its sRGB value.
        else if (/^(?:oklch|oklab|lch|lab|hwb|color)\(/i.test(normalized)) {
          context.clearRect(0, 0, 1, 1);
          context.fillRect(0, 0, 1, 1);
          const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
          result = { r, g, b, a: Math.round(alpha / 255 * 1000) / 1000 };
        }
      }
      cache.set(key, result);
      if (cache.size > 512) cache.delete(cache.keys().next().value);
      return result;
    } catch {
      return null;
    }
  }

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const linear = (channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (color) => color ? 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b) : 0;
  const saturation = (color) => color ? (Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b)) / 255 : 0;
  const contrastRatio = (left, right) => {
    const a = luminance(typeof left === 'string' ? parse(left) : left);
    const b = luminance(typeof right === 'string' ? parse(right) : right);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const rgba = (color) => color.a < 0.999 ? `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.round(color.a * 1000) / 1000})` : `rgb(${color.r}, ${color.g}, ${color.b})`;

  function mix(left, right, amount) {
    const a = parse(left);
    const b = parse(right);
    if (!a || !b) return right || left;
    const t = clamp(amount);
    return rgba({
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
      a: a.a + (b.a - a.a) * t,
    });
  }

  function composite(foregroundColor, backgroundColor) {
    const fg = typeof foregroundColor === 'string' ? parse(foregroundColor) : foregroundColor;
    const bg = typeof backgroundColor === 'string' ? parse(backgroundColor) : backgroundColor;
    if (!fg) return bg;
    if (!bg || fg.a >= 0.999) return { ...fg, a: 1 };
    const fa = clamp(fg.a), ba = clamp(bg.a);
    const a = fa + ba * (1 - fa);
    if (a <= 0.001) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: Math.round((fg.r * fa + bg.r * ba * (1 - fa)) / a),
      g: Math.round((fg.g * fa + bg.g * ba * (1 - fa)) / a),
      b: Math.round((fg.b * fa + bg.b * ba * (1 - fa)) / a),
      a,
    };
  }

  function effectiveBackground(value, fallback) {
    const source = parse(value);
    const base = parse(fallback);
    if (!source) return fallback;
    if (source.a >= 0.999) return rgba(source);
    return rgba(composite(source, base || parse('#000000')));
  }

  function background(value, theme, parentBackground = theme.page) {
    let source = parse(value);
    if (!source || source.a < 0.08) return value;
    // A translucent layer (an overlay scrim, a hover tint) is matched as it looks over its parent but keeps
    // its own transparency, so the page under it stays visible.
    const alpha = source.a;
    if (alpha < 0.999) source = composite(source, parse(parentBackground) || parse(theme.page));
    const keepAlpha = (color) => { if (alpha >= 0.999) return color; const parsed = parse(color); return parsed ? rgba({ ...parsed, a: alpha }) : color; };
    const l = luminance(source);
    const sat = saturation(source);
    const low = parse(theme.page);
    const high = parse(theme.overlay || theme.raised || theme.surface);
    if (!low || !high) return keepAlpha(theme.surface);
    const sourceDepth = clamp((l - 0.08) / 0.92);
    // Keep structural depth visible even in very dark/high-contrast palettes.
    const depth = 0.28 + sourceDepth * 0.66;
    const neutralTarget = mix(theme.page, theme.overlay || theme.raised || theme.surface, depth);
    // Structural backgrounds belong to the selected palette. Source saturation is
    // useful for recognizing hierarchy, but must not tint whole interfaces toward the site's
    // brand color. Semantic color is preserved by foreground/status/artwork paths instead.
    if (sat < 0.12) return keepAlpha(neutralTarget);
    const chromaLift = clamp(sat * 0.12, 0.02, 0.08);
    return keepAlpha(mix(neutralTarget, theme.raised || theme.surface, chromaLift));
  }

  function ensureContrast(candidate, backgroundValue, theme, minimum = 4.5) {
    const bg = parse(backgroundValue);
    let fg = parse(candidate);
    if (!bg || !fg || contrastRatio(fg, bg) >= minimum) return candidate;
    const light = parse(theme.text || '#ffffff');
    const dark = parse(theme.page || '#000000');
    const lightRatio = light ? contrastRatio(light, bg) : 0;
    const darkRatio = dark ? contrastRatio(dark, bg) : 0;
    let target = lightRatio >= darkRatio ? theme.text : theme.page;
    if (!parse(target)) return candidate;
    // A colored fill the site keeps (a blue banner) can sit where neither palette end reaches the minimum;
    // plain white or black is the furthest any text can go.
    if (Math.max(lightRatio, darkRatio) < minimum) target = contrastRatio(parse('#ffffff'), bg) >= contrastRatio(parse('#000000'), bg) ? '#ffffff' : '#000000';
    let best = target;
    for (let step = 1; step <= 10; step += 1) {
      const mixed = mix(candidate, target, step / 10);
      best = mixed;
      if (contrastRatio(mixed, bg) >= minimum) break;
    }
    return best;
  }

  function foreground(value, theme, backgroundValue = theme.page, minimum = 4.5) {
    const source = parse(value);
    if (!source || source.a < 0.08) return value;
    const l = luminance(source);
    const sat = saturation(source);
    const candidate = sat > 0.2 && l > 0.08
      ? mix(theme.muted, rgba({ ...source, a: 1 }), Math.min(0.38, sat * 0.42))
      : (l < 0.5 ? theme.text : mix(theme.text, theme.muted, 0.22));
    return ensureContrast(candidate, backgroundValue, theme, minimum);
  }

  function border(value, theme) {
    const source = parse(value);
    if (!source || source.a < 0.08) return value;
    const sat = saturation(source);
    // Ordinary borders reinforce theme hierarchy instead of carrying the source site's hue.
    // Accent/status borders are handled by semantic host CSS and protected status elements.
    return sat > 0.2 ? mix(theme.raised, theme.muted, 0.58) : mix(theme.raised, theme.muted, 0.48);
  }

  function transform(value, role, theme, backgroundValue) {
    const key = [theme.id || theme.page, theme.accent, role, String(value).toLowerCase(), backgroundValue || ''].join('|');
    if (transformCache.has(key)) return transformCache.get(key);
    const result = role === 'background'
      ? background(value, theme, backgroundValue || theme.page)
      : role === 'foreground'
        ? foreground(value, theme, backgroundValue || theme.page)
        : border(value, theme);
    transformCache.set(key, result);
    if (transformCache.size > 2048) transformCache.delete(transformCache.keys().next().value);
    return result;
  }


  return Object.freeze({parse,rgba,luminance,saturation,contrastRatio,mix,composite,effectiveBackground,background,foreground,border,transform,ensureContrast});
})();
