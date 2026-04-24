// Clave del carrito compartida con el catalogo.
const CART_KEY = "sabbyshopp-cart";

// Referencias a los elementos de la interfaz de pago.
const orderItems = document.getElementById("orderItems");
const subtotalValue = document.getElementById("subtotalValue");
const shippingValue = document.getElementById("shippingValue");
const totalValue = document.getElementById("totalValue");
const paymentForm = document.getElementById("paymentForm");
const paymentMessage = document.getElementById("paymentMessage");
const cardFields = document.getElementById("cardFields");
const walletFields = document.getElementById("walletFields");
const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');

// Se cargan los productos seleccionados y se define un costo fijo de envio.
const cart = getCart();
const shippingCost = 12000; // en COP (corregido)

// Proteccion basica: si no hay carrito, no tiene sentido entrar al checkout.
if (!cart.length) {
    window.location.href = "index.html";
}

// Se renderiza el resumen inicial y se muestran los campos del metodo por defecto.
renderOrderSummary();
updatePaymentFields();

// Cada cambio de metodo adapta el formulario visible.
paymentMethodInputs.forEach((input) => {
    input.addEventListener("change", updatePaymentFields);
});

// Al enviar el formulario se valida, se limpia el carrito y se simula el pago exitoso.
paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const method = getSelectedMethod();

    if (!validatePayment(method)) return;

    localStorage.removeItem(CART_KEY);

    paymentMessage.textContent = "Pago aprobado en modo demo. Tu pedido fue registrado correctamente.";
    paymentMessage.className = "payment-message success";

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1800);
});

// Recupera el carrito desde localStorage y normaliza su estructura.
function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
    } catch {
        return [];
    }
}

// Dibuja el resumen del pedido y calcula subtotal, envio y total.
function renderOrderSummary() {
    orderItems.innerHTML = "";

    let subtotal = 0;

    cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const article = document.createElement("article");
        article.className = "order-item";
        article.innerHTML = `
            <img src="${item.image}" alt="${escapeHtml(item.title)}">
            <div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>Cantidad: ${item.quantity}</p>
            </div>
            <strong>${formatCurrency(itemTotal)}</strong>
        `;
        orderItems.appendChild(article);
    });

    const total = subtotal + shippingCost;

    subtotalValue.textContent = formatCurrency(subtotal);
    shippingValue.textContent = formatCurrency(shippingCost);
    totalValue.textContent = formatCurrency(total);
}

// Detecta el metodo de pago actualmente seleccionado.
function getSelectedMethod() {
    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    return selected ? selected.value : "mastercard";
}

// Alterna entre campos de tarjeta y campos de billetera digital.
function updatePaymentFields() {
    const method = getSelectedMethod();
    const isWallet = method === "nequi";

    cardFields.classList.toggle("hidden", isWallet);
    walletFields.classList.toggle("hidden", !isWallet);

    paymentMessage.textContent = "";
    paymentMessage.className = "payment-message";
}

// Ejecuta validaciones diferentes segun el metodo de pago.
function validatePayment(method) {
    if (method === "nequi") {
        const phone = document.getElementById("walletPhone").value.trim();
        const documentValue = document.getElementById("walletDocument").value.trim();

        if (!phone || !documentValue) {
            return showError("Completa los datos de Nequi.");
        }

        return true;
    }

    const cardName = document.getElementById("cardName").value.trim();
    const cardNumber = document.getElementById("cardNumber").value.trim();
    const cardExpiry = document.getElementById("cardExpiry").value.trim();
    const cardCvv = document.getElementById("cardCvv").value.trim();

    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        return showError("Completa todos los datos.");
    }

    if (cardNumber.replace(/\s/g, "").length < 16) {
        return showError("Tarjeta inválida.");
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        return showError("Formato MM/AA.");
    }

    if (cardCvv.length < 3) {
        return showError("CVV inválido.");
    }

    return true;
}

// Centraliza la presentacion de errores del formulario.
function showError(message) {
    paymentMessage.textContent = message;
    paymentMessage.className = "payment-message error";
    return false;
}

// 🔥 CORRECCIÓN CLAVE AQUÍ
function normalizeCartItem(item) {
    return {
        title: String(item?.title || "").trim(),
        image: String(item?.image || ""),
        price: Number(item?.price) || 0, // ← ahora SIEMPRE usa el del carrito
        quantity: Number(item?.quantity) > 0 ? Number(item.quantity) : 1
    };
}

// Formatea montos en pesos colombianos.
function formatCurrency(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0
    }).format(value);
}

// Escapa caracteres especiales antes de insertar texto en HTML.
function escapeHtml(value) {
    const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return value.replace(/[&<>"']/g, (c) => replacements[c]);
}
