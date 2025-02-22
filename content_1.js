// content.js - 完整可用版本
(function() {
    'use strict';

    // 唯一标识符防止重复加载
    const NAMESPACE = Symbol.for('tiktok_scraper_extension');
    if (window[NAMESPACE]) return;
    window[NAMESPACE] = true;

    // 创建浮动UI容器
    const createScraperUI = () => {
        // 移除可能存在的旧实例
        const oldUI = document.getElementById('scraper-root');
        if (oldUI) oldUI.remove();

        // 主容器
        const container = document.createElement('div');
        container.id = 'scraper-root';
        container.innerHTML = `
            <style>
                /* 完整样式 */
                #scraper-ui {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 360px;
                    background: rgba(255,255,255,0.98);
                    border-radius: 12px;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(0,0,0,0.08);
                    z-index: 2147483647;
                    font-family: -apple-system, system-ui, sans-serif;
                    overflow: hidden;
                    transition: transform 0.3s ease;
                }

                .scraper-header {
                    padding: 14px 20px;
                    background: linear-gradient(135deg, #6c5ce7, #8e7dff);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                }

                .header-title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .controls {
                    display: flex;
                    gap: 8px;
                }

                .control-btn {
                    width: 28px;
                    height: 28px;
                    border: none;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.15);
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .control-btn:hover {
                    background: rgba(255,255,255,0.25);
                }

                .scraper-body {
                    padding: 16px;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .stat-card {
                    padding: 12px;
                    background: rgba(108,92,231,0.05);
                    border-radius: 8px;
                    border: 1px solid rgba(108,92,231,0.1);
                    text-align: center;
                }

                .stat-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #6c5ce7;
                }

                .stat-label {
                    font-size: 12px;
                    color: #666;
                    margin-top: 4px;
                }

                .progress-bar {
                    height: 6px;
                    background: rgba(108,92,231,0.15);
                    border-radius: 3px;
                    margin: 16px 0;
                    overflow: hidden;
                }

                .progress-fill {
                    width: 0%;
                    height: 100%;
                    background: #6c5ce7;
                    transition: width 0.3s ease;
                }

                .btn-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 16px 0;
                }

                .scraper-btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: #6c5ce7;
                    color: white;
                }

                .btn-primary:hover {
                    background: #5b4bc7;
                }

                .btn-secondary {
                    background: rgba(108,92,231,0.08);
                    color: #6c5ce7;
                }

                .btn-secondary:hover {
                    background: rgba(108,92,231,0.15);
                }

                .log-panel {
                    border-top: 1px solid rgba(0,0,0,0.05);
                    padding-top: 12px;
                    font-size: 12px;
                }

                .log-entry {
                    padding: 6px;
                    margin: 4px 0;
                    background: rgba(0,0,0,0.02);
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                    color: #444;
                }
            </style>

            <div id="scraper-ui">
                <div class="scraper-header">
                    <h3 class="header-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                        <span>商品数据采集器</span>
                    </h3>
                    <div class="controls">
                        <button class="control-btn minimize">－</button>
                        <button class="control-btn close">×</button>
                    </div>
                </div>
                <div class="scraper-body">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="totalCount">0</div>
                            <div class="stat-label">已采集</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="avgPrice">$0</div>
                            <div class="stat-label">平均价格</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="totalSales">0</div>
                            <div class="stat-label">总销量</div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="btn-group">
                        <button class="scraper-btn btn-primary" id="startBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            开始采集
                        </button>
                        <button class="scraper-btn btn-secondary" id="exportBtn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                            导出数据
                        </button>
                    </div>
                    <div class="log-panel" id="logContainer"></div>
                </div>
            </div>
        `;

        // 添加到文档
        document.documentElement.appendChild(container);
        return container;
    };

    // 初始化拖拽功能
    const initDrag = (uiElement) => {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        uiElement.addEventListener('mousedown', (e) => {
            if (e.target.closest('.control-btn')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = uiElement.offsetLeft;
            initialY = uiElement.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            uiElement.style.left = `${initialX + dx}px`;
            uiElement.style.top = `${initialY + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    };

    // 核心功能初始化
    const initCoreFunctions = () => {
        const ui = document.getElementById('scraper-ui');
        const startBtn = document.getElementById('startBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        // 数据存储
        let isScraping = false;

        // 采集逻辑
        const scrapeProducts = () => {
            return Array.from(document.querySelectorAll('.product-wrapper')).map(wrapper => {
                const title = wrapper.querySelector('.product-title')?.textContent?.trim() || '无标题';
                const priceText = wrapper.querySelector('.sale-price .price')?.textContent?.replace(/[^0-9.]/g, '') || '0';
                const salesText = wrapper.querySelector('.sold')?.textContent?.match(/\d+/)?.[0] || '0';
                return {
                    title,
                    price: parseFloat(priceText),
                    sales: parseInt(salesText),
                    image: wrapper.querySelector('img')?.src || '',
                    link: wrapper.querySelector('a')?.href || '',
                    timestamp: new Date().toISOString()
                };
            });
        };

        // 数据存储
        const updateStorage = async (newData) => {
            return new Promise(resolve => {
                chrome.storage.local.get(['products'], ({ products = [] }) => {
                    const existing = new Set(products.map(p => p.link));
                    const filtered = newData.filter(p => !existing.has(p.link));
                    if (filtered.length === 0) return resolve(0);
                    
                    chrome.storage.local.set({
                        products: [...products, ...filtered].slice(0, 1000) // 最多存1000条
                    }, () => resolve(filtered.length));
                });
            });
        };

        // 自动滚动
        const autoScroll = async () => {
            let prevHeight = 0;
            let currentHeight = document.documentElement.scrollHeight;
            let attempts = 0;

            while (attempts < 5 && prevHeight !== currentHeight) {
                window.scrollTo(0, document.documentElement.scrollHeight);
                await new Promise(r => setTimeout(r, 2000));
                
                const newData = scrapeProducts();
                const added = await updateStorage(newData);
                updateUI(added);
                
                prevHeight = currentHeight;
                currentHeight = document.documentElement.scrollHeight;
                attempts++;
            }
        };

        // 更新界面
        const updateUI = async (addedCount) => {
            chrome.storage.local.get(['products'], ({ products = [] }) => {
                const total = products.length;
                const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
                const avgPrice = total > 0 
                    ? (products.reduce((sum, p) => sum + p.price, 0) / total).toFixed(2)
                    : 0;

                document.getElementById('totalCount').textContent = total;
                document.getElementById('totalSales').textContent = totalSales;
                document.getElementById('avgPrice').textContent = `$${avgPrice}`;
                document.getElementById('progressFill').style.width = 
                    `${Math.min(100, (total / 500) * 100)}%`;

                if (addedCount > 0) {
                    const log = document.createElement('div');
                    log.className = 'log-entry';
                    log.innerHTML = `
                        <span>${new Date().toLocaleTimeString()}</span>
                        <span>新增 ${addedCount} 条记录</span>
                    `;
                    document.getElementById('logContainer').prepend(log);
                }
            });
        };

        // 按钮事件
        startBtn.addEventListener('click', async () => {
            if (isScraping) return;
            isScraping = true;
            startBtn.disabled = true;
            startBtn.innerHTML = `
                <div class="loader"></div>
                采集中...
            `;

            try {
                await autoScroll();
                updateUI(0);
            } catch (error) {
                console.error('采集失败:', error);
            } finally {
                isScraping = false;
                startBtn.disabled = false;
                startBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    开始采集
                `;
            }
        });

// 在content.js中找到导出按钮事件监听器，替换为以下代码
document.getElementById('exportBtn').addEventListener('click', async () => {
    const btn = document.getElementById('exportBtn');
    const originalHTML = btn.innerHTML;
    
    try {
        // 显示加载状态
        btn.innerHTML = `
            <div class="loader" style="display:inline-block"></div>
            正在生成文件...
        `;
        btn.disabled = true;

        // 添加延迟确保状态可见
        await new Promise(resolve => setTimeout(resolve, 300));

        // 验证XLSX库加载
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX库未正确加载，请刷新页面重试');
        }

        // 获取存储数据
        const { products = [] } = await new Promise(resolve => 
            chrome.storage.local.get(['products'], resolve)
        );

        // 数据验证
        if (!Array.isArray(products)) {
            throw new Error('数据格式错误，请重新采集');
        }
        if (products.length === 0) {
            showAlert('⚠️ 没有可导出的数据', '#ff9800');
            return;
        }

        // 数据清洗
        const cleanData = products.map((item, index) => {
            try {
                return {
                    '序号': index + 1,
                    '商品标题': item.title?.substring(0, 300) || '无标题', // 限制长度
                    '价格(USD)': typeof item.price === 'number' ? 
                        item.price.toFixed(2) : 
                        parseFloat(item.price?.replace(/[^0-9.]/g, '')) || 0,
                    '销量': Number(item.sales) || 0,
                    '图片链接': item.image?.startsWith('http') ? item.image : '无效链接',
                    '商品地址': item.link || '无链接',
                    '采集时间': new Date(item.timestamp).toLocaleString('zh-CN')
                };
            } catch (e) {
                console.error(`数据项${index}格式错误:`, item);
                return null;
            }
        }).filter(Boolean);

        // 创建工作表
        const worksheet = XLSX.utils.json_to_sheet(cleanData);
        
        // 设置列宽
        worksheet['!cols'] = [
            { wch: 5 },   // 序号
            { wch: 40 },  // 标题
            { wch: 10 },  // 价格
            { wch: 8 },   // 销量
            { wch: 35 },  // 图片
            { wch: 45 },  // 链接
            { wch: 20 }   // 时间
        ];

        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "商品数据");

        // 生成文件名
        const filename = `TikTok数据_${new Date()
            .toLocaleString('zh-CN')
            .replace(/[/:\\]/g, '-')
            .replace(/\s/g, '_')}.xlsx`;

        // 执行导出
        XLSX.writeFile(workbook, filename);
        
        // 显示成功提示
        showAlert('✅ 文件已开始下载', '#4CAF50');
        
        // 添加下载完成检查
        let checkCount = 0;
        const checkDownload = setInterval(() => {
            if (checkCount++ > 10) {
                clearInterval(checkDownload);
                showAlert('⚠️ 如果未自动下载，请检查浏览器设置', '#FFC107');
            }
        }, 500);

    } catch (error) {
        console.error('导出失败详情:', error);
        showAlert(`❌ 导出失败: ${error.message}`, '#f44336');
    } finally {
        // 恢复按钮状态
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
});
// 在content.js中找到最小化按钮初始化部分，替换为以下代码
const initControlButtons = () => {
    const ui = document.getElementById('scraper-ui');
    const minimizeBtn = ui.querySelector('.minimize');
    const closeBtn = ui.querySelector('.close');

    // 最小化功能增强
    let isMinimized = false;
    const originalHeight = ui.offsetHeight;

    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isMinimized = !isMinimized;
        
        // 添加动画过渡
        ui.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        if (isMinimized) {
            // 最小化状态
            ui.style.height = '40px';
            ui.querySelector('.scraper-body').style.opacity = '0';
            minimizeBtn.innerHTML = '＋';
            ui.style.transform = 'translateY(calc(100% - 40px))';
        } else {
            // 恢复状态
            ui.style.height = `${originalHeight}px`;
            ui.querySelector('.scraper-body').style.opacity = '1';
            minimizeBtn.innerHTML = '－';
            ui.style.transform = 'translateY(0)';
        }

        // 优化动画完成后重置属性
        setTimeout(() => {
            ui.style.transition = '';
        }, 300);
    });

    // 关闭按钮功能（保持原有代码）
    closeBtn.addEventListener('click', () => {
        ui.style.display = 'none';
    });

    // 双击标题栏最小化（增强体验）
    ui.querySelector('.scraper-header').addEventListener('dblclick', () => {
        minimizeBtn.click();
    });
};

