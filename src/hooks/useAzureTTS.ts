'use client'
import { useRef, useCallback } from 'react'

const AZ_KEY = process.env.NEXT_PUBLIC_AZURE_TTS_KEY!
const AZ_REGION = process.env.NEXT_PUBLIC_AZURE_TTS_REGION!

export function useAzureTTS() {
  const tokenRef = useRef<string | null>(null)
  const tokenExpiryRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Map of "word::rate" -> blob URL pre-fetched in the background
  const prefetchCacheRef = useRef<Map<string, string>>(new Map())
  const prefetchInFlightRef = useRef<Set<string>>(new Set())

  const getToken = useCallback(async (): Promise<string | null> => {
    if (tokenRef.current && Date.now() < tokenExpiryRef.current) return tokenRef.current
    try {
      const res = await fetch(
        `https://${AZ_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': AZ_KEY } }
      )
      const token = await res.text()
      tokenRef.current = token
      tokenExpiryRef.current = Date.now() + 9 * 60 * 1000
      return token
    } catch {
      return null
    }
  }, [])

  const fetchAudioUrl = useCallback(async (word: string, rate: number): Promise<string | null> => {
    const token = await getToken()
    if (!token) return null
    const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='en-US-AriaNeural'><prosody rate='${rate}%'>${word.toLowerCase()}</prosody></voice></speak>`
    try {
      const res = await fetch(
        `https://${AZ_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            'User-Agent': 'ArminsSpellingBee',
          },
          body: ssml,
        }
      )
      if (!res.ok) throw new Error(`Azure TTS ${res.status}`)
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }, [getToken])

  // Fire-and-forget: fetch the audio for a word ahead of time so speak() can play instantly
  const prefetch = useCallback((word: string, rate = -15): void => {
    if (!word) return
    const key = `${word}::${rate}`
    if (prefetchCacheRef.current.has(key) || prefetchInFlightRef.current.has(key)) return
    prefetchInFlightRef.current.add(key)
    fetchAudioUrl(word, rate).then(url => {
      prefetchInFlightRef.current.delete(key)
      if (url) prefetchCacheRef.current.set(key, url)
    })
  }, [fetchAudioUrl])

  const speak = useCallback(async (word: string, rate = -15): Promise<void> => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }

    const key = `${word}::${rate}`
    const cachedUrl = prefetchCacheRef.current.get(key)

    if (cachedUrl) {
      // Audio already fetched — play immediately with no network wait
      prefetchCacheRef.current.delete(key)
      const audio = new Audio(cachedUrl)
      audioRef.current = audio
      audio.onended = () => URL.revokeObjectURL(cachedUrl)
      try { await audio.play() } catch { /* autoplay blocked, ignore */ }
      return
    }

    // Not cached — fetch now (also warms up the token)
    const url = await fetchAudioUrl(word, rate)
    if (url) {
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => URL.revokeObjectURL(url)
      try {
        await audio.play()
      } catch (e) {
        console.error('Azure TTS play error:', e)
      }
      return
    }

    // Fallback to browser TTS if Azure failed
    const utter = new SpeechSynthesisUtterance(word.toLowerCase())
    utter.rate = 0.85
    utter.lang = 'en-US'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }, [fetchAudioUrl])

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    window.speechSynthesis.cancel()
  }, [])

  return { speak, stop, prefetch }
}
