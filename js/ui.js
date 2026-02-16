// UI模块
const UIManager = {
    // 莫兰迪色系配色
    morandiColors: ['#8B9DC3', '#A8B5C4', '#B8C5D6', '#9BA4AD', '#A5B5C5', '#B5C0CA', '#9DAEC2', '#AFC1D0'],

    // 初始化UI
    init() {
        console.log('UIManager init started');
        this.batchMode = false;
        this.selectedProducts = new Set();
        
        this.renderCategories();
        this.renderProducts('all');
        this.bindEvents();
        this.checkLoginStatus();
        
        console.log('UIManager init completed');
    },

    // 渲染分类按钮
    renderCategories() {
        console.log('Rendering categories');
        const categoryNav = document.querySelector('.category-nav');
        if (!categoryNav) {
            console.error('Category nav not found');
            return;
        }

        const categories = DataManager.getCategories();
        console.log('Categories:', categories);

        // 清空现有分类按钮（保留全部和归档）
        const categoryButtons = categoryNav.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            if (btn.dataset.category !== 'all' && btn.dataset.category !== 'archive') {
                btn.remove();
            }
        });

        // 更新【全部】按钮的商品总数
        const allBtn = document.querySelector('[data-category="all"]');
        if (allBtn) {
            const totalCount = DataManager.getProducts().length;
            allBtn.textContent = `全部(${totalCount})`;
        }

        // 更新【归档】按钮的商品数量
        const archiveBtn = document.querySelector('[data-category="archive"]');
        if (archiveBtn) {
            const archiveCount = DataManager.getProductsByCategory('archive').length;
            archiveBtn.textContent = `归档(${archiveCount})`;
        }
        if (!archiveBtn) {
            console.error('Archive button not found');
            return;
        }

        categories.forEach((category, index) => {
            const count = DataManager.getProductsByCategory(category).length;
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.dataset.category = category;
            btn.textContent = `${category}(${count})`;

            // 使用CSS定义的默认样式，不设置内联颜色
            // 样式由CSS统一管理：浅灰未选中，深灰选中

            archiveBtn.before(btn);
        });

        // 绑定分类按钮点击事件
        this.bindCategoryEvents();
    },

    // 绑定分类按钮点击事件
    bindCategoryEvents() {
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有按钮的active类
                categoryButtons.forEach(b => {
                    b.classList.remove('active');
                });
                // 添加当前按钮的active类
                btn.classList.add('active');
                // 渲染对应分类的商品
                this.renderProducts(btn.dataset.category);
            });
        });
    },

    // 渲染商品
    renderProducts(category) {
        console.log('Rendering products for category:', category);
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) {
            console.error('Product grid not found');
            return;
        }

        let products = DataManager.getProductsByCategory(category);
        console.log('Products found:', products.length);
        console.log('Products data:', products);

        // 在所有分类中，收藏的商品排在最前
        products = products.sort((a, b) => {
            if (a.favorited && !b.favorited) return -1;
            if (!a.favorited && b.favorited) return 1;
            return 0;
        });

        // 清空现有商品
        productGrid.innerHTML = '';

        if (products.length === 0) {
            // 显示空状态
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = '<p>暂无商品</p>';
            productGrid.appendChild(emptyState);
            return;
        }

        // 渲染商品卡片
        products.forEach(product => {
            console.log('Rendering product:', product);
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.productId = product.id;
            
            if (this.selectedProducts.has(product.id)) {
                productCard.classList.add('selected');
            }
            
            // 批量模式时显示复选框
            const checkboxHtml = this.batchMode ? 
                `<input type="checkbox" class="batch-checkbox" ${this.selectedProducts.has(product.id) ? 'checked' : ''}>` : '';
            
            // 登录状态下的操作按钮（悬停显示）
            let actionsHtml = '';
            if (DataManager.isLoggedIn() && !this.batchMode) {
                // 根据是否归档显示不同按钮
                const archiveBtnText = product.archived ? '还原' : '归档';
                const archiveBtnAction = product.archived ? 'restore' : 'archive';
                actionsHtml = `
                    <div class="product-actions-overlay">
                        <button class="action-btn" data-action="delete" data-id="${product.id}">删除</button>
                        <button class="action-btn" data-action="${archiveBtnAction}" data-id="${product.id}">${archiveBtnText}</button>
                        ${!product.archived ? `<button class="action-btn" data-action="change-category" data-id="${product.id}">调整分类</button>` : ''}
                    </div>
                `;
            }

            // 收藏按钮 - 右上角心形
            const isFavorited = product.favorited;
            const favoriteHtml = `
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-id="${product.id}" title="${isFavorited ? '取消收藏' : '收藏'}">
                    ${isFavorited ? '❤' : '♡'}
                </button>
            `;

            // 商品卡片内容 - 1:1图片比例
            productCard.innerHTML = `
                ${checkboxHtml}
                <div class="product-image-wrapper" onclick="window.open('${product.url || '#'}', '_blank')">
                    <img src="${product.image || ''}"
                         alt="${product.name || '商品'}"
                         class="product-image"
                         data-url="${product.url || '#'}"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${product.image || ''}?retry=1';">
                    ${favoriteHtml}
                    ${actionsHtml}
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name || '未命名商品'}</div>
                    <div class="product-price-sales">
                        <span class="product-price">¥${product.price || 0}</span>
                        <span class="product-sales">销量: ${product.sales || 0}</span>
                    </div>
                </div>
            `;
            
            productGrid.appendChild(productCard);
            
            // 批量模式下绑定复选框事件
            if (this.batchMode) {
                const checkbox = productCard.querySelector('.batch-checkbox');
                if (checkbox) {
                    checkbox.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            this.selectedProducts.add(product.id);
                            productCard.classList.add('selected');
                        } else {
                            this.selectedProducts.delete(product.id);
                            productCard.classList.remove('selected');
                        }
                        this.updateBatchButtons();
                    });
                }
                
                // 点击卡片切换选中状态
                productCard.addEventListener('click', (e) => {
                    if (e.target.type !== 'checkbox' && !e.target.closest('.action-btn')) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
            }
        });
        
        // 绑定商品图片点击事件
        if (!this.batchMode) {
            this.bindProductImageEvents();

            // 绑定商品操作按钮点击事件
            if (DataManager.isLoggedIn()) {
                this.bindProductActionEvents();
            }

            // 绑定收藏按钮点击事件
            this.bindFavoriteEvents();
        }
    },

    // 绑定收藏按钮点击事件
    bindFavoriteEvents() {
        const favoriteBtns = document.querySelectorAll('.favorite-btn');
        favoriteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.id);
                const isFavorited = DataManager.toggleFavorite(productId);

                // 更新按钮显示
                if (isFavorited) {
                    btn.classList.add('favorited');
                    btn.innerHTML = '❤';
                    btn.title = '取消收藏';
                } else {
                    btn.classList.remove('favorited');
                    btn.innerHTML = '🤍';
                    btn.title = '收藏';
                }

                // 在任何分类中都重新排序，让收藏的商品排在前面
                const currentCategory = document.querySelector('.category-btn.active')?.dataset.category;
                if (currentCategory) {
                    this.renderProducts(currentCategory);
                }
            });
        });
    },

    // 绑定商品图片点击事件
    bindProductImageEvents() {
        const productImages = document.querySelectorAll('.product-image');
        productImages.forEach(img => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = img.dataset.url;
                if (url && url !== '#') {
                    window.open(url, '_blank');
                }
            });
        });
    },

    // 绑定商品操作按钮点击事件
    bindProductActionEvents() {
        const actionButtons = document.querySelectorAll('.product-actions-overlay .action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const productId = parseInt(btn.dataset.id);

                switch (action) {
                    case 'delete':
                        this.showDeleteConfirmModal(productId);
                        break;
                    case 'archive':
                        this.showArchiveConfirmModal(productId);
                        break;
                    case 'restore':
                        this.showRestoreConfirmModal(productId);
                        break;
                    case 'change-category':
                        this.showChangeCategoryModal(productId);
                        break;
                }
            });
        });
    },

    // 绑定全局事件
    bindEvents() {
        console.log('Binding events');
        
        // 登录按钮点击事件
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Login button clicked');
                this.showLoginModal();
            });
        } else {
            console.error('Login button not found');
        }
        
        // 退出按钮点击事件
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Logout button clicked');
                DataManager.setLoggedIn(false);
                this.checkLoginStatus();
                this.renderProducts('all');
            });
        }
        
        // 关闭模态框事件
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                this.hideModal();
            }
        });
        
        // 侧边栏关闭按钮
        const closeSidebarBtn = document.querySelector('.close-sidebar');
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
        
        // 侧边栏遮罩点击关闭
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
        
        console.log('Events bound successfully');
    },

    // 检查登录状态
    checkLoginStatus() {
        console.log('Checking login status');
        const isLoggedIn = DataManager.isLoggedIn();
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const topFunctionBar = document.querySelector('.top-function-bar');
        
        if (loginBtn) {
            loginBtn.style.display = isLoggedIn ? 'none' : 'block';
        }
        
        if (logoutBtn) {
            logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
        }
        
        if (topFunctionBar) {
            // 手机端始终隐藏功能栏，桌面端根据登录状态显示
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                topFunctionBar.style.display = 'none';
            } else {
                topFunctionBar.style.display = isLoggedIn ? 'flex' : 'none';
            }
        }
        
        if (!isLoggedIn) {
            this.exitBatchMode();
        }
        
        // 重新渲染商品以显示/隐藏操作按钮
        this.renderProducts(document.querySelector('.category-btn.active')?.dataset.category || 'all');
    },

    // 打开侧边栏
    openSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.style.display = 'block';
        this.renderSidebarCategories();
    },

    // 关闭侧边栏
    closeSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.style.display = 'none';
    },

    // 渲染侧边栏分类列表
    renderSidebarCategories() {
        const categoryList = document.getElementById('sidebar-category-list');
        if (!categoryList) return;

        const categories = DataManager.getCategories();

        categoryList.innerHTML = '';

        categories.forEach(category => {
            const count = DataManager.getProductsByCategory(category).length;
            const item = document.createElement('div');
            item.className = 'category-item';
            item.dataset.category = category;
            item.innerHTML = `
                <span class="category-name">${category}(${count})</span>
                <div class="category-actions">
                    <button class="edit-btn" data-category="${category}">修改</button>
                    <button class="delete-btn" data-category="${category}">删除</button>
                </div>
            `;
            categoryList.appendChild(item);
        });

        // 绑定编辑和删除按钮事件
        categoryList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.enableInlineEdit(btn.closest('.category-item'), btn.dataset.category);
            });
        });

        categoryList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showDeleteCategoryModal(btn.dataset.category);
            });
        });
    },

    // 启用行内编辑分类名称
    enableInlineEdit(categoryItem, oldCategoryName) {
        const count = DataManager.getProductsByCategory(oldCategoryName).length;
        const nameSpan = categoryItem.querySelector('.category-name');

        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldCategoryName;
        input.className = 'inline-edit-input';

        // 替换span为input
        nameSpan.replaceWith(input);
        input.focus();
        input.select();

        // 保存编辑的函数
        const saveEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== oldCategoryName) {
                // 更新分类名称
                const categories = DataManager.getCategories();
                const index = categories.indexOf(oldCategoryName);
                if (index > -1) {
                    categories[index] = newName;
                    localStorage.setItem('categories', JSON.stringify(categories));

                    // 更新所有商品的分类
                    const products = DataManager.getProducts();
                    products.forEach(product => {
                        if (product.category === oldCategoryName) {
                            product.category = newName;
                        }
                    });
                    localStorage.setItem('products', JSON.stringify(products));

                    // 刷新UI
                    this.renderCategories();
                    this.renderProducts(document.querySelector('.category-btn.active')?.dataset.category || 'all');
                    this.renderSidebarCategories();
                }
            } else {
                // 如果没有修改或为空，恢复原状
                this.renderSidebarCategories();
            }
        };

        // 取消编辑的函数
        const cancelEdit = () => {
            this.renderSidebarCategories();
        };

        // 绑定事件
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    },

    // 进入批量管理模式
    enterBatchMode() {
        this.batchMode = true;
        this.selectedProducts.clear();
        const batchControls = document.querySelector('.batch-controls');
        if (batchControls) batchControls.style.display = 'flex';
        this.updateBatchButtons();
        this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
        // 更新批量管理按钮文字
        const batchManageBtn = document.getElementById('batch-manage-btn');
        if (batchManageBtn) batchManageBtn.textContent = '退出管理';
    },

    // 退出批量管理模式
    exitBatchMode() {
        this.batchMode = false;
        this.selectedProducts.clear();
        const batchControls = document.querySelector('.batch-controls');
        if (batchControls) batchControls.style.display = 'none';
        this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
        // 更新批量管理按钮文字
        const batchManageBtn = document.getElementById('batch-manage-btn');
        if (batchManageBtn) batchManageBtn.textContent = '批量管理';
    },

    // 更新批量操作按钮状态
    updateBatchButtons() {
        const hasSelection = this.selectedProducts.size > 0;
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        const batchArchiveBtn = document.getElementById('batch-archive-btn');
        const batchChangeCategoryBtn = document.getElementById('batch-change-category-btn');
        
        if (batchDeleteBtn) batchDeleteBtn.disabled = !hasSelection;
        if (batchArchiveBtn) batchArchiveBtn.disabled = !hasSelection;
        if (batchChangeCategoryBtn) batchChangeCategoryBtn.disabled = !hasSelection;
    },

    // 执行批量删除
    batchDelete() {
        if (this.selectedProducts.size === 0) return;
        
        if (confirm(`确定要删除选中的 ${this.selectedProducts.size} 个商品吗？`)) {
            this.selectedProducts.forEach(productId => {
                DataManager.deleteProduct(productId);
            });
            this.selectedProducts.clear();
            this.renderCategories();
            this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
            this.updateBatchButtons();
        }
    },

    // 执行批量归档
    batchArchive() {
        if (this.selectedProducts.size === 0) return;
        
        if (confirm(`确定要归档选中的 ${this.selectedProducts.size} 个商品吗？`)) {
            this.selectedProducts.forEach(productId => {
                DataManager.archiveProduct(productId);
            });
            this.selectedProducts.clear();
            this.renderCategories();
            this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
            this.updateBatchButtons();
        }
    },

    // 执行批量修改分类 - 优化UI
    batchChangeCategory() {
        if (this.selectedProducts.size === 0) return;
        
        const categories = DataManager.getCategories();
        
        // 创建模态框内容
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        
        let categoryListHtml = categories.map((cat, index) => {
            const color = this.morandiColors[index % this.morandiColors.length];
            return `<div class="category-select-item" data-category="${cat}" style="border-left: 4px solid ${color};">${cat}</div>`;
        }).join('');
        
        modalBody.innerHTML = `
            <h2>选择新分类</h2>
            <div class="category-select-list">
                ${categoryListHtml}
            </div>
            <div class="form-actions">
                <button class="btn" id="cancel-batch-change">取消</button>
                <button class="btn" id="confirm-batch-change" disabled>确定</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        let selectedCategory = null;
        
        // 绑定分类选择事件
        modalBody.querySelectorAll('.category-select-item').forEach(item => {
            item.addEventListener('click', () => {
                // 移除其他选中状态
                modalBody.querySelectorAll('.category-select-item').forEach(i => i.classList.remove('selected'));
                // 添加当前选中状态
                item.classList.add('selected');
                selectedCategory = item.dataset.category;
                // 启用确定按钮
                document.getElementById('confirm-batch-change').disabled = false;
            });
        });
        
        // 绑定取消按钮
        document.getElementById('cancel-batch-change').addEventListener('click', () => {
            this.hideModal();
        });
        
        // 绑定确定按钮
        document.getElementById('confirm-batch-change').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedCategory) {
                // 先关闭模态框
                this.hideModal();
                // 保存当前分类（在renderCategories之前）
                const currentCategory = document.querySelector('.category-btn.active')?.dataset.category;
                // 更新商品分类
                this.selectedProducts.forEach(productId => {
                    DataManager.updateProductCategory(productId, selectedCategory);
                });
                this.selectedProducts.clear();
                // 更新分类显示
                this.renderCategories();
                // 退出批量管理模式
                this.batchMode = false;
                const batchControls = document.querySelector('.batch-controls');
                if (batchControls) batchControls.style.display = 'none';
                // 使用保存的分类重新渲染商品
                if (currentCategory) {
                    this.renderProducts(currentCategory);
                }
            }
        });
    },

    // 显示登录模态框
    showLoginModal() {
        console.log('Showing login modal');
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');

        modalBody.innerHTML = `
            <h2>登录</h2>
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" placeholder="请输入密码">
            </div>
            <div class="form-actions">
                <button class="btn" id="cancel-login">取消</button>
                <button class="btn" id="confirm-login">登录</button>
            </div>
        `;

        modal.style.display = 'flex';

        // 聚焦密码输入框
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.focus();
        }

        // 登录验证函数
        const handleLogin = () => {
            const password = document.getElementById('password').value;
            console.log('Confirm login clicked, password:', password);
            // 简单的密码验证（实际项目中应该使用更安全的验证方式）
            if (password === 'daye') {
                DataManager.setLoggedIn(true);
                this.checkLoginStatus();
                this.renderProducts('all');
                this.hideModal();
            } else {
                alert('密码错误');
            }
        };

        // 绑定登录按钮点击事件
        const confirmLoginBtn = document.getElementById('confirm-login');
        if (confirmLoginBtn) {
            confirmLoginBtn.addEventListener('click', handleLogin);
        }

        // 绑定回车键事件
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }

        // 绑定取消按钮点击事件
        const cancelLoginBtn = document.getElementById('cancel-login');
        if (cancelLoginBtn) {
            cancelLoginBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }
    },

    // 显示删除确认模态框
    showDeleteConfirmModal(productId) {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <h2>确认删除</h2>
            <p>确定要删除该商品吗？</p>
            <div class="form-actions">
                <button class="btn" id="cancel-delete">取消</button>
                <button class="btn" id="confirm-delete">删除</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 绑定删除按钮点击事件
        document.getElementById('confirm-delete').addEventListener('click', () => {
            DataManager.deleteProduct(productId);
            this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
            this.renderCategories();
            this.hideModal();
        });
        
        // 绑定取消按钮点击事件
        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 显示归档确认模态框
    showArchiveConfirmModal(productId) {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <h2>确认归档</h2>
            <p>确定要归档该商品吗？</p>
            <div class="form-actions">
                <button class="btn" id="cancel-archive">取消</button>
                <button class="btn" id="confirm-archive">归档</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 绑定归档按钮点击事件
        document.getElementById('confirm-archive').addEventListener('click', () => {
            DataManager.archiveProduct(productId);
            this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
            this.renderCategories();
            this.hideModal();
        });
        
        // 绑定取消按钮点击事件
        document.getElementById('cancel-archive').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 显示还原确认模态框
    showRestoreConfirmModal(productId) {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');

        modalBody.innerHTML = `
            <h2>确认还原</h2>
            <p>确定要还原该商品吗？还原后将恢复到原有分类。</p>
            <div class="form-actions">
                <button class="btn" id="cancel-restore">取消</button>
                <button class="btn" id="confirm-restore">还原</button>
            </div>
        `;

        modal.style.display = 'flex';

        // 绑定还原按钮点击事件
        document.getElementById('confirm-restore').addEventListener('click', () => {
            DataManager.restoreProduct(productId);
            this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
            this.renderCategories();
            this.hideModal();
        });

        // 绑定取消按钮点击事件
        document.getElementById('cancel-restore').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 显示调整分类模态框 - 优化UI
    showChangeCategoryModal(productId) {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        const categories = DataManager.getCategories();
        
        // 获取当前商品
        const products = DataManager.getProducts();
        const product = products.find(p => p.id === productId);
        
        let categoryListHtml = categories.map((cat, index) => {
            const color = this.morandiColors[index % this.morandiColors.length];
            const isSelected = product.category === cat;
            return `<div class="category-select-item ${isSelected ? 'selected' : ''}" data-category="${cat}" style="border-left: 4px solid ${color};">${cat}</div>`;
        }).join('');
        
        modalBody.innerHTML = `
            <h2>调整分类</h2>
            <div class="category-select-list">
                ${categoryListHtml}
            </div>
            <div class="form-actions">
                <button class="btn" id="cancel-change-category">取消</button>
                <button class="btn" id="confirm-change-category">确定</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        let selectedCategory = product.category;
        
        // 绑定分类选择事件
        modalBody.querySelectorAll('.category-select-item').forEach(item => {
            item.addEventListener('click', () => {
                // 移除其他选中状态
                modalBody.querySelectorAll('.category-select-item').forEach(i => i.classList.remove('selected'));
                // 添加当前选中状态
                item.classList.add('selected');
                selectedCategory = item.dataset.category;
            });
        });
        
        // 绑定确定按钮点击事件
        document.getElementById('confirm-change-category').addEventListener('click', () => {
            DataManager.updateProductCategory(productId, selectedCategory);
            this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
            this.renderCategories();
            this.hideModal();
        });
        
        // 绑定取消按钮点击事件
        document.getElementById('cancel-change-category').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 显示编辑分类模态框
    showEditCategoryModal(categoryName) {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <h2>修改分类</h2>
            <div class="form-group">
                <label for="new-category-name">新分类名称</label>
                <input type="text" id="new-category-name" value="${categoryName}" placeholder="请输入新分类名称">
            </div>
            <div class="form-actions">
                <button class="btn" id="cancel-edit-category">取消</button>
                <button class="btn" id="confirm-edit-category">确定</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 绑定确定按钮点击事件
        document.getElementById('confirm-edit-category').addEventListener('click', () => {
            const newName = document.getElementById('new-category-name').value.trim();
            if (newName && newName !== categoryName) {
                // 更新分类名称
                const categories = DataManager.getCategories();
                const index = categories.indexOf(categoryName);
                if (index > -1) {
                    categories[index] = newName;
                    localStorage.setItem('categories', JSON.stringify(categories));
                    
                    // 更新所有商品的分类
                    const products = DataManager.getProducts();
                    products.forEach(product => {
                        if (product.category === categoryName) {
                            product.category = newName;
                        }
                    });
                    localStorage.setItem('products', JSON.stringify(products));
                    
                    this.renderCategories();
                    this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
                    this.renderSidebarCategories();
                }
            }
            this.hideModal();
        });
        
        // 绑定取消按钮点击事件
        document.getElementById('cancel-edit-category').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 显示删除分类模态框
    showDeleteCategoryModal(categoryName) {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <h2>确认删除分类</h2>
            <p>确定要删除分类"${categoryName}"吗？该分类下的商品将被移至"归档"。</p>
            <div class="form-actions">
                <button class="btn" id="cancel-delete-category">取消</button>
                <button class="btn" id="confirm-delete-category">删除</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 绑定删除按钮点击事件
        document.getElementById('confirm-delete-category').addEventListener('click', () => {
            DataManager.deleteCategory(categoryName);
            this.renderCategories();
            this.renderProducts(document.querySelector('.category-btn.active').dataset.category);
            this.renderSidebarCategories();
            this.hideModal();
        });
        
        // 绑定取消按钮点击事件
        document.getElementById('cancel-delete-category').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 隐藏模态框
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'none';
    }
};