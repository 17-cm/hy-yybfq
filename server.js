/**
 * server.js - 音乐播放器专属后端代理
 * 作用：随插件一键安装，自动突破浏览器跨域限制，替前端去网易云拿数据
 */

const info = {
    id: "音乐播放器", // 你的插件专属ID
    name: "音乐播放器后端代理",
    description: "专为音乐播放器提供无 CORS 限制的请求代理"
};

async function init(router) {
    console.log('[🎵 音乐播放器] 后端代理引擎已自动挂载成功！');

    // 注册你专属的跑腿通道：/api/plugins/hy_music_player/forward
    router.post('/forward', async (req, res) => {
        try {
            const { targetUrl, payload } = req.body;

            // 后端特工亲自出马，替前端去请求那个最好用的 Python API
            const apiRes = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await apiRes.json();
            res.json(data); // 原封不动还给前端
        } catch (error) {
            console.error('[🎵 音乐播放器] 后端代理请求失败:', error);
            res.status(500).json({ status: 500, success: false, message: '后端代发请求失败' });
        }
    });
}

async function exit() {
    console.log('[🎵 音乐播放器] 后端代理引擎已卸载');
}

module.exports = { info, init, exit };
