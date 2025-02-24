import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icons/icon.ico?asset'
import EventDatabase, { readConfig, saveConfig } from './database.js'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 750,
    height: 555,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff00', // 透明背景
      symbolColor: '#666666', // 按钮颜色
      height: 36 // 标题栏高度（仅Windows生效）
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  const eventDatabase = await EventDatabase.getInstance()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('get-all-events', async () => {
    return eventDatabase.getAllEvents()
  })

  ipcMain.handle('add-event', async (_, event) => {
    return eventDatabase.addEvent(event)
  })

  ipcMain.handle('update-event', async (_, event) => {
    return eventDatabase.updateEvent(event)
  })

  ipcMain.handle('delete-event', async (_, id) => {
    return eventDatabase.deleteEvent(id)
  })

  ipcMain.handle('get-events-by-date-range', async (_, start, end) => {
    return eventDatabase.getEventsByDateRange(start, end)
  })

  ipcMain.handle('get-all-urgency-tags', () => {
    return eventDatabase.getAllUrgencyTags()
  })

  ipcMain.handle('get-all-type-tags', () => {
    return eventDatabase.getAllTypeTags()
  })

  ipcMain.handle('get-event-tags', (_, eventId) => {
    return {
      urgencyTag: eventDatabase.getEventUrgencyTag(eventId),
      typeTags: eventDatabase.getEventTypeTags(eventId)
    }
  })

  ipcMain.handle('get-events-tags-by-ids', (_, eventIds) => {
    return eventDatabase.getEventsTagsByIds(eventIds)
  })

  ipcMain.handle('set-event-tags', (_, eventId, tags) => {
    eventDatabase.setEventUrgencyTag(eventId, tags.urgencyTagId)
    eventDatabase.setEventTypeTags(eventId, tags.typeTagIds)
  })

  ipcMain.handle('get-db-path', async () => {
    const config = await readConfig()
    return config.dbPath
  })

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] }
    }
    return { success: false }
  })

  ipcMain.handle('update-db-path', async (_, newPath) => {
    try {
      const config = await readConfig()
      const oldPath = config.dbPath
      const dbFileName = 'calendar.db'

      const oldDbPath = join(oldPath, dbFileName)
      const newDbPath = join(newPath, dbFileName)

      try {
        // 检查源文件是否存在
        await fs.access(oldDbPath)
        // 确保新目录存在
        await fs.mkdir(newPath, { recursive: true })

        // 关闭数据库连接
        if (eventDatabase.db) {
          eventDatabase.db.close()
        }

        try {
          // 复制文件到新位置
          await fs.copyFile(oldDbPath, newDbPath)

          // 更新配置
          config.dbPath = newPath
          await saveConfig(config)

          // 重新初始化数据库连接
          eventDatabase.reinitialize(newPath)

          // 成功更新配置和移动文件后，删除原文件
          try {
            await fs.unlink(oldDbPath)
          } catch (deleteError) {
            console.error('Failed to delete old database file:', deleteError)
            // 即使删除失败也继续执行，因为新的数据库位置已经设置成功
          }

          return { success: true }
        } catch (copyError) {
          // 如果复制失败，回滚操作
          console.error('Failed to copy database file:', copyError)
          return { success: false, error: '无法复制数据库文件' }
        }
      } catch (error) {
        // 如果源文件不存在，直接更新配置
        console.log('No existing database file to move')

        // 更新配置
        config.dbPath = newPath
        await saveConfig(config)

        // 重新初始化数据库连接
        eventDatabase.reinitialize(newPath)

        return { success: true }
      }
    } catch (error) {
      console.error('Failed to update database path:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-platform', () => process.platform)

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
