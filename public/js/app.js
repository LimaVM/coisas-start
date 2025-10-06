/**
 * Aplicativo PWA de Orçamentos
 * 
 * Este arquivo contém toda a lógica de frontend do aplicativo,
 * incluindo navegação, manipulação de dados e interação com a API.
 * 
 * @author Manus
 * @version 2.0.0 - Implementado estratégias anti-cache e melhor tratamento de erros
 */

// Configuração global para requisições com estratégia anti-cache
const API_CONFIG = {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

// Função para fazer requisições com estratégia anti-cache
async function fetchWithNoCache(url, options = {}) {
  const config = {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...options.headers
    },
    cache: 'no-cache'
  };
  
  try {
    const response = await fetch(url, config);
    
    // Se não autenticado, redireciona para login
    if (response.status === 401) {
      mostrarLogin();
      throw new Error('Não autenticado');
    }
    
    // Se erro de servidor, tenta novamente após delay
    if (response.status >= 500) {
      console.warn(`Erro ${response.status} em ${url}, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetch(url, config);
    }
    
    return response;
  } catch (error) {
    console.error('Erro na requisição:', error);
    
    // Se offline, mostra mensagem apropriada
    if (!navigator.onLine) {
      mostrarToast('Você está offline. Algumas funcionalidades podem não funcionar.', 'warning');
    }
    
    throw error;
  }
}

// Função para invalidar cache específico
function invalidateCache(cacheKey) {
  switch (cacheKey) {
    case 'produtos':
      produtosCache = [];
      break;
    case 'orcamentos':
      orcamentosCache = [];
      break;
    case 'usuarios':
      usuariosCache = [];
      break;
    case 'templates':
      templatesCache = [];
      break;
    case 'registros':
      registrosCache = [];
      break;
    case 'all':
      produtosCache = [];
      orcamentosCache = [];
      usuariosCache = [];
      templatesCache = [];
      registrosCache = [];
      break;
  }
}

// Função para forçar recarregamento de dados
async function forceReloadData() {
  invalidateCache('all');
  
  try {
    // Recarrega dados da página atual
    switch (currentPage) {
      case 'produtos':
        await carregarProdutos(true);
        break;
      case 'orcamentos':
        await carregarOrcamentos(true);
        break;
      case 'usuarios':
        if (usuarioAtual?.admin) {
          await carregarUsuarios(true);
        }
        break;
      case 'registros':
        if (usuarioAtual?.admin) {
          await carregarRegistros(true);
        }
        break;
    }
    
    mostrarToast('Dados atualizados com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao recarregar dados:', error);
    mostrarToast('Erro ao atualizar dados', 'error');
  }
}

function connectEventSource() {
  if (eventSource) {
    eventSource.close();
  }
  eventSource = new EventSource('/api/events');
  eventSource.addEventListener('produtos-updated', () => carregarProdutos(true));
  eventSource.addEventListener('orcamentos-updated', () => carregarOrcamentos(true));
  eventSource.addEventListener('usuarios-updated', () => {
    if (usuarioAtual?.admin) carregarUsuarios(true);
  });
  eventSource.onerror = () => {
    eventSource.close();
    setTimeout(connectEventSource, 5000);
  };
}

// Variáveis globais
let produtosCache = [];
let templatesCache = [];
let orcamentosCache = [];
let usuariosCache = [];
let registrosCache = [];
let produtosSelecionados = []; // Formato: { id, nome, valorUnitario, quantidade, foto }
let deferredPrompt = null;
let isEditing = false; // Indica se há alterações não salvas
let currentForm = null;
let formSnapshot = "";
let currentPage = "home"; // Página atual para controle do histórico
let usuarioAtual = null; // Dados do usuário logado
let offlineQueue = [];
let eventSource = null;

// Elementos DOM frequentemente acessados
const appContent = document.getElementById("app-content");
const menuToggle = document.getElementById("menu-toggle");
const menuClose = document.getElementById("menu-close");
const sideMenu = document.querySelector(".side-menu");
const overlay = document.getElementById("overlay");
const menuItems = document.querySelectorAll(".menu-items li");
const bottomNavItems = document.querySelectorAll(".bottom-nav-item");
const pages = document.querySelectorAll(".page");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");
const loadingSpinner = document.getElementById("loading-spinner");
const pdfProgressOverlay = document.getElementById("pdf-progress-overlay");
const pdfProgressBar = document.getElementById("pdf-progress-bar");
const confirmModal = document.getElementById("confirm-modal");
const confirmMessage = document.getElementById("confirm-message");
const confirmOk = document.getElementById("confirm-ok");
const confirmCancel = document.getElementById("confirm-cancel");

// Elementos do header
const refreshBtn = document.getElementById("refresh-btn");

// Elementos de login
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const loginUsuario = document.getElementById("login-usuario");
const loginSenha = document.getElementById("login-senha");

// Elementos da página inicial
const cardProdutos = document.getElementById("card-produtos");
const cardOrcamentos = document.getElementById("card-orcamentos");
const cardUsuarios = document.getElementById("card-usuarios");
const cardRegistros = document.getElementById("card-registros");
const cardPerfil = document.getElementById("card-perfil");

// Elementos da página de produtos
const addProdutoBtn = document.getElementById("add-produto-btn");
const produtoSearch = document.getElementById("produto-search");
const produtoSugestoes = document.getElementById("sugestoes-produtos");
const produtosLista = document.getElementById("produtos-lista");

// Elementos da página de orçamentos
const addOrcamentoBtn = document.getElementById("add-orcamento-btn");
const orcamentoSearch = document.getElementById("orcamento-search");
const orcamentosLista = document.getElementById("orcamentos-lista");

// Elementos da página de usuários (admin)
const addUsuarioBtn = document.getElementById("add-usuario-btn");
const usuariosLista = document.getElementById("usuarios-lista");

// Elementos da página de registros (admin)
const registrosLista = document.getElementById("registros-lista");

// Elementos da página de perfil
const perfilForm = document.getElementById("perfil-form");
const perfilNome = document.getElementById("perfil-nome");
const perfilSenha = document.getElementById("perfil-senha");
const perfilFotoInput = document.getElementById("perfil-foto");
const perfilFotoPreview = document.getElementById("perfil-foto-preview");
const perfilFotoBtn = document.getElementById("perfil-foto-btn");
const logoutBtn = document.getElementById("logout-btn");

// Elementos do modal de usuário
const usuarioModal = document.getElementById("usuario-modal");
const usuarioModalTitle = document.getElementById("usuario-modal-title");
const usuarioForm = document.getElementById("usuario-form");
const usuarioId = document.getElementById("usuario-id");
const usuarioNome = document.getElementById("usuario-nome");
const usuarioSenha = document.getElementById("usuario-senha");
const usuarioAdmin = document.getElementById("usuario-admin");
const usuarioFoto = document.getElementById("usuario-foto");

// Elementos do modal de produto
const produtoModal = document.getElementById("produto-modal");
const produtoModalTitle = document.getElementById("produto-modal-title");
const produtoForm = document.getElementById("produto-form");
const produtoId = document.getElementById("produto-id");
const produtoNome = document.getElementById("produto-nome");
const produtoDescricao = document.getElementById("produto-descricao"); // Adicionado
const produtoValor = document.getElementById("produto-valor");
const produtoFotoInput = document.getElementById("produto-foto"); // Renomeado para clareza
const fotoPreviewContainer = document.getElementById("foto-preview-container"); // Adicionado container
const fotoPreview = document.getElementById("foto-preview");
const selectFotoBtn = document.getElementById("select-foto-btn");

function atualizarDisponibilidadeOnline() {
  const online = navigator.onLine;
  if (!online) {
    console.warn('Aplicativo offline');
  }
}

window.addEventListener('online', () => {
  atualizarDisponibilidadeOnline();
  processarFilaOffline();
  mostrarToast('Conectado');
});
window.addEventListener('offline', () => {
  atualizarDisponibilidadeOnline();
  mostrarToast('Você está offline');
});

// Elementos do modal de orçamento
const orcamentoModal = document.getElementById("orcamento-modal");
const orcamentoForm = document.getElementById("orcamento-form");
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const prevTabBtn = document.getElementById("prev-tab");
const nextTabBtn = document.getElementById("next-tab");
const submitOrcamentoBtn = document.getElementById("submit-orcamento");
const orcamentoIdInput = document.getElementById("orcamento-id");
const clienteNome = document.getElementById("cliente-nome");
const clienteCep = document.getElementById("cliente-cep");
const clienteEndereco = document.getElementById("cliente-endereco");
const clienteTelefone = document.getElementById("cliente-telefone");
const clienteEmail = document.getElementById("cliente-email");
const clienteCpf = document.getElementById("cliente-cpf");
const produtosSelecionadosEl = document.getElementById("produtos-selecionados");
const addProdutosBtn = document.getElementById("add-produtos-btn");
const orcamentoObservacoes = document.getElementById("orcamento-observacoes");
const tipoDescontoSelect = document.getElementById("tipo-desconto");
const valorDescontoGroup = document.getElementById("valor-desconto-group");
const valorDescontoInput = document.getElementById("valor-desconto");
const valorDescontoHelper = document.getElementById("valor-desconto-helper");
const templatesLista = document.getElementById("templates-lista");
const formaPagamentoSelect = document.getElementById("forma-pagamento");
const avistaGrupo = document.getElementById("avista-grupo");
const avistaTipoSelect = document.getElementById("avista-tipo");
const prazoGrupo = document.getElementById("prazo-grupo");
const prazoParcelasInput = document.getElementById("prazo-parcelas");
const prazoJurosInput = document.getElementById("prazo-juros");

function validarClienteNome(marcar = true) {
  const grupo = clienteNome.closest(".form-group");
  const valido = clienteNome.value.trim() !== "";
  if (grupo && marcar) {
    grupo.classList.toggle("error", !valido);
  } else if (grupo && !marcar) {
    grupo.classList.remove("error");
  }
  return valido;
}

function validarTelefone(marcar = true) {
  const grupo = clienteTelefone.closest('.form-group');
  const digitos = clienteTelefone.value.replace(/\D/g, '');
  const valido = digitos === '' || (digitos.length >= 10 && digitos.length <= 11);
  if (grupo && marcar) {
    grupo.classList.toggle('error', !valido);
  } else if (grupo && !marcar) {
    grupo.classList.remove('error');
  }
  return valido;
}

function validarCpfCnpj(marcar = true) {
  const grupo = clienteCpf.closest('.form-group');
  const valor = clienteCpf.value.replace(/\D/g, '');
  let valido = true;
  if (valor) {
    if (valor.length === 11) {
      valido = validarCPF(valor);
    } else if (valor.length === 14) {
      valido = validarCNPJ(valor);
    } else {
      valido = false;
    }
  }
  if (grupo && marcar) {
    grupo.classList.toggle('error', !valido);
  } else if (grupo) {
    grupo.classList.remove('error');
  }
  return valido;
}

function validarCPF(cpf) {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  if (resto >= 10) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  if (resto >= 10) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

function validarCNPJ(cnpj) {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  tamanho += 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

async function buscarCep() {
  const cep = clienteCep.value.replace(/\D/g, '');
  if (cep.length !== 8 || !navigator.onLine) return;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.erro) return;
    const endereco = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`.trim();
    if (!clienteEndereco.value) {
      clienteEndereco.value = endereco;
    }
  } catch (err) {
    console.error('Erro ao buscar CEP', err);
  }
}

async function buscarCnpj() {
  const cnpj = clienteCpf.value.replace(/\D/g, '');
  if (cnpj.length !== 14 || !navigator.onLine) return;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!res.ok) return;
    const data = await res.json();
    const nome = data.nome_fantasia || data.razao_social;
    if (!clienteNome.value && nome) clienteNome.value = nome;
    const endereco = `${data.logradouro}${data.numero ? ', ' + data.numero : ''}, ${data.bairro}, ${data.municipio} - ${data.uf}`.trim();
    if (!clienteEndereco.value && data.logradouro) clienteEndereco.value = endereco;
    if (!clienteCep.value && data.cep) clienteCep.value = data.cep;
    if (!clienteTelefone.value && data.ddd_telefone_1) clienteTelefone.value = data.ddd_telefone_1;
    if (!clienteEmail.value && data.email) clienteEmail.value = data.email;
  } catch (err) {
    console.error('Erro ao buscar CNPJ', err);
  }
}


