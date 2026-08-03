/**
 * ui.js - 音乐播放器界面模块
 * 版本: 1.0.6
 * 作者: hy.禾一
 * 说明：负责所有界面创建、更新、渲染，通过 window.MusicPlayerCore 读取状态
 */

// ============================================================
// 1. 加载样式
// ============================================================

function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/scripts/extensions/third-party/hy-yybfq/style.css';
    link.onload = () => console.log('✅ 播放器样式加载完成');
    link.onerror = () => console.error('❌ 播放器样式加载失败');
    document.head.appendChild(link);
}

// ============================================================
// 2. 创建 UI
// ============================================================

function createUI() {
    // 状态提示
    const statusEl = document.createElement('div');
    statusEl.id = 'player-status';
    statusEl.className = 'player-status';
    document.body.appendChild(statusEl);

    // 律动图标
    const rhythmIcon = document.createElement('div');
    rhythmIcon.id = 'player-rhythm-icon';
    rhythmIcon.className = 'player-rhythm-icon';

    let bars = '';
    const totalBars = 60;
    for (let i = 0; i < totalBars; i++) {
        const pos = i / totalBars;
        const isEdge = pos < 0.15 || pos > 0.85;

        let h, s;
        if (isEdge) {
            h = Math.random() * 8 + 2;
            s = Math.random() * 2 + 1.5;
        } else {
            h = Math.random() * 30 + 5;
            s = Math.random() * 0.5 + 0.3;
        }
        const d = Math.random() * 0.8;
        bars += `<div class="rhythm-bar ${isEdge ? 'edge-bar' : ''}" style="--h:${h}px; --d:${d}s; --s:${s}s"></div>`;
    }

    rhythmIcon.innerHTML = `
        <div class="rhythm-star star-left">✦</div>
        <div class="rhythm-star star-right">✦</div>
        <div class="rhythm-left-zone">
            <div class="zone-hint">拖拽</div>
        </div>
        <div class="rhythm-wave-box">${bars}</div>
        <div class="rhythm-base-line"></div>
        <div class="rhythm-right-zone">
            <div class="zone-hint">双击</div>
        </div>
    `;
    document.body.appendChild(rhythmIcon);

    // 播放器主体
    const root = document.createElement('div');
    root.id = 'player-root';
    root.innerHTML = `
        <div id="player-rgb-border" class="player-rgb-border"></div>
        <div id="player-island" class="player-island"></div>
        <div id="player-inner" class="player-inner">
            <div id="player-main-content">
                <div class="player-main">
                    <div id="player-cover" class="player-cover"></div>
                    <div class="player-center">
                        <div class="player-meta">
                            <div id="player-title" class="player-title">支持网易云直链</div>
                            <div id="player-artist" class="player-artist">功能按钮查看使用说明</div>
                        </div>
                        <div id="player-lyrics" class="player-lyrics">⋆……𖦤……⋆</div>
                        <div class="player-prog-wrap">
                            <input type="range" id="inp-prog" value="0" min="0" max="100">
                        </div>
                        <div class="player-controls">
                            <button type="button" id="btn-play-mode"></button>
                            <button type="button" id="btn-prev">⏮</button>
                            <button type="button" id="btn-play">▶</button>
                            <button type="button" id="btn-next">⏭</button>
                            <button type="button" id="btn-list">☰</button>
                        </div>
                    </div>
                    <div class="player-right">
                        <button type="button" id="btn-rhythm" title="律动模式">𓆝</button>
                        <button type="button" id="btn-settings" title="设置">♡</button>
                        <button type="button" id="btn-pure" title="纯享模式">𓆟</button>
                    </div>
                </div>

                <div id="panel-settings" class="player-panel">
                    <div class="panel-section-title">播放设置</div>
                    <div class="panel-row">
                        <span>倍速 <b id="val-speed">1.0x</b></span>
                        <input id="inp-speed" type="range" min="0.5" max="2.0" step="0.1">
                    </div>

                    <div class="panel-section-title">背景设置</div>
                    <div class="panel-row">
                        <span>全屏背景</span>
                        <div class="panel-bg-ctrl">
                            <input id="inp-expanded-col" type="color">
                            <button type="button" id="btn-expanded-upload" class="panel-upload-btn">上传</button>
                        </div>
                    </div>
                    <div class="panel-row">
                        <span>窄屏背景</span>
                        <div class="panel-bg-ctrl">
                            <input id="inp-collapsed-col" type="color">
                            <button type="button" id="btn-collapsed-upload" class="panel-upload-btn">上传</button>
                        </div>
                    </div>

                    <div class="panel-section-title">封面设置</div>
                    <div class="panel-row">
                        <span>封面图片</span>
                        <button type="button" id="btn-cover-upload" class="panel-upload-btn">上传</button>
                    </div>
                    <div class="panel-row">
                        <span>封面宽度 <b id="val-cover-w">80px</b></span>
                        <input id="inp-cover-w" type="range" min="60" max="150" step="5">
                    </div>
                    <div class="panel-row">
                        <span>封面高度 <b id="val-cover-h">80px</b></span>
                        <input id="inp-cover-h" type="range" min="60" max="150" step="5">
                    </div>

                    <div class="panel-section-title">RGB 模式</div>
                    <div class="panel-row">
                        <span>灯光模式</span>
                        <div class="panel-opt-group">
                            <div class="rgb-opt" data-val="0">关闭</div>
                            <div class="rgb-opt" data-val="1">单色</div>
                            <div class="rgb-opt" data-val="2">幻彩</div>
                        </div>
                    </div>
                    <div class="panel-row">
                        <span>单色颜色</span>
                        <input id="inp-rgb" type="color">
                    </div>

                    <div class="panel-section-title">歌词渐变色</div>
                    <div class="panel-row panel-col-2">
                        <label>起始色 <input id="inp-lyrics-start" type="color"></label>
                        <label>结束色 <input id="inp-lyrics-end" type="color"></label>
                    </div>

                    <div class="panel-section-title">颜色设置</div>
                    <div class="panel-row panel-col-2">
                        <label>字体颜色 <input id="inp-theme" type="color"></label>
                        <label>边框色 <input id="inp-border" type="color"></label>
                    </div>

                    <div class="panel-section-title">磨砂玻璃设置</div>
                    <div class="panel-row">
                        <span>启用磨砂效果</span>
                        <input id="sw-glass" type="checkbox" checked>
                    </div>
                    <div class="panel-row">
                        <span>透明度 <b id="val-glass-opacity">60%</b></span>
                        <input id="inp-glass-opacity" type="range" min="10" max="90" value="60">
                    </div>

                    <div class="panel-section-title">尺寸调整</div>
                    <div class="panel-row">
                        <span>播放器宽度 <b id="val-width-player">400px</b></span>
                        <input id="inp-width-player" type="range" min="300" max="600" step="10">
                    </div>
                    <div class="panel-row">
                        <span>播放器高度 <b id="val-height-player">180px</b></span>
                        <input id="inp-height-player" type="range" min="140" max="300" step="5">
                    </div>
                    <div class="panel-row">
                        <span>边框宽度 <b id="val-width">6px</b></span>
                        <input id="inp-width" type="range" min="1" max="20" step="1">
                    </div>
                </div>

                <div id="panel-list" class="player-panel">
                    <div id="list-box" class="list-box"></div>
                    <div class="panel-list-btns">
                        <button type="button" id="btn-add" class="panel-action-btn">+ 添加歌曲</button>
                        <button type="button" id="btn-cache-all" class="panel-action-btn">⟳ 一键缓存</button>
                    </div>
                </div>

                <div id="panel-history" class="player-panel">
                    <div class="panel-section-title">导入历史</div>
                    <div id="history-list" class="history-list"></div>
                </div>
            </div>

            <div id="player-pure-mode" class="player-pure-mode">
                <div id="pure-lyrics-container"></div>
            </div>
        </div>
    `;
    document.body.appendChild(root);
}

