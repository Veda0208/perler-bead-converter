/**
 * 颜色匹配引擎
 * 将像素 RGB 值映射到最近的 Hama 色号
 * 使用加权欧几里得距离（考虑人眼对不同颜色的感知差异）
 */
const ColorMatcher = (() => {

  /**
   * 预计算：从色号表构建快速查找结构
   */
  function buildColorMap(palette) {
    return palette.map(c => ({
      ...c,
      // 预存，避免运行时重复访问
    }));
  }

  /**
   * 计算两个 RGB 颜色的感知距离
   * 使用加权欧几里得距离：
   * - 人眼对绿色最敏感（权重最高）
   * - 对蓝色变化不太敏感（权重较低）
   * - 红色均值补偿（处理暗/亮色域的感知差异）
   *
   * 参考：基于 CIE 1931 观察者感知的简化模型
   */
  function colorDistance(r1, g1, b1, r2, g2, b2) {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;

    // 红均值加权：在暗色或亮色区域调整距离感知
    const rMean = (r1 + r2) / 2;

    // 加权分量：人有 ~65% 绿色感知、~30% 红色、~10% 蓝色
    // 简化为：绿 4、红 2、蓝 1.5，加上红均值补偿
    const wR = 2 + (rMean / 256);
    const wG = 4.0;
    const wB = 2 + ((255 - rMean) / 256);

    return Math.sqrt(wR * dr * dr + wG * dg * dg + wB * db * db);
  }

  /**
   * 为单个像素找到最佳匹配色号
   * @param {number} r - 红色通道 (0-255)
   * @param {number} g - 绿色通道 (0-255)
   * @param {number} b - 蓝色通道 (0-255)
   * @param {number} a - 透明度 (0-255)，a < 128 时视为透明
   * @param {Array} colorMap - 预计算的色号表
   * @returns {{ code, name, nameEn, hex, rgb, distance }} 最佳匹配
   */
  function matchPixel(r, g, b, a, colorMap) {
    // 透明或半透明像素 → 跳过（标记为不匹配）
    if (a < 64) {
      return null;
    }

    let bestMatch = null;
    let bestDist = Infinity;

    for (const color of colorMap) {
      const [cr, cg, cb] = color.rgb;
      const dist = colorDistance(r, g, b, cr, cg, cb);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = color;
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

  /**
   * 批量匹配像素矩阵
   * @param {number[][][]} pixels - 二维像素数组 [y][x] = [r,g,b,a]
   * @param {Array} palette - 色号表
   * @returns {{ matrix: Array, stats: Map }}
   *   - matrix: 二维匹配结果 [y][x] = {code, name, hex, rgb}
   *   - stats: Map<code, {color, count}>
   */
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
            statsMap.set(match.code, {
              color: match,
              count: 1,
            });
          }
        }
      }
      matrix.push(row);
    }

    return { matrix, stats: statsMap };
  }

  /**
   * 获取指定色号的 RGB 十六进制字符串（用于 Canvas 填充）
   */
  function hexFromCode(code, palette) {
    const color = palette.find(c => c.code === code);
    return color ? color.hex : '#808080';
  }

  return { matchPixel, matchMatrix, hexFromCode, colorDistance };
})();
