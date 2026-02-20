from flask import Flask, render_template, jsonify, request
import random
import time

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
    return jsonify({
        'cpu': cpu,
        'ram': ram,
        'temp': temp,
        'network_in': random.randint(100, 5000),
        'network_out': random.randint(100, 5000)
    })

@app.route('/api/terminal', methods=['POST'])
def terminal_command():
    # Simulate processing a command
    data = request.json
    command = data.get('command', '').strip().lower()
    
    response = "Command not found."
    
    if command == 'help':
        response = "Available commands: status, clear, reboot, whoami, date"
    elif command == 'status':
        response = "System Operational. CPU: Nominal. Network: Secure."
    elif command == 'clear':
        response = ""  # Logic handled in frontend usually, but simulating here
    elif command == 'whoami':
        response = "root@system-core"
    elif command == 'date':
        response = time.strftime("%Y-%m-%d %H:%M:%S")
    elif command == 'reboot':
        response = "System rebooting in 3... 2... 1..."
    else:
        if command:
            response = f"Error: {command} is not a recognized command."
    
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
