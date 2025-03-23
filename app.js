// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const loginTime = localStorage.getItem("loginTime");
    const path = window.location.pathname;

    if (!path.includes("index.html") && (!loggedInUser || !loginTime)) {
        window.location.href = "index.html";
    } else if (loggedInUser && loginTime) {
        const timeElapsed = Date.now() - parseInt(loginTime);
        const twelveHours = 12 * 60 * 60 * 1000;
        if (timeElapsed >= twelveHours) {
            logout();
        } else {
            if (document.getElementById("user")) document.getElementById("user").textContent = loggedInUser;
            startTimer(twelveHours - timeElapsed);
            setupNavigation();
            setupSidebarToggle();
            if (path.includes("dashboard.html")) {
                loadTables();
                loadMenu();
                setupInputs();
            } else if (path.includes("tables.html")) {
                loadTables();
                setupTableManagement();
            } else if (path.includes("waiters.html")) {
                loadWaiters();
            } else if (path.includes("menu.html")) {
                loadMenu();
                setupMenuForm();
            } else if (path.includes("reports.html")) {
                loadReports();
            }
        }
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            if (username === "admin" && password === "password123") {
                localStorage.setItem("loggedInUser", username);
                localStorage.setItem("loginTime", Date.now());
                window.location.href = "dashboard.html";
            } else {
                document.getElementById("error").textContent = "Invalid credentials!";
            }
        });
    }
});

// Logout
const logoutBtns = document.querySelectorAll("#logoutBtn");
logoutBtns.forEach(btn => btn.addEventListener("click", logout));

function logout() {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loginTime");
    window.location.href = "index.html";
}

// Timer
function startTimer(remainingTime) {
    const timerDisplay = document.getElementById("timer");
    if (!timerDisplay) return;
    let timeLeft = remainingTime;
    const interval = setInterval(() => {
        timeLeft -= 1000;
        if (timeLeft <= 0) {
            clearInterval(interval);
            logout();
        } else {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            timerDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

// Navigation Setup
function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";

    navItems.forEach(item => {
        item.classList.remove("active");
        const href = item.getAttribute("href") || item.getAttribute("onclick");
        if (href && (href.includes(currentPath) || (currentPath === "dashboard.html" && href.includes("dashboard.html")))) {
            item.classList.add("active");
        }

        item.addEventListener("click", (e) => {
            if (item.id !== "logoutBtn") {
                navItems.forEach(nav => nav.classList.remove("active"));
                item.classList.add("active");
            }
        });
    });
}

// Sidebar Toggle
function setupSidebarToggle() {
    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("hidden");
        });
    }
}

// Table Management
let tables = JSON.parse(localStorage.getItem("tables")) || [];
let currentTable = null;

function loadTables() {
    const tableGrid = document.getElementById("tableGrid");
    const tableList = document.getElementById("tableList");
    tables = JSON.parse(localStorage.getItem("tables")) || [];

    if (tableGrid) {
        if (tables.length === 0) {
            tableGrid.innerHTML = `<p>No tables available. Set up tables in tables.html</p>`;
        } else {
            tableGrid.innerHTML = tables
                .map(table => `
                    <div class="table-item ${currentTable === table.name ? 'selected' : ''}" 
                         onclick="selectTable('${table.name}')">
                        <span class="table-icon ${getTableStatus(table.name) === 'occupied' ? 'occupied' : 'free'}">
                            <i class="fas fa-utensils"></i>
                        </span>
                        <span class="table-name">${table.name}</span>
                    </div>`)
                .join("");
            filterTables(document.getElementById("tableInput")?.value || "");
        }
    }

    if (tableList) {
        if (tables.length === 0) {
            tableList.innerHTML = `<p>No tables available. Generate tables below.</p>`;
        } else {
            tableList.innerHTML = tables
                .map((table, index) => `
                    <div class="table-item-row">
                        <span>${table.name} (${table.type})</span>
                        <button class="btn btn-small btn-primary" onclick="editTable(${index})">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="deleteTable(${index})">Delete</button>
                    </div>`)
                .join("");
        }
    }
}

function getTableStatus(tableName) {
    const order = JSON.parse(localStorage.getItem(`order_${tableName}`)) || [];
    return order.length > 0 ? "occupied" : "free";
}

