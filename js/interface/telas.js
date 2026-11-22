// As 3 telas do jogo: inicial (escolha do perfil), do dia e final.
// Cada função apaga o conteúdo da área principal e desenha a tela.
// Elas não sabem as regras: só mostram o que o motor calculou e avisam
// main.js quando o jogador clica em algo (as funções "ao...").
import { CONFIG, INDICADORES, PERFIS } from '../config.js';
import { buscarEvento } from '../motor/eventos.js';
import {
  el,
  formatarNumero,
  nomeDisciplina,
  painelIndicadores,
  carta,
  cartaoEvento,
  listaContagem,
  icone,
  soParaLeitor,
} from './componentes.js';

/** { sustentabilidade: 70 } → "Sustentabilidade ≥ 70" (várias metas: "A ≥ 60 e B ≥ 60") */
function textoMeta(meta) {
  return Object.entries(meta)
    .map(([id, minimo]) => `${INDICADORES.find((i) => i.id === id).nome} ≥ ${minimo}`)
    .join(' e ');
}

/** Troca o conteúdo da tela e põe o foco no título, para leitores de tela anunciarem a mudança. */
function mostrar(raiz, ...conteudo) {
  raiz.replaceChildren(...conteudo.filter(Boolean));
  raiz.querySelector('h2')?.focus();
}

export function telaCapa(raiz, { temPartidaSalva, aoJogar, aoContinuar }) {
  mostrar(
    raiz,
    el(
      'div',
      { class: 'capa-jogo' },
      el(
        'div',
        { class: 'capa-topo' },
        el('span', {}, 'Desenvolvido por · Sua Equipe'),
        el('span', {}, 'Simulador de Gestão'),
      ),
      el(
        'div',
        { class: 'capa-centro' },
        el('h2', { class: 'so-leitor', tabindex: -1 }, 'COLAPCITY'),
        el('img', { class: 'capa-logo', src: 'img/logo.png', alt: '' }),
        el('p', { class: 'capa-subtitulo' }, 'Resolva os desafios da cidade em 30 dias'),
        el('button', { class: 'capa-play', type: 'button', onclick: aoJogar }, 'Jogar ▶'),
        temPartidaSalva &&
          el(
            'button',
            { class: 'capa-continuar', type: 'button', onclick: aoContinuar },
            'Continuar partida salva',
          ),
      ),
      el(
        'div',
        { class: 'capa-rodape' },
        el('span', {}, 'v 1.0'),
        el('span', {}, 'Todos os direitos reservados'),
      ),
    ),
  );
}

export function telaInicial(raiz, { temPartidaSalva, aoEscolherPerfil, aoContinuar }) {
  mostrar(
    raiz,
    el('h2', { tabindex: -1 }, 'Escolha seu perfil'),
    el(
      'div',
      { class: 'contratante-bloco' },
      el('img', { class: 'contratante-foto', src: 'img/cliente.webp', alt: 'Contratante da prefeitura' }),
      el(
        'div',
        { class: 'contratante-fala' },
        el(
          'p',
          {},
          `Você foi contratado(a) como consultor(a) da prefeitura por ${CONFIG.totalDias} dias. ` +
            `A cada dia chega um problema e ${CONFIG.cartasPorTurno} soluções de engenharias diferentes: ` +
            'escolha uma. Se o dinheiro ficar negativo, a cidade vai à falência.',
        ),
      ),
    ),
    el(
      'details',
      { class: 'como-jogar' },
      el('summary', {}, 'Como jogar'),
      el(
        'ul',
        {},
        el('li', {}, 'Cada solução muda os 4 índices: Dinheiro, Eficiência, Sustentabilidade e Felicidade.'),
        el(
          'li',
          {},
          `Todo dia a Eficiência, a Sustentabilidade e a Felicidade caem ${CONFIG.desgasteDiario} pelo desgaste da cidade.`,
        ),
        el('li', {}, 'A cidade arrecada dinheiro todo dia: mais quando a Eficiência e a Felicidade estão altas.'),
        el(
          'li',
          {},
          'Eventos podem acontecer: alguns por acaso, outros quando um índice passa de um limite ' +
            `(ex.: Felicidade abaixo de ${CONFIG.limiares.exodoFelicidade} faz moradores irem embora).`,
        ),
        el('li', {}, `Você vence se chegar ao dia ${CONFIG.totalDias} sem falir e com a meta do seu perfil.`),
        el('li', {}, 'A partida fica salva neste navegador: dá para fechar e continuar depois.'),
      ),
    ),
    temPartidaSalva &&
      el('button', { class: 'botao', type: 'button', onclick: aoContinuar }, 'Continuar partida salva'),
   el(
      'div',
      { class: 'perfis' },
      ...Object.entries(PERFIS).map(([id, perfil]) =>
        el(
          'button',
          { class: 'perfil', type: 'button', onclick: () => aoEscolherPerfil(id) },
          el('img', { class: 'perfil-foto', src: perfil.imagem, alt: perfil.personagem }),
          el('strong', {}, perfil.personagem),
          el('span', { class: 'perfil-area' }, perfil.nome),
          el('span', {}, 'Meta no dia ' + CONFIG.totalDias + ': ' + textoMeta(perfil.meta)),
        ),
      ),
    ),
  );
}

