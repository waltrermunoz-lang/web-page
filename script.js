// Claves usadas para guardar sesion y carrito en el navegador.
const AUTH_KEY = "sabbyshopp-auth";
const CART_KEY = "sabbyshopp-cart";

// Referencias a los elementos del DOM que el script necesita manipular.
const elements = {
    userName: document.getElementById("userName"),
    cartCount: document.getElementById("cartCount"),
    heroProducts: document.getElementById("heroProducts"),
    heroCategories: document.getElementById("heroCategories"),
    results: document.getElementById("results"),
    statusMessage: document.getElementById("statusMessage"),
    search: document.getElementById("search"),
    category: document.getElementById("category"),
    openCart: document.getElementById("openCart"),
    closeCart: document.getElementById("closeCart"),
    cartDrawer: document.getElementById("cartDrawer"),
    cartOverlay: document.getElementById("cartOverlay"),
    cartItems: document.getElementById("cartItems"),
    cartTotal: document.getElementById("cartTotal"),
    logoutButton: document.getElementById("logoutButton"),
    pagosButton: document.getElementById("pagosButton"),
    productCards: Array.from(document.querySelectorAll(".product-grid .card"))
};

// Se recupera la sesion y, si no existe, se protege la ruta redirigiendo al login.
const auth = getAuth();

if (!auth?.isLoggedIn) {
    window.location.href = "login.html";
}

// Estado principal de la pagina: productos leidos desde el HTML y carrito persistido.
let products = [];
let cart = getCart();

// Punto de arranque de la aplicacion.
init();

// Inicializa la interfaz, vincula eventos y sincroniza los datos visibles.
function init() {
    if (elements.userName) {
        elements.userName.textContent = auth.user || "Usuario";
    }

    bindUi();
    products = getProductsFromMarkup();
    populateCategories(products);
    enhanceProductCards();
    updateHeroStats(products);
    updateResults(products.length);
    updateCart();
    setStatus("Catalogo listo. Puedes agregar productos al carrito.");
}

// Conecta botones, filtros y atajos de teclado con sus acciones.
function bindUi() {
    if (elements.search) {
        elements.search.addEventListener("input", filterProducts);
    }

    if (elements.category) {
        elements.category.addEventListener("change", filterProducts);
    }

    if (elements.openCart) {
        elements.openCart.addEventListener("click", () => toggleCart(true));
    }

    if (elements.closeCart) {
        elements.closeCart.addEventListener("click", () => toggleCart(false));
    }

    if (elements.cartOverlay) {
        elements.cartOverlay.addEventListener("click", () => toggleCart(false));
    }

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener("click", logout);
    }

    if (elements.pagosButton) {
        elements.pagosButton.addEventListener("click", goToPagos);
    }

    document.addEventListener("keydown", handleEscapeKey);
}

// Convierte las tarjetas escritas en HTML en objetos JavaScript reutilizables.
function getProductsFromMarkup() {
    // Como el catalogo es fijo en HTML, se asigna manualmente una categoria por posicion.
    const categoryMap = [
        "men's clothing",
        "men's clothing",
        "men's clothing",
        "men's clothing",
        "jewelery",
        "jewelery",
        "jewelery",
        "jewelery",
        "electronics",
        "electronics",
        "electronics",
        "electronics",
        "electronics",
        "electronics",
        "women's clothing",
        "women's clothing",
        "women's clothing",
        "women's clothing",
        "women's clothing",
        "women's clothing"
    ];

    return elements.productCards.map((card, index) => {
        const title = card.querySelector(".card-title")?.textContent.trim() || `Producto ${index + 1}`;
        const image = card.querySelector("img")?.getAttribute("src") || "";
        const rawPrice = card.querySelector(".card-price")?.value || "";
        const category = categoryMap[index] || "general";

        return {
            id: index + 1,
            title,
            image,
            category,
            price: parsePrice(rawPrice),
            card
        };
    });
}

// Llena el select de categorias a partir de los productos detectados.
function populateCategories(items) {
    if (!elements.category) {
        return;
    }

    const categories = [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b));
    elements.category.innerHTML = '<option value="all">Todas</option>';

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = capitalize(category);
        elements.category.appendChild(option);
    });
}

// Activa el boton de cada tarjeta para agregar productos al carrito.
function enhanceProductCards() {
    products.forEach((product) => {
        const button = product.card.querySelector(".btn-agregar-carrito");
        if (!button) return;

        button.addEventListener("click", () => addToCart(product.id));
    });
}

