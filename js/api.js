/**
 * api.js - 音乐播放器网络请求模块（qijieya 专用测试版）
 * 作者: hy.禾一
 * 说明：只保留 qijieya 通道，用于单独测试
 */

// ============================================================
// 🚀 通道配置（只保留 qijieya）
// ============================================================

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
// 通用请求：歌曲信息
// ============================================================

async function fetchSongInfo(id) {
    // 只使用 qijieya
    const channel = CHANNELS[0];

    try {
        const url = `${channel.base}?server=netease&type=song&id=${id}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data || data.length === 0) throw new Error('返回数据为空');

        const song = data[0];
        if (!song || !song.name) throw new Error('未找到歌曲信息');

        // 获取歌词
        let lyricText = '';
        if (song.lrc) {
            try {
                const lrcRes = await fetch(song.lrc);
                if (lrcRes.ok) lyricText = await lrcRes.text();
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
            } catch (e) {
                console.warn('获取直链失败:', e.message);
            }
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
    } catch (error) {
        console.error('qijieya 歌曲信息请求失败:', error.message);
        throw new Error('qijieya 通道获取歌曲信息失败');
    }
}

// ============================================================
// 通用请求：播放链接
// ============================================================

async function fetchSongUrl(id, level = 'exhigh') {
    const channel = CHANNELS[0];

    try {
        // 先尝试 type=url
        const url = `${channel.base}?server=netease&type=url&id=${id}`;
        const response = await fetch(url);
        if (response.ok) {
            const text = await response.text();
            if (text.startsWith('http')) return text;
        }

        // 如果失败，从 type=song 里取
        const songUrl = `${channel.base}?server=netease&type=song&id=${id}`;
        const songRes = await fetch(songUrl);
        if (!songRes.ok) return null;
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
        return null;
    } catch (error) {
        console.error('qijieya 播放链接请求失败:', error.message);
        return null;
    }
}

// ============================================================
// 通用请求：歌单
// ============================================================

async function fetchPlaylist(id) {
    const channel = CHANNELS[0];

    try {
        const url = `${channel.base}?server=netease&type=playlist&id=${id}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data || data.length === 0) throw new Error('歌单数据为空');

        // 对每首歌获取直链
        const tracks = [];
        for (const song of data) {
            let playUrl = '';
            if (song.url) {
                try {
                    const urlRes = await fetch(song.url);
                    if (urlRes.ok) {
                        playUrl = await urlRes.text();
                    }
                } catch (e) {
                    console.warn(`获取 ${song.name} 直链失败:`, e.message);
                }
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
    } catch (error) {
        console.error('qijieya 歌单请求失败:', error.message);
        throw new Error('qijieya 通道获取歌单失败');
    }
}

// ============================================================
// 对外接口
// ============================================================

async function fetchNeteaseSongInfo(link) {
    try {
        const id = extractNeteaseId(link);
        if (!id) throw new Error('无法提取歌曲ID，请检查链接');
        return await fetchSongInfo(id);
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
