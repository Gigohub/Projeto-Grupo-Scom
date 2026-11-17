// Todas as "regras numéricas" do jogo ficam aqui.
// Para balancear o jogo, mude estes valores — não o código do motor.

export const CONFIG = {
    totalDias: 30,
    cartasPorTurno: 3, // sorteadas entre as 4 soluções de cada problema
  
    // Valores no início da partida
    inicial: {
      dinheiro: 80,
      eficiencia: 50,
      sustentabilidade: 50,
      felicidade: 50,
    },
  
    // Faixa dos índices limitados (o dinheiro não tem teto)
    limites: { min: 0, max: 100 },
  
    // Quanto eficiência, sustentabilidade e felicidade caem sozinhas por dia
    // (a infraestrutura envelhece e a população cobra)
    desgasteDiario: 5,
  
    // Receita diária = base + bonusMaximo × ((felicidade + eficiência) / 2 − 50) / 50
    // Com os índices em 50 a cidade recebe "base"; em 100 recebe base + bonusMaximo.
    receita: { base: 6, bonusMaximo: 4 },
  
    // Limiares que disparam eventos especiais
    limiares: {
      exodoFelicidade: 15, // felicidade abaixo disso → êxodo
      apagaoEficiencia: 20, // eficiência abaixo disso → apagão
      premioSustentabilidade: 85, // sustentabilidade acima disso → prêmio
    },
  
    // Chance (0 a 1) de um evento aleatório acontecer em cada dia
    chanceEventoAleatorio: 0.15,
  };
  
  // Os 4 indicadores mostrados na tela. "limitado" = fica entre 0 e 100.
  export const INDICADORES = [
    { id: 'dinheiro', nome: 'Dinheiro', icone: '💰', limitado: false },
    { id: 'eficiencia', nome: 'Eficiência', icone: '⚡', limitado: true },
    { id: 'sustentabilidade', nome: 'Sustentabilidade', icone: '🌳', limitado: true },
    { id: 'felicidade', nome: 'Felicidade', icone: '😊', limitado: true },
  ];
  
  // Perfis jogáveis. O id é igual ao da disciplina nos CSVs.
  // meta = valores mínimos no dia 30 para vencer.
  // ATENÇÃO: metas PROVISÓRIAS — o grupo vai definir as definitivas.
  export const PERFIS = {
    ambiental: { nome: 'Ambiental', meta: { sustentabilidade: 70 } },
    automacao: { nome: 'Automação', meta: { eficiencia: 60, felicidade: 60 } },
    eletrica: { nome: 'Elétrica', meta: { eficiencia: 70 } },
    mecanica: { nome: 'Mecânica', meta: { dinheiro: 50 } },
  };