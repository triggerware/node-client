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

export type PolledQueryControlParameters = {
    reportUnchanged: boolean
    delay: boolean
    reportInitial: boolean
}


export type PolledQuerySchedule = number | PolledQueryCalendarSchedule | PolledQuerySchedule[]

export type PolledQueryCalendarSchedule = {
    days?: string,
    hours?: string,
    minutes?: string,
    months?: string,
    timezone?: string
    weekdays?: string
}

export type PreparedQueryRegistration = {
    handle: number
    inputSignature: SignatureElement[]
    signature: SignatureElement[]
    usesNamedParameters: boolean
}

export type RelDataGroup = {
    name: string
    symbol: string
    elements: RelDataElement[]
}

export type RelDataElement = {
    name: string 
    signatureNames: string[] 
    signatureTypes: string[] 
    usage: string 
    noIdea: string[] 
    description: string 
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


