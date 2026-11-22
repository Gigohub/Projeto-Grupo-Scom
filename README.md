# COLAPCITY

Jogo de cartas para navegador sobre decisões de engenharia na cidade. Você é
um consultor contratado pela prefeitura e tem 30 dias para resolver os
problemas urbanos escolhendo soluções de quatro engenharias: Ambiental,
Automação, Elétrica e Mecânica.

**▶ Jogar agora:** <https://gigohub.github.io/Projeto-Grupo-Scom/>

Funciona no computador e no celular, sem instalar nada.

## Como funciona

- A cidade tem 4 índices: 💰 Dinheiro, ⚡ Eficiência, 🌳 Sustentabilidade e
  😊 Felicidade.
- A cada dia chega um problema real da cidade (entre 100 cadastrados) com 3
  soluções de engenharias diferentes. Cada solução muda os índices.
- Todo dia a eficiência, a sustentabilidade e a felicidade caem um pouco pelo
  desgaste da cidade, e a prefeitura arrecada dinheiro (mais quando a cidade
  está eficiente e feliz).
- Eventos podem acontecer: alguns por acaso (tempestade, festival,
  investidores...) e outros quando um índice passa de um limite (êxodo de
  moradores, apagão, prêmio de cidade sustentável).
- Se o dinheiro ficar negativo, a cidade vai à falência. Vence quem chega ao
  dia 30 com a meta do seu perfil.
- **Personagem bônus:** ao vencer com os 4 engenheiros, o Prefeito é liberado,
  com uma meta mais difícil (equilibrar os 4 índices).
- A partida fica salva no navegador: dá para fechar e continuar depois.

## Como rodar localmente

O jogo usa módulos JavaScript (`import`), que o navegador bloqueia quando o
`index.html` é aberto com duplo clique. Use um servidor local:

- **VS Code:** instale a extensão *Live Server*, clique com o botão direito no
  `index.html` → *Open with Live Server*; **ou**
- **Terminal:** na pasta do projeto, rode `python -m http.server 8000` e abra
  <http://localhost:8000>.

Para os testes, o conversor e o simulador é preciso o
[Node.js](https://nodejs.org) 18 ou mais recente. O jogo em si não precisa.

## Publicação (GitHub Pages)

O jogo é publicado direto do repositório, sem etapa de build. No GitHub:
**Settings → Pages → Build and deployment → Source: Deploy from a branch**,
branch `main`, pasta `/ (root)`. Cada `git push` na `main` atualiza o site em
alguns minutos.

## Testes

```
npm test
```

Testam o motor do jogo (turnos, receita, eventos, fim de partida, perfil
bônus), o salvamento, os problemas e soluções gerados dos CSVs, o simulador e
se as imagens de evento, vitória e derrota existem com o nome exato.

## Simulador de balanceamento

```
npm run simular
```

Joga 2000 partidas por perfil com três jogadores automáticos (aleatório,
sempre a carta mais barata e foco na meta do perfil) e mostra a taxa de
falência, a taxa de vitória e a média final de cada índice. Use depois de
mudar as metas, as regras ou os CSVs. Para outro número de partidas:
`npm run simular -- 500`. 

## Como editar o conteúdo

| O que mudar | Onde |
|---|---|
| Problemas e soluções | CSVs em `dados-fonte/` e depois `npm run converter` (veja abaixo) |
| Regras numéricas (valores iniciais, desgaste, receita, limites, chance de eventos) | `js/config.js` → `CONFIG` |
| Perfis, personagens e metas | `js/config.js` → `PERFIS` |
| Imagens de evento bom/ruim, vitória e derrota | `js/config.js` → `IMAGENS` (arquivos em `img/`) |
| Eventos | `js/dados/eventos.js` |
| Música de fundo | `musica.mp3` |

**CSVs:** um CSV de problemas (colunas `ID`, `Título`, `Setor` e
`Descrição do Problema`) e um CSV por engenharia (colunas `ID`, nome da
engenharia com o texto da solução, `Dinheiro`, `Eficiencia`,
`Sustentabilidade`, `Felicidade`). Os IDs (`P001`...) ligam cada problema às
suas soluções. No Excel, salve como **"CSV UTF-8"** para não estragar os
acentos. Depois rode `npm run converter` e `npm test`. Nunca edite
`js/dados/problemas.js` à mão: ele é gerado pelo conversor.


## Estrutura

| Pasta/arquivo | Para que serve |
|---|---|
| `index.html` | Página do jogo |
| `css/style.css` | Aparência (cores, cartas, painel, versão de celular) |
| `js/main.js` | Liga o motor, as telas, o salvamento e a música |
| `js/config.js` | Regras numéricas, perfis e imagens |
| `js/motor/` | Regras do jogo, sem tela (estado, turno, eventos, fim) — testáveis no Node |
| `js/interface/` | Desenho das telas (capa, perfis, dia, final) e componentes |
| `js/salvamento.js` | Guarda a partida e as vitórias no navegador (localStorage) |
| `js/musica.js` | Música de fundo com botão de ligar/desligar |
| `js/dados/problemas.js` | Problemas e soluções (gerado a partir dos CSVs) |
| `js/dados/eventos.js` | Eventos aleatórios e de limiar |
| `dados-fonte/` | CSVs editáveis — a fonte dos problemas e soluções |
| `img/` | Ilustrações do jogo |
| `musica.mp3` | Música de fundo |
| `ferramentas/` | Conversor de CSV e simulador de balanceamento |
| `testes/` | Testes automatizados (`node --test`) |

## Créditos

- **Equipe:** Augusto Dutra Sierra, Caio Gabriel Pereira de Morais e Lucas Yuta Ameda — Unesp.
- **Ilustrações:** criados pela equipe.
- **problemas e soluções:** feito com ajuda da inteligência artificial Google Gemini.
- **Música:** "By My Side", de Marcus P. — [Bensound](https://www.bensound.com/royalty-free-music/track/by-my-side-joyful-party) (Free Music, uso com atribuição).
- Inspirado na mecânica de jogos de decisão por cartas (como *Sort the
  Court e Reigns*); nenhum código, arte ou texto desses jogos foi usado.

## Uso de IA generativa

Parte do código foi desenvolvida com apoio do Claude (Anthropic) e Gemini (Google), com revisão e validação da equipe. A declaração completa — ferramenta, finalidade, trechos produzidos, modificações feitas pela equipe e avaliação crítica — está na seção "Uso de IA generativa" do relatório técnico.