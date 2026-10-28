import { collectionOptions } from '#/modules/catalog'
import type { CollectionId, Network, Nft } from '#/modules/catalog'
import bayc from './snapshots/boredapeyachtclub.json'
import argonauts from './snapshots/argonauts.json'
import suitedApes from './snapshots/suited-ape-society.json'
import mutantApes from './snapshots/mutant-ape-yacht-club.json'
import bodoggos from './snapshots/bodoggos.json'
import galacticGeckos from './snapshots/galactic-geckos-solana.json'

const figma = [
  ['emerald-ape', 'Emerald Ape #042', '1.19', '4:137', 'Macaco de jaqueta verde e óculos de sol'],
  ['sage-nomad', 'Sage Nomad #009', '1.69', '4:162', 'Macaco com chapéu verde e moletom violeta'],
  ['neon-vessel', 'Neon Vessel #552', '1.99', '4:164', 'Macaco de terno claro e gola verde'],
  ['golden-beat', 'Golden Beat #207', '0.99', '4:286', 'Macaco dourado com fones verdes'],
] as const

interface ImportedItem {
  tokenId: string
  contract: string
  name: string
  description: string
  displayImageUrl: string | null
  imageUrl: string | null
  openseaUrl: string
  traits: { traitType: string; value: unknown }[]
}

function imported(
  items: ImportedItem[],
  collection: CollectionId,
  baseCents: number,
  network: Network = 'ethereum',
): Nft[] {
  const collectionName = collectionOptions.find(({ id }) => id === collection)!.name
  return [...items]
    .sort((a, b) => a.tokenId.localeCompare(b.tokenId, 'en', { numeric: true }))
    .map((item, index) => {
      const cents = baseCents + index
      const name = item.name
        ? item.name.startsWith('#')
          ? `${collectionName} ${item.name}`
          : item.name
        : `${collectionName} #${item.tokenId}`
      const contract = network === 'solana' ? item.contract : item.contract.toLowerCase()
      return {
        id: `${network}-${contract}-${item.tokenId}`,
        name,
        description: item.description,
        imageUrl: item.displayImageUrl || item.imageUrl || '/images/nft-placeholder.svg',
        imageAlt: name,
        collection,
        network,
        priceEth: `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`,
        attributes: item.traits.map((trait) => ({
          name: trait.traitType,
          value: String(trait.value),
        })),
        editions: [{ id: 'original', name: 'Original', available: 1 }],
        version: 1,
        source: {
          type: 'opensea',
          contract: item.contract,
          tokenId: item.tokenId,
          url: item.openseaUrl,
        },
      }
    })
}

export const initialNfts: Nft[] = [
  ...figma.map(([id, name, priceEth, nodeId, imageAlt]): Nft => ({
    id,
    name,
    priceEth,
    imageAlt,
    description: 'Obra da seleção Kurio. Condições de compra simuladas para demonstração.',
    imageUrl: `/images/nfts/${id}.png`,
    collection: 'kurio',
    network: 'ethereum',
    ...(id === 'neon-vessel' ? { previousPriceEth: '2.29' } : {}),
    attributes: [],
    editions: [
      { id: 'limited', name: 'Edição limitada', available: 5 },
      { id: 'artist', name: 'Edição do artista', available: 2 },
    ],
    version: 1,
    source: { type: 'figma', nodeId },
  })),
  ...imported(bayc.items, 'boredapeyachtclub', 100),
  ...imported(argonauts.items, 'argonauts', 50),
  ...imported(suitedApes.items, 'suited-ape-society', 75, 'robinhood'),
  ...imported(mutantApes.items, 'mutant-ape-yacht-club', 150),
  ...imported(bodoggos.items, 'bodoggos', 25, 'solana'),
  ...imported(galacticGeckos.items, 'galactic-geckos-solana', 40, 'solana'),
]
