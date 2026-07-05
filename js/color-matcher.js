/**
 * 颜色匹配引擎 — CIEDE2000 版
 * RGB → sRGB Linear → XYZ (D65) → CIELAB → ΔE00
 * 这是 ISO 标准色差公式，最贴近人眼感知
 */
const ColorMatcher = (() => {

  // ===================== 色彩空间转换 =====================

  /** sRGB gamma 解码 → 线性 RGB */
  function srgbToLinear(c) {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  /** 线性 RGB → XYZ (D65 illuminant, sRGB primaries) */
  function linearRgbToXyz(r, g, b) {
    return {
      x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
      y: r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
      z: r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
    };
  }

  /** XYZ → CIELAB (D65 reference white) */
  function xyzToLab(x, y, z) {
    // D65 参考白
    const xn = 0.95047, yn = 1.00000, zn = 1.08883;

    function f(t) {
      const delta = 6 / 29;
      return t > delta * delta * delta
        ? Math.cbrt(t)
        : t / (3 * delta * delta) + 4 / 29;
    }

    const fx = f(x / xn);
    const fy = f(y / yn);
    const fz = f(z / zn);

    return {
      L: 116 * fy - 16,
      a: 500 * (fx - fy),
      b: 200 * (fy - fz),
    };
  }

  /** RGB(0-255) → CIELAB（合并调用） */
  function rgbToLab(r, g, b) {
    const rl = srgbToLinear(r);
    const gl = srgbToLinear(g);
    const bl = srgbToLinear(b);
    const { x, y, z } = linearRgbToXyz(rl, gl, bl);
    return xyzToLab(x, y, z);
  }

  // ===================== CIEDE2000 ΔE00 =====================

  /**
   * CIEDE2000 色差公式
   * 返回 ΔE00 值（越小越接近），约 1.0 为人眼刚好可分辨的差异
   * 参考: ISO/CIE 11664-6:2014
   */
  function ciede2000(L1, a1, b1, L2, a2, b2) {
    const kL = 1, kC = 1, kH = 1; // 默认权重

    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cbar = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));

    const a1p = a1 * (1 + G);
    const a2p = a2 * (1 + G);

    const C1p = Math.sqrt(a1p * a1p + b1 * b1);
    const C2p = Math.sqrt(a2p * a2p + b2 * b2);
    const CbarP = (C1p + C2p) / 2;

    let h1p = Math.atan2(b1, a1p) * (180 / Math.PI);
    if (h1p < 0) h1p += 360;
    let h2p = Math.atan2(b2, a2p) * (180 / Math.PI);
    if (h2p < 0) h2p += 360;

    const HbarP = Math.abs(h1p - h2p) > 180
      ? (h1p + h2p + 360) / 2
      : (h1p + h2p) / 2;

    const T = 1 - 0.17 * Math.cos((HbarP - 30) * Math.PI / 180)
                + 0.24 * Math.cos(2 * HbarP * Math.PI / 180)
                + 0.32 * Math.cos((3 * HbarP + 6) * Math.PI / 180)
                - 0.20 * Math.cos((4 * HbarP - 63) * Math.PI / 180);

    let dHp = h2p - h1p;
    if (Math.abs(dHp) > 180) {
      dHp = h2p <= h1p ? dHp + 360 : dHp - 360;
    }
    const dHpAbs = 2 * Math.sqrt(C1p * C2p) * Math.sin((dHp * Math.PI / 180) / 2);

    const dLp = L2 - L1;
    const dCp = C2p - C1p;

    const Lbar = (L1 + L2) / 2;

    const SL = 1 + (0.015 * (Lbar - 50) * (Lbar - 50)) / Math.sqrt(20 + (Lbar - 50) * (Lbar - 50));

    const SC = 1 + 0.045 * CbarP;
    const SH = 1 + 0.015 * CbarP * T;

    const dTheta = 30 * Math.exp(-Math.pow((HbarP - 275) / 25, 2));
    const RC = 2 * Math.sqrt(Math.pow(CbarP, 7) / (Math.pow(CbarP, 7) + Math.pow(25, 7)));

    const RT = -RC * Math.sin(2 * dTheta * Math.PI / 180);

    const term1 = dLp / (kL * SL);
    const term2 = dCp / (kC * SC);
    const term3 = dHpAbs / (kH * SH);
    const term4 = RT * term2 * term3;

    return Math.sqrt(term1 * term1 + term2 * term2 + term3 * term3 + term4);
  }

  // ===================== 匹配逻辑 =====================

  /** 预计算色号表的 CIELAB 值 */
  function buildColorMap(palette) {
    return palette.map(c => ({
      ...c,
      lab: rgbToLab(c.rgb[0], c.rgb[1], c.rgb[2]),
    }));
  }

  function matchPixel(r, g, b, a, colorMap) {
    if (a < 64) return null;

    const lab = rgbToLab(r, g, b);

    let bestMatch = null;
    let bestDist = Infinity;

    for (const color of colorMap) {
      const dist = ciede2000(lab.L, lab.a, lab.b, color.lab.L, color.lab.a, color.lab.b);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = color;
        if (dist < 0.5) break; // 差距极小，提前退出
      }
    }

    return {
      code: bestMatch.code,
      name: bestMatch.name,
      nameEn: bestMatch.nameEn,
      hex: bestMatch.hex,
      rgb: bestMatch.rgb,
      distance: Math.round(bestDist * 100) / 100,
    };
  }

  function matchMatrix(pixels, palette) {
    const colorMap = buildColorMap(palette);
    const matrix = [];
    const statsMap = new Map();

    for (let y = 0; y < pixels.length; y++) {
      const row = [];
      for (let x = 0; x < pixels[y].length; x++) {
        const [r, g, b, a] = pixels[y][x];
        const match = matchPixel(r, g, b, a, colorMap);
        row.push(match);

        if (match) {
          const existing = statsMap.get(match.code);
          if (existing) {
            existing.count++;
          } else {
            statsMap.set(match.code, { color: match, count: 1 });
          }
        }
      }
      matrix.push(row);
    }

    return { matrix, stats: statsMap };
  }

  function hexFromCode(code, palette) {
    const color = palette.find(c => c.code === code);
    return color ? color.hex : '#808080';
  }

  return { matchPixel, matchMatrix, hexFromCode, rgbToLab };
})();
