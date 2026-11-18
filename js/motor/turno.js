import { CONFIG, INDICADORES } from '../config.js';
import { PROBLEMAS } from '../dados/problemas.js';
import { aplicarVariacoes } from './estado.js';
import { verificarSituacao } from './fim.js';
import { aplicarEventos } from './eventos.js';


export function buscarProblema(id, problemas = PROBLEMAS) {
  const problema = problemas.find((p) => p.id === id);
  if (!problema) {
    throw new Error(`Problema ${id} não encontrado`);
  }
  return problema;
}

export function turnoAtual(estado, { problemas = PROBLEMAS } = {}) {
  const { problemaId, cartas } = estado.dias[estado.dia - 1]; // dia 1 → posição 0
  const problema = buscarProblema(problemaId, problemas);
  return {
    dia: estado.dia,
    problema,
    cartas: cartas.map((disciplina) => problema.solucoes.find((s) => s.disciplina === disciplina)),
  };
}

export function calcularReceita(indices) {
  const { base, bonusMaximo } = CONFIG.receita;
  const media = (indices.felicidade + indices.eficiencia) / 2;
  return base + (bonusMaximo * (media - 50)) / 50;
}

export function escolherCarta(estado, disciplinaId, { problemas = PROBLEMAS, aleatorio = Math.random } = {}) {
  if (estado.situacao !== 'jogando') {
    throw new Error('A partida já terminou');
  }
  const { problema, cartas } = turnoAtual(estado, { problemas });
  const carta = cartas.find((c) => c.disciplina === disciplinaId);
  if (!carta) {
    throw new Error(`A carta "${disciplinaId}" não foi oferecida no dia ${estado.dia}`);
  }

  // 1. efeito da carta + desgaste (o desgaste só vale para os índices limitados)
  const variacoes = { ...carta.efeitos };
  for (const { id, limitado } of INDICADORES) {
    if (limitado) variacoes[id] -= CONFIG.desgasteDiario;
  }
  let indices = aplicarVariacoes(estado.indices, variacoes);

  // 2. receita do dia
  const receita = calcularReceita(indices);
  indices = aplicarVariacoes(indices, { dinheiro: receita });

// 3. eventos do dia (podem levar à falência também)
  const doDia = aplicarEventos(estado.indices, indices, aleatorio);
  indices = doDia.indices;

  // 4. registra o dia e confere se a partida acabou
  const historico = [
    ...estado.historico,
    {
      dia: estado.dia,
      problemaId: problema.id,
      disciplina: disciplinaId,
      receita,
      eventos: doDia.eventos,
      indices,
    },
  ];
  const novo = { ...estado, indices, historico };
  novo.situacao = verificarSituacao(novo);
  if (novo.situacao === 'jogando') {
    novo.dia = estado.dia + 1;
  }
  return novo;
}