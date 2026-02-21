import sqlite3
from flask import Flask, request, redirect, url_for, g

app = Flask(__name__)
DB = 'dev.db'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db:
        db.close()

def init_db():
    db = sqlite3.connect(DB)
    db.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL
    )''')
    db.commit()
    db.close()

@app.route('/')
def index():
    db = get_db()
    users = db.execute('SELECT * FROM users').fetchall()
    rows = ''.join(f'<tr><td>{u["id"]}</td><td>{u["name"]}</td><td>{u["email"]}</td></tr>' for u in users)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Users</title>
  <style>
    :root {{ --bg: #fff; --fg: #111; --border: #ccc; --th-bg: #f4f4f4; --btn-bg: #e0e0e0; }}
    body.dark {{ --bg: #1a1a1a; --fg: #eee; --border: #444; --th-bg: #2a2a2a; --btn-bg: #333; }}
    body {{ font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; background: var(--bg); color: var(--fg); }}
    input {{ margin: 0.25rem 0; padding: 0.4rem; width: 100%; box-sizing: border-box; background: var(--bg); color: var(--fg); border: 1px solid var(--border); }}
    button {{ margin-top: 0.5rem; padding: 0.4rem 1rem; background: var(--btn-bg); color: var(--fg); border: 1px solid var(--border); cursor: pointer; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 1.5rem; }}
    th, td {{ border: 1px solid var(--border); padding: 0.5rem; text-align: left; }}
    th {{ background: var(--th-bg); }}
    #toggle {{ float: right; }}
  </style>
</head>
<body>
  <h1>Users <button id="toggle" onclick="toggleTheme()">Dark mode</button></h1>
  <form method="POST" action="/add">
    <input name="name" placeholder="Name" required>
    <input name="email" type="email" placeholder="Email" required>
    <button type="submit">Add</button>
  </form>
  <table>
    <thead><tr><th>#</th><th>Name</th><th>Email</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>
  <script>
    const btn = document.getElementById('toggle');
    if (localStorage.getItem('theme') === 'dark') {{ document.body.classList.add('dark'); btn.textContent = 'Light mode'; }}
    function toggleTheme() {{
      const dark = document.body.classList.toggle('dark');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      btn.textContent = dark ? 'Light mode' : 'Dark mode';
    }}
  </script>
</body>
</html>'''

@app.route('/add', methods=['POST'])
def add():
    name = request.form['name']
    email = request.form['email']
    db = get_db()
    db.execute('INSERT INTO users (name, email) VALUES (?, ?)', (name, email))
    db.commit()
    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
