import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { CONFIG, IMAGENS } from '../js/config.js';
import { EVENTOS_ALEATORIOS, EVENTOS_DE_LIMIAR } from '../js/dados/eventos.js';
import {
  eventoBom,
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

test('eventoBom: soma dos efeitos positiva é bom, negativa é ruim', () => {
  assert.equal(eventoBom(buscarEvento('verba-federal')), true);
  assert.equal(eventoBom(buscarEvento('tempestade')), false);
  for (const e of [...EVENTOS_ALEATORIOS, ...EVENTOS_DE_LIMIAR]) {
    assert.notEqual(Object.values(e.efeitos).reduce((s, v) => s + v, 0), 0, e.id);
  }
});

test('as imagens de IMAGENS existem na pasta img, com o nome escrito igual', () => {
  const arquivos = readdirSync(new URL('../img/', import.meta.url));
  for (const caminho of Object.values(IMAGENS)) {
    assert.ok(arquivos.includes(caminho.replace('img/', '')), caminho);
  }
});