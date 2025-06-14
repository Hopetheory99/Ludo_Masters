// Task and Memory System for AI Agent (Frontend)
// Provides task tracking and context/memory management

class TaskManager {
  constructor() {
    this.tasks = [];
    this.nextId = 1;
  }

  addTask(description) {
    const task = {
      id: this.nextId++,
      description,
      status: 'todo',
      createdAt: new Date(),
      completedAt: null
    };
    this.tasks.push(task);
    return task;
  }

  completeTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task && task.status !== 'done') {
      task.status = 'done';
      task.completedAt = new Date();
    }
    return task;
  }

  listTasks(status = null) {
    if (status) {
      return this.tasks.filter(t => t.status === status);
    }
    return this.tasks;
  }
}

class MemorySystem {
  constructor(maxEntries = 20) {
    this.context = [];
    this.maxEntries = maxEntries;
  }

  addEntry(entry) {
    this.context.push({ entry, timestamp: new Date() });
    if (this.context.length > this.maxEntries) {
      this.context.shift(); // Remove oldest
    }
  }

  getContext() {
    return this.context;
  }

  clear() {
    this.context = [];
  }
}

// Example usage:
// const tasks = new TaskManager();
// tasks.addTask('Implement login page');
// tasks.completeTask(1);
// console.log(tasks.listTasks());
//
// const memory = new MemorySystem();
// memory.addEntry('User logged in');
// console.log(memory.getContext());

export { TaskManager, MemorySystem };
