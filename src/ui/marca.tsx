/** O nome do app com uma seta para cima: subir, um dia de cada vez. */
export function Marca() {
  return (
    <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span
        aria-hidden="true"
        className="bg-acento flex size-7 items-center justify-center rounded-lg text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 17l6-6 4 4 6-8M14 7h6v6" />
        </svg>
      </span>
      Ascend
    </span>
  );
}
