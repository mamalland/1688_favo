/**
 * 收藏夹整理工具 - 手机版 JavaScript
 */

// 全局状态
let currentCategory = 'all';
let currentView = 'grid';
let selectedProducts = new Set();
let isBatchMode = false;
let products = [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从 INITIAL_DATA 加载数据
    if (typeof INITIAL_DATA !== 'undefined' && INITIAL_DATA.products) {
        products = INITIAL_DATA.products.map(p => ({
            ...p,
            favorite: p.favorited || false  // 兼容字段名
        }));
        console.log('加载商品数据:', products.length, '个');
    } else {
        console.error('无法加载商品数据');
        products = [];
    }
    
    initApp();
});

function initApp() {
    renderProducts();
    initCategoryNav();
    initBottomBar();
    loadFromLocalStorage();
}

// 渲染商品列表
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    
    // 显示加载动画
    loading.style.display = 'flex';
    grid.innerHTML = '';
    
    // 模拟加载延迟
    setTimeout(() => {
        loading.style.display = 'none';
        
        // 获取当前分类的商品
        let filteredProducts = products;
        if (currentCategory === 'favorites') {
            filteredProducts = products.filter(p => p.favorite);
        } else if (currentCategory !== 'all') {
            filteredProducts = products.filter(p => p.category === currentCategory);
        }
        
        // 检查是否为空
        if (filteredProducts.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';
        
        // 渲染商品卡片
        filteredProducts.forEach(product => {
            const card = createProductCard(product);
            grid.appendChild(card);
        });
    }, 300);
}

// 创建商品卡片
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'mobile-product-card';
    card.dataset.id = product.id;
    
    if (selectedProducts.has(product.id)) {
        card.classList.add('selected');
    }
    
    const isFav = product.favorite ? 'active' : '';
    
    card.innerHTML = `
        <div class="product-image-wrapper" onclick="handleProductClick(${product.id}, event)">
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
        </div>
        <button class="favorite-btn ${isFav}" onclick="toggleFavorite(${product.id}, event)">❤</button>
        <div class="product-info" onclick="handleProductClick(${product.id}, event)">
            <div class="product-name">${product.name}</div>
            <div class="product-meta">
                <span class="product-price">${product.price}</span>
                <span class="product-category">${product.category}</span>
            </div>
        </div>
    `;
    
    // 长按选择（批量模式）
    let pressTimer;
    card.addEventListener('touchstart', function(e) {
        pressTimer = setTimeout(() => {
            if (!isBatchMode) {
                enterBatchMode();
            }
            toggleProductSelection(product.id);
        }, 500);
    });
    
    card.addEventListener('touchend', function() {
        clearTimeout(pressTimer);
    });
    
    return card;
}

// 处理商品点击
function handleProductClick(productId, event) {
    if (isBatchMode) {
        event.stopPropagation();
        toggleProductSelection(productId);
    } else {
        // 正常点击，跳转到商品详情
        const product = products.find(p => p.id === productId);
        if (product && product.url) {
            window.open(product.url, '_blank');
        }
    }
}

// 切换收藏状态
function toggleFavorite(productId, event) {
    event.stopPropagation();
    
    const product = products.find(p => p.id === productId);
    if (product) {
        product.favorite = !product.favorite;
        saveToLocalStorage();
        
        // 更新UI
        const btn = event.target;
        btn.classList.toggle('active');
        
        // 如果在收藏分类中，重新渲染
        if (currentCategory === 'favorites') {
            renderProducts();
        }
    }
}

// 进入批量模式
function enterBatchMode() {
    isBatchMode = true;
    selectedProducts.clear();
    document.body.classList.add('batch-mode');
    showToast('批量选择模式');
}

// 退出批量模式
function exitBatchMode() {
    isBatchMode = false;
    selectedProducts.clear();
    document.body.classList.remove('batch-mode');
    renderProducts();
}

// 切换商品选择
function toggleProductSelection(productId) {
    const card = document.querySelector(`.mobile-product-card[data-id="${productId}"]`);
    
    if (selectedProducts.has(productId)) {
        selectedProducts.delete(productId);
        card.classList.remove('selected');
    } else {
        selectedProducts.add(productId);
        card.classList.add('selected');
    }
    
    // 更新批量操作计数
    document.getElementById('selectedCount').textContent = selectedProducts.size;
}

