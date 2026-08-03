/**
 * 音乐播放器扩展入口
 * 版本: 1.0.6
 * 作者: hy.禾一
 * 说明：按顺序加载模块并初始化播放器
 */

import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const EXTENSION_NAME = 'music_player';
const EXTENSION_FOLDER = 'hy-yybfq';

console.log('🎵 音乐播放器扩展加载中...');

// ============================================================
// 模块加载顺序（按依赖关系排列）
// ============================================================

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadAllModules() {
    const basePath = `/scripts/extensions/third-party/${EXTENSION_FOLDER}/js/`;

    try {
        // 1. 工具函数
        await loadScript(basePath + 'utils.js');
        console.log('✅ utils.js 加载完成');

        // 2. 网易云 API
        await loadScript(basePath + 'api.js');
        console.log('✅ api.js 加载完成');

        // 3. 汽水音乐 API
        await loadScript(basePath + 'api-qishui.js');
        console.log('✅ api-qishui.js 加载完成');

        // 4. 核心逻辑
        await loadScript(basePath + 'core.js');
        console.log('✅ core.js 加载完成');

        // 5. UI 渲染
        await loadScript(basePath + 'ui.js');
        console.log('✅ ui.js 加载完成');

        // 所有模块加载完成后初始化
        initPlayer();
    } catch (error) {
        console.error('❌ 模块加载失败:', error);
    }
}

// ============================================================
// 初始化播放器
// ============================================================

function initPlayer() {
    if (typeof window.loadCSS === 'function') {
        window.loadCSS();
    }

    if (typeof window.createUI === 'function') {
        window.createUI();
    }

    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.init === 'function') {
        window.MusicPlayerCore.init();
    }

    setTimeout(() => {
        const settings = getExtensionSettings();
        if (settings.playerHidden) {
            if (typeof window.hideUI === 'function') {
                window.hideUI();
            }
        } else {
            if (typeof window.showUI === 'function') {
                window.showUI();
            }
        }
    }, 300);

    bindExtensionEvents();
    console.log('✅ 音乐播放器扩展初始化完成');
}

// ============================================================
// 扩展设置管理
// ============================================================

function getExtensionSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = { playerHidden: false };
    }
    return extension_settings[EXTENSION_NAME];
}

function saveExtensionSettings() {
    saveSettingsDebounced();
}

// ============================================================
// 创建扩展面板
// ============================================================

