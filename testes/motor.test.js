// Testes do motor do jogo (js/motor/). Rodar com: npm test
//
// Quase todos os testes usam problemas DE MENTIRA (PROBLEMAS_TESTE), com
// efeitos fixos. Assim, se o grupo rebalancear os CSVs, estes testes
// continuam valendo. Só o último bloco usa os dados reais.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, PERFIS } from '../js/config.js';
import { EVENTOS_ALEATORIOS } from '../js/dados/eventos.js';
import { embaralhar, criarEstado, aplicarVariacoes } from '../js/motor/estado.js';
import { turnoAtual, calcularReceita, escolherCarta } from '../js/motor/turno.js';
import { verificarSituacao, avaliarMeta, resultadoFinal } from '../js/motor/fim.js';

// ---------- dados de teste ----------

// Todo problema de teste tem as mesmas 4 soluções, com estes efeitos:
const EFEITOS = {
  ambiental: { dinheiro: -10, eficiencia: 0, sustentabilidade: 10, felicidade: 5 },
  automacao: { dinheiro: -4, eficiencia: -5, sustentabilidade: 7, felicidade: -5 },
  eletrica: { dinheiro: -20, eficiencia: 10, sustentabilidade: 0, felicidade: 0 },
  mecanica: { dinheiro: -2, eficiencia: 3, sustentabilidade: -3, felicidade: 1 },
};

// 40 problemas: T001, T002, ..., T040
const PROBLEMAS_TESTE = Array.from({ length: 40 }, (_, i) => ({
  id: 'T' + String(i + 1).padStart(3, '0'),
  titulo: 'Problema de teste',
  setor: 'Teste',
  descricao: '',
  solucoes: Object.entries(EFEITOS).map(([disciplina, efeitos]) => ({
    disciplina,
    texto: 'Solução ' + disciplina,
    efeitos,
  })),
}));

const OPCOES = { problemas: PROBLEMAS_TESTE, aleatorio: () => 0.99 };

// Estado com índices escolhidos e sempre as mesmas 3 cartas em todos os dias
function estadoDeTeste(indices = {}) {
  const estado = criarEstado('ambiental', OPCOES);
  return {
    ...estado,
    indices: { ...estado.indices, ...indices },
    dias: estado.dias.map((d) => ({ ...d, cartas: ['ambiental', 'automacao', 'eletrica'] })),
  };
}

