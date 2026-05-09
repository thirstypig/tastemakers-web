const t = {
  bg: "#0f0f23",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#60a5fa",
  green: "#34d399",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

export default function AdminDashboard() {
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA;
  const branch = process.env.RAILWAY_GIT_BRANCH ?? "local";
  const env = process.env.RAILWAY_ENVIRONMENT_NAME ?? "development";
  const deploymentId = process.env.RAILWAY_DEPLOYMENT_ID;
  const service = process.env.RAILWAY_SERVICE_NAME ?? "tastemakers-web";

  const shortSha = sha ? sha.slice(0, 7) : null;

  return (
    <div style={{ padding: 40, fontFamily: t.font }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 8 }}>
        Dashboard
      </h1>
      <p style={{ color: t.muted, fontSize: 14 }}>
        Admin dashboard coming soon. Use the sidebar to navigate.
      </p>

      <div
        style={{
          marginTop: 32,
          padding: "20px 24px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          maxWidth: 480,
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 600, color: t.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          Build Info
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <BuildRow label="Environment" value={env} highlight={env === "production"} />
          <BuildRow label="Service" value={service} />
          <BuildRow label="Branch" value={branch} />
          {shortSha ? (
            <BuildRow label="Commit" value={shortSha} mono />
          ) : (
            <BuildRow label="Commit" value="local build" dim />
          )}
          {deploymentId && (
            <BuildRow label="Deployment" value={deploymentId.slice(0, 8)} mono />
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
        <a
          href="/tech"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 6,
            background: `${t.accent}18`,
            color: t.accent,
            border: `1px solid ${t.accent}40`,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Under the Hood →
        </a>
        <a
          href="/admin/login"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 6,
            background: `${t.dim}18`,
            color: t.muted,
            border: `1px solid ${t.dim}40`,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Login
        </a>
      </div>
    </div>
  );
}

function BuildRow({
  label,
  value,
  highlight,
  mono,
  dim,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  dim?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: t.muted }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontFamily: mono ? "monospace" : t.font,
          color: highlight ? t.green : dim ? t.dim : t.text,
          fontWeight: highlight ? 600 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}
