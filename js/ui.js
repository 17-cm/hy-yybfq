/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 1.6.0(终极直连版：支持纯数字放行 + 自动双保险备用接口)
 * 作者: hy.禾一 / Code Reviewer
 */

const BASE_URL = 'https://nextmusic.toubiec.cn';

const API_URLS = {
    songUrl: BASE_URL + '/api/getSongUrl',         // 主接口
    backupUrl: BASE_URL + '/api/getMusicUrl',      // 备用接口（防抽风双保险）
    songInfo: BASE_URL + '/api/getSongInfo',
    lyric: BASE_URL + '/api/getSongLyric',
    playlist: BASE_URL + '/api/playlist_trackall'
};

// ==========================================
// 极简直连核心请求器
// ==========================================
async function requestApi(url, payload) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) // 原封不动，把链接或ID直接发给服务器！
    });

    if (!response.ok) throw new Error(`请求失败: ${response.status}`);
    const data = await response.json();
    
    if (data.status !== 200 && data.code !== 200 && data.success !== true) {
        throw new Error(data.message || 'API返回错误');
    }
    return data;
}

// ==========================================
// 核心强化：双保险获取播放链接 (自动失败切换)
// ==========================================
async function fetchPlayUrlWithFallback(link, quality) {
    let lastErrorMsg = "";
    
    // 第一波尝试：主接口
    try {
        const data1 = await requestApi(API_URLS.songUrl, { id: link, level: quality });
        if (data1.data?.url) return data1.data.url;
    } catch (e) {
        console.warn('⚠️ 主接口获取失败，正在无缝切换备用接口...', e.message);
        lastErrorMsg = e.message;
    }

    // 第二波尝试：主接口失败，备用接口顶上
    try {
        const data2 = await requestApi(API_URLS.backupUrl, { id: link, level: quality });
        if (data2.data?.url) return data2.data.url;
    } catch (e) {
        console.warn('❌ 备用接口也失败了...', e.message);
    }

    throw new Error('主/备接口目前均无法获取播放链接。' + lastErrorMsg);
}

// ==========================================
// 1. 刷新播放链接
// ==========================================
async function refreshSongUrl(link, quality = 'lossless') {
    try {
        return await fetchPlayUrlWithFallback(link, quality);
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

        // 发送给服务器去解析信息
        const infoData = await requestApi(API_URLS.songInfo, { id: link });
        const songInfo = infoData.data || {};

        // 使用双保险去拿 mp3 链接
        const playUrl = await fetchPlayUrlWithFallback(link, quality);

        // 拿歌词 (歌词失败不影响放歌)
        let lyrics = '';
        try {
            const lyricData = await requestApi(API_URLS.lyric, { id: link });
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
            neteaseId: link
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

        const data = await requestApi(API_URLS.playlist, { id: link, limit, offset });
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
// 4. 工具函数 (已修复：允许纯数字ID通过验证)
// ==========================================
function isNeteaseLink(url) {
    const str = String(url).trim();
    // 纯数字直接放行！或者检查是否包含官方域名
    return /^\d+$/.test(str) || 
           str.includes('music.163.com') || 
           str.includes('163cn.tv') || 
           str.includes('y.music.163.com');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    // 纯数字直接放行！或者检查是否包含 playlist 关键字
    return /^\d+$/.test(str) || url.includes('playlist');
}

function extractNeteaseId(link) {
    // 兼容性保留
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
