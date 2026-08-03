/**
 * api.js - 音乐播放器网络请求模块
 * 版本: Meting-API (修复版：完整音频流 + 修复歌单逻辑)
 * 作者: hy.禾一
 */

// 极度稳定的神级开源节点
const BASE_URL = 'https://api.injahow.cn/meting/';

// ==========================================
// 工具函数：拦截短链，提取纯数字
// ==========================================
function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (strLink.includes('163cn.tv')) return null; // 拦截短链
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
// 1. 获取歌曲全套信息 
// ==========================================
async function fetchNeteaseSongInfo(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) {
            throw new Error('请输入纯数字 ID 或标准长链接');
        }

        // 请求 Meting 单曲接口
        const response = await fetch(`${BASE_URL}?server=netease&type=song&id=${reqId}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        
        const data = await response.json();
        if (!data || data.length === 0) throw new Error('未找到歌曲信息');
        
        const song = data[0];

        // 拿歌词：Meting 返回的是一个歌词请求网址，我们必须再请求一次拿到纯文本
        let lyricText = '';
        if (song.lrc) {
            try {
                const lrcRes = await fetch(song.lrc);
                lyricText = await lrcRes.text();
            } catch (e) {
                console.log('歌词获取失败');
            }
        }

        return {
            title: song.name || '未知歌曲',
            artist: song.artist || '未知艺术家',
            url: song.url,              // Meting 后台解析的完整版音频链接
            lyrics: lyricText,          // 抓取到的真实歌词文本
            cover: song.pic || '',
            duration: '0:00',
            neteaseId: reqId
        };
    } catch (error) {
        console.error('单曲解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接 
// ==========================================
async function refreshSongUrl(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) return null;
        // 使用 Meting 的 url 接口获取最新直链
        const res = await fetch(`${BASE_URL}?server=netease&type=url&id=${reqId}`);
        const data = await res.json();
        return data.url || (data[0] && data[0].url) || null;
    } catch (e) {
        return null;
    }
}

// ==========================================
// 3. 获取歌单 (修复逻辑：只获取花名册)
// ==========================================
async function fetchNeteasePlaylist(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) throw new Error('请输入纯数字 ID 或长链接');

        // 请求 Meting 歌单接口
        const response = await fetch(`${BASE_URL}?server=netease&type=playlist&id=${reqId}`);
        if (!response.ok) throw new Error(`网络请求失败: ${response.status}`);
        
        const data = await response.json();
        if (!data || data.length === 0) {
            throw new Error('该歌单为空，或接口暂不支持解析');
        }

        // 把 Meting 吐出来的数组，转换为 UI 期待的“花名册”格式
        return {
            name: '网易云导入歌单', 
            creator: 'Meting API',
            description: '公共接口解析',
            coverImgUrl: data[0]?.pic || '',
            trackCount: data.length,
            // 生成 UI 期待的 tracks 数组
            tracks: data.map(song => {
                // Meting 返回的 url 长这样：https://api.../meting/?server=netease&type=url&id=12345
                // 我们从中提取出歌曲真实的 ID，交给 UI 去一首一首拉取！
                const idMatch = song.url ? song.url.match(/id=(\d+)/) : null;
                const songId = idMatch ? idMatch[1] : reqId;

                return {
                    id: songId,
                    name: song.name || '未知歌曲',
                    artists: song.artist || '未知艺术家',
                    album: '未知专辑',
                    picUrl: song.pic || ''
                };
            }).filter(t => t.id) // 过滤掉没有 ID 的废数据
        };
    } catch (error) {
        console.error('获取歌单失败:', error);
        throw error;
    }
}

window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.extractNeteaseId = extractNeteaseId;
