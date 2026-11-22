import { icone } from './interface/componentes.js';

const CHAVE = 'jogo-engenharia-urbana/musica';

export function prepararMusica(audio, botao, armazenamento = globalThis.localStorage) {
  let ligada = true;
  try {
    ligada = armazenamento.getItem(CHAVE) !== 'desligada';
  } catch {

  }
  audio.volume = 0.3; 

  function atualizar() {
    botao.replaceChildren(icone(ligada ? '🔊 ' : '🔇 '), 'Música');
    botao.setAttribute('aria-pressed', String(ligada));
    if (ligada) audio.play().catch(() => {});
    else audio.pause();
  }

  botao.addEventListener('click', () => {
    ligada = !ligada;
    try {
      armazenamento.setItem(CHAVE, ligada ? 'ligada' : 'desligada');
    } catch {
      
    }
    atualizar();
  });

  document.addEventListener('pointerdown', atualizar, { once: true });
  document.addEventListener('keydown', atualizar, { once: true });

  atualizar();
}