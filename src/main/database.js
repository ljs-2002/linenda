import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

class EventDatabase {
  constructor() {
    const dbPath = join(app.getPath('userData'), 'calendar.db')
    this.db = new Database(dbPath)
    this.init()
  }

  init() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        allDay INTEGER,
        url TEXT,
        description TEXT
      )
    `
    this.db.exec(createTable)
  }

  getAllEvents() {
    const stmt = this.db.prepare('SELECT * FROM events')
    return stmt.all()
  }

  addEvent(event) {
    const stmt = this.db.prepare(`
      INSERT INTO events (id, title, start, end, allDay, url, description)
      VALUES (@id, @title, @start, @end, @allDay, @url, @description)
    `)
    return stmt.run(event)
  }

  updateEvent(event) {
    const stmt = this.db.prepare(`
      UPDATE events 
      SET title = @title, start = @start, end = @end, 
          allDay = @allDay, url = @url, description = @description
      WHERE id = @id
    `)
    return stmt.run(event)
  }

  deleteEvent(id) {
    const stmt = this.db.prepare('DELETE FROM events WHERE id = ?')
    return stmt.run(id)
  }
}

export default new EventDatabase()
