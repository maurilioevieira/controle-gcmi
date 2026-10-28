/**
 * CONTROLE DE PERMUTAS — GCM IGUATU
 * Front-end (GitHub Pages) — fala com o backend via Supabase (PostgreSQL).
 *
 * IMPORTANTE: substitua SUPABASE_URL e SUPABASE_KEY abaixo pelos valores do seu
 * projeto (Project Settings > API, no painel do Supabase).
 *
 * SEGURANÇA: a chave abaixo é a "anon key" pública — ela é destinada a ficar
 * visível no navegador. A segurança real vem das funções RPC no banco
 * (verificar_nivel), que validam o PIN antes de qualquer leitura/escrita.
 * As tabelas em si NÃO são acessíveis diretamente por essa chave.
 */
const SUPABASE_URL = 'https://kgdujfhqthskloaiumjl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZHVqZmhxdGhza2xvYWl1bWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjUxNTQsImV4cCI6MjEwNTE0MTE1NH0.nSJLq9qhvPvkN44g8cukNLza1MAfgzu-Krfew92ANXg';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- ESTADO GLOBAL ----------
let usuario = JSON.parse(localStorage.getItem('permutas_usuario') || 'null');
let pinDigitado = '';
let cachePostos = [];
let cacheTurnos = [];
let cacheRecebidoPor = [];
let cacheAutorizadoPor = [];
let cacheFuncionarios = [];
let cachePermutas = [];
let cacheFolgas = [];
let cacheDevendo = [];

