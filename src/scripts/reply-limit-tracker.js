import { i18n } from '../core/i18n.js'

export const replyLimitTracker = {
  id: 'reply-limit-tracker',
  routes: [{ pattern: '/thread-*1.html', mode: 'path' }],

  get name() {
    const lang = i18n.getLanguage()
    return (
      {
        'zh-CN': '回帖限制追踪器',
        'en-US': 'Reply Limit Tracker',
        'ja-JP': '返信制限トラッカー',
      }[lang] || 'Reply Limit Tracker'
    )
  },

  get description() {
    const lang = i18n.getLanguage()
    return (
      {
        'zh-CN': '记录和提醒各个模块的回帖数量，防止超过限制',
        'en-US': 'Track and remind reply count for each module',
        'ja-JP': '各モジュールの返信数を追跡して通知',
      }[lang] || 'Track and remind reply count'
    )
  },

  defaultConfig: {
    enableTracker: true,
    enableNotification: true,
    showFloatingPanel: true,
    warningThreshold: 0.9, // 达到限制的 90% 时警告
  },

  getConfigLabel(key) {
    const lang = i18n.getLanguage()
    const labels = {
      'zh-CN': {
        enableTracker: '启用回帖追踪',
        enableNotification: '启用通知提醒',
        showFloatingPanel: '显示悬浮面板',
        warningThreshold: '警告阈值（0-1）',
      },
      'en-US': {
        enableTracker: 'Enable Tracker',
        enableNotification: 'Enable Notification',
        showFloatingPanel: 'Show Floating Panel',
        warningThreshold: 'Warning Threshold (0-1)',
      },
    }
    return labels[lang]?.[key] || key
  },

  // ✅ 回帖限制配置
  replyLimitConfig: {
    热门游戏: {
      上古卷轴: {
        limit: 40,
        天际SE重置版: {
          limit: 40,
        },
        天际和谐卷轴: {
          limit: 40,
        },
        天际问题求助: {
          limit: 40,
        },
      },
      赛博朋克2077: {
        limit: 40,
      },
      质量效应: {
        limit: 40,
      },
      星空: {
        limit: 40,
      },
      生化危机: {
        limit: 10,
        hours_limit: 10,
        continuous: 15,
      },
      辐射4: {
        limit: 40,
        辐射和谐专区: {
          limit: 40,
        },
        辐射旧作系列: {
          limit: 40,
        },
      },
    },
    更多游戏: {
      单机游戏: {
        limit: 40,
        和谐游戏: {
          limit: 40,
        },
        汉化游戏: {
          limit: 40,
        },
      },
      线上游戏: {
        limit: 40,
        移动端游: {
          limit: 40,
        },
      },
      博德之门: {
        limit: 40,
      },
      文字TRPG: {
        limit: 0,
      },
      '神界：原罪II': {
        limit: 40,
      },
      黑道圣徒II: {
        limit: 40,
      },
    },
    技术交流: {
      绘画创作: {
        limit: 40,
        continuous: 10,
      },
      CGAI: {
        limit: 40,
        continuous: 15,
      },
      和谐AI: {
        limit: 40,
        continuous: 15,
      },
      文学创作: {
        limit: 10,
        continuous: 5,
      },
      "C O D E": {
        limit: 10,
        hours_limit: true,
      },
    },
    影视专区: {
      影视讨论: {
        limit: 15,
        hours_limit: true,
        电影下载: {
          limit: 15,
          hours_limit: true,
        },
        回收站: {
          limit: 15,
          hours_limit: true,
        },
      },
    },
    其他休闲: {
      音乐交流: {
        limit: 40,
      },
      生活爆照: {
        limit: 40,
        continuous: 10,
      },
      动漫分享: {
        limit: 15,
      },
      和谐动漫: {
        limit: 40,
      },
      男色图影: {
        limit: 40,
        continuous: 10,
      },
      五花八门: {
        limit: 10,
        continuous: 10,
        hours_limit: true,
      },
    },
  },

  // 存储键
  STORAGE_KEY: 'reply_limit_tracker_data',

  // 数据结构
  data: {
    daily: {}, // 每日回帖记录
    continuous: {}, // 连续回帖记录
    hours24: {}, // 24小时回帖记录
    lastReset: null, // 上次重置时间
  },

  // ✅ 获取当前页面的模块路径
  getCurrentModulePath() {
    const texts = [...document.querySelectorAll('#pt a')].map((a) =>
      a.textContent.trim()
    )
    const subList = texts.slice(texts.indexOf('首页') + 1)
    subList.pop() // 移除最后一个（当前页面）
    return subList
  },

  // ✅ 根据路径查找配置
  findModuleConfig(modulePath) {
    let current = replyLimitTracker.replyLimitConfig
    let fullPath = []

    for (const module of modulePath) {
      fullPath.push(module)

      if (!current[module]) {
        return null
      }

      current = current[module]
    }

    // 返回最深层的配置
    return {
      config: current,
      path: fullPath.join(' > '),
    }
  },

  // ✅ 加载数据
  loadData() {
    try {
      const saved = GM_getValue(replyLimitTracker.STORAGE_KEY)
      if (saved) {
        replyLimitTracker.data = JSON.parse(saved)

        // 检查是否需要重置每日数据
        const lastReset = new Date(replyLimitTracker.data.lastReset)
        const now = new Date()

        if (!replyLimitTracker.isSameDay(lastReset, now)) {
          console.log('[回帖追踪] 重置每日数据')
          replyLimitTracker.data.daily = {}
          replyLimitTracker.data.lastReset = now.toISOString()
          replyLimitTracker.saveData()
        }
      } else {
        replyLimitTracker.data.lastReset = new Date().toISOString()
        replyLimitTracker.saveData()
      }
    } catch (error) {
      console.error('[回帖追踪] 加载数据失败:', error)
    }
  },

  // ✅ 保存数据
  saveData() {
    try {
      GM_setValue(
        replyLimitTracker.STORAGE_KEY,
        JSON.stringify(replyLimitTracker.data)
      )
    } catch (error) {
      console.error('[回帖追踪] 保存数据失败:', error)
    }
  },

  // ✅ 判断是否同一天
  isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  },

  // ✅ 记录回帖
  recordReply(modulePath) {
    const pathKey = modulePath.join(' > ')
    const now = Date.now()

    // 记录每日回帖
    if (!replyLimitTracker.data.daily[pathKey]) {
      replyLimitTracker.data.daily[pathKey] = []
    }
    replyLimitTracker.data.daily[pathKey].push(now)

    // 记录连续回帖
    if (!replyLimitTracker.data.continuous[pathKey]) {
      replyLimitTracker.data.continuous[pathKey] = []
    }
    replyLimitTracker.data.continuous[pathKey].push(now)

    // 记录24小时回帖
    if (!replyLimitTracker.data.hours24[pathKey]) {
      replyLimitTracker.data.hours24[pathKey] = []
    }
    replyLimitTracker.data.hours24[pathKey].push(now)

    // 清理24小时外的记录
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    replyLimitTracker.data.hours24[pathKey] = replyLimitTracker.data.hours24[
      pathKey
    ].filter((time) => time > oneDayAgo)

    replyLimitTracker.saveData()
  },

  // ✅ 获取当前模块的回帖统计
  getModuleStats(modulePath) {
    const pathKey = modulePath.join(' > ')
    const moduleConfig = replyLimitTracker.findModuleConfig(modulePath)

    if (!moduleConfig) {
      return null
    }

    const config = moduleConfig.config
    const dailyCount = (replyLimitTracker.data.daily[pathKey] || []).length
    const continuousCount = (replyLimitTracker.data.continuous[pathKey] || [])
      .length
    const hours24Count = (replyLimitTracker.data.hours24[pathKey] || []).length

    return {
      path: moduleConfig.path,
      config: config,
      daily: {
        count: dailyCount,
        limit: config.limit || 0,
        percentage: config.limit ? dailyCount / config.limit : 0,
      },
      continuous: {
        count: continuousCount,
        limit: config.continuous || 0,
        percentage: config.continuous ? continuousCount / config.continuous : 0,
      },
      hours24: {
        count: hours24Count,
        limit:
          config.hours_limit === true ? config.limit : config.hours_limit || 0,
        hasLimit: !!config.hours_limit,
        percentage: config.hours_limit
          ? hours24Count /
            (config.hours_limit === true ? config.limit : config.hours_limit)
          : 0,
      },
    }
  },

  // ✅ 检查是否超限
  checkLimit(stats) {
    const warnings = []
    const errors = []

    if (stats.config.limit) {
      if (stats.daily.count >= stats.daily.limit) {
        errors.push(`每日回帖已达上限 ${stats.daily.limit}`)
      } else if (stats.daily.percentage >= replyLimitTracker.warningThreshold) {
        warnings.push(
          `每日回帖接近上限 (${stats.daily.count}/${stats.daily.limit})`
        )
      }
    }

    if (stats.config.continuous) {
      if (stats.continuous.count >= stats.continuous.limit) {
        errors.push(`连续回帖已达上限 ${stats.continuous.limit}`)
      } else if (
        stats.continuous.percentage >= replyLimitTracker.warningThreshold
      ) {
        warnings.push(
          `连续回帖接近上限 (${stats.continuous.count}/${stats.continuous.limit})`
        )
      }
    }

    if (stats.hours24.hasLimit) {
      if (stats.hours24.count >= stats.hours24.limit) {
        errors.push(`24小时回帖已达上限 ${stats.hours24.limit}`)
      } else if (
        stats.hours24.percentage >= replyLimitTracker.warningThreshold
      ) {
        warnings.push(
          `24小时回帖接近上限 (${stats.hours24.count}/${stats.hours24.limit})`
        )
      }
    }

    return { warnings, errors }
  },

  // ✅ 显示通知
  showNotification(stats, warnings, errors) {
    const title = stats.path
    let message = ''

    if (errors.length > 0) {
      message = '❌ ' + errors.join('\n')
    } else if (warnings.length > 0) {
      message = '⚠️ ' + warnings.join('\n')
    }

    if (message) {
      // 使用自定义通知或浏览器通知
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        new Notification(title, {
          body: message,
          icon: '🕷️',
        })
      } else {
        alert(`${title}\n\n${message}`)
      }
    }
  },

  // ✅ 创建悬浮面板
  createFloatingPanel() {
    const panel = document.createElement('div')
    panel.id = 'reply-limit-panel'
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      max-height: 500px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color: white;
      z-index: 999998;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: all 0.3s ease;
    `

    panel.innerHTML = `
      <div style="padding: 16px; cursor: move;" id="panel-header">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
            📊 回帖统计
          </h3>
          <div style="display: flex; gap: 8px;">
            <button id="panel-minimize" style="
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            ">−</button>
            <button id="panel-close" style="
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            ">✕</button>
          </div>
        </div>
      </div>
            <div id="panel-content" style="
        padding: 0 16px 16px;
        max-height: 400px;
        overflow-y: auto;
      ">
        <div id="current-module-stats"></div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">
          <div style="font-size: 13px; opacity: 0.9; margin-bottom: 8px;">今日总览</div>
          <div id="all-modules-stats"></div>
        </div>
      </div>
    `

    document.body.appendChild(panel)

    // 拖拽功能
    replyLimitTracker.makeDraggable(panel)

    // 按钮事件
    document.getElementById('panel-minimize').addEventListener('click', () => {
      const content = document.getElementById('panel-content')
      if (content.style.display === 'none') {
        content.style.display = 'block'
        document.getElementById('panel-minimize').textContent = '−'
      } else {
        content.style.display = 'none'
        document.getElementById('panel-minimize').textContent = '+'
      }
    })

    document.getElementById('panel-close').addEventListener('click', () => {
      panel.remove()
    })

    return panel
  },

  // ✅ 使面板可拖拽
  makeDraggable(element) {
    const header = document.getElementById('panel-header')
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0

    header.onmousedown = dragMouseDown

    function dragMouseDown(e) {
      e.preventDefault()
      pos3 = e.clientX
      pos4 = e.clientY
      document.onmouseup = closeDragElement
      document.onmousemove = elementDrag
    }

    function elementDrag(e) {
      e.preventDefault()
      pos1 = pos3 - e.clientX
      pos2 = pos4 - e.clientY
      pos3 = e.clientX
      pos4 = e.clientY
      element.style.top = element.offsetTop - pos2 + 'px'
      element.style.left = element.offsetLeft - pos1 + 'px'
      element.style.bottom = 'auto'
      element.style.right = 'auto'
    }

    function closeDragElement() {
      document.onmouseup = null
      document.onmousemove = null
    }
  },

  // ✅ 更新面板内容
  updatePanel(stats) {
    const currentModuleDiv = document.getElementById('current-module-stats')
    if (!currentModuleDiv) return

    if (!stats) {
      currentModuleDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; opacity: 0.7;">
          <div style="font-size: 14px;">当前模块无限制配置</div>
        </div>
      `
      return
    }

    const { warnings, errors } = replyLimitTracker.checkLimit(stats)
    const hasIssues = warnings.length > 0 || errors.length > 0

    currentModuleDiv.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, ${hasIssues ? '0.15' : '0.1'});
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
      ">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">
          ${stats.path}
        </div>
        
        ${replyLimitTracker.renderStatBar('每日', stats.daily)}
        ${
          stats.config.continuous
            ? replyLimitTracker.renderStatBar('连续', stats.continuous)
            : ''
        }
        ${
          stats.hours24.hasLimit
            ? replyLimitTracker.renderStatBar('24h', stats.hours24)
            : ''
        }
        
        ${
          hasIssues
            ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">
            ${errors
              .map(
                (err) => `
              <div style="font-size: 12px; color: #ff6b6b; margin: 4px 0;">❌ ${err}</div>
            `
              )
              .join('')}
            ${warnings
              .map(
                (warn) => `
              <div style="font-size: 12px; color: #ffd93d; margin: 4px 0;">⚠️ ${warn}</div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    `

    // 更新所有模块统计
    replyLimitTracker.updateAllModulesStats()
  },

  // ✅ 渲染统计条
  renderStatBar(label, stat) {
    const percentage = Math.min(stat.percentage * 100, 100)
    const isWarning = percentage >= replyLimitTracker.warningThreshold * 100
    const isError = stat.count >= stat.limit

    let barColor = '#4ade80' // 绿色
    if (isError) {
      barColor = '#ff6b6b' // 红色
    } else if (isWarning) {
      barColor = '#ffd93d' // 黄色
    }

    return `
      <div style="margin: 6px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
          <span>${label}</span>
          <span>${stat.count}/${stat.limit}</span>
        </div>
        <div style="
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          height: 6px;
          overflow: hidden;
        ">
          <div style="
            background: ${barColor};
            height: 100%;
            width: ${percentage}%;
            transition: width 0.3s ease;
          "></div>
        </div>
      </div>
    `
  },

  // ✅ 更新所有模块统计
  updateAllModulesStats() {
    const allStatsDiv = document.getElementById('all-modules-stats')
    if (!allStatsDiv) return

    const modules = Object.keys(replyLimitTracker.data.daily)

    if (modules.length === 0) {
      allStatsDiv.innerHTML = `
        <div style="text-align: center; padding: 12px; opacity: 0.7; font-size: 12px;">
          今日暂无回帖记录
        </div>
      `
      return
    }

    const moduleStats = modules
      .map((pathKey) => {
        const path = pathKey.split(' > ')
        return replyLimitTracker.getModuleStats(path)
      })
      .filter((s) => s !== null)

    allStatsDiv.innerHTML = moduleStats
      .map(
        (stats) => `
      <div style="
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 8px;
        margin: 6px 0;
        font-size: 12px;
      ">
        <div style="font-weight: 600; margin-bottom: 4px; opacity: 0.9;">
          ${stats.path}
        </div>
        <div style="display: flex; gap: 12px; opacity: 0.8;">
          <span>📝 ${stats.daily.count}/${stats.daily.limit}</span>
          ${
            stats.config.continuous
              ? `<span>🔄 ${stats.continuous.count}/${stats.continuous.limit}</span>`
              : ''
          }
          ${
            stats.hours24.hasLimit
              ? `<span>⏰ ${stats.hours24.count}/${stats.hours24.limit}</span>`
              : ''
          }
        </div>
      </div>
    `
      )
      .join('')
  },

  // ✅ 检查回帖是否成功
  checkReplySuccess: (responseText) => {
    // 失败的标志
    const failurePatterns = [
      '已经回复过本帖',
      '您的回复过于频繁',
      '请稍后再试',
      '操作过于频繁',
      '回复失败',
      '权限不足',
      '帖子已关闭',
      '您没有权限',
      'post_reply_succeed', // 有时候这个也表示失败
      'CDATA[<font', // 错误信息通常包含这个
    ]

    // 成功的标志
    const successPatterns = [
      'viewthread', // 通常会跳转到帖子页面
      'pid=', // 返回的内容包含帖子 ID
      'post_reply_succeed', // 某些情况下是成功标志
    ]

    // 检查是否包含失败标志
    for (const pattern of failurePatterns) {
      if (responseText.includes(pattern)) {
        console.log(`[回帖追踪] 检测到失败标志: ${pattern}`)
        return false
      }
    }

    // 检查是否包含成功标志
    for (const pattern of successPatterns) {
      if (responseText.includes(pattern)) {
        // 但如果同时包含"已经回复"，仍然算失败
        if (responseText.includes('已经回复过本帖')) {
          return false
        }
        console.log(`[回帖追踪] 检测到成功标志: ${pattern}`)
        return true
      }
    }

    // 如果响应很短（可能是错误），认为失败
    if (responseText.length < 100) {
      console.log('[回帖追踪] 响应内容过短，可能失败')
      return false
    }

    // 默认认为成功（保守策略）
    console.log('[回帖追踪] 未检测到明确标志，默认认为成功')
    return true
  },

  // ✅ 监听回帖行为
  // src/scripts/reply-limit-tracker.js

  // ✅ 监听回帖行为 - 使用 MutationObserver
  detectReplyAction() {
    const self = this
    let isProcessing = false // 防止重复处理

    // 方法1: 监听快速回复按钮点击
    const checkButton = () => {
      const fastPostButton = document.getElementById('fastpostsubmit')
      if (fastPostButton && !fastPostButton.dataset.tracked) {
        fastPostButton.dataset.tracked = 'true'

        fastPostButton.addEventListener(
          'click',
          (e) => {
            const modulePath = this.getCurrentModulePath()
            if (modulePath.length === 0) return

            console.log('[回帖追踪] 快速回复按钮点击:', modulePath.join(' > '))

            // 预检查
            const stats = this.getModuleStats(modulePath)
            if (!stats) return

            const { warnings, errors } = this.checkLimit(stats)

            if (errors.length > 0) {
              const confirmMsg = [
                `⚠️ ${stats.path}`,
                '',
                ...errors,
                '',
                '确定要继续回帖吗？',
              ].join('\n')

              if (!confirm(confirmMsg)) {
                e.preventDefault()
                e.stopPropagation()
                return false
              }
            } else if (warnings.length > 0) {
              this.showWarningToast(warnings[0])
            }

            // ✅ 点击后立即开始监听回帖结果
            setTimeout(() => {
              self.observeReplySuccess()
            }, 100)
          },
          true
        )

        console.log('[回帖追踪] 已绑定快速回复按钮')
      }
    }

    // 立即检查
    checkButton()

    // 使用 MutationObserver 监听按钮出现
    const buttonObserver = new MutationObserver(() => {
      checkButton()
    })

    buttonObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    console.log('[回帖追踪] ✓ 回帖检测已启用')
  },

  // ✅ 新增：监听回帖成功（核心方法）
  observeReplySuccess() {
    if (this.replyObserver) {
      console.log('[回帖追踪] 已有监听器在运行')
      return
    }

    const targetNode = document.getElementById('append_parent')
    if (!targetNode) {
      console.warn('[回帖追踪] 未找到 #append_parent 元素')
      return
    }

    console.log('[回帖追踪] 开始监听回帖结果...')

    let isTriggered = false
    const self = this

    this.replyObserver = new MutationObserver((mutations) => {
      // 检查是否出现成功提示
      const creditPrompt = document.getElementById('creditpromptdiv')

      if (creditPrompt && !isTriggered) {
        isTriggered = true
        console.log('[回帖追踪] ✓ 检测到回帖成功 (#creditpromptdiv 已出现)')

        // 获取模块路径
        const modulePath = self.getCurrentModulePath()
        if (modulePath.length > 0) {
          // 记录回帖
          self.recordReply(modulePath)

          // 获取统计
          const stats = self.getModuleStats(modulePath)
          if (stats) {
            // 检查限制
            const { warnings, errors } = self.checkLimit(stats)

            // 更新面板
            if (
              self.floatingPanel &&
              document.body.contains(self.floatingPanel)
            ) {
              self.updatePanel(stats)
            }

            // 显示通知
            if (
              self.enableNotification &&
              (warnings.length > 0 || errors.length > 0)
            ) {
              // 延迟显示，避免与系统提示冲突
              setTimeout(() => {
                self.showNotification(stats, warnings, errors)
              }, 1000)
            }

            // 如果达到限制，显示醒目提示
            if (errors.length > 0) {
              setTimeout(() => {
                self.showLimitReachedAlert(stats, errors)
              }, 2000)
            }
          }
        }

        // 停止监听
        self.replyObserver.disconnect()
        self.replyObserver = null

        console.log('[回帖追踪] 监听器已断开')
      }
    })

    // 开始观察
    this.replyObserver.observe(targetNode, {
      childList: true,
      subtree: true,
    })

    // 8秒后自动断开（防止内存泄漏）
    setTimeout(() => {
      if (self.replyObserver) {
        console.log('[回帖追踪] 监听超时，自动断开')
        self.replyObserver.disconnect()
        self.replyObserver = null
      }
    }, 8000)
  },

  // ✅ 新增：达到限制时的醒目提示
  showLimitReachedAlert(stats, errors) {
    // 创建全屏遮罩提示
    const overlay = document.createElement('div')
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  `

    overlay.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
      padding: 40px;
      border-radius: 20px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: scaleIn 0.3s ease-out;
    ">
      <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
      <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px; font-weight: 700;">
        回帖限制已达上限
      </h2>
      <div style="color: white; font-size: 18px; margin-bottom: 10px; font-weight: 600;">
        ${stats.path}
      </div>
      ${errors
        .map(
          (err) => `
        <div style="
          color: white;
          font-size: 16px;
          margin: 10px 0;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        ">
          ${err}
        </div>
      `
        )
        .join('')}
      <button style="
        margin-top: 30px;
        padding: 12px 40px;
        background: white;
        color: #ee5a6f;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'" 
         onmouseout="this.style.transform='scale(1)'"
         onclick="this.parentElement.parentElement.remove()">
        我知道了
      </button>
    </div>
  `

    // 添加动画样式
    if (!document.getElementById('limit-alert-styles')) {
      const style = document.createElement('style')
      style.id = 'limit-alert-styles'
      style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from {
          transform: scale(0.8);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `
      document.head.appendChild(style)
    }

    document.body.appendChild(overlay)

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove()
      }
    })
  },

  // ✅ 显示简单的警告提示
  showWarningToast(message) {
    const toast = document.createElement('div')
    toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: rgba(245, 158, 11, 0.95);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    z-index: 1000001;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    animation: fadeInDown 0.3s ease-out;
  `

    toast.textContent = `⚠️ ${message}`

    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style')
      style.id = 'toast-styles'
      style.textContent = `
      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      @keyframes fadeOutUp {
        from {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
      }
    `
      document.head.appendChild(style)
    }

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'fadeOutUp 0.3s ease-out'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  },

  // ✅ 重置连续回帖计数
  resetContinuousCount(modulePath) {
    const pathKey = modulePath.join(' > ')
    replyLimitTracker.data.continuous[pathKey] = []
    replyLimitTracker.saveData()
  },

  // ✅ 导出数据（用于备份）
  exportData() {
    const dataStr = JSON.stringify(replyLimitTracker.data, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reply-limit-data-${new Date()
      .toISOString()
      .slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  // ✅ 导入数据（用于恢复）
  importData(jsonData) {
    try {
      const imported = JSON.parse(jsonData)
      replyLimitTracker.data = imported
      replyLimitTracker.saveData()
      console.log('[回帖追踪] 数据导入成功')
      return true
    } catch (error) {
      console.error('[回帖追踪] 数据导入失败:', error)
      return false
    }
  },

  // ✅ 添加快捷操作按钮到页面
  addQuickActions() {
    const modulePath = replyLimitTracker.getCurrentModulePath()
    if (modulePath.length === 0) return

    const stats = replyLimitTracker.getModuleStats(modulePath)
    if (!stats) return

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: white;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999997;
      font-size: 13px;
    `

    container.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; color: #333;">
        ${stats.path}
      </div>
      <div style="color: #666; margin-bottom: 8px;">
        今日: ${stats.daily.count}/${stats.daily.limit}
        ${
          stats.config.continuous
            ? `| 连续: ${stats.continuous.count}/${stats.continuous.limit}`
            : ''
        }
      </div>
      <button id="reset-continuous-btn" style="
        width: 100%;
        padding: 6px 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      ">重置连续计数</button>
    `

    document.body.appendChild(container)

    document
      .getElementById('reset-continuous-btn')
      .addEventListener('click', () => {
        if (confirm('确定要重置连续回帖计数吗？')) {
          replyLimitTracker.resetContinuousCount(modulePath)
          container.remove()
          location.reload()
        }
      })
  },

  // ✅ 主设置函数
  async setup(context) {
    console.log('[回帖追踪] 初始化...')

    replyLimitTracker.enableNotification = context.config.enableNotification
    replyLimitTracker.enableTracker = context.config.enableTracker
    replyLimitTracker.showFloatingPanel = context.config.showFloatingPanel
    replyLimitTracker.warningThreshold = context.config.warningThreshold

    if (!replyLimitTracker.enableTracker) {
      console.log('[回帖追踪] 追踪已禁用')
      return
    }

    // 请求通知权限
    if (
      replyLimitTracker.enableNotification &&
      typeof Notification !== 'undefined'
    ) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    }

    // 加载数据
    replyLimitTracker.loadData()

    // 获取当前模块
    const modulePath = replyLimitTracker.getCurrentModulePath()
    console.log('[回帖追踪] 当前模块:', modulePath.join(' > '))

    // 显示悬浮面板
    if (replyLimitTracker.showFloatingPanel) {
      replyLimitTracker.floatingPanel = replyLimitTracker.createFloatingPanel()

      if (modulePath.length > 0) {
        const stats = replyLimitTracker.getModuleStats(modulePath)
        replyLimitTracker.updatePanel(stats)
      } else {
        replyLimitTracker.updatePanel(null)
      }
    }

    // 监听回帖行为
    replyLimitTracker.detectReplyAction()

    // 添加快捷操作（可选）
    if (modulePath.length > 0) {
      // replyLimitTracker.addQuickActions();
    }

    // 注册全局命令
    if (typeof GM_registerMenuCommand !== 'undefined') {
      GM_registerMenuCommand('📊 查看回帖统计', () => {
        if (
          !replyLimitTracker.floatingPanel ||
          !document.body.contains(replyLimitTracker.floatingPanel)
        ) {
          replyLimitTracker.floatingPanel =
            replyLimitTracker.createFloatingPanel()
          const modulePath = replyLimitTracker.getCurrentModulePath()
          const stats = replyLimitTracker.getModuleStats(modulePath)
          replyLimitTracker.updatePanel(stats)
        }
      })

      GM_registerMenuCommand('💾 导出数据', () => {
        replyLimitTracker.exportData()
      })

      GM_registerMenuCommand('🔄 重置今日数据', () => {
        if (confirm('确定要重置今日所有回帖数据吗？')) {
          replyLimitTracker.data.daily = {}
          replyLimitTracker.data.lastReset = new Date().toISOString()
          replyLimitTracker.saveData()
          alert('今日数据已重置')
          location.reload()
        }
      })
    }

    console.log('[回帖追踪] ✓ 初始化完成')
  },

  // ✅ 清理函数
  cleanup() {
    console.log('[回帖追踪] 清理资源')

    if (
      replyLimitTracker.floatingPanel &&
      document.body.contains(replyLimitTracker.floatingPanel)
    ) {
      replyLimitTracker.floatingPanel.remove()
    }
  },
}
