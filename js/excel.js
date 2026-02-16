// Excel导出/导入模块
const ExcelManager = {
    // 导出商品数据为Excel格式
    exportToExcel() {
        DataManager.exportToExcel();
    },

    // 导入Excel数据
    importFromExcel(csvContent) {
        return DataManager.importFromExcel(csvContent);
    }
};