// Gera um identificador único no navegador, usado para evitar cadastros duplicados
// caso a mesma requisição de cadastro seja enviada mais de uma vez.
function gerarIdCliente() {
  return (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
}

// ---------- CONVERSÃO DE DATAS (telas usam dd/mm/yyyy; Postgres usa yyyy-mm-dd) ----------
function isoParaBR(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
function brParaIso(br) {
  if (!br) return '';
  const [d, m, a] = br.split('/');
  return `${a}-${m}-${d}`;
}

/**
 * ADAPTADOR chamarApi(action, payload)
 * Mantém exatamente a mesma "forma" de chamada usada em todo o resto do
 * arquivo (a mesma de quando o backend era o Apps Script) — só troca o que
 * acontece por dentro, agora conversando com as funções RPC do Supabase.
 * Isso permite que todo o resto do código (telas, tabelas, modais, admin)
 * continue igual, sem precisar reescrever nada além desta função.
 */
async function chamarApi(action, payload = {}) {
  const p = payload;
  const pin = usuario ? usuario.pin : p.pin;

  switch (action) {
    case 'login': {
      const { data, error } = await db.rpc('login', { p_pin: p.pin });
      if (error) throw new Error(error.message);
      return data;
    }

    // ---------- POSTOS ----------
    case 'listPostos': {
      const { data, error } = await db.rpc('listar_postos', { p_pin: pin });
      if (error) throw new Error(error.message);
      return (data || []).map(r => (typeof r === 'string' ? r : Object.values(r)[0]));
    }
    case 'addPosto': {
      const { error } = await db.rpc('adicionar_posto', { p_pin: pin, p_posto: p.posto });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'deletePosto': {
      const { error } = await db.rpc('remover_posto', { p_pin: pin, p_posto: p.posto });
      if (error) throw new Error(error.message);
      return null;
    }

    // ---------- TURNOS ----------
    case 'listTurnos': {
      const { data, error } = await db.rpc('listar_turnos', { p_pin: pin });
      if (error) throw new Error(error.message);
      return (data || []).map(r => ({ TURNO: r.turno, HORAS: r.horas }));
    }
    case 'addTurno': {
      const { error } = await db.rpc('adicionar_turno', { p_pin: pin, p_turno: p.turno, p_horas: Number(p.horas) });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'deleteTurno': {
      const { error } = await db.rpc('remover_turno', { p_pin: pin, p_turno: p.turno });
      if (error) throw new Error(error.message);
      return null;
    }

    // ---------- RECEBIDO POR ----------
    case 'listRecebidoPor': {
      const { data, error } = await db.rpc('listar_recebido_por', { p_pin: pin });
      if (error) throw new Error(error.message);
      return (data || []).map(r => (typeof r === 'string' ? r : Object.values(r)[0]));
    }
    case 'addRecebidoPor': {
      const { error } = await db.rpc('adicionar_recebido_por', { p_pin: pin, p_nome: p.nome });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'deleteRecebidoPor': {
      const { error } = await db.rpc('remover_recebido_por', { p_pin: pin, p_nome: p.nome });
      if (error) throw new Error(error.message);
      return null;
    }

    // ---------- AUTORIZADO POR ----------
    case 'listAutorizadoPor': {
      const { data, error } = await db.rpc('listar_autorizado_por', { p_pin: pin });
      if (error) throw new Error(error.message);
      return (data || []).map(r => (typeof r === 'string' ? r : Object.values(r)[0]));
    }
    case 'addAutorizadoPor': {
      const { error } = await db.rpc('adicionar_autorizado_por', { p_pin: pin, p_nome: p.nome });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'deleteAutorizadoPor': {
      const { error } = await db.rpc('remover_autorizado_por', { p_pin: pin, p_nome: p.nome });
      if (error) throw new Error(error.message);
      return null;
    }

    // ---------- FUNCIONÁRIOS ----------
    case 'listFuncionarios': {
      const { data, error } = await db.rpc('listar_funcionarios', { p_pin: pin });
      if (error) throw new Error(error.message);
      return (data || []).map(r => ({ QRA: r.qra, NOME_COMPLETO: r.nome_completo, CLASSE: r.classe, EMAIL: r.email }));
    }
    case 'addFuncionario': {
      const { error } = await db.rpc('adicionar_funcionario', {
        p_pin: pin, p_nome_completo: p.nomeCompleto, p_classe: p.classe, p_qra: p.qra, p_email: p.email || null
      });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'editFuncionario': {
      const { error } = await db.rpc('editar_funcionario', {
        p_pin: pin, p_qra_original: p.qraOriginal, p_nome_completo: p.nomeCompleto,
        p_classe: p.classe, p_qra_novo: p.qra, p_email: p.email || null
      });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'deleteFuncionario': {
      const { error } = await db.rpc('remover_funcionario', { p_pin: pin, p_qra: p.qra });
      if (error) throw new Error(error.message);
      return null;
    }

    // ---------- PERMUTAS ----------
    case 'listPermutas': {
      const { data, error } = await db.rpc('listar_permutas', {
        p_pin: pin,
        p_data_inicio: p.dataInicio ? brParaIso(p.dataInicio) : null,
        p_data_fim: p.dataFim ? brParaIso(p.dataFim) : null,
        p_ordenar_por: p.ordenarPor || 'data_asc'
      });
      if (error) throw new Error(error.message);
      return (data || []).map(r => ({
        ID: r.id, DATA: isoParaBR(r.data), POSTO: r.posto, TURNO: r.turno,
        ESCALADO: r.escalado, SUBSTITUTO: r.substituto, HP: r.hp,
        RECEBIDO: r.recebido ? isoParaBR(r.recebido) : '', RECEBIDO_POR: r.recebido_por, CRIADO_EM: r.criado_em
      }));
    }
    case 'addPermuta': {
      const { error } = await db.rpc('adicionar_permuta', {
        p_pin: pin, p_id_cliente_novo: p.idClienteNovo, p_data: brParaIso(p.data), p_posto: p.posto, p_turno: p.turno,
        p_escalado: p.escalado, p_substituto: p.substituto,
        p_recebido: p.recebido ? brParaIso(p.recebido) : null, p_recebido_por: p.recebidoPor || null,
        p_usuario_nome: p.usuarioNome
      });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'editPermuta': {
      const { error } = await db.rpc('editar_permuta', {
        p_pin: pin, p_id: p.id, p_data: brParaIso(p.data), p_posto: p.posto, p_turno: p.turno,
        p_escalado: p.escalado, p_substituto: p.substituto,
        p_recebido: p.recebido ? brParaIso(p.recebido) : null, p_recebido_por: p.recebidoPor || null
      });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'deletePermuta': {
      const { error } = await db.rpc('excluir_permuta', { p_pin: pin, p_id: p.id });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'listRankingHP': {
      const { data, error } = await db.rpc('listar_ranking_hp', { p_pin: pin, p_ano: p.ano, p_mes: p.mes + 1 });
      if (error) throw new Error(error.message);
      return (data || []).map(r => ({ escalado: r.escalado, hp: r.hp }));
    }

    // ---------- FOLGAS ----------
    case 'listFolgas': {
      const { data, error } = await db.rpc('listar_folgas', {
        p_pin: pin,
        p_data_inicio: p.dataInicio ? brParaIso(p.dataInicio) : null,
        p_data_fim: p.dataFim ? brParaIso(p.dataFim) : null,
        p_ordenar_por: p.ordenarPor || 'data_asc'
      });
      if (error) throw new Error(error.message);
      return (data || []).map(r => ({ ID: r.id, QRA: r.qra, DATA: isoParaBR(r.data), POSTO: r.posto, OBSERVACAO: r.observacao }));
    }
    case 'addFolga': {
      const { error } = await db.rpc('adicionar_folga', {
        p_pin: pin, p_id_cliente_novo: p.idClienteNovo, p_qra: p.qra, p_data: brParaIso(p.data), p_posto: p.posto,
        p_observacao: p.observacao || null, p_usuario_nome: p.usuarioNome
      });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'editFolga': {
      const { error } = await db.rpc('editar_folga', {
        p_pin: pin, p_id: p.id, p_qra: p.qra, p_data: brParaIso(p.data), p_posto: p.posto, p_observacao: p.observacao || null
      });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'deleteFolga': {
      const { error } = await db.rpc('excluir_folga', { p_pin: pin, p_id: p.id });
      if (error) throw new Error(error.message);
      return null;
    }

    // ---------- DEVENDO ----------
    case 'listDevendo': {
      const { data, error } = await db.rpc('listar_devendo', {
        p_pin: pin,
        p_data_inicio: p.dataInicio ? brParaIso(p.dataInicio) : null,
        p_data_fim: p.dataFim ? brParaIso(p.dataFim) : null,
        p_ordenar_por: p.ordenarPor || 'data_asc'
      });
      if (error) throw new Error(error.message);
      return (data || []).map(r => ({
        ID: r.id, QRA: r.qra, DATA: isoParaBR(r.data), TURNO: r.turno, POSTO: r.posto,
        AUTORIZADO_POR: r.autorizado_por, SITUACAO: r.situacao, OBSERVACAO: r.observacao
      }));
    }
    case 'addDevendo': {
      const { error } = await db.rpc('adicionar_devendo', {
        p_pin: pin, p_id_cliente_novo: p.idClienteNovo, p_qra: p.qra, p_data: brParaIso(p.data), p_turno: p.turno,
        p_posto: p.posto, p_autorizado_por: p.autorizadoPor || null, p_observacao: p.observacao || null,
        p_usuario_nome: p.usuarioNome
      });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'editDevendo': {
      const { error } = await db.rpc('editar_devendo', {
        p_pin: pin, p_id: p.id, p_qra: p.qra, p_data: brParaIso(p.data), p_turno: p.turno, p_posto: p.posto,
        p_autorizado_por: p.autorizadoPor || null, p_observacao: p.observacao || null
      });
      if (error) throw new Error(error.message);
      return null;
    }
    case 'deleteDevendo': {
      const { error } = await db.rpc('excluir_devendo', { p_pin: pin, p_id: p.id });
      if (error) throw new Error(error.message);
      return null;
    }

    default:
      throw new Error('Ação desconhecida: ' + action);
  }
}

// ================= TELA DE LOGIN (PIN) =================
const pinDisplay = document.getElementById('pin-display');
const pinErro = document.getElementById('pin-erro');

document.querySelectorAll('.pin-pad button[data-num]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (pinDigitado.length >= 8) return;
    pinDigitado += btn.dataset.num;
    atualizarPinDisplay();
  });
});
document.getElementById('btn-limpar').addEventListener('click', () => { pinDigitado = ''; atualizarPinDisplay(); });
document.getElementById('btn-apagar').addEventListener('click', () => { pinDigitado = pinDigitado.slice(0, -1); atualizarPinDisplay(); });

function atualizarPinDisplay() {
  pinDisplay.textContent = '•'.repeat(pinDigitado.length);
  pinErro.textContent = '';
  if (pinDigitado.length >= 4) tentarLogin();
}

async function tentarLogin() {
  try {
    const dados = await chamarApi('login', { pin: pinDigitado });
    usuario = { pin: pinDigitado, nome: dados.nome, nivel: dados.nivel };
    localStorage.setItem('permutas_usuario', JSON.stringify(usuario));
    entrarNoApp();
  } catch (e) {
    pinErro.textContent = 'PIN inválido.';
    pinDigitado = '';
    atualizarPinDisplay();
  }
}

document.getElementById('btn-sair').addEventListener('click', () => {
  usuario = null;
  localStorage.removeItem('permutas_usuario');
  location.reload();
});

// ================= ENTRADA NO APP =================
function entrarNoApp() {
  document.getElementById('tela-login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('usuario-logado').textContent = `${usuario.nome} (${usuario.nivel === 'admin' ? 'Administrador' : 'Auxiliar'})`;
  if (usuario.nivel === 'admin') {
    document.getElementById('aba-admin-botao').classList.remove('hidden');
  }
  carregarDadosIniciais();
}

async function carregarDadosIniciais() {
  mostrarStatusCarregamento('Carregando dados...', false);
  try {
    await carregarListasBase();
    await Promise.all([carregarPermutas(), carregarFolgas(), carregarDevendo()]);
    ocultarStatusCarregamento();
  } catch (e) {
    mostrarStatusCarregamento('Não foi possível carregar os dados agora. Verifique sua conexão e tente novamente.', true);
  }
}

function mostrarStatusCarregamento(texto, comBotao) {
  document.getElementById('status-carregamento-texto').textContent = texto;
  document.getElementById('btn-tentar-novamente-carregamento').classList.toggle('hidden', !comBotao);
  document.getElementById('status-carregamento').classList.remove('hidden');
}

function ocultarStatusCarregamento() {
  document.getElementById('status-carregamento').classList.add('hidden');
}

document.getElementById('btn-tentar-novamente-carregamento').addEventListener('click', carregarDadosIniciais);

if (usuario) entrarNoApp();

// ================= NAVEGAÇÃO ENTRE ABAS =================
document.querySelectorAll('nav.abas button[data-aba]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav.abas button').forEach(b => b.classList.remove('ativa'));
    btn.classList.add('ativa');
    document.getElementById('secao-hoje').classList.toggle('hidden', btn.dataset.aba !== 'hoje');
    document.getElementById('secao-permutas').classList.toggle('hidden', btn.dataset.aba !== 'permutas');
    document.getElementById('secao-folgas').classList.toggle('hidden', btn.dataset.aba !== 'folgas');
    document.getElementById('secao-hp').classList.toggle('hidden', btn.dataset.aba !== 'hp');
    document.getElementById('secao-devendo').classList.toggle('hidden', btn.dataset.aba !== 'devendo');
    document.getElementById('secao-admin').classList.toggle('hidden', btn.dataset.aba !== 'admin');
    if (btn.dataset.aba === 'admin') renderizarAdmin();
    if (btn.dataset.aba === 'hp') carregarRankingHP();
    if (btn.dataset.aba === 'hoje') atualizarPainelHoje();
    // No celular, o menu fica aberto sobre a tela até uma aba ser escolhida — fecha sozinho aqui.
    document.querySelector('.sidebar').classList.remove('menu-aberto');
  });
});

// ================= MENU MOBILE (botão ☰) =================
document.getElementById('btn-menu-mobile').addEventListener('click', () => {
  const sidebar = document.querySelector('.sidebar');
  const aberto = sidebar.classList.toggle('menu-aberto');
  document.getElementById('btn-menu-mobile').setAttribute('aria-expanded', aberto ? 'true' : 'false');
});

// ================= CARREGAR LISTAS BASE (postos, turnos, recebido por, funcionários) =================
async function carregarListasBase() {
  [cachePostos, cacheTurnos, cacheRecebidoPor, cacheAutorizadoPor, cacheFuncionarios] = await Promise.all([
    chamarApi('listPostos'),
    chamarApi('listTurnos'),
    chamarApi('listRecebidoPor'),
    chamarApi('listAutorizadoPor'),
    chamarApi('listFuncionarios')
  ]);
  preencherSelect('permuta-posto', cachePostos);
  preencherSelect('permuta-turno', cacheTurnos.map(t => t.TURNO));
  preencherSelect('permuta-recebido-por', cacheRecebidoPor);
  preencherSelect('folga-posto', cachePostos);
  preencherSelect('lote-posto', cachePostos);
  preencherSelect('lote-recebido-por', cacheRecebidoPor);
  preencherSelect('devendo-posto', cachePostos);
  preencherSelect('devendo-turno', cacheTurnos.map(t => t.TURNO));
  preencherSelect('devendo-autorizado-por', cacheAutorizadoPor);
}

function preencherSelect(idSelect, valores) {
  const sel = document.getElementById(idSelect);
  sel.innerHTML = '<option value="">Selecione...</option>' + valores.map(v => `<option value="${v}">${v}</option>`).join('');
}

// ================= LISTAGEM DE PERMUTAS =================
async function carregarPermutas(filtro = {}) {
  // ordenarPor: 'criado_desc' faz a última permuta cadastrada aparecer primeiro na tela
  cachePermutas = (await chamarApi('listPermutas', { ordenarPor: 'criado_desc', ...filtro })) || [];
  renderizarTabelaPermutas();
  atualizarPainelHoje();
}

// ================= PAINEL "HOJE" (aba dedicada — navega entre dias) =================
function dataParaBR(d) {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
}
function dataParaISO(d) {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
function dataExtenso(d) {
  const texto = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
// Mantidas por compatibilidade com o resto do código (sempre "hoje" de verdade).
function dataHojeBR() { return dataParaBR(new Date()); }
function dataHojeExtenso() { return dataExtenso(new Date()); }

// Dia atualmente exibido no painel — começa em hoje, mas o agente pode trocar
// pelo seletor de data para ver permutas/folgas de outro dia sem sair da aba.
let dataPainelHoje = new Date();

async function atualizarPainelHoje() {
  const dataBR = dataParaBR(dataPainelHoje);
  document.getElementById('hoje-data-extenso').textContent = dataExtenso(dataPainelHoje);
  try {
    const [permutasDoDia, folgasDoDia] = await Promise.all([
      chamarApi('listPermutas', { dataInicio: dataBR, dataFim: dataBR }),
      chamarApi('listFolgas', { dataInicio: dataBR, dataFim: dataBR })
    ]);
    document.getElementById('hoje-contagem-permutas').textContent = permutasDoDia.length;
    document.getElementById('hoje-contagem-folgas').textContent = folgasDoDia.length;

    renderizarListaHoje('hoje-lista-permutas', permutasDoDia, 'permuta',
      p => `${p.POSTO} — ${p.TURNO}`, p => `${p.ESCALADO} → ${p.SUBSTITUTO}`);
    renderizarListaHoje('hoje-lista-folgas', folgasDoDia, 'folga',
      f => `${f.QRA} — ${f.POSTO}`, f => f.OBSERVACAO || 'Folga da escala');
  } catch (e) {
    console.error('Erro ao carregar painel do dia:', e);
  }
}

function inicializarSeletorDataHoje() {
  const input = document.getElementById('hoje-data-selecionada');
  input.value = dataParaISO(dataPainelHoje);
  input.addEventListener('change', () => {
    if (!input.value) return;
    const [ano, mes, dia] = input.value.split('-').map(Number);
    dataPainelHoje = new Date(ano, mes - 1, dia);
    atualizarPainelHoje();
  });
}
inicializarSeletorDataHoje();

// Atalhos do painel "Hoje": abrem os mesmos modais/ações já usados na aba Permutas.
document.getElementById('btn-hoje-nova-permuta').addEventListener('click', () => abrirModalPermuta(null));
document.getElementById('btn-hoje-lote-permutas').addEventListener('click', () => abrirModalLote());
document.getElementById('btn-hoje-pdf-dia').addEventListener('click', (ev) => {
  const dataBR = dataParaBR(dataPainelHoje);
  gerarEBaixarPdf('combinado', ev.target, { dataInicio: dataBR, dataFim: dataBR });
});

function renderizarListaHoje(idContainer, itens, classeExtra, formatarTitulo, formatarSub) {
  const div = document.getElementById(idContainer);
  if (!itens || itens.length === 0) {
    div.innerHTML = '<p class="painel-hoje-vazio">Nenhum registro para hoje.</p>';
    return;
  }
  div.innerHTML = itens.map(i => `
    <div class="painel-hoje-item ${classeExtra}">
      <p class="painel-hoje-item-titulo">${formatarTitulo(i)}</p>
      <p class="painel-hoje-item-sub">${formatarSub(i)}</p>
    </div>`).join('');
}

// ================= SELO DE COR DO HP =================
// Verde até 119h, laranja exatamente em 120h (limite mensal), vermelho acima de 120h (atenção).
function classeHP(hp) {
  const valor = Number(hp) || 0;
  if (valor > 120) return 'hp-vermelho';
  if (valor === 120) return 'hp-laranja';
  return 'hp-verde';
}
function badgeHP(hp) {
  return `<span class="hp-selo ${classeHP(hp)}">${hp}</span>`;
}

function renderizarTabelaPermutas() {
  const corpo = document.getElementById('corpo-tabela-permutas');
  if (cachePermutas.length === 0) {
    corpo.innerHTML = '<tr><td colspan="9" class="mensagem-vazio">Nenhuma permuta encontrada.</td></tr>';
    return;
  }
  corpo.innerHTML = cachePermutas.map(p => `
    <tr>
      <td>${p.DATA}</td><td>${p.POSTO}</td><td>${p.TURNO}</td>
      <td>${p.ESCALADO}</td><td>${p.SUBSTITUTO}</td><td>${badgeHP(p.HP)}</td>
      <td>${p.RECEBIDO || ''}</td><td>${p.RECEBIDO_POR || ''}</td>
      <td>
        <button class="btn-secundario" onclick="abrirModalPermuta('${p.ID}')">Editar</button>
        <button class="btn-perigo" onclick="excluirPermuta('${p.ID}')">Excluir</button>
      </td>
    </tr>`).join('');
}

document.getElementById('btn-filtrar').addEventListener('click', () => {
  const ini = document.getElementById('filtro-data-inicio').value;
  const fim = document.getElementById('filtro-data-fim').value;
  carregarPermutas({ dataInicio: isoParaBR(ini), dataFim: isoParaBR(fim || ini) });
});
document.getElementById('btn-limpar-filtro').addEventListener('click', () => {
  document.getElementById('filtro-data-inicio').value = '';
  document.getElementById('filtro-data-fim').value = '';
  carregarPermutas();
});

// ================= MODAL DE PERMUTA (NOVA / EDITAR) =================
const modalPermuta = document.getElementById('modal-permuta');

document.getElementById('btn-nova-permuta').addEventListener('click', () => abrirModalPermuta(null));
document.getElementById('btn-cancelar-permuta').addEventListener('click', () => modalPermuta.classList.add('hidden'));

function abrirModalPermuta(id) {
  document.getElementById('form-permuta').reset();
  document.getElementById('permuta-id').value = '';
  document.getElementById('permuta-novo-id').value = id ? '' : gerarIdCliente();
  document.getElementById('permuta-escalado-valor').value = '';
  document.getElementById('permuta-substituto-valor').value = '';
  document.getElementById('modal-permuta-titulo').textContent = id ? 'Editar Permuta' : 'Nova Permuta';

  if (id) {
    const p = cachePermutas.find(x => x.ID === id);
    document.getElementById('permuta-id').value = p.ID;
    document.getElementById('permuta-data').value = brParaIso(p.DATA);
    document.getElementById('permuta-posto').value = p.POSTO;
    document.getElementById('permuta-turno').value = p.TURNO;
    document.getElementById('permuta-escalado-busca').value = p.ESCALADO;
    document.getElementById('permuta-escalado-valor').value = p.ESCALADO;
    document.getElementById('permuta-substituto-busca').value = p.SUBSTITUTO;
    document.getElementById('permuta-substituto-valor').value = p.SUBSTITUTO;
    document.getElementById('permuta-recebido').value = brParaIso(p.RECEBIDO);
    document.getElementById('permuta-recebido-por').value = p.RECEBIDO_POR || '';
  }
  modalPermuta.classList.remove('hidden');
}

document.getElementById('form-permuta').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('permuta-id').value;
  const payload = {
    id,
    idClienteNovo: id ? undefined : document.getElementById('permuta-novo-id').value,
    data: isoParaBR(document.getElementById('permuta-data').value),
    posto: document.getElementById('permuta-posto').value,
    turno: document.getElementById('permuta-turno').value,
    escalado: document.getElementById('permuta-escalado-valor').value,
    substituto: document.getElementById('permuta-substituto-valor').value,
    recebido: isoParaBR(document.getElementById('permuta-recebido').value),
    recebidoPor: document.getElementById('permuta-recebido-por').value,
    usuarioNome: usuario.nome
  };
  try {
    if (id) await chamarApi('editPermuta', payload);
    else await chamarApi('addPermuta', payload);
    modalPermuta.classList.add('hidden');
    await carregarPermutas();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
});

async function excluirPermuta(id) {
  if (!confirm('Tem certeza que deseja excluir esta permuta?')) return;
  try {
    await chamarApi('deletePermuta', { id });
    await carregarPermutas();
  } catch (e) {
    alert('Erro ao excluir: ' + e.message);
  }
}

// ================= CADASTRO EM LOTE (VÁRIAS PERMUTAS DE UMA VEZ) =================
const MAX_LINHAS_LOTE = 5;
const modalLote = document.getElementById('modal-lote');
const containerLinhasLote = document.getElementById('lote-linhas');

function criarLinhaLote() {
  const div = document.createElement('div');
  div.className = 'linha-lote';
  const opcoesTurno = cacheTurnos.map(t => `<option value="${t.TURNO}">${t.TURNO}</option>`).join('');
  div.innerHTML = `
    <div class="campo-inline">
      <label>Data</label>
      <input type="date" class="lote-data" required>
    </div>
    <div class="campo-inline">
      <label>Turno</label>
      <select class="lote-turno" required><option value="">Selecione...</option>${opcoesTurno}</select>
    </div>
    <button type="button" class="btn-perigo btn-remover-linha">×</button>
  `;
  div.querySelector('.btn-remover-linha').addEventListener('click', () => {
    if (containerLinhasLote.children.length > 1) {
      div.remove();
      atualizarBotaoAddLinha();
    }
  });
  return div;
}

function atualizarBotaoAddLinha() {
  const btn = document.getElementById('btn-add-linha-lote');
  btn.disabled = containerLinhasLote.children.length >= MAX_LINHAS_LOTE;
  btn.textContent = btn.disabled ? 'Limite de 5 datas atingido' : '+ Adicionar outra data';
}

document.getElementById('btn-add-linha-lote').addEventListener('click', () => {
  if (containerLinhasLote.children.length < MAX_LINHAS_LOTE) {
    containerLinhasLote.appendChild(criarLinhaLote());
    atualizarBotaoAddLinha();
  }
});

function abrirModalLote() {
  document.getElementById('form-lote').reset();
  document.getElementById('lote-escalado-valor').value = '';
  document.getElementById('lote-substituto-valor').value = '';
  containerLinhasLote.innerHTML = '';
  containerLinhasLote.appendChild(criarLinhaLote());
  atualizarBotaoAddLinha();
  modalLote.classList.remove('hidden');
}
document.getElementById('btn-lote-permutas').addEventListener('click', abrirModalLote);
document.getElementById('btn-cancelar-lote').addEventListener('click', () => modalLote.classList.add('hidden'));

configurarAutocomplete('lote-escalado-busca', 'lote-escalado-valor', 'lista-autocomplete-lote-escalado');
configurarAutocomplete('lote-substituto-busca', 'lote-substituto-valor', 'lista-autocomplete-lote-substituto');

document.getElementById('form-lote').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const comum = {
    posto: document.getElementById('lote-posto').value,
    escalado: document.getElementById('lote-escalado-valor').value,
    substituto: document.getElementById('lote-substituto-valor').value,
    recebido: isoParaBR(document.getElementById('lote-recebido').value),
    recebidoPor: document.getElementById('lote-recebido-por').value,
    usuarioNome: usuario.nome
  };

  const linhas = Array.from(containerLinhasLote.querySelectorAll('.linha-lote')).map(linha => ({
    data: isoParaBR(linha.querySelector('.lote-data').value),
    turno: linha.querySelector('.lote-turno').value
  }));

  const botaoSalvar = ev.target.querySelector('button[type="submit"]');
  const textoOriginal = botaoSalvar.textContent;
  botaoSalvar.disabled = true;
  let salvas = 0;

  try {
    for (const linha of linhas) {
      botaoSalvar.textContent = `Salvando ${salvas + 1} de ${linhas.length}...`;
      await chamarApi('addPermuta', { ...comum, ...linha, idClienteNovo: gerarIdCliente() });
      salvas++;
    }
    modalLote.classList.add('hidden');
    await carregarPermutas();
  } catch (e) {
    alert(`Foram salvas ${salvas} de ${linhas.length} permutas antes do erro:\n\n${e.message}\n\nAs que já foram salvas continuam válidas — corrija a data/turno restante e cadastre separadamente se precisar.`);
    await carregarPermutas();
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = textoOriginal;
  }
});

// ================= AUTOCOMPLETE (ESCALADO / SUBSTITUTO) =================
function configurarAutocomplete(idBusca, idValor, idLista) {
  const input = document.getElementById(idBusca);
  const valorOculto = document.getElementById(idValor);
  const lista = document.getElementById(idLista);

  input.addEventListener('input', () => {
    const termo = input.value.trim().toUpperCase();
    valorOculto.value = '';
    if (!termo) { lista.classList.add('hidden'); return; }
    const encontrados = cacheFuncionarios
      .filter(f => f.QRA && f.QRA.toUpperCase().includes(termo))
      .slice(0, 15);
    if (encontrados.length === 0) { lista.classList.add('hidden'); return; }
    lista.innerHTML = encontrados.map(f => `<div data-qra="${f.QRA}">${f.QRA}</div>`).join('');
    lista.classList.remove('hidden');
  });

  lista.addEventListener('click', (ev) => {
    if (ev.target.dataset.qra) {
      input.value = ev.target.dataset.qra;
      valorOculto.value = ev.target.dataset.qra;
      lista.classList.add('hidden');
    }
  });

  document.addEventListener('click', (ev) => {
    if (!ev.target.closest(`#${idBusca}`) && !ev.target.closest(`#${idLista}`)) {
      lista.classList.add('hidden');
    }
  });
}
configurarAutocomplete('permuta-escalado-busca', 'permuta-escalado-valor', 'lista-autocomplete-escalado');
configurarAutocomplete('permuta-substituto-busca', 'permuta-substituto-valor', 'lista-autocomplete-substituto');

// ================= GERAÇÃO DE PDF (no navegador, com jsPDF) =================
// O Supabase não gera PDF no servidor (isso é papel de aplicação, não de banco de
// dados), então o PDF é montado aqui mesmo no navegador, com a mesma aparência
// (cabeçalho, cores, rodapé) que o Apps Script produzia.
const CORES_PDF = { navy: [26, 43, 94], gold: [200, 168, 75], cinza: [130, 130, 130] };

function cabecalhoRodapePdf(doc, titulo, periodo) {
  doc.setFontSize(16);
  doc.setTextColor(...CORES_PDF.navy);
  doc.text(titulo, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(...CORES_PDF.cinza);
  doc.text('Desenvolvido por Maurílio Vieira', 196, 18, { align: 'right' });
  doc.setDrawColor(...CORES_PDF.gold);
  doc.setLineWidth(1);
  doc.line(14, 21, 196, 21);
  doc.setFontSize(11);
  doc.setTextColor(...CORES_PDF.navy);
  doc.text(`Período: ${periodo}`, 14, 30);
}

function rodapePdf(doc, ultimaPosicaoY) {
  const agora = new Date().toLocaleString('pt-BR');
  doc.setFontSize(8);
  doc.setTextColor(...CORES_PDF.cinza);
  doc.text('Sistema de Controle de Permutas e Folgas — GCM Iguatu', 105, ultimaPosicaoY, { align: 'center' });
  doc.text(`PDF gerado automaticamente em ${agora}`, 105, ultimaPosicaoY + 5, { align: 'center' });
}

function periodoTexto(dataInicio, dataFim) {
  if (!dataInicio) return 'Todas as datas';
  return dataFim && dataFim !== dataInicio ? `${dataInicio} a ${dataFim}` : dataInicio;
}

async function gerarEBaixarPdf(tipo, botao, filtroPersonalizado) {
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Gerando PDF...';

  let filtro;
  if (filtroPersonalizado) {
    filtro = filtroPersonalizado;
  } else {
    const ini = document.getElementById('filtro-data-inicio').value;
    const fim = document.getElementById('filtro-data-fim').value;
    filtro = { dataInicio: isoParaBR(ini), dataFim: isoParaBR(fim || ini) };
  }
  const periodo = periodoTexto(filtro.dataInicio, filtro.dataFim);

  try {
    const permutas = await chamarApi('listPermutas', filtro);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    cabecalhoRodapePdf(doc, 'GCM Iguatu — Relatório de Permutas', periodo);
    doc.autoTable({
      startY: 36,
      head: [['Data', 'Posto', 'Turno', 'Escalado', 'Substituto']],
      body: permutas.map(p => [p.DATA, p.POSTO, p.TURNO, p.ESCALADO, p.SUBSTITUTO]),
      headStyles: { fillColor: CORES_PDF.navy, textColor: CORES_PDF.gold },
      alternateRowStyles: { fillColor: [247, 245, 239] },
      styles: { fontSize: 9 }
    });

    let finalY = doc.lastAutoTable.finalY + 14;
    let nomeArquivo = 'permutas_' + (filtro.dataInicio || 'geral') + '.pdf';

    if (tipo === 'combinado') {
      const folgas = await chamarApi('listFolgas', filtro);
      const y = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(13);
      doc.setTextColor(...CORES_PDF.navy);
      doc.text('Folgas Previstas', 14, y);
      doc.autoTable({
        startY: y + 5,
        head: [['Data', 'QRA', 'Posto', 'Observação']],
        body: folgas.map(f => [f.DATA, f.QRA, f.POSTO, f.OBSERVACAO || '']),
        headStyles: { fillColor: CORES_PDF.navy, textColor: CORES_PDF.gold },
        alternateRowStyles: { fillColor: [247, 245, 239] },
        styles: { fontSize: 9 }
      });
      finalY = doc.lastAutoTable.finalY + 14;
      nomeArquivo = 'permutas_folgas_' + (filtro.dataInicio || 'geral') + '.pdf';
    }

    rodapePdf(doc, finalY);
    doc.save(nomeArquivo);
  } catch (e) {
    alert('Erro ao gerar PDF: ' + e.message);
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}
document.getElementById('btn-pdf-permutas').addEventListener('click', (ev) => gerarEBaixarPdf('permutas', ev.target));
document.getElementById('btn-pdf-combinado').addEventListener('click', (ev) => gerarEBaixarPdf('combinado', ev.target));

// ================= LISTAGEM DE FOLGAS =================
async function carregarFolgas(filtro = {}) {
  cacheFolgas = (await chamarApi('listFolgas', { ordenarPor: 'criado_desc', ...filtro })) || [];
  renderizarTabelaFolgas();
  atualizarPainelHoje();
}

function renderizarTabelaFolgas() {
  const corpo = document.getElementById('corpo-tabela-folgas');
  if (cacheFolgas.length === 0) {
    corpo.innerHTML = '<tr><td colspan="5" class="mensagem-vazio">Nenhuma folga encontrada.</td></tr>';
    return;
  }
  corpo.innerHTML = cacheFolgas.map(f => `
    <tr>
      <td>${f.DATA}</td><td>${f.QRA}</td><td>${f.POSTO}</td><td>${f.OBSERVACAO || ''}</td>
      <td>
        <button class="btn-secundario" onclick="abrirModalFolga('${f.ID}')">Editar</button>
        <button class="btn-perigo" onclick="excluirFolga('${f.ID}')">Excluir</button>
      </td>
    </tr>`).join('');
}

document.getElementById('btn-filtrar-folgas').addEventListener('click', () => {
  const ini = document.getElementById('filtro-folga-data-inicio').value;
  const fim = document.getElementById('filtro-folga-data-fim').value;
  carregarFolgas({ dataInicio: isoParaBR(ini), dataFim: isoParaBR(fim || ini) });
});
document.getElementById('btn-limpar-filtro-folgas').addEventListener('click', () => {
  document.getElementById('filtro-folga-data-inicio').value = '';
  document.getElementById('filtro-folga-data-fim').value = '';
  carregarFolgas();
});

// ================= MODAL DE FOLGA (NOVA / EDITAR) =================
const modalFolga = document.getElementById('modal-folga');

document.getElementById('btn-nova-folga').addEventListener('click', () => abrirModalFolga(null));
document.getElementById('btn-cancelar-folga').addEventListener('click', () => modalFolga.classList.add('hidden'));

function abrirModalFolga(id) {
  document.getElementById('form-folga').reset();
  document.getElementById('folga-id').value = '';
  document.getElementById('folga-novo-id').value = id ? '' : gerarIdCliente();
  document.getElementById('folga-qra-valor').value = '';
  document.getElementById('modal-folga-titulo').textContent = id ? 'Editar Folga' : 'Nova Folga';

  if (id) {
    const f = cacheFolgas.find(x => x.ID === id);
    document.getElementById('folga-id').value = f.ID;
    document.getElementById('folga-qra-busca').value = f.QRA;
    document.getElementById('folga-qra-valor').value = f.QRA;
    document.getElementById('folga-data').value = brParaIso(f.DATA);
    document.getElementById('folga-posto').value = f.POSTO;
    document.getElementById('folga-observacao').value = f.OBSERVACAO || '';
  }
  modalFolga.classList.remove('hidden');
}

document.getElementById('form-folga').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('folga-id').value;
  const payload = {
    id,
    idClienteNovo: id ? undefined : document.getElementById('folga-novo-id').value,
    qra: document.getElementById('folga-qra-valor').value,
    data: isoParaBR(document.getElementById('folga-data').value),
    posto: document.getElementById('folga-posto').value,
    observacao: document.getElementById('folga-observacao').value,
    usuarioNome: usuario.nome
  };
  try {
    if (id) await chamarApi('editFolga', payload);
    else await chamarApi('addFolga', payload);
    modalFolga.classList.add('hidden');
    await carregarFolgas();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
});

async function excluirFolga(id) {
  if (!confirm('Tem certeza que deseja excluir esta folga?')) return;
  try {
    await chamarApi('deleteFolga', { id });
    await carregarFolgas();
  } catch (e) {
    alert('Erro ao excluir: ' + e.message);
  }
}

configurarAutocomplete('folga-qra-busca', 'folga-qra-valor', 'lista-autocomplete-folga-qra');

// ================= LISTAGEM DE DEVENDO =================
async function carregarDevendo(filtro = {}) {
  cacheDevendo = (await chamarApi('listDevendo', { ordenarPor: 'criado_desc', ...filtro })) || [];
  renderizarTabelaDevendo();
}

function renderizarTabelaDevendo() {
  const corpo = document.getElementById('corpo-tabela-devendo');
  if (cacheDevendo.length === 0) {
    corpo.innerHTML = '<tr><td colspan="7" class="mensagem-vazio">Nenhum registro encontrado.</td></tr>';
    return;
  }
  corpo.innerHTML = cacheDevendo.map(d => `
    <tr>
      <td>${d.DATA}</td><td>${d.QRA}</td><td>${d.TURNO}</td><td>${d.POSTO}</td>
      <td>${d.AUTORIZADO_POR || ''}</td><td>${d.OBSERVACAO || ''}</td>
      <td>
        <button class="btn-secundario" onclick="abrirModalDevendo('${d.ID}')">Editar</button>
        <button class="btn-perigo" onclick="excluirDevendo('${d.ID}')">Excluir</button>
      </td>
    </tr>`).join('');
}

document.getElementById('btn-filtrar-devendo').addEventListener('click', () => {
  const ini = document.getElementById('filtro-devendo-data-inicio').value;
  const fim = document.getElementById('filtro-devendo-data-fim').value;
  carregarDevendo({ dataInicio: isoParaBR(ini), dataFim: isoParaBR(fim || ini) });
});
document.getElementById('btn-limpar-filtro-devendo').addEventListener('click', () => {
  document.getElementById('filtro-devendo-data-inicio').value = '';
  document.getElementById('filtro-devendo-data-fim').value = '';
  carregarDevendo();
});

// ================= MODAL DE DEVENDO (NOVO / EDITAR) =================
const modalDevendo = document.getElementById('modal-devendo');

document.getElementById('btn-nova-devendo').addEventListener('click', () => abrirModalDevendo(null));
document.getElementById('btn-cancelar-devendo').addEventListener('click', () => modalDevendo.classList.add('hidden'));

function abrirModalDevendo(id) {
  document.getElementById('form-devendo').reset();
  document.getElementById('devendo-id').value = '';
  document.getElementById('devendo-novo-id').value = id ? '' : gerarIdCliente();
  document.getElementById('devendo-qra-valor').value = '';
  document.getElementById('modal-devendo-titulo').textContent = id ? 'Editar Devendo' : 'Novo Devendo';

  if (id) {
    const d = cacheDevendo.find(x => x.ID === id);
    document.getElementById('devendo-id').value = d.ID;
    document.getElementById('devendo-qra-busca').value = d.QRA;
    document.getElementById('devendo-qra-valor').value = d.QRA;
    document.getElementById('devendo-data').value = brParaIso(d.DATA);
    document.getElementById('devendo-turno').value = d.TURNO;
    document.getElementById('devendo-posto').value = d.POSTO;
    document.getElementById('devendo-autorizado-por').value = d.AUTORIZADO_POR || '';
    document.getElementById('devendo-observacao').value = d.OBSERVACAO || '';
  }
  modalDevendo.classList.remove('hidden');
}

document.getElementById('form-devendo').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = document.getElementById('devendo-id').value;
  const payload = {
    id,
    idClienteNovo: id ? undefined : document.getElementById('devendo-novo-id').value,
    qra: document.getElementById('devendo-qra-valor').value,
    data: isoParaBR(document.getElementById('devendo-data').value),
    turno: document.getElementById('devendo-turno').value,
    posto: document.getElementById('devendo-posto').value,
    autorizadoPor: document.getElementById('devendo-autorizado-por').value,
    observacao: document.getElementById('devendo-observacao').value,
    usuarioNome: usuario.nome
  };
  try {
    if (id) await chamarApi('editDevendo', payload);
    else await chamarApi('addDevendo', payload);
    modalDevendo.classList.add('hidden');
    await carregarDevendo();
  } catch (e) {
    alert('Erro ao salvar: ' + e.message);
  }
});

async function excluirDevendo(id) {
  if (!confirm('Tem certeza que deseja excluir este registro?')) return;
  try {
    await chamarApi('deleteDevendo', { id });
    await carregarDevendo();
  } catch (e) {
    alert('Erro ao excluir: ' + e.message);
  }
}

configurarAutocomplete('devendo-qra-busca', 'devendo-qra-valor', 'lista-autocomplete-devendo-qra');

// ================= RANKING DE HP =================
function inicializarFiltroMesHP() {
  const input = document.getElementById('filtro-hp-mes');
  if (!input.value) {
    const hoje = new Date();
    input.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  }
}

async function carregarRankingHP() {
  inicializarFiltroMesHP();
  const [ano, mes] = document.getElementById('filtro-hp-mes').value.split('-');
  const ranking = await chamarApi('listRankingHP', { ano: Number(ano), mes: Number(mes) - 1 }) || [];
  const corpo = document.getElementById('corpo-tabela-hp');
  if (ranking.length === 0) {
    corpo.innerHTML = '<tr><td colspan="3" class="mensagem-vazio">Nenhuma permuta neste mês.</td></tr>';
    return;
  }
  corpo.innerHTML = ranking.map((r, i) => `
    <tr>
      <td>${i + 1}º</td>
      <td>${r.escalado}</td>
      <td>${badgeHP(r.hp)}</td>
    </tr>`).join('');
}

document.getElementById('btn-ver-ranking-hp').addEventListener('click', carregarRankingHP);

// ================= PAINEL ADMIN =================
function renderizarAdmin() {
  renderizarListaAdmin('lista-postos', cachePostos, (valor) => excluirItemAdmin('deletePosto', { posto: valor }));
  renderizarListaAdmin('lista-turnos', cacheTurnos.map(t => `${t.TURNO} (${t.HORAS}h)`), null, cacheTurnos.map(t => t.TURNO), (valor) => excluirItemAdmin('deleteTurno', { turno: valor }));
  renderizarListaAdmin('lista-recebido-por', cacheRecebidoPor, (valor) => excluirItemAdmin('deleteRecebidoPor', { nome: valor }));
  renderizarListaAdmin('lista-autorizado-por', cacheAutorizadoPor, (valor) => excluirItemAdmin('deleteAutorizadoPor', { nome: valor }));
  renderizarListaFuncionarios();
}

function renderizarListaFuncionarios() {
  const ul = document.getElementById('lista-funcionarios');
  if (cacheFuncionarios.length === 0) { ul.innerHTML = '<li class="mensagem-vazio">Nenhum registro.</li>'; return; }
  ul.innerHTML = cacheFuncionarios.map(f => `
    <li>
      ${f.QRA}
      <span style="display:flex; gap:6px;">
        <button class="btn-secundario" data-qra="${f.QRA}" data-acao="editar">editar</button>
        <button class="btn-perigo" data-qra="${f.QRA}" data-acao="remover">remover</button>
      </span>
    </li>`).join('');
  ul.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = cacheFuncionarios.find(x => x.QRA === btn.dataset.qra);
      if (btn.dataset.acao === 'editar') {
        preencherFormEditarFuncionario(f);
      } else {
        if (!confirm('Remover este registro?')) return;
        excluirItemAdmin('deleteFuncionario', { qra: btn.dataset.qra });
      }
    });
  });
}

function preencherFormEditarFuncionario(f) {
  document.getElementById('input-func-qra-original').value = f.QRA;
  document.getElementById('input-func-nome').value = f.NOME_COMPLETO;
  document.getElementById('input-func-classe').value = f.CLASSE;
  document.getElementById('input-func-qra').value = f.QRA;
  document.getElementById('input-func-email').value = f.EMAIL || '';
  document.getElementById('btn-salvar-funcionario').textContent = 'Salvar alteração';
  document.getElementById('btn-cancelar-edicao-funcionario').classList.remove('hidden');
  document.getElementById('form-add-funcionario').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelarEdicaoFuncionario() {
  document.getElementById('form-add-funcionario').reset();
  document.getElementById('input-func-qra-original').value = '';
  document.getElementById('btn-salvar-funcionario').textContent = 'Adicionar funcionário';
  document.getElementById('btn-cancelar-edicao-funcionario').classList.add('hidden');
}
document.getElementById('btn-cancelar-edicao-funcionario').addEventListener('click', cancelarEdicaoFuncionario);

function renderizarListaAdmin(idLista, textos, aoExcluir, valoresReais, aoExcluirComValorReal) {
  const ul = document.getElementById(idLista);
  if (textos.length === 0) { ul.innerHTML = '<li class="mensagem-vazio">Nenhum registro.</li>'; return; }
  ul.innerHTML = textos.map((t, i) => {
    const valor = valoresReais ? valoresReais[i] : t;
    return `<li>${t} <button class="btn-perigo" data-valor="${valor}">remover</button></li>`;
  }).join('');
  ul.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Remover este registro?')) return;
      (aoExcluirComValorReal || aoExcluir)(btn.dataset.valor);
    });
  });
}

