import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supa = createClient(url, key)

// ── HOF (leaderboard) ────────────────────────────────────────────────────────

export interface HofScore {
  id?: number
  user_id?: string
  name: string
  score: number
  words: number
  difficulty: string
  created_at?: string
}

export async function fetchLeaderboard(): Promise<HofScore[]> {
  const { data } = await supa
    .from('hof_scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(50)
  return data || []
}

export async function submitScore(entry: Omit<HofScore, 'id' | 'created_at'>) {
  await supa.from('hof_scores').insert(entry)
}

export async function updateLeaderboardName(userId: string, newName: string) {
  await supa
    .from('hof_scores')
    .update({ name: newName })
    .eq('user_id', userId)
}

// ── User Stats ────────────────────────────────────────────────────────────────

export interface UserStats {
  id: string
  display_name: string
  ranked_high_score: number
  highest_streak: number
  total_words_attempted: number
  total_words_correct: number
  longest_word: string
  total_wins: number
  total_losses: number
  wins_by_mode: Record<string, number>
  updated_at?: string
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const { data } = await supa
    .from('user_stats')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function upsertUserStats(stats: Partial<UserStats> & { id: string }) {
  await supa
    .from('user_stats')
    .upsert({ ...stats, updated_at: new Date().toISOString() })
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function authSignUp(email: string, password: string, displayName: string) {
  const { data, error } = await supa.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  if (data.user) {
    // Use a SECURITY DEFINER RPC so the insert bypasses RLS
    // (the session may not be active yet right after signUp)
    const { error: rpcError } = await supa.rpc('init_user_stats', {
      p_user_id: data.user.id,
      p_display_name: displayName,
    })
    if (rpcError) throw new Error(rpcError.message)
  }
  return data.user
}

export async function authSignIn(email: string, password: string) {
  const { data, error } = await supa.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

export async function authSignOut() {
  await supa.auth.signOut()
}
