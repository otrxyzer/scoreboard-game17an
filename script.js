// assets/js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen Login Form ---
    const loginForm = document.getElementById('loginForm');
    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginButton = document.getElementById('loginButton');
    const loginGeneralError = document.getElementById('loginGeneralError');
    const loginUsernameError = document.getElementById('loginUsernameError');
    const loginPasswordError = document.getElementById('loginPasswordError');

    // --- Elemen Signup Form ---
    const signupForm = document.getElementById('signupForm');
    const signupUsernameInput = document.getElementById('signupUsername');
    const signupEmailInput = document.getElementById('signupEmail');
    const signupPasswordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupButton = document.getElementById('signupButton');
    const signupGeneralError = document.getElementById('signupGeneralError');
    const signupUsernameError = document.getElementById('signupUsernameError');
    const signupEmailError = document.getElementById('signupEmailError');
    const signupPasswordError = document.getElementById('signupPasswordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // --- Elemen Global & Toggle Buttons ---
    const cardFormTitle = document.getElementById('cardFormTitle');
    const pageTitle = document.getElementById('formTitle');
    const toggleToLoginButton = document.getElementById('toggleToLogin'); // Tombol baru
    const toggleToSignupButton = document.getElementById('toggleToSignup'); // Tombol baru

    // --- Fungsi Bantuan (Tidak Berubah) ---
    const showInputError = (element, message) => {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
        element.closest('.input-group').classList.toggle('error', !!message);
    };

    const showGeneralError = (element, message) => {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
    };

    const clearAllFormErrors = () => {
        showGeneralError(loginGeneralError, '');
        showInputError(loginUsernameError, '');
        showInputError(loginPasswordError, '');
        showGeneralError(signupGeneralError, '');
        showInputError(signupUsernameError, '');
        showInputError(signupEmailError, '');
        showInputError(signupPasswordError, '');
        showInputError(confirmPasswordError, '');
    };

    // --- Fungsi Toggle Form (Tidak Berubah, hanya nama variabel yang lebih spesifik) ---
    const showLoginForm = () => {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        cardFormTitle.textContent = 'Login';
        pageTitle.textContent = 'Login Aplikasi';
        clearAllFormErrors();
        loginForm.reset();
        signupForm.reset();
        // Atur tombol aktif/non-aktif atau style untuk menunjukkan form yang aktif
        toggleToLoginButton.disabled = true;
        toggleToSignupButton.disabled = false;
    };

    const showSignupForm = () => {
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        cardFormTitle.textContent = 'Daftar';
        pageTitle.textContent = 'Daftar Akun';
        clearAllFormErrors();
        loginForm.reset();
        signupForm.reset();
        // Atur tombol aktif/non-aktif atau style untuk menunjukkan form yang aktif
        toggleToSignupButton.disabled = true;
        toggleToLoginButton.disabled = false;
    };

    // --- Event Listener Tombol Toggle Baru ---
    toggleToSignupButton.addEventListener('click', (e) => {
        e.preventDefault();
        showSignupForm();
    });

    toggleToLoginButton.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    // --- Logika Login Form (Tidak Berubah) ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        showGeneralError(loginGeneralError, '');
        showInputError(loginUsernameError, '');
        showInputError(loginPasswordError, '');

        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();

        let isValid = true;
        if (!username) {
            showInputError(loginUsernameError, 'Username tidak boleh kosong.');
            isValid = false;
        }
        if (!password) {
            showInputError(loginPasswordError, 'Password tidak boleh kosong.');
            isValid = false;
        }

        if (!isValid) return;

        loginButton.textContent = 'Memproses...';
        loginButton.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (username === 'admin' && password === 'password123') {
                alert(`Selamat datang, ${username}! Login berhasil.`);
                window.location.href = 'users.html';
            } else {
                showGeneralError(loginGeneralError, 'Username atau password salah.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showGeneralError(loginGeneralError, 'Terjadi kesalahan saat mencoba login. Silakan coba lagi.');
        } finally {
            loginButton.textContent = 'Masuk';
            loginButton.disabled = false;
        }
    });

    // --- Logika Signup Form (Tidak Berubah) ---
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        showGeneralError(signupGeneralError, '');
        showInputError(signupUsernameError, '');
        showInputError(signupEmailError, '');
        showInputError(signupPasswordError, '');
        showInputError(confirmPasswordError, '');

        const username = signupUsernameInput.value.trim();
        const email = signupEmailInput.value.trim();
        const password = signupPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        let isValid = true;

        if (!username) {
            showInputError(signupUsernameError, 'Username tidak boleh kosong.');
            isValid = false;
        }
        if (!email || !email.includes('@')) {
            showInputError(signupEmailError, 'Email tidak valid.');
            isValid = false;
        }
        if (!password || password.length < 6) {
            showInputError(signupPasswordError, 'Password minimal 6 karakter.');
            isValid = false;
        }
        if (password !== confirmPassword) {
            showInputError(confirmPasswordError, 'Password tidak cocok.');
            isValid = false;
        }

        if (!isValid) return;

        signupButton.textContent = 'Memproses...';
        signupButton.disabled = true;

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            alert(`Akun ${username} berhasil didaftarkan! Silakan masuk.`);
            showLoginForm();
        } catch (error) {
            console.error('Signup error:', error);
            showGeneralError(signupGeneralError, 'Terjadi kesalahan saat pendaftaran. Silakan coba lagi.');
        } finally {
            signupButton.textContent = 'Daftar';
            signupButton.disabled = false;
        }
    });

    // Pastikan form login ditampilkan di awal dan tombol toggle-nya diatur
    showLoginForm();
});
