/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 8.0 (返璞归真版：去除一切干扰，修复状态码误判)
 * 作者: hy.禾一
 */

const BASE_URL = 'https://nextmusic.toubiec.cn';

const API_URLS = {
    songUrl: BASE_URL + '/api/getSongUrl',
    songInfo: BASE_URL + '/api/getSongInfo',
    lyric: BASE_URL + '/api/getSongLyric',
    playlist: BASE_URL + '/api/playlist_trackall'
};

// ==========================================
// 提取纯数字 (剥离一切网址，防止防火墙拦截)
// ==========================================
function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    // 短链接直接在 UI 拦截，不发给服务器受气
    if (strLink.includes('163cn.tv')) return null; 
    
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : null; 
}

// ==========================================
// 极简请求器 (多一个参数都不带！)
// ==========================================
async function requestApi(url, payload) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) // 严格按照文档，只有 id 和 level
    });

    if (!response.ok) throw new Error(`HTTP 错误: ${response.status}`);
    
    const data = await response.json();
    
    // 💡 乌龙案破解核心：兼容 code=200 的网易云标准返回
    if (data.status !== 200 && data.code !== 200 && data.success !== true) {
        throw new Error(data.message || 'API返回异常');
    }
    return data;
}

// ==========================================
// 1. 刷新播放链接
// ==========================================
async function refreshSongUrl(link, quality = 'standard') {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) return null;

        const data = await requestApi(API_URLS.songUrl, { id: reqId, level: quality });
        return data.data?.url || (Array.isArray(data.data) && data.data[0]?.url) || null;
    } catch (e) {
        console.error('刷新链接失败:', e);
        return null;
    }
}

// ==========================================
// 2. 获取歌曲全套信息
// ==========================================
async function fetchNeteaseSongInfo(link, quality = 'standard') {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) {
            throw new Error('新接口不支持短链接，请使用长链接或纯数字ID！');
        }

        // 1. 获取歌曲详情
        const infoData = await requestApi(API_URLS.songInfo, { id: reqId });
        const songInfo = infoData.data?.songs?.[0] || infoData.data || {};

        // 2. 获取播放链接
        let playUrl = '';
        try {
            const urlData = await requestApi(API_URLS.songUrl, { id: reqId, level: quality });
            playUrl = urlData.data?.url || (Array.isArray(urlData.data) && urlData.data[0]?.url) || '';
        } catch (e) { console.warn('播放链接获取失败', e); }

        if (!playUrl) throw new Error('未获取到音频流');

        // 3. 获取歌词
        let lyrics = '';
        try {
            const lyricData = await requestApi(API_URLS.lyric, { id: reqId });
            lyrics = lyricData.data?.lyric || lyricData.lrc?.lyric || '';
        } catch (e) { console.log('歌词暂无'); }

        return {
            title: songInfo.name || '未知歌曲',
            artist: songInfo.ar_name || songInfo.ar?.[0]?.name || songInfo.singer || songInfo.artist || '未知艺术家',
            url: playUrl,
            lyrics: lyrics,
            cover: songInfo.pic || songInfo.picUrl || songInfo.al?.picUrl || '',
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
        const reqId = extractNeteaseId(link);
        if (!reqId) {
            throw new Error('新接口不支持短链接，请使用长链接或纯数字ID！');
        }

        const data = await requestApi(API_URLS.playlist, { id: reqId, limit, offset });
        const playlist = data.data?.playlist || data.playlist || {};
        
        if (!playlist.tracks || playlist.tracks.length === 0) throw new Error('歌单为空');

        return {
            name: playlist.name || '未知歌单',
            creator: playlist.creator?.nickname || playlist.creator || '未知创建者',
            description: playlist.description || '',
            coverImgUrl: playlist.coverImgUrl || '',
            trackCount: playlist.trackCount || playlist.tracks.length,
            tracks: playlist.tracks.map(track => ({
                id: track.id,
                name: track.name || '未知歌曲',
                artists: track.ar?.map(a=>a.name).join('/') || track.artists || '未知艺术家',
                album: track.al?.name || track.album || '',
                picUrl: track.al?.picUrl || track.picUrl || ''
            }))
        };
    } catch (error) {
        console.error('获取歌单失败:', error);
        throw error;
    }
}

// ==========================================
// 工具函数 
// ==========================================
function isNeteaseLink(url) {
    const str = String(url).trim();
    // 短链接直接返回 false 拦截
    if (str.includes('163cn.tv')) return false;
    return /^\d+$/.test(str) || str.includes('163');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    if (str.includes('163cn.tv')) return false;
    return /^\d+$/.test(str) || url.includes('playlist');
}

window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.extractNeteaseId = extractNeteaseId;
window.API_URLS = API_URLS;
