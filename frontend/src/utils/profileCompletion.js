/**
 * Calculate profile completion as a percentage and list missing items.
 * Each field has a weight; total = 100.
 */
export function calculateCompletion(user) {
  if (!user) return { percent: 0, missing: [], total: 0 };

  // Weighted fields — adjust if you want different priorities
  const fields = [
    { key: "avatar",          label: "Add a profile photo",       weight: 15, done: !!user.avatar },
    { key: "bio",             label: "Write a short bio",         weight: 15, done: !!user.bio && user.bio.length > 10 },
    { key: "age",             label: "Add your age",              weight: 10, done: !!user.age },
    { key: "gender",          label: "Set your gender",           weight: 5,  done: !!user.gender },
    { key: "skillLevel",      label: "Set your skill level",      weight: 10, done: !!user.skillLevel && user.skillLevel !== "any" },
    { key: "preferredSports", label: "Pick favorite sports",      weight: 15, done: user.preferredSports?.length > 0 },
    { key: "location",        label: "Enable location",           weight: 10, done: !!user.location?.coordinates?.length },
    { key: "isEmailVerified", label: "Verify your email",         weight: 10, done: !!user.isEmailVerified },
    { key: "isPhoneVerified", label: "Verify your phone",         weight: 10, done: !!user.isPhoneVerified },
  ];

  const done = fields.filter((f) => f.done).reduce((sum, f) => sum + f.weight, 0);
  const total = fields.reduce((sum, f) => sum + f.weight, 0);
  const percent = Math.round((done / total) * 100);
  const missing = fields.filter((f) => !f.done);

  return { percent, missing, total };
}

/**
 * Returns a friendly label based on completion percentage.
 */
export function getCompletionLabel(percent) {
  if (percent >= 100) return "Profile complete! 🎉";
  if (percent >= 80)  return "Almost there!";
  if (percent >= 50)  return "Looking good";
  if (percent >= 25)  return "Keep going";
  return "Get started";
}

/**
 * Color class based on completion percentage.
 */
export function getCompletionColor(percent) {
  if (percent >= 100) return "text-brand-400";
  if (percent >= 70)  return "text-blue-400";
  if (percent >= 40)  return "text-yellow-400";
  return "text-orange-400";
}