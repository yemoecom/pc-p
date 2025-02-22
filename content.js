// content.js 完整可用版
(function() {
    'use strict';

    // 唯一命名空间标识
    const NAMESPACE = Symbol.for('tiktok_scraper_extension');
    if (window[NAMESPACE]) return;
    window[NAMESPACE] = true;

    // ====================== UI构建 ======================
    const createScraperUI = () => {
        const container = document.createElement('div');
        container.id = 'scraper-root';
        container.innerHTML = `
            <style>
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
                    transition: all 0.3s ease;
                }
.attribute-control {
                    padding: 15px;
                    border-top: 1px solid rgba(0,0,0,0.1);
                }

                .attribute-row {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .attribute-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                }

                .btn-icon {
                    width: 34px;
                    height: 34px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    background: rgba(108,92,231,0.1);
                    color: #6c5ce7;
                }

                .btn-icon:hover {
                    background: rgba(108,92,231,0.2);
                }

                .add-row {
                    width: 100%;
                    margin-top: 10px;
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

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin: 15px;
                }

                .stat-card {
                    background: rgba(108,92,231,0.05);
                    padding: 12px;
                    border-radius: 8px;
                    text-align: center;
                }

                .stat-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #6c5ce7;
                }

                .xpath-control {
                    padding: 15px;
                    border-top: 1px solid rgba(0,0,0,0.1);
                }

                #xpathInput {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    margin-bottom: 10px;
                }

                .btn-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 15px;
                }

                .scraper-btn {
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .btn-primary {
                    background: #6c5ce7;
                    color: white;
                }

                .btn-secondary {
                    background: rgba(108,92,231,0.1);
                    color: #6c5ce7;
                }

                .loader {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>

            <div id="scraper-ui">
                <div class="scraper-header">
                    <h3 class="header-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                        TikTok数据采集
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
                    </div>

                    <!-- 属性管理区 -->
                    <div class="attribute-control">
                        <div id="attributeRows">
                            <div class="attribute-row">
                                <input type="text" class="attribute-input name" placeholder="属性名">
                                <input type="text" class="attribute-input xpath" placeholder="XPath">
                                <button class="btn-icon remove-btn" disabled>-</button>
                            </div>
                        </div>
                        <button class="btn-icon add-row" id="addRowBtn">+</button>
                    </div>

                    <!-- 操作按钮 -->
                        <div class="btn-group">
                            <button class="scraper-btn btn-primary" id="startBtn">
                                <div class="loader" style="display:none"></div>
                                开始采集
                            </button>
                            <button class="scraper-btn btn-secondary" id="exportBtn">
                                <i class="fas fa-download"></i>
                                导出数据
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.documentElement.appendChild(container);
        return container;
    };
// ====================== 属性管理 ======================
    class AttributeManager {
        constructor() {
            this.attributes = [];
            this.container = document.getElementById('attributeRows');
            this.init();
        }

        init() {
            // 事件监听
            this.container.addEventListener('input', this.validateInputs.bind(this));
            document.getElementById('addRowBtn').addEventListener('click', () => this.addRow());
            this.container.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-btn')) {
                    this.removeRow(e.target.closest('.attribute-row'));
                }
            });
            
            // 初始化至少一行
            this.updateRemoveButtons();
        }

        addRow(data = { name: '', xpath: '' }) {
            const row = document.createElement('div');
            row.className = 'attribute-row';
            row.innerHTML = `
                <input type="text" 
                    class="attribute-input name" 
                    placeholder="属性名" 
                    value="${data.name}">
                <input type="text" 
                    class="attribute-input xpath" 
                    placeholder="XPath" 
                    value="${data.xpath}">
                <button class="btn-icon remove-btn">-</button>
            `;
            this.container.appendChild(row);
            this.updateRemoveButtons();
        }

        removeRow(row) {
            if (this.container.children.length > 1) {
                row.remove();
                this.updateRemoveButtons();
            }
        }

        updateRemoveButtons() {
            const rows = this.container.children;
            Array.from(rows).forEach((row, index) => {
                const btn = row.querySelector('.remove-btn');
                btn.disabled = rows.length === 1;
            });
        }

        validateInputs() {
            let isValid = true;
            Array.from(this.container.children).forEach(row => {
                const name = row.querySelector('.name').value.trim();
                const xpath = row.querySelector('.xpath').value.trim();
                if (!name || !this.validateXPath(xpath)) {
                    isValid = false;
                }
            });
            document.getElementById('startBtn').disabled = !isValid;
        }

        validateXPath(xpath) {
            try {
                document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
                return true;
            } catch (error) {
                return false;
            }
        }

        getAttributes() {
            return Array.from(this.container.children).map(row => ({
                name: row.querySelector('.name').value.trim(),
                xpath: row.querySelector('.xpath').value.trim()
            }));
        }
    }
       // ====================== 数据采集 ======================
    const scrapeWithAttributes = (attributes) => {
        return Array.from(document.querySelectorAll('.product-wrapper')).map(wrapper => {
            const baseData = {
                title: wrapper.querySelector('.product-title')?.textContent?.trim() || '无标题',
                price: parseFloat(wrapper.querySelector('.price')?.textContent?.replace(/[^0-9.]/g, '') || 0)
            };

            // 采集自定义属性
            const customData = {};
            attributes.forEach(attr => {
                try {
                    const result = document.evaluate(
                        attr.xpath,
                        wrapper,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    );
                    customData[attr.name] = result.singleNodeValue?.textContent?.trim() || '';
                } catch (error) {
                    console.error(`XPath错误: ${attr.xpath}`, error);
                    customData[attr.name] = '';
                }
            });

            return { ...baseData, ...customData };
        });
    };

    // ====================== 核心功能 ======================
    let attributeManager;

    const initControls = () => {
        attributeManager = new AttributeManager();

        document.getElementById('startBtn').addEventListener('click', async () => {
            const attributes = attributeManager.getAttributes();
            const data = scrapeWithAttributes(attributes);
            
            // 存储数据
            chrome.storage.local.set({ products: data });
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            chrome.storage.local.get(['products'], ({ products = [] }) => {
                const attributes = attributeManager.getAttributes();
                const headers = ['商品标题', '价格', ...attributes.map(a => a.name)];
                const rows = products.map(p => [
                    p.title,
                    p.price,
                    ...attributes.map(a => p[a.name])
                ]);

                const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "商品数据");
                XLSX.writeFile(wb, `TikTok数据_${Date.now()}.xlsx`);
            });
        });
    };

    // ====================== 事件处理 ======================
    const initControls = () => {
        const startBtn = document.getElementById('startBtn');
        const exportBtn = document.getElementById('exportBtn');

        startBtn.addEventListener('click', async () => {
            if (isScraping) return;
            isScraping = true;
            
            const loader = startBtn.querySelector('.loader');
            startBtn.disabled = true;
            loader.style.display = 'inline-block';
            
            try {
                const data = scrapeProducts();
                const count = await updateStorage(data);
                document.getElementById('totalCount').textContent = count;
            } finally {
                loader.style.display = 'none';
                startBtn.disabled = false;
                isScraping = false;
            }
        });

        exportBtn.addEventListener('click', () => {
            chrome.storage.local.get(['products'], ({ products = [] }) => {
                const ws = XLSX.utils.json_to_sheet(products);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "商品数据");
                XLSX.writeFile(wb, `TikTok数据_${Date.now()}.xlsx`);
            });
        });
    };

     // ====================== 初始化 ======================
    const init = () => {
        const ui = createScraperUI();
        initControls();
        
        // 拖拽功能
        let isDragging = false;
        ui.querySelector('.scraper-header').addEventListener('mousedown', () => {
            isDragging = true;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            ui.style.top = `${e.clientY - 20}px`;
            ui.style.left = `${e.clientX - ui.offsetWidth/2}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    };

    // ====================== 启动 ======================
    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

    // 动态页面兼容
    new MutationObserver(() => {
        if (!document.getElementById('scraper-root')) init();
    }).observe(document.body, { childList: true, subtree: true });
})();