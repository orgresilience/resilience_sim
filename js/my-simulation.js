/* Organizational-Resilience Practice Simulator  (no email -- with reset pop-up) */
function initSimulation() {
  /* ─────────────── Modal helpers ─────────────── */
  const modal      = document.getElementById("resetModal");
  const openBtn    = document.getElementById("openResetBtn");
  const confirmBtn = document.getElementById("confirmResetBtn");
  const cancelBtn  = document.getElementById("cancelResetBtn");
  const resetMsg   = document.getElementById("resetMessage");

  function showResetModal(msg = "Reset the simulation?") {
    resetMsg.textContent = msg;
    modal.style.display  = "flex";
  }
  function hideResetModal() {
    modal.style.display = "none";
  }
  /* Reloading the page is the simplest, bullet-proof reset */
  function hardReset() { location.reload(); }

  openBtn .addEventListener("click", showResetModal);
  cancelBtn.addEventListener("click", hideResetModal);
  confirmBtn.addEventListener("click", hardReset);

  /* ─────────────── Chart setup ─────────────── */
  const ctx = document.getElementById("graphCanvas").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Performance (ROA)",
        data: [],
        borderColor: "blue",
        fill: false
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Quarters since foundation" } },
        y: { title: { display: true, text: "Performance (ROA)" }, min: 0, max: 2 }
      }
    }
  });

  /* ─────────────── Simulation constants ─────────────── */
  let E = 5.0;
  let O = 4.0;

  const k         = 0.1;
  const alpha_0   = 0.01;
  const noiseStd  = 0.0;

  const me = 1.365;
  const ma = 1.475;
  const sr = 2.259;
  const se = 0.997;

  const shockTimes      = [25, 32, 45, 60, 80];
  const shockMagnitudes = [1.5, 2.0, 1.0, 2.5, 1.8];

  const time_values = [];
  const E_history   = [];
  const O_history   = [];
  const ROA_history = [];

  /* ─────────────── Main loop ─────────────── */
  const maxTimeSteps = 100;
  const intervalMs   = 400;
  const simulationInterval = setInterval(updateSimulation, intervalMs);

  /** Handle slider live readout */
  document.getElementById("slack").oninput = e =>
      (document.getElementById("status").textContent =
        `Financial Slack: €${(+e.target.value).toFixed(2)} m`);

  function updateSimulation() {
    const t = time_values.length + 1;          /* 1-based */

    /* 1. Read controls */
    const modVal   = +document.querySelector('input[name="modularity"]:checked').value;
    const slackVal = +document.getElementById("slack").value;

    /* 2. Environmental shock */
    const shockIdx = shockTimes.indexOf(t);
    if (shockIdx !== -1) {
      const effShock = shockMagnitudes[shockIdx] * (1 - sr * slackVal);
      E += effShock;
    }

    /* 3. Adaptive adjustment */
    const alpha_c = alpha_0 + ma * modVal;
    const E_des   = E - me * modVal;
    if (alpha_c > 0) {
      O += alpha_c * (E_des - O);
    }

    /* 4. Performance (ROA) */
    const noise = noiseStd ? gaussianNoise(0, noiseStd) : 0;
    const roa   = 1.6 - k * Math.pow(O - E - se * slackVal, 2) + noise;

    /* 5. Record & plot */
    time_values.push(t);
    E_history  .push(E);
    O_history  .push(O);
    ROA_history.push(roa);

    chart.data.labels.push(t);
    chart.data.datasets[0].data.push(roa);

    if (chart.data.labels.length > 50) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();

    /* 6. Status read-out */
    document.getElementById("status").textContent =
      `Performance (ROA): ${roa.toFixed(2)}`;

    /* 7. Auto-stop & prompt reset */
    if (t >= maxTimeSteps) {
      clearInterval(simulationInterval);
      showResetModal("Simulation finished! Run again?");
    }
  }

  /* ─────────────── Gaussian noise util ─────────────── */
  function gaussianNoise(mu, sigma) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) + mu;
  }
}

/* Make entry point global */
window.initSimulation = initSimulation;
