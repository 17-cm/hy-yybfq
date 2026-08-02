/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 3.0 (原汁原味复刻版：完全依照原 player.js 逻辑)
 * 作者: hy.禾一 / Code Reviewer
 */

const BASE_URL = 'https://nextmusic.toubiec.cn';

const API_URLS = {
    songUrl: BASE_URL + '/api/getSongUrl',
    songInfo: BASE_URL + '/api/getSongInfo',
    lyric: BASE_URL + '/api/getSongLyric',
    playlist: BASE_URL + '/api/playlist_trackall'
};

// ============================================================
// 工具函数 (完全还原旧版判断逻辑)
// ============================================================
function isNeteaseLink(url) {
    return url.includes('music.163.com') || 
           url.includes('163cn.tv') || 
           url.includes('y.music.163.com') ||
           /^\d+$/.test(String(url).trim()); // 兼容纯数字
}

function isPlaylistLink(url) {
    return url.includes('playlist') || 
           url.includes('playlist?id=') ||
           /^\d+$/.test(String(url).trim()); // 兼容纯数字
}

function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (/^\d+$/.test(strLink)) return strLink;
    const idMatch = strLink.match(/id=(\d+)/);
    if (idMatch) return idMatch[1];
    const pathMatch = strLink.match(/song\/(\d+)/);
    if (pathMatch) return pathMatch[1];
    return null;
}

// ============================================================
// 核心补丁：因为新接口不支持短链，这里做个前置转换
// ============================================================
async function resolveLink(link, isPlaylist = false) {
    let str = String(link).trim();
    
    // 如果是短链接，还原出真实 ID
    if (str.includes('163cn.tv')) {
        try {
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(str)}`);
            const text = await res.text();
            const match = text.match(/id=(\d+)/) || res.url.match(/id=(\d+)/);
            if (match) str = match[1];
        } catch (e) {
            console.error('短链解析失败:', e);
        }
    }
    
    // 如果拿到的是纯数字，按照旧版 player.js 的习惯，包装成完整网址发给服务器
    if (/^\d+$/.test(str)) {
        if (isPlaylist) {
            return `music.163.com/playlist?id=${str}`;
        } else {
            return `music.163.com/song?id=${str}`;
        }
    }
    return str;
}

// ============================================================
// 1. 刷新播放链接 (还原 player.js 原逻辑)
// ============================================================
async function refreshSongUrl(neteaseId) {
    try {
        const targetId = `music.163.com/song?id=${neteaseId}`;
        
        const urlResponse = await fetch(API_URLS.songUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: targetId, 
                level: 'lossless' 
            })
        });
        
        if (!urlResponse.ok) throw new Error('获取播放链接失败');
        const urlData = await urlResponse.json();
        
        let playUrl = '';
        if (urlData.data && urlData.data.url) {
            playUrl = urlData.data.url;
        }
        return playUrl;
    } catch (error) {
        console.error('刷新链接失败:', error);
        return null;
    }
}

// ============================================================
// 2. 获取歌曲信息 (完全复刻 player.js 的三步走顺序)
// ============================================================
async function fetchNeteaseSongInfo(link) {
    try {
        const finalLink = await resolveLink(link, false);

        // 第 1 步：获取详情
        const detailResponse = await fetch(API_URLS.songInfo, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: finalLink })
        });
        if (!detailResponse.ok) throw new Error('获取歌曲信息失败');
        const detailData = await detailResponse.json();
        const songInfo = detailData.data || {};

        // 第 2 步：获取 URL
        const urlResponse = await fetch(API_URLS.songUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: finalLink, 
                level: 'lossless'
            })
        });
        if (!urlResponse.ok) throw new Error('获取播放链接失败');
        const urlData = await urlResponse.json();
        
        let playUrl = '';
        if (urlData.data && urlData.data.url) {
            playUrl = urlData.data.url;
        }
        if (!playUrl) throw new Error('无法获取播放链接');

        // 第 3 步：获取歌词
        let lyrics = '';
        try {
            const lyricResponse = await fetch(API_URLS.lyric, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: finalLink })
            });
            if (lyricResponse.ok) {
                const lyricData = await lyricResponse.json();
                lyrics = lyricData.data?.lyric || '';
            }
        } catch (e) {
            console.log('歌词获取失败，跳过');
        }

        const neteaseId = extractNeteaseId(finalLink) || String(link).replace(/\D/g, '');

        // 返回 UI 期待的格式 (兼容新旧字段)
        return {
            title: songInfo.name || '未知歌曲',
            artist: songInfo.ar_name || songInfo.singer || songInfo.artist || '未知艺术家',
            url: playUrl,
            lyrics: lyrics,
            cover: songInfo.pic || songInfo.picimg || songInfo.picUrl || '',
            duration: songInfo.duration || '0:00',
            neteaseId: neteaseId
        };
        
    } catch (error) {
        console.error('网易云解析失败:', error);
        throw error;
    }
}

// ============================================================
// 3. 获取歌单 (还原 player.js 原逻辑)
// ============================================================
async function fetchNeteasePlaylist(link) {
    try {
        const finalLink = await resolveLink(link, true);

        const response = await fetch(API_URLS.playlist, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: finalLink, limit: 100, offset: 0 })
        });
        
        if (!response.ok) throw new Error('获取歌单失败');
        const data = await response.json();
        
        const playlist = data.data?.playlist || {};

        return {
            name: playlist.name || '未知歌单',
            creator: playlist.creator || '未知创建者',
            description: playlist.description || '',
            coverImgUrl: playlist.coverImgUrl || '',
            trackCount: playlist.trackCount || (playlist.tracks ? playlist.tracks.length : 0),
            tracks: (playlist.tracks || []).map(track => ({
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

// ============================================================
// 暴露到全局
// ============================================================
window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.extractNeteaseId = extractNeteaseId;
window.API_URLS = API_URLS;
