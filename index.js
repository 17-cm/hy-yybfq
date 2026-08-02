/*
 * 音乐播放器扩展入口（精简版）
 * 版本: 1.0.6
 * 作者: hy.禾一
 * 说明：只负责加载播放器核心，不修改任何播放逻辑
 */

import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const EXTENSION_NAME = 'music_player';

console.log('🎵 音乐播放器扩展加载中...');

// 初始化
$(document).ready(() => {
    setTimeout(() => {
        const container = document.getElementById('extensions_settings');
        if (container) {
            initializeExtension(container);
        }
    }, 1000);
});

function initializeExtension(container) {
    console.log('🎵 初始化音乐播放器扩展...');
    
    loadExtensionSettings();
    createExtensionPanel(container);
    loadPlayerCore();
    bindExtensionEvents();
    
    console.log('✅ 音乐播放器扩展初始化完成');
}

function loadExtensionSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = {
            playerHidden: false
        };
    }
}

function getExtensionSettings() {
    return extension_settings[EXTENSION_NAME] || { playerHidden: false };
}

function createExtensionPanel(container) {
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
                    <span>隐藏播放器（音乐继续播放）</span>
                </label>
                <small style="opacity: 0.7; display: block; margin-left: 30px;">
                    𓂃𓂃𓂃𓊝𓄹𓄺𓂃𓂃𓂃hy.禾一
                </small>
            </div>
            <button type="button" id="show-help-btn" class="menu_button" style="width: 100%;">
                <i class="fa-solid fa-question-circle"></i> 使用说明
            </button>
        </div>
    </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
}

function showHelp() {
    const overlay = document.createElement('div');
    overlay.className = 'help-dialog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        padding: 20px;
        box-sizing: border-box;
        overflow: auto;
    `;
    
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: var(--SmartThemeBodyColor, #222);
            color: var(--SmartThemeBodyText, #fff);
            border-radius: 15px;
            padding: 25px;
            max-width: 90%;
            width: 520px;
            max-height: 85vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            margin: auto;
            z-index: 2147483647;
        ">
            <button type="button" id="help-close-btn" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: inherit;
                opacity: 0.7;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            ">×</button>
            
            <h2 style="margin-top: 0; text-align: center;">🎵 音乐播放器使用说明</h2>
            
            <h3>💻 电脑端操作</h3>
            <ul>
                <li><strong>拖动播放器</strong>：点击顶部灵动岛拖动</li>
                <li><strong>切换模式</strong>：点击右侧按钮切换不同模式</li>
                <li><strong>添加歌曲</strong>：支持网易云链接、URL直链、本地文件</li>
            </ul>
            
            <h3>📱 手机端操作</h3>
            <ul>
                <li><strong>拖动播放器</strong>：长按顶部灵动岛拖动</li>
                <li><strong>切换模式</strong>：点击右侧功能按钮</li>
                <li><strong>添加歌曲</strong>：点击列表中的"+"按钮</li>
            </ul>
            
            <h3>🎛️ 按钮说明</h3>
            <ul>
                <li><strong>𓆝</strong> —— 律动模式：最小化为音频律动条</li>
                <li><strong>♡</strong> —— 设置面板：自定义播放器外观</li>
                <li><strong>𓆟</strong> —— 纯享模式：全屏歌词显示</li>
            </ul>
            
            <h3>🎚️ 律动模式操作</h3>
            <p style="opacity: 0.9; line-height: 1.6;">
                在律动条上方的空白区域：<br>
                • <strong>左侧区域</strong>：按住可拖动位置<br>
                • <strong>右侧区域</strong>：双击可展开播放器
            </p>
            
            <h3>☁️ 网易云音乐导入</h3>
            <ul>
                <li>支持歌曲分享链接导入</li>
                <li>支持歌单批量导入</li>
                <li>自动获取歌词和封面</li>
            </ul>
            
            <h3 style="color: #ffa500;">⚠️ 重要提示</h3>
            <div style="background: rgba(255,165,0,0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #ffa500; margin-bottom: 15px;">
                <p style="margin: 0 0 8px 0; line-height: 1.6;">
                    <strong>关于歌曲缓存：</strong><br>
                    歌曲导入后若未播放过，刷新页面后可能出现播放失败的情况。已提供<strong>「一键缓存」</strong>功能和<strong>自动检测修复</strong>机制，但仍可能存在小问题。
                </p>
                <p style="margin: 0 0 8px 0; line-height: 1.6;">
                    <strong>建议：</strong><br>
                    • 歌单请分批少量导入<br>
                    • 导入后及时使用一键缓存功能
                </p>
                <p style="margin: 0; line-height: 1.6; opacity: 0.9;">
                    <strong>注：</strong>网易云分享链接使用第三方API解析（已获原作者授权），未来可能因不可抗力失效。已提供备选方案：URL直链导入、本地文件导入。
                </p>
            </div>
            
            <h3>📜 声明</h3>
            <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; line-height: 1.8;">
                <p style="margin: 0 0 8px 0;">
                    务必使用一键缓存！！一键缓存！！
                </p>
                <p style="margin: 0 0 8px 0;">
                    🚫 <strong>禁止二传</strong>，但允许私人分享。
                </p>
                <p style="margin: 0;">
                    如有Bug反馈或功能建议，欢迎联系作者：<br>
                    <strong style="color: #7eb8c9;">QQ: 2027932654</strong>
                </p>
            </div>
            
            <p style="text-align: center; margin-top: 20px; opacity: 0.6; font-size: 12px;">
                版本 1.0.6 | 作者：hy.禾一<br>
                感谢使用，食用愉快 ♪(･ω･)ﾉ
            </p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const closeBtn = overlay.querySelector('#help-close-btn');
    closeBtn.addEventListener('mouseenter', function() {
        this.style.opacity = '1';
        this.style.background = 'rgba(255,255,255,0.1)';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.opacity = '0.7';
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

function bindExtensionEvents() {
    const hiddenToggle = document.getElementById('player-hidden-toggle');
    if (hiddenToggle) {
        hiddenToggle.addEventListener('change', (e) => {
            const settings = getExtensionSettings();
            settings.playerHidden = e.target.checked;
            extension_settings[EXTENSION_NAME] = settings;
            saveSettingsDebounced();
            
            if (window.MusicPlayerApp) {
                if (settings.playerHidden) {
                    window.MusicPlayerApp.hideUI();
                } else {
                    window.MusicPlayerApp.showUI();
                }
            }
        });
    }
    
    const helpBtn = document.getElementById('show-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
    
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
}

function loadPlayerCore() {
    const scriptEl = document.createElement('script');
    scriptEl.src = '/scripts/extensions/third-party/HY-audio-player/player.js';
    scriptEl.onload = () => {
        console.log('✅ 播放器核心加载完成');
        
        setTimeout(() => {
            if (window.MusicPlayerApp) {
                const settings = getExtensionSettings();
                if (settings.playerHidden) {
                    window.MusicPlayerApp.hideUI();
                } else {
                    window.MusicPlayerApp.showUI();
                }
            }
        }, 500);
    };
    scriptEl.onerror = () => {
        console.error('❌ 播放器核心加载失败');
    };
    document.head.appendChild(scriptEl);
}
