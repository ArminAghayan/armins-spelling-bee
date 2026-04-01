export type Screen = 'home' | 'waiting' | 'game' | 'results' | 'leaderboard'
export type WordCategory = 'default' | 'expert' | 'cities' | 'places' | 'animals' | 'movies' | 'brands' | 'ranked' | 'flags'
export type GameMode = 'casual' | 'ranked'

export interface Player {
  id: string
  name: string
  score: number
  correct: number
  streak: number
  rematchReady: boolean
  isHost: boolean
  lobbyReady: boolean
}

export interface GameSettings {
  category: WordCategory
  mode: GameMode
  isRanked: boolean
}

export type BroadcastEvent =
  | { type: 'player_join'; id: string; name: string; isHost: boolean; score: number; correct: number; streak: number }
  | { type: 'player_update'; id: string; name: string; isHost: boolean; score: number; correct: number; streak: number }
  | { type: 'state'; difficulty: string; hostId: string }
  | { type: 'start'; seed: number; wordCategory: string; isRanked: boolean; hostId: string }
  | { type: 'answer'; name: string; correct: boolean; score: number }
  | { type: 'end'; scores: Record<string, { name: string; score: number; correct: number }> }
  | { type: 'rematch_diff'; wordCategory: string }
  | { type: 'rematch_ready'; name: string }
  | { type: 'lobby_ready'; id: string; ready: boolean }
  | { type: 'game_in_progress'; target: string }
  | { type: 'player_leave'; id: string }
  | { type: 'back_to_lobby' }
