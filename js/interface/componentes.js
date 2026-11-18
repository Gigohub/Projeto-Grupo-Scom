import { INDICADORES } from '../config.js';
import { DISCIPLINAS } from '../dados/problemas.js';


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

export function linhaEfeitos(efeitos) {
    return el(
      'span',
      { class: 'efeitos' },
      ...INDICADORES.filter(({ id }) => id in efeitos).map(({ id, nome, icone }) => {
        const valor = efeitos[id];
        const classe = valor > 0 ? 'sobe' : valor < 0 ? 'desce' : 'neutro';
        return el('span', { class: classe, title: nome }, `${icone} ${comSinal(valor)}`);
      }),
    );
}
  
export function carta(solucao, aoEscolher) {
    return el(
      'button',
      { class: 'carta', type: 'button', onclick: () => aoEscolher(solucao.disciplina) },
      el('span', { class: 'carta-disciplina' }, nomeDisciplina(solucao.disciplina)),
      el('span', { class: 'carta-texto' }, solucao.texto),
      linhaEfeitos(solucao.efeitos),
    );
}
  
export function cartaoEvento(evento) {
    return el(
      'div',
      { class: 'evento' },
      el('strong', {}, `📰 ${evento.titulo}`),
      el('p', {}, evento.descricao),
      linhaEfeitos(evento.efeitos),
    );
}
  
export function listaContagem(contagem, nomear = (item) => item) {
    return el(
      'ul',
      { class: 'contagem' },
      ...contagem.map(({ item, vezes }) => el('li', {}, `${nomear(item)}: ${vezes}`)),
    );
  }