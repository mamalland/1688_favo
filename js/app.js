// 主应用模块
const App = {
    // 初始化应用
    async init() {
        // 初始化数据（异步，优先加载Excel文件）
        await DataManager.init();
        
        // 初始化UI
        UIManager.init();
        
        // 初始化管理功能
        AdminManager.init();
        
        console.log('应用初始化完成');
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