function selectTable(tableName) {
    currentTable = tableName;
    const table = tables.find(t => t.name === tableName);
    const currentTableInfo = document.getElementById("currentTableInfo");
    const itemInput = document.getElementById("itemInput");

    if (currentTableInfo) {
        currentTableInfo.innerHTML = table ? `
            <p><strong>Table:</strong> ${table.name} (${table.type})</p>
            <p><strong>Status:</strong> ${getTableStatus(table.name) === "occupied" ? "Occupied" : "Free"}</p>
        ` : "";
    }
    loadOrder(tableName);
    if (itemInput) itemInput.focus();
    loadTables();
}

function filterTables(query) {
    const tableGrid = document.getElementById("tableGrid");
    if (tableGrid && tables.length > 0) {
        const filteredTables = tables.filter(table =>
            table.name.toLowerCase().includes(query.toLowerCase())
        );
        tableGrid.innerHTML = filteredTables.length > 0 ? filteredTables
            .map(table => `
                <div class="table-item ${currentTable === table.name ? 'selected' : ''}" 
                     onclick="selectTable('${table.name}')">
                    <span class="table-icon ${getTableStatus(table.name) === 'occupied' ? 'occupied' : 'free'}">
                        <i class="fas fa-utensils"></i>
                    </span>
                    <span class="table-name">${table.name}</span>
                </div>`)
            .join("") : `<p>No matching tables</p>`;
    }
}

function setupTableManagement() {
    const generateTablesBtn = document.getElementById("generateTables");
    const tableCount = document.getElementById("tableCount");

    if (generateTablesBtn) {
        generateTablesBtn.addEventListener("click", () => {
            const count = parseInt(tableCount.value) || 0;
            if (count > 0) {
                tables = [];
                for (let i = 1; i <= count; i++) {
                    tables.push({ name: `Table ${i}`, type: "Regular" });
                }
                localStorage.setItem("tables", JSON.stringify(tables));
                loadTables();
                tableCount.value = "";
            } else {
                alert("Please enter a valid number of tables!");
            }
        });
    }
}

function editTable(index) {
    const table = tables[index];
    const tableList = document.getElementById("tableList");
    if (tableList) {
        tableList.innerHTML = `
            <div class="table-edit form-grid">
                <input type="text" id="editTableName" value="${table.name}" required>
                <input type="text" id="editTableType" value="${table.type}" required>
                <button onclick="saveTableEdit(${index})" class="btn btn-success">Save</button>
                <button onclick="loadTables()" class="btn btn-secondary">Cancel</button>
            </div>`;
    }
}

function saveTableEdit(index) {
    const newName = document.getElementById("editTableName").value;
    const newType = document.getElementById("editTableType").value;
    tables[index] = { name: newName, type: newType };
    localStorage.setItem("tables", JSON.stringify(tables));
    loadTables();
}

function deleteTable(index) {
    if (confirm("Are you sure you want to delete this table?")) {
        tables.splice(index, 1);
        localStorage.setItem("tables", JSON.stringify(tables));
        loadTables();
    }
}

// Menu System
let menu = JSON.parse(localStorage.getItem("menu")) || [];

function loadMenu() {
    menu = JSON.parse(localStorage.getItem("menu")) || [];
    const menuList = document.getElementById("menuList");
    if (menuList) {
        menuList.innerHTML = menu
            .map((m, index) => `
                <div class="menu-item">
                    ${m.code} - ${m.name} - $${m.price.toFixed(2)}
                    <button onclick="editMenuItem(${index})" class="btn btn-small btn-primary">Edit</button>
                    <button onclick="deleteMenuItem(${index})" class="btn btn-small btn-danger">Delete</button>
                </div>`)
            .join("");
    }
}

