// Peças pequenas de interface, reaproveitadas pelas telas (telas.js).
import { INDICADORES } from '../config.js';
import { DISCIPLINAS } from '../dados/problemas.js';

/**
 * Cria um elemento HTML. Exemplo:
 *   el('button', { class: 'botao', onclick: funcao }, 'Clique aqui')
 * Atributos que começam com "on" viram eventos. Textos entram como texto
 * puro (nunca como HTML), então um "<" vindo dos CSVs não quebra a página.
 * Filhos null/false são ignorados, o que permite: condicao && el(...)
 */
export function el(tag, atributos = {}, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (nome.startsWith('on')) elemento.addEventListener(nome.slice(2), valor);
    else elemento.setAttribute(nome, valor);
  }
  for (const filho of filhos) {
    if (filho !== null && filho !== undefined && filho !== false) elemento.append(filho);
  }
  return elemento;
}

/** 81.2 → "81,2" e 6 → "6" (no máximo 1 casa decimal, vírgula brasileira). */
export function formatarNumero(valor) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/** 5 → "+5", -3 → "-3", 0 → "0". */
function comSinal(valor) {
  return (valor > 0 ? '+' : '') + formatarNumero(valor);
}

/** 'eletrica' → 'Elétrica' (nome escrito no cabeçalho do CSV). */
export function nomeDisciplina(id) {
  return DISCIPLINAS.find((d) => d.id === id)?.nome ?? id;
}

/**
 * Painel com os 4 indicadores. Se receber os índices do dia anterior
 * (`anteriores`), mostra ao lado quanto cada um subiu ou desceu.
 */
export function painelIndicadores(indices, anteriores) {
  return el(
    'ul',
    { class: 'indicadores' },
    ...INDICADORES.map(({ id, nome, icone, limitado }) => {
      const variacao = anteriores ? indices[id] - anteriores[id] : 0;
      return el(
        'li',
        { class: 'indicador' },
        el('span', { class: 'indicador-nome' }, `${icone} ${nome}`),
        el('strong', { class: 'indicador-valor' }, formatarNumero(indices[id])),
        Math.abs(variacao) >= 0.05 &&
          el('span', { class: variacao > 0 ? 'sobe' : 'desce' }, comSinal(variacao)),
        limitado && el('progress', { max: 100, value: indices[id], 'aria-label': nome }),
      );
    }),
  );
}

/** Uma carta de solução: um botão com a disciplina, o texto e os efeitos. */
export function carta(solucao, aoEscolher) {
  return el(
    'button',
    { class: 'carta', type: 'button', onclick: () => aoEscolher(solucao.disciplina) },
    el('span', { class: 'carta-disciplina' }, nomeDisciplina(solucao.disciplina)),
    el('span', { class: 'carta-texto' }, solucao.texto),
    el(
      'span',
      { class: 'carta-efeitos' },
      ...INDICADORES.map(({ id, nome, icone }) => {
        const valor = solucao.efeitos[id];
        const classe = valor > 0 ? 'sobe' : valor < 0 ? 'desce' : 'neutro';
        return el('span', { class: classe, title: nome }, `${icone} ${comSinal(valor)}`);
      }),
    ),
  );
}