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
            } else if (path.includes("settings.html")) {
                setupSettings();
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

    if (generateTablesBtn && tableCount) {
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
            const tableInfo = currentTableInfo.innerHTML.split('<p class="selected-item">')[0];
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
                </tr>`)
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

function updateBillingTotals(order) {
    const settings = JSON.parse(localStorage.getItem("billingSettings")) || {
        enableGST: false,
        gstPercentage: 5,
        gstNumber: ""
    };
    const subtotal = order.reduce((sum, item) => sum + item.price * item.qty, 0);
    let gstAmount = 0, total = subtotal;

    if (settings.enableGST) {
        gstAmount = (subtotal * settings.gstPercentage) / 100;
        total = subtotal + gstAmount;
    }

    document.getElementById("subtotal").textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById("gstAmount").textContent = `₹${gstAmount.toFixed(2)}`;
    document.getElementById("totalAmount").textContent = `₹${total.toFixed(2)}`;
    document.getElementById("grandTotal").textContent = `₹${total.toFixed(2)}`; // For backward compatibility
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
    const random = Math.floor(Math.random() * 10);
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

    const settings = JSON.parse(localStorage.getItem("billingSettings")) || {
        enableGST: false,
        gstPercentage: 5,
        gstNumber: ""
    };
    const subtotal = currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
    let gstAmount = 0, cgstAmount = 0, sgstAmount = 0, total = subtotal;

    if (settings.enableGST) {
        gstAmount = (subtotal * settings.gstPercentage) / 100;
        cgstAmount = gstAmount / 2; // 2.5% if GST is 5%
        sgstAmount = gstAmount / 2; // 2.5% if GST is 5%
        total = subtotal + gstAmount;
    }

    const billNumber = generateBillNumber();
    const timestamp = new Date().toISOString();
    const restaurantName = "Sample Restaurant";

    const modal = document.createElement("div");
    modal.innerHTML = `
        <div class="payment-modal-overlay">
            <div class="payment-modal">
                <h2>Select Payment Method</h2>
                <div class="payment-options">
                    <button class="payment-btn" data-method="Cash">Cash</button>
                    <button class="payment-btn" data-method="Online Payment">Online Payment</button>
                    <button class="payment-btn" data-method="Credit">Credit</button>
                </div>
                <div id="creditDetails" class="credit-details" style="display: none;">
                    <input type="text" id="creditorName" placeholder="Creditor Name" required>
                    <input type="text" id="creditorMobile" placeholder="Mobile (optional)">
                </div>
                <button id="confirmPayment" class="btn btn-primary" disabled>Confirm</button>
                <button id="cancelPayment" class="btn btn-secondary">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const style = document.createElement("style");
    style.textContent = `
        .payment-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease-in;
        }
        .payment-modal {
            background: #fff;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 400px;
            text-align: center;
            animation: slideUp 0.5s ease-out;
        }
        .payment-modal h2 {
            margin-bottom: 20px;
            color: #333;
        }
        .payment-options {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 20px;
        }
        .payment-btn {
            padding: 10px 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            background: #f9f9f9;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .payment-btn:hover {
            background: #007bff;
            color: #fff;
            border-color: #007bff;
        }
        .payment-btn.active {
            background: #007bff;
            color: #fff;
            border-color: #007bff;
        }
        .credit-details {
            margin-bottom: 20px;
        }
        .credit-details input {
            width: 100%;
            padding: 10px;
            margin: 5px 0;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1em;
        }
        .credit-details input:focus {
            border-color: #007bff;
            outline: none;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    let selectedMethod = null;
    const paymentBtns = modal.querySelectorAll(".payment-btn");
    const creditDetails = modal.querySelector("#creditDetails");
    const confirmBtn = modal.querySelector("#confirmPayment");
    const cancelBtn = modal.querySelector("#cancelPayment");
    const creditorNameInput = modal.querySelector("#creditorName");
    const creditorMobileInput = modal.querySelector("#creditorMobile");

    paymentBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            paymentBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedMethod = btn.dataset.method;
            creditDetails.style.display = selectedMethod === "Credit" ? "block" : "none";
            confirmBtn.disabled = selectedMethod === "Credit" && !creditorNameInput.value.trim();
        });
    });

    creditorNameInput.addEventListener("input", () => {
        confirmBtn.disabled = selectedMethod === "Credit" && !creditorNameInput.value.trim();
    });

    confirmBtn.addEventListener("click", () => {
        let paymentDetails = {};
        if (selectedMethod === "Credit") {
            const creditorName = creditorNameInput.value.trim();
            if (!creditorName) {
                alert("Creditor Name is required!");
                return;
            }
            paymentDetails = {
                method: "Credit",
                creditor: {
                    name: creditorName,
                    mobile: creditorMobileInput.value.trim() || "N/A",
                    paid: false,
                    remainingAmount: total.toFixed(2),
                    paymentHistory: []
                }
            };
        } else {
            paymentDetails = { method: selectedMethod };
        }

        const orderDetails = {
            billNumber: billNumber,
            table: currentTable,
            items: [...currentOrder],
            subtotal: subtotal.toFixed(2),
            gst: settings.enableGST ? {
                percentage: settings.gstPercentage,
                totalGST: gstAmount.toFixed(2),
                cgst: cgstAmount.toFixed(2),
                sgst: sgstAmount.toFixed(2)
            } : null,
            total: total.toFixed(2),
            timestamp: timestamp,
            date: timestamp.split('T')[0],
            payment: paymentDetails
        };

        let orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
        orderHistory.push(orderDetails);
        localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

        const receipt = `
            ${restaurantName}
            Restaurant Billing Receipt
            ${settings.enableGST && settings.gstNumber ? `GSTIN: ${settings.gstNumber}` : ""}
            Bill Number: ${billNumber}
            Table: ${currentTable}
            Date: ${new Date().toLocaleString()}
            Payment Method: ${paymentDetails.method}${paymentDetails.method === "Credit" ? ` (Creditor: ${paymentDetails.creditor.name})` : ""}
            -----------------------
            ${currentOrder.map(item => `${item.name} (${item.code}) x${item.qty} - $${(item.price * item.qty).toFixed(2)}`).join("\n")}
            -----------------------
            Subtotal: $${subtotal.toFixed(2)}
            ${settings.enableGST ? `
            GST (${settings.gstPercentage}%): $${gstAmount.toFixed(2)}
            CGST (${settings.gstPercentage / 2}%): $${cgstAmount.toFixed(2)}
            SGST (${settings.gstPercentage / 2}%): $${sgstAmount.toFixed(2)}
            ` : ""}
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

        document.body.removeChild(modal);
    });

    cancelBtn.addEventListener("click", () => {
        document.body.removeChild(modal);
    });
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

  

