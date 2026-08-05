/**
 * api-qishui.js - 汽水音乐解析模块
 * 作者: hy.禾一
 * 说明：使用 https://api.pearapi.ai/api/qishui_music 作为数据源
 */

// ==========================================
// 接口配置
// ==========================================
const QISHUI_BASE = 'https://api.pearapi.ai/api/qishui_music';

// ==========================================
// 核心函数
// ==========================================

async function fetchQishuiSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();

        if (data.code !== 200) {
            throw new Error(data.msg || '解析失败');
        }

        const song = data.data;
        if (!song || !song.song_name) {
            throw new Error('未找到歌曲信息');
        }

        let songId = null;
        const idMatch = url.match(/[?&]id=(\d+)/) || url.match(/\/song\/(\d+)/);
        if (idMatch) songId = idMatch[1];

        return {
            title: song.song_name || '未知歌曲',
            artist: song.singers || '未知艺术家',
            url: song.url || '',
            lyrics: song.lyrics || '',
            cover: song.cover || '',
            duration: '0:00',
            neteaseId: songId,
            source: 'qishui',
            _originalLink: url
        };
    } catch (error) {
        console.error('汽水音乐解析失败:', error);
        throw error;
    }
}

async function refreshQishuiSongUrl(link, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`🔄 汽水刷新尝试 ${attempt + 1}...`);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(link)}`, {
                signal: controller.signal
            });
            clearTimeout(timeout);
            
            if (!response.ok) continue;
            
            const data = await response.json();
            
            if (data.code !== 200) {
                console.warn(`⚠️ API 返回错误: ${data.msg || '未知错误'}`);
                continue;
            }
            
            const newUrl = data.data?.url || null;
            if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
                console.log(`✅ 汽水链接刷新成功 (尝试 ${attempt + 1})`);
                return newUrl;
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                console.warn(`⚠️ 汽水刷新超时 (尝试 ${attempt + 1})`);
            } else {
                console.warn(`⚠️ 汽水刷新失败 (尝试 ${attempt + 1}):`, e.message);
            }
        }
        
        if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }
    
    console.error('❌ 汽水链接刷新失败，已达最大重试次数');
    return null;
}

async function fetchQishuiPlaylist(link) {
    throw new Error('汽水音乐歌单解析暂不支持，请使用单曲链接');
}

// ==========================================
// 暴露到全局
// ==========================================
window.fetchQishuiSongInfo = fetchQishuiSongInfo;
window.refreshQishuiSongUrl = refreshQishuiSongUrl;
window.fetchQishuiPlaylist = fetchQishuiPlaylist;