function atualizarEstadoBotaoProximo() {
  const tabAtual = document.querySelector(".tab-btn.active");
  if (tabAtual && tabAtual.getAttribute("data-tab") === "cliente") {
    nextTabBtn.disabled = !clienteNome.value.trim();
  } else {
    nextTabBtn.disabled = false;
  }
  if (nextTabBtn.disabled) {
    nextTabBtn.classList.add("disabled");
  } else {
    nextTabBtn.classList.remove("disabled");
  }
}

// Elementos do modal de seleção de produtos
const selecionarProdutosModal = document.getElementById("selecionar-produtos-modal");
const selecionarProdutosSearch = document.getElementById("selecionar-produtos-search");
const selecionarProdutosLista = document.getElementById("selecionar-produtos-lista");
const confirmarProdutosBtn = document.getElementById("confirmar-produtos");

// Elementos do modal de visualização de orçamento
const visualizarOrcamentoModal = document.getElementById("visualizar-orcamento-modal");
const orcamentoPreview = document.getElementById("orcamento-preview");
const imprimirOrcamentoBtn = document.getElementById("imprimir-orcamento");
const baixarPdfBtn = document.getElementById("baixar-pdf-orcamento");
const compartilharPdfBtn = document.getElementById("compartilhar-orcamento");

// Botões de fechar modal
const modalCloseBtns = document.querySelectorAll(".modal-close");
const modalCancelBtns = document.querySelectorAll(".modal-cancel");

/**
 * Ajusta o layout quando a largura da tela muda
 */
function updateLayout() {
  if (window.matchMedia("(min-width: 1024px)").matches) {
    sideMenu.classList.remove("open");
    overlay.classList.remove("active");
  }
}

function configurarMenuAdmin() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = usuarioAtual && usuarioAtual.admin ? '' : 'none';
  });
}

async function verificarSessao() {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();
    if (data.autenticado) {
      usuarioAtual = data.usuario;
      localStorage.setItem('usuarioAtual', JSON.stringify(usuarioAtual));
      iniciarAplicacao();
      configurarMenuAdmin();
      loginModal.classList.remove('active');
    } else {
      localStorage.removeItem('usuarioAtual');
      if (eventSource) { eventSource.close(); eventSource = null; }
      loginModal.classList.add('active');
      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          await realizarLogin();
        });
      }
    }
  } catch (e) {
    const stored = localStorage.getItem('usuarioAtual');
    if (stored) {
      usuarioAtual = JSON.parse(stored);
      iniciarAplicacao();
      configurarMenuAdmin();
      loginModal.classList.remove('active');
    } else {
      console.error('Falha ao verificar sessão', e);
      if (eventSource) { eventSource.close(); eventSource = null; }
      loginModal.classList.add('active');
    }
  }
}

async function realizarLogin() {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: loginUsuario.value, senha: loginSenha.value })
    });
    if (res.ok) {
      usuarioAtual = await res.json();
      localStorage.setItem('usuarioAtual', JSON.stringify(usuarioAtual));
      configurarMenuAdmin();
      loginModal.classList.remove('active');
      iniciarAplicacao();
    } else {
      mostrarToast('Credenciais inválidas');
    }
  } catch (err) {
    console.error('Erro ao fazer login', err);
    mostrarToast('Erro ao fazer login');
  }
}

function iniciarAplicacao() {
  const initial = window.location.hash.replace('#', '') || 'home';
  navigateToPage(initial, false);
  history.replaceState({ pageId: initial }, '', `#${initial}`);
  initNavigation();
  initModals();
  initHomePage();
  initProdutosPage();
  initOrcamentosPage();
  initUsuariosPage();
  initPerfilPage();
  carregarDadosIniciais();
  connectEventSource();
  initInstallPrompt();
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

}

/**
 * Inicializa o aplicativo quando o DOM estiver carregado
 */
document.addEventListener("DOMContentLoaded", () => {
  updateLayout();
  carregarFilaOffline();
  atualizarDisponibilidadeOnline();
  if (!navigator.onLine) {
    mostrarToast('Você está no modo offline');
  } else {
    processarFilaOffline();
  }
  verificarSessao();
});

window.addEventListener("popstate", async (e) => {
  const pageId = e.state?.pageId || "home";
  await navigateToPage(pageId, false);
});


/**
 * Carrega os dados iniciais (produtos, templates, orçamentos)
 */
async function carregarDadosIniciais() {
  mostrarLoading();
  try {
    // Carrega produtos primeiro, pois outros podem depender deles
    await carregarProdutos();
    await Promise.all([
      carregarTemplates(),
      carregarOrcamentos(),
    ]);
    if (usuarioAtual && usuarioAtual.admin) {
      await Promise.all([carregarUsuarios(), carregarRegistros()]);
    }
  } catch (error) {
    console.error("Erro ao carregar dados iniciais:", error);
    mostrarToast("Erro ao carregar dados. Verifique sua conexão.");
  } finally {
    esconderLoading();
  }
}

