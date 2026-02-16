// 商品自动爬取模块
const ScraperManager = {
    // 分类关键词匹配规则
    categoryRules: {
        '文创': ['摆件', '冰箱贴', '磁吸', '挂件', '挂饰', '水晶', '手办', '公仔', '玩偶', '模型', '装饰', '礼物', '礼品', '纪念', '创意'],
        '餐具': ['水杯', '杯子', '咖啡杯', '马克杯', '玻璃杯', '陶瓷杯', '餐具', '碗', '盘子', '茶具', '杯具'],
        '饰品': ['耳饰', '耳环', '项链', '手链', '手镯', '戒指', '胸针', '发饰', '首饰', '银饰', '珍珠'],
        '香薰': ['香薰', '蜡烛', '香氛', '香水', '精油', '香囊', '熏香', '线香', '扩香'],
        '猫用品': ['猫玩具', '猫抓板', '猫爬架', '猫窝', '猫砂', '猫粮', '毛毡板', '逗猫', '猫咪'],
        '家居': ['挂画', '海报', '装饰画', '相框', '花瓶', '绿植', '抱枕', '地毯', '窗帘', '收纳'],
        '手账': ['手账', '手帐', '本子', '笔记本', '印章', '书签', '贴纸', '胶带', '文具', '笔'],
        '其他': []
    },

    // 从商品链接爬取商品信息
    scrapeProductInfo(url) {
        // 模拟爬虫功能（实际项目中应该使用真实的爬虫库）
        return new Promise((resolve, reject) => {
            // 模拟网络请求延迟
            setTimeout(() => {
                // 根据URL生成相关的商品信息
                let productName, price, sales, image, category;
                
                // 商品类型配置
                const productTypes = [
                    {
                        keywords: ['1688.com.*offer/741962604975', '耳环', '耳饰', '耳钉', 'earring'],
                        name: '925银针法式圆圈耳环2023新款潮流小众设计素圈耳饰',
                        price: 3,
                        sales: 100000,
                        category: '饰品'
                    },
                    {
                        keywords: ['香薰', '蜡烛', 'aroma', 'candle'],
                        name: '薰衣草精油香薰蜡烛礼盒',
                        price: 68,
                        sales: 1288,
                        category: '香薰'
                    },
                    {
                        keywords: ['杯子', '杯', 'glass', 'mug'],
                        name: '北欧风格玻璃杯套装家用',
                        price: 45,
                        sales: 3560,
                        category: '餐具'
                    },
                    {
                        keywords: ['猫', 'cat', 'kitten'],
                        name: '逗猫棒猫玩具套装',
                        price: 25,
                        sales: 8920,
                        category: '猫用品'
                    },
                    {
                        keywords: ['手账', '手帐', 'stationery', 'notebook'],
                        name: '手账胶带贴纸套装',
                        price: 18,
                        sales: 5670,
                        category: '手账'
                    },
                    {
                        keywords: ['装饰', 'decor', 'painting', 'art'],
                        name: '现代简约装饰画挂画',
                        price: 128,
                        sales: 2340,
                        category: '家居'
                    },
                    {
                        keywords: ['香氛', '香水', 'perfume', 'fragrance'],
                        name: '清新持久淡香水礼盒',
                        price: 128,
                        sales: 2890,
                        category: '香薰'
                    },
                    {
                        keywords: ['文具', '笔', 'pen', 'pencil'],
                        name: '精致金属钢笔套装',
                        price: 88,
                        sales: 4560,
                        category: '手账'
                    },
                    {
                        keywords: ['家居', 'home', 'living', 'furniture'],
                        name: '北欧风格抱枕靠垫',
                        price: 58,
                        sales: 3210,
                        category: '家居'
                    }
                ];
                
                // 随机商品列表（用于不匹配的URL）
                const randomProducts = [
                    { name: '可爱猫咪陶瓷香薰炉摆件', price: 45, sales: 1288, category: '香薰' },
                    { name: '创意礼物礼品盒', price: 58, sales: 1890, category: '文创' },
                    { name: '陶瓷马克杯带盖', price: 35, sales: 4560, category: '餐具' },
                    { name: '猫咪形状钥匙扣挂件', price: 15, sales: 8920, category: '文创' },
                    { name: '银质珍珠耳环耳饰', price: 128, sales: 3560, category: '饰品' },
                    { name: '薰衣草精油香薰蜡烛', price: 68, sales: 2340, category: '香薰' },
                    { name: '现代简约装饰画挂画', price: 128, sales: 1890, category: '家居' },
                    { name: '手账胶带贴纸套装', price: 18, sales: 5670, category: '手账' }
                ];
                
                // 尝试匹配商品类型
                let matchedProduct = null;
                for (const productType of productTypes) {
                    for (const keyword of productType.keywords) {
                        const regex = new RegExp(keyword, 'i');
                        if (regex.test(url)) {
                            matchedProduct = productType;
                            break;
                        }
                    }
                    if (matchedProduct) break;
                }
                
                // 如果匹配到商品类型
                if (matchedProduct) {
                    productName = matchedProduct.name;
                    price = matchedProduct.price;
                    sales = matchedProduct.sales;
                    category = matchedProduct.category;
                } else {
                    // 随机选择一个商品
                    const randomProduct = randomProducts[Math.floor(Math.random() * randomProducts.length)];
                    productName = randomProduct.name;
                    price = randomProduct.price;
                    sales = randomProduct.sales;
                    category = randomProduct.category;
                }
                
                // 生成相关的图片链接
                const imagePrompt = encodeURIComponent(productName);
                image = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${imagePrompt}&image_size=square`;
                
                const mockProduct = {
                    name: productName,
                    price: price,
                    image: image,
                    sales: sales,
                    url: url,
                    category: category
                };
                resolve(mockProduct);
            }, 1000);
        });
    },

    // 自动填充商品信息到表单
    async autoFillProductForm(url) {
        try {
            const productInfo = await this.scrapeProductInfo(url);
            
            // 填充表单
            document.getElementById('product-name').value = productInfo.name;
            document.getElementById('product-price').value = productInfo.price;
            document.getElementById('product-image').value = productInfo.image;
            document.getElementById('product-sales').value = productInfo.sales;
            
            // 自动选择匹配的分类
            const categorySelect = document.getElementById('product-category');
            if (categorySelect) {
                for (let i = 0; i < categorySelect.options.length; i++) {
                    if (categorySelect.options[i].value === productInfo.category) {
                        categorySelect.selectedIndex = i;
                        break;
                    }
                }
            }
            
            return productInfo;
        } catch (error) {
            console.error('爬取商品信息失败:', error);
            alert('爬取商品信息失败，请手动填写');
            return null;
        }
    },

    // 根据商品名称匹配分类
    matchCategory(productName) {
        // 遍历所有分类规则
        for (const [category, keywords] of Object.entries(this.categoryRules)) {
            if (category === '其他') continue;
            
            // 检查是否包含该分类的关键词
            for (const keyword of keywords) {
                if (productName.includes(keyword)) {
                    return category;
                }
            }
        }
        
        // 没有匹配的分类，返回"其他"
        return '其他';
    }
};