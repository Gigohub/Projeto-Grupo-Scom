import { CONFIG } from '../config.js';

// Podem acontecer em qualquer dia, com a chance de CONFIG.chanceEventoAleatorio.
export const EVENTOS_ALEATORIOS = [
  {
    id: 'tempestade',
    titulo: 'Tempestade de verão',
    descricao: 'Um temporal derrubou árvores e alagou ruas. As equipes de emergência trabalharam a noite toda.',
    efeitos: { dinheiro: -5, eficiencia: -4, felicidade: -2 },
  },
  {
    id: 'verba-federal',
    titulo: 'Verba federal aprovada',
    descricao: 'O governo federal liberou um repasse extra para obras de infraestrutura.',
    efeitos: { dinheiro: 10 },
  },
  {
    id: 'festival',
    titulo: 'Festival de inverno',
    descricao: 'Um festival cultural lotou a cidade de turistas e movimentou o comércio.',
    efeitos: { dinheiro: 4, felicidade: 5 },
  },
  {
    id: 'greve',
    titulo: 'Greve no transporte',
    descricao: 'Motoristas de ônibus pararam por dois dias, e a cidade travou.',
    efeitos: { eficiencia: -10, felicidade: -8 },
  },
  {
    id: 'onda-de-calor',
    titulo: 'Onda de calor',
    descricao: 'Temperaturas recordes aumentaram o consumo de água e de energia.',
    efeitos: { dinheiro: -3, sustentabilidade: -5, felicidade: -2 },
  },
  {
    id: 'doacao',
    titulo: 'Doação de empresa local',
    descricao: 'Uma empresa da cidade doou recursos para projetos ambientais.',
    efeitos: { dinheiro: 5, sustentabilidade: 3 },
  },
  {
    id: 'investidores',
    titulo: 'Visita de investidores',
    descricao: 'Uma comitiva de investidores gostou da cidade e anunciou novos negócios.',
    efeitos: { dinheiro: 6, eficiencia: 2 },
  },
  {
    id: 'vazamento',
    titulo: 'Vazamento químico',
    descricao: 'Um caminhão tombou e derramou produtos químicos perto de um córrego.',
    efeitos: { dinheiro: -4, sustentabilidade: -7 },
  },
];

export const EVENTOS_DE_LIMIAR = [
  {
    id: 'exodo',
    titulo: 'Êxodo de moradores',
    descricao: 'Insatisfeitas, famílias estão se mudando para cidades vizinhas, e a arrecadação cai.',
    efeitos: { dinheiro: -8, eficiencia: -3 },
    indicador: 'felicidade',
    abaixoDe: CONFIG.limiares.exodoFelicidade,
  },
  {
    id: 'apagao',
    titulo: 'Apagão geral',
    descricao: 'A infraestrutura sobrecarregada entrou em colapso e a cidade ficou às escuras.',
    efeitos: { dinheiro: -5, felicidade: -6 },
    indicador: 'eficiencia',
    abaixoDe: CONFIG.limiares.apagaoEficiencia,
  },
  {
    id: 'premio-sustentabilidade',
    titulo: 'Prêmio de cidade sustentável',
    descricao: 'A cidade ganhou um prêmio nacional e recebeu recursos de um fundo verde.',
    efeitos: { dinheiro: 10, felicidade: 3 },
    indicador: 'sustentabilidade',
    acimaDe: CONFIG.limiares.premioSustentabilidade,
  },
];