/**
 * Inicializa os eventos de navegação (menu lateral e inferior)
 */
function initNavigation() {
  menuToggle.addEventListener("click", () => {
    sideMenu.classList.add("open");
    overlay.classList.add("active");
  });
  menuClose.addEventListener("click", fecharMenu);
  overlay.addEventListener("click", fecharMenu);
  
  // Event listener para botão de atualização
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;
      refreshBtn.querySelector('.material-icons').style.animation = 'spin 1s linear infinite';
      
      try {
        await forceReloadData();
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.querySelector('.material-icons').style.animation = '';
      }
    });
  }
  
  menuItems.forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.preventDefault();
      const pageId = item.getAttribute("data-page");
      await navigateToPage(pageId);
      fecharMenu();
    });
  });
  bottomNavItems.forEach((item) => {
    item.addEventListener("click", async () => {
      const pageId = item.getAttribute("data-page");
      await navigateToPage(pageId);
    });
  });

  window.addEventListener("resize", updateLayout);

}

function fecharMenu() {
  sideMenu.classList.remove("open");
  overlay.classList.remove("active");
}

async function navigateToPage(pageId, push = true) {
  if (currentPage === pageId) return;
  if (!(await confirmExitIfEditing())) return;
  menuItems.forEach((i) => i.classList.toggle("active", i.getAttribute("data-page") === pageId));
  bottomNavItems.forEach((i) => i.classList.toggle("active", i.getAttribute("data-page") === pageId));
  pages.forEach((page) => page.classList.toggle("active", page.id === pageId));
  currentPage = pageId;
  if (usuarioAtual && usuarioAtual.admin) {
    if (pageId === 'usuarios') carregarUsuarios();
    if (pageId === 'registros') carregarRegistros();
  }
  if (pageId === 'perfil') carregarPerfil();
  if (push) {
    history.pushState({ pageId }, "", `#${pageId}`);
  }
}

async function confirmExitIfEditing() {
  if (isEditing) {
    return await mostrarConfirmacao("Tem certeza que deseja sair? Dados não salvos serão perdidos.");
  }
  return true;
}

async function fecharModalComConfirmacao(modal) {
  if (!modal) return;
  const requiresConfirm = modal.id === "produto-modal" || modal.id === "orcamento-modal";
  if (requiresConfirm && !(await confirmExitIfEditing())) {
    return;
  }
  modal.classList.remove("active");
  if (modal.id === "visualizar-orcamento-modal") {
    orcamentoPreview.innerHTML = "";
  }
  if (requiresConfirm) {
    isEditing = false;
    currentForm = null;
  }
}

function initModals() {
  modalCloseBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const modal = btn.closest(".modal");
      await fecharModalComConfirmacao(modal);
    });
  });
  modalCancelBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const modal = btn.closest(".modal");
      await fecharModalComConfirmacao(modal);
    });
  });
  initProdutoModal();
  initOrcamentoModal();
  initSelecionarProdutosModal();
  initVisualizarOrcamentoModal();
}

function initHomePage() {
  // Delegação de eventos para garantir funcionamento mesmo com elementos ocultos
  const dashboard = document.querySelector('.dashboard');
  if (!dashboard) return;
  const map = {
    'card-produtos': 'produtos',
    'card-orcamentos': 'orcamentos',
    'card-usuarios': 'usuarios',
    'card-registros': 'registros',
    'card-perfil': 'perfil',
  };
  dashboard.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const pageId = map[card.id];
    if (pageId) navigateToPage(pageId);
  });
}

function initProdutosPage() {
  addProdutoBtn.addEventListener("click", () => abrirModalProduto());
  const emptyBtnInicial = document.getElementById('empty-add-produto-btn');
  if (emptyBtnInicial) emptyBtnInicial.addEventListener('click', () => addProdutoBtn.click());
  produtoSearch.addEventListener("input", () => {
    const termo = produtoSearch.value.toLowerCase();
    filtrarProdutos(termo);
    if (produtoSugestoes) {
      const sugestoes = produtosCache
        .filter(p => p.nome.toLowerCase().includes(termo))
        .slice(0, 5)
        .map(p => `<option value="${p.nome}">`)
        .join('');
      produtoSugestoes.innerHTML = sugestoes;
    }
  });
}

function initOrcamentosPage() {
  addOrcamentoBtn.addEventListener("click", () => abrirModalOrcamento());
  const emptyBtnInicial = document.getElementById('empty-add-orcamento-btn');
  if (emptyBtnInicial) emptyBtnInicial.addEventListener('click', () => addOrcamentoBtn.click());
  orcamentoSearch.addEventListener("input", () => {
    const termo = orcamentoSearch.value.toLowerCase();
    filtrarOrcamentos(termo);
  });
}

function initUsuariosPage() {
  if (!addUsuarioBtn) return;
  addUsuarioBtn.addEventListener("click", () => abrirModalUsuario());
}

function initPerfilPage() {
  if (!perfilForm) return;
  perfilFotoBtn.addEventListener('click', () => perfilFotoInput.click());
  perfilFotoInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        perfilFotoPreview.src = ev.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);

      const formData = new FormData();
      formData.append('foto', e.target.files[0]);
      fetch('/api/usuarios/me', { method: 'PUT', body: formData })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(user => {
          usuarioAtual = { ...usuarioAtual, ...user };
          localStorage.setItem('usuarioAtual', JSON.stringify(usuarioAtual));
          mostrarToast('Foto atualizada');
        })
        .catch(() => mostrarToast('Erro ao atualizar foto'));
    }
  });
  perfilForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarLoading();
    try {
      const formData = new FormData();
      formData.append('usuario', perfilNome.value);
      if (perfilSenha.value) formData.append('senha', perfilSenha.value);
      if (perfilFotoInput.files && perfilFotoInput.files[0]) {
        formData.append('foto', perfilFotoInput.files[0]);
      }
      const res = await fetch('/api/usuarios/me', { method: 'PUT', body: formData });
      if (!res.ok) throw new Error('Falha ao salvar perfil');
      const user = await res.json();
      usuarioAtual = { ...usuarioAtual, ...user };
      mostrarToast('Perfil atualizado');
    } catch (err) {
      console.error(err);
      mostrarToast('Erro ao salvar perfil');
    } finally {
      esconderLoading();
    }
  });
  logoutBtn?.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    usuarioAtual = null;
    localStorage.removeItem('usuarioAtual');
    loginModal.classList.add('active');
  });
  carregarPerfil();
}

/**
 * Inicializa o modal de produto (com preview condicional)
 */
function initProdutoModal() {
  selectFotoBtn.addEventListener("click", () => produtoFotoInput.click());

  produtoForm.addEventListener("input", markFormChanged);
  produtoForm.addEventListener("change", markFormChanged);

  produtoFotoInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        fotoPreview.src = event.target.result;
        fotoPreviewContainer.style.display = "block"; // Mostra o preview
      };
      reader.readAsDataURL(e.target.files[0]);
    } else {
      // Se nenhum arquivo for selecionado (ou for cancelado), esconde o preview
      fotoPreview.src = "#"; // Limpa src anterior
      fotoPreviewContainer.style.display = "none";
    }
  });

  produtoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!navigator.onLine) {
      const dados = { nome: produtoNome.value, descricao: produtoDescricao.value, valor: produtoValor.value };
      if (produtoFotoInput.files && produtoFotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          dados.foto = reader.result;
          offlineQueue.push({ tipo: 'addProduto', dados });
          salvarFilaOffline();
          const tempId = 'off-' + Date.now();
          produtosCache.push({ id: tempId, ...dados });
          renderizarProdutos();
          produtoModal.classList.remove("active");
          mostrarToast('Produto salvo offline');
        };
        reader.readAsDataURL(produtoFotoInput.files[0]);
      } else {
        offlineQueue.push({ tipo: 'addProduto', dados });
        salvarFilaOffline();
        const tempId = 'off-' + Date.now();
        produtosCache.push({ id: tempId, ...dados });
        renderizarProdutos();
        produtoModal.classList.remove("active");
        mostrarToast('Produto salvo offline');
      }
      return;
    }
    mostrarLoading();
    try {
      const formData = new FormData();
      formData.append("nome", produtoNome.value);
      formData.append("descricao", produtoDescricao.value);
      formData.append("valor", produtoValor.value);
      // Anexa o arquivo de imagem apenas se um novo foi selecionado
      if (produtoFotoInput.files && produtoFotoInput.files[0]) {
        formData.append("foto", produtoFotoInput.files[0]);
      }
      // Se estiver editando e não selecionou nova foto, o backend manterá a antiga (Base64)

      const method = produtoId.value ? "PUT" : "POST";
      const url = produtoId.value ? `/api/produtos/${produtoId.value}` : "/api/produtos";

      const response = await fetch(url, { method, body: formData });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.erro || `Erro ${response.status} ao salvar produto`);
      }

      await carregarProdutos(); // Recarrega a lista para refletir a mudança
      produtoModal.classList.remove("active");
      isEditing = false;
      currentForm = null;
      mostrarToast("Produto salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      mostrarToast(`Erro ao salvar produto: ${error.message}`);
    } finally {
      esconderLoading();
    }
  });
}

