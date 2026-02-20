from flask import Flask, render_template, jsonify, request
import subprocess
import threading
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stats')
def get_stats():
    # Simulating system stats for the visualization
    cpu = random.randint(10, 95)
    ram = random.randint(20, 80)
    temp = random.randint(30, 65)
    net_in = random.randint(100, 5000)
    net_out = random.randint(100, 5000)
    disk = random.randint(10, 90)
    swap = random.randint(0, 50)
    load = round(random.uniform(0.5, 8.0), 2)
    return jsonify({
        'cpu': cpu,
        'ram': ram,
        'temp': temp,
        'network_in': net_in,
        'network_out': net_out,
        'disk_usage': disk,
        'swap_usage': swap,
        'load_avg': load
    })

def run_shell_command(cmd):
    """
    Executes a command in the real shell.
    Returns the combined stdout and stderr.
    """
    try:
        # Run command, capture output, use shell=True for bash interaction, timeout to prevent hanging
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return "Command timed out."
    except Exception as e:
        return f"Error executing command: {e}"

@app.route('/api/terminal', methods=['POST'])
def terminal_command():
    # Simulate processing a command
    data = request.json
    # Removed .lower() to allow real bash case sensitivity
    command = data.get('command', '').strip()
    
    response = ""
    
    if command == 'clear':
        response = "" # Handled by frontend usually
    else:
        response = run_shell_command(command)
    
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
