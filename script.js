// 模拟数据库 - 使用 localStorage 作为数据存储
class Database {
    constructor() {
        this.key = 'random-order-menu';
        this.init();
    }

    init() {
        // 初始化默认菜单数据
        if (!this.getMenu().length) {
            const defaultMenu = [
                "宫保鸡丁",
                "麻婆豆腐", 
                "水煮鱼",
                "回锅肉",
                "鱼香肉丝",
                "糖醋里脊",
                "清炒时蔬",
                "酸辣汤",
                "红烧肉",
                "京酱肉丝"
            ];
            this.saveMenu(defaultMenu);
        }
    }

    getMenu() {
        const menu = localStorage.getItem(this.key);
        return menu ? JSON.parse(menu) : [];
    }

    saveMenu(menu) {
        localStorage.setItem(this.key, JSON.stringify(menu));
    }

    addDish(dishName) {
        const menu = this.getMenu();
        if (!menu.includes(dishName)) {
            menu.push(dishName);
            this.saveMenu(menu);
            return true;
        }
        return false;
    }

    deleteDish(dishName) {
        const menu = this.getMenu();
        const updatedMenu = menu.filter(dish => dish !== dishName);
        this.saveMenu(updatedMenu);
    }

    updateDish(oldName, newName) {
        const menu = this.getMenu();
        const index = menu.indexOf(oldName);
        if (index !== -1 && !menu.includes(newName)) {
            menu[index] = newName;
            this.saveMenu(menu);
            return true;
        }
        return false;
    }
}

// 初始化数据库和全局变量
const db = new Database();
let currentEditDish = '';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadMenu();
    setupEventListeners();
});

function setupEventListeners() {
    // 模态框关闭事件
    const modal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // 回车键添加菜品
    document.getElementById('dishName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addDish();
        }
    });
}

// 加载菜单列表
function loadMenu() {
    const menuList = document.getElementById('menuList');
    const menu = db.getMenu();
    
    if (menu.length === 0) {
        menuList.innerHTML = '<div class="empty-state">菜单为空，请添加菜品</div>';
        return;
    }

    menuList.innerHTML = menu.map(dish => `
        <div class="dish-item">
            <div class="dish-info">${dish}</div>
            <div class="dish-actions">
                <button class="edit-btn" onclick="openEditModal('${dish}')">编辑</button>
                <button class="delete-btn" onclick="deleteDish('${dish}')">删除</button>
            </div>
        </div>
    `).join('');
}

// 添加菜品
function addDish() {
    const dishInput = document.getElementById('dishName');
    const dishName = dishInput.value.trim();

    if (!dishName) {
        alert('请输入菜品名称');
        return;
    }

    if (db.addDish(dishName)) {
        dishInput.value = '';
        loadMenu();
        showNotification('菜品添加成功！');
    } else {
        alert('该菜品已存在！');
    }
}

// 删除菜品
function deleteDish(dishName) {
    if (confirm(`确定要删除"${dishName}"吗？`)) {
        db.deleteDish(dishName);
        loadMenu();
        showNotification('菜品删除成功！');
    }
}

// 打开编辑模态框
function openEditModal(dishName) {
    currentEditDish = dishName;
    document.getElementById('editDishName').value = dishName;
    document.getElementById('editModal').style.display = 'block';
}

// 更新菜品
function updateDish() {
    const newName = document.getElementById('editDishName').value.trim();
    
    if (!newName) {
        alert('请输入菜品名称');
        return;
    }

    if (db.updateDish(currentEditDish, newName)) {
        document.getElementById('editModal').style.display = 'none';
        loadMenu();
        showNotification('菜品更新成功！');
    } else {
        alert('菜品名称已存在或未更改！');
    }
}

// 随机点单
function randomOrder() {
    const menu = db.getMenu();
    const countInput = document.getElementById('dishCount');
    let count = parseInt(countInput.value);

    if (menu.length === 0) {
        alert('菜单为空，请先添加菜品');
        return;
    }

    if (isNaN(count) || count < 1) {
        count = 1;
        countInput.value = 1;
    }

    if (count > menu.length) {
        alert(`菜单中只有 ${menu.length} 道菜，无法选择 ${count} 道`);
        count = menu.length;
        countInput.value = count;
    }

    // 随机选择菜品
    const shuffled = [...menu].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    // 显示结果
    displayResults(selected);
}

// 显示随机结果
function displayResults(selectedDishes) {
    const resultSection = document.getElementById('resultSection');
    const selectedDishesContainer = document.getElementById('selectedDishes');

    selectedDishesContainer.innerHTML = selectedDishes.map(dish => `
        <div class="selected-dish">${dish}</div>
    `).join('');

    resultSection.style.display = 'block';
    
    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// 显示通知
function showNotification(message) {
    // 简单的通知实现
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00b894;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
