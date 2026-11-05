
// Para mudar a duração, altere os minutos aqui.
const MODOS = {
  foco:  { minutos: 25, rotulo: "Focus" },
  pausa: { minutos: 5,  rotulo: "Short break" },
  longa: { minutos: 15, rotulo: "Long break" },
};

const SESSOES_ATE_PAUSA_LONGA = 4;

// ---------- Elementos da página ----------
const tempoEl = document.getElementById("tempo");
const botaoIniciar = document.getElementById("btn-iniciar");
const botaoReiniciar = document.getElementById("btn-reiniciar");
const sessoesEl = document.getElementById("sessoes");
const avisoEl = document.getElementById("aviso");
const botoesModo = document.querySelectorAll(".modo");

// ---------- Estado ----------
let modoAtual = "foco";
let restanteMs = MODOS[modoAtual].minutos * 60 * 1000;
let fimEm = null;       // horário (em ms) em que o tempo vai acabar
let intervalo = null;   // guarda o setInterval enquanto o timer roda
let sessoes = 0;

// ---------- Funções ----------
function duracaoTotalMs() {
  return MODOS[modoAtual].minutos * 60 * 1000;
}

// Transforma milissegundos em "MM:SS"
function formatar(ms) {
  const totalSegundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return String(minutos).padStart(2, "0") + ":" + String(segundos).padStart(2, "0");
}

function atualizarTela() {
  const texto = formatar(restanteMs);
  tempoEl.textContent = texto;
  // Mostra o tempo na aba do navegador, útil quando você está em outra aba
  document.title = intervalo
    ? texto + " " + MODOS[modoAtual].rotulo + " | StudiousMind"
    : "Pomodoro | StudiousMind";
}

function iniciar() {
  if (intervalo) return;
  avisoEl.textContent = "";
  // Guardamos o horário final, em vez de subtrair 1 segundo a cada tick.
  // Assim o tempo continua certo mesmo se a aba ficar em segundo plano.
  fimEm = Date.now() + restanteMs;
  intervalo = setInterval(tick, 250);
  botaoIniciar.textContent = "Pause";
  atualizarTela();
}

function pausar() {
  if (!intervalo) return;
  clearInterval(intervalo);
  intervalo = null;
  restanteMs = Math.max(0, fimEm - Date.now());
  botaoIniciar.textContent = "Resume";
  atualizarTela();
}

function tick() {
  restanteMs = fimEm - Date.now();
  if (restanteMs <= 0) {
    finalizar();
    return;
  }
  atualizarTela();
}

function reiniciar() {
  clearInterval(intervalo);
  intervalo = null;
  restanteMs = duracaoTotalMs();
  botaoIniciar.textContent = "Start";
  avisoEl.textContent = "";
  atualizarTela();
}

function trocarModo(novoModo) {
  modoAtual = novoModo;
  botoesModo.forEach(function (botao) {
    botao.setAttribute("aria-pressed", String(botao.dataset.modo === novoModo));
  });
  reiniciar();
}

function finalizar() {
  clearInterval(intervalo);
  intervalo = null;
  tocarSom();

  let proximo;
  if (modoAtual === "foco") {
    sessoes++;
    sessoesEl.textContent = sessoes;
    proximo = sessoes % SESSOES_ATE_PAUSA_LONGA === 0 ? "longa" : "pausa";
    trocarModo(proximo);
    avisoEl.textContent = "Focus session complete. Time for a break.";
  } else {
    trocarModo("foco");
    avisoEl.textContent = "Break is over. Ready for the next session?";
  }
}

// Gera um "bip" pelo navegador, sem precisar de arquivo de áudio
function tocarSom() {
  try {
    const contexto = new (window.AudioContext || window.webkitAudioContext)();
    const oscilador = contexto.createOscillator();
    const volume = contexto.createGain();
    oscilador.frequency.value = 880;
    volume.gain.value = 0.2;
    oscilador.connect(volume);
    volume.connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.6);
  } catch (erro) {
    // Se o navegador bloquear o som, o timer continua funcionando normalmente
  }
}

// ---------- Eventos (reação aos cliques) ----------
botaoIniciar.addEventListener("click", function () {
  if (intervalo) {
    pausar();
  } else {
    iniciar();
  }
});

botaoReiniciar.addEventListener("click", reiniciar);

botoesModo.forEach(function (botao) {
  botao.addEventListener("click", function () {
    trocarModo(botao.dataset.modo);
  });
});

// Mostra o tempo inicial
atualizarTela();
