function initSimulation() {
  /* ──────────────── Chart setup ──────────────── */
  const ctx = document.getElementById("graphCanvas").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Performance (ROA)",
          data: [],
          borderColor: "blue",
          fill: false,
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Quarters since foundation" } },
        y: { title: { display: true, text: "Performance (ROA)" }, min: 0, max: 2 },
      },
    },
  });

  /* ──────────────── Simulation constants ──────────────── */
  // State
  let E = 5.0;
  let O = 4.0;

  // Fixed coefficients
  const k = 0.1;
  const alpha_0 = 0.01;
  const noiseStd = 0.0;

  const me = 0.719;
  const ma = 0.567;
  const sr = 0.324;
  const se = 0.119;

  // Shock schedule
  const shock_times = [25, 32, 45, 60, 80];          // 1-based ticks
  const shock_magnitudes = [1.5, 2.0, 1.0, 2.5, 1.8];

  /* ──────────────── History buffers ──────────────── */
  const time_values = [];
  const E_history = [];
  const O_history = [];
  const M_history = [];
  const S_history = [];
  const ROA_history = [];

  /* ──────────────── Main loop ──────────────── */
  const maxTimeSteps = 100;
  const intervalMs   = 400;
  const simulationInterval = setInterval(updateSimulation, intervalMs);

  // update display for slack slider live
  document.getElementById("slack").oninput = (e) =>
    (document.getElementById("slackValue").textContent = parseFloat(e.target.value).toFixed(2));

  function updateSimulation() {
    /* 1. Time step */
    const t = time_values.length + 1;        // 1-based

    /* 2. Read controls */
    const mod_val   = parseFloat(document.querySelector('input[name="modularity"]:checked').value);
    const slack_val = parseFloat(document.getElementById("slack").value);

    /* 3. Environmental shock */
    const shockIdx = shock_times.indexOf(t);
    if (shockIdx !== -1) {
      const shock_range_eff = shock_magnitudes[shockIdx] * (1 - sr * slack_val);
      E += shock_range_eff;
    }

    /* 4. Adaptive adjustment */
    const alpha_c = alpha_0 + ma * mod_val;
    const E_des   = E - me * mod_val - se * slack_val;
    if (alpha_c > 0) {
      O += alpha_c * (E_des - O);
    }

    /* 5. Performance (ROA) */
    const noise = noiseStd > 0 ? gaussianNoise(0, noiseStd) : 0;
    const roa   = 1.6 - k * Math.pow(O - E, 2) + noise;

    /* 6. Record histories */
    time_values.push(t);
    E_history.push(E);
    O_history.push(O);
    M_history.push(mod_val);
    S_history.push(slack_val);
    ROA_history.push(roa);

    /* 7. Update chart */
    chart.data.labels.push(t);
    chart.data.datasets[0].data.push(roa);

    if (chart.data.labels.length > 50) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();

    /* 8. Status read-out (ROA only) */
    document.getElementById("status").textContent = `Performance (ROA): ${roa.toFixed(2)}`;

    /* 9. Terminate run and email CSV */
    if (t >= maxTimeSteps) {
      clearInterval(simulationInterval);
      sendEmail(E_history, O_history, M_history, S_history, ROA_history);
    }
  }

  /* ──────────────── Gaussian noise util ──────────────── */
  function gaussianNoise(mu, sigma) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();           // (0,1]
    while (v === 0) v = Math.random();
    return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) + mu;
  }

  /* ──────────────── CSV & EmailJS ──────────────── */
  function convertToCSV(E_hist, O_hist, M_hist, S_hist, R_hist) {
    let csv = "Time Step,Environment (E),Organization (O),Modularity (M),Slack (S),Performance (ROA)\n";
    for (let i = 0; i < E_hist.length; i++) {
      csv += `${i + 1},${E_hist[i].toFixed(2)},${O_hist[i].toFixed(2)},${M_hist[i].toFixed(2)},${S_hist[i].toFixed(2)},${R_hist[i].toFixed(2)}\n`;
    }
    return csv;
  }

  function sendEmail(E_hist, O_hist, M_hist, S_hist, R_hist) {
    emailjs.init("UjOAvsOdS6Syhwa_n"); // Replace with your EmailJS user ID

    const csvData   = convertToCSV(E_hist, O_hist, M_hist, S_hist, R_hist);
    const base64CSV = btoa(unescape(encodeURIComponent(csvData)));

    const emailParams = {
      to_email: "eilseven@ucp.pt",
      subject: "Simulation Results (ROA)",
      message: "Please find the attached CSV file containing the simulation data.",
      attachment: base64CSV,
      filename: "simulation_results.csv",
    };

    emailjs
      .send("service_aro1a8j", "template_kkae6ck", emailParams)
      .then(() => alert("Simulation complete. Email sent with CSV!"))
      .catch((error) => console.error("Email failed to send:", error));
  }
}

/* ──────────────── Make entry-point global ──────────────── */
window.initSimulation = initSimulation;
