// 数据管理模块
const DataManager = {
    // 初始化数据
    init() {
        // 检查浏览器缓存（优先使用缓存数据）
        const existingCategories = localStorage.getItem('categories');
        const existingProducts = localStorage.getItem('products');

        if (existingCategories && existingProducts) {
            console.log('使用浏览器缓存数据');
            this.cleanupEmptyCategories();
            return;
        }

        // 首次打开或缓存为空时，使用 initial_data.js 中的数据
        if (typeof INITIAL_DATA !== 'undefined') {
            console.log('首次打开，使用 initial_data.js 中的初始数据');
            console.log('INITIAL_DATA 内容:', INITIAL_DATA);
            localStorage.setItem('categories', JSON.stringify(INITIAL_DATA.categories));
            localStorage.setItem('products', JSON.stringify(INITIAL_DATA.products));
            console.log(`分类数量: ${INITIAL_DATA.categories.length}`);
            console.log(`商品数量: ${INITIAL_DATA.products.length}`);
            this.cleanupEmptyCategories();
            return;
        }

        // 默认数据
        console.log('无可用数据，使用默认示例数据');
        localStorage.setItem('categories', JSON.stringify(['属性A', '属性B', '属性C']));

        const sampleProducts = [
            {
                id: 1,
                name: '示例商品1',
                price: 100,
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sample%20product%201&image_size=square',
                sales: 1000,
                url: 'https://example.com/product1',
                category: '属性A',
                archived: false
            },
            {
                id: 2,
                name: '示例商品2',
                price: 200,
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sample%20product%202&image_size=square',
                sales: 500,
                url: 'https://example.com/product2',
                category: '属性A',
                archived: false
            },
            {
                id: 3,
                name: '示例商品3',
                price: 150,
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sample%20product%203&image_size=square',
                sales: 800,
                url: 'https://example.com/product3',
                category: '属性B',
                archived: false
            },
            {
                id: 4,
                name: '示例商品4',
                price: 300,
                image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sample%20product%204&image_size=square',
                sales: 300,
                url: 'https://example.com/product4',
                category: '属性C',
                archived: false
            }
        ];
        localStorage.setItem('products', JSON.stringify(sampleProducts));

        this.cleanupEmptyCategories();
    },

    // 清理空分类（商品数量为0的分类）
    cleanupEmptyCategories() {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const products = this.getProducts();
        
        const validCategories = categories.filter(category => {
            const count = products.filter(p => p.category === category && !p.archived).length;
            return count > 0;
        });
        
        if (validCategories.length !== categories.length) {
            localStorage.setItem('categories', JSON.stringify(validCategories));
        }
    },

    // 获取分类列表
    getCategories() {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        return categories.sort((a, b) => {
            const countA = this.getProductsByCategory(a).length;
            const countB = this.getProductsByCategory(b).length;
            return countB - countA;
        });
    },

    // 添加分类
    addCategory(categoryName) {
        const categories = this.getCategories();
        if (!categories.includes(categoryName)) {
            categories.push(categoryName);
            localStorage.setItem('categories', JSON.stringify(categories));
            return true;
        }
        return false;
    },

    // 删除分类
    deleteCategory(categoryName) {
        const categories = this.getCategories();
        const updatedCategories = categories.filter(cat => cat !== categoryName);
        if (updatedCategories.length !== categories.length) {
            localStorage.setItem('categories', JSON.stringify(updatedCategories));
            const products = this.getProducts();
            products.forEach(product => {
                if (product.category === categoryName) {
                    product.archived = true;
                }
            });
            localStorage.setItem('products', JSON.stringify(products));
            return true;
        }
        return false;
    },

    // 获取所有商品
    getProducts() {
        return JSON.parse(localStorage.getItem('products') || '[]');
    },

    // 根据分类获取商品
    getProductsByCategory(category) {
        const products = this.getProducts();
        if (category === 'all') {
            return products.filter(p => !p.archived);
        } else if (category === 'archive') {
            return products.filter(p => p.archived);
        } else {
            return products.filter(p => p.category === category && !p.archived);
        }
    },

    // 添加商品
    addProduct(product) {
        const products = this.getProducts();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            id: newId,
            ...product,
            archived: false
        };
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));
        return newProduct;
    },

    // 删除商品
    deleteProduct(productId) {
        const products = this.getProducts();
        const updatedProducts = products.filter(p => p.id !== productId);
        if (updatedProducts.length !== products.length) {
            localStorage.setItem('products', JSON.stringify(updatedProducts));
            this.cleanupEmptyCategories();
            return true;
        }
        return false;
    },

    // 归档商品
    archiveProduct(productId) {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            product.archived = true;
            localStorage.setItem('products', JSON.stringify(products));
            this.cleanupEmptyCategories();
            return true;
        }
        return false;
    },

    // 还原归档商品（取消归档）
    restoreProduct(productId) {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            product.archived = false;
            // 如果商品没有分类或分类不存在，则创建该分类
            if (product.category) {
                const categories = this.getCategories();
                if (!categories.includes(product.category)) {
                    this.addCategory(product.category);
                }
            }
            localStorage.setItem('products', JSON.stringify(products));
            return true;
        }
        return false;
    },

    // 调整商品分类
    updateProductCategory(productId, category) {
        const products = this.getProducts();
        const id = parseInt(productId);
        const product = products.find(p => p.id === id);
        if (product) {
            product.category = category;
            localStorage.setItem('products', JSON.stringify(products));
            return true;
        }
        return false;
    },

    // 导出商品数据为Excel格式
    exportToExcel() {
        const products = this.getProducts();

        const excelData = [
            ['分类', '商品名称', '商品价格', '商品图片', '销量', '商品链接', '是否红心']
        ];

        products.forEach(product => {
            excelData.push([
                product.category,
                product.name,
                product.price,
                product.image,
                product.sales,
                product.url,
                product.favorited ? '是' : '否'
            ]);
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);

        worksheet['!cols'] = [
            { wch: 15 },
            { wch: 30 },
            { wch: 10 },
            { wch: 50 },
            { wch: 10 },
            { wch: 50 },
            { wch: 10 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, '商品数据');
        XLSX.writeFile(workbook, '收藏夹商品.xlsx');
    },

    // 导入Excel数据（覆盖模式）
    importFromExcel(file, mode = 'overwrite') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    const products = [];

                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length === 0) continue;

                        const product = {
                            id: Date.now() + i,
                            category: row[0] || '',
                            name: row[1] || '',
                            price: parseFloat(row[2]) || 0,
                            image: row[3] || '',
                            sales: parseInt(row[4]) || 0,
                            url: row[5] || '',
                            archived: false,
                            favorited: row[6] === '是' || row[6] === true || row[6] === 1
                        };
                        products.push(product);
                    }
                    
                    if (products.length > 0) {
                        if (mode === 'overwrite') {
                            localStorage.setItem('products', JSON.stringify(products));
                            const importedCategories = [...new Set(products.map(p => p.category).filter(c => c))];
                            localStorage.setItem('categories', JSON.stringify(importedCategories));
                        } else {
                            const existingProducts = DataManager.getProducts();
                            const updatedProducts = [...existingProducts, ...products];
                            localStorage.setItem('products', JSON.stringify(updatedProducts));
                            
                            const categories = DataManager.getCategories();
                            products.forEach(product => {
                                if (product.category && !categories.includes(product.category)) {
                                    DataManager.addCategory(product.category);
                                }
                            });
                        }
                        
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (error) {
                    console.error('导入Excel失败:', error);
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    },

    // 检查用户是否登录
    isLoggedIn() {
        return localStorage.getItem('userLoggedIn') === 'true';
    },

    // 设置用户登录状态
    setLoggedIn(status) {
        localStorage.setItem('userLoggedIn', status.toString());
    },

    // 切换商品收藏状态
    toggleFavorite(productId) {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            product.favorited = !product.favorited;
            localStorage.setItem('products', JSON.stringify(products));
            return product.favorited;
        }
        return null;
    },

    // 检查商品是否已收藏
    isFavorited(productId) {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);
        return product ? product.favorited : false;
    },

    // 获取所有收藏的商品
    getFavoritedProducts() {
        const products = this.getProducts();
        return products.filter(p => p.favorited && !p.archived);
    }
};

// 初始化数据
DataManager.init();
