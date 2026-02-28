import { useLocation } from "wouter";

export default function WelcomeOpvoedmaatje() {
  const [, navigate] = useLocation();

  function goNext() {
    const profile = localStorage.getItem("matti_user_profile");
    if (profile) {
      navigate("/chat");
    } else {
      navigate("/account-aanmaken");
    }
  }

  return (
    <div style={styles.screen}>
      <div style={styles.container}>
        <div style={styles.headline}>
          Goed dat je er bent,<br />
          je hoeft het niet alleen te doen.
        </div>

        <div style={styles.logoWrapper}>
          <svg viewBox="0 0 600 760" width="100%" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="#2F6DB3" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="210" cy="150" r="70" />
              <circle cx="420" cy="230" r="55" />
              <path d="M260 250 C 230 320, 210 360, 210 430 C 210 540, 300 585, 330 600" />
              <path d="M365 305 C 420 300, 470 330, 490 380 C 525 470, 470 555, 360 600" />
              <path d="M300 310 C 325 280, 355 270, 400 280" />
            </g>

            <g style={styles.heart} transform="translate(300, 470) scale(1.3)">
              <path
                d="M0 30 C-20 10 -45 0 -45 -20 C-45 -35 -30 -45 -15 -45 C-5 -45 0 -35 0 -25 C0 -35 5 -45 15 -45 C30 -45 45 -35 45 -20 C45 0 20 10 0 30 Z"
                fill="#FF6B7A"
              />
            </g>

            <text
              x="300"
              y="715"
              textAnchor="middle"
              fontSize="92"
              fontWeight="800"
              fill="#2F6DB3"
              fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
            >
              Opvoedmaatje
            </text>
          </svg>
        </div>

        <button style={styles.cta} onClick={goNext}>
          Ga verder
        </button>
      </div>

      <style>{`
        @keyframes heartbeat {
          0%   { transform: scale(1); }
          20%  { transform: scale(1.08); }
          40%  { transform: scale(1); }
          60%  { transform: scale(1.05); }
          80%  { transform: scale(1); }
          100% { transform: scale(1); }
        }
        .heartbeat-group {
          transform-origin: 300px 470px;
          animation: heartbeat 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: "100vh",
    background: "#E9EFF5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: "420px",
    padding: "24px",
    textAlign: "center",
  },
  headline: {
    fontSize: "clamp(28px, 6vw, 42px)",
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: "40px",
    color: "#2F6DB3",
  },
  logoWrapper: {
    marginBottom: "40px",
  },
  heart: {
    transformOrigin: "center",
    animation: "heartbeat 1.6s ease-in-out infinite",
  },
  cta: {
    background: "#2F6DB3",
    color: "white",
    border: "none",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    maxWidth: "360px",
    fontSize: "16px",
  },
};
