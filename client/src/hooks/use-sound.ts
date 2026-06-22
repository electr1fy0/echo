import { useCallback, useRef } from "react"

export function useSound(url: string, { volume = 1 }: { volume?: number } = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(url)
      }
      audioRef.current.volume = volume
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } catch {
      // silently ignore
    }
  }, [url, volume])

  return [play] as const
}
