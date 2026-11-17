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
 * Parte comum da leitura de qualquer CSV (disciplinas e problemas):
 * confere acentos, arquivo vazio, colunas obrigatórias e IDs repetidos.
 * Devolve o cabeçalho e um registro por linha: { id, numeroLinha, celulas, valor }
 * — valor('setor') devolve a célula daquela coluna, já sem espaços nas pontas.
 * `nomeArquivo` serve só para as mensagens de erro ficarem claras.
 */
function lerTabela(texto, nomeArquivo, obrigatorias) {
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

  for (const coluna of ['id', ...obrigatorias]) {
    if (!chaves.includes(coluna)) {
      throw new Error(`${nomeArquivo}: falta a coluna "${coluna}" no cabeçalho`);
    }
  }

  const idsVistos = new Set();
  const registros = linhas.map((celulas, indice) => {
    const numeroLinha = indice + 2; // +1 do cabeçalho, +1 porque a contagem começa em 1
    const valor = (coluna) => (celulas[chaves.indexOf(coluna)] ?? '').trim();

    const id = valor('id');
    if (idsVistos.has(id)) {
      throw new Error(`${nomeArquivo}: problema ${id} repetido (linha ${numeroLinha})`);
    }
    idsVistos.add(id);
    return { id, numeroLinha, celulas, valor };
  });

  return { cabecalho, registros };
}

/**
 * Lê o CSV de UMA disciplina e devolve:
 * { id, nome, solucoes: [{ id, texto, efeitos: { dinheiro, eficiencia, sustentabilidade, felicidade } }] }
 * O nome da disciplina vem do cabeçalho da 2ª coluna (ex.: "Automação").
 * Colunas extras (ex.: "Dinheiro original") são ignoradas.
 */
export function lerDisciplina(texto, nomeArquivo) {
  const { cabecalho, registros } = lerTabela(texto, nomeArquivo, COLUNAS_EFEITO);
  const nome = (cabecalho[1] ?? '').trim();

  const solucoes = registros.map(({ id, numeroLinha, celulas, valor }) => {
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

// Colunas obrigatórias da planilha de problemas (já normalizadas).
const COLUNAS_PROBLEMA = ['titulo', 'setor', 'descricao do problema'];

/** A planilha de problemas é a única com a coluna "Título"; as de disciplina não têm. */
export function ehArquivoDeProblemas(texto) {
  const [cabecalho = []] = lerCSV(texto);
  return cabecalho.map(normalizarChave).includes('titulo');
}

/**
 * Lê a planilha de problemas e devolve:
 * [{ id: 'P001', titulo: 'Fumaça Preta...', setor: 'Mobilidade', descricao: 'Ônibus antigos...' }]
 * Outras colunas (ex.: "Tags de Engenharia") são ignoradas.
 */
export function lerProblemas(texto, nomeArquivo) {
  const { registros } = lerTabela(texto, nomeArquivo, COLUNAS_PROBLEMA);
  return registros.map(({ id, numeroLinha, valor }) => {
    if (!valor('titulo')) {
      throw new Error(`${nomeArquivo}, linha ${numeroLinha}: o problema ${id} está sem título`);
    }
    return { id, titulo: valor('titulo'), setor: valor('setor'), descricao: valor('descricao do problema') };
  });
}

/**
 * Junta os textos dos problemas com as soluções das disciplinas. Cada problema
 * fica com uma solução por disciplina (na mesma ordem das disciplinas recebidas):
 * [{ id, titulo, setor, descricao, solucoes: [{ disciplina, texto, efeitos }, ...] }]
 * Dá erro se algum ID faltar na planilha de problemas ou em alguma disciplina.
 */
export function montarProblemas(disciplinas, textos) {
  const todosIds = new Set([
    ...textos.map((t) => t.id),
    ...disciplinas.flatMap((d) => d.solucoes.map((s) => s.id)),
  ]);
  const idsOrdenados = [...todosIds].sort();

  return idsOrdenados.map((id) => {
    const textoDoProblema = textos.find((t) => t.id === id);
    if (!textoDoProblema) {
      throw new Error(`O problema ${id} tem soluções, mas não está na planilha de problemas`);
    }
    return {
      ...textoDoProblema,
      solucoes: disciplinas.map((d) => {
        const solucao = d.solucoes.find((s) => s.id === id);
        if (!solucao) {
          throw new Error(`O problema ${id} não tem solução na disciplina ${d.id}`);
        }
        return { disciplina: d.id, texto: solucao.texto, efeitos: solucao.efeitos };
      }),
    };
  });
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