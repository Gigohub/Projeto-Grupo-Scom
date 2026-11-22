import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lerCSV,
  normalizarChave,
  lerDisciplina,
  ehArquivoDeProblemas,
  lerProblemas,
  montarProblemas,
  gerarModulo,
} from '../ferramentas/lib-csv.js';

const CSV_AUTOMACAO =
  '\uFEFF"ID","Automação","Dinheiro","Eficiencia","Sustentabilidade","Felicidade","Dinheiro original","Alterado?"\r\n' +
  '"P001","Instalar telemetria de gases para tirar ônibus críticos de rota","-4","-5","7","-5","-3","sim"\r\n' +
  '"P002","Criar app de chamada prioritária de funcionários nas rampas","-2","2","0","-4","-2",""\r\n';

const CSV_MECANICA =
  '"ID","Mecânica","Dinheiro","Eficiencia","Sustentabilidade","Felicidade"\n' +
  '"P001","Retificar motores diesel e trocar bicos injetores","-7","9","-3","4"\n' +
  '"P002","Reconstruir engrenagens e cabos dos elevadores atuais","-10","10","0","9"\n';

const CSV_PROBLEMAS =
  'ID,Título,Tags de Engenharia,Setor,Descrição do Problema\n' +
  'P001,Fumaça Preta na Frota Municipal,[Mecânica] [Ambiental],Mobilidade,"Ônibus antigos operam com motores desregulados, gerando queixas de poluição e multas ambientais."\n' +
  'P002,Terminais sem Acessibilidade,[Mecânica],Mobilidade,Elevadores e escadas rolantes das estações de integração estão parados há meses por falta de peças.\n';
const TEXTOS = lerProblemas(CSV_PROBLEMAS, 'problemas.csv');

// ---------- lerCSV ----------

test('lerCSV separa colunas e remove aspas, BOM e \\r', () => {
  const linhas = lerCSV(CSV_AUTOMACAO);
  assert.equal(linhas.length, 3);
  assert.equal(linhas[0][0], 'ID');
  assert.equal(linhas[0][1], 'Automação');
  assert.deepEqual(linhas[1].slice(2, 6), ['-4', '-5', '7', '-5']);
});

test('lerCSV mantém vírgula que está dentro de aspas', () => {
  const linhas = lerCSV('"a","texto, com vírgula","b"\n');
  assert.deepEqual(linhas[0], ['a', 'texto, com vírgula', 'b']);
});

test('lerCSV entende aspas duplicadas como aspas literais', () => {
  const linhas = lerCSV('"a","ele disse ""oi"""\n');
  assert.deepEqual(linhas[0], ['a', 'ele disse "oi"']);
});

test('lerCSV aceita ponto e vírgula (Excel em português)', () => {
  const linhas = lerCSV('ID;Elétrica;Dinheiro\nP001;Trocar cabos;-8\n');
  assert.deepEqual(linhas[1], ['P001', 'Trocar cabos', '-8']);
});

test('lerCSV ignora linhas vazias', () => {
  const linhas = lerCSV('"a","b"\n\n"c","d"\n\n');
  assert.equal(linhas.length, 2);
});

test('lerCSV ignora linhas só com separadores (sobra comum do Excel)', () => {
  const linhas = lerCSV('a;b;c\n1;2;3\n;;\n;;\n');
  assert.equal(linhas.length, 2);
});

// ---------- normalizarChave ----------

test('normalizarChave tira acentos, espaços e maiúsculas', () => {
  assert.equal(normalizarChave('Automação'), 'automacao');
  assert.equal(normalizarChave(' Elétrica '), 'eletrica');
  assert.equal(normalizarChave('Eficiência'), 'eficiencia');
});

// ---------- lerDisciplina ----------

test('lerDisciplina usa o cabeçalho da 2ª coluna como nome da disciplina', () => {
  const d = lerDisciplina(CSV_AUTOMACAO, 'automacao.csv');
  assert.equal(d.id, 'automacao');
  assert.equal(d.nome, 'Automação');
  assert.equal(d.solucoes.length, 2);
});

test('lerDisciplina converte os efeitos para números', () => {
  const d = lerDisciplina(CSV_AUTOMACAO, 'automacao.csv');
  assert.deepEqual(d.solucoes[0], {
    id: 'P001',
    texto: 'Instalar telemetria de gases para tirar ônibus críticos de rota',
    efeitos: { dinheiro: -4, eficiencia: -5, sustentabilidade: 7, felicidade: -5 },
  });
});

test('lerDisciplina recusa valor que não é número inteiro e diz a linha', () => {
  const ruim = CSV_MECANICA.replace('"-7"', '"abc"');
  assert.throws(() => lerDisciplina(ruim, 'mecanica.csv'), /mecanica\.csv.*linha 2.*dinheiro/i);
});

