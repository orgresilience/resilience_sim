function initSimulation() {
  // Get the canvas context
  const ctx = document.getElementById("graphCanvas").getContext("2d");

  // Create the Chart.js line chart
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], // Time steps
      datasets: [{
        label: 'Performance',
        data: [], // Performance history
        borderColor: 'blue',
        fill: false
      }]
    },
    options: {
      animation: false, // Disable animation for real-time updates
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Time Steps' } },
        y: { title: { display: true, text: 'Performance' }, min: 0, max: 2 }
      }
    }
  });

  // Simulation parameters
  let E = 5.0, O = 4.0;
  const k = 1, alpha_0 = 0.1, p_shock = 0.1, shock_range = 2.0;
  let time_values = [0];

  function updateSimulation() {
    // Get slider values
    const mod_val = parseFloat(document.getElementById("modularity").value);
    const div_val = parseFloat(document.getElementById("diversification").value);
    const slack_val = parseFloat(document.getElementById("slack").value);

    // Environmental shock
    const shock_range_eff = shock_range * (2.2 - mod_val - div_val);
    if (Math.random() < p_shock * (1 - 0.1 * slack_val)) {
      E += Math.random() * shock_range_eff;
    }

    // Adaptation rate
    const alpha_c = alpha_0 + 0.025 * mod_val**2 - 0.025 * div_val**2 + 0.01 * slack_val;
    const E_des = E * (1.1 - 0.1 * div_val - 0.1 * mod_val) - slack_val;
    if (alpha_c > 0) {
      O += alpha_c * (E_des - O);
    }

    // Compute performance
    const perf = 2 / (1 + Math.exp(-k * (O - E)));

    // Store values
    time_values.push(time_values.length);
    chart.data.labels.push(time_values.length);
    chart.data.datasets[0].data.push(perf);

    // Keep graph size manageable
    if (chart.data.labels.length > 50) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    // Update the chart
    chart.update();

    // Update status display
    document.getElementById("status").innerHTML = `
      <p><strong>Environment (E):</strong> ${E.toFixed(2)}</p>
      <p><strong>Organization (O):</strong> ${O.toFixed(2)}</p>
      <p><strong>Performance:</strong> ${perf.toFixed(2)}</p>
    `;
  }

  // Start simulation loop
  setInterval(updateSimulation, 100);
}

// Expose function globally
window.initSimulation = initSimulation;
