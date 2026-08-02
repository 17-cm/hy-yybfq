/**
 * api.js - 音乐播放器网络请求模块
 * 版本: Final (纯前端扩展版：严格补齐官方 API 必填参数)
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
// 纯净网络请求器：老老实实“填表”
// ==========================================
async function requestApi(url, payload) {
    // 严格遵循作者网页版的格式，补齐必填项，避免 400 错误
    const finalPayload = {
        ...payload,
        timestamp: Date.now(), // 官方要求的必填项：当前时间戳，防止缓存
        ip: ""                 // 补齐字段结构，留空即可，代表使用默认IP
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
    });

    if (!response.ok) {
        throw new Error(`请求失败，状态码: ${response.status}`);
    }

    const data = await response.json();
    
    // 兼容项目的标准返回格式
    if (data.status !== 200 && data.code !== 200 && data.success !== true) {
        throw new Error(data.message || 'API返回异常');
    }
    return data;
}

// ==========================================
// 1. 获取播放链接
// ==========================================
async function refreshSongUrl(link, quality = 'standard') {
    try {
        const reqId = String(link).trim();
        const data = await requestApi(API_URLS.songUrl, { id: reqId, level: quality });
        const url = data.data?.url || (Array.isArray(data.data) && data.data[0]?.url);
        return url || null;
    } catch (e) {
        console.error('获取播放链接失败:', e);
        return null;
    }
}

// ==========================================
// 2. 获取歌曲全套信息
// ==========================================
async function fetchNeteaseSongInfo(link, quality = 'standard') {
    try {
        if (!link) throw new Error('请输入链接或ID');
        
        // 作者的 API 支持直接解析短链接，原样发送即可
        const reqId = String(link).trim();

        // 1. 获取歌曲详情
        const infoData = await requestApi(API_URLS.songInfo, { id: reqId });
        const songInfo = infoData.data?.songs?.[0] || infoData.data || {};

        // 2. 获取播放链接
        let playUrl = '';
        try {
            const urlData = await requestApi(API_URLS.songUrl, { id: reqId, level: quality });
            playUrl = urlData.data?.url || (Array.isArray(urlData.data) && urlData.data[0]?.url) || '';
        } catch (e) {
            console.warn('播放链接获取失败', e);
        }
        
        if (!playUrl) throw new Error('未获取到有效音频流');

        // 3. 获取歌词
        let lyrics = '';
        try {
            const lyricData = await requestApi(API_URLS.lyric, { id: reqId });
            lyrics = lyricData.data?.lyric || lyricData.lrc?.lyric || '';
        } catch (e) { 
            console.log('歌词暂无'); 
        }

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
        console.error('解析失败:', error);
        throw error;
    }
}

// ==========================================
// 3. 获取歌单
// ==========================================
async function fetchNeteasePlaylist(link, limit = 100, offset = 0) {
    try {
        if (!link) throw new Error('请输入链接或ID');
        const reqId = String(link).trim();

        const data = await requestApi(API_URLS.playlist, { id: reqId, limit, offset });
        const playlist = data.data?.playlist || data.playlist || {};
        
        if (!playlist.tracks || playlist.tracks.length === 0) throw new Error('歌单数据为空');

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
// 工具函数：完全信任接口的解析能力，不拦截任何格式
// ==========================================
function isNeteaseLink(url) { return !!url; }
function isPlaylistLink(url) { return !!url; }
function extractNeteaseId(link) { return link ? String(link).trim() : null; }

window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.extractNeteaseId = extractNeteaseId;
window.API_URLS = API_URLS;
