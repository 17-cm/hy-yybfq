/**
 * 音乐播放器扩展入口
 * 版本: 1.0.6
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
// 读取版本号
// ============================================================

function getVersion() {
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) {
        try {
            const href = manifest.href;
            const versionMatch = href.match(/v=([\d.]+)/);
            if (versionMatch) return versionMatch[1];
        } catch (e) {}
    }
    return '1.0.7';
}

// ============================================================
// 创建扩展面板
// ============================================================

function createExtensionPanel() {
    const container = document.getElementById('extensions_settings');
    if (!container) return;

    const settings = getExtensionSettings();
    const version = getVersion();

    const html = `
        <div id="music-player-extension" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>🎵 音乐播放器</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content" style="display: none;">

                <!-- 第一行：隐藏播放器 + 打开播放器 -->
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <label style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 0; background: rgba(255,255,255,0.06); border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); font-size: 13px; color: var(--SmartThemeBodyText, #fff);">
                        <input type="checkbox" id="player-hidden-toggle" ${settings.playerHidden ? 'checked' : ''} style="margin: 0;">
                        <span>隐藏播放器</span>
                    </label>
                    <button type="button" id="player-show-btn" style="flex: 1; padding: 8px 0; font-size: 13px; background: rgba(255,255,255,0.06); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; color: var(--SmartThemeBodyText, #fff);">
                        打开播放器
                    </button>
                </div>

                <!-- 第二行：通道检测 -->
                <button type="button" id="test-channels-btn" style="width: 100%; padding: 8px 0; font-size: 13px; background: rgba(255,255,255,0.06); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; color: var(--SmartThemeBodyText, #fff); margin-bottom: 10px;">
                    通道检测
                </button>

                <!-- 第三行：使用说明 -->
                <button type="button" id="show-help-btn" style="width: 100%; padding: 8px 0; font-size: 13px; background: rgba(255,255,255,0.06); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; color: var(--SmartThemeBodyText, #fff); margin-bottom: 10px;">
                    使用说明
                </button>

                <!-- 第四行：注脚 + 版本号 -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06);">
                    <small style="opacity: 0.35; font-size: 11px; letter-spacing: 0.5px;">
                        𓂃𓂃𓂃𓊝𓄹𓄺𓂃𓂃𓂃 hy.禾一
                    </small>
                    <small style="opacity: 0.35; font-size: 11px;">
                        版本：${version}
                    </small>
                </div>

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

    // 隐藏播放器
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

    // 打开播放器
    const showBtn = document.getElementById('player-show-btn');
    if (showBtn) {
        showBtn.addEventListener('click', () => {
            const settings = getExtensionSettings();
            settings.playerHidden = false;
            extension_settings[EXTENSION_NAME] = settings;
            saveExtensionSettings();
            if (typeof window.showUI === 'function') window.showUI();
            const toggle = document.getElementById('player-hidden-toggle');
            if (toggle) toggle.checked = false;
        });
    }

    const helpBtn = document.getElementById('show-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }

    const testBtn = document.getElementById('test-channels-btn');
    if (testBtn) {
        testBtn.addEventListener('click', showChannelTestDialog);
    }
}

// ============================================================
// 通道检测系统
// ============================================================

function showChannelTestDialog() {
    const overlay = createOverlay();
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 380px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #1a1a1a;">选择检测平台</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="platform-btn" data-platform="qishui" style="
                    padding: 12px;
                    background: #f5f5f5;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    color: #1a1a1a;
                    transition: all 0.2s;
                ">汽水音乐通道检测</button>
                <button class="platform-btn" data-platform="netease" style="
                    padding: 12px;
                    background: #f5f5f5;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    color: #1a1a1a;
                    transition: all 0.2s;
                ">网易云通道检测</button>
                <button id="test-dialog-cancel" style="
                    margin-top: 6px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 8px;
                ">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.background = '#e8e8e8'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#f5f5f5'; });
        btn.onclick = () => {
            const platform = btn.dataset.platform;
            overlay.remove();
            if (platform === 'qishui') showQishuiChannelDialog();
            else if (platform === 'netease') showNeteaseChannelDialog();
        };
    });

    overlay.querySelector('#test-dialog-cancel').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function showQishuiChannelDialog() {
    const channels = window.CHANNELS || [];
    const qishuiChannels = channels.filter(c => c.platform === 'qishui');

    const overlay = createOverlay();
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 380px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #1a1a1a;">汽水音乐通道</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${qishuiChannels.map((c, idx) => `
                    <button class="channel-test-item" data-channel="${c.name}" style="
                        padding: 12px;
                        background: #f5f5f5;
                        border: 1px solid #e8e8e8;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 14px;
                        color: #1a1a1a;
                        transition: all 0.2s;
                    ">通道${idx + 1} 检测</button>
                `).join('')}
                <button id="test-dialog-back" style="
                    margin-top: 6px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 8px;
                ">返回</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.channel-test-item').forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.background = '#e8e8e8'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#f5f5f5'; });
        btn.onclick = async () => {
            const channelName = btn.dataset.channel;
            const channel = window.CHANNELS.find(c => c.name === channelName);
            overlay.remove();
            const result = await testSingleChannel(channel);
            showResultDialog(channelName, result);
        };
    });

    overlay.querySelector('#test-dialog-back').onclick = () => {
        overlay.remove();
        showChannelTestDialog();
    };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function showNeteaseChannelDialog() {
    const channels = window.CHANNELS || [];
    const neteaseChannels = channels.filter(c => c.platform === 'netease');

    const overlay = createOverlay();
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 380px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #1a1a1a;">网易云通道</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${neteaseChannels.map((c, idx) => `
                    <button class="channel-test-item" data-channel="${c.name}" style="
                        padding: 12px;
                        background: #f5f5f5;
                        border: 1px solid #e8e8e8;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 14px;
                        color: #1a1a1a;
                        transition: all 0.2s;
                    ">通道${idx + 1} 检测</button>
                `).join('')}
                <button id="test-dialog-back" style="
                    margin-top: 6px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 8px;
                ">返回</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.channel-test-item').forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.background = '#e8e8e8'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#f5f5f5'; });
        btn.onclick = async () => {
            const channelName = btn.dataset.channel;
            const channel = window.CHANNELS.find(c => c.name === channelName);
            overlay.remove();
            const result = await testSingleChannel(channel);
            showResultDialog(channelName, result);
        };
    });

    overlay.querySelector('#test-dialog-back').onclick = () => {
        overlay.remove();
        showChannelTestDialog();
    };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function showResultDialog(channelName, result) {
    const overlay = createOverlay();
    const isSuccess = result.includes('✅');
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 340px;
            width: 100%;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
            text-align: center;
        ">
            <div style="font-size: 48px; margin-bottom: 12px;">${isSuccess ? '✅' : '❌'}</div>
            <div style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">
                ${isSuccess ? '通道可用' : '通道不可用'}
            </div>
            <div style="font-size: 14px; color: #666; margin-bottom: 16px;">
                ${result.replace(/^✅\s*|^❌\s*/, '')}
            </div>
            <button id="result-ok-btn" style="
                padding: 10px 40px;
                background: #1a1a1a;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                font-weight: 500;
            ">确定</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#result-ok-btn').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function createOverlay() {
    const overlay = document.createElement('div');
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
    return overlay;
}

async function testSingleChannel(channel) {
    const testId = '1397345903';
    let url;

    if (!channel) return '❌ 通道不存在';

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

        if (!response.ok) return `❌ HTTP ${response.status}`;
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
    const overlay = createOverlay();
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
                            <div style="opacity: 0.6; font-size: 13px; color: #1a1a1a;">导入失败请手动检测各通道可用性</div>
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
