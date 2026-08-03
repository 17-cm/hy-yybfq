/**
 * api.js - 音乐播放器网络请求模块
 * 版本: Paugram 极速直连版 (最终定稿)
 * 作者: hy.禾一
 */

// 全网最干净、最适合前端直连的 API 节点
const BASE_URL = 'https://api.paugram.com/netease/';

// ==========================================
// 工具函数：只允许纯数字，拦截所有短链
// ==========================================
function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (strLink.includes('163cn.tv')) return null; // 拦截手机端短链
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

// ==========================================
// 1. 获取歌曲全套信息 (一击必杀，秒出数据)
// ==========================================
async function fetchNeteaseSongInfo(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) {
            throw new Error('请输入纯数字 ID 或标准长链接');
        }

        // 发送最基础的 GET 请求，彻底告别跨域拦截
        const response = await fetch(`${BASE_URL}?id=${reqId}`);

        if (!response.ok) {
            throw new Error(`网络请求失败: ${response.status}`);
        }

        const data = await response.json();

        // Paugram 接口若找不到歌或无版权，通常无 link 字段
        if (!data.link) {
            throw new Error('歌曲无版权、为VIP专享或未获取到播放链接');
        }

        return {
            title: data.title || '未知歌曲',
            artist: data.artist || '未知艺术家',
            url: data.link,                 // 官方直链
            lyrics: data.lyric || '',       // 直接返回完整歌词文本
            cover: data.cover || '',        // 官方高清封面直链
            duration: '0:00',
            neteaseId: data.id || reqId
        };
    } catch (error) {
        console.error('单曲解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接 (直接使用官方直链拼凑)
// ==========================================
async function refreshSongUrl(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) return null;
        // 既然 Paugram 给的是官方 outer 直链，我们直接拼凑即可，连网络请求都省了！
        return `https://music.163.com/song/media/outer/url?id=${reqId}.mp3`;
    } catch (e) {
        return null;
    }
}

// ==========================================
// 3. 获取歌单
// ==========================================
async function fetchNeteasePlaylist(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) throw new Error('请输入纯数字 ID 或长链接');

        // 请求歌单数据
        const response = await fetch(`${BASE_URL}?id=${reqId}&playlist=true`);
        
        if (!response.ok) throw new Error(`网络请求失败: ${response.status}`);
        const data = await response.json();

        // 兼容处理：将返回的数据统一转成数组
        const tracks = Array.isArray(data) ? data : (data.tracks || []);
        
        if (tracks.length === 0) {
            if (data.title && data.link) {
                tracks.push(data); // 只有一首歌的情况
            } else {
                throw new Error('该歌单为空，或接口暂不支持此大型歌单');
            }
        }

        return {
            name: data.name || data.title || '网易云导入歌单',
            creator: 'Paugram API',
            description: '通过公共接口解析',
            coverImgUrl: data.cover || tracks[0]?.cover || '',
            trackCount: tracks.length,
            tracks: tracks.map(track => ({
                id: track.id,
                name: track.title || '未知歌曲',
                artists: track.artist || '未知艺术家',
                album: track.album || '',
                picUrl: track.cover || ''
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
window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.extractNeteaseId = extractNeteaseId;
