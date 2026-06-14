const SUPABASE_URL = "https://dlzlxkgpsonemvgvqnke.supabase.co";
const SUPABASE_KEY = "sb_publishable_vASlKZ7EYpGT5og9sp7RGQ_qHQ73Mj6";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

async function getUsers() {
  const { data, error } = await db.from("users").select("*").order("id");
  if (error) {
    alert("Erro ao buscar usuários");
    console.error(error);
    return [];
  }
  return data;
}

async function getFarms() {
  const { data, error } = await db.from("farms").select("*").order("id", { ascending: false });
  if (error) {
    alert("Erro ao buscar farms");
    console.error(error);
    return [];
  }
  return data;
}

async function login() {
  const usuario = document.getElementById("loginUser").value.trim();
  const senha = document.getElementById("loginPass").value.trim();

  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("usuario", usuario)
    .eq("senha", senha)
    .single();

  if (error || !data) {
    alert("Login inválido");
    return;
  }

  currentUser = data;
  localStorage.setItem("cv_session", JSON.stringify(currentUser));
  startApp();
}

function logout() {
  localStorage.removeItem("cv_session");
  location.reload();
}

async function startApp() {
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

  await renderAll();
}

function formatRole(role) {
  if (role === "lider") return "Líder";
  if (role === "vice_lider") return "Vice-líder";
  return "Membro";
}

async function showPage(page, btn) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page + "Page").classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  document.getElementById("pageTitle").innerText =
    page === "farm" ? "Enviar Farm" :
    page === "members" ? "Membros" :
    "Dashboard";

  await renderAll();
}

async function renderAll() {
  await renderStats();
  await renderMembers();
  await renderFarmHistory();
  await renderUserList();
}

async function renderStats() {
  const users = await getUsers();
  const farms = await getFarms();

  const visibleUsers = currentUser.cargo === "membro"
    ? users.filter(u => u.id === currentUser.id)
    : users;

  document.getElementById("totalMembers").innerText = visibleUsers.length;

  document.getElementById("farmCount").innerText =
    currentUser.cargo === "membro"
      ? farms.filter(f => f.user_id === currentUser.id).length
      : farms.length;

  document.getElementById("onTimeCount").innerText =
    visibleUsers.filter(u => u.last_farm === "Hoje").length;

  document.getElementById("lateCount").innerText =
    visibleUsers.filter(u => u.last_farm !== "Hoje").length;
}

async function renderMembers() {
  const tbody = document.getElementById("membersTable");
  if (!tbody) return;

  const users = await getUsers();

  const visibleUsers = currentUser.cargo === "membro"
    ? users.filter(u => u.id === currentUser.id)
    : users;

  tbody.innerHTML = visibleUsers.map(u => `
    <tr>
      <td><strong>${u.nome}</strong></td>
      <td>${u.passaporte}</td>
      <td><span class="badge role">${formatRole(u.cargo)}</span></td>
      <td>
        <span class="badge ${u.last_farm === "Hoje" ? "ok" : "late"}">
          ${u.last_farm === "Hoje" ? "EM DIA" : "ATRASADO"}
        </span>
      </td>
      <td>${u.last_farm}</td>
    </tr>
  `).join("");
}

async function sendFarm() {
  const desc = document.getElementById("farmDescription").value.trim();
  const amount = document.getElementById("farmAmount").value.trim();

  if (!desc) {
    alert("Coloque a descrição do farm");
    return;
  }

  const { error } = await db.from("farms").insert({
    user_id: currentUser.id,
    nome: currentUser.nome,
    descricao: desc,
    quantidade: amount
  });

  if (error) {
    alert("Erro ao enviar farm");
    console.error(error);
    return;
  }

  await db
    .from("users")
    .update({ last_farm: "Hoje" })
    .eq("id", currentUser.id);

  currentUser.last_farm = "Hoje";
  localStorage.setItem("cv_session", JSON.stringify(currentUser));

  document.getElementById("farmDescription").value = "";
  document.getElementById("farmAmount").value = "";

  alert("Farm enviado com sucesso");
  await renderAll();
}

async function renderFarmHistory() {
  const box = document.getElementById("farmHistory");
  if (!box) return;

  const farms = await getFarms();

  const visibleFarms = currentUser.cargo === "membro"
    ? farms.filter(f => f.user_id === currentUser.id)
    : farms;

  const latestFarms = visibleFarms.slice(0, 8);

  if (latestFarms.length === 0) {
    box.innerHTML = `<p class="muted">Nenhum farm enviado ainda.</p>`;
    return;
  }

  box.innerHTML = latestFarms.map(f => `
    <div class="history-item">
      <strong>${f.nome}</strong>
      <small>${new Date(f.criado_em).toLocaleString("pt-BR")}</small>
      <p>${f.descricao}</p>
      <small>Quantidade/valor: ${f.quantidade || "não informado"}</small>
    </div>
  `).join("");
}

async function addMember() {
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

  const { error } = await db.from("users").insert({
    nome,
    passaporte,
    usuario,
    senha,
    cargo,
    last_farm: "Atrasado"
  });

  if (error) {
    alert("Erro ao cadastrar usuário. Talvez esse login já exista.");
    console.error(error);
    return;
  }

  document.getElementById("newName").value = "";
  document.getElementById("newPassport").value = "";
  document.getElementById("newUser").value = "";
  document.getElementById("newPass").value = "";

  alert("Usuário adicionado com sucesso");
  await renderAll();
}

async function renderUserList() {
  const box = document.getElementById("userList");
  if (!box) return;

  if (currentUser.cargo === "membro") {
    box.innerHTML = "";
    return;
  }

  const users = await getUsers();

  box.innerHTML = users.map(u => `
    <div class="history-item">
      <strong>${u.nome}</strong>
      <small>Passaporte ${u.passaporte} • ${formatRole(u.cargo)}</small>
      <p>Login: ${u.usuario}</p>
    </div>
  `).join("");
}

async function resetDemo() {
  if (currentUser.cargo !== "lider") {
    alert("Apenas líder pode resetar");
    return;
  }

  if (!confirm("Tem certeza que deseja apagar todos os farms?")) return;

  await db.from("farms").delete().neq("id", 0);

  alert("Farms apagados");
  await renderAll();
}

window.onload = async () => {
  const session = localStorage.getItem("cv_session");

  if (session) {
    currentUser = JSON.parse(session);
    await startApp();
  }
};
