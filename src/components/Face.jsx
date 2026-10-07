// state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
export default function Face({ state }) {
  return (
    <div className={`face face--${state}`}>
      {state === 'listening' && (
        <>
          <span className="face__ring" />
          <span className="face__ring face__ring--delay" />
        </>
      )}

      <svg viewBox="0 0 200 200" className="face__svg" aria-hidden="true">
        <circle cx="100" cy="100" r="90" className="face__base" />
        <ellipse cx="68" cy="85" rx="10" ry="14" className="face__eye" />
        <ellipse cx="132" cy="85" rx="10" ry="14" className="face__eye" />
        <rect x="75" y="125" width="50" height="14" rx="7" className="face__mouth" />
      </svg>

      {state === 'thinking' && (
        <div className="face__dots">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
