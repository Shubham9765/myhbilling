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

    const total = currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
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
            Bill Number: ${billNumber}
            Table: ${currentTable}
            Date: ${new Date().toLocaleString()}
            Payment Method: ${paymentDetails.method}${paymentDetails.method === "Credit" ? ` (Creditor: ${paymentDetails.creditor.name})` : ""}
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
            default:
                filterInputs.innerHTML = "";
                break;
        }
    }

    function calculateSummary(orders) {
        const totalAmount = orders
            .reduce((sum, order) => sum + parseFloat(order.total), 0)
            .toFixed(2);
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
            ${orders
                .map(
                    (order, index) => `
                <div class="report-item">
                    <p><strong>Bill Number:</strong> ${order.billNumber || "N/A"}</p>
                    <p><strong>Table:</strong> ${order.table}</p>
                    <p><strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
                    <p><strong>Items:</strong> ${order.items
                        .map(
                            (item) =>
                                `${item.name} (${item.code}) x${item.qty} - $${(
                                    item.price * item.qty
                                ).toFixed(2)}`
                        )
                        .join(", ")}</p>
                    <p><strong>Total:</strong> $${order.total}</p>
                    <p><strong>Payment Method:</strong> ${
                        order.payment.method
                    }${
                        order.payment.method === "Credit"
                            ? ` (Creditor: ${order.payment.creditor.name}, Mobile: ${
                                  order.payment.creditor.mobile
                              }, Paid: ${order.payment.creditor.paid ? "Yes" : "No"})`
                            : ""
                    }</p>
                    <button class="btn btn-danger btn-small delete-btn" onclick="deleteOrder(${index})">Delete</button>
                    <hr>
                </div>`
                )
                .join("")}
        `;
    }

    function displayDailyReports(reports) {
        currentDailyReports = reports;
        if (reports.length === 0) {
            reportList.innerHTML = `<p>No daily reports found.</p>`;
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
            <div class="report-summary">
                <p><strong>Total Daily Sales:</strong> $${totalDailyAmount}</p>
                <p><strong>Total Days:</strong> ${totalDailyReports}</p>
                <p><strong>Average Daily Sales:</strong> $${avgDailySales}</p>
                <p><strong>Most Sold Item:</strong> ${mostSoldItem}</p>
            </div>
            ${reports
                .map(
                    (report) => `
                <div class="report-item">
                    <p><strong>Date:</strong> ${new Date(report.date).toLocaleDateString()}</p>
                    <p><strong>Total Sales:</strong> $${report.totalSales}</p>
                    <p><strong>Items Sold:</strong> ${Object.entries(report.itemsSold)
                        .map(([item, qty]) => `${item} x${qty}`)
                        .join(", ")}</p>
                    <hr>
                </div>`
                )
                .join("")}
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
            reportList.innerHTML = `<p>No creditor records found.</p>`;
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
            <div class="report-summary">
                <p><strong>Total Unpaid Amount:</strong> $${totalUnpaidAmount}</p>
                <p><strong>Total Unpaid Creditors:</strong> ${unpaidCredits.length}</p>
                <p><strong>Total Paid Amount:</strong> $${totalPaidAmount}</p>
            </div>
            <h3>Unpaid Credits</h3>
            <div class="creditor-search">
                <input type="text" id="creditorSearch" placeholder="Search by Creditor Name" value="${creditorSearchQuery}">
            </div>
            ${
                filteredUnpaidCredits.length > 0
                    ? filteredUnpaidCredits
                          .map(
                              (order, index) => `
                <div class="report-item creditor-item">
                    <p><strong>Bill Number:</strong> ${order.billNumber}</p>
                    <p><strong>Creditor:</strong> ${order.payment.creditor.name}</p>
                    <p><strong>Mobile:</strong> ${order.payment.creditor.mobile}</p>
                    <p><strong>Total Amount:</strong> $${order.total}</p>
                    <p><strong>Remaining Amount:</strong> $${
                        order.payment.creditor.remainingAmount || order.total
                    }</p>
                    <p><strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
                    <button class="btn btn-success btn-small" onclick="markCreditPaid('${
                        order.billNumber
                    }')">Mark Paid</button>
                    <hr>
                </div>`
                          )
                          .join("")
                    : "<p>No unpaid credits matching the search.</p>"
            }
            <h3>Credit Payment History</h3>
            ${
                paidCredits.length > 0
                    ? paidCredits
                          .map(
                              (order) => `
                <div class="report-item">
                    <p><strong>Bill Number:</strong> ${order.billNumber}</p>
                    <p><strong>Creditor:</strong> ${order.payment.creditor.name}</p>
                    <p><strong>Total Amount:</strong> $${order.total}</p>
                    <p><strong>Payments:</strong></p>
                    <ul>
                        ${order.payment.creditor.paymentHistory
                            .map(
                                (payment) => `
                            <li>$${payment.amount} on ${new Date(
                                payment.timestamp
                            ).toLocaleString()}</li>
                        `
                            )
                            .join("")}
                    </ul>
                    <hr>
                </div>`
                          )
                          .join("")
                    : "<p>No credit payments recorded.</p>"
            }
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
                    <p><strong>Total Amount:</strong> $${order.total}</p>
                    <p><strong>Remaining Amount:</strong> $${remainingAmount.toFixed(2)}</p>
                    <div class="payment-input">
                        <input type="number" id="paymentAmount" placeholder="Enter amount to pay" step="0.01" min="0" max="${remainingAmount}">
                    </div>
                    <button id="confirmPayment" class="btn btn-primary" disabled>Confirm Payment</button>
                    <button id="cancelPayment" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add CSS for the modal
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
            }
            .creditor-search input:focus {
                border-color: #007bff;
                outline: none;
            }
        `;
        document.head.appendChild(style);

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
                    `Confirm payment of $${paidAmount.toFixed(2)} for ${
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
                order.payment.creditor.paid = true;
            }

            // Save updated orderHistory
            allOrders[orderIndex] = order;
            localStorage.setItem("orderHistory", JSON.stringify(allOrders));
            displayCreditors(); // Refresh display
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
                        (order) => new Date(order.date).toISOString().split("T")[0] === day
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
                        const d = new Date(order.date);
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
                        const d = new Date(order.date);
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
            default:
                displayOrders(orderHistory);
                break;
        }
    }

    function exportToExcel() {
        const type = filterType.value;
        let data = [];
        let filename = "report";

        switch (type) {
            case "daily":
                data = currentDailyReports.map((report) => ({
                    Date: new Date(report.date).toLocaleDateString(),
                    "Total Sales": report.totalSales,
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
                    Mobile: order.payment.creditor.mobile,
                    "Total Amount": order.total,
                    "Remaining Amount": order.payment.creditor.paid
                        ? "0.00"
                        : order.payment.creditor.remainingAmount || order.total,
                    Paid: order.payment.creditor.paid ? "Yes" : "No",
                    "Payment History": order.payment.creditor.paymentHistory
                        ? order.payment.creditor.paymentHistory
                              .map(
                                  (p) =>
                                      `$${p.amount} on ${new Date(p.timestamp).toLocaleString()}`
                              )
                              .join("; ")
                        : "N/A",
                    Date: new Date(order.timestamp).toLocaleString(),
                }));
                filename = "creditors.xlsx";
                break;
            default:
                data = currentOrders.flatMap((order) => {
                    const baseRow = {
                        "Bill Number": order.billNumber || "N/A",
                        Table: order.table,
                        Date: new Date(order.timestamp).toLocaleString(),
                        "Payment Method": order.payment.method,
                        ...(order.payment.method === "Credit"
                            ? {
                                  "Creditor Name": order.payment.creditor.name,
                                  "Creditor Mobile": order.payment.creditor.mobile,
                                  "Credit Paid": order.payment.creditor.paid ? "Yes" : "No",
                              }
                            : {}),
                        "Grand Total": order.total,
                    };
                    return order.items.map((item, index) => ({
                        ...baseRow,
                        "Item Name": item.name,
                        "Item Code": item.code,
                        "Item Price": item.price.toFixed(2),
                        Quantity: item.qty,
                        "Item Total": (item.price * item.qty).toFixed(2),
                        ...(index === 0
                            ? {}
                            : {
                                  "Bill Number": "",
                                  Table: "",
                                  Date: "",
                                  "Payment Method": "",
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

    updateFilterInputs();
    displayOrders(orderHistory);

    applyFilterBtn.addEventListener("click", () => applyFilter(filterType.value));
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
    exportExcelBtn.addEventListener("click", exportToExcel);
    filterType.addEventListener("change", () => {
        updateFilterInputs();
        applyFilter(filterType.value);
    });
}
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(() => {
        console.log("Service Worker registered");
    }).catch(err => console.error("Service Worker registration failed:", err));
}
