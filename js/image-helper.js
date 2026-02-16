// 图片加载辅助模块
const ImageHelper = {
    // 本地 SVG 占位图（无需外部请求）
    getPlaceholderSvg() {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dy='.3em'%3E图片加载失败%3C/text%3E%3C/svg%3E`;
    },

    // 处理图片 URL，如果是 1688 图片则使用代理
    processImageUrl(url) {
        if (!url) return this.getPlaceholderSvg();
        
        // 如果是 1688 图片，尝试使用代理（如果配置了）
        if (url.includes('alicdn.com')) {
            // 可以在这里添加代理逻辑
            // return '/img/1688/' + url.replace('https://cbu01.alicdn.com/', '');
        }
        
        return url;
    },

    // 创建带错误处理的图片 HTML
    createImageHtml(product) {
        const imageUrl = this.processImageUrl(product.image);
        const placeholder = this.getPlaceholderSvg();
        
        return `<img src="${imageUrl}"
                 alt="${product.name || '商品'}"
                 class="product-image"
                 data-url="${product.url || '#'}"
                 onerror="this.onerror=null; this.src='${placeholder}'; this.style.opacity='0.5';">`;
    }
};