function setupMenuForm() {
    const menuForm = document.getElementById("menuForm");
    const importExcelBtn = document.getElementById("importExcel");
    const excelFileInput = document.getElementById("excelFile");
    const downloadDemoExcelBtn = document.getElementById("downloadDemoExcel");

    if (menuForm) {
        menuForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const item = {
                code: document.getElementById("itemCode").value,
                name: document.getElementById("itemNameMenu").value,
                price: parseFloat(document.getElementById("itemPriceMenu").value)
            };
            menu.push(item);
            localStorage.setItem("menu", JSON.stringify(menu));
            loadMenu();
            menuForm.reset();
        });
    }

    if (importExcelBtn && excelFileInput) {
        importExcelBtn.addEventListener("click", () => {
            const file = excelFileInput.files[0];
            if (!file) {
                alert("Please select an Excel file to import!");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                const importedMenu = jsonData.map(row => ({
                    code: String(row.ItemCode || row.code || ""),
                    name: String(row.ItemName || row.name || ""),
                    price: parseFloat(row.Price || row.price) || 0
                })).filter(item => item.code && item.name && item.price > 0);

                if (importedMenu.length === 0) {
                    alert("No valid menu items found in the Excel file! Ensure it has ItemCode, ItemName, and Price columns.");
                    return;
                }

                const existingCodes = new Set(menu.map(item => item.code));
                const newItems = importedMenu.filter(item => !existingCodes.has(item.code));
                menu = [...menu, ...newItems];
                localStorage.setItem("menu", JSON.stringify(menu));
                loadMenu();
                alert(`Successfully imported ${newItems.length} new menu items!`);
                excelFileInput.value = "";
            };
            reader.readAsArrayBuffer(file);
        });
    }

    if (downloadDemoExcelBtn) {
        downloadDemoExcelBtn.addEventListener("click", () => {
            const demoData = [
                { ItemCode: "B001", ItemName: "Burger", Price: 5.99 },
                { ItemCode: "D002", ItemName: "Drink", Price: 1.99 },
                { ItemCode: "S003", ItemName: "Salad", Price: 3.49 }
            ];

            const ws = XLSX.utils.json_to_sheet(demoData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Menu Demo");
            XLSX.writeFile(wb, "menu_demo.xlsx");
        });
    }
}

function editMenuItem(index) {
    const item = menu[index];
    const menuList = document.getElementById("menuList");
    if (menuList) {
        menuList.innerHTML = `
            <div class="menu-edit form-grid">
                <input type="text" id="editItemCode" value="${item.code}" required>
                <input type="text" id="editItemName" value="${item.name}" required>
                <input type="number" id="editItemPrice" value="${item.price}" step="0.01" required>
                <button onclick="saveMenuEdit(${index})" class="btn btn-success">Save</button>
            </div>`;
    }
}

function saveMenuEdit(index) {
    const newCode = document.getElementById("editItemCode").value;
    const newName = document.getElementById("editItemName").value;
    const newPrice = parseFloat(document.getElementById("editItemPrice").value);
    menu[index] = { code: newCode, name: newName, price: newPrice };
    localStorage.setItem("menu", JSON.stringify(menu));
    loadMenu();
}

function deleteMenuItem(index) {
    if (confirm(`Are you sure you want to delete ${menu[index].name} from the menu?`)) {
        menu.splice(index, 1);
        localStorage.setItem("menu", JSON.stringify(menu));
        loadMenu();
    }
}

// Input Handling
let highlightedIndex = -1;

