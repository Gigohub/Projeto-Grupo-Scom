// Testes do simulador (ferramentas/simular.js). Rodar com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PERFIS } from '../js/config.js';
import { ESTRATEGIAS, simular } from '../ferramentas/simular.js';

const carta = (disciplina, efeitos) => ({ disciplina, texto: '', efeitos });
const CARTAS = [
  carta('a', { dinheiro: -10, eficiencia: 9, sustentabilidade: 0, felicidade: 0 }),
  carta('b', { dinheiro: -2, eficiencia: 0, sustentabilidade: 1, felicidade: 0 }),
  carta('c', { dinheiro: -6, eficiencia: 0, sustentabilidade: 12, felicidade: 0 }),
];

test('estratégia "mais barata" escolhe a carta que custa menos', () => {
  assert.equal(ESTRATEGIAS['mais barata'](CARTAS).disciplina, 'b');
});

test('estratégia "foco na meta" escolhe a carta que mais ajuda a meta do perfil', () => {
  const soSustentabilidade = { meta: { sustentabilidade: 70 } };
  assert.equal(ESTRATEGIAS['foco na meta'](CARTAS, soSustentabilidade).disciplina, 'c');
});

test('simular joga as partidas e devolve proporções entre 0 e 1', () => {
  for (const perfilId of Object.keys(PERFIS)) {
    const r = simular(perfilId, 'aleatória', 20);
    assert.ok(r.falencia >= 0 && r.falencia <= 1);
    assert.ok(r.vitoria >= 0 && r.vitoria + r.falencia <= 1);
    assert.equal(typeof r.mediaFinal.sustentabilidade, 'number');
  }
});