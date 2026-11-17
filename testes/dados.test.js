// Confere se os dados gerados (js/dados/problemas.js) e a configuração
// (js/config.js) combinam entre si. Se alguém editar um CSV e esquecer de
// rodar "npm run converter", ou digitar uma meta errada, estes testes avisam.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEMAS, DISCIPLINAS } from '../js/dados/problemas.js';
import { CONFIG, INDICADORES, PERFIS } from '../js/config.js';

test('existem problemas suficientes para uma partida inteira', () => {
  assert.ok(PROBLEMAS.length >= CONFIG.totalDias, `só há ${PROBLEMAS.length} problemas`);
});

test('todo problema tem uma solução de cada disciplina', () => {
  for (const p of PROBLEMAS) {
    assert.equal(p.solucoes.length, DISCIPLINAS.length, `problema ${p.id}`);
  }
});

test('cada turno consegue mostrar o número de cartas configurado', () => {
  assert.ok(DISCIPLINAS.length >= CONFIG.cartasPorTurno);
});

test('toda disciplina dos dados tem um perfil jogável na configuração', () => {
  for (const d of DISCIPLINAS) {
    assert.ok(PERFIS[d.id], `falta o perfil "${d.id}" em PERFIS`);
  }
});

test('as metas dos perfis usam só indicadores que existem', () => {
  for (const [id, perfil] of Object.entries(PERFIS)) {
    for (const indicador of Object.keys(perfil.meta)) {
      assert.ok(INDICADORES.some((i) => i.id === indicador), `perfil ${id}: indicador "${indicador}"`);
    }
  }
});

test('os valores iniciais dos índices estão dentro dos limites', () => {
  for (const i of INDICADORES) {
    const valor = CONFIG.inicial[i.id];
    assert.equal(typeof valor, 'number', `falta valor inicial de ${i.id}`);
    if (i.limitado) {
      assert.ok(valor >= CONFIG.limites.min && valor <= CONFIG.limites.max, i.id);
    }
  }
});