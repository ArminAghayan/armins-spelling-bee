// Username validation utilities for filtering inappropriate content and ensuring uniqueness

// List of inappropriate words/patterns to block
const INAPPROPRIATE_WORDS = [
  // Racial slurs and discriminatory terms
  'nigger', 'nigga', 'negro', 'coon', 'spook', 'chink', 'gook', 'jap', 'wetback', 
  'spic', 'beaner', 'kike', 'hymie', 'wop', 'dago', 'guinea', 'kraut', 'hun',
  'raghead', 'towelhead', 'camel', 'sand', 'curry', 'dothead', 'redskin',
  
  // Sexist and misogynistic terms
  'bitch', 'slut', 'whore', 'cunt', 'twat', 'pussy', 'tits', 'boobs', 'cock', 
  'dick', 'penis', 'vagina', 'dildo', 'vibrator', 'masturbate', 'orgasm',
  
  // Homophobic slurs
  'faggot', 'fag', 'dyke', 'queer', 'homo', 'tranny', 'shemale',
  
  // General offensive terms
  'fuck', 'shit', 'damn', 'hell', 'ass', 'asshole', 'bastard', 'piss', 'crap',
  'retard', 'retarded', 'idiot', 'moron', 'stupid', 'dumb', 'loser', 'freak',
  
  // Hate symbols and references
  'nazi', 'hitler', 'holocaust', 'kkk', 'swastika', 'confederate', 'isis', 'taliban',
  
  // Sexual content
  'porn', 'sex', 'anal', 'oral', 'blow', 'suck', 'lick', 'finger', 'naked', 'nude',
  
  // Drug references
  'cocaine', 'heroin', 'meth', 'crack', 'weed', 'marijuana', 'cannabis', 'drug',
  
  // Violence
  'kill', 'murder', 'rape', 'abuse', 'violence', 'bomb', 'terror', 'suicide',
  
  // Common variations and leetspeak
  'n1gg3r', 'n1gga', 'f4gg0t', 'b1tch', 'sh1t', 'fuk', 'fck', 'btch', 'cnt',
  '4ss', 'a55', 'h3ll', 'd4mn', 'p1ss', 'cr4p', 'st00p1d', 'd0mb', 'r3t4rd',
  
  // Combinations that might slip through
  'admin', 'moderator', 'support', 'official', 'staff', 'owner', 'developer'
]

// Patterns for leetspeak and character substitution
const LEETSPEAK_PATTERNS = [
  { pattern: /[4@]/g, replacement: 'a' },
  { pattern: /[3]/g, replacement: 'e' },
  { pattern: /[1!]/g, replacement: 'i' },
  { pattern: /[0]/g, replacement: 'o' },
  { pattern: /[5$]/g, replacement: 's' },
  { pattern: /[7]/g, replacement: 't' },
  { pattern: /[+]/g, replacement: 't' },
  { pattern: /[8]/g, replacement: 'b' },
  { pattern: /[9]/g, replacement: 'g' },
]

// Reserved usernames that shouldn't be allowed
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'mod', 'moderator', 'support', 'help', 'staff',
  'owner', 'root', 'user', 'guest', 'anonymous', 'anon', 'system', 'bot',
  'api', 'www', 'mail', 'email', 'ftp', 'http', 'https', 'ssl', 'tls',
  'official', 'verified', 'premium', 'vip', 'pro', 'plus', 'team', 'group',
  'null', 'undefined', 'void', 'none', 'empty', 'blank', 'test', 'demo',
  'example', 'sample', 'default', 'temp', 'temporary', 'delete', 'deleted',
  'banned', 'suspended', 'inactive', 'deactivated', 'disabled', 'blocked'
]

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Normalizes text by converting leetspeak and removing special characters
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim()
  
  // Apply leetspeak conversions
  for (const { pattern, replacement } of LEETSPEAK_PATTERNS) {
    normalized = normalized.replace(pattern, replacement)
  }
  
  // Remove non-alphanumeric characters except spaces
  normalized = normalized.replace(/[^a-z0-9\s]/g, '')
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * Checks if a username contains inappropriate content
 */
export function validateInappropriateContent(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' }
  }

  const normalized = normalizeText(username)
  const originalLower = username.toLowerCase().trim()
  
  // Check against inappropriate words list
  for (const word of INAPPROPRIATE_WORDS) {
    if (normalized.includes(word) || originalLower.includes(word)) {
      return { isValid: false, error: 'This username contains inappropriate content' }
    }
  }
  
  // Check for reserved usernames
  if (RESERVED_USERNAMES.includes(normalized) || RESERVED_USERNAMES.includes(originalLower)) {
    return { isValid: false, error: 'This username is reserved and cannot be used' }
  }
  
  // Check for patterns that might be offensive
  const suspiciousPatterns = [
    /(.)\1{4,}/, // Repeated characters (aaaaa, 11111)
    /^[0-9]+$/, // Only numbers
    /^.{1,2}$/, // Too short (1-2 chars)
    /^.{17,}$/, // Too long (17+ chars)
    /^\s|\s$/, // Leading/trailing spaces
    /\s{2,}/, // Multiple consecutive spaces
  ]
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(username)) {
      if (pattern === suspiciousPatterns[2]) {
        return { isValid: false, error: 'Username must be at least 3 characters long' }
      }
      if (pattern === suspiciousPatterns[3]) {
        return { isValid: false, error: 'Username must be 16 characters or less' }
      }
      if (pattern === suspiciousPatterns[4] || pattern === suspiciousPatterns[5]) {
        return { isValid: false, error: 'Username cannot have leading/trailing spaces or multiple consecutive spaces' }
      }
      if (pattern === suspiciousPatterns[0]) {
        return { isValid: false, error: 'Username cannot contain excessive repeated characters' }
      }
      if (pattern === suspiciousPatterns[1]) {
        return { isValid: false, error: 'Username cannot be only numbers' }
      }
    }
  }
  
  return { isValid: true }
}

/**
 * Validates username format and basic requirements
 */
export function validateUsernameFormat(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' }
  }

  const trimmed = username.trim()
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' }
  }
  
  if (trimmed.length > 16) {
    return { isValid: false, error: 'Username must be 16 characters or less' }
  }
  
  // Allow letters, numbers, spaces, hyphens, underscores, and dots
  const validPattern = /^[a-zA-Z0-9\s\-_.]+$/
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, spaces, hyphens, underscores, and dots' }
  }
  
  // Cannot start or end with special characters
  const edgePattern = /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/
  if (!edgePattern.test(trimmed)) {
    return { isValid: false, error: 'Username must start and end with a letter or number' }
  }
  
  return { isValid: true }
}

/**
 * Comprehensive username validation combining all checks
 */
export function validateUsername(username: string): ValidationResult {
  // First check format
  const formatResult = validateUsernameFormat(username)
  if (!formatResult.isValid) {
    return formatResult
  }
  
  // Then check for inappropriate content
  const contentResult = validateInappropriateContent(username)
  if (!contentResult.isValid) {
    return contentResult
  }
  
  return { isValid: true }
}