// ============================================================
// 3. 更新视图（已修 extension_settings 引用）
// ============================================================

function updateView() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    if (window.extension_settings?.['music_player']?.playerHidden) {
        const root = document.getElementById('player-root');
        const rhythmIcon = document.getElementById('player-rhythm-icon');
        if (root) root.style.display = 'none';
        if (rhythmIcon) rhythmIcon.style.display = 'none';
        return;
    }

    const root = document.getElementById('player-root');
    const rootRgb = document.getElementById('player-rgb-border');
    const inner = document.getElementById('player-inner');
    const rhythmIcon = document.getElementById('player-rhythm-icon');
    const cfg = core.state.cfg;

    if (!root || !inner || !rhythmIcon) return;

    root.style.left = core.state.playerPos.x + 'px';
    root.style.top = core.state.playerPos.y + 'px';
    rhythmIcon.style.left = core.state.rhythmIconPos.x + 'px';
    rhythmIcon.style.top = core.state.rhythmIconPos.y + 'px';

    root.style.setProperty('--border-w', cfg.borderWidth);
    root.style.setProperty('--rgb-single', cfg.rgbColor);
    root.style.setProperty('--player-h', cfg.playerHeight);
    root.style.setProperty('--lyrics-start', cfg.lyricsGradientStart);
    root.style.setProperty('--lyrics-end', cfg.lyricsGradientEnd);
    root.style.color = cfg.themeColor;
    root.style.width = cfg.playerWidth;
    rhythmIcon.style.setProperty('--rgb-single', cfg.rgbColor);

    const island = document.getElementById('player-island');
    if (island) {
        island.className = 'player-island';
        const mode = core.state.rgbMode;
        if (mode === 0) {
            island.style.background = cfg.borderColor;
        } else if (mode === 1) {
            island.classList.add('rgb-single-breathe');
            island.style.setProperty('--rgb-single', cfg.rgbColor);
        } else if (mode === 2) {
            island.classList.add('rgb-rainbow-breathe');
        }
    }

    let currentBg = core.state.panel ? cfg.expandedBg : cfg.collapsedBg;

    if (core.state.glass) {
        inner.classList.add('glass-mode');
        if (currentBg.startsWith('#')) {
            inner.style.background = window.hexToRgba(currentBg, core.state.glassOpacity);
        } else if (currentBg.startsWith('url')) {
            inner.style.background = `${currentBg}, rgba(0,0,0,${1 - core.state.glassOpacity})`;
            inner.style.backgroundSize = 'cover';
            inner.style.backgroundBlendMode = 'overlay';
        } else {
            inner.style.background = currentBg;
        }
        inner.style.setProperty('--glass-opacity', core.state.glassOpacity);
    } else {
        inner.classList.remove('glass-mode');
        inner.style.background = currentBg;
        inner.style.backdropFilter = 'none';
    }

    const coverEl = document.getElementById('player-cover');
    if (coverEl) {
        coverEl.style.backgroundImage = `url("${cfg.cover}")`;
        coverEl.style.width = cfg.coverWidth + 'px';
        coverEl.style.height = cfg.coverHeight + 'px';
    }

    if (rootRgb) {
        rootRgb.className = 'player-rgb-border';
        const mode = core.state.rgbMode;
        if (mode === 0) {
            rootRgb.style.background = cfg.borderColor;
        } else if (mode === 1) {
            rootRgb.classList.add('mode-single');
        } else if (mode === 2) {
            rootRgb.classList.add('mode-rainbow');
        }
    }

    rhythmIcon.className = 'player-rhythm-icon';
    if (core.state.isPlaying) rhythmIcon.classList.add('playing');
    if (core.state.rgbMode === 1) rhythmIcon.classList.add('rgb-single');
    if (core.state.rgbMode === 2) rhythmIcon.classList.add('rgb-rainbow');

    if (core.state.isRhythmMode) {
        root.style.display = 'none';
        rhythmIcon.style.display = 'flex';
    } else {
        root.style.display = 'flex';
        rhythmIcon.style.display = 'none';
    }

    root.classList.toggle('pure-mode', core.state.isPureMode);
    updatePureLyrics();

    const modeBtn = document.getElementById('btn-play-mode');
    if (modeBtn) {
        const svgs = [
            '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
            '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="10" y="17" font-size="8" stroke="none" fill="currentColor">1</text></svg>',
            '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>'
        ];
        modeBtn.innerHTML = svgs[core.state.playMode];
    }

    const t = core.playlist[core.index];
    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');

    if (titleEl) titleEl.innerText = t ? t.title : '支持网易云直链';
    if (artistEl) artistEl.innerText = t ? t.artist : '功能按钮查看使用说明';

    updateSettingsPanel();
}

