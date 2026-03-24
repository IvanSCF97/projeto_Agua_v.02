// ============================================================
//  ESTADO GLOBAL
// ============================================================
const A = {
    // Água
    metaLitros: 2.0,
    intervaloMin: 60,
    mlPorCopo: 250,
    atrasoFamiliar: 2,
    copos: [],
    aguaRestante: 60,
    aguaTotal: 60,
    atrasosSeguidos: 0,
    timerAgua: null,

    // Medicamentos
    medicamentos: [],
    medAtual: null,
    medAtrasos: 0,

    // Diário
    registrosPressao: [],
    registrosGlicemia: [],
    diarioAba: 'pressao',
    momentoGlicemia: 'Jejum',
};

// Demos de medicamentos
const medDemo = [
    { id:1, nome:'Losartana',  dose:'50mg — 1 comprimido',  inst:'Tomar com água',    hora:'08:00', periodo:'Manhã', status:'pendente' },
    { id:2, nome:'Metformina', dose:'500mg — 1 comprimido', inst:'Tomar após almoço', hora:'13:00', periodo:'Tarde', status:'pendente' },
    { id:3, nome:'Atenolol',   dose:'25mg — 1 comprimido',  inst:'Tomar com água',    hora:'20:00', periodo:'Noite', status:'pendente' },
];

// Demos do diário (últimos 7 dias)
function gerarDemoDiario() {
    const pressoes = [
        { sistolica:128, diastolica:82, obs:'Após repouso' },
        { sistolica:135, diastolica:88, obs:'Antes do café' },
        { sistolica:122, diastolica:78, obs:'Após caminhada' },
        { sistolica:140, diastolica:92, obs:'Estressado' },
        { sistolica:118, diastolica:76, obs:'Após almoço' },
        { sistolica:132, diastolica:85, obs:'' },
        { sistolica:125, diastolica:80, obs:'Manhã tranquila' },
    ];
    const glicemias = [
        { valor:98,  momento:'Jejum',          obs:'' },
        { valor:142, momento:'Pós-refeição',   obs:'Após macarrão' },
        { valor:88,  momento:'Jejum',          obs:'' },
        { valor:165, momento:'Pós-refeição',   obs:'Após jantar' },
        { valor:95,  momento:'Jejum',          obs:'' },
        { valor:110, momento:'Antes de dormir',obs:'' },
        { valor:102, momento:'Jejum',          obs:'' },
    ];

    const agora = new Date();
    pressoes.forEach((p, i) => {
        const d = new Date(agora);
        d.setDate(d.getDate() - (6 - i));
        d.setHours(8, 0, 0, 0);
        A.registrosPressao.push({
            id: i + 1,
            sistolica: p.sistolica,
            diastolica: p.diastolica,
            obs: p.obs,
            data: d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
            hora: '08:00',
            ts: d.getTime(),
        });
    });

    glicemias.forEach((g, i) => {
        const d = new Date(agora);
        d.setDate(d.getDate() - (6 - i));
        d.setHours(7, 30, 0, 0);
        A.registrosGlicemia.push({
            id: i + 1,
            valor: g.valor,
            momento: g.momento,
            obs: g.obs,
            data: d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
            hora: '07:30',
            ts: d.getTime(),
        });
    });
}

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
function init() {
    atualizarData();
    atualizarSaudacao();
    A.medicamentos = medDemo.map(m => ({...m}));
    gerarDemoDiario();
    A.aguaRestante = A.intervaloMin;
    A.aguaTotal    = A.intervaloMin;
    renderCopos();
    renderCopo();
    renderMeds();
    iniciarTimerAgua();
    verificarAlarmesMed();
}

