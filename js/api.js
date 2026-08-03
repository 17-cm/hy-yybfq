/**
 * api.js - 音乐播放器网络请求
 * 版本: 2.0.0
 * 作者: hy.禾一
 * 说明：使用 https://api.qijieya.cn/meting/ 作为数据源
 */

// ==========================================
// 🛡️
// ==========================================
(function injectNoReferrer() {
    if (!document.querySelector('meta[name="referrer"]')) {
        const meta = document.createElement('meta');
        meta.name = "referrer";
        meta.content = "no-referrer";
        document.head.appendChild(meta);
        console.log("🛡️");
    }
})();

// ==========================================
// 接口配置
// ==========================================
const BASE_URL = 'https://api.qijieya.cn/meting/';

// ==========================================
// 工具函数：提取纯数字ID
// ==========================================
function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (strLink.includes('163cn.tv')) return null;
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

        const response = await fetch(`${BASE_URL}?server=netease&type=song&id=${reqId}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (!data || data.length === 0) throw new Error('未找到歌曲信息');

        const song = data[0];

        // 获取歌词
        let lyricText = '';
        if (song.lrc) {
            try {
                const lrcRes = await fetch(song.lrc);
                if (lrcRes.ok) {
                    lyricText = await lrcRes.text();
                }
            } catch (e) {
                console.log('歌词获取失败，跳过');
            }
        }

        return {
            title: song.name || '未知歌曲',
            artist: song.artist || '未知艺术家',
            url: song.url || '',  // 这个是接口链接，不是直链
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
// 2. 刷新播放链接（两步流程）
// ==========================================
async function refreshSongUrl(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) return null;

        // 第一步：请求 song 接口，拿到元数据
        const songRes = await fetch(`${BASE_URL}?server=netease&type=song&id=${reqId}`);
        if (!songRes.ok) return null;
        const songData = await songRes.json();
        if (!songData || songData.length === 0) return null;

        // 第二步：从 song 接口返回的 url 字段获取直链接口
        const urlLink = songData[0]?.url;
        if (!urlLink) return null;

        // 第三步：请求直链
        const urlRes = await fetch(urlLink);
        if (!urlRes.ok) return null;
        const playUrl = await urlRes.text();

        return playUrl || null;
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

        return {
            name: data[0]?.album || '网易云歌单',
            creator: 'Meting API',
            description: '杭州节点解析',
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
