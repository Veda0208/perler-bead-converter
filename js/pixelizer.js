/**
 * 图片像素化核心算法
 * 将上传的图片中心裁剪为正方形后缩放到像素风格
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
   * 中心裁剪为正方形
   * 取图片中心最大的正方形区域
   */
  function cropToSquare(img) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const size = Math.min(w, h);
    const sx = (w - size) / 2;
    const sy = (h - size) / 2;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = size;
    cropCanvas.height = size;
    const ctx = cropCanvas.getContext('2d');
    ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
    return cropCanvas;
  }

  /**
   * 核心：将图片中心裁剪为正方形后像素化
   * @param {HTMLImageElement} img - 原始图片
   * @param {number} pixelCount - 目标像素数（N×N 正方形）
   * @returns {{ pixels: number[][], width: number, height: number }} 二维数组
   */
  function pixelate(img, pixelCount) {
    // 先裁成正方形
    const square = cropToSquare(img);

    // 缩小到目标像素尺寸
    const shrinkCanvas = document.createElement('canvas');
    shrinkCanvas.width = pixelCount;
    shrinkCanvas.height = pixelCount;
    const shrinkCtx = shrinkCanvas.getContext('2d');
    shrinkCtx.imageSmoothingEnabled = true;
    shrinkCtx.drawImage(square, 0, 0, pixelCount, pixelCount);

    // 读取像素数据
    const imageData = shrinkCtx.getImageData(0, 0, pixelCount, pixelCount);
    const data = imageData.data;

    // 组装二维数组
    const pixels = [];
    for (let y = 0; y < pixelCount; y++) {
      const row = [];
      for (let x = 0; x < pixelCount; x++) {
        const idx = (y * pixelCount + x) * 4;
        row.push([data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]);
      }
      pixels.push(row);
    }

    return { pixels, width: pixelCount, height: pixelCount };
  }

  return { loadImage, pixelate };
})();
