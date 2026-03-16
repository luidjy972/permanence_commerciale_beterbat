const authElements = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  loginSubmit: document.querySelector("#loginSubmit"),
  appContainer: document.querySelector("#appContainer"),
  logoutButton: document.querySelector("#logoutButton"),
};

function showLogin() {
  authElements.loginScreen.hidden = false;
  authElements.appContainer.hidden = true;
}

function showApp() {
  authElements.loginScreen.hidden = true;
  authElements.appContainer.hidden = false;
}

function showLoginError(message) {
  authElements.loginError.textContent = message;
  authElements.loginError.hidden = false;
}

function hideLoginError() {
  authElements.loginError.hidden = true;
}

authElements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideLoginError();
  authElements.loginSubmit.disabled = true;
  authElements.loginSubmit.textContent = "Connexion...";

  const email = authElements.loginEmail.value.trim();
  const password = authElements.loginPassword.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  authElements.loginSubmit.disabled = false;
  authElements.loginSubmit.textContent = "Se connecter";

  if (error) {
    showLoginError("Email ou mot de passe incorrect.");
    return;
  }

  showApp();
  loadState();
});

authElements.logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showLogin();
});

async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    showApp();
    loadState();
  } else {
    showLogin();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      showLogin();
    }
  });
}

initAuth();
