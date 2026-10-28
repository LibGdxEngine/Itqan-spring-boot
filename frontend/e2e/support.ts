import { readFileSync } from "node:fs"

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080"
export const STATE_DIR = "e2e/.state"

export type SeedState = { courseId: number; courseTitle: string; apiUrl: string }

export function readSeed(): SeedState {
  return JSON.parse(readFileSync(`${STATE_DIR}/seed.json`, "utf-8")) as SeedState
}

export async function apiCall<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${await res.text()}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
