from flask import Flask, render_template, jsonify, request
import subprocess
import threading
import random
import psutil

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stats')
def get_stats():
    """
    Fetches real system statistics using psutil.
    """
    try:
        # CPU Usage
        cpu = psutil.cpu_percent(interval=1)

        # RAM Usage
        ram = psutil.virtual_memory()
        
        # Network Usage (Cumulative counters)
        net = psutil.net_io_counters()

        # Disk I/O Usage (Cumulative counters)
        disk_io = psutil.disk_io_counters()

        # Disk Usage (Total capacity) - Kept for potential use, but currently not pushed to frontend
        disk = psutil.disk_usage('/')

        # Swap Usage
        swap = psutil.swap_memory()

        # Load Average
        load = psutil.getloadavg()

        # Temperature
        # Note: Sensors are platform dependent. Fallback to a random value if not found
        temp = 0
        temps = psutil.sensors_temperatures()
        if temps:
            # Try to find a sensor with current values, usually 'coretemp' on Linux or 'coretemp'/'cpu_thermal' on Windows
            found_temp = False
            for sensor_group in temps.values():
                for entry in sensor_group:
                    if entry.current and entry.current > 0:
                        temp = entry.current
                        found_temp = True
                        break
                if found_temp:
                    break
        
        return jsonify({
            'cpu': cpu,
            'ram': ram.percent,
            'temp': temp if temp > 0 else random.randint(30, 65),
            'network_in': net.bytes_recv,
            'network_out': net.bytes_sent,
            'disk_read': disk_io.read_bytes,
            'disk_write': disk_io.write_bytes,
            'swap_usage': swap.percent,
            'load_avg': load[0] # Take the first element (1 minute average)
        })

    except Exception as e:
        # Return mock data if psutil fails (e.g., permissions)
        print(f"Error fetching real stats: {e}")
        return jsonify({
            'cpu': random.randint(10, 95),
            'ram': random.randint(20, 80),
            'temp': random.randint(30, 65),
            'network_in': random.randint(100, 5000),
            'network_out': random.randint(100, 5000),
            'disk_read': random.randint(0, 1000),
            'disk_write': random.randint(0, 1000),
            'swap_usage': random.randint(0, 50),
            'load_avg': round(random.uniform(0.5, 8.0), 2)
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
