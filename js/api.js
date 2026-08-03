/**
 * api.js - 音乐播放器网络请求模块（qijieya 通道，照抄 injahow 逻辑）
 * 作者: hy.禾一
 */

// ==========================================
// 🛡️ 防盗链破解
// ==========================================
(function injectNoReferrer() {
    if (!document.querySelector('meta[name="referrer"]')) {
        const meta = document.createElement('meta');
        meta.name = "referrer";
        meta.content = "no-referrer";
        document.head.appendChild(meta);
        console.log("🛡️ 已自动穿上隐身衣");
    }
})();

// ==========================================
// 接口配置（只换这里）
// ==========================================
const BASE_URL = 'https://api.injahow.cn/meting/';

// ==========================================
// 工具函数
// ==========================================
function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : null;
}

function isNeteaseLink(url) {
    const str = String(url).trim();
    return /^\d+$/.test(str) || str.includes('163');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    return /^\d+$/.test(str) || url.includes('playlist');
}

// ==========================================
// 1. 获取歌曲信息
// ==========================================
async function fetchNeteaseSongInfo(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) {
            throw new Error('请输入纯数字 ID 或标准长链接');
        }

        const response = await fetch(`${BASE_URL}?server=netease&type=song&id=${reqId}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        
        const data = await response.json();
        if (!data || data.length === 0) throw new Error('未找到歌曲信息');
        
        const song = data[0];

        let lyricText = '';
        if (song.lrc) {
            try {
                const lrcRes = await fetch(song.lrc);
                lyricText = await lrcRes.text();
            } catch (e) {}
        }

        return {
            title: song.name || '未知歌曲',
            artist: song.artist || '未知艺术家',
            url: song.url,
            lyrics: lyricText,
            cover: song.pic || '',
            duration: '0:00',
            neteaseId: reqId
        };
    } catch (error) {
        console.error('单曲解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接
// ==========================================
async function refreshSongUrl(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) return null;
        const res = await fetch(`${BASE_URL}?server=netease&type=url&id=${reqId}`);
        const data = await res.json();
        return data.url || (data[0] && data[0].url) || null;
    } catch (e) {
        return null;
    }
}

// ==========================================
// 3. 获取歌单
// ==========================================
async function fetchNeteasePlaylist(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) throw new Error('请输入纯数字 ID 或长链接');

        const response = await fetch(`${BASE_URL}?server=netease&type=playlist&id=${reqId}`);
        if (!response.ok) throw new Error(`网络请求失败: ${response.status}`);
        
        const data = await response.json();
        if (!data || data.length === 0) {
            throw new Error('该歌单为空，或接口暂不支持解析');
        }

        return {
            name: '网易云导入歌单',
            creator: 'Meting API',
            description: '公共接口解析',
            coverImgUrl: data[0]?.pic || '',
            trackCount: data.length,
            tracks: data.map(song => {
                const idMatch = song.url ? song.url.match(/id=(\d+)/) : null;
                const songId = idMatch ? idMatch[1] : reqId;

                return {
                    id: songId,
                    name: song.name || '未知歌曲',
                    artists: song.artist || '未知艺术家',
                    album: '未知专辑',
                    picUrl: song.pic || ''
                };
            }).filter(t => t.id)
        };
    } catch (error) {
        console.error('获取歌单失败:', error);
        throw error;
    }
}

// ==========================================
// 暴露到全局
// ==========================================
window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.extractNeteaseId = extractNeteaseId;
