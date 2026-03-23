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
};

// Med de demonstração pré-carregado
const medDemo = [
    { id: 1, nome: 'Losartana',   dose: '50mg — 1 comprimido', inst: 'Tomar com água',    hora: '08:00', periodo: 'Manhã', status: 'pendente' },
    { id: 2, nome: 'Metformina',  dose: '500mg — 1 comprimido', inst: 'Tomar após almoço', hora: '13:00', periodo: 'Tarde', status: 'pendente' },
    { id: 3, nome: 'Atenolol',    dose: '25mg — 1 comprimido', inst: 'Tomar com água',    hora: '20:00', periodo: 'Noite', status: 'pendente' },
];

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
function init() {
    atualizarData();
    atualizarSaudacao();
    A.medicamentos = medDemo.map(m => ({...m}));
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
//  NAVEGAÇÃO
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
    renderCopos();
    renderCopo();
    iniciarTimerAgua();
    animarBtnAgua();
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
    const meta = totalMl() >= A.metaLitros * 1000;
    if (meta) {
        btn.classList.add('btn-verde');
        btn.classList.remove('btn-azul');
        lbl.innerText = 'Meta atingida! 🎉';
    } else {
        btn.style.transform = 'scale(0.96)';
        setTimeout(() => btn.style.transform = '', 180);
    }
}

// ============================================================
//  RENDER ÁGUA
// ============================================================
function totalMl() {
    return A.copos.reduce((s, c) => s + c.ml, 0);
}

function renderCopo() {
    const pct  = Math.min(totalMl() / (A.metaLitros * 1000), 1);
    const litros = (totalMl() / 1000).toFixed(1).replace('.', ',');
    const meta   = A.metaLitros.toFixed(1).replace('.', ',');
    const nCopos = A.copos.length;
    const mCopos = Math.round((A.metaLitros * 1000) / A.mlPorCopo);

    document.getElementById('copo-fill').style.height = (pct * 100) + '%';
    document.getElementById('copo-ondas').style.bottom = (pct * 100) + '%';
    document.getElementById('copo-litros').innerText  = litros + ' L';
    document.getElementById('meta-label').innerText   = meta;
    document.getElementById('copos-texto').innerText  = nCopos + ' de ' + mCopos + ' copos hoje';
    document.getElementById('historico-sub').innerText = nCopos === 0 ? 'Nenhum registro' : totalMl() + ' ml registrados';
}

function renderCopos() {
    const grid   = document.getElementById('copos-grid');
    const total  = Math.round((A.metaLitros * 1000) / A.mlPorCopo);
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

// ============================================================
//  CONFIG ÁGUA
// ============================================================
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
    const meds  = [...A.medicamentos].sort((a, b) => a.hora.localeCompare(b.hora));

    if (meds.length === 0) {
        lista.innerHTML = `<div class="med-vazio">
            <span class="med-vazio-ico">💊</span>
            <span class="med-vazio-txt">Nenhum medicamento cadastrado ainda.</span>
        </div>`;
        atualizarResumo();
        return;
    }

    lista.innerHTML = '';
    meds.forEach(med => {
        const div = document.createElement('div');
        div.className = `med-card ${med.status}`;
        div.onclick = () => abrirAlertaMed(med.id);

        const statusLabel = {
            pendente: '<span class="med-status status-pendente">Pendente</span>',
            tomado:   '<span class="med-status status-tomado">Tomado</span>',
            atrasado: '<span class="med-status status-atrasado">Atrasado</span>',
            pulado:   '<span class="med-status status-pulado">Pulado</span>',
        }[med.status] || '';

        div.innerHTML = `
            <div class="med-icone-wrap">💊</div>
            <div class="med-info">
                <div class="med-nome">${med.nome}</div>
                <div class="med-dose">${med.dose}</div>
            </div>
            <div class="med-meta">
                <span class="med-hora">${med.hora}</span>
                ${statusLabel}
            </div>`;
        lista.appendChild(div);
    });
    atualizarResumo();
}

function atualizarResumo() {
    document.getElementById('res-tomados').innerText  = A.medicamentos.filter(m => m.status === 'tomado').length;
    document.getElementById('res-pendentes').innerText = A.medicamentos.filter(m => m.status === 'pendente' || m.status === 'atrasado').length;
    document.getElementById('res-pulados').innerText  = A.medicamentos.filter(m => m.status === 'pulado').length;
}

function abrirAlertaMed(id) {
    const med = A.medicamentos.find(m => m.id === id);
    if (!med || med.status === 'tomado') return;
    A.medAtual  = id;
    A.medAtrasos = 0;
    document.getElementById('modal-med-nome').innerText   = med.nome;
    document.getElementById('modal-med-detalhe').innerHTML = med.dose + '<br>' + med.inst;
    document.getElementById('modal-med-hora').innerText   = med.hora;
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
        setTimeout(() => {
            document.getElementById('aviso-familiar-med').style.display = 'block';
            abrirAlertaMed(A.medAtual);
        }, 600);
    } else {
        setTimeout(() => abrirAlertaMed(A.medAtual), 10 * 1000);
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
        const agora = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', hour12: false });
        A.medicamentos.forEach(med => {
            if (med.hora === agora && med.status === 'pendente') {
                abrirAlertaMed(med.id);
            }
        });
    }, 30000);
}

// ============================================================
//  ADICIONAR MEDICAMENTO
// ============================================================
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

    if (!nome || !hora) {
        document.getElementById('novo-med-nome').focus();
        return;
    }

    const novoId = Date.now();
    A.medicamentos.push({
        id: novoId,
        nome, dose: dose || '—', inst: inst || '—',
        hora, periodo: periodoAtual,
        status: 'pendente',
    });

    document.getElementById('novo-med-nome').value = '';
    document.getElementById('novo-med-dose').value = '';
    document.getElementById('novo-med-inst').value = '';
    document.getElementById('novo-med-hora').value = '';

    fecharModal('modal-add-med');
    renderMeds();
    mostrarOk('Medicamento adicionado!', nome + ' — ' + hora);
}

// ============================================================
//  MODAIS
// ============================================================
function abrirModal(id) {
    document.getElementById(id).classList.add('ativo');
}

function fecharModal(id) {
    document.getElementById(id).classList.remove('ativo');
}

function mostrarOk(titulo, msg) {
    document.getElementById('ok-titulo').innerText = titulo;
    document.getElementById('ok-msg').innerText    = msg;
    abrirModal('modal-ok');
    setTimeout(() => fecharModal('modal-ok'), 3000);
}

// ============================================================
//  START
// ============================================================
init();
