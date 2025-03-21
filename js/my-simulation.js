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
      animation: false,
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
  let E_history = [E]; // Store environment values
  let O_history = [O]; // Store organization values

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
    E_history.push(E);
    O_history.push(O);
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

    // Stop the simulation at time step 1000 and send an email with all values
    if (time_values.length >= 1000) {
      clearInterval(simulationInterval); // Stop the interval
      sendEmail(E_history, O_history); // Send email with all values
    }
  }

  // Start simulation loop
  let simulationInterval = setInterval(updateSimulation, 100);
}

// Function to send an email via EmailJS
function sendEmail(E_history, O_history) {
  emailjs.init("YOUR_EMAILJS_USER_ID"); // Replace with your EmailJS user ID

  // Format the E and O history as a table
  let formattedData = `<table border="1">
    <tr><th>Time Step</th><th>Environment (E)</th><th>Organization (O)</th></tr>`;
  for (let i = 0; i < E_history.length; i++) {
    formattedData += `<tr><td>${i}</td><td>${E_history[i].toFixed(2)}</td><td>${O_history[i].toFixed(2)}</td></tr>`;
  }
  formattedData += `</table>`;

  const emailParams = {
    to_email: "eilseven@ucp.pt",
    subject: "Simulation Results: E and O values",
    message: formattedData
  };

  emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", emailParams)
    .then(() => {
      alert("Simulation complete. Email sent!");
    })
    .catch((error) => {
      console.error("Email failed to send:", error);
    });
}

// Expose function globally
window.initSimulation = initSimulation;
