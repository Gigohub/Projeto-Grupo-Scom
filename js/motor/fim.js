import { CONFIG, INDICADORES, PERFIS } from '../config.js';
import { PROBLEMAS } from '../dados/problemas.js';
import { buscarEvento } from './eventos.js';


export function verificarSituacao(estado) {
  if (estado.indices.dinheiro < 0) return 'falencia';
  if (estado.historico.length >= CONFIG.totalDias) return 'concluida';
  return 'jogando';
}


export function avaliarMeta(perfilId, indices) {
  return Object.entries(PERFIS[perfilId].meta).map(([indicador, minimo]) => ({
    indicador,
    nome: INDICADORES.find((i) => i.id === indicador).nome,
    minimo,
    valor: indices[indicador],
    atingida: indices[indicador] >= minimo,
  }));
}


function contar(lista) {
  const vezes = {};
  for (const item of lista) vezes[item] = (vezes[item] ?? 0) + 1;
  return Object.entries(vezes)
    .map(([item, n]) => ({ item, vezes: n }))
    .sort((a, b) => b.vezes - a.vezes);
}

function somar(numeros) {
  return numeros.reduce((total, n) => total + n, 0);
}

export function resultadoFinal(estado, { problemas = PROBLEMAS } = {}) {
  if (estado.situacao === 'jogando') {
    throw new Error('A partida ainda não terminou');
  }
  const metas = avaliarMeta(estado.perfil, estado.indices);
  const dias = estado.historico.map((h) => ({
    ...h,
    problema: problemas.find((p) => p.id === h.problemaId),
  }));
  const eventos = dias.flatMap((d) =>
    // "?? []": partidas salvas antes dos eventos existirem não têm esse campo
    (d.eventos ?? []).map((id) => ({ dia: d.dia, ...buscarEvento(id) })),
  );

  return {
    situacao: estado.situacao,
    venceu: estado.situacao === 'concluida' && metas.every((m) => m.atingida),
    diasJogados: estado.historico.length,
    indices: { ...estado.indices },
    metas,
    escolhas: contar(dias.map((d) => d.disciplina)),
    setores: contar(dias.map((d) => d.problema.setor)),
    arrecadado: somar(dias.map((d) => d.receita)),
    investido: -somar(
      dias.map((d) => d.problema.solucoes.find((s) => s.disciplina === d.disciplina).efeitos.dinheiro),
    ),
    eventos,
    saldoEventos: somar(eventos.map((e) => e.efeitos.dinheiro ?? 0)),
  };
}