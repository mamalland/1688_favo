// 管理操作模块
const AdminManager = {
    // 初始化
    init() {
        this.bindEvents();
        this.bindTopFunctionBarEvents();
    },

    // 绑定事件
    bindEvents() {
        // 批量操作按钮事件（这些按钮始终存在）
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        const batchArchiveBtn = document.getElementById('batch-archive-btn');
        const batchChangeCategoryBtn = document.getElementById('batch-change-category-btn');
        const cancelBatchBtn = document.getElementById('cancel-batch-btn');
        const deleteAllProductsBtn = document.getElementById('delete-all-products-btn');

        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', () => {
                UIManager.batchDelete();
            });
        }

        if (batchArchiveBtn) {
            batchArchiveBtn.addEventListener('click', () => {
                UIManager.batchArchive();
            });
        }

        if (batchChangeCategoryBtn) {
            batchChangeCategoryBtn.addEventListener('click', () => {
                UIManager.batchChangeCategory();
            });
        }

        if (cancelBatchBtn) {
            cancelBatchBtn.addEventListener('click', () => {
                UIManager.exitBatchMode();
            });
        }

        if (deleteAllProductsBtn) {
            deleteAllProductsBtn.addEventListener('click', () => {
                this.deleteAllProducts();
            });
        }
    },

    // 绑定顶部功能条按钮事件（使用事件委托）
    bindTopFunctionBarEvents() {
        const topFunctionBar = document.querySelector('.top-function-bar');

        if (topFunctionBar) {
            topFunctionBar.addEventListener('click', (e) => {
                const btn = e.target.closest('.function-bubble');
                if (!btn) return;

                const btnId = btn.id;

                switch (btnId) {
                    case 'export-excel-btn':
                        DataManager.exportToExcel();
                        break;
                    case 'import-excel-btn':
                        this.showImportExcelModal();
                        break;
                    case 'add-product-btn':
                        this.showAddProductModal();
                        break;
                    case 'batch-manage-btn':
                        if (UIManager.batchMode) {
                            UIManager.exitBatchMode();
                        } else {
                            UIManager.enterBatchMode();
                        }
                        break;
                    case 'admin-center-btn':
                        UIManager.openSidebar();
                        break;
                }
            });
        }

        // 绑定侧边栏内的增加分类按钮
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.showAddCategoryModal();
            });
        }
    },

    // 显示增加分类模态框
    showAddCategoryModal() {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <h2>增加分类</h2>
            <div class="form-group">
                <label for="category-name">分类名称</label>
                <input type="text" id="category-name" placeholder="请输入分类名称">
            </div>
            <div class="form-actions">
                <button class="btn" id="cancel-add-category">取消</button>
                <button class="btn" id="confirm-add-category">确定</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 绑定确定按钮点击事件
        document.getElementById('confirm-add-category').addEventListener('click', () => {
            const categoryName = document.getElementById('category-name').value.trim();
            if (categoryName) {
                const success = DataManager.addCategory(categoryName);
                if (success) {
                    UIManager.renderCategories();
                    this.hideModal();
                } else {
                    alert('分类已存在');
                }
            } else {
                alert('请输入分类名称');
            }
        });
        
        // 绑定取消按钮点击事件
        document.getElementById('cancel-add-category').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 显示导入Excel模态框
    showImportExcelModal() {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <h2>导入Excel</h2>
            <p>请选择要导入的Excel文件</p>
            <div class="form-group">
                <input type="file" id="excel-file" accept=".xlsx,.xls">
            </div>
            <div class="form-actions">
                <button class="btn" id="cancel-import">取消</button>
                <button class="btn" id="confirm-import">导入</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 绑定导入按钮点击事件
        document.getElementById('confirm-import').addEventListener('click', async () => {
            const fileInput = document.getElementById('excel-file');
            const file = fileInput.files[0];
            
            if (file) {
                try {
                    const success = await DataManager.importFromExcel(file);
                    if (success) {
                        UIManager.renderCategories();
                        UIManager.renderProducts(document.querySelector('.category-btn.active').dataset.category);
                        this.hideModal();
                        alert('导入成功');
                    } else {
                        alert('导入失败：未找到商品数据');
                    }
                } catch (error) {
                    console.error('导入失败:', error);
                    alert('导入失败：' + error.message);
                }
            } else {
                alert('请选择文件');
            }
        });
        
        // 绑定取消按钮点击事件
        document.getElementById('cancel-import').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 显示增加商品模态框
    showAddProductModal() {
        const modal = document.getElementById('modal');
        const modalBody = modal.querySelector('.modal-body');
        const categories = DataManager.getCategories();
        
        modalBody.innerHTML = `
            <h2>增加商品</h2>
            <div class="form-group">
                <label for="product-url">商品链接</label>
                <input type="text" id="product-url" placeholder="请粘贴商品链接">
            </div>
            <div class="form-group">
                <label for="product-name">商品名称</label>
                <input type="text" id="product-name" placeholder="商品名称">
            </div>
            <div class="form-group">
                <label for="product-price">商品价格</label>
                <input type="number" id="product-price" placeholder="商品价格">
            </div>
            <div class="form-group">
                <label for="product-image">商品图片</label>
                <input type="text" id="product-image" placeholder="商品图片链接">
            </div>
            <div class="form-group">
                <label for="product-sales">销量</label>
                <input type="number" id="product-sales" placeholder="销量">
            </div>
            <div class="form-group">
                <label for="product-category">分类</label>
                <select id="product-category">
                    ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
            <div class="form-actions">
                <button class="btn" id="cancel-add-product">取消</button>
                <button class="btn" id="auto-fill">自动填充</button>
                <button class="btn" id="confirm-add-product">确定</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 绑定自动填充按钮点击事件
        document.getElementById('auto-fill').addEventListener('click', async () => {
            const url = document.getElementById('product-url').value.trim();
            if (url) {
                // 使用爬虫自动填充商品信息
                await this.autoFillProductInfo(url);
            } else {
                alert('请输入商品链接');
            }
        });
        
        // 绑定确定按钮点击事件
        document.getElementById('confirm-add-product').addEventListener('click', () => {
            const product = {
                name: document.getElementById('product-name').value.trim(),
                price: parseFloat(document.getElementById('product-price').value),
                image: document.getElementById('product-image').value.trim(),
                sales: parseInt(document.getElementById('product-sales').value),
                url: document.getElementById('product-url').value.trim(),
                category: document.getElementById('product-category').value
            };
            
            // 验证商品信息
            if (product.name && product.price && product.image && product.sales && product.url) {
                DataManager.addProduct(product);
                UIManager.renderProducts(document.querySelector('.category-btn.active').dataset.category);
                UIManager.renderCategories();
                this.hideModal();
            } else {
                alert('请填写完整商品信息');
            }
        });
        
        // 绑定取消按钮点击事件
        document.getElementById('cancel-add-product').addEventListener('click', () => {
            this.hideModal();
        });
    },

    // 自动填充商品信息
    async autoFillProductInfo(url) {
        try {
            // 显示加载状态
            const autoFillBtn = document.getElementById('auto-fill');
            const originalText = autoFillBtn.textContent;
            autoFillBtn.textContent = '爬取中...';
            autoFillBtn.disabled = true;
            
            // 使用ScraperManager爬取商品信息
            const productInfo = await ScraperManager.autoFillProductForm(url);
            
            if (productInfo) {
                alert('自动填充完成！');
            }
        } catch (error) {
            console.error('自动填充失败:', error);
            alert('自动填充失败，请手动填写');
        } finally {
            // 恢复按钮状态
            const autoFillBtn = document.getElementById('auto-fill');
            autoFillBtn.textContent = '自动填充';
            autoFillBtn.disabled = false;
        }
    },

    // 一键删除所有商品
    deleteAllProducts() {
        const products = DataManager.getProducts();
        if (products.length === 0) {
            alert('当前没有商品');
            return;
        }
        
        if (confirm(`确定要删除所有 ${products.length} 个商品吗？此操作不可恢复！`)) {
            localStorage.setItem('products', JSON.stringify([]));
            UIManager.renderCategories();
            UIManager.renderProducts(document.querySelector('.category-btn.active').dataset.category);
            UIManager.renderSidebarCategories();
            alert('所有商品已删除');
        }
    },

    // 隐藏模态框
    hideModal() {
        document.getElementById('modal').style.display = 'none';
    }
};