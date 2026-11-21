'use strict';

/* =====================================================================
   CONFIGURAÇÃO — cole aqui os dados do seu projeto Supabase
   (Project Settings > API). Use SOMENTE a chave "anon" / "publishable".
   NUNCA coloque a chave service_role / secret aqui.
   ===================================================================== */
const SUPABASE_URL = 'https://khfneqgyaxsmhrqparwt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5gJBhYeRFviU7S70ZeRpdA_lHPLaC9E'; // chave pública (publishable)

/* ---------------------------------------------------------------------
   Constantes
   --------------------------------------------------------------------- */
const NOMES_TIPO_EVENTO = { culto: 'Culto', ensaio: 'Ensaio', aula: 'Aula', reuniao: 'Reunião' };
const NOMES_TIPO_ITEM = { musica: 'Música', danca: 'Dança', teatro: 'Teatro', aviso: 'Aviso' };
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_SEMANA_LONGO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // segunda a domingo
// Ícones de linha (SVG) usados nos botões
const ICONES = {
  telao: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/></svg>',
  conversa: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 19.8l1.2-4A8 8 0 1 1 20 11.5z"/></svg>',
  olho: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  olhoFechado: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9M6.6 7.6C4 9.3 2.5 12 2.5 12S6 18 12 18c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
};
const ANO_DESCONHECIDO = '1904'; // usado quando a data de nascimento não tem ano
const FUNCOES_SUGERIDAS = ['Ministro', 'Vocal', 'Violão', 'Guitarra', 'Baixo', 'Teclado', 'Bateria', 'Som', 'Projeção', 'Transmissão', 'Câmera', 'Fotografia', 'Iluminação', 'Coreografia'];
// Sugestões da escala por ministério (procurado pelo nome, sem acento)
const DICAS_MINISTERIO = [
  { chave: 'louvor', funcoes: ['Ministro', 'Vocal', 'Violão', 'Guitarra', 'Baixo', 'Teclado', 'Bateria', 'Som'] },
  { chave: 'diacon', funcoes: ['Diáconos', 'Portaria', 'Ceia', 'Oferta', 'Apoio'], nomes: ['Todos os diáconos'], dica: 'Quando for a equipe toda, escreva “Todos os diáconos” em Quem vai atuar.' },
  { chave: 'kids', funcoes: ['Salinha', 'Ajudante da salinha', 'Professor(a)'], dica: 'Escale quem vai ajudar na salinha.' },
  { chave: 'midia', funcoes: ['Fotos', 'Conteúdo para o Instagram', 'Stories'], dica: 'Fotos e conteúdo para o Instagram.' },
  { chave: 'audiovisual', funcoes: ['Projeção', 'Transmissão', 'Iluminação', 'Som'], dica: 'Projeção, transmissão e iluminação.' },
  { chave: 'danca', funcoes: ['Coreografia', 'Dança'] },
  { chave: 'teatro', funcoes: ['Direção', 'Atuação', 'Figurino'] },
  { chave: 'recepcao', funcoes: ['Recepção', 'Porta', 'Boas-vindas'] },
  { chave: 'jiu', funcoes: ['Professor', 'Auxiliar'] },
];

const estado = {
  sessao: null,
  lider: null,
  areas: [],
  canal: null,
  renderId: 0,
  pendente: false,
  recuperando: new URLSearchParams(location.search).has('redefinir'),
  mesAtual: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  diaSelecionado: null,
  visaoCal: null,       // 'semana' ou 'mes' (líder abre em Semana; admin em Mês)
  semanaInicio: null,   // segunda-feira da semana mostrada
  geradoAte: null,      // até que data os eventos semanais já foram criados nesta sessão
  semanaisAberto: false, // seção "Eventos semanais" do calendário (começa recolhida)
  seriesAbertas: null,  // séries abertas dentro dela (Set de ids)
  subabaAdmin: 'lideres',
  subabaMembros: 'lista',
  mesAniversario: new Date().getMonth(),
  areaAnotacoes: null,
  telaoEvento: null,
  telaoIndice: -1,
};

let db = null;
const app = document.getElementById('app');
const $ = (sel, raiz = document) => raiz.querySelector(sel);

/* ---------------------------------------------------------------------
   Utilidades
   --------------------------------------------------------------------- */
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function linkSeguro(url) {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
function deISO(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
function isoLocal(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
const fmtLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
function dataLonga(iso) { return fmtLonga.format(deISO(iso)); }
function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function hora(t) { return t ? t.slice(0, 5) : ''; }
function aniversario(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return a === ANO_DESCONHECIDO ? `${d}/${m}` : `${d}/${m}/${a}`;
}
function semAcento(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
function agrupar(lista, chave) {
  const m = new Map();
  for (const item of lista) {
    const k = chave(item);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(item);
  }
  return m;
}
function nomeArea(id) {
  return estado.areas.find((a) => a.id === id)?.nome ?? '—';
}
function eAdmin() { return estado.lider?.papel === 'admin'; }
function podeEditar(areaId) { return eAdmin() || (areaId != null && areaId === estado.lider?.area_id); }
function opcoesAreas() { return estado.areas.map((a) => [a.id, a.nome]); }
function urlBase() { return location.origin + location.pathname; }
function limparUrl() {
  if (location.search) history.replaceState(null, '', location.pathname + location.hash);
}

// Converte "23/11/1990", "23/11", "23-11-90" ou "1990-11-23" em "AAAA-MM-DD".
// Sem ano, usa 1904 (ano bissexto, aceita 29/02); o app mostra só dia/mês.
function parseData(s) {
  s = String(s ?? '').trim();
  if (!s) return null;
  let d, m, a;
  let r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (r) { a = +r[1]; m = +r[2]; d = +r[3]; }
  else {
    r = s.match(/^(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2}|\d{4}))?$/);
    if (!r) return null;
    d = +r[1]; m = +r[2];
    a = r[3] ? +r[3] : Number(ANO_DESCONHECIDO);
    if (r[3] && r[3].length === 2) a += a > 30 ? 1900 : 2000;
  }
  const dt = new Date(a, m - 1, d);
  if (dt.getFullYear() !== a || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return isoLocal(dt);
}

function traduzErro(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/row-level security|permission denied|violates row/i.test(m)) return 'Você não tem permissão para isso.';
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos.';
  if (/already registered/i.test(m)) return 'Este e-mail já tem cadastro. Use "Entrar" ou "Esqueci a senha".';
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/should be different/i.test(m)) return 'A nova senha precisa ser diferente da anterior.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Espere alguns minutos.';
  if (/duplicate key/i.test(m)) return 'Já existe um cadastro com esses dados.';
  if (/foreign key/i.test(m)) return 'Este registro está em uso e não pode ser removido.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem conexão. Verifique a internet.';
  if (/exceeded the maximum allowed size|Payload too large|413/i.test(m)) return 'Arquivo grande demais: o limite do plano gratuito é 50 MB por arquivo.';
  if (/mime type .* is not supported|invalid_mime_type/i.test(m)) return 'O arquivo precisa ser de áudio ou vídeo.';
  if (/Object not found|not_found/i.test(m)) return 'Arquivo não encontrado (pode ter sido apagado).';
  return m;
}

/* ---------------------------------------------------------------------
   Animações (Motion). Se a biblioteca não carregar ou o usuário pedir
   menos movimento, nada é animado e o app funciona igual.
   --------------------------------------------------------------------- */
const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
function anima(alvo, quadros, opcoes = {}) {
  if (!alvo || !window.Motion || menosMovimento.matches) return null;
  try {
    return window.Motion.animate(alvo, quadros, { duration: 0.25, ease: 'easeOut', ...opcoes });
  } catch {
    return null;
  }
}
// Espera a animação terminar, mas nunca mais que maxMs (aba em segundo plano pode congelar animações).
async function esperar(animacao, maxMs = 450) {
  if (!animacao) return;
  await Promise.race([
    Promise.resolve(animacao.finished || animacao).catch(() => {}),
    new Promise((ok) => setTimeout(ok, maxMs)),
  ]);
}
function entrarCards(raiz) {
  if (!window.Motion || menosMovimento.matches) return;
  const cards = Array.from(raiz.querySelectorAll('.card')).slice(0, 14);
  if (cards.length) anima(cards, { opacity: [0, 1], y: [10, 0] }, { duration: 0.28, delay: window.Motion.stagger(0.04) });
}

/* ---------------------------------------------------------------------
   Avisos, janelas e formulários
   --------------------------------------------------------------------- */
function aviso(msg, erro = false) {
  const d = document.createElement('div');
  d.className = 'aviso' + (erro ? ' erro-aviso' : '');
  d.setAttribute('role', 'status');
  d.textContent = msg;
  $('#avisos').append(d);
  anima(d, { opacity: [0, 1], y: [12, 0], scale: [0.96, 1] }, { duration: 0.25 });
  setTimeout(async () => {
    await esperar(anima(d, { opacity: [1, 0], y: [0, 8] }, { duration: 0.2 }));
    d.remove();
  }, erro ? 4000 : 2200);
}

function abrirJanela(titulo, corpoHTML) {
  const d = document.createElement('dialog');
  d.setAttribute('aria-label', titulo);
  d.innerHTML = `<h2>${esc(titulo)}</h2>${corpoHTML}`;
  document.body.append(d);
  d.addEventListener('click', (e) => {
    if (e.target.closest('[data-fechar]')) { e.preventDefault(); fecharJanela(d); return; }
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      const fora = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (fora) fecharJanela(d);
    }
  });
  // Limpeza ao fechar. Roda uma vez só, seja pelo botão (fecharJanela) ou pelo
  // evento "close" do navegador; não depende só do evento, que alguns
  // navegadores embutidos não disparam.
  d._aoFechar = [];
  d._finalizar = () => {
    if (d.dataset.finalizado) return;
    d.dataset.finalizado = '1';
    if (d.open) d.close();
    d.remove();
    d._aoFechar.forEach((fn) => fn());
    if (estado.pendente && !document.querySelector('dialog[open]')) {
      estado.pendente = false;
      roteador(true);
    }
  };
  d.addEventListener('close', d._finalizar);
  // Tecla Esc: fecha com a mesma animação
  d.addEventListener('cancel', (e) => { e.preventDefault(); fecharJanela(d); });
  d.showModal();
  anima(d, { opacity: [0, 1], scale: [0.96, 1], y: [10, 0] }, { duration: 0.25 });
  return d;
}

async function fecharJanela(d) {
  if (!d.open || d.dataset.fechando) return;
  d.dataset.fechando = '1';
  await esperar(anima(d, { opacity: [1, 0], scale: [1, 0.97] }, { duration: 0.2 }));
  d._finalizar ? d._finalizar() : d.close();
}

function confirmar(msg, textoOk = 'Excluir', classeOk = 'btn perigo') {
  return new Promise((resolver) => {
    let ok = false;
    const d = abrirJanela('Confirmar', `
      <p>${esc(msg)}</p>
      <div class="acoes">
        <button type="button" class="btn secundario" data-fechar>Cancelar</button>
        <button type="button" class="${classeOk}" data-ok>${esc(textoOk)}</button>
      </div>`);
    d.querySelector('[data-ok]').addEventListener('click', () => { ok = true; fecharJanela(d); });
    d._aoFechar.push(() => resolver(ok));
  });
}

function campoHTML(c, valor) {
  if (c.tipo === 'senha') return campoSenhaHTML(c, ''); // nunca vem preenchido
  if (c.tipo === 'checkbox') {
    return `<label class="campo-check"><input type="checkbox" name="${c.nome}" value="1" ${valor ? 'checked' : ''}><span>${esc(c.rotulo)}</span></label>`;
  }
  if (c.tipo === 'dias') {
    const marcados = new Set((valor || []).map(Number));
    return `<fieldset class="campo campo-dias"><legend>${esc(c.rotulo)}</legend><div class="dias-semana-campo">${ORDEM_SEMANA.map((d) =>
      `<label><input type="checkbox" name="${c.nome}" value="${d}" ${marcados.has(d) ? 'checked' : ''}><span>${DIAS_SEMANA[d]}</span></label>`).join('')}</div></fieldset>`;
  }
  const v = valor ?? c.padrao ?? '';
  if (c.tipo === 'hidden') return `<input type="hidden" name="${c.nome}" value="${esc(v)}">`;
  const req = c.obrigatorio ? 'required' : '';
  let controle;
  if (c.tipo === 'select') {
    const primeira = c.obrigatorio ? '<option value="">Escolha…</option>' : `<option value="">${esc(c.vazio || '— nenhuma —')}</option>`;
    controle = `<select name="${c.nome}" ${req}>${primeira}${c.opcoes.map(([val, rot]) =>
      `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(rot)}</option>`).join('')}</select>`;
  } else if (c.tipo === 'textarea') {
    controle = `<textarea name="${c.nome}" ${req} rows="${c.linhas || 4}">${esc(v)}</textarea>`;
  } else {
    const idLista = c.lista ? 'lista-' + c.nome + '-' + Math.random().toString(36).slice(2, 7) : '';
    controle = `<input type="${c.tipo || 'text'}" name="${c.nome}" value="${esc(v)}" ${req}
      ${c.tipo === 'number' ? 'inputmode="numeric" step="1"' : ''}
      ${c.placeholder ? `placeholder="${esc(c.placeholder)}"` : ''}
      ${c.autocomplete ? `autocomplete="${c.autocomplete}"` : ''}
      ${idLista ? `list="${idLista}"` : ''}>`;
    if (idLista) controle += `<datalist id="${idLista}">${c.lista.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>`;
  }
  return `<label class="campo"><span>${esc(c.rotulo)}</span>${controle}${c.ajuda ? `<small class="suave pequeno">${esc(c.ajuda)}</small>` : ''}</label>`;
}

function normalizar(campos, bruto) {
  const r = {};
  for (const c of campos) {
    let v = bruto[c.nome];
    if (v === undefined) continue;
    if (Array.isArray(v) || typeof v === 'boolean') { r[c.nome] = c.converter ? c.converter(v) : v; continue; }
    v = String(v).trim();
    if (v === '') v = null;
    if (v !== null && (c.tipo === 'number' || c.numero)) v = Number(v);
    if (c.converter) v = c.converter(v);
    r[c.nome] = v;
  }
  return r;
}

// Formulário genérico em janela. aoSalvar(dados) pode lançar erro (mostrado no formulário).
// Com aoSalvarMais, aparece também "Salvar e adicionar outro": salva, fecha e chama aoSalvarMais().
function abrirFormulario({ titulo, campos, valores = {}, aoSalvar, aoExcluir, aoSalvarMais, textoSalvar = 'Salvar', textoSalvarMais = 'Salvar e adicionar outro', textoExcluir = 'Excluir', confirmarExcluir = 'Excluir este registro?', ajuda, avisoSalvo = 'Salvo ✓' }) {
  const d = abrirJanela(titulo, `
    <form>
      ${ajuda ? `<p class="suave">${esc(ajuda)}</p>` : ''}
      ${campos.map((c) => campoHTML(c, valores[c.nome])).join('')}
      <p class="erro" hidden></p>
      <div class="acoes">
        ${aoExcluir ? `<button type="button" class="btn perigo" data-excluir>${esc(textoExcluir)}</button><span class="cresce"></span>` : ''}
        <button type="button" class="btn secundario" data-fechar>Cancelar</button>
        ${aoSalvarMais ? `<button type="submit" class="btn secundario" data-mais>${esc(textoSalvarMais)}</button>` : ''}
        <button type="submit" class="btn" data-principal>${esc(textoSalvar)}</button>
      </div>
    </form>`);
  const form = $('form', d);
  ligarCamposSenha(form);
  const erro = $('.erro', form);
  const btn = $('[data-principal]', form);
  const btnMais = $('[data-mais]', form);
  const mostrarErro = (msg) => {
    erro.textContent = msg;
    erro.hidden = false;
    anima(erro, { x: [-6, 6, -4, 4, 0] }, { duration: 0.3 });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erro.hidden = true;
    if (!form.reportValidity()) return;
    const mais = !!(e.submitter && e.submitter.hasAttribute('data-mais'));
    let dados;
    try {
      const fd = new FormData(form);
      const bruto = Object.fromEntries(fd);
      for (const c of campos) {
        if (c.tipo === 'dias') bruto[c.nome] = fd.getAll(c.nome);
        else if (c.tipo === 'checkbox') bruto[c.nome] = fd.has(c.nome);
      }
      dados = normalizar(campos, bruto);
    } catch (err) {
      mostrarErro(err.message);
      return;
    }
    btn.disabled = true;
    if (btnMais) btnMais.disabled = true;
    (mais ? btnMais : btn).textContent = 'Salvando…';
    try {
      await aoSalvar(dados);
      await fecharJanela(d);
      if (avisoSalvo) aviso(avisoSalvo);
      if (mais) aoSalvarMais();
    } catch (err) {
      mostrarErro(traduzErro(err));
    } finally {
      btn.disabled = false;
      btn.textContent = textoSalvar;
      if (btnMais) { btnMais.disabled = false; btnMais.textContent = textoSalvarMais; }
    }
  });

  if (aoExcluir) {
    $('[data-excluir]', form).addEventListener('click', async () => {
      if (confirmarExcluir && !(await confirmar(confirmarExcluir, textoExcluir))) return;
      try {
        if ((await aoExcluir()) === false) return; // desistiu numa pergunta própria
        await fecharJanela(d);
        aviso('Feito ✓');
      } catch (err) {
        mostrarErro(traduzErro(err));
      }
    });
  }
  const primeiro = form.querySelector('input:not([type=hidden]), select, textarea');
  if (primeiro && !('ontouchstart' in window)) primeiro.focus();
  return d;
}

/* ---------------------------------------------------------------------
   Acesso ao banco (a RLS no Supabase é quem decide o que pode)
   --------------------------------------------------------------------- */
async function gravar(tabela, dados, id) {
  const q = id != null ? db.from(tabela).update(dados).eq('id', id) : db.from(tabela).insert(dados);
  const { data, error } = await q.select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('permission denied');
  return data[0];
}
async function apagar(tabela, filtro) {
  const { data, error } = await db.from(tabela).delete().match(filtro).select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('permission denied');
}
async function recarregarAreas() {
  const { data, error } = await db.from('areas').select('*').order('nome');
  if (error) throw error;
  estado.areas = data || [];
}

/* ---------------------------------------------------------------------
   Login, cadastro de senha e recuperação
   --------------------------------------------------------------------- */
// Telas sem menu (login, nova senha, sem acesso): só a marca no topo.
function telaSimples(html) {
  $('#topo').hidden = false;
  $('#usuario').hidden = true;
  $('#abas').hidden = true;
  document.body.classList.remove('modo-telao');
  document.body.classList.add('sem-menu');
  app.onclick = app.oninput = app.onchange = null;
  app.innerHTML = html;
  anima(app, { opacity: [0, 1], y: [8, 0] }, { duration: 0.3 });
}

// Login só por e-mail e senha. Não há recuperação por e-mail: quem esqueceu a senha
// fala com o administrador, que define uma nova em Admin › Líderes.
function telaLogin(_modo = 'entrar', mensagem = '') {
  telaSimples(`
    <section class="tela-login">
      <h1>Entrar</h1>
      <p class="suave">Acesso dos líderes</p>
      <div class="card">
        <form id="form-login">
          <label class="campo"><span>E-mail</span><input type="email" name="email" required autocomplete="email" inputmode="email"></label>
          <label class="campo"><span>Senha</span><input type="password" name="senha" required autocomplete="current-password"></label>
          <p class="erro" ${mensagem ? '' : 'hidden'}>${esc(mensagem)}</p>
          <button class="btn bloco" type="submit">Entrar</button>
        </form>
        <p class="aviso-senha suave pequeno">Esqueceu a senha? Fale com o administrador.</p>
      </div>
    </section>`);

  const form = $('#form-login');
  const erro = $('.erro', form);
  const btn = $('[type=submit]', form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    erro.hidden = true;
    try {
      const { error } = await db.auth.signInWithPassword({ email: form.email.value.trim().toLowerCase(), password: form.senha.value });
      if (error) throw error;
    } catch (err) {
      erro.textContent = traduzErro(err);
      erro.hidden = false;
      anima(erro, { x: [-6, 6, -4, 4, 0] }, { duration: 0.3 });
    } finally {
      btn.disabled = false;
    }
  });
}

function telaNovaSenha() {
  telaSimples(`
    <section class="tela-login">
      <h1>Nova senha</h1>
      <p class="suave">Digite a nova senha duas vezes.</p>
      <div class="card">
        <form id="form-senha">
          <label class="campo"><span>Nova senha</span><input type="password" name="senha" required minlength="6" autocomplete="new-password"></label>
          <label class="campo"><span>Repita a senha</span><input type="password" name="senha2" required minlength="6" autocomplete="new-password"></label>
          <p class="erro" hidden></p>
          <button class="btn bloco" type="submit">Salvar senha</button>
        </form>
      </div>
    </section>`);
  const form = $('#form-senha');
  const erro = $('.erro', form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erro.hidden = true;
    if (form.senha.value !== form.senha2.value) {
      erro.textContent = 'As senhas não são iguais.';
      erro.hidden = false;
      return;
    }
    const { error } = await db.auth.updateUser({ password: form.senha.value });
    if (error) { erro.textContent = traduzErro(error); erro.hidden = false; return; }
    estado.recuperando = false;
    limparUrl();
    aviso('Senha alterada ✓');
    const { data } = await db.auth.getSession();
    if (data.session) carregarPerfil(data.session);
  });
}

function telaSemAcesso(email) {
  telaSimples(`
    <section class="tela-login">
      <h1>Acesso não liberado</h1>
      <div class="card">
        <p>Você entrou como <strong>${esc(email)}</strong>, mas esta conta ainda não está ligada a nenhum ministério.</p>
        <p class="suave">Peça ao administrador para cadastrar você como líder. Depois toque em "Tentar de novo".</p>
        <div class="acoes">
          <button class="btn secundario" type="button" data-acao="sair">Sair</button>
          <button class="btn" type="button" data-acao="tentar">Tentar de novo</button>
        </div>
      </div>
    </section>`);
  app.onclick = (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    if (b.dataset.acao === 'sair') sair();
    if (b.dataset.acao === 'tentar') carregarPerfil(estado.sessao);
  };
}

async function carregarPerfil(sessao) {
  // Evita carregar duas vezes ao mesmo tempo (vários eventos de login seguidos)
  if (estado.carregandoPerfil) return;
  estado.carregandoPerfil = true;
  try {
    await carregarPerfilAgora(sessao);
  } finally {
    estado.carregandoPerfil = false;
  }
}

