// 数据库类 - 使用JSON文件作为存储
class JsonDatabase {
    constructor() {
        this.dbFile = 'menu-data.json';
        this.cache = null;
        this.cacheTime = null;
        this.cacheTimeout = 5000; // 5秒缓存
    }

    // 获取菜单数据
    async getMenu() {
        // 检查缓存
        if (this.cache && this.cacheTime && (Date.now() - this.cacheTime) < this.cacheTimeout) {
            return [...this.cache];
        }

        try {
            const response = await fetch(this.dbFile);
            if (!response.ok) {
                throw new Error('Failed to fetch menu data');
            }
            const data = await response.json();
            this.cache = data.menu || [];
            this.cacheTime = Date.now();
            return [...this.cache];
        } catch (error) {
            console.error('Error loading menu:', error);
            // 如果文件不存在，返回空数组
            return [];
        }
    }

    // 保存菜单数据（模拟保存，实际需要服务器支持）
    async saveMenu(menu) {
        // 由于GitHub Pages是静态的，我们不能直接写入文件
        // 这里使用localStorage作为临时存储，并提示用户手动更新JSON文件
        this.cache = [...menu];
        this.cacheTime = Date.now();
        
        // 保存到localStorage作为备份
        localStorage.setItem('menu-backup', JSON.stringify(menu));
        
        // 生成下载链接，让用户手动更新JSON文件
        this.generateDownloadLink(menu);
        
        return true;
    }

