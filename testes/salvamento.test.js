import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salvar, carregar, apagar, lerVitorias, registrarVitoria } from '../js/salvamento.js';
import { criarEstado } from '../js/motor/estado.js';

function armazenamentoFalso() {
  const dados = new Map();
  return {
    getItem: (chave) => (dados.has(chave) ? dados.get(chave) : null),
    setItem: (chave, valor) => dados.set(chave, String(valor)),
    removeItem: (chave) => dados.delete(chave),
  };
}

test('salvar e carregar devolvem a mesma partida', () => {
  const armazenamento = armazenamentoFalso();
  const estado = criarEstado('eletrica');
  salvar(estado, armazenamento);
  assert.deepEqual(carregar(armazenamento), estado);
});

test('registrarVitoria guarda cada perfil uma vez só e lerVitorias devolve a lista', () => {
  const armazenamento = armazenamentoFalso();
  assert.deepEqual(lerVitorias(armazenamento), []);
  registrarVitoria('ambiental', armazenamento);
  registrarVitoria('eletrica', armazenamento);
  assert.deepEqual(registrarVitoria('ambiental', armazenamento), ['ambiental', 'eletrica']);
  assert.deepEqual(lerVitorias(armazenamento), ['ambiental', 'eletrica']);
});

test('lerVitorias devolve lista vazia com dado corrompido', () => {
  const armazenamento = armazenamentoFalso();
  armazenamento.setItem('jogo-engenharia-urbana/vitorias', '{isto não é JSON');
  assert.deepEqual(lerVitorias(armazenamento), []);
});

test('carregar devolve null quando não há partida salva', () => {
  assert.equal(carregar(armazenamentoFalso()), null);
});

test('carregar devolve null com dado corrompido ou de partida já terminada', () => {
  const armazenamento = armazenamentoFalso();
  armazenamento.setItem('jogo-engenharia-urbana/partida', '{isto não é JSON');
  assert.equal(carregar(armazenamento), null);

  salvar({ ...criarEstado('eletrica'), situacao: 'falencia' }, armazenamento);
  assert.equal(carregar(armazenamento), null);
});

test('apagar remove a partida salva', () => {
  const armazenamento = armazenamentoFalso();
  salvar(criarEstado('eletrica'), armazenamento);
  apagar(armazenamento);
  assert.equal(carregar(armazenamento), null);
});

test('sem armazenamento disponível (ex.: aba anônima bloqueada), nada quebra', () => {
  const quebrado = {
    getItem: () => { throw new Error('bloqueado'); },
    setItem: () => { throw new Error('bloqueado'); },
    removeItem: () => { throw new Error('bloqueado'); },
  };
  assert.doesNotThrow(() => salvar(criarEstado('eletrica'), quebrado));
  assert.equal(carregar(quebrado), null);
  assert.doesNotThrow(() => apagar(quebrado));
});