/**
 * Inicializa o modal de orçamento
 */
function initOrcamentoModal() {
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      ativarTab(tab);
    });
  });
  prevTabBtn.addEventListener("click", navegarTabAnterior);
  nextTabBtn.addEventListener("click", navegarProximaTab);
  orcamentoForm.addEventListener("input", markFormChanged);
  orcamentoForm.addEventListener("change", markFormChanged);
  clienteNome.addEventListener("input", () => {
    validarClienteNome();
    atualizarEstadoBotaoProximo();
  });
  if (clienteTelefone) {
    clienteTelefone.addEventListener('input', () => validarTelefone());
  }
  if (clienteCpf) {
    clienteCpf.addEventListener('input', () => validarCpfCnpj());
    clienteCpf.addEventListener('blur', buscarCnpj);
  }
  if (clienteCep) {
    clienteCep.addEventListener('blur', buscarCep);
  }
  addProdutosBtn.addEventListener("click", abrirModalSelecionarProdutos);

  formaPagamentoSelect.addEventListener("change", () => {
    const fp = formaPagamentoSelect.value;
    if (fp === "avista") {
      avistaGrupo.style.display = "block";
      prazoGrupo.style.display = "none";
    } else {
      avistaGrupo.style.display = "none";
      prazoGrupo.style.display = "block";
    }
  });

  tipoDescontoSelect.addEventListener("change", () => {
    const tipo = tipoDescontoSelect.value;
    if (tipo === "nenhum") {
      valorDescontoGroup.style.display = "none";
      valorDescontoInput.value = "";
      valorDescontoInput.required = false;
    } else {
      valorDescontoGroup.style.display = "block";
      valorDescontoHelper.textContent = tipo === "percentual" ? "Digite a porcentagem de desconto (ex: 10 para 10%)" : "Digite o valor fixo do desconto em R$";
      valorDescontoInput.required = true;
    }
  });

  orcamentoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!navigator.onLine) {
      if (!validarClienteNome() || !validarTelefone() || !validarCpfCnpj() || produtosSelecionados.length === 0) {
        mostrarToast('Preencha todos os dados obrigatórios');
        return;
      }
      const templateSelecionado = document.querySelector(".template-item.selected");
      if (!templateSelecionado) {
        mostrarToast("Selecione um template");
        return;
      }
      if (valorDescontoInput.required && !valorDescontoInput.value) {
        mostrarToast("Preencha o valor do desconto");
        return;
      }
      const dadosOrcamento = {
        nomeCliente: clienteNome.value,
        cepCliente: clienteCep.value,
        enderecoCliente: clienteEndereco.value,
        telefoneCliente: clienteTelefone.value,
        emailCliente: clienteEmail.value,
        cpfCliente: clienteCpf.value,
        templateId: templateSelecionado.getAttribute("data-id"),
        produtos: produtosSelecionados.map(p => ({ id: p.id, quantidade: p.quantidade })),
        observacoes: orcamentoObservacoes.value,
        tipoDesconto: tipoDescontoSelect.value === "nenhum" ? null : tipoDescontoSelect.value,
        valorDesconto: valorDescontoInput.value || 0,
        formaPagamento: formaPagamentoSelect.value,
        avistaTipo: avistaTipoSelect.value,
        parcelas: parseInt(prazoParcelasInput.value, 10) || 1,
        jurosMes: parseFloat(prazoJurosInput.value) || 0,
      };
      offlineQueue.push({ tipo: 'addOrcamento', dados: dadosOrcamento });
      salvarFilaOffline();
      const tempId = 'off-' + Date.now();
      orcamentosCache.push({ id: tempId, nomeCliente: dadosOrcamento.nomeCliente, valorTotal: 0, dataCriacao: new Date().toISOString() });
      renderizarOrcamentos();
      orcamentoModal.classList.remove("active");
      mostrarToast('Orçamento salvo offline');
      return;
    }
    if (!validarClienteNome()) {
      mostrarToast("Preencha o nome do cliente");
      ativarTab("cliente");
      clienteNome.focus();
      atualizarEstadoBotaoProximo();
      return;
    }
    if (!validarTelefone()) {
      mostrarToast("Telefone inválido");
      ativarTab("cliente");
      clienteTelefone.focus();
      return;
    }
    if (!validarCpfCnpj()) {
      mostrarToast("CPF/CNPJ inválido");
      ativarTab("cliente");
      clienteCpf.focus();
      return;
    }
    if (produtosSelecionados.length === 0) {
      mostrarToast("Selecione pelo menos um produto");
      ativarTab("produtos");
      return;
    }
    const templateSelecionado = document.querySelector(".template-item.selected");
    if (!templateSelecionado) {
      mostrarToast("Selecione um template");
      ativarTab("template");
      return;
    }
    if (valorDescontoInput.required && !valorDescontoInput.value) {
        mostrarToast("Preencha o valor do desconto");
        ativarTab("desconto");
        return;
    }

    mostrarLoading();
    try {
      const dadosOrcamento = {
        nomeCliente: clienteNome.value,
        cepCliente: clienteCep.value,
        enderecoCliente: clienteEndereco.value,
        telefoneCliente: clienteTelefone.value,
        emailCliente: clienteEmail.value,
        cpfCliente: clienteCpf.value,
        templateId: templateSelecionado.getAttribute("data-id"),
        produtos: produtosSelecionados.map((p) => ({ id: p.id, quantidade: p.quantidade })),
        observacoes: orcamentoObservacoes.value,
        tipoDesconto: tipoDescontoSelect.value === "nenhum" ? null : tipoDescontoSelect.value,
        valorDesconto: valorDescontoInput.value || 0,
        formaPagamento: formaPagamentoSelect.value,
        avistaTipo: avistaTipoSelect.value,
        parcelas: parseInt(prazoParcelasInput.value, 10) || 1,
        jurosMes: parseFloat(prazoJurosInput.value) || 0,
      };

      const orcId = orcamentoIdInput.value;
      const response = await fetch(orcId ? `/api/orcamentos/${orcId}` : "/api/orcamentos", {
        method: orcId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosOrcamento),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.erro || `Erro ${response.status} ao criar orçamento`);
      }

      const orcamento = await response.json();
      await carregarOrcamentos();
      orcamentoModal.classList.remove("active");
      isEditing = false;
      currentForm = null;
      mostrarToast(orcId ? "Orçamento atualizado" : "Orçamento criado com sucesso!");
      abrirModalVisualizarOrcamento(orcamento.id);
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      mostrarToast(`Erro ao criar orçamento: ${error.message}`);
    } finally {
      esconderLoading();
    }
  });
}

function ativarTab(tabId) {
  tabBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-tab") === tabId));
  tabContents.forEach((content) => content.style.display = content.id === `tab-${tabId}` ? "block" : "none");
  atualizarBotoesNavegacaoTab();
  atualizarEstadoBotaoProximo();
}

function navegarTabAnterior() {
  const tabAtual = document.querySelector(".tab-btn.active");
  const tabAnterior = tabAtual.previousElementSibling;
  if (tabAnterior && tabAnterior.classList.contains("tab-btn")) {
    ativarTab(tabAnterior.getAttribute("data-tab"));
  }
}

function navegarProximaTab() {
  const tabAtual = document.querySelector(".tab-btn.active");
  const proximaTab = tabAtual.nextElementSibling;
  if (proximaTab && proximaTab.classList.contains("tab-btn")) {
    if (tabAtual.getAttribute("data-tab") === "cliente") {
      if (!validarClienteNome()) {
        clienteNome.focus();
        mostrarToast("Preencha o nome do cliente");
        atualizarEstadoBotaoProximo();
        return;
      }
    }
    ativarTab(proximaTab.getAttribute("data-tab"));
  }
}

