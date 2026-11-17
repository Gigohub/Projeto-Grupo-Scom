// Regras de fim de partida: falência, conclusão dos 30 dias e meta do perfil.
import { CONFIG, INDICADORES, PERFIS } from '../config.js';

/**
 * Diz em que situação a partida está, olhando para o estado:
 * 'falencia'  → o dinheiro ficou negativo (perde na hora)
 * 'concluida' → já foram jogados todos os dias
 * 'jogando'   → nenhum dos dois
 */
export function verificarSituacao(estado) {
  if (estado.indices.dinheiro < 0) return 'falencia';
  if (estado.historico.length >= CONFIG.totalDias) return 'concluida';
  return 'jogando';
}

/**
 * Compara a meta do perfil com os índices e devolve uma linha por meta:
 * [{ indicador: 'sustentabilidade', nome: 'Sustentabilidade', minimo: 70, valor: 74, atingida: true }]
 */
export function avaliarMeta(perfilId, indices) {
  return Object.entries(PERFIS[perfilId].meta).map(([indicador, minimo]) => ({
    indicador,
    nome: INDICADORES.find((i) => i.id === indicador).nome,
    minimo,
    valor: indices[indicador],
    atingida: indices[indicador] >= minimo,
  }));
}

/**
 * Resumo da partida que terminou (a tela final da etapa 3 usa isto).
 * Vence quem chega ao fim dos 30 dias SEM falir e com todas as metas atingidas.
 */
export function resultadoFinal(estado) {
  if (estado.situacao === 'jogando') {
    throw new Error('A partida ainda não terminou');
  }
  const metas = avaliarMeta(estado.perfil, estado.indices);
  return {
    situacao: estado.situacao,
    venceu: estado.situacao === 'concluida' && metas.every((m) => m.atingida),
    diasJogados: estado.historico.length,
    indices: { ...estado.indices },
    metas,
  };
}