function atualizarData() {
    document.getElementById('data-hoje').innerText =
        new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function atualizarSaudacao() {
    const h = new Date().getHours();
    document.getElementById('saudacao').innerText =
        (h < 12 ? 'Bom dia,' : h < 18 ? 'Boa tarde,' : 'Boa noite,');
}

// ============================================================
//  NAVEGAÇÃO PRINCIPAL
// ============================================================
function mudarAba(aba) {
    document.getElementById('tela-agua').style.display = aba === 'agua' ? 'flex' : 'none';
    document.getElementById('tela-med').style.display  = aba === 'med'  ? 'flex' : 'none';
    document.getElementById('aba-agua').classList.toggle('aba-ativa', aba === 'agua');
    document.getElementById('aba-med').classList.toggle('aba-ativa',  aba === 'med');
}

// ============================================================
//  TIMER ÁGUA
// ============================================================
function iniciarTimerAgua() {
    clearInterval(A.timerAgua);
    A.timerAgua = setInterval(tickAgua, 1000);
    renderRingAgua();
}

function tickAgua() {
    if (A.aguaRestante > 0) {
        A.aguaRestante--;
        renderRingAgua();
    } else {
        clearInterval(A.timerAgua);
        document.getElementById('modal-tempo-agua').innerText = A.aguaTotal;
        document.getElementById('aviso-familiar-agua').style.display = 'none';
        abrirModal('modal-alerta-agua');
    }
}

function renderRingAgua() {
    const circ = 326.7;
    const pct  = A.aguaRestante / A.aguaTotal;
    const ring = document.getElementById('ring-agua');
    ring.style.strokeDashoffset = circ * (1 - pct);
    ring.className = 'ring-prog ring-azul';
    if (pct <= 0.15) ring.classList.add('ring-urgente');
    else if (pct <= 0.35) ring.classList.add('ring-atencao');
    document.getElementById('timer-agua-num').innerText = A.aguaRestante;
}

// ============================================================
//  AÇÕES ÁGUA
// ============================================================
function registrarAgua() {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    A.copos.push({ hora, ml: A.mlPorCopo });
    A.atrasosSeguidos = 0;
    A.aguaRestante = A.intervaloMin;
    A.aguaTotal    = A.intervaloMin;
    renderCopos(); renderCopo(); iniciarTimerAgua(); animarBtnAgua();
}

function registrarAguaModal() {
    fecharModal('modal-alerta-agua');
    registrarAgua();
}

function adiarAguaAlerta() {
    A.atrasosSeguidos++;
    fecharModal('modal-alerta-agua');
    if (A.atrasosSeguidos >= A.atrasoFamiliar) {
        setTimeout(() => {
            document.getElementById('aviso-familiar-agua').style.display = 'block';
            abrirModal('modal-alerta-agua');
        }, 300);
    }
    A.aguaRestante = 10;
    A.aguaTotal    = 10;
    iniciarTimerAgua();
}

function animarBtnAgua() {
    const btn = document.getElementById('btn-agua');
    const lbl = document.getElementById('btn-agua-label');
    if (totalMl() >= A.metaLitros * 1000) {
        btn.classList.add('btn-verde'); btn.classList.remove('btn-azul');
        lbl.innerText = 'Meta atingida! 🎉';
    } else {
        btn.style.transform = 'scale(0.96)';
        setTimeout(() => btn.style.transform = '', 180);
    }
}

function totalMl() { return A.copos.reduce((s,c) => s + c.ml, 0); }

function renderCopo() {
    const pct    = Math.min(totalMl() / (A.metaLitros * 1000), 1);
    const litros = (totalMl() / 1000).toFixed(1).replace('.', ',');
    const meta   = A.metaLitros.toFixed(1).replace('.', ',');
    const nCopos = A.copos.length;
    const mCopos = Math.round((A.metaLitros * 1000) / A.mlPorCopo);

    document.getElementById('copo-fill').style.height   = (pct * 100) + '%';
    document.getElementById('copo-ondas').style.bottom  = (pct * 100) + '%';
    document.getElementById('copo-litros').innerText    = litros + ' L';
    document.getElementById('meta-label').innerText     = meta;
    document.getElementById('copos-texto').innerText    = nCopos + ' de ' + mCopos + ' copos hoje';
    document.getElementById('historico-sub').innerText  = nCopos === 0 ? 'Nenhum registro' : totalMl() + ' ml registrados';
}

function renderCopos() {
    const grid  = document.getElementById('copos-grid');
    const total = Math.round((A.metaLitros * 1000) / A.mlPorCopo);
    grid.innerHTML = '';
    for (let i = 0; i < total; i++) {
        const tomado = i < A.copos.length;
        const div = document.createElement('div');
        div.className = 'copo-item' + (tomado ? ' tomado' : '');
        div.innerHTML = tomado
            ? `<div class="copo-bolinha"><span style="font-size:14px">💧</span></div><span class="copo-hora">${A.copos[i].hora}</span>`
            : `<div class="copo-bolinha"><div class="copo-vazio-dot"></div></div><span class="copo-hora">--:--</span>`;
        grid.appendChild(div);
    }
}

// Config água
function setMeta(btn) {
    document.querySelectorAll('[data-meta]').forEach(b => b.classList.remove('config-opt-on'));
    btn.classList.add('config-opt-on');
    A.metaLitros = parseFloat(btn.dataset.meta);
    renderCopo(); renderCopos();
}

function setIntervalo(btn) {
    document.querySelectorAll('[data-int]').forEach(b => b.classList.remove('config-opt-on'));
    btn.classList.add('config-opt-on');
    A.intervaloMin = parseInt(btn.dataset.int);
    A.aguaRestante = A.intervaloMin;
    A.aguaTotal    = A.intervaloMin;
    iniciarTimerAgua();
}

function setAtraso(btn) {
    document.querySelectorAll('[data-atraso]').forEach(b => b.classList.remove('config-opt-on'));
    btn.classList.add('config-opt-on');
    A.atrasoFamiliar = parseInt(btn.dataset.atraso);
}

// ============================================================
//  MÓDULO MEDICAMENTOS
// ============================================================
function renderMeds() {
    const lista = document.getElementById('med-lista');
    const meds  = [...A.medicamentos].sort((a,b) => a.hora.localeCompare(b.hora));

    if (meds.length === 0) {
        lista.innerHTML = `<div class="med-vazio"><span class="med-vazio-ico">💊</span><span class="med-vazio-txt">Nenhum medicamento cadastrado.</span></div>`;
        atualizarResumo(); return;
    }

    lista.innerHTML = '';
    meds.forEach(med => {
        const div = document.createElement('div');
        div.className = `med-card ${med.status}`;
        div.onclick = () => abrirAlertaMed(med.id);
        const badge = { pendente:'<span class="med-status status-pendente">Pendente</span>', tomado:'<span class="med-status status-tomado">Tomado</span>', atrasado:'<span class="med-status status-atrasado">Atrasado</span>', pulado:'<span class="med-status status-pulado">Pulado</span>' }[med.status] || '';
        div.innerHTML = `<div class="med-icone-wrap">💊</div><div class="med-info"><div class="med-nome">${med.nome}</div><div class="med-dose">${med.dose}</div></div><div class="med-meta"><span class="med-hora">${med.hora}</span>${badge}</div>`;
        lista.appendChild(div);
    });
    atualizarResumo();
}

function atualizarResumo() {
    document.getElementById('res-tomados').innerText   = A.medicamentos.filter(m => m.status === 'tomado').length;
    document.getElementById('res-pendentes').innerText = A.medicamentos.filter(m => m.status === 'pendente' || m.status === 'atrasado').length;
    document.getElementById('res-pulados').innerText   = A.medicamentos.filter(m => m.status === 'pulado').length;
}

function abrirAlertaMed(id) {
    const med = A.medicamentos.find(m => m.id === id);
    if (!med || med.status === 'tomado') return;
    A.medAtual = id; A.medAtrasos = 0;
    document.getElementById('modal-med-nome').innerText    = med.nome;
    document.getElementById('modal-med-detalhe').innerHTML = med.dose + '<br>' + med.inst;
    document.getElementById('modal-med-hora').innerText    = med.hora;
    document.getElementById('modal-med-periodo').innerText = med.periodo;
    document.getElementById('aviso-familiar-med').style.display = 'none';
    abrirModal('modal-alerta-med');
}

function confirmarMed() {
    const med = A.medicamentos.find(m => m.id === A.medAtual);
    if (!med) return;
    med.status = 'tomado';
    fecharModal('modal-alerta-med');
    renderMeds();
    mostrarOk('Medicamento registrado!', med.nome + ' — ' + med.hora + ' ✓');
}

function adiarMed() {
    A.medAtrasos++;
    fecharModal('modal-alerta-med');
    const med = A.medicamentos.find(m => m.id === A.medAtual);
    if (med) med.status = 'atrasado';
    renderMeds();
    if (A.medAtrasos >= 2) {
        setTimeout(() => { document.getElementById('aviso-familiar-med').style.display = 'block'; abrirAlertaMed(A.medAtual); }, 600);
    } else {
        setTimeout(() => abrirAlertaMed(A.medAtual), 10000);
    }
}

function pularMed() {
    const med = A.medicamentos.find(m => m.id === A.medAtual);
    if (!med) return;
    med.status = 'pulado';
    fecharModal('modal-alerta-med');
    renderMeds();
}

function verificarAlarmesMed() {
    setInterval(() => {
        const agora = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', hour12:false });
        A.medicamentos.forEach(med => {
            if (med.hora === agora && med.status === 'pendente') abrirAlertaMed(med.id);
        });
    }, 30000);
}

let periodoAtual = 'Manhã';
function setPeriodo(btn) {
    document.querySelectorAll('[data-periodo]').forEach(b => b.classList.remove('config-opt-on'));
    btn.classList.add('config-opt-on');
    periodoAtual = btn.dataset.periodo;
}

function adicionarMed() {
    const nome = document.getElementById('novo-med-nome').value.trim();
    const dose = document.getElementById('novo-med-dose').value.trim();
    const inst = document.getElementById('novo-med-inst').value.trim();
    const hora = document.getElementById('novo-med-hora').value;
    if (!nome || !hora) { document.getElementById('novo-med-nome').focus(); return; }
    A.medicamentos.push({ id: Date.now(), nome, dose: dose||'—', inst: inst||'—', hora, periodo: periodoAtual, status:'pendente' });
    ['novo-med-nome','novo-med-dose','novo-med-inst','novo-med-hora'].forEach(id => document.getElementById(id).value = '');
    fecharModal('modal-add-med');
    renderMeds();
    mostrarOk('Medicamento adicionado!', nome + ' — ' + hora);
}

// ============================================================
//  MÓDULO DIÁRIO DE SAÚDE
// ============================================================

// ---- Referências aos gráficos ----
let graficoPressao   = null;
let graficoGlicemia  = null;

// ---- Navegação do diário ----
function mudarDiarioAba(aba) {
    A.diarioAba = aba;
    document.getElementById('d-tela-pressao').style.display  = aba === 'pressao'  ? 'flex' : 'none';
    document.getElementById('d-tela-glicemia').style.display = aba === 'glicemia' ? 'flex' : 'none';
    document.getElementById('d-aba-pressao').classList.toggle('d-aba-ativa',  aba === 'pressao');
    document.getElementById('d-aba-glicemia').classList.toggle('d-aba-ativa', aba === 'glicemia');

    // Renderizar gráfico apenas quando a aba é aberta (canvas precisa estar visível)
    if (aba === 'pressao')  { renderDiarioPressao(); }
    if (aba === 'glicemia') { renderDiarioGlicemia(); }
}

// Abre o modal e inicializa a aba padrão
const _abrirModalOriginal = window.abrirModal;
function abrirModal(id) {
    document.getElementById(id).classList.add('ativo');
    if (id === 'modal-diario') {
        mudarDiarioAba(A.diarioAba);
    }
}

// ---- Classificação de pressão ----
// Referência: Diretrizes SBC 2020
function classePressao(sistolica, diastolica) {
    if (sistolica < 120 && diastolica < 80)   return { label:'Normal',     classe:'normal' };
    if (sistolica < 130 && diastolica < 85)   return { label:'Normal-alta', classe:'normal' };
    if (sistolica < 140 || diastolica < 90)   return { label:'Limítrofe',   classe:'baixo' };
    if (sistolica >= 180 || diastolica >= 110) return { label:'Crise hipertensiva', classe:'alto' };
    return { label:'Pressão alta', classe:'alto' };
}

// ---- Classificação de glicemia ----
// Referência: SBD 2022 — Jejum: normal <100, pré-DM 100-125, DM ≥126
function classeGlicemia(valor, momento) {
    if (momento === 'Jejum') {
        if (valor < 100)  return { label:'Normal', classe:'normal' };
        if (valor < 126)  return { label:'Pré-diabetes', classe:'baixo' };
        return { label:'Elevada', classe:'alto' };
    }
    // Pós-refeição (2h): normal <140, pré-DM 140-199, DM ≥200
    if (valor < 140) return { label:'Normal', classe:'normal' };
    if (valor < 200) return { label:'Atenção', classe:'baixo' };
    return { label:'Elevada', classe:'alto' };
}

// ---- Render Pressão ----
function renderDiarioPressao() {
    const regs  = [...A.registrosPressao].sort((a,b) => a.ts - b.ts);
    const hoje  = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
    const hojeR = regs.filter(r => r.data === hoje);
    const ultimo = regs[regs.length - 1];

    // Última medição
    if (ultimo) {
        const cls = classePressao(ultimo.sistolica, ultimo.diastolica);
        document.getElementById('d-pressao-ultima').innerText = ultimo.sistolica + '/' + ultimo.diastolica + ' mmHg';
        const badge = document.getElementById('d-pressao-badge');
        badge.innerText   = cls.label;
        badge.className   = 'd-metrica-badge d-badge-' + cls.classe;
        mostrarAlertaPressao(ultimo);
    }

    document.getElementById('d-pressao-hoje').innerText = hojeR.length;
    document.getElementById('d-pressao-total').innerText = regs.length + ' registros';

    renderHistoricoPressao(regs);
    renderGraficoPressao(regs);
}

function mostrarAlertaPressao(reg) {
    const el  = document.getElementById('d-alerta-pressao');
    const cls = classePressao(reg.sistolica, reg.diastolica);
    if (cls.classe === 'alto') {
        el.className = 'd-alerta d-alerta-alto';
        el.innerHTML = '⚠️ <strong>Pressão elevada</strong> — Valor acima do recomendado. Repouso e comunicar ao médico ou familiar.';
        el.style.display = 'block';
    } else if (cls.label === 'Limítrofe') {
        el.className = 'd-alerta d-alerta-baixo';
        el.innerHTML = '⚠️ <strong>Pressão limítrofe</strong> — Próxima do limite. Monitorar com frequência.';
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

function renderHistoricoPressao(regs) {
    const lista = document.getElementById('d-pressao-lista');
    if (regs.length === 0) {
        lista.innerHTML = '<div class="d-vazio">Nenhum registro ainda.</div>';
        return;
    }
    lista.innerHTML = '';
    const recentes = [...regs].reverse().slice(0, 7);
    recentes.forEach(r => {
        const cls  = classePressao(r.sistolica, r.diastolica);
        const icoCls = 'd-item-ico d-item-ico-' + cls.classe;
        const ico  = cls.classe === 'normal' ? '🩺' : cls.classe === 'alto' ? '🔴' : '🟡';
        const div  = document.createElement('div');
        div.className = 'd-item';
        div.innerHTML = `
            <div class="${icoCls}">${ico}</div>
            <div class="d-item-info">
                <div class="d-item-val">${r.sistolica}/${r.diastolica} <span style="font-size:12px;font-weight:400;color:var(--text-dim)">mmHg</span></div>
                <div class="d-item-meta">${cls.label}${r.obs ? ' · ' + r.obs : ''}</div>
            </div>
            <div class="d-item-hora">${r.data} · ${r.hora}</div>`;
        lista.appendChild(div);
    });
}

function renderGraficoPressao(regs) {
    const ultimos7 = regs.slice(-7);
    const labels   = ultimos7.map(r => r.data);
    const sistData = ultimos7.map(r => r.sistolica);
    const diastData = ultimos7.map(r => r.diastolica);

    if (graficoPressao) {
        graficoPressao.data.labels          = labels;
        graficoPressao.data.datasets[0].data = sistData;
        graficoPressao.data.datasets[1].data = diastData;
        graficoPressao.update();
        return;
    }

    const ctx = document.getElementById('grafico-pressao').getContext('2d');
    graficoPressao = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Sistólica',
                    data: sistData,
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248,113,113,0.08)',
                    borderWidth: 2,
                    pointBackgroundColor: '#f87171',
                    pointRadius: 4,
                    tension: 0.35,
                    fill: false,
                },
                {
                    label: 'Diastólica',
                    data: diastData,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56,189,248,0.08)',
                    borderWidth: 2,
                    pointBackgroundColor: '#38bdf8',
                    pointRadius: 4,
                    tension: 0.35,
                    fill: false,
                },
            ],
        },
        options: chartOptions(),
    });
}

