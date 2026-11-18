import 'server-only'

import type { ClientReturn } from '@sanity/client'
import { cacheLife, cacheTag } from 'next/cache'
import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'
import { readToken } from './token'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  stega: false,
  token: readToken,
})

type SanityFetchOptions<Query extends string> = {
  query: Query
  params?: Record<string, unknown>
  tags: string[]
}

export async function sanityFetch<const Query extends string>({
  query,
  params,
  tags,
}: SanityFetchOptions<Query>): Promise<ClientReturn<Query>> {
  'use cache'
  cacheLife('minutes')
  cacheTag('sanity', ...tags)

  return client.fetch(query, params)
}
