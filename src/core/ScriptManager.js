/**
 * 脚本管理器
 */
import { EventEmitter } from './EventEmitter'
import { routeManager } from './RouteManager'


class ScriptManager {
  constructor() {
    this.scripts = new Map();
    this.registeredScripts = new Map(); // ✅ 新增：已注册的脚本
    this.activeScripts = new Map();
    this.eventBus = new EventEmitter();
  }

  // ✅ 新增：批量注册并过滤
  registerAll(scripts) {
    console.log(`[ScriptManager] 开始注册脚本，共 ${scripts.length} 个`)

    // 先将所有脚本添加到 scripts Map（用于配置面板显示）
    scripts.forEach((script) => {
      this.scripts.set(script.id, script)
    })

    // 只注册启用的脚本
    const enabledScripts = scripts.filter((script) => {
      const config = this.getConfig(script.id)
      return config.enabled
    })

    enabledScripts.forEach((script) => {
      this.registeredScripts.set(script.id, script)
      console.log(`[ScriptManager] ✓ 注册脚本: ${script.name}`)
    })

    const skippedCount = scripts.length - enabledScripts.length
    if (skippedCount > 0) {
      console.log(`[ScriptManager] ✗ 跳过 ${skippedCount} 个已禁用的脚本`)
    }

    console.log(
      `[ScriptManager] 注册完成，已启用 ${enabledScripts.length}/${scripts.length} 个脚本`
    )
  }

  register(script) {
    this.scripts.set(script.id, script)

    const config = this.getConfig(script.id)
    if (config.enabled) {
      this.registeredScripts.set(script.id, script)
      console.log(`[ScriptManager] 注册脚本: ${script.name}`)
    } else {
      console.log(`[ScriptManager] 跳过已禁用的脚本: ${script.name}`)
    }
  }

  // ✅ 修改：返回所有脚本（包括未启用的，用于配置面板）
  getAllScripts() {
    return this.scripts
  }

  // ✅ 新增：获取已注册的脚本
  getRegisteredScripts() {
    return this.registeredScripts
  }

  getConfig(scriptId) {
    const script = this.scripts.get(scriptId)
    const savedConfig = GM_getValue(
      `script_${scriptId}`,
      undefined
    )

    return {
      id: scriptId,
      name: script?.name || scriptId,
      enabled: savedConfig?.enabled ?? true,
      config: savedConfig?.config || script?.defaultConfig || {},
    }
  }

  saveConfig(scriptId, config) {
    const currentConfig = this.getConfig(scriptId)
    const newConfig = {
      enabled: config.enabled ?? currentConfig.enabled,
      config: config.config || currentConfig.config,
    }
    GM_setValue(`script_${scriptId}`, newConfig)
  }

  shouldRunOnCurrentRoute(script) {
    if (script.global) return true
    if (!script.routes || script.routes.length === 0) return true
    return script.routes.some((route) =>
      routeManager.matchRoute(route, location.href)
    )
  }

  async startScript(scriptId) {
    // ✅ 只从已注册的脚本中启动
    const script = this.registeredScripts.get(scriptId)
    if (!script) return

    const config = this.getConfig(scriptId)
    if (!config.enabled) return

    if (!this.shouldRunOnCurrentRoute(script)) return
    if (this.activeScripts.has(scriptId)) return

    console.log(`[ScriptManager] 启动脚本: ${script.name}`)

    const context = {
      config: config.config,
      emit: this.emit.bind(this),
      on: this.on.bind(this),
      off: this.off.bind(this),
    }

    try {
      await script.setup(context)
      this.activeScripts.set(scriptId, {
        cleanup: script.cleanup,
      })
    } catch (error) {
      console.error(`[ScriptManager] 脚本启动失败: ${script.name}`, error)
    }
  }

  stopScript(scriptId) {
    const active = this.activeScripts.get(scriptId)
    if (!active) return

    const script = this.registeredScripts.get(scriptId)
    console.log(`[ScriptManager] 停止脚本: ${script?.name}`)

    if (active.cleanup) {
      try {
        active.cleanup()
      } catch (error) {
        console.error(`[ScriptManager] 脚本清理失败: ${script?.name}`, error)
      }
    }

    this.activeScripts.delete(scriptId)
  }

  async onRouteChange(url) {
    console.log(`[ScriptManager] 路由变化: ${url}`)

    // ✅ 只处理已注册的脚本
    for (const [scriptId, script] of this.registeredScripts) {
      const shouldRun = this.shouldRunOnCurrentRoute(script)
      const isRunning = this.activeScripts.has(scriptId)

      if (shouldRun && !isRunning) {
        await this.startScript(scriptId)
      } else if (!shouldRun && isRunning) {
        this.stopScript(scriptId)
      }
    }
  }

  async initialize() {
    console.log('[ScriptManager] 初始化脚本系统')

    // ✅ 只初始化已注册的脚本
    for (const [scriptId] of this.registeredScripts) {
      await this.startScript(scriptId)
    }

    routeManager.onChange((url) => this.onRouteChange(url))
  }

  emit(event, data) {
    this.eventBus.emit(event, data)
  }

  on(event, handler) {
    this.eventBus.on(event, handler)
  }

  off(event, handler) {
    this.eventBus.off(event, handler)
  }
}

export const scriptManager = new ScriptManager()
