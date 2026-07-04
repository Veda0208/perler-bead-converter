/**
 * Hama Midi 拼豆色号表
 * 色号 + 中英文名称 + RGB 值（近似实际豆子颜色）
 * 参考 Hama 官方色卡，RGB 为手工校准以匹配实物
 */
const HAMA_PALETTE = [
  // ===== 基础色 =====
  { code: 'H01', name: '白色', nameEn: 'White', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { code: 'H02', name: '奶油色', nameEn: 'Cream', hex: '#FFFBE0', rgb: [255, 251, 224] },
  { code: 'H03', name: '黄色', nameEn: 'Yellow', hex: '#FFF200', rgb: [255, 242, 0] },
  { code: 'H04', name: '橙色', nameEn: 'Orange', hex: '#FF7F27', rgb: [255, 127, 39] },
  { code: 'H05', name: '红色', nameEn: 'Red', hex: '#ED1C24', rgb: [237, 28, 36] },
  { code: 'H07', name: '粉色', nameEn: 'Pink', hex: '#FFAEC9', rgb: [255, 174, 201] },
  { code: 'H08', name: '紫色', nameEn: 'Purple', hex: '#A349A4', rgb: [163, 73, 164] },
  { code: 'H09', name: '深绿色', nameEn: 'Dark Green', hex: '#00A651', rgb: [0, 166, 81] },
  { code: 'H10', name: '绿色', nameEn: 'Green', hex: '#34AF4B', rgb: [52, 175, 75] },
  { code: 'H11', name: '浅绿色', nameEn: 'Light Green', hex: '#B5E61D', rgb: [181, 230, 29] },
  { code: 'H12', name: '浅蓝色', nameEn: 'Light Blue', hex: '#99D9EA', rgb: [153, 217, 234] },
  { code: 'H13', name: '蓝色', nameEn: 'Blue', hex: '#00A2E8', rgb: [0, 162, 232] },
  { code: 'H17', name: '灰色', nameEn: 'Grey', hex: '#808080', rgb: [128, 128, 128] },
  { code: 'H18', name: '黑色', nameEn: 'Black', hex: '#000000', rgb: [0, 0, 0] },

  // ===== 金属/特殊色 =====
  { code: 'H20', name: '铁灰色', nameEn: 'Iron', hex: '#4A4A4A', rgb: [74, 74, 74] },
  { code: 'H21', name: '金色', nameEn: 'Gold', hex: '#FFC90E', rgb: [255, 201, 14] },
  { code: 'H22', name: '银色', nameEn: 'Silver', hex: '#C8C8C8', rgb: [200, 200, 200] },

  // ===== 棕色系 =====
  { code: 'H26', name: '浅棕色', nameEn: 'Light Brown', hex: '#B97A57', rgb: [185, 122, 87] },
  { code: 'H27', name: '棕色', nameEn: 'Brown', hex: '#885030', rgb: [136, 80, 48] },
  { code: 'H28', name: '深棕色', nameEn: 'Dark Brown', hex: '#653B23', rgb: [101, 59, 35] },
  { code: 'H29', name: '深红色', nameEn: 'Dark Red', hex: '#880015', rgb: [136, 0, 21] },
  { code: 'H50', name: '米色', nameEn: 'Beige', hex: '#F5DCBE', rgb: [245, 220, 190] },
  { code: 'H43', name: '肤色', nameEn: 'Flesh', hex: '#FDD0A0', rgb: [253, 208, 160] },

  // ===== 亮色/荧光系 =====
  { code: 'H30', name: '亮红色', nameEn: 'Bright Red', hex: '#FF0000', rgb: [255, 0, 0] },
  { code: 'H31', name: '亮橙色', nameEn: 'Bright Orange', hex: '#FF8000', rgb: [255, 128, 0] },
  { code: 'H32', name: '亮黄色', nameEn: 'Bright Yellow', hex: '#FFFF00', rgb: [255, 255, 0] },
  { code: 'H33', name: '亮绿色', nameEn: 'Bright Green', hex: '#00FF00', rgb: [0, 255, 0] },
  { code: 'H34', name: '亮蓝色', nameEn: 'Bright Blue', hex: '#0000FF', rgb: [0, 0, 255] },

  // ===== 粉彩色系 (Pastel) =====
  { code: 'H36', name: '粉彩粉', nameEn: 'Pastel Pink', hex: '#FFB6C1', rgb: [255, 182, 193] },
  { code: 'H37', name: '粉彩黄', nameEn: 'Pastel Yellow', hex: '#FFFF99', rgb: [255, 255, 153] },
  { code: 'H38', name: '粉彩绿', nameEn: 'Pastel Green', hex: '#99FF99', rgb: [153, 255, 153] },
  { code: 'H39', name: '粉彩蓝', nameEn: 'Pastel Blue', hex: '#99CCFF', rgb: [153, 204, 255] },
  { code: 'H40', name: '粉彩紫', nameEn: 'Pastel Purple', hex: '#CC99FF', rgb: [204, 153, 255] },
  { code: 'H41', name: '粉彩橙', nameEn: 'Pastel Orange', hex: '#FFCC99', rgb: [255, 204, 153] },

  // ===== 扩展色 =====
  { code: 'H06', name: '品红色', nameEn: 'Magenta', hex: '#E5007F', rgb: [229, 0, 127] },
  { code: 'H14', name: '深蓝色', nameEn: 'Dark Blue', hex: '#003399', rgb: [0, 51, 153] },
  { code: 'H15', name: '天蓝色', nameEn: 'Sky Blue', hex: '#5BC2E7', rgb: [91, 194, 231] },
  { code: 'H16', name: '淡紫色', nameEn: 'Lavender', hex: '#B49FDC', rgb: [180, 159, 220] },
  { code: 'H19', name: '深灰色', nameEn: 'Dark Grey', hex: '#5C5C5C', rgb: [92, 92, 92] },
  { code: 'H23', name: '铜色', nameEn: 'Copper', hex: '#B87333', rgb: [184, 115, 51] },
  { code: 'H24', name: '荧光黄', nameEn: 'Neon Yellow', hex: '#E2F146', rgb: [226, 241, 70] },
  { code: 'H25', name: '荧光橙', nameEn: 'Neon Orange', hex: '#FF6800', rgb: [255, 104, 0] },
  { code: 'H35', name: '亮紫色', nameEn: 'Bright Purple', hex: '#A020F0', rgb: [160, 32, 240] },
  { code: 'H44', name: '夜光白', nameEn: 'Glow White', hex: '#F0FFF0', rgb: [240, 255, 240] },
  { code: 'H45', name: '青绿色', nameEn: 'Turquoise', hex: '#00A896', rgb: [0, 168, 150] },
  { code: 'H46', name: '浅粉色', nameEn: 'Light Pink', hex: '#FF8CAA', rgb: [255, 140, 170] },
  { code: 'H47', name: '薄荷绿', nameEn: 'Mint Green', hex: '#3CC896', rgb: [60, 200, 150] },
  { code: 'H48', name: '薰衣草', nameEn: 'Lavender Light', hex: '#C8A2C8', rgb: [200, 162, 200] },
  { code: 'H49', name: '珊瑚色', nameEn: 'Coral', hex: '#FF6464', rgb: [255, 100, 100] },
  { code: 'H51', name: '橄榄绿', nameEn: 'Olive Green', hex: '#708238', rgb: [112, 130, 56] },
  { code: 'H52', name: '芥末黄', nameEn: 'Mustard', hex: '#C8AA00', rgb: [200, 170, 0] },
  { code: 'H53', name: '酒红色', nameEn: 'Burgundy', hex: '#78001E', rgb: [120, 0, 30] },
  { code: 'H54', name: '海军蓝', nameEn: 'Navy Blue', hex: '#001E50', rgb: [0, 30, 80] },
  { code: 'H55', name: '钢蓝色', nameEn: 'Steel Blue', hex: '#46648C', rgb: [70, 100, 140] },
  { code: 'H56', name: '森林绿', nameEn: 'Forest Green', hex: '#1E5028', rgb: [30, 80, 40] },
  { code: 'H57', name: '焦糖色', nameEn: 'Caramel', hex: '#D2905A', rgb: [210, 144, 90] },
  { code: 'H58', name: '象牙白', nameEn: 'Ivory', hex: '#FFFFF0', rgb: [255, 255, 240] },
  { code: 'H59', name: '炭灰色', nameEn: 'Charcoal', hex: '#36454F', rgb: [54, 69, 79] },

  // ===== 透明色 =====
  { code: 'H60', name: '透明红', nameEn: 'Transparent Red', hex: '#FF8080', rgb: [255, 128, 128] },
  { code: 'H61', name: '透明橙', nameEn: 'Transparent Orange', hex: '#FFB380', rgb: [255, 179, 128] },
  { code: 'H62', name: '透明黄', nameEn: 'Transparent Yellow', hex: '#FFFFA0', rgb: [255, 255, 160] },
  { code: 'H63', name: '透明绿', nameEn: 'Transparent Green', hex: '#80D080', rgb: [128, 208, 128] },
  { code: 'H64', name: '透明蓝', nameEn: 'Transparent Blue', hex: '#80B8E0', rgb: [128, 184, 224] },
  { code: 'H65', name: '透明紫', nameEn: 'Transparent Purple', hex: '#C090D0', rgb: [192, 144, 208] },
  { code: 'H66', name: '透明无色', nameEn: 'Transparent Clear', hex: '#E8E8E8', rgb: [232, 232, 232] },
];

// 导出（兼容 ES Module 和浏览器全局变量）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HAMA_PALETTE };
}