// ---- Render Glicemia ----
function renderDiarioGlicemia() {
    const regs  = [...A.registrosGlicemia].sort((a,b) => a.ts - b.ts);
    const hoje  = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
    const hojeR = regs.filter(r => r.data === hoje);
    const ultimo = regs[regs.length - 1];

    if (ultimo) {
        const cls = classeGlicemia(ultimo.valor, ultimo.momento);
        document.getElementById('d-glicemia-ultima').innerText = ultimo.valor + ' mg/dL';
        const badge = document.getElementById('d-glicemia-badge');
        badge.innerText = cls.label;
        badge.className = 'd-metrica-badge d-badge-' + cls.classe;
        mostrarAlertaGlicemia(ultimo);
    }

    document.getElementById('d-glicemia-hoje').innerText = hojeR.length;
    document.getElementById('d-glicemia-total').innerText = regs.length + ' registros';

    renderHistoricoGlicemia(regs);
    renderGraficoGlicemia(regs);
}

function mostrarAlertaGlicemia(reg) {
    const el  = document.getElementById('d-alerta-glicemia');
    const cls = classeGlicemia(reg.valor, reg.momento);
    if (cls.classe === 'alto') {
        el.className = 'd-alerta d-alerta-alto';
        el.innerHTML = '⚠️ <strong>Glicemia elevada</strong> — Valor acima do esperado para ' + reg.momento.toLowerCase() + '. Informe o médico.';
        el.style.display = 'block';
    } else if (cls.label === 'Pré-diabetes' || cls.label === 'Atenção') {
        el.className = 'd-alerta d-alerta-baixo';
        el.innerHTML = '⚠️ <strong>' + cls.label + '</strong> — Monitorar com atenção. Consulte seu médico.';
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

function renderHistoricoGlicemia(regs) {
    const lista = document.getElementById('d-glicemia-lista');
    if (regs.length === 0) {
        lista.innerHTML = '<div class="d-vazio">Nenhum registro ainda.</div>';
        return;
    }
    lista.innerHTML = '';
    const recentes = [...regs].reverse().slice(0, 7);
    recentes.forEach(r => {
        const cls   = classeGlicemia(r.valor, r.momento);
        const icoCls = 'd-item-ico d-item-ico-' + cls.classe;
        const ico   = cls.classe === 'normal' ? '🩸' : cls.classe === 'alto' ? '🔴' : '🟡';
        const div   = document.createElement('div');
        div.className = 'd-item';
        div.innerHTML = `
            <div class="${icoCls}">${ico}</div>
            <div class="d-item-info">
                <div class="d-item-val">${r.valor} <span style="font-size:12px;font-weight:400;color:var(--text-dim)">mg/dL</span></div>
                <div class="d-item-meta">${r.momento}${r.obs ? ' · ' + r.obs : ''} · ${cls.label}</div>
            </div>
            <div class="d-item-hora">${r.data} · ${r.hora}</div>`;
        lista.appendChild(div);
    });
}

function renderGraficoGlicemia(regs) {
    const ultimos7 = regs.slice(-7);
    const labels   = ultimos7.map(r => r.data);
    const dados    = ultimos7.map(r => r.valor);

    if (graficoGlicemia) {
        graficoGlicemia.data.labels          = labels;
        graficoGlicemia.data.datasets[0].data = dados;
        graficoGlicemia.update();
        return;
    }

    const ctx = document.getElementById('grafico-glicemia').getContext('2d');
    graficoGlicemia = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Glicemia (mg/dL)',
                data: dados,
                borderColor: '#fb923c',
                backgroundColor: 'rgba(251,146,60,0.10)',
                borderWidth: 2,
                pointBackgroundColor: dados.map(v => v >= 126 ? '#f87171' : v >= 100 ? '#fbbf24' : '#34d399'),
                pointRadius: 5,
                tension: 0.35,
                fill: true,
            }],
        },
        options: {
            ...chartOptions(),
            plugins: {
                ...chartOptions().plugins,
                annotation: undefined,
            },
        },
    });
}

