'use client'
import { useRef, useCallback } from 'react'

const AZ_KEY = process.env.NEXT_PUBLIC_AZURE_TTS_KEY!
const AZ_REGION = process.env.NEXT_PUBLIC_AZURE_TTS_REGION!

export function useAzureTTS() {
  const tokenRef = useRef<string | null>(null)
  const tokenExpiryRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  const speak = useCallback(async (word: string, rate = -15): Promise<void> => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }

    const token = await getToken()
    if (!token) {
      // Fallback to browser TTS
      const utter = new SpeechSynthesisUtterance(word.toLowerCase())
      utter.rate = 0.85
      utter.lang = 'en-US'
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
      return
    }

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
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => URL.revokeObjectURL(url)
      await audio.play()
    } catch (e) {
      console.error('Azure TTS error:', e)
      const utter = new SpeechSynthesisUtterance(word.toLowerCase())
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    }
  }, [getToken])

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    window.speechSynthesis.cancel()
  }, [])

  return { speak, stop }
}