async function carregarPerfilAgora(sessao) {
  estado.sessao = sessao;
  try {
    const { data: liberado, error } = await db.rpc('aceitar_convite');
    if (error) throw error;
    if (!liberado) { estado.lider = null; telaSemAcesso(sessao.user.email); return; }

    const [rLider] = await Promise.all([
      db.from('lideres').select('*').eq('id', sessao.user.id).single(),
      recarregarAreas(),
    ]);
    if (rLider.error) throw rLider.error;
    estado.lider = rLider.data;
  } catch (err) {
    telaSimples(`<section class="tela-login"><div class="card"><p class="erro">${esc(traduzErro(err))}</p>
      <div class="acoes"><button class="btn secundario" data-acao="sair">Sair</button><button class="btn" data-acao="tentar">Tentar de novo</button></div></div></section>`);
    app.onclick = (e) => {
      const b = e.target.closest('[data-acao]');
      if (b?.dataset.acao === 'sair') sair();
      if (b?.dataset.acao === 'tentar') carregarPerfil(sessao);
    };
    return;
  }

  const l = estado.lider;
  estado.visaoCal = eAdmin() ? 'mes' : 'semana';
  estado.semanaInicio = null;
  estado.geradoAte = null;
  const primeiroNome = (l.nome || '').trim().split(' ').filter(Boolean)[0] || 'Você';
  $('#quem').textContent = `${l.nome} · ${l.papel === 'admin' ? 'Administrador' : nomeArea(l.area_id)}`;
  $('#avatar').textContent = primeiroNome.charAt(0).toUpperCase();
  $('#usuario-nome').textContent = primeiroNome;
  $('#usuario').hidden = false;
  document.body.classList.remove('sem-menu');
  $('#aba-admin').hidden = !eAdmin();
  $('#btn-senha').hidden = !eAdmin(); // líder não troca a senha: fala com o administrador
  $('#aba-membros').hidden = !eAdmin();
  $('#aba-historico').hidden = !eAdmin(); // histórico de músicas: só o admin (os ministérios veem as músicas dentro do evento)
  // Admin: "Equipes" (todas). Líder: "Minha equipe" (atalho direto para a área dele).
  const abaEquipe = $('#aba-equipe');
  const rotuloEquipe = eAdmin() ? 'Ministérios' : 'Minha equipe';
  abaEquipe.href = eAdmin() || l.area_id == null ? '#/ministerios' : `#/equipe/${l.area_id}`;
  abaEquipe.setAttribute('aria-label', rotuloEquipe);
  $('.aba-nome', abaEquipe).textContent = rotuloEquipe;
  limparUrl();
  assinarRealtime();
  registrarAcesso();
  roteador();
  dicaIOS();
}

// Grava a hora em que o líder abriu o app (painel Admin › Acessos).
// No máximo uma vez a cada 10 minutos; também quando o app volta para a tela.
let ultimoRegistro = 0;
function registrarAcesso() {
  if (!estado.lider || Date.now() - ultimoRegistro < 10 * 60 * 1000) return;
  ultimoRegistro = Date.now();
  db.rpc('registrar_acesso').then(({ error }) => { if (error) ultimoRegistro = 0; });
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') registrarAcesso();
});

async function sair() {
  if (estado.canal) { db.removeChannel(estado.canal); estado.canal = null; }
  ultimoRegistro = 0;
  await db.auth.signOut();
}

function aoMudarAuth(evento, sessao) {
  if (evento === 'PASSWORD_RECOVERY') {
    estado.recuperando = true;
    estado.sessao = sessao;
    telaNovaSenha();
    return;
  }
  if (evento === 'SIGNED_OUT' || !sessao) {
    estado.sessao = null;
    estado.lider = null;
    estado.recuperando = false;
    limparUrl();
    if (estado.canal) { db.removeChannel(estado.canal); estado.canal = null; }
    telaLogin();
    return;
  }
  if (estado.recuperando) {
    estado.sessao = sessao;
    telaNovaSenha();
    return;
  }
  const trocouUsuario = estado.sessao?.user?.id !== sessao.user.id;
  estado.sessao = sessao;
  if (!estado.lider || trocouUsuario) carregarPerfil(sessao);
}

/* ---------------------------------------------------------------------
   Navegação (rotas com #/...)
   --------------------------------------------------------------------- */
function rotaAtual() {
  const h = location.hash;
  if (!h.startsWith('#/')) return { nome: 'calendario', params: [] };
  const partes = h.slice(2).split('/');
  return { nome: partes[0] || 'calendario', params: partes.slice(1) };
}

function mostrar(ctx, html) {
  app.onclick = app.oninput = app.onchange = null;
  app.innerHTML = html;
  if (!ctx.silencioso) {
    anima(app, { opacity: [0, 1], y: [8, 0] }, { duration: 0.28 });
    entrarCards(app);
  }
}

