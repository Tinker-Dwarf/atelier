import {
  contrastGrade,
  contrastRatio,
  formatHsl,
  formatRgb,
  hexToHsl,
  hexToRgb,
} from "./color";
import { HARMONY_LABELS, ROLE_HINTS, type Harmony, type Swatch } from "./harmonies";
import { TEXTURE_LABELS } from "./textures";

export interface BrandKit {
  name: string;
  harmony: Harmony;
  swatches: Swatch[];
  created: string;
}

function tokenName(role: string): string {
  return role.toLowerCase();
}

export function toCssVariables(kit: BrandKit): string {
  const lines = kit.swatches.flatMap((swatch) => {
    const name = tokenName(swatch.role);
    const rgb = hexToRgb(swatch.hex);
    const hsl = hexToHsl(swatch.hex);
    return [
      `  --color-${name}: ${swatch.hex};`,
      `  --color-${name}-rgb: ${rgb.r} ${rgb.g} ${rgb.b};`,
      `  --color-${name}-hsl: ${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%;`,
      `  --texture-${name}: ${swatch.texture};`,
    ];
  });
  return `:root {\n  --brand-name: "${kit.name}";\n${lines.join("\n")}\n}\n`;
}

export function toTailwindTheme(kit: BrandKit): string {
  const lines = kit.swatches.map((swatch) => {
    const name = tokenName(swatch.role);
    return `    --color-${name}: ${swatch.hex};`;
  });
  return `@theme {\n${lines.join("\n")}\n}\n`;
}