function updateSettingsPanel() {
    const core = window.MusicPlayerCore;
    if (!core) return;
    const cfg = core.state.cfg;

    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setValue('inp-theme', cfg.themeColor);
    setValue('inp-border', cfg.borderColor);
    setValue('inp-rgb', cfg.rgbColor);
    setValue('inp-lyrics-start', cfg.lyricsGradientStart);
    setValue('inp-lyrics-end', cfg.lyricsGradientEnd);
    setValue('inp-expanded-col', cfg.expandedBg.startsWith('#') ? cfg.expandedBg : '#1a1a1a');
    setValue('inp-collapsed-col', cfg.collapsedBg.startsWith('#') ? cfg.collapsedBg : '#1a1a1a');

    const glassToggle = document.getElementById('sw-glass');
    if (glassToggle) glassToggle.checked = core.state.glass;

    setValue('inp-glass-opacity', Math.round(core.state.glassOpacity * 100));
    setText('val-glass-opacity', Math.round(core.state.glassOpacity * 100) + '%');

    setValue('inp-speed', core.state.speed);
    setText('val-speed', core.state.speed + 'x');

    setValue('inp-width', parseInt(cfg.borderWidth));
    setText('val-width', cfg.borderWidth);

    setValue('inp-width-player', parseInt(cfg.playerWidth));
    setText('val-width-player', cfg.playerWidth);

    setValue('inp-height-player', parseInt(cfg.playerHeight));
    setText('val-height-player', cfg.playerHeight);

    setValue('inp-cover-w', cfg.coverWidth);
    setText('val-cover-w', cfg.coverWidth + 'px');

    setValue('inp-cover-h', cfg.coverHeight);
    setText('val-cover-h', cfg.coverHeight + 'px');

    const rgbOpts = document.querySelectorAll('.rgb-opt');
    rgbOpts.forEach(opt => {
        opt.classList.toggle('active', parseInt(opt.dataset.val) === core.state.rgbMode);
    });
}