async function roteador(silencioso = false) {
  if (!estado.lider) return;
  const { nome, params } = rotaAtual();
  const telao = nome === 'telao';
  document.body.classList.toggle('modo-telao', telao);
  document.body.classList.toggle('sem-menu', telao);
  $('#topo').hidden = telao;
  $('#abas').hidden = telao;
  const abaAtiva = { evento: 'calendario', reuniao: 'reunioes', equipe: 'equipes', ministerio: 'equipes', ministerios: 'equipes', anotacoes: 'equipes' }[nome] || nome;
  document.querySelectorAll('#abas a').forEach((a) => {
    const ativa = a.dataset.rota === abaAtiva;
    a.classList.toggle('ativa', ativa);
    if (ativa) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  const token = ++estado.renderId;
  const ctx = { silencioso, velho: () => token !== estado.renderId };
  if (!silencioso) window.scrollTo(0, 0);

  try {
    switch (nome) {
      case 'evento': await telaEvento(Number(params[0]), ctx); break;
      case 'telao': await telaTelao(Number(params[0]), ctx); break;
      case 'reunioes': await telaReunioes(ctx); break;
      case 'reuniao': await telaReunioes(ctx, Number(params[0])); break;
      case 'historico': await telaHistorico(ctx); break;
      case 'anotacoes': await telaAnotacoes(ctx); break;
      case 'equipes': case 'ministerios': await telaEquipes(ctx); break;
      case 'equipe': case 'ministerio': await telaEquipe(Number(params[0]), ctx); break;
      case 'admin': await telaAdmin(ctx); break;
      case 'membros': await telaMembros(ctx); break;
      default: await telaCalendario(ctx);
    }
  } catch (err) {
    if (ctx.velho()) return;
    mostrar(ctx, `<div class="card"><p class="erro">${esc(traduzErro(err))}</p>
      <button class="btn secundario" type="button" data-acao="tentar">Tentar de novo</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-acao=tentar]')) roteador(); };
  }
}

window.addEventListener('hashchange', () => roteador());

/* ---------------------------------------------------------------------
   Tela: calendário do mês
   --------------------------------------------------------------------- */
function cardEvento(e) {
  const dt = deISO(e.data);
  return `
    <a class="card card-link linha" href="#/evento/${e.id}">
      <div class="evento-data"><b>${dt.getDate()}</b><small>${DIAS_ABREV[dt.getDay()]}</small></div>
      <div class="cresce">
        <strong>${esc(e.titulo)}</strong>
        <div class="suave">${esc(hora(e.horario) || 'Sem horário')} · ${esc(NOMES_TIPO_EVENTO[e.tipo] || e.tipo)}${e.area_id ? ` · ${esc(nomeArea(e.area_id))}` : ''}</div>
      </div>
      <span aria-hidden="true" class="suave">›</span>
    </a>`;
}

async function telaCalendario(ctx) {
  if (!estado.visaoCal) estado.visaoCal = eAdmin() ? 'mes' : 'semana';
  if (!estado.seriesAbertas) estado.seriesAbertas = new Set();
  const semana = estado.visaoCal === 'semana';
  const hojeIso = isoLocal(new Date());
  let inicio, fim, ano, mes;
  if (semana) {
    if (!estado.semanaInicio) estado.semanaInicio = inicioSemana(new Date());
    inicio = isoLocal(estado.semanaInicio);
    fim = isoLocal(somaDias(estado.semanaInicio, 6));
  } else {
    ano = estado.mesAtual.getFullYear();
    mes = estado.mesAtual.getMonth();
    inicio = isoLocal(new Date(ano, mes, 1));
    fim = isoLocal(new Date(ano, mes + 1, 0));
  }
  await garantirOcorrencias(fim);
  if (ctx.velho()) return;
  const [rEv, rRe, rSer] = await Promise.all([
    db.from('eventos').select('*').gte('data', inicio).lte('data', fim).order('data').order('horario', { nullsFirst: false }),
    db.from('reunioes').select('*').gte('data', inicio).lte('data', fim).order('data').order('horario', { nullsFirst: false }),
    db.from('recorrencias').select('id, titulo, dias, horario, area_id'),
  ]);
  if (ctx.velho()) return;
  for (const r of [rEv, rRe, rSer]) if (r.error) throw r.error;

  const eventos = rEv.data || [];
  const reunioes = rRe.data || [];
  const series = new Map((rSer.data || []).map((s) => [s.id, s]));
  // Para o líder: datas em que a equipe dele marcou "sem escala"
  let semEscala = new Set();
  const minha = estado.lider.area_id;
  if (!eAdmin() && minha != null && eventos.length) {
    const { data } = await db.from('escalas_dispensadas').select('evento_id').eq('area_id', minha).in('evento_id', eventos.map((e) => e.id));
    if (ctx.velho()) return;
    semEscala = new Set((data || []).map((x) => x.evento_id));
  }
  const ehSemanal = (e) => e.recorrencia_id != null && series.has(e.recorrencia_id);
  const porDia = agrupar(eventos, (e) => e.data);
  const reuPorDia = agrupar(reunioes, (r) => r.data);
  // Mistura eventos e reuniões em ordem de data e horário (sem horário vai por último)
  const juntar = (evs, res) => [
    ...evs.map((e) => ({ k: 'e', data: e.data, horario: e.horario, reg: e })),
    ...res.map((r) => ({ k: 'r', data: r.data, horario: r.horario, reg: r })),
  ].sort(ordemHorario);
  const cartao = (x, modo) => (x.k === 'e' ? cartaoEvento(x.reg, modo, { semEscala: semEscala.has(x.reg.id) }) : cartaoReuniao(x.reg, modo));

  // Eventos semanais agrupados por série (cadastro), uma linha por série; ao abrir, as datas do período
  const secaoSemanais = (lista) => {
    const grupos = agrupar(lista.filter(ehSemanal), (e) => e.recorrencia_id);
    if (!grupos.size) return '';
    const ordem = [...grupos.keys()].sort((a, b) => {
      const pa = grupos.get(a)[0], pb = grupos.get(b)[0];
      const sa = series.get(a), sb = series.get(b);
      return ORDEM_SEMANA.indexOf(sa.dias?.[0] ?? deISO(pa.data).getDay()) - ORDEM_SEMANA.indexOf(sb.dias?.[0] ?? deISO(pb.data).getDay())
        || (sa.horario || '99').localeCompare(sb.horario || '99') || sa.titulo.localeCompare(sb.titulo);
    });
    const aberto = !!estado.semanaisAberto;
    return `<section class="secao card concluidos semanais ${aberto ? 'aberto' : ''}">
      <button type="button" class="concluidos-titulo" data-acao="alternar-semanais" aria-expanded="${aberto}" aria-controls="lista-semanais">
        <span class="status-dot recorrente" aria-hidden="true"></span>
        <span>Eventos semanais</span>
        <span class="contador">${grupos.size} ${grupos.size === 1 ? 'série' : 'séries'}</span>
        <span class="seta" aria-hidden="true">▾</span>
      </button>
      <div id="lista-semanais" ${aberto ? '' : 'hidden'}>
        ${ordem.map((id) => {
          const s = series.get(id);
          const datas = grupos.get(id).slice().sort(ordemHorario);
          const pend = datas.filter((e) => !e.concluido_em).length;
          const puladas = datas.filter((e) => semEscala.has(e.id)).length;
          const abertaSerie = estado.seriesAbertas.has(id);
          const resumo = [textoRecorrencia(s.dias, s.horario), s.area_id ? nomeArea(s.area_id) : null,
            `${datas.length} ${datas.length === 1 ? 'data' : 'datas'}${pend ? ` · ${pend} ${pend === 1 ? 'pendente' : 'pendentes'}` : ' · todas concluídas'}`,
            puladas ? `sem escala da sua equipe em ${puladas}` : null].filter(Boolean).map(esc).join(' · ');
          return `<div class="serie ${abertaSerie ? 'aberta' : ''}">
            <button type="button" class="serie-linha" data-acao="alternar-serie" data-serie="${id}" aria-expanded="${abertaSerie}" aria-controls="serie-${id}">
              <span class="cresce"><strong>${esc(s.titulo)}</strong><small>${resumo}</small></span>
              <span class="seta" aria-hidden="true">▾</span>
            </button>
            <div class="serie-datas" id="serie-${id}" ${abertaSerie ? '' : 'hidden'}>
              ${datas.map((e) => cartaoEvento(e, 'mes', { semEscala: semEscala.has(e.id), naSerie: true })).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>
    </section>`;
  };

  const legenda = `<div class="legenda-status suave pequeno">
      <span><span class="status-dot pendente"></span> pendente</span>
      <span><span class="status-dot concluido"></span> concluído</span>
      <span><span class="status-dot recorrente"></span> semanal</span>
      <span><span class="status-dot reuniao"></span> reunião</span></div>`;

  let titulo, corpo, dataNovo;
  if (semana) {
    titulo = tituloSemana(estado.semanaInicio);
    dataNovo = hojeIso >= inicio && hojeIso <= fim ? hojeIso : inicio;
    // Segunda a domingo; em cada dia, os eventos avulsos e as reuniões em ordem de horário.
    // Os eventos semanais ficam agrupados na seção "Eventos semanais", abaixo.
    corpo = `<div class="semana">${[0, 1, 2, 3, 4, 5, 6].map((i) => {
      const dt = somaDias(estado.semanaInicio, i);
      const iso = isoLocal(dt);
      const doDia = porDia.get(iso) || [];
      const itens = juntar(doDia.filter((e) => !ehSemanal(e)), reuPorDia.get(iso) || []);
      const nSemanais = doDia.filter(ehSemanal).length;
      return `<section class="dia-semana ${iso === hojeIso ? 'hoje' : ''}" aria-label="${esc(capital(dataLonga(iso)))}">
        <h2 class="dia-titulo"><span class="dia-nome">${DIAS_SEMANA_LONGO[dt.getDay()]}</span>
          <span class="dia-num">${dt.getDate()} de ${MESES[dt.getMonth()]}</span>${iso === hojeIso ? '<span class="selo">Hoje</span>' : ''}</h2>
        ${itens.map((x) => cartao(x, 'semana')).join('')}
        ${nSemanais ? `<p class="semanais-dia"><span class="status-dot recorrente" aria-hidden="true"></span> ${nSemanais} ${nSemanais === 1 ? 'evento semanal' : 'eventos semanais'} (em Eventos semanais, abaixo)</p>` : ''}
        ${!itens.length && !nSemanais ? '<p class="vazio-dia">Nada marcado.</p>' : ''}
      </section>`;
    }).join('')}</div>${legenda}${secaoSemanais(eventos)}`;
  } else {
    titulo = `${MESES[mes]} ${ano}`;
    if (estado.diaSelecionado && estado.diaSelecionado.slice(0, 7) !== inicio.slice(0, 7)) estado.diaSelecionado = null;
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    // Grade: vermelha = evento pendente; verde = todos concluídos; roxa = evento semanal; amarela = reunião
    let celulas = DIAS_SEMANA.map((d, i) => `<div class="cal-semana ${i === 0 || i === 6 ? 'fds' : ''}" aria-hidden="true">${d}</div>`).join('');
    for (let i = 0; i < primeiroDia; i++) celulas += '<span class="cal-dia fora" aria-hidden="true"></span>';
    for (let d = 1; d <= diasNoMes; d++) {
      const dt = new Date(ano, mes, d);
      const iso = isoLocal(dt);
      const evs = porDia.get(iso) || [];
      // vermelha = evento avulso pendente; verde = há evento realizado e nenhum avulso pendente
      // (vale também para datas semanais realizadas); roxa = data semanal ainda pendente
      const normais = evs.filter((e) => !ehSemanal(e));
      const pendentes = normais.filter((e) => !e.concluido_em).length;
      const semanaisPend = evs.filter((e) => ehSemanal(e) && !e.concluido_em).length;
      const reus = reuPorDia.get(iso) || [];
      const nReu = reus.filter((r) => !r.concluido_em).length; // reunião ainda não realizada: amarela
      const realizados = evs.filter((e) => e.concluido_em).length + reus.filter((r) => r.concluido_em).length;
      const dots = [];
      const rotulo = [];
      if (pendentes) {
        dots.push('pendente');
        rotulo.push(`${normais.length} evento(s), ${pendentes} pendente(s)`);
      } else if (realizados) {
        dots.push('concluido');
        rotulo.push(`${realizados} realizado(s)`);
      }
      if (semanaisPend) { dots.push('recorrente'); rotulo.push(`${semanaisPend} evento(s) semanal(is) pendente(s)`); }
      if (nReu) { dots.push('reuniao'); rotulo.push(`${nReu} reunião(ões)`); }
      const fds = dt.getDay() === 0 || dt.getDay() === 6;
      const classes = ['cal-dia', fds && 'fds', iso === hojeIso && 'hoje', iso === estado.diaSelecionado && 'selecionado'].filter(Boolean).join(' ');
      celulas += `<button type="button" class="${classes}" data-acao="dia" data-dia="${iso}"
        aria-label="${esc(dataLonga(iso))}${rotulo.length ? ', ' + esc(rotulo.join(', ')) : ''}" aria-pressed="${iso === estado.diaSelecionado}">
        <span class="cal-num">${d}</span><span class="cal-dots" aria-hidden="true">${dots.map((s) => `<span class="status-dot ${s}"></span>`).join('')}</span></button>`;
    }
    const resto = (primeiroDia + diasNoMes) % 7;
    if (resto) for (let i = resto; i < 7; i++) celulas += '<span class="cal-dia fora" aria-hidden="true"></span>';

    // Dia selecionado: tudo daquele dia (inclusive as datas dos eventos semanais).
    // Mês inteiro: avulsos e reuniões na lista; eventos semanais agrupados por série.
    const sel = estado.diaSelecionado;
    const evsLista = sel ? (porDia.get(sel) || []) : eventos.filter((e) => !ehSemanal(e));
    const resLista = (sel ? (reuPorDia.get(sel) || []) : reunioes.filter((r) => r.data >= hojeIso)).filter((r) => !r.concluido_em);
    const pendentes = juntar(evsLista.filter((e) => !e.concluido_em), resLista);
    const concluidos = (sel ? (porDia.get(sel) || []) : eventos).filter((e) => e.concluido_em);
    const reunioesRealizadas = (sel ? (reuPorDia.get(sel) || []) : reunioes).filter((r) => r.concluido_em);
    dataNovo = sel || (hojeIso.slice(0, 7) === inicio.slice(0, 7) ? hojeIso : inicio);
    const aberto = !!estado.concluidosAbertos;
    const itemConcluido = (e) => `
      <div class="concluido-item">
        <a class="concluido-linha" href="#/evento/${e.id}">
          <span class="status-dot concluido" aria-label="Concluído"></span>
          <span class="concluido-data">${esc(e.data.slice(8))}/${esc(e.data.slice(5, 7))}</span>
          <span class="concluido-hora">${esc(hora(e.horario) || '—')}</span>
          <span class="concluido-nome">${esc(e.titulo)}${ehSemanal(e) ? ' <span class="status-dot recorrente" title="Evento semanal" aria-label="Evento semanal"></span>' : ''}</span>
        </a>
        ${eAdmin() ? `<div class="menu-concluido">
          <button type="button" class="btn-icone" data-acao="menu-concluido" aria-haspopup="menu" aria-expanded="false" aria-label="Opções de ${esc(e.titulo)} (${esc(e.data.slice(8))}/${esc(e.data.slice(5, 7))})">⋯</button>
          <div class="menu-acoes" role="menu" hidden>
            <button type="button" role="menuitem" data-acao="reabrir" data-id="${e.id}">Reabrir evento</button>
          </div>
        </div>` : ''}
      </div>`;
    const itemReuniaoRealizada = (r) => `
      <div class="concluido-item">
        <a class="concluido-linha" href="#/reuniao/${r.id}">
          <span class="status-dot concluido" aria-label="Realizada"></span>
          <span class="concluido-data">${esc(r.data.slice(8))}/${esc(r.data.slice(5, 7))}</span>
          <span class="concluido-hora">${esc(hora(r.horario) || '—')}</span>
          <span class="concluido-nome">${esc(r.titulo)} <span class="status-dot reuniao" title="Reunião" aria-label="Reunião"></span></span>
        </a>
        ${eAdmin() ? `<div class="menu-concluido">
          <button type="button" class="btn-icone" data-acao="menu-concluido" aria-haspopup="menu" aria-expanded="false" aria-label="Opções de ${esc(r.titulo)}">⋯</button>
          <div class="menu-acoes" role="menu" hidden>
            <button type="button" role="menuitem" data-acao="reabrir-reuniao" data-id="${r.id}">Reabrir reunião</button>
          </div>
        </div>` : ''}
      </div>`;
    corpo = `
      <div class="calendario">${celulas}</div>
      ${legenda}
      <div class="secao" id="lista-dia">
        <div class="secao-topo">
          <h2>${esc(sel ? capital(dataLonga(sel)) : 'Próximos eventos')}</h2>
          ${sel ? '<button class="btn-texto" type="button" data-acao="limpar-dia">Ver mês</button>' : ''}
        </div>
        <div id="lista-eventos">${pendentes.length ? pendentes.map((x) => cartao(x, 'mes')).join('')
          : `<p class="vazio">${sel ? 'Nada pendente neste dia.' : 'Nada pendente neste mês fora dos eventos semanais.'}</p>`}</div>
      </div>
      ${sel ? '' : secaoSemanais(eventos)}
      <section class="secao card concluidos ${aberto ? 'aberto' : ''}">
        <button type="button" class="concluidos-titulo" data-acao="alternar-concluidos" aria-expanded="${aberto}" aria-controls="lista-concluidos">
          <span>Concluídos ${sel ? 'neste dia' : 'neste mês'}</span>
          <span class="contador">${concluidos.length + reunioesRealizadas.length}</span>
          <span class="seta" aria-hidden="true">▾</span>
        </button>
        <div id="lista-concluidos" ${aberto ? '' : 'hidden'}>
          ${concluidos.length || reunioesRealizadas.length
            ? [...concluidos.map(itemConcluido), ...reunioesRealizadas.map(itemReuniaoRealizada)].join('')
            : `<p class="vazio">${sel ? 'Nada concluído neste dia.' : 'Nada concluído neste mês.'}</p>`}
        </div>
      </section>`;
  }

  mostrar(ctx, `
    <div class="cal-cabecalho">
      <div class="cal-topo">
        <div class="segmentado" role="tablist" aria-label="Visão do calendário">
          <button type="button" role="tab" data-acao="visao" data-visao="semana" aria-selected="${semana}" class="${semana ? 'ativa' : ''}">Semana</button>
          <button type="button" role="tab" data-acao="visao" data-visao="mes" aria-selected="${!semana}" class="${!semana ? 'ativa' : ''}">Mês</button>
        </div>
        ${eAdmin() ? `<div class="acoes-cal">
          <button class="btn peq secundario" type="button" data-acao="importar-eventos">Importar eventos</button>
          <button class="btn peq" type="button" data-acao="novo-evento">+ Evento</button>
        </div>` : ''}
      </div>
      <div class="mes-nav">
        <button class="btn-icone" type="button" data-acao="nav" data-delta="-1" aria-label="${semana ? 'Semana anterior' : 'Mês anterior'}">‹</button>
        <h1 class="${semana ? 'titulo-semana' : ''}">${esc(titulo)}</h1>
        <button class="btn-icone" type="button" data-acao="nav" data-delta="1" aria-label="${semana ? 'Próxima semana' : 'Próximo mês'}">›</button>
      </div>
    </div>
    ${corpo}`);

  const alternar = (b, painel, aberto) => {
    painel.hidden = !aberto;
    b.setAttribute('aria-expanded', String(aberto));
    if (aberto) anima(painel, { opacity: [0, 1], y: [-4, 0] }, { duration: 0.22 });
  };

  const fecharMenus = () => app.querySelectorAll('.menu-acoes:not([hidden])').forEach((m) => {
    m.hidden = true;
    m.previousElementSibling.setAttribute('aria-expanded', 'false');
  });

  app.onclick = async (e) => {
    if (!e.target.closest('.menu-concluido')) fecharMenus();
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao;
    if (acao === 'menu-concluido') {
      const menu = b.nextElementSibling;
      const abrir = menu.hidden;
      fecharMenus();
      menu.hidden = !abrir;
      b.setAttribute('aria-expanded', String(abrir));
      if (abrir) { anima(menu, { opacity: [0, 1], y: [-4, 0] }, { duration: 0.16 }); $('button', menu).focus(); }
    } else if (acao === 'reabrir-reuniao') {
      fecharMenus();
      if (!eAdmin()) return;
      if (!(await confirmar('Voltar esta reunião para as próximas?', 'Reabrir', 'btn'))) return;
      try {
        await gravar('reunioes', { concluido_em: null, concluido_por: null }, Number(b.dataset.id));
        aviso('Reunião reaberta ✓');
        roteador(true);
      } catch (err) {
        aviso(traduzErro(err), true);
      }
    } else if (acao === 'reabrir') {
      // Só o admin: volta só esta data para os pendentes; escala, músicas, programa e materiais ficam
      fecharMenus();
      const ev = eventos.find((x) => x.id === Number(b.dataset.id));
      if (!ev || !eAdmin()) return;
      if (!(await confirmar('Voltar este evento para os pendentes?', 'Reabrir', 'btn'))) return;
      try {
        await gravar('eventos', { concluido_em: null, concluido_por: null }, ev.id);
        aviso('Evento reaberto ✓');
        roteador(true);
      } catch (err) {
        aviso(traduzErro(err), true);
      }
    } else if (acao === 'visao') {
      const nova = b.dataset.visao;
      if (nova === estado.visaoCal) return;
      if (nova === 'semana') {
        const ref = estado.diaSelecionado ? deISO(estado.diaSelecionado)
          : (hojeIso.slice(0, 7) === inicio.slice(0, 7) ? new Date() : deISO(inicio));
        estado.semanaInicio = inicioSemana(ref);
      } else {
        const meio = somaDias(estado.semanaInicio, 3); // o mês que tem mais dias desta semana
        estado.mesAtual = new Date(meio.getFullYear(), meio.getMonth(), 1);
        estado.diaSelecionado = null;
      }
      estado.visaoCal = nova;
      roteador();
    } else if (acao === 'nav') {
      const delta = Number(b.dataset.delta);
      if (semana) estado.semanaInicio = somaDias(estado.semanaInicio, 7 * delta);
      else { estado.mesAtual = new Date(ano, mes + delta, 1); estado.diaSelecionado = null; }
      roteador();
    } else if (acao === 'dia' || acao === 'limpar-dia') {
      // Tocar num dia mostra logo abaixo os eventos daquela data (inclusive os semanais)
      estado.diaSelecionado = acao === 'dia' ? b.dataset.dia : null;
      roteador(true).then(() => {
        const alvo = $('#lista-dia');
        entrarCards($('#lista-eventos') || app);
        if (alvo && acao === 'dia') alvo.scrollIntoView({ block: 'nearest', behavior: menosMovimento.matches ? 'auto' : 'smooth' });
      });
    } else if (acao === 'alternar-concluidos') {
      estado.concluidosAbertos = !estado.concluidosAbertos;
      alternar(b, $('#lista-concluidos'), estado.concluidosAbertos);
      b.closest('.concluidos').classList.toggle('aberto', estado.concluidosAbertos);
    } else if (acao === 'alternar-semanais') {
      estado.semanaisAberto = !estado.semanaisAberto;
      alternar(b, $('#lista-semanais'), estado.semanaisAberto);
      b.closest('.semanais').classList.toggle('aberto', estado.semanaisAberto);
    } else if (acao === 'alternar-serie') {
      const id = Number(b.dataset.serie);
      const abrir = !estado.seriesAbertas.has(id);
      if (abrir) estado.seriesAbertas.add(id); else estado.seriesAbertas.delete(id);
      alternar(b, $(`#serie-${id}`), abrir);
      b.closest('.serie').classList.toggle('aberta', abrir);
    } else if (acao === 'concluir') {
      // Só o admin: a bolinha é um botão separado do cartão
      e.preventDefault();
      const ev = eventos.find((x) => x.id === Number(b.dataset.id));
      if (!ev || !eAdmin()) return;
      if (!(await confirmar('Marcar este evento como concluído?', 'Concluir', 'btn'))) return;
      try {
        await gravar('eventos', { concluido_em: new Date().toISOString(), concluido_por: estado.lider.id }, ev.id);
        aviso('Evento concluído ✓');
        roteador(true);
      } catch (err) {
        aviso(traduzErro(err), true);
      }
    } else if (acao === 'novo-evento') {
      if (eAdmin()) abrirFormEvento(null, dataNovo);
    } else if (acao === 'importar-eventos') {
      if (eAdmin()) abrirImportacaoEventos();
    }
  };
}

// Eventos oficiais: só o admin cria, edita e apaga (a RLS no Supabase garante o mesmo).
// No + Evento: tipo Reunião grava na tabela de reuniões (mesmo fluxo da aba Reuniões)
// e "Repetir toda semana" cria um evento semanal (cada data vira um evento próprio).
function abrirFormEvento(ev, dataPadrao, rec) {
  if (!eAdmin()) return;
  const novo = !ev;
  const tipos = Object.entries(NOMES_TIPO_EVENTO).filter(([k]) => novo || k !== 'reuniao' || ev.tipo === 'reuniao');
  const campos = [
    { nome: 'titulo', rotulo: 'Título', obrigatorio: true, placeholder: 'Ex.: Culto de domingo' },
    { nome: 'data', rotulo: 'Data', tipo: 'date', obrigatorio: true },
    { nome: 'horario', rotulo: 'Horário', tipo: 'time' },
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', obrigatorio: true, opcoes: tipos },
    { nome: 'area_id', rotulo: 'Ministério responsável', tipo: 'select', numero: true, opcoes: opcoesAreas(), vazio: 'Geral (toda a igreja)' },
    ...(novo ? [{ nome: 'local', rotulo: 'Local (opcional)', placeholder: 'Ex.: Salão da igreja' }] : []),
    { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea', linhas: 3 },
    ...(novo ? [{ nome: 'repetir', rotulo: 'Repetir toda semana', tipo: 'checkbox' }] : []),
  ];
  const semanal = !!ev?.recorrencia_id;
  const d = abrirFormulario({
    titulo: ev ? 'Editar evento' : 'Novo evento',
    ajuda: semanal ? `Faz parte de um evento semanal${rec ? ` (${textoRecorrencia(rec.dias, rec.horario)})` : ''}. Ao salvar ou excluir, você escolhe se vale só para este evento ou para este e os próximos.` : '',
    campos,
    valores: ev ? { ...ev, horario: hora(ev.horario) } : { data: dataPadrao, tipo: 'culto', area_id: '', repetir: false },
    aoSalvar: async (dados) => {
      const { local, repetir, ...base } = dados;
      // Reunião: vai para a tabela de reuniões (aparece no calendário e na aba Reuniões, sem duplicar)
      if (novo && base.tipo === 'reuniao') {
        const salvo = await gravar('reunioes', { titulo: base.titulo, data: base.data, horario: base.horario, local: local ?? null, pauta: base.observacoes });
        location.hash = `#/reuniao/${salvo.id}`;
        return;
      }
      // Repetir toda semana: cria a série; a primeira data é a escolhida
      if (novo && repetir) {
        if (base.data < isoLocal(new Date())) throw new Error('Para repetir toda semana, escolha hoje ou uma data futura.');
        const serie = await gravar('recorrencias', {
          titulo: base.titulo, tipo: base.tipo, dias: [deISO(base.data).getDay()], horario: base.horario,
          area_id: base.area_id, observacoes: base.observacoes, ativa: true, inicio: base.data,
        });
        const { error } = await db.rpc('aplicar_recorrencia', { p_id: serie.id });
        if (error) throw error;
        estado.geradoAte = null;
        const { data: primeira } = await db.from('eventos').select('id').eq('recorrencia_id', serie.id).order('data').limit(1);
        location.hash = primeira?.length ? `#/evento/${primeira[0].id}` : '#/calendario';
        return;
      }
      // Ocorrência de evento semanal: só este ou este e os próximos
      if (semanal) {
        const escopo = await escolherEscopo('Salvar alteração', 'Este evento se repete toda semana. A alteração vale para:', 'Salvar', 'btn', {
          este: 'As outras datas continuam como estão.',
          proximos: 'Vale para esta data e as próximas. As anteriores e as concluídas não mudam.',
        });
        if (!escopo) throw new Error('Nada foi salvo. Escolha uma opção para salvar.');
        if (escopo === 'proximos') {
          const { error } = await db.rpc('editar_serie', {
            p_evento: ev.id, p_titulo: base.titulo, p_data: base.data, p_horario: base.horario,
            p_tipo: base.tipo, p_area_id: base.area_id, p_observacoes: base.observacoes,
          });
          if (error) throw error;
          estado.geradoAte = null;
        } else {
          const { error } = await db.rpc('marcar_avulso', { p_evento: ev.id });
          if (error) throw error;
          await gravar('eventos', base, ev.id);
        }
        roteador(true);
        return;
      }
      const salvo = await gravar('eventos', base, ev?.id);
      if (!ev) location.hash = `#/evento/${salvo.id}`;
      else roteador(true);
    },
    aoExcluir: ev ? async () => {
      if (semanal) {
        const escopo = await escolherEscopo('Excluir evento', 'Este evento se repete toda semana. Excluir:', 'Excluir', 'btn perigo', {
          este: 'Só esta data sai do calendário. As outras continuam.',
          proximos: 'Esta data e as próximas saem, com escalas, músicas e materiais. As anteriores e as concluídas ficam.',
        });
        if (!escopo) return false;
        let ids = [ev.id];
        if (escopo === 'proximos') {
          const { data } = await db.from('eventos').select('id').eq('recorrencia_id', ev.recorrencia_id).gte('data', ev.data).is('concluido_em', null);
          ids = (data || []).map((x) => x.id);
        }
        await removerArquivosEventos(ids);
        const { error } = escopo === 'proximos'
          ? await db.rpc('encerrar_serie', { p_evento: ev.id })
          : await db.rpc('excluir_ocorrencia', { p_evento: ev.id });
        if (error) throw error;
        estado.geradoAte = null;
      } else {
        await removerArquivosEventos([ev.id]);
        await apagar('eventos', { id: ev.id });
      }
      location.hash = '#/calendario';
    } : null,
    // Evento semanal: a pergunta "Só este / Este e os próximos" já serve de confirmação
    confirmarExcluir: semanal ? null : 'Excluir este evento? O programa, as músicas, as escalas e os materiais dele também serão apagados.',
  });
  if (novo) ligarFormEventoNovo(d);
}

/* ---------------------------------------------------------------------
   Tela: detalhe do evento
   --------------------------------------------------------------------- */
async function telaEvento(id, ctx) {
  const [rEv, rItens, rMus, rEsc, rMat, rDis] = await Promise.all([
    db.from('eventos').select('*').eq('id', id).maybeSingle(),
    db.from('itens_programa').select('*').eq('evento_id', id).order('ordem').order('horario', { nullsFirst: true }).order('id'),
    db.from('musicas').select('*').eq('evento_id', id).order('ordem').order('id'),
    db.from('escalas').select('*').eq('evento_id', id).order('id'),
    db.from('materiais').select('*').eq('evento_id', id).order('criado_em'),
    db.from('escalas_dispensadas').select('*').eq('evento_id', id),
  ]);
  if (ctx.velho()) return;
  for (const r of [rEv, rItens, rMus, rEsc, rMat, rDis]) if (r.error) throw r.error;

  const ev = rEv.data;
  if (!ev) {
    mostrar(ctx, '<div class="card"><p>Evento não encontrado.</p><a href="#/calendario">← Voltar ao calendário</a></div>');
    return;
  }
  let rec = null;
  if (ev.recorrencia_id) {
    const rRec = await db.from('recorrencias').select('*').eq('id', ev.recorrencia_id).maybeSingle();
    if (ctx.velho()) return;
    rec = rRec.data;
  }
  const itens = rItens.data || [];
  const musicas = rMus.data || [];
  const escalas = rEsc.data || [];
  const materiais = rMat.data || [];
  const semEscala = new Set((rDis.data || []).map((x) => x.area_id)); // ministérios que marcaram "sem escala" nesta data
  const minha = estado.lider.area_id;
  const podeMusicas = eAdmin() || ehLouvor(minha);
  const podeEnviarMaterial = eAdmin() || minha != null;

  // Aniversariantes do mês (só admin, em eventos como "Culto dos Aniversariantes")
  let aniversariantes = null;
  const mesEvento = Number(ev.data.slice(5, 7)) - 1;
  if (eAdmin() && semAcento(ev.titulo).includes('aniversariant')) {
    aniversariantes = await buscarAniversariantes(mesEvento);
    if (ctx.velho()) return;
  }

  // Escalas por ministério; a equipe do líder aparece primeiro
  const grupos = agrupar(escalas, (e) => e.area_id);
  const areasMostrar = [...new Set([...grupos.keys(), ...semEscala])];
  if (!eAdmin() && minha != null && !areasMostrar.includes(minha)) areasMostrar.push(minha);
  areasMostrar.sort((a, b) => (b === minha) - (a === minha) || nomeArea(a).localeCompare(nomeArea(b)));
  const blocoEscala = (areaId) => {
    const lista = grupos.get(areaId) || [];
    return `<div class="bloco-escala">
      <div class="linha-entre">
        <h3 style="margin:0">${esc(nomeArea(areaId))}${areaId === minha && !eAdmin() ? ' <span class="suave pequeno">· sua equipe</span>' : ''}</h3>
        ${podeEditar(areaId) && !semEscala.has(areaId) ? `<button class="btn peq secundario" type="button" data-acao="escala" data-area="${areaId}">${lista.length ? 'Editar escala' : 'Adicionar escala'}</button>` : ''}
      </div>
      ${lista.length ? `<ul class="lista">${lista.map((e) => `<li><span class="cresce"><strong>${esc(e.funcao)}</strong> — ${esc(e.nome)}</span></li>`).join('')}</ul>`
        : semEscala.has(areaId)
          ? `<div class="sem-escala-linha"><span class="sem-escala-texto">✓ Sem escala necessária</span>${podeEditar(areaId) ? `<button class="btn-texto" type="button" data-acao="desfazer-pulo" data-area="${areaId}">Desfazer</button>` : ''}</div>`
          : `<div class="sem-escala-linha"><p class="vazio">Ninguém escalado ainda.</p>${podeEditar(areaId) ? `<button class="btn-texto" type="button" data-acao="pular" data-area="${areaId}">Pular escala desta data</button>` : ''}</div>`}
    </div>`;
  };

  const htmlMusicas = musicas.length ? `<ol class="lista lista-musicas">${musicas.map((m, i) => {
    const link = linkSeguro(m.link);
    const pode = podeEditar(m.area_id) && podeMusicas;
    return `<li><span class="ordem">${i + 1}</span>
        <div class="cresce"><div><strong>${esc(m.titulo)}</strong></div>
          ${link ? `<a class="pequeno" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Abrir link ↗</a>` : ''}</div>
        ${pode ? `<span class="botoes-ordem">
          <button class="btn-icone" type="button" data-acao="subir" data-id="${m.id}" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-icone" type="button" data-acao="descer" data-id="${m.id}" aria-label="Descer" ${i === musicas.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn-icone" type="button" data-acao="editar" data-tabela="musicas" data-id="${m.id}" aria-label="Editar">✎</button></span>` : ''}</li>`;
  }).join('')}</ol>` : '<p class="vazio">Nenhuma música ainda.</p>';

  const htmlItens = itens.length ? `<ul class="lista">${itens.map((it, i) => `
      <li><span class="ordem">${i + 1}</span>
        <div class="cresce"><div>${it.horario ? `<span class="hora-prevista" title="Horário previsto">${esc(hora(it.horario))}<small>previsto</small></span> — ` : ''}${esc(it.titulo)}</div>
          <div class="linha"><span class="selo">${esc(NOMES_TIPO_ITEM[it.tipo] || it.tipo)}</span><span class="selo cinza">${esc(nomeArea(it.area_id))}</span>${it.lembrete === 'aniversariantes' ? '<span class="selo lembrete">Lembrete do último domingo</span>' : ''}</div></div>
        ${podeEditar(it.area_id) ? `<button class="btn-icone" type="button" data-acao="editar" data-tabela="itens_programa" data-id="${it.id}" aria-label="Editar">✎</button>` : ''}</li>`).join('')}</ul>`
    : '<p class="vazio">Nada no programa ainda.</p>';

  // Resumo do evento (ADM): situação da escala de cada ministério, repertório e materiais
  const resumoHTML = eAdmin() ? (() => {
    const rotulos = { pronta: 'Escala pronta', pendente: 'Pendente', sem: 'Sem escala necessária' };
    const classes = { pronta: 'vou', pendente: 'lembrete', sem: 'cinza' };
    const linhas = estado.areas.map((a) => {
      const n = (grupos.get(a.id) || []).length;
      return { a, n, st: n ? 'pronta' : semEscala.has(a.id) ? 'sem' : 'pendente' };
    });
    const conta = (st) => linhas.filter((l) => l.st === st).length;
    const nomesMus = musicas.slice(0, 3).map((m) => m.titulo).join(', ') + (musicas.length > 3 ? '…' : '');
    return `<section class="secao card resumo-evento" aria-label="Resumo do evento">
      <div class="secao-topo"><h2>Resumo do evento</h2><span class="suave pequeno">visível só para o ADM</span></div>
      <p class="resumo-contagem suave pequeno">${conta('pronta')} com escala pronta · ${conta('pendente')} pendentes · ${conta('sem')} sem escala necessária</p>
      <ul class="resumo-ministerios">${linhas.map((l) => `
        <li class="st-${l.st}"><span class="resumo-nome">${esc(l.a.nome)}</span>
          <span class="selo ${classes[l.st]}">${rotulos[l.st]}${l.n ? ` · ${l.n}` : ''}</span></li>`).join('')}</ul>
      <div class="resumo-bloco">
        <h3>Repertório</h3>
        <p>${musicas.length
          ? `<span class="selo vou">Adicionado</span> ${musicas.length} ${musicas.length === 1 ? 'música' : 'músicas'}: ${esc(nomesMus)}`
          : '<span class="selo lembrete">Pendente</span> O Louvor ainda não adicionou o repertório.'}</p>
      </div>
      <div class="resumo-bloco">
        <h3>Materiais para o Audiovisual</h3>
        ${materiais.length ? `<ul class="resumo-materiais">${materiais.map((m) => `
          <li><strong>${esc(m.nome)}</strong> <span class="suave pequeno">· ${m.tipo === 'link' ? 'link' : 'arquivo'} · ${esc(nomeArea(m.area_id))}${m.quando_usar ? ` · ${esc(m.quando_usar)}` : ''}</span></li>`).join('')}</ul>`
          : '<p class="suave">Nenhum material enviado.</p>'}
      </div>
    </section>`;
  })() : '';

  mostrar(ctx, `
    <a class="btn-texto" href="#/calendario" style="padding-left:0">← Calendário</a>
    <div class="card">
      <div class="linha-entre">
        <h1 style="margin:0">${esc(ev.titulo)}</h1>
        ${eAdmin() ? '<button class="btn-icone" type="button" data-acao="editar-evento" aria-label="Editar ou apagar evento">✎</button>' : ''}
      </div>
      ${ev.concluido_em ? '<span class="selo concluido-selo"><span class="status-dot concluido"></span> Concluído</span>' : ''}${ev.recorrencia_id ? `<span class="selo semanal"><span class="status-dot recorrente"></span>Semanal${rec && !ev.avulso ? ` · ${esc(textoRecorrencia(rec.dias, rec.horario))}` : ''}</span>` : ''}
      <p class="suave" style="margin:.3rem 0">${esc(capital(dataLonga(ev.data)))}${ev.horario ? ` · ${esc(hora(ev.horario))}` : ''} · ${esc(NOMES_TIPO_EVENTO[ev.tipo] || ev.tipo)}${ev.area_id ? ` · ${esc(nomeArea(ev.area_id))}` : ''}</p>
      ${ev.observacoes ? `<p class="texto-nota">${esc(ev.observacoes)}</p>` : ''}
      <div class="linha" style="margin-top:.75rem">
        <a class="btn peq" href="#/telao/${ev.id}">${ICONES.telao} Telão</a>
        <button class="btn peq secundario" type="button" data-acao="whatsapp">${ICONES.conversa} Escala p/ WhatsApp</button>
        ${eAdmin() ? (ev.concluido_em
          ? '<button class="btn peq secundario" type="button" data-acao="reabrir-evento">Reabrir evento</button>'
          : '<button class="btn peq secundario btn-realizado" type="button" data-acao="concluir-evento"><span class="status-dot concluido" aria-hidden="true"></span> Marcar como realizado</button>') : ''}
      </div>
    </div>
    ${resumoHTML}
    <section class="secao card">
      <div class="secao-topo"><h2>Escala</h2>${eAdmin() ? '<button class="btn peq" type="button" data-acao="escala-escolher">Adicionar escala</button>' : ''}</div>
      ${areasMostrar.length ? areasMostrar.map(blocoEscala).join('') : '<p class="vazio">Nenhuma escala ainda.</p>'}
    </section>
    ${htmlMateriais(materiais, podeEnviarMaterial)}
    ${musicas.length || podeMusicas ? `<section class="secao card">
      <div class="secao-topo"><h2>Músicas do evento</h2>${podeMusicas ? '<button class="btn peq secundario" type="button" data-acao="nova-musica">+ Música</button>' : ''}</div>
      ${!podeMusicas && musicas.length ? '<p class="suave pequeno" style="margin-top:0">Na ordem definida pelo Louvor.</p>' : ''}
      ${htmlMusicas}
    </section>` : ''}
    <section class="secao card">
      <div class="secao-topo"><h2>Programa</h2><button class="btn peq secundario" type="button" data-acao="novo" data-tabela="itens_programa">+ Item</button></div>
      ${htmlItens}
    </section>
    ${aniversariantes ? blocoAniversariantes(aniversariantes, mesEvento) : ''}`);

  ligarFormMaterial(ev);

  const listas = { itens_programa: itens, musicas, escalas };
  app.onclick = async (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b || b.disabled) return;
    const acao = b.dataset.acao;
    if (acao === 'editar-evento') abrirFormEvento(ev, null, rec);
    else if (acao === 'whatsapp') abrirWhatsApp(ev, escalas, musicas, [...semEscala]);
    else if (acao === 'pular') pularEscala(ev.id, Number(b.dataset.area));
    else if (acao === 'desfazer-pulo') desfazerPulo(ev.id, Number(b.dataset.area));
    else if (acao === 'escala') {
      const areaId = Number(b.dataset.area);
      abrirEditorEscala(ev, areaId, grupos.get(areaId) || [], () => roteador(true));
    } else if (acao === 'escala-escolher') {
      escolherMinisterio((areaId) => abrirEditorEscala(ev, areaId, grupos.get(areaId) || [], () => roteador(true)));
    } else if (acao === 'abrir-material') {
      const form = $('#form-material');
      form.hidden = !form.hidden;
      if (!form.hidden) { anima(form, { opacity: [0, 1], y: [-6, 0] }, { duration: 0.22 }); $('input[name=nome]', form)?.focus(); }
    } else if (acao === 'baixar-material') {
      const m = materiais.find((x) => x.id === Number(b.dataset.id));
      if (m) baixarMaterial(m, b);
    } else if (acao === 'apagar-material') {
      const m = materiais.find((x) => x.id === Number(b.dataset.id));
      if (m && await confirmar(`Apagar o material "${m.nome}"?`, 'Apagar')) {
        try { await apagarMaterial(m); aviso('Material apagado'); roteador(true); } catch (err) { aviso(traduzErro(err), true); }
      }
    } else if (acao === 'nova-musica') {
      abrirFormItem('musicas', null, ev, listas, eAdmin() ? { areaSugerida: idLouvor() } : {});
    } else if (acao === 'subir' || acao === 'descer') {
      b.disabled = true;
      try { await moverMusica(musicas, Number(b.dataset.id), acao === 'subir' ? -1 : 1); }
      catch (err) { aviso(traduzErro(err), true); }
      roteador(true);
    } else if (acao === 'novo') abrirFormItem(b.dataset.tabela, null, ev, listas);
    else if (acao === 'editar') {
      const reg = listas[b.dataset.tabela].find((r) => r.id === Number(b.dataset.id));
      if (reg) abrirFormItem(b.dataset.tabela, reg, ev, listas);
    } else if (acao === 'concluir-evento' || acao === 'reabrir-evento') {
      // Só o admin: evento realizado (bolinha verde no calendário) ou de volta para os pendentes.
      // Escalas, músicas, programa e materiais ficam como estão.
      if (!eAdmin()) return;
      const concluir = acao === 'concluir-evento';
      if (!(await confirmar(concluir ? 'Marcar este evento como realizado?' : 'Voltar este evento para os pendentes?', concluir ? 'Marcar como realizado' : 'Reabrir', 'btn'))) return;
      try {
        await gravar('eventos', concluir ? { concluido_em: new Date().toISOString(), concluido_por: estado.lider.id } : { concluido_em: null, concluido_por: null }, ev.id);
        aviso(concluir ? 'Evento realizado ✓' : 'Evento reaberto ✓');
        roteador(true);
      } catch (err) {
        aviso(traduzErro(err), true);
      }
    } else if (acao === 'copiar-aniv') {
      copiarTexto(textoAniversariantes(aniversariantes, mesEvento), 'Lista copiada ✓');
    }
  };
}

function abrirFormItem(tabela, reg, ev, listas, opcoes = {}) {
  const campoArea = eAdmin() && opcoes.area == null
    ? { nome: 'area_id', rotulo: 'Equipe', tipo: 'select', obrigatorio: true, numero: true, opcoes: opcoesAreas() }
    : { nome: 'area_id', tipo: 'hidden', numero: true };
  const lista = listas[tabela];
  const proxOrdem = lista.reduce((max, r) => Math.max(max, r.ordem || 0), 0) + 1;
  const campoOrdem = { nome: 'ordem', rotulo: 'Ordem', tipo: 'number', converter: (v) => v ?? 0, ajuda: 'Posição na lista (1, 2, 3…)' };

  const areaPadrao = reg?.area_id ?? opcoes.area ?? opcoes.areaSugerida ?? estado.lider.area_id ?? '';
  const config = {
    itens_programa: {
      titulo: reg ? 'Editar item do programa' : 'Novo item do programa',
      campos: [
        campoArea,
        { nome: 'titulo', rotulo: 'Nome do item', obrigatorio: true, placeholder: 'Ex.: Dança, após o Louvor' },
        { nome: 'horario', rotulo: 'Horário estimado (opcional)', tipo: 'time', ajuda: 'É uma previsão. Aparece ao lado do item, ex.: 19:35 — Dança.' },
        { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', obrigatorio: true, opcoes: Object.entries(NOMES_TIPO_ITEM) },
        campoOrdem,
      ],
      padrao: { tipo: tipoPadraoDaArea(areaPadrao) },
    },
    musicas: {
      titulo: reg ? 'Editar música' : 'Nova música',
      campos: [
        campoArea,
        { nome: 'titulo', rotulo: 'Música', obrigatorio: true },
        {
          nome: 'link', rotulo: 'Link (opcional)', tipo: 'url', placeholder: 'https://…', ajuda: 'Cifra, YouTube ou Spotify',
          converter: (v) => (v && !/^https?:\/\//i.test(v) ? 'https://' + v : v),
        },
        campoOrdem,
      ],
      padrao: {},
    },
    escalas: {
      titulo: reg ? 'Editar escala' : `Adicionar escala${areaPadrao !== '' && !campoArea.rotulo ? ' · ' + nomeArea(areaPadrao) : ''}`,
      campos: [
        campoArea,
        { nome: 'funcao', rotulo: 'Função', obrigatorio: true, lista: [...new Set([...listas.escalas.map((e) => e.funcao), ...FUNCOES_SUGERIDAS])] },
        {
          // Texto livre: o líder digita o nome, sem escolher do cadastro de Membros
          nome: 'nome', rotulo: 'Quem vai servir', obrigatorio: true, placeholder: 'Ex.: Davi', autocomplete: 'off',
          lista: [...new Set(listas.escalas.map((e) => e.nome))],
        },
      ],
      padrao: {},
    },
  }[tabela];

  const depois = opcoes.depois || (() => roteador(true));
  let ultimaArea = null;
  abrirFormulario({
    titulo: config.titulo,
    campos: config.campos,
    valores: reg ? { ...reg, horario: hora(reg.horario) } : { ...config.padrao, ordem: proxOrdem, area_id: areaPadrao },
    aoSalvar: async (dados) => {
      const salvo = await gravar(tabela, reg ? dados : { ...dados, evento_id: ev.id }, reg?.id);
      if (!reg) lista.push(salvo); // para sugestões e ordem do próximo
      ultimaArea = dados.area_id;
      depois();
    },
    // Na escala nova: "Salvar e adicionar outro" reabre o formulário para a próxima pessoa
    aoSalvarMais: !reg && tabela === 'escalas' ? () => abrirFormItem(tabela, null, ev, listas, { ...opcoes, areaSugerida: ultimaArea }) : null,
    aoExcluir: reg && podeEditar(reg.area_id) ? async () => {
      await apagar(tabela, { id: reg.id });
      depois();
    } : null,
  });
}

function tipoPadraoDaArea(areaId) {
  const n = semAcento(nomeArea(areaId));
  if (n.includes('danca')) return 'danca';
  if (n.includes('teatro')) return 'teatro';
  if (n.includes('louvor')) return 'musica';
  return 'aviso';
}

function textoWhatsApp(ev, escalas, musicas, semEscala = []) {
  const l = [`*${ev.titulo}*`, `${capital(dataLonga(ev.data))}${ev.horario ? ' · ' + hora(ev.horario) : ''}`, ''];
  const grupos = agrupar(escalas, (e) => e.area_id);
  const pulados = semEscala.filter((a) => !grupos.has(a));
  if (escalas.length || pulados.length) {
    l.push('*Escala*');
    for (const [areaId, lista] of grupos) {
      l.push(`_${nomeArea(areaId)}_`);
      lista.forEach((e) => l.push(`• ${e.funcao}: ${e.nome}`));
      l.push('');
    }
    for (const areaId of pulados) {
      l.push(`_${nomeArea(areaId)}_`, '• Sem escala necessária', '');
    }
  }
  if (musicas.length) {
    l.push('*Músicas*');
    musicas.forEach((m, i) => l.push(`${i + 1}. ${m.titulo}`));
  }
  return l.join('\n').trim();
}

function abrirWhatsApp(ev, escalas, musicas, semEscala = []) {
  const texto = textoWhatsApp(ev, escalas, musicas, semEscala);
  const d = abrirJanela('Texto para o WhatsApp', `
    <textarea readonly rows="12">${esc(texto)}</textarea>
    <div class="acoes">
      <button type="button" class="btn secundario" data-fechar>Fechar</button>
      ${navigator.share ? '<button type="button" class="btn secundario" data-compartilhar>Compartilhar</button>' : ''}
      <button type="button" class="btn" data-copiar>Copiar</button>
    </div>`);
  const area = $('textarea', d);
  $('[data-copiar]', d).addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      area.select();
      document.execCommand('copy');
    }
    aviso('Texto copiado ✓');
  });
  $('[data-compartilhar]', d)?.addEventListener('click', () => navigator.share({ text: texto }).catch(() => {}));
}

/* ---------------------------------------------------------------------
   Tela: telão (visão do audiovisual)
   --------------------------------------------------------------------- */
async function telaTelao(id, ctx) {
  const [rEv, rItens, rMus] = await Promise.all([
    db.from('eventos').select('*').eq('id', id).maybeSingle(),
    db.from('itens_programa').select('*').eq('evento_id', id).order('ordem').order('horario', { nullsFirst: true }).order('id'),
    db.from('musicas').select('*').eq('evento_id', id).order('ordem').order('id'),
  ]);
  if (ctx.velho()) return;
  for (const r of [rEv, rItens, rMus]) if (r.error) throw r.error;
  const ev = rEv.data;
  if (!ev) { mostrar(ctx, '<p>Evento não encontrado.</p><a href="#/calendario">Voltar</a>'); return; }
  if (estado.telaoEvento !== id) { estado.telaoEvento = id; estado.telaoIndice = -1; }

  let idx = 0;
  const itens = rItens.data || [];
  const musicas = rMus.data || [];
  mostrar(ctx, `
    <div class="telao-topo">
      <a class="btn peq" href="#/evento/${ev.id}">← Sair</a>
      <button class="btn peq" type="button" data-acao="tela-cheia">⛶ Tela cheia</button>
    </div>
    <div class="telao">
      <h1>${esc(ev.titulo)}</h1>
      <p class="subtitulo">${esc(capital(dataLonga(ev.data)))}${ev.horario ? ' · ' + esc(hora(ev.horario)) : ''}</p>
      <h2>Programa</h2>
      ${itens.length ? `<ol>${itens.map((it, i) => `<li data-i="${idx++}"><span class="num">${i + 1}</span><span>${esc(it.titulo)} <span class="tipo">${esc(NOMES_TIPO_ITEM[it.tipo] || '')}</span></span>${it.horario ? `<span class="tom" title="Horário previsto">~${esc(hora(it.horario))}</span>` : ''}</li>`).join('')}</ol>` : '<p class="subtitulo">—</p>'}
      <h2>Músicas</h2>
      ${musicas.length ? `<ol>${musicas.map((m, i) => `<li data-i="${idx++}"><span class="num">${i + 1}</span><span>${esc(m.titulo)}</span></li>`).join('')}</ol>` : '<p class="subtitulo">—</p>'}
    </div>`);
  marcarTelao(false);

  app.onclick = (e) => {
    if (e.target.closest('[data-acao=tela-cheia]')) { telaCheia(); return; }
    const li = e.target.closest('li[data-i]');
    if (li) { estado.telaoIndice = Number(li.dataset.i); marcarTelao(true); }
  };
}

function marcarTelao(rolar) {
  const itens = app.querySelectorAll('.telao li[data-i]');
  itens.forEach((li) => li.classList.toggle('atual', Number(li.dataset.i) === estado.telaoIndice));
  const atual = itens[estado.telaoIndice];
  if (atual && rolar) {
    atual.scrollIntoView({ block: 'center', behavior: menosMovimento.matches ? 'auto' : 'smooth' });
    anima(atual, { scale: [0.98, 1] }, { duration: 0.2 });
  }
}

function telaCheia() {
  const el = document.documentElement;
  if (document.fullscreenElement) { document.exitFullscreen?.(); return; }
  const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
  if (pedir) pedir.call(el)?.catch?.(() => {});
  else aviso('No iPhone, instale o app na Tela de Início para usar em tela cheia.');
}

document.addEventListener('keydown', (e) => {
  if (rotaAtual().nome !== 'telao' || document.querySelector('dialog[open]')) return;
  const total = app.querySelectorAll('.telao li[data-i]').length;
  if (!total) return;
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) {
    e.preventDefault();
    estado.telaoIndice = Math.min(total - 1, estado.telaoIndice + 1);
    marcarTelao(true);
  } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
    e.preventDefault();
    estado.telaoIndice = Math.max(0, estado.telaoIndice - 1);
    marcarTelao(true);
  } else if (e.key === 'f' || e.key === 'F') {
    telaCheia();
  }
});

/* ---------------------------------------------------------------------
   Tela: histórico de músicas (últimas 8 semanas)
   --------------------------------------------------------------------- */
async function telaHistorico(ctx) {
  if (!eAdmin()) { location.hash = '#/calendario'; return; }
  const hoje = new Date();
  const desde = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 56);
  const { data, error } = await db.from('musicas')
    .select('id, titulo, ordem, area_id, eventos!inner(id, data, titulo)')
    .gte('eventos.data', isoLocal(desde))
    .lte('eventos.data', isoLocal(hoje));
  if (ctx.velho()) return;
  if (error) throw error;

  const musicas = data || [];
  const porEvento = [...agrupar(musicas, (m) => m.eventos.id).values()]
    .sort((a, b) => b[0].eventos.data.localeCompare(a[0].eventos.data));
  const contagem = [...agrupar(musicas, (m) => semAcento(m.titulo)).values()]
    .map((l) => ({ titulo: l[0].titulo, vezes: l.length }))
    .filter((x) => x.vezes > 1)
    .sort((a, b) => b.vezes - a.vezes || a.titulo.localeCompare(b.titulo))
    .slice(0, 10);

  mostrar(ctx, `
    <h1>Músicas tocadas</h1>
    <p class="suave">Últimas 8 semanas.</p>
    ${contagem.length ? `<div class="card"><h2>Mais repetidas</h2><ul class="lista">${contagem.map((c) =>
      `<li><span class="cresce">${esc(c.titulo)}</span><span class="contador">${c.vezes}×</span></li>`).join('')}</ul></div>` : ''}
    ${porEvento.length ? porEvento.map((lista) => {
      const ev = lista[0].eventos;
      lista.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      return `<div class="card">
        <a href="#/evento/${ev.id}" class="linha-entre" style="text-decoration:none;color:inherit">
          <strong>${esc(ev.titulo)}</strong><span class="suave pequeno">${esc(capital(dataLonga(ev.data)))}</span></a>
        <ul class="lista">${lista.map((m) => `<li><span class="cresce">${esc(m.titulo)}</span></li>`).join('')}</ul>
      </div>`;
    }).join('') : '<p class="vazio">Nenhuma música registrada nas últimas semanas.</p>'}`);
}

/* ---------------------------------------------------------------------
   Tela: anotações privadas da área
   --------------------------------------------------------------------- */
// Visão do admin com as anotações de todas as equipes (os líderes usam a tela da equipe).
async function telaAnotacoes(ctx) {
  if (!eAdmin()) {
    location.hash = estado.lider.area_id != null ? `#/equipe/${estado.lider.area_id}` : '#/calendario';
    return;
  }
  const todas = estado.areaAnotacoes == null || estado.areaAnotacoes === 'todas';
  const area = todas
    ? null
    : (eAdmin() ? (estado.areaAnotacoes ?? estado.lider.area_id ?? estado.areas[0]?.id) : estado.lider.area_id);
  if (!todas && area == null) { mostrar(ctx, '<p class="vazio">Nenhuma área cadastrada.</p>'); return; }

  let consulta = db.from('anotacoes_area').select('*').order('atualizado_em', { ascending: false });
  if (!todas) consulta = consulta.eq('area_id', area);
  const { data, error } = await consulta;
  if (ctx.velho()) return;
  if (error) throw error;
  const notas = data || [];
  const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  mostrar(ctx, `
    <h1>Anotações</h1>
    <p class="suave">${todas ? 'Anotações de todas as áreas. Só o administrador vê esta lista.' : `Visíveis só para a área ${esc(nomeArea(area))} e para o administrador.`}</p>
    ${eAdmin() ? `<label class="campo"><span>Área</span><select data-area-notas>
      <option value="todas" ${todas ? 'selected' : ''}>Todas as áreas</option>
      ${estado.areas.map((a) => `<option value="${a.id}" ${!todas && a.id === area ? 'selected' : ''}>${esc(a.nome)}</option>`).join('')}
    </select></label>` : ''}
    ${todas ? '' : `<form class="card" id="nova-nota">
      <label class="campo"><span>Nova anotação</span><textarea name="texto" rows="3" required></textarea></label>
      <div class="acoes" style="margin-top:0"><button class="btn" type="submit">Adicionar</button></div>
    </form>`}
    ${notas.length ? notas.map((n) => `
      <div class="card">
        ${todas ? `<div class="suave pequeno"><strong>${esc(nomeArea(n.area_id))}</strong></div>` : ''}
        <p class="texto-nota" style="margin-top:.25rem">${esc(n.texto)}</p>
        <div class="linha-entre"><span class="suave pequeno">${esc(fmt.format(new Date(n.atualizado_em)))}</span>
          <button class="btn-icone" type="button" data-acao="editar-nota" data-id="${n.id}" aria-label="Editar">✎</button></div>
      </div>`).join('') : '<p class="vazio">Nenhuma anotação.</p>'}`);

  const form = $('#nova-nota');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const texto = form.texto.value.trim();
      if (!texto) return;
      const btn = $('[type=submit]', form);
      btn.disabled = true;
      try {
        await gravar('anotacoes_area', { area_id: area, texto });
        aviso('Salvo ✓');
        roteador(true);
      } catch (err) {
        aviso(traduzErro(err), true);
        btn.disabled = false;
      }
    });
  }
  app.onchange = (e) => {
    if (e.target.matches('[data-area-notas]')) {
      const v = e.target.value;
      estado.areaAnotacoes = v === 'todas' ? 'todas' : Number(v);
      roteador();
    }
  };
  app.onclick = (e) => {
    const b = e.target.closest('[data-acao=editar-nota]');
    if (!b) return;
    const nota = notas.find((n) => n.id === Number(b.dataset.id));
    abrirFormulario({
      titulo: 'Editar anotação',
      campos: [{ nome: 'texto', rotulo: 'Texto', tipo: 'textarea', obrigatorio: true, linhas: 6 }],
      valores: nota,
      aoSalvar: async (dados) => { await gravar('anotacoes_area', dados, nota.id); roteador(true); },
      aoExcluir: async () => { await apagar('anotacoes_area', { id: nota.id }); roteador(true); },
      confirmarExcluir: 'Excluir esta anotação?',
    });
  };
}