function atualizarBotoesNavegacaoTab() {
  const tabAtual = document.querySelector(".tab-btn.active");
  const isPrimeiraTab = !tabAtual.previousElementSibling?.classList.contains("tab-btn");
  const isUltimaTab = !tabAtual.nextElementSibling?.classList.contains("tab-btn");
  prevTabBtn.disabled = isPrimeiraTab;
  nextTabBtn.style.display = isUltimaTab ? "none" : "inline-flex";
  submitOrcamentoBtn.style.display = isUltimaTab ? "inline-flex" : "none";
  atualizarEstadoBotaoProximo();
}

function initSelecionarProdutosModal() {
  selecionarProdutosSearch.addEventListener("input", () => {
    const termo = selecionarProdutosSearch.value.toLowerCase();
    filtrarProdutosSelecionaveis(termo);
  });
  confirmarProdutosBtn.addEventListener("click", () => {
    selecionarProdutosModal.classList.remove("active");
    renderizarProdutosSelecionadosNoForm();
  });
}

function initVisualizarOrcamentoModal() {
  imprimirOrcamentoBtn.addEventListener("click", imprimirOrcamento);
  baixarPdfBtn.addEventListener("click", baixarPdfOrcamento);
  if (compartilharPdfBtn) {
    compartilharPdfBtn.addEventListener("click", compartilharPdfOrcamento);
  }
}

// --- Funções de Carregamento de Dados --- //

async function carregarProdutos(forceReload = false) {
  if (produtosCache.length > 0 && !forceReload) {
    renderizarProdutos();
    return;
  }
  
  // Mostra skeleton loading
  if (produtosLista) {
    produtosLista.innerHTML = Array.from({ length: 3 })
      .map(() => `
        <div class="item-card">
          <div class="skeleton skeleton-image"></div>
          <div class="item-details" style="width:100%">
            <div class="skeleton skeleton-text" style="width:60%"></div>
            <div class="skeleton skeleton-text" style="width:40%"></div>
          </div>
        </div>
      `)
      .join("");
  }
  
  try {
    const response = await fetchWithNoCache("/api/produtos");
    if (!response.ok) throw new Error("Erro ao buscar produtos");
    produtosCache = await response.json();
    renderizarProdutos();
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    mostrarToast("Erro ao carregar produtos.", "error");
    produtosCache = []; // Limpa cache em caso de erro
    renderizarProdutos(); // Renderiza estado vazio
  }
}

async function carregarTemplates(forceReload = false) {
  if (templatesCache.length > 0 && !forceReload) {
    return;
  }
  
  try {
    const response = await fetchWithNoCache("/api/templates");
    if (!response.ok) throw new Error("Erro ao buscar templates");
    templatesCache = await response.json();
  } catch (error) {
    console.error("Erro ao carregar templates:", error);
    mostrarToast("Erro ao carregar templates.", "error");
    templatesCache = [];
  }
}

async function carregarOrcamentos(forceReload = false) {
  if (orcamentosCache.length > 0 && !forceReload) {
    renderizarOrcamentos();
    return;
  }
  
  // Mostra skeleton loading
  if (orcamentosLista) {
    orcamentosLista.innerHTML = Array.from({ length: 3 })
      .map(() => `
        <div class="item-card">
          <div class="item-details" style="width:100%">
            <div class="skeleton skeleton-text" style="width:70%"></div>
            <div class="skeleton skeleton-text" style="width:50%"></div>
          </div>
        </div>
      `)
      .join("");
  }
  
  try {
    const response = await fetchWithNoCache("/api/orcamentos");
    if (response.ok) {
      orcamentosCache = await response.json();
    } else {
      console.warn('Não foi possível obter orçamentos:', response.status);
      orcamentosCache = [];
    }
    renderizarOrcamentos();
  } catch (error) {
    console.error('Falha ao carregar orçamentos', error);
    orcamentosCache = [];
    renderizarOrcamentos();
  }
}

// --- Funções de Renderização --- //

function renderizarProdutos() {
  if (!produtosLista) return;
  if (produtosCache.length === 0) {
    produtosLista.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">inventory_2</span>
        <h3>Nenhum produto cadastrado</h3>
        <p>Adicione produtos para incluí-los nos orçamentos.</p>
        <button id="empty-add-produto-btn" class="btn btn-primary">
          <span class="material-icons">add</span> Adicionar Produto
        </button>
      </div>
    `;
    const btn = produtosLista.querySelector('#empty-add-produto-btn');
    if (btn) btn.addEventListener('click', () => addProdutoBtn.click());
    return;
  }

  produtosLista.innerHTML = produtosCache
    .map((produto) => {
      // Usa a string Base64 diretamente se existir, senão usa placeholder
      const imgSrc = produto.foto ? produto.foto : "/images/placeholder.png";
      return `
        <div class="item-card" data-id="${produto.id}">
          <img src="${imgSrc}" alt="${produto.nome}" class="item-image" loading="lazy">
          <div class="item-details">
            <div class="item-title">${produto.nome}</div>
            <div class="item-subtitle">${formatarMoeda(produto.valor)}</div>
          </div>
          <div class="item-actions">
            <button class="btn-icon edit-produto" aria-label="Editar">
              <span class="material-icons">edit</span>
            </button>
            <button class="btn-icon delete-produto" aria-label="Excluir">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  // Adiciona eventos após renderizar
  produtosLista.querySelectorAll(".edit-produto").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const produtoId = e.target.closest(".item-card").getAttribute("data-id");
      abrirModalProduto(produtoId);
      e.stopPropagation();
    });
  });

  produtosLista.querySelectorAll(".delete-produto").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const produtoId = e.target.closest(".item-card").getAttribute("data-id");
      confirmarExclusaoProduto(produtoId);
      e.stopPropagation();
    });
  });
}