function setupInputs() {
    const tableInput = document.getElementById("tableInput");
    const itemInput = document.getElementById("itemInput");
    const itemQty = document.getElementById("itemQty");
    const currentTableInfo = document.getElementById("currentTableInfo");
    const suggestions = document.getElementById("suggestions");

    if (!tableInput || !itemInput || !itemQty || !currentTableInfo || !suggestions) {
        console.error("One or more input elements are missing in the DOM.");
        return;
    }

    tableInput.addEventListener("input", () => {
        filterTables(tableInput.value);
    });

    tableInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const matchedTable = tables.find(t => t.name.toLowerCase() === tableInput.value.toLowerCase());
            if (matchedTable) {
                selectTable(matchedTable.name);
                tableInput.value = "";
                itemInput.focus();
            } else {
                alert("Table not found!");
            }
        }
    });

    itemInput.addEventListener("input", () => {
        const query = itemInput.value.trim().toLowerCase();
        highlightedIndex = -1;

        if (query && currentTable) {
            const filteredItems = menu.filter(item =>
                item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query)
            );
            suggestions.innerHTML = filteredItems
                .map((item, index) => `
                    <div class="suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}" 
                         onclick="selectItem('${item.code}')">
                        ${item.code} - ${item.name} - $${item.price.toFixed(2)}
                    </div>`)
                .join("");
            suggestions.style.display = filteredItems.length ? "block" : "none";
        } else {
            suggestions.innerHTML = "";
            suggestions.style.display = "none";
        }
    });

    itemInput.addEventListener("keydown", (e) => {
        const items = suggestions.querySelectorAll(".suggestion-item");
        if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0 && items.length > 0) {
                const code = items[highlightedIndex].getAttribute("onclick").match(/'([^']+)'/)[1];
                selectItem(code);
            } else {
                const query = itemInput.value.trim().toLowerCase();
                const matchedItem = menu.find(item =>
                    item.code.toLowerCase() === query || item.name.toLowerCase() === query
                );
                if (matchedItem) {
                    selectItem(matchedItem.code);
                } else if (items.length > 0) {
                    const code = items[0].getAttribute("onclick").match(/'([^']+)'/)[1];
                    selectItem(code);
                } else {
                    alert("Item not found! Use arrow keys or click to select from suggestions.");
                }
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (items.length > 0) {
                highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
                updateHighlight(items);
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (items.length > 0) {
                highlightedIndex = Math.max(highlightedIndex - 1, 0);
                updateHighlight(items);
            }
        }
    });

    document.addEventListener("click", (e) => {
        if (!itemInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = "none";
        }
    });

    function selectItem(code) {
        const item = menu.find(m => m.code === code);
        if (item && currentTable) {
            // Clear previous selected item highlight and append new one with styling
            const tableInfo = currentTableInfo.innerHTML.split('<p class="selected-item">')[0]; // Keep table info only
            currentTableInfo.innerHTML = tableInfo + `
                <p class="selected-item">Selected Item: ${item.name} (${item.code}) - $${item.price.toFixed(2)}</p>
            `;
            itemInput.value = "";
            suggestions.style.display = "none";
            itemQty.focus();
            const sidebar = document.getElementById("sidebar");
            if (sidebar) {
                sidebar.classList.add("hidden");
            }
        } else {
            alert("Cannot select item: No table selected or item not found.");
        }
    }

    itemQty.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && currentTable) {
            const qty = parseInt(itemQty.value) || 1;
            const selectedItemInfo = currentTableInfo.innerHTML.match(/Selected Item: ([\w\s]+) \((\w+)\) - \$([\d.]+)/);
            if (selectedItemInfo) {
                const name = selectedItemInfo[1];
                const code = selectedItemInfo[2];
                const price = parseFloat(selectedItemInfo[3]);
                const item = { name, code, price, qty };
                let currentOrder = JSON.parse(localStorage.getItem(`order_${currentTable}`)) || [];
                currentOrder.push(item);
                localStorage.setItem(`order_${currentTable}`, JSON.stringify(currentOrder));
                loadOrder(currentTable);
                // Clear the selected item after adding to order
                currentTableInfo.innerHTML = currentTableInfo.innerHTML.replace(/<p class="selected-item">[\s\S]*?<\/p>/, "");
                itemQty.value = "";
                itemInput.focus();
            } else {
                alert("No item selected to add quantity for!");
            }
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "PageDown" && currentTable) {
            e.preventDefault();
            saveOrder();
            currentTable = null;
            const currentTableInfo = document.getElementById("currentTableInfo");
            currentTableInfo.innerHTML = "";
            document.getElementById("orderList").innerHTML = "";
            document.getElementById("grandTotal").textContent = "0.00";
            tableInput.focus();
            loadTables();
        } else if (e.key === "PageUp" && currentTable) {
            e.preventDefault();
            printReceipt();
        } else if (e.key === "End") {
            e.preventDefault();
            closeDay();
        }
    });
}
function updateHighlight(items) {
    items.forEach((item, index) => {
        item.classList.toggle("highlighted", index === highlightedIndex);
        if (index === highlightedIndex) {
            item.scrollIntoView({ block: "nearest" });
        }
    });
}