/* ---------------------------------------------------------------------
   Telas: Equipes (admin) e página de cada equipe
   --------------------------------------------------------------------- */

// Conta o que ainda está ligado à equipe. Se tiver algo, a exclusão é bloqueada.
// Conta o que ainda está ligado ao ministério. Se tiver algo, a exclusão é bloqueada.
// Conta o que ainda está ligado ao ministério. Se tiver algo, a exclusão é bloqueada.
async function motivosBloqueioArea(areaId) {
  const tabelas = [
    ['eventos', 'evento', 'eventos'],
    ['recorrencias', 'evento semanal', 'eventos semanais'],
    ['escalas', 'escala', 'escalas'],
    ['musicas', 'música', 'músicas'],
    ['materiais', 'material', 'materiais'],
    ['itens_programa', 'item do programa', 'itens do programa'],
    ['anotacoes_area', 'anotação', 'anotações'],
    ['lideres', 'líder', 'líderes'],
    ['convites_lideres', 'convite', 'convites'],
  ];
  const contagens = await Promise.all(tabelas.map(([t]) =>
    db.from(t).select('*', { count: 'exact', head: true }).eq('area_id', areaId)));
  const motivos = [];
  contagens.forEach((r, i) => {
    if (r.error) throw r.error;
    const n = r.count || 0;
    if (n) motivos.push(`${n} ${n === 1 ? tabelas[i][1] : tabelas[i][2]}`);
  });
  return motivos;
}

async function apagarEquipe(area) {
  const motivos = await motivosBloqueioArea(area.id);
  if (motivos.length) {
    throw new Error(`Não dá para apagar ${area.nome}: ainda tem ${motivos.join(', ')}. Mude esses registros para outro ministério ou apague-os antes (só o admin pode).`);
  }
  try {
    await apagar('areas', { id: area.id });
  } catch (err) {
    if (/foreign key|violates/i.test(err.message || '')) throw new Error(`Não dá para apagar ${area.nome}: ainda há registros ligados a ele.`);
    throw err;
  }
  await recarregarAreas();
}

function abrirFormEquipe(area) {
  abrirFormulario({
    titulo: area ? 'Ministério' : 'Novo ministério',
    campos: [{ nome: 'nome', rotulo: 'Nome', obrigatorio: true, placeholder: 'Ex.: Recepção' }],
    valores: area || {},
    aoSalvar: async (d) => {
      const salva = await gravar('areas', d, area?.id);
      await recarregarAreas();
      if (!area) location.hash = `#/ministerio/${salva.id}`;
      else roteador(true);
    },
    aoExcluir: area ? async () => { await apagarEquipe(area); location.hash = '#/ministerios'; } : null,
    textoExcluir: 'Apagar ministério',
    confirmarExcluir: area ? `Apagar o ministério ${area.nome}? Só funciona se ele não tiver eventos, escalas, músicas, itens, anotações, líderes ou convites. As permissões dele saem junto.` : '',
  });
}

// Ministérios: só o admin. Atalhos para cada ministério.
async function telaEquipes(ctx) {
  if (!eAdmin()) {
    location.hash = estado.lider.area_id != null ? `#/equipe/${estado.lider.area_id}` : '#/calendario';
    return;
  }
  const { data, error } = await db.from('lideres').select('nome, area_id').not('area_id', 'is', null).order('nome');
  if (ctx.velho()) return;
  if (error) throw error;
  const lideresPorArea = agrupar(data || [], (l) => l.area_id);

  mostrar(ctx, `
    <div class="secao-topo"><h1 style="margin:0">Ministérios</h1>
      <button class="btn peq" type="button" data-acao="nova-equipe">+ Ministério</button></div>
    <p class="suave">Abra um ministério para ver o próximo evento e a escala que o líder montou.</p>
    <div class="grade-ministerios">${estado.areas.map((a) => {
      const lids = lideresPorArea.get(a.id) || [];
      return `<a class="card card-link atalho" href="#/ministerio/${a.id}">
        <strong>${esc(a.nome)}</strong>
        <span class="suave pequeno">${lids.length ? lids.map((l) => esc(l.nome)).join(', ') : 'Sem líder'}</span></a>`;
    }).join('') || '<p class="vazio">Nenhum ministério.</p>'}</div>
    <div class="linha" style="margin-top:1rem">
      <a class="btn peq secundario" href="#/anotacoes">Anotações de todos</a>
      <a class="btn peq secundario" href="#/admin" data-acao="ir-permissoes">Permissões de visualização</a>
    </div>`);

  app.onclick = (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    if (b.dataset.acao === 'nova-equipe') abrirFormEquipe(null);
    if (b.dataset.acao === 'ir-permissoes') estado.subabaAdmin = 'permissoes';
  };
}

