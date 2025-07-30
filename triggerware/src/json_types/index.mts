export type Batch<T> = {
    count: number
    tuples: T[]
    exhausted: boolean
}

export type CombinedSubscriptionNotification = {
    'update#': number
    matches: SubscriptionMatch<object>[]
}

export type ExecuteQueryResult<T> = {
    handle: number | null
    batch: Batch<T>
    signature: SignatureElement[]
}

export type PolledQueryRegistration = {
    handle: number
    signature: SignatureElement[]
}

export type PreparedQueryRegistration = {
    handle: number
    inputSignature: SignatureElement[]
    signature: SignatureElement[]
    usesNamedParameters: boolean
}

export type RowsDelta<T> = {
    added: T[]
    deleted: T[]
}

export type SignatureElement = {
    attribute: string
    type: string
}

export type SubscriptionMatch<T> = {
    label: string
    tuples: T[]
}

export type SubscriptionNotification<T> = {
    'update#': number
    label: string
    tuple: T
}

export type TwRuntimeMeasure = {
    runTime: number
    gcTime: number
    bytes: number
}