// 在UI初始化流程中调用
const init = () => {
    try {
        const container = createScraperUI();
        initDrag(container.querySelector('#scraper-ui'));
        initControlButtons(); // 新增初始化调用
        initCoreFunctions();
        console.log('[Scraper] 初始化成功');
    } catch (error) {
        console.error('[Scraper] 初始化失败:', error);
    }
};
// 增强版提示显示（添加到现有showAlert函数）
function showAlert(message, color = '#6c5ce7') {
    const alertId = 'scraper-alert';
    let alertBox = document.getElementById(alertId);
    
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = alertId;
        alertBox.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 999999;
            font-family: -apple-system, sans-serif;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: 0.3s all;
        `;
        document.body.appendChild(alertBox);
    }

    alertBox.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span>${message}</span>
    `;
    alertBox.style.background = color;

    // 自动隐藏
    setTimeout(() => {
        alertBox.style.transform = 'translateY(100%)';
        setTimeout(() => alertBox.remove(), 300);
    }, 3000);
}

        // 关闭按钮
        ui.querySelector('.close').addEventListener('click', () => {
            ui.style.display = 'none';
        });
    };

    // 主初始化流程
    const init = () => {
        try {
            const container = createScraperUI();
            initDrag(container.querySelector('#scraper-ui'));
            initCoreFunctions();
            console.log('[Scraper] 初始化成功');
        } catch (error) {
            console.error('[Scraper] 初始化失败:', error);
        }
    };

    // 启动逻辑
    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

    // 动态页面兼容
    new MutationObserver((mutations) => {
        if (!document.getElementById('scraper-root')) init();
    }).observe(document.body, { childList: true, subtree: true });
})();