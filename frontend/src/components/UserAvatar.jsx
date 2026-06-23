// UserAvatar component
function UserAvatar({ name = "M", profileImage = "", size = "md" }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "M";
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
  };
  if (profileImage) {
    return (
      <img
        src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${profileImage}`}
        alt={name}
        className={`rounded-full object-cover border border-white/60 shadow-[0_8px_18px_rgba(139,63,224,0.18)] ${sizeClasses[size]}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#cba8f0] to-[#8b3fe0] font-semibold text-white border border-white/60 shadow-[0_8px_18px_rgba(139,63,224,0.18)] ${sizeClasses[size]}`}
    >
      {initial}
    </div>
  );
}
export default UserAvatar;
