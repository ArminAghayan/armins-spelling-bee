'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  supa, submitScore,
  getUserStats, upsertUserStats, authSignOut, type UserStats,
} from '@/lib/supabase'
import { getWordBank, seededShuffle, genCode, avatarColor, type Word } from '@/lib/words'
import { useAzureTTS } from '@/hooks/useAzureTTS'
import type { Screen, Player, BroadcastEvent } from '@/lib/types'
import HomeScreen from '@/components/screens/HomeScreen'
import WaitingScreen from '@/components/screens/WaitingScreen'
import GameScreen from '@/components/screens/GameScreen'
import ResultsScreen from '@/components/screens/ResultsScreen'
import LeaderboardScreen from '@/components/screens/LeaderboardScreen'
import CountdownOverlay from '@/components/ui/CountdownOverlay'
import LiveFeed from '@/components/ui/LiveFeed'
import AuthModal from '@/components/ui/AuthModal'
import WelcomeModal from '@/components/ui/WelcomeModal'

export default function Game() {
  // ── Screen ──
  const [screen, setScreen] = useState<Screen>('home')

  // ── Player identity ──
  const myId = useRef('p_' + Math.random().toString(36).slice(2, 9))
  const [myName, setMyName] = useState('')
  const myNameRef = useRef('')
  const [roomCode, setRoomCode] = useState('')
  const [amHost, setAmHost] = useState(false)
  const [hostId, setHostId] = useState('')

  // ── Room players ──
  const [players, setPlayers] = useState<Record<string, Player>>({})

  // ── Auth ──
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const authUserRef = useRef<User | null>(null)
  // Welcome modal: null = not yet resolved, true = show, false = hide
  const [showWelcome, setShowWelcome] = useState<boolean>(false)

  useEffect(() => {
    // Restore existing session
    supa.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      setAuthUser(user)
      authUserRef.current = user
      if (user) {
        getUserStats(user.id).then(stats => {
          if (stats) {
            setUserStats(stats)
            setMyName(stats.display_name)
            myNameRef.current = stats.display_name
          }
        })
        // Already signed in — no welcome needed
        setShowWelcome(false)
      } else {
        // Only show welcome if they haven't dismissed it before
        const skipped = localStorage.getItem('cs-welcome-skipped')
        if (!skipped) setShowWelcome(true)
      }
    })

    const { data: { subscription } } = supa.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setAuthUser(user)
      authUserRef.current = user
      if (user) {
        getUserStats(user.id).then(stats => {
          if (stats) {
            setUserStats(stats)
            setMyName(stats.display_name)
            myNameRef.current = stats.display_name
          }
        })
        setShowWelcome(false)
        setShowAuth(false)
      } else {
        setUserStats(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Keep myNameRef in sync with myName state
  useEffect(() => { myNameRef.current = myName }, [myName])

  const openAuth = useCallback((mode: 'signin' | 'signup') => {
    setShowWelcome(false)
    setAuthMode(mode)
    setShowAuth(true)
  }, [])

  const handleGuest = useCallback(() => {
    localStorage.setItem('cs-welcome-skipped', '1')
    setShowWelcome(false)
  }, [])

  const handleSignOut = useCallback(async () => {
    await authSignOut()
    setMyName('')
  }, [])

  const handleStatsUpdated = useCallback((stats: UserStats) => {
    setUserStats(stats)
    setMyName(stats.display_name)
  }, [])

  // ── Theme ──
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const saved = localStorage.getItem('cs-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light' : ''
    localStorage.setItem('cs-theme', theme)
  }, [theme])
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  // ── Game settings ──
  const [wordCategory, setWordCategory] = useState('default')
  const [isRanked, setIsRanked] = useState(false)
  const [voiceSpeed, setVoiceSpeed] = useState(-15)

  // ── Game state ──
  const [gameWords, setGameWords] = useState<Word[]>([])
  const [wordIndex, setWordIndex] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [myCorrect, setMyCorrect] = useState(0)
  const [myStreak, setMyStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameActive, setGameActive] = useState(false)
  const [recentWords, setRecentWords] = useState<{ word: string; ok: boolean }[]>([])
  const [feedItems, setFeedItems] = useState<{ id: number; msg: string; type: 'ok' | 'no' }[]>([])

  // ── Results ──
  const [finalScores, setFinalScores] = useState<Record<string, { name: string; score: number; correct: number }>>({})

  // ── Countdown ──
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownNum, setCountdownNum] = useState(3)

  // ── Leaderboard ──
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // ── Join-rejected toast ──
  const [joinRejectedMsg, setJoinRejectedMsg] = useState('')

  // ── Refs ──
  const channelRef = useRef<ReturnType<typeof supa.channel> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingResultsRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gameWordsRef = useRef<Word[]>([])
  const wordIndexRef = useRef(0)
  const myScoreRef = useRef(0)
  const myCorrectRef = useRef(0)
  const myStreakRef = useRef(0)
  const isRankedRef = useRef(false)
  const wordCategoryRef = useRef('default')
  const amHostRef = useRef(false)
  const gameActiveRef = useRef(false)
  const feedCounter = useRef(0)
  // Stat-tracking refs (reset each game)
  const myMaxStreakRef = useRef(0)
  const myLongestWordRef = useRef('')
  const myAttemptsRef = useRef(0)
  const isSoloRef = useRef(false)

  const { speak, stop, prefetch } = useAzureTTS()

  // Keep refs in sync
  useEffect(() => { gameWordsRef.current = gameWords }, [gameWords])
  useEffect(() => { wordIndexRef.current = wordIndex }, [wordIndex])
  useEffect(() => { myScoreRef.current = myScore }, [myScore])
  useEffect(() => { myCorrectRef.current = myCorrect }, [myCorrect])
  useEffect(() => { myStreakRef.current = myStreak }, [myStreak])
  useEffect(() => { isRankedRef.current = isRanked }, [isRanked])
  useEffect(() => { wordCategoryRef.current = wordCategory }, [wordCategory])
  useEffect(() => { amHostRef.current = amHost }, [amHost])
  useEffect(() => { gameActiveRef.current = gameActive }, [gameActive])

  // ── Helpers ──
  const addFeed = useCallback((msg: string, type: 'ok' | 'no') => {
    const id = ++feedCounter.current
    setFeedItems(f => [{ id, msg, type }, ...f].slice(0, 5))
    setTimeout(() => setFeedItems(f => f.filter(x => x.id !== id)), 3000)
  }, [])

  const pub = useCallback((event: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: 'broadcast', event, payload: { ...payload, from: myId.current } })
  }, [])

  // ── Save game stats ──
  const saveGameStats = useCallback(async (
    scores: Record<string, { name: string; score: number; correct: number }>
  ) => {
    const user = authUserRef.current
    if (!user) return

    const myFinal = scores[myId.current]
    if (!myFinal) return

    const playerCount = Object.keys(scores).length
    const allScores = Object.values(scores).map(s => s.score)
    const maxScore = Math.max(...allScores)
    const isMultiplayer = !isSoloRef.current && playerCount > 1
    const isWin = isMultiplayer && myFinal.score >= maxScore && myFinal.score > 0
    const isLoss = isMultiplayer && !isWin

    try {
      const current = await getUserStats(user.id)

      const newWinsByMode = { ...(current?.wins_by_mode || {}) }
      if (isWin) {
        const mode = wordCategoryRef.current
        newWinsByMode[mode] = (newWinsByMode[mode] || 0) + 1
      }

      const longestNew = myLongestWordRef.current
      const longestOld = current?.longest_word || ''

      await upsertUserStats({
        id: user.id,
        display_name: current?.display_name || '',
        ranked_high_score: Math.max(current?.ranked_high_score || 0, isRankedRef.current ? myFinal.score : 0),
        highest_streak: Math.max(current?.highest_streak || 0, myMaxStreakRef.current),
        total_words_attempted: (current?.total_words_attempted || 0) + myAttemptsRef.current,
        total_words_correct: (current?.total_words_correct || 0) + myFinal.correct,
        longest_word: longestNew.length > longestOld.length ? longestNew : longestOld,
        total_wins: (current?.total_wins || 0) + (isWin ? 1 : 0),
        total_losses: (current?.total_losses || 0) + (isLoss ? 1 : 0),
        wins_by_mode: newWinsByMode,
      })

      const updated = await getUserStats(user.id)
      if (updated) setUserStats(updated)
    } catch (e) {
      console.error('Failed to save game stats:', e)
    }
  }, [])

  // ── Message handler ──
  const handleMsg = useCallback((event: string, d: Record<string, unknown> & { from?: string }) => {
    if (d.from === myId.current) return

    switch (event) {
      case 'player_join':
      case 'player_update': {
        const pid = (d.id as string) || d.from!
        // If the game is already running and a new player tries to join, kick them
        if (event === 'player_join' && gameActiveRef.current && amHostRef.current) {
          pub('game_in_progress', { target: pid })
          break
        }
        setPlayers(prev => {
          const updated = { ...prev }
          updated[pid] = {
            id: pid,
            name: d.name as string,
            score: (d.score as number) || 0,
            correct: (d.correct as number) || 0,
            streak: (d.streak as number) || 0,
            rematchReady: (d.rematchReady as boolean) || false,
            isHost: (d.isHost as boolean) || false,
          }
          return updated
        })
        if (d.isHost) setHostId(pid)
        if (event === 'player_join') {
          pub('player_update', {
            id: myId.current, name: myNameRef.current, isHost: amHostRef.current,
            score: myScoreRef.current, correct: myCorrectRef.current, streak: myStreakRef.current
          })
        }
        break
      }
      case 'game_in_progress': {
        if ((d.target as string) === myId.current) {
          if (channelRef.current) { supa.removeChannel(channelRef.current); channelRef.current = null }
          setPlayers({})
          setGameActive(false)
          setScreen('home')
          setJoinRejectedMsg('That game has already started.')
          setTimeout(() => setJoinRejectedMsg(''), 4000)
        }
        break
      }
      case 'state':
        setWordCategory(d.wordCategory as string || 'default')
        setHostId(d.hostId as string)
        break
      case 'start': {
        const cat = (d.wordCategory as string) || 'default'
        const ranked = (d.isRanked as boolean) || false
        setWordCategory(cat)
        setIsRanked(ranked)
        setHostId(d.hostId as string)
        const bank = getWordBank(cat, ranked)
        const words = seededShuffle(bank, d.seed as number)
        setGameWords(words)
        setPlayers(prev => {
          const updated: Record<string, Player> = {}
          for (const [k, v] of Object.entries(prev)) updated[k] = { ...v, score: 0, correct: 0, rematchReady: false }
          return updated
        })
        beginCountdown(() => startGame(words))
        break
      }
      case 'answer': {
        const pid = d.from!
        setPlayers(prev => {
          if (!prev[pid]) return prev
          return { ...prev, [pid]: { ...prev[pid], score: (d.score as number) || 0, correct: (d.correct as number) || 0 } }
        })
        addFeed(`${d.name as string} ${d.correct ? '+1' : 'miss'}`, d.correct ? 'ok' : 'no')
        break
      }
      case 'end':
        endGame(d.scores as Record<string, { name: string; score: number; correct: number }>)
        break
      case 'rematch_diff':
        setWordCategory(d.wordCategory as string)
        break
      case 'rematch_ready': {
        const pid = d.from!
        setPlayers(prev => prev[pid] ? { ...prev, [pid]: { ...prev[pid], rematchReady: true } } : prev)
        break
      }
    }
  }, [myName, pub, addFeed])

  // ── Connect to Supabase room ──
  const joinChannel = useCallback((code: string) => {
    if (channelRef.current) { supa.removeChannel(channelRef.current); channelRef.current = null }

    const channel = supa.channel('room:' + code.toLowerCase(), {
      config: { broadcast: { self: false } }
    })

    ;(['player_join','player_update','state','start','answer','end','rematch_diff','rematch_ready','game_in_progress'] as const).forEach(ev => {
      channel.on('broadcast', { event: ev }, ({ payload }) => handleMsg(ev, payload as Record<string, unknown>))
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        pub('player_join', {
          id: myId.current, name: myNameRef.current, isHost: amHostRef.current,
          score: 0, correct: 0, streak: 0
        })
        setScreen('waiting')
        if (amHostRef.current) {
          pub('state', { wordCategory: wordCategoryRef.current, hostId: myId.current })
          const url = new URL(window.location.href)
          url.searchParams.set('code', code.toUpperCase())
          window.history.replaceState(null, '', url.toString())
        }
      }
    })

    channelRef.current = channel
  }, [myName, pub, handleMsg])

  // ── Create / Join / Solo ──
  const createRoom = useCallback((name: string, category: string, isRankedVal: boolean) => {
    isSoloRef.current = false
    myNameRef.current = name
    setMyName(name)
    setWordCategory(category)
    wordCategoryRef.current = category
    setIsRanked(isRankedVal)
    isRankedRef.current = isRankedVal
    const code = genCode()
    setRoomCode(code)
    setAmHost(true)
    amHostRef.current = true
    const me: Player = { id: myId.current, name, score: 0, correct: 0, streak: 0, rematchReady: false, isHost: true }
    setPlayers({ [myId.current]: me })
    setHostId(myId.current)
    joinChannel(code)
  }, [joinChannel])

  const joinRoom = useCallback((name: string, code: string) => {
    isSoloRef.current = false
    myNameRef.current = name
    setMyName(name)
    setRoomCode(code.toUpperCase())
    setAmHost(false)
    amHostRef.current = false
    const me: Player = { id: myId.current, name, score: 0, correct: 0, streak: 0, rematchReady: false, isHost: false }
    setPlayers({ [myId.current]: me })
    joinChannel(code)
  }, [joinChannel])

  const leaveRoom = useCallback(() => {
    stop()
    if (timerRef.current) clearInterval(timerRef.current)
    if (pendingResultsRef.current) { clearTimeout(pendingResultsRef.current); pendingResultsRef.current = null }
    if (channelRef.current) { supa.removeChannel(channelRef.current); channelRef.current = null }
    setPlayers({})
    setGameActive(false)
    setScreen('home')
  }, [stop])

  const leaveGame = useCallback(() => {
    stop()
    if (timerRef.current) clearInterval(timerRef.current)
    if (pendingResultsRef.current) { clearTimeout(pendingResultsRef.current); pendingResultsRef.current = null }
    if (channelRef.current) { supa.removeChannel(channelRef.current); channelRef.current = null }
    setPlayers({})
    setGameActive(false)
    setGameWords([])
    setMyScore(0); myScoreRef.current = 0
    setMyCorrect(0); myCorrectRef.current = 0
    setMyStreak(0); myStreakRef.current = 0
    setScreen('home')
  }, [stop])

  // ── Countdown ──
  const beginCountdown = useCallback((cb: () => void) => {
    setShowCountdown(true)
    setCountdownNum(3)
    let c = 3
    const t = setInterval(() => {
      c--
      if (c <= 0) {
        clearInterval(t)
        setCountdownNum(0)
        setTimeout(() => { setShowCountdown(false); cb() }, 700)
      } else {
        setCountdownNum(c)
      }
    }, 800)
  }, [])

  // ── Game ──
  const hostStart = useCallback(() => {
    setPlayers(prev => {
      const updated: Record<string, Player> = {}
      for (const [k, v] of Object.entries(prev)) updated[k] = { ...v, score: 0, correct: 0, rematchReady: false }
      return updated
    })
    const seed = Math.floor(Math.random() * 2147483647)
    const bank = getWordBank(wordCategoryRef.current, isRankedRef.current)
    const words = seededShuffle(bank, seed)
    setGameWords(words)
    pub('start', { seed, wordCategory: wordCategoryRef.current, isRanked: isRankedRef.current, hostId: myId.current })
    beginCountdown(() => startGame(words))
  }, [pub, beginCountdown])

  const gameDurationRef = useRef(60)

  const startGame = useCallback((words: Word[], duration?: number) => {
    const dur = duration ?? gameDurationRef.current
    setWordIndex(0); wordIndexRef.current = 0
    setMyScore(0); myScoreRef.current = 0
    setMyCorrect(0); myCorrectRef.current = 0
    setMyStreak(0); myStreakRef.current = 0
    setTimeLeft(dur)
    setRecentWords([])
    setGameActive(true)
    setScreen('game')
    // Reset per-game stat trackers
    myMaxStreakRef.current = 0
    myLongestWordRef.current = ''
    myAttemptsRef.current = 0

    if (wordCategoryRef.current !== 'flags') {
      setTimeout(() => speak(words[0]?.w || '', voiceSpeed), 400)
      // Pre-fetch word #2 in the background so it plays immediately after the first answer
      if (words[1]) prefetch(words[1].w, voiceSpeed)
    }

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1
        if (next <= 0) {
          clearInterval(timerRef.current!)
          setGameActive(false)
          stop()
          pub('player_update', {
            id: myId.current, name: myNameRef.current, isHost: amHostRef.current,
            score: myScoreRef.current, correct: myCorrectRef.current, streak: myStreakRef.current
          })
          if (amHostRef.current) setTimeout(finishGame, 800)
          else {
            if (pendingResultsRef.current) clearTimeout(pendingResultsRef.current)
            pendingResultsRef.current = setTimeout(() => {
              pendingResultsRef.current = null
              setPlayers(prev => {
                const s: Record<string, { name: string; score: number; correct: number }> = {}
                for (const p of Object.values(prev)) s[p.id] = { name: p.name, score: p.score, correct: p.correct }
                s[myId.current] = { name: myNameRef.current, score: myScoreRef.current, correct: myCorrectRef.current }
                setFinalScores(s)
                setScreen('results')
                if (isRankedRef.current && authUserRef.current && myScoreRef.current > 0) {
                  submitScore({ user_id: authUserRef.current.id, name: myNameRef.current, score: myScoreRef.current, words: myCorrectRef.current, difficulty: 'ranked' })
                }
                saveGameStats(s)
                return prev
              })
            }, 3000)
          }
          return 0
        }
        return next
      })
    }, 1000)
  }, [myName, pub, speak, stop, voiceSpeed, saveGameStats, prefetch])

  const startSolo = useCallback((name: string, category: string, isRankedVal: boolean, duration = 60) => {
    isSoloRef.current = true
    gameDurationRef.current = duration
    myNameRef.current = name
    setMyName(name)
    setWordCategory(category)
    wordCategoryRef.current = category
    setIsRanked(isRankedVal)
    isRankedRef.current = isRankedVal
    setAmHost(true)
    amHostRef.current = true
    const me: Player = { id: myId.current, name, score: 0, correct: 0, streak: 0, rematchReady: false, isHost: true }
    setPlayers({ [myId.current]: me })
    setHostId(myId.current)
    const bank = getWordBank(category, isRankedVal)
    const seed = Math.floor(Math.random() * 2147483647)
    const words = seededShuffle(bank, seed)
    setGameWords(words)
    beginCountdown(() => startGame(words, duration))
  }, [beginCountdown, startGame])

  const finishGame = useCallback(() => {
    let computedScores: Record<string, { name: string; score: number; correct: number }> = {}
    setPlayers(prev => {
      const s: Record<string, { name: string; score: number; correct: number }> = {}
      for (const p of Object.values(prev)) s[p.id] = { name: p.name, score: p.score, correct: p.correct }
      s[myId.current] = { name: myNameRef.current, score: myScoreRef.current, correct: myCorrectRef.current }
      computedScores = s
      pub('end', { scores: s })
      setFinalScores(s)
      setScreen('results')
      if (isRankedRef.current && myScoreRef.current > 0 && authUserRef.current) {
        submitScore({ user_id: authUserRef.current.id, name: myNameRef.current, score: myScoreRef.current, words: myCorrectRef.current, difficulty: 'ranked' })
      }
      return prev
    })
    saveGameStats(computedScores)
  }, [myName, pub, saveGameStats])

  const endGame = useCallback((scores: Record<string, { name: string; score: number; correct: number }>) => {
    if (pendingResultsRef.current) { clearTimeout(pendingResultsRef.current); pendingResultsRef.current = null }
    if (timerRef.current) clearInterval(timerRef.current)
    setGameActive(false)
    stop()
    // Always use local refs for own score — host's copy can be stale due to network lag
    const correctedScores = {
      ...scores,
      [myId.current]: { name: myNameRef.current, score: myScoreRef.current, correct: myCorrectRef.current },
    }
    setFinalScores(correctedScores)
    setScreen('results')
    if (isRankedRef.current && authUserRef.current && myScoreRef.current > 0) {
      submitScore({ user_id: authUserRef.current.id, name: myNameRef.current, score: myScoreRef.current, words: myCorrectRef.current, difficulty: 'ranked' })
    }
    saveGameStats(correctedScores)
  }, [myName, stop, saveGameStats])

  const submitAnswer = useCallback((answer: string) => {
    const words = gameWordsRef.current
    const idx = wordIndexRef.current
    if (!words.length || !answer.trim()) return false

    myAttemptsRef.current++

    const w = words[idx % words.length]
    const correct = answer.trim().toLowerCase() === w.w.toLowerCase()

    if (correct) {
      const bonus = Math.max(0, myStreakRef.current - 1)
      const pts = w.p + bonus
      myScoreRef.current += pts
      myCorrectRef.current++
      myStreakRef.current++
      wordIndexRef.current++
      setMyScore(myScoreRef.current)
      setMyCorrect(myCorrectRef.current)
      setMyStreak(myStreakRef.current)
      setWordIndex(wordIndexRef.current)
      setRecentWords(r => [{ word: w.w, ok: true }, ...r].slice(0, 6))
      // Track stats
      if (myStreakRef.current > myMaxStreakRef.current) myMaxStreakRef.current = myStreakRef.current
      if (w.w.length > myLongestWordRef.current.length) myLongestWordRef.current = w.w
      // Update own player entry
      setPlayers(prev => prev[myId.current] ? { ...prev, [myId.current]: { ...prev[myId.current], score: myScoreRef.current, correct: myCorrectRef.current } } : prev)
      const nextWord = words[wordIndexRef.current % words.length]
      if (nextWord && wordCategoryRef.current !== 'flags') {
        setTimeout(() => speak(nextWord.w, voiceSpeed), 300)
        // Pre-fetch the word after next so it's ready to play with no delay
        const wordAfterNext = words[(wordIndexRef.current + 1) % words.length]
        if (wordAfterNext) prefetch(wordAfterNext.w, voiceSpeed)
      }
      addFeed(`You +${pts}`, 'ok')
    } else {
      myStreakRef.current = 0
      setMyStreak(0)
      setRecentWords(r => [{ word: answer, ok: false }, ...r].slice(0, 6))
      addFeed('You missed', 'no')
    }

    pub('answer', { name: myNameRef.current, correct, score: myScoreRef.current, totalCorrect: myCorrectRef.current })
    return correct
  }, [myName, pub, speak, addFeed, voiceSpeed, prefetch])

  const skipWord = useCallback(() => {
    stop()
    myStreakRef.current = 0
    setMyStreak(0)
    wordIndexRef.current++
    setWordIndex(wordIndexRef.current)
    const words = gameWordsRef.current
    const next = words[wordIndexRef.current % words.length]
    if (next && wordCategoryRef.current !== 'flags') setTimeout(() => speak(next.w, voiceSpeed), 200)
  }, [stop, speak, voiceSpeed])

  // ── Leaderboard ──
  const openLeaderboard = useCallback(() => {
    setShowLeaderboard(true)
  }, [])

  // ── URL code prefill ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      const el = document.getElementById('join-code-input') as HTMLInputElement | null
      if (el) el.value = code.toUpperCase()
    }
    const saved = localStorage.getItem('sb_voice_speed')
    if (saved) setVoiceSpeed(parseInt(saved))
  }, [])

  const currentWord = gameWords[wordIndex % (gameWords.length || 1)]

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      {screen === 'home' && (
        <HomeScreen
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartSolo={startSolo}
          onOpenLeaderboard={openLeaderboard}
          voiceSpeed={voiceSpeed}
          onVoiceSpeedChange={(v) => { setVoiceSpeed(v); localStorage.setItem('sb_voice_speed', String(v)) }}
          onTestVoice={() => speak('spelling', voiceSpeed)}
          theme={theme}
          onToggleTheme={toggleTheme}
          authUser={authUser}
          userStats={userStats}
          onOpenAuth={openAuth}
          onSignOut={handleSignOut}
          onStatsUpdated={handleStatsUpdated}
        />
      )}

      {screen === 'waiting' && (
        <WaitingScreen
          players={players}
          myId={myId.current}
          hostId={hostId}
          roomCode={roomCode}
          amHost={amHost}
          wordCategory={wordCategory}
          isRanked={isRanked}
          onStart={hostStart}
          onLeave={leaveRoom}
          onCategoryChange={(cat) => { setWordCategory(cat); pub('rematch_diff', { wordCategory: cat }) }}
          myName={myName}
          onOpenLeaderboard={openLeaderboard}
          theme={theme}
          onToggleTheme={toggleTheme}
          voiceSpeed={voiceSpeed}
          onVoiceSpeedChange={(v) => { setVoiceSpeed(v); localStorage.setItem('sb_voice_speed', String(v)) }}
          onTestVoice={() => speak('spelling', voiceSpeed)}
          authUser={authUser}
          userStats={userStats}
          onOpenAuth={openAuth}
          onSignOut={handleSignOut}
          onStatsUpdated={handleStatsUpdated}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          players={players}
          myId={myId.current}
          currentWord={currentWord}
          timeLeft={timeLeft}
          myScore={myScore}
          myStreak={myStreak}
          recentWords={recentWords}
          isRanked={isRanked}
          wordCategory={wordCategory}
          feedItems={feedItems}
          onSubmit={submitAnswer}
          onSkip={skipWord}
          onSpeak={() => currentWord && speak(currentWord.w, voiceSpeed)}
          onLeave={leaveGame}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          scores={finalScores}
          myId={myId.current}
          myName={myName}
          players={players}
          hostId={hostId}
          amHost={amHost}
          isRanked={isRanked}
          wordCategory={wordCategory}
          onHostStart={hostStart}
          onLeave={leaveRoom}
          onOpenLeaderboard={openLeaderboard}
          onCategoryChange={(cat) => { setWordCategory(cat); pub('rematch_diff', { wordCategory: cat }) }}
          onRematchReady={() => {
            setPlayers(prev => prev[myId.current] ? { ...prev, [myId.current]: { ...prev[myId.current], rematchReady: true } } : prev)
            pub('rematch_ready', { name: myNameRef.current })
          }}
        />
      )}

      {showLeaderboard && (
        <LeaderboardScreen
          myName={myName}
          onBack={() => setShowLeaderboard(false)}
        />
      )}

      {showCountdown && <CountdownOverlay num={countdownNum} />}
      <LiveFeed items={feedItems} />

      {/* Welcome Modal — shown on first visit */}
      {showWelcome && (
        <WelcomeModal
          onOpenAuth={openAuth}
          onGuest={handleGuest}
        />
      )}

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* Game-in-progress rejection toast */}
      {joinRejectedMsg && (
        <div style={{
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
          background: '#1c1917', border: '1px solid #f59e0b', borderRadius: '10px',
          padding: '12px 22px', color: '#f59e0b', fontSize: '14px', fontWeight: 600,
          fontFamily: 'Inter, sans-serif', zIndex: 99999, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          animation: 'feedIn .25s ease', whiteSpace: 'nowrap',
        }}>
          ⚠️ {joinRejectedMsg}
        </div>
      )}
    </div>
  )
}
