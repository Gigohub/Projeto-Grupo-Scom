// Programa de linha de comando: lê todos os CSVs de dados-fonte/
// e gera js/dados/problemas.js. Rodar com: npm run converter
//
// A lógica fica em lib-csv.js (testada). Aqui só lemos e gravamos arquivos.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerDisciplina, montarProblemas, gerarModulo } from './lib-csv.js';

// Pasta raiz do projeto (um nível acima de ferramentas/)
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA_CSV = join(RAIZ, 'dados-fonte');
const SAIDA = join(RAIZ, 'js', 'dados', 'problemas.js');

function main() {
  // pega todos os .csv da pasta (o nome do arquivo não importa)
  const arquivos = readdirSync(PASTA_CSV).filter((nome) => nome.toLowerCase().endsWith('.csv'));

  if (arquivos.length === 0) {
    throw new Error(`Nenhum CSV encontrado em ${PASTA_CSV}`);
  }

  // ordena pelo id da disciplina: assim a saída é sempre a mesma,
  // mesmo que alguém renomeie os arquivos
  const disciplinas = arquivos
    .map((nome) => lerDisciplina(readFileSync(join(PASTA_CSV, nome), 'utf8'), nome))
    .sort((a, b) => a.id.localeCompare(b.id));
  const problemas = montarProblemas(disciplinas);

  writeFileSync(SAIDA, gerarModulo(problemas, disciplinas), 'utf8');

  console.log(`OK: ${problemas.length} problemas × ${disciplinas.length} disciplinas`);
  for (const d of disciplinas) console.log(`   - ${d.nome} (${d.solucoes.length} soluções)`);
  console.log(`Gerado: ${SAIDA}`);
}

try {
  main();
} catch (erro) {
  // mensagem curta e clara em vez de um erro gigante do Node
  console.error('ERRO na conversão: ' + erro.message);
  process.exitCode = 1;
}