test('lerDisciplina recusa arquivo sem coluna obrigatória', () => {
  const semFelicidade = '"ID","Mecânica","Dinheiro","Eficiencia","Sustentabilidade"\n"P001","x","-1","1","1"\n';
  assert.throws(() => lerDisciplina(semFelicidade, 'mecanica.csv'), /felicidade/i);
});

test('lerDisciplina recusa arquivo vazio com mensagem clara', () => {
  assert.throws(() => lerDisciplina('', 'vazio.csv'), /vazio\.csv.*vazio/i);
});

test('lerDisciplina recusa arquivo salvo sem UTF-8 (acentos corrompidos)', () => {
  const quebrado = CSV_MECANICA.replace('Mecânica', 'Mec\uFFFDnica');
  assert.throws(() => lerDisciplina(quebrado, 'mecanica.csv'), /mecanica\.csv.*UTF-8/);
});

test('lerDisciplina recusa ID repetido', () => {
  const repetido = CSV_MECANICA + '"P001","outra","-1","1","1","1"\n';
  assert.throws(() => lerDisciplina(repetido, 'mecanica.csv'), /P001.*repetido/i);
});

// ---------- planilha de problemas ----------

test('ehArquivoDeProblemas reconhece a planilha de problemas pela coluna "Título"', () => {
  assert.equal(ehArquivoDeProblemas(CSV_PROBLEMAS), true);
  assert.equal(ehArquivoDeProblemas(CSV_MECANICA), false);
});

test('lerProblemas lê título, setor e descrição (com vírgula dentro das aspas)', () => {
  assert.deepEqual(TEXTOS[0], {
    id: 'P001',
    titulo: 'Fumaça Preta na Frota Municipal',
    setor: 'Mobilidade',
    descricao:
      'Ônibus antigos operam com motores desregulados, gerando queixas de poluição e multas ambientais.',
  });
});

test('lerProblemas recusa problema sem título e diz a linha', () => {
  const semTitulo = CSV_PROBLEMAS.replace('Terminais sem Acessibilidade', '');
  assert.throws(() => lerProblemas(semTitulo, 'problemas.csv'), /problemas\.csv.*linha 3.*título/i);
});

test('lerProblemas recusa planilha sem a coluna de descrição', () => {
  const semDescricao = 'ID,Título,Setor\nP001,Algo,Mobilidade\n';
  assert.throws(() => lerProblemas(semDescricao, 'problemas.csv'), /descricao/i);
});

// ---------- montarProblemas ----------

test('montarProblemas junta textos e soluções de cada disciplina pelo ID', () => {
  const disciplinas = [lerDisciplina(CSV_AUTOMACAO, 'a.csv'), lerDisciplina(CSV_MECANICA, 'm.csv')];
  const problemas = montarProblemas(disciplinas, TEXTOS);
  assert.equal(problemas.length, 2);
  assert.equal(problemas[0].id, 'P001');
  assert.equal(problemas[0].titulo, 'Fumaça Preta na Frota Municipal');
  assert.equal(problemas[0].setor, 'Mobilidade');
  assert.deepEqual(
    problemas[0].solucoes.map((s) => s.disciplina),
    ['automacao', 'mecanica'],
  );
  assert.equal(problemas[1].solucoes[1].texto, 'Reconstruir engrenagens e cabos dos elevadores atuais');
});

test('montarProblemas avisa quando um problema falta em alguma disciplina', () => {
  const soP001 = '"ID","Mecânica","Dinheiro","Eficiencia","Sustentabilidade","Felicidade"\n"P001","x","-1","1","1","1"\n';
  const disciplinas = [lerDisciplina(CSV_AUTOMACAO, 'a.csv'), lerDisciplina(soP001, 'm.csv')];
  assert.throws(() => montarProblemas(disciplinas, TEXTOS), /P002.*mecanica/i);
});

test('montarProblemas avisa quando um problema falta na planilha de problemas', () => {
  const disciplinas = [lerDisciplina(CSV_AUTOMACAO, 'a.csv'), lerDisciplina(CSV_MECANICA, 'm.csv')];
  assert.throws(() => montarProblemas(disciplinas, TEXTOS.slice(0, 1)), /P002.*planilha de problemas/i);
});

// ---------- gerarModulo ----------

test('gerarModulo produz um módulo JS que exporta os dados', async () => {
  const disciplinas = [lerDisciplina(CSV_AUTOMACAO, 'a.csv'), lerDisciplina(CSV_MECANICA, 'm.csv')];
  const codigo = gerarModulo(montarProblemas(disciplinas, TEXTOS), disciplinas);
  assert.match(codigo, /GERADO AUTOMATICAMENTE/);
  const modulo = await import('data:text/javascript,' + encodeURIComponent(codigo));
  assert.equal(modulo.PROBLEMAS.length, 2);
  assert.deepEqual(modulo.DISCIPLINAS, [
    { id: 'automacao', nome: 'Automação' },
    { id: 'mecanica', nome: 'Mecânica' },
  ]);
});