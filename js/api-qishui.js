/**
 * api-qishui.js - 汽水音乐解析模块
 * 作者: hy.禾一
 * 说明：通过 https://api.rxtool.top/api/sodamusicanalysis.php 解析汽水音乐链接
 * 接口文档：https://api.rxtool.top/api/sodamusicanalysis.php?url=分享链接
 * 返回：{ name, url, cover, lyrics }
 */

// ==========================================
// 接口配置
// ==========================================
const QISHUI_BASE = 'https://api.rxtool.top/api/sodamusicanalysis.php';

// ==========================================
// 核心函数（与网易云接口完全一致）
// ==========================================

/**
 * 解析汽水音乐单曲
 * @param {string} link - 汽水音乐分享链接
 * @returns {Promise<{title, artist, url, lyrics, cover, neteaseId, source}>}
 */
async function fetchQishuiSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        // 请求汽水音乐接口
        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();

        // 检查返回数据
        if (!data || !data.name) {
            throw new Error('解析失败，请检查链接是否正确');
        }

        // 提取歌曲ID（从链接中提取，用于缓存标识）
        let songId = null;
        const idMatch = url.match(/id=(\d+)/) || url.match(/\/song\/(\d+)/);
        if (idMatch) songId = idMatch[1];

        return {
            title: data.name || '未知歌曲',
            artist: '汽水音乐',  // 接口未返回歌手信息，统一标注
            url: data.url || '',
            lyrics: data.lyrics || '',
            cover: data.cover || '',
            duration: '0:00',
            neteaseId: songId,  // 复用此字段存储汽水音乐ID
            source: 'qishui'     // 标记来源，便于后续扩展
        };
    } catch (error) {
        console.error('汽水音乐解析失败:', error);
        throw error;
    }
}

/**
 * 刷新播放链接
 * @param {string} link - 汽水音乐分享链接
 * @returns {Promise<string|null>}
 */
async function refreshQishuiSongUrl(link) {
    try {
        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(link)}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.url || null;
    } catch (e) {
        console.error('刷新链接失败:', e);
        return null;
    }
}

/**
 * 汽水音乐歌单解析（暂不支持）
 */
async function fetchQishuiPlaylist(link) {
    throw new Error('汽水音乐歌单解析暂不支持，请使用单曲链接');
}

// ==========================================
// 暴露到全局（与网易云接口命名保持一致）
// ==========================================
window.fetchQishuiSongInfo = fetchQishuiSongInfo;
window.refreshQishuiSongUrl = refreshQishuiSongUrl;
window.fetchQishuiPlaylist = fetchQishuiPlaylist;