// ============================================================
// 4. 歌词相关
// ============================================================

function updateLyrics() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    if (!core.state.lyrics.length) {
        const lyricsEl = document.getElementById('player-lyrics');
        if (lyricsEl) lyricsEl.innerText = '⋆……𖦤……⋆';
        return;
    }

    const time = core.audio.currentTime;
    let currentLine = '';
    for (let i = 0; i < core.state.lyrics.length; i++) {
        if (time >= core.state.lyrics[i].time) {
            currentLine = core.state.lyrics[i].text;
        } else {
            break;
        }
    }
    const lyricsEl = document.getElementById('player-lyrics');
    if (lyricsEl) lyricsEl.innerText = currentLine || '⋆……𖦤……⋆';

    if (core.state.isPureMode) {
        updatePureLyrics();
    }
}

function updatePureLyrics() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const container = document.getElementById('pure-lyrics-container');
    if (!container) return;

    if (!core.state.lyrics.length) {
        container.innerHTML = '<div class="pure-lyric-line active no-lyrics">晚睡的小孩不会有美梦光临哦</div>';
        return;
    }

    const time = core.audio.currentTime;
    let currentIndex = -1;

    for (let i = 0; i < core.state.lyrics.length; i++) {
        if (time >= core.state.lyrics[i].time) {
            currentIndex = i;
        } else {
            break;
        }
    }

    if (currentIndex !== core.state.currentLyricIndex) {
        core.state.currentLyricIndex = currentIndex;
        renderPureLyrics(currentIndex);
    }

    if (currentIndex >= 0 && currentIndex < core.state.lyrics.length - 1) {
        const currentLyric = core.state.lyrics[currentIndex];
        const nextLyric = core.state.lyrics[currentIndex + 1];
        const duration = nextLyric.time - currentLyric.time;
        const elapsed = time - currentLyric.time;
        const progress = Math.min(elapsed / duration * 100, 100);

        const activeLine = container.querySelector('.pure-lyric-line.active');
        if (activeLine) {
            activeLine.style.setProperty('--lyric-progress', progress + '%');
        }
    }
}

function renderPureLyrics(currentIndex) {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const container = document.getElementById('pure-lyrics-container');
    if (!container) return;

    container.innerHTML = '';

    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(core.state.lyrics.length, currentIndex + 3);

    for (let i = start; i < end; i++) {
        const line = document.createElement('div');
        line.className = 'pure-lyric-line';
        line.innerText = core.state.lyrics[i].text;

        if (i === currentIndex) {
            line.classList.add('active');
        } else if (i < currentIndex) {
            line.classList.add('passed');
        }

        container.appendChild(line);
    }
}

// ============================================================
// 5. 列表渲染
// ============================================================

function renderList() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const list = document.getElementById('list-box');
    if (!list) return;

    list.innerHTML = '';
    core.playlist.forEach((t, i) => {
        const item = document.createElement('div');
        item.className = `list-item ${i === core.index ? 'active' : ''}`;
        const sourceLabel = t.source === 'qishui' ? '🍹' : '🎵';
        item.innerHTML = `
            <div class="item-info"><b>${t.title} - ${t.artist}</b> <span style="opacity:0.4;font-size:11px;">${sourceLabel}</span></div>
            <div class="item-btns">
                <button type="button" class="btn-lyrics">歌词</button>
                <button type="button" class="btn-del">×</button>
            </div>
        `;
        item.querySelector('.item-info').onclick = () => {
            if (core) core.play(i);
        };
        item.querySelector('.btn-del').onclick = () => {
            if (typeof window.delSong === 'function') {
                window.delSong(i);
            }
        };
        item.querySelector('.btn-lyrics').onclick = () => {
            if (typeof window.showLyricsDialog === 'function') {
                window.showLyricsDialog(i);
            }
        };
        list.appendChild(item);
    });
}

