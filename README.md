# Jogo de Engenharia Urbana

Jogo de cartas por turnos: você é um consultor contratado pela prefeitura e tem
30 dias para resolver os problemas da cidade escolhendo soluções de quatro
disciplinas da engenharia (Ambiental, Automação, Elétrica e Mecânica).

## Requisitos

- Um navegador moderno (Chrome, Edge, Firefox).
- [Node.js](https://nodejs.org) 18 ou mais recente, **só** para rodar os testes
  e o conversor de CSV. O jogo em si não precisa de Node.

## Como rodar o jogo localmente

O jogo usa módulos JavaScript (`import`), que o navegador bloqueia quando o
arquivo é aberto com duplo clique. Use um servidor local:

- **VS Code:** instale a extensão *Live Server*, clique com o botão direito no
  `index.html` → *Open with Live Server*; **ou**
- **Terminal:** na pasta do projeto, rode `python -m http.server 8000` e abra
  <http://localhost:8000>.

## Como editar os problemas e soluções

1. Edite os CSVs em `dados-fonte/`:
   - **um CSV de problemas**, com as colunas `ID`, `Título`, `Setor` e
     `Descrição do Problema` (é reconhecido pela coluna `Título`);
   - **um CSV por disciplina**, com as soluções. Colunas obrigatórias: `ID`,
     nome da disciplina (2ª coluna, com o texto da solução), `Dinheiro`,
     `Eficiencia`, `Sustentabilidade`, `Felicidade`.

   Os IDs (`P001`...) ligam cada problema às suas soluções. Outras colunas são
   ignoradas, e o nome dos arquivos não importa. Pode salvar com vírgula ou
   ponto e vírgula.
2. Rode `npm run converter` para gerar `js/dados/problemas.js`.
3. Rode `npm test` para conferir se está tudo consistente.

Nunca edite `js/dados/problemas.js` à mão: ele é sobrescrito pelo conversor.

## Como rodar os testes

```
npm test
```

## Estrutura

| Pasta/arquivo | Para que serve |
|---|---|
| `index.html` | Página do jogo |
| `js/config.js` | Todas as regras numéricas (valores iniciais, desgaste, receita, metas) |
| `js/dados/problemas.js` | Problemas e soluções (gerado a partir dos CSVs) |
| `dados-fonte/` | CSVs editáveis — a fonte dos dados |
| `ferramentas/` | Conversor de CSV (e, depois, o simulador de balanceamento) |
| `testes/` | Testes automatizados (`node --test`) |
| `index.html` | Página do jogo |
| `css/estilo.css` | Aparência (cores, cartas, painel) |
| `js/main.js` | Liga o motor, as telas e o salvamento |
| `js/motor/` | Regras do jogo, sem tela (estado, turno, fim) — testáveis no Node |
| `js/interface/` | Desenho das telas (inicial, do dia, final) |
| `js/salvamento.js` | Guarda a partida no navegador (localStorage) |