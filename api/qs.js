/**
 * api/qs.js - 汽水音乐解析模块
 * 作者: hy.禾一
 * 说明：使用 https://api.pearapi.ai/api/qishui_music 作为数据源
 */

// ==========================================
// 接口配置
// ==========================================
const QISHUI_BASE = 'https://api.pearapi.ai/api/qishui_music';

// ==========================================
// 1. 获取单曲信息（导入时使用）
// ==========================================

/**
 * 解析汽水音乐单曲
 * @param {string} link - 汽水音乐分享链接
 * @returns {Promise<{ title, artist, url, lyrics, cover, shareLink }>}
 */
async function fetchQishuiSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        // 汽水音乐 API 直接用 url 参数
        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (data.code !== 200) throw new Error(data.msg || '解析失败');

        const song = data.data;
        if (!song || !song.song_name) {
            throw new Error('未找到歌曲信息');
        }

        return {
            title: song.song_name || '未知歌曲',
            artist: song.singers || '未知艺术家',
            url: song.url || '',
            lyrics: song.lyrics || '',
            cover: song.cover || '',
            duration: '0:00',
            shareLink: url,        // 存储用户输入的原始链接（刷新时用）
            source: 'qishui'
        };
    } catch (error) {
        console.error('汽水音乐解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接（失效时使用）
// ==========================================

/**
 * 刷新汽水音乐播放链接
 * @param {Object} track - 歌曲对象
 * @param {string} track.shareLink - 存储的分享链接
 * @returns {Promise<string|null>} 新的播放链接
 */
async function refreshQishuiSongUrl(track) {
    if (!track || !track.shareLink) return null;
    
    try {
        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(track.shareLink)}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.code !== 200) return null;
        return data.data?.url || null;
    } catch (e) {
        console.error('刷新汽水链接失败:', e);
        return null;
    }
}

// ==========================================
// 3. 汽水音乐歌单（暂不支持）
// ==========================================

async function fetchQishuiPlaylist(link) {
    throw new Error('汽水音乐歌单解析暂不支持，请使用单曲链接');
}

// ==========================================
// 暴露到全局
// ==========================================

window.fetchQishuiSongInfo = fetchQishuiSongInfo;
window.refreshQishuiSongUrl = refreshQishuiSongUrl;
window.fetchQishuiPlaylist = fetchQishuiPlaylist;
