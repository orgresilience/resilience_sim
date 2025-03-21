// Define and expose the simulation initialization function

function initSimulation() {
  // Initial states and simulation parameters
  let E = 5.0, O = 4.0;
  const k = 1;
  const alpha_0 = 0.1;
  const p_shock = 0.1;
  const shock_range = 2.0;
  
  // Arrays to store time steps and performance values
  let time_values = [0];
  let performance_history = [];
  
  // Function to update the simulation and redraw the graph
  function updateSimulation() {
    // Get slider values
    const mod_val = parseFloat(document.getElementById("modularity").value);
    const div_val = parseFloat(document.getElementById("diversification").value);
    const slack_val = parseFloat(document.getElementById("slack").value);
    
    // Possibly update the environment state (E) with a shock
    const shock_range_eff = shock_range * (2.2 - mod_val - div_val);
    if (Math.random() < p_shock * (1 - 0.1 * slack_val)) {
      const delta_E = Math.random() * shock_range_eff;
      E += delta_E;
    }
    
    // Compute adaptation rate and desired state
    const alpha_c = alpha_0 + 0.025 * Math.pow(mod_val, 2) - 0.025 * Math.pow(div_val, 2) + 0.01 * slack_val;
    const E_des = E * (1.1 - 0.1 * div_val - 0.1 * mod_val) - slack_val;
    if (alpha_c > 0) {
      O = O + alpha_c * (E_des - O);
    }
    
    // Compute performance using a sigmoid function
    const perf = 2 / (1 + Math.exp(-k * (O - E)));
    
    // Record the new time step and performance value
    const t_next = time_values[time_values.length - 1] + 1;
    time_values.push(t_next);
    performance_history.push(perf);
    
    // Plot the performance graph using Plotly
    const data = [{
      x: time_values.slice(1),  // skipping the initial 0 if desired
      y: performance_history,
      mode: 'lines+markers',
      name: 'Performance'
    }];
    
    const layout = {
      title: 'Performance Over Time',
      xaxis: { title: 'Time Steps' },
      yaxis: { title: 'Performance', range: [0, 2] }
    };
    
    Plotly.newPlot('graph', data, layout);
    
    // Update the status div with current simulation values
    const statusDiv = document.getElementById("status");
    if (statusDiv) {
      statusDiv.innerHTML = `<p>E: ${E.toFixed(2)}, O: ${O.toFixed(2)}, Performance: ${perf.toFixed(2)}</p>`;
    }
  }
  
  // Call once immediately so the graph shows up on page load
  updateSimulation();
  
  // Then update the simulation every 100 milliseconds
  setInterval(updateSimulation, 100);
}

// Expose the function globally so it can be called on page load
window.initSimulation = initSimulation;