// src/scripts/home-script.js
import { i18n } from '../core/i18n.js'

export const homeScript = {
  id: 'home-script',

  // ✅ 使用函数动态获取翻译
  get name() {
    return i18n.t().scripts.homeScript.name
  },

  get description() {
    return i18n.t().scripts.homeScript.description
  },

  routes: [
    { pattern: '/', mode: 'path' },
    { pattern: /forum\.php$/, mode: 'path' },
  ],

  // ✅ 配置项使用英文键名
  defaultConfig: {
    enableSignIn: true,
    enableLottery: true,
    enableClearNotifications: true,
  },

  // ✅ 获取配置项的显示名称
  getConfigLabel: (key) => {
    const t = i18n.t()
    return t.scripts.homeScript.configs[key] || key
  },

  signIn: () => {
    if (typeof window.cjdsign === 'function') {
      const originalSign = window.cjdsign
      window.cjdsign = () => {
        originalSign()
        if (typeof Mjq !== 'undefined') {
          Mjq.get('home.php?mod=space&do=notice&view=system&inajax=1')
          // 自动抽奖
          Mjq.get(
            'plugin.php?id=it618_award:ajax&ac=getaward&formhash=' +
              Mjq('[name=formhash]').val()
          )
        }
      }
    }

    // 自动点击签到按钮
    const signButton = document.querySelector('.JD_sign:not(.visted)')
    signButton?.click?.()

    // 清空消息通知
    if (document.querySelector('#pm_ntc.new')) {
      if (
        typeof setcookie === 'function' &&
        typeof noticeTitle === 'function'
      ) {
        setcookie('noticeTitle', 0)
        noticeTitle()
      }
    }

    // 处理提示信息
    const promptElement = document.querySelector('#u-prompt')
    if (promptElement && 'textContent' in promptElement) {
      const textValue = parseInt(promptElement.textContent || '0')

      if (textValue < 0 && typeof Mjq !== 'undefined') {
        Mjq.get(
          'home.php?mod=space&do=notice&view=interactive&type=sharenotice&inajax=1',
          () => location.reload()
        )
      }

      if (textValue > 0 && promptElement instanceof HTMLElement) {
        const myPrompt = document.querySelector('#myprompt')
        const menuLink = document.querySelector('#myprompt_menu a:has(.rq)')

        if (myPrompt && menuLink && 'href' in myPrompt) {
          myPrompt.href = promptElement.href = menuLink.href || ''
        }
      }
    }
  },

  lottery: () => {
    if (typeof Mjq === 'undefined') return

    const formhash = document.querySelector('[name=formhash]')?.value
    if (formhash) {
      Mjq.get(`plugin.php?id=it618_award:ajax&ac=getaward&formhash=${formhash}`)
    }
  },

  clearNotifications: () => {
    if (typeof Mjq === 'undefined') return

    Mjq.get('home.php?mod=space&do=notice&view=system&inajax=1')
  },

  setup: async (context) => {
    const t = i18n.t()
    console.log(`[${t.scripts.homeScript.name}] 🏠 已加载`, context.config)

    // 根据配置执行功能
    if (context.config.enableSignIn) {
      console.log(`[${t.scripts.homeScript.name}] ✓ 签到功能已启用`)
      homeScript.signIn()
    }

    if (context.config.enableLottery) {
      console.log(`[${t.scripts.homeScript.name}] ✓ 抽奖功能已启用`)
      homeScript.lottery()
    }

    if (context.config.enableClearNotifications) {
      console.log(`[${t.scripts.homeScript.name}] ✓ 清空通知已启用`)
      homeScript.clearNotifications()
    }
  },
}
