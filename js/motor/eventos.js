import { CONFIG } from '../config.js';
import { EVENTOS_ALEATORIOS, EVENTOS_DE_LIMIAR } from '../dados/eventos.js';
import { aplicarVariacoes } from './estado.js';

export function eventoBom(evento) {
    return Object.values(evento.efeitos).reduce((soma, valor) => soma + valor, 0) >0;
}

export function buscarEvento(id) {
  const evento = [...EVENTOS_ALEATORIOS, ...EVENTOS_DE_LIMIAR].find((e) => e.id === id);
  if (!evento) {
    throw new Error(`Evento ${id} não encontrado`);
  }
  return evento;
}

export function sortearEventoAleatorio(aleatorio, lista = EVENTOS_ALEATORIOS) {
  if (aleatorio() >= CONFIG.chanceEventoAleatorio) return null;
  return lista[Math.floor(aleatorio() * lista.length)];
}

export function estaNaZona(evento, indices) {
  const valor = indices[evento.indicador];
  return evento.abaixoDe !== undefined ? valor < evento.abaixoDe : valor > evento.acimaDe;
}

export function eventosDeLimiar(antes, depois, lista = EVENTOS_DE_LIMIAR) {
  return lista.filter((evento) => !estaNaZona(evento, antes) && estaNaZona(evento, depois));
}


export function aplicarEventos(antes, indices, aleatorio) {
  const acontecidos = [];

  const sorteado = sortearEventoAleatorio(aleatorio);
  if (sorteado) {
    acontecidos.push(sorteado);
    indices = aplicarVariacoes(indices, sorteado.efeitos);
  }

  for (const evento of eventosDeLimiar(antes, indices)) {
    acontecidos.push(evento);
    indices = aplicarVariacoes(indices, evento.efeitos);
  }

  return { indices, eventos: acontecidos.map((e) => e.id) };
}