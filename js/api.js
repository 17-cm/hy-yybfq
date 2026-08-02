/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 2.5 (真相大白版：伪装成官方完整链接发送)
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
// 核心机密：将纯数字自动包装成服务器要求的完整链接
// ==========================================
function wrapSongId(input) {
    const str = String(input).trim();
    // 如果是纯数字，强制包装成完整歌曲链接
    if (/^\d+$/.test(str)) return `https://music.163.com/song?id=${str}`;
    return str; // 如果已经是链接，直接原样发送
}

function wrapPlaylistId(input) {
    const str = String(input).trim();
    // 如果是纯数字，强制包装成完整歌单链接
    if (/^\d+$/.test(str)) return `https://music.163.com/playlist?id=${str}`;
    return str;
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
async function fetchPlayUrlWithFallback(reqUrl, quality) {
    let lastErrorMsg = "";
    try {
        const data1 = await requestApi(API_URLS.songUrl, { id: reqUrl, level: quality });
        if (data1.data?.url) return data1.data.url;
    } catch (e) {
        console.warn('⚠️ 主接口获取失败，切换备用接口...', e.message);
        lastErrorMsg = e.message;
    }

    try {
        const data2 = await requestApi(API_URLS.backupUrl, { id: reqUrl, level: quality });
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
        const reqUrl = wrapSongId(link);
        return await fetchPlayUrlWithFallback(reqUrl, quality);
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

        // 关键步骤：把输入包装成服务器看得懂的长链接
        const reqUrl = wrapSongId(link);

        const infoData = await requestApi(API_URLS.songInfo, { id: reqUrl });
        const songInfo = infoData.data || {};

        const playUrl = await fetchPlayUrlWithFallback(reqUrl, quality);

        let lyrics = '';
        try {
            const lyricData = await requestApi(API_URLS.lyric, { id: reqUrl });
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
            // 提取出纯数字供本地使用
            neteaseId: String(link).match(/\d+/)?.[0] || link 
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

        // 关键步骤：把输入包装成服务器看得懂的长链接
        const reqUrl = wrapPlaylistId(link);

        const data = await requestApi(API_URLS.playlist, { id: reqUrl, limit, offset });
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
// 工具函数 (兼容处理)
// ==========================================
function isNeteaseLink(url) {
    const str = String(url).trim();
    // 纯数字直接放行！
    return /^\d+$/.test(str) || 
           str.includes('music.163.com') || 
           str.includes('163cn.tv') || 
           str.includes('y.music.163.com');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    // 纯数字直接放行！
    return /^\d+$/.test(str) || url.includes('playlist');
}

function extractNeteaseId(link) {
    const strLink = String(link).trim();
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : link; 
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
