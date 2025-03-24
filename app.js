// Login and Session Management
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
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

function checkSession() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const loginTime = localStorage.getItem("loginTime");
    if (!loggedInUser || !loginTime) {
        window.location.href = "index.html";
        return false;
    }

    const currentTime = Date.now();
    const sessionDuration = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    if (currentTime - loginTime > sessionDuration) {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("loginTime");
        window.location.href = "index.html";
        return false;
    }

    return true;
}

function updateTimer() {
    const loginTime = localStorage.getItem("loginTime");
    if (!loginTime) return;

    const currentTime = Date.now();
    const sessionDuration = 12 * 60 * 60 * 1000; // 12 hours
    const timeRemaining = sessionDuration - (currentTime - loginTime);
    if (timeRemaining <= 0) {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("loginTime");
        window.location.href = "index.html";
        return;
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    document.getElementById("timer").textContent = `${hours}h ${minutes}m ${seconds}s`;
}

function initializeSessionDependentFeatures() {
    if (window.location.pathname.includes("dashboard.html") || window.location.pathname.includes("tables.html") || window.location.pathname.includes("menu.html") || window.location.pathname.includes("reports.html")) {
        if (!checkSession()) return;

        document.getElementById("user").textContent = localStorage.getItem("loggedInUser");
        setInterval(updateTimer, 1000);
        updateTimer();

        document.getElementById("logoutBtn").addEventListener("click", () => {
            localStorage.removeItem("loggedInUser");
            localStorage.removeItem("loginTime");
            window.location.href = "index.html";
        });
    }
}
// Dashboard Functionality
let currentTable = null;

function loadTables() {
    const tables = JSON.parse(localStorage.getItem("tables")) || [];
    const tableList = document.getElementById("tableList");
    if (!tableList) return;

    tableList.innerHTML = tables.map(table => `
        <div class="table-card ${currentTable === table.name ? 'active' : ''}" onclick="selectTable('${table.name}')">
            <h3>${table.name}</h3>
            <p>Type: ${table.type}</p>
            <p>Status: ${localStorage.getItem(`order_${table.name}`) ? 'Occupied' : 'Free'}</p>
        </div>
    `).join("");
}

function selectTable(tableName) {
    currentTable = tableName;
    loadTables();
    loadOrder(tableName);
    const currentTableInfo = document.getElementById("currentTableInfo");
    const tables = JSON.parse(localStorage.getItem("tables")) || [];
    const table = tables.find(t => t.name === tableName);
    currentTableInfo.innerHTML = `
        <p><strong>Table:</strong> ${tableName} (${table.type})</p>
        <p><strong>Status:</strong> ${localStorage.getItem(`order_${tableName}`) ? 'Occupied' : 'Free'}</p>
    `;
}

function loadOrder(tableName) {
    const order = JSON.parse(localStorage.getItem(`order_${tableName}`)) || [];
    const orderList = document.getElementById("orderList");
    if (!orderList) return;

    const total = order.reduce((sum, item) => sum + item.price * item.qty, 0);
    orderList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Code</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${order.map((item, index) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.code}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>${item.qty}</td>
                        <td>$${(item.price * item.qty).toFixed(2)}</td>
                        <td><button class="btn btn-danger btn-small" onclick="removeItem(${index})">Remove</button></td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
        <p><strong>Grand Total:</strong> $${total.toFixed(2)}</p>
    `;
}

function removeItem(index) {
    if (!currentTable) return;
    const order = JSON.parse(localStorage.getItem(`order_${currentTable}`)) || [];
    order.splice(index, 1);
    localStorage.setItem(`order_${currentTable}`, JSON.stringify(order));
    loadOrder(currentTable);
    loadTables();
}

function loadMenuItems() {
    const menuItems = JSON.parse(localStorage.getItem("menuItems")) || [];
    const menuList = document.getElementById("menuList");
    if (!menuList) return;

    menuList.innerHTML = menuItems.map(item => `
        <div class="menu-item">
            <p>${item.name} (${item.code}) - $${item.price.toFixed(2)}</p>
        </div>
    `).join("");
}

document.getElementById("addItemForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentTable) {
        alert("Please select a table first!");
        return;
    }

    const itemCode = document.getElementById("itemCode").value.trim().toUpperCase();
    const qty = parseInt(document.getElementById("qty").value);
    const menuItems = JSON.parse(localStorage.getItem("menuItems")) || [];
    const item = menuItems.find(i => i.code === itemCode);

    if (!item) {
        alert("Item not found!");
        return;
    }
    if (isNaN(qty) || qty <= 0) {
        alert("Please enter a valid quantity!");
        return;
    }

    const order = JSON.parse(localStorage.getItem(`order_${currentTable}`)) || [];
    const existingItem = order.find(i => i.code === itemCode);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        order.push({ ...item, qty });
    }

    localStorage.setItem(`order_${currentTable}`, JSON.stringify(order));
    loadOrder(currentTable);
    loadTables();
    document.getElementById("addItemForm").reset();
});

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

document.addEventListener("keydown", (e) => {
    if (e.key === "PageUp") {
        printReceipt();
    }
});

if (window.location.pathname.includes("dashboard.html")) {
    loadTables();
    loadMenuItems();
}

// Tables Management
document.getElementById("addTableForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const tableName = document.getElementById("tableName").value.trim();
    const tableType = document.getElementById("tableType").value;

    if (!tableName) {
        alert("Table name is required!");
        return;
    }

    const tables = JSON.parse(localStorage.getItem("tables")) || [];
    if (tables.some(t => t.name === tableName)) {
        alert("Table name already exists!");
        return;
    }

    tables.push({ name: tableName, type: tableType });
    localStorage.setItem("tables", JSON.stringify(tables));
    loadTablesList();
    document.getElementById("addTableForm").reset();
});

function loadTablesList() {
    const tables = JSON.parse(localStorage.getItem("tables")) || [];
    const tableList = document.getElementById("tableList");
    if (!tableList) return;

    tableList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${tables.map((table, index) => `
                    <tr>
                        <td>${table.name}</td>
                        <td>${table.type}</td>
                        <td><button class="btn btn-danger btn-small" onclick="deleteTable(${index})">Delete</button></td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

window.deleteTable = function(index) {
    const tables = JSON.parse(localStorage.getItem("tables")) || [];
    const tableName = tables[index].name;
    if (localStorage.getItem(`order_${tableName}`)) {
        alert("Cannot delete table with active orders!");
        return;
    }
    tables.splice(index, 1);
    localStorage.setItem("tables", JSON.stringify(tables));
    loadTablesList();
};

if (window.location.pathname.includes("tables.html")) {
    loadTablesList();
}

// Menu Management
document.getElementById("addMenuItemForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const itemCode = document.getElementById("itemCode").value.trim().toUpperCase();
    const itemName = document.getElementById("itemName").value.trim();
    const itemPrice = parseFloat(document.getElementById("itemPrice").value);

    if (!itemCode || !itemName || isNaN(itemPrice) || itemPrice <= 0) {
        alert("Please fill all fields with valid data!");
        return;
    }

    const menuItems = JSON.parse(localStorage.getItem("menuItems")) || [];
    if (menuItems.some(item => item.code === itemCode)) {
        alert("Item code already exists!");
        return;
    }

    menuItems.push({ code: itemCode, name: itemName, price: itemPrice });
    localStorage.setItem("menuItems", JSON.stringify(menuItems));
    loadMenuItemsList();
    document.getElementById("addMenuItemForm").reset();
});

function loadMenuItemsList() {
    const menuItems = JSON.parse(localStorage.getItem("menuItems")) || [];
    const menuList = document.getElementById("menuList");
    if (!menuList) return;

    menuList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${menuItems.map((item, index) => `
                    <tr>
                        <td>${item.code}</td>
                        <td>${item.name}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td><button class="btn btn-danger btn-small" onclick="deleteMenuItem(${index})">Delete</button></td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

window.deleteMenuItem = function(index) {
    const menuItems = JSON.parse(localStorage.getItem("menuItems")) || [];
    menuItems.splice(index, 1);
    localStorage.setItem("menuItems", JSON.stringify(menuItems));
    loadMenuItemsList();
};

if (window.location.pathname.includes("menu.html")) {
    loadMenuItemsList();
}

// Reports Functionality
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
        console.error("Missing elements:", {
            reportList: !!reportList,
            filterType: !!filterType,
            filterInputs: !!filterInputs,
            applyFilterBtn: !!applyFilterBtn,
            searchBillInput: !!searchBillInput,
            searchBillBtn: !!searchBillBtn,
            exportExcelBtn: !!exportExcelBtn
        });
        if (reportList) reportList.innerHTML = "<p>Error: Required elements missing in reports.html. Check console for details.</p>";
        return;
    }

    let currentOrders = [...orderHistory];
    let currentDailyReports = [...dailyReports];

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
                    <p><strong>Payment Method:</strong> ${order.payment.method}${order.payment.method === "Credit" ? ` (Creditor: ${order.payment.creditor.name}, Mobile: ${order.payment.creditor.mobile}, Paid: ${order.payment.creditor.paid ? "Yes" : "No"})` : ""}</p>
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

    function displayCreditors() {
        const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
        const unpaidCredits = orderHistory.filter(order => order.payment.method === "Credit" && !order.payment.creditor.paid);
        const allCredits = orderHistory.filter(order => order.payment.method === "Credit");

        if (allCredits.length === 0) {
            reportList.innerHTML = `<p>No creditor records found.</p>`;
            return;
        }

        const totalUnpaidAmount = unpaidCredits.reduce((sum, order) => sum + parseFloat(order.payment.creditor.remainingAmount || order.total), 0).toFixed(2);
        const totalPaidAmount = allCredits.reduce((sum, order) => sum + (order.payment.creditor.paymentHistory || []).reduce((ps, p) => ps + parseFloat(p.amount), 0), 0).toFixed(2);

        reportList.innerHTML = `
            <div class="report-summary">
                <p><strong>Total Unpaid Amount:</strong> $${totalUnpaidAmount}</p>
                <p><strong>Total Unpaid Creditors:</strong> ${unpaidCredits.length}</p>
                <p><strong>Total Paid Amount:</strong> $${totalPaidAmount}</p>
            </div>
            <h3>Unpaid Credits</h3>
            ${unpaidCredits.length > 0 ? unpaidCredits.map((order, index) => `
                <div class="report-item creditor-item">
                    <p><strong>Bill Number:</strong> ${order.billNumber}</p>
                    <p><strong>Creditor:</strong> ${order.payment.creditor.name}</p>
                    <p><strong>Mobile:</strong> ${order.payment.creditor.mobile}</p>
                    <p><strong>Total Amount:</strong> $${order.total}</p>
                    <p><strong>Remaining Amount:</strong> $${order.payment.creditor.remainingAmount || order.total}</p>
                    <p><strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
                    ${order.payment.creditor.paymentHistory && order.payment.creditor.paymentHistory.length > 0 ? `
                        <p><strong>Payment History:</strong></p>
                        <ul>
                            ${order.payment.creditor.paymentHistory.map(payment => `
                                <li>$${payment.amount} on ${new Date(payment.timestamp).toLocaleString()}</li>
                            `).join("")}
                        </ul>
                    ` : ""}
                    <button class="btn btn-success btn-small" onclick="markCreditPaid('${order.billNumber}')">Mark Paid</button>
                    <hr>
                </div>`).join("") : "<p>No unpaid credits.</p>"}
            <h3>All Credit Payment History</h3>
            ${allCredits.length > 0 ? allCredits.map(order => `
                <div class="report-item">
                    <p><strong>Bill Number:</strong> ${order.billNumber}</p>
                    <p><strong>Creditor:</strong> ${order.payment.creditor.name}</p>
                    <p><strong>Total Amount:</strong> $${order.total}</p>
                    ${order.payment.creditor.paymentHistory && order.payment.creditor.paymentHistory.length > 0 ? `
                        <p><strong>Payments:</strong></p>
                        <ul>
                            ${order.payment.creditor.paymentHistory.map(payment => `
                                <li>$${payment.amount} on ${new Date(payment.timestamp).toLocaleString()}</li>
                            `).join("")}
                        </ul>
                    ` : "<p>No payments recorded.</p>"}
                    <hr>
                </div>`).join("") : "<p>No credit payments recorded.</p>"}
        `;
    }

    window.deleteOrder = function(index) {
        if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
            let allOrders = JSON.parse(localStorage.getItem("orderHistory")) || [];
            allOrders.splice(index, 1);
            localStorage.setItem("orderHistory", JSON.stringify(allOrders));
            applyFilter(filterType.value);
        }
    };

    window.markCreditPaid = function(billNumber) {
        let allOrders = JSON.parse(localStorage.getItem("orderHistory")) || [];
        const orderIndex = allOrders.findIndex(o => o.billNumber === billNumber);
        if (orderIndex === -1) {
            alert("Order not found!");
            return;
        }

        const order = allOrders[orderIndex];
        if (order.payment.method !== "Credit") {
            alert("This order is not a credit order!");
            return;
        }

        console.log("Before payment:", JSON.parse(JSON.stringify(order)));

        const remainingAmount = parseFloat(order.payment.creditor.remainingAmount || order.total);

        const modal = document.createElement("div");
        modal.innerHTML = `
            <div class="payment-modal-overlay">
                <div class="payment-modal">
                    <h2>Record Payment for ${order.payment.creditor.name}</h2>
                    <p><strong>Bill Number:</strong> ${billNumber}</p>
                    <p><strong>Total Amount:</strong> $${order.total}</p>
                    <p><strong>Remaining Amount:</strong> $${remainingAmount}</p>
                    <div class="payment-input">
                        <input type="number" id="paymentAmount" placeholder="Enter amount paid" step="0.01" min="0" max="${remainingAmount}">
                    </div>
                    <button id="confirmPayment" class="btn btn-primary" disabled>Confirm Payment</button>
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
            }
            .btn-primary:hover {
                background: #0056b3;
            }
            .btn-secondary {
                background: #6c757d;
                color: #fff;
                margin-left: 10px;
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
        document.head.appendChild(style);

        const paymentAmountInput = modal.querySelector("#paymentAmount");
        const confirmBtn = modal.querySelector("#confirmPayment");
        const cancelBtn = modal.querySelector("#cancelPayment");

        paymentAmountInput.addEventListener("input", () => {
            const amount = parseFloat(paymentAmountInput.value);
            confirmBtn.disabled = !amount || amount <= 0 || amount > remainingAmount;
        });

        confirmBtn.addEventListener("click", () => {
            const paidAmount = parseFloat(paymentAmountInput.value);
            if (isNaN(paidAmount) || paidAmount <= 0 || paidAmount > remainingAmount) {
                alert("Invalid amount entered!");
                return;
            }

            if (!order.payment.creditor.paymentHistory) {
                order.payment.creditor.paymentHistory = [];
            }

            order.payment.creditor.paymentHistory.push({
                amount: paidAmount.toFixed(2),
                timestamp: new Date().toISOString()
            });

            const newRemaining = remainingAmount - paidAmount;
            order.payment.creditor.remainingAmount = newRemaining.toFixed(2);

            if (newRemaining <= 0) {
                order.payment.creditor.paid = true;
            }

            console.log("After payment:", JSON.parse(JSON.stringify(order)));
            localStorage.setItem("orderHistory", JSON.stringify(allOrders));
            console.log("Saved to localStorage:", JSON.parse(localStorage.getItem("orderHistory")));
            displayCreditors();
            document.body.removeChild(modal);
        });

        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
    };

    function applyFilter(type) {
        let orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
        let filteredOrders = [...orderHistory];
        let filteredDailyReports = [...dailyReports];

        switch (type) {
            case "day":
                const day = document.getElementById("filterDay")?.value;
                if (day) {
                    filteredOrders = filteredOrders.filter(order => 
                        new Date(order.date).toISOString().split('T')[0] === day
                    );
                    displayOrders(filteredOrders);
                } else {
                    displayOrders(orderHistory);
                }
                break;
            case "month":
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
                break;
            case "range":
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
                data = currentDailyReports.map(report => ({
                    Date: new Date(report.date).toLocaleDateString(),
                    "Total Sales": report.totalSales,
                    "Items Sold": Object.entries(report.itemsSold).map(([item, qty]) => `${item} x${qty}`).join(", ")
                }));
                filename = "daily_reports.xlsx";
                break;
            case "creditors":
                const allCredits = orderHistory.filter(order => order.payment.method === "Credit");
                data = allCredits.map(order => ({
                    "Bill Number": order.billNumber,
                    "Creditor Name": order.payment.creditor.name,
                    "Mobile": order.payment.creditor.mobile,
                    "Total Amount": order.total,
                    "Remaining Amount": order.payment.creditor.paid ? "0.00" : (order.payment.creditor.remainingAmount || order.total),
                    "Paid": order.payment.creditor.paid ? "Yes" : "No",
                    "Payment History": order.payment.creditor.paymentHistory ? order.payment.creditor.paymentHistory.map(p => `$${p.amount} on ${new Date(p.timestamp).toLocaleString()}`).join("; ") : "N/A",
                    "Date": new Date(order.timestamp).toLocaleString()
                }));
                filename = "creditors.xlsx";
                break;
            default:
                data = currentOrders.flatMap(order => {
                    const baseRow = {
                        "Bill Number": order.billNumber || "N/A",
                        Table: order.table,
                        Date: new Date(order.timestamp).toLocaleString(),
                        "Payment Method": order.payment.method,
                        ...(order.payment.method === "Credit" ? {
                            "Creditor Name": order.payment.creditor.name,
                            "Creditor Mobile": order.payment.creditor.mobile,
                            "Credit Paid": order.payment.creditor.paid ? "Yes" : "No"
                        } : {}),
                        "Grand Total": order.total
                    };
                    return order.items.map((item, index) => ({
                        ...baseRow,
                        "Item Name": item.name,
                        "Item Code": item.code,
                        "Item Price": item.price.toFixed(2),
                        "Quantity": item.qty,
                        "Item Total": (item.price * item.qty).toFixed(2),
                        ...(index === 0 ? {} : { 
                            "Bill Number": "", 
                            Table: "", 
                            Date: "", 
                            "Payment Method": "", 
                            "Grand Total": "", 
                            ...(order.payment.method === "Credit" ? { "Creditor Name": "", "Creditor Mobile": "", "Credit Paid": "" } : {}) 
                        })
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
            const filteredOrders = orderHistory.filter(order => order.billNumber === billNumber);
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

if (window.location.pathname.includes("reports.html")) {
    loadReports();
}
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(() => {
        console.log("Service Worker registered");
    }).catch(err => console.error("Service Worker registration failed:", err));
}
