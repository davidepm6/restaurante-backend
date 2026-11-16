import { useQuery } from '@tanstack/react-query'
import { useApi } from './client'
import type { Me } from './types'

export function useMe() {
    const api = useApi()
    return useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/me') })
}