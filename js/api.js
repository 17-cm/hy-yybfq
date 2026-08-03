/**
 * api.js - 音乐播放器网络请求模块（双通道完整拼接 + 短链接自动切换）
 * 作者: hy.禾一
 * 说明：通道一 qijieya（完整逻辑），通道二 bugpk（完整逻辑），检测到短链接自动切 bugpk
 */

// ============================================================
// 工具函数
// ============================================================

function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : null;
}

function isNeteaseLink(url) {
    const str = String(url).trim();
    return /^\d+$/.test(str) || str.includes('163');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    return /^\d+$/.test(str) || url.includes('playlist');
}

function isShortLink(url) {
    const str = String(url).trim();
    return str.includes('163cn.tv');
}

// ============================================================
// 通道一：qijieya（完整逻辑）
// ============================================================

const QIJIEYA_BASE = 'https://api.qijieya.cn/meting/';

async function qijieyaSongInfo(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) throw new Error('无法提取ID');

        const response = await fetch(`${QIJIEYA_BASE}?server=netease&type=song&id=${reqId}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        
        const data = await response.json();
        if (!data || data.length === 0) throw new Error('未找到歌曲信息');
        
        const song = data[0];

        let lyricText = '';
        if (song.lrc) {
            try {
                const lrcRes = await fetch(song.lrc);
                lyricText = await lrcRes.text();
            } catch (e) {}
        }

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
            neteaseId: reqId,
            source: 'qijieya'
        };
    } catch (error) {
        console.error('qijieya 单曲解析失败:', error);
        throw error;
    }
}

async function qijieyaSongUrl(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) return null;
        const res = await fetch(`${QIJIEYA_BASE}?server=netease&type=url&id=${reqId}`);
        const data = await res.json();
        return data.url || (data[0] && data[0].url) || null;
    } catch (e) {
        return null;
    }
}

async function qijieyaPlaylist(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) throw new Error('无法提取歌单ID');

        const response = await fetch(`${QIJIEYA_BASE}?server=netease&type=playlist&id=${reqId}`);
        if (!response.ok) throw new Error(`网络请求失败: ${response.status}`);
        
        const data = await response.json();
        if (!data || data.length === 0) {
            throw new Error('歌单为空或暂不支持解析');
        }

        return {
            name: '网易云导入歌单',
            creator: 'Meting API',
            description: '公共接口解析',
            coverImgUrl: data[0]?.pic || '',
            trackCount: data.length,
            tracks: data.map(song => {
                const idMatch = song.url ? song.url.match(/id=(\d+)/) : null;
                const songId = idMatch ? idMatch[1] : reqId;

                return {
                    id: songId,
                    name: song.name || '未知歌曲',
                    artists: song.artist || '未知艺术家',
                    album: '未知专辑',
                    picUrl: song.pic || ''
                };
            }).filter(t => t.id)
        };
    } catch (error) {
        console.error('qijieya 歌单解析失败:', error);
        throw error;
    }
}

// ============================================================
// 通道二：bugpk（完整逻辑）
// ============================================================

const BUGPK_BASE = 'https://api.bugpk.com/api/163_music';
const DEFAULT_LEVEL = 'exhigh';

async function bugpkSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接或歌曲ID');

        const response = await fetch(`${BUGPK_BASE}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (data.status !== 200) throw new Error(data.message || '解析失败');

        let songId = null;
        const idMatch = data.url?.match(/id=(\d+)/) || url.match(/id=(\d+)/);
        if (idMatch) songId = idMatch[1];

        return {
            title: data.name || '未知歌曲',
            artist: data.ar_name || '未知艺术家',
            url: data.url || '',
            lyrics: data.lyric || '',
            cover: data.pic || '',
            duration: '0:00',
            neteaseId: songId,
            source: 'bugpk'
        };
    } catch (error) {
        console.error('bugpk 单曲解析失败:', error);
        throw error;
    }
}

async function bugpkSongUrl(link) {
    try {
        const response = await fetch(`${BUGPK_BASE}?type=json&url=${encodeURIComponent(link)}&level=${DEFAULT_LEVEL}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.status !== 200) return null;
        return data.url || null;
    } catch (e) {
        console.error('bugpk 刷新链接失败:', e);
        return null;
    }
}

async function bugpkPlaylist(link) {
    try {
        let playlistId = extractNeteaseId(link);
        if (!playlistId) {
            if (/^\d+$/.test(link.trim())) {
                playlistId = link.trim();
            } else {
                throw new Error('无法提取歌单ID');
            }
        }

        const response = await fetch(`${BUGPK_BASE}?type=playlist&id=${playlistId}`);
        if (!response.ok) throw new Error(`网络请求失败: ${response.status}`);

        const result = await response.json();
        if (result.code !== 200) throw new Error(result.msg || '获取歌单失败');

        const playlist = result.data;
        if (!playlist.tracks || playlist.tracks.length === 0) {
            throw new Error('该歌单为空');
        }

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
    } catch (error) {
        console.error('bugpk 歌单解析失败:', error);
        throw error;
    }
}

// ============================================================
// 对外统一接口（自动选择通道）
// ============================================================

async function fetchNeteaseSongInfo(link) {
    // 短链接直接走 bugpk
    if (isShortLink(link)) {
        console.log('🔗 检测到短链接，使用 bugpk 通道');
        return await bugpkSongInfo(link);
    }

    // 非短链接：先试 qijieya，失败再试 bugpk
    try {
        const result = await qijieyaSongInfo(link);
        if (result && result.title) {
            return result;
        }
    } catch (e) {
        console.warn('qijieya 失败，切换到 bugpk:', e.message);
    }

    return await bugpkSongInfo(link);
}

async function refreshSongUrl(link) {
    if (isShortLink(link)) {
        console.log('🔗 检测到短链接，使用 bugpk 通道刷新');
        return await bugpkSongUrl(link);
    }

    try {
        const result = await qijieyaSongUrl(link);
        if (result) return result;
    } catch (e) {
        console.warn('qijieya 刷新失败，切换到 bugpk:', e.message);
    }

    return await bugpkSongUrl(link);
}

async function fetchNeteasePlaylist(link) {
    if (isShortLink(link)) {
        console.log('🔗 检测到短链接，使用 bugpk 通道获取歌单');
        return await bugpkPlaylist(link);
    }

    try {
        const result = await qijieyaPlaylist(link);
        if (result && result.tracks) {
            return result;
        }
    } catch (e) {
        console.warn('qijieya 歌单失败，切换到 bugpk:', e.message);
    }

    return await bugpkPlaylist(link);
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
window.isShortLink = isShortLink;
