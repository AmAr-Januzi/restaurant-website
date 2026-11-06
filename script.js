// ---------- Popup ----------

let popup = document.getElementById("popup");
let popupTimer = null;

function showPopup(title, message) {
    let popupTitle = document.getElementById("popup-title");
    let popupMessage = document.getElementById("popup-message");

    popupTitle.textContent = title;
    popupMessage.textContent = message;

    popup.classList.add("show");

    // Cancel the previous timer so a new popup gets its full 3 seconds
    clearTimeout(popupTimer);

    popupTimer = setTimeout(function () {
        popup.classList.remove("show");
    }, 3000);
}

document.getElementById("popup-close").addEventListener("click", function () {
    clearTimeout(popupTimer);
    popup.classList.remove("show");
});

// ---------- Cart ----------

let cart = loadCart();

function loadCart() {
    try {
        let saved = localStorage.getItem("foodhouse-cart");
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem("foodhouse-cart", JSON.stringify(cart));
    } catch (error) {
        // Storage not available (e.g. private mode) - cart still works for this visit
    }
}

function addToCart(name, price) {

    let food = cart.find(function (item) {
        return item.name === name;
    });

    if (food) {
        food.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }

    updateCart();

    showPopup("Added to Cart!", name + " was added to your cart.");
}

function changeQuantity(index, amount) {

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCart();
}

function removeFromCart(index) {

    cart.splice(index, 1);

    updateCart();
}

function updateCart() {

    let cartItems = document.getElementById("cart-items");
    let cartCount = document.getElementById("cart-count");
    let cartTotal = document.getElementById("cart-total");

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML =
            '<p class="empty-cart">Your cart is empty.</p>';
    }

    let total = 0;
    let count = 0;

    for (let i = 0; i < cart.length; i++) {

        let food = cart[i];

        total = total + food.price * food.quantity;
        count = count + food.quantity;

        let item = document.createElement("div");

        item.className = "cart-item";

        item.innerHTML = `
            <div>
                <h4>${food.name}</h4>
                <p>€${(food.price * food.quantity).toFixed(2)}</p>
            </div>

            <div class="cart-item-actions">
                <div class="quantity">
                    <button
                        class="quantity-button"
                        aria-label="Remove one ${food.name}"
                        onclick="changeQuantity(${i}, -1)">−</button>

                    <span>${food.quantity}</span>

                    <button
                        class="quantity-button"
                        aria-label="Add one ${food.name}"
                        onclick="changeQuantity(${i}, 1)">+</button>
                </div>

                <button
                    class="remove-button"
                    onclick="removeFromCart(${i})">
                    Remove
                </button>
            </div>
        `;
        cartItems.appendChild(item);
    }

    cartCount.textContent = count;

    cartTotal.textContent = total.toFixed(2);

    saveCart();
}

// ---------- Open / close cart ----------

let cartBox = document.getElementById("cart");
let cartOverlay = document.getElementById("cart-overlay");

function openCart() {
    cartBox.classList.add("open");
    cartOverlay.classList.add("show");
}

function closeCart() {
    cartBox.classList.remove("open");
    cartOverlay.classList.remove("show");
}

document.getElementById("cart-button").addEventListener("click", openCart);

document.getElementById("close-cart").addEventListener("click", closeCart);

cartOverlay.addEventListener("click", closeCart);

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeCart();
        closeMenu();
        closeCheckout();
    }
});

// ---------- Checkout ----------

let checkoutBox = document.getElementById("checkout");
let checkoutStep = document.getElementById("checkout-step");
let receiptStep = document.getElementById("receipt-step");
let checkoutForm = document.getElementById("checkout-form");

// Stops food names or customer input from being read as HTML
function escapeHTML(text) {
    let div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Fills a table body with the order rows and returns the total
function fillOrderTable(tableBody, items) {

    let total = 0;

    tableBody.innerHTML = "";

    for (let i = 0; i < items.length; i++) {

        let food = items[i];
        let lineTotal = food.price * food.quantity;

        total = total + lineTotal;

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(food.name)}</td>
            <td>${food.quantity}</td>
            <td>€${food.price.toFixed(2)}</td>
            <td>€${lineTotal.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    }

    return total;
}

function openCheckout() {

    let total = fillOrderTable(document.getElementById("checkout-items"), cart);

    document.getElementById("checkout-total").textContent = total.toFixed(2);

    checkoutStep.style.display = "block";
    receiptStep.style.display = "none";

    closeCart();

    checkoutBox.classList.add("show");
    document.body.classList.add("no-scroll");

    document.getElementById("customer-name").focus();
}

function closeCheckout() {
    checkoutBox.classList.remove("show");
    document.body.classList.remove("no-scroll");
}

function showReceipt() {

    let payment = checkoutForm.querySelector('input[name="payment"]:checked').value;
    let notes = document.getElementById("customer-notes").value.trim();

    document.getElementById("receipt-number").textContent =
        "FH-" + Date.now().toString().slice(-6);

    document.getElementById("receipt-date").textContent =
        new Date().toLocaleString();

    document.getElementById("receipt-name").textContent =
        document.getElementById("customer-name").value.trim();

    document.getElementById("receipt-phone").textContent =
        document.getElementById("customer-phone").value.trim();

    document.getElementById("receipt-address").textContent =
        document.getElementById("customer-address").value.trim();

    document.getElementById("receipt-payment").textContent = payment;

    document.getElementById("receipt-notes").textContent = notes;
    document.getElementById("receipt-notes-row").style.display = notes ? "block" : "none";

    let total = fillOrderTable(document.getElementById("receipt-items"), cart);

    document.getElementById("receipt-total").textContent = total.toFixed(2);

    checkoutStep.style.display = "none";
    receiptStep.style.display = "block";
}

document.getElementById("checkout-button").addEventListener("click", function () {

    if (cart.length === 0) {
        showPopup("Cart is Empty", "Please add some food first.");
    } else {
        openCheckout();
    }
});

checkoutForm.addEventListener("submit", function (event) {

    // Stop the page from reloading - the browser has already checked the required fields
    event.preventDefault();

    showReceipt();

    cart = [];

    updateCart();

    checkoutForm.reset();

    showPopup("Order Complete!", "Thank you for your order!");
});

document.getElementById("back-to-cart").addEventListener("click", function () {
    closeCheckout();
    openCart();
});

document.getElementById("close-checkout").addEventListener("click", closeCheckout);

document.getElementById("done-button").addEventListener("click", closeCheckout);

// The browser's print window also has "Save as PDF"
document.getElementById("print-receipt").addEventListener("click", function () {
    window.print();
});

// Clicking the dark background closes the checkout
checkoutBox.addEventListener("click", function (event) {
    if (event.target === checkoutBox) {
        closeCheckout();
    }
});

// ---------- Mobile menu ----------

let menuToggle = document.getElementById("menu-toggle");
let navLinks = document.getElementById("nav-links");

function closeMenu() {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    menuToggle.textContent = "☰";
}

menuToggle.addEventListener("click", function () {

    let isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menuToggle.textContent = isOpen ? "✕" : "☰";
});

// Close the menu after choosing a link
navLinks.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
        closeMenu();
    }
});

// ---------- Start ----------

document.getElementById("year").textContent = new Date().getFullYear();

updateCart();
