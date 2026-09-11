import type { User } from "@/types";

interface Props {
  user: Pick<User, "first_name" | "last_name" | "username" | "avatar_url">;
  size: number;
}

export function Avatar({ user, size }: Props) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt=""
        referrerPolicy="no-referrer"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "var(--ink)",
        color: "var(--paper)",
        display: "grid",
        placeItems: "center",
        fontSize: size <= 28 ? 11 : 13,
        fontWeight: 600,
        letterSpacing: 0.5,
      }}
    >
      {user.first_name && user.last_name
        ? (user.first_name[0] + user.last_name[0]).toUpperCase()
        : user.username.slice(0, 2).toUpperCase()}
    </div>
  );
}
