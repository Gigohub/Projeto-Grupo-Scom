// Funções "puras" que transformam o texto dos CSVs nos dados do jogo.
// Puras = só recebem valores e devolvem valores: não leem nem gravam
// arquivos. Por isso dá para testar tudo em testes/csv.test.js.

// Colunas que todo CSV de disciplina precisa ter (já normalizadas).
const COLUNAS_EFEITO = ['dinheiro', 'eficiencia', 'sustentabilidade', 'felicidade'];

/**
 * Lê o texto de um CSV e devolve uma lista de linhas,
 * cada linha sendo uma lista de células (strings).
 * - remove o BOM (caractere invisível que o Excel coloca no início)
 * - aceita quebra de linha do Windows (\r\n) ou do Linux (\n)
 * - aceita vírgula ou ponto e vírgula como separador (detecta pelo cabeçalho)
 * - respeita aspas: "texto, com vírgula" vira uma célula só
 *   e "" dentro de aspas vira uma aspa literal
 * - ignora linhas vazias
 */
export function lerCSV(texto) {
  texto = texto.replace(/^\uFEFF/, '');
  const separador = detectarSeparador(texto);

  const linhas = [];
  let linha = [];
  let celula = '';
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (dentroDeAspas) {
      if (c === '"' && texto[i + 1] === '"') {
        celula += '"'; // aspas duplicadas = uma aspa de verdade
        i++;
      } else if (c === '"') {
        dentroDeAspas = false; // fechou as aspas
      } else {
        celula += c;
      }
    } else if (c === '"') {
      dentroDeAspas = true;
    } else if (c === separador) {
      linha.push(celula);
      celula = '';
    } else if (c === '\n') {
      linha.push(celula);
      linhas.push(linha);
      linha = [];
      celula = '';
    } else if (c !== '\r') {
      celula += c;
    }
  }
  // última linha, caso o arquivo não termine com quebra de linha
  if (celula !== '' || linha.length > 0) {
    linha.push(celula);
    linhas.push(linha);
  }

  // descarta linhas em que todas as células estão vazias (ex.: "" ou ";;;;")
  return linhas.filter((l) => !l.every((celula) => celula.trim() === ''));
}

/** Olha só a primeira linha: se tiver mais ";" do que ",", o separador é ";". */
function detectarSeparador(texto) {
  const primeira = texto.split('\n', 1)[0];
  const virgulas = primeira.split(',').length;
  const pontoVirgulas = primeira.split(';').length;
  return pontoVirgulas > virgulas ? ';' : ',';
}

/**
 * Transforma um nome em um identificador simples:
 * "Automação" → "automacao", " Eficiência " → "eficiencia".
 */
export function normalizarChave(nome) {
  return nome
    .normalize('NFD') // separa letra e acento ("ã" vira "a" + "~")
    .replace(/[\u0300-\u036f]/g, '') // apaga os acentos
    .trim()
    .toLowerCase();
}

/**
 * Lê o CSV de UMA disciplina e devolve:
 * { id, nome, solucoes: [{ id, texto, efeitos: { dinheiro, eficiencia, sustentabilidade, felicidade } }] }
 * O nome da disciplina vem do cabeçalho da 2ª coluna (ex.: "Automação").
 * Colunas extras (ex.: "Dinheiro original") são ignoradas.
 * `nomeArquivo` serve só para as mensagens de erro ficarem claras.
 */
export function lerDisciplina(texto, nomeArquivo) {
  // o caractere \uFFFD (aparece como um losango com ?) surge quando o arquivo não foi salvo em UTF-8 e os acentos se perderam
  if (texto.includes('\uFFFD')) {
    throw new Error(
      `${nomeArquivo}: acentos corrompidos. No Excel, use "Salvar como" → "CSV UTF-8".`,
    );
  }

  const [cabecalho, ...linhas] = lerCSV(texto);
  if (!cabecalho) {
    throw new Error(`${nomeArquivo}: arquivo vazio`);
  }
  const chaves = cabecalho.map(normalizarChave);

  for (const coluna of ['id', ...COLUNAS_EFEITO]) {
    if (!chaves.includes(coluna)) {
      throw new Error(`${nomeArquivo}: falta a coluna "${coluna}" no cabeçalho`);
    }
  }
  const nome = (cabecalho[1] ?? '').trim();

  const idsVistos = new Set();
  const solucoes = linhas.map((celulas, indice) => {
    const numeroLinha = indice + 2; // +1 do cabeçalho, +1 porque a contagem começa em 1
    const valor = (coluna) => (celulas[chaves.indexOf(coluna)] ?? '').trim();

    const id = valor('id');
    if (idsVistos.has(id)) {
      throw new Error(`${nomeArquivo}: problema ${id} repetido (linha ${numeroLinha})`);
    }
    idsVistos.add(id);

    const efeitos = {};
    for (const coluna of COLUNAS_EFEITO) {
      const texto = valor(coluna);
      if (!/^-?\d+$/.test(texto)) {
        throw new Error(
          `${nomeArquivo}, linha ${numeroLinha}: "${texto}" em ${coluna} não é um número inteiro`,
        );
      }
      efeitos[coluna] = Number(texto);
    }

    return { id, texto: (celulas[1] ?? '').trim(), efeitos };
  });

  return { id: normalizarChave(nome), nome, solucoes };
}

/**
 * Junta as disciplinas em uma lista de problemas, cada um com uma
 * solução por disciplina (na mesma ordem das disciplinas recebidas):
 * [{ id: 'P001', enunciado: '', solucoes: [{ disciplina, texto, efeitos }, ...] }]
 * Dá erro se algum problema não existir em todas as disciplinas.
 */
export function montarProblemas(disciplinas) {
  const todosIds = new Set(disciplinas.flatMap((d) => d.solucoes.map((s) => s.id)));
  const idsOrdenados = [...todosIds].sort();

  return idsOrdenados.map((id) => ({
    id,
    enunciado: '', // os textos dos problemas ainda serão escritos
    solucoes: disciplinas.map((d) => {
      const solucao = d.solucoes.find((s) => s.id === id);
      if (!solucao) {
        throw new Error(`O problema ${id} não tem solução na disciplina ${d.id}`);
      }
      return { disciplina: d.id, texto: solucao.texto, efeitos: solucao.efeitos };
    }),
  }));
}

/**
 * Gera o texto do arquivo js/dados/problemas.js.
 * Usamos JSON.stringify para escrever os dados com segurança
 * (ele cuida de aspas e acentos dentro dos textos).
 */
export function gerarModulo(problemas, disciplinas) {
  const listaDisciplinas = disciplinas.map((d) => ({ id: d.id, nome: d.nome }));
  return (
    '// ARQUIVO GERADO AUTOMATICAMENTE por ferramentas/converter-csv.js\n' +
    '// NÃO edite à mão: edite os CSVs em dados-fonte/ e rode "npm run converter".\n\n' +
    `export const DISCIPLINAS = ${JSON.stringify(listaDisciplinas, null, 2)};\n\n` +
    `export const PROBLEMAS = ${JSON.stringify(problemas, null, 2)};\n`
  );
}