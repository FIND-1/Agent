import { useState, useEffect, useMemo } from 'react';
import { Todo, FilterType } from './types';

const STORAGE_KEY = 'react-todo-list';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const text = inputText.trim();
    if (!text) return;

    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos(prev => [newTodo, ...prev]);
    setInputText('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = () => {
    if (!editingId || !editingText.trim()) {
      setEditingId(null);
      setEditingText('');
      return;
    }

    setTodos(prev =>
      prev.map(todo =>
        todo.id === editingId ? { ...todo, text: editingText.trim() } : todo
      )
    );
    setEditingId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  };

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const activeCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.filter(todo => todo.completed).length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="app">
      <div className="todo-container">
        <header className="todo-header">
          <h1>Todo List</h1>
          <p>Keep track of your tasks</p>
        </header>

        <div className="todo-input-wrapper">
          <input
            type="text"
            className="todo-input"
            placeholder="What needs to be done?"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="add-button" onClick={addTodo}>
            Add
          </button>
        </div>

        <div className="todo-filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        <ul className="todo-list">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p>
                {filter === 'all'
                  ? 'No todos yet. Add one above!'
                  : filter === 'active'
                  ? 'No active todos'
                  : 'No completed todos'}
              </p>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <li
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''}`}
              >
                <div
                  className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                  onClick={() => toggleTodo(todo.id)}
                />
                {editingId === todo.id ? (
                  <input
                    type="text"
                    className="todo-text-input"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={saveEdit}
                    autoFocus
                  />
                ) : (
                  <span className="todo-text">{todo.text}</span>
                )}
                <div className="todo-actions">
                  {editingId !== todo.id && (
                    <button
                      className="edit-button"
                      onClick={() => startEditing(todo)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    className="delete-button"
                    onClick={() => deleteTodo(todo.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        {todos.length > 0 && (
          <div className="todo-stats">
            <span>
              {activeCount} {activeCount === 1 ? 'item' : 'items'} left
            </span>
            {completedCount > 0 && (
              <button className="clear-completed" onClick={clearCompleted}>
                Clear completed ({completedCount})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
