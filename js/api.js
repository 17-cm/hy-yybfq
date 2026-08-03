/**
 * api.js - 音乐播放器网络请求模块（qijieya 专用版）
 * 作者: hy.禾一
 */

const CHANNELS = [
    {
        id: 1,
        name: 'qijieya',
        base: 'https://api.qijieya.cn/meting/',
        type: 'meting',
        priority: 1,
        platform: 'qishui'
    }
];

// ============================================================
// 工具函数
// ============================================================

function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (/^\d+$/.test(strLink)) return strLink;
    const idMatch = strLink.match(/[?&]id=(\d+)/);
    if (idMatch) return idMatch[1];
    const pathMatch = strLink.match(/\/song\/(\d+)/);
    if (pathMatch) return pathMatch[1];
    const playlistMatch = strLink.match(/\/playlist\/(\d+)/);
    if (playlistMatch) return playlistMatch[1];
    return null;
}

function isNeteaseLink(url) {
    const str = String(url).trim();
    return str.includes('music.163.com') || str.includes('163cn.tv') || /^\d+$/.test(str);
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    return str.includes('playlist') || str.includes('163cn.tv') || /^\d+$/.test(str);
}

// ============================================================
// 单曲信息获取
// ============================================================

async function fetchSongInfo(id) {
    const channel = CHANNELS[0];
    const url = `${channel.base}?server=netease&type=song&id=${id}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data || data.length === 0) {
        throw new Error('返回数据为空');
    }
    const song = data[0];
    if (!song || !song.name) {
        throw new Error('未找到歌曲信息');
    }

    // 获取歌词
    let lyricText = '';
    if (song.lrc) {
        try {
            const lrcRes = await fetch(song.lrc);
            if (lrcRes.ok) {
                lyricText = await lrcRes.text();
            }
        } catch (e) {}
    }

    // 获取播放直链
    let playUrl = '';
    if (song.url) {
        try {
            const urlRes = await fetch(song.url);
            if (urlRes.ok) {
                playUrl = await urlRes.text();
            }
        } catch (e) {}
    }

    return {
        title: song.name || '未知歌曲',
        artist: song.artist || '未知艺术家',
        url: playUrl || song.url || '',
        lyrics: lyricText,
        cover: song.pic || '',
        duration: '0:00',
        neteaseId: id,
        source: channel.name
    };
}

// ============================================================
// 播放链接获取
// ============================================================

async function fetchSongUrl(id) {
    const channel = CHANNELS[0];
    try {
        const url = `${channel.base}?server=netease&type=url&id=${id}`;
        const response = await fetch(url);
        if (response.ok) {
            const text = await response.text();
            if (text.startsWith('http')) {
                return text;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ============================================================
// 歌单获取
// ============================================================

async function fetchPlaylist(id) {
    const channel = CHANNELS[0];
    const url = `${channel.base}?server=netease&type=playlist&id=${id}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data || data.length === 0) {
        throw new Error('歌单数据为空');
    }

    const tracks = [];
    for (const song of data) {
        let playUrl = '';
        if (song.url) {
            try {
                const urlRes = await fetch(song.url);
                if (urlRes.ok) {
                    playUrl = await urlRes.text();
                }
            } catch (e) {}
        }
        tracks.push({
            id: song.id || id,
            name: song.name || '未知歌曲',
            artists: song.artist || '未知艺术家',
            album: song.album || '未知专辑',
            picUrl: song.pic || '',
            url: playUrl
        });
    }

    return {
        name: data[0]?.album || '网易云歌单',
        creator: 'Meting API',
        description: '',
        coverImgUrl: data[0]?.pic || '',
        trackCount: data.length,
        tracks: tracks
    };
}

// ============================================================
// 对外接口
// ============================================================

async function fetchNeteaseSongInfo(link) {
    const id = extractNeteaseId(link);
    if (!id) {
        throw new Error('无法提取歌曲ID，请检查链接');
    }
    return await fetchSongInfo(id);
}

async function refreshSongUrl(link) {
    const id = extractNeteaseId(link);
    if (!id) return null;
    return await fetchSongUrl(id);
}

async function fetchNeteasePlaylist(link) {
    let id = extractNeteaseId(link);
    if (!id && /^\d+$/.test(link.trim())) {
        id = link.trim();
    }
    if (!id) {
        throw new Error('无法提取歌单ID');
    }
    return await fetchPlaylist(id);
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
window.CHANNELS = CHANNELS;
