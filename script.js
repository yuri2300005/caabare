const DEFAULT_USERS = [
  {
    id: 1,
    nome: "Velha",
    passaporte: "0001",
    usuario: "velha",
    senha: "avelha6924",
    cargo: "lider",
    lastFarm: "Hoje"
  }
];

let currentUser = null;

function getUsers() {
  const saved = localStorage.getItem("cv_users");
  return saved ? JSON.parse(saved) : DEFAULT_USERS;
}

function setUsers(users) {
  localStorage.setItem("cv_users", JSON.stringify(users));
}

function getFarms() {
  const saved = localStorage.getItem("cv_farms");
  return saved ? JSON.parse(saved) : [];
}

function setFarms(farms) {
  localStorage.setItem("cv_farms", JSON.stringify(farms));
}

function login() {
  const usuario = document.getElementById("loginUser").value.trim();
  const senha = document.getElementById("loginPass").value.trim();

  const user = getUsers().find(u => u.usuario === usuario && u.senha === senha);

  if (!user) {
    alert("Login inválido");
    return;
  }

  currentUser = user;
  localStorage.setItem("cv_session", JSON.stringify(user));
  startApp();
}

function logout() {
  localStorage.removeItem("cv_session");
  location.reload();
}

function startApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("userName").innerText = currentUser.nome;
  document.getElementById("userRole").innerText = formatRole(currentUser.cargo);
  document.getElementById("userInitial").innerText = currentUser.nome[0].toUpperCase();
  document.getElementById("welcomeText").innerText = `Logado como ${formatRole(currentUser.cargo)}`;

  const membersNav = document.getElementById("membersNav");
  if (membersNav) {
    membersNav.style.display = currentUser.cargo === "membro" ? "none" : "block";
  }

  renderAll();
}

function formatRole(role) {
  if (role === "lider") return "Líder";
  if (role === "vice_lider") return "Vice-líder";
  return "Membro";
}

function showPage(page, btn) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page + "Page").classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  document.getElementById("pageTitle").innerText =
    page === "farm" ? "Enviar Farm" :
    page === "members" ? "Membros" :
    "Dashboard";

  renderAll();
}

function renderAll() {
  renderStats();
  renderMembers();
  renderFarmHistory();
  renderUserList();
}

function renderStats() {
  const users = getUsers();
  const farms = getFarms();

  const visibleUsers = currentUser.cargo === "membro"
    ? users.filter(u => u.id === currentUser.id)
    : users;

  document.getElementById("totalMembers").innerText = visibleUsers.length;

  document.getElementById("farmCount").innerText =
    currentUser.cargo === "membro"
      ? farms.filter(f => f.userId === currentUser.id).length
      : farms.length;

  document.getElementById("onTimeCount").innerText =
    visibleUsers.filter(u => u.lastFarm === "Hoje").length;

  document.getElementById("lateCount").innerText =
    visibleUsers.filter(u => u.lastFarm !== "Hoje").length;
}

function renderMembers() {
  const tbody = document.getElementById("membersTable");
  if (!tbody) return;

  const users = currentUser.cargo === "membro"
    ? getUsers().filter(u => u.id === currentUser.id)
    : getUsers();

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${u.nome}</strong></td>
      <td>${u.passaporte}</td>
      <td><span class="badge role">${formatRole(u.cargo)}</span></td>
      <td>
        <span class="badge ${u.lastFarm === "Hoje" ? "ok" : "late"}">
          ${u.lastFarm === "Hoje" ? "EM DIA" : "ATRASADO"}
        </span>
      </td>
      <td>${u.lastFarm}</td>
    </tr>
  `).join("");
}

function sendFarm() {
  const desc = document.getElementById("farmDescription").value.trim();
  const amount = document.getElementById("farmAmount").value.trim();

  if (!desc) {
    alert("Coloque a descrição do farm");
    return;
  }

  const farms = getFarms();

  farms.unshift({
    id: Date.now(),
    userId: currentUser.id,
    nome: currentUser.nome,
    desc,
    amount,
    date: new Date().toLocaleString("pt-BR")
  });

  setFarms(farms);

  const users = getUsers().map(u =>
    u.id === currentUser.id ? { ...u, lastFarm: "Hoje" } : u
  );

  setUsers(users);

  currentUser = { ...currentUser, lastFarm: "Hoje" };
  localStorage.setItem("cv_session", JSON.stringify(currentUser));

  document.getElementById("farmDescription").value = "";
  document.getElementById("farmAmount").value = "";

  alert("Farm enviado com sucesso");
  renderAll();
}

function renderFarmHistory() {
  const box = document.getElementById("farmHistory");
  if (!box) return;

  const farms = currentUser.cargo === "membro"
    ? getFarms().filter(f => f.userId === currentUser.id)
    : getFarms();

  const latestFarms = farms.slice(0, 8);

  if (latestFarms.length === 0) {
    box.innerHTML = `<p class="muted">Nenhum farm enviado ainda.</p>`;
    return;
  }

  box.innerHTML = latestFarms.map(f => `
    <div class="history-item">
      <strong>${f.nome}</strong>
      <small>${f.date}</small>
      <p>${f.desc}</p>
      <small>Quantidade/valor: ${f.amount || "não informado"}</small>
    </div>
  `).join("");
}

function addMember() {
  if (currentUser.cargo === "membro") {
    alert("Sem permissão");
    return;
  }

  const nome = document.getElementById("newName").value.trim();
  const passaporte = document.getElementById("newPassport").value.trim();
  const usuario = document.getElementById("newUser").value.trim();
  const senha = document.getElementById("newPass").value.trim();
  const cargo = document.getElementById("newRole").value;

  if (!nome || !passaporte || !usuario || !senha) {
    alert("Preencha todos os campos");
    return;
  }

  const users = getUsers();

  if (users.some(u => u.usuario === usuario)) {
    alert("Esse login já existe");
    return;
  }

  users.push({
    id: Date.now(),
    nome,
    passaporte,
    usuario,
    senha,
    cargo,
    lastFarm: "Atrasado"
  });

  setUsers(users);

  document.getElementById("newName").value = "";
  document.getElementById("newPassport").value = "";
  document.getElementById("newUser").value = "";
  document.getElementById("newPass").value = "";

  alert("Usuário adicionado com sucesso");
  renderAll();
}

function renderUserList() {
  const box = document.getElementById("userList");
  if (!box) return;

  if (currentUser.cargo === "membro") {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = getUsers().map(u => `
    <div class="history-item">
      <strong>${u.nome}</strong>
      <small>Passaporte ${u.passaporte} • ${formatRole(u.cargo)}</small>
      <p>Login: ${u.usuario}</p>
    </div>
  `).join("");
}

function resetDemo() {
  if (!confirm("Isso vai apagar usuários, farms e sessão deste navegador. Continuar?")) return;

  localStorage.removeItem("cv_users");
  localStorage.removeItem("cv_farms");
  localStorage.removeItem("cv_session");

  location.reload();
}

window.onload = () => {
  const session = localStorage.getItem("cv_session");

  if (session) {
    currentUser = JSON.parse(session);
    startApp();
  }
};