// Líder ("Minha equipe"): só o próximo evento, com o botão da escala.
// Admin ("Ministério"): o mesmo destaque do próximo evento, anotações e gestão do ministério.
async function telaEquipe(id, ctx) {
  if (!eAdmin() && id !== estado.lider.area_id) {
    location.hash = estado.lider.area_id != null ? `#/equipe/${estado.lider.area_id}` : '#/calendario';
    return;
  }
  const area = estado.areas.find((a) => a.id === id);
  if (!area) { mostrar(ctx, '<div class="card"><p>Ministério não encontrado.</p><a href="#/calendario">← Calendário</a></div>'); return; }

  const hoje = isoLocal(new Date());
  // Próximas datas pendentes; o destaque é a primeira que a equipe não marcou "sem escala"
  const rEv = await db.from('eventos').select('*').gte('data', hoje)
    .is('concluido_em', null).order('data').order('horario', { nullsFirst: true }).limit(12);
  if (rEv.error) throw rEv.error;
  const eventos = rEv.data || [];
  const ids = eventos.map((e) => e.id);
  const vazio = { data: [], error: null };
  const [rEsc, rNotas, rLid, rDis] = await Promise.all([
    ids.length ? db.from('escalas').select('*').eq('area_id', id).in('evento_id', ids).order('id') : vazio,
    db.from('anotacoes_area').select('*').eq('area_id', id).order('atualizado_em', { ascending: false }),
    eAdmin() ? db.from('lideres').select('id, nome').eq('area_id', id).order('nome') : vazio,
    ids.length ? db.from('escalas_dispensadas').select('evento_id').eq('area_id', id).in('evento_id', ids) : vazio,
  ]);
  if (ctx.velho()) return;
  for (const r of [rEsc, rNotas, rLid, rDis]) if (r.error) throw r.error;

  const escPorEv = agrupar(rEsc.data || [], (e) => e.evento_id);
  const notas = rNotas.data || [];
  const lideres = rLid.data || [];
  const fmtNota = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const dispensados = new Set((rDis.data || []).map((x) => x.evento_id));
  const iProx = eventos.findIndex((e) => !dispensados.has(e.id));
  const proximo = iProx >= 0 ? eventos[iProx] : null;
  // Datas que a equipe marcou "sem escala" (com Desfazer). Só eventos pendentes: quando o admin marca
  // o evento como realizado ele sai daqui; se o admin reabrir, volta.
  const pulados = eventos.filter((e) => dispensados.has(e.id));

  const linhasEscala = (lista) => lista.length
    ? `<ul class="lista">${lista.map((e) => `<li><span class="cresce"><strong>${esc(e.funcao)}</strong> — ${esc(e.nome)}</span></li>`).join('')}</ul>`
    : '<p class="vazio">Ninguém escalado ainda.</p>';

  const cardProximo = proximo ? (() => {
    const dt = deISO(proximo.data);
    const lista = escPorEv.get(proximo.id) || [];
    return `<div class="card destaque">
      <p class="rotulo">Próximo evento</p>
      <div class="linha" style="flex-wrap:nowrap;align-items:flex-start">
        <div class="evento-data"><b>${dt.getDate()}</b><small>${DIAS_ABREV[dt.getDay()]}</small></div>
        <div class="cresce">
          <strong style="font-size:1.1rem">${esc(proximo.titulo)}</strong>
          <div class="suave">${esc(capital(dataLonga(proximo.data)))} · ${esc(hora(proximo.horario) || 'Sem horário')}</div>
        </div>
      </div>
      ${linhasEscala(lista)}
      <div class="acoes" style="justify-content:space-between">
        <a class="btn-texto" href="#/evento/${proximo.id}" style="padding-left:0">Abrir evento</a>
        <span class="linha">
          ${lista.length ? '' : `<button class="btn secundario" type="button" data-acao="pular" data-ev="${proximo.id}">Pular escala desta data</button>`}
          <button class="btn" type="button" data-acao="escala" data-ev="${proximo.id}">${lista.length ? 'Editar escala' : 'Adicionar escala'}</button>
        </span>
      </div>
    </div>`;
  })() : `<div class="card"><p class="vazio">${eventos.length ? 'Nenhuma data pendente de escala nos próximos eventos.' : 'Nenhum evento marcado daqui para a frente.'}</p></div>`;
  const cardPulados = pulados.length ? `<div class="card pulados">
      <p class="rotulo">Sem escala necessária</p>
      <ul class="lista">${pulados.map((e) => `<li>
        <a class="cresce" href="#/evento/${e.id}"><strong>${esc(e.titulo)}</strong>
          <span class="suave pequeno"> · ${esc(capital(dataLonga(e.data)))}${e.horario ? ` · ${esc(hora(e.horario))}` : ''}</span></a>
        <button class="btn-texto" type="button" data-acao="desfazer-pulo" data-ev="${e.id}">Desfazer</button></li>`).join('')}</ul>
    </div>` : '';

  mostrar(ctx, `
    ${eAdmin() ? '<a class="btn-texto" href="#/ministerios" style="padding-left:0">← Ministérios</a>' : ''}
    <div class="secao-topo">
      <h1 style="margin:0">${esc(area.nome)}</h1>
      ${eAdmin() ? '<button class="btn-icone" type="button" data-acao="editar-equipe" aria-label="Renomear ou apagar ministério">✎</button>' : ''}
    </div>
    <p class="suave">${eAdmin()
      ? (lideres.length ? 'Líder: ' + lideres.map((l) => esc(l.nome)).join(', ') : 'Sem líder. Cadastre em Admin › Líderes.')
      : 'Sua equipe.'}</p>
    ${cardProximo}
    ${cardPulados}
    ${!eAdmin() ? '<p class="suave pequeno">Para montar a escala de outro evento, abra o evento pelo calendário.</p>' : ''}

    <h2 class="secao">Anotações da equipe</h2>
    <p class="suave pequeno">Visíveis só para ${esc(area.nome)} e para o administrador.</p>
    <form class="card" id="nova-nota">
      <label class="campo"><span>Nova anotação</span><textarea name="texto" rows="3" required></textarea></label>
      <div class="acoes" style="margin-top:0"><button class="btn" type="submit">Adicionar</button></div>
    </form>
    ${notas.length ? notas.map((n) => `
      <div class="card">
        <p class="texto-nota" style="margin-top:0">${esc(n.texto)}</p>
        <div class="linha-entre"><span class="suave pequeno">${esc(fmtNota.format(new Date(n.atualizado_em)))}</span>
          <button class="btn-icone" type="button" data-acao="editar-nota" data-id="${n.id}" aria-label="Editar">✎</button></div>
      </div>`).join('') : '<p class="vazio">Nenhuma anotação.</p>'}`);

  const form = $('#nova-nota');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = form.texto.value.trim();
    if (!texto) return;
    const btn = $('[type=submit]', form);
    btn.disabled = true;
    try {
      await gravar('anotacoes_area', { area_id: id, texto });
      aviso('Salvo ✓');
      roteador(true);
    } catch (err) {
      aviso(traduzErro(err), true);
      btn.disabled = false;
    }
  });

  app.onclick = (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const acao = b.dataset.acao;
    if (acao === 'escala') {
      const ev = eventos.find((x) => x.id === Number(b.dataset.ev));
      if (ev) abrirEditorEscala(ev, id, escPorEv.get(ev.id) || [], () => roteador(true));
    } else if (acao === 'pular') {
      pularEscala(Number(b.dataset.ev), id);
    } else if (acao === 'desfazer-pulo') {
      desfazerPulo(Number(b.dataset.ev), id);
    } else if (acao === 'editar-equipe') {
      abrirFormEquipe(area);
    } else if (acao === 'editar-nota') {
      const nota = notas.find((n) => n.id === Number(b.dataset.id));
      abrirFormulario({
        titulo: 'Editar anotação',
        campos: [{ nome: 'texto', rotulo: 'Texto', tipo: 'textarea', obrigatorio: true, linhas: 6 }],
        valores: nota,
        aoSalvar: async (dados) => { await gravar('anotacoes_area', dados, nota.id); roteador(true); },
        aoExcluir: async () => { await apagar('anotacoes_area', { id: nota.id }); roteador(true); },
        confirmarExcluir: 'Excluir esta anotação?',
      });
    }
  };
}

/* ---------------------------------------------------------------------
   Tela: administração
   --------------------------------------------------------------------- */
// Tela com abas internas (usada por Administração e Membros). Só admin.
async function telaComSubabas(ctx, titulo, subs, chaveEstado) {
  if (!eAdmin()) { location.hash = '#/calendario'; return; }
  if (!subs[estado[chaveEstado]]) estado[chaveEstado] = Object.keys(subs)[0];
  const atual = estado[chaveEstado];
  const parte = await subs[atual][1]();
  if (ctx.velho()) return;

  mostrar(ctx, `
    <h1>${esc(titulo)}</h1>
    <div class="subabas" role="tablist">${Object.entries(subs).map(([k, [nome]]) =>
      `<button type="button" role="tab" aria-selected="${k === atual}" class="${k === atual ? 'ativa' : ''}" data-acao="subaba" data-aba="${k}">${nome}</button>`).join('')}</div>
    ${parte.html}`);

  app.onclick = (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    if (b.dataset.acao === 'subaba') { estado[chaveEstado] = b.dataset.aba; roteador(); return; }
    parte.clique?.(b, e);
  };
  app.oninput = parte.entrada || null;
  app.onchange = parte.mudanca || null;
  parte.montar?.();
}

function telaAdmin(ctx) {
  return telaComSubabas(ctx, 'Administração', {
    lideres: ['Líderes', adminLideres],
    semanais: ['Eventos semanais', adminRecorrencias],
    acessos: ['Acessos', adminAcessos],
    permissoes: ['Permissões', adminPermissoes],
  }, 'subabaAdmin');
}

// Seção própria para o cadastro geral de membros da igreja (só admin)
function telaMembros(ctx) {
  return telaComSubabas(ctx, 'Membros da igreja', {
    cadastro: ['Cadastro', adminCadastroMembro],
    lista: ['Lista', adminMembros],
    aniversariantes: ['Aniversariantes', adminAniversariantes],
  }, 'subabaMembros');
}

// --- Painel de acessos: última vez que cada líder abriu o app ---
function tempoDesde(data) {
  const min = Math.round((Date.now() - data.getTime()) / 60000);
  if (min < 2) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'há 1 dia' : `há ${d} dias`;
}

async function adminAcessos() {
  const { data, error } = await db.rpc('acessos_lideres');
  if (error) throw error;
  const lista = data || [];
  const fmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return {
    html: `
      <p class="suave">Última vez que cada líder abriu o app. Atualiza sozinho a cada abertura.</p>
      <div class="card"><ul class="lista">${lista.length ? lista.map((l) => {
        const acesso = l.ultimo_acesso ? new Date(l.ultimo_acesso) : null;
        const dias = acesso ? (Date.now() - acesso.getTime()) / 864e5 : Infinity;
        return `<li>
          <div class="cresce"><strong>${esc(l.nome)}</strong>
            <div class="suave pequeno">${l.papel === 'admin' ? 'Admin' : esc(nomeArea(l.area_id))}${l.ultimo_login ? ` · último login ${esc(fmt.format(new Date(l.ultimo_login)))}` : ''}</div></div>
          <div style="text-align:right">
            <div class="${dias > 14 ? 'erro' : ''}" style="margin:0;font-weight:600">${acesso ? esc(tempoDesde(acesso)) : 'Nunca entrou'}</div>
            ${acesso ? `<div class="suave pequeno">${esc(fmt.format(acesso))}</div>` : ''}
          </div></li>`;
      }).join('') : '<li class="vazio">Nenhum líder ainda.</li>'}</ul></div>
      <p class="suave pequeno">Em vermelho: mais de 14 dias sem abrir o app.</p>`,
  };
}

// --- Líderes e convites ---
// Líderes: o admin cria contas (nome, e-mail, senha inicial) e redefine senhas pelo app.
// Tudo passa pelas funções do banco criar_lider e definir_senha_lider, que conferem no servidor
// se quem chamou é administrador. Nenhuma chave privada no app.
async function adminLideres() {
  const { data, error } = await db.from('lideres').select('*').order('nome');
  if (error) throw error;
  const lideres = data || [];
  const papel = (p) => (p === 'admin' ? 'Admin' : 'Líder');
  const campoSenha = { nome: 'senha', rotulo: 'Nova senha', tipo: 'senha', obrigatorio: true, ajuda: 'Mínimo de 6 caracteres. Use o olhinho para conferir e Copiar para mandar no privado.' };
  const validarSenha = (s) => {
    if (!s || s.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
    if (s.length > 72) throw new Error('A senha pode ter no máximo 72 caracteres.');
  };

  return {
    html: `
      <div class="secao-topo"><h2>Líderes</h2><button class="btn peq" type="button" data-acao="novo-lider">+ Nova conta</button></div>
      <p class="suave pequeno">Crie a conta com e-mail e senha e passe a senha em particular. Se alguém esquecer, use <strong>Redefinir senha</strong>. A senha atual nunca é mostrada.</p>
      <div class="card"><ul class="lista lista-lideres">${lideres.map((l) => `
        <li><div class="cresce"><strong>${esc(l.nome)}</strong>${l.id === estado.lider.id ? ' <span class="suave pequeno">(você)</span>' : ''}
          <div class="suave pequeno">${esc(l.email || '')}</div>
          <div class="linha"><span class="selo">${papel(l.papel)}</span>${l.area_id ? `<span class="selo cinza">${esc(nomeArea(l.area_id))}</span>` : ''}</div></div>
          <span class="linha acoes-lider">
            ${l.id !== estado.lider.id ? `<button class="btn peq secundario" type="button" data-acao="redefinir-senha" data-id="${l.id}">Redefinir senha</button>` : ''}
            <button class="btn-icone" type="button" data-acao="editar-lider" data-id="${l.id}" aria-label="Editar ${esc(l.nome)}">✎</button>
          </span></li>`).join('')}</ul></div>`,
    clique: async (b) => {
      const acao = b.dataset.acao;
      const camposBase = [
        { nome: 'nome', rotulo: 'Nome', obrigatorio: true },
        { nome: 'papel', rotulo: 'Papel', tipo: 'select', obrigatorio: true, opcoes: [['lider', 'Líder'], ['admin', 'Administrador']] },
        { nome: 'area_id', rotulo: 'Ministério', tipo: 'select', numero: true, opcoes: opcoesAreas(), vazio: '— nenhum (só admin) —' },
      ];
      const validar = (d) => { if (d.papel === 'lider' && d.area_id == null) throw new Error('Escolha o ministério do líder.'); };

      if (acao === 'novo-lider') {
        let criada = null;
        abrirFormulario({
          titulo: 'Nova conta',
          campos: [
            camposBase[0],
            { nome: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true, autocomplete: 'off', converter: (v) => v?.toLowerCase() },
            campoSenha,
            ...camposBase.slice(1),
          ],
          valores: { papel: 'lider' },
          textoSalvar: 'Criar conta',
          avisoSalvo: 'Conta criada ✓',
          aoSalvar: async (d) => {
            validar(d);
            validarSenha(d.senha);
            const { error } = await db.rpc('criar_lider', { p_email: d.email, p_senha: d.senha, p_nome: d.nome, p_area_id: d.area_id, p_papel: d.papel });
            if (error) throw error;
            criada = d;
          },
        })._aoFechar.push(() => {
          if (!criada) return;
          roteador(true);
          setTimeout(() => mostrarSenhaDefinida('Conta criada', criada.nome, criada.email, criada.senha), 50);
        });
      } else if (acao === 'redefinir-senha') {
        const l = lideres.find((x) => x.id === b.dataset.id);
        if (!l) return;
        let senhaNova = null;
        abrirFormulario({
          titulo: 'Redefinir senha',
          ajuda: `${l.nome} · ${l.email || ''}. A senha atual não é mostrada; digite uma nova.`,
          campos: [campoSenha],
          textoSalvar: 'Salvar nova senha',
          avisoSalvo: 'Senha redefinida ✓',
          aoSalvar: async (d) => {
            validarSenha(d.senha);
            const { error } = await db.rpc('definir_senha_lider', { p_id: l.id, p_senha: d.senha });
            if (error) throw error;
            senhaNova = d.senha;
          },
        })._aoFechar.push(() => {
          if (!senhaNova) return;
          setTimeout(() => mostrarSenhaDefinida('Senha redefinida', l.nome, l.email, senhaNova), 50);
        });
      } else if (acao === 'editar-lider') {
        const l = lideres.find((x) => x.id === b.dataset.id);
        abrirFormulario({
          titulo: 'Editar líder',
          campos: camposBase,
          valores: l,
          aoSalvar: async (dados) => {
            validar(dados);
            await gravar('lideres', dados, l.id);
            if (l.id === estado.lider.id) { estado.lider = null; carregarPerfil(estado.sessao); } else roteador(true);
          },
          aoExcluir: l.id === estado.lider.id ? null : async () => {
            const { error } = await db.rpc('remover_lider', { p_id: l.id });
            if (error) throw error;
            roteador(true);
          },
          textoExcluir: 'Remover líder',
          confirmarExcluir: `Remover ${l.nome}? A conta de login é apagada e a pessoa não entra mais no app. As escalas que ela montou continuam.`,
        });
      }
    },
  };
}

// --- Membros ---
function camposMembro() {
  return [
    { nome: 'nome', rotulo: 'Nome', obrigatorio: true },
    {
      nome: 'data_nascimento', rotulo: 'Data de nascimento', placeholder: 'DD/MM/AAAA ou DD/MM', ajuda: 'Se não souber o ano, use só dia e mês.',
      converter: (v) => {
        if (v == null) return null;
        const r = parseData(v);
        if (!r) throw new Error('Data de nascimento inválida. Use DD/MM/AAAA ou DD/MM.');
        return r;
      },
    },
    { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel', placeholder: '(11) 99999-0000' },
    { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea', linhas: 3 },
  ];
}

async function adminMembros() {
  const { data, error } = await db.from('membros').select('*').order('nome');
  if (error) throw error;
  const membros = data || [];

  return {
    html: `
      <div class="linha" style="margin-bottom:.75rem">
        <input class="cresce" type="search" placeholder="Buscar membro…" data-busca aria-label="Buscar membro" style="width:auto">
      </div>
      <p class="suave pequeno">${membros.length} membro(s) no cadastro geral da igreja. Toque em ✎ para editar.</p>
      <div class="card"><ul class="lista" id="lista-membros">${membros.length ? membros.map((m) => `
        <li data-nome="${esc(semAcento(m.nome))}">
          <div class="cresce"><strong>${esc(m.nome)}</strong>
            <div class="suave pequeno">${[m.telefone ? esc(m.telefone) : '', m.data_nascimento ? 'Aniv. ' + esc(aniversario(m.data_nascimento)) : ''].filter(Boolean).join(' · ')}</div>
            ${m.observacoes ? `<div class="suave pequeno texto-nota">${esc(m.observacoes)}</div>` : ''}</div>
          <button class="btn-icone" type="button" data-acao="editar-membro" data-id="${m.id}" aria-label="Editar">✎</button>
        </li>`).join('') : '<li class="vazio">Nenhum membro cadastrado.</li>'}</ul></div>`,
    entrada: (e) => {
      if (!e.target.matches('[data-busca]')) return;
      const q = semAcento(e.target.value);
      document.querySelectorAll('#lista-membros li[data-nome]').forEach((li) => { li.hidden = q && !li.dataset.nome.includes(q); });
    },
    clique: (b) => {
      const acao = b.dataset.acao;
      if (acao === 'novo-membro' || acao === 'editar-membro') {
        const m = acao === 'editar-membro' ? membros.find((x) => x.id === Number(b.dataset.id)) : null;
        abrirFormulario({
          titulo: m ? 'Editar membro' : 'Novo membro',
          campos: camposMembro(),
          valores: m ? { ...m, data_nascimento: aniversario(m.data_nascimento) } : {},
          aoSalvar: async (d) => { await gravar('membros', d, m?.id); roteador(true); },
          aoExcluir: m ? async () => { await apagar('membros', { id: m.id }); roteador(true); } : null,
          confirmarExcluir: m ? `Excluir ${m.nome} do cadastro de membros? As escalas não mudam (lá o nome é digitado).` : '',
        });
      } else if (acao === 'importar') {
        abrirImportacao();
      }
    },
  };
}

// Aba Cadastro: formulário na própria tela + importação CSV
async function adminCadastroMembro() {
  const campos = camposMembro();
  return {
    html: `
      <form class="card" id="form-membro">
        <h2>Novo membro</h2>
        ${campos.map((c) => campoHTML(c)).join('')}
        <p class="erro" hidden></p>
        <div class="acoes"><button class="btn" type="submit">Cadastrar</button></div>
      </form>
      <div class="card">
        <h2>Importar lista</h2>
        <p class="suave pequeno">Tem a lista de aniversários numa planilha? Salve como CSV e importe tudo de uma vez.</p>
        <button class="btn secundario" type="button" data-acao="importar">Importar CSV</button>
      </div>`,
    montar: () => {
      const form = $('#form-membro');
      const erro = $('.erro', form);
      const btn = $('[type=submit]', form);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        erro.hidden = true;
        if (!form.reportValidity()) return;
        let d;
        try { d = normalizar(campos, Object.fromEntries(new FormData(form))); }
        catch (err) { erro.textContent = err.message; erro.hidden = false; return; }
        btn.disabled = true;
        try {
          await gravar('membros', d);
          aviso(`${d.nome} cadastrado ✓`);
          form.reset();
          anima(form, { scale: [0.98, 1] }, { duration: 0.25 });
        } catch (err) {
          erro.textContent = traduzErro(err);
          erro.hidden = false;
        } finally {
          btn.disabled = false;
        }
      });
    },
    clique: (b) => { if (b.dataset.acao === 'importar') abrirImportacao(); },
  };
}

// Lê CSV com vírgula, ponto e vírgula ou tab, respeitando aspas.
function lerCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const primeira = texto.split(/\r?\n/)[0] || '';
  const sep = [';', ',', '\t'].sort((a, b) => primeira.split(b).length - primeira.split(a).length)[0];
  const linhas = [];
  let campo = '';
  let linha = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false;
      } else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((v) => v.trim() !== ''));
}

function interpretarCSV(texto) {
  const linhas = lerCSV(texto);
  const membros = [];
  const avisos = [];
  if (!linhas.length) return { membros, avisos };

  const cab = linhas[0].map(semAcento);
  const achar = (...nomes) => cab.findIndex((c) => nomes.some((n) => c === n || c.startsWith(n)));
  let iNome = achar('nome');
  let iNasc = achar('nascimento', 'data_nascimento', 'data de nascimento', 'aniversario', 'data');
  let iTel = achar('telefone', 'celular', 'whatsapp', 'fone');
  let iObs = achar('observ', 'obs');
  let inicio = 1;
  // Sem cabeçalho: nome, nascimento, telefone, observações. Coluna "area" é ignorada
  // (o cadastro de membros é geral da igreja, sem área).
  if (iNome === -1) { iNome = 0; iNasc = 1; iTel = 2; iObs = 3; inicio = 0; }

  const valor = (linha, i) => (i >= 0 ? (linha[i] || '').trim() : '');

  for (let n = inicio; n < linhas.length; n++) {
    const l = linhas[n];
    const nome = valor(l, iNome);
    if (!nome) { avisos.push(`Linha ${n + 1}: sem nome, ignorada.`); continue; }
    const nascBruto = valor(l, iNasc);
    let nasc = null;
    if (nascBruto) {
      nasc = parseData(nascBruto);
      if (!nasc) avisos.push(`Linha ${n + 1}: data "${nascBruto}" não reconhecida (importado sem data).`);
    }
    membros.push({
      nome,
      data_nascimento: nasc,
      telefone: valor(l, iTel) || null,
      observacoes: valor(l, iObs) || null,
    });
  }
  return { membros, avisos };
}

