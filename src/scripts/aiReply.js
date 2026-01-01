// src/scripts/home-script.js
import { i18n } from '../core/i18n.js'

export const aiReply = {
  id: 'home-script',
  AI_API_KEY: '',
  BASE_URL: '',
  sysPrompt:
    '你是一个友好、业余的论坛用户，请针对以下帖子内容生成一条有价值、有见解的回复。回复应该：\n1. 简洁明了，15个字左右\n2. 观点鲜明，有自己的思考.\n3. 语气友好，符合论坛氛围\n4. 直接输出回复内容，不要包含"回复："等前缀\n\n',

  // ✅ 使用函数动态获取翻译
  get name() {
    return i18n.t().scripts.homeScript.name
  },

  get description() {
    return i18n.t().scripts.homeScript.description
  },

  routes: [{ pattern: '/thread-*1.html', mode: 'path' }],

  // ✅ 配置项使用英文键名
  defaultConfig: {},

  // ✅ 获取配置项的显示名称
  getConfigLabel: (key) => {
    const t = i18n.t()
    return t.scripts.aiReply.configs[key] || key
  },

  askAIStream: async (prompt, inputElement) => {
    return new Promise((resolve, reject) => {
      // 显示加载提示
      const originalValue = inputElement.value
      inputElement.value = '🤖 AI正在生成回复，请稍候...'

      GM_xmlhttpRequest({
        method: 'POST',
        url: `${aiReply.BASE_URL}/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiReply.AI_API_KEY}`,
        },
        data: JSON.stringify({
          model: 'qwen3-coder-plus',
          messages: [
            {
              role: 'user',
              content: aiReply.sysPrompt + prompt,
            },
          ],
          stream: false, // 不使用流式传输
        }),
        timeout: 60000, // 60秒超时

        onload: function (response) {
          console.log('API响应状态:', response.status)

          if (response.status === 200) {
            try {
              const result = JSON.parse(response.responseText)
              console.log('API返回结果:', result)

              const content = result.choices?.[0]?.message?.content

              if (content) {
                inputElement.value = content
                inputElement.dispatchEvent(
                  new Event('input', { bubbles: true })
                )
                inputElement.dispatchEvent(
                  new Event('change', { bubbles: true })
                )
                console.log('✅ 回复已填入，内容长度:', content.length)
                resolve(content)
              } else {
                throw new Error('API返回数据格式错误')
              }
            } catch (e) {
              console.error('解析响应失败:', e)
              console.error('原始响应:', response.responseText)
              inputElement.value = originalValue
              reject(new Error('解析响应失败: ' + e.message))
            }
          } else {
            console.error('HTTP错误:', response.status, response.statusText)
            console.error('错误详情:', response.responseText)
            inputElement.value = originalValue
            reject(new Error(`HTTP ${response.status}: ${response.statusText}`))
          }
        },

        onerror: function (response) {
          const error =
            '网络请求失败: ' +
            (response.error || response.statusText || '未知错误')
          console.error(error, response)
          inputElement.value = originalValue
          reject(new Error(error))
        },

        ontimeout: function () {
          console.error('请求超时')
          inputElement.value = originalValue
          reject(new Error('请求超时，请重试'))
        },
      })
    })
  },

  getTopicContent: () => {
    const element = document.querySelector('[id^="postmessage_"]')
    if (!element) {
      console.warn('未找到主题帖元素')
      return ''
    }
    return element.textContent.trim().replace(/\s+/g, ' ')
  },

  createAIReplyButton: () => {
    // 查找发表回复按钮
    const fastPostSubmit = document.getElementById('fastpostsubmit')

    if (!fastPostSubmit) {
      console.warn('未找到id="fastpostsubmit"的按钮')
      return
    }

    // 检查是否已经创建过按钮
    if (document.getElementById('ai-reply-button')) {
      return
    }

    // 创建AI回帖按钮
    const aiButton = document.createElement('button')
    aiButton.id = 'ai-reply-button'
    aiButton.type = 'button'
    aiButton.textContent = 'AI回帖'

    // 复制原按钮的样式
    const computedStyle = window.getComputedStyle(fastPostSubmit)
    aiButton.className = fastPostSubmit.className

    // 如果原按钮有内联样式，也复制过来
    if (fastPostSubmit.style.cssText) {
      aiButton.style.cssText = fastPostSubmit.style.cssText
    }

    // 添加一些额外的样式以区分
    aiButton.style.marginLeft = '10px'
    aiButton.style.background = '#52c41a'
    aiButton.style.borderColor = '#52c41a'

    // 查找回复文本框
    let replyInput = document.querySelector('#fastpostmessage')

    // 点击事件
    aiButton.onclick = async function () {
      // 提取页面内容
      const pageContent = aiReply.getTopicContent()

      if (!pageContent) {
        alert('未找到可提取的内容（class="t_fsz"）')
        return
      }

      // 禁用按钮，显示加载状态
      aiButton.disabled = true
      const originalText = aiButton.textContent
      aiButton.textContent = 'AI思考中...'
      aiButton.style.opacity = '0.6'

      try {
        // 构建提示词
        const prompt = `帖子内容：\n${pageContent}`

        console.log('prompt: ', prompt)

        // 清空输入框
        replyInput.value = ''

        // 调用API生成回复
        await aiReply.askAIStream(prompt, replyInput)

        // 聚焦到输入框
        replyInput.focus()
      } catch (error) {
        alert('AI回复生成失败：' + error.message)
      } finally {
        // 恢复按钮状态
        aiButton.disabled = false
        aiButton.textContent = originalText
        aiButton.style.opacity = '1'
      }
    }

    // 将按钮插入到发表回复按钮右侧
    fastPostSubmit.parentNode.insertBefore(aiButton, fastPostSubmit.nextSibling)

    console.log('AI回帖按钮已创建')
  },

  setup: async (context) => {
    const t = i18n.t()
    console.log(`[${t.scripts.aiReply.name}] 🏠 已加载`, context.config)

    // 创建一个"AI回帖"按钮
    aiReply.createAIReplyButton()
  },
}
