// O "estado" é um objeto simples que guarda TUDO sobre a partida:
//
// {
//   perfil: 'ambiental',          // perfil escolhido pelo jogador
//   dia: 1,                       // dia atual (1 a 30)
//   indices: { dinheiro: 80, eficiencia: 50, sustentabilidade: 50, felicidade: 50 },
//   dias: [ { problemaId: 'P042', cartas: ['eletrica', 'ambiental', 'mecanica'] }, ... ],
//   historico: [ { dia, problemaId, disciplina, receita, indices }, ... ],
//   situacao: 'jogando',          // 'jogando' | 'falencia' | 'concluida'
// }
//
// Ele só tem números, textos e listas. Por isso pode ser salvo no
// navegador (etapa 3) com JSON.stringify e recarregado depois.
import { CONFIG, INDICADORES, PERFIS } from '../config.js';
import { PROBLEMAS } from '../dados/problemas.js';

/**
 * Devolve uma CÓPIA da lista com os itens em ordem aleatória
 * (algoritmo de Fisher-Yates). A lista original não muda.
 * `aleatorio` é uma função que devolve um número entre 0 e 1; por padrão,
 * Math.random. Os testes passam outra função para o sorteio ser previsível.
 */
export function embaralhar(lista, aleatorio = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1)); // posição sorteada entre 0 e i
    [copia[i], copia[j]] = [copia[j], copia[i]]; // troca os dois de lugar
  }
  return copia;
}

/**
 * Cria uma partida nova para o perfil escolhido.
 * Já sorteia os problemas dos 30 dias (sem repetir) e as cartas de cada dia.
 * Opções (todas opcionais):
 *   problemas: lista de problemas (padrão: os dados reais)
 *   aleatorio: função de sorteio (padrão: Math.random)
 */
export function criarEstado(perfilId, { problemas = PROBLEMAS, aleatorio = Math.random } = {}) {
  if (!PERFIS[perfilId]) {
    throw new Error(`Perfil desconhecido: "${perfilId}"`);
  }
  if (problemas.length < CONFIG.totalDias) {
    throw new Error(
      `Só há ${problemas.length} problemas, mas a partida tem ${CONFIG.totalDias} dias`,
    );
  }

  const sorteados = embaralhar(problemas, aleatorio).slice(0, CONFIG.totalDias);
  const dias = sorteados.map((problema) => {
    const disciplinas = problema.solucoes.map((s) => s.disciplina);
    return {
      problemaId: problema.id,
      cartas: embaralhar(disciplinas, aleatorio).slice(0, CONFIG.cartasPorTurno),
    };
  });

  return {
    perfil: perfilId,
    dia: 1,
    indices: { ...CONFIG.inicial },
    dias,
    historico: [],
    situacao: 'jogando',
  };
}

/** Prende um valor entre o mínimo e o máximo da configuração (0 e 100). */
export function limitar(valor) {
  return Math.min(CONFIG.limites.max, Math.max(CONFIG.limites.min, valor));
}

/**
 * Soma as variações aos índices e devolve um NOVO objeto de índices.
 * Os índices "limitados" ficam entre 0 e 100; o dinheiro não tem limite.
 * Ex.: aplicarVariacoes({ felicidade: 98, ... }, { felicidade: 5 }) → felicidade 100
 */
export function aplicarVariacoes(indices, variacoes) {
  const novos = { ...indices };
  for (const { id, limitado } of INDICADORES) {
    const soma = novos[id] + (variacoes[id] ?? 0);
    novos[id] = limitado ? limitar(soma) : soma;
  }
  return novos;
}