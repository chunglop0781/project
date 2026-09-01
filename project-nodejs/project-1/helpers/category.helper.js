// helpers/category.helper.js

/**
 * Xây dựng cây danh mục từ danh sách phẳng
 */
function buildCategoryTree(categories, parentId = null) {
    const tree = [];
    categories.forEach(item => {
        const itemParent = item.parent ? item.parent.toString() : null;
        const compareParent = parentId ? parentId.toString() : null;
        if (itemParent === compareParent) {
            const children = buildCategoryTree(categories, item.id);
            tree.push({
                id: item.id,
                name: item.name,
                children: children
            });
        }
    });
    return tree;
}

/**
 * Tạo danh sách options cho select (có indent theo cấp)
 */
function buildCategoryOptions(categories, parentId = null, level = 0, prefix = '') {
    let options = [];
    categories.forEach(item => {
        const itemParent = item.parent ? item.parent.toString() : null;
        const compareParent = parentId ? parentId.toString() : null;
        if (itemParent === compareParent) {
            const indent = prefix + (level > 0 ? '── ' : '');
            options.push({
                value: item.id,
                label: indent + item.name
            });
            const children = buildCategoryOptions(categories, item.id, level + 1, indent + '   ');
            options = options.concat(children);
        }
    });
    return options;
}

/**
 * Lấy tất cả ID con cháu của một danh mục (bao gồm chính nó)
 */
function getAllDescendantIds(categories, parentId, excludeId = null) {
    const ids = new Set();
    if (excludeId) ids.add(excludeId.toString());
    const stack = [parentId];
    while (stack.length) {
        const currentId = stack.pop();
        categories.forEach(item => {
            const itemParent = item.parent ? item.parent.toString() : null;
            if (itemParent === currentId.toString()) {
                const idStr = item.id.toString();
                if (!ids.has(idStr)) {
                    ids.add(idStr);
                    stack.push(item.id);
                }
            }
        });
    }
    return ids;
}

/**
 * Lấy danh sách danh mục cha (loại bỏ chính nó và các con nếu có excludeId)
 */
function getParentOptions(categories, excludeId = null, parentId = null, level = 0, prefix = '', excludeIds = null) {
    // Nếu chưa có excludeIds, tạo từ excludeId
    if (excludeIds === null && excludeId !== null) {
        excludeIds = getAllDescendantIds(categories, excludeId, excludeId);
    }
    let options = [];
    categories.forEach(item => {
        const itemId = item.id.toString();
        // Bỏ qua nếu nằm trong danh sách cần loại trừ
        if (excludeIds && excludeIds.has(itemId)) {
            return;
        }
        const itemParent = item.parent ? item.parent.toString() : null;
        const compareParent = parentId ? parentId.toString() : null;
        if (itemParent === compareParent) {
            const indent = prefix + (level > 0 ? '── ' : '');
            options.push({
                value: item.id,
                label: indent + item.name
            });
            const children = getParentOptions(categories, excludeId, item.id, level + 1, indent + '   ', excludeIds);
            options = options.concat(children);
        }
    });
    return options;
}

module.exports = {
    buildCategoryTree,
    buildCategoryOptions,
    getParentOptions
};