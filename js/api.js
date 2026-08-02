/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 1.0.7
 * 作者: hy.禾一
 * 说明：所有接口URL已完整拼接，修改只需改下方 `BASE_URL` 的值
 */

// ============================================================
// 接口基础配置（统一管理，修改只需改这里）
// ============================================================

const BASE_URL = 'https://nextmusic.toubiec.cn';

// ============================================================
// 完整接口地址（已直接拼接好）
// ============================================================

const API_URLS = {
    songUrl: BASE_URL + '/api/getSongUrl',
    songInfo: BASE_URL + '/api/getSongInfo',
    lyric: BASE_URL + '/api/getSongLyric',
    playlist: BASE_URL + '/api/playlist_trackall',
    search: BASE_URL + '/api/search',
    album: BASE_URL + '/api/getAlbum',
    songWiki: BASE_URL + '/api/song/wiki',
    health: BASE_URL + '/health'
};

// ============================================================
// 工具：提取纯数字ID
// ============================================================

function extractNeteaseId(link) {
    // 如果传入的已经是纯数字，直接返回
    if (/^\d+$/.test(link)) {
        return link;
    }
    // 从链接中提取 id=xxx
    const idMatch = link.match(/id=(\d+)/);
    if (idMatch) return idMatch[1];
    // 从链接中提取 /song/xxx
    const pathMatch = link.match(/song\/(\d+)/);
    if (pathMatch) return pathMatch[1];
    return null;
}

// ============================================================
// 1. 刷新播放链接
// ============================================================

async function refreshSongUrl(neteaseId, quality = 'exhigh') {
    try {
        // 确保传入的是纯数字ID
        const id = extractNeteaseId(neteaseId) || neteaseId;
        
        const response = await fetch(API_URLS.songUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, level: quality })
        });

        if (!response.ok) {
            throw new Error('获取播放链接失败');
        }

        const data = await response.json();

        if (data.status !== 200 || !data.success) {
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

async function fetchNeteaseSongInfo(link, quality = 'exhigh') {
    try {
        // 提取纯数字ID
        const id = extractNeteaseId(link);
        if (!id) {
            throw new Error('无法提取歌曲ID');
        }

        // 获取歌曲信息
        const infoResponse = await fetch(API_URLS.songInfo, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        if (!infoResponse.ok) {
            throw new Error('获取歌曲信息失败');
        }

        const infoData = await infoResponse.json();

        if (infoData.status !== 200 || !infoData.success) {
            throw new Error(infoData.message || '获取歌曲信息失败');
        }

        const songInfo = infoData.data || {};

        // 获取播放链接
        const urlResponse = await fetch(API_URLS.songUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, level: quality })
        });

        if (!urlResponse.ok) {
            throw new Error('获取播放链接失败');
        }

        const urlData = await urlResponse.json();

        if (urlData.status !== 200 || !urlData.success) {
            throw new Error(urlData.message || '获取播放链接失败');
        }

        const playUrl = urlData.data?.url || '';
        if (!playUrl) {
            throw new Error('无法获取播放链接');
        }

        // 获取歌词（失败不影响主流程）
        let lyrics = '';
        try {
            const lyricResponse = await fetch(API_URLS.lyric, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            if (lyricResponse.ok) {
                const lyricData = await lyricResponse.json();
                if (lyricData.status === 200 && lyricData.success) {
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

async function fetchNeteasePlaylist(link) {
    try {
        // 提取歌单ID
        let playlistId = link;
        if (!/^\d+$/.test(link)) {
            const idMatch = link.match(/id=(\d+)/);
            if (idMatch) {
                playlistId = idMatch[1];
            } else {
                throw new Error('无法提取歌单ID');
            }
        }

        const response = await fetch(API_URLS.playlist, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: playlistId })
        });

        if (!response.ok) {
            throw new Error('获取歌单失败');
        }

        const data = await response.json();

        if (data.status !== 200 || !data.success) {
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
// 4. 工具函数：判断链接类型
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
