// import { ShieldCheck, BadgeCheck } from "lucide-react";

// /**
//  * Shows a verified checkmark icon if user has any verification.
//  * Pass `size` for icon size in px. Pass `showText` to add "Verified" label.
//  */
// export default function VerifiedBadge({
//   user,
//   size = 12,
//   showText = false,
//   className = "",
// }) {
//   if (!user) return null;

//   const emailOk = user.isEmailVerified;
//   const phoneOk = user.isPhoneVerified;

//   if (!emailOk && !phoneOk) return null;

//   // Both = blue badge, only one = green check
//   const isFullyVerified = emailOk && phoneOk;
//   const Icon = isFullyVerified ? BadgeCheck : ShieldCheck;
//   const color = isFullyVerified ? "text-blue-400" : "text-brand-400";

//   return (
//     <span
//       className={`inline-flex items-center gap-1 ${color} ${className}`}
//       title={
//         isFullyVerified
//           ? "Email & phone verified"
//           : emailOk
//           ? "Email verified"
//           : "Phone verified"
//       }
//     >
//       <Icon size={size} fill="currentColor" className="opacity-90" />
//       {showText && (
//         <span className="text-xs font-medium">Verified</span>
//       )}
//     </span>
//   );
// }


import { BadgeCheck } from "lucide-react";

/**
 * Shows a checkmark for verified users.
 * Currently only checks email verification (phone coming later).
 */
export default function VerifiedBadge({
  user,
  size = 12,
  showText = false,
  className = "",
}) {
  if (!user?.isEmailVerified) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-blue-400 ${className}`}
      title="Email verified"
    >
      <BadgeCheck size={size} fill="currentColor" className="opacity-90" />
      {showText && <span className="text-xs font-medium">Verified</span>}
    </span>
  );
}