function abrirImportacao() {
  const d = abrirJanela('Importar membros (CSV)', `
    <p class="suave pequeno">Primeira linha com os títulos das colunas: <b>nome</b>, <b>nascimento</b>, <b>telefone</b>, <b>observacoes</b> (só "nome" é obrigatório; outras colunas são ignoradas).
      Separador vírgula ou ponto e vírgula. Datas como 23/11/1990 ou 23/11.</p>
    <label class="campo"><span>Arquivo .csv</span><input type="file" accept=".csv,text/csv,text/plain"></label>
    <label class="campo"><span>Ou cole o conteúdo</span><textarea rows="6" placeholder="nome;nascimento;telefone&#10;Maria Silva;23/11/1990;(11) 99999-0000"></textarea></label>
    <div class="previa"></div>
    <p class="erro" hidden></p>
    <div class="acoes">
      <button type="button" class="btn secundario" data-fechar>Cancelar</button>
      <button type="button" class="btn" data-importar disabled>Importar</button>
    </div>`);
  const arquivo = $('input[type=file]', d);
  const area = $('textarea', d);
  const previa = $('.previa', d);
  const erro = $('.erro', d);
  const btn = $('[data-importar]', d);
  let prontos = [];

  const analisar = () => {
    const { membros, avisos } = interpretarCSV(area.value);
    prontos = membros;
    previa.innerHTML = area.value.trim()
      ? `<p><strong>${membros.length}</strong> membro(s) prontos para importar.</p>${avisos.length
        ? `<ul class="suave pequeno">${avisos.slice(0, 20).map((a) => `<li>${esc(a)}</li>`).join('')}${avisos.length > 20 ? `<li>… e mais ${avisos.length - 20}</li>` : ''}</ul>` : ''}`
      : '';
    btn.disabled = !prontos.length;
  };

  const lerArquivo = (file, codificacao) => new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => falha(r.error);
    r.readAsText(file, codificacao);
  });

  arquivo.addEventListener('change', async () => {
    const file = arquivo.files[0];
    if (!file) return;
    let texto = await lerArquivo(file, 'utf-8');
    // Planilhas salvas no Excel em português costumam vir em Windows-1252
    if (texto.includes('�')) texto = await lerArquivo(file, 'windows-1252');
    area.value = texto;
    analisar();
  });
  area.addEventListener('input', analisar);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    erro.hidden = true;
    try {
      for (let i = 0; i < prontos.length; i += 200) {
        btn.textContent = `Importando ${Math.min(i + 200, prontos.length)}/${prontos.length}…`;
        const { error } = await db.from('membros').insert(prontos.slice(i, i + 200));
        if (error) throw error;
      }
      await fecharJanela(d);
      aviso(`${prontos.length} membro(s) importados ✓`);
      roteador(true);
    } catch (err) {
      erro.textContent = traduzErro(err) + ' (os lotes anteriores ao erro já foram salvos)';
      erro.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Importar';
    }
  });
}

// --- Aniversariantes ---
async function adminAniversariantes() {
  const mes = estado.mesAniversario;
  const lista = await buscarAniversariantes(mes);
  return {
    html: `
      <label class="campo"><span>Mês</span><select data-mes-aniv>${MESES.map((n, i) =>
        `<option value="${i}" ${i === mes ? 'selected' : ''}>${capital(n)}</option>`).join('')}</select></label>
      ${blocoAniversariantes(lista, mes)}`,
    mudanca: (e) => {
      if (e.target.matches('[data-mes-aniv]')) { estado.mesAniversario = Number(e.target.value); roteador(true); }
    },
    clique: (b) => {
      if (b.dataset.acao === 'copiar-aniv') copiarTexto(textoAniversariantes(lista, mes), 'Lista copiada ✓');
    },
  };
}

// --- Permissões de visualização e áreas ---
async function adminPermissoes() {
  const { data, error } = await db.from('permissoes_visualizacao').select('*');
  if (error) throw error;
  const tem = new Set((data || []).map((p) => `${p.area_id}:${p.pode_ver_area_id}`));

  return {
    html: `
      <p class="suave">Marque o que cada equipe pode ver no calendário geral (inclusive os nomes nas escalas). Cada líder sempre vê e edita só a própria equipe; o admin vê tudo.</p>
      ${estado.areas.map((a) => `
        <div class="card">
          <h3>${esc(a.nome)} vê:</h3>
          ${estado.areas.map((b) => `
            <label class="check">
              <input type="checkbox" data-perm="${a.id}:${b.id}" ${a.id === b.id || tem.has(`${a.id}:${b.id}`) ? 'checked' : ''} ${a.id === b.id ? 'disabled' : ''}>
              <span>${esc(b.nome)}${a.id === b.id ? ' <span class="suave pequeno">(sempre)</span>' : ''}</span>
            </label>`).join('')}
        </div>`).join('')}
      <p class="suave pequeno">Para criar, renomear ou apagar equipes, use o menu <a href="#/equipes">Equipes</a>.</p>`,
    mudanca: async (e) => {
      const cb = e.target.closest('[data-perm]');
      if (!cb) return;
      const [areaId, verId] = cb.dataset.perm.split(':').map(Number);
      cb.disabled = true;
      try {
        if (cb.checked) await gravar('permissoes_visualizacao', { area_id: areaId, pode_ver_area_id: verId });
        else await apagar('permissoes_visualizacao', { area_id: areaId, pode_ver_area_id: verId });
        aviso('Permissão atualizada ✓');
      } catch (err) {
        cb.checked = !cb.checked;
        aviso(traduzErro(err), true);
      } finally {
        cb.disabled = false;
      }
    },
  };
}