// 初始化分类导航
function initCategoryNav() {
    const nav = document.getElementById('categoryNav');
    
    // 动态生成分类按钮
    if (typeof INITIAL_DATA !== 'undefined' && INITIAL_DATA.categories) {
        const categories = INITIAL_DATA.categories;
        const favoritesBtn = nav.querySelector('[data-category="favorites"]');
        
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-chip';
            btn.dataset.category = cat;
            btn.textContent = cat;
            nav.insertBefore(btn, favoritesBtn);
        });
    }
    
    // 绑定点击事件
    const chips = nav.querySelectorAll('.category-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', function() {
            // 更新激活状态
            chips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // 更新当前分类
            currentCategory = this.dataset.category;
            
            // 重新渲染商品
            renderProducts();
        });
    });
}

// 初始化底部栏
function initBottomBar() {
    const buttons = document.querySelectorAll('.mobile-bottom-bar .bottom-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            if (view) {
                // 更新视图
                buttons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentView = view;
                
                // 切换网格/列表视图
                const grid = document.getElementById('productGrid');
                if (view === 'list') {
                    grid.style.gridTemplateColumns = '1fr';
                } else {
                    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                }
            }
        });
    });
}

// 切换抽屉
function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');
    
    drawer.classList.toggle('open');
    overlay.classList.toggle('show');
}

// 切换搜索
function toggleSearch() {
    const modal = document.getElementById('searchModal');
    modal.classList.toggle('show');
    
    if (modal.classList.contains('show')) {
        document.getElementById('searchInput').focus();
    }
}

// 执行搜索
function performSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) return;
    
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    const results = products.filter(p => 
        p.name.toLowerCase().includes(keyword.toLowerCase()) ||
        p.category.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (results.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
    } else {
        document.getElementById('emptyState').style.display = 'none';
        results.forEach(product => {
            grid.appendChild(createProductCard(product));
        });
    }
    
    toggleSearch();
    showToast(`找到 ${results.length} 个商品`);
}

// 显示批量操作
function showBatchActions() {
    if (!isBatchMode) {
        enterBatchMode();
    }
    document.getElementById('batchModal').classList.add('show');
}

// 隐藏批量操作
function hideBatchActions() {
    document.getElementById('batchModal').classList.remove('show');
}

// 批量收藏
function batchFavorite() {
    selectedProducts.forEach(id => {
        const product = products.find(p => p.id === id);
        if (product) product.favorite = true;
    });
    saveToLocalStorage();
    hideBatchActions();
    exitBatchMode();
    showToast('已添加到收藏');
}

// 批量导出
function batchExport() {
    const selected = products.filter(p => selectedProducts.has(p.id));
    const dataStr = JSON.stringify(selected, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_products_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    hideBatchActions();
    exitBatchMode();
    showToast('导出成功');
}

// 批量删除
function batchDelete() {
    if (confirm(`确定要删除选中的 ${selectedProducts.size} 个商品吗？`)) {
        products = products.filter(p => !selectedProducts.has(p.id));
        saveToLocalStorage();
        hideBatchActions();
        exitBatchMode();
        renderProducts();
        showToast('删除成功');
    }
}

// 导出数据
function exportData() {
    const dataStr = JSON.stringify(products, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `favorite_backup_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    toggleDrawer();
    showToast('数据导出成功');
}

// 导入数据
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) {
                    products = data;
                    saveToLocalStorage();
                    renderProducts();
                    toggleDrawer();
                    showToast('数据导入成功');
                }
            } catch (err) {
                alert('文件格式错误');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// 清除缓存
function clearCache() {
    if (confirm('确定要清除所有缓存数据吗？')) {
        localStorage.removeItem('favorite_products');
        showToast('缓存已清除');
    }
}

// 切换到桌面版
function switchToDesktop() {
    window.location.href = '../index.html';
}

// 重置数据
function resetData() {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
        localStorage.clear();
        location.reload();
    }
}

// 保存到本地存储
function saveToLocalStorage() {
    localStorage.setItem('favorite_products', JSON.stringify(products));
}

// 从本地存储加载
function loadFromLocalStorage() {
    const saved = localStorage.getItem('favorite_products');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // 合并数据，保留原有商品
            data.forEach(item => {
                const existing = products.find(p => p.id === item.id);
                if (existing) {
                    existing.favorite = item.favorite;
                }
            });
        } catch (e) {
            console.error('加载数据失败', e);
        }
    }
}

// 显示提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 9999;
        animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);