function loadOrder(tableName) {
    currentTable = tableName;
    const currentOrder = JSON.parse(localStorage.getItem(`order_${tableName}`)) || [];
    const orderList = document.getElementById("orderList");
    const currentTableInfo = document.getElementById("currentTableInfo");
    const table = tables.find(t => t.name === tableName);

    if (currentTableInfo) {
        currentTableInfo.innerHTML = table ? `
            <p><strong>Table:</strong> ${table.name} (${table.type})</p>
            <p><strong>Status:</strong> ${getTableStatus(table.name) === "occupied" ? "Occupied" : "Free"}</p>
        ` : "";
    }
    if (orderList) {
        orderList.innerHTML = currentOrder
            .map((item, index) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${item.qty}</td>
                    <td>${(item.price * item.qty).toFixed(2)}</td>
                    <td><button class="btn btn-danger btn-small" onclick="deleteItem('${tableName}', ${index})">Delete</button></td>
                </tr>
            `)
            .join("");
        updateGrandTotal(currentOrder);
    }
}

window.deleteItem = function(tableName, index) {
    if (confirm("Are you sure you want to delete this item from the order?")) {
        let currentOrder = JSON.parse(localStorage.getItem(`order_${tableName}`)) || [];
        currentOrder.splice(index, 1);
        localStorage.setItem(`order_${tableName}`, JSON.stringify(currentOrder));
        loadOrder(tableName);
        loadTables();
    }
}

function updateGrandTotal(order) {
    const total = order.reduce((sum, item) => sum + item.price * item.qty, 0);
    const grandTotalElement = document.getElementById("grandTotal");
    if (grandTotalElement) {
        grandTotalElement.textContent = total.toFixed(2);
    }
}

function saveOrder() {
    if (currentTable) {
        const currentOrder = JSON.parse(localStorage.getItem(`order_${currentTable}`)) || [];
        if (currentOrder.length > 0) {
            localStorage.setItem(`order_${currentTable}`, JSON.stringify(currentOrder));
        }
    }
}

function generateBillNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BILL-${timestamp}-${random}`;
}

function printReceipt() {
    if (!currentTable) {
        alert("No table selected!");
        return;
    }
    const currentOrder = JSON.parse(localStorage.getItem(`order_${currentTable}`)) || [];
    if (currentOrder.length === 0) {
        alert("No order to generate receipt for!");
        return;
    }

    const total = currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
    const billNumber = generateBillNumber();
    const timestamp = new Date().toISOString();
    const restaurantName = "Sample Restaurant";

    const orderDetails = {
        billNumber: billNumber,
        table: currentTable,
        items: [...currentOrder],
        total: total.toFixed(2),
        timestamp: timestamp,
        date: timestamp.split('T')[0]
    };

    let orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    orderHistory.push(orderDetails);
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

    const receipt = `
        ${restaurantName}
        Restaurant Billing Receipt
        Bill Number: ${billNumber}
        Table: ${currentTable}
        Date: ${new Date().toLocaleString()}
        -----------------------
        ${currentOrder.map(item => `${item.name} (${item.code}) x${item.qty} - $${(item.price * item.qty).toFixed(2)}`).join("\n")}
        -----------------------
        Grand Total: $${total.toFixed(2)}
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<pre>' + receipt + '</pre>');
    printWindow.document.close();
    printWindow.print();
    printWindow.close();

    localStorage.removeItem(`order_${currentTable}`);
    loadOrder(currentTable);
    const currentTableInfo = document.getElementById("currentTableInfo");
    currentTableInfo.innerHTML = currentTable ? `
        <p><strong>Table:</strong> ${currentTable} (Regular)</p>
        <p><strong>Status:</strong> Free</p>
    ` : "";
}

function closeDay() {
    const reports = JSON.parse(localStorage.getItem("dailyReports")) || [];
    const today = new Date().toISOString().split('T')[0];
    let dailyTotal = 0;
    let itemSales = {};

    tables.forEach(table => {
        const order = JSON.parse(localStorage.getItem(`order_${table.name}`)) || [];
        if (order.length > 0) {
            const tableTotal = order.reduce((sum, item) => sum + item.price * item.qty, 0);
            dailyTotal += tableTotal;
            order.forEach(item => {
                const key = `${item.name} (${item.code})`;
                itemSales[key] = (itemSales[key] || 0) + item.qty;
            });
            localStorage.removeItem(`order_${table.name}`);
        }
    });

    const report = {
        date: today,
        totalSales: dailyTotal.toFixed(2),
        itemsSold: itemSales,
        timestamp: new Date().toISOString()
    };
    reports.push(report);
    localStorage.setItem("dailyReports", JSON.stringify(reports));

    loadTables();
    alert(`Day closed for ${today}. Total Sales: $${dailyTotal.toFixed(2)}. Reports saved.`);
}

const generateReceiptBtn = document.getElementById("generateReceipt");
if (generateReceiptBtn) {
    generateReceiptBtn.addEventListener("click", () => {
        if (!currentTable) {
            alert("No table selected!");
            return;
        }
        printReceipt();
    });
}

function loadWaiters() {
    // Add waiter management logic here if needed
}

function loadReports() {
    const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    const dailyReports = JSON.parse(localStorage.getItem("dailyReports")) || [];
    const reportList = document.getElementById("reportList");
    const filterType = document.getElementById("filterType");
    const filterInputs = document.getElementById("filterInputs");
    const applyFilterBtn = document.getElementById("applyFilter");
    const searchBillInput = document.getElementById("searchBill");
    const searchBillBtn = document.getElementById("searchBillBtn");
    const exportExcelBtn = document.getElementById("exportExcel");

    if (!reportList || !filterType || !filterInputs || !applyFilterBtn || !searchBillInput || !searchBillBtn || !exportExcelBtn) {
        console.error("One or more report elements are missing in the DOM.");
        return;
    }

    let currentOrders = [...orderHistory];
    let currentDailyReports = [...dailyReports];

    function updateFilterInputs() {
        const type = filterType.value;
        filterInputs.innerHTML = "";

        if (type === "day") {
            filterInputs.innerHTML = `
                <input type="date" id="filterDay" class="filter-date">
            `;
        } else if (type === "month") {
            filterInputs.innerHTML = `
                <input type="month" id="filterMonth" class="filter-date">
            `;
        } else if (type === "range") {
            filterInputs.innerHTML = `
                <input type="date" id="filterStart" class="filter-date" placeholder="Start Date">
                <input type="date" id="filterEnd" class="filter-date" placeholder="End Date">
            `;
        }
    }

    updateFilterInputs();
    filterType.addEventListener("change", updateFilterInputs);

    function calculateSummary(orders) {
        const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2);
        const totalBills = orders.length;
        const avgBill = totalBills > 0 ? (totalAmount / totalBills).toFixed(2) : "0.00";
        
        const itemQuantities = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = `${item.name} (${item.code})`;
                itemQuantities[key] = (itemQuantities[key] || 0) + item.qty;
            });
        });
        const mostSoldItem = Object.entries(itemQuantities).reduce((a, b) => a[1] > b[1] ? a : b, ["N/A", 0])[0];
        
        return { totalAmount, totalBills, avgBill, mostSoldItem };
    }

    function displayOrders(orders) {
        currentOrders = orders;
        if (orders.length === 0) {
            reportList.innerHTML = `<p>No orders found.</p>`;
            return;
        }
        const { totalAmount, totalBills, avgBill, mostSoldItem } = calculateSummary(orders);
        reportList.innerHTML = `
            <div class="report-summary">
                <p><strong>Total Amount:</strong> $${totalAmount}</p>
                <p><strong>Total Bills:</strong> ${totalBills}</p>
                <p><strong>Average Bill:</strong> $${avgBill}</p>
                <p><strong>Most Sold Item:</strong> ${mostSoldItem}</p>
            </div>
            ${orders.map((order, index) => `
                <div class="report-item">
                    <p><strong>Bill Number:</strong> ${order.billNumber || 'N/A'}</p>
                    <p><strong>Table:</strong> ${order.table}</p>
                    <p><strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
                    <p><strong>Items:</strong> ${order.items.map(item => `${item.name} (${item.code}) x${item.qty} - $${(item.price * item.qty).toFixed(2)}`).join(", ")}</p>
                    <p><strong>Total:</strong> $${order.total}</p>
                    <button class="btn btn-danger btn-small delete-btn" onclick="deleteOrder(${index})">Delete</button>
                    <hr>
                </div>`).join("")}
        `;
    }

    function displayDailyReports(reports) {
        currentDailyReports = reports;
        if (reports.length === 0) {
            reportList.innerHTML = `<p>No daily reports found.</p>`;
            return;
        }
        const totalDailyAmount = reports.reduce((sum, report) => sum + parseFloat(report.totalSales), 0).toFixed(2);
        const totalDailyReports = reports.length;
        const avgDailySales = totalDailyReports > 0 ? (totalDailyAmount / totalDailyReports).toFixed(2) : "0.00";
        
        const itemQuantities = {};
        reports.forEach(report => {
            Object.entries(report.itemsSold).forEach(([item, qty]) => {
                itemQuantities[item] = (itemQuantities[item] || 0) + qty;
            });
        });
        const mostSoldItem = Object.entries(itemQuantities).reduce((a, b) => a[1] > b[1] ? a : b, ["N/A", 0])[0];

        reportList.innerHTML = `
            <div class="report-summary">
                <p><strong>Total Daily Sales:</strong> $${totalDailyAmount}</p>
                <p><strong>Total Days:</strong> ${totalDailyReports}</p>
                <p><strong>Average Daily Sales:</strong> $${avgDailySales}</p>
                <p><strong>Most Sold Item:</strong> ${mostSoldItem}</p>
            </div>
            ${reports.map(report => `
                <div class="report-item">
                    <p><strong>Date:</strong> ${new Date(report.date).toLocaleDateString()}</p>
                    <p><strong>Total Sales:</strong> $${report.totalSales}</p>
                    <p><strong>Items Sold:</strong> ${Object.entries(report.itemsSold)
                        .map(([item, qty]) => `${item} x${qty}`).join(", ")}</p>
                    <hr>
                </div>`).join("")}
        `;
    }

    window.deleteOrder = function(index) {
        if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            let allOrders = JSON.parse(localStorage.getItem("orderHistory")) || [];
            allOrders.splice(index, 1);
            localStorage.setItem("orderHistory", JSON.stringify(allOrders));
            const type = filterType.value;
            applyFilter(type);
        }
    }

    function applyFilter(type) {
        let filteredOrders = [...orderHistory];
        let filteredDailyReports = [...dailyReports];

        if (type === "day") {
            const day = document.getElementById("filterDay")?.value;
            if (day) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.date).toISOString().split('T')[0] === day
                );
                displayOrders(filteredOrders);
            } else {
                displayOrders(orderHistory);
            }
        } else if (type === "month") {
            const month = document.getElementById("filterMonth")?.value;
            if (month) {
                const [year, monthNum] = month.split('-');
                filteredOrders = filteredOrders.filter(order => {
                    const d = new Date(order.date);
                    return d.getMonth() + 1 === parseInt(monthNum) && d.getFullYear() === parseInt(year);
                });
                displayOrders(filteredOrders);
            } else {
                displayOrders(orderHistory);
            }
        } else if (type === "range") {
            const start = document.getElementById("filterStart")?.value;
            const end = document.getElementById("filterEnd")?.value;
            if (start && end) {
                filteredOrders = filteredOrders.filter(order => {
                    const d = new Date(order.date);
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    return d >= startDate && d <= endDate;
                });
                displayOrders(filteredOrders);
            } else {
                displayOrders(orderHistory);
            }
        } else if (type === "daily") {
            displayDailyReports(filteredDailyReports);
        } else {
            displayOrders(orderHistory);
        }
    }

    function exportToExcel() {
        const type = filterType.value;
        let data = [];
        let filename = "report";

        if (type === "daily") {
            data = currentDailyReports.map(report => ({
                Date: new Date(report.date).toLocaleDateString(),
                "Total Sales": report.totalSales,
                "Items Sold": Object.entries(report.itemsSold).map(([item, qty]) => `${item} x${qty}`).join(", ")
            }));
            filename = "daily_reports.xlsx";
        } else {
            data = currentOrders.flatMap(order => {
                const baseRow = {
                    "Bill Number": order.billNumber || "N/A",
                    Table: order.table,
                    Date: new Date(order.timestamp).toLocaleString(),
                    "Grand Total": order.total
                };
                return order.items.map((item, index) => ({
                    ...baseRow,
                    "Item Name": item.name,
                    "Item Code": item.code,
                    "Item Price": item.price.toFixed(2),
                    "Quantity": item.qty,
                    "Item Total": (item.price * item.qty).toFixed(2),
                    ...(index === 0 ? {} : { "Bill Number": "", Table: "", Date: "", "Grand Total": "" })
                }));
            });
            filename = "order_history.xlsx";
        }

        if (data.length === 0) {
            alert("No data available to export!");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, filename);
    }

    displayOrders(orderHistory);

    applyFilterBtn.addEventListener("click", () => {
        const type = filterType.value;
        applyFilter(type);
    });

    searchBillBtn.addEventListener("click", () => {
        const billNumber = searchBillInput.value.trim();
        if (billNumber) {
            const filteredOrders = orderHistory.filter(order => order.billNumber === billNumber);
            if (filteredOrders.length > 0) {
                displayOrders(filteredOrders);
            } else {
                reportList.innerHTML = `<p>No orders found for bill number: ${billNumber}</p>`;
            }
        } else {
            displayOrders(orderHistory);
        }
    });

    exportExcelBtn.addEventListener("click", exportToExcel);
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(() => {
        console.log("Service Worker registered");
    });
}
