/**
 * 图片像素化核心算法
 * 将上传的图片按目标像素粒度缩放到像素风格
 */
const Pixelizer = (() => {

  /**
   * 从 File 对象加载为 HTMLImageElement
   */
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('请上传图片文件'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 计算等比例缩放后的尺寸（保持宽高比，以较大边为准）
   * @returns {{ width: number, height: number }}
   */
  function calcFitSize(imgW, imgH, pixelCount) {
    const ratio = imgW / imgH;
    let w, h;
    if (ratio >= 1) {
      // 横图或正方形
      w = pixelCount;
      h = Math.round(pixelCount / ratio);
    } else {
      // 竖图
      h = pixelCount;
      w = Math.round(pixelCount * ratio);
    }
    // 确保至少 1 像素
    return { width: Math.max(1, w), height: Math.max(1, h) };
  }

  /**
   * 核心：将图片像素化，返回每个像素的 RGBA 数组
   * @param {HTMLImageElement} img - 原始图片
   * @param {number} pixelCount - 较长边的像素数（如 32 表示 32x???）
   * @returns {{ pixels: number[][], width: number, height: number }} 二维数组
   */
  function pixelate(img, pixelCount) {
    const { width: pw, height: ph } = calcFitSize(img.naturalWidth, img.naturalHeight, pixelCount);

    // Step 1: 缩小 → 用离屏 canvas 缩小到目标像素尺寸
    const shrinkCanvas = document.createElement('canvas');
    shrinkCanvas.width = pw;
    shrinkCanvas.height = ph;
    const shrinkCtx = shrinkCanvas.getContext('2d');
    shrinkCtx.imageSmoothingEnabled = true;  // 缩小时用平滑，保留色彩信息
    shrinkCtx.drawImage(img, 0, 0, pw, ph);

    // 读取缩小后的像素数据
    const imageData = shrinkCtx.getImageData(0, 0, pw, ph);
    const data = imageData.data;

    // Step 2: 组装二维数组
    const pixels = [];
    for (let y = 0; y < ph; y++) {
      const row = [];
      for (let x = 0; x < pw; x++) {
        const idx = (y * pw + x) * 4;
        row.push([data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]);
      }
      pixels.push(row);
    }

    return { pixels, width: pw, height: ph };
  }

  return { loadImage, pixelate, calcFitSize };
})();
