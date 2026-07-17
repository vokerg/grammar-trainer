export function WordMascot({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'word-mascot compact' : 'word-mascot'} aria-hidden="true">
      <span className="floating-letter letter-a">A</span>
      <span className="floating-letter letter-b">?</span>
      <span className="floating-letter letter-c">Ж</span>
      <svg viewBox="0 0 260 220" role="presentation">
        <path
          className="mascot-shadow"
          d="M45 194c18-18 153-20 177 0-13 22-159 28-177 0Z"
        />
        <path
          className="mascot-body"
          d="M56 54c23-28 122-35 151 1 22 27 14 113-20 139-27 21-101 20-126-7C36 160 31 84 56 54Z"
        />
        <path className="mascot-page" d="M68 76c28-17 57-12 65 2v88c-20-14-43-14-65-3V76Z" />
        <path className="mascot-page" d="M133 78c12-16 48-19 67-3v88c-22-11-46-10-67 3V78Z" />
        <path className="mascot-line" d="M82 101h34M82 119h34M82 137h27M149 101h34M149 119h34M149 137h26" />
        <circle className="mascot-eye" cx="111" cy="57" r="7" />
        <circle className="mascot-eye" cx="153" cy="57" r="7" />
        <path className="mascot-smile" d="M121 66c7 8 16 8 23 0" />
        <path className="mascot-pencil" d="m185 37 12-13 13 12-13 14-31 31-15 4 4-16 30-32Z" />
        <path className="mascot-pencil-tip" d="m151 85 15-4-11-12-4 16Z" />
      </svg>
    </div>
  );
}