function createExtensionPanel() {
    const container = document.getElementById('extensions_settings');
    if (!container) return;

    const settings = getExtensionSettings();

    const html = `
        <div id="music-player-extension" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>🎵 音乐播放器</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content" style="display: none;">
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <input type="checkbox" id="player-hidden-toggle" ${settings.playerHidden ? 'checked' : ''}>
                        <span>隐藏播放器</span>
                    </label>
                    <small style="opacity: 0.6; display: block; margin-left: 30px; font-size: 12px;">
                        𓂃𓂃𓂃𓊝𓄹𓄺𓂃𓂃𓂃 hy.禾一
                    </small>
                </div>
                <button type="button" id="show-help-btn" class="menu_button" style="width: 100%;">
                    <i class="fa-solid fa-question-circle"></i> 使用说明
                </button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);

    const drawerToggle = document.querySelector('#music-player-extension .inline-drawer-toggle');
    if (drawerToggle) {
        drawerToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const icon = this.querySelector('.inline-drawer-icon');
            const content = this.nextElementSibling;
            if (content) {
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                if (icon) {
                    if (isHidden) {
                        icon.classList.remove('down');
                        icon.classList.add('up');
                    } else {
                        icon.classList.remove('up');
                        icon.classList.add('down');
                    }
                }
            }
        });
    }

    const hiddenToggle = document.getElementById('player-hidden-toggle');
    if (hiddenToggle) {
        hiddenToggle.addEventListener('change', (e) => {
            const settings = getExtensionSettings();
            settings.playerHidden = e.target.checked;
            extension_settings[EXTENSION_NAME] = settings;
            saveExtensionSettings();
            if (settings.playerHidden) {
                if (typeof window.hideUI === 'function') {
                    window.hideUI();
                }
            } else {
                if (typeof window.showUI === 'function') {
                    window.showUI();
                }
            }
        });
    }

    const helpBtn = document.getElementById('show-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
}

// ============================================================
// 使用说明弹窗
// ============================================================

function showHelp() {
    const overlay = document.createElement('div');
    overlay.className = 'help-dialog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        padding: 20px;
        box-sizing: border-box;
        overflow: auto;
    `;

    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: var(--SmartThemeBodyColor, #1a1a1a);
            color: var(--SmartThemeBodyText, #eee);
            border-radius: 20px;
            padding: 32px 28px;
            max-width: 520px;
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 30px 80px rgba(0,0,0,0.5);
            margin: auto;
            z-index: 1000000;
            border: 1px solid rgba(255,255,255,0.06);
            line-height: 1.6;
        ">
            <button type="button" id="help-close-btn" style="
                position: sticky;
                float: right;
                top: 0;
                background: none;
                border: none;
                font-size: 22px;
                cursor: pointer;
                color: inherit;
                opacity: 0.4;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                margin-top: -6px;
                margin-right: -6px;
            ">✕</button>

            <div style="clear: both;"></div>

            <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 38px; display: block; margin-bottom: 4px;">🎵</span>
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; letter-spacing: 0.3px;">音乐播放器</h2>
                <p style="margin: 4px 0 0; opacity: 0.35; font-size: 12px;">hy.禾一</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">

                <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px 16px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🖱️</span>
                        <div>
                            <div style="font-weight: 500; font-size: 14px;">拖动 & 切换</div>
                            <div style="opacity: 0.6; font-size: 13px;">拖动顶部「灵动岛」移动播放器 · 右侧按钮切换「律动/纯享」模式</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px 16px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🎚️</span>
                        <div>
                            <div style="font-weight: 500; font-size: 14px;">律动模式</div>
                            <div style="opacity: 0.6; font-size: 13px;">点击「𓆝」最小化为律动条 · 左侧拖拽移动 · 右侧双击返回</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px 16px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🎶</span>
                        <div>
                            <div style="font-weight: 500; font-size: 14px;">添加歌曲</div>
                            <div style="opacity: 0.6; font-size: 13px;">支持网易云 / 汽水音乐 · 单曲 / 歌单自动解析</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px 16px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">✨</span>
                        <div>
                            <div style="font-weight: 500; font-size: 14px;">纯享模式</div>
                            <div style="opacity: 0.6; font-size: 13px;">全屏歌词滚动 · 沉浸式听歌 · 点击任意位置退出</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px 16px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">⚡</span>
                        <div>
                            <div style="font-weight: 500; font-size: 14px;">一键缓存</div>
                            <div style="opacity: 0.6; font-size: 13px;">提前获取所有歌曲链接 · 刷新页面不失效</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px 16px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🎨</span>
                        <div>
                            <div style="font-weight: 500; font-size: 14px;">自定义外观</div>
                            <div style="opacity: 0.6; font-size: 13px;">背景 · 封面 · RGB灯光 · 磨砂玻璃 · 尺寸全可调</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px 16px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">💡</span>
                        <div>
                            <div style="font-weight: 500; font-size: 14px;">小提示</div>
                            <div style="opacity: 0.6; font-size: 13px;">歌单导入后建议一键缓存 · 隐藏播放器后切歌不会弹出</div>
                        </div>
                    </div>
                </div>

            </div>

            <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);">
                <span style="opacity: 0.3; font-size: 12px;">开源 · 免费 · 仅供个人使用</span>
                <div style="margin-top: 4px; opacity: 0.25; font-size: 11px;">📧 QQ: 2027932654</div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#help-close-btn');
    closeBtn.addEventListener('mouseenter', function() {
        this.style.opacity = '1';
        this.style.background = 'rgba(255,255,255,0.06)';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.opacity = '0.4';
        this.style.background = 'none';
    });
    closeBtn.addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// ============================================================
// 启动
// ============================================================

$(document).ready(() => {
    createExtensionPanel();
    loadAllModules();
});