// Function to load reports from localStorage
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

    if (
        !reportList ||
        !filterType ||
        !filterInputs ||
        !applyFilterBtn ||
        !searchBillInput ||
        !searchBillBtn ||
        !exportExcelBtn
    ) {
        console.error("Missing elements:", {
            reportList: !!reportList,
            filterType: !!filterType,
            filterInputs: !!filterInputs,
            applyFilterBtn: !!applyFilterBtn,
            searchBillInput: !!searchBillInput,
            searchBillBtn: !!searchBillBtn,
            exportExcelBtn: !!exportExcelBtn,
        });
        if (reportList)
            reportList.innerHTML =
                "<p>Error: Required elements missing in reports.html. Check console for details.</p>";
        return;
    }

    // Apply modern report page styling immediately
    const reportStyle = document.createElement("style");
    reportStyle.id = "report-page-style"; // Add an ID to avoid duplicates
    reportStyle.textContent = `
        /* Report Page Styles */
        .modern-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .summary-item {
            background: #fff;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease;
        }
        .summary-item:hover {
            transform: translateY(-3px);
        }
        .summary-label {
            display: block;
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
        }
        .report-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .report-card {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .report-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        .report-header {
            background: #007bff;
            color: #fff;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .report-title {
            font-size: 1.1em;
            font-weight: bold;
        }
        .report-date {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .report-body {
            padding: 15px;
            color: #333;
        }
        .report-body p {
            margin: 8px 0;
            font-size: 0.95em;
        }
        .report-body ul {
            margin: 8px 0;
            padding-left: 20px;
        }
        .report-body li {
            margin: 5px 0;
            font-size: 0.9em;
        }
        .report-footer {
            padding: 10px 15px;
            border-top: 1px solid #eee;
            text-align: right;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .btn-small {
            padding: 8px 12px;
            font-size: 0.9em;
            border-radius: 6px;
            transition: background 0.3s ease;
        }
        .btn-danger {
            background: #dc3545;
            color: #fff;
        }
        .btn-danger:hover {
            background: #c82333;
        }
        .btn-success {
            background: #28a745;
            color: #fff;
        }
        .btn-success:hover {
            background: #218838;
        }
        .btn-warning {
            background: #ffc107;
            color: #333;
        }
        .btn-warning:hover {
            background: #e0a800;
        }
        .section-title {
            font-size: 1.5em;
            color: #333;
            margin: 30px 0 15px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }
        .no-data {
            text-align: center;
            color: #666;
            font-size: 1.1em;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .creditor-search {
            margin-bottom: 20px;
        }
        .creditor-search input {
            width: 100%;
            max-width: 300px;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1em;
            transition: border-color 0.3s ease;
        }
        .creditor-search input:focus {
            border-color: #007bff;
            outline: none;
        }
        .creditor-card .report-header {
            background: #dc3545;
        }
    `;
    // Remove existing style if it exists to avoid duplicates
    const existingStyle = document.getElementById("report-page-style");
    if (existingStyle) {
        existingStyle.remove();
    }
    document.head.appendChild(reportStyle);

    let currentOrders = [...orderHistory];
    let currentDailyReports = [...dailyReports];
    let creditorSearchQuery = ""; // To store the search query for creditors

    function updateFilterInputs() {
        const type = filterType.value;
        filterInputs.innerHTML = "";
        switch (type) {
            case "day":
                filterInputs.innerHTML = `<input type="date" id="filterDay" class="filter-date">`;
                break;
            case "month":
                filterInputs.innerHTML = `<input type="month" id="filterMonth" class="filter-date">`;
                break;
            case "range":
                filterInputs.innerHTML = `
                    <input type="date" id="filterStart" class="filter-date" placeholder="Start Date">
                    <input type="date" id="filterEnd" class="filter-date" placeholder="End Date">
                `;
                break;
            case "item-wise":
                filterInputs.innerHTML = `<input type="date" id="filterItemWiseDate" class="filter-date">`;
                break;
            default:
                filterInputs.innerHTML = "";
                break;
        }
    }

    function calculateSummary(orders) {
        const settings = JSON.parse(localStorage.getItem("billingSettings")) || {
            enableGST: false,
            gstPercentage: 5,
            gstNumber: ""
        };
        let totalAmount = orders.reduce((sum, order) => parseFloat(order.total), 0).toFixed(2);
        const totalBills = orders.length;
        const avgBill = totalBills > 0 ? (totalAmount / totalBills).toFixed(2) : "0.00";

        const itemQuantities = {};
        orders.forEach((order) => {
            order.items.forEach((item) => {
                const key = `${item.name} (${item.code})`;
                itemQuantities[key] = (itemQuantities[key] || 0) + item.qty;
            });
        });

        const mostSoldItem = Object.entries(itemQuantities).reduce(
            (a, b) => (a[1] > b[1] ? a : b),
            ["N/A", 0]
        )[0];

        return { totalAmount, totalBills, avgBill, mostSoldItem };
    }

    function displayOrders(orders) {
        currentOrders = orders;
        if (orders.length === 0) {
            reportList.innerHTML = `<div class="no-data">No orders found.</div>`;
            return;
        }

        const settings = JSON.parse(localStorage.getItem("billingSettings")) || {
            enableGST: false,
            gstPercentage: 5,
            gstNumber: ""
        };
        const { totalAmount, totalBills, avgBill, mostSoldItem } = calculateSummary(orders);
        const totalGST = orders.reduce((sum, order) => {
            return settings.enableGST && order.gst ? sum + parseFloat(order.gst.totalGST) : sum;
        }, 0).toFixed(2);

        reportList.innerHTML = `
            <div class="report-summary modern-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Amount (Including GST)</span>
                    <span class="summary-value">₹${totalAmount}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total GST Collected</span>
                    <span class="summary-value">₹${totalGST}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Bills</span>
                    <span class="summary-value">${totalBills}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Average Bill (Including GST)</span>
                    <span class="summary-value">₹${avgBill}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Most Sold Item</span>
                    <span class="summary-value">${mostSoldItem}</span>
                </div>
            </div>
            <div class="report-grid">
                ${orders
                    .map(
                        (order, index) => {
                            const orderSubtotal = parseFloat(order.subtotal);
                            const gstAmount = settings.enableGST && order.gst ? parseFloat(order.gst.totalGST) : 0;
                            const totalWithGST = orderSubtotal + gstAmount;

                            return `
                            <div class="report-card">
                                <div class="report-header">
                                    <span class="report-title">Bill Number: ${order.billNumber || "N/A"}</span>
                                    <span class="report-date">${new Date(order.timestamp).toLocaleString()}</span>
                                </div>
                                <div class="report-body">
                                    <p><strong>Table:</strong> ${order.table}</p>
                                    <p><strong>Items:</strong> ${order.items
                                        .map(
                                            (item) =>
                                                `${item.name} (${item.code}) x${item.qty} - ₹${(
                                                    item.price * item.qty
                                                ).toFixed(2)}`
                                        )
                                        .join(", ")}</p>
                                    <p><strong>Subtotal:</strong> ₹${orderSubtotal.toFixed(2)}</p>
                                    ${settings.enableGST && order.gst ? `
                                    <p><strong>GST (${order.gst.percentage}%):</strong> ₹${gstAmount.toFixed(2)}</p>
                                    <p><strong>CGST (${order.gst.percentage / 2}%):</strong> ₹${parseFloat(order.gst.cgst).toFixed(2)}</p>
                                    <p><strong>SGST (${order.gst.percentage / 2}%):</strong> ₹${parseFloat(order.gst.sgst).toFixed(2)}</p>
                                    ` : ""}
                                    <p><strong>Total:</strong> ₹${totalWithGST.toFixed(2)}</p>
                                    <p><strong>Payment Method:</strong> ${
                                        order.payment.method
                                    }${
                                        order.payment.method === "Credit"
                                            ? ` (Creditor: ${order.payment.creditor.name}, Mobile: ${
                                                  order.payment.creditor.mobile
                                              }, Paid: ${order.payment.creditor.paid ? "Yes" : "No"})`
                                            : ""
                                    }</p>
                                </div>
                                <div class="report-footer">
                                    <button class="btn btn-warning btn-small" onclick="editPaymentMethod('${
                                        order.billNumber
                                    }', ${index})">Edit Payment Method</button>
                                    <button class="btn btn-danger btn-small delete-btn" onclick="deleteOrder(${index})">Delete</button>
                                </div>
                            </div>`;
                        }
                    )
                    .join("")}
            </div>
        `;
    }

    function displayDailyReports(reports) {
        currentDailyReports = reports;
        if (reports.length === 0) {
            reportList.innerHTML = `<div class="no-data">No daily reports found.</div>`;
            return;
        }
        const totalDailyAmount = reports
            .reduce((sum, report) => sum + parseFloat(report.totalSales), 0)
            .toFixed(2);
        const totalDailyReports = reports.length;
        const avgDailySales =
            totalDailyReports > 0 ? (totalDailyAmount / totalDailyReports).toFixed(2) : "0.00";
        const itemQuantities = {};
        reports.forEach((report) => {
            Object.entries(report.itemsSold).forEach(([item, qty]) => {
                itemQuantities[item] = (itemQuantities[item] || 0) + qty;
            });
        });
        const mostSoldItem = Object.entries(itemQuantities).reduce(
            (a, b) => (a[1] > b[1] ? a : b),
            ["N/A", 0]
        )[0];

        reportList.innerHTML = `
            <div class="report-summary modern-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Daily Sales</span>
                    <span class="summary-value">₹${totalDailyAmount}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Days</span>
                    <span class="summary-value">${totalDailyReports}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Average Daily Sales</span>
                    <span class="summary-value">₹${avgDailySales}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Most Sold Item</span>
                    <span class="summary-value">${mostSoldItem}</span>
                </div>
            </div>
            <div class="report-grid">
                ${reports
                    .map(
                        (report) => `
                    <div class="report-card">
                        <div class="report-header">
                            <span class="report-title">Date: ${new Date(
                                report.date
                            ).toLocaleDateString()}</span>
                        </div>
                        <div class="report-body">
                            <p><strong>Total Sales:</strong> ₹${report.totalSales}</p>
                            <p><strong>Items Sold:</strong> ${Object.entries(report.itemsSold)
                                .map(([item, qty]) => `${item} x${qty}`)
                                .join(", ")}</p>
                        </div>
                    </div>`
                    )
                    .join("")}
            </div>
        `;
    }

    function displayCreditors() {
        const unpaidCredits = orderHistory.filter(
            (order) => order.payment.method === "Credit" && !order.payment.creditor.paid
        );
        const paidCredits = orderHistory.filter(
            (order) => order.payment.method === "Credit" && order.payment.creditor.paid
        );
        if (unpaidCredits.length === 0 && paidCredits.length === 0) {
            reportList.innerHTML = `<div class="no-data">No creditor records found.</div>`;
            return;
        }

        const totalUnpaidAmount = unpaidCredits
            .reduce(
                (sum, order) =>
                    sum + parseFloat(order.payment.creditor.remainingAmount || order.total),
                0
            )
            .toFixed(2);
        const totalPaidAmount = paidCredits
            .reduce(
                (sum, order) =>
                    sum +
                    order.payment.creditor.paymentHistory.reduce(
                        (ps, p) => ps + parseFloat(p.amount),
                        0
                    ),
                0
            )
            .toFixed(2);

        // Filter unpaid credits based on the search query
        const filteredUnpaidCredits = unpaidCredits.filter((order) =>
            order.payment.creditor.name
                .toLowerCase()
                .includes(creditorSearchQuery.toLowerCase())
        );

        reportList.innerHTML = `
            <div class="report-summary modern-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Unpaid Amount</span>
                    <span class="summary-value">₹${totalUnpaidAmount}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Unpaid Creditors</span>
                    <span class="summary-value">${unpaidCredits.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Paid Amount</span>
                    <span class="summary-value">₹${totalPaidAmount}</span>
                </div>
            </div>
            <h3 class="section-title">Unpaid Credits</h3>
            <div class="creditor-search">
                <input type="text" id="creditorSearch" placeholder="Search by Creditor Name" value="${creditorSearchQuery}">
            </div>
            <div class="report-grid">
                ${
                    filteredUnpaidCredits.length > 0
                        ? filteredUnpaidCredits
                              .map(
                                  (order) => `
                    <div class="report-card creditor-card">
                        <div class="report-header">
                            <span class="report-title">Bill Number: ${order.billNumber}</span>
                            <span class="report-date">${new Date(order.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="report-body">
                            <p><strong>Creditor:</strong> ${order.payment.creditor.name}</p>
                            <p><strong>Mobile:</strong> ${order.payment.creditor.mobile}</p>
                            <p><strong>Total Amount:</strong> ₹${order.total}</p>
                            <p><strong>Remaining Amount:</strong> ₹${
                                order.payment.creditor.remainingAmount || order.total
                            }</p>
                        </div>
                        <div class="report-footer">
                            <button class="btn btn-warning btn-small" onclick="editPaymentMethod('${
                                order.billNumber
                            }')">Edit Payment Method</button>
                            <button class="btn btn-success btn-small" onclick="markCreditPaid('${
                                order.billNumber
                            }')">Mark Paid</button>
                        </div>
                    </div>`
                              )
                              .join("")
                        : "<div class='no-data'>No unpaid credits matching the search.</div>"
                }
            </div>
            <h3 class="section-title">Credit Payment History</h3>
            <div class="report-grid">
                ${
                    paidCredits.length > 0
                        ? paidCredits
                              .map(
                                  (order) => `
                    <div class="report-card">
                        <div class="report-header">
                            <span class="report-title">Bill Number: ${order.billNumber}</span>
                        </div>
                        <div class="report-body">
                            <p><strong>Creditor:</strong> ${order.payment.creditor.name}</p>
                            <p><strong>Total Amount:</strong> ₹${order.total}</p>
                            <p><strong>Payments:</strong></p>
                            <ul>
                                ${order.payment.creditor.paymentHistory
                                    .map(
                                        (payment) => `
                                    <li>₹${payment.amount} on ${new Date(
                                        payment.timestamp
                                    ).toLocaleString()}</li>
                                `
                                    )
                                    .join("")}
                            </ul>
                        </div>
                        <div class="report-footer">
                            <button class="btn btn-warning btn-small" onclick="editPaymentMethod('${
                                order.billNumber
                            }')">Edit Payment Method</button>
                        </div>
                    </div>`
                              )
                              .join("")
                        : "<div class='no-data'>No credit payments recorded.</div>"
                }
            </div>
        `;

        // Add event listener for the creditor search input
        const creditorSearchInput = document.getElementById("creditorSearch");
        if (creditorSearchInput) {
            creditorSearchInput.addEventListener("input", () => {
                creditorSearchQuery = creditorSearchInput.value.trim();
                displayCreditors(); // Re-render with the updated search query
            });
        }
    }

    function displayItemWiseDetails(date) {
        // Filter orders for the selected date
        const filteredOrders = orderHistory.filter(
            (order) => new Date(order.timestamp).toISOString().split("T")[0] === date
        );

        if (filteredOrders.length === 0) {
            reportList.innerHTML = `<div class="no-data">No orders found for ${new Date(
                date
            ).toLocaleDateString()}.</div>`;
            return;
        }

        // Aggregate item-wise data
        const itemDetails = {};
        filteredOrders.forEach((order) => {
            order.items.forEach((item) => {
                const key = `${item.name} (${item.code})`;
                if (!itemDetails[key]) {
                    itemDetails[key] = {
                        name: item.name,
                        code: item.code,
                        qty: 0,
                        totalRevenue: 0,
                    };
                }
                itemDetails[key].qty += item.qty;
                itemDetails[key].totalRevenue += item.price * item.qty;
            });
        });

        // Calculate summary
        const totalItemsSold = Object.values(itemDetails).reduce(
            (sum, item) => sum + item.qty,
            0
        );
        const totalRevenue = Object.values(itemDetails)
            .reduce((sum, item) => sum + item.totalRevenue, 0)
            .toFixed(2);
        const mostSoldItem = Object.entries(itemDetails).reduce(
            (a, b) => (a[1].qty > b[1].qty ? a : b),
            [null, { qty: 0 }]
        )[0] || "N/A";

        // Render the report
        reportList.innerHTML = `
            <div class="report-summary modern-summary">
                <div class="summary-item">
                    <span class="summary-label">Date</span>
                    <span class="summary-value">${new Date(date).toLocaleDateString()}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Items Sold</span>
                    <span class="summary-value">${totalItemsSold}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Revenue</span>
                    <span class="summary-value">₹${totalRevenue}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Most Sold Item</span>
                    <span class="summary-value">${mostSoldItem}</span>
                </div>
            </div>
            <h3 class="section-title">Item-Wise Details</h3>
            <div class="report-grid">
                ${Object.values(itemDetails)
                    .map(
                        (item) => `
                    <div class="report-card">
                        <div class="report-header">
                            <span class="report-title">${item.name} (${item.code})</span>
                        </div>
                        <div class="report-body">
                            <p><strong>Quantity Sold:</strong> ${item.qty}</p>
                            <p><strong>Total Revenue:</strong> ₹${item.totalRevenue.toFixed(2)}</p>
                            <p><strong>Unit Price:</strong> ₹${(item.totalRevenue / item.qty).toFixed(2)}</p>
                        </div>
                    </div>`
                    )
                    .join("")}
            </div>
        `;
    }

    window.deleteOrder = function (index) {
        if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            let allOrders = JSON.parse(localStorage.getItem("orderHistory")) || [];
            allOrders.splice(index, 1);
            localStorage.setItem("orderHistory", JSON.stringify(allOrders));
            applyFilter(filterType.value);
        }
    };

    window.markCreditPaid = function (billNumber) {
        let allOrders = JSON.parse(localStorage.getItem("orderHistory")) || [];
        const orderIndex = allOrders.findIndex((o) => o.billNumber === billNumber);
        if (orderIndex === -1) {
            alert("Order not found!");
            return;
        }

        const order = allOrders[orderIndex];
        if (order.payment.method !== "Credit") {
            alert("This order is not a credit order!");
            return;
        }

        const remainingAmount = parseFloat(order.payment.creditor.remainingAmount || order.total);

        // Create a polished modal for entering the payment amount
        const modal = document.createElement("div");
        modal.innerHTML = `
            <div class="payment-modal-overlay">
                <div class="payment-modal">
                    <h2>Record Payment for ${order.payment.creditor.name}</h2>
                    <p><strong>Bill Number:</strong> ${billNumber}</p>
                    <p><strong>Total Amount:</strong> ₹${order.total}</p>
                    <p><strong>Remaining Amount:</strong> ₹${remainingAmount.toFixed(2)}</p>
                    <div class="payment-input">
                        <input type="number" id="paymentAmount" placeholder="Enter amount to pay" step="0.01" min="0" max="${remainingAmount}">
                    </div>
                    <button id="confirmPayment" class="btn btn-primary" disabled>Confirm Payment</button>
                    <button id="cancelPayment" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add CSS for the modal only
        const modalStyle = document.createElement("style");
        modalStyle.textContent = `
            /* Modal Styles */
            .payment-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease-in;
            }
            .payment-modal {
                background: #fff;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                width: 100%;
                max-width: 400px;
                text-align: center;
                animation: slideUp 0.5s ease-out;
            }
            .payment-modal h2 {
                margin-bottom: 20px;
                color: #333;
                font-size: 1.5em;
            }
            .payment-modal p {
                margin: 5px 0;
                color: #555;
            }
            .payment-input {
                margin: 20px 0;
            }
            .payment-input input {
                width: 100%;
                padding: 10px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 1em;
                transition: border-color 0.3s ease;
            }
            .payment-input input:focus {
                border-color: #007bff;
                outline: none;
            }
            .btn-primary {
                background: #007bff;
                color: #fff;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            .btn-primary:hover {
                background: #0056b3;
            }
            .btn-primary:disabled {
                background: #cccccc;
                cursor: not-allowed;
            }
            .btn-secondary {
                background: #6c757d;
                color: #fff;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                margin-left: 10px;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            .btn-secondary:hover {
                background: #5a6268;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(modalStyle);

        const paymentAmountInput = modal.querySelector("#paymentAmount");
        const confirmBtn = modal.querySelector("#confirmPayment");
        const cancelBtn = modal.querySelector("#cancelPayment");

        // Enable/disable the confirm button based on input validation
        paymentAmountInput.addEventListener("input", () => {
            const amount = parseFloat(paymentAmountInput.value);
            confirmBtn.disabled =
                !amount || amount <= 0 || amount > remainingAmount;
        });

        confirmBtn.addEventListener("click", () => {
            const paidAmount = parseFloat(paymentAmountInput.value);
            if (isNaN(paidAmount) || paidAmount <= 0 || paidAmount > remainingAmount) {
                alert("Invalid amount entered!");
                return;
            }

            if (
                !confirm(
                    `Confirm payment of ₹${paidAmount.toFixed(2)} for ${
                        order.payment.creditor.name
                    } (Bill: ${billNumber})?`
                )
            ) {
                return;
            }

            // Initialize paymentHistory if not exists
            if (!order.payment.creditor.paymentHistory) {
                order.payment.creditor.paymentHistory = [];
            }

            // Add payment to history
            order.payment.creditor.paymentHistory.push({
                amount: paidAmount.toFixed(2),
                timestamp: new Date().toISOString(),
            });

            // Update remaining amount
            const newRemaining = remainingAmount - paidAmount;
            order.payment.creditor.remainingAmount = newRemaining.toFixed(2);

            // Mark as fully paid if remaining is 0
            if (newRemaining <= 0) {
                border-radius: 8px;
                margin-left: 10px;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            .btn-secondary:hover {
                background: #5a6268;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            };
        document.head.appendChild(modalStyle);

        const paymentMethodButtons = modal.querySelectorAll(".payment-method-btn");
        const creditorDetails = modal.querySelector("#creditorDetails");
        const creditorNameInput = modal.querySelector("#creditorName");
        const creditorMobileInput = modal.querySelector("#creditorMobile");
        const confirmBtn = modal.querySelector("#confirmEditPayment");
        const cancelBtn = modal.querySelector("#cancelEditPayment");

        let selectedMethod = null;

        // Handle payment method selection
        paymentMethodButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                paymentMethodButtons.forEach((b) => b.classList.remove("selected"));
                btn.classList.add("selected");
                selectedMethod = btn.getAttribute("data-method");

                // Show creditor details if Credit is selected
                if (selectedMethod === "Credit") {
                    creditorDetails.style.display = "block";
                    confirmBtn.disabled = !creditorNameInput.value.trim();
                } else {
                    creditorDetails.style.display = "none";
                    confirmBtn.disabled = false;
                }
            });
        });

        // Enable/disable confirm button based on creditor name input
        creditorNameInput.addEventListener("input", () => {
            confirmBtn.disabled = !creditorNameInput.value.trim();
        });

        confirmBtn.addEventListener("click", () => {
            if (!selectedMethod) {
                alert("Please select a payment method!");
                return;
            }

            if (selectedMethod === "Credit" && !creditorNameInput.value.trim()) {
                alert("Please enter the creditor's name!");
                return;
            }

            if (
                !confirm(
                    `Are you sure you want to change the payment method to ${selectedMethod} for Bill ${billNumber}?`
                )
            ) {
                return;
            }

            // Update the payment method
            order.payment.method = selectedMethod;
            if (selectedMethod === "Credit") {
                order.payment.creditor = {
                    name: creditorNameInput.value.trim(),
                    mobile: creditorMobileInput.value.trim() || "N/A",
                    paid: false,
                    remainingAmount: order.total,
                    paymentHistory: [],
                };
            } else {
                delete order.payment.creditor; // Remove creditor details if switching to non-Credit method
            }

            // Save updated orderHistory to localStorage
            const orderIndexInAllOrders = allOrders.findIndex((o) => o.billNumber === billNumber);
            if (orderIndexInAllOrders !== -1) {
                allOrders[orderIndexInAllOrders] = order;
                localStorage.setItem("orderHistory", JSON.stringify(allOrders));

                // Update the orderHistory variable to reflect the changes
                orderHistory.length = 0;
                orderHistory.push(...allOrders);
            }

            // Refresh the display based on the current filter
            applyFilter(filterType.value);
            document.body.removeChild(modal);
        });

        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
    };

    function applyFilter(type) {
        let filteredOrders = [...orderHistory];
        let filteredDailyReports = [...dailyReports];

        switch (type) {
            case "day":
                const day = document.getElementById("filterDay")?.value;
                if (day) {
                    filteredOrders = filteredOrders.filter(
                        (order) => new Date(order.timestamp).toISOString().split("T")[0] === day
                    );
                    displayOrders(filteredOrders);
                } else {
                    displayOrders(orderHistory);
                }
                break;
            case "month":
                const month = document.getElementById("filterMonth")?.value;
                if (month) {
                    const [year, monthNum] = month.split("-");
                    filteredOrders = filteredOrders.filter((order) => {
                        const d = new Date(order.timestamp);
                        return d.getMonth() + 1 === parseInt(monthNum) && d.getFullYear() === parseInt(year);
                    });
                    displayOrders(filteredOrders);
                } else {
                    displayOrders(orderHistory);
                }
                break;
            case "range":
                const start = document.getElementById("filterStart")?.value;
                const end = document.getElementById("filterEnd")?.value;
                if (start && end) {
                    filteredOrders = filteredOrders.filter((order) => {
                        const d = new Date(order.timestamp);
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        return d >= startDate && d <= endDate;
                    });
                    displayOrders(filteredOrders);
                } else {
                    displayOrders(orderHistory);
                }
                break;
            case "daily":
                displayDailyReports(filteredDailyReports);
                break;
            case "creditors":
                displayCreditors();
                break;
            case "item-wise":
                const itemWiseDate = document.getElementById("filterItemWiseDate")?.value;
                if (itemWiseDate) {
                    displayItemWiseDetails(itemWiseDate);
                } else {
                    reportList.innerHTML = `<div class="no-data">Please select a date to view item-wise details.</div>`;
                }
                break;
            default:
                displayOrders(orderHistory);
                break;
        }
    }

   function exportToExcel() {
    const filterType = document.getElementById("filterType");
    const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
    const currentOrders = JSON.parse(localStorage.getItem("orderHistory")) || []; // Assuming currentOrders is a global or passed variable
    const currentDailyReports = JSON.parse(localStorage.getItem("dailyReports")) || []; // Assuming currentDailyReports is a global or passed variable
    
    const type = filterType.value;
    let data = [];
    let filename = "report";

    switch (type) {
        case "daily":
            data = currentDailyReports.map((report) => ({
                Date: new Date(report.date).toLocaleDateString(),
                "Total Sales": `₹${report.totalSales}`,
                "Items Sold": Object.entries(report.itemsSold)
                    .map(([item, qty]) => `${item} x${qty}`)
                    .join(", "),
            }));
            filename = "daily_reports.xlsx";
            break;
        case "creditors":
            const allCredits = orderHistory.filter(
                (order) => order.payment.method === "Credit"
            );
            data = allCredits.map((order) => ({
                "Bill Number": order.billNumber,
                "Creditor Name": order.payment.creditor.name,
                "Mobile": order.payment.creditor.mobile,
                "Total Amount": `₹${order.total}`,
                "Remaining Amount": order.payment.creditor.paid
                    ? "₹0.00"
                    : `₹${order.payment.creditor.remainingAmount || order.total}`,
                "Paid": order.payment.creditor.paid ? "Yes" : "No",
                "Payment History": order.payment.creditor.paymentHistory
                    ? order.payment.creditor.paymentHistory
                          .map(
                              (p) =>
                                  `₹${p.amount} on ${new Date(p.timestamp).toLocaleString()}`
                          )
                          .join("; ")
                    : "N/A",
                "Date": new Date(order.timestamp).toLocaleString(),
            }));
            filename = "creditors.xlsx";
            break;
        case "item-wise":
            const date = document.getElementById("filterItemWiseDate")?.value;
            if (!date) {
                alert("Please select a date to export item-wise details!");
                return;
            }
            const filteredOrders = orderHistory.filter(
                (order) => new Date(order.timestamp).toISOString().split("T")[0] === date
            );
            const itemDetails = {};
            filteredOrders.forEach((order) => {
                order.items.forEach((item) => {
                    const key = `${item.name} (${item.code})`;
                    if (!itemDetails[key]) {
                        itemDetails[key] = {
                            name: item.name,
                            code: item.code,
                            qty: 0,
                            totalRevenue: 0,
                        };
                    }
                    itemDetails[key].qty += item.qty;
                    itemDetails[key].totalRevenue += item.price * item.qty;
                });
            });
            data = Object.values(itemDetails).map((item) => ({
                "Item Name": item.name,
                "Item Code": item.code,
                "Quantity Sold": item.qty,
                "Unit Price": `₹${(item.totalRevenue / item.qty).toFixed(2)}`,
                "Total Revenue": `₹${item.totalRevenue.toFixed(2)}`,
                "Date": new Date(date).toLocaleDateString(),
            }));
            filename = `item_wise_details_${date}.xlsx`;
            break;
        default:
            data = currentOrders.flatMap((order) => {
                const settings = JSON.parse(localStorage.getItem("billingSettings")) || {
                    enableGST: false,
                    gstPercentage: 5,
                    gstNumber: ""
                };
                const orderSubtotal = parseFloat(order.subtotal);
                const gstAmount = settings.enableGST && order.gst ? parseFloat(order.gst.totalGST) : 0;
                const totalWithGST = orderSubtotal + gstAmount;

                const baseRow = {
                    "Bill Number": order.billNumber || "N/A",
                    "Table": order.table,
                    "Date": new Date(order.timestamp).toLocaleString(),
                    "Payment Method": order.payment.method,
                    ...(order.payment.method === "Credit"
                        ? {
                              "Creditor Name": order.payment.creditor.name,
                              "Creditor Mobile": order.payment.creditor.mobile,
                              "Credit Paid": order.payment.creditor.paid ? "Yes" : "No",
                          }
                        : {}),
                    "Subtotal": `₹${orderSubtotal.toFixed(2)}`,
                    ...(settings.enableGST && order.gst ? {
                        "GST Percentage": `${order.gst.percentage}%`,
                        "GST Amount": `₹${gstAmount.toFixed(2)}`,
                        "CGST": `₹${parseFloat(order.gst.cgst).toFixed(2)}`,
                        "SGST": `₹${parseFloat(order.gst.sgst).toFixed(2)}`,
                    } : {}),
                    "Grand Total": `₹${totalWithGST.toFixed(2)}`,
                };
                return order.items.map((item, index) => ({
                    ...baseRow,
                    "Item Name": item.name,
                    "Item Code": item.code,
                    "Item Price": `₹${item.price.toFixed(2)}`,
                    "Quantity": item.qty,
                    "Item Total": `₹${(item.price * item.qty).toFixed(2)}`,
                    ...(index === 0
                        ? {}
                        : {
                              "Bill Number": "",
                              "Table": "",
                              "Date": "",
                              "Payment Method": "",
                              "Subtotal": "",
                              ...(settings.enableGST && order.gst ? {
                                  "GST Percentage": "",
                                  "GST Amount": "",
                                  "CGST": "",
                                  "SGST": "",
                              } : {}),
                              "Grand Total": "",
                              ...(order.payment.method === "Credit"
                                  ? {
                                        "Creditor Name": "",
                                        "Creditor Mobile": "",
                                        "Credit Paid": "",
                                    }
                                  : {}),
                          }),
                }));
            });
            filename = "order_history.xlsx";
            break;
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

// Event Listeners (assuming these elements exist in your reports.html)
document.addEventListener("DOMContentLoaded", function () {
    const applyFilterBtn = document.getElementById("applyFilter");
    const searchBillBtn = document.getElementById("searchBillBtn");
    const exportExcelBtn = document.getElementById("exportExcel");
    const filterType = document.getElementById("filterType");
    const searchBillInput = document.getElementById("searchBill");

    // Placeholder functions (you'll need to define these in your full code)
    function applyFilter(type) {
        console.log(`Applying filter: ${type}`); // Replace with actual filter logic
    }

    function displayOrders(orders) {
        console.log("Displaying orders:", orders); // Replace with actual display logic
    }

    const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];

    if (applyFilterBtn) {
        applyFilterBtn.addEventListener("click", () => applyFilter(filterType.value));
    }
    if (searchBillBtn && searchBillInput) {
        searchBillBtn.addEventListener("click", () => {
            const billNumber = searchBillInput.value.trim();
            if (billNumber) {
                const filteredOrders = orderHistory.filter(
                    (order) => order.billNumber === billNumber
                );
                displayOrders(filteredOrders);
            } else {
                displayOrders(orderHistory);
            }
        });
    }
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener("click", exportToExcel);
    }
    if (filterType) {
        filterType.addEventListener("change", () => {
            // Placeholder for updateFilterInputs (define this in your full code)
            console.log("Filter type changed:", filterType.value);
            applyFilter(filterType.value);
        });
    }
});
document.addEventListener("DOMContentLoaded", function() {
    if (typeof setupSettings === "function") {
        setupSettings();
    } else {
        console.error("setupSettings function not found!");
    }
});