async function excluirItemAdmin(action, payload) {
  try {
    await chamarApi(action, payload);
    await carregarListasBase();
    renderizarAdmin();
  } catch (e) {
    alert('Erro: ' + e.message);
  }
}

document.getElementById('form-add-posto').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const input = document.getElementById('input-novo-posto');
  try {
    await chamarApi('addPosto', { posto: input.value.toUpperCase() });
    input.value = '';
    await carregarListasBase();
    renderizarAdmin();
  } catch (e) { alert('Erro: ' + e.message); }
});

document.getElementById('form-add-turno').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const nome = document.getElementById('input-novo-turno');
  const horas = document.getElementById('input-novo-turno-horas');
  try {
    await chamarApi('addTurno', { turno: nome.value.toUpperCase(), horas: horas.value });
    nome.value = ''; horas.value = '';
    await carregarListasBase();
    renderizarAdmin();
  } catch (e) { alert('Erro: ' + e.message); }
});

document.getElementById('form-add-recebido-por').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const input = document.getElementById('input-novo-recebido-por');
  try {
    await chamarApi('addRecebidoPor', { nome: input.value.toUpperCase() });
    input.value = '';
    await carregarListasBase();
    renderizarAdmin();
  } catch (e) { alert('Erro: ' + e.message); }
});

document.getElementById('form-add-autorizado-por').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const input = document.getElementById('input-novo-autorizado-por');
  try {
    await chamarApi('addAutorizadoPor', { nome: input.value.toUpperCase() });
    input.value = '';
    await carregarListasBase();
    renderizarAdmin();
  } catch (e) { alert('Erro: ' + e.message); }
});

document.getElementById('form-add-funcionario').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const nome = document.getElementById('input-func-nome');
  const classe = document.getElementById('input-func-classe');
  const qra = document.getElementById('input-func-qra');
  const email = document.getElementById('input-func-email');
  const qraOriginal = document.getElementById('input-func-qra-original').value;
  try {
    if (qraOriginal) {
      await chamarApi('editFuncionario', {
        qraOriginal, nomeCompleto: nome.value, classe: classe.value, qra: qra.value.toUpperCase(), email: email.value
      });
    } else {
      await chamarApi('addFuncionario', { nomeCompleto: nome.value, classe: classe.value, qra: qra.value.toUpperCase(), email: email.value });
    }
    cancelarEdicaoFuncionario();
    await carregarListasBase();
    renderizarAdmin();
  } catch (e) { alert('Erro: ' + e.message); }
});