// Cada líder pode trocar a senha inicial que recebeu do admin.
// Só o administrador troca a própria senha pelo app; líderes falam com o administrador
// (o Supabase também recusa a troca feita pela conta de um líder).
function abrirTrocarSenha() {
  if (!eAdmin()) return;
  abrirFormulario({
    titulo: 'Alterar senha',
    ajuda: 'Escolha uma senha nova, com pelo menos 6 caracteres.',
    campos: [
      { nome: 'senha', rotulo: 'Nova senha', tipo: 'password', obrigatorio: true, autocomplete: 'new-password' },
      { nome: 'senha2', rotulo: 'Repita a nova senha', tipo: 'password', obrigatorio: true, autocomplete: 'new-password' },
    ],
    textoSalvar: 'Alterar senha',
    avisoSalvo: 'Senha alterada ✓',
    aoSalvar: async (d) => {
      if ((d.senha || '').length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      if (d.senha !== d.senha2) throw new Error('As senhas não são iguais.');
      const { error } = await db.auth.updateUser({ password: d.senha });
      if (error) throw error;
    },
  });
}


async function copiarTexto(texto, msg = 'Texto copiado ✓') {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  aviso(msg);
}


function ehLouvor(areaId) { return semAcento(nomeArea(areaId)).includes('louvor'); }


function idLouvor() { return estado.areas.find((a) => semAcento(a.nome).includes('louvor'))?.id ?? null; }


// Troca a música de lugar e renumera a lista (1, 2, 3…), gravando só o que mudou.
async function moverMusica(musicas, id, delta) {
  const i = musicas.findIndex((m) => m.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= musicas.length) return;
  const nova = musicas.slice();
  [nova[i], nova[j]] = [nova[j], nova[i]];
  for (let k = 0; k < nova.length; k++) {
    const m = nova[k];
    if (m.ordem !== k + 1 && podeEditar(m.area_id)) await gravar('musicas', { ordem: k + 1 }, m.id);
  }
}


// Admin: escolhe o ministério antes de abrir o editor de escala.
function escolherMinisterio(continuar) {
  abrirFormulario({
    titulo: 'Escala de qual ministério?',
    campos: [{ nome: 'area_id', rotulo: 'Ministério', tipo: 'select', obrigatorio: true, numero: true, opcoes: opcoesAreas() }],
    textoSalvar: 'Continuar',
    avisoSalvo: null,
    aoSalvar: async (d) => { setTimeout(() => continuar(d.area_id), 0); },
  });
}


// Editor da escala de um ministério num evento: várias linhas "Função — Quem vai atuar",
// em texto livre, sem ligação com o cadastro de membros.
function abrirEditorEscala(ev, areaId, existentes, depois) {
  const dica = dicaMinisterio(areaId);
  const sugestoes = [...new Set([...existentes.map((e) => e.funcao), ...(dica.funcoes || FUNCOES_SUGERIDAS)])];
  const nomes = [...new Set([...(dica.nomes || []), ...existentes.map((e) => e.nome)])];
  const sufixo = Math.random().toString(36).slice(2, 7);
  const idLista = 'funcoes-' + sufixo;
  const idNomes = 'nomes-' + sufixo;
  const linhaHTML = (r = {}) => `
    <div class="linha-escala" ${r.id ? `data-id="${r.id}"` : ''}>
      <input type="text" class="f-funcao" placeholder="Função" aria-label="Função" value="${esc(r.funcao || '')}" list="${idLista}" autocomplete="off">
      <input type="text" class="f-nome" placeholder="Quem vai atuar" aria-label="Quem vai atuar" value="${esc(r.nome || '')}" ${nomes.length ? `list="${idNomes}"` : ''} autocomplete="off">
      <button type="button" class="btn-icone" data-remover aria-label="Remover linha">✕</button>
    </div>`;
  const d = abrirJanela(`Escala · ${nomeArea(areaId)}`, `
    <p class="suave pequeno" style="margin-top:-.5rem">${esc(capital(dataLonga(ev.data)))}${ev.horario ? ' · ' + esc(hora(ev.horario)) : ''} · ${esc(ev.titulo)}</p>
    ${dica.dica ? `<p class="dica-escala pequeno">${esc(dica.dica)}</p>` : ''}
    <div class="cab-escala suave pequeno"><span>Função</span><span>Quem vai atuar</span><span></span></div>
    <div class="linhas-escala">${(existentes.length ? existentes : [{}, {}]).map(linhaHTML).join('')}</div>
    <datalist id="${idLista}">${sugestoes.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
    ${nomes.length ? `<datalist id="${idNomes}">${nomes.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>` : ''}
    <button type="button" class="btn-texto" data-add style="padding-left:0">+ Adicionar linha</button>
    <p class="suave pequeno">Se houver duas pessoas com o mesmo nome, escreva o sobrenome (ex.: Ana Souza).</p>
    <p class="erro" hidden></p>
    <div class="acoes">
      <button type="button" class="btn secundario" data-fechar>Cancelar</button>
      <button type="button" class="btn" data-salvar>Salvar escala</button>
    </div>`);
  const cont = $('.linhas-escala', d);
  const erro = $('.erro', d);
  const btn = $('[data-salvar]', d);

  d.addEventListener('click', async (e) => {
    if (e.target.closest('[data-add]')) {
      cont.insertAdjacentHTML('beforeend', linhaHTML());
      const nova = cont.lastElementChild;
      anima(nova, { opacity: [0, 1], y: [6, 0] }, { duration: 0.2 });
      $('.f-funcao', nova).focus();
      return;
    }
    const rm = e.target.closest('[data-remover]');
    if (rm) {
      rm.closest('.linha-escala').remove();
      if (!cont.children.length) cont.insertAdjacentHTML('beforeend', linhaHTML());
      return;
    }
    if (!e.target.closest('[data-salvar]')) return;

    erro.hidden = true;
    const linhas = [...cont.children].map((el) => ({
      id: el.dataset.id ? Number(el.dataset.id) : null,
      funcao: $('.f-funcao', el).value.trim(),
      nome: $('.f-nome', el).value.trim(),
    })).filter((l) => l.funcao || l.nome);
    if (linhas.some((l) => !l.funcao || !l.nome)) {
      erro.textContent = 'Preencha a função e o nome em todas as linhas (ou remova a linha que sobrou).';
      erro.hidden = false;
      anima(erro, { x: [-6, 6, -4, 4, 0] }, { duration: 0.3 });
      return;
    }
    const mantidos = new Set(linhas.filter((l) => l.id).map((l) => l.id));
    const remover = existentes.filter((x) => !mantidos.has(x.id));
    const alterar = linhas.filter((l) => {
      if (!l.id) return false;
      const o = existentes.find((x) => x.id === l.id);
      return o && (o.funcao !== l.funcao || o.nome !== l.nome);
    });
    const novos = linhas.filter((l) => !l.id).map((l) => ({ evento_id: ev.id, area_id: areaId, funcao: l.funcao, nome: l.nome }));

    btn.disabled = true;
    btn.textContent = 'Salvando…';
    try {
      for (const r of remover) await apagar('escalas', { id: r.id });
      for (const a of alterar) await gravar('escalas', { funcao: a.funcao, nome: a.nome }, a.id);
      if (novos.length) {
        const { error } = await db.from('escalas').insert(novos);
        if (error) throw error;
      }
      await fecharJanela(d);
      aviso('Escala salva ✓');
      depois();
    } catch (err) {
      erro.textContent = traduzErro(err);
      erro.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Salvar escala';
    }
  });
  const primeiro = $('.f-funcao', d);
  if (primeiro && !('ontouchstart' in window)) primeiro.focus();
}

// Aniversariantes do mês (0 a 11), do cadastro geral de membros. Só o admin consegue ler.
async function buscarAniversariantes(mes) {
  const { data, error } = await db.from('membros').select('id, nome, data_nascimento, telefone').not('data_nascimento', 'is', null);
  if (error) throw error;
  return (data || [])
    .filter((m) => Number(m.data_nascimento.slice(5, 7)) - 1 === mes)
    .sort((a, b) => a.data_nascimento.slice(8).localeCompare(b.data_nascimento.slice(8)) || a.nome.localeCompare(b.nome));
}


function textoAniversariantes(lista, mes) {
  return [`Aniversariantes de ${MESES[mes]}:`, ...lista.map((m) => `${m.data_nascimento.slice(8)}/${m.data_nascimento.slice(5, 7)} — ${m.nome}`)].join('\n');
}


function blocoAniversariantes(lista, mes) {
  const anoAtual = new Date().getFullYear();
  return `<section class="secao card">
    <div class="secao-topo"><h2>Aniversariantes de ${MESES[mes]}</h2>
      ${lista.length ? '<button class="btn peq" type="button" data-acao="copiar-aniv">Copiar lista de aniversariantes</button>' : ''}</div>
    ${lista.length ? `<ul class="lista">${lista.map((m) => {
      const ano = Number(m.data_nascimento.slice(0, 4));
      const idade = ano !== Number(ANO_DESCONHECIDO) ? anoAtual - ano : null;
      return `<li><span class="ordem">${m.data_nascimento.slice(8)}</span>
        <div class="cresce"><strong>${esc(m.nome)}</strong>${idade ? `<div class="suave pequeno">faz ${idade} anos</div>` : ''}</div>
        ${m.telefone ? `<a class="pequeno" href="tel:${esc(m.telefone.replace(/[^\d+]/g, ''))}">${esc(m.telefone)}</a>` : ''}</li>`;
    }).join('')}</ul>` : '<p class="vazio">Nenhum aniversariante neste mês.</p>'}
  </section>`;
}


// Lê um calendário em CSV (ou colado de uma planilha). Colunas aceitas:
// data, horario, titulo, tipo, ministerio, observacoes (só data e título são obrigatórios).
function interpretarEventos(texto, anoPadrao) {
  const linhas = lerCSV(texto);
  const eventos = [];
  const avisos = [];
  if (!linhas.length) return { eventos, avisos };
  const cab = linhas[0].map(semAcento);
  const achar = (...nomes) => cab.findIndex((c) => nomes.some((n) => c === n || c.startsWith(n)));
  let iData = achar('data', 'dia');
  let iHora = achar('horario', 'hora');
  let iTit = achar('titulo', 'evento', 'nome', 'descricao');
  let iTipo = achar('tipo');
  let iMin = achar('ministerio', 'equipe', 'area');
  let iObs = achar('observ', 'obs');
  let inicio = 1;
  if (iData === -1 || iTit === -1) { iData = 0; iHora = 1; iTit = 2; iTipo = 3; iMin = 4; iObs = 5; inicio = 0; }
  const areaPorNome = new Map(estado.areas.map((a) => [semAcento(a.nome), a.id]));
  const valor = (l, i) => (i >= 0 ? (l[i] || '').trim() : '');

  for (let n = inicio; n < linhas.length; n++) {
    const l = linhas[n];
    const titulo = valor(l, iTit);
    const dataBruta = valor(l, iData);
    if (!titulo && !dataBruta) continue;
    const data = parseDataEvento(dataBruta, anoPadrao);
    if (!data) { avisos.push(`Linha ${n + 1}: data "${dataBruta}" não reconhecida (linha ignorada).`); continue; }
    if (!titulo) { avisos.push(`Linha ${n + 1}: sem título (linha ignorada).`); continue; }
    const horaBruta = valor(l, iHora);
    const horario = parseHora(horaBruta);
    if (horaBruta && !horario) avisos.push(`Linha ${n + 1}: horário "${horaBruta}" não reconhecido (importado sem horário).`);
    const tipoBruto = semAcento(valor(l, iTipo) || titulo);
    const tipo = tipoBruto.includes('ensaio') ? 'ensaio' : tipoBruto.includes('reuni') ? 'reuniao' : 'culto';
    const minBruto = valor(l, iMin);
    let areaId = null;
    if (minBruto) {
      areaId = areaPorNome.get(semAcento(minBruto)) ?? null;
      if (areaId == null) avisos.push(`Linha ${n + 1}: ministério "${minBruto}" não existe (importado como Geral).`);
    }
    eventos.push({ data, horario, titulo, tipo, area_id: areaId, observacoes: valor(l, iObs) || null });
  }
  return { eventos, avisos };
}


// "12/01/2027", "12/01" (usa o ano padrão), "2027-01-12".
function parseDataEvento(s, anoPadrao) {
  s = String(s ?? '').trim();
  let r = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let d; let m; let a;
  if (r) { a = +r[1]; m = +r[2]; d = +r[3]; } else {
    r = s.match(/^(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2}|\d{4}))?$/);
    if (!r) return null;
    d = +r[1]; m = +r[2];
    a = r[3] ? +r[3] : anoPadrao;
    if (r[3] && r[3].length === 2) a += 2000;
  }
  const dt = new Date(a, m - 1, d);
  if (dt.getFullYear() !== a || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return isoLocal(dt);
}


// "19:30", "19h30", "19h", "9" → "HH:MM"
function parseHora(s) {
  s = String(s ?? '').trim().toLowerCase();
  if (!s) return null;
  const r = s.match(/^(\d{1,2})(?:[:h](\d{2})?)?h?$/);
  if (!r) return null;
  const h = +r[1]; const mi = r[2] ? +r[2] : 0;
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}


// Importar eventos (só admin): prévia, aviso de possível duplicado e de outros eventos no mesmo dia.
function abrirImportacaoEventos() {
  const hoje = new Date();
  const anoPadrao = hoje.getMonth() >= 9 ? hoje.getFullYear() + 1 : hoje.getFullYear();
  const d = abrirJanela('Importar eventos', `
    <p class="suave pequeno" style="margin-top:-.5rem">Uma linha por evento. Colunas: <b>data</b>, <b>horario</b>, <b>titulo</b>, tipo, ministerio, observacoes (com ou sem cabeçalho; vírgula ou ponto e vírgula).</p>
    <div class="grade-2">
      <label class="campo"><span>Ano das datas sem ano</span><input type="number" data-ano value="${anoPadrao}" min="2000" max="2100"></label>
      <label class="campo"><span>Arquivo .csv</span><input type="file" accept=".csv,text/csv,text/plain"></label>
    </div>
    <label class="campo"><span>Ou cole a lista</span><textarea rows="5" placeholder="data;horario;titulo;ministerio&#10;12/01/2027;19:30;Culto de Dança;Dança&#10;12/01/2027;19:30;Culto de Louvor;Louvor"></textarea></label>
    <div class="previa"></div>
    <p class="erro" hidden></p>
    <div class="acoes">
      <button type="button" class="btn secundario" data-fechar>Cancelar</button>
      <button type="button" class="btn" data-importar disabled>Importar</button>
    </div>`);
  const area = $('textarea', d);
  const anoInput = $('[data-ano]', d);
  const arquivo = $('input[type=file]', d);
  const previa = $('.previa', d);
  const erro = $('.erro', d);
  const btn = $('[data-importar]', d);
  let linhas = [];
  let espera;
  let versao = 0;
  const norm = (s) => semAcento(s).replace(/\s+/g, ' ');
  const rotulo = (e) => `${e.titulo}${e.horario ? ' ' + hora(e.horario) : ''}`;

  const atualizarBotao = () => {
    const n = linhas.filter((l) => l.marcado).length;
    btn.disabled = !n;
    btn.textContent = n ? `Importar ${n} evento(s)` : 'Importar';
  };

  const analisar = async () => {
    const minhaVersao = ++versao;
    erro.hidden = true;
    const { eventos, avisos } = interpretarEventos(area.value, Number(anoInput.value) || anoPadrao);
    if (!eventos.length) {
      linhas = [];
      previa.innerHTML = area.value.trim() ? `<p class="vazio">Nenhum evento reconhecido.</p>${avisos.length ? `<ul class="suave pequeno">${avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}` : '';
      atualizarBotao();
      return;
    }
    const datas = eventos.map((e) => e.data).sort();
    const { data: existentes, error } = await db.from('eventos').select('id, data, horario, titulo')
      .gte('data', datas[0]).lte('data', datas[datas.length - 1]);
    if (minhaVersao !== versao) return;
    if (error) { erro.textContent = traduzErro(error); erro.hidden = false; return; }

    linhas = eventos.map((ev, i) => {
      const doDia = (existentes || []).filter((x) => x.data === ev.data);
      const antes = eventos.slice(0, i).filter((x) => x.data === ev.data);
      const dup = doDia.find((x) => norm(x.titulo) === norm(ev.titulo));
      const dupLista = antes.find((x) => norm(x.titulo) === norm(ev.titulo));
      const outros = [
        ...doDia.filter((x) => x !== dup).map((x) => rotulo(x)),
        ...antes.filter((x) => x !== dupLista).map((x) => rotulo(x) + ' (desta lista)'),
      ];
      return {
        ev,
        duplicado: dup ? `Possível duplicado: "${rotulo(dup)}" já está cadastrado neste dia.` : dupLista ? 'Possível duplicado: repetido nesta lista.' : null,
        mesmoDia: outros.length ? `Neste dia também tem: ${outros.join('; ')}. Os dois ficam no calendário.` : null,
        marcado: !dup && !dupLista,
      };
    });
    const nDup = linhas.filter((l) => l.duplicado).length;
    const nDia = linhas.filter((l) => l.mesmoDia && !l.duplicado).length;
    previa.innerHTML = `
      <p><strong>${linhas.length}</strong> evento(s) na lista.${nDup ? ` <span class="aviso-dup">${nDup} possível(is) duplicado(s), desmarcado(s).</span>` : ''}${nDia ? ` <span class="suave">${nDia} com outro evento no mesmo dia.</span>` : ''}</p>
      <div class="lista-import">${linhas.map((l, i) => `
        <label class="linha-import ${l.duplicado ? 'dup' : ''}">
          <input type="checkbox" data-i="${i}" ${l.marcado ? 'checked' : ''}>
          <span class="cresce">
            <strong>${esc(l.ev.data.split('-').reverse().join('/'))}</strong> ${esc(hora(l.ev.horario) || 'sem horário')} — ${esc(l.ev.titulo)}
            <span class="selo cinza">${esc(NOMES_TIPO_EVENTO[l.ev.tipo])}</span>${l.ev.area_id ? ` <span class="selo cinza">${esc(nomeArea(l.ev.area_id))}</span>` : ''}
            ${l.duplicado ? `<span class="aviso-dup aviso-linha">${esc(l.duplicado)} Marque para importar mesmo assim.</span>` : ''}
            ${l.mesmoDia ? `<span class="aviso-dia aviso-linha">${esc(l.mesmoDia)}</span>` : ''}
          </span>
        </label>`).join('')}</div>
      ${avisos.length ? `<ul class="suave pequeno">${avisos.slice(0, 20).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
    atualizarBotao();
  };
  const agendar = () => { clearTimeout(espera); espera = setTimeout(analisar, 400); };

  area.addEventListener('input', agendar);
  anoInput.addEventListener('input', agendar);
  previa.addEventListener('change', (e) => {
    const cb = e.target.closest('[data-i]');
    if (cb) { linhas[Number(cb.dataset.i)].marcado = cb.checked; atualizarBotao(); }
  });
  arquivo.addEventListener('change', async () => {
    const f = arquivo.files[0];
    if (!f) return;
    let texto = await f.text();
    if (texto.includes('�')) {
      texto = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsText(f, 'windows-1252'); });
    }
    area.value = texto;
    analisar();
  });
  btn.addEventListener('click', async () => {
    const escolhidos = linhas.filter((l) => l.marcado).map((l) => l.ev);
    if (!escolhidos.length) return;
    btn.disabled = true;
    erro.hidden = true;
    try {
      for (let i = 0; i < escolhidos.length; i += 100) {
        btn.textContent = `Importando ${Math.min(i + 100, escolhidos.length)}/${escolhidos.length}…`;
        const { error } = await db.from('eventos').insert(escolhidos.slice(i, i + 100));
        if (error) throw error;
      }
      await fecharJanela(d);
      aviso(`${escolhidos.length} evento(s) importado(s) ✓`);
      roteador(true);
    } catch (err) {
      erro.textContent = traduzErro(err) + ' (os lotes anteriores ao erro já foram salvos)';
      erro.hidden = false;
      atualizarBotao();
    }
  });
}


// Abertura: a marca aparece no centro e se encaixa no canto superior esquerdo.
function abertura() {
  const marcaAb = $('#abertura-marca');
  const alvo = $('#marca');
  if (!marcaAb || !alvo || menosMovimento.matches || !marcaAb.animate) { document.body.classList.remove('abrindo'); return; }
  document.body.classList.add('abrindo');
  const escala = window.innerWidth < 600 ? 2 : 2.6;
  const fim = () => document.body.classList.remove('abrindo');
  marcaAb.animate(
    [{ opacity: 0, transform: `scale(${escala * 0.94})` }, { opacity: 1, transform: `scale(${escala})` }],
    { duration: 380, easing: 'ease-out', fill: 'forwards' },
  );
  setTimeout(() => {
    const a = marcaAb.getBoundingClientRect();
    const b = alvo.getBoundingClientRect();
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    const anim = marcaAb.animate(
      [{ opacity: 1, transform: `translate(0, 0) scale(${escala})` }, { opacity: 1, transform: `translate(${dx}px, ${dy}px) scale(1)` }],
      { duration: 520, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'forwards' },
    );
    anim.onfinish = fim;
    setTimeout(fim, 900); // garantia, caso a animação não termine (aba em segundo plano)
  }, 700);
}


// Avatar com a inicial + nome ("Davi ▾"), com Alterar senha e Sair.
function configurarMenuUsuario() {
  const botao = $('#btn-usuario');
  const menu = $('#menu-usuario');
  const fechar = () => { menu.hidden = true; botao.setAttribute('aria-expanded', 'false'); };
  botao.addEventListener('click', (e) => {
    e.stopPropagation();
    const abrir = menu.hidden;
    menu.hidden = !abrir;
    botao.setAttribute('aria-expanded', String(abrir));
    if (abrir) { anima(menu, { opacity: [0, 1], y: [-4, 0] }, { duration: 0.2 }); $('button', menu)?.focus(); }
  });
  document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('#usuario')) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { fechar(); botao.focus(); } });
  $('#btn-senha').addEventListener('click', () => { fechar(); abrirTrocarSenha(); });
  $('#btn-sair').addEventListener('click', () => { fechar(); sair(); });
}


function tamanhoLegivel(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}


// Cartão "Materiais para o Audiovisual": arquivos de áudio/vídeo e links por evento.
function htmlMateriais(materiais, podeEnviar) {
  const icone = (m) => m.tipo === 'link'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>'
    : /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(m.caminho || '')
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="13" height="13" rx="2.5"/><path d="M16 10l5-3v10l-5-3z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>';
  const campoMinisterio = eAdmin()
    ? `<label class="campo"><span>Ministério que está enviando</span><select name="area_id" required>
        <option value="">Escolha…</option>${estado.areas.map((a) => `<option value="${a.id}">${esc(a.nome)}</option>`).join('')}</select></label>`
    : '';
  return `<section class="secao card" id="materiais">
    <div class="secao-topo"><h2>Materiais para o Audiovisual</h2>
      ${podeEnviar ? '<button class="btn peq" type="button" data-acao="abrir-material">+ Enviar material</button>' : ''}</div>
    ${podeEnviar ? `<form class="form-material" id="form-material" hidden>
      <div class="segmentado" role="radiogroup" aria-label="Tipo de material">
        <label><input type="radio" name="tipo" value="arquivo" checked> Arquivo de áudio ou vídeo</label>
        <label><input type="radio" name="tipo" value="link"> Link</label>
      </div>
      ${campoMinisterio}
      <label class="campo"><span>Nome</span><input type="text" name="nome" placeholder="Ex.: Playback da abertura" autocomplete="off"></label>
      <label class="campo" data-tipo="arquivo"><span>Arquivo (até 50 MB)</span><input type="file" name="arquivo" accept="audio/*,video/*"></label>
      <label class="campo" data-tipo="link" hidden><span>Link</span><input type="url" name="url" placeholder="https://drive.google.com/…" autocomplete="off"></label>
      <label class="campo"><span>Quando usar? (opcional)</span><input type="text" name="quando_usar" placeholder="Ex.: Após a abertura" autocomplete="off"></label>
      <p class="erro" hidden></p>
      <div class="acoes" style="margin-top:0">
        <button type="button" class="btn secundario" data-acao="abrir-material">Cancelar</button>
        <button type="submit" class="btn">Enviar</button>
      </div>
    </form>` : ''}
    ${materiais.length ? `<ul class="lista lista-materiais">${materiais.map((m) => `
      <li>
        <span class="material-icone">${icone(m)}</span>
        <div class="cresce">
          <div class="material-nome">${esc(m.nome)}</div>
          <div class="suave pequeno">${[esc(nomeArea(m.area_id)), m.quando_usar ? `Quando usar: ${esc(m.quando_usar)}` : '', m.tipo === 'arquivo' ? tamanhoLegivel(m.tamanho) : ''].filter(Boolean).join(' · ')}</div>
        </div>
        <span class="material-acoes">
          <button class="btn peq secundario" type="button" data-acao="baixar-material" data-id="${m.id}">${m.tipo === 'link' ? 'Abrir link' : 'Baixar'}</button>
          ${podeEditar(m.area_id) ? `<button class="btn-icone" type="button" data-acao="apagar-material" data-id="${m.id}" aria-label="Apagar material">✕</button>` : ''}
        </span>
      </li>`).join('')}</ul>` : '<p class="vazio">Nenhum material enviado para este evento.</p>'}
  </section>`;
}


function ligarFormMaterial(ev) {
  const form = $('#form-material');
  if (!form) return;
  const erro = $('.erro', form);
  const btn = $('[type=submit]', form);
  const trocarTipo = () => {
    const tipo = form.tipo.value;
    form.querySelectorAll('[data-tipo]').forEach((el) => { el.hidden = el.dataset.tipo !== tipo; });
  };
  form.addEventListener('change', (e) => { if (e.target.name === 'tipo') trocarTipo(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erro.hidden = true;
    const areaId = eAdmin() ? Number(form.area_id.value) || null : estado.lider.area_id;
    const dados = {
      tipo: form.tipo.value,
      nome: form.nome.value.trim(),
      url: form.url.value.trim(),
      quando_usar: form.quando_usar.value.trim() || null,
    };
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    try {
      if (!areaId) throw new Error('Escolha o ministério que está enviando.');
      await enviarMaterial(ev, areaId, dados, form.arquivo.files[0]);
      aviso('Material enviado ✓');
      roteador(true);
    } catch (err) {
      erro.textContent = traduzErro(err);
      erro.hidden = false;
      anima(erro, { x: [-6, 6, -4, 4, 0] }, { duration: 0.3 });
      btn.disabled = false;
      btn.textContent = 'Enviar';
    }
  });
}


// Arquivo vai para o bucket privado "materiais" em <evento>/<ministério>/<arquivo>;
// as regras do Storage conferem o ministério pelo caminho.
async function enviarMaterial(ev, areaId, dados, arquivo) {
  const LIMITE = 50 * 1024 * 1024;
  if (dados.tipo === 'link') {
    let url = dados.url;
    if (!url) throw new Error('Cole o link do material.');
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { new URL(url); } catch { throw new Error('Link inválido.'); }
    const nome = dados.nome || new URL(url).hostname.replace(/^www\./, '');
    const { error } = await db.from('materiais').insert({ evento_id: ev.id, area_id: areaId, tipo: 'link', nome, url, quando_usar: dados.quando_usar });
    if (error) throw error;
    return;
  }
  if (!arquivo) throw new Error('Escolha um arquivo de áudio ou vídeo.');
  if (!/^(audio|video)\//.test(arquivo.type)) throw new Error('O arquivo precisa ser de áudio ou vídeo.');
  if (arquivo.size > LIMITE) {
    throw new Error(`O arquivo tem ${tamanhoLegivel(arquivo.size)}. O limite do plano gratuito é 50 MB por arquivo. Envie um link (Google Drive, YouTube…) no lugar.`);
  }
  const nomeSeguro = semAcento(arquivo.name).replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'arquivo';
  const caminho = `${ev.id}/${areaId}/${Date.now()}-${nomeSeguro}`;
  const { error: e1 } = await db.storage.from('materiais').upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
  if (e1) throw e1;
  const { error: e2 } = await db.from('materiais').insert({
    evento_id: ev.id, area_id: areaId, tipo: 'arquivo',
    nome: dados.nome || arquivo.name, caminho, tamanho: arquivo.size, quando_usar: dados.quando_usar,
  });
  if (e2) {
    await db.storage.from('materiais').remove([caminho]);
    throw e2;
  }
}


// Arquivo: link temporário (5 min) gerado pelo Supabase só para quem pode ver. Link: abre em nova aba.
async function baixarMaterial(m, botao) {
  if (m.tipo === 'link') {
    const url = linkSeguro(m.url);
    if (url) window.open(url, '_blank', 'noopener');
    return;
  }
  const texto = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Preparando…';
  try {
    const nomeArquivo = (m.caminho.split('/').pop() || 'material').replace(/^\d+-/, '');
    const { data, error } = await db.storage.from('materiais').createSignedUrl(m.caminho, 300, { download: nomeArquivo });
    if (error) throw error;
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.rel = 'noopener';
    document.body.append(a);
    a.click();
    a.remove();
  } catch (err) {
    aviso(traduzErro(err), true);
  } finally {
    botao.disabled = false;
    botao.textContent = texto;
  }
}


async function apagarMaterial(m) {
  if (m.caminho) {
    const { error } = await db.storage.from('materiais').remove([m.caminho]);
    if (error) throw error;
  }
  await apagar('materiais', { id: m.id });
}


// Segunda-feira da semana de uma data (a semana vai de segunda a domingo)
function inicioSemana(dt) {
  const d = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}


function somaDias(dt, n) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
}


// Ex.: "23 a 29 de novembro", "30 de novembro a 6 de dezembro"
function tituloSemana(ini) {
  const f = somaDias(ini, 6);
  const anoAtual = new Date().getFullYear();
  if (ini.getFullYear() !== f.getFullYear()) {
    return `${ini.getDate()} de ${MESES[ini.getMonth()]} de ${ini.getFullYear()} a ${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
  }
  const sufixoAno = f.getFullYear() !== anoAtual ? ` de ${f.getFullYear()}` : '';
  if (ini.getMonth() !== f.getMonth()) return `${ini.getDate()} de ${MESES[ini.getMonth()]} a ${f.getDate()} de ${MESES[f.getMonth()]}${sufixoAno}`;
  return `${ini.getDate()} a ${f.getDate()} de ${MESES[f.getMonth()]}${sufixoAno}`;
}


function ordemHorario(a, b) {
  return (a.data || '').localeCompare(b.data || '')
    || (a.horario ? (b.horario ? a.horario.localeCompare(b.horario) : -1) : (b.horario ? 1 : 0));
}


// Cria no banco as ocorrências dos eventos semanais até a data vista (cada uma vira um evento próprio)
async function garantirOcorrencias(ate) {
  if (ate < isoLocal(new Date())) return;
  if (estado.geradoAte && estado.geradoAte >= ate) return;
  const { error } = await db.rpc('gerar_ocorrencias', { p_ate: ate });
  if (error) { console.warn('Eventos semanais:', error.message); return; }
  estado.geradoAte = ate;
}


// Cartão de evento nas listas do calendário. modo "semana" mostra o horário à esquerda; "mes", a data.
// extra.semEscala: a equipe do líder marcou "sem escala" nesta data. extra.naSerie: dentro da série (sem selo).
function cartaoEvento(e, modo, extra = {}) {
  const dt = deISO(e.data);
  const feito = !!e.concluido_em;
  const dot = feito
    ? '<span class="status-dot concluido" title="Concluído" aria-label="Concluído"></span>'
    : eAdmin()
      ? `<button type="button" class="status-dot pendente botao-dot" data-acao="concluir" data-id="${e.id}" aria-label="Marcar ${esc(e.titulo)} de ${esc(dataLonga(e.data))} como concluído" title="Pendente: toque para concluir"></button>`
      : '<span class="status-dot pendente" title="Pendente" aria-label="Pendente"></span>';
  const bloco = modo === 'semana'
    ? `<div class="evento-data hora-bloco"><b>${esc(hora(e.horario) || '—')}</b></div>`
    : `<div class="evento-data"><b>${dt.getDate()}</b><small>${DIAS_ABREV[dt.getDay()]}</small></div>`;
  const meta = [modo === 'semana' ? null : (hora(e.horario) || 'Sem horário'), extra.naSerie ? null : (NOMES_TIPO_EVENTO[e.tipo] || e.tipo), !extra.naSerie && e.area_id ? nomeArea(e.area_id) : null]
    .filter(Boolean).map(esc).join(' · ');
  return `<div class="card evento-linha ${feito ? 'feito' : ''}">
    ${dot}
    <a class="evento-link" href="#/evento/${e.id}">
      ${bloco}
      <div class="cresce">
        <strong class="evento-nome">${esc(extra.naSerie ? capital(dataLonga(e.data)) : e.titulo)}</strong>
        <div class="suave">${meta}${e.recorrencia_id && !extra.naSerie ? '<span class="selo semanal"><span class="status-dot recorrente"></span>Semanal</span>' : ''}${feito ? ' · concluído' : ''}${extra.semEscala ? '<span class="selo sem-escala">Sem escala necessária</span>' : ''}</div>
      </div>
      <span aria-hidden="true" class="suave">›</span>
    </a>
  </div>`;
}

function cartaoReuniao(r, modo) {
  const dt = deISO(r.data);
  const bloco = modo === 'semana'
    ? `<div class="evento-data hora-bloco"><b>${esc(hora(r.horario) || '—')}</b></div>`
    : `<div class="evento-data"><b>${dt.getDate()}</b><small>${DIAS_ABREV[dt.getDay()]}</small></div>`;
  const feita = !!r.concluido_em;
  const meta = [modo === 'semana' ? null : (hora(r.horario) || 'Sem horário'), 'Reunião', r.local, feita ? 'realizada' : null].filter(Boolean).map(esc).join(' · ');
  return `<div class="card evento-linha reuniao-linha ${feita ? 'feito' : ''}">
    <span class="status-dot ${feita ? 'concluido' : 'reuniao'}" title="${feita ? 'Reunião realizada' : 'Reunião'}" aria-label="${feita ? 'Reunião realizada' : 'Reunião'}"></span>
    <a class="evento-link" href="#/reuniao/${r.id}">
      ${bloco}
      <div class="cresce"><strong class="evento-nome">${esc(r.titulo)}</strong><div class="suave">${meta}</div></div>
      <span aria-hidden="true" class="suave">›</span>
    </a>
  </div>`;
}


// Sugestões da escala conforme o ministério (função e, quando faz sentido, nome)
function dicaMinisterio(areaId) {
  const n = semAcento(nomeArea(areaId));
  return DICAS_MINISTERIO.find((d) => n.includes(d.chave)) || {};
}


// Reuniões: o admin agenda; cada líder responde Vou ou Não vou (e pode mudar a resposta).
// O admin vê, por reunião, quem confirmou, quem recusou e quem está sem resposta.
async function telaReunioes(ctx, idFoco) {
  const hojeIso = isoLocal(new Date());
  const vazio = { data: [], error: null };
  const [rR, rS, rL] = await Promise.all([
    idFoco ? db.from('reunioes').select('*').eq('id', idFoco)
      : db.from('reunioes').select('*').order('data').order('horario', { nullsFirst: false }),
    db.from('respostas_reuniao').select('*'),
    eAdmin() ? db.from('lideres').select('id, nome, papel, area_id').eq('papel', 'lider').order('nome') : vazio,
  ]);
  if (ctx.velho()) return;
  for (const r of [rR, rS, rL]) if (r.error) throw r.error;
  const reunioes = rR.data || [];
  const respostas = rS.data || [];
  const lideres = rL.data || [];

  const cartao = (r) => {
    const resps = respostas.filter((x) => x.reuniao_id === r.id);
    const realizada = !!r.concluido_em;
    const passada = r.data < hojeIso || realizada; // depois de realizada, a resposta não muda mais
    let corpo;
    if (!eAdmin()) {
      const minha = resps.find((x) => x.lider_id === estado.lider.id)?.resposta;
      const textoMinha = minha ? `Sua resposta: <strong>${minha === 'vou' ? 'Vou' : 'Não vou'}</strong>` : 'Você ainda não respondeu.';
      corpo = passada
        ? `<p class="suave pequeno">${textoMinha}</p>`
        : `<div class="resposta-reuniao">
          <span class="suave pequeno">${textoMinha}</span>
          <div class="segmentado" role="group" aria-label="Sua resposta para ${esc(r.titulo)}">
            <button type="button" data-acao="responder" data-id="${r.id}" data-resposta="vou" aria-pressed="${minha === 'vou'}" class="vou ${minha === 'vou' ? 'ativa' : ''}">Vou</button>
            <button type="button" data-acao="responder" data-id="${r.id}" data-resposta="nao_vou" aria-pressed="${minha === 'nao_vou'}" class="nao ${minha === 'nao_vou' ? 'ativa' : ''}">Não vou</button>
          </div>
        </div>`;
    } else {
      const de = (resp) => lideres.filter((l) => resps.some((x) => x.lider_id === l.id && x.resposta === resp));
      const vao = de('vou');
      const nao = de('nao_vou');
      const sem = lideres.filter((l) => !resps.some((x) => x.lider_id === l.id));
      const lista = (ls) => (ls.length
        ? ls.map((l) => `<li>${esc(l.nome)} <span class="suave pequeno">· ${esc(nomeArea(l.area_id))}</span></li>`).join('')
        : '<li class="vazio">Ninguém</li>');
      corpo = `
        <div class="contagem-respostas">
          <span class="selo vou">${vao.length} ${vao.length === 1 ? 'confirmou' : 'confirmaram'}</span>
          <span class="selo nao">${nao.length} ${nao.length === 1 ? 'recusou' : 'recusaram'}</span>
          <span class="selo cinza">${sem.length} sem resposta</span>
        </div>
        <details class="respostas-detalhe" ${idFoco ? 'open' : ''}>
          <summary>Ver quem respondeu</summary>
          <div class="grupos-resposta">
            <div><h4>Confirmaram</h4><ul>${lista(vao)}</ul></div>
            <div><h4>Recusaram</h4><ul>${lista(nao)}</ul></div>
            <div><h4>Sem resposta</h4><ul>${lista(sem)}</ul></div>
          </div>
        </details>`;
    }
    return `<article class="card reuniao-card ${passada ? 'passada' : ''}" id="reuniao-${r.id}">
      <div class="linha-entre">
        <h3><span class="status-dot ${realizada ? 'concluido' : 'reuniao'}" aria-hidden="true"></span> ${esc(r.titulo)}</h3>
        ${eAdmin() ? `<button class="btn-icone" type="button" data-acao="editar-reuniao" data-id="${r.id}" aria-label="Editar ${esc(r.titulo)}">✎</button>` : ''}
      </div>
      ${realizada ? '<span class="selo concluido-selo"><span class="status-dot concluido"></span> Realizada</span>' : ''}
      <p class="suave reuniao-quando">${esc(capital(dataLonga(r.data)))}${r.horario ? ` · ${esc(hora(r.horario))}` : ''}${r.local ? ` · ${esc(r.local)}` : ''}</p>
      ${r.pauta ? `<p class="texto-nota">${esc(r.pauta)}</p>` : ''}
      ${corpo}
      ${eAdmin() ? `<div class="acoes-reuniao">${realizada
        ? `<button class="btn peq secundario" type="button" data-acao="reabrir-reuniao" data-id="${r.id}">Reabrir reunião</button>`
        : `<button class="btn peq secundario btn-realizado" type="button" data-acao="concluir-reuniao" data-id="${r.id}"><span class="status-dot concluido" aria-hidden="true"></span> Marcar como realizada</button>`}</div>` : ''}
    </article>`;
  };

  let html;
  if (idFoco) {
    html = `<a class="btn-texto" href="#/reunioes" style="padding-left:0">← Reuniões</a>
      ${reunioes.length ? cartao(reunioes[0]) : '<div class="card"><p>Reunião não encontrada.</p></div>'}`;
  } else {
    const proximas = reunioes.filter((r) => r.data >= hojeIso && !r.concluido_em);
    const anteriores = reunioes.filter((r) => r.data < hojeIso || r.concluido_em).reverse().slice(0, 12);
    html = `
      <div class="secao-topo"><h1 style="margin:0">Reuniões</h1>
        ${eAdmin() ? '<button class="btn peq" type="button" data-acao="nova-reuniao">+ Reunião</button>' : ''}</div>
      <p class="suave">${eAdmin() ? 'Agende as reuniões e acompanhe as respostas dos líderes.' : 'Responda se você vai a cada reunião. Dá para mudar a resposta depois.'}</p>
      ${proximas.length ? proximas.map(cartao).join('') : '<div class="card"><p class="vazio">Nenhuma reunião marcada.</p></div>'}
      ${anteriores.length ? `<details class="secao anteriores"><summary>Reuniões anteriores (${anteriores.length})</summary>${anteriores.map(cartao).join('')}</details>` : ''}`;
  }
  mostrar(ctx, html);

  app.onclick = async (e) => {
    const b = e.target.closest('[data-acao]');
    if (!b || b.disabled) return;
    const acao = b.dataset.acao;
    if (acao === 'nova-reuniao') abrirFormReuniao(null);
    else if (acao === 'concluir-reuniao' || acao === 'reabrir-reuniao') {
      // Só o admin: reunião realizada (bolinha verde no calendário) ou de volta para as próximas
      if (!eAdmin()) return;
      const concluir = acao === 'concluir-reuniao';
      if (!(await confirmar(concluir ? 'Marcar esta reunião como realizada?' : 'Voltar esta reunião para as próximas?', concluir ? 'Marcar como realizada' : 'Reabrir', 'btn'))) return;
      try {
        await gravar('reunioes', concluir ? { concluido_em: new Date().toISOString(), concluido_por: estado.lider.id } : { concluido_em: null, concluido_por: null }, Number(b.dataset.id));
        aviso(concluir ? 'Reunião realizada ✓' : 'Reunião reaberta ✓');
        roteador(true);
      } catch (err) {
        aviso(traduzErro(err), true);
      }
    }
    else if (acao === 'editar-reuniao') abrirFormReuniao(reunioes.find((r) => r.id === Number(b.dataset.id)));
    else if (acao === 'responder') {
      const grupo = b.parentElement.querySelectorAll('button');
      grupo.forEach((x) => { x.disabled = true; });
      const { error } = await db.from('respostas_reuniao').upsert({
        reuniao_id: Number(b.dataset.id), lider_id: estado.lider.id, resposta: b.dataset.resposta, respondido_em: new Date().toISOString(),
      }, { onConflict: 'reuniao_id,lider_id' });
      if (error) { aviso(traduzErro(error), true); grupo.forEach((x) => { x.disabled = false; }); return; }
      aviso('Resposta salva ✓');
      roteador(true);
    }
  };
}


function abrirFormReuniao(r) {
  if (!eAdmin()) return;
  abrirFormulario({
    titulo: r ? 'Editar reunião' : 'Nova reunião',
    campos: [
      { nome: 'titulo', rotulo: 'Título', obrigatorio: true, placeholder: 'Ex.: Reunião de líderes' },
      { nome: 'data', rotulo: 'Data', tipo: 'date', obrigatorio: true },
      { nome: 'horario', rotulo: 'Horário', tipo: 'time' },
      { nome: 'local', rotulo: 'Local (opcional)', placeholder: 'Ex.: Salão da igreja' },
      { nome: 'pauta', rotulo: 'Pauta (opcional)', tipo: 'textarea', linhas: 3 },
    ],
    valores: r ? { ...r, horario: hora(r.horario) } : { data: isoLocal(new Date()) },
    aoSalvar: async (dados) => {
      const salvo = await gravar('reunioes', dados, r?.id);
      if (!r) location.hash = `#/reuniao/${salvo.id}`;
      else roteador(true);
    },
    aoExcluir: r ? async () => {
      await apagar('reunioes', { id: r.id });
      location.hash = '#/reunioes';
    } : null,
    confirmarExcluir: 'Excluir esta reunião? As respostas dos líderes também serão apagadas.',
  });
}


// Eventos semanais (ADM): cada semana vira um evento próprio, com data, escala e conclusão separadas.
async function adminRecorrencias() {
  const { data, error } = await db.from('recorrencias').select('*').order('titulo');
  if (error) throw error;
  const lista = data || [];
  const nomeDias = (ds) => ORDEM_SEMANA.filter((d) => (ds || []).includes(d)).map((d) => DIAS_SEMANA[d]).join(', ') || 'nenhum dia';
  return {
    html: `
      <div class="secao-topo"><h2>Eventos semanais</h2><button class="btn peq" type="button" data-acao="nova-rec">+ Evento semanal</button></div>
      <p class="suave pequeno">Cada semana vira um evento no calendário, com bolinha roxa, e tem escala e conclusão próprias. Desligado fica pendente e não aparece no calendário.</p>
      <div class="card"><ul class="lista">${lista.length ? lista.map((r) => `
        <li><span class="status-dot recorrente" aria-hidden="true"></span>
          <div class="cresce"><strong>${esc(r.titulo)}</strong>
            <div class="suave pequeno">${esc(nomeDias(r.dias))} · ${r.horario ? esc(hora(r.horario)) : 'horário a confirmar'} · ${esc(NOMES_TIPO_EVENTO[r.tipo] || r.tipo)}${r.area_id ? ` · ${esc(nomeArea(r.area_id))}` : ''}</div>
            <div class="linha"><span class="selo ${r.ativa ? 'vou' : 'lembrete'}">${r.ativa ? 'Ativo' : 'Pendente (desligado)'}</span>${r.fim ? `<span class="selo cinza">até ${esc(r.fim.slice(8))}/${esc(r.fim.slice(5, 7))}/${esc(r.fim.slice(0, 4))}</span>` : ''}</div></div>
          <button class="btn-icone" type="button" data-acao="editar-rec" data-id="${r.id}" aria-label="Editar ${esc(r.titulo)}">✎</button></li>`).join('')
        : '<li class="vazio">Nenhum evento semanal.</li>'}</ul></div>`,
    clique: (b) => {
      if (b.dataset.acao === 'nova-rec') abrirFormRecorrencia(null);
      else if (b.dataset.acao === 'editar-rec') abrirFormRecorrencia(lista.find((r) => r.id === Number(b.dataset.id)));
    },
  };
}


function abrirFormRecorrencia(r) {
  abrirFormulario({
    titulo: r ? 'Editar evento semanal' : 'Novo evento semanal',
    campos: [
      { nome: 'titulo', rotulo: 'Título', obrigatorio: true, placeholder: 'Ex.: Escola Talmidim' },
      { nome: 'dias', rotulo: 'Dias da semana', tipo: 'dias', converter: (v) => v.map(Number).sort((a, b) => a - b) },
      { nome: 'horario', rotulo: 'Horário', tipo: 'time', ajuda: 'Deixe em branco se ainda não foi confirmado.' },
      { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', obrigatorio: true, opcoes: Object.entries(NOMES_TIPO_EVENTO).filter(([k]) => k !== 'reuniao') },
      { nome: 'area_id', rotulo: 'Ministério responsável', tipo: 'select', numero: true, opcoes: opcoesAreas(), vazio: 'Geral (toda a igreja)' },
      { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea', linhas: 2 },
      { nome: 'ativa', rotulo: 'Ativo (aparece no calendário)', tipo: 'checkbox' },
    ],
    valores: r ? { ...r, horario: hora(r.horario) } : { tipo: 'culto', dias: [], ativa: true },
    ajuda: 'Mudanças valem para as próximas datas ainda não concluídas. Datas que já têm escala não são apagadas.',
    aoSalvar: async (d) => {
      if (d.ativa && !d.dias.length) throw new Error('Escolha pelo menos um dia da semana.');
      const salvo = await gravar('recorrencias', d, r?.id);
      const { error } = await db.rpc('aplicar_recorrencia', { p_id: salvo.id });
      if (error) throw error;
      estado.geradoAte = null;
      roteador(true);
    },
    aoExcluir: r ? async () => {
      await gravar('recorrencias', { ativa: false }, r.id);
      const { error } = await db.rpc('aplicar_recorrencia', { p_id: r.id });
      if (error) throw error;
      await apagar('recorrencias', { id: r.id });
      roteador(true);
    } : null,
    confirmarExcluir: 'Excluir este evento semanal? As próximas datas sem escala saem do calendário; as que já passaram ou têm escala continuam.',
  });
}


// No + Evento: Reunião esconde ministério e repetição e mostra Local e Pauta;
// "Repetir toda semana" mostra a prévia (ex.: "Todo domingo às 19h") antes de salvar.
function ligarFormEventoNovo(d) {
  const form = $('form', d);
  const el = form.elements;
  const caixa = (nome) => el[nome].closest('.campo, .campo-check');
  const previa = document.createElement('p');
  previa.className = 'previa-repeticao';
  previa.setAttribute('aria-live', 'polite');
  caixa('repetir').after(previa);
  const rotuloObs = $('span', caixa('observacoes'));
  const atualizar = () => {
    const reuniao = el.tipo.value === 'reuniao';
    caixa('area_id').hidden = reuniao;
    caixa('repetir').hidden = reuniao;
    caixa('local').hidden = !reuniao;
    rotuloObs.textContent = reuniao ? 'Pauta (opcional)' : 'Observações';
    const mostrar = !reuniao && el.repetir.checked && !!el.data.value;
    previa.hidden = !mostrar;
    if (mostrar) previa.innerHTML = `<span class="status-dot recorrente" aria-hidden="true"></span> ${esc(textoRecorrencia([deISO(el.data.value).getDay()], el.horario.value))}`;
  };
  form.addEventListener('input', atualizar);
  form.addEventListener('change', atualizar);
  atualizar();
}


// Pergunta "Só este evento" ou "Este e os próximos". Resolve 'este', 'proximos' ou null (cancelou).
function escolherEscopo(titulo, pergunta, textoOk, classeOk, explicacoes) {
  return new Promise((resolver) => {
    let escolha = null;
    const d = abrirJanela(titulo, `
      <p>${esc(pergunta)}</p>
      <div class="opcoes-escopo" role="radiogroup" aria-label="${esc(titulo)}">
        <label class="opcao-escopo"><input type="radio" name="escopo" value="este" checked>
          <span><strong>Só este evento</strong><small>${esc(explicacoes.este)}</small></span></label>
        <label class="opcao-escopo"><input type="radio" name="escopo" value="proximos">
          <span><strong>Este e os próximos</strong><small>${esc(explicacoes.proximos)}</small></span></label>
      </div>
      <div class="acoes">
        <button type="button" class="btn secundario" data-fechar>Cancelar</button>
        <button type="button" class="${classeOk}" data-ok>${esc(textoOk)}</button>
      </div>`);
    $('[data-ok]', d).addEventListener('click', () => {
      escolha = $('input[name=escopo]:checked', d).value;
      fecharJanela(d);
    });
    d._aoFechar.push(() => resolver(escolha));
  });
}


// Ex.: "Todo domingo às 19h", "Toda terça às 7h30", "Toda semana: segunda e quarta"
function textoRecorrencia(dias, horario) {
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const ds = ORDEM_SEMANA.filter((x) => (dias || []).map(Number).includes(x));
  if (!ds.length) return 'Sem dia definido';
  const lista = ds.map((x) => nomes[x]);
  const prefixo = ds.length > 1 ? 'Toda semana:' : (ds[0] === 0 || ds[0] === 6 ? 'Todo' : 'Toda');
  const juntos = lista.length > 1 ? `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}` : lista[0];
  const h = horaCurta(horario);
  return `${prefixo} ${juntos}${h ? ` às ${h}` : ''}`;
}


// "19:00" → "19h"; "07:30" → "7h30"
function horaCurta(t) {
  if (!t) return '';
  const [h, m] = t.slice(0, 5).split(':');
  return `${Number(h)}h${m !== '00' ? m : ''}`;
}


// Antes de apagar eventos: tira do Storage os arquivos de materiais deles
async function removerArquivosEventos(ids) {
  if (!ids.length) return;
  const { data: mats } = await db.from('materiais').select('caminho').in('evento_id', ids).not('caminho', 'is', null);
  const caminhos = (mats || []).map((m) => m.caminho);
  if (caminhos.length) await db.storage.from('materiais').remove(caminhos);
}


// "Pular escala desta data": vale só para aquele ministério naquele evento. O evento continua no calendário.
async function pularEscala(eventoId, areaId) {
  const msg = eAdmin() && areaId !== estado.lider.area_id
    ? `Marcar esta data como sem escala para ${nomeArea(areaId)}?`
    : 'Marcar esta data como sem escala para sua equipe?';
  if (!(await confirmar(msg, 'Marcar sem escala', 'btn'))) return;
  const { error } = await db.from('escalas_dispensadas').insert({ evento_id: eventoId, area_id: areaId, dispensado_por: estado.lider.id });
  if (error && error.code !== '23505') { aviso(traduzErro(error), true); return; }
  aviso('Sem escala necessária ✓');
  roteador(true);
}


async function desfazerPulo(eventoId, areaId) {
  const { error } = await db.from('escalas_dispensadas').delete().match({ evento_id: eventoId, area_id: areaId });
  if (error) { aviso(traduzErro(error), true); return; }
  aviso('Desfeito: a escala desta data voltou a ficar pendente.');
  roteador(true);
}


// Campo "Nova senha" com olhinho (mostra ou oculta só o que foi digitado nesta janela) e Copiar.
// A senha atual de ninguém é lida nem exibida: o banco guarda só o hash.
function campoSenhaHTML(c, valor = '', somenteLeitura = false) {
  return `<label class="campo campo-senha"><span>${esc(c.rotulo)}</span>
    <span class="senha-caixa">
      <input type="password" name="${c.nome}" value="${esc(valor)}" ${c.obrigatorio ? 'required' : ''} ${somenteLeitura ? 'readonly' : ''}
        minlength="6" maxlength="72" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false">
      <button type="button" class="btn-icone senha-olho" data-olho aria-label="Mostrar senha" aria-pressed="false" title="Mostrar senha">${ICONES.olho}</button>
      <button type="button" class="btn peq secundario" data-copiar-senha>Copiar</button>
    </span>
    ${c.ajuda ? `<small class="suave pequeno">${esc(c.ajuda)}</small>` : ''}</label>`;
}


// Liga o olhinho e o Copiar dos campos de senha dentro de uma janela
function ligarCamposSenha(raiz) {
  raiz.addEventListener('click', async (e) => {
    const olho = e.target.closest('[data-olho]');
    const copiar = e.target.closest('[data-copiar-senha]');
    if (!olho && !copiar) return;
    e.preventDefault();
    const input = (olho || copiar).closest('.senha-caixa').querySelector('input');
    if (olho) {
      const mostrar = input.type === 'password';
      input.type = mostrar ? 'text' : 'password';
      olho.setAttribute('aria-pressed', String(mostrar));
      olho.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      olho.title = mostrar ? 'Ocultar senha' : 'Mostrar senha';
      olho.innerHTML = mostrar ? ICONES.olhoFechado : ICONES.olho;
      return;
    }
    if (!input.value) { aviso('Digite a senha primeiro.', true); input.focus(); return; }
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      const tipo = input.type;
      input.type = 'text';
      input.select();
      document.execCommand('copy');
      input.type = tipo;
      input.setSelectionRange(0, 0);
    }
    aviso('Senha copiada ✓ Mande no privado.');
  });
}


// Depois de criar a conta ou redefinir a senha: mostra a senha recém-digitada (oculta, com olhinho)
// para copiar antes de fechar. Ao fechar, o campo é apagado e a senha não aparece de novo.
function mostrarSenhaDefinida(titulo, nome, email, senha) {
  const d = abrirJanela(titulo, `
    <p style="margin-top:0"><strong>${esc(nome)}</strong><br><span class="suave">${esc(email || '')}</span></p>
    ${campoSenhaHTML({ nome: 'senha_definida', rotulo: 'Senha definida agora' }, senha, true)}
    <p class="suave pequeno">Copie e mande no privado. Ela não fica guardada no app e não vai aparecer de novo. Para trocar de novo, use "Redefinir senha" aqui em Líderes.</p>
    <div class="acoes"><button type="button" class="btn" data-fechar>Fechar</button></div>`);
  ligarCamposSenha(d);
  d._aoFechar.push(() => { const i = $('input', d); if (i) i.value = ''; });
}


/* ---------------------------------------------------------------------
   Realtime: quando alguém muda algo, a tela atual se atualiza sozinha
   --------------------------------------------------------------------- */
function assinarRealtime() {
  if (estado.canal) return;
  let espera;
  const aoMudar = () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      if (!['calendario', 'evento', 'telao', 'historico', 'equipe', 'ministerio', 'reunioes', 'reuniao'].includes(rotaAtual().nome)) return;
      if (document.querySelector('dialog[open]') || (document.querySelector('#form-material') && !document.querySelector('#form-material').hidden)) { estado.pendente = true; return; }
      roteador(true);
    }, 400);
  };
  estado.canal = db.channel('mudancas-igreja');
  for (const tabela of ['eventos', 'itens_programa', 'musicas', 'escalas', 'escalas_dispensadas', 'materiais', 'reunioes', 'respostas_reuniao']) {
    estado.canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, aoMudar);
  }
  estado.canal.subscribe();
}

/* ---------------------------------------------------------------------
   Dica única para instalar no iPhone
   --------------------------------------------------------------------- */
function dicaIOS() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalado = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (!ios || instalado) return;
  try {
    if (localStorage.getItem('dica-ios-vista')) return;
    localStorage.setItem('dica-ios-vista', '1');
  } catch {
    return;
  }
  const d = document.createElement('div');
  d.className = 'card dica-ios';
  d.innerHTML = `<p style="margin-top:0"><strong>Instale o app:</strong> toque em Compartilhar e depois em <strong>Adicionar à Tela de Início</strong>.</p>
    <div class="acoes" style="margin-top:0"><button class="btn peq" type="button">Entendi</button></div>`;
  document.body.append(d);
  anima(d, { opacity: [0, 1], y: [16, 0] }, { duration: 0.3 });
  $('button', d).addEventListener('click', async () => {
    await esperar(anima(d, { opacity: [1, 0], y: [0, 16] }, { duration: 0.2 }));
    d.remove();
  });
}

