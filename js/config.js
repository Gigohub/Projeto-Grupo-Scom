export const CONFIG = {
    totalDias: 30,
    cartasPorTurno: 3, // sorteadas entre as 4 soluções de cada problema
  
    inicial: {
      dinheiro: 80,
      eficiencia: 50,
      sustentabilidade: 50,
      felicidade: 50,
    },
  
    limites: { min: 0, max: 100 },
  
     desgasteDiario: 5,
  
     receita: { base: 6, bonusMaximo: 4 },
  

    limiares: {
      exodoFelicidade: 15, 
      apagaoEficiencia: 20, 
      premioSustentabilidade: 85, 
    },
  
    // Chance (0 a 1) de um evento aleatório acontecer em cada dia
    chanceEventoAleatorio: 0.15,
  };
  
  export const INDICADORES = [
    { id: 'dinheiro', nome: 'Dinheiro', icone: '💰', limitado: false },
    { id: 'eficiencia', nome: 'Eficiência', icone: '⚡', limitado: true },
    { id: 'sustentabilidade', nome: 'Sustentabilidade', icone: '🌳', limitado: true },
    { id: 'felicidade', nome: 'Felicidade', icone: '😊', limitado: true },
  ];
   
  export const PERFIS = {
  ambiental: {
    nome: 'Ambiental',
    personagem: 'Dra. Clara Mendes',
    imagem: 'img/ambiental.png',
    meta: { sustentabilidade: 70 },
  },
  automacao: {
    nome: 'Automação',
    personagem: 'Eng. Lucas Sato',
    imagem: 'img/automacao.png',
    meta: { eficiencia: 60, felicidade: 60 },
  },
  eletrica: {
    nome: 'Elétrica',
    personagem: 'Eng. Marina Costa',
    imagem: 'img/eletrica.png',
    meta: { eficiencia: 70 },
  },
  mecanica: {
    nome: 'Mecânica',
    personagem: 'Eng. Rafael Souza',
    imagem: 'img/mecanica.png',
    meta: { dinheiro: 50 },
  },
};
