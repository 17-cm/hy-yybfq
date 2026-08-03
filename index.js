/**
 * 音乐播放器扩展入口
 * 版本: 1.0.7
 * 作者: hy.禾一
 */

import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const EXTENSION_NAME = 'music_player';
const EXTENSION_FOLDER = 'hy-yybfq';

console.log('🎵 音乐播放器扩展加载中...');

// ============================================================
// 模块加载
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
        await loadScript(basePath + 'utils.js');
        await loadScript(basePath + 'api.js');
        await loadScript(basePath + 'api-qishui.js');
        await loadScript(basePath + 'core.js');
        await loadScript(basePath + 'ui.js');
        initPlayer();
    } catch (error) {
        console.error('❌ 模块加载失败:', error);
    }
}

// ============================================================
// 初始化
// ============================================================

function initPlayer() {
    if (typeof window.loadCSS === 'function') window.loadCSS();
    if (typeof window.createUI === 'function') window.createUI();
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.init === 'function') {
        window.MusicPlayerCore.init();
    }
    setTimeout(() => {
        const settings = getExtensionSettings();
        if (settings.playerHidden) {
            if (typeof window.hideUI === 'function') window.hideUI();
        } else {
            if (typeof window.showUI === 'function') window.showUI();
        }
    }, 300);
    bindExtensionEvents();
    console.log('✅ 音乐播放器扩展初始化完成');
}

// ============================================================
// 设置管理
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
// 扩展面板
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

                <!-- 1. 隐藏播放器 -->
                <div style="margin-bottom: 10px;">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="player-hidden-toggle" ${settings.playerHidden ? 'checked' : ''}>
                        <span>隐藏播放器</span>
                    </label>
                </div>

                <!-- 2. 检测通道可用性 -->
                <button type="button" id="test-channels-btn" class="menu_button" style="width: 100%; margin-bottom: 8px;">
                    <i class="fa-solid fa-plug"></i> 检测通道可用性
                </button>
                <div id="channel-test-result" style="
                    margin-bottom: 10px;
                    font-size: 12px;
                    opacity: 0.8;
                    max-height: 200px;
                    overflow-y: auto;
                    background: rgba(0,0,0,0.15);
                    border-radius: 8px;
                    padding: 8px 12px;
                    display: none;
                    line-height: 1.8;
                    color: var(--SmartThemeBodyText, #eee);
                "></div>

                <!-- 3. 注脚 -->
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; margin-bottom: 10px;">
                    <small style="opacity: 0.35; font-size: 11px; letter-spacing: 0.5px;">
                        𓂃𓂃𓂃𓊝𓄹𓄺𓂃𓂃𓂃 hy.禾一
                    </small>
                </div>

                <!-- 4. 使用说明 -->
                <button type="button" id="show-help-btn" class="menu_button" style="width: 100%;">
                    <i class="fa-solid fa-question-circle"></i> 使用说明
                </button>

            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);

    // ===== 事件绑定 =====
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
                if (typeof window.hideUI === 'function') window.hideUI();
            } else {
                if (typeof window.showUI === 'function') window.showUI();
            }
        });
    }

    const helpBtn = document.getElementById('show-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }

    const testBtn = document.getElementById('test-channels-btn');
    if (testBtn) {
        testBtn.addEventListener('click', testChannels);
    }
}

// ============================================================
// 通道检测
// ============================================================

async function testChannels() {
    const resultEl = document.getElementById('channel-test-result');
    if (!resultEl) return;

    resultEl.style.display = 'block';
    resultEl.innerHTML = '🔄 正在检测通道...';

    const channels = window.CHANNELS || [];
    if (channels.length === 0) {
        resultEl.innerHTML = '❌ 未找到通道配置，请检查 api.js 是否加载';
        return;
    }

    let results = [];
    for (const channel of channels) {
        const statusText = await testSingleChannel(channel);
        results.push(`${channel.name}：${statusText}`);
    }
    resultEl.innerHTML = results.join('<br>');
}

async function testSingleChannel(channel) {
    const testId = '1397345903';
    let url;

    if (channel.type === 'meting') {
        url = `${channel.base}?server=netease&type=song&id=${testId}`;
    } else if (channel.type === 'bugpk') {
        url = `${channel.base}?type=song&id=${testId}`;
    } else if (channel.type === 'byfuns') {
        url = `${channel.base}?id=${testId}`;
    } else {
        return '❌ 未知类型';
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) return `❌ ${response.status}`;
        const text = await response.text();
        if (text.length < 20) return '⚠️ 返回数据过短';
        if (text.includes('name') || text.includes('http') || text.includes('url') || text.startsWith('http')) {
            return '✅ 可用';
        } else {
            return '⚠️ 返回格式异常';
        }
    } catch (error) {
        if (error.name === 'AbortError') return '⏱️ 超时';
        return `❌ ${error.message}`;
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
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        padding: 20px;
        box-sizing: border-box;
        overflow: auto;
        min-height: 100vh;
    `;

    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 36px 32px 28px;
            max-width: 520px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        ">
            <button type="button" id="help-close-btn" style="
                position: sticky;
                float: right;
                top: 0;
                background: none;
                border: none;
                font-size: 22px;
                cursor: pointer;
                color: #1a1a1a;
                opacity: 0.4;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                margin-top: -8px;
                margin-right: -8px;
            ">✕</button>

            <div style="clear: both;"></div>

            <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 38px; display: block; margin-bottom: 4px;">🎵</span>
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.3px; color: #1a1a1a;">音乐播放器</h2>
                <p style="margin: 4px 0 0; opacity: 0.35; font-size: 12px; color: #1a1a1a;">hy.禾一</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🖱️</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">拖动 & 切换</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">拖动顶部「灵动岛」移动播放器 · 右侧按钮切换「律动/纯享」模式</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🎚️</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">律动模式</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">点击「𓆝」最小化为律动条 · 左侧拖拽移动 · 右侧双击返回</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🎶</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">添加歌曲</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">支持网易云 / 汽水音乐 · 单曲 / 歌单自动解析</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">📋</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">歌单导入</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">歌单导入最便捷，建议每个歌单不超过 20 首</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">💡</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">通道检测</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">导入失败请点击「检测通道可用性」· 全部失效请等待更新</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">⚡</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">一键缓存</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">导入歌曲或歌单后务必执行，避免刷新后链接失效</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🎨</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">自定义外观</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">背景 · 封面 · RGB灯光 · 磨砂玻璃 · 尺寸全可调</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">✨</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">纯享模式</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">全屏歌词滚动 · 点击任意位置退出</div>
                        </div>
                    </div>
                </div>

                <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8;">
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <span style="font-size: 18px;">🔄</span>
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">开发中</div>
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">未来将加入「自定义歌单」功能，支持整理和分类歌曲</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e8e8e8;">
                <span style="opacity: 0.3; font-size: 12px; color: #1a1a1a;">开源 · 免费 · 仅供个人使用</span>
                <div style="margin-top: 4px; opacity: 0.25; font-size: 11px; color: #1a1a1a;">📧 QQ: 2027932654</div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#help-close-btn');
    closeBtn.addEventListener('mouseenter', function() {
        this.style.opacity = '0.8';
        this.style.background = 'rgba(0,0,0,0.05)';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.opacity = '0.4';
        this.style.background = 'none';
    });
    closeBtn.addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ============================================================
// 启动
// ============================================================

$(document).ready(() => {
    createExtensionPanel();
    loadAllModules();
});
