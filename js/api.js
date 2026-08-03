/**
 * api.js - 音乐播放器网络请求模块（多通道自动切换）
 * 作者: hy.禾一
 * 说明：多个接口通道自动切换，优先使用可用通道
 */

// ============================================================
// 🚀 通道地址（按优先级排序）
// ============================================================

const CHANNELS = [
    {
        id: 1,
        name: 'qijieya',
        base: 'https://api.qijieya.cn/meting/',
        type: 'meting',
        priority: 1,
        platform: 'qishui'
    },
    {
        id: 2,
        name: 'injahow',
        base: 'https://api.injahow.cn/meting/',
        type: 'meting',
        priority: 2,
        platform: 'qishui'
    },
    {
        id: 3,
        name: 'bugpk',
        base: 'https://api.bugpk.com/api/163_music',
        type: 'bugpk',
        priority: 3,
        platform: 'netease'
    },
    {
        id: 4,
        name: 'byfuns',
        base: 'https://api.byfuns.top/api/1/',
        type: 'byfuns',
        priority: 4,
        platform: 'netease'
    }
];

// ============================================================
// 工具函数
// ============================================================

function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (strLink.includes('163cn.tv')) return null;
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : null;
}

function isNeteaseLink(url) {
    const str = String(url).trim();
    if (str.includes('163cn.tv')) return false;
    return /^\d+$/.test(str) || str.includes('163');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    if (str.includes('163cn.tv')) return false;
    return /^\d+$/.test(str) || url.includes('playlist');
}

// ============================================================
// 通用请求：歌曲信息
// ============================================================

async function fetchSongInfo(id) {
    const sorted = [...CHANNELS].sort((a, b) => a.priority - b.priority);

    for (const channel of sorted) {
        try {
            let url;
            let response;

            if (channel.type === 'meting') {
                url = `${channel.base}?server=netease&type=song&id=${id}`;
                response = await fetch(url);
                if (!response.ok) continue;
                const data = await response.json();
                if (!data || data.length === 0) continue;
                const song = data[0];
                if (!song || !song.name) continue;

                let lyricText = '';
                if (song.lrc) {
                    try {
                        const lrcRes = await fetch(song.lrc);
                        if (lrcRes.ok) lyricText = await lrcRes.text();
                    } catch (e) {}
                }

                return {
                    title: song.name || '未知歌曲',
                    artist: song.artist || '未知艺术家',
                    url: song.url || '',
                    lyrics: lyricText,
                    cover: song.pic || '',
                    duration: '0:00',
                    neteaseId: id,
                    source: channel.name
                };

            } else if (channel.type === 'bugpk') {
                url = `${channel.base}?type=song&id=${id}`;
                response = await fetch(url);
                if (!response.ok) continue;
                const data = await response.json();
                if (data.code !== 200) continue;
                const song = data.data;
                if (!song || !song.name) continue;

                let lyricText = '';
                try {
                    const lrcRes = await fetch(`${channel.base}?type=lyric&id=${id}`);
                    if (lrcRes.ok) {
                        const lrcData = await lrcRes.json();
                        if (lrcData.code === 200 && lrcData.data?.lrc) {
                            lyricText = lrcData.data.lrc;
                        }
                    }
                } catch (e) {}

                return {
                    title: song.name || '未知歌曲',
                    artist: song.singer || song.ar_name || '未知艺术家',
                    url: '',
                    lyrics: lyricText,
                    cover: song.picimg || song.pic || '',
                    duration: '0:00',
                    neteaseId: id,
                    source: channel.name
                };
            }
        } catch (e) {
            console.warn(`⚠️ 通道 ${channel.name} 歌曲信息请求失败:`, e.message);
            continue;
        }
    }

    throw new Error('所有通道获取歌曲信息失败');
}

// ============================================================
// 通用请求：播放链接
// ============================================================

