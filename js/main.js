import { criarEstado } from './motor/estado.js';
import { turnoAtual, escolherCarta } from './motor/turno.js';
import { resultadoFinal } from './motor/fim.js';
import { salvar, carregar, apagar } from './salvamento.js';
import { telaInicial, telaJogo, telaFinal } from './interface/telas.js';
import { prepararMusica } from './musica.js';

const raiz = document.getElementById('app');
let estado = null;
let bloqueadoAte = 0;

function inicio() {
  telaInicial(raiz, {
    temPartidaSalva: carregar() !== null,
    aoEscolherPerfil: novaPartida,
    aoContinuar: continuar,
  });
}

function novaPartida(perfilId) {
  estado = criarEstado(perfilId);
  salvar(estado);
  mostrarDia();
}

function continuar() {
  estado = carregar();
  try {
    mostrarDia();
  } catch {
    // partida salva que não serve mais (ex.: os CSVs mudaram): descarta
    apagar();
    inicio();
  }
}

function mostrarDia() {
  telaJogo(raiz, estado, turnoAtual(estado), escolher);
  // um clique duplo não pode escolher também a carta do dia seguinte
  bloqueadoAte = performance.now() + 400;
}

function escolher(disciplinaId) {
  if (performance.now() < bloqueadoAte) return;
  estado = escolherCarta(estado, disciplinaId);
  if (estado.situacao === 'jogando') {
    salvar(estado);
    mostrarDia();
  } else {
    apagar();
    telaFinal(raiz, resultadoFinal(estado), inicio);
  }
}

prepararMusica(document.getElementById('musica'), 
document.getElementById('botao-musica'));

inicio();;