function setupSettings() {
    const gstSettingsForm = document.getElementById("gstSettingsForm");
    const enableGSTCheckbox = document.getElementById("enableGST");
    const gstPercentageInput = document.getElementById("gstPercentage");
    const gstNumberInput = document.getElementById("gstNumber");
    const gstDetails = document.querySelectorAll(".gst-details");

    // Load existing settings
    const settings = JSON.parse(localStorage.getItem("billingSettings")) || {
        enableGST: false,
        gstPercentage: 5,
        gstNumber: ""
    };

    // Apply settings
    enableGSTCheckbox.checked = settings.enableGST;
    gstPercentageInput.value = settings.gstPercentage;
    gstNumberInput.value = settings.gstNumber;

    updateGSTFields(settings.enableGST);

    // Enable/disable GST fields based on checkbox change
    enableGSTCheckbox.addEventListener("change", () => {
        const isEnabled = enableGSTCheckbox.checked;
        updateGSTFields(isEnabled);

        // Save instantly when changed
        saveGSTSettings();
    });

    // Save settings on form submit
    gstSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        saveGSTSettings();
        alert("Settings saved successfully!");
    });

    function updateGSTFields(isEnabled) {
        gstDetails.forEach(detail => detail.style.display = isEnabled ? "block" : "none");
        gstPercentageInput.disabled = !isEnabled;
        gstNumberInput.disabled = !isEnabled;
    }

    function saveGSTSettings() {
        const newSettings = {
            enableGST: enableGSTCheckbox.checked,
            gstPercentage: parseFloat(gstPercentageInput.value) || 5,
            gstNumber: gstNumberInput.value.trim()
        };
        localStorage.setItem("billingSettings", JSON.stringify(newSettings));
    }
}