function renderImportHistory() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const container = document.getElementById('history-list');
    if (!container) return;

    if (core.state.importHistory.length === 0) {
        container.innerHTML = '<div class="no-history">暂无导入历史</div>';
        return;
    }

    let html = '';
    core.state.importHistory.forEach((history) => {
        const time = history.time;
        const sourceLabel = history.data.source === 'qishui' ? '🍹' : '🎵';

        if (history.type === 'single') {
            html += `
                <div class="history-item">
                    <div class="history-icon">${sourceLabel}</div>
                    <div class="history-content">
                        <div class="history-title">${history.data.title}</div>
                        <div class="history-sub">${history.data.artist}</div>
                    </div>
                    <div class="history-time">${time}</div>
                </div>
            `;
        } else if (history.type === 'playlist') {
            html += `
                <div class="history-item">
                    <div class="history-icon">📋</div>
                    <div class="history-content">
                        <div class="history-title">${history.data.name}</div>
                        <div class="history-sub">${history.data.creator} • ${history.data.count} 首</div>
                    </div>
                    <div class="history-time">${time}</div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

// ============================================================
// 6. 模式切换
// ============================================================

function togglePanel(type) {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const root = document.getElementById('player-root');
    const p1 = document.getElementById('panel-settings');
    const p2 = document.getElementById('panel-list');
    const p3 = document.getElementById('panel-history');

    if (core.state.panel === type) {
        root.classList.remove('expanded');
        p1.style.display = p2.style.display = p3.style.display = 'none';
        core.state.panel = false;
    } else {
        root.classList.add('expanded');
        p1.style.display = type === 'settings' ? 'flex' : 'none';
        p2.style.display = type === 'list' ? 'flex' : 'none';
        p3.style.display = type === 'history' ? 'flex' : 'none';
        core.state.panel = type;

        if (type === 'history') {
            renderImportHistory();
        }
    }
    updateView();
}

function togglePureMode() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    core.state.isPureMode = !core.state.isPureMode;
    core.state.currentLyricIndex = -1;
    updateView();
    core.saveData();
}

function toggleRhythmMode() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    core.state.isRhythmMode = !core.state.isRhythmMode;
    updateView();
    core.saveData();
}

// ============================================================
// 7. 显示/隐藏 UI（已修 extension_settings 引用）
// ============================================================

function showUI() {
    if (window.extension_settings?.['music_player']?.playerHidden) return;

    const core = window.MusicPlayerCore;
    if (!core) return;

    const root = document.getElementById('player-root');
    const rhythmIcon = document.getElementById('player-rhythm-icon');

    if (core.state.isRhythmMode) {
        if (root) root.style.display = 'none';
        if (rhythmIcon) rhythmIcon.style.display = 'flex';
    } else {
        if (root) root.style.display = 'flex';
        if (rhythmIcon) rhythmIcon.style.display = 'none';
    }

    updateView();
}

function hideUI() {
    const root = document.getElementById('player-root');
    const rhythmIcon = document.getElementById('player-rhythm-icon');
    if (root) root.style.display = 'none';
    if (rhythmIcon) rhythmIcon.style.display = 'none';
}

// ============================================================
// 8. 添加歌曲（含来源选择）
// ============================================================

function addUrlSong() {
    if (typeof window.showInputDialog !== 'function') return;

    // ===== 第一步：弹出选择界面 =====
    const overlay = document.createElement('div');
    overlay.className = 'player-dialog-overlay';
    overlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important; background: rgba(0, 0, 0, 0.8) !important; margin: 0 !important; padding: 20px !important; box-sizing: border-box !important;';

    overlay.innerHTML = `
        <div class="player-dialog" style="
            background: #2a2a2a !important;
            border-radius: 16px !important;
            padding: 25px !important;
            max-width: 90% !important;
            width: 340px !important;
            text-align: center !important;
            color: #fff !important;
            box-shadow: 0 15px 35px rgba(0,0,0,0.5) !important;
            margin: auto !important;
            position: relative !important;
            z-index: 2147483647 !important;
        ">
            <div class="dialog-title" style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">选择音乐来源</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button id="source-netease" class="source-btn" style="
                    padding: 14px;
                    background: rgba(255,255,255,0.08);
                    border: 2px solid rgba(255,255,255,0.15);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                ">🎵 网易云音乐</button>
                <button id="source-qishui" class="source-btn" style="
                    padding: 14px;
                    background: rgba(255,255,255,0.08);
                    border: 2px solid rgba(255,255,255,0.15);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                ">🍹 汽水音乐</button>
                <button id="source-cancel" style="
                    margin-top: 8px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.25);
                    color: rgba(255,255,255,0.6);
                    padding: 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                ">取消</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeOverlay = () => overlay.remove();

    overlay.querySelector('#source-netease').onclick = () => {
        closeOverlay();
        window.showInputDialog(
            '添加网易云单曲',
            '请输入网易云歌曲链接\n支持格式：\n• music.163.com/song?id=xxx\n• 163cn.tv/xxx（短链接）',
            async (input) => {
                if (!window.isNeteaseLink || !window.isNeteaseLink(input)) {
                    window.showStatus('请输入有效的网易云链接', 'error');
                    return;
                }
                await doAddSong(input, 'netease');
            }
        );
    };

    overlay.querySelector('#source-qishui').onclick = () => {
        closeOverlay();
        window.showInputDialog(
            '添加汽水单曲',
            '请输入汽水音乐分享链接',
            async (input) => {
                if (!input.includes('qishui') && !input.includes('douyin') && !input.includes('music')) {
                    window.showStatus('请输入有效的汽水音乐链接', 'error');
                    return;
                }
                await doAddSong(input, 'qishui');
            }
        );
    };

    overlay.querySelector('#source-cancel').onclick = closeOverlay;
    overlay.onclick = (e) => { if (e.target === overlay) closeOverlay(); };
}

// ============================================================
// 实际执行添加（根据来源调用不同接口）
// ============================================================
async function doAddSong(input, source) {
    const core = window.MusicPlayerCore;
    if (!core) {
        window.showStatus('播放器未初始化', 'error');
        return;
    }

    window.showStatus(`正在解析${source === 'netease' ? '网易云' : '汽水音乐'}链接...`, 'info');

    try {
        let songInfo;
        if (source === 'netease') {
            if (typeof window.fetchNeteaseSongInfo !== 'function') {
                throw new Error('网易云解析模块未加载');
            }
            songInfo = await window.fetchNeteaseSongInfo(input);
        } else {
            if (typeof window.fetchQishuiSongInfo !== 'function') {
                throw new Error('汽水音乐解析模块未加载');
            }
            songInfo = await window.fetchQishuiSongInfo(input);
        }

        core.playlist.push({
            title: songInfo.title,
            artist: songInfo.artist,
            url: songInfo.url,
            lyrics: songInfo.lyrics || '',
            cover: songInfo.cover || '',
            neteaseId: songInfo.neteaseId || null,
            source: source
        });

        core.addImportHistory('single', {
            title: songInfo.title,
            artist: songInfo.artist,
            link: input,
            source: source
        });

        core.saveData();
        renderList();
        window.showStatus(`成功添加: ${songInfo.title}`, 'success');

        if (core.index === -1) {
            core.play(core.playlist.length - 1);
        }
    } catch (error) {
        window.showStatus(`添加失败: ${error.message}`, 'error');
    }
}

// ============================================================
// 9. 添加歌单（仅网易云）
// ============================================================

function addPlaylist() {
    if (typeof window.showInputDialog !== 'function') return;

    window.showInputDialog(
        '添加歌单',
        '请输入网易云歌单链接\n支持格式：\n• music.163.com/playlist?id=xxx\n• 163cn.tv/xxx（短链接）',
        async (input) => {
            if ((!window.isPlaylistLink || !window.isPlaylistLink(input)) &&
                (!window.isNeteaseLink || !window.isNeteaseLink(input))) {
                window.showStatus('请输入有效的歌单链接', 'error');
                return;
            }

            window.showStatus('正在解析歌单...', 'info');

            try {
                const playlist = await window.fetchNeteasePlaylist(input);
                const core = window.MusicPlayerCore;

                if (!playlist.tracks || playlist.tracks.length === 0) {
                    window.showStatus('歌单为空或无法获取歌曲列表', 'error');
                    return;
                }

                if (typeof window.showConfirmDialog === 'function') {
                    window.showConfirmDialog(
                        '确认导入',
                        `<div style="text-align:left;line-height:1.8;">
                            <p><strong>歌单：</strong>${playlist.name}</p>
                            <p><strong>创建者：</strong>${playlist.creator}</p>
                            <p><strong>歌曲数：</strong>${playlist.tracks.length} 首</p>
                            <p style="margin-top:10px;opacity:0.8;">是否全部添加到播放列表？</p>
                        </div>`,
                        () => importPlaylistTracks(playlist, input)
                    );
                }
            } catch (error) {
                window.showStatus(`歌单解析失败: ${error.message}`, 'error');
            }
        }
    );
}

async function importPlaylistTracks(playlist, link) {
    const core = window.MusicPlayerCore;
    if (!core) return;

    window.showStatus(`正在导入 ${playlist.tracks.length} 首歌曲...`, 'info');
    if (typeof window.showCacheProgress === 'function') {
        window.showCacheProgress(0, playlist.tracks.length);
    }

    let addedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < playlist.tracks.length; i++) {
        const track = playlist.tracks[i];
        const songLink = `music.163.com/song?id=${track.id}`;

        if (typeof window.updateCacheProgress === 'function') {
            window.updateCacheProgress(i + 1, playlist.tracks.length, track.name);
        }

        try {
            const songInfo = await window.fetchNeteaseSongInfo(songLink);

            core.playlist.push({
                title: track.name,
                artist: track.artists,
                url: songInfo.url,
                lyrics: songInfo.lyrics || '',
                cover: track.picUrl || songInfo.cover,
                neteaseId: track.id.toString(),
                source: 'netease'
            });

            addedCount++;
        } catch (error) {
            console.error(`歌曲 ${track.name} 导入失败:`, error);
            failedCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (typeof window.hideCacheProgress === 'function') {
        window.hideCacheProgress();
    }

    core.addImportHistory('playlist', {
        name: playlist.name,
        creator: playlist.creator,
        count: playlist.tracks.length,
        link: link
    });

    core.saveData();
    renderList();

    if (addedCount > 0) {
        window.showStatus(`歌单导入完成！成功 ${addedCount} 首，失败 ${failedCount} 首`, 'success');
    } else {
        window.showStatus('没有歌曲成功导入', 'error');
    }

    if (core.index === -1 && core.playlist.length > 0) {
        core.play(0);
    }
}

// ============================================================
// 10. 事件绑定
// ============================================================

function bindEvents() {
    const core = window.MusicPlayerCore;
    if (!core) {
        console.error('❌ MusicPlayerCore 未加载，无法绑定事件');
        return;
    }

    const root = document.getElementById('player-root');
    const rhythmIcon = document.getElementById('player-rhythm-icon');
    const island = document.getElementById('player-island');
    const leftZone = rhythmIcon?.querySelector('.rhythm-left-zone');
    const rightZone = rhythmIcon?.querySelector('.rhythm-right-zone');

    // ===== 播放器拖拽 =====
    if (island) {
        const handlePlayerDrag = (e) => {
            e.preventDefault();
            const startX = e.clientX || e.touches[0].clientX;
            const startY = e.clientY || e.touches[0].clientY;
            core.drag.active = true;
            core.drag.offX = startX - root.offsetLeft;
            core.drag.offY = startY - root.offsetTop;

            const move = (ev) => {
                if (!core.drag.active) return;
                ev.preventDefault();
                const cx = ev.clientX || ev.touches[0].clientX;
                const cy = ev.clientY || ev.touches[0].clientY;
                const x = cx - core.drag.offX;
                const y = cy - core.drag.offY;
                root.style.left = x + 'px';
                root.style.top = y + 'px';
                core.state.playerPos = { x, y };
            };

            const up = () => {
                core.drag.active = false;
                core.saveData();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('mouseup', up);
                document.removeEventListener('touchend', up);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('mouseup', up);
            document.addEventListener('touchend', up);
        };

        island.addEventListener('mousedown', handlePlayerDrag);
        island.addEventListener('touchstart', handlePlayerDrag);
    }

    // ===== 律动模式拖拽 =====
    if (leftZone) {
        const handleRhythmDrag = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX || e.touches[0].clientX;
            const startY = e.clientY || e.touches[0].clientY;
            core.drag.active = true;
            core.drag.offX = startX - rhythmIcon.offsetLeft;
            core.drag.offY = startY - rhythmIcon.offsetTop;

            const move = (ev) => {
                if (!core.drag.active) return;
                ev.preventDefault();
                const cx = ev.clientX || ev.touches[0].clientX;
                const cy = ev.clientY || ev.touches[0].clientY;
                const x = cx - core.drag.offX;
                const y = cy - core.drag.offY;
                rhythmIcon.style.left = x + 'px';
                rhythmIcon.style.top = y + 'px';
                core.state.rhythmIconPos = { x, y };
            };

            const up = () => {
                core.drag.active = false;
                core.saveData();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('mouseup', up);
                document.removeEventListener('touchend', up);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('mouseup', up);
            document.addEventListener('touchend', up);
        };

        leftZone.addEventListener('mousedown', handleRhythmDrag);
        leftZone.addEventListener('touchstart', handleRhythmDrag);
    }

    // ===== 律动模式右侧双击返回 =====
    if (rightZone) {
        let lastClickTime = 0;
        const handleRightClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const now = Date.now();
            if (now - lastClickTime < 300) {
                core.state.isRhythmMode = false;
                window.updateView();
                core.saveData();
                lastClickTime = 0;
            } else {
                lastClickTime = now;
            }
        };

        rightZone.addEventListener('click', handleRightClick);
        rightZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleRightClick(e);
        });
    }

    // ===== 按钮事件绑定 =====
    const click = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = (e) => { e.stopPropagation(); fn(e); };
    };

    click('btn-rhythm', () => {
        core.state.isRhythmMode = true;
        window.updateView();
        core.saveData();
    });

    click('btn-play', () => core.toggle());
    click('btn-next', () => core.next());
    click('btn-prev', () => core.prev());

    click('btn-play-mode', () => {
        core.state.playMode = (core.state.playMode + 1) % 3;
        window.updateView();
        core.saveData();
    });

    click('btn-settings', () => window.togglePanel('settings'));
    click('btn-list', () => window.togglePanel('list'));
    click('btn-history', () => window.togglePanel('history'));
    click('btn-add', () => window.showAddOptions());
    click('btn-pure', () => window.togglePureMode());
    click('player-pure-mode', () => window.togglePureMode());
    click('btn-cache-all', () => core.cacheAllSongs());

    // 封面/背景上传
    click('btn-cover-upload', () => {
        window.createFileInput('image/*', (file) => {
            window.handleFileUpload(file, (dataUrl) => {
                core.state.cfg.cover = dataUrl;
                window.updateView();
                core.saveData();
            });
        });
    });

    click('btn-expanded-upload', () => {
        window.createFileInput('image/*', (file) => {
            window.handleFileUpload(file, (dataUrl) => {
                core.state.cfg.expandedBg = `url("${dataUrl}")`;
                window.updateView();
                core.saveData();
            });
        });
    });

    click('btn-collapsed-upload', () => {
        window.createFileInput('image/*', (file) => {
            window.handleFileUpload(file, (dataUrl) => {
                core.state.cfg.collapsedBg = `url("${dataUrl}")`;
                window.updateView();
                core.saveData();
            });
        });
    });

    // ===== 设置面板控件 =====
    const bgColorChange = (id, key) => {
        const el = document.getElementById(id);
        if (el) {
            el.oninput = (e) => {
                core.state.cfg[key] = e.target.value;
                window.updateView();
            };
            el.onchange = () => core.saveData();
        }
    };

    bgColorChange('inp-expanded-col', 'expandedBg');
    bgColorChange('inp-collapsed-col', 'collapsedBg');

    const change = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onchange = (e) => { fn(e.target.value); core.saveData(); };
    };

    change('inp-theme', v => { core.state.cfg.themeColor = v; window.updateView(); });
    change('inp-border', v => { core.state.cfg.borderColor = v; window.updateView(); });
    change('inp-rgb', v => { core.state.cfg.rgbColor = v; window.updateView(); });
    change('inp-lyrics-start', v => { core.state.cfg.lyricsGradientStart = v; window.updateView(); });
    change('inp-lyrics-end', v => { core.state.cfg.lyricsGradientEnd = v; window.updateView(); });

    document.querySelectorAll('.rgb-opt').forEach(opt => {
        opt.onclick = () => {
            core.state.rgbMode = parseInt(opt.dataset.val);
            window.updateView();
            core.saveData();
        };
    });

    const glassToggle = document.getElementById('sw-glass');
    if (glassToggle) {
        glassToggle.onchange = (e) => {
            core.state.glass = e.target.checked;
            window.updateView();
            core.saveData();
        };
    }

    const glassOpacityInput = document.getElementById('inp-glass-opacity');
    if (glassOpacityInput) {
        glassOpacityInput.oninput = (e) => {
            core.state.glassOpacity = parseInt(e.target.value) / 100;
            window.updateView();
        };
        glassOpacityInput.onchange = () => core.saveData();
    }

    const speedInput = document.getElementById('inp-speed');
    if (speedInput) {
        speedInput.oninput = (e) => {
            core.state.speed = parseFloat(e.target.value);
            core.audio.playbackRate = core.state.speed;
            window.updateView();
        };
        speedInput.onchange = () => core.saveData();
    }

    const borderWidthInput = document.getElementById('inp-width');
    if (borderWidthInput) {
        borderWidthInput.oninput = (e) => {
            core.state.cfg.borderWidth = e.target.value + 'px';
            window.updateView();
        };
        borderWidthInput.onchange = () => core.saveData();
    }

    const playerWidthInput = document.getElementById('inp-width-player');
    if (playerWidthInput) {
        playerWidthInput.oninput = (e) => {
            core.state.cfg.playerWidth = e.target.value + 'px';
            window.updateView();
        };
        playerWidthInput.onchange = () => core.saveData();
    }

    const playerHeightInput = document.getElementById('inp-height-player');
    if (playerHeightInput) {
        playerHeightInput.oninput = (e) => {
            core.state.cfg.playerHeight = e.target.value + 'px';
            window.updateView();
        };
        playerHeightInput.onchange = () => core.saveData();
    }

    const coverWInput = document.getElementById('inp-cover-w');
    if (coverWInput) {
        coverWInput.oninput = (e) => {
            core.state.cfg.coverWidth = parseInt(e.target.value);
            window.updateView();
        };
        coverWInput.onchange = () => core.saveData();
    }

    const coverHInput = document.getElementById('inp-cover-h');
    if (coverHInput) {
        coverHInput.oninput = (e) => {
            core.state.cfg.coverHeight = parseInt(e.target.value);
            window.updateView();
        };
        coverHInput.onchange = () => core.saveData();
    }

    const progInput = document.getElementById('inp-prog');
    if (progInput) {
        progInput.oninput = (e) => {
            if (core.audio.duration) {
                core.audio.currentTime = (e.target.value / 100) * core.audio.duration;
            }
        };
    }

    console.log('✅ 播放器事件绑定完成');
}

// ============================================================
// 暴露到全局
// ============================================================

window.loadCSS = loadCSS;
window.createUI = createUI;
window.updateView = updateView;
window.updateSettingsPanel = updateSettingsPanel;
window.updateLyrics = updateLyrics;
window.updatePureLyrics = updatePureLyrics;
window.renderPureLyrics = renderPureLyrics;
window.renderList = renderList;
window.renderImportHistory = renderImportHistory;
window.togglePanel = togglePanel;
window.togglePureMode = togglePureMode;
window.toggleRhythmMode = toggleRhythmMode;
window.showUI = showUI;
window.hideUI = hideUI;
window.addUrlSong = addUrlSong;
window.addPlaylist = addPlaylist;
window.importPlaylistTracks = importPlaylistTracks;
window.bindEvents = bindEvents;
