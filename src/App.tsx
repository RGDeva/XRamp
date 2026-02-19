import { useState } from "react";

type Step = "form" | "swapping" | "done";

const METHODS = ["Venmo", "Cash App", "Bank Transfer"] as const;

const App = () => {
  const [amount, setAmount] = useState("10");
  const [method, setMethod] = useState<string>(METHODS[0]);
  const [step, setStep] = useState<Step>("form");

  const progress = step === "form" ? 33 : step === "swapping" ? 66 : 100;

  const handleSwap = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setStep("swapping");
    setTimeout(() => setStep("done"), 2000);
  };

  const handleReset = () => {
    setStep("form");
    setAmount("10");
    setMethod(METHODS[0]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Progress bar */}
      <div style={{ height: 4, background: "#e6f2f9", width: "100%" }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "#0077b5",
            transition: "width 0.4s ease",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          padding: "20px 24px 0",
          maxWidth: 440,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0077b5",
            margin: "0 0 4px",
            letterSpacing: "-0.3px",
          }}
        >
          XRamp
        </h1>
        <p style={{ fontSize: 13, color: "#777", margin: 0 }}>
          USD → AVAX · Simple swap
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          maxWidth: 440,
          margin: "24px auto 0",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "28px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          {/* FORM STATE */}
          {step === "form" && (
            <>
              {/* Amount */}
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#555",
                  marginBottom: 8,
                }}
              >
                Amount (USD)
              </label>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 28,
                    fontWeight: 600,
                    color: "#0077b5",
                    pointerEvents: "none",
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%",
                    fontSize: 28,
                    fontWeight: 600,
                    padding: "14px 16px 14px 38px",
                    border: "2px solid #e5e7eb",
                    borderRadius: 12,
                    outline: "none",
                    color: "#1a1a1a",
                    background: "#fafbfc",
                    transition: "border-color 0.2s",
                    WebkitAppearance: "none",
                    MozAppearance: "textfield" as any,
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "#0077b5")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "#e5e7eb")
                  }
                />
              </div>

              {/* Method */}
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#555",
                  marginBottom: 8,
                }}
              >
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: 16,
                  fontWeight: 500,
                  padding: "12px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: 12,
                  outline: "none",
                  color: "#1a1a1a",
                  background: "#fafbfc",
                  cursor: "pointer",
                  WebkitAppearance: "none",
                  appearance: "none" as any,
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  marginBottom: 20,
                }}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Fund Here placeholder */}
              <div
                style={{
                  background: "#f0f7fb",
                  border: "1px dashed #b3d9ec",
                  borderRadius: 10,
                  padding: "14px 16px",
                  textAlign: "center",
                  color: "#0077b5",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 24,
                }}
              >
                Fund Here — {method} details will appear after swap
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwap}
                disabled={!amount || parseFloat(amount) <= 0}
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fff",
                  background:
                    !amount || parseFloat(amount) <= 0
                      ? "#a0c4d8"
                      : "#0077b5",
                  border: "none",
                  borderRadius: 14,
                  cursor:
                    !amount || parseFloat(amount) <= 0
                      ? "not-allowed"
                      : "pointer",
                  transition: "background 0.2s, transform 0.1s",
                  letterSpacing: "0.3px",
                }}
                onMouseEnter={(e) => {
                  if (amount && parseFloat(amount) > 0)
                    (e.target as HTMLButtonElement).style.background =
                      "#005f8f";
                }}
                onMouseLeave={(e) => {
                  if (amount && parseFloat(amount) > 0)
                    (e.target as HTMLButtonElement).style.background =
                      "#0077b5";
                }}
                onMouseDown={(e) =>
                  ((e.target as HTMLButtonElement).style.transform =
                    "scale(0.98)")
                }
                onMouseUp={(e) =>
                  ((e.target as HTMLButtonElement).style.transform =
                    "scale(1)")
                }
              >
                Swap to AVAX
              </button>
            </>
          )}

          {/* SWAPPING STATE */}
          {step === "swapping" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: "4px solid #e6f2f9",
                  borderTop: "4px solid #0077b5",
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#0077b5",
                  margin: "0 0 6px",
                }}
              >
                Swapping...
              </p>
              <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
                Converting ${amount} via {method} → AVAX
              </p>
            </div>
          )}

          {/* DONE STATE */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#e6f9ee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: 26,
                }}
              >
                ✓
              </div>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  margin: "0 0 4px",
                }}
              >
                Complete — Receipt
              </p>
              <p style={{ fontSize: 14, color: "#888", margin: "0 0 4px" }}>
                ${amount} → AVAX via {method}
              </p>
              <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 24px" }}>
                Transaction ID: XR-{Date.now().toString(36).toUpperCase()}
              </p>
              <button
                onClick={handleReset}
                style={{
                  padding: "12px 32px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0077b5",
                  background: "#e6f2f9",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLButtonElement).style.background =
                    "#d0e8f5")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLButtonElement).style.background =
                    "#e6f2f9")
                }
              >
                New Swap
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#bbb",
            marginTop: 20,
          }}
        >
          XRamp · Private. Fast. Simple.
        </p>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default App;