// ---- Opções comuns de gráfico ----
function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                labels: {
                    color: '#6e8299',
                    font: { family: 'Inter', size: 11 },
                    boxWidth: 12, boxHeight: 2,
                },
            },
            tooltip: {
                backgroundColor: '#1a2330',
                titleColor: '#eef2f7',
                bodyColor: '#6e8299',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#6e8299', font: { size: 10 } },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#6e8299', font: { size: 10 } },
            },
        },
    };
}

// ---- Registrar pressão ----
function registrarPressao() {
    const sist = parseInt(document.getElementById('p-sistolica').value);
    const dias = parseInt(document.getElementById('p-diastolica').value);
    const obs  = document.getElementById('p-obs').value.trim();

    if (!sist || !dias || sist < 60 || sist > 250 || dias < 40 || dias > 150) {
        document.getElementById('p-sistolica').focus();
        return;
    }

    const agora = new Date();
    A.registrosPressao.push({
        id: Date.now(),
        sistolica: sist, diastolica: dias, obs,
        data: agora.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
        hora: agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
        ts: agora.getTime(),
    });

    document.getElementById('p-sistolica').value = '';
    document.getElementById('p-diastolica').value = '';
    document.getElementById('p-obs').value = '';

    renderDiarioPressao();

    const cls = classePressao(sist, dias);
    if (cls.classe === 'alto') {
        mostrarOk('⚠️ Pressão elevada!', sist + '/' + dias + ' mmHg — Informe seu médico ou familiar.');
    } else {
        mostrarOk('Pressão registrada!', sist + '/' + dias + ' mmHg — ' + cls.label);
    }
}

