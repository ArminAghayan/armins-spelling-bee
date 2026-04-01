// Realistic gaming usernames that real people use online
export const BOT_NAMES = [
  'xXShadowXx',
  'NoobMaster69',
  'GamerGirl123',
  'ProPlayer2024',
  'SkillzKillz',
  'xXDarkLordXx',
  'CoolCat42',
  'EpicGamer',
  'NightHawk',
  'FireStorm',
  'IceCold',
  'ThunderBolt',
  'SilentNinja',
  'RedDragon',
  'BluePhoenix',
  'GreenMachine',
  'PurpleRain',
  'GoldenEagle',
  'SilverBullet',
  'BlackWidow',
  'WhiteWolf',
  'CrimsonTide',
  'VelvetThunder',
  'NeonLights',
  'PixelWarrior',
  'ByteMe',
  'CodeBreaker',
  'HackerMan',
  'TechNinja',
  'CyberPunk',
  'DigitalDemon',
  'VirtualViper',
  'DataDragon',
  'NetNinja',
  'WebWarrior',
  'CloudChaser',
  'StormBreaker',
  'LightningBolt',
  'ThunderStrike',
  'PowerPlayer'
]

// Bot difficulty levels with different accuracy and timing
export const BOT_PROFILES = [
  {
    name: 'Beginner Bot',
    accuracy: 0.4, // 40% accuracy
    minThinkTime: 3000, // 3-8 seconds to answer
    maxThinkTime: 8000,
    streakBonus: 0.05 // slight accuracy increase with streak
  },
  {
    name: 'Intermediate Bot',
    accuracy: 0.65, // 65% accuracy
    minThinkTime: 2000, // 2-5 seconds to answer
    maxThinkTime: 5000,
    streakBonus: 0.1
  },
  {
    name: 'Advanced Bot',
    accuracy: 0.8, // 80% accuracy
    minThinkTime: 1500, // 1.5-4 seconds to answer
    maxThinkTime: 4000,
    streakBonus: 0.15
  },
  {
    name: 'Expert Bot',
    accuracy: 0.9, // 90% accuracy
    minThinkTime: 1000, // 1-3 seconds to answer
    maxThinkTime: 3000,
    streakBonus: 0.2
  }
]

export function getRandomBotName(): string {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
}

export function getRandomBotProfile() {
  return BOT_PROFILES[Math.floor(Math.random() * BOT_PROFILES.length)]
}

// Generate a set of unique bot names for a game
export function generateBotNames(count: number): string[] {
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, BOT_NAMES.length))
}

// Bot AI logic for determining if they should answer correctly
export function shouldBotAnswerCorrectly(
  botAccuracy: number,
  currentStreak: number,
  streakBonus: number
): boolean {
  // Increase accuracy slightly based on current streak
  const adjustedAccuracy = Math.min(0.95, botAccuracy + (currentStreak * streakBonus))
  return Math.random() < adjustedAccuracy
}

// Calculate bot thinking time with some randomness
export function getBotThinkTime(minTime: number, maxTime: number): number {
  return minTime + Math.random() * (maxTime - minTime)
}