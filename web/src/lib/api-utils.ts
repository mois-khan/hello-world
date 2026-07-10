import { NextResponse } from "next/server";
import type { ApiResponse } from "./types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiResponse<T>, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error } satisfies ApiResponse<never>, { status });
}
