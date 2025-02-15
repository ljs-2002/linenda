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
        url TEXT DEFAULT '',
        description TEXT DEFAULT ''
      )
    `
    this.db.exec(createTable)
    // const createTypeTagPropTable = `
    //   CREATE TABLE IF NOT EXISTS type_tag_props (
    //     type_tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     backgroundColor TEXT DEFAULT '',
    //     borderColor TEXT DEFAULT '',
    //     textColor TEXT DEFAULT '',
    //     className TEXT DEFAULT ''
    //   )
    // `
    // this.db.exec(createTypeTagPropTable)
    // const createUrgencyTagPropTable = `
    //   CREATE TABLE IF NOT EXISTS urgency_tag_props (
    //     urgency_tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     backgroundColor TEXT DEFAULT '',
    //     borderColor TEXT DEFAULT '',
    //     textColor TEXT DEFAULT '',
    //     className TEXT DEFAULT ''
    //   )
    // `
    // this.db.exec(createUrgencyTagPropTable)
    // const createTagTabel = `
    //   CREATE TABLE IF NOT EXISTS tags (
    //     id TEXT,
    //     type_tag_id INTEGER DEFAULT 1,
    //     urgency_tag_id INTEGER DEFAULT 1,
    //     PRIMARY KEY (id, tag_id, urgency_tag_id),
    //     FOREIGN KEY (id) REFERENCES events(id) ON DELETE CASCADE,
    //     FOREIGN KEY (tag_id) REFERENCES type_tag_props(tag_id) ON DELETE SET DEFAULT
    //     FOREIGN KEY (urgency_tag_id) REFERENCES urgency_tag_props(urgency_tag_id) ON DELETE SET DEFAULT
    //   )
    // `
    // this.db.exec(createTagTabel)
  }

  getAllEvents() {
    const stmt = this.db.prepare('SELECT * FROM events')
    return stmt.all()
  }

  getEventsByDateRange(start, end = false) {
    // 动态调整 start 和 end 的格式
    const adjustDate = (date, end) => {
      if (date.length === 10) {
        // 如果是 yyyy-mm-dd 格式
        if (end) {
          return `${date}T23:59:59+08:00` // 补充时间部分
        } else {
          return `${date}T00:00:00+08:00` // 补充时间部分
        }
      }
      return date // 否则直接使用
    }

    const adjustedStart = adjustDate(start)
    const adjustedEnd = adjustDate(end, true)
    const stmt = this.db.prepare(`
        SELECT * FROM events
        WHERE start >= @adjustedStart AND end <= @adjustedEnd
    `)

    return stmt.all({ adjustedStart, adjustedEnd })
  }

  addEvent(event) {
    const eventWithDefaults = {
      ...event,
      url: event.url || '',
      description: event.description || ''
    }
    const stmt = this.db.prepare(`
      INSERT INTO events (id, title, start, end, allDay, url, description)
      VALUES (@id, @title, @start, @end, @allDay, @url, @description)
    `)
    return stmt.run(eventWithDefaults)
  }

  updateEvent(event) {
    const eventWithDefaults = {
      ...event,
      url: event.url || '',
      description: event.description || ''
    }
    const stmt = this.db.prepare(`
      UPDATE events 
      SET title = @title, start = @start, end = @end, 
          allDay = @allDay, url = @url, description = @description
      WHERE id = @id
    `)
    return stmt.run(eventWithDefaults)
  }

  deleteEvent(id) {
    const stmt = this.db.prepare('DELETE FROM events WHERE id = ?')
    return stmt.run(id)
  }
}

export default new EventDatabase()