// Function to display daily reports
function displayDailyReports(reports) {
    const reportList = document.getElementById("reportList");
    if (!reportList) {
        console.error("reportList element not found!");
        return;
    }

    if (reports.length === 0) {
        reportList.innerHTML = `<div class="no-data">No daily reports found.</div>`;
        return;
    }

    // Calculate totals
    const totalDailyAmount = reports
        .reduce((sum, report) => sum + (parseFloat(report.totalSales) || 0), 0)
        .toFixed(2);
    const totalDailyReports = reports.length;
    const avgDailySales = totalDailyReports > 0 ? (totalDailyAmount / totalDailyReports).toFixed(2) : "0.00";

    // Count items sold
    const itemQuantities = {};
    reports.forEach((report) => {
        Object.entries(report.itemsSold || {}).forEach(([item, qty]) => {
            itemQuantities[item] = (itemQuantities[item] || 0) + qty;
        });
    });

    // Get most sold item
    const mostSoldItem = Object.keys(itemQuantities).length
        ? Object.entries(itemQuantities).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : "N/A";

    // Render the reports
    reportList.innerHTML = `
        <div class="report-summary modern-summary">
            <div class="summary-item">
                <span class="summary-label">Total Daily Sales</span>
                <span class="summary-value">$${totalDailyAmount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Days</span>
                <span class="summary-value">${totalDailyReports}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Average Daily Sales</span>
                <span class="summary-value">$${avgDailySales}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Most Sold Item</span>
                <span class="summary-value">${mostSoldItem}</span>
            </div>
        </div>
        <div class="report-grid">
            ${reports
                .map(
                    (report) => `
                <div class="report-card">
                    <div class="report-header">
                        <span class="report-title">Date: ${new Date(report.date).toLocaleDateString()}</span>
                    </div>
                    <div class="report-body">
                        <p><strong>Total Sales:</strong> $${report.totalSales}</p>
                        <p><strong>Items Sold:</strong> ${Object.entries(report.itemsSold || {})
                            .map(([item, qty]) => `${item} x${qty}`)
                            .join(", ")}</p>
                    </div>
                </div>`
                )
                .join("")}
        </div>
    `;
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(() => {
        console.log("Service Worker registered");
    }).catch(err => console.error("Service Worker registration failed:", err));
}
