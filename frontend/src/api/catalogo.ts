import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from './client'

/* ---------- Categorías ---------- */

export interface Categoria {
    id: number
    nombre: string
    descripcion: string | null
    creado_en: string
}

export interface CategoriaDatos {
    nombre: string
    descripcion: string
}

const CLAVE_CATEGORIAS = ['categorias']

function cuerpoCategoria(datos: CategoriaDatos) {
    return JSON.stringify({ nombre: datos.nombre, descripcion: datos.descripcion || null })
}

export function useCategorias() {
    const api = useApi()
    return useQuery({ queryKey: CLAVE_CATEGORIAS, queryFn: () => api<Categoria[]>('/categorias/') })
}

function useRefrescarCategorias() {
    const cliente = useQueryClient()
    return () => cliente.invalidateQueries({ queryKey: CLAVE_CATEGORIAS })
}

export function useCrearCategoria() {
    const api = useApi()
    const refrescar = useRefrescarCategorias()
    return useMutation({
        mutationFn: (datos: CategoriaDatos) =>
        api<Categoria>('/categorias/', { method: 'POST', body: cuerpoCategoria(datos) }),
        onSuccess: refrescar,
    })
}

export function useActualizarCategoria() {
    const api = useApi()
    const refrescar = useRefrescarCategorias()
    return useMutation({
        mutationFn: ({ id, datos }: { id: number; datos: CategoriaDatos }) =>
        api<Categoria>(`/categorias/${id}`, { method: 'PUT', body: cuerpoCategoria(datos) }),
        onSuccess: refrescar,
    })
}

export function useEliminarCategoria() {
    const api = useApi()
    const refrescar = useRefrescarCategorias()
    return useMutation({
        mutationFn: (id: number) => api<void>(`/categorias/${id}`, { method: 'DELETE' }),
        onSuccess: refrescar,
    })
}

/* ---------- Productos ---------- */

export interface Producto {
    id: number
    nombre: string
    precio: number
    stock: number
    categoria_id: number
    activo: boolean
    creado_en: string
}

export interface ProductoDatos {
    nombre: string
    precio: number
    stock: number
    categoria_id: number
}

const CLAVE_PRODUCTOS = ['productos']

export function useProductos() {
    const api = useApi()
    return useQuery({ queryKey: CLAVE_PRODUCTOS, queryFn: () => api<Producto[]>('/productos/') })
}

function useRefrescarProductos() {
    const cliente = useQueryClient()
    return () => cliente.invalidateQueries({ queryKey: CLAVE_PRODUCTOS })
}

export function useCrearProducto() {
    const api = useApi()
    const refrescar = useRefrescarProductos()
    return useMutation({
        mutationFn: (datos: ProductoDatos) =>
        api<Producto>('/productos/', { method: 'POST', body: JSON.stringify(datos) }),
        onSuccess: refrescar,
    })
}

export function useActualizarProducto() {
    const api = useApi()
    const refrescar = useRefrescarProductos()
    return useMutation({
        mutationFn: ({ id, datos }: { id: number; datos: ProductoDatos }) =>
        api<Producto>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
        onSuccess: refrescar,
    })
}

export function useDesactivarProducto() {
    const api = useApi()
    const refrescar = useRefrescarProductos()
    return useMutation({
        mutationFn: (id: number) => api<unknown>(`/productos/${id}`, { method: 'DELETE' }),
        onSuccess: refrescar,
    })
}