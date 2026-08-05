/**
 * api.js - 音乐播放器网络请求模块
 * 作者: hy.禾一
 * 
 * 核心逻辑：
 * 1. 导入时：识别链接类型 → 请求对应接口 → 存储必要信息
 * 2. 刷新时：根据存储的信息 → 选择 url 或 ids → 重新获取播放链接
 */

const BASE_URL = 'https://api.bugpk.com/api/163_music';
const DEFAULT_LEVEL = 'exhigh';

// ==========================================
// 工具函数：审查链接类型
// ==========================================

/**
 * 审查链接类型
 * @param {string} url - 用户输入的链接
 * @returns {{ type: 'shortlink'|'song'|'playlist'|'unknown', id: string|null }}
 */
function inspectLink(url) {
    const str = String(url).trim();
    
    // 短链接（163cn.tv）
    if (str.includes('163cn.tv')) {
        return { type: 'shortlink', id: null };
    }
    
    // 歌单（包含 playlist）
    if (str.includes('playlist')) {
        const match = str.match(/id=(\d+)/);
        if (match) {
            return { type: 'playlist', id: match[1] };
        }
        return { type: 'playlist', id: null };
    }
    
    // 单曲（包含 song 或 music.163.com）
    if (str.includes('song') || str.includes('music.163.com')) {
        const match = str.match(/id=(\d+)/);
        if (match) {
            return { type: 'song', id: match[1] };
        }
        return { type: 'song', id: null };
    }
    
    // 纯数字（当作歌曲ID）
    if (/^\d+$/.test(str)) {
        return { type: 'song', id: str };
    }
    
    // 未知类型
    return { type: 'unknown', id: null };
}

/**
 * 从链接中提取 ID
 */
function extractIdFromLink(link) {
    const inspected = inspectLink(link);
    return inspected.id;
}

/**
 * 判断是否为歌单链接
 */
function isPlaylistLink(url) {
    const inspected = inspectLink(url);
    return inspected.type === 'playlist';
}

// ==========================================
// 1. 获取单曲信息（导入时使用）
// ==========================================

/**
 * 获取单曲信息
 * @param {string} link - 用户输入的链接（短链接或长链接）
 * @returns {Promise<{ title, artist, url, lyrics, cover, shareLink }>}
 */
async function fetchNeteaseSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        // 审查链接类型
        const inspected = inspectLink(url);
        
        // 构建请求
        let requestUrl;
        if (inspected.type === 'shortlink' || inspected.type === 'song') {
            // 短链接和长链接都用 url 参数
            requestUrl = `${BASE_URL}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`;
        } else {
            throw new Error('不支持的链接类型，请检查链接是否正确');
        }

        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (data.status !== 200) throw new Error(data.message || '解析失败');

        // 返回歌曲信息
        return {
            title: data.name || '未知歌曲',
            artist: data.ar_name || '未知艺术家',
            url: data.url || '',
            lyrics: data.lyric || '',
            cover: data.pic || '',
            duration: '0:00',
            shareLink: url,        // 存储用户输入的原始链接（刷新时用）
            songId: inspected.id,  // 如果有 ID 也存一下（备用）
            source: 'netease'
        };
    } catch (error) {
        console.error('单曲解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接（失效时使用）
// ==========================================

/**
 * 刷新单曲播放链接
 * @param {Object} track - 歌曲对象
 * @param {string} track.shareLink - 存储的分享链接（短链接或长链接）
 * @param {string} track.songId - 存储的歌曲ID（歌单导入时有）
 * @returns {Promise<string|null>} 新的播放链接
 */
async function refreshSongUrl(track) {
    if (!track) return null;
    
    let requestUrl;
    const shareLink = track.shareLink;
    const songId = track.songId;
    
    // 判断用 url 还是 ids
    if (shareLink) {
        // 有分享链接 → 用 url 参数
        const inspected = inspectLink(shareLink);
        if (inspected.type === 'shortlink' || inspected.type === 'song') {
            requestUrl = `${BASE_URL}?type=json&url=${encodeURIComponent(shareLink)}&level=${DEFAULT_LEVEL}`;
        } else if (inspected.type === 'playlist') {
            // 如果 shareLink 是歌单链接，说明这首歌来自歌单
            // 需要用 songId 去刷新
            if (songId) {
                requestUrl = `${BASE_URL}?type=json&ids=${songId}&level=${DEFAULT_LEVEL}`;
            } else {
                console.warn('歌单歌曲缺少 songId，无法刷新');
                return null;
            }
        } else {
            // 未知类型，尝试用原链接
            requestUrl = `${BASE_URL}?type=json&url=${encodeURIComponent(shareLink)}&level=${DEFAULT_LEVEL}`;
        }
    } else if (songId) {
        // 没有分享链接但有 songId（歌单导入的情况）
        requestUrl = `${BASE_URL}?type=json&ids=${songId}&level=${DEFAULT_LEVEL}`;
    } else {
        console.warn('缺少 shareLink 和 songId，无法刷新');
        return null;
    }

    try {
        const response = await fetch(requestUrl);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.status !== 200) return null;
        return data.url || null;
    } catch (e) {
        console.error('刷新链接失败:', e);
        return null;
    }
}

// ==========================================
// 3. 获取歌单（导入时使用）
// ==========================================

/**
 * 获取歌单信息
 * @param {string} link - 用户输入的歌单链接
 * @returns {Promise<{ name, creator, description, coverImgUrl, trackCount, shareLink, tracks }>}
 */
async function fetchNeteasePlaylist(link) {
    try {
        const url = String(link).trim();
        if (!url) throw new Error('请输入歌单链接');

        // 审查链接
        const inspected = inspectLink(url);
        if (inspected.type !== 'playlist') {
            throw new Error('不是有效的歌单链接');
        }
        if (!inspected.id) {
            throw new Error('无法提取歌单ID');
        }

        // 请求歌单（必须用 id）
        const response = await fetch(`${BASE_URL}?type=playlist&id=${inspected.id}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

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
            shareLink: url,  // 存储歌单链接
            tracks: playlist.tracks.map(track => ({
                id: track.id,
                name: track.name || '未知歌曲',
                artists: track.artists || '未知艺术家',
                album: track.album || '未知专辑',
                picUrl: track.picUrl || '',
                // 歌单里的歌：存储歌曲 ID（刷新时用 ids=xxx）
                songId: String(track.id),
                // 歌单链接（仅用于显示/追溯）
                shareLink: url
            }))
        };
    } catch (error) {
        console.error('获取歌单失败:', error);
        throw error;
    }
}

// ==========================================
// 暴露到全局
// ==========================================

window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.refreshSongUrl = refreshSongUrl;
window.isPlaylistLink = isPlaylistLink;
window.inspectLink = inspectLink;
window.extractIdFromLink = extractIdFromLink;
