/**
 * api.js - 音乐播放器网络请求模块
 * 版本: 简化版
 * 作者: hy.禾一
 * 说明：直接丢链接给 API，不判断类型
 */

// ==========================================
// 接口配置
// ==========================================
const BASE_URL = 'https://api.bugpk.com/api/163_music';
const DEFAULT_LEVEL = 'exhigh'; // 默认极高音质

// ==========================================
// 1. 获取单曲信息（也支持歌单，但只返回第一首）
// ==========================================
async function fetchNeteaseSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        const response = await fetch(`${BASE_URL}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (data.status !== 200) throw new Error(data.message || '解析失败');

        return {
            title: data.name || '未知歌曲',
            artist: data.ar_name || '未知艺术家',
            url: data.url || '',
            lyrics: data.lyric || '',
            cover: data.pic || '',
            duration: '0:00',
            link: url  // 保存原始链接用于刷新
        };
    } catch (error) {
        console.error('解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接
// ==========================================
async function refreshSongUrl(link) {
    if (!link) return null;
    try {
        const response = await fetch(`${BASE_URL}?type=json&url=${encodeURIComponent(link)}&level=${DEFAULT_LEVEL}`);
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
// 3. 获取歌单
// ==========================================
async function fetchNeteasePlaylist(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入歌单链接');

        // 直接用链接请求，API 会识别是歌单
        const response = await fetch(`${BASE_URL}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (data.status !== 200) throw new Error(data.message || '解析失败');

        // 如果是歌单，API 会返回 tracks
        if (data.tracks && data.tracks.length > 0) {
            return {
                name: data.name || '网易云歌单',
                creator: data.creator || '未知',
                description: data.description || '',
                coverImgUrl: data.pic || '',
                trackCount: data.tracks.length,
                tracks: data.tracks.map(track => ({
                    id: track.id,
                    name: track.name || '未知歌曲',
                    artists: track.ar_name || '未知艺术家',
                    album: track.album || '未知专辑',
                    picUrl: track.pic || '',
                    link: `https://music.163.com/song?id=${track.id}`
                }))
            };
        }

        // 如果返回的不是歌单，尝试单曲
        if (data.name && data.url) {
            return {
                name: '单曲',
                creator: data.ar_name || '未知',
                description: '',
                coverImgUrl: data.pic || '',
                trackCount: 1,
                tracks: [{
                    id: null,
                    name: data.name,
                    artists: data.ar_name || '未知艺术家',
                    album: data.album || '未知专辑',
                    picUrl: data.pic || '',
                    link: url
                }]
            };
        }

        throw new Error('未找到歌曲或歌单');
    } catch (error) {
        console.error('获取歌单失败:', error);
        throw error;
    }
}

// ==========================================
// 暴露到全局
// ==========================================
window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