function renderizarOrcamentos() {
  if (!orcamentosLista) return;
  if (orcamentosCache.length === 0) {
    orcamentosLista.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">description</span>
        <h3>Nenhum orçamento cadastrado</h3>
        <p>Crie seu primeiro orçamento.</p>
         <button id="empty-add-orcamento-btn" class="btn btn-primary">
          <span class="material-icons">add</span> Criar Orçamento
        </button>
      </div>
    `;
    const btn = orcamentosLista.querySelector('#empty-add-orcamento-btn');
    if (btn) btn.addEventListener('click', () => addOrcamentoBtn.click());
    return;
  }

  const orcamentosOrdenados = [...orcamentosCache].sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

  orcamentosLista.innerHTML = orcamentosOrdenados
    .map((orcamento) => `
      <div class="item-card" data-id="${orcamento.id}">
        <div class="item-details">
          <div class="item-title">${orcamento.nomeCliente} (ID: ${orcamento.id})</div>
          <div class="item-subtitle">
            ${formatarData(orcamento.dataCriacao)} - ${formatarMoeda(orcamento.valorTotal)}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-icon view-orcamento" aria-label="Visualizar">
            <span class="material-icons">visibility</span>
          </button>
          <button class="btn-icon edit-orcamento" aria-label="Editar">
            <span class="material-icons">edit</span>
          </button>
          <button class="btn-icon delete-orcamento" aria-label="Excluir">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `)
    .join("");

  orcamentosLista.querySelectorAll(".view-orcamento").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const orcamentoId = e.target.closest(".item-card").getAttribute("data-id");
      abrirModalVisualizarOrcamento(orcamentoId);
      e.stopPropagation();
    });
  });

  orcamentosLista.querySelectorAll(".edit-orcamento").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const orcamentoId = e.target.closest(".item-card").getAttribute("data-id");
      abrirModalEditarOrcamento(orcamentoId);
      e.stopPropagation();
    });
  });


  orcamentosLista.querySelectorAll(".delete-orcamento").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const orcamentoId = e.target.closest(".item-card").getAttribute("data-id");
      confirmarExclusaoOrcamento(orcamentoId);
      e.stopPropagation();
    });
  });
}

function renderizarTemplates() {
  if (!templatesLista) return;
  if (templatesCache.length === 0) {
    templatesLista.innerHTML = `<div class="empty-state"><p>Nenhum template disponível</p></div>`;
    return;
  }
  templatesLista.innerHTML = templatesCache
    .map((template) => `
      <div class="template-item" data-id="${template.id}">
        <span class="material-icons">description</span>
        <span>${template.nome}</span>
      </div>
    `)
    .join("");
  templatesLista.querySelectorAll(".template-item").forEach((item) => {
    item.addEventListener("click", () => {
      templatesLista.querySelectorAll(".template-item").forEach((i) => i.classList.remove("selected"));
      item.classList.add("selected");
    });
  });
}

function renderizarProdutosSelecionaveis() {
  if (!selecionarProdutosLista) return;
  if (produtosCache.length === 0) {
    selecionarProdutosLista.innerHTML = `<div class="empty-state"><p>Nenhum produto cadastrado</p></div>`;
    return;
  }

  selecionarProdutosLista.innerHTML = produtosCache
    .map((produto) => {
      const selecionado = produtosSelecionados.find((p) => p.id === produto.id);
      const quantidade = selecionado ? selecionado.quantidade : 0;
      const imgSrc = produto.foto ? produto.foto : "/images/placeholder.png";
      return `
        <div class="item-card selectable ${selecionado ? "selected" : ""}" data-id="${produto.id}">
          <img src="${imgSrc}" alt="${produto.nome}" class="item-image" loading="lazy">
          <div class="item-details">
            <div class="item-title">${produto.nome}</div>
            <div class="item-subtitle">${formatarMoeda(produto.valor)}</div>
          </div>
          <div class="item-quantity">
            <button class="btn-icon quantity-decrease" ${quantidade === 0 ? "disabled" : ""}>-</button>
            <input type="number" class="quantity-input" value="${quantidade}" min="0">
            <button class="btn-icon quantity-increase">+</button>
          </div>
        </div>
      `;
    })
    .join("");

  selecionarProdutosLista.querySelectorAll(".item-card.selectable").forEach(card => {
    const produtoId = card.getAttribute("data-id");
    const input = card.querySelector(".quantity-input");
    const decreaseBtn = card.querySelector(".quantity-decrease");
    const increaseBtn = card.querySelector(".quantity-increase");

    input.addEventListener("change", (e) => {
        const novaQuantidade = parseInt(e.target.value, 10) || 0;
        atualizarQuantidadeProdutoSelecionado(produtoId, novaQuantidade, card);
    });
    decreaseBtn.addEventListener("click", () => {
        const novaQuantidade = Math.max(0, (parseInt(input.value, 10) || 0) - 1);
        input.value = novaQuantidade;
        atualizarQuantidadeProdutoSelecionado(produtoId, novaQuantidade, card);
    });
    increaseBtn.addEventListener("click", () => {
        const novaQuantidade = (parseInt(input.value, 10) || 0) + 1;
        input.value = novaQuantidade;
        atualizarQuantidadeProdutoSelecionado(produtoId, novaQuantidade, card);
    });
  });
}

function renderizarProdutosSelecionadosNoForm() {
  if (!produtosSelecionadosEl) return;
  if (produtosSelecionados.length === 0) {
    produtosSelecionadosEl.innerHTML = `<div class="empty-state"><p>Nenhum produto selecionado</p></div>`;
    return;
  }

  produtosSelecionadosEl.innerHTML = produtosSelecionados
    .map((produto) => {
        const imgSrc = produto.foto ? produto.foto : "/images/placeholder.png";
        return `
          <div class="selected-item" data-id="${produto.id}">
            <img src="${imgSrc}" alt="${produto.nome}" class="item-image-small" loading="lazy">
            <div class="item-details">
              <span>${produto.nome} (Qtd: ${produto.quantidade})</span>
            </div>
            <button class="btn-icon remove-produto-selecionado" aria-label="Remover">
              <span class="material-icons">close</span>
            </button>
          </div>
        `;
    })
    .join("");

  produtosSelecionadosEl.querySelectorAll(".remove-produto-selecionado").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const produtoId = e.target.closest(".selected-item").getAttribute("data-id");
        atualizarQuantidadeProdutoSelecionado(produtoId, 0); // Remove ao setar qtd para 0
        renderizarProdutosSelecionadosNoForm(); // Re-renderiza a lista no form
      });
    });
}

// --- Funções de Abertura de Modais --- //

async function abrirModalProduto(id = null) {
  produtoForm.reset();
  produtoId.value = "";
  produtoFotoInput.value = ""; // Limpa seleção de arquivo anterior
  fotoPreview.src = "#"; // Limpa src do preview
  fotoPreviewContainer.style.display = "none"; // Esconde o preview inicialmente

  if (id) {
    produtoModalTitle.textContent = "Editar Produto";
    // Busca o produto completo (com foto) da API, pois o cache pode não ter
    mostrarLoading();
    try {
        const response = await fetch(`/api/produtos/${id}`);
        if (!response.ok) throw new Error("Produto não encontrado para edição.");
        const produto = await response.json();

        produtoId.value = produto.id;
        produtoNome.value = produto.nome;
        produtoDescricao.value = produto.descricao || "";
        produtoValor.value = produto.valor;
        // Se o produto tem foto, mostra no preview
        if (produto.foto) {
            fotoPreview.src = produto.foto;
            fotoPreviewContainer.style.display = "block";
        }
    } catch (error) {
        console.error("Erro ao buscar produto para edição:", error);
        mostrarToast(error.message || "Erro ao carregar dados do produto.");
        esconderLoading();
        return; // Não abre o modal se não conseguir carregar
    } finally {
        esconderLoading();
    }

  } else {
    produtoModalTitle.textContent = "Novo Produto";
    // Garante que campos estejam limpos para novo produto
    produtoNome.value = "";
    produtoDescricao.value = "";
    produtoValor.value = "";
  }
  produtoModal.classList.add("active");
  setCurrentForm(produtoForm);
}

function abrirModalOrcamento() {
  orcamentoForm.reset();
  produtosSelecionados = [];
  renderizarProdutosSelecionadosNoForm();
  renderizarTemplates();
  ativarTab("cliente");
  tipoDescontoSelect.value = "nenhum";
  valorDescontoGroup.style.display = "none";
  valorDescontoInput.value = "";
  valorDescontoInput.required = false;
  formaPagamentoSelect.value = "avista";
  avistaGrupo.style.display = "block";
  prazoGrupo.style.display = "none";
  avistaTipoSelect.value = "dinheiro";
  prazoParcelasInput.value = 1;
  prazoJurosInput.value = 0;
  orcamentoIdInput.value = "";
  clienteCpf.value = "";
  clienteCep.value = "";
  orcamentoModal.classList.add("active");
  setCurrentForm(orcamentoForm);
  validarClienteNome(false);
  atualizarEstadoBotaoProximo();
}

async function abrirModalEditarOrcamento(id) {
  if (!id) return;
  orcamentoForm.reset();
  produtosSelecionados = [];
  ativarTab("cliente");
  mostrarLoading();
  try {
    const res = await fetch(`/api/orcamentos/${id}`);
    if (!res.ok) throw new Error("Orçamento não encontrado");
    const orc = await res.json();
    orcamentoIdInput.value = id;
    clienteNome.value = orc.nomeCliente;
    clienteCep.value = orc.cepCliente || "";
    clienteEndereco.value = orc.enderecoCliente || "";
    clienteTelefone.value = orc.telefoneCliente || "";
    clienteEmail.value = orc.emailCliente || "";
    clienteCpf.value = orc.cpfCliente || "";
    orcamentoObservacoes.value = orc.observacoes || "";
    formaPagamentoSelect.value = orc.formaPagamento || "avista";
    if (formaPagamentoSelect.value === "avista") {
      avistaGrupo.style.display = "block";
      prazoGrupo.style.display = "none";
      avistaTipoSelect.value = orc.avistaTipo || "dinheiro";
      prazoParcelasInput.value = 1;
      prazoJurosInput.value = 0;
    } else {
      avistaGrupo.style.display = "none";
      prazoGrupo.style.display = "block";
      prazoParcelasInput.value = orc.parcelas || 1;
      prazoJurosInput.value = orc.jurosMes || 0;
    }
    tipoDescontoSelect.value = orc.tipoDesconto || "nenhum";
    if (orc.tipoDesconto && orc.valorDescontoInput) {
      valorDescontoInput.value = orc.valorDescontoInput;
      valorDescontoGroup.style.display = "block";
      valorDescontoInput.required = true;
    } else {
      valorDescontoInput.value = "";
      valorDescontoGroup.style.display = "none";
      valorDescontoInput.required = false;
    }
    produtosSelecionados = orc.itens.map(it => ({
      id: it.id,
      nome: it.nome,
      valorUnitario: it.valorUnitario,
      quantidade: it.quantidade,
      foto: it.foto
    }));
    renderizarProdutosSelecionadosNoForm();
    await carregarTemplates();
    renderizarTemplates();
    templatesLista.querySelectorAll(".template-item").forEach(item => {
      item.classList.toggle("selected", item.getAttribute("data-id") === orc.templateId);
    });
    orcamentoModal.classList.add("active");
    setCurrentForm(orcamentoForm);
    validarClienteNome(false);
    atualizarEstadoBotaoProximo();
  } catch (err) {
    console.error("Erro ao abrir orçamento para edição", err);
    mostrarToast("Erro ao carregar orçamento");
  } finally {
    esconderLoading();
  }
}

function abrirModalSelecionarProdutos() {
  renderizarProdutosSelecionaveis();
  selecionarProdutosModal.classList.add("active");
}

async function abrirModalVisualizarOrcamento(id) {
  if (!id) return;
  iniciarProgressoPdf();
  orcamentoPreview.innerHTML = `<div class="loading"><div class="spinner"></div><p>Gerando pré-visualização...</p></div>`;
  visualizarOrcamentoModal.classList.add("active");

  try {
    const response = await fetch(`/api/orcamentos/${id}/gerar`);
    if (!response.ok) {
      throw new Error("Erro ao gerar pré-visualização do orçamento");
    }
    const data = await response.json();
    orcamentoPreview.innerHTML = data.html;
    imprimirOrcamentoBtn.setAttribute("data-id", id);
    baixarPdfBtn.setAttribute("data-id", id);
    if (compartilharPdfBtn) compartilharPdfBtn.setAttribute("data-id", id);
  } catch (error) {
    console.error("Erro ao visualizar orçamento:", error);
    orcamentoPreview.innerHTML = `<p class="error">Erro ao carregar orçamento: ${error.message}</p>`;
    mostrarToast("Erro ao carregar orçamento.");
  } finally {
    finalizarProgressoPdf();
  }
}

// --- Funções de Ação (Excluir, Editar, etc.) --- //

async function confirmarExclusaoProduto(id) {
  if (await mostrarConfirmacao("Tem certeza que deseja excluir este produto?")) {
    excluirProduto(id);
  }
}

async function excluirProduto(id) {
  if (!navigator.onLine) {
    mostrarToast('Função indisponível offline');
    return;
  }
  mostrarLoading();
  try {
    const response = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Erro ao excluir produto");
    }
    await carregarProdutos();
    mostrarToast("Produto excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    mostrarToast("Erro ao excluir produto.");
  } finally {
    esconderLoading();
  }
}

async function confirmarExclusaoOrcamento(id) {
  if (await mostrarConfirmacao("Tem certeza que deseja excluir este orçamento?")) {
    excluirOrcamento(id);
  }
}

async function excluirOrcamento(id) {
  if (!navigator.onLine) {
    mostrarToast('Função indisponível offline');
    return;
  }
  mostrarLoading();
  try {
    const response = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Erro ao excluir orçamento");
    }
    await carregarOrcamentos();
    mostrarToast("Orçamento excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir orçamento:", error);
    mostrarToast("Erro ao excluir orçamento.");
  } finally {
    esconderLoading();
  }
}


function atualizarQuantidadeProdutoSelecionado(produtoId, quantidade, cardElement = null) {
  const index = produtosSelecionados.findIndex(p => p.id === produtoId);
  const produtoOriginal = produtosCache.find(p => p.id === produtoId);

  if (quantidade > 0) {
    if (!produtoOriginal) return; // Não consegue adicionar sem dados de referência

    if (index > -1) {
      produtosSelecionados[index].quantidade = quantidade;
    } else {
      produtosSelecionados.push({
        id: produtoId,
        nome: produtoOriginal.nome,
        valorUnitario: produtoOriginal.valor,
        quantidade,
        foto: produtoOriginal.foto
      });
    }
    if (cardElement) cardElement.classList.add("selected");
  } else {
    if (index > -1) {
      produtosSelecionados.splice(index, 1);
    }
    if (cardElement) cardElement.classList.remove("selected");
  }

  if (cardElement) {
    const decreaseBtn = cardElement.querySelector(".quantity-decrease");
    if (decreaseBtn) decreaseBtn.disabled = quantidade === 0;
  }
}

// --- Funções de Filtragem --- //

function filtrarProdutos(termo) {
  const itens = produtosLista.querySelectorAll(".item-card");
  itens.forEach((item) => {
    const nome = item.querySelector(".item-title").textContent.toLowerCase();
    item.style.display = nome.includes(termo) ? "flex" : "none";
  });
}

function filtrarOrcamentos(termo) {
  const itens = orcamentosLista.querySelectorAll(".item-card");
  itens.forEach((item) => {
    const nome = item.querySelector(".item-title").textContent.toLowerCase();
    item.style.display = nome.includes(termo) ? "flex" : "none";
  });
}

function filtrarProdutosSelecionaveis(termo) {
  const itens = selecionarProdutosLista.querySelectorAll(".item-card");
  itens.forEach((item) => {
    const nome = item.querySelector(".item-title").textContent.toLowerCase();
    item.style.display = nome.includes(termo) ? "flex" : "none";
  });
}

// --- Funções de Ação do Orçamento (PDF, Imprimir) --- //

async function baixarPdfOrcamento() {
  const orcamentoId = baixarPdfBtn.getAttribute("data-id");
  if (!orcamentoId) return;
  if (!navigator.onLine) {
    await gerarPdfOffline(orcamentoId, "download");
    return;
  }
  iniciarProgressoPdf();
  try {
    const response = await fetch(`/api/orcamentos/${orcamentoId}/pdf`, { cache: 'no-cache' });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status} ao gerar PDF`);
    }
    const disposition = response.headers.get("content-disposition");
    let filename = `orcamento_${orcamentoId}.pdf`;
    if (disposition && disposition.indexOf("attachment") !== -1) {
      const filenameRegex = /filename[^;=\n]*=(([""]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) filename = matches[1].replace(/[""]/g, "");
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
    mostrarToast("Download do PDF iniciado!");
  } catch (error) {
    console.error("Erro ao baixar PDF:", error);
    mostrarToast(`Erro ao baixar PDF: ${error.message}`);
  } finally {
    finalizarProgressoPdf();
  }
}

