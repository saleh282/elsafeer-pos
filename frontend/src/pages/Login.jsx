import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between"
      style={{
        minHeight: "100vh",
        justifyContent: "center",
        background:
          "linear-gradient(160deg, var(--color-bg) 0%, var(--color-surface-alt) 100%)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: 380, maxWidth: "92vw", padding: 32 }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img className="login-logo" src="/logo.jpg" alt="شعار حلواني السفير" />
          <h1 style={{ color: "var(--color-accent)", marginBottom: 4 }}>
            حلواني السفير
          </h1>
          <p className="text-muted">نظام الكاشير</p>
        </div>

        {error && (
          <div
            className="text-danger"
            style={{
              background: "#FCE9E7",
              padding: "10px 12px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div className="flex-col gap-12">
          <div>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                display: "block",
                marginBottom: 6,
              }}
            >
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: ismailia1"
              autoFocus
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                display: "block",
                marginBottom: 6,
              }}
            >
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="btn btn-lg btn-block"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
