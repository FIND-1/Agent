import { useState, useEffect } from 'react'
import './App.css'

interface Todo {
  id: number
  text: string
  completed: boolean
}

type FilterType = 'all' | 'active' | 'completed'

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })
  const [inputValue, setInputValue] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (inputValue.trim() === '') return
    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false
    }
    setTodos([...todos, newTodo])
    setInputValue('')
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const toggleComplete = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id)
    setEditValue(todo.text)
  }

  const saveEdit = (id: number) => {
    if (editValue.trim() === '') {
      deleteTodo(id)
    } else {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, text: editValue.trim() } : todo
      ))
    }
    setEditingId(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  const handleEditKeyPress = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  return (
    <div className="app-container">
      <div className="todo-card">
        <h1>📝 Todo List</h1>
        
        <div className="input-section">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="添加新任务..."
            className="todo-input"
          />
          <button onClick={addTodo} className="add-btn">添加</button>
        </div>

        <div className="filter-section">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            进行中
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            已完成
          </button>
        </div>

        <ul className="todo-list">
          {filteredTodos.length === 0 ? (
            <li className="empty-message">暂无任务</li>
          ) : (
            filteredTodos.map(todo => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                {editingId === todo.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleEditKeyPress(e, todo.id)}
                    onBlur={() => saveEdit(todo.id)}
                    className="edit-input"
                    autoFocus
                  />
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleComplete(todo.id)}
                      className="checkbox"
                    />
                    <span className="todo-text" onDoubleClick={() => startEditing(todo)}>
                      {todo.text}
                    </span>
                    <div className="action-buttons">
                      <button
                        onClick={() => startEditing(todo)}
                        className="edit-btn"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="delete-btn"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>

        <div className="stats">
          <span>总任务: {todos.length}</span>
          <span>进行中: {todos.filter(t => !t.completed).length}</span>
          <span>已完成: {todos.filter(t => t.completed).length}</span>
        </div>
      </div>
    </div>
  )
}

export default App
