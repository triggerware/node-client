import { Expose, Transform, Type } from "class-transformer";

/**
 * Represents a JSON-RPC message.
 */
export type JsonRpcMessage = {
    jsonrpc: string
    id?: number
    result?: unknown
    error?: JsonRpcError
    method?: string
    params?: any
}

/**
 * Represents the error portion of a JSON-RPC response.
 */
export type JsonRpcError = {
    code: number
    message?: string
    data?: Record<string, unknown>
}
