export function isProfileComplete(user) {
  if (!user) return false

  const hasName = typeof user.name === 'string' && user.name.trim().length > 0
  const hasOffered =
    Array.isArray(user.skillsOffered) && user.skillsOffered.length > 0
  const hasWanted =
    Array.isArray(user.skillsWanted) && user.skillsWanted.length > 0

  return hasName && hasOffered && hasWanted
}