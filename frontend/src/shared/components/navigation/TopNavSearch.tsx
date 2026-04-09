import React from "react";

type TopNavSearchProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  isUzHeader: boolean;
  containerClassName?: string;
};

export function TopNavSearch({
  value,
  placeholder,
  onChange,
  isUzHeader,
  containerClassName,
}: TopNavSearchProps) {
  const widthClass = isUzHeader
    ? "w-[min(100%,16rem)] min-w-[12rem] max-w-[42vw] sm:w-[15rem] xl:w-[17rem] 2xl:w-[18rem]"
    : "w-[min(100%,14rem)] min-w-[10.5rem] max-w-[36vw] sm:w-[13.5rem] xl:w-[15rem] 2xl:w-[16rem]";

  return (
    <div
      className={`${containerClassName ?? ""} relative lg:-translate-x-1 ${widthClass}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      >
        <path d="m21 21-4.34-4.34" />
        <circle cx="11" cy="11" r="8" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full min-w-0 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-input-bg)] py-1.5 pl-10 pr-3 text-sm text-slate-900 dark:text-slate-100 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-slate-500 placeholder:leading-normal focus-visible:border-[#2a5f45] focus-visible:ring-[3px] focus-visible:ring-[#2a5f45]/30"
      />
    </div>
  );
}
