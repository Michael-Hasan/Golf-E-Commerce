import React, { useEffect, useState } from "react";
import { getProductImageUrl, persistWishlistIds, readWishlistIds } from "../lib/app-utils";

function ProductImage({
  name,
  category,
  imgClassName,
}: {
  name: string;
  category?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="mb-3 flex h-36 items-center justify-center rounded-lg bg-[var(--gl-card)] text-3xl font-semibold text-slate-500">
        {name[0]}
      </div>
    );
  }

  return (
    <img
      src={getProductImageUrl(name, category)}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={
        imgClassName ??
        "mb-3 h-36 w-full rounded-lg border border-[var(--gl-border-strong)] object-cover"
      }
    />
  );
}

function WishlistToggleButton({
  itemId,
  itemName,
  className,
  children,
  creativeOnLike,
}: {
  itemId: string;
  itemName: string;
  className?: string;
  children?: React.ReactNode;
  creativeOnLike?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setLiked(readWishlistIds().includes(itemId));
  }, [itemId]);

  useEffect(() => {
    if (!creativeOnLike || !liked) return;
    setPop(true);
    const t = window.setTimeout(() => setPop(false), 650);
    return () => window.clearTimeout(t);
  }, [creativeOnLike, liked]);

  const toggleWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setLiked((current) => {
      const ids = readWishlistIds();
      const nextIds = current
        ? ids.filter((id) => id !== itemId)
        : Array.from(new Set([...ids, itemId]));
      persistWishlistIds(nextIds);
      window.dispatchEvent(new Event("wishlist:changed"));
      return !current;
    });
  };

  return (
    <button
      type="button"
      onClick={toggleWishlist}
      aria-label={`${liked ? "Remove" : "Add"} ${itemName} ${liked ? "from" : "to"} wishlist`}
      aria-pressed={liked}
      className={`${className ?? ""} ${
        creativeOnLike ? "relative overflow-hidden" : ""
      } ${
        liked
          ? creativeOnLike
            ? "bg-gradient-to-r from-rose-500/20 via-fuchsia-500/10 to-pink-500/10 text-rose-200 ring-1 ring-rose-500/35"
            : "bg-rose-500/20 text-rose-400"
          : "text-slate-600 transition-colors hover:text-[#22c55e] dark:text-slate-300 dark:hover:text-[#22c55e]"
      }`}
    >
      {creativeOnLike ? (
        <>
          {liked && pop ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl wishlist-like-ring"
            />
          ) : null}
          {liked && pop ? (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "-18px", ["--dy" as any]: "-24px" } as any}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "16px", ["--dy" as any]: "-18px" } as any}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "-20px", ["--dy" as any]: "10px" } as any}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "20px", ["--dy" as any]: "14px" } as any}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "0px", ["--dy" as any]: "-30px" } as any}
              />
            </>
          ) : null}
        </>
      ) : null}
      <span className="flex items-center justify-center gap-2">
        <span className="text-lg leading-none" aria-hidden="true">
          <span
            className={
              creativeOnLike && liked && pop
                ? "wishlist-like-heart-pulse"
                : undefined
            }
          >
            {liked ? "♥" : "♡"}
          </span>
        </span>
        {children ? (
          <span className="text-sm font-bold tracking-tight">{children}</span>
        ) : null}
      </span>
    </button>
  );
}

export { ProductImage, WishlistToggleButton };
export { TopNav } from "../shared/components/navigation/TopNav";
export { SiteFooter } from "../shared/components/layout/SiteFooter";
