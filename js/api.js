/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 2.4 (纯净稳定版：严格遵循接口字符串要求 + 本地格式拦截)
 * 作者: hy.禾一 / Code Reviewer
 */

const BASE_URL = 'https://nextmusic.toubiec.cn';

const API_URLS = {
    songUrl: BASE_URL + '/api/getSongUrl',         // 主接口
    backupUrl: BASE_URL + '/api/getMusicUrl',      // 备用兜底接口
    songInfo: BASE_URL + '/api/getSongInfo',
    lyric: BASE_URL + '/api/getSongLyric',
    playlist: BASE_URL + '/api/playlist_trackall'
};

// ==========================================
// 工具：安全提取字符串格式的 ID (解决 400 的核心)
// ==========================================
function extractNeteaseId(link) {
    const strLink = String(link).trim();
    // 1. 如果已经是纯数字，直接原样返回字符串
    if (/^\d+$/.test(strLink)) return strLink;
    // 2. 如果是标准的长链接，正则提取里面的数字，作为字符串返回
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    if (match) return match[1];
    // 3. 提取不到（比如短链接），返回 null 交给业务拦截
    return null; 
}

function isNeteaseLink(url) {
    const str = String(url).trim();
    return /^\d+$/.test(str) || 
           str.includes('music.163.com') || 
           str.includes('163cn.tv') || 
           str.includes('y.music.163.com');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    return /^\d+$/.test(str) || url.includes('playlist');
}

// ==========================================
// 统一请求器
// ==========================================
async function requestApi(url, payload) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`请求失败: HTTP ${response.status}`);
    const data = await response.json();
    
    if (data.status !== 200 && data.code !== 200 && data.success !== true) {
        throw new Error(data.message || 'API返回错误');
    }
    return data;
}

// ==========================================
// 双保险：获取播放链接
// ==========================================
async function fetchPlayUrlWithFallback(reqId, quality) {
    let lastErrorMsg = "";
    try {
        const data1 = await requestApi(API_URLS.songUrl, { id: reqId, level: quality });
        if (data1.data?.url) return data1.data.url;
    } catch (e) {
        console.warn('⚠️ 主接口获取失败，切换备用接口...', e.message);
        lastErrorMsg = e.message;
    }

    try {
        const data2 = await requestApi(API_URLS.backupUrl, { id: reqId, level: quality });
        if (data2.data?.url) return data2.data.url;
    } catch (e) {
        console.warn('❌ 备用接口也失败了...', e.message);
    }
    throw new Error('主/备接口均无法获取播放链接。' + lastErrorMsg);
}

// ==========================================
// 1. 刷新播放链接
// ==========================================
async function refreshSongUrl(link, quality = 'lossless') {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) throw new Error('链接格式不支持');
        return await fetchPlayUrlWithFallback(reqId, quality);
    } catch (e) {
        console.error('刷新播放链接失败:', e);
        return null;
    }
}

// ==========================================
// 2. 获取歌曲信息 + 播放链接 + 歌词
// ==========================================
async function fetchNeteaseSongInfo(link, quality = 'lossless') {
    try {
        if (!link) throw new Error('请输入歌曲链接或ID');

        const reqId = extractNeteaseId(link);
        if (!reqId) {
            // 明确拦截短链接，不再去服务器受 400 的气
            throw new Error('新接口已不支持短链接，请填入纯数字ID或长链接！');
        }

        const infoData = await requestApi(API_URLS.songInfo, { id: reqId });
        const songInfo = infoData.data || {};

        const playUrl = await fetchPlayUrlWithFallback(reqId, quality);

        let lyrics = '';
        try {
            const lyricData = await requestApi(API_URLS.lyric, { id: reqId });
            lyrics = lyricData.data?.lyric || '';
        } catch (e) { 
            console.log('歌词获取失败，跳过'); 
        }

        return {
            title: songInfo.name || '未知歌曲',
            artist: songInfo.ar_name || songInfo.artist || '未知艺术家',
            url: playUrl,
            lyrics: lyrics,
            cover: songInfo.pic || songInfo.picUrl || '',
            duration: songInfo.duration || '0:00',
            neteaseId: reqId
        };
    } catch (error) {
        console.error('网易云解析失败:', error);
        throw error;
    }
}

// ==========================================
// 3. 获取歌单
// ==========================================
async function fetchNeteasePlaylist(link, limit = 100, offset = 0) {
    try {
        if (!link) throw new Error('请输入歌单链接或ID');

        const reqId = extractNeteaseId(link);
        if (!reqId) {
            throw new Error('新接口已不支持短链接，请填入纯数字ID或长链接！');
        }

        const data = await requestApi(API_URLS.playlist, { id: reqId, limit, offset });
        const playlist = data.data?.playlist || {};
        if (!playlist.tracks || playlist.tracks.length === 0) throw new Error('歌单为空');

        return {
            name: playlist.name || '未知歌单',
            creator: playlist.creator || '未知创建者',
            description: playlist.description || '',
            coverImgUrl: playlist.coverImgUrl || '',
            trackCount: playlist.trackCount || playlist.tracks.length,
            tracks: playlist.tracks.map(track => ({
                id: track.id,
                name: track.name || '未知歌曲',
                artists: track.artists || '未知艺术家',
                album: track.album || '',
                picUrl: track.picUrl || ''
            }))
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
window.API_URLS = API_URLS;
