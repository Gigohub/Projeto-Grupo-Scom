import { CONFIG, INDICADORES, PERFIS } from '../config.js';
import { PROBLEMAS } from '../dados/problemas.js';


export function embaralhar(lista, aleatorio = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1)); // posição sorteada entre 0 e i
    [copia[i], copia[j]] = [copia[j], copia[i]]; // troca os dois de lugar
  }
  return copia;
}


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

export function aplicarVariacoes(indices, variacoes) {
  const novos = { ...indices };
  for (const { id, limitado } of INDICADORES) {
    const soma = novos[id] + (variacoes[id] ?? 0);
    novos[id] = limitado ? limitar(soma) : soma;
  }
  return novos;
}