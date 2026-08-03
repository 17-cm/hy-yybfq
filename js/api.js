/**
 * api.js - 音乐播放器网络请求模块
 * 版本: Meting-API
 * 作者: hy.禾一
 */

// 你找到的神级 API 地址 (如果失效，可换成 musicapi.aliyuncs.com/meting)
const BASE_URL = 'https://api.aliyuncs.com/meting';

// ==========================================
// 工具函数：提取纯数字 ID，拦截恶心短链
// ==========================================
function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    
    // 如果是短链接，果断拦截，提示用户用数字
    if (strLink.includes('163cn.tv')) return null; 
    
    // 提取出纯数字
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : null; 
}

function isNeteaseLink(url) {
    const str = String(url).trim();
    if (str.includes('163cn.tv')) return false; // 拒绝短链
    return /^\d+$/.test(str) || str.includes('163');
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    if (str.includes('163cn.tv')) return false;
    return /^\d+$/.test(str) || url.includes('playlist');
}

// ==========================================
// 1. 获取歌曲全套信息 (Meting API)
// ==========================================
async function fetchNeteaseSongInfo(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) {
            throw new Error('不支持手机端分享的短链接，请直接输入纯数字ID！');
        }

        // Meting API 魔法：type=song 一步获取所有信息
        const targetUrl = `${BASE_URL}?server=netease&type=song&id=${reqId}`;
        const response = await fetch(targetUrl);

        if (!response.ok) throw new Error(`网络请求失败: HTTP ${response.status}`);
        
        const data = await response.json();
        
        // Meting 会返回一个数组，取第一个
        if (!data || data.length === 0) throw new Error('未找到歌曲，可能是VIP限制或ID错误');
        
        const song = data[0];
        if (!song.url) throw new Error('未获取到播放链接');

        // 尝试获取歌词 (Meting 的 lrc 字段可能是一个链接，也可能是原始文本)
        let lyricText = '';
        try {
            // 保险起见，单独请求一次歌词接口
            const lrcRes = await fetch(`${BASE_URL}?server=netease&type=lrc&id=${reqId}`);
            const lrcData = await lrcRes.text();
            
            // 尝试解析JSON（部分节点返回JSON格式），如果报错就说明是纯文本
            try {
                const parsed = JSON.parse(lrcData);
                lyricText = parsed.lyric || parsed.lrc || lrcData;
            } catch(e) {
                lyricText = lrcData; // 是纯文本歌词
            }
        } catch (e) {
            console.log('歌词获取失败，不影响播放');
        }

        return {
            title: song.name || '未知歌曲',
            artist: song.artist || '未知艺术家',
            url: song.url,
            lyrics: lyricText,
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

        const res = await fetch(`${BASE_URL}?server=netease&type=url&id=${reqId}`);
        const data = await res.json();
        
        // type=url 接口可能返回带有 url 字段的对象或直接是链接
        return data.url || (data[0] && data[0].url) || null;
    } catch (e) {
        return null;
    }
}

// ==========================================
// 3. 获取歌单全量歌曲 (Meting API 绝技)
// ==========================================
async function fetchNeteasePlaylist(link) {
    try {
        const reqId = extractNeteaseId(link);
        if (!reqId) throw new Error('请输入纯数字 ID 或长链接');

        // Meting API 魔法：type=playlist 直接把歌单里所有的歌全解出来！
        const targetUrl = `${BASE_URL}?server=netease&type=playlist&id=${reqId}`;
        const response = await fetch(targetUrl);
        
        if (!response.ok) throw new Error(`网络请求失败: HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
            throw new Error('歌单为空或解析失败');
        }

        // Meting 返回的是一个歌曲数组
        return {
            name: "网易云导入歌单", // Meting playlist接口直接返回歌曲列表，不包含歌单名字
            creator: "Meting API",
            description: "通过公共接口解析",
            coverImgUrl: data[0]?.pic || '', // 用第一首歌的封面当歌单封面
            trackCount: data.length,
            tracks: data.map(song => ({
                id: song.id || reqId, // 防止某些节点不返回歌曲ID
                name: song.name || '未知歌曲',
                artists: song.artist || '未知艺术家',
                album: '未知专辑',
                picUrl: song.pic || ''
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