export function toJson(kit: BrandKit): string {
  const body = {
    name: kit.name,
    version: "1.0",
    kind: "atelier.brand-standard",
    harmony: kit.harmony,
    created: kit.created,
    usage:
      "Canonical brand style for new apps and documents. Map Paper to backgrounds, Ink to text, Accent to primary actions, Surface to raised panels, Mark to highlights.",
    colors: kit.swatches.map((swatch) => ({
      role: swatch.role,
      hint: ROLE_HINTS[swatch.role],
      hex: swatch.hex,
      rgb: formatRgb(swatch.hex),
      hsl: formatHsl(swatch.hex),
      texture: swatch.texture,
      textureLabel: TEXTURE_LABELS[swatch.texture],
    })),
    contrast: contrastMatrix(kit.swatches),
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

export function toMarkdown(kit: BrandKit): string {
  const rows = kit.swatches
    .map((s) => {
      const rgb = formatRgb(s.hex);
      const hsl = formatHsl(s.hex);
      return `| ${s.role} | ${ROLE_HINTS[s.role]} | \`${s.hex}\` | \`${rgb}\` | \`${hsl}\` | ${TEXTURE_LABELS[s.texture]} |`;
    })
    .join("\n");
  const paper = kit.swatches[0]!;
  const ink = kit.swatches[1]!;
  const ratio = contrastRatio(paper.hex, ink.hex).toFixed(2);
  return `# ${kit.name} — Brand Style Standard

This document is the canonical brand style for new apps and documents.

- Harmony: ${HARMONY_LABELS[kit.harmony]}
- Issued: ${kit.created}
- Ink on Paper contrast: ${ratio}:1 (${contrastGrade(contrastRatio(paper.hex, ink.hex))})

## Color & texture

| Role | Use | Hex | RGB | HSL | Texture |
| --- | --- | --- | --- | --- | --- |
${rows}

## Rules

1. Paper is the page. Never set body text on Accent without a contrast check.
2. Ink is the default text color. Keep body copy at 4.5:1 or better against Paper.
3. Accent is reserved for primary actions and the brand mark — not large fills.
4. Surface sits one step off Paper for cards, tables, and raised panels.
5. Mark is for rules, highlights, and secondary emphasis.
6. Textures are overlays, not replacements. Keep them quiet in UI chrome; allow more presence in print and packaging.

## CSS tokens

\`\`\`css
${toCssVariables(kit).trim()}
\`\`\`

## Tailwind v4

\`\`\`css
${toTailwindTheme(kit).trim()}
\`\`\`
`;
}

function contrastMatrix(swatches: Swatch[]) {
  const texts = [
    { name: "White", hex: "#ffffff" },
    { name: "Black", hex: "#000000" },
    { name: "Ink", hex: swatches[1]?.hex ?? "#111111" },
    { name: "Paper", hex: swatches[0]?.hex ?? "#f4f1ea" },
  ];
  return swatches.map((swatch) => ({
    role: swatch.role,
    hex: swatch.hex,
    against: texts.map((text) => {
      const ratio = contrastRatio(swatch.hex, text.hex);
      return {
        text: text.name,
        ratio: Number(ratio.toFixed(2)),
        grade: contrastGrade(ratio),
        body: ratio >= 4.5,
        large: ratio >= 3,
      };
    }),
  }));
}

export function toSvgStrip(kit: BrandKit): string {
  const width = 1200;
  const height = 420;
  const gap = 12;
  const pad = 36;
  const chipW = (width - pad * 2 - gap * 4) / 5;
  const chips = kit.swatches
    .map((swatch, i) => {
      const x = pad + i * (chipW + gap);
      const fg = swatch.role === "Paper" || swatch.role === "Surface" ? "#161513" : "#f4f1ea";
      const paperLuma = swatch.hex.toLowerCase();
      const inkOn = ["#f3efe6", "#e4ddd0", "#f4f1ea"].includes(paperLuma);
      const label = inkOn || swatch.role === "Paper" || swatch.role === "Surface" ? "#161513" : fg;
      return `<g>
  <rect x="${x}" y="96" width="${chipW}" height="252" rx="10" fill="${swatch.hex}"/>
  <text x="${x + 18}" y="318" fill="${label}" font-size="13" font-family="ui-sans-serif, system-ui" letter-spacing="0.16em">${swatch.role.toUpperCase()}</text>
  <text x="${x + 18}" y="338" fill="${label}" font-size="13" font-family="ui-monospace, monospace">${swatch.hex}</text>
</g>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#0c0c0b"/>
  <text x="${pad}" y="48" fill="#f4f1ea" font-size="22" font-family="ui-serif, Georgia, serif">${escapeXml(kit.name)}</text>
  <text x="${pad}" y="70" fill="#9a958c" font-size="12" font-family="ui-sans-serif, system-ui" letter-spacing="0.18em">BRAND STYLE STANDARD</text>
  ${chips}
</svg>
`;
}

export function toBrandBookHtml(kit: BrandKit): string {
  const paper = kit.swatches[0]!;
  const ink = kit.swatches[1]!;
  const accent = kit.swatches[2]!;
  const surface = kit.swatches[3]!;
  const mark = kit.swatches[4]!;
  const chips = kit.swatches
    .map((s) => {
      const ratioW = contrastRatio(s.hex, "#ffffff");
      const ratioK = contrastRatio(s.hex, "#000000");
      const fg = ratioW >= ratioK ? "#ffffff" : "#111111";
      return `<article class="chip" style="background:${s.hex};color:${fg}">
        <header>
          <span class="role">${s.role}</span>
          <span class="tex">${TEXTURE_LABELS[s.texture]}</span>
        </header>
        <p class="hint">${ROLE_HINTS[s.role]}</p>
        <dl>
          <div><dt>Hex</dt><dd>${s.hex}</dd></div>
          <div><dt>RGB</dt><dd>${formatRgb(s.hex)}</dd></div>
          <div><dt>HSL</dt><dd>${formatHsl(s.hex)}</dd></div>
        </dl>
      </article>`;
    })
    .join("");

  const rows = kit.swatches
    .map((s) => {
      const cells = [
        { name: "White", hex: "#ffffff" },
        { name: "Black", hex: "#000000" },
        { name: "Ink", hex: ink.hex },
        { name: "Paper", hex: paper.hex },
      ]
        .map((t) => {
          const r = contrastRatio(s.hex, t.hex);
          const g = contrastGrade(r);
          return `<td><strong>${r.toFixed(2)}</strong><span class="grade ${g === "Fail" ? "fail" : "ok"}">${g}</span></td>`;
        })
        .join("");
      return `<tr><th>${s.role}</th>${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeXml(kit.name)} — Brand Style Standard</title>
  <style>
    :root {
      --paper: ${paper.hex};
      --ink: ${ink.hex};
      --accent: ${accent.hex};
      --surface: ${surface.hex};
      --mark: ${mark.hex};
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--paper); color: var(--ink); }
    body { font: 16px/1.5 "Iowan Old Style", "Palatino Linotype", Palatino, serif; }
    header.hero { padding: 64px 48px 40px; border-bottom: 1px solid color-mix(in oklab, var(--ink) 12%, transparent); }
    .kicker { letter-spacing: 0.22em; text-transform: uppercase; font: 600 11px/1 ui-sans-serif, system-ui; color: var(--mark); }
    h1 { font-weight: 500; font-size: clamp(2.4rem, 5vw, 4rem); letter-spacing: -0.03em; margin: 12px 0 8px; }
    .lede { max-width: 62ch; color: color-mix(in oklab, var(--ink) 78%, var(--paper)); }
    main { padding: 40px 48px 80px; display: grid; gap: 48px; }
    h2 { font-size: 1.15rem; letter-spacing: -0.02em; margin: 0 0 16px; }
    .chips { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
    .chip { min-height: 220px; border-radius: 18px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; }
    .role { font: 600 11px/1 ui-sans-serif, system-ui; letter-spacing: 0.18em; text-transform: uppercase; }
    .tex { font: 12px/1 ui-sans-serif, system-ui; opacity: 0.8; }
    header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .hint { margin: 24px 0 0; font-size: 0.95rem; }
    dl { margin: 16px 0 0; display: grid; gap: 6px; font: 12px/1.35 ui-monospace, SFMono-Regular, monospace; }
    dt { opacity: 0.7; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; }
    dd { margin: 0; }
    table { width: 100%; border-collapse: collapse; font: 14px/1.4 ui-sans-serif, system-ui; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid color-mix(in oklab, var(--ink) 12%, transparent); vertical-align: top; }
    .grade { display: inline-block; margin-left: 8px; font-size: 10px; letter-spacing: 0.08em; }
    .ok { color: var(--accent); }
    .fail { color: #9b2c2c; }
    pre { background: var(--surface); padding: 20px; border-radius: 16px; overflow: auto; font: 12px/1.45 ui-monospace, SFMono-Regular, monospace; }
    .rules { display: grid; gap: 10px; max-width: 70ch; }
    .rules li { padding-left: 4px; }
    .specimen { background: var(--surface); border-radius: 24px; padding: 32px; }
    .specimen h3 { margin: 0 0 8px; font-size: 1.8rem; letter-spacing: -0.03em; }
    .btn { display: inline-flex; margin-top: 16px; background: var(--accent); color: ${contrastRatio(accent.hex, "#ffffff") >= 4.5 ? "#fff" : paper.hex}; border: 0; padding: 10px 16px; border-radius: 999px; font: 600 13px/1 ui-sans-serif, system-ui; }
    footer { padding: 24px 48px 48px; font: 12px/1.4 ui-sans-serif, system-ui; color: color-mix(in oklab, var(--ink) 55%, var(--paper)); }
    @media (max-width: 900px) {
      header.hero, main, footer { padding-left: 20px; padding-right: 20px; }
      .chips { grid-template-columns: 1fr; }
    }
    @media print {
      header.hero { padding-top: 24px; }
      .chip { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header class="hero">
    <div class="kicker">Brand Style Standard</div>
    <h1>${escapeXml(kit.name)}</h1>
    <p class="lede">Canonical color and texture system for every new app and document. Harmony: ${HARMONY_LABELS[kit.harmony]}. Issued ${escapeXml(kit.created)}.</p>
  </header>
  <main>
    <section>
      <h2>Palette</h2>
      <div class="chips">${chips}</div>
    </section>
    <section class="specimen">
      <h3>${escapeXml(kit.name)}</h3>
      <p>Body copy sits in Ink on Paper. Secondary surfaces use Surface. Accent is reserved for the primary action — never for large fields of UI chrome.</p>
      <button class="btn" type="button">Primary action</button>
    </section>
    <section>
      <h2>Contrast against text colors</h2>
      <table>
        <thead><tr><th>Swatch</th><th>White</th><th>Black</th><th>Ink</th><th>Paper</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
    <section>
      <h2>Usage rules</h2>
      <ol class="rules">
        <li>Paper is the page background for screens and documents.</li>
        <li>Ink is the default text color. Maintain at least 4.5:1 against Paper for body copy (this kit: ${contrastRatio(paper.hex, ink.hex).toFixed(2)}:1).</li>
        <li>Accent is the primary interactive color and the brand mark.</li>
        <li>Surface is one step off Paper for cards, tables, and raised panels.</li>
        <li>Mark is for rules, highlights, and secondary emphasis.</li>
        <li>Textures overlay color; they do not replace it. Keep UI textures quiet.</li>
      </ol>
    </section>
    <section>
      <h2>CSS tokens</h2>
      <pre>${escapeXml(toCssVariables(kit).trim())}</pre>
    </section>
  </main>
  <footer>Generated by Atelier · Brand Style Standard v1.0</footer>
</body>
</html>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;");
}

export function downloadText(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "brand";
}
