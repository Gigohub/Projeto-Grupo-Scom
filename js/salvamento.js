// Guarda a partida no navegador (localStorage), para o jogador poder
// fechar a aba e continuar depois. Só existe UMA partida salva por vez.
//
// O parâmetro `armazenamento` é o localStorage do navegador; os testes
// passam um armazenamento de mentira no lugar.

const CHAVE = 'jogo-engenharia-urbana/partida';

/** Salva o estado. Se o navegador bloquear o armazenamento, o jogo segue sem salvar. */
export function salvar(estado, armazenamento = globalThis.localStorage) {
  try {
    armazenamento.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // aba anônima, armazenamento cheio ou bloqueado: não há o que fazer
  }
}

/** Devolve a partida salva em andamento, ou null se não houver uma válida. */
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

/** Apaga a partida salva (usado quando a partida termina). */
export function apagar(armazenamento = globalThis.localStorage) {
  try {
    armazenamento.removeItem(CHAVE);
  } catch {
    // armazenamento bloqueado: não há nada salvo mesmo
  }
}