export function telaJogo(raiz, estado, turno, aoEscolher) {
  const ontem = estado.historico.at(-1);
  const anteriores = estado.historico.at(-2)?.indices ?? CONFIG.inicial;
  const perfil = PERFIS[estado.perfil];
  mostrar(
    raiz,
    // o foco vai para este título: assim o leitor de tela lê, em ordem,
    // os índices, o resumo de ontem, as notícias e só depois o problema
    el(
      'h2',
      { class: 'cabecalho-dia', tabindex: -1 },
      `Dia ${turno.dia} de ${CONFIG.totalDias} · ${perfil.nome} · Meta: ${textoMeta(perfil.meta)}`,
    ),
    painelIndicadores(estado.indices, ontem && anteriores),
    ontem &&
      el(
        'p',
        { class: 'resumo' },
        `Ontem você escolheu ${nomeDisciplina(ontem.disciplina)}. ` +
          `A cidade arrecadou ${formatarNumero(ontem.receita)} e os índices caíram ${CONFIG.desgasteDiario} pelo desgaste.`,
      ),
    ...(ontem?.eventos ?? []).map((id) => cartaoEvento(buscarEvento(id))),
    el(
      'div',
      { class: 'contratante-bloco' },
      el('img', { class: 'contratante-foto', src: 'img/cliente.webp', alt: 'Contratante da prefeitura' }),
      el(
        'div',
        { class: 'contratante-fala' },
        el('p', { class: 'setor' }, `${turno.problema.setor} · ${turno.problema.id}`),
        el('h3', { class: 'problema' }, turno.problema.titulo),
        el('p', { class: 'descricao' }, turno.problema.descricao),
      ),
    ),
    el('p', {}, 'Escolha uma solução:'),
    el('div', { class: 'cartas' }, ...turno.cartas.map((c) => carta(c, aoEscolher))),
  );
}

export function telaFinal(raiz, resultado, aoRecomecar) {
  const falencia = resultado.situacao === 'falencia';
  const titulo = falencia ? 'Falência!' : resultado.venceu ? 'Missão cumprida!' : 'Fim do contrato';
  const explicacao = falencia
    ? `O dinheiro acabou no dia ${resultado.diasJogados}.`
    : resultado.venceu
      ? `Você chegou ao fim dos ${CONFIG.totalDias} dias e bateu a meta do seu perfil.`
      : `Você chegou ao fim dos ${CONFIG.totalDias} dias, mas não bateu a meta do seu perfil.`;
  mostrar(
    raiz,
    el('h2', { tabindex: -1 }, titulo),
    el('p', {}, explicacao),
    painelIndicadores(resultado.indices),
    el('h3', {}, 'Meta do perfil'),
    el(
      'ul',
      { class: 'metas' },
      ...resultado.metas.map((m) =>
        el(
          'li',
          {},
          icone(m.atingida ? '✅ ' : '❌ '),
          soParaLeitor(m.atingida ? 'Atingida: ' : 'Não atingida: '),
          `${m.nome}: ${formatarNumero(m.valor)} (mínimo ${m.minimo})`,
        ),
      ),
    ),
    el('h3', {}, 'Relatório da cidade'),
    el(
      'p',
      {},
      `Dinheiro: começou com ${formatarNumero(CONFIG.inicial.dinheiro)}, ` +
        `arrecadou ${formatarNumero(resultado.arrecadado)}, ` +
        `investiu ${formatarNumero(resultado.investido)} em soluções e ` +
        `${resultado.saldoEventos >= 0 ? 'ganhou' : 'perdeu'} ${formatarNumero(Math.abs(resultado.saldoEventos))} com eventos. ` +
        `Terminou com ${formatarNumero(resultado.indices.dinheiro)}.`,
    ),
    el(
      'div',
      { class: 'relatorio' },
      el('section', {}, el('h4', {}, 'Suas escolhas'), listaContagem(resultado.escolhas, nomeDisciplina)),
      el('section', {}, el('h4', {}, 'Setores atendidos'), listaContagem(resultado.setores)),
      el(
        'section',
        {},
        el('h4', {}, 'Eventos'),
        resultado.eventos.length
          ? el('ul', { class: 'contagem' }, ...resultado.eventos.map((e) => el('li', {}, `Dia ${e.dia}: ${e.titulo}`)))
          : el('p', {}, 'Nenhum evento aconteceu.'),
      ),
    ),
    el('button', { class: 'botao', type: 'button', onclick: aoRecomecar }, 'Jogar de novo'),
  );
}
