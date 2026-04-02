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
    .limit(500)
  return data || []
}

export async function fetchLeaderboardFromStats(): Promise<UserStats[]> {
  const { data } = await supa
    .from('user_stats')
    .select('*')
    .gt('ranked_high_score', 0)
    .order('ranked_high_score', { ascending: false })
  return data || []
}

export async function fetchLeaderboardByPeriod(since: Date): Promise<HofScore[]> {
  const { data } = await supa
    .from('hof_scores')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('score', { ascending: false })
    .limit(500)
  return data || []
}

export async function submitScore(entry: Omit<HofScore, 'id' | 'created_at'>) {
  await supa.from('hof_scores').insert(entry)
}

export async function fetchRecentScores(userId: string, limit = 5): Promise<HofScore[]> {
  const { data } = await supa
    .from('hof_scores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function updateLeaderboardName(userId: string, oldName: string, newName: string) {
  // Update rows already linked by user_id
  const { error: e1 } = await supa
    .from('hof_scores')
    .update({ name: newName })
    .eq('user_id', userId)
  if (e1) throw new Error(e1.message)

  // Backfill old rows that were inserted before user_id existed:
  // match by name and claim them for this user at the same time
  const { error: e2 } = await supa
    .from('hof_scores')
    .update({ name: newName, user_id: userId })
    .eq('name', oldName)
    .is('user_id', null)
  if (e2) throw new Error(e2.message)
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

export async function getUserStatsByName(displayName: string): Promise<UserStats | null> {
  const { data } = await supa
    .from('user_stats')
    .select('*')
    .eq('display_name', displayName)
    .single()
  return data
}

export async function checkUsernameExists(displayName: string): Promise<boolean> {
  const { data, error } = await supa
    .from('user_stats')
    .select('id')
    .eq('display_name', displayName)
    .single()
  
  // If there's an error and it's not "not found", throw it
  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message)
  }
  
  // Return true if user exists (data is not null), false otherwise
  return data !== null
}

export async function upsertUserStats(stats: Partial<UserStats> & { id: string }) {
  await supa
    .from('user_stats')
    .upsert({ ...stats, updated_at: new Date().toISOString() })
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function authSignUp(email: string, password: string, displayName: string) {
  // Import validation functions
  const { validateUsername } = await import('./usernameValidation')
  
  // Validate username format and content
  const validation = validateUsername(displayName)
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid username')
  }
  
  // Check if username already exists
  const usernameExists = await checkUsernameExists(displayName.trim())
  if (usernameExists) {
    throw new Error('This username is already taken. Please choose a different one.')
  }
  
  const { data, error } = await supa.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  if (data.user) {
    // Use a SECURITY DEFINER RPC so the insert bypasses RLS
    // (the session may not be active yet right after signUp)
    const { error: rpcError } = await supa.rpc('init_user_stats', {
      p_user_id: data.user.id,
      p_display_name: displayName.trim(),
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