/* ---------------------------------------------------------------------
   Fundo: luz fluida em WebGL atrás de todas as telas
   --------------------------------------------------------------------- */
// Fundo de luz fluida (WebGL), a mesma técnica da capa da Cantina Vicenza, nas cores do Qhall.
// Login: ritmo normal. Dentro do app: luz mais fraca e cerca de um terço da velocidade, para não
// atrapalhar a leitura (a troca é suave). Telão: ainda mais lento. "Reduzir movimento": quadro parado.
// Sem WebGL, fica o degradê estático do CSS.
function ajustarFundo() {
  const palco = $('.fundo-animado');
  const canvas = palco && $('.fundo-luz', palco);
  if (!canvas) return;
  let gl = null;
  try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false }); } catch { gl = null; }
  if (!gl) return;

  const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  // ruído simplex 3D: webgl-noise (Ian McEwan, Stefan Gustavson / Ashima Arts), licença MIT
  const FS = [
    'precision mediump float;',
    'uniform vec2 uRes; uniform float uTime; uniform float uPx; uniform float uInt;',
    'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}',
    'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
    'float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);',
    'vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;',
    'vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;',
    'i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
    'float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);',
    'vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
    'vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
    'vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);',
    'vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
    'vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;',
    'return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}',
    'float fbm(vec3 p){float s=0.0,a=0.55;for(int i=0;i<3;i++){s+=a*snoise(p);p*=1.9;a*=0.45;}return s;}',
    'void main(){',
    '  vec2 px = gl_FragCoord.xy / uPx;',
    '  vec2 q = px / 1150.0;',
    '  float t = uTime * 0.03;',
    '  vec2 w = vec2(fbm(vec3(q * 0.8, t)), fbm(vec3(q * 0.8 + 4.7, t + 3.1)));',
    '  float r = fbm(vec3(q + 0.9 * w, t * 0.7 + 7.0));',
    '  float luz = smoothstep(-0.35, 0.75, r);',
    // azul-marinho do app, azul médio e brilho azul (no lugar dos verdes da Cantina)
    '  vec3 base = vec3(0.036, 0.075, 0.170);',
    '  vec3 meio = vec3(0.075, 0.165, 0.390);',
    '  vec3 brilho = vec3(0.180, 0.380, 0.800);',
    '  vec3 c = mix(base, meio, luz);',
    '  c += brilho * pow(luz, 2.4) * 0.35;',
    '  c = mix(base, c, uInt);',
    '  gl_FragColor = vec4(c, 1.0);',
    '}',
  ].join('\n');

  const compilar = (tipo, src) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    console.warn('[fundo] mantendo o degradê estático:', err);
    return;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uPx = gl.getUniformLocation(prog, 'uPx');
  const uInt = gl.getUniformLocation(prog, 'uInt');

  // Resolução baixa: a luz é difusa, então 0,35 px por px CSS basta (leve no celular)
  const ESCALA = 0.35;
  const medir = () => {
    const w = palco.clientWidth || innerWidth, h = palco.clientHeight || innerHeight;
    canvas.width = Math.max(1, Math.round(w * ESCALA));
    canvas.height = Math.max(1, Math.round(h * ESCALA));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uPx, canvas.width / w);
  };
  // Ritmo e intensidade de cada tela: login = 1; app = 0,35 (mais fraca); telão = 0,2
  const alvo = () => {
    const b = document.body.classList;
    if (b.contains('modo-telao')) return { ritmo: 0.2, int: 0.55 };
    if (b.contains('sem-menu')) return { ritmo: 1, int: 1 };
    return { ritmo: 0.35, int: 0.72 };
  };
  const TEMPO_PARADO = 18;
  let tempo = TEMPO_PARADO;
  let { ritmo, int } = alvo();
  const desenhar = () => {
    gl.uniform1f(uTime, tempo);
    gl.uniform1f(uInt, int);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  let ultimo = 0;
  const quadro = (agora) => {
    requestAnimationFrame(quadro);
    if (document.hidden || menosMovimento.matches) { ultimo = agora; return; }
    if (agora - ultimo < 33) return; // ~30 quadros/s: a luz é lenta
    const dt = Math.min((agora - (ultimo || agora)) / 1000, 0.1);
    ultimo = agora;
    const a = alvo();
    ritmo += (a.ritmo - ritmo) * 0.04; // troca de ritmo e de brilho sem pulo
    int += (a.int - int) * 0.04;
    tempo += dt * ritmo;
    desenhar();
  };

  medir();
  desenhar(); // primeiro quadro (e o quadro parado com "reduzir movimento")
  document.documentElement.classList.add('fluido-ativo');
  window.__fundo = { estado: () => ({ tempo, ritmo, int }) };

  if ('ResizeObserver' in window) new ResizeObserver(() => { medir(); desenhar(); }).observe(palco);
  else addEventListener('resize', () => { medir(); desenhar(); });
  // Com "reduzir movimento": o quadro parado acompanha o brilho da tela (login ou app)
  const parado = () => { if (menosMovimento.matches) { tempo = TEMPO_PARADO; ({ ritmo, int } = alvo()); desenhar(); } };
  menosMovimento.addEventListener?.('change', parado);
  new MutationObserver(parado).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  requestAnimationFrame(quadro);
}

/* ---------------------------------------------------------------------
   Início
   --------------------------------------------------------------------- */
function iniciar() {
  configurarMenuUsuario();
  abertura();
  ajustarFundo();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  if (!window.supabase?.createClient) {
    app.innerHTML = '<div class="card"><p class="erro">Não foi possível carregar o Supabase. Verifique a internet e recarregue a página.</p></div>';
    return;
  }
  if (SUPABASE_URL.includes('SEU-PROJETO') || SUPABASE_ANON_KEY.startsWith('COLE_AQUI')) {
    app.innerHTML = '<div class="card"><h2>Falta configurar</h2><p>Abra o arquivo <code>app.js</code> e preencha <code>SUPABASE_URL</code> e <code>SUPABASE_ANON_KEY</code> (veja o README).</p></div>';
    return;
  }

  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
  // A documentação do Supabase recomenda não chamar o banco dentro do callback; por isso o setTimeout.
  db.auth.onAuthStateChange((evento, sessao) => setTimeout(() => aoMudarAuth(evento, sessao), 0));
}

iniciar();
