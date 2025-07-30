import { SignatureElement } from "./json_types.mjs";

export const typeMap: Record<string, ((value: any) => boolean)> = {
  double: (v: any) => typeof v === 'number',
  integer: (v: any) => typeof v === 'number' && Number.isInteger(v),
  number: (v: any) => typeof v === 'number',
  boolean: (v: any) => typeof v === 'boolean',
  stringcase: (v: any) => typeof v === 'string',
  stringnocase: (v: any) => typeof v === 'string',
  stringagnostic: (v: any) => typeof v === 'string',
  date: (v: any) => v instanceof Date,
  time: (v: any) => v instanceof Date,
  timestamp: (v: any) => v instanceof Date,
  interval: (v: any) => true, // todo
  default: () => true
};
