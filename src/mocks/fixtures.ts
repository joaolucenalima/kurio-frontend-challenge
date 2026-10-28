import { normalizeNft } from '#/modules/catalog'
import type { Nft, NftRecord, NftReview } from '#/modules/catalog'
import kurio from './snapshots/kurio.json'
import bayc from './snapshots/boredapeyachtclub.json'
import argonauts from './snapshots/argonauts.json'
import suitedApes from './snapshots/suited-ape-society.json'
import mutantApes from './snapshots/mutant-ape-yacht-club.json'
import bodoggos from './snapshots/bodoggos.json'
import galacticGeckos from './snapshots/galactic-geckos-solana.json'

const nftRecords = [
  ...kurio,
  ...bayc,
  ...argonauts,
  ...suitedApes,
  ...mutantApes,
  ...bodoggos,
  ...galacticGeckos,
] as NftRecord[]

export const initialNfts: Nft[] = nftRecords.map(normalizeNft)

export const reviewPool: NftReview[] = [
  {
    id: '1',
    author: 'Ana M.',
    rating: 5,
    content: 'As cores e os detalhes chamam atenção em cada visita.',
    language: 'pt-BR',
  },
  {
    id: '2',
    author: 'Liam R.',
    rating: 4,
    content: 'The artwork has a strong visual identity.',
    language: 'en',
  },
  {
    id: '3',
    author: 'Marina C.',
    rating: 5,
    content: 'Gostei da composição e da variedade de atributos.',
    language: 'pt-BR',
  },
  {
    id: '4',
    author: 'Noah K.',
    rating: 3,
    content: 'Interesting concept, though I expected more media options.',
    language: 'en',
  },
  {
    id: '5',
    author: 'Rafa P.',
    rating: 4,
    content: 'A peça ficou ótima na minha coleção digital.',
    language: 'pt-BR',
  },
  {
    id: '6',
    author: 'Sophie L.',
    rating: 5,
    content: 'Beautiful balance of color and character.',
    language: 'en',
  },
  {
    id: '7',
    author: 'João V.',
    rating: 3,
    content: 'A arte é interessante; queria ver mais variações.',
    language: 'pt-BR',
  },
  {
    id: '8',
    author: 'Ethan B.',
    rating: 4,
    content: 'The traits make this one easy to recognize.',
    language: 'en',
  },
  {
    id: '9',
    author: 'Camila F.',
    rating: 5,
    content: 'É uma das minhas imagens favoritas da coleção.',
    language: 'pt-BR',
  },
  {
    id: '10',
    author: 'Olivia S.',
    rating: 4,
    content: 'Clean presentation and memorable artwork.',
    language: 'en',
  },
  {
    id: '11',
    author: 'Bruno A.',
    rating: 4,
    content: 'Os detalhes do personagem funcionam muito bem.',
    language: 'pt-BR',
  },
  {
    id: '12',
    author: 'Maya D.',
    rating: 5,
    content: 'A lovely addition to my digital gallery.',
    language: 'en',
  },
  {
    id: '13',
    author: 'Luiza T.',
    rating: 3,
    content: 'Visual bonito, mas prefiro outras peças da série.',
    language: 'pt-BR',
  },
  {
    id: '14',
    author: 'Jack W.',
    rating: 4,
    content: 'Distinctive style and a nice set of traits.',
    language: 'en',
  },
  {
    id: '15',
    author: 'Pedro N.',
    rating: 5,
    content: 'A paleta de cores ficou excelente.',
    language: 'pt-BR',
  },
  {
    id: '16',
    author: 'Ava H.',
    rating: 3,
    content: 'Solid piece, with room for more detail.',
    language: 'en',
  },
  {
    id: '17',
    author: 'Beatriz O.',
    rating: 4,
    content: 'Gostei do contraste e da expressão do personagem.',
    language: 'pt-BR',
  },
  {
    id: '18',
    author: 'Lucas G.',
    rating: 5,
    content: 'The image looks great at full size.',
    language: 'en',
  },
  {
    id: '19',
    author: 'Helena D.',
    rating: 4,
    content: 'Os traços dão personalidade à obra.',
    language: 'pt-BR',
  },
  {
    id: '20',
    author: 'Theo J.',
    rating: 5,
    content: 'A standout piece in this collection.',
    language: 'en',
  },
]

export function reviewsForNft(nft: Nft): NftReview[] {
  const offset =
    [...nft.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % reviewPool.length
  return Array.from({ length: nft.reviewCount }, (_, index) => ({
    ...reviewPool[(offset + index) % reviewPool.length],
    id: `${nft.id}:${reviewPool[(offset + index) % reviewPool.length].id}`,
  }))
}
