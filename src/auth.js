import { supabaseClient } from './supabase.js';
import { loadState } from './app.js';

const authElements = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  loginSubmit: document.querySelector("#loginSubmit"),
  appContainer: document.querySelector("#appContainer"),
  logoutButton: document.querySelector("#logoutButton"),
  // User management
  toggleUsersBtn: document.querySelector("#toggleUsersBtn"),
  usersModule: document.querySelector("#usersModule"),
  usersBody: document.querySelector("#usersBody"),
  userName: document.querySelector("#userName"),
  userEmail: document.querySelector("#userEmail"),
  userPassword: document.querySelector("#userPassword"),
  userRole: document.querySelector("#userRole"),
  addUserBtn: document.querySelector("#addUserBtn"),
  userStatusText: document.querySelector("#userStatusText"),
};

let currentAuthId = null;

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

function showUserStatus(message, isError = false) {
  authElements.userStatusText.textContent = message;
  authElements.userStatusText.hidden = false;
  authElements.userStatusText.className = isError
    ? "status user-status user-status-error"
    : "status user-status";
  clearTimeout(showUserStatus._timer);
  showUserStatus._timer = setTimeout(() => {
    authElements.userStatusText.hidden = true;
  }, 5000);
}

// ===== User Management =====

async function fetchUsers() {
  const { data, error } = await supabaseClient
    .from('app_users')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function renderUsers() {
  authElements.usersBody.innerHTML = "";

  let users = [];
  try {
    users = await fetchUsers();
  } catch (err) {
    console.error("Erreur chargement utilisateurs:", err);
    showUserStatus("Erreur lors du chargement des utilisateurs.", true);
    return;
  }

  users.forEach((user) => {
    const row = document.createElement("tr");
    const isSelf = user.auth_id === currentAuthId;

    const nameCell = document.createElement("td");
    nameCell.textContent = user.name || "—";

    const emailCell = document.createElement("td");
    emailCell.textContent = user.email;

    const roleCell = document.createElement("td");
    const roleBadge = document.createElement("span");
    roleBadge.className = user.role === "admin" ? "role-badge role-admin" : "role-badge role-user";
    roleBadge.textContent = user.role === "admin" ? "Admin" : "Utilisateur";
    roleCell.appendChild(roleBadge);

    const actionsCell = document.createElement("td");
    actionsCell.className = "commercial-actions";

    if (!isSelf) {
      actionsCell.innerHTML =
        `<button type="button" class="btn-icon btn-icon-edit" title="Modifier">` +
        `<i class="material-icons">edit</i>` +
        `</button>` +
        `<button type="button" class="btn-icon btn-icon-key" title="Changer mot de passe">` +
        `<i class="material-icons">vpn_key</i>` +
        `</button>` +
        `<button type="button" class="btn-icon btn-icon-delete" title="Supprimer">` +
        `<i class="material-icons">delete</i>` +
        `</button>`;

      actionsCell.querySelector(".btn-icon-edit").addEventListener("click", () => {
        editUserRow(user, row);
      });
      actionsCell.querySelector(".btn-icon-key").addEventListener("click", () => {
        changePasswordRow(user, row);
      });
      actionsCell.querySelector(".btn-icon-delete").addEventListener("click", () => {
        deleteUser(user);
      });
    } else {
      actionsCell.innerHTML = `<span class="self-badge">Vous</span>`;
    }

    row.appendChild(nameCell);
    row.appendChild(emailCell);
    row.appendChild(roleCell);
    row.appendChild(actionsCell);
    authElements.usersBody.appendChild(row);
  });
}

function editUserRow(user, row) {
  row.innerHTML =
    `<td><input type="text" class="edit-name" /></td>` +
    `<td>${user.email}</td>` +
    `<td>` +
    `<select class="edit-role">` +
    `<option value="user"${user.role === "user" ? " selected" : ""}>Utilisateur</option>` +
    `<option value="admin"${user.role === "admin" ? " selected" : ""}>Administrateur</option>` +
    `</select>` +
    `</td>` +
    `<td class="commercial-actions">` +
    `<button type="button" class="btn-icon btn-icon-save" title="Enregistrer">` +
    `<i class="material-icons">check</i>` +
    `</button>` +
    `<button type="button" class="btn-icon btn-icon-cancel" title="Annuler">` +
    `<i class="material-icons">close</i>` +
    `</button>` +
    `</td>`;

  row.querySelector(".edit-name").value = user.name || "";

  row.querySelector(".btn-icon-save").addEventListener("click", async () => {
    const name = row.querySelector(".edit-name").value.trim();
    const role = row.querySelector(".edit-role").value;
    if (!name) {
      showUserStatus("Le nom ne peut pas etre vide.", true);
      return;
    }
    try {
      await supabaseClient.rpc('update_app_user', {
        p_auth_id: user.auth_id,
        p_name: name,
        p_role: role,
      });
      showUserStatus("Utilisateur mis a jour.");
      renderUsers();
    } catch (err) {
      console.error("Erreur mise a jour utilisateur:", err);
      showUserStatus("Erreur lors de la mise a jour.", true);
    }
  });

  row.querySelector(".btn-icon-cancel").addEventListener("click", () => {
    renderUsers();
  });

  row.querySelector(".edit-name").focus();
}

function changePasswordRow(user, row) {
  const originalHTML = row.innerHTML;

  row.innerHTML =
    `<td colspan="2">` +
    `<strong>${user.name || user.email}</strong> — Nouveau mot de passe :` +
    `</td>` +
    `<td><input type="password" class="edit-password" placeholder="Nouveau mot de passe" minlength="6" /></td>` +
    `<td class="commercial-actions">` +
    `<button type="button" class="btn-icon btn-icon-save" title="Enregistrer">` +
    `<i class="material-icons">check</i>` +
    `</button>` +
    `<button type="button" class="btn-icon btn-icon-cancel" title="Annuler">` +
    `<i class="material-icons">close</i>` +
    `</button>` +
    `</td>`;

  row.querySelector(".btn-icon-save").addEventListener("click", async () => {
    const newPassword = row.querySelector(".edit-password").value;
    if (!newPassword || newPassword.length < 6) {
      showUserStatus("Le mot de passe doit contenir au moins 6 caracteres.", true);
      return;
    }
    try {
      await supabaseClient.rpc('update_user_password', {
        p_auth_id: user.auth_id,
        p_new_password: newPassword,
      });
      showUserStatus("Mot de passe mis a jour.");
      renderUsers();
    } catch (err) {
      console.error("Erreur changement mot de passe:", err);
      showUserStatus("Erreur lors du changement de mot de passe.", true);
    }
  });

  row.querySelector(".btn-icon-cancel").addEventListener("click", () => {
    renderUsers();
  });

  row.querySelector(".edit-password").focus();
}

async function deleteUser(user) {
  if (!confirm(`Supprimer l'utilisateur ${user.name || user.email} ? Cette action est irreversible.`)) {
    return;
  }

  try {
    await supabaseClient.rpc('delete_app_user', { p_auth_id: user.auth_id });
    showUserStatus("Utilisateur supprime.");
    renderUsers();
  } catch (err) {
    console.error("Erreur suppression utilisateur:", err);
    showUserStatus(err.message || "Erreur lors de la suppression.", true);
  }
}

async function addUser() {
  const name = authElements.userName.value.trim();
  const email = authElements.userEmail.value.trim();
  const password = authElements.userPassword.value;
  const role = authElements.userRole.value;

  if (!name || !email || !password) {
    showUserStatus("Veuillez remplir tous les champs.", true);
    return;
  }

  if (password.length < 6) {
    showUserStatus("Le mot de passe doit contenir au moins 6 caracteres.", true);
    return;
  }

  try {
    await supabaseClient.rpc('create_app_user', {
      p_email: email,
      p_password: password,
      p_name: name,
      p_role: role,
    });

    authElements.userName.value = "";
    authElements.userEmail.value = "";
    authElements.userPassword.value = "";
    authElements.userRole.value = "user";

    showUserStatus("Utilisateur cree avec succes.");
    renderUsers();
  } catch (err) {
    console.error("Erreur creation utilisateur:", err);
    showUserStatus(err.message || "Erreur lors de la creation.", true);
  }
}

function toggleUsersModule() {
  const isHidden = authElements.usersModule.hidden;
  authElements.usersModule.hidden = !isHidden;
  authElements.toggleUsersBtn.querySelector(".material-icons").textContent =
    isHidden ? "expand_less" : "expand_more";
  authElements.toggleUsersBtn.querySelector(".material-icons").nextSibling.textContent =
    isHidden ? " Masquer" : " Afficher";

  if (isHidden) {
    renderUsers();
  }
}

// ===== Auth Flow =====

authElements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideLoginError();
  authElements.loginSubmit.disabled = true;
  authElements.loginSubmit.textContent = "Connexion...";

  const email = authElements.loginEmail.value.trim();
  const password = authElements.loginPassword.value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  authElements.loginSubmit.disabled = false;
  authElements.loginSubmit.textContent = "Se connecter";

  if (error) {
    showLoginError("Email ou mot de passe incorrect.");
    return;
  }

  currentAuthId = data.user?.id || null;
  showApp();
  await loadState();
});

authElements.logoutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  currentAuthId = null;
  showLogin();
});

authElements.addUserBtn.addEventListener("click", addUser);
authElements.toggleUsersBtn.addEventListener("click", toggleUsersModule);

async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    currentAuthId = session.user?.id || null;
    showApp();
    await loadState();
  } else {
    showLogin();
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      currentAuthId = null;
      showLogin();
    }
  });
}

initAuth();
