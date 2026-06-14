const DEFAULT_USERS = [];

let currentUser = null;

function getUsers(){
  return JSON.parse(localStorage.getItem('cv_users')) || DEFAULT_USERS;
}

function setUsers(v){
  localStorage.setItem('cv_users', JSON.stringify(v));
}

function getFarms(){
  return JSON.parse(localStorage.getItem('cv_farms')) || [];
}

function setFarms(v){
  localStorage.setItem('cv_farms', JSON.stringify(v));
}

function setupFirstAdmin(){
  const users = getUsers();

  if(users.length === 0){
    alert('Primeiro acesso: crie o usuário líder do painel.');

    const nome = prompt('Nome do líder:');
    const passaporte = prompt('Passaporte:');
    const usuario = prompt('Login:');
    const senha = prompt('Senha:');

    if(!nome || !passaporte || !usuario || !senha){
      alert('Você precisa preencher tudo para criar o primeiro acesso.');
      return setupFirstAdmin();
    }

    const admin = {
      id: Date.now(),
      nome,
      passaporte,
      usuario,
      senha,
      cargo: 'lider',
      lastFarm: 'Hoje'
    };

    setUsers([admin]);

    alert('Usuário líder criado com sucesso. Agora faça login.');
  }
}

function login(){
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();

  const user = getUsers().find(x => x.usuario === u && x.senha === p);

  if(!user) return alert('Login inválido');

  currentUser = user;
  localStorage.setItem('cv_session', JSON.stringify(user));
  startApp();
}

function logout(){
  localStorage.removeItem('cv_session');
  location.reload();
}

function startApp(){
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  document.getElementById('userName').innerText = currentUser.nome;
  document.getElementById('userRole').innerText = formatRole(currentUser.cargo);
  document.getElementById('userInitial').innerText = currentUser.nome[0].toUpperCase();
  document.getElementById('welcomeText').innerText = `Logado como ${formatRole(currentUser.cargo)}`;

  if(currentUser.cargo === 'membro'){
    document.getElementById('membersNav').style.display = 'none';
  }

  renderAll();
}

function formatRole(r){
  return r === 'lider' ? 'Líder' : r === 'vice_lider' ? 'Vice-líder' : 'Membro';
}

function showPage(page, btn){
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(page + 'Page').classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('pageTitle').innerText =
    page === 'farm' ? 'Enviar Farm' :
    page === 'members' ? 'Membros' :
    'Dashboard';

  renderAll();
}

function renderAll(){
  renderStats();
  renderMembers();
  renderFarmHistory();
  renderUserList();
}

function renderStats(){
  const users = getUsers();
  const farms = getFarms();

  const visible = currentUser.cargo === 'membro'
    ? users.filter(u => u.id === currentUser.id)
    : users;

  document.getElementById('totalMembers').innerText = visible.length;

  document.getElementById('farmCount').innerText =
    currentUser.cargo === 'membro'
      ? farms.filter(f => f.userId === currentUser.id).length
      : farms.length;

  document.getElementById('onTimeCount').innerText =
    visible.filter(u => u.lastFarm === 'Hoje').length;

  document.getElementById('lateCount').innerText =
    visible.filter(u => u.lastFarm !== 'Hoje').length;
}

function renderMembers(){
  const tbody = document.getElementById('membersTable');

  const users = currentUser.cargo === 'membro'
    ? getUsers().filter(u => u.id === currentUser.id)
    : getUsers();

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${u.nome}</strong></td>
      <td>${u.passaporte}</td>
      <td><span class="badge role">${formatRole(u.cargo)}</span></td>
      <td>
        <span class="badge ${u.lastFarm === 'Hoje' ? 'ok' : 'late'}">
          ${u.lastFarm === 'Hoje' ? 'EM DIA' : 'ATRASADO'}
        </span>
      </td>
      <td>${u.lastFarm}</td>
    </tr>
  `).join('');
}

function sendFarm(){
  const desc = document.getElementById('farmDescription').value.trim();
  const amount = document.getElementById('farmAmount').value.trim();

  if(!desc) return alert('Coloque a descrição do farm');

  const farms = getFarms();

  farms.unshift({
    id: Date.now(),
    userId: currentUser.id,
    nome: currentUser.nome,
    desc,
    amount,
    date: new Date().toLocaleString('pt-BR')
  });

  setFarms(farms);

  const users = getUsers().map(u =>
    u.id === currentUser.id ? {...u, lastFarm: 'Hoje'} : u
  );

  setUsers(users);

  currentUser = {...currentUser, lastFarm: 'Hoje'};
  localStorage.setItem('cv_session', JSON.stringify(currentUser));

  document.getElementById('farmDescription').value = '';
  document.getElementById('farmAmount').value = '';

  alert('Farm enviado com sucesso');
  renderAll();
}

function renderFarmHistory(){
  const box = document.getElementById('farmHistory');

  const farms = (
    currentUser.cargo === 'membro'
      ? getFarms().filter(f => f.userId === currentUser.id)
      : getFarms()
  ).slice(0, 8);

  box.innerHTML = farms.length
    ? farms.map(f => `
      <div class="history-item">
        <strong>${f.nome}</strong>
        <small>${f.date}</small>
        <p>${f.desc}</p>
        <small>Quantidade/valor: ${f.amount || 'não informado'}</small>
      </div>
    `).join('')
    : '<p class="muted">Nenhum farm enviado ainda.</p>';
}

function addMember(){
  if(currentUser.cargo === 'membro') return alert('Sem permissão');

  const nome = document.getElementById('newName').value.trim();
  const passaporte = document.getElementById('newPassport').value.trim();
  const usuario = document.getElementById('newUser').value.trim();
  const senha = document.getElementById('newPass').value.trim();
  const cargo = document.getElementById('newRole').value;

  if(!nome || !passaporte || !usuario || !senha){
    return alert('Preencha tudo');
  }

  const users = getUsers();

  if(users.some(u => u.usuario === usuario)){
    return alert('Usuário já existe');
  }

  users.push({
    id: Date.now(),
    nome,
    passaporte,
    usuario,
    senha,
    cargo,
    lastFarm: 'Atrasado'
  });

  setUsers(users);

  ['newName','newPassport','newUser','newPass'].forEach(id => {
    document.getElementById(id).value = '';
  });

  renderAll();
}

function renderUserList(){
  const box = document.getElementById('userList');
  if(!box) return;

  box.innerHTML = getUsers().map(u => `
    <div class="history-item">
      <strong>${u.nome}</strong>
      <small>Passaporte ${u.passaporte} • ${formatRole(u.cargo)}</small>
      <p>Login: ${u.usuario}</p>
    </div>
  `).join('');
}

function resetDemo(){
  if(!confirm('Isso vai apagar usuários, farms e sessão. Continuar?')) return;

  localStorage.removeItem('cv_users');
  localStorage.removeItem('cv_farms');
  localStorage.removeItem('cv_session');

  location.reload();
}

window.onload = () => {
  setupFirstAdmin();

  const s = localStorage.getItem('cv_session');

  if(s){
    currentUser = JSON.parse(s);
    startApp();
  }
};
