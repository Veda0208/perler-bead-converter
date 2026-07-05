/**
 * 拼豆图纸转换器 - 主应用逻辑
 */
const App = (() => {
  // ============ 状态 ============
  let currentImage = null;
  let currentPixels = null;
  let currentMatchResult = null;
  let currentPixelCount = 32;
  let displayScale = 1.5;  // 显示缩放：0.5/1/1.5/2/2.5/3

  // ============ DOM 元素 ============
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const uploadPreview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const controls = document.getElementById('controls');
  const pixelCountSlider = document.getElementById('pixelCount');
  const pixelCountValue = document.getElementById('pixelCountValue');
  const showGridCheck = document.getElementById('showGrid');
  const showLabelsCheck = document.getElementById('showLabels');
  const outputCanvas = document.getElementById('outputCanvas');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const statsList = document.getElementById('statsList');
  const totalBeads = document.getElementById('totalBeads');
  const totalColors = document.getElementById('totalColors');
  const btnExport = document.getElementById('btnExport');
  const btnCopy = document.getElementById('btnCopy');
  const emptyState = document.getElementById('emptyState');
  const resultArea = document.getElementById('resultArea');
  const zoomValue = document.getElementById('zoomValue');
  const zoomMinus = document.getElementById('zoomMinus');
  const zoomPlus = document.getElementById('zoomPlus');
  const exportModal = document.getElementById('exportModal');
  const exportImage = document.getElementById('exportImage');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // ============ 初始化 ============
  function init() {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    pixelCountSlider.addEventListener('input', handlePixelCountChange);
    showGridCheck.addEventListener('change', rerender);
    showLabelsCheck.addEventListener('change', rerender);

    btnExport.addEventListener('click', exportPNG);
    btnCopy.addEventListener('click', copyStats);

    // 缩放控制
    zoomMinus.addEventListener('click', () => changeZoom(-0.5));
    zoomPlus.addEventListener('click', () => changeZoom(+0.5));

    // 导出弹窗关闭
    btnCloseModal.addEventListener('click', () => exportModal.classList.add('hidden'));
    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) exportModal.classList.add('hidden');
    });

    // 预设粒度按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pixelCountSlider.value = btn.dataset.size;
        pixelCountValue.textContent = btn.dataset.size;
        updatePresetActive(parseInt(btn.dataset.size));
        handlePixelCountChange();
      });
    });
  }

  function updatePresetActive(size) {
    document.querySelectorAll('.preset-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.size) === size);
    });
  }

  function changeZoom(delta) {
    displayScale = Math.max(0.5, Math.min(3, displayScale + delta));
    zoomValue.textContent = displayScale.toFixed(1) + '×';
    rerender();
  }

  // ============ 文件处理 ============
  function handleDragOver(e) {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.add('dragover');
  }
  function handleDragLeave(e) {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.remove('dragover');
  }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  async function processFile(file) {
    try {
      const img = await Pixelizer.loadImage(file);
      currentImage = img;
      previewImg.src = URL.createObjectURL(file);
      uploadPlaceholder.classList.add('hidden');
      uploadPreview.classList.remove('hidden');
      controls.classList.remove('hidden');
      resultArea.classList.remove('hidden');
      emptyState.classList.add('hidden');
      await repixelate();
    } catch (err) {
      alert('图片处理失败：' + err.message);
      console.error(err);
    }
  }

  // ============ 像素化 + 匹配 ============
  async function repixelate() {
    if (!currentImage) return;
    currentPixels = Pixelizer.pixelate(currentImage, currentPixelCount);
    currentMatchResult = ColorMatcher.matchMatrix(currentPixels.pixels, MARD_PALETTE);
    renderAll();
  }

  function handlePixelCountChange() {
    currentPixelCount = parseInt(pixelCountSlider.value);
    pixelCountValue.textContent = currentPixelCount;
    updatePresetActive(currentPixelCount);
    repixelate();
  }

  // ============ 渲染 ============
  function renderAll() {
    renderCanvas();
    renderStats();
  }

  function rerender() {
    if (currentMatchResult) renderCanvas();
  }

  function renderCanvas() {
    const { matrix } = currentMatchResult;
    const N = matrix.length; // 正方形
    const showGrid = showGridCheck.checked;
    const showLabels = showLabelsCheck.checked;

    // 基础单元格大小：屏幕越大格子越大，上限 24px（保证画布不溢出太多）
    // 自适应：手机屏幕约 375px，减去内边距可用 ~340px
    const avail = Math.min(window.innerWidth - 60, 650);
    const baseCell = Math.max(4, Math.min(24, Math.floor(avail / N)));
    const cellSize = baseCell * displayScale;
    const canvasSize = N * cellSize;

    outputCanvas.width = canvasSize;
    outputCanvas.height = canvasSize;
    outputCanvas.style.width = canvasSize + 'px';
    outputCanvas.style.height = canvasSize + 'px';

    const ctx = outputCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // 绘制色块
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const match = matrix[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        ctx.fillStyle = match ? match.hex : (((x + y) % 2 === 0) ? '#FFFFFF' : '#E0E0E0');
        ctx.fillRect(px, py, cellSize, cellSize);

        if (showGrid && cellSize > 4) {
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }
      }
    }

    // 色号标签（单元格达到 16px 才显示，保证可读）
    if (showLabels && cellSize >= 16) {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const match = matrix[y][x];
          if (!match) continue;

          const px = x * cellSize;
          const py = y * cellSize;
          const cx = px + cellSize / 2;
          const cy = py + cellSize / 2;

          const [cr, cg, cb] = match.rgb;
          const lum = 0.299 * cr + 0.587 * cg + 0.114 * cb;

          // 字体大小自适应
          const fontSize = Math.max(9, Math.min(14, cellSize * 0.45));
          ctx.font = `bold ${fontSize}px "Segoe UI", "PingFang SC", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 文字描边
          ctx.strokeStyle = lum > 140 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)';
          ctx.lineWidth = Math.max(1.5, cellSize * 0.1);
          ctx.strokeText(match.code, cx, cy);

          ctx.fillStyle = lum > 140 ? '#111' : '#FFF';
          ctx.fillText(match.code, cx, cy);
        }
      }
    }
  }

  function renderStats() {
    const { stats } = currentMatchResult;
    const sorted = [...stats.entries()].sort((a, b) => b[1].count - a[1].count);

    let total = 0;
    statsList.innerHTML = '';

    sorted.forEach(([code, { color, count }]) => {
      total += count;
      const item = document.createElement('div');
      item.className = 'stats-item';
      item.innerHTML = `
        <span class="stats-color" style="background:${color.hex}"></span>
        <span class="stats-code">${code}</span>
        <span class="stats-name">${color.name}</span>
        <span class="stats-count">× ${count}</span>
      `;
      statsList.appendChild(item);
    });

    totalBeads.textContent = total;
    totalColors.textContent = sorted.length;

    if (sorted.length === 0) {
      statsList.innerHTML = '<div class="stats-empty">图片过于透明，无法匹配</div>';
    }
  }

  // ============ 导出（适配手机） ============
  function exportPNG() {
    if (!currentMatchResult) return;

    const { matrix } = currentMatchResult;
    const N = matrix.length;
    const cellSize = 24; // 导出固定 24px/格，每格都很清楚
    const showGrid = showGridCheck.checked;
    const showLabels = showLabelsCheck.checked;

    const expCanvas = document.createElement('canvas');
    expCanvas.width = N * cellSize;
    expCanvas.height = N * cellSize;
    const ctx = expCanvas.getContext('2d');

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const match = matrix[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        ctx.fillStyle = match ? match.hex : '#FFFFFF';
        ctx.fillRect(px, py, cellSize, cellSize);

        if (showGrid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }
      }
    }

    if (showLabels) {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const match = matrix[y][x];
          if (!match) continue;
          const px = x * cellSize;
          const py = y * cellSize;
          const [cr, cg, cb] = match.rgb;
          const lum = 0.299 * cr + 0.587 * cg + 0.114 * cb;

          ctx.fillStyle = lum > 140 ? '#111' : '#FFF';
          ctx.font = 'bold 10px "Segoe UI", "PingFang SC", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.strokeStyle = lum > 140 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 2;
          ctx.strokeText(match.code, px + cellSize / 2, py + cellSize / 2);
          ctx.fillText(match.code, px + cellSize / 2, py + cellSize / 2);
        }
      }
    }

    const dataUrl = expCanvas.toDataURL('image/png');

    // 手机弹窗展示图片，长按保存到相册
    exportImage.src = dataUrl;
    exportModal.classList.remove('hidden');
  }

  function copyStats() {
    if (!currentMatchResult) return;

    const { stats } = currentMatchResult;
    const sorted = [...stats.entries()].sort((a, b) => b[1].count - a[1].count);

    let text = '拼豆色号清单\n';
    text += '══════════════\n';
    text += `尺寸: ${currentMatchResult.matrix.length} × ${currentMatchResult.matrix.length}\n`;
    text += `总颗数: ${sorted.reduce((s, [,v]) => s + v.count, 0)} | 颜色数: ${sorted.length}\n`;
    text += '──────────────────\n';

    sorted.forEach(([code, { color, count }]) => {
      text += `${code}  ${color.name.padEnd(6)} × ${String(count).padStart(4)}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      const orig = btnCopy.textContent;
      btnCopy.textContent = '✅ 已复制！';
      setTimeout(() => { btnCopy.textContent = orig; }, 2000);
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
