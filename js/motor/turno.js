// O que acontece em cada dia: mostrar o problema e as cartas, e aplicar a
// carta escolhida (efeito + desgaste + receita).
//
// Nenhuma função aqui altera o estado recebido: elas devolvem um estado NOVO.
import { CONFIG, INDICADORES } from '../config.js';
import { PROBLEMAS } from '../dados/problemas.js';
import { aplicarVariacoes } from './estado.js';
import { verificarSituacao } from './fim.js';

/** Procura um problema pelo id (ex.: 'P042'). */
export function buscarProblema(id, problemas = PROBLEMAS) {
  const problema = problemas.find((p) => p.id === id);
  if (!problema) {
    throw new Error(`Problema ${id} não encontrado`);
  }
  return problema;
}

/**
 * Tudo o que a tela precisa para mostrar o dia atual:
 * { dia, problema, cartas: [{ disciplina, texto, efeitos }, ...] }
 */
export function turnoAtual(estado, { problemas = PROBLEMAS } = {}) {
  const { problemaId, cartas } = estado.dias[estado.dia - 1]; // dia 1 → posição 0
  const problema = buscarProblema(problemaId, problemas);
  return {
    dia: estado.dia,
    problema,
    cartas: cartas.map((disciplina) => problema.solucoes.find((s) => s.disciplina === disciplina)),
  };
}

/**
 * Receita do dia = base + bonusMaximo × (média de felicidade e eficiência − 50) / 50
 * Com a média em 50 → base (6). Em 100 → base + bônus (10). Em 0 → base − bônus (2).
 * O valor pode ter casas decimais (ex.: 5,2); a tela arredonda só para mostrar.
 */
export function calcularReceita(indices) {
  const { base, bonusMaximo } = CONFIG.receita;
  const media = (indices.felicidade + indices.eficiencia) / 2;
  return base + (bonusMaximo * (media - 50)) / 50;
}

/**
 * O jogador escolheu uma carta. Devolve o estado do dia seguinte.
 * Ordem (a mesma usada na simulação que balanceou o jogo):
 *   1. efeito da carta + desgaste diário, somados e DEPOIS limitados a 0–100
 *   2. receita, calculada com os índices já atualizados
 *   3. confere falência / fim da partida; se nada disso, avança o dia
 * Opções: problemas (padrão: os dados reais). Na etapa 4 entra aqui
 * também a função de sorteio, para os eventos aleatórios.
 */
export function escolherCarta(estado, disciplinaId, { problemas = PROBLEMAS } = {}) {
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

  // 3. registra o dia e confere se a partida acabou
  const historico = [
    ...estado.historico,
    { dia: estado.dia, problemaId: problema.id, disciplina: disciplinaId, receita, indices },
  ];
  const novo = { ...estado, indices, historico };
  novo.situacao = verificarSituacao(novo);
  if (novo.situacao === 'jogando') {
    novo.dia = estado.dia + 1;
  }
  return novo;
}