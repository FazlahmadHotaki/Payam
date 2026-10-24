type AvatarProps = { src: string; name: string; size?: number; online?: boolean; className?: string };
export default function Avatar({ src, name, size = 48, online = false, className = "" }: AvatarProps) {
  return <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
    <img src={src} alt={`${name}'s profile`} width={size} height={size} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full rounded-full object-cover" />
    {online && <span aria-label="Online" className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
  </span>;
}
