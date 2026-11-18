// Rodar com: npm run simular            (2000 partidas por linha)
//       ou:  npm run simular -- 500     (outro número de partidas)
import { fileURLToPath } from 'node:url';
import { PERFIS } from '../js/config.js';
import { criarEstado } from '../js/motor/estado.js';
import { turnoAtual, escolherCarta } from '../js/motor/turno.js';
import { resultadoFinal } from '../js/motor/fim.js';

function maiorPor(lista, nota) {
  return lista.reduce((melhor, item) => (nota(item) > nota(melhor) ? item : melhor));
}

export const ESTRATEGIAS = {
  aleatória: (cartas, perfil, aleatorio) => cartas[Math.floor(aleatorio() * cartas.length)],
  'mais barata': (cartas) => maiorPor(cartas, (c) => c.efeitos.dinheiro),
  'foco na meta': (cartas, perfil) =>
    maiorPor(cartas, (c) => Object.keys(perfil.meta).reduce((soma, id) => soma + c.efeitos[id], 0)),
};

export function simular(perfilId, estrategia, partidas, aleatorio = Math.random) {
  const escolher = ESTRATEGIAS[estrategia];
  let falencias = 0;
  let vitorias = 0;
  const soma = { dinheiro: 0, eficiencia: 0, sustentabilidade: 0, felicidade: 0 };

  for (let n = 0; n < partidas; n++) {
    let estado = criarEstado(perfilId, { aleatorio });
    while (estado.situacao === 'jogando') {
      const carta = escolher(turnoAtual(estado).cartas, PERFIS[perfilId], aleatorio);
      estado = escolherCarta(estado, carta.disciplina, { aleatorio });
    }
    const resultado = resultadoFinal(estado);
    if (resultado.situacao === 'falencia') falencias++;
    if (resultado.venceu) vitorias++;
    for (const id in soma) soma[id] += resultado.indices[id];
  }

  const mediaFinal = {};
  for (const id in soma) mediaFinal[id] = soma[id] / partidas;
  return { falencia: falencias / partidas, vitoria: vitorias / partidas, mediaFinal };
}

function main() {
  const partidas = Number(process.argv[2]) || 2000;
  const porcento = (x) => `${Math.round(x * 100)}%`;
  const linhas = [];

  for (const [perfilId, perfil] of Object.entries(PERFIS)) {
    for (const estrategia of Object.keys(ESTRATEGIAS)) {
      const r = simular(perfilId, estrategia, partidas);
      linhas.push({
        perfil: perfil.nome,
        estratégia: estrategia,
        falência: porcento(r.falencia),
        vitória: porcento(r.vitoria),
        '💰 final': Math.round(r.mediaFinal.dinheiro),
        '⚡ final': Math.round(r.mediaFinal.eficiencia),
        '🌳 final': Math.round(r.mediaFinal.sustentabilidade),
        '😊 final': Math.round(r.mediaFinal.felicidade),
      });
    }
  }

  console.log(`${partidas} partidas por linha (médias finais incluem as partidas que faliram)`);
  console.table(linhas);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();