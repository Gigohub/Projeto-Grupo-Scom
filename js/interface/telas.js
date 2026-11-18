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
} from './componentes.js';


function textoMeta(meta) {
  return Object.entries(meta)
    .map(([id, minimo]) => `${INDICADORES.find((i) => i.id === id).nome} ≥ ${minimo}`)
    .join(' e ');
}

function mostrar(raiz, ...conteudo) {
  raiz.replaceChildren(...conteudo.filter(Boolean));
  raiz.querySelector('h2')?.focus();
}

export function telaInicial(raiz, { temPartidaSalva, aoEscolherPerfil, aoContinuar }) {
  mostrar(
    raiz,
    el('h2', { tabindex: -1 }, 'Escolha seu perfil'),
    el(
      'p',
      {},
      `Você foi contratado(a) como consultor(a) da prefeitura por ${CONFIG.totalDias} dias. ` +
        `A cada dia chega um problema e ${CONFIG.cartasPorTurno} soluções de engenharias diferentes: ` +
        'escolha uma. Se o dinheiro ficar negativo, a cidade vai à falência.',
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
          el('strong', {}, perfil.nome),
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
    el(
      'p',
      { class: 'cabecalho-dia' },
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
    el('p', { class: 'setor' }, `${turno.problema.setor} · ${turno.problema.id}`),
    el('h2', { tabindex: -1 }, turno.problema.titulo),
    el('p', { class: 'descricao' }, turno.problema.descricao),
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
          `${m.atingida ? '✅' : '❌'} ${m.nome}: ${formatarNumero(m.valor)} (mínimo ${m.minimo})`,
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