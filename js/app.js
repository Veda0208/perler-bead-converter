/**
 * 拼豆图纸转换器 - 主应用逻辑
 */
const App = (() => {
  // ============ 状态 ============
  let currentImage = null;          // 当前上传的原始图片
  let currentPixels = null;        // 像素化后的原始像素数据
  let currentMatchResult = null;   // 颜色匹配结果 { matrix, stats }
  let currentPixelCount = 32;      // 当前像素粒度

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
  const statsList = document.getElementById('statsList');
  const totalBeads = document.getElementById('totalBeads');
  const totalColors = document.getElementById('totalColors');
  const btnExport = document.getElementById('btnExport');
  const btnCopy = document.getElementById('btnCopy');
  const emptyState = document.getElementById('emptyState');
  const resultArea = document.getElementById('resultArea');

  // ============ 初始化 ============
  function init() {
    // 上传事件
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // 控制事件
    pixelCountSlider.addEventListener('input', handlePixelCountChange);
    showGridCheck.addEventListener('change', rerender);
    showLabelsCheck.addEventListener('change', rerender);

    // 按钮事件
    btnExport.addEventListener('click', exportPNG);
    btnCopy.addEventListener('click', copyStats);

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

  // ============ 文件处理 ============
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
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

      // 显示预览缩略图
      previewImg.src = URL.createObjectURL(file);
      uploadPlaceholder.classList.add('hidden');
      uploadPreview.classList.remove('hidden');
      controls.classList.remove('hidden');
      resultArea.classList.remove('hidden');
      emptyState.classList.add('hidden');

      // 执行像素化
      await repixelate();
    } catch (err) {
      alert('图片处理失败：' + err.message);
      console.error(err);
    }
  }

  // ============ 像素化 + 匹配流程 ============
  async function repixelate() {
    if (!currentImage) return;

    // 像素化
    currentPixels = Pixelizer.pixelate(currentImage, currentPixelCount);

    // 颜色匹配
    currentMatchResult = ColorMatcher.matchMatrix(currentPixels.pixels, HAMA_PALETTE);

    // 渲染
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
    if (currentMatchResult) {
      renderCanvas();
    }
  }

  function renderCanvas() {
    const { matrix } = currentMatchResult;
    const rows = matrix.length;
    const cols = matrix[0].length;
    const showGrid = showGridCheck.checked;
    const showLabels = showLabelsCheck.checked;

    // 计算单元格大小：适应 500px 显示区域
    const maxDisplay = 500;
    const cellSize = Math.floor(maxDisplay / Math.max(rows, cols));
    const canvasW = cols * cellSize;
    const canvasH = rows * cellSize;

    outputCanvas.width = canvasW;
    outputCanvas.height = canvasH;
    outputCanvas.style.width = canvasW + 'px';
    outputCanvas.style.height = canvasH + 'px';

    const ctx = outputCanvas.getContext('2d');

    // 绘制像素色块
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const match = matrix[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        if (match) {
          ctx.fillStyle = match.hex;
        } else {
          // 透明像素用棋盘格表示
          ctx.fillStyle = ((x + y) % 2 === 0) ? '#FFFFFF' : '#E0E0E0';
        }
        ctx.fillRect(px, py, cellSize, cellSize);

        // 网格线
        if (showGrid && cellSize > 4) {
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }
      }
    }

    // 色号标签（单元格 ≥ 12px 时显示，太密则只显示文字不描边）
    if (showLabels && cellSize >= 12) {
      const tiny = cellSize < 18; // 密集模式：缩小字体、省去描边
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const match = matrix[y][x];
          if (!match) continue;

          const px = x * cellSize;
          const py = y * cellSize;
          const cx = px + cellSize / 2;
          const cy = py + cellSize / 2;

          const [cr, cg, cb] = match.rgb;
          const luminance = 0.299 * cr + 0.587 * cg + 0.114 * cb;
          ctx.fillStyle = luminance > 150 ? '#000000' : '#FFFFFF';

          const fontSize = tiny
            ? Math.max(6, cellSize * 0.52)   // 密集：6-9px，最大化利用空间
            : Math.max(9, Math.min(12, cellSize * 0.4));
          ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (!tiny) {
            ctx.strokeStyle = luminance > 150 ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 2;
            ctx.strokeText(match.code, cx, cy);
          }
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

    // 如果都是空像素，显示提示
    if (sorted.length === 0) {
      statsList.innerHTML = '<div class="stats-empty">图片过于透明，无法匹配</div>';
    }
  }

  // ============ 导出 ============
  function exportPNG() {
    if (!currentMatchResult) return;

    // 创建一个不含标签的新 canvas（纯像素图 + 网格线）
    const { matrix } = currentMatchResult;
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = 20; // 导出固定 20px 每格，清晰度高
    const showGrid = showGridCheck.checked;
    const showLabels = showLabelsCheck.checked;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = cols * cellSize;
    exportCanvas.height = rows * cellSize;
    const ctx = exportCanvas.getContext('2d');

    // 绘制
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
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

    // 标签
    if (showLabels) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const match = matrix[y][x];
          if (!match) continue;
          const px = x * cellSize;
          const py = y * cellSize;
          const [cr, cg, cb] = match.rgb;
          const lum = 0.299 * cr + 0.587 * cg + 0.114 * cb;
          ctx.fillStyle = lum > 150 ? '#000' : '#FFF';
          ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(match.code, px + cellSize / 2, py + cellSize / 2);
        }
      }
    }

    // 下载
    const link = document.createElement('a');
    link.download = `拼豆图纸_${cols}x${rows}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  function copyStats() {
    if (!currentMatchResult) return;

    const { stats } = currentMatchResult;
    const sorted = [...stats.entries()].sort((a, b) => b[1].count - a[1].count);

    let text = '拼豆色号清单\n';
    text += '══════════════\n';
    text += `尺寸: ${currentMatchResult.matrix[0].length} × ${currentMatchResult.matrix.length}\n`;
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

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', () => App.init());
