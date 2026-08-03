/**
 * api.js - 音乐播放器网络请求模块
 * 版本: Meting-API (阿里云公共节点版)
 * 作者: hy.禾一
 * 说明：使用 https://api.aliyuncs.com/meting 作为数据源
 */

// ==========================================
// 🛡️ 自动注入防盗链破解标签
// ==========================================
(function injectNoReferrer() {
    if (!document.querySelector('meta[name="referrer"]')) {
        const meta = document.createElement('meta');
        meta.name = "referrer";
        meta.content = "no-referrer";
        document.head.appendChild(meta);
        console.log("🛡️ 已自动穿上隐身衣，防盗链已失效！");
    }
})();

// ==========================================
// 接口配置
// ==========================================
const BASE_URL = 'https://api.aliyuncs.com/meting';

// ==========================================
// 工具函数：提取纯数字ID
// ==========================================
function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (strLink.includes('163cn.tv')) return null; // 拦截短链
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : null;
}

function isNeteaseLink(url) {
    const str = String(url).trim();
    if (str.includes('163cn.tv')) return false;
    return /^\d+$/.test(str) || str.includes('163');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    if (str.includes('163cn.tv')) return false;
    return /^\d+$/.test(str) || url.includes('playlist');
}

// ==========================================
// 1. 获取歌曲信息（单曲）
// ==========================================
async function fetchNeteaseSongInfo(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) {
            throw new Error('请输入纯数字 ID 或标准长链接');
        }

        // 用阿里云节点获取歌曲信息
        const response = await fetch(`${BASE_URL}?server=netease&type=song&id=${reqId}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (!data || data.length === 0) throw new Error('未找到歌曲信息');

        const song = data[0];

        // 获取歌词
        let lyricText = '';
        try {
            const lrcRes = await fetch(`${BASE_URL}?server=netease&type=lrc&id=${reqId}`);
            if (lrcRes.ok) {
                lyricText = await lrcRes.text();
            }
        } catch (e) {
            console.log('歌词获取失败，跳过');
        }

        return {
            title: song.name || '未知歌曲',
            artist: song.artist || '未知艺术家',
            url: song.url || '',
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
// 2. 刷新播放链接（阿里云节点返回纯文本直链）
// ==========================================
async function refreshSongUrl(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) return null;

        const res = await fetch(`${BASE_URL}?server=netease&type=url&id=${reqId}`);
        if (!res.ok) return null;

        // 阿里云节点返回的是纯文本直链
        const url = await res.text();
        return url || null;
    } catch (e) {
        console.error('刷新链接失败:', e);
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

        // 获取歌单名称（从第一首歌的专辑信息里取，或者用默认名）
        const playlistName = data[0]?.album || '网易云歌单';

        return {
            name: playlistName,
            creator: 'Meting API',
            description: '阿里云公共节点解析',
            coverImgUrl: data[0]?.pic || '',
            trackCount: data.length,
            tracks: data.map(song => {
                const idMatch = song.url ? song.url.match(/id=(\d+)/) : null;
                const songId = idMatch ? idMatch[1] : reqId;

                return {
                    id: songId,
                    name: song.name || '未知歌曲',
                    artists: song.artist || '未知艺术家',
                    album: song.album || '未知专辑',
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
