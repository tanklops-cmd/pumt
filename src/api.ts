// Minimal backend API stubs — replace with real endpoints when available

export async function sendFullMuster(prisonId: string, payload: any): Promise<{ ok: boolean }>{
  try {
    // TODO: implement real POST to backend
    console.warn('sendFullMuster called (stub)', prisonId, payload)
    return { ok: true }
  } catch (e) {
    return { ok: false }
  }
}