async function fetchSongUrl(id, level = 'exhigh') {
    const sorted = [...CHANNELS].sort((a, b) => a.priority - b.priority);

    for (const channel of sorted) {
        try {
            let url;
            let response;

            if (channel.type === 'meting') {
                url = `${channel.base}?server=netease&type=url&id=${id}`;
                response = await fetch(url);
                if (response.ok) {
                    const text = await response.text();
                    if (text.startsWith('http')) return text;
                }
                const songUrl = `${channel.base}?server=netease&type=song&id=${id}`;
                const songRes = await fetch(songUrl);
                if (!songRes.ok) continue;
                const data = await songRes.json();
                if (data && data[0] && data[0].url) {
                    const innerUrl = data[0].url;
                    if (innerUrl.startsWith('http')) {
                        const innerRes = await fetch(innerUrl);
                        if (innerRes.ok) {
                            const text = await innerRes.text();
                            if (text.startsWith('http')) return text;
                        }
                    }
                }
                continue;

            } else if (channel.type === 'bugpk') {
                url = `${channel.base}?type=url&id=${id}&level=${level}`;
                response = await fetch(url);
                if (!response.ok) continue;
                const data = await response.json();
                if (data.code !== 200) continue;
                if (data.data && data.data[0] && data.data[0].url) {
                    return data.data[0].url;
                }
                continue;

            } else if (channel.type === 'byfuns') {
                url = `${channel.base}?id=${id}&level=${level}`;
                response = await fetch(url);
                if (!response.ok) continue;
                const text = await response.text();
                if (text.startsWith('http')) return text;
                continue;
            }
        } catch (e) {
            console.warn(`⚠️ 通道 ${channel.name} 播放链接请求失败:`, e.message);
            continue;
        }
    }

    return null;
}

// ============================================================
// 通用请求：歌单
// ============================================================

async function fetchPlaylist(id) {
    const sorted = [...CHANNELS].sort((a, b) => a.priority - b.priority);

    for (const channel of sorted) {
        try {
            let url;
            let response;

            if (channel.type === 'meting') {
                url = `${channel.base}?server=netease&type=playlist&id=${id}`;
                response = await fetch(url);
                if (!response.ok) continue;
                const data = await response.json();
                if (!data || data.length === 0) continue;

                return {
                    name: data[0]?.album || '网易云歌单',
                    creator: 'Meting API',
                    description: '',
                    coverImgUrl: data[0]?.pic || '',
                    trackCount: data.length,
                    tracks: data.map(song => ({
                        id: song.id || id,
                        name: song.name || '未知歌曲',
                        artists: song.artist || '未知艺术家',
                        album: song.album || '未知专辑',
                        picUrl: song.pic || ''
                    }))
                };

            } else if (channel.type === 'bugpk') {
                url = `${channel.base}?type=playlist&id=${id}`;
                response = await fetch(url);
                if (!response.ok) continue;
                const data = await response.json();
                if (data.code !== 200) continue;
                const playlist = data.data;
                if (!playlist || !playlist.tracks || playlist.tracks.length === 0) continue;

                return {
                    name: playlist.name || '网易云歌单',
                    creator: playlist.creator || '未知',
                    description: playlist.description || '',
                    coverImgUrl: playlist.coverImgUrl || '',
                    trackCount: playlist.trackCount || playlist.tracks.length,
                    tracks: playlist.tracks.map(track => ({
                        id: track.id,
                        name: track.name || '未知歌曲',
                        artists: track.artists || '未知艺术家',
                        album: track.album || '未知专辑',
                        picUrl: track.picUrl || ''
                    }))
                };
            }
        } catch (e) {
            console.warn(`⚠️ 通道 ${channel.name} 歌单请求失败:`, e.message);
            continue;
        }
    }

    throw new Error('所有通道获取歌单失败');
}

// ============================================================
// 对外接口
// ============================================================

async function fetchNeteaseSongInfo(link) {
    try {
        const id = extractNeteaseId(link);
        if (!id) throw new Error('无法提取歌曲ID，请检查链接');
        const result = await fetchSongInfo(id);
        if (!result.url) {
            const url = await fetchSongUrl(id);
            if (url) result.url = url;
        }
        return result;
    } catch (error) {
        console.error('单曲解析失败:', error);
        throw error;
    }
}

async function refreshSongUrl(link) {
    try {
        const id = extractNeteaseId(link);
        if (!id) return null;
        return await fetchSongUrl(id);
    } catch (error) {
        console.error('刷新链接失败:', error);
        return null;
    }
}

async function fetchNeteasePlaylist(link) {
    try {
        let id = extractNeteaseId(link);
        if (!id && /^\d+$/.test(link.trim())) {
            id = link.trim();
        }
        if (!id) throw new Error('无法提取歌单ID');
        return await fetchPlaylist(id);
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
window.CHANNELS = CHANNELS;
