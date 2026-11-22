const CHAVE = 'jogo-engenharia-urbana/partida';

export function salvar(estado, armazenamento = globalThis.localStorage) {
  try {
    armazenamento.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // aba anônima, armazenamento cheio ou bloqueado: não há o que fazer
  }
}

export function carregar(armazenamento = globalThis.localStorage) {
  try {
    const estado = JSON.parse(armazenamento.getItem(CHAVE));
    // confere o mínimo, para não quebrar com dado corrompido ou de outra versão
    if (estado?.situacao === 'jogando' && Array.isArray(estado.dias) && estado.indices) {
      return estado;
    }
  } catch {
    // texto que não é JSON ou armazenamento bloqueado
  }
  return null;
}

const CHAVE_VITORIAS = 'jogo-engenharia-urbana/vitorias';

export function lerVitorias(armazenamento = globalThis.localStorage) {
  try {
    const lista = JSON.parse(armazenamento.getItem(CHAVE_VITORIAS));
    if (Array.isArray(lista)) return lista;
  } catch {
    // texto que não é JSON ou armazenamento bloqueado
  }
  return [];
}

export function registrarVitoria(perfilId, armazenamento = globalThis.localStorage) {
  const vitorias = lerVitorias(armazenamento);
  if (vitorias.includes(perfilId)) return vitorias;
  const novas = [...vitorias, perfilId];
  try {
    armazenamento.setItem(CHAVE_VITORIAS, JSON.stringify(novas));
  } catch {
    // sem armazenamento, a vitória só vale até fechar a aba
  }
  return novas;
}

export function apagar(armazenamento = globalThis.localStorage) {
  try {
    armazenamento.removeItem(CHAVE);
  } catch {
    // armazenamento bloqueado: não há nada salvo mesmo
  }
}