// Convierte precios como "109.000" en numeros utilizables para operaciones.
function parsePrice(value) {
    const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

// Filtra productos por texto y categoria, y actualiza la vista del catalogo.
function filterProducts() {
    const searchValue = elements.search ? elements.search.value.trim().toLowerCase() : "";
    const categoryValue = elements.category ? elements.category.value : "all";

    const filtered = products.filter((product) => {
        const matchesText = product.title.toLowerCase().includes(searchValue);
        const matchesCategory = categoryValue === "all" || product.category === categoryValue;
        const isVisible = matchesText && matchesCategory;

        product.card.style.display = isVisible ? "" : "none";
        return isVisible;
    });

    updateResults(filtered.length);
    setStatus(
        filtered.length
            ? "Resultados actualizados segun tu busqueda."
            : "No encontramos coincidencias para los filtros actuales."
    );
}

// Lee la informacion de autenticacion guardada en localStorage.
function getAuth() {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
}

// Recupera el carrito guardado localmente.
function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
}

// Guarda el estado actual del carrito.
function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Muestra mensajes de estado al usuario.
function setStatus(message) {
    if (elements.statusMessage) {
        elements.statusMessage.textContent = message;
    }
}

// Actualiza las metricas del hero con cantidad de productos y categorias.
function updateHeroStats(items) {
    const categories = new Set(items.map((item) => item.category));

    if (elements.heroProducts) {
        elements.heroProducts.textContent = String(items.length);
    }

    if (elements.heroCategories) {
        elements.heroCategories.textContent = String(categories.size);
    }
}

// Refresca el contador de resultados visibles.
function updateResults(total) {
    if (elements.results) {
        elements.results.textContent = `${total} productos disponibles.`;
    }
}

// Agrega un producto al carrito o aumenta su cantidad si ya existia.
function addToCart(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            image: product.image,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    updateCart();
    setStatus(`"${product.title}" fue agregado al carrito.`);
    toggleCart(true);
}

// Elimina un producto completo del carrito.
function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    updateCart();
}

// Redibuja el carrito, sus cantidades y el total acumulado.
function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (elements.cartCount) {
        elements.cartCount.textContent = String(totalItems);
    }

    if (elements.cartTotal) {
        elements.cartTotal.textContent = formatCurrency(totalPrice);
    }

    if (!elements.cartItems) {
        return;
    }

    elements.cartItems.innerHTML = "";

    if (!cart.length) {
        elements.cartItems.innerHTML = `
            <article class="empty-state">
                <h3>Tu carrito esta vacio</h3>
                <p>Agrega productos desde el catalogo para verlos aqui.</p>
            </article>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    cart.forEach((item) => {
        const article = document.createElement("article");
        article.className = "cart-item";
        article.innerHTML = `
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
            <div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>Cantidad: ${item.quantity}</p>
                <p>Subtotal: ${formatCurrency(item.price * item.quantity)}</p>
            </div>
            <button type="button" class="text-button">Eliminar</button>
        `;

        article.querySelector("button").addEventListener("click", () => removeFromCart(item.id));
        fragment.appendChild(article);
    });

    elements.cartItems.appendChild(fragment);
}

// Abre o cierra el panel lateral del carrito.
function toggleCart(isOpen) {
    if (!elements.cartDrawer || !elements.openCart) {
        return;
    }

    elements.cartDrawer.classList.toggle("is-open", isOpen);
    elements.cartDrawer.setAttribute("aria-hidden", String(!isOpen));
    elements.openCart.setAttribute("aria-expanded", String(isOpen));
}

// Permite cerrar el carrito con la tecla Escape.
function handleEscapeKey(event) {
    if (event.key === "Escape") {
        toggleCart(false);
    }
}

// Valida que haya productos antes de ir a la pagina de pago.
function goToPagos() {
    if (!cart.length) {
        setStatus("Agrega productos al carrito antes de continuar.");
        toggleCart(false);
        return;
    }

    window.location.href = "pagos.html";
}

// Cierra la sesion y limpia datos temporales del usuario.
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(CART_KEY);
    window.location.href = "login.html";
}

// Formatea valores numericos como moneda colombiana.
function formatCurrency(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(value);
}

// Evita que contenido dinamico rompa el HTML renderizado.
function escapeHtml(value) {
    const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(value).replace(/[&<>"']/g, (character) => replacements[character]);
}

// Capitaliza textos de categorias para mostrarlos mejor en pantalla.
function capitalize(value) {
    return String(value)
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
