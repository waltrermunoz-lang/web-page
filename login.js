// Claves usadas para persistir usuarios registrados y la sesion activa.
const AUTH_KEY = "sabbyshopp-auth";
const USERS_KEY = "sabbyshopp-users";

// Elementos principales de la interfaz de autenticacion.
const showLoginButton = document.getElementById("showLogin");
const showRegisterButton = document.getElementById("showRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authMessage = document.getElementById("authMessage");

// Usuario inicial por defecto para poder probar el sistema.
const defaultUsers = [
    {
        name: "Administrador",
        user: "admin",
        password: "1234"
    }
];

// Garantiza que exista al menos un arreglo de usuarios guardado.
bootstrapUsers();

// Si ya hay una sesion activa, no se muestra el login otra vez.
const currentSession = localStorage.getItem(AUTH_KEY);
if (currentSession) {
    window.location.href = "index.html";
}

// Eventos para cambiar visualmente entre los formularios.
showLoginButton.addEventListener("click", () => switchMode("login"));
showRegisterButton.addEventListener("click", () => switchMode("register"));

// Proceso de inicio de sesion: validacion, busqueda del usuario y redireccion.
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const user = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();

    if (!user || !password) {
        setMessage("Completa usuario y contraseña.", true);
        return;
    }

    const users = getUsers();
    const foundUser = users.find(
        (item) => item.user === user && item.password === password
    );

    if (!foundUser) {
        setMessage("Usuario o contraseña incorrectos.", true);
        return;
    }

    localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({
            isLoggedIn: true,
            user: foundUser.name || foundUser.user
        })
    );

    setMessage("Acceso correcto. Redirigiendo...", false);

    setTimeout(() => {
        window.location.href = "index.html";
    }, 700);
});

// Proceso de registro: valida datos, evita duplicados y almacena el nuevo usuario.
registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const user = document.getElementById("registerUser").value.trim();
    const password = document.getElementById("registerPass").value.trim();
    const confirmPassword = document.getElementById("registerPassConfirm").value.trim();

    if (!name || !user || !password || !confirmPassword) {
        setMessage("Completa todos los campos.", true);
        return;
    }

    if (password.length < 4) {
        setMessage("La contraseña debe tener al menos 4 caracteres.", true);
        return;
    }

    if (password !== confirmPassword) {
        setMessage("Las contraseñas no coinciden.", true);
        return;
    }

    const users = getUsers();
    const exists = users.some(
        (item) => item.user.toLowerCase() === user.toLowerCase()
    );

    if (exists) {
        setMessage("Ese usuario ya existe.", true);
        return;
    }

    users.push({
        name,
        user,
        password
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    setMessage("Cuenta creada correctamente. Ahora inicia sesión.", false);
    registerForm.reset();
    switchMode("login");
    document.getElementById("loginUser").value = user;
});

// Muestra u oculta formularios segun el modo seleccionado.
function switchMode(mode) {
    const isLogin = mode === "login";

    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);

    showLoginButton.classList.toggle("active", isLogin);
    showRegisterButton.classList.toggle("active", !isLogin);

    if (authTitle) {
        authTitle.textContent = isLogin ? "Iniciar sesión" : "Crear cuenta";
    }

    if (authSubtitle) {
        authSubtitle.textContent = isLogin
            ? "Entra con tu cuenta para continuar."
            : "Registra un usuario nuevo para acceder.";
    }

    setMessage("", false);
}

// Inicializa localStorage con el usuario por defecto si aun no existe informacion valida.
function bootstrapUsers() {
    const stored = localStorage.getItem(USERS_KEY);

    if (!stored) {
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        return;
    }

    try {
        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed) || parsed.length === 0) {
            localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        }
    } catch (error) {
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
}

// Obtiene todos los usuarios registrados.
function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : defaultUsers;
}

// Presenta mensajes de error o exito en la interfaz.
function setMessage(message, isError) {
    authMessage.textContent = message;
    authMessage.classList.toggle("error", Boolean(message) && isError);
    authMessage.classList.toggle("success", Boolean(message) && !isError);
}
