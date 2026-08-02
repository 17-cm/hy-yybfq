/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 1.0.8
 * 作者: hy.禾一
 * 说明：只保留播放器需要的接口
 */

// ============================================================
// 接口基础配置
// ============================================================

const BASE_URL = 'https://nextmusic.toubiec.cn';

// ============================================================
// 接口地址（只保留需要的）
// ============================================================

const API_URLS = {
    // 播放链接：POST /api/getSongUrl  { id, level }
    songUrl: BASE_URL + '/api/getSongUrl',
    
    // 歌曲信息：POST /api/getSongInfo  { id }
    songInfo: BASE_URL + '/api/getSongInfo',
    
    // 歌词：POST /api/getSongLyric  { id }
    lyric: BASE_URL + '/api/getSongLyric',
    
    // 歌单全部歌曲：POST /api/playlist_trackall  { id, limit, offset }
    playlist: BASE_URL + '/api/playlist_trackall'
};

// ============================================================
// 工具：提取纯数字ID (原版同步方法，保留以防外部调用)
// ============================================================

function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (/^\d+$/.test(strLink)) return Number(strLink);
    const idMatch = strLink.match(/id=(\d+)/);
    if (idMatch) return Number(idMatch[1]);
    const pathMatch = strLink.match(/song\/(\d+)/);
    if (pathMatch) return Number(pathMatch[1]);
    return null;
}

// ============================================================
// 新增工具：异步解析短链接 (自动跳一步还原真实数字 ID)
// ============================================================

async function getRealIdAsync(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    
    // 1. 本地直接提取（如果是纯数字或长链接）
    const localId = extractNeteaseId(strLink);
    if (localId) return Number(localId);
    
    // 2. 如果是短链接 (如 163cn.tv)，自动进行一次网络重定向解析
    if (strLink.includes('163cn.tv') || strLink.includes('music.163.com')) {
        try {
            // 利用公共 CORS 代理跟随短链重定向，获取真实网页内容
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(strLink)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            // 从代理返回的目标 URL 或网页源码中提取纯数字 ID
            const contentStr = (data.status?.url || '') + (data.contents || '');
            const realIdMatch = contentStr.match(/id=(\d+)/);
            if (realIdMatch) {
                return Number(realIdMatch[1]);
            }
        } catch (error) {
            console.error('短链接还原失败，请检查网络或更换长链接/数字ID测试:', error);
        }
    }
    return null; // 解析不到返回 null
}

// ============================================================
// 1. 刷新播放链接
// ============================================================

async function refreshSongUrl(neteaseId, quality = 'lossless') {
    try {
        // 修改：使用新增的智能提取，支持短链解析
        const id = (await getRealIdAsync(neteaseId)) || extractNeteaseId(neteaseId) || neteaseId;

        const response = await fetch(API_URLS.songUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: Number(id), // 强制数字，防 400 报错
                level: quality
            })
        });

        if (!response.ok) {
            throw new Error('获取播放链接失败');
        }

        const data = await response.json();

        // 兼容多格式判断
        if (data.status !== 200 && data.code !== 200 && data.success !== true) {
            throw new Error(data.message || '获取播放链接失败');
        }

        const playUrl = data.data?.url || '';
        if (!playUrl) {
            throw new Error('返回数据中无播放链接');
        }

        return playUrl;
    } catch (error) {
        console.error('刷新播放链接失败:', error);
        return null;
    }
}

// ============================================================
// 2. 获取歌曲信息 + 播放链接 + 歌词
// ============================================================

async function fetchNeteaseSongInfo(link, quality = 'lossless') {
    try {
        // 修改：使用新增的智能提取，支持短链解析
        const id = await getRealIdAsync(link);
        if (!id) {
            throw new Error('无法提取歌曲ID，若是短链可能代理解析失败');
        }

        // 获取歌曲信息
        const infoResponse = await fetch(API_URLS.songInfo, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: Number(id) }) // 强制数字，防 400 报错
        });

        if (!infoResponse.ok) {
            throw new Error('获取歌曲信息失败');
        }

        const infoData = await infoResponse.json();

        if (infoData.status !== 200 && infoData.code !== 200 && infoData.success !== true) {
            throw new Error(infoData.message || '获取歌曲信息失败');
        }

        const songInfo = infoData.data || {};

        // 获取播放链接
        const urlResponse = await fetch(API_URLS.songUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: Number(id), // 强制数字，防 400 报错
                level: quality
            })
        });

        if (!urlResponse.ok) {
            throw new Error('获取播放链接失败');
        }

        const urlData = await urlResponse.json();

        if (urlData.status !== 200 && urlData.code !== 200 && urlData.success !== true) {
            throw new Error(urlData.message || '获取播放链接失败');
        }

        const playUrl = urlData.data?.url || '';
        if (!playUrl) {
            throw new Error('无法获取播放链接');
        }

        // 获取歌词
        let lyrics = '';
        try {
            const lyricResponse = await fetch(API_URLS.lyric, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: Number(id) }) // 强制数字，防 400 报错
            });

            if (lyricResponse.ok) {
                const lyricData = await lyricResponse.json();
                if (lyricData.status === 200 || lyricData.code === 200 || lyricData.success === true) {
                    lyrics = lyricData.data?.lyric || '';
                }
            }
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
            neteaseId: id
        };
    } catch (error) {
        console.error('网易云解析失败:', error);
        throw error;
    }
}

// ============================================================
// 3. 获取歌单
// ============================================================

async function fetchNeteasePlaylist(link, limit = 100, offset = 0) {
    try {
        // 修改：使用新增的智能提取，自动识别歌单长/短链
        const playlistId = await getRealIdAsync(link);
        if (!playlistId) {
            throw new Error('无法提取歌单ID');
        }

        const response = await fetch(API_URLS.playlist, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: Number(playlistId), // 强制数字，彻底防 400 报错
                limit: limit,
                offset: offset
            })
        });

        if (!response.ok) {
            throw new Error('获取歌单失败');
        }

        const data = await response.json();

        if (data.status !== 200 && data.code !== 200 && data.success !== true) {
            throw new Error(data.message || '获取歌单失败');
        }

        const playlist = data.data?.playlist || {};
        if (!playlist.tracks || playlist.tracks.length === 0) {
            throw new Error('歌单为空或无法获取歌曲列表');
        }

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

// ============================================================
// 4. 工具函数
// ============================================================

function isNeteaseLink(url) {
    return url.includes('music.163.com') ||
           url.includes('163cn.tv') ||
           url.includes('y.music.163.com');
}

function isPlaylistLink(url) {
    return url.includes('playlist') || url.includes('playlist?id=');
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
