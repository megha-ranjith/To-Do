from flask import Flask, render_template, request, jsonify, redirect, url_for
from datetime import datetime
import json
import os
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-2025'

DATA_FILE = 'tasks_data.json'

# Helper function for category colors
def get_category_color(category):
    """Return color based on category"""
    colors = {
        'Work': '#3B82F6',
        'Personal': '#8B5CF6',
        'Shopping': '#EC4899',
        'Health': '#10B981',
        'General': '#6B7280'
    }
    return colors.get(category, '#6B7280')

# Register the function so Jinja2 templates can use it
app.jinja_env.globals.update(get_category_color=get_category_color)

def load_tasks():
    """Load all tasks from JSON file"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {
        'tasks': [],
        'settings': {'theme': 'dark'}
    }

def save_tasks(data):
    """Save tasks to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_task_stats(tasks):
    """Calculate dashboard statistics"""
    total = len(tasks)
    completed = len([t for t in tasks if t.get('completed', False)])
    open_tasks = total - completed
    
    overdue = 0
    if total > 0:
        for t in tasks:
            if t.get('due_date') and not t.get('completed'):
                try:
                    due = datetime.strptime(t['due_date'], '%Y-%m-%d')
                    if due < datetime.now():
                        overdue += 1
                except:
                    pass
    
    high_priority = len([t for t in tasks if t.get('priority') == 'high' and not t.get('completed')])
    completion_rate = round((completed / total * 100), 1) if total > 0 else 0
    
    return {
        'total': total,
        'completed': completed,
        'open': open_tasks,
        'overdue': overdue,
        'high_priority': high_priority,
        'completion_rate': completion_rate
    }

# ============== MAIN ROUTES ==============

@app.route('/')
def dashboard():
    """Dashboard - Main view"""
    data = load_tasks()
    tasks = data.get('tasks', [])
    stats = get_task_stats(tasks)
    return render_template('dashboard.html', 
                         stats=stats, 
                         tasks=tasks, 
                         active_tab='dashboard')

@app.route('/list')
def list_view():
    """List view - All tasks in table"""
    data = load_tasks()
    tasks = data.get('tasks', [])
    return render_template('list.html', 
                         tasks=tasks, 
                         active_tab='list')

@app.route('/kanban')
def kanban():
    """Kanban board - Drag and drop"""
    data = load_tasks()
    tasks = data.get('tasks', [])
    
    kanban_data = {
        'todo': [t for t in tasks if not t.get('completed')],
        'done': [t for t in tasks if t.get('completed')],
    }
    
    return render_template('kanban.html', 
                         kanban=kanban_data, 
                         active_tab='kanban')

@app.route('/calendar')
def calendar():
    """Calendar view - Tasks by date"""
    data = load_tasks()
    tasks = data.get('tasks', [])
    return render_template('calendar.html', 
                         tasks=tasks, 
                         active_tab='calendar')

# ============== API ENDPOINTS ==============

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks as JSON"""
    data = load_tasks()
    return jsonify(data['tasks'])

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create new task"""
    data = load_tasks()
    task_data = request.get_json()
    
    if not task_data.get('title'):
        return jsonify({'error': 'Title required'}), 400
    
    new_task = {
        'id': str(uuid.uuid4()),
        'title': task_data.get('title', ''),
        'description': task_data.get('description', ''),
        'category': task_data.get('category', 'General'),
        'priority': task_data.get('priority', 'medium'),
        'due_date': task_data.get('due_date', ''),
        'completed': False,
        'assigned_to': task_data.get('assigned_to', 'Me'),
        'created_at': datetime.now().isoformat()
    }
    
    data['tasks'].append(new_task)
    save_tasks(data)
    return jsonify(new_task), 201

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    data = load_tasks()
    task_data = request.get_json()
    
    for task in data['tasks']:
        if task['id'] == task_id:
            task.update(task_data)
            save_tasks(data)
            return jsonify(task), 200
    
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    data = load_tasks()
    data['tasks'] = [t for t in data['tasks'] if t['id'] != task_id]
    save_tasks(data)
    return jsonify({'success': True}), 200

@app.route('/api/tasks/<task_id>/toggle', methods=['POST'])
def toggle_task(task_id):
    """Mark task complete/incomplete"""
    data = load_tasks()
    
    for task in data['tasks']:
        if task['id'] == task_id:
            task['completed'] = not task.get('completed', False)
            save_tasks(data)
            return jsonify(task), 200
    
    return jsonify({'error': 'Task not found'}), 404

# ============== ERROR HANDLERS ==============

@app.errorhandler(404)
def not_found(error):
    return redirect(url_for('dashboard'))

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)