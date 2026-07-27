console.log("Mycelia starting...");

const appElement = document.getElementById("app");

if (appElement) {
  appElement.innerHTML = `
    <div style="font-family: system-ui, sans-serif; padding: 2rem; background: #0a0e17; color: #e2e8f0; min-height: 100vh;">
      <header style="border-bottom: 1px solid #1e293b; padding-bottom: 1rem; margin-bottom: 2rem;">
        <h1 style="color: #38bdf8; margin: 0 0 0.5rem 0;">Mycelia</h1>
        <p style="color: #94a3b8; margin: 0;">Living digital organism growing inside browser tabs</p>
      </header>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div style="background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #a7f3d0; margin-top: 0;">Cell State</h2>
          <div id="cell-status">Initializing cell environment...</div>
        </div>

        <div style="background: #111827; padding: 1.5rem; border-radius: 8px; border: 1px solid #1f2937;">
          <h2 style="color: #c084fc; margin-top: 0;">Peer Mesh</h2>
          <div id="mesh-status">Connecting to signaling server...</div>
        </div>
      </div>
    </div>
  `;

  try {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      const meshElem = document.getElementById("mesh-status");
      if (meshElem) {
        meshElem.innerHTML = "<p style='color: #4ade80;'>Connected to signaling mesh</p>";
      }
    };

    ws.onerror = () => {
      const meshElem = document.getElementById("mesh-status");
      if (meshElem) {
        meshElem.innerHTML = "<p style='color: #f87171;'>Signaling server offline (running local cell mode)</p>";
      }
    };
  } catch (err) {
    console.log("Signaling connection notice:", err);
  }
}
