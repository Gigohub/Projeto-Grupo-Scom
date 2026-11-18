// Testes dos eventos (js/motor/eventos.js). Rodar com: npm test
// Os efeitos são lidos de js/dados/eventos.js, então os testes continuam
// valendo se o grupo mudar os números dos eventos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { EVENTOS_ALEATORIOS, EVENTOS_DE_LIMIAR } from '../js/dados/eventos.js';
import {
  buscarEvento,
  sortearEventoAleatorio,
  eventosDeLimiar,
  aplicarEventos,
} from '../js/motor/eventos.js';

// Devolve os números da lista, um por chamada (e recomeça no fim)
function sequencia(...valores) {
  let i = 0;
  return () => valores[i++ % valores.length];
}

const NORMAL = { dinheiro: 80, eficiencia: 50, sustentabilidade: 50, felicidade: 50 };
const NENHUM_SORTEIO = () => 0.99; // acima da chance: nunca sai evento aleatório

test('sortearEventoAleatorio: nenhum evento quando o sorteio passa da chance', () => {
  assert.equal(sortearEventoAleatorio(() => CONFIG.chanceEventoAleatorio), null);
});

test('sortearEventoAleatorio: o segundo sorteio escolhe qual evento', () => {
  assert.equal(sortearEventoAleatorio(sequencia(0, 0)), EVENTOS_ALEATORIOS[0]);
  assert.equal(sortearEventoAleatorio(sequencia(0, 0.999)), EVENTOS_ALEATORIOS.at(-1));
});

test('eventosDeLimiar: êxodo no dia em que a felicidade cai abaixo do limiar', () => {
  const depois = { ...NORMAL, felicidade: CONFIG.limiares.exodoFelicidade - 1 };
  assert.deepEqual(eventosDeLimiar(NORMAL, depois).map((e) => e.id), ['exodo']);
});

test('eventosDeLimiar: não repete enquanto o índice continua na zona', () => {
  const baixa = { ...NORMAL, felicidade: 5 };
  assert.deepEqual(eventosDeLimiar(baixa, { ...baixa, felicidade: 3 }), []);
});

test('eventosDeLimiar: prêmio quando a sustentabilidade passa do limiar', () => {
  const depois = { ...NORMAL, sustentabilidade: CONFIG.limiares.premioSustentabilidade + 1 };
  assert.deepEqual(eventosDeLimiar(NORMAL, depois).map((e) => e.id), ['premio-sustentabilidade']);
});

test('aplicarEventos aplica o evento sorteado e devolve o id dele', () => {
  const evento = EVENTOS_ALEATORIOS[0];
  const { indices, eventos } = aplicarEventos(NORMAL, NORMAL, sequencia(0, 0));
  assert.deepEqual(eventos, [evento.id]);
  for (const id of Object.keys(NORMAL)) {
    assert.equal(indices[id], NORMAL[id] + (evento.efeitos[id] ?? 0), id);
  }
});

test('aplicarEventos sem sorteio e sem limiar não muda nada', () => {
  assert.deepEqual(aplicarEventos(NORMAL, NORMAL, NENHUM_SORTEIO), { indices: NORMAL, eventos: [] });
});

test('buscarEvento encontra eventos aleatórios e de limiar, e recusa id desconhecido', () => {
  assert.equal(buscarEvento(EVENTOS_ALEATORIOS[1].id), EVENTOS_ALEATORIOS[1]);
  assert.equal(buscarEvento('exodo'), EVENTOS_DE_LIMIAR[0]);
  assert.throws(() => buscarEvento('meteoro'), /meteoro/);
});

test('todo evento tem id único, título, descrição e só efeitos em indicadores conhecidos', () => {
  const todos = [...EVENTOS_ALEATORIOS, ...EVENTOS_DE_LIMIAR];
  assert.equal(new Set(todos.map((e) => e.id)).size, todos.length, 'id repetido');
  for (const e of todos) {
    assert.ok(e.titulo && e.descricao, e.id);
    for (const id of Object.keys(e.efeitos)) assert.ok(id in NORMAL, `${e.id}: "${id}"`);
  }
});