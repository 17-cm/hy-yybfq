/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 1.1.0 (终极直连版：完全释放新接口的短链解析能力)
 * 作者: hy.禾一 / Code Reviewer
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
    songUrl: BASE_URL + '/api/getSongUrl',
    songInfo: BASE_URL + '/api/getSongInfo',
    lyric: BASE_URL + '/api/getSongLyric',
    playlist: BASE_URL + '/api/playlist_trackall'
};

// ============================================================
// 核心修复：智能ID提取器 (放行短链接！)
// ============================================================

function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    
    // 1. 如果是纯数字，转成真实的 Number 格式（防止 400 报错）
    if (/^\d+$/.test(strLink)) return Number(strLink);
    
    // 2. 如果包含 id=xxx，提取出数字并转为 Number
    const idMatch = strLink.match(/id=(\d+)/);
    if (idMatch) return Number(idMatch[1]);
    
    const pathMatch = strLink.match(/song\/(\d+)/);
    if (pathMatch) return Number(pathMatch[1]);
    
    // 3. 关键修复：如果以上都不满足（比如 163cn.tv 短链），
    // 绝对不要返回 null 阻断它！原封不动地返回这串短链，让聪明的后端去处理！
    return strLink;
}

// ============================================================
// 1. 刷新播放链接
// ============================================================

async function refreshSongUrl(neteaseId, quality = 'lossless') {
    try {
        const id = extractNeteaseId(neteaseId);

        const response = await fetch(API_URLS.songUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id, 
                level: quality
            })
        });

        if (!response.ok) throw new Error('获取播放链接失败');
        const data = await response.json();

        // 兼容新接口的多种状态判断
        if (data.status !== 200 && data.code !== 200 && data.success !== true) {
            throw new Error(data.message || '获取播放链接失败');
        }

        const playUrl = data.data?.url || '';
        if (!playUrl) throw new Error('返回数据中无播放链接');

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
        const id = extractNeteaseId(link);
        if (!id) throw new Error('歌曲链接或ID不能为空');

        // 获取歌曲信息
        const infoResponse = await fetch(API_URLS.songInfo, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        if (!infoResponse.ok) throw new Error('获取歌曲信息失败');
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
                id: id,
                level: quality
            })
        });

        if (!urlResponse.ok) throw new Error('获取播放链接失败');
        const urlData = await urlResponse.json();

        if (urlData.status !== 200 && urlData.code !== 200 && urlData.success !== true) {
            throw new Error(urlData.message || '获取播放链接失败');
        }

        const playUrl = urlData.data?.url || '';
        if (!playUrl) throw new Error('无法获取播放链接');

        // 获取歌词
        let lyrics = '';
        try {
            const lyricResponse = await fetch(API_URLS.lyric, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            if (lyricResponse.ok) {
                const lyricData = await lyricResponse.json();
                if (lyricData.status === 200 || lyricData.code === 200 || lyricData.success === true) {
                    lyrics = lyricData.data?.lyric || '';
                }
            }
        } catch (e) {
            // 歌词获取失败静默处理
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
        const playlistId = extractNeteaseId(link);
        if (!playlistId) throw new Error('歌单链接或ID不能为空');

        const response = await fetch(API_URLS.playlist, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: playlistId,
                limit: limit,
                offset: offset
            })
        });

        if (!response.ok) throw new Error('获取歌单失败');
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