// Gerador de números "aleatórios" previsível: a mesma semente dá a mesma sequência
function aleatorioComSemente(semente) {
  let s = semente;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// ---------- estado.js ----------

test('embaralhar devolve os mesmos itens em outra ordem, sem mexer na lista original', () => {
  const original = [1, 2, 3, 4, 5];
  const resultado = embaralhar(original);
  assert.deepEqual([...resultado].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(original, [1, 2, 3, 4, 5]);
});

test('criarEstado começa no dia 1 com os valores iniciais da configuração', () => {
  const estado = criarEstado('mecanica', OPCOES);
  assert.equal(estado.perfil, 'mecanica');
  assert.equal(estado.dia, 1);
  assert.equal(estado.situacao, 'jogando');
  assert.deepEqual(estado.indices, CONFIG.inicial);
  assert.deepEqual(estado.historico, []);
});

test('criarEstado sorteia problemas diferentes e cartas diferentes para cada dia', () => {
  const estado = criarEstado('ambiental', OPCOES);
  assert.equal(estado.dias.length, CONFIG.totalDias);
  const ids = estado.dias.map((d) => d.problemaId);
  assert.equal(new Set(ids).size, ids.length, 'algum problema repetiu');
  for (const dia of estado.dias) {
    assert.equal(dia.cartas.length, CONFIG.cartasPorTurno);
    assert.equal(new Set(dia.cartas).size, dia.cartas.length, 'alguma carta repetiu no dia');
  }
});

test('criarEstado com a mesma semente sorteia a mesma partida', () => {
  const a = criarEstado('ambiental', { ...OPCOES, aleatorio: aleatorioComSemente(42) });
  const b = criarEstado('ambiental', { ...OPCOES, aleatorio: aleatorioComSemente(42) });
  assert.deepEqual(a, b);
});

test('criarEstado recusa perfil que não existe', () => {
  assert.throws(() => criarEstado('quimica', OPCOES), /quimica/);
});

test('criarEstado recusa lista com menos problemas do que dias', () => {
  const poucos = { problemas: PROBLEMAS_TESTE.slice(0, 5) };
  assert.throws(() => criarEstado('ambiental', poucos), /5 problemas/);
});

test('aplicarVariacoes prende os índices entre 0 e 100, mas não o dinheiro', () => {
  const indices = { dinheiro: 10, eficiencia: 95, sustentabilidade: 3, felicidade: 50 };
  const novos = aplicarVariacoes(indices, {
    dinheiro: -30,
    eficiencia: 20,
    sustentabilidade: -10,
    felicidade: 0,
  });
  assert.deepEqual(novos, { dinheiro: -20, eficiencia: 100, sustentabilidade: 0, felicidade: 50 });
  assert.equal(indices.eficiencia, 95, 'não pode alterar o objeto original');
});

// ---------- turno.js ----------

test('turnoAtual devolve o problema do dia e as cartas completas', () => {
  const estado = estadoDeTeste();
  const turno = turnoAtual(estado, OPCOES);
  assert.equal(turno.dia, 1);
  assert.equal(turno.problema.id, estado.dias[0].problemaId);
  assert.deepEqual(
    turno.cartas.map((c) => c.disciplina),
    ['ambiental', 'automacao', 'eletrica'],
  );
  assert.deepEqual(turno.cartas[1].efeitos, EFEITOS.automacao);
});

test('calcularReceita: 6 com os índices em 50, 10 em 100 e 2 em 0', () => {
  assert.equal(calcularReceita({ felicidade: 50, eficiencia: 50 }), 6);
  assert.equal(calcularReceita({ felicidade: 100, eficiencia: 100 }), 10);
  assert.equal(calcularReceita({ felicidade: 0, eficiencia: 0 }), 2);
});

test('escolherCarta aplica efeito, desgaste e receita, e avança o dia', () => {
  // começa com 80 / 50 / 50 / 50 e escolhe automação (-4, -5, +7, -5)
  const depois = escolherCarta(estadoDeTeste(), 'automacao', OPCOES);
  // índices: efeito + desgaste de 5
  assert.equal(depois.indices.eficiencia, 40); // 50 - 5 - 5
  assert.equal(depois.indices.sustentabilidade, 52); // 50 + 7 - 5
  assert.equal(depois.indices.felicidade, 40); // 50 - 5 - 5
  // receita calculada com os índices JÁ desgastados: 6 + 4 × (40 - 50) / 50 = 5,2
  assert.ok(Math.abs(depois.historico[0].receita - 5.2) < 1e-9);
  assert.ok(Math.abs(depois.indices.dinheiro - 81.2) < 1e-9); // 80 - 4 + 5,2
  assert.equal(depois.dia, 2);
  assert.equal(depois.historico.length, 1);
  assert.equal(depois.historico[0].disciplina, 'automacao');
});

test('escolherCarta soma efeito e desgaste ANTES de limitar (índice no 100 com +5 continua 100)', () => {
  // ambiental dá +5 de felicidade; com o desgaste de 5, a felicidade fica em 100
  const depois = escolherCarta(estadoDeTeste({ felicidade: 100 }), 'ambiental', OPCOES);
  assert.equal(depois.indices.felicidade, 100);
});

test('escolherCarta não deixa índice ficar negativo', () => {
  const depois = escolherCarta(estadoDeTeste({ felicidade: 3 }), 'automacao', OPCOES);
  assert.equal(depois.indices.felicidade, 0); // 3 - 5 - 5 = -7 → 0
});

test('escolherCarta não altera o estado recebido', () => {
  const antes = estadoDeTeste();
  const copia = structuredClone(antes);
  escolherCarta(antes, 'automacao', OPCOES);
  assert.deepEqual(antes, copia);
});

test('escolherCarta recusa carta que não foi oferecida no dia', () => {
  assert.throws(() => escolherCarta(estadoDeTeste(), 'mecanica', OPCOES), /mecanica/);
});

test('o estado pode ser salvo como texto (JSON) e a partida continua igual', () => {
  const estado = escolherCarta(estadoDeTeste(), 'ambiental', OPCOES);
  const recarregado = JSON.parse(JSON.stringify(estado));
  assert.deepEqual(
    escolherCarta(recarregado, 'eletrica', OPCOES),
    escolherCarta(estado, 'eletrica', OPCOES),
  );
});

// ---------- fim.js ----------

test('falência quando o dinheiro fica negativo no fim do dia', () => {
  // 10 - 20 (elétrica) + 6 (receita) = -4
  const depois = escolherCarta(estadoDeTeste({ dinheiro: 10 }), 'eletrica', OPCOES);
  assert.equal(depois.situacao, 'falencia');
  assert.equal(depois.dia, 1, 'o dia não avança depois da falência');
});

test('a receita do dia entra antes de conferir a falência', () => {
  // 15 - 20 + 6 = 1: a carta custa mais do que o caixa, mas a receita salva
  const depois = escolherCarta(estadoDeTeste({ dinheiro: 15 }), 'eletrica', OPCOES);
  assert.equal(depois.situacao, 'jogando');
});

test('dinheiro exatamente 0 ainda não é falência', () => {
  // 14 - 20 + 6 = 0
  const depois = escolherCarta(estadoDeTeste({ dinheiro: 14 }), 'eletrica', OPCOES);
  assert.equal(depois.indices.dinheiro, 0);
  assert.equal(depois.situacao, 'jogando');
});

test('a partida termina depois do último dia e não aceita mais jogadas', () => {
  let estado = estadoDeTeste({ dinheiro: 1000 });
  for (let i = 0; i < CONFIG.totalDias; i++) {
    estado = escolherCarta(estado, 'ambiental', OPCOES);
  }
  assert.equal(estado.situacao, 'concluida');
  assert.equal(estado.dia, CONFIG.totalDias);
  assert.equal(estado.historico.length, CONFIG.totalDias);
  assert.throws(() => escolherCarta(estado, 'ambiental', OPCOES), /terminou/);
});

test('verificarSituacao: jogando no meio da partida', () => {
  assert.equal(verificarSituacao(estadoDeTeste()), 'jogando');
});

test('avaliarMeta compara cada meta do perfil com o valor final', () => {
  const meta = PERFIS.ambiental.meta; // lida da configuração: vale para qualquer meta
  const noLimite = { ...CONFIG.inicial, ...meta };
  assert.ok(avaliarMeta('ambiental', noLimite).every((m) => m.atingida));

  const [primeira] = Object.keys(meta);
  const abaixo = { ...noLimite, [primeira]: meta[primeira] - 1 };
  const resultado = avaliarMeta('ambiental', abaixo);
  assert.equal(resultado.find((m) => m.indicador === primeira).atingida, false);
});

test('resultadoFinal: vence quem conclui os 30 dias com a meta atingida', () => {
  const meta = PERFIS.ambiental.meta;
  const fim = { ...estadoDeTeste({ ...meta }), situacao: 'concluida' };
  assert.equal(resultadoFinal(fim).venceu, true);
});

test('resultadoFinal: falência nunca é vitória, mesmo com a meta atingida', () => {
  const meta = PERFIS.ambiental.meta;
  const falido = { ...estadoDeTeste({ ...meta, dinheiro: -1 }), situacao: 'falencia' };
  const resultado = resultadoFinal(falido);
  assert.equal(resultado.venceu, false);
  assert.equal(resultado.situacao, 'falencia');
});

test('escolherCarta aplica o evento aleatório sorteado e o registra no histórico', () => {
  const evento = EVENTOS_ALEATORIOS[0];
  const semEvento = escolherCarta(estadoDeTeste(), 'automacao', OPCOES);
  // sorteio 0 → acontece evento; segundo sorteio 0 → o primeiro da lista
  const comEvento = escolherCarta(estadoDeTeste(), 'automacao', { ...OPCOES, aleatorio: () => 0 });
  assert.deepEqual(comEvento.historico[0].eventos, [evento.id]);
  assert.ok(
    Math.abs(comEvento.indices.dinheiro - (semEvento.indices.dinheiro + (evento.efeitos.dinheiro ?? 0))) < 1e-9,
  );
});

test('escolherCarta dispara o êxodo quando a felicidade cai abaixo do limiar', () => {
  // felicidade 20 - 5 (automação) - 5 (desgaste) = 10, abaixo de 15
  const depois = escolherCarta(estadoDeTeste({ felicidade: 20 }), 'automacao', OPCOES);
  assert.deepEqual(depois.historico[0].eventos, ['exodo']);
});

test('resultadoFinal traz o relatório: escolhas, setores e contas do dinheiro', () => {
  let estado = estadoDeTeste();
  for (const disciplina of ['ambiental', 'automacao', 'ambiental']) {
    estado = escolherCarta(estado, disciplina, OPCOES);
  }
  const r = resultadoFinal({ ...estado, situacao: 'concluida' }, OPCOES);
  assert.deepEqual(r.escolhas, [
    { item: 'ambiental', vezes: 2 },
    { item: 'automacao', vezes: 1 },
  ]);
  assert.deepEqual(r.setores, [{ item: 'Teste', vezes: 3 }]);
  assert.equal(r.investido, 24); // 10 + 4 + 10
  assert.deepEqual(r.eventos, []);
  // dinheiro final = inicial + arrecadado - investido + eventos
  const conta = CONFIG.inicial.dinheiro + r.arrecadado - r.investido + r.saldoEventos;
  assert.ok(Math.abs(conta - r.indices.dinheiro) < 1e-9);
});

test('resultadoFinal lista os eventos com o dia em que aconteceram', () => {
  const evento = EVENTOS_ALEATORIOS[0];
  const estado = escolherCarta(estadoDeTeste(), 'ambiental', { ...OPCOES, aleatorio: () => 0 });
  const r = resultadoFinal({ ...estado, situacao: 'concluida' }, OPCOES);
  assert.deepEqual(r.eventos.map((e) => [e.dia, e.id]), [[1, evento.id]]);
  assert.equal(r.saldoEventos, evento.efeitos.dinheiro ?? 0);
});

test('resultadoFinal recusa partida que ainda não terminou', () => {
  assert.throws(() => resultadoFinal(estadoDeTeste()), /não terminou/);
});

// ---------- com os dados reais ----------

test('200 partidas aleatórias com os dados reais: índices nos limites e fim correto', () => {
  const perfis = Object.keys(PERFIS);
  for (let n = 0; n < 200; n++) {
    let estado = criarEstado(perfis[n % perfis.length]);
    while (estado.situacao === 'jogando') {
      const { cartas } = turnoAtual(estado);
      const escolhida = cartas[Math.floor(Math.random() * cartas.length)];
      estado = escolherCarta(estado, escolhida.disciplina);
      for (const id of ['eficiencia', 'sustentabilidade', 'felicidade']) {
        const v = estado.indices[id];
        assert.ok(v >= 0 && v <= 100, `${id} = ${v}`);
      }
    }
    assert.ok(['falencia', 'concluida'].includes(estado.situacao));
    if (estado.situacao === 'concluida') assert.equal(estado.historico.length, CONFIG.totalDias);
    if (estado.situacao === 'falencia') assert.ok(estado.indices.dinheiro < 0);
  }
});