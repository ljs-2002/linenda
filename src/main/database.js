import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

class EventDatabase {
  constructor() {
    const dbPath = join(app.getPath('userData'), 'calendar.db')
    this.db = new Database(dbPath)
    this.init()
    this.initTagProps()
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

    const createTypeTagPropTable = `
      CREATE TABLE IF NOT EXISTS type_tag_props (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        color TEXT DEFAULT '#606266'
      )
    `
    this.db.exec(createTypeTagPropTable)

    const createUrgencyTagPropTable = `
      CREATE TABLE IF NOT EXISTS urgency_tag_props (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        color TEXT DEFAULT '#606266'
      )
    `
    this.db.exec(createUrgencyTagPropTable)

    const createEventUrgencyTagTabel = `
      CREATE TABLE IF NOT EXISTS event_urgency_tags (
        id TEXT PRIMARY KEY,
        urgency_tag_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (urgency_tag_id) REFERENCES urgency_tag_props(id) ON DELETE SET DEFAULT
      )
    `
    this.db.exec(createEventUrgencyTagTabel)

    const createEventTypeTagTabel = `
      CREATE TABLE IF NOT EXISTS event_type_tags (
        id TEXT NOT NULL,
        type_tag_id INTEGER NOT NULL,
        PRIMARY KEY (id, type_tag_id),
        FOREIGN KEY (id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (type_tag_id) REFERENCES type_tag_props(id) ON DELETE CASCADE
      )
    `
    this.db.exec(createEventTypeTagTabel)
  }

  initTagProps() {
    const insertDefaultTypeTags = `
      INSERT OR IGNORE INTO type_tag_props (id, tag_name, icon_name, color) VALUES
      (1, '项目', 'project-diagram', '#3498db'),
      (2, '学习', 'book', '#2ecc71'),
      (3, '学术', 'graduation-cap', '#9b59b6'),
      (4, '娱乐', 'gamepad', '#e74c3c')
    `
    this.db.exec(insertDefaultTypeTags)

    const insertDefaultUrgencyTags = `
      INSERT OR IGNORE INTO urgency_tag_props (id, tag_name, icon_name, color) VALUES 
      (1, '普通', 'circle-info', '#909399'),
      (2, '注意', 'circle-exclamation', '#E6A23C'),
      (3, '重要', 'triangle-exclamation', '#F56C6C')
    `
    this.db.exec(insertDefaultUrgencyTags)
  }

  //  #########################################
  //  事件信息相关操作
  //  #########################################

  getAllEvents() {
    const stmt = this.db.prepare('SELECT * FROM events')
    return stmt.all()
  }