    // 生成下载链接，让用户手动更新数据库文件
    generateDownloadLink(menu) {
        const data = {
            menu: menu,
            lastUpdated: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const downloadLink = document.getElementById('downloadLink') || document.createElement('a');
        downloadLink.id = 'downloadLink';
        downloadLink.href = url;
        downloadLink.download = 'menu-data.json';
        downloadLink.textContent = '📥 下载更新后的菜单文件';
        downloadLink.style.cssText = `
            display: block;
            margin: 10px 0;
            padding: 10px;
            background: #00b894;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
        `;
        
        // 添加到页面
        const container = document.querySelector('.menu-section');
        if (!document.getElementById('downloadLink')) {
            container.appendChild(downloadLink);
        }
        
        // 显示提示信息
        this.showUpdateInstructions();
    }

    // 显示更新说明
    showUpdateInstructions() {
        const existingInstructions = document.getElementById('updateInstructions');
        if (existingInstructions) return;

        const instructions = document.createElement('div');
        instructions.id = 'updateInstructions';
        instructions.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4>📋 如何更新菜单数据库：</h4>
                <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>点击上面的链接下载更新后的菜单文件</li>
                    <li>用下载的文件替换项目中的 <code>menu-data.json</code> 文件</li>
                    <li>将更改提交到GitHub仓库</li>
                    <li>等待GitHub Pages重新部署（通常需要几分钟）</li>
                </ol>
                <p><small>💡 提示：在此期间，更改会保存在浏览器本地存储中</small></p>
            </div>
        `;
        
        const container = document.querySelector('.menu-section');
        const downloadLink = document.getElementById('downloadLink');
        container.insertBefore(instructions, downloadLink.nextSibling);
    }

    // 从localStorage恢复数据
    getLocalMenu() {
        try {
            const localMenu = localStorage.getItem('menu-backup');
            return localMenu ? JSON.parse(localMenu) : null;
        } catch (error) {
            return null;
        }
    }

    // 检查是否有本地更改
    hasLocalChanges() {
        return localStorage.getItem('menu-backup') !== null;
    }
}

// 初始化数据库
const db = new JsonDatabase();
let currentEditDish = '';
let currentMenu = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    await loadMenu();
    setupEventListeners();
    checkLocalChanges();
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

    // 同步数据按钮
    document.getElementById('syncData')?.addEventListener('click', syncData);
}

// 检查本地更改
async function checkLocalChanges() {
    const localMenu = db.getLocalMenu();
    if (localMenu) {
        const serverMenu = await db.getMenu();
        
        // 如果本地数据和服务器数据不同，显示同步提示
        if (JSON.stringify(localMenu) !== JSON.stringify(serverMenu)) {
            showSyncNotification();
        }
    }
}

// 显示同步通知
function showSyncNotification() {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <p>🔄 检测到本地菜单更改，是否同步到数据库？</p>
            <button onclick="syncData()" style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 5px; margin-right: 10px;">同步数据</button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 5px;">忽略</button>
        </div>
    `;
    
    const container = document.querySelector('.menu-section');
    container.insertBefore(notification, container.firstChild);
}

// 同步数据
async function syncData() {
    const localMenu = db.getLocalMenu();
    if (localMenu) {
        currentMenu = localMenu;
        await db.saveMenu(localMenu);
        showNotification('数据已准备同步！请下载文件并更新仓库。');
        loadMenu();
    }
}

// 加载菜单列表
async function loadMenu() {
    const menuList = document.getElementById('menuList');
    
    try {
        // 优先使用本地更改，如果没有则从服务器加载
        const localMenu = db.getLocalMenu();
        if (localMenu) {
            currentMenu = localMenu;
        } else {
            currentMenu = await db.getMenu();
        }
        
        displayMenuList(currentMenu);
        
    } catch (error) {
        console.error('Error loading menu:', error);
        menuList.innerHTML = `
            <div class="error-state">
                <p>❌ 加载菜单失败</p>
                <p><small>${error.message}</small></p>
            </div>
        `;
    }
}

// 显示菜单列表
function displayMenuList(menu) {
    const menuList = document.getElementById('menuList');
    
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

    // 显示数据来源提示
    showDataSourceHint();
}

// 显示数据来源提示
function showDataSourceHint() {
    const existingHint = document.getElementById('dataSourceHint');
    if (existingHint) return;

    const hint = document.createElement('div');
    hint.id = 'dataSourceHint';
    hint.innerHTML = `
        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 12px; color: #666;">
            ${db.hasLocalChanges() ? '🔄 使用本地修改的数据' : '🌐 使用服务器数据'}
            ${db.hasLocalChanges() ? ' - <a href="javascript:void(0)" onclick="resetLocalData()">恢复服务器数据</a>' : ''}
        </div>
    `;
    
    const container = document.querySelector('.menu-section');
    const menuList = document.getElementById('menuList');
    container.insertBefore(hint, menuList);
}

// 恢复服务器数据
async function resetLocalData() {
    if (confirm('确定要放弃本地更改并恢复服务器数据吗？')) {
        localStorage.removeItem('menu-backup');
        await loadMenu();
        showNotification('已恢复服务器数据');
    }
}

// 添加菜品
async function addDish() {
    const dishInput = document.getElementById('dishName');
    const dishName = dishInput.value.trim();

    if (!dishName) {
        alert('请输入菜品名称');
        return;
    }

    if (currentMenu.includes(dishName)) {
        alert('该菜品已存在！');
        return;
    }

    currentMenu.push(dishName);
    await db.saveMenu(currentMenu);
    dishInput.value = '';
    loadMenu();
    showNotification('菜品添加成功！');
}

// 删除菜品
async function deleteDish(dishName) {
    if (confirm(`确定要删除"${dishName}"吗？`)) {
        currentMenu = currentMenu.filter(dish => dish !== dishName);
        await db.saveMenu(currentMenu);
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
async function updateDish() {
    const newName = document.getElementById('editDishName').value.trim();
    
    if (!newName) {
        alert('请输入菜品名称');
        return;
    }

    if (newName === currentEditDish) {
        document.getElementById('editModal').style.display = 'none';
        return;
    }

    if (currentMenu.includes(newName)) {
        alert('菜品名称已存在！');
        return;
    }

    const index = currentMenu.indexOf(currentEditDish);
    if (index !== -1) {
        currentMenu[index] = newName;
        await db.saveMenu(currentMenu);
        document.getElementById('editModal').style.display = 'none';
        loadMenu();
        showNotification('菜品更新成功！');
    }
}

// 随机点单
function randomOrder() {
    if (currentMenu.length === 0) {
        alert('菜单为空，请先添加菜品');
        return;
    }

    const countInput = document.getElementById('dishCount');
    let count = parseInt(countInput.value);

    if (isNaN(count) || count < 1) {
        count = 1;
        countInput.value = 1;
    }

    if (count > currentMenu.length) {
        alert(`菜单中只有 ${currentMenu.length} 道菜，无法选择 ${count} 道`);
        count = currentMenu.length;
        countInput.value = count;
    }

    // 随机选择菜品
    const shuffled = [...currentMenu].sort(() => 0.5 - Math.random());
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
    
    .error-state {
        text-align: center;
        padding: 20px;
        color: #e74c3c;
    }
    
    .empty-state {
        text-align: center;
        padding: 20px;
        color: #7f8c8d;
    }
`;
document.head.appendChild(style);
