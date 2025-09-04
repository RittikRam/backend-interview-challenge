import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';
import { Database } from '../db/database';

export class TaskService {
  constructor(private db: Database) {}

  async createTask(taskData: Partial<Task>): Promise<Task> {
    // TODO: Implement task creation
    // 1. Generate UUID for the task
    // 2. Set default values (completed: false, is_deleted: false)
    // 3. Set sync_status to 'pending'
    // 4. Insert into database
    // 5. Add to sync queue
    const id = uuidv4();
    const now  = new Date().toISOString();
    const task : Task  = {
      id,
      title: taskData.title || "Untitled",
      description: taskData.description || "Not Mentioned",
      completed: false,
      created_at: now,
      updated_at:now,
      is_deleted:false,
      sync_status:"pending",
      server_id:null,
      last_synced_at:null,
    };
    await this.db.run(
        `INSERT INTO tasks (
        id, title, description, completed, created_at, updated_at,
        is_deleted, sync_status, server_id, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
       [
         task.id,
        task.title,
        task.description,
        task.completed ? 1 : 0, // SQLite uses 0/1 for booleans
        task.created_at,
        task.updated_at,
        task.is_deleted ? 1 : 0,
        task.sync_status,
        task.server_id,
        task.last_synced_at,
       ]
    );
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    // TODO: Implement task update
    // 1. Check if task exists
    // 2. Update task in database
    // 3. Update updated_at timestamp
    // 4. Set sync_status to 'pending'
    // 5. Add to sync queue
    const existingTask = await this.getTask(id) ;
    if(!existingTask){
      return null;
    }
    const updatedTask: Task = {
        ...existingTask,
        ...updates,
        updated_at: new Date().toISOString(),
        sync_status:"pending",
    };
    await this.db.run(
    `UPDATE tasks SET 
      title = ?, 
      description = ?, 
      completed = ?, 
      updated_at = ?, 
      is_deleted = ?, 
      sync_status = ?
     WHERE id = ?`,
    [
      updatedTask.title,
      updatedTask.description,
      updatedTask.completed ? 1 : 0,
      updatedTask.updated_at,
      updatedTask.is_deleted ? 1 : 0,
      updatedTask.sync_status,
      updatedTask.id,
    ]
  );
  return updatedTask;
    
  }

  async deleteTask(id: string): Promise<boolean> {
    // TODO: Implement soft delete
    // 1. Check if task exists
    // 2. Set is_deleted to true
    // 3. Update updated_at timestamp
    // 4. Set sync_status to 'pending'
    // 5. Add to sync queue
    
    const existing = await this.getTask(id);
    if(!existing){
      return false;
    }
    await this.db.run(
      `UPDATE tasks 
       SET is_deleted = 1,
        sync_status = 'pending',
        updated_at = ?
        WHERE id = ?`,
        [new Date().toISOString(),id]
    );
    return true;
  }

  async getTask(id: string): Promise<Task | null> {
    // TODO: Implement get single task
    // 1. Query database for task by id
    // 2. Return null if not found or is_deleted is true
    const row = await this.db.get(
      `SELECT * FROM tasks WHERE id = ? AND is_deleted = 0`,[id]
    );
    if(!row){
      return null;
    }
    return {
       id: row.id,
    title: row.title,
    description: row.description,
    completed: !!row.completed,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_deleted: !!row.is_deleted,
    sync_status: row.sync_status,
    server_id: row.server_id,
    last_synced_at: row.last_synced_at
    };
    // throw new Error('Not implemented');
  }

  async getAllTasks(): Promise<Task[]> {
    // TODO: Implement get all non-deleted tasks
    // 1. Query database for all tasks where is_deleted = false
    // 2. Return array of tasks
    const rows = await this.db.all(
      `SELECT * FROM tasks WHERE is_deleted = 0`
    );
    const tasks : Task[] = rows.map((rows : any)=>({
      id:rows.id,
      title:rows.title,
      description:rows.description,
      completed:!!rows.completed,
      created_at:rows.created_at,
      updated_at:rows.updated_at,
      is_deleted: !!rows.is_deleted,
      sync_status: rows.sync_status,
      server_id:rows.server_id,
      last_synced_at: rows.last_synced_at,
    }));
    return tasks;
  }

  async getTasksNeedingSync(): Promise<Task[]> {
    // TODO: Get all tasks with sync_status = 'pending' or 'error'
    throw new Error('Not implemented');
  }
}