  getEventsByDateRange(start, end) {
    // 动态调整 start 和 end 的格式
    const adjustDate = (date, end = false) => {
      if (date.length === 10) {
        // 如果是 yyyy-mm-dd 格式
        if (end) {
          const nextDay = new Date(date)
          nextDay.setDate(nextDay.getDate() + 1)
          const yyyy = nextDay.getFullYear()
          const mm = String(nextDay.getMonth() + 1).padStart(2, '0')
          const dd = String(nextDay.getDate()).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}T00:00:00+08:00`
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
        WHERE 
          (start >= @adjustedStart AND start < @adjustedEnd) OR
          (end > @adjustedStart AND end <= @adjustedEnd) OR
          (start <= @adjustedStart AND end >= @adjustedEnd)
    `)

    return stmt.all({ adjustedStart, adjustedEnd })
  }

  addEvent(event) {
    const eventWithDefaults = {
      ...event,
      url: event.url || '',
      description: event.description || ''
    }
    const insertEventStmt = this.db.prepare(`
      INSERT INTO events (id, title, start, end, allDay, url, description)
      VALUES (@id, @title, @start, @end, @allDay, @url, @description)
    `)
    const setUrgencyStmt = this.db.prepare(`
      INSERT INTO event_urgency_tags (id, urgency_tag_id)
      VALUES (?, ?)
    `)
    const setTypesStmt = this.db.prepare(`
      INSERT OR REPLACE INTO event_type_tags (id, type_tag_id)
      VALUES (?, ?)
    `)

    // 使用事务确保两个操作同时成功
    const transaction = this.db.transaction((event) => {
      insertEventStmt.run(eventWithDefaults)
      setUrgencyStmt.run(event.id, event.urgencyTagId)
      for (const tagId of event.typeTagIds) {
        setTypesStmt.run(event.id, tagId)
      }
    })

    return transaction(event)
  }

  updateEvent(event) {
    const eventWithDefaults = {
      ...event,
      url: event.url || '',
      description: event.description || ''
    }
    const updateEventStmt = this.db.prepare(`
      UPDATE events 
      SET title = @title, start = @start, end = @end, 
          allDay = @allDay, url = @url, description = @description
      WHERE id = @id
    `)
    const setUrgencyStmt = this.db.prepare(`
      INSERT OR REPLACE INTO event_urgency_tags (id, urgency_tag_id)
      VALUES (?, ?)
    `)
    const deleteTypeTagsStmt = this.db.prepare('DELETE FROM event_type_tags WHERE id = ?')
    const insertTypeTagStmt = this.db.prepare(
      'INSERT INTO event_type_tags (id, type_tag_id) VALUES (?, ?)'
    )

    const transaction = this.db.transaction((event) => {
      // 更新事件基本信息
      updateEventStmt.run(eventWithDefaults)

      // 更新紧急程度标签
      setUrgencyStmt.run(event.id, event.urgencyTagId)

      // 更新类型标签
      deleteTypeTagsStmt.run(event.id)
      for (const tagId of event.typeTagIds) {
        insertTypeTagStmt.run(event.id, tagId)
      }
    })

    return transaction(event)
  }

  deleteEvent(id) {
    const stmt = this.db.prepare('DELETE FROM events WHERE id = ?')
    return stmt.run(id)
  }

  //  #########################################
  //  事件标签相关操作
  //  #########################################

  getAllTypeTags() {
    const stmt = this.db.prepare('SELECT * FROM type_tag_props')
    return stmt.all()
  }

  getAllUrgencyTags() {
    const stmt = this.db.prepare('SELECT * FROM urgency_tag_props')
    return stmt.all()
  }

  getEventUrgencyTag(eventId) {
    const stmt = this.db.prepare(`
      SELECT u.* 
      FROM urgency_tag_props u
      JOIN event_urgency_tags e ON u.id = e.urgency_tag_id
      WHERE e.id = ?
    `)
    return stmt.get(eventId)
  }

  // 获取事件的类型标签
  getEventTypeTags(eventId) {
    const stmt = this.db.prepare(`
      SELECT t.* 
      FROM type_tag_props t
      JOIN event_type_tags e ON t.id = e.type_tag_id
      WHERE e.id = ?
    `)
    return stmt.all(eventId)
  }

  // 设置事件的紧急程度标签
  setEventUrgencyTag(eventId, urgencyTagId) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO event_urgency_tags (id, urgency_tag_id)
      VALUES (?, ?)
    `)
    return stmt.run(eventId, urgencyTagId)
  }

  getEventsTagsByIds(eventIds) {
    // 查询事件的紧急程度标签
    const urgencyTagsStmt = this.db.prepare(`
      SELECT e.id as event_id, u.* 
      FROM urgency_tag_props u
      JOIN event_urgency_tags e ON u.id = e.urgency_tag_id
      WHERE e.id IN (${eventIds.map(() => '?').join(',')})
    `)

    // 查询事件的类型标签
    const typeTagsStmt = this.db.prepare(`
      SELECT e.id as event_id, t.* 
      FROM type_tag_props t
      JOIN event_type_tags e ON t.id = e.type_tag_id
      WHERE e.id IN (${eventIds.map(() => '?').join(',')})
    `)

    // 执行查询并组织结果
    const urgencyTagsResult = urgencyTagsStmt.all(eventIds)
    const typeTagsResult = typeTagsStmt.all(eventIds)

    // 组织返回结果
    return eventIds.reduce((acc, eventId) => {
      acc[eventId] = {
        urgencyTag: urgencyTagsResult.find((tag) => tag.event_id === eventId),
        typeTags: typeTagsResult.filter((tag) => tag.event_id === eventId)
      }
      return acc
    }, {})
  }

  // 设置事件的类型标签
  setEventTypeTags(eventId, typeTagIds) {
    const deleteStmt = this.db.prepare('DELETE FROM event_type_tags WHERE id = ?')
    const insertStmt = this.db.prepare(
      'INSERT INTO event_type_tags (id, type_tag_id) VALUES (?, ?)'
    )

    const transaction = this.db.transaction((eventId, typeTagIds) => {
      deleteStmt.run(eventId)
      for (const tagId of typeTagIds) {
        insertStmt.run(eventId, tagId)
      }
    })

    return transaction(eventId, typeTagIds)
  }
}

export default new EventDatabase()
