import { criarEstado } from './motor/estado.js';
import { turnoAtual, escolherCarta } from './motor/turno.js';
import { resultadoFinal , perfilLiberado } from './motor/fim.js';
import { salvar, carregar, apagar, lerVitorias, registrarVitoria } from './salvamento.js';
import { telaCapa, telaInicial, telaJogo, telaFinal } from './interface/telas.js';
import { prepararMusica } from './musica.js';

const raiz = document.getElementById('app');
let estado = null;
let bloqueadoAte = 0;

function inicio() {
  telaCapa(raiz, {
    temPartidaSalva: carregar() !== null,
    aoJogar: escolherPerfil,
    aoContinuar: continuar,
  });
}

function escolherPerfil() {
  telaInicial(raiz, {
    temPartidaSalva: carregar() !== null,
    aoEscolherPerfil: novaPartida,
    aoContinuar: continuar,
    vitorias: lerVitorias(),
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
    const resultado = resultadoFinal(estado);
    const liberadoAntes = perfilLiberado('prefeito', lerVitorias())
    const liberadoAgora = resultado.venceu && perfilLiberado('prefeito', registrarVitoria(estado.perfil));
    telaFinal(raiz, resultado, inicio, !liberadoAntes && liberadoAgora);
  }
}

prepararMusica(document.getElementById('musica'), document.getElementById('botao-musica'));

inicio();