// ---- Registrar glicemia ----
function setMomento(btn) {
    document.querySelectorAll('[data-momento]').forEach(b => b.classList.remove('config-opt-on'));
    btn.classList.add('config-opt-on');
    A.momentoGlicemia = btn.dataset.momento;
}

function registrarGlicemia() {
    const valor = parseInt(document.getElementById('g-valor').value);
    const obs   = document.getElementById('g-obs').value.trim();

    if (!valor || valor < 30 || valor > 600) {
        document.getElementById('g-valor').focus();
        return;
    }

    const agora = new Date();
    A.registrosGlicemia.push({
        id: Date.now(),
        valor, momento: A.momentoGlicemia, obs,
        data: agora.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
        hora: agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
        ts: agora.getTime(),
    });

    document.getElementById('g-valor').value = '';
    document.getElementById('g-obs').value = '';

    renderDiarioGlicemia();

    const cls = classeGlicemia(valor, A.momentoGlicemia);
    if (cls.classe === 'alto') {
        mostrarOk('⚠️ Glicemia elevada!', valor + ' mg/dL — ' + cls.label + '. Consulte seu médico.');
    } else {
        mostrarOk('Glicemia registrada!', valor + ' mg/dL — ' + cls.label);
    }
}

// ============================================================
//  MODAIS UTILITÁRIOS
// ============================================================
function fecharModal(id) {
    document.getElementById(id).classList.remove('ativo');
}

function mostrarOk(titulo, msg) {
    document.getElementById('ok-titulo').innerText = titulo;
    document.getElementById('ok-msg').innerText    = msg;
    document.getElementById('modal-ok').classList.add('ativo');
    setTimeout(() => document.getElementById('modal-ok').classList.remove('ativo'), 3500);
}

// ============================================================
//  START
// ============================================================
init();
