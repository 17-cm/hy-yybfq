/**
 * api.js - 音乐播放器网络请求模块
 * 版本: MAX (完美全栈版：呼叫自带的 server.js 代理)
 */

// 目标靶点：全能 Python 接口
const TARGET_API_SONG = 'https://wyapi.toubiec.cn/song';
const TARGET_API_PLAYLIST = 'https://wyapi.toubiec.cn/playlist';

// 呼叫你 server.js 里注册的专属通道！
const LOCAL_PROXY_URL = '/api/plugins/音乐播放器/forward';

// ==========================================
// 核心：呼叫后端特工去跑腿！
// ==========================================
async function callBackendProxy(targetUrl, payloadData) {
    const response = await fetch(LOCAL_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            targetUrl: targetUrl,
            payload: payloadData
        })
    });

    if (!response.ok) {
        throw new Error('呼叫后端特工失败，请确认已重启酒馆');
    }

    const data = await response.json();
    if (data.status !== 200 && data.code !== 200 && data.success !== false) {
        throw new Error(data.message || '网易云接口未返回有效数据');
    }
    return data;
}

// ==========================================
// 1. 获取歌曲全套信息 (一步到位)
// ==========================================
async function fetchNeteaseSongInfo(link, quality = 'lossless') {
    try {
        if (!link) throw new Error('请输入歌曲链接或ID');
        const reqStr = String(link).trim();

        const data = await callBackendProxy(TARGET_API_SONG, {
            url: reqStr, 
            level: quality,
            type: "json"
        });

        const info = data.data || {};
        if (!info.url) throw new Error('歌曲无版权或未返回播放音频流');

        return {
            title: info.name || '未知歌曲',
            artist: info.ar_name || '未知艺术家',
            url: info.url,
            lyrics: info.lyric || '',
            cover: info.pic || '',
            duration: info.duration || '0:00',
            neteaseId: extractNeteaseId(reqStr) || reqStr
        };
    } catch (error) {
        console.error('网易云单曲解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接 
// ==========================================
async function refreshSongUrl(link, quality = 'lossless') {
    try {
        const info = await fetchNeteaseSongInfo(link, quality);
        return info.url || null;
    } catch (e) { return null; }
}

// ==========================================
// 3. 获取歌单
// ==========================================
async function fetchNeteasePlaylist(link) {
    try {
        if (!link) throw new Error('请输入歌单链接或ID');
        const reqId = extractNeteaseId(link) || String(link).trim();

        const data = await callBackendProxy(TARGET_API_PLAYLIST, { id: reqId });
        
        const playlist = data.data?.playlist || data.data || {};
        const tracks = playlist.tracks || data.data?.tracks || [];
        if (tracks.length === 0) throw new Error('歌单为空或获取失败');

        return {
            name: playlist.name || '未知歌单',
            creator: playlist.creator?.nickname || playlist.creator || '未知创建者',
            description: playlist.description || '',
            coverImgUrl: playlist.coverImgUrl || '',
            trackCount: tracks.length,
            tracks: tracks.map(track => ({
                id: track.id || track.song_id,
                name: track.name || '未知歌曲',
                artists: track.ar_name || track.ar?.map(a=>a.name).join('/') || track.artists || '未知艺术家',
                album: track.al_name || track.al?.name || track.album || '',
                picUrl: track.pic || track.al?.picUrl || track.picUrl || ''
            }))
        };
    } catch (error) {
        console.error('获取歌单失败:', error);
        throw error;
    }
}

// 工具函数
function isNeteaseLink(url) { return !!url; }
function isPlaylistLink(url) { return !!url; }
function extractNeteaseId(link) {
    const strLink = String(link).trim();
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : null; 
}

window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.extractNeteaseId = extractNeteaseId;