async function compartilharPdfOrcamento() {
  const orcamentoId = compartilharPdfBtn.getAttribute("data-id");
  if (!orcamentoId) return;
  if (!navigator.onLine) {
    await gerarPdfOffline(orcamentoId, "share");
    return;
  }
  iniciarProgressoPdf();
  try {
    const response = await fetch(`/api/orcamentos/${orcamentoId}/pdf`, { cache: 'no-cache' });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Erro ${response.status} ao gerar PDF`);
    }
    const blob = await response.blob();
    const file = new File([blob], `orcamento_${orcamentoId}.pdf`, { type: "application/pdf" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Orçamento",
        text: "Confira este orçamento",
      });
    } else {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orcamento_${orcamentoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      mostrarToast("PDF baixado. Compartilhe manualmente.");
    }
  } catch (error) {
    console.error("Erro ao compartilhar PDF:", error);
    mostrarToast(`Erro ao compartilhar PDF: ${error.message}`);
  } finally {
    finalizarProgressoPdf();
  }
}

function imprimirOrcamento() {
  const orcamentoId = imprimirOrcamentoBtn.getAttribute("data-id");
  if (!orcamentoId) return;
  const conteudo = orcamentoPreview.innerHTML;
  const janelaImpressao = window.open("", "_blank");
  janelaImpressao.document.write(`
    <html>
      <head>
        <title>Imprimir Orçamento ${orcamentoId}</title>
        <link rel="stylesheet" href="/css/modern-style.css">
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .modal-actions { display: none; }
          }
          /* Adicione estilos específicos de impressão aqui, se necessário */
          body { margin: 20px; }
          .orcamento-preview-container { border: none; box-shadow: none; }
        </style>
      </head>
      <body>
        ${conteudo}
        <script> window.onload = () => window.print(); setTimeout(() => window.close(), 100); </script>
      </body>
    </html>
  `);
  janelaImpressao.document.close();
}

async function gerarPdfOffline(id, acao) {
  iniciarProgressoPdf();
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    await doc.html(orcamentoPreview, { html2canvas: { scale: 0.8 } });
    const blob = doc.output("blob");
    if (acao === "share") {
      const file = new File([blob], `orcamento_${id}.pdf`, { type: "application/pdf" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Orçamento" });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `orcamento_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } else if (acao === "download") {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `orcamento_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error("Erro ao gerar PDF offline:", err);
    mostrarToast("Erro ao gerar PDF offline");
  } finally {
    finalizarProgressoPdf();
  }
}

// --- Funções Utilitárias --- //

function formatarMoeda(valor) {
  const numValor = Number(valor);
  if (isNaN(numValor)) return "R$ 0,00";
  return numValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(dataString) {
  if (!dataString) return "";
  const data = new Date(dataString);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mostrarToast(mensagem) {
  if (!toast) return;
  if (toastMessage) {
    toastMessage.textContent = mensagem;
  } else {
    toast.textContent = mensagem;
  }
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function mostrarLoading() {
  if (loadingSpinner) loadingSpinner.style.display = "flex";
}

function esconderLoading() {
  if (loadingSpinner) loadingSpinner.style.display = "none";
}

let pdfProgressInterval = null;
function iniciarProgressoPdf() {
  if (!pdfProgressOverlay || !pdfProgressBar) return;
  pdfProgressBar.style.width = "0%";
  pdfProgressOverlay.classList.add("active");
  let progress = 0;
  pdfProgressInterval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 90) progress = 90;
    pdfProgressBar.style.width = progress + "%";
  }, 200);
}

function finalizarProgressoPdf() {
  if (!pdfProgressOverlay || !pdfProgressBar) return;
  if (pdfProgressInterval) clearInterval(pdfProgressInterval);
  pdfProgressBar.style.width = "100%";
  setTimeout(() => {
    pdfProgressOverlay.classList.remove("active");
    pdfProgressBar.style.width = "0%";
    pdfProgressInterval = null;
  }, 400);
}

function snapshotForm(form) {
  return JSON.stringify(Array.from(new FormData(form).entries()));
}

function setCurrentForm(form) {
  currentForm = form;
  formSnapshot = snapshotForm(form);
  isEditing = false;
}

function markFormChanged() {
  if (currentForm) {
    isEditing = snapshotForm(currentForm) !== formSnapshot;
  }
}

function carregarFilaOffline() {
  offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
}

function salvarFilaOffline() {
  localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
}

async function processarFilaOffline() {
  if (offlineQueue.length === 0 || !navigator.onLine) return;
  mostrarToast('Sincronizando ações offline...');
  const fila = [...offlineQueue];
  offlineQueue = [];
  salvarFilaOffline();
  for (const acao of fila) {
    try {
      if (acao.tipo === 'addProduto') {
        const fd = new FormData();
        fd.append('nome', acao.dados.nome);
        fd.append('descricao', acao.dados.descricao || '');
        fd.append('valor', acao.dados.valor);
        if (acao.dados.foto) {
          const blob = await (await fetch(acao.dados.foto)).blob();
          fd.append('foto', new File([blob], 'foto.png', { type: blob.type }));
        }
        const res = await fetch('/api/produtos', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Falha ao enviar produto');
      } else if (acao.tipo === 'addOrcamento') {
        const res = await fetch('/api/orcamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(acao.dados),
        });
        if (!res.ok) throw new Error('Falha ao enviar orçamento');
      }
    } catch (err) {
      console.error('Erro ao sincronizar ação offline', err);
      offlineQueue.push(acao);
    }
  }
  salvarFilaOffline();
  if (offlineQueue.length === 0) {
    mostrarToast('Sincronização concluída');
    await carregarDadosIniciais();
  } else {
    mostrarToast('Algumas ações não foram sincronizadas');
  }
}

function mostrarConfirmacao(mensagem) {
  return new Promise((resolve) => {
    if (!confirmModal) return resolve(true);
    confirmMessage.textContent = mensagem;
    confirmModal.classList.add("active");
    const limpar = () => {
      confirmOk.removeEventListener("click", ok);
      confirmCancel.removeEventListener("click", cancel);
      confirmModal.classList.remove("active");
    };
    const ok = () => {
      limpar();
      resolve(true);
    };
    const cancel = () => {
      limpar();
      resolve(false);
    };
    confirmOk.addEventListener("click", ok);
    confirmCancel.addEventListener("click", cancel);
  });
}

// --- Usuários (Admin) --- //
async function carregarUsuarios() {
  try {
    const res = await fetch('/api/usuarios');
    if (res.ok) {
      usuariosCache = await res.json();
    } else {
      console.warn('Não foi possível obter usuários:', res.status);
      usuariosCache = [];
    }
  } catch (err) {
    console.error('Falha ao carregar usuários', err);
    usuariosCache = [];
  }
  renderizarUsuarios();
}

function renderizarUsuarios() {
  if (!usuariosLista) return;
  if (usuariosCache.length === 0) {
    usuariosLista.innerHTML = '<p>Nenhum usuário cadastrado</p>';
    return;
  }
  usuariosLista.innerHTML = usuariosCache.map(u => `
    <div class="item-card" data-id="${u.id}">
      <div class="item-details">
        <div class="item-title">${u.usuario}</div>
        <div class="item-subtitle">${u.admin ? 'Admin' : 'Usuário'}</div>
      </div>
    </div>
  `).join('');

  usuariosLista.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const u = usuariosCache.find(x => x.id === id);
      if (u) abrirModalUsuario(u);
    });
  });
}

function abrirModalUsuario(usuario = null) {
  usuarioForm.reset();
  if (usuario) {
    usuarioId.value = usuario.id;
    usuarioNome.value = usuario.usuario;
    usuarioAdmin.checked = !!usuario.admin;
    usuarioFoto.value = '';
    if (usuario.foto) {
      // not previewed but inform file cannot be set programmatically
    }
    usuarioModalTitle.textContent = 'Editar Usuário';
  } else {
    usuarioId.value = '';
    usuarioModalTitle.textContent = 'Novo Usuário';
  }
  usuarioModal.classList.add('active');
  setCurrentForm(usuarioForm);
}

usuarioForm?.addEventListener('input', markFormChanged);
usuarioForm?.addEventListener('change', markFormChanged);

usuarioForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();
    formData.append('usuario', usuarioNome.value);
    formData.append('senha', usuarioSenha.value);
    formData.append('admin', usuarioAdmin.checked);
    if (usuarioFoto.files && usuarioFoto.files[0]) {
      formData.append('foto', usuarioFoto.files[0]);
    }
    const method = usuarioId.value ? 'PUT' : 'POST';
    const url = usuarioId.value ? `/api/usuarios/${usuarioId.value}` : '/api/usuarios';
    const res = await fetch(url, { method, body: formData });
    if (!res.ok) throw new Error('Falha ao salvar usuário');
    usuarioModal.classList.remove('active');
    isEditing = false;
    currentForm = null;
    await carregarUsuarios();
    mostrarToast('Usuário salvo');
  } catch (err) {
    console.error(err);
    mostrarToast('Erro ao salvar usuário');
  }
});

document.querySelectorAll('#usuario-modal .modal-close, #usuario-modal .modal-cancel').forEach(btn => {
  btn.addEventListener('click', () => fecharModalComConfirmacao(usuarioModal));
});

// --- Registros (Admin) --- //
async function carregarRegistros() {
  try {
    const res = await fetch('/api/logs');
    if (res.ok) {
      registrosCache = await res.json();
    } else {
      console.warn('Não foi possível obter registros:', res.status);
      registrosCache = [];
    }
  } catch (err) {
    console.error('Falha ao carregar registros', err);
    registrosCache = [];
  }
  renderizarRegistros();
}

function renderizarRegistros() {
  if (!registrosLista) return;
  if (registrosCache.length === 0) {
    registrosLista.innerHTML = '<p>Nenhum registro disponível</p>';
    return;
  }
  registrosLista.innerHTML = registrosCache.map(l => `
    <div class="item-card">
      <div class="item-details">
        <div class="item-title">${l.descricao}</div>
        <div class="item-subtitle">${formatarData(l.timestamp)} - ${l.usuario}</div>
      </div>
    </div>
  `).join('');
}

async function carregarPerfil() {
  if (!perfilForm) return;
  try {
    const res = await fetch('/api/usuarios/me');
    if (res.ok) {
      const user = await res.json();
      perfilNome.value = user.usuario;
      if (user.foto) perfilFotoPreview.src = user.foto;
    } else {
      console.warn('Não foi possível carregar perfil:', res.status);
    }
  } catch (err) {
    console.error('Erro ao carregar perfil', err);
  }
}

// --- Service Worker e PWA --- //

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => console.log("Service worker registrado:", reg))
      .catch((err) => console.log("Erro ao registrar service worker:", err));
  });
}

function initInstallPrompt() {
  const installButton = document.getElementById("install-app-btn");
  if (!installButton) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = "inline-flex"; // Mostra o botão
  });

  installButton.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      installButton.style.display = "none"; // Esconde após tentativa
    }
  });

  window.addEventListener("appinstalled", () => {
    console.log("PWA instalado com sucesso!");
    installButton.style.display = "none";
  });
}

