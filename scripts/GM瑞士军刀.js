// ==UserScript==
// @name         GM瑞士军刀
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  手搓整合大脚本
// @author       熊赳赳
// @match        https://www.gamemale.com/*
// @run-at       document-end
// ==/UserScript==

;(function () {
  'use strict'
  /**
   * 配置项汇总
   */

  // const 勋章计算的回帖、主题权重设置
  const 发帖权重 = {
    回帖: 1,
    主题: 30,
  }
  // 属性权重设置
  const 收益权重映射 = {
    金币: 1,
    血液: 1,
    旅程: 30,
    咒术: 5,
    知识: 50,
    灵魂: 1000,
    堕落: 0, // 堕落不计入总消耗
  }

  // 勋章一页面显示的加载时长影响勋章放大镜和勋章博物馆脚本，这里根据网速设置后两者延时加载的时间，默认3秒
  const lazyTimeout = 3000

  // 回帖插件
  const replyMaxEnabled = true //是否启用上限判断 （30次）
  const checked = false //是否默认勾选“回帖后自动关闭页面”

  // 勋章放大镜是否显示图片true or false，默认true显示
  const showImg = true

  /**
   * 脚本部分
   */
  // 当前路由
  const currentUrl = window.location.href
  // 我的勋章
  const myMedalRegex =
    /^https:\/\/www\.gamemale\.com\/.*wodexunzhang.*action=my$/
  // Home页正则
  const homeRegex = /^https:\/\/www\.gamemale\.com\/(forum\.php)?$/
  const medalRegex =
    /^https:\/\/www\.gamemale\.com\/wodexunzhang-showxunzhang\.html*/
  const medalRegexEx =
    /^https:\/\/www\.gamemale\.com\/plugin\.php\?id=wodexunzhang*/
  // 勋章商城正则
  const medalShopRegex =
    /^https:\/\/www\.gamemale\.com\/wodexunzhang-showxunzhang\.html$/
  // 勋章二手市场正则
  const medalMarketRegex =
    /^https:\/\/www\.gamemale\.com\/wodexunzhang-showxunzhang\.html\?action=showjishou/

  // 合理避税正则
  const exchangeRegex =
    /^https:\/\/www\.gamemale\.com\/home\.php\?mod=spacecp&ac=credit&op=exchange$/

  const forumGuideRegex =
    /^https:\/\/www\.gamemale\.com\/forum\.php\?mod=guide*/
  const forumRegex = /^.*:\/\/.*\.gamemale\.com\/forum-/
  const forumDisplayRegex =
    /^https:\/\/www\.gamemale\.com\/forum\.php\?mod=forumdisplay/

  const postRegex = /^https:\/\/www\.gamemale\.com\/forum\.php\?mod=viewthread*/
  const postInsideRegex = /^https:\/\/www\.gamemale\.com\/thread*/

  if (homeRegex.test(currentUrl)) {
    console.log('偷偷签到,抽奖,清空奇怪的提醒')
    if (typeof cjdsign == 'function') {
      let arosdaisuki = cjdsign
      cjdsign = () => {
        arosdaisuki()
        Mjq.get('home.php?mod=space&do=notice&view=system&inajax=1')
        //取消下一行开头的注释标记“//”，可在签到后自动抽奖
        Mjq.get(
          'plugin.php?id=it618_award:ajax&ac=getaward&formhash=' +
            Mjq('[name=formhash]').val()
        )
      }
    }
    //取消下一行开头的注释标记“//”，可在访问首页时自动签到
    document.querySelector('.JD_sign:not(.visted)')?.click()
    if (document.querySelector('#pm_ntc.new')) {
      setcookie('noticeTitle', 0)
      noticeTitle()
    }
    let $arossukisuki = document.querySelector('#u-prompt')
    if ($arossukisuki?.text < 0) {
      Mjq.get(
        'home.php?mod=space&do=notice&view=interactive&type=sharenotice&inajax=1',
        location.reload()
      )
    }
    if ($arossukisuki?.text > 0) {
      Mjq('#myprompt').get(0).href = $arossukisuki.href = Mjq(
        '#myprompt_menu a:has(.rq)'
      ).get(0)?.href
    }
    console.log('一键每日')
    /**
     * part: 首页，加载一键每日脚本
     */
    let uid = [730713, 62445, 61832] //此处更改访问空间时使用的uid
    let spaceCount = 0 //访问空间
    let sayHiCount = 0 // 打招呼
    let stanceCount = 0 //表态数
    let page = 1 //日志页码

    // 每日联动
    let tasksData = JSON.parse(localStorage.getItem('tasksData'))

    var updateTasksData = (date) => {
      if (tasksData) {
        tasksData[date] += 1
        localStorage.setItem('tasksData', JSON.stringify(tasksData))
      }
    }

    const style = document.querySelector('style')
    style.innerHTML += `
    #app {
      padding: 20px;
    }
    #app button{
      padding: 20px;
      background-image: url(https://s2.loli.net/2024/09/09/VWFXEa4hcuPvJQH.jpg);
      background-size: 50px 50px;
      width: 50px;
      height: 50px;
      border: none;
      border-radius: 20%;
    }
    #app p {
      line-height: 30px;
      color:white;
      }
    #message{
      top: 0;
      position: fixed;
      height: 100%;
      width: 100%;
      z-index: 999;
      display: none;
      align-items: center;
      justify-content: space-around;
      background-color: rgba(0, 0, 0, 0.7);.
    }
    #message ul{
      color: white;
      font-size: 30px;
      width:500px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    #message ul li{
      border: 2px solid #818181;
      background: #c1c1c1;
      border-radius: 30px;
      overflow: hidden;
      height: 30px;
      width: 100%;
      margin: 10px 0;
    }
    #message ul li div{
      background: #42B350;
      width: 0%;
      height: 28px;
      border-radius: 30px;
    }
    #message ul li span{
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      line-height: 26px;
      font-size: 20px;
    }
    #sure {
      font-size: 26px;
      text-align: center;
      width: 20%;
      background: #65A2FF;
      margin-top: 20px;
      border: 2px solid #A5C9FF;
      border-radius: 7px;
      cursor: pointer;
    }
    `
    document.head.appendChild(style)

    const app = document.createElement('ul')
    app.id = 'app'
    app.innerHTML = `
    <li>
      <button id='DailyButton'></button>
      <p>一键每日</p>
    </li>`

    const message = document.createElement('div')
    message.id = 'message'
    message.innerHTML = `
    <ul>
      <span>开始运行</span>
      <li>
        <div id='space'>
          <span>0/3</span>
        </div>
      </li>
      <li>
        <div id='sayHello'>
          <span>0/3</span>
        </div>
      </li>
      <li>
        <div id='stance'>
          <span>0/10</span>
        </div>
      </li>
      <div id='sure'>退出<div>
    </ul>
    `
    document.body.appendChild(message)
    const sure = message.querySelector('#sure')
    sure.addEventListener('click', () => {
      message.style.display = 'none'
      location.reload()
    })

    // 检测
    const validate = () => {
      const txt = message.querySelector('span')
      if (spaceCount < 3) {
        txt.innerHTML = '正在访问空间'
      } else if (sayHiCount < 3) {
        txt.innerHTML = '正在打招呼'
      } else if (stanceCount < 10) {
        txt.innerHTML = '正在震惊'
      } else {
        txt.innerHTML = '完成'
        sure.innerHTML = '确认'
      }
    }

    //进度条
    const updateProgressBar = (id, currentValue, maxValue) => {
      const bar = message.querySelector(`#${id}`)
      const count = bar.querySelector('span')
      const percentage = (currentValue / maxValue) * 100
      bar.style.width = `${percentage}%`
      count.innerHTML = `${currentValue}/${maxValue}`
      validate()
    }

    const DailyButton = app.querySelector('#DailyButton')
    DailyButton.addEventListener('click', async () => {
      const confirmStart = confirm('确定要开始每日任务吗？')
      if (confirmStart) {
        message.style.display = 'flex'
        await space(uid)
        await sayHello(uid)
        await stance(
          `https://www.gamemale.com/home.php?mod=space&do=blog&view=all&catid=14&page=${page}`
        )
      }
    })

    const parser = new DOMParser()
    // 访问空间
    async function space(uid) {
      for (const item of uid) {
        await fetch(`https://www.gamemale.com/space-uid-${item}.html`)
        spaceCount += 1
        updateTasksData('userSpace')
        updateProgressBar('space', spaceCount, 3)
      }
    }

    // 打招呼

    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }

    async function sayHello(uid) {
      for (const item of uid) {
        showWindow(
          item,
          `https://www.gamemale.com/home.php?mod=spacecp&ac=poke&op=send&uid=${item}&handlekey=propokehk_${item}`,
          'get',
          0
        )
        let doc = null

        while (true) {
          doc = document.querySelector(`#fwin_${item} button`)
          if (doc) break
          await delay(100)
        }
        await delay(1000)
        doc.click()
        sayHiCount += 1
        updateTasksData('sayHello')
        updateProgressBar('sayHello', sayHiCount, 3)
      }
    }

    // 表态
    async function stance(url) {
      const response = await fetch(url)
      const htmlCode = await response.text()
      const doc = parser.parseFromString(htmlCode, 'text/html')
      const a = doc.querySelectorAll('dl.bbda dt a')
      for (const item of a) {
        const response = await fetch(item.href)
        const htmlCode = await response.text()
        const doc = parser.parseFromString(htmlCode, 'text/html')
        const a = doc.querySelector('#click_div a')

        if (a) {
          const response = await fetch(a.href)
          const htmlCode = await response.text()
          const doc = parser.parseFromString(htmlCode, 'text/html')
          if (
            doc
              .querySelector('.nfl')
              .textContent.replace(/\n/g, '')
              .replace(/\s/g, '') == '表态成功'
          ) {
            stanceCount += 1
            updateTasksData('stance')
            updateProgressBar('stance', stanceCount, 10)
          }
          if (stanceCount >= 10) break
        }
      }

      if (stanceCount < 10) {
        page += 1
        stance(
          `https://www.gamemale.com/home.php?mod=space&do=blog&view=all&catid=14&page=${page}`
        )
      }
    }

    console.log('加载一键每日')

    const wp_user = document.querySelector('#wp_user')
    wp_user.appendChild(app)
  }
  if (medalShopRegex.test(currentUrl)) {
    console.log('勋章商城一页')
    /**
     * part: 勋章商城，加载勋章一页面显示脚本
     */
    let allCategories = []
    let isControlPanelFixed = true

    function init() {
      const categoryNav = document.querySelector('.myfenleilist')
      if (!categoryNav) return

      allCategories = extractCategories()
      if (allCategories.length === 0) return

      createAllInOnePage()
      removeOriginalElements()

      loadAllCategories()
    }

    function extractCategories() {
      const categories = []
      const navLinks = document.querySelectorAll('.myfenleilist a')

      navLinks.forEach((link) => {
        const title = link.title || link.textContent.replace(/\d+$/, '').trim()
        const href = link.href
        const count = link.querySelector('.myfenleicount')?.textContent || '0'

        categories.push({
          title: title,
          href: href,
          count: count,
          id:
            href.split('fid=')[1]?.split('&')[0] || title.replace(/\s+/g, '_'),
        })
      })

      return categories
    }

    function createAllInOnePage() {
      const container = document.createElement('div')
      container.id = 'all-medals-container'
      container.style.cssText = `
            margin: 20px 0;
            font-family: Arial, sans-serif;
        `

      const existingContent = document.querySelector('form[id="medalid_f"]')
      if (existingContent) {
        existingContent.parentNode.insertBefore(container, existingContent)
        existingContent.remove()
      } else {
        const mainContent =
          document.querySelector('.main-content, .wp, #wp, .container') ||
          document.body
        mainContent.insertBefore(container, mainContent.firstChild)
      }

      createControlPanel(container)
      createContentArea(container)
    }

    function removeOriginalElements() {
      const categoryNav = document.querySelector('.myfenleilist')
      if (!categoryNav) return

      const categoryNavParent = categoryNav.parentNode
      if (
        categoryNavParent &&
        (categoryNavParent.classList.contains('block') ||
          categoryNavParent.classList.contains('area') ||
          categoryNavParent.classList.contains('nav') ||
          categoryNavParent.id.includes('nav'))
      ) {
        categoryNavParent.remove()
      } else {
        categoryNav.remove()
      }

      const originalForms = document.querySelectorAll('form[id="medalid_f"]')
      originalForms.forEach((form) => {
        if (!form.closest('#all-medals-container')) {
          form.remove()
        }
      })

      const categoryTitles = document.querySelectorAll('.my_biaoti')
      categoryTitles.forEach((title) => {
        if (!title.closest('#all-medals-container')) {
          title.remove()
        }
      })
    }

    function createControlPanel(container) {
      const controlPanel = document.createElement('div')
      controlPanel.id = 'medal-control-panel'

      const savedFixedState = GM_getValue('controlPanelFixed', true)
      isControlPanelFixed = savedFixedState

      controlPanel.style.cssText = `
            position: ${isControlPanelFixed ? 'sticky' : 'static'};
            top: 0;
            background: white;
            padding: 15px;
            border-bottom: 2px solid #4CAF50;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 10px;
        `

      const headerRow = document.createElement('div')
      headerRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        `

      const title = document.createElement('h2')
      title.textContent = '勋章商店 - 全部分类'
      title.style.cssText = `
            margin: 0;
            color: #333;
            font-size: 20px;
        `

      const toggleFixedBtn = document.createElement('button')
      toggleFixedBtn.textContent = isControlPanelFixed ? '取消固定' : '固定菜单'
      toggleFixedBtn.style.cssText = `
            padding: 8px 16px;
            background: ${isControlPanelFixed ? '#ff9800' : '#2196F3'};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `
      toggleFixedBtn.addEventListener('click', toggleControlPanelFixed)

      headerRow.appendChild(title)
      headerRow.appendChild(toggleFixedBtn)

      const sortControls = document.createElement('div')
      sortControls.style.cssText = `
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 15px;
            justify-content: center;
            flex-wrap: wrap;
        `

      const sortBtn = document.createElement('button')
      sortBtn.textContent = '自定义排序'
      sortBtn.style.cssText = `
            padding: 8px 16px;
            background: #ff9800;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
        `

      const resetSortBtn = document.createElement('button')
      resetSortBtn.textContent = '恢复默认'
      resetSortBtn.style.cssText = `
            padding: 8px 16px;
            background: #9e9e9e;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
            display: none;
        `

      let isSorting = false

      sortBtn.addEventListener('click', function () {
        if (!isSorting) {
          enableCustomSort()
          this.textContent = '完成排序'
          this.style.background = '#4CAF50'
          resetSortBtn.style.display = 'inline-block'
          isSorting = true
        } else {
          applyCustomSortOrder()
          this.textContent = '自定义排序'
          this.style.background = '#ff9800'
          resetSortBtn.style.display = 'none'
          isSorting = false
        }
      })

      resetSortBtn.addEventListener('click', function () {
        resetToDefaultOrder()
        sortBtn.textContent = '自定义排序'
        sortBtn.style.background = '#ff9800'
        this.style.display = 'none'
        isSorting = false
      })

      sortControls.appendChild(sortBtn)
      sortControls.appendChild(resetSortBtn)

      const toggleWrapper = document.createElement('div')
      toggleWrapper.id = 'category-toggle-wrapper'
      toggleWrapper.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            align-items: center;
            max-height: 150px;
            overflow-y: auto;
            padding: 8px;
            transition: all 0.3s ease;
        `

      const savedStates = GM_getValue('categoryStates', {})
      const savedOrder = GM_getValue('categoryOrder', null)

      let categoriesToDisplay = [...allCategories]
      if (savedOrder && Array.isArray(savedOrder)) {
        categoriesToDisplay.sort((a, b) => {
          const aIndex = savedOrder.indexOf(a.id)
          const bIndex = savedOrder.indexOf(b.id)
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
      }

      categoriesToDisplay.forEach((category, index) => {
        const toggleItem = createToggleItem(category, savedStates)
        toggleWrapper.appendChild(toggleItem)
      })

      const actionButtons = document.createElement('div')
      actionButtons.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: center;
            align-items: center;
            margin-top: 12px;
        `

      const showAllBtn = document.createElement('button')
      showAllBtn.textContent = '显示全部'
      showAllBtn.style.cssText = `
            padding: 6px 12px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        `
      showAllBtn.addEventListener('click', showAllCategories)

      const hideAllBtn = document.createElement('button')
      hideAllBtn.textContent = '隐藏全部'
      hideAllBtn.style.cssText = `
            padding: 6px 12px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        `
      hideAllBtn.addEventListener('click', hideAllCategories)

      actionButtons.appendChild(showAllBtn)
      actionButtons.appendChild(hideAllBtn)

      controlPanel.appendChild(headerRow)
      controlPanel.appendChild(sortControls)
      controlPanel.appendChild(toggleWrapper)
      controlPanel.appendChild(actionButtons)
      container.appendChild(controlPanel)
    }

    function createToggleItem(category, savedStates) {
      const toggleItem = document.createElement('div')
      toggleItem.className = 'category-toggle-item'
      toggleItem.dataset.categoryId = category.id
      toggleItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: #f5f5f5;
            border-radius: 16px;
            border: 1px solid #ddd;
            transition: all 0.3s ease;
            user-select: none;
        `

      const dragHandle = document.createElement('div')
      dragHandle.className = 'drag-handle'
      dragHandle.innerHTML = '⋮⋮'
      dragHandle.style.cssText = `
            cursor: grab;
            color: #666;
            font-size: 12px;
            padding: 2px;
            display: none;
            transition: all 0.3s ease;
        `

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = savedStates[category.id] !== false
      checkbox.id = `toggle-${category.id}`
      checkbox.style.cssText = `
            width: 14px;
            height: 14px;
            cursor: pointer;
            pointer-events: auto;
        `

      const label = document.createElement('label')
      label.htmlFor = `toggle-${category.id}`
      label.textContent = `${category.title} (${category.count})`
      label.style.cssText = `
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
            color: #333;
            white-space: nowrap;
            pointer-events: auto;
        `

      checkbox.addEventListener('change', function () {
        const categoryElement = document.getElementById(
          `category-${category.id}`
        )
        if (categoryElement) {
          categoryElement.style.display = this.checked ? 'block' : 'none'
        }

        const savedStates = GM_getValue('categoryStates', {})
        savedStates[category.id] = this.checked
        GM_setValue('categoryStates', savedStates)
      })

      toggleItem.appendChild(dragHandle)
      toggleItem.appendChild(checkbox)
      toggleItem.appendChild(label)

      return toggleItem
    }

    function enableCustomSort() {
      const toggleWrapper = document.getElementById('category-toggle-wrapper')
      const toggleItems = Array.from(
        toggleWrapper.querySelectorAll('.category-toggle-item')
      )
      const dragHandles = Array.from(
        toggleWrapper.querySelectorAll('.drag-handle')
      )

      toggleWrapper.style.background =
        'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'
      toggleWrapper.style.border = '2px dashed #ffc107'
      toggleWrapper.style.padding = '12px'

      dragHandles.forEach((handle) => {
        handle.style.display = 'block'
      })

      let dragSrcEl = null

      function handleDragStart(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') {
          e.preventDefault()
          return
        }

        dragSrcEl = this

        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', this.dataset.categoryId)

        this.style.opacity = '0.6'
        this.style.transform = 'scale(1.02) rotate(2deg)'
        this.style.background =
          'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
        this.style.borderColor = '#2196F3'
        this.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)'
        this.style.zIndex = '1000'

        const checkbox = this.querySelector('input[type="checkbox"]')
        const label = this.querySelector('label')
        if (checkbox) checkbox.style.pointerEvents = 'none'
        if (label) label.style.pointerEvents = 'none'
      }

      function handleDragOver(e) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'

        const rect = this.getBoundingClientRect()
        const verticalMiddle = rect.top + rect.height / 2

        if (e.clientY < verticalMiddle) {
          this.style.borderTop = '3px solid #4CAF50'
          this.style.borderBottom = 'none'
        } else {
          this.style.borderBottom = '3px solid #4CAF50'
          this.style.borderTop = 'none'
        }

        return false
      }

      function handleDragEnter(e) {
        if (this !== dragSrcEl) {
          this.style.background =
            'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
          this.style.borderColor = '#4CAF50'
          this.style.transform = 'scale(1.05)'
        }
      }

      function handleDragLeave(e) {
        if (this !== dragSrcEl) {
          this.style.background = '#f5f5f5'
          this.style.borderColor = '#ddd'
          this.style.transform = 'scale(1)'
          this.style.borderTop = '1px solid #ddd'
          this.style.borderBottom = '1px solid #ddd'
        }
      }

      function handleDrop(e) {
        e.preventDefault()
        e.stopPropagation()

        if (dragSrcEl !== this) {
          const allItems = Array.from(
            toggleWrapper.querySelectorAll('.category-toggle-item')
          )
          const thisIndex = allItems.indexOf(this)
          const draggedIndex = allItems.indexOf(dragSrcEl)

          const rect = this.getBoundingClientRect()
          const verticalMiddle = rect.top + rect.height / 2

          if (e.clientY < verticalMiddle) {
            if (draggedIndex > thisIndex) {
              toggleWrapper.insertBefore(dragSrcEl, this)
            } else {
              toggleWrapper.insertBefore(dragSrcEl, this)
            }
          } else {
            if (draggedIndex < thisIndex) {
              toggleWrapper.insertBefore(dragSrcEl, this.nextSibling)
            } else {
              toggleWrapper.insertBefore(dragSrcEl, this.nextSibling)
            }
          }
        }

        return false
      }

      function handleDragEnd(e) {
        toggleItems.forEach((item) => {
          item.style.opacity = '1'
          item.style.transform = 'scale(1)'
          item.style.background = '#f5f5f5'
          item.style.borderColor = '#ddd'
          item.style.boxShadow = 'none'
          item.style.zIndex = 'auto'
          item.style.borderTop = '1px solid #ddd'
          item.style.borderBottom = '1px solid #ddd'

          const checkbox = item.querySelector('input[type="checkbox"]')
          const label = item.querySelector('label')
          if (checkbox) checkbox.style.pointerEvents = 'auto'
          if (label) label.style.pointerEvents = 'auto'
        })
      }

      function addDnDHandlers(item) {
        item.addEventListener('dragstart', handleDragStart, false)
        item.addEventListener('dragenter', handleDragEnter, false)
        item.addEventListener('dragover', handleDragOver, false)
        item.addEventListener('dragleave', handleDragLeave, false)
        item.addEventListener('drop', handleDrop, false)
        item.addEventListener('dragend', handleDragEnd, false)
        item.draggable = true

        item.addEventListener('mousedown', function (e) {
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
            e.preventDefault()
          }
        })
      }

      toggleItems.forEach(addDnDHandlers)
    }

    function applyCustomSortOrder() {
      const toggleWrapper = document.getElementById('category-toggle-wrapper')
      const toggleItems = Array.from(
        toggleWrapper.querySelectorAll('.category-toggle-item')
      )
      const contentArea = document.getElementById('medals-content-area')
      const dragHandles = Array.from(
        toggleWrapper.querySelectorAll('.drag-handle')
      )

      const customOrder = toggleItems.map((item) => item.dataset.categoryId)

      GM_setValue('categoryOrder', customOrder)

      const categorySections = Array.from(
        contentArea.querySelectorAll('.category-section')
      )

      categorySections.sort((a, b) => {
        const aId = a.id.replace('category-', '')
        const bId = b.id.replace('category-', '')
        const aIndex = customOrder.indexOf(aId)
        const bIndex = customOrder.indexOf(bId)
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })

      contentArea.innerHTML = ''
      categorySections.forEach((section) => {
        contentArea.appendChild(section)
      })

      toggleWrapper.style.background = ''
      toggleWrapper.style.border = ''
      toggleWrapper.style.padding = '8px'
      dragHandles.forEach((handle) => {
        handle.style.display = 'none'
      })

      const allItems = Array.from(
        toggleWrapper.querySelectorAll('.category-toggle-item')
      )
      allItems.forEach((item) => {
        item.draggable = false
        item.style.background = '#f5f5f5'
        item.style.borderColor = '#ddd'
        item.style.opacity = '1'
        item.style.transform = 'scale(1)'
        item.style.boxShadow = 'none'
        item.removeEventListener('dragstart', null)
        item.removeEventListener('dragenter', null)
        item.removeEventListener('dragover', null)
        item.removeEventListener('dragleave', null)
        item.removeEventListener('drop', null)
        item.removeEventListener('dragend', null)
      })
    }

    function resetToDefaultOrder() {
      const toggleWrapper = document.getElementById('category-toggle-wrapper')
      const contentArea = document.getElementById('medals-content-area')

      GM_setValue('categoryOrder', null)

      toggleWrapper.innerHTML = ''
      const savedStates = GM_getValue('categoryStates', {})

      allCategories.forEach((category) => {
        const toggleItem = createToggleItem(category, savedStates)
        toggleWrapper.appendChild(toggleItem)
      })

      const categorySections = Array.from(
        contentArea.querySelectorAll('.category-section')
      )

      categorySections.sort((a, b) => {
        const aId = a.id.replace('category-', '')
        const bId = b.id.replace('category-', '')
        const aIndex = allCategories.findIndex((cat) => cat.id === aId)
        const bIndex = allCategories.findIndex((cat) => cat.id === bId)
        return aIndex - bIndex
      })

      contentArea.innerHTML = ''
      categorySections.forEach((section) => {
        contentArea.appendChild(section)
      })

      toggleWrapper.style.background = ''
      toggleWrapper.style.border = ''
      toggleWrapper.style.padding = '8px'
    }

    function toggleControlPanelFixed() {
      const controlPanel = document.getElementById('medal-control-panel')
      const toggleBtn = controlPanel.querySelector('button')

      if (isControlPanelFixed) {
        controlPanel.style.position = 'static'
        toggleBtn.textContent = '固定菜单'
        toggleBtn.style.background = '#2196F3'
        isControlPanelFixed = false
      } else {
        controlPanel.style.position = 'sticky'
        toggleBtn.textContent = '取消固定'
        toggleBtn.style.background = '#ff9800'
        isControlPanelFixed = true
      }

      GM_setValue('controlPanelFixed', isControlPanelFixed)
    }

    function createContentArea(container) {
      const contentArea = document.createElement('div')
      contentArea.id = 'medals-content-area'
      contentArea.style.cssText = `
            padding: 5px;
        `

      container.appendChild(contentArea)
    }

    function loadAllCategories() {
      const contentArea = document.getElementById('medals-content-area')
      const savedStates = GM_getValue('categoryStates', {})
      const savedOrder = GM_getValue('categoryOrder', null)

      let categoriesToLoad = [...allCategories]
      if (savedOrder && Array.isArray(savedOrder)) {
        categoriesToLoad.sort((a, b) => {
          const aIndex = savedOrder.indexOf(a.id)
          const bIndex = savedOrder.indexOf(b.id)
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
      }

      categoriesToLoad.forEach((category) => {
        const categorySection = document.createElement('div')
        categorySection.id = `category-${category.id}`
        categorySection.className = 'category-section'
        categorySection.style.cssText = `
                margin-bottom: 2px;
                display: ${
                  savedStates[category.id] !== false ? 'block' : 'none'
                };
            `

        const loadingDiv = document.createElement('div')
        loadingDiv.className = 'loading-placeholder'
        loadingDiv.innerHTML = `
                <div style="text-align: center; padding: 10px; color: #666;">
                    <div>正在加载 ${category.title}...</div>
                </div>
            `
        categorySection.appendChild(loadingDiv)

        contentArea.appendChild(categorySection)

        loadCategoryContent(category, categorySection)
      })
    }

    function loadCategoryContent(category, container) {
      fetch(category.href)
        .then((response) => response.text())
        .then((html) => {
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')

          const medalForms = doc.querySelectorAll('form[id="medalid_f"]')
          let medalContent = null

          if (medalForms.length > 0) {
            const originalForm = medalForms[0]
            medalContent = originalForm.cloneNode(true)

            const formhash = medalContent.querySelector(
              'input[name="formhash"]'
            )
            if (!formhash || !formhash.value) {
              const originalFormhash = document.querySelector(
                'input[name="formhash"]'
              )?.value
              if (originalFormhash && formhash) {
                formhash.value = originalFormhash
              }
            }

            const medalContainer = medalContent.querySelector('.myfldiv')
            if (medalContainer) {
              medalContainer.style.cssText = `
                            display: flex;
                            flex-wrap: wrap;
                            gap: 5px;
                            padding: 5px;
                            margin: 0;
                        `
            }

            const categoryTitle = medalContent.querySelector('.my_biaoti')
            if (categoryTitle) {
              categoryTitle.remove()
            }

            const myFenlei = medalContent.querySelector('.my_fenlei')
            if (myFenlei) {
              myFenlei.style.marginBottom = '0'
              myFenlei.style.padding = '0'
            }
          } else {
            medalContent = document.createElement('div')
            medalContent.innerHTML =
              '<div style="text-align: center; padding: 10px; color: #666;">此分类中没有找到勋章</div>'
          }

          const loadingDiv = container.querySelector('.loading-placeholder')
          if (loadingDiv) {
            loadingDiv.remove()
          }

          container.appendChild(medalContent)
        })
        .catch((error) => {
          console.error('加载分类时出错:', error)
          const loadingDiv = container.querySelector('.loading-placeholder')
          if (loadingDiv) {
            loadingDiv.innerHTML = `
                        <div style="text-align: center; padding: 10px; color: #ff4444;">
                            加载失败
                        </div>
                    `
          }
        })
    }

    function showAllCategories() {
      allCategories.forEach((category) => {
        const checkbox = document.getElementById(`toggle-${category.id}`)
        const categoryElement = document.getElementById(
          `category-${category.id}`
        )
        if (checkbox && categoryElement) {
          checkbox.checked = true
          categoryElement.style.display = 'block'
        }
      })

      const savedStates = {}
      allCategories.forEach((category) => {
        savedStates[category.id] = true
      })
      GM_setValue('categoryStates', savedStates)
    }

    function hideAllCategories() {
      allCategories.forEach((category) => {
        const checkbox = document.getElementById(`toggle-${category.id}`)
        const categoryElement = document.getElementById(
          `category-${category.id}`
        )
        if (checkbox && categoryElement) {
          checkbox.checked = false
          categoryElement.style.display = 'none'
        }
      })

      const savedStates = {}
      allCategories.forEach((category) => {
        savedStates[category.id] = false
      })
      GM_setValue('categoryStates', savedStates)
    }

    const style = document.createElement('style')
    style.textContent = `
        #all-medals-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .category-section {
            transition: all 0.2s ease;
        }

        .myblok {
            transition: all 0.2s ease !important;
        }

        .myblok:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }

        .category-toggle-item[draggable=true] {
            cursor: grab;
            user-select: none;
        }

        .category-toggle-item:active[draggable=true] {
            cursor: grabbing;
        }

        .drag-handle {
            user-select: none;
            transform: rotate(90deg);
        }

        .drag-handle:hover {
            color: #2196F3;
        }

        @media (max-width: 768px) {
            #all-medals-container .myblok {
                width: 140px !important;
            }
        }

        @media (max-width: 480px) {
            #all-medals-container .myblok {
                width: 120px !important;
            }

            #medals-content-area {
                padding: 2px !important;
            }
        }
    `

    document.head.appendChild(style)
    init()
    //if (document.readyState === 'loading') {
    //  document.addEventListener('DOMContentLoaded', init);
    //    } else {
    //        setTimeout(init, 1000);
    //    }
  }
  if (medalMarketRegex.test(currentUrl)) {
    console.log('二手市场')
    /**
     * part: 二手市场
     */
    let originalMedalsVisible = GM_getValue('medalsHidden', true)

    function findMarketTitle() {
      const titles = document.querySelectorAll('.my_biaoti')
      for (let title of titles) {
        if (title.textContent.includes('二手市场')) {
          return title
        }
      }
      return null
    }

    function extractPriceAndSeller(tipDiv) {
      let price = Infinity
      let seller = '未知'
      let itemId = null

      const priceElements = tipDiv.querySelectorAll('.jiage')
      priceElements.forEach((element) => {
        const text = element.textContent || element.innerText

        if (text.includes('寄售用户')) {
          const sellerMatch = text.match(/(.+?)寄售用户/)
          if (sellerMatch) {
            seller = sellerMatch[1].trim()
          }
        }

        if (text.includes('金币')) {
          const priceMatch = text.match(/金币\s*(\d+)/)
          if (priceMatch) {
            const itemPrice = parseInt(priceMatch[1])
            if (itemPrice < price) {
              price = itemPrice
            }
          }
        }
      })

      const button = tipDiv
        .closest('.myblok')
        .querySelector('button[onclick*="goumaijishou"]')
      if (button) {
        const onclick = button.getAttribute('onclick')
        const idMatch = onclick.match(/goumaijishou',(\d+)/)
        if (idMatch) {
          itemId = idMatch[1]
        }
      }

      return { price, seller, itemId }
    }

    function createPurchaseHandler(itemId) {
      return function () {
        const button = document.querySelector(
          `button[onclick*="goumaijishou',${itemId}"]`
        )
        if (button) {
          button.click()
        } else {
          alert('未找到对应的购买按钮')
        }
      }
    }

    function toggleOriginalList() {
      const allMedalContainers = document.querySelectorAll('.myblok, .myfldiv')
      const toggleButton = document.getElementById('toggle-original-list')

      // 切换状态
      originalMedalsVisible = !originalMedalsVisible

      // 应用显示/隐藏
      allMedalContainers.forEach((container) => {
        container.style.display = originalMedalsVisible ? 'none' : ''
      })

      // 更新按钮文字
      toggleButton.textContent = originalMedalsVisible
        ? '显示原始列表'
        : '隐藏原始列表'

      // 保存状态
      GM_setValue('medalsHidden', originalMedalsVisible)
    }

    function applyInitialHideState() {
      if (originalMedalsVisible) {
        const allMedalContainers =
          document.querySelectorAll('.myblok, .myfldiv')
        allMedalContainers.forEach((container) => {
          container.style.display = 'none'
        })
      }
    }

    function main() {
      const titleDiv = findMarketTitle()
      if (!titleDiv) return

      // 先应用初始隐藏状态
      applyInitialHideState()

      const medals = {}
      const blocks = document.querySelectorAll('.myblok')

      blocks.forEach((blok) => {
        const img = blok.querySelector('.myimg img')
        if (!img) return

        const name = img.alt.trim()
        const src = img.src
        const tipDiv = blok.querySelector('.mytip')

        if (!name || !tipDiv) return

        const { price, seller, itemId } = extractPriceAndSeller(tipDiv)

        if (!medals[name]) {
          medals[name] = {
            count: 1,
            src: src,
            minPrice: price,
            seller: seller,
            itemId: itemId,
            prices: [price],
          }
        } else {
          medals[name].count++
          if (price < medals[name].minPrice) {
            medals[name].minPrice = price
            medals[name].seller = seller
            medals[name].itemId = itemId
          }
          medals[name].prices.push(price)
        }
      })

      const statsDiv = document.createElement('div')
      statsDiv.id = 'medal-price-stats'
      statsDiv.style.cssText = `
            padding: 15px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            margin: 10px 0;
            border-radius: 5px;
            font-size: 14px;
        `

      const sortedMedals = Object.entries(medals).sort(
        (a, b) => b[1].count - a[1].count
      )

      // 创建购买处理函数映射
      const purchaseHandlers = {}
      Object.entries(medals).forEach(([name, data]) => {
        if (data.itemId) {
          purchaseHandlers[data.itemId] = createPurchaseHandler(data.itemId)
        }
      })

      statsDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="font-size:18px; font-weight:bold; color:#333;">
                    勋章寄售统计（共 ${blocks.length} 个勋章，${
        Object.keys(medals).length
      } 种）
                </div>
                <button id="toggle-original-list"
                    style="
                        background: ${
                          originalMedalsVisible ? '#28a745' : '#6c757d'
                        };
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                    ${originalMedalsVisible ? '显示原始列表' : '隐藏原始列表'}
                </button>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${sortedMedals
                  .map(
                    ([name, data]) => `
                    <div style="
                        background: white;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        padding: 10px;
                        width: 220px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    ">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <img src="${data.src}"
                                 alt="${name}"
                                 style="width: 40px; height: 40px; object-fit: cover; border-radius: 3px;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; font-size: 12px; line-height: 1.2;" title="${name}">
                                    ${
                                      name.length > 12
                                        ? name.substring(0, 10) + '...'
                                        : name
                                    }
                                </div>
                                <div style="color: #666; font-size: 11px;">数量: ${
                                  data.count
                                }</div>
                            </div>
                        </div>
                        <div style="border-top: 1px solid #eee; padding-top: 8px;">
                            <div style="color: #e74c3c; font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                                ${
                                  data.minPrice !== Infinity
                                    ? data.minPrice + ' 金币'
                                    : '无售价'
                                }
                            </div>
                            <div style="color: #666; font-size: 11px; margin-bottom: 8px;">
                                ${
                                  data.seller !== '未知'
                                    ? '卖家: ' + data.seller
                                    : ''
                                }
                            </div>
                            ${
                              data.itemId && data.minPrice !== Infinity
                                ? `
                                <button type="button" class="purchase-btn" data-item-id="${data.itemId}"
                                    style="
                                        background: #28a745;
                                        color: white;
                                        border: none;
                                        padding: 5px 12px;
                                        border-radius: 3px;
                                        cursor: pointer;
                                        font-size: 12px;
                                        width: 100%;
                                    ">
                                    购买最低价
                                </button>
                            `
                                : `
                                <button type="button"
                                    style="
                                        background: #6c757d;
                                        color: white;
                                        border: none;
                                        padding: 5px 12px;
                                        border-radius: 3px;
                                        cursor: not-allowed;
                                        font-size: 12px;
                                        width: 100%;
                                    "
                                    disabled>
                                    无法购买
                                </button>
                            `
                            }
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        `

      titleDiv.insertAdjacentElement('afterend', statsDiv)

      const toggleButton = document.getElementById('toggle-original-list')
      toggleButton.addEventListener('click', function (e) {
        e.preventDefault()
        e.stopPropagation()
        toggleOriginalList()
      })

      statsDiv.querySelectorAll('.purchase-btn').forEach((btn) => {
        const itemId = btn.getAttribute('data-item-id')
        btn.addEventListener('click', function (e) {
          e.preventDefault()
          e.stopPropagation()
          purchaseHandlers[itemId]()
        })
      })
    }

    let checkCount = 0
    function checkAndRun() {
      if (checkCount++ > 5) return

      if (
        document.querySelector('.my_biaoti') &&
        document.querySelector('.myblok')
      ) {
        main()
      } else {
        setTimeout(checkAndRun, 500)
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndRun)
    } else {
      checkAndRun()
    }
  }
  if (
    postRegex.test(currentUrl) ||
    forumRegex.test(currentUrl) ||
    forumGuideRegex.test(currentUrl) ||
    forumDisplayRegex.test(currentUrl)
  ) {
    console.log('论坛列表加强')
    /**
     * part: 论坛
     */
    function applyReplyStatus(threadElement, replied) {
      switch (replied) {
        case 'replied':
          threadElement.classList.add('replied-thread')
          break
        case 'unreplied':
          threadElement.classList.add('unreplied-thread')
          break
        case 'new-replied':
          updateStatsDisplay()
          threadElement.classList.add('new-replied-thread')
          break
      }
    }
    console.log('This is running on 论坛列表')
    const isDiscuz = typeof discuz_uid != 'undefined'
    const userId = isDiscuz ? discuz_uid : __CURRENT_UID
    let twentyFourHourRepliesCount = 0
    let oldestReplyTimestamp = null
    const statsContainer = document.createElement('div')
    statsContainer.style.position = 'fixed'
    statsContainer.style.bottom = '1rem' // 已经在底部，保留不变
    statsContainer.style.left = '50%' // 移至屏幕水平居中
    statsContainer.style.transform = 'translateX(-50%)' // 水平偏移自身宽度的一半，实现居中
    statsContainer.style.index = '9999'
    statsContainer.style.backgroundColor = '#fff'
    statsContainer.style.padding = '0.5rem'
    statsContainer.style.borderRadius = '5px'
    document.body.appendChild(statsContainer)
    GM_addStyle(`
        .replied-thread {
            background-color: #EAF6F6;
        }
        .unreplied-thread {
           background-color: #FFEFD5;
        }
        .new-replied-thread {
            background-color: #FFCDD2;
        }
    `)

    const cache = {}
    let isInitialized = false // 标记是否已完成初始化请求

    function updateStatsDisplay() {
      let latestReplyText = ''
      if (oldestReplyTimestamp) {
        const timeDifference = Math.round(
          (new Date().getTime() - oldestReplyTimestamp.getTime()) / (1000 * 60)
        )
        const hours = Math.floor(timeDifference / 60)
        const minutes = timeDifference % 60
        latestReplyText = `其中最远距今已有 ${hours} 小时 ${minutes} 分钟`
      }
      statsContainer.textContent = `过去24小时回复数：${twentyFourHourRepliesCount} 条\n${latestReplyText}`
    }

    function updateThreadStatuses(allThreadElements) {
      const promises = []
      allThreadElements.forEach((threadElement) => {
        const threadLinkElement = threadElement.querySelector('.xst')
        const threadUrl = threadLinkElement.getAttribute('href')
        const threadId = threadUrl.match(/thread-(\d+)/)[1]

        if (!(threadId in cache)) {
          const requestUrl = `https://www.gamemale.com/forum.php?mod=viewthread&tid=${threadId}&authorid=${userId}`
          promises.push(
            fetch(requestUrl)
              .then((response) => {
                if (!response.ok) {
                  throw new Error('Network response was not ok.')
                }
                return response.text()
              })
              .then((html) => {
                const replied = (() => {
                  const postTimeMatch = html.match(
                    /<span title="(\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2})"/
                  )
                  if (postTimeMatch) {
                    const postTimeString = postTimeMatch[1]
                    const postTime = new Date(postTimeString)
                    const currentTime = new Date()
                    const isOver24Hours =
                      currentTime.getTime() - postTime.getTime() >
                      24 * 60 * 60 * 1000
                    if (isOver24Hours) {
                      return 'replied'
                    } else {
                      twentyFourHourRepliesCount++
                      if (
                        !oldestReplyTimestamp ||
                        postTime < oldestReplyTimestamp
                      ) {
                        oldestReplyTimestamp = postTime
                      }
                      return 'new-replied'
                    }
                  } else if (
                    html.includes('未定义操作') ||
                    html.includes('ERROR:')
                  ) {
                    return 'unreplied'
                  } else {
                    return 'replied'
                  }
                })()

                cache[threadId] = replied
                applyReplyStatus(threadElement, replied)
              })
          )
        } else {
          applyReplyStatus(threadElement, cache[threadId])
        }
      })

      if (!isInitialized) {
        isInitialized = true
        Promise.all(promises).finally(() => updateStatsDisplay()) // 所有请求完成后更新统计信息
      }
    }

    // 当页面内容变化或刷新时，可以调用此函数
    window.addEventListener('DOMContentLoaded', () => {
      const newThreadElements = document.querySelectorAll(
        '.bm_c tbody[id^="normalthread_"]:not(.processed)'
      )
      newThreadElements.forEach((threadElement) =>
        threadElement.classList.add('processed')
      )

      updateThreadStatuses(newThreadElements)
    })

    document.getElementById('autopbn') &&
      document
        .getElementById('autopbn')
        .addEventListener('click', function (event) {
          event.preventDefault()

          setTimeout(() => {
            const newThreadElements = document.querySelectorAll(
              '.bm_c tbody[id^="normalthread_"]:not(.processed)'
            )
            newThreadElements.forEach((threadElement) =>
              threadElement.classList.add('processed')
            )
            updateThreadStatuses(newThreadElements)
          }, 1500)
        })

    // 初始化显示
    const initialThreadElements = document.querySelectorAll(
      '.bm_c tbody[id^="normalthread_"]:not(.processed)'
    )
    initialThreadElements.forEach((threadElement) =>
      threadElement.classList.add('processed')
    )
    updateThreadStatuses(initialThreadElements)
  }
  if (postInsideRegex.test(currentUrl) || postRegex.test(currentUrl)) {
    // 对于 帖子 的页面，执行这段代码
    console.log('回帖加强')
    // 在这里写针对 example2.com 的代码...
    ;(async () => {
      document.addEventListener('copy', function (e) {
        var selection = window.getSelection().toString().trim()
        if (
          selection.match(/https?:\/\/\S+/) &&
          selection.includes('(出处: GameMale)')
        ) {
          var url = selection.match(/https?:\/\/\S+/)[0]
          var title = selection
            .replace(url, '')
            .replace(/\(出处: GameMale\)/g, '')
            .replace(/ +/g, ' ')
            .trim()
          var formattedText = '[url=' + url + ']' + title + '[/url]'
          e.clipboardData.setData('text/plain', formattedText)
          e.preventDefault()
        }
      })

      const inlineMode = window.localStorage.getItem('air_inline') ?? '关'

      GM_registerMenuCommand(`行内显示已回复: 【${inlineMode}】`, () => {
        window.localStorage.setItem(
          'air_inline',
          inlineMode === '开' ? '关' : '开'
        )
        window.location.reload()
      })
      if (
        (location.pathname === '/forum.php' &&
          !location.search.includes('tid')) ||
        location.search.includes('authorid')
      ) {
        return
      }

      const isDiscuz = typeof discuz_uid != 'undefined'

      const userId = isDiscuz ? discuz_uid : __CURRENT_UID

      const testUrl =
        location.href.split('#')[0] +
        (location.search ? `&authorid=${userId}` : `?authorid=${userId}`)

      fetch(testUrl)
        .then((res) => res.text())
        .then((html) => {
          const replied = !(
            html.includes('未定义操作') || html.includes('ERROR:')
          )

          const text = replied ? '✅已经回过贴了' : '❌还没回过贴子'

          const tips = document.createElement('a')
          tips.textContent = text
          if (replied) {
            tips.href = testUrl
          } else {
            tips.addEventListener('click', () => {
              if (isDiscuz) {
                showError('❌还没回过贴子')
              } else {
                alert('❌还没回过贴子')
              }
            })
          }

          if (isDiscuz) {
            const btnArea =
              inlineMode !== '开'
                ? document.querySelector('#pgt')
                : document.querySelector(
                    '#postlist td.plc div.authi>span.none'
                  ) ??
                  document.querySelector('#postlist td.plc div.authi>span.pipe')

            if (btnArea === null) {
              return
            }

            if (btnArea.tagName === 'SPAN') {
              const span = document.createElement('span')
              span.textContent = '|'
              span.className = 'pipe'
              const bar = btnArea.parentNode
              bar.insertBefore(span, btnArea)
              bar.insertBefore(tips, btnArea)
            } else {
              btnArea.appendChild(tips)
            }
          } else {
            const btnArea = document.querySelector('#m_nav>.nav')
            const anchor = btnArea.querySelector('div.clear')

            if (btnArea === null || anchor === null) {
              return
            }

            tips.className = 'nav_link'
            btnArea.insertBefore(tips, anchor)
          }
        })
    })()

    // 抽卡音乐开关，值为0时关闭，值为1时开启
    const gachaSound = 0

    // 抽卡音乐链接
    // 崩铁抽卡音效 网抑云源
    const gachaMusicUrl =
      'https://music.163.com/song/media/outer/url?id=2034614721.mp3'
    //PAUSE EX-AID时停音效 使用Gimhoy音乐盘源 https://music.gimhoy.com/
    //const gachaMusicUrl = 'https://dlink.host/musics/aHR0cHM6Ly9vbmVkcnYtbXkuc2hhcmVwb2ludC5jb20vOnU6L2cvcGVyc29uYWwvc3Rvcl9vbmVkcnZfb25taWNyb3NvZnRfY29tL0VVR1R6WlZJeEhoSnBJNnpPclVRcXNBQkN4ZkkwNlh5M25sZmNkV2ZSVzBqc1E.mp3';

    // Firefox火狐浏览器失效保护设置，默认为0，使用firefox浏览器却无法打开账本，可以尝试将此项值设为1，其他浏览器请勿修改！
    const firefoxBrowser = 0

    /////////////////////////快速设置部分结束///////////////////////

    // 使用的浏览器检测
    var brwoserType = ''
    const userAgent = navigator.userAgent
    if (userAgent.indexOf('Firefox') > -1 || firefoxBrowser) {
      brwoserType = 'Firefox'
    } else if (userAgent.indexOf('Chrome') > -1) {
      brwoserType = 'Chrome'
    } else {
      brwoserType = 'Others'
    }

    // 播放抽卡音效的函数
    // 由于音效的缓存需要时间，触发暂停时可能无法及时播放
    function playSound(sound) {
      sound.addEventListener('canplaythrough', (event) => {
        console.log('获取成功，开始播放')
        sound.play()
      })

      return 0
    }

    // 主要负责暂停和记录的主函数
    function pauseAndSave() {
      // 获取内容并暂停
      var creditElement = document.getElementById('creditpromptdiv')

      // 等待提示框加载/抽卡音乐加载
      setTimeout(function () {
        alert(creditElement.textContent)
      }, 500)

      // 保存内容
      extractAndSave(creditElement)

      console.log('记录器工作中...')

      return 0
    }

    // 持续监听页面，当目标节点发生变化时，调用检测函数
    function startObserve() {
      const targetNode = document.getElementById('append_parent')

      // 观察器配置
      const config = { attributes: false, childList: true, subtree: false }

      // 设置计数器，防止出现无限循环
      let changeCount = 0
      let lastSuccessTime = new Date(0)

      // 当检测到变化时调用的回调函数
      const callback = function () {
        // 提前加载音效
        if (gachaSound == 1) {
          console.log('正在获取音效....')
          var sound = new Audio()
          sound.src = gachaMusicUrl
          sound.load()
        }

        // 如果检测到奖励内容再执行函数
        if (document.getElementById('creditpromptdiv')) {
          // 检查和上一次的间隔毫秒
          let curTime = new Date()
          let timeDiff = curTime.getTime() - lastSuccessTime.getTime()

          // 如果小于一定间隔则不执行
          if (timeDiff >= 10000) {
            // 播放音效
            if (gachaSound == 1) {
              playSound(sound)
            }

            // 执行主函数
            pauseAndSave()

            // 计数器加一并更新最新时间
            lastSuccessTime = curTime
            changeCount++
            console.log(`PAUSE账本第 ${changeCount} 次记录完成`)

            // 如果变化次数达到一定次，断开观察！防止无限循环。
            if (changeCount >= 10) {
              console.log('达到设定的变更次数，停止观察。')
              observer.disconnect()
            }
          } else {
            //alert("成功拦截重复记录");
            console.log('成功拦截重复记录')
          }
        }
      }

      // 创建一个观察器实例并传入回调函数
      const observer = new MutationObserver(callback)

      // 开始观察目标节点
      observer.observe(targetNode, config)

      console.log('PAUSE账本正在运行中···')

      return 0
    }

    startObserve()

    function extractAndSave(divElement) {
      let curTime = new Date()

      const result = {
        creditType: '',
        badgeActivated: '否',
        lvCheng: 0,
        jinBi: 0,
        xueYe: 0,
        zhuiSui: 0,
        zhouShu: 0,
        zhiShi: 0,
        lingHun: 0,
        duoLuo: 0,
        acquiredAt: curTime,
      }

      const keyMap = {
        旅程: 'lvCheng',
        金币: 'jinBi',
        血液: 'xueYe',
        追随: 'zhuiSui',
        咒术: 'zhouShu',
        知识: 'zhiShi',
        灵魂: 'lingHun',
        堕落: 'duoLuo',
      }

      // 提取奖励类型
      const creditTypeNode = divElement.querySelector('i')

      var parts = creditTypeNode.textContent.trim().split(' ')

      // 出现以下关键词则代表第一个部分不是类型
      var keywords = [
        '金币',
        '血液',
        '咒术',
        '知识',
        '灵魂',
        '堕落',
        '旅程',
        '追随',
      ]
      var reason = parts[0]

      // 检查原因是否包含关键词，如果包含则替换为"无"
      if (keywords.some((keyword) => reason.includes(keyword))) {
        console.log('无奖励类型')
        reason = '无'
      }

      result.creditType = reason

      // 检查是否触发勋章
      if (creditTypeNode.textContent.includes('勋章功能触发')) {
        result.badgeActivated = '是'
      }

      // 提取积分变化
      const spans = divElement.querySelectorAll('span')
      spans.forEach((span) => {
        const text = span.textContent
        let match
        if (
          (match = text.match(
            /(旅程|金币|血液|追随|咒术|知识|灵魂|堕落)\+(\d+)/
          ))
        ) {
          const key = keyMap[match[1]]
          result[key] = parseInt(match[2], 10)
        } else if (
          (match = text.match(
            /(旅程|金币|血液|追随|咒术|知识|灵魂|堕落)\-(\d+)/
          ))
        ) {
          const key = keyMap[match[1]]
          result[key] = -parseInt(match[2], 10)
        }
      })

      // 保存记录
      var historyArrayEx
      if (localStorage.getItem('extractedCreditHistory')) {
        historyArrayEx = JSON.parse(
          localStorage.getItem('extractedCreditHistory')
        )
      } else {
        historyArrayEx = new Array()
      }

      historyArrayEx.push(result)
      localStorage.setItem(
        'extractedCreditHistory',
        JSON.stringify(historyArrayEx)
      )

      return 0
    }

    //////以下是菜单部分/////////

    // 在新窗口通过调整样式来显示消息
    // alert弹窗只会在原窗口弹出，不容易注意到，因此需通过此方法提示
    function showMsg(msgID, pageContent) {
      var targetMsg = pageContent.getElementById(msgID)

      // 确保元素存在
      if (targetMsg) {
        // 显示元素
        targetMsg.style.display = 'block'

        // 设置5秒后隐藏元素
        setTimeout(function () {
          targetMsg.style.display = 'none'
        }, 5000)
      } else {
        console.error('无法找到ID为' + msgID + '的元素')
      }
    }

    // 重新生成右侧表格，并将结果返回
    function generateRightHTML() {
      //重新获取记录
      var creditHistoryStr = localStorage.getItem('extractedCreditHistory')
      var creditHistory = JSON.parse(creditHistoryStr)

      //创建记录表格
      var tableHTML = ''

      // 构建表格的HTML字符串
      tableHTML +=
        '<table border="1"><thead><tr><th>行号</th><th>奖励类型</th><th>是否触发勋章</th><th>旅程</th><th>金币</th><th>血液</th><th>咒术</th><th>知识</th><th>灵魂</th><th>堕落</th><th>获得时间</th></tr></thead><tbody>'

      //创建行号
      var rowNumber = 1
      var tempLvCheng = 0
      var temmpJinBi = 0
      var tempXueYe = 0
      var tempZhouShu = 0
      var tempZhiShi = 0
      var tempLingHun = 0
      var tempDuoLuo = 0

      if (creditHistory) {
        creditHistory.forEach(function (item) {
          //检查过滤条件，不满足条件的item，返回true跳过执行
          if (checkItem(item)) {
            return
          }

          // 解析ISO 8601时间字符串为UTC时间，然后转为本地时间
          var date = new Date(item.acquiredAt)

          // 格式化日期和时间
          var formattedDateTime =
            date.getFullYear() +
            '-' +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            '-' +
            ('0' + date.getDate()).slice(-2) +
            ' ' +
            ('0' + date.getHours()).slice(-2) +
            ':' +
            ('0' + date.getMinutes()).slice(-2) +
            ':' +
            ('0' + date.getSeconds()).slice(-2)

          tableHTML += `<tr><td>${rowNumber++}</td>
                        <td>${item.creditType}</td>
                        <td>${item.badgeActivated}</td>
                        <td>${item.lvCheng}</td>
                        <td>${item.jinBi}</td>
                        <td>${item.xueYe}</td>
                        <td>${item.zhouShu}</td>
                        <td>${item.zhiShi}</td>
                        <td>${item.lingHun}</td>
                        <td>${item.duoLuo}</td>
                        <td>${formattedDateTime}</td></tr>`

          tempLvCheng += item.lvCheng
          temmpJinBi += item.jinBi
          tempXueYe += item.xueYe
          tempZhouShu += item.zhouShu
          tempZhiShi += item.zhiShi
          tempLingHun += item.lingHun
          tempDuoLuo += item.duoLuo
        })
      }
      tableHTML += '</tbody></table>'

      var summaryTableHTML = ''
      summaryTableHTML +=
        '<table id="summaryTable" border="1"><thead><tr><th>行数</th><th>旅程</th><th>金币</th><th>血液</th><th>咒术</th><th>知识</th><th>灵魂</th><th>堕落</th></thead><tbody>'
      summaryTableHTML += `<tr><td>${--rowNumber}</td>
                        <td>${tempLvCheng}</td>
                        <td>${temmpJinBi}</td>
                        <td>${tempXueYe}</td>
                        <td>${tempZhouShu}</td>
                        <td>${tempZhiShi}</td>
                        <td>${tempLingHun}</td>
                        <td>${tempDuoLuo}</td></tr>`

      // 整合页面HTML
      var rightHTML = '<h3>当前记录汇总</h3>' + summaryTableHTML + tableHTML

      return rightHTML
    }

    // 根据设置检查功能
    function checkItem(item) {
      var showItem = false
      var catCheck = false
      var daysCheck = false

      var settings
      if (localStorage.getItem('filterSettings')) {
        settings = JSON.parse(localStorage.getItem('filterSettings'))
      } else {
        settings = {
          showHuiTie: true,
          showFaTie: true,
          showQiTa: true,
          days: 0,
        }
        localStorage.setItem('filterSettings', JSON.stringify(settings))
      }

      //检查类型
      if (settings.showHuiTie) {
        catCheck = catCheck || item.creditType == '发表回复'
      }
      if (settings.showFaTie) {
        catCheck = catCheck || item.creditType == '发表主题'
      }
      if (settings.showQiTa) {
        catCheck =
          catCheck ||
          (item.creditType != '发表主题' && item.creditType != '发表回复')
      }

      // 检查时间
      if (settings.days != 0) {
        // 转换格式
        var curDate = new Date()
        curDate.setHours(0, 0, 0, 0)
        var recordDate = new Date(item.acquiredAt)
        recordDate.setHours(0, 0, 0, 0)

        // 获取目标日期
        var targetDate = new Date(
          curDate.setDate(curDate.getDate() - settings.days + 1)
        )
        targetDate.setHours(0, 0, 0, 0)

        // 记录日期大于等于目标日期则显示，小于则返回跳过
        if (recordDate.getTime() >= targetDate.getTime()) {
          daysCheck = true
        }
      } else {
        daysCheck = true
      }

      //类型筛选和时间筛选同时满足才显示
      showItem = daysCheck && catCheck

      return !showItem
    }

    /////////////////脚本菜单主部分//////////////

    //创建查看数据菜单
    GM_registerMenuCommand('查看账本', () => {
      // 创建一个隐藏的iframe
      var iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)

      // 读取localStorage中的creditHistory数据
      var creditHistoryStr = localStorage.getItem('extractedCreditHistory')
      try {
        // 解析JSON字符串为对象数组
        var creditHistory = JSON.parse(creditHistoryStr)

        //创建功能区
        var fixedHTML = '<div id="fixedBox"><h3>记录工具箱</h3>'

        //创建记录存档操作区
        var toolHTML = '<div id="toolBox">'

        // 添加导出按钮
        toolHTML += '<button id="exportBtn">导出本地记录为.txt</button>'

        // 添加导入按钮和文件输入框
        toolHTML +=
          '<input type="file" id="importFile" accept=".txt" style="display:none;">'
        toolHTML += '<button id="importBtn">从.txt导入本地记录</button>'

        // 添加删除按钮
        toolHTML += '<button id="deleteBtn">删除所有本地记录</button>'

        //提示信息
        toolHTML +=
          '<p id="exportNull" style="display: none;">没有数据可以导出。</p>'
        toolHTML +=
          '<p id="importSuccess" style="display: none;">导入成功！</p>'
        toolHTML +=
          '<p id="importFail" style="display: none;">导入失败，文件内容不是有效的JSON数组。</p>'
        toolHTML +=
          '<p id="importError" style="display: none;">导入失败，无法解析文件内容,请前往主页面弹窗查看原因。</p>'
        toolHTML +=
          '<div id="customConfirmModal" style="display: none;"><p>确定要删除所有本地积分记录吗？此操作不可逆！</p><div class="buttonContainer"><button id="confirmYes">确定</button><button id="confirmNo">取消</button></div></div>'
        toolHTML +=
          '<p id="deleteSuccess" style="display: none;">已删除所有记录</p>'

        toolHTML += '</div>'

        //创建右侧记录筛选区
        var filterHTML = '<div id="toolBox"><h3>筛选记录</h3>'

        filterHTML += `
                <fieldset>
                <legend>奖励类型</legend>
                  <div>
                  <input type="checkbox" id="showHuiTie" name="showHuiTie" checked />
                  <label for="showHuiTie">回帖奖励</label>
                  </div>
                  <div>
                  <input type="checkbox" id="showFaTie" name="showFaTie" checked />
                  <label for="showFaTie">发帖奖励</label>
                  </div>
                  <div>
                  <input type="checkbox" id="showQiTa" name="showQiTa" checked />
                  <label for="showQiTa">其他奖励</label>
                  </div>
                </fieldset>

                <fieldset>
                <legend>时间范围</legend>
                <input type="radio" id="option1" name="timeRange" value="1">
                    <label for="option1">当天</label><br>

                <input type="radio" id="option2" name="timeRange" value="custom" checked>
                <label for="option2">自定义  <input type="number" min="0" id="customDays" value="0"></label><br>
                <small>(N:过去N天内 1:当天 0:全部)</small>
                </fieldset>

                `

        filterHTML += '</div>'

        //将左侧的模块都塞进fixed部分
        fixedHTML += toolHTML
        fixedHTML += filterHTML

        fixedHTML += '</div>'

        //最后塞入用于显示/隐藏的按钮
        fixedHTML += '<button id="toggleToolBoxBtn"></button>'

        //通过函数生成右侧表格内容（方便后期更新表格）
        var rightHTML = '<div id="tableBox">' + generateRightHTML() + '</div>'

        //总结构
        var overallHTML =
          '<div class="container">' + fixedHTML + rightHTML + '</div>'

        // 插入到新窗口的文档中
        iframe.contentDocument.body.innerHTML += overallHTML

        //////////////////// 添加css/////////////////////////
        // 获取IFrame的内容文档对象
        var iframeDoc = iframe.contentDocument || iframe.contentWindow.document

        // 创建一个新的<style>元素
        var styleTag = iframeDoc.createElement('style')

        // 定义CSS样式内容
        var styles = `
                #fixedBox {
                    position: fixed;
                    width: auto;
                    height: 96vh;
                    background: #eeeeee;
                    float: left;
                    min-width: 100px;
                    overflow-y: auto;
                    border-radius: 8px;
                    font-family: Noto Sans SC, Microsoft Yahei, Arial, sans-serif;
                }

                .container {
                    display: flex;
                }

                #toolBox {
                    padding: 10px;
                }

                #exportBtn,
                #importBtn {
                    margin: 6px auto 20px;
                }

                #deleteBtn {
                    margin: auto;
                }

                #exportBtn,
                #importBtn,
                #deleteBtn {
                    display: block;
                    background-color: transparent;
                    border: 2px solid #1A1A1A;
                    border-radius: 0.6em;
                    color: #3B3B3B;
                    font-weight: 600;
                    font-size: 14.4px;
                    padding: 0.4em 1.2em;
                    text-align: center;
                    text-decoration: none;
                    transition: all 300ms cubic-bezier(.23, 1, 0.32, 1);
                    font-family: Noto Sans SC, Microsoft Yahei, Arial, sans-serif;
                }

                #exportBtn:hover,
                #importBtn:hover,
                #deleteBtn:hover {
                    color: #fff;
                    background-color: #1A1A1A;
                    box-shadow: rgba(0, 0, 0, 0.25) 0 8px 15px;
                    transform: translateY(-2px);
                }

                #exportBtn:active,
                #importBtn:active,
                #deleteBtn:active {
                    box-shadow: none;
                    transform: translateY(0);
                }

                h3 {
                    display: block;
                    text-align: center;
                    font-size: 2em;
                    margin: 36px auto 12px;
                }

                #customConfirmModal {
                    border-style: solid;
                    border-width: 3px;
                    border-color: red;
                }

                #customConfirmModal p {
                    color: red;
                    margin: 20px;
                }

                #confirmYes {
                    margin: 0 20% 20px 20%;
                }

                #customDays {
                    width: 4em;
                    font-family: Noto Sans SC, Microsoft Yahei, Arial, sans-serif;
                    border-radius: 6px;
                    border: 1px solid #333;
                }

                #tableBox {
                    width: 80%;
                    float: right;
                    margin-left: 20%;
                }

                #tableBox table {
                    margin: 20px auto 40px auto;
                    border: 2px solid #333;
                    border-radius: 6px;
                    border-spacing: 0;
                    overflow: hidden;
                }

                th,
                td {
                    padding: 4px 8px;
                    text-align: center;
                    transition: all 0.2s;
                    border: none;
                }

                th {background-color: #f2f2f2;}
                tr:nth-child(even) {background-color: #f2f2f2; transition: all 0.2s;}
                tr:hover {background-color: #d3d3d3; transition: all 0.2s;}

                #toggleToolBoxBtn {
                    position: fixed;
                    width: 16px;
                    height: 16px;
                    margin-top: 8px;
                    margin-left: 8px;
                    z-index: 1000;
                    border: 1px solid #333;
                    padding: 4px;
                    border-radius: 50%;
                }

                fieldset {
                  border: 2px solid #333; /* 设置边框 */
                  padding: 8px 12px 16px 12px; /* 设置内边距 */
                  margin: 20px 10px; /* 设置外边距 */
                  background-color: #f9f9f9; /* 设置背景颜色 */
                  border-radius: 6px; /* 设置圆角 */
                }

                legend {
                  font-weight: bold; /* 设置字体加粗 */
                  color: #000; /* 设置字体颜色 */
                }

                label {
                  font-size:14.4px;
                }
                `

        // 将样式内容赋值给<style>元素的textContent属性
        styleTag.textContent = styles

        // 将<style>元素添加到IFrame的<head>中
        var head = iframeDoc.head || iframeDoc.getElementsByTagName('head')[0]
        head.appendChild(styleTag)

        //////////////添加网页标题////////////////
        var titleElement = document.createElement('title')
        titleElement.innerText = 'PAUSE账本'

        head.appendChild(titleElement)

        ////////////根据浏览器类型选择是否更改iframe的src属性////////
        if (brwoserType == 'Firefox') {
          iframe.src = 'PAUSE'
          console.log('检测到使用Firefox浏览器，已为iframe添加src属性')
        }
      } catch (e) {
        console.error('解析localStorage中的creditHistory失败:', e)
        // 如果解析失败，可以在这里处理错误，比如显示一个错误消息
        iframe.contentDocument.body.textContent =
          '数据加载失败，请检查浏览器的localStorage设置。'
      }

      // 将iframe的内容复制到新窗口
      var newWindow = window.open('', '_blank')
      newWindow.document.replaceChild(
        newWindow.document.importNode(
          iframe.contentDocument.documentElement,
          true
        ),
        newWindow.document.documentElement
      )

      //根据存储数据初始化界面
      if (localStorage.getItem('filterSettings')) {
        var filterSettings = JSON.parse(localStorage.getItem('filterSettings'))
        newWindow.document.getElementById('showHuiTie').checked =
          filterSettings.showHuiTie
        newWindow.document.getElementById('showFaTie').checked =
          filterSettings.showFaTie
        newWindow.document.getElementById('showQiTa').checked =
          filterSettings.showQiTa
        newWindow.document.getElementById('option2').checked = true
        newWindow.document.getElementById('customDays').value =
          filterSettings.days
        console.log('初始化界面完成！')
      }

      // 显示/隐藏工具箱
      // 名为toolBox 实际上是对外层fixedBox进行操作
      newWindow.document
        .getElementById('toggleToolBoxBtn')
        .addEventListener('click', function () {
          var toolBox = newWindow.document.getElementById('fixedBox')
          if (toolBox.style.display === 'none') {
            toolBox.style.display = 'block'
          } else {
            toolBox.style.display = 'none'
          }
        })

      // 导出数据
      // 给exportBtn添加点击事件监听器
      newWindow.document
        .getElementById('exportBtn')
        .addEventListener('click', function () {
          var creditHistoryStr = localStorage.getItem('extractedCreditHistory')
          if (creditHistoryStr) {
            var blob = new Blob([creditHistoryStr], {
              type: 'text/plain;charset=utf-8',
            })
            var url = URL.createObjectURL(blob)
            var link = document.createElement('a')
            link.href = url
            link.download = 'extractedCreditHistory.txt'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          } else {
            //alert('没有数据可以导出。');
            showMsg('exportNull', newWindow.document)
          }
        })

      // 导入数据
      // 绑定导入按钮的点击事件，触发文件选择对话框
      newWindow.document
        .getElementById('importBtn')
        .addEventListener('click', function () {
          newWindow.document.getElementById('importFile').click()
        })
      // 绑定文件输入框的change事件，处理文件读取
      newWindow.document
        .getElementById('importFile')
        .addEventListener('change', function (e) {
          var file = e.target.files[0]
          if (!file) return
          var reader = new FileReader()
          reader.onload = function (e) {
            var content = e.target.result
            try {
              var parsedData = JSON.parse(content)
              if (Array.isArray(parsedData)) {
                localStorage.setItem(
                  'extractedCreditHistory',
                  JSON.stringify(parsedData)
                )
                showMsg('importSuccess', newWindow.document)
              } else {
                //alert('导入失败，文件内容不是有效的JSON数组。');
                showMsg('importFail', newWindow.document)
              }
            } catch (error) {
              alert('导入失败，无法解析文件内容: ' + error)
              showMsg('importError', newWindow.document)
            }
          }
          reader.readAsText(file)
        })

      // 删除数据
      // 绑定删除按钮的点击事件
      newWindow.document
        .getElementById('deleteBtn')
        .addEventListener('click', function () {
          var customConfirmModal =
            newWindow.document.getElementById('customConfirmModal')

          // 如果已经显示了，再次点击则隐藏提示框
          if (customConfirmModal.style.display == 'block') {
            customConfirmModal.style.display = 'none'
          } else {
            customConfirmModal.style.display = 'block'
          }

          // 绑定自定义对话框内的确认和取消按钮事件
          newWindow.document
            .getElementById('confirmYes')
            .addEventListener('click', function () {
              customConfirmModal.style.display = 'none'
              localStorage.removeItem('extractedCreditHistory')
              localStorage.removeItem('filterSettings')
              showMsg('deleteSuccess', newWindow.document)
            })

          newWindow.document
            .getElementById('confirmNo')
            .addEventListener('click', function () {
              customConfirmModal.style.display = 'none'
            })
        })

      // 奖励类型
      newWindow.document
        .getElementById('showHuiTie')
        .addEventListener('change', function () {
          var filterSettings = JSON.parse(
            localStorage.getItem('filterSettings')
          )
          filterSettings.showHuiTie = this.checked
          localStorage.setItem('filterSettings', JSON.stringify(filterSettings))
          newWindow.document.getElementById('tableBox').innerHTML =
            generateRightHTML()
          console.log('已更改奖励类型筛选条件')
        })

      newWindow.document
        .getElementById('showFaTie')
        .addEventListener('change', function () {
          var filterSettings = JSON.parse(
            localStorage.getItem('filterSettings')
          )
          filterSettings.showFaTie = this.checked
          localStorage.setItem('filterSettings', JSON.stringify(filterSettings))
          newWindow.document.getElementById('tableBox').innerHTML =
            generateRightHTML()
          console.log('已更改奖励类型筛选条件')
        })

      newWindow.document
        .getElementById('showQiTa')
        .addEventListener('change', function () {
          var filterSettings = JSON.parse(
            localStorage.getItem('filterSettings')
          )
          filterSettings.showQiTa = this.checked
          localStorage.setItem('filterSettings', JSON.stringify(filterSettings))
          newWindow.document.getElementById('tableBox').innerHTML =
            generateRightHTML()
          console.log('已更改奖励类型筛选条件')
        })

      // 天数筛选
      newWindow.document
        .getElementById('option1')
        .addEventListener('click', function () {
          if (this.checked) {
            var filterSettings = JSON.parse(
              localStorage.getItem('filterSettings')
            )
            filterSettings.days = 1
            localStorage.setItem(
              'filterSettings',
              JSON.stringify(filterSettings)
            )
            newWindow.document.getElementById('tableBox').innerHTML =
              generateRightHTML()
            console.log('已更改时间范围条件')
          }
        })

      newWindow.document
        .getElementById('option2')
        .addEventListener('click', function () {
          if (this.checked) {
            var filterSettings = JSON.parse(
              localStorage.getItem('filterSettings')
            )
            filterSettings.days =
              newWindow.document.getElementById('customDays').value
            localStorage.setItem(
              'filterSettings',
              JSON.stringify(filterSettings)
            )
            newWindow.document.getElementById('tableBox').innerHTML =
              generateRightHTML()
            console.log('已更改时间范围条件')
          }
        })

      newWindow.document
        .getElementById('customDays')
        .addEventListener('change', function () {
          var option2 = newWindow.document.getElementById('option2')
          if (newWindow.document.getElementById('option2').checked) {
            var filterSettings = JSON.parse(
              localStorage.getItem('filterSettings')
            )
            filterSettings.days = this.value
            localStorage.setItem(
              'filterSettings',
              JSON.stringify(filterSettings)
            )
            newWindow.document.getElementById('tableBox').innerHTML =
              generateRightHTML()
            console.log('已更改时间范围条件')
          }
        })

      // 重置筛选
      newWindow.document
        .getElementById('showAllBtn')
        .addEventListener('click', function () {
          var defaultSettings = {
            showHuiTie: true,
            showFaTie: true,
            showQiTa: true,
            days: 0,
          }
          newWindow.document.getElementById('showHuiTie').checked =
            defaultSettings.showHuiTie
          newWindow.document.getElementById('showFaTie').checked =
            defaultSettings.showFaTie
          newWindow.document.getElementById('showQiTa').checked =
            defaultSettings.showQiTa
          newWindow.document.getElementById('option2').checked = true
          newWindow.document.getElementById('customDays').value =
            defaultSettings.days
          localStorage.setItem(
            'filterSettings',
            JSON.stringify(defaultSettings)
          )
          newWindow.document.getElementById('tableBox').innerHTML =
            generateRightHTML()
          console.log('已重置筛选条件')
        })

      // 清理创建的iframe
      document.body.removeChild(iframe)
    })

    GM_addStyle(`
    #fastpostsubmit.dequeue{
      background-color:#F49544;
      border-color:#D17F3A;
    }
    #fastpostsubmit.dequeue:hover{
      background-color:#AE6A30;
      border-color:#8B5526;
    }
    #replyCount{
      float:right;
      margin-right:10px;
    }
    #clearReplyList{
      display:block;
      text-align:center;
      float:right;
      margin:0 20px;
    }`)

    let replyList = JSON.parse(localStorage.getItem('replyList') || '[]')
    let replyTime = JSON.parse(localStorage.getItem('replyTime') || '[]')
    let tid = window.location.href.match(/thread-(\d+)|tid=(\d+)/)
    tid = tid[2] || tid[1]
    let type = true
    let time = 0

    // 固定每小时上限 30 次
    const level = 0
    const replyMax = replyMaxEnabled ? 30 : 10000000

    const form = document.querySelector('#fastpostform')
    const message = document.querySelector('#fastpostmessage')
    const submit = document.querySelector('#fastpostsubmit')
    const close = document.createElement('label')
    const replyCountBox = document.createElement('div')
    const clearReplyList = document.createElement('a')
    clearReplyList.id = 'clearReplyList'
    clearReplyList.href = 'javascript:;'
    replyCountBox.id = 'replyCount'
    form.onsubmit = ''

    close.innerHTML = checked
      ? `<input id="close" type="checkbox" class="pc" checked>
  回帖后自动关闭页面`
      : `<input id="close" type="checkbox" class="pc">
  回帖后自动关闭页面`
    clearReplyList.innerHTML = '清空队列'
    document
      .querySelector('.ptm.pnpost')
      .append(close, clearReplyList, replyCountBox)
    updateReplyCount()

    form.addEventListener('submit', (e) => e.preventDefault())
    submit.addEventListener('click', () => {
      type ? enqueue() : dequeue()
    })
    clearReplyList.addEventListener('click', delEnqueue)

    function enqueue() {
      if (
        !replyList.includes(tid) &&
        replyTime.length + replyList.length < replyMax
      ) {
        if (new Blob([message.value]).size < 30) {
          alert(
            `您的帖子长度不足30字节，当前长度：${
              new Blob([message.value]).size
            }`
          )
          return
        }
        replyList.push(tid)
        localStorage.setItem('replyList', JSON.stringify(replyList))
        submit.classList.add('dequeue')
        submit.innerHTML = '<strong>排队中...</strong>'
        message.setAttribute('readonly', true)
        type = false
        if (replyList.length === 1) {
          observeChanges()
          send()
        }
        window.addEventListener('beforeunload', () => {
          replyList = replyList.filter((item) => item != tid)
          localStorage.setItem('replyList', JSON.stringify(replyList))
        })
        updateReplyCount()
      } else if (replyList.includes(tid)) {
        alert('帖子已在队列中')
      } else {
        alert('您已达到1小时内30次回复上限！')
      }
    }

    let formCheck1,
      formCheck2,
      isSubmitting = false

    function send() {
      form.onsubmit = sub()
      const now = Math.floor(Date.now() / 1000)
      replyTime = JSON.parse(localStorage.getItem('replyTime') || '[]')
      time = time ? time : 60 - (now - replyTime[replyTime.length - 1])
      formCheck1 = setTimeout(() => {
        let t = 0
        form.onsubmit = sub()
        formCheck2 = setInterval(() => {
          if (isSubmitting) return
          if (t >= 24) {
            dequeue()
            alert('网络波动，请刷新页面重新排队')
            clearTimeout(formCheck1)
            clearTimeout(formCheck2)
          }
          form.onsubmit = sub()
          t++
        }, 5000)
      }, time * 1000)
    }

    let isTriggered = false
    function observeChanges() {
      const targetNode = document.getElementById('append_parent')
      const observer = new MutationObserver(() => {
        if (document.getElementById('creditpromptdiv') && !isTriggered) {
          isTriggered = true
          const now = Math.floor(Date.now() / 1000)
          replyTime.push(now)
          localStorage.setItem('replyTime', JSON.stringify(replyTime))
          clearInterval(formCheck1)
          clearInterval(formCheck2)
          observer.disconnect()
          dequeue()
          if (close.querySelector('input').checked) window.close()
        }
      })
      observer.observe(targetNode, { childList: true })
    }

    function dequeue() {
      submit.innerHTML = '<strong>发表回复</strong>'
      submit.classList.remove('dequeue')
      message.removeAttribute('readonly')
      type = true
      replyList = replyList.filter((item) => item != tid)
      localStorage.setItem('replyList', JSON.stringify(replyList))
      clearTimeout(formCheck1)
      clearTimeout(formCheck2)
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'replyList' || e.key === 'replyTime') {
        replyList = JSON.parse(localStorage.getItem('replyList') || '[]')
        replyTime = JSON.parse(localStorage.getItem('replyTime') || '[]')
        updateReplyCount()
        if (e.key === 'replyList' && tid == replyList[0]) {
          observeChanges()
          send()
        } else if (e.key === 'replyList' && replyList.length === 0) {
          dequeue()
        }
      }
    })

    async function sub() {
      if (isSubmitting) return
      isSubmitting = true
      const isValid = await fastpostvalidate(form)
      isSubmitting = false
      console.log('提交中...')
      return isValid
    }

    function updateReplyCount() {
      const now = Math.floor(Date.now() / 1000)
      replyTime = replyTime.filter((t) => now - t <= 3600)
      replyCountBox.innerHTML = `<span>${replyTime.length}/30 | 排队数：${replyList.length}</span>`
      localStorage.setItem('replyTime', JSON.stringify(replyTime))
    }

    function delEnqueue() {
      if (confirm('确定清空队列吗？')) {
        replyList = []
        dequeue()
        updateReplyCount()
        localStorage.setItem('replyList', JSON.stringify(replyList))
      }
    }
    // 初始化颜文字数据库
    const defaultKaomoji = {
      日常: [
        '(￣▽￣)ノ',
        '( •̀ ω •́ )✧',
        '(＾▽＾)',
        '(´･ω･`)',
        '(￣ω￣)',
        '(≧∇≦)ﾉ',
        '(╯▽╰ )',
        '(๑•̀ㅂ•́)و✧',
        'ヽ(✿ﾟ▽ﾟ)ノ',
        '(◕‿◕✿)',
      ],
      开心: [
        '(*^▽^*)',
        '٩(◕‿◕｡)۶',
        'ヽ(〃＾▽＾〃)ﾉ',
        '（*＾-＾*）',
        'o(≧▽≦)o',
        '(*≧ω≦)',
        '٩(｡•́‿•̀｡)۶',
        'd(^^*)',
        '（≧∇≦）',
        '(◡‿◡✿)',
      ],
      无奈: [
        '(´･_･`)',
        '(-_-;)',
        '( ˘･з･)',
        '（；´д｀）ゞ',
        '(╥﹏╥)',
        '_(:3」∠)_',
        '（；￣д￣）',
        '_(┐「ε:)_',
        '(´；ω；｀)',
        '(-_-メ)',
      ],
      调皮: [
        '( •̀ ω •́ )y',
        '(￣ε￣＠)',
        '（￣︶￣）↗',
        '(｀へ´*)ノ',
        '(¬‿¬)',
        '(￣▽￣*)ゞ',
        '(◕‿◕)',
        '(｡ŏ_ŏ)',
        '(¬▂¬)',
        '(｀∀´)Ψ',
      ],
      爱心: [
        '(๑•́ ₃ •̀๑)♡',
        '(◍•ᴗ•◍)❤',
        '(´∀｀)♡',
        '（っ＾▿＾）',
        '(●´З｀●)',
        '(´ ▽｀).。ｏ♡',
        '（*´▽｀*)',
        '（´ω｀♡%）',
        '(◕ᴗ◕✿)',
        '(灬♥ω♥灬)',
      ],
    }

    // 加载用户保存的颜文字
    let kaomojiData = GM_getValue('kaomojiData', defaultKaomoji)

    // 当前选中的分类
    let currentCategory = Object.keys(kaomojiData)[0]

    // 跟踪当前激活的输入框ID（用于楼中楼）
    let activeTextareaId = 'fastpostmessage'

    // 创建样式
    const style = document.createElement('style')
    style.innerHTML = `
        /* 颜文字盒子主容器 */
        #kaomoji-box {
            position: absolute;
            width: 480px;
            height: 360px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            z-index: 10000;
            display: none;
            font-family: "Microsoft YaHei", "Segoe UI", Arial, sans-serif;
            overflow: hidden;
        }

        /* 左右分栏布局 */
        .kaomoji-container {
            display: flex;
            height: 100%;
        }

        /* 左侧颜文字区域 */
        .kaomoji-main {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: white;
        }

        /* 颜文字头部 */
        .kaomoji-header {
            padding: 8px 12px;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 34px;
            flex-shrink: 0;
        }

        /* 颜文字网格区域 */
        .kaomoji-grid {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-content: flex-start;
        }

        .kaomoji-grid::-webkit-scrollbar {
            width: 4px;
        }

        .kaomoji-grid::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        .kaomoji-grid::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 2px;
        }

        /* 颜文字项 */
        .kaomoji-item {
            padding: 8px 10px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 34px;
            flex: 1 0 calc(33.333% - 12px);
            max-width: calc(33.333% - 12px);
            text-align: center;
            transition: background-color 0.2s;
        }

        .kaomoji-item:hover {
            background: #e9ecef;
            border-color: #ccc;
        }

        /* 右侧分类区域 */
        .kaomoji-sidebar {
            width: 120px;
            height: 100%;
            display: flex;
            flex-direction: column;
            border-left: 1px solid #ddd;
            background: #f5f5f5;
            overflow: hidden;
        }

        /* 分类标题 */
        .sidebar-title {
            padding: 8px 12px;
            background: #f0f0f0;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            height: 34px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
        }

        /* 分类列表容器 */
        .categories-container {
            flex: 1;
            overflow-y: auto;
            padding: 6px 0;
        }

        .categories-container::-webkit-scrollbar {
            width: 3px;
        }

        .categories-container::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
        }

        .categories-container::-webkit-scrollbar-thumb {
            background: #aaa;
            border-radius: 2px;
        }

        /* 分类项 */
        .category-item {
            padding: 8px 10px;
            margin: 2px 6px;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            color: #555;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: all 0.2s;
        }

        .category-item:hover {
            background: #f0f0f0;
            border-color: #ccc;
        }

        .category-item.active {
            background: #e0e0e0;
            color: #333;
            font-weight: bold;
            border-color: #bbb;
        }

        /* 添加分类按钮 - 蓝色 */
        .add-category-btn {
            padding: 6px 10px;
            margin: 6px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            text-align: center;
            transition: background-color 0.2s;
        }

        .add-category-btn:hover {
            background: #3a7bc8;
        }

        /* 添加颜文字按钮 - 绿色 */
        .add-kaomoji-btn {
            padding: 4px 8px;
            background: #5cb85c;
            color: white;
            border: none;
            border-radius: 3px;
            font-size: 11px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .add-kaomoji-btn:hover {
            background: #4cae4c;
        }

        /* 颜文字按钮 - 优化版：无边框，加粗图标 */
        #kaomoji-trigger {
            margin-left: 2px;
            padding: 0;
            background: none;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            color: #666;
            transition: all 0.2s;
            vertical-align: middle;
            font-family: Arial, sans-serif;
            font-weight: bold;
        }

        #kaomoji-trigger::before {
            content: ":)";
        }

        #kaomoji-trigger:hover {
            background: #f0f0f0;
            color: #333;
        }

        .kaomoji-trigger-floor {
            margin-left: 2px;
            padding: 0;
            background: none;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            color: #666;
            transition: all 0.2s;
            vertical-align: middle;
            font-family: Arial, sans-serif;
            font-weight: bold;
        }

        .kaomoji-trigger-floor::before {
            content: ":)";
        }

        .kaomoji-trigger-floor:hover {
            background: #f0f0f0;
            color: #333;
        }

        /* 右键菜单 - 只有删除功能 */
        .context-menu {
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            z-index: 10001;
            min-width: 80px;
            display: none;
        }

        .context-menu-item {
            padding: 6px 10px;
            cursor: pointer;
            font-size: 11px;
            color: #d9534f;
            transition: all 0.2s;
            text-align: center;
        }

        .context-menu-item:hover {
            background: #d9534f;
            color: white;
        }

        /* 空状态提示 */
        .empty-state {
            width: 100%;
            text-align: center;
            padding: 30px 20px;
            color: #999;
            font-style: italic;
            font-size: 12px;
        }

        /* 通知样式 */
        .kaomoji-notification {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            background: #5cb85c;
            color: white;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            z-index: 10001;
            font-size: 12px;
            animation: slideIn 0.2s ease, fadeOut 0.2s ease 1.5s forwards;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        /* 输入对话框 */
        .kaomoji-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10002;
            padding: 15px;
            min-width: 280px;
            display: none;
        }

        .dialog-title {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #333;
            font-weight: bold;
        }

        .dialog-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            font-size: 12px;
            margin-bottom: 10px;
            box-sizing: border-box;
            resize: vertical;
            min-height: 80px;
        }

        .dialog-input:focus {
            border-color: #4a90e2;
            outline: none;
        }

        .dialog-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

        .dialog-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s;
        }

        .dialog-btn.primary {
            background: #5cb85c;
            color: white;
        }

        .dialog-btn.primary:hover {
            background: #4cae4c;
        }

        .dialog-btn.secondary {
            background: #999;
            color: white;
        }

        .dialog-btn.secondary:hover {
            background: #888;
        }

        /* 响应式调整 */
        @media (max-width: 768px) {
            #kaomoji-box {
                width: 360px;
                height: 320px;
            }

            .kaomoji-item {
                flex: 1 0 calc(50% - 6px);
                max-width: calc(50% - 6px);
                font-size: 12px;
                padding: 6px 8px;
            }
        }

        /* 主回复区域按钮对齐 */
        .fpd {
            display: inline-flex;
            align-items: center;
            vertical-align: middle;
        }

        /* 楼中楼按钮容器 - 更温和的方式 */
        .dxksst_floor .emoji-button-row {
            display: flex;
            align-items: center;
            margin-left: 8px;
            white-space: nowrap;
            vertical-align: middle;
        }

        /* 确保所有按钮在同一行 */
        .dxksst_floor form table td {
            white-space: nowrap !important;
        }

        /* 第三方按钮样式 - 更温和 */
        .dxksst_floor .emoji-button-row .iconfont.pipe.z.reply {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            margin-left: 2px !important;
            font-size: 18px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 26px !important;
            height: 26px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            text-decoration: none !important;
            cursor: pointer !important;
        }

        .dxksst_floor .emoji-button-row .iconfont.pipe.z.reply:hover {
            background: #f0f0f0 !important;
            border-color: #999 !important;
        }

        /* Discuz默认表情按钮样式 */
        .dxksst_floor .emoji-button-row .iconfont.pipe.z:not(.reply) {
            position: static !important;
            margin-left: 2px !important;
            font-size: 18px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 26px !important;
            height: 26px !important;
            border: 1px solid #ccc !important;
            border-radius: 3px !important;
            cursor: pointer !important;
        }

        .dxksst_floor .emoji-button-row .iconfont.pipe.z:not(.reply):hover {
            background: #f0f0f0 !important;
            border-color: #999 !important;
        }
    `
    document.head.appendChild(style)

    // 创建颜文字盒子
    const kaomojiBox = document.createElement('div')
    kaomojiBox.id = 'kaomoji-box'

    // 创建右键菜单 - 只有删除
    const contextMenu = document.createElement('div')
    contextMenu.className = 'context-menu'
    contextMenu.innerHTML =
      '<div class="context-menu-item" id="context-delete">删除</div>'

    // 创建输入对话框
    const dialog = document.createElement('div')
    dialog.className = 'kaomoji-dialog'

    // 跟踪已处理的楼中楼
    const processedFloors = new Set()

    // 初始化颜文字界面
    function initKaomojiBox() {
      // 主回复区域 - 在Discuz默认表情按钮后面添加颜文字按钮
      const chatMenu = document.querySelector('.fpd')
      if (chatMenu && !document.getElementById('kaomoji-trigger')) {
        const triggerBtn = document.createElement('button')
        triggerBtn.id = 'kaomoji-trigger'
        triggerBtn.title = '颜文字'

        // 创建按钮包装器
        const wrapper = document.createElement('span')
        wrapper.style.display = 'inline-flex'
        wrapper.style.alignItems = 'center'
        wrapper.style.verticalAlign = 'middle'
        wrapper.appendChild(triggerBtn)

        // 插入到Discuz默认表情按钮后面
        const emojiBtn = chatMenu.querySelector('.iconfont.pipe.z')
        if (emojiBtn) {
          const emojiWrapper = emojiBtn.parentNode
          if (emojiWrapper && emojiWrapper.parentNode) {
            emojiWrapper.parentNode.insertBefore(
              wrapper,
              emojiWrapper.nextSibling
            )
          }
        } else {
          chatMenu.appendChild(wrapper)
        }

        triggerBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          e.preventDefault()
          activeTextareaId = 'fastpostmessage'
          toggleKaomojiBox(triggerBtn)
        })
      }

      // 创建颜文字盒子内容
      kaomojiBox.innerHTML = `
            <div class="kaomoji-container">
                <!-- 左侧颜文字区域 -->
                <div class="kaomoji-main">
                    <div class="kaomoji-header">
                        <span id="current-category-name">${currentCategory}</span>
                        <button class="add-kaomoji-btn" id="add-kaomoji-btn">+ 添加</button>
                    </div>
                    <div class="kaomoji-grid" id="kaomoji-grid"></div>
                </div>

                <!-- 右侧分类区域 -->
                <div class="kaomoji-sidebar">
                    <div class="sidebar-title">分类</div>
                    <div class="categories-container" id="categories-container"></div>
                    <button class="add-category-btn" id="add-category-btn">+ 新分类</button>
                </div>
            </div>
        `

      // 创建对话框内容
      dialog.innerHTML = `
            <div class="dialog-title" id="dialog-title">输入内容</div>
            <textarea class="dialog-input" id="dialog-input" rows="4" placeholder="请输入颜文字..."></textarea>
            <div class="dialog-buttons">
                <button class="dialog-btn secondary" id="dialog-cancel">取消</button>
                <button class="dialog-btn primary" id="dialog-confirm">确定</button>
            </div>
        `

      document.body.appendChild(kaomojiBox)
      document.body.appendChild(contextMenu)
      document.body.appendChild(dialog)

      // 绑定事件
      bindEvents()
      // 渲染界面
      renderCategories()
      renderKaomojiGrid()

      // 跟踪焦点输入框
      document.addEventListener('focusin', function (e) {
        if (e.target.tagName === 'TEXTAREA') {
          if (e.target.id) {
            activeTextareaId = e.target.id
          } else if (e.target.name) {
            activeTextareaId = e.target.name
          }
        }
      })

      // 点击页面其他区域关闭颜文字盒子和右键菜单
      document.addEventListener('click', function (e) {
        if (
          !kaomojiBox.contains(e.target) &&
          !e.target.matches('#kaomoji-trigger, .kaomoji-trigger-floor') &&
          !contextMenu.contains(e.target)
        ) {
          kaomojiBox.style.display = 'none'
          contextMenu.style.display = 'none'
        }
      })

      // 右键关闭右键菜单
      document.addEventListener('contextmenu', function (e) {
        if (!contextMenu.contains(e.target)) {
          contextMenu.style.display = 'none'
        }
      })
    }

    // 为楼中楼添加按钮 - 更温和的兼容方式
    function addFloorTriggers() {
      // 检查所有楼中楼
      document.querySelectorAll('.dxksst_floor').forEach(processFloor)
    }

    // 处理单个楼中楼
    function processFloor(floor) {
      if (processedFloors.has(floor)) return

      // 增加延迟，确保第三方脚本先创建按钮
      setTimeout(() => {
        addKaomojiButtonToFloor(floor)
      }, 1500) // 增加延迟时间
    }

    // 为楼中楼添加颜文字按钮 - 更温和的方式
    function addKaomojiButtonToFloor(floor) {
      // 如果已经存在我们的按钮，则跳过
      if (floor.querySelector('.kaomoji-trigger-floor')) {
        // 但确保按钮顺序正确
        ensureButtonOrder(floor)
        return
      }

      const textarea = floor.querySelector('textarea')
      if (!textarea) return

      // 确保输入框有ID
      if (!textarea.id) {
        textarea.id = 'kaomoji-floor-' + Date.now()
      }

      // 查找现有的按钮容器
      const formTd = floor.querySelector('form table td')
      if (!formTd) return

      // 等待第三方按钮和Discuz按钮都被创建
      setTimeout(() => {
        // 创建我们的颜文字按钮
        const floorTriggerBtn = document.createElement('button')
        floorTriggerBtn.className = 'kaomoji-trigger-floor'
        floorTriggerBtn.title = '颜文字'

        // 首先查找或创建按钮行容器
        let buttonRow = formTd.querySelector('.emoji-button-row')

        if (!buttonRow) {
          // 创建按钮行
          buttonRow = document.createElement('span')
          buttonRow.className = 'emoji-button-row'

          // 收集现有按钮
          const existingButtons = []

          // 1. 查找Discuz默认表情按钮
          let defaultEmojiBtn = formTd.querySelector(
            '.iconfont.pipe.z:not(.reply)'
          )
          if (defaultEmojiBtn) {
            existingButtons.push({
              type: 'defaultEmoji',
              element: defaultEmojiBtn,
            })
            defaultEmojiBtn.remove() // 暂时移除
          }

          // 2. 查找第三方表情包按钮
          let thirdPartyBtn = formTd.querySelector('.iconfont.pipe.z.reply')
          if (thirdPartyBtn) {
            existingButtons.push({ type: 'thirdParty', element: thirdPartyBtn })
            thirdPartyBtn.remove() // 暂时移除
          }

          // 添加我们的按钮到最前面
          buttonRow.appendChild(floorTriggerBtn)

          // 添加第三方按钮（第二个）
          const thirdParty = existingButtons.find(
            (b) => b.type === 'thirdParty'
          )
          if (thirdParty) {
            buttonRow.appendChild(thirdParty.element)
          }

          // 添加Discuz默认表情按钮（第三个）
          const defaultEmoji = existingButtons.find(
            (b) => b.type === 'defaultEmoji'
          )
          if (defaultEmoji) {
            buttonRow.appendChild(defaultEmoji.element)
          }

          // 插入按钮行到合适位置
          const replyBtn = formTd.querySelector(
            'input[type="submit"], button[type="submit"]'
          )
          if (replyBtn) {
            formTd.insertBefore(buttonRow, replyBtn)
          } else {
            formTd.appendChild(buttonRow)
          }

          // 确保formTd使用正确的样式
          formTd.style.whiteSpace = 'nowrap'
          formTd.style.display = 'flex'
          formTd.style.alignItems = 'center'
          formTd.style.justifyContent = 'flex-end'
          formTd.style.flexWrap = 'nowrap'
        } else {
          // 如果按钮行已存在，将我们的按钮添加到最前面
          buttonRow.insertBefore(floorTriggerBtn, buttonRow.firstChild)
        }

        // 绑定颜文字按钮事件
        floorTriggerBtn.addEventListener('click', function (e) {
          e.stopPropagation()
          e.preventDefault()
          activeTextareaId = textarea.id
          toggleKaomojiBox(this)
        })

        // 标记为已处理
        processedFloors.add(floor)
      }, 500) // 额外延迟
    }

    // 确保按钮顺序正确
    function ensureButtonOrder(floor) {
      const buttonRow = floor.querySelector('.emoji-button-row')
      if (!buttonRow) return

      // 获取所有按钮
      const ourBtn = buttonRow.querySelector('.kaomoji-trigger-floor')
      const thirdPartyBtn = buttonRow.querySelector('.iconfont.pipe.z.reply')
      const defaultEmojiBtn = buttonRow.querySelector(
        '.iconfont.pipe.z:not(.reply)'
      )

      // 如果我们的按钮不在最前面，调整顺序
      if (ourBtn && buttonRow.firstChild !== ourBtn) {
        buttonRow.insertBefore(ourBtn, buttonRow.firstChild)
      }

      // 确保按钮顺序：我们的按钮 → 第三方按钮 → Discuz按钮
      const correctOrder = []
      if (ourBtn) correctOrder.push(ourBtn)
      if (thirdPartyBtn) correctOrder.push(thirdPartyBtn)
      if (defaultEmojiBtn) correctOrder.push(defaultEmojiBtn)

      // 重新排序
      correctOrder.forEach((btn) => {
        if (btn.parentNode === buttonRow && buttonRow.lastChild !== btn) {
          buttonRow.appendChild(btn)
        }
      })
    }

    // 切换颜文字盒子显示/隐藏
    function toggleKaomojiBox(triggerBtn) {
      const rect = triggerBtn.getBoundingClientRect()
      const isVisible = kaomojiBox.style.display === 'block'

      if (!isVisible) {
        kaomojiBox.style.display = 'block'

        // 计算位置
        let left = rect.left + window.scrollX
        let top = rect.bottom + window.scrollY + 5

        // 检查是否超出屏幕
        if (left + 480 > window.innerWidth) {
          left = window.innerWidth - 480 - 10
        }

        if (top + 360 > window.innerHeight + window.scrollY) {
          top = rect.top + window.scrollY - 360 - 5
        }

        kaomojiBox.style.left = Math.max(10, left) + 'px'
        kaomojiBox.style.top = Math.max(10, top) + 'px'
      } else {
        kaomojiBox.style.display = 'none'
      }

      // 隐藏右键菜单
      contextMenu.style.display = 'none'
    }

    // 渲染分类列表
    function renderCategories() {
      const categoriesContainer = document.getElementById(
        'categories-container'
      )
      if (!categoriesContainer) return

      categoriesContainer.innerHTML = ''

      Object.keys(kaomojiData).forEach((category) => {
        const categoryItem = document.createElement('div')
        categoryItem.className =
          category === currentCategory
            ? 'category-item active'
            : 'category-item'
        categoryItem.textContent = category
        categoryItem.title = category
        categoryItem.dataset.category = category

        // 左键点击切换分类
        categoryItem.addEventListener('click', function (e) {
          if (e.button === 0) {
            switchCategory(category)
          }
        })

        // 右键删除分类
        categoryItem.addEventListener('contextmenu', function (e) {
          e.preventDefault()
          e.stopPropagation()

          if (['日常', '开心', '无奈', '调皮', '爱心'].includes(category)) {
            showNotification('默认分类不能删除', 'warning')
            return
          }

          if (confirm(`删除分类 "${category}"？`)) {
            delete kaomojiData[category]
            GM_setValue('kaomojiData', kaomojiData)

            if (currentCategory === category) {
              currentCategory = Object.keys(kaomojiData)[0]
            }

            renderCategories()
            renderKaomojiGrid()
            showNotification('分类已删除')
          }
        })

        categoriesContainer.appendChild(categoryItem)
      })
    }

    // 切换分类
    function switchCategory(category) {
      currentCategory = category

      // 更新UI
      document.querySelectorAll('.category-item').forEach((item) => {
        item.classList.remove('active')
      })

      const activeItem = document.querySelector(
        `.category-item[data-category="${category}"]`
      )
      if (activeItem) {
        activeItem.classList.add('active')
      }

      // 更新标题
      document.getElementById('current-category-name').textContent = category

      // 渲染颜文字
      renderKaomojiGrid()
    }

    // 渲染颜文字网格
    function renderKaomojiGrid() {
      const kaomojiGrid = document.getElementById('kaomoji-grid')
      if (!kaomojiGrid) return

      kaomojiGrid.innerHTML = ''

      if (
        kaomojiData[currentCategory] &&
        kaomojiData[currentCategory].length > 0
      ) {
        kaomojiData[currentCategory].forEach((kaomoji, index) => {
          const item = document.createElement('div')
          item.className = 'kaomoji-item'
          item.textContent = kaomoji
          item.title = '点击插入'
          item.dataset.index = index

          // 左键点击插入颜文字
          item.addEventListener('click', function (e) {
            if (e.button === 0) {
              insertKaomoji(kaomoji)
            }
          })

          // 右键删除颜文字
          item.addEventListener('contextmenu', function (e) {
            e.preventDefault()
            e.stopPropagation()

            if (confirm(`删除颜文字 "${kaomoji}"？`)) {
              kaomojiData[currentCategory].splice(index, 1)
              GM_setValue('kaomojiData', kaomojiData)
              renderKaomojiGrid()
              showNotification('颜文字已删除')
            }
          })

          kaomojiGrid.appendChild(item)
        })
      } else {
        const emptyMsg = document.createElement('div')
        emptyMsg.className = 'empty-state'
        emptyMsg.textContent = '这个分类还没有颜文字'
        kaomojiGrid.appendChild(emptyMsg)
      }
    }

    // 插入颜文字到输入框
    function insertKaomoji(kaomoji) {
      // 首先尝试使用跟踪的活跃输入框ID
      let activeTextarea = document.getElementById(activeTextareaId)

      // 如果没找到，尝试获取当前焦点元素
      if (!activeTextarea) {
        activeTextarea = document.activeElement
        if (!activeTextarea || activeTextarea.tagName !== 'TEXTAREA') {
          // 备用方案：找到主回复框
          activeTextarea = document.getElementById('fastpostmessage')
        }
      }

      if (activeTextarea && activeTextarea.tagName === 'TEXTAREA') {
        const start = activeTextarea.selectionStart
        const end = activeTextarea.selectionEnd
        const text = activeTextarea.value

        activeTextarea.value =
          text.substring(0, start) + kaomoji + text.substring(end)
        activeTextarea.selectionStart = activeTextarea.selectionEnd =
          start + kaomoji.length
        activeTextarea.focus()

        // 触发输入事件
        activeTextarea.dispatchEvent(new Event('input', { bubbles: true }))
      }

      // 插入后隐藏颜文字盒子
      kaomojiBox.style.display = 'none'
      contextMenu.style.display = 'none'
    }

    // 显示对话框
    function showDialog(title, placeholder, callback) {
      document.getElementById('dialog-title').textContent = title
      document.getElementById('dialog-input').placeholder = placeholder
      document.getElementById('dialog-input').value = ''

      dialog.style.display = 'block'

      // 设置回调函数
      dialog.dataset.callback = 'callback_' + Date.now()
      window[dialog.dataset.callback] = callback

      document.getElementById('dialog-input').focus()
    }

    // 绑定事件 - 简化为单个添加
    function bindEvents() {
      // 添加颜文字按钮 - 简化为单个添加
      document
        .getElementById('add-kaomoji-btn')
        ?.addEventListener('click', function () {
          showDialog('添加颜文字', '输入一个颜文字', function (text) {
            if (text && text.trim()) {
              // 直接添加整个输入内容作为一个颜文字
              const kaomoji = text.trim()

              if (!kaomojiData[currentCategory]) {
                kaomojiData[currentCategory] = []
              }

              kaomojiData[currentCategory].push(kaomoji)
              GM_setValue('kaomojiData', kaomojiData)
              renderKaomojiGrid()
              showNotification('颜文字已添加')
            } else {
              showNotification('请输入颜文字', 'warning')
            }
          })
        })

      // 添加分类按钮
      document
        .getElementById('add-category-btn')
        ?.addEventListener('click', function () {
          showDialog('添加分类', '输入分类名称', function (name) {
            if (name && name.trim()) {
              if (!kaomojiData[name]) {
                kaomojiData[name] = []
                GM_setValue('kaomojiData', kaomojiData)
                renderCategories()
                switchCategory(name)
                showNotification(`分类"${name}"已创建`)
              } else {
                showNotification(`分类"${name}"已存在`, 'warning')
              }
            }
          })
        })

      // 对话框按钮事件
      document
        .getElementById('dialog-confirm')
        ?.addEventListener('click', function () {
          const text = document.getElementById('dialog-input').value
          const callbackName = dialog.dataset.callback
          if (callbackName && window[callbackName]) {
            window[callbackName](text)
            delete window[callbackName]
          }
          dialog.style.display = 'none'
        })

      document
        .getElementById('dialog-cancel')
        ?.addEventListener('click', function () {
          const callbackName = dialog.dataset.callback
          if (callbackName && window[callbackName]) {
            delete window[callbackName]
          }
          dialog.style.display = 'none'
        })

      // 回车确认，ESC取消
      document
        .getElementById('dialog-input')
        ?.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && e.ctrlKey) {
            document.getElementById('dialog-confirm').click()
          } else if (e.key === 'Escape') {
            document.getElementById('dialog-cancel').click()
          }
        })
    }

    // 显示通知
    function showNotification(message, type = 'success') {
      const oldNotification = document.querySelector('.kaomoji-notification')
      if (oldNotification) {
        oldNotification.remove()
      }

      const notification = document.createElement('div')
      notification.className = 'kaomoji-notification'
      if (type === 'warning') {
        notification.style.background = '#f0ad4e'
      }
      notification.textContent = message

      document.body.appendChild(notification)

      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove()
        }
      }, 1500)
    }

    // 页面加载完成后初始化
    function init() {
      setTimeout(() => {
        initKaomojiBox()
        addFloorTriggers()

        // 持续监听新的楼中楼
        const observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length > 0) {
              mutation.addedNodes.forEach(function (node) {
                if (node.nodeType === 1) {
                  // 检查是否是楼中楼
                  if (
                    node.classList &&
                    node.classList.contains('dxksst_floor')
                  ) {
                    processFloor(node)
                  }
                  // 检查是否包含楼中楼
                  const floors = node.querySelectorAll
                    ? node.querySelectorAll('.dxksst_floor')
                    : []
                  floors.forEach(processFloor)
                }
              })
            }
          })
        })

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        })

        // 定期检查已存在的楼中楼，确保按钮顺序正确
        setInterval(() => {
          document.querySelectorAll('.dxksst_floor').forEach((floor) => {
            // 确保我们的按钮存在
            if (!floor.querySelector('.kaomoji-trigger-floor')) {
              addKaomojiButtonToFloor(floor)
            } else {
              // 确保按钮顺序正确
              ensureButtonOrder(floor)
            }

            // 确保formTd的样式正确
            const formTd = floor.querySelector('form table td')
            if (formTd) {
              formTd.style.whiteSpace = 'nowrap'
              formTd.style.display = 'flex'
              formTd.style.alignItems = 'center'
              formTd.style.justifyContent = 'flex-end'
            }
          })
        }, 3000) // 增加检查间隔
      }, 2000) // 增加初始延迟
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init)
    } else {
      init()
    }
  }
  if (exchangeRegex.test(currentUrl)) {
    console.log('This is running on 血液献祭')
    let tdElement = document.querySelector('#exchangesubmit_btn').parentNode

    let inputField = document.createElement('input')
    inputField.setAttribute('type', 'text')
    inputField.setAttribute('id', 'myinput')
    inputField.setAttribute('placeholder', '兑换次数')
    inputField.classList.add('px')
    tdElement.appendChild(inputField)

    let customButton = document.createElement('button')
    customButton.textContent = '批量兑换'
    customButton.setAttribute('type', 'button')
    customButton.classList.add('pn')
    customButton.addEventListener('click', submitForm)
    tdElement.appendChild(customButton)
    function submitForm() {
      let times = parseInt(inputField.value)
      if (isNaN(times) || times <= 0) {
        showDialog('请输入有效的提交次数', 'notice')
        return
      } else {
        let exchangeBtn = document.getElementById('exchangesubmit_btn')
        document.getElementById('exchangeamount').value = '1'

        for (let i = 0; i < times; i++) {
          setTimeout(function () {
            exchangeBtn.click()
          }, i * 4000) // 4秒间隔
        }
      }
    }
  }
  if (myMedalRegex.test(currentUrl)) {
    const 是否自动开启茉香啤酒 = 0

    const linkList = {
      游戏男从: 'youxi',
      真人男从: 'zhenren',
      女从: 'Maid',
      装备: 'Equip',
      资产: 'Asset',
      宠物: 'Pet',
      板块: 'Forum',
      天赋: 'Skill',
      赠礼: 'Gift',
      咒术: 'Spell',
      剧情: 'Plot',
      奖品: 'Prize',
      储蓄: 'Deposit',
      装饰: 'Deco',
      薪俸: 'Salary',
      故事: 'Story',
      其他: 'other',
    }

    // 额外提供一个对象，存储每个键对应的数字
    const numbers = {
      游戏男从: 11,
      真人男从: 8,
      女从: 5,
      装备: 12,
      资产: 16,
      宠物: 7,
      板块: 5,
      天赋: 4,
      储蓄: 1,
      装饰: 6,
      薪俸: 1,
    }
    const formhash = document.querySelector('input[name="formhash"]').value
    // 勋章总类型
    const orderList = Object.keys(linkList)

    const categoriesData = {
      youxi: [
        '杰夫‧莫罗',
        '克里斯‧雷德菲尔德',
        '疾风剑豪',
        '光之战士',
        '百相千面',
        '苇名弦一郎',
        '艾吉奥',
        '弗图博士',
        '裸体克里斯',
        '凯登‧阿兰科',
        '果体76',
        '岛田半藏',
        '内森·德雷克',
        '卡洛斯·奥利维拉',
        '天照大神',
        '虎头怪',
        '希德法斯·特拉蒙',
        '诺克提斯·路西斯·伽拉姆',
        '尼克斯·乌尔里克',
        '文森特‧瓦伦丁',
        '炙热的格拉迪欧拉斯',
        '竹村五郎',
        '【周年限定】克里斯(8)',
        '沃特·沙利文',
        '里昂‧S‧甘乃迪',
        '亚瑟‧摩根',
        '萨菲罗斯',
        '克莱夫・罗兹菲尔德',
        '岛田源氏',
        'BIG BOSS',
        '狄翁・勒萨若',
        '【夏日限定】夏日的泰凯斯',
        'Dante',
        '库伦 (起源)',
        '康纳/Connor',
        '里昂（RE4）',
        '英普瑞斯',
        '乔纳森·里德',
        'Doc',
        '杰克·莫里森/士兵 76',
        '维吉尔',
        '皮尔斯‧尼凡斯',
        '杰西·麦克雷',
        '泰比里厄斯',
        'Vergil',
        '普隆普特·阿金塔姆',
        '桐生一马',
        '格拉迪欧拉斯',
        '亚当‧简森',
        '桑克瑞德·沃特斯',
        '铁牛',
        '黑墙',
        '安杜因·乌瑞恩',
        '阿尔伯特·威斯克',
        'V (DMC5)',
        '汉克/Hank',
        '希德‧海温特',
        '巴尔弗雷亚',
        '肥皂',
        '士官长',
        '豹王',
        '阿列克西欧斯（Alexios）',
        '莱因哈特·威尔海姆',
        '幻象',
        '加勒特·霍克',
        '不灭狂雷-沃利贝尔',
        '泰凯斯·芬得利',
        '陷阱杀手',
        'Scott Ryder',
        '不屈之枪·阿特瑞斯',
        '詹姆斯‧维加',
        '阿尔萨斯‧米奈希尔',
        '盖拉斯‧瓦卡瑞安',
        '法卡斯',
        '库伦 (审判)',
        '【新手友好】昆進',
        '鬼王酒吞童子',
        '维克多‧天火',
        '蛮族战士',
        '奧倫',
        '吉姆‧雷诺',
        '但丁',
        '威尔卡斯',
        '亚力斯塔尔',
        '艾德尔',
        '约书亚・罗兹菲尔德',
        '古烈',
        '【新春限定】果体 隆',
        '巴哈姆特',
        '“半狼”布莱泽',
        '炽焰咆哮虎',
        '傲之追猎者·雷恩加尔',
        '本・比格',
        '高桥剑痴',
      ],
      zhenren: [
        '托尼·史塔克',
        'Joker',
        '克里斯·埃文斯',
        '魯杰羅·弗雷迪',
        '虎克船长',
        '纣王·子受',
        '安德森‧戴维斯',
        '索尔·奥丁森',
        '擎天柱（Peterbilt389）',
        '麦迪文（Medivh）',
        '西弗勒斯·斯内普',
        '神灯',
        '索林·橡木盾',
        '阿拉贡',
        '乔治·迈克尔',
        '阿齐斯',
        '魔术师奥斯卡',
        '杰森‧斯坦森',
        '小天狼星·布莱克',
        '阿不思·邓布利多',
        '甘道夫',
        '博伊卡',
        '死亡',
        '克劳斯·迈克尔森',
        '莱昂纳多·迪卡普里奥',
        '马克·史贝特',
        '史蒂文·格兰特',
        '尼克·王尔德',
        '亚瑟·库瑞（海王）',
        '巴基 (猎鹰与冬兵)',
        '哈尔‧乔丹',
        '克苏鲁',
        '异形',
        '卢西亚诺‧科斯塔',
        '罗宾·西克',
        '超人',
        '丹·雷诺斯',
        '罗伯‧史塔克',
        '蓝礼·拜拉席恩',
        '卡德加（Khadgar）',
        '吉姆·霍普',
        '大古',
        '黑豹',
        '莱托·厄崔迪',
        'Drover',
        '艾利克斯',
        '阿尔瓦罗·索莱尔',
        '三角头',
        '布莱恩‧欧康纳',
        '迪恩‧温彻斯特',
        '山姆‧温彻斯特',
        '丹尼爾·紐曼',
        '迈克尔迈尔斯',
        '金刚狼',
        'Chris Mazdzer',
        '瑟兰迪尔',
        '威克多尔·克鲁姆',
        '大黄蜂（ChevroletCamaro）',
        '勒维恩·戴维斯',
        '安德鲁·库珀',
        '丹·安博尔',
        '塞巴斯蒂安·斯坦',
        '莱戈拉斯',
        '奥利弗‧奎恩',
        '盖里',
        '汤姆·赫兰德',
        'Frank (LBF)',
        '詹米·多南',
        '羅素·托維',
        '藤田優馬',
        '康纳‧沃什',
        '巴特‧贝克',
        '戴尔‧芭芭拉',
        '猫化弩哥',
        '卡斯迪奥',
        '史蒂夫‧金克斯',
        '戴蒙‧萨尔瓦托',
        '尼克·贝特曼',
        '尤利西斯',
        '奇异博士',
        '托比·马奎尔',
        '汉尼拔',
        'John Reese',
        '穿靴子的猫',
        '狗狗',
        '约翰·康斯坦丁',
        '亨利.卡维尔',
        '牛局长博戈',
        '基努·里维斯',
      ],
      Maid: [
        '梅格',
        '贝优妮塔',
        '莫瑞甘',
        '莎伦',
        '绯红女巫',
        '赫敏·格兰杰',
        '蒂法·洛克哈特',
        '山村贞子',
        '九尾妖狐·阿狸',
        '丹妮莉丝·坦格利安',
        '希尔瓦娜斯·风行者',
        '刀锋女王',
        '维涅斯',
        '星籁歌姬',
        '莫甘娜',
        '凯尔',
        '露娜弗蕾亚·诺克斯·芙尔雷',
        '凯特尼斯·伊夫狄恩',
        '爱丽丝·盖恩斯巴勒',
        '朱迪·霍普斯',
        '“米凯拉的锋刃”玛莲妮亚',
        '吉尔·沃瑞克',
        '叶卡捷琳娜',
        '阿丽塔',
        '梅琳娜Melina',
        '贝儿(Belle)',
        '阿加莎·哈克尼斯',
        '红夫人',
        '莉莉娅·考尔德（Lilia Calderu）',
        '琴.葛蕾',
        'Honey B Lovely',
      ],
      Equip: [
        '嗜血斩首斧',
        '符文披风',
        '净化手杖',
        '十字叶章',
        '刺杀者匕首',
        '药剂背袋',
        '重磅手环',
        '超级名贵无用宝剑',
        '念念往日士官盔',
        '圣英灵秘银甲',
        '布衣',
        '艾尔尤因',
        '神圣十字章',
        '重新充能的神圣十字章', // 某次活动的产出
        '新月护符',
        '骑士遗盔',
        '变形软泥',
        '山猫图腾',
        '猎鹰图腾',
        '眼镜蛇图腾',
        '守望者徽章',
        '石鬼面',
        '冒险专用绳索',
        '赫尔墨斯·看守者之杖',
        '巴啦啦小魔仙棒',
        '十字军护盾',
        '龙血之斧',
        '蔷薇骑士之刃',
        '狩猎用小刀',
        '钢铁勇士弯刀',
        '海盗弯钩',
        '生锈的海盗刀枪',
        '日荒戒指',
        '月陨戒指',
        '星芒戒指',
        '琉璃玉坠',
        '武士之魂',
        '力量腕带',
        '物理学圣剑',
        '男用贞操带',
        '贤者头盔',
        '恩惠护符',
        '超级幸运无敌辉石',
        '破旧打火机',
        '女神之泪',
        '和谐圣杯',
        '天使之赐',
        '棱镜',
        '射手的火枪',
        '坏掉的月亮提灯',
        '装了衣物的纸盒',
        '肃弓',
        '圣诞有铃',
        '普通羊毛球',
        '圣水瓶',
        '黑暗封印',
        '枯木法杖',
        '千年积木',
        '被冰封的头盔',
      ],
      Asset: [
        '知识大典',
        '微笑的面具',
        '种植小草',
        '聚魔花盆',
        '金钱马车',
        '流失之椅',
        '漂洋小船',
        '种植菠菜',
        '夜灯',
        '诺曼底号',
        '充满魔力的种子',
        '木柴堆',
        '暗红矿土',
        '神秘的邀请函',
        '锻造卷轴',
        '奇怪的紫水晶',
        '预知水晶球',
        '发芽的种子',
        '史莱姆养殖证书',
        '这是一片丛林',
        '种植菊花',
        '婴儿泪之瓶',
        '雪王的心脏',
        '勇者与龙之书',
        '章鱼小丸子',
        '浪潮之歌',
        '迷之瓶',
        '德拉克魂匣',
        '圣甲虫秘典',
        '红石',
        '幽灵竹筒',
        '神秘的红茶',
        '种植土豆',
        '用过的粪桶',
        '箭术卷轴',
        '【圣诞限定】心心念念小雪人',
        '魔法石碑',
        '远古石碑',
        '冒险用面包',
        '海螺号角',
        '沙漠神灯',
        '老旧的怀表',
        '冒险用指南针',
        '暖心小火柴',
        '神秘的漂流瓶',
        '冒险用绷带',
        '宝箱内的球',
        'SCP-s-1889',
        'GHOST',
        'GM論壇初心者勛章',
        '社畜专用闹钟',
        '冒险用宝箱',
        '羽毛笔',
        '超级无敌名贵金卡',
        'One Ring',
        '秘密空瓶',
        '梦中的列车',
        '双项圣杯',
        '散佚的文集',
        '令人不安的契约书',
        '被尘封之书',
        '黑暗水晶',
        '无垠',
        '冰海钓竿',
        '神秘挑战书',
        '半生黄金种',
        '羽毛胸针',
        '神秘天球',
        '婚姻登记册',
        '健忘礼物盒',
        '弯钩与连枷',
        '尼特公仔',
        '辉夜姬的五难题',
        '末影珍珠',
        '无限魔典',
        '基础维修工具',
      ],
      Pet: [
        '洞窟魔蛋',
        '迷のDoge',
        '史莱姆蛋',
        '红龙蛋',
        '黑龙蛋',
        '腐化龙蛋',
        '漆黑的蝎卵',
        '【年中限定】GM村金蛋',
        '结晶卵',
        '暮色卵',
        '青鸾蛋',
        '电磁卵',
        '珊瑚色礁石蛋',
        '月影蛋',
        '马戏团灰蛋',
        '郁苍卵',
        '熔岩蛋',
        '灵鹫蛋',
        '血鹫蛋',
        '软泥怪蛋',
        '螺旋纹卵',
        '万圣彩蛋',
        '幽光彩蛋',
        '沙漠羽蛋',
        '林中之蛋',
        '五彩斑斓的蛋',
        '血红色的蛋',
        '海边的蛋',
        '新手蛋',
        '【限定】深渊遗物', // 是奖品升级而来的宠物
        '小阿尔的蛋',
        '狱炎蛋',
        '灵藤蛋',
        '棕色条纹蛋',
        '长花的蛋',
        '可疑的肉蛋',
        '崩朽龙卵',
        '波纹蓝蛋',
        '吸血猫蛋',
        '脏兮兮的蛋',
        '双生蛋',
        '图书馆金蛋',
        '大侦探皮卡丘',
      ],
      Forum: [
        '质量效应三部曲',
        '五花八门版块',
        '辐射：新维加斯',
        '上古卷轴V：天际',
        '龙腾世纪：审判',
        '堕落飨宴',
        '奥兹大陆',
        '生化危机：复仇',
        '荒野大镖客：救赎 II',
        'TRPG版塊',
        '模擬人生4',
        '达拉然',
        '艾尔登法环',
        '雾都血医',
        '寶可夢 Pokémon',
        '最终幻想XIV',
        '赛博朋克2077',
        '恶魔城',
        '英雄联盟',
        '男巫之歌',
        '时间变异管理局',
        '美恐：启程',
        '街头霸王',
        '最终幻想XVI',
        '雄躯的昇格',
        '极客的晚宴',
        'Zootopia',
        '都市：天际线2',
        '黑神话:悟空',
        '黑暗之魂系列',
        '女巫之路',
      ],
      Gift: [
        '送情书',
        '丢肥皂',
        '千杯不醉',
        '灵光补脑剂',
        // "贞洁内裤", // 已下架
        '遗忘之水',
        '萨赫的蛋糕',
        '神秘商店贵宾卡',
        '变骚喷雾',
        '没有梦想的咸鱼',
        '闪光糖果盒',
        '茉香啤酒',
        '香蕉特饮', //某次活动限定
        '枕套幽灵', //2024年万圣节限定
      ],
      Spell: [
        '炼金之心',
        '黑暗交易',
        '水泡术',
        '召唤古代战士',
        '祈祷术',
        '吞食魂魄',
        '咆哮诅咒',
        '霍格沃茨五日游',
        '石肤术',
        '雷霆晶球',
        '思绪骤聚',
        '杀意人偶',
        '太空列车票',
      ],
      Skill: [
        '牧羊人',
        '森林羊男',
        '堕落之舞',
        '黄色就是俏皮',
        '骑兽之子',
        '禽兽扒手',
        '野兽之子',
        '四季之歌',
        '风雪之家',
        '男色诱惑',
        '海边的邻居',
        '五谷丰年',
      ],
      Story: [
        '被祝福の新旅程',
        '另一个身份',
        '神之匠工',
        '倒吊人(The Hanged Man , XII)',
        '战车(The Chariot , VII)',
        '恋人(The Lovers，VI)',
        '魔术师（The Magician，I）',
        '恋恋小烹锅',
        '晃晃悠悠小矿车',
        '巴比伦辞典',
      ],
      Salary: [
        // "Chris Redfield in Uroboros",
        '站员薪俸',
        '实习版主薪俸',
        '版主薪俸',
        '站员: 保卫领土',
        '见习版主: 神的重量',
        '版主: 一国之主',
      ],
      Deposit: [
        '白猪猪储蓄罐㊖',
        '粉猪猪储蓄罐㊖',
        '金猪猪储蓄罐㊖',
        '不起眼的空瓶',
      ],
      // [...document.querySelectorAll('.myimg img')].map(e=>e.alt)
      Deco: [
        '纯真护剑㊕',
        '爬行植物Ⓛ',
        '爬行植物Ⓡ',
        '特殊-家园卫士Ⓛ',
        '特殊-家园卫士Ⓡ',
        '勋章空位插槽',
        '16x43 隐形➀',
        '16x43 隐形➁',
        '20x43 隐形➀',
        '20x43 隐形➁',
        '40x43 隐形➀',
        '40x43 隐形➁',
        '82x43 隐形➀',
        '82x43 隐形➁',
        '124x43 隐形➀',
        '124x43 隐形➁',
        '装饰触手Ⓛ',
        '装饰触手Ⓡ',
      ],
      // 『浪客便当』『酒馆蛋煲』勋章博物馆搜不到，但是还是保留 兔兔说，限时活动是不会在博物内留档的
      Plot: [
        '『酒馆蛋煲』',
        '『浪客便当』',

        '『还乡歌』',
        '『日心说』',
        '『任天堂Switch』红蓝√',
        '『任天堂Switch』灰黑√',
        '『私有海域』',
        '『钜鲸』',
        '『召唤好运的角笛』',
        '『圣洁化身』',
        '『矩阵谜钥Ⓖ』',
        '『新居手册Ⓖ』',
        '『居住证: Lv2~6』',
        '『户口本: Lv7+』',
        '『瓶中信』',
        '『弗霖的琴』',
        '『伊黎丝的祝福』',
        '『灰域来音』',
        '『迷翳之中』',
        '『迷翳森林回忆录』',
        '『星河碎片』',
        '『金色车票』',
        '『列车长』',
        '『不败之花』',
        '『先知灵药』',
        '『流星赶月』',
        '『分析天平』',
        '『钟楼日暮』',
        '『泥潭颂唱者』',
        '『逆境中的幸运女神』',
        '『南瓜拿铁』',
        '『冰雕马拉橇』',
        '『搓粉团珠』',
        '『道具超市』',
        '『绿茵甘露』',
        '『凯旋诺书』',
        '『转生经筒』',
        '『林中过夜』',
        '『厢庭望远』',
        '『狄文卡德的残羽』',
      ],
      Prize: [
        '深渊遗物',
        '一只可爱的小猫',
        '猫眼',
        '謎の男',
        'TRPG纪念章',
        '迷之瓶',
        '海上明月',
        '铁杆影迷',
        '泡沫浮髅(Squirt)',
        '秘密森林',
        '心之水晶',
        '天涯.此时',
        '月亮的蛋',
        '传承之证',
        '新年小猴',
        '华灯初上',
        '网中的皮卡丘',
        '龙之魂火',
        '红龙精华',
        '红龙秘宝',
        '秋水长天',
        '莱托文本残页',
        '德拉克的遗物',
        '不败之花',
        '迷之天鹅',
        '月上柳梢',
        '血石',
        '掌中雪球瓶',
        '猫猫幽灵',
        '万圣南瓜',
        '神秘的礼物',
        '老旧的书籍',
        '枯黄的种苗',
        '云上之光',
        '魔法灵药',
        '波板糖',
        'GM村蛋糕',
        '缘定仙桥',
        '小小行星',
        '闪耀圣诞球',
        '压箱底的泡面',
        '孔明灯',
        '生命树叶',
        '玄生万物',
        '海的记忆',
        '海与天之蛋',
        '奇思妙想',
        '旅行骰子！',
        '红心玉',
        '牌中小丑',
        '黑夜之星',
        '追击者',
        '传送镜',
        '风物长宜',
        '小小舞台',
        '探险三杰士',
        '白巧克力蛋',
        '猛虎贴贴',
        '绿茵宝钻',
        '肉垫手套',
        '龙之秘宝',
        '图腾饼干',
        '重建熊屋',
        '六出冰花',
        '特供热巧',
        '岛屿探险家',
        '征服之王',
        '龙鳞石',
        '幽浮起司堡',
        '一只陶瓮',
        '阿怪',
        '照相机',
        '金翼使(30d)',
        '金翼使㊊',
        '变身器',
        '近地夜航',
        '巨力橡果(30d)',
        '巨力橡果㊊',
        '古老金币',
        '不洁圣子',
        '小小安全帽',
        '金牌矿工',
        '御医神兔',
        '脉律辐石',
        '劫掠核芯',
        '幸运女神的微笑',
        '梅克军徽',
        '奎兰',
        '水银日报社特约调查员',
        // 2025年之后的新奖品
        '银色溜冰鞋',
        '永亘环',
        '小狮欢舞',
        '神奇宝贝大师球',
        '神奇宝贝图鉴',
        '猫咪点唱机㊊',
        '肉乖乖',
        '灵魂残絮聚合法',
        '猫头鹰守卫',
        '鎏彩万幢',
        '呆猫',
        '传说中的黑龙',
        '检定场',
        '命运的轮廓',
        '灯载情绵',
        '桂花米糕',
        '德罗瑞安',
        '悬浮滑板',
        '发条八音盒',
        '弗雷迪玩偶',
        '河豚寿司',
        '荧光水母',
      ],
    }
    // 2025年元旦活动新增的类别，期间限定的临时活动勋章
    // 不能放进categoriesData，会干扰排序，就单独放在这里做纪念吧
    // 新春活动也出现了这个类别，并且出现了多次，说明这是一个活动专属类别
    // 无需在意、无需记录、摸了
    const Events = [
      // 2023-2024年的期间限定勋章
      // https://www.gamemale.com/forum.php?mod=viewthread&tid=137437
      '香浓罗宋汤', // https://img.gamemale.com/album/202412/31/230448aspoeushzeup66kf.gif
    ]

    // 可赠送勋章列表（英文变量名使用 GiftableBadges）
    const GiftableBadges = [
      '没有梦想的咸鱼',
      '灵光补脑剂',
      '茉香啤酒',
      '咆哮诅咒',
      '丢肥皂',
      '千杯不醉',
      '变骚喷雾',
      '送情书',
      '霍格沃茨五日游',
      '神秘商店贵宾卡',
      '闪光糖果盒',
      '萨赫的蛋糕',
      '遗忘之水',
      '炼金之心',
      '石肤术',
      '召唤古代战士',
      '水泡术',
      '思绪骤聚',
      '雷霆晶球',
      '杀意人偶',
    ]

    // 临时把所有的真人勋章名字都加上点
    categoriesFormat(categoriesData)

    // 预处理名称到分类的映射（包含全角/半角转换）
    const nameCategoryMap = new Map()
    for (const [category, names] of Object.entries(categoriesData)) {
      for (const name of names) {
        // 同时存储两种符号格式的键
        const variants = [name.replace(/·/g, '‧'), name.replace(/‧/g, '·')]
        variants.forEach((v) => nameCategoryMap.set(v, category))
      }
    }

    // 创建一个新的div元素用于管理徽章
    initbadgeManage()

    // 别人的勋章分类展示和回帖期望计算
    // badgeOrder()
    // 自己优化的代码（AI优化的）
    optimizedBadgeOrder()

    // 默认关闭回收功能
    createLink('显示/隐藏回收按钮', setHuiShou)
    setHuiShou('init')

    // 勋章排序
    createLink('按照类型排序', kindOrder)

    //新增按钮保存/还原勋章顺序
    createLink('保存勋章顺序', saveKeysOrder)
    createLink('还原勋章顺序', loadKeysOrder)

    // 单个勋章一键续期
    oneClickRenew()

    // 给所有可续期的咒术勋章续期
    createLink('续期所有咒术勋章', oneClickAllSpell)

    // 一键关闭赠礼/咒术类勋章显示
    createLink('关闭赠礼/咒术勋章显示', oneClickDisplay)
    createLink('关闭所有勋章显示', closeAllDisplay)

    // 设置勋章提醒
    createLink('设置预设勋章提醒', showDialog)

    if (是否自动开启茉香啤酒) {
      自动开启茉香啤酒()
    }

    // 记录展示勋章/置顶展示勋章
    if (discuz_uid == 723150) {
      createLink('记录展示勋章', saveTopMedal)
      createLink('置顶展示勋章', loadTopMedal)
      showTopMedal()
      observeElement()
    }

    /* =============================================================================================================== */

    // 创建一个新的div元素用于管理徽章
    function initbadgeManage() {
      const badgeManagerDiv = document.createElement('div')
      badgeManagerDiv.className = 'badge-manager'
      badgeManagerDiv.innerHTML =
        '<h2>徽章管理</h2><p>这里可以管理您的徽章。</p><div class="badge-manager-button"><div>'

      const badgeOrderDiv = document.createElement('div')
      badgeOrderDiv.className = 'badge-order'
      badgeOrderDiv.innerHTML =
        '正在计算您拥有的徽章类型和价值，请稍等。。。如果长期没有加载，可能是你的其他插件报错影响了本插件的正常运行，请逐个关闭其他插件进行排查'

      // 获取目标div并在其前面插入新创建的div
      const targetDiv = document.querySelector('.my_fenlei')
      targetDiv.parentNode.insertBefore(badgeManagerDiv, targetDiv)
      badgeManagerDiv.appendChild(badgeOrderDiv)
      // targetDiv.parentNode.insertBefore(badgeOrderDiv, badgeManagerDiv);

      // 在这里添加您的自定义样式
      const customStyles = `
        .badge-manager {
            background-color: #f0f0f0; /* 背景颜色 */
            padding: 10px;             /* 内边距 */
            margin-bottom: 10px;       /* 底部外边距 */
            border: 1px solid #ccc;    /* 边框 */
            color: #333;               /* 字体颜色 */
        }

        .badge-manager h2 {
            margin: 0;                /* 去掉默认的外边距 */
            font-size: 18px;          /* 标题字体大小 */
            color: #007BFF;           /* 标题颜色 */
        }

        .badge-manager p {
            margin: 5px 0;
        }

        .badge-order {
            margin: 5px 0;
        }

        .badge-order p {
            margin: 0;
        }

        .custom-button {
            padding: 5px 10px;
            margin: 5px;
            margin-left: 0px;
            background-color: #007BFF;        /* 按钮背景颜色 */
            color: white;                      /* 字体颜色 */
            border: none;                      /* 去掉默认边框 */
            border-radius: 5px;               /* 圆角 */
            cursor: pointer;                   /* 鼠标悬停时显示手型 */
        }

        .custom-button:hover {
            background-color: #0056b3;        /* 悬停时的背景颜色 */
        }

        .message-item {
            position: fixed;
            top: 10px;
            left: 10px;
            background-color: #4caf50;
            color: white;
            padding: 10px;
            z-index: 1000;
        }

        .myfldiv{
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
        }
    `

      // 新皮肤，白色主题
      // GM_addStyle 没有删除功能 搁置
      const whiteStyles = `
        .badge-manager {
            background-color: #f0f0f0; /* 背景颜色 */
            padding: 10px;             /* 内边距 */
            margin-bottom: 10px;       /* 底部外边距 */
            border: 1px solid #ccc;    /* 边框 */
            font-family: Arial, sans-serif; /* 字体 */
            color: #333;               /* 字体颜色 */
        }

        .badge-manager h2 {
            margin: 0;                /* 去掉默认的外边距 */
            font-size: 18px;          /* 标题字体大小 */
            color: #007BFF;           /* 标题颜色 */
        }

        .badge-manager p {
            margin: 5px 0;
        }

        .custom-button {
            background-color: transparent;
            border: 0.125em solid #1A1A1A;
            border-radius: 0.6em;
            color: #3B3B3B;
            font-size: 14px;
            font-weight: 600;
            margin: 0.4em 0.8em 0.4em 0;
            padding: 0.4em 1.2em;
            text-align: center;
            text-decoration: none;
            transition: all 300ms cubic-bezier(.23, 1, 0.32, 1);
            font-family: Noto Sans SC, Microsoft Yahei, Arial, sans-serif;
        }

        .custom-button:hover {
            color: #fff;
            background-color: #1A1A1A;
            box-shadow: rgba(0, 0, 0, 0.25) 0 8px 15px;
            transform: translateY(-2px);
        }

        .custom-button:active {
            box-shadow: none;
            transform: translateY(0);
        }

        .message-item {
            position: fixed;
            top: 10px;
            left: 10px;
            background-color: white;
            color: #333;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 1000;
            font-weight: bold;
            font-size: 16px;
            font-family: 'Noto Sans SC', 'Microsoft Yahei', Arial, sans-serif;
        }
    `
      const TopMedalContainer = `
        .appl .TopMedal-container img {
            margin: 4px 2px 0 0;
        }
        .TopMedal-container {
            width: 130px;
        }

        .TopMedal-container__Fixed {
            position: fixed;
            top: 40px;
        }
        `
      GM_addStyle(customStyles)
      GM_addStyle(TopMedalContainer)
    }

    // 添加功能按钮
    function createLink(label, onClickMethod) {
      const button = document.createElement('button')
      button.className = 'custom-button'
      button.textContent = label
      button.onclick = (event) => {
        event.preventDefault() // 阻止默认行为
        onClickMethod() // 调用自定义方法
      }

      // 将链接添加到页面的 body 中
      const my_biaoti = document.querySelector('.badge-manager-button')
      my_biaoti.appendChild(button)
    }

    // 设置回收按钮
    function setHuiShou(init) {
      let isShow
      document.querySelectorAll('.my_fenlei button.pn').forEach((element) => {
        if (element.innerText == '回收') {
          // 初始化干掉
          if (init) {
            element.style.display = 'none'
            element.parentElement.style.display = 'none'
          } else {
            // 检查元素的display属性
            if (
              element.style.display === 'none' ||
              getComputedStyle(element).display === 'none'
            ) {
              // 如果是none，则显示元素和其父元素
              element.style.display = 'inline'
              element.parentElement.style.display = 'inline' // 显示父元素
              isShow = true
              // alert('回收按钮已显示')
            } else {
              // 否则隐藏元素和其父元素
              element.style.display = 'none'
              element.parentElement.style.display = 'none' // 隐藏父元素
              isShow = false
              // alert('回收按钮已隐藏')
            }
          }
        }
      })

      if (!init) {
        alert(`${isShow ? '回收按钮已显示' : '回收按钮已隐藏'}`)
      }
    }

    // 勋章排序
    function kindOrder() {
      // 获取所有匹配的元素
      const elements = document.querySelectorAll('.my_fenlei .myblok')
      const elementsArray = Array.from(elements)

      // 使用 map 函数处理每个元素
      const xunzhangList = elementsArray.map((myBlock) => {
        const key = myBlock.getAttribute('key')
        const nameElement = myBlock.querySelector('p b') // 找到包含名称的 <b> 标签
        const name = nameElement ? nameElement.textContent : ''
        return { [name]: key }
      })
      // 使用 reduce 合并字典
      const mergedDict = xunzhangList.reduce((acc, curr) => {
        return { ...acc, ...curr }
      }, {})

      // 填补未知的勋章
      const mergedDictKey = Object.keys(mergedDict)
      const allCategoriesData = Object.values(categoriesData).flat()
      categoriesData.other = findUniqueValues(mergedDictKey, allCategoriesData)

      function findUniqueValues(a, b) {
        // 将数组 b 转换为一个 Set，以提高查找效率
        const setB = new Set(b)

        // 过滤出在 a 中且不在 b 中的值
        const uniqueValues = a.filter((value) => !setB.has(value))

        return uniqueValues
      }

      const previousInput =
        localStorage.getItem('sortInput') || orderList.join(' ')

      // 弹出输入框，默认值为之前的内容
      const userInput = prompt(
        '您正在进行一键排序，是否需要修改排序顺序（用空格分隔）:',
        previousInput
      )

      // 如果用户输入了内容
      if (userInput !== null) {
        // 将输入的内容转换为数组并进行排序
        const sortedArray = userInput.split(' ').map((item) => item.trim())

        // 验证用户输入的合理性，如果不全或者输入错误，就给他补全
        // 过滤 userInput，保留在 orderList 中的项
        const filteredInput = sortedArray.filter((item) =>
          orderList.includes(item)
        )

        // 找出 orderList 中缺失的元素
        const missingItems = orderList.filter(
          (item) => !filteredInput.includes(item)
        )

        // 将 filteredInput 和 missingItems 合并，missingItems 加在最后
        const resultInput = [...filteredInput, ...missingItems]

        // 保存到 localStorage
        localStorage.setItem('sortInput', resultInput.join(' '))

        // 按类别拼接对应的Key
        const order1 = sortedArray.map((e) => categoriesData[linkList[e]])
        const order2 = [].concat(...order1)
        const result = order2
          .map((key) => mergedDict[key])
          .filter((value) => value !== undefined)

        postNewOrder(result)

        // 输出排序后的结果
        // alert("排序后的结果:\n" + sortedArray.join(', '));
      }
    }

    // 保存勋章顺序
    function saveArrayToLocalStorage(key, array) {
      localStorage.setItem(key, JSON.stringify(array))
    }

    // 从本地存储获取数组
    function getArrayFromLocalStorage(key) {
      const storedArray = localStorage.getItem(key)
      return storedArray ? JSON.parse(storedArray) : null
    }

    // 从本地存储删除数组
    function removeArrayFromLocalStorage(key) {
      localStorage.removeItem(key)
    }

    // 获取所有具有指定类名的div元素
    function getKeysFromDivs() {
      // 使用querySelectorAll获取所有带有该类的div
      const divs = document.querySelectorAll(`div.myblok`)

      // 提取每个div的key属性并返回数组
      // key 已经过时了，该返回div的name了
      const keys = Array.from(divs).map((div) => div.querySelector('img').alt)

      return keys
    }

    // 保存勋章顺序
    function saveKeysOrder() {
      const keys = getKeysFromDivs()
      saveArrayToLocalStorage('keyOrder', keys)
      alert('保存成功')
    }

    // 把存储的name转化成key并输出
    function loadKeysOrder() {
      const name = getArrayFromLocalStorage('keyOrder')
      const orderKey = NameToKey(name)
      postNewOrder(orderKey)
    }

    // 把存储的Name转化为Key
    function NameToKey(keys) {
      const divs = document.querySelectorAll(`div.myblok`)
      const array = Array.from(divs).map((div) => {
        return {
          name: div.querySelector('img').alt,
          key: div.getAttribute('key'),
        }
      })

      // 按照 name排序
      // 创建 name 到 key 的索引映射
      const indexMap = {}
      keys.forEach((value, index) => {
        indexMap[value] = index + 1
      })

      // 根据映射对 array 排序
      array.sort((a, b) => {
        return (indexMap[a.name] || Infinity) - (indexMap[b.name] || Infinity)
      })
      const orderKey = array.map((e) => e.key)
      return orderKey
    }

    // 输出新的排序
    function postNewOrder(newOrder) {
      const url =
        'https://www.gamemale.com/plugin.php?id=wodexunzhang:showxunzhang'
      // 创建FormData对象
      const formData = new FormData()
      const data = { newOrder, action: 'newOrder' }

      // 将数据添加到formData
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          formData.append(key, data[key])
        }
      }

      // 使用fetch发送POST请求
      fetch(url, {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          // alert('还原勋章顺序成功，点击确认后刷新页面')
          location.reload()

          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          // return response.json(); // 或根据需要返回其他格式
        })
        .then((data) => {
          console.log('Success:', data)
        })
        .catch((error) => {
          console.error('Error:', error)
        })
    }

    function oneClickRenew() {
      // 获取所有的按钮元素
      const buttons = document.querySelectorAll('button.pn')

      buttons.forEach((button) => {
        // 检查onclick属性是否包含'可续期'
        if (button.innerText == '可续期') {
          // 创建新的一键续期按钮
          const newButton = document.createElement('button')
          const userMedalid = button.getAttribute('onclick').match(/\d+/g)[0]
          const titleElement = button
            .closest('.myimg')
            .querySelector('img[alt]')
          const name = titleElement.getAttribute('alt')

          newButton.type = 'button'
          newButton.className = 'pn'
          newButton.innerHTML = '<em>一键续期</em>'
          newButton.onclick = function () {
            // 弹出提示框询问续期多少次
            const times = prompt(
              `您正在为【${name}】一键续期，请输入续期次数：`,
              '1'
            )
            const count = parseInt(times)

            // 判断输入是否合法
            if (isNaN(count) || count <= 0) {
              alert('请输入有效的次数！')
              return
            }

            repeatRequest(count, 3000, userMedalid)
          }
          // 创建一个<p>标签来包裹新按钮
          const p = document.createElement('p')
          p.appendChild(newButton)

          // 将<p>标签插入到原按钮的父元素的父元素后面，并紧贴
          button.parentNode.insertAdjacentElement('afterend', p)
        }
      })
    }

    // 给单个勋章续期
    function postRenew(userMedalid) {
      if (!userMedalid) return
      const url =
        'https://www.gamemale.com/plugin.php?id=wodexunzhang:showxunzhang'
      const data = { formhash, action: 'xuqi', jishoujiage: '', userMedalid }
      const formData = objectToFormData(data)

      return fetch(url, { method: 'POST', body: formData })
    }

    // 模拟网络请求的函数
    async function makeRequest(userMedalid) {
      try {
        // 假设这是一个真实的 API URL
        const response = await postRenew(userMedalid)

        // if (!response.ok) {
        //     throw new Error('网络请求失败');
        // }

        const data = await response.text()
        console.log('请求已发送:', data) // 打印响应数据
        return data // 返回请求结果
      } catch (error) {
        console.error('请求出错:', error)
        throw error // 抛出错误以供调用者处理
      }
    }

    // 显示提示信息的函数
    function showMessage(message) {
      const messageDiv = document.createElement('div')
      messageDiv.textContent = message
      messageDiv.className = 'message-item'

      document.body.appendChild(messageDiv)

      // 自动消失
      setTimeout(() => {
        document.body.removeChild(messageDiv)
      }, 3000) // 3秒后消失
    }

    // 重复请求的函数
    async function repeatRequest(times, interval, userMedalid) {
      for (let i = 0; i < times; i++) {
        try {
          if (Array.isArray(userMedalid)) {
            await makeRequest(userMedalid[i])
          } else {
            await makeRequest(userMedalid)
          }

          showMessage(`共需${times}次，已经请求 ${i + 1} 次`)
        } catch (error) {
          showMessage(`请求 ${i + 1} 失败: ${error.message}`)
        }

        // 等待间隔
        if (i < times - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval)) // 等待间隔
        }
      }
      showMessage('一键续期已完成，3秒后刷新页面')
      setTimeout(() => {
        location.reload()
      }, 3000) // 3秒后消失
      // console.log("所有请求已完成");
    }

    // 一键给所有可续期的咒术勋章续期
    function oneClickAllSpell() {
      const myblok = document.getElementsByClassName('myblok')
      const arrayName = []
      const arrayKey = []
      for (let blok of myblok) {
        const name = blok.querySelector('img[alt]').getAttribute('alt')
        const isRenewal =
          blok.querySelector('button.pn') &&
          blok.querySelector('button.pn').innerText === '可续期'

        if (
          ~categoriesData.Spell.indexOf(name) &&
          name != '思绪骤聚' &&
          isRenewal
        ) {
          const key = blok
            .querySelector('button.pn')
            .getAttribute('onclick')
            .match(/\d+/g)[0]
          arrayKey.push(key)
          arrayName.push(name)
        }
      }

      if (arrayKey.length === 0) {
        alert(
          '您没有可续期的咒术徽章，或仅有思绪骤聚\n（思绪骤聚可能有人希望重新购买获取+1知识，并未加入一键续期中）'
        )
        return
      }

      if (
        confirm(
          `您正在为【${arrayName.join(
            ' '
          )}】咒术勋章续期，是否确认\n（思绪骤聚可能有人希望重新购买获取+1知识，并未加入一键续期中）`
        )
      ) {
        repeatRequest(arrayKey.length, 3000, arrayKey)
      }
    }

    // 一键关闭赠礼/咒术类勋章显示
    function oneClickDisplay() {
      const myblok = document.getElementsByClassName('myblok')

      for (let blok of myblok) {
        const name = blok.querySelector('img[alt]').getAttribute('alt')

        if (isKind(name, 'Gift') || isKind(name, 'Spell')) {
          const input = blok.querySelector('input')
          if (input && input.checked) {
            input.click()
          }
        }
      }

      alert('赠礼/咒术类勋章已全部设置为不显示')
    }

    // 关闭所有勋章显示
    function closeAllDisplay() {
      const myblok = document.getElementsByClassName('myblok')

      for (let blok of myblok) {
        const input = blok.querySelector('input')
        if (input && input.checked) {
          input.click()
        }
      }

      alert('所有勋章已全部设置为不显示')
    }

    // 判断一个勋章是否属于某个类别
    function isKind(name, kind) {
      return !!~categoriesData[kind].indexOf(name)
    }

    // 此处直接复制粘贴代码不想思考了
    // 别人的勋章分类展示和回帖期望计算
    function badgeOrder() {
      let result = {}
      let categories = {}

      for (const [key, value] of Object.entries(linkList)) {
        // 从 numbers 中获取对应的数字，如果没有则默认为空
        const number = numbers[key] || ''

        // 生成 result 对象
        result[`${key}${number ? `(${number})` : ''}`] = ''

        // 生成 categories 对象
        categories[value] = `${key}${number ? `(${number})` : ''}`
      }

      // 名称匹配核心功能
      let myblok = document.getElementsByClassName('myblok')
      for (let blok of myblok) {
        let regex = /alt="(.+?)"/
        let matches = blok.innerHTML.match(regex)

        if (matches) {
          let match = matches[1]
          let found = false

          for (let key in categories) {
            // 在这里对于一些同名的blok进行处理
            // 但是存在bug所以先注释了
            // const name = blok.querySelector('.mingcheng').innerHTML
            // if (match === "【限定】深渊遗物") {
            //     // https://www.gamemale.com/forum.php?mod=viewthread&tid=95019&highlight=%E6%B7%B1%E6%B8%8A%E9%81%97%E7%89%A9
            //     if (~name.indexOf('星尘龙')) {
            //         categoriesData.Pet.push("【限定】深渊遗物")
            //     } else {
            //         categoriesData.Prize.push("深渊遗物")
            //     }
            // } else if (match === "迷之瓶") {
            //     if (~name.indexOf('德拉克魔瓶')) {
            //         categoriesData.Asset.push("迷之瓶")
            //     } else {
            //         categoriesData.Prize.push("迷之瓶")
            //     }
            // }

            // 忽略全角半角·差异
            const match1 = match.replace(/·/g, '‧')
            const match2 = match.replace(/‧/g, '·')

            function isTure(array) {
              return array
                .map((e) => ~categoriesData[key]?.indexOf(e))
                .reduce((a, b) => a || b)
            }

            const matchArray = [match1, match2]
            if (isTure(matchArray)) {
              result[categories[key]] += match + ','
              found = true
              blok.setAttribute('categories', key)
              break
            }
          }

          if (!found) {
            result['其他'] += match + ','
            blok.setAttribute('categories', 'other')
          }
        }
      }
      let txt = ''
      for (let key in result) {
        txt +=
          key +
          ' : (' +
          (result[key].split(',').length - 1) +
          ') ' +
          result[key].slice(0, -1) +
          '<br>'
      }

      /**
       *  计算勋章收益
       *  @type ALL 计算所有 Temporary 计算临时 Permanent 计算永久
       */
      function qiwang(pattern, type) {
        let myblok = document.getElementsByClassName('myblok')
        let result = {
          金币: 0,
          血液: 0,
          咒术: 0,
          知识: 0,
          旅程: 0,
          堕落: 0,
          灵魂: 0,
        }

        // 仅计算临时勋章收益
        if (type === 'Temporary') {
          myblok = [...myblok].filter((e) => ~e.textContent.indexOf('有效期'))
        } else if (type === 'Permanent') {
          myblok = [...myblok].filter((e) => !~e.textContent.indexOf('有效期'))
        }

        for (let blok of myblok) {
          if (blok.innerText.indexOf('已寄售') > 0) {
            continue
          }
          let regex = /几率 (\d+)%/i
          let matches = blok.innerText.match(regex)

          if (matches) {
            let prob = matches[1]
            let symbols = Array.from(
              blok.innerText.matchAll(pattern),
              (m) => m[2]
            )
            let isSame = symbols.every(function (element) {
              return element === symbols[0]
            })

            matches = blok.innerText.matchAll(pattern)
            for (let match of matches) {
              let score = (prob / 100) * parseInt(match[2] + match[3])
              result[match[1]] = Number((result[match[1]] + score).toFixed(4))
            }
          }
        }
        return result
      }

      function getCoin() {
        let coin = 0
        let myblok = document.getElementsByClassName('myblok')
        for (let blok of myblok) {
          let regex = /金币\s+(\d+)寄售/i
          let matches = blok.innerText.match(regex)
          if (matches) {
            coin += parseInt(matches[1])
          }
        }
        return coin
      }

      function showValid() {
        let myblok = document.getElementsByClassName('myblok')
        for (let blok of myblok) {
          let regex = /\s+(.+?分)\d{1,2}秒有效期/i
          let matches = blok.innerText.match(regex)
          if (matches) {
            let newP = document.createElement('p')
            let newContent = document.createTextNode(matches[1])
            newP.appendChild(newContent)
            blok.firstElementChild.appendChild(newP)
          }
        }
      }

      // 计算勋章总期望
      let huiPattern = /回帖\s+(.+?) ([+-])(\d+)/gi
      let faPattern = /发帖\s+(.+?) ([+-])(\d+)/gi

      let hui = '回帖期望 '
      let fa = '发帖期望 '
      const huiAll = getExpectation(huiPattern, hui, 'ALL')
      const faAll = getExpectation(faPattern, fa, 'ALL')

      // 计算永久勋章收益
      const huiPermanent = getExpectation(huiPattern, hui, 'Permanent')
      const faPermanent = getExpectation(faPattern, fa, 'Permanent')

      // 计算临时勋章的收益
      const huiTemporary = getExpectation(huiPattern, hui, 'Temporary')
      const faTemporary = getExpectation(faPattern, fa, 'Temporary')

      let coin = '寄售最大价格总和：' + getCoin()

      var badgeOrderElement = document.querySelector('.badge-order')
      if (badgeOrderElement) {
        const element = [
          '<H3>所有勋章收益</H3>',
          huiAll,
          faAll,
          '<br>',
          '<H3>常驻勋章收益</H3>',
          huiPermanent,
          faPermanent,
          '<br>',
          '<H3>临时勋章收益</H3>',
          huiTemporary,
          faTemporary,
          '<br>',
          coin,
          '<br>',
          txt,
        ]
        badgeOrderElement.innerHTML = element.join('<p>')
      }

      showValid()

      // 计算期望
      function getExpectation(regex, title, isTemporary) {
        const result = qiwang(regex, isTemporary)
        for (let key in result) {
          title += key + ':' + result[key].toFixed(2) + '  '
        }

        return title
      }
    }

    // 优化过的badgeOrder
    function processBadges() {
      const myblok = document.getElementsByClassName('myblok')
      const blokDataList = []
      const classificationResult = {}
      const categoriesMapping = {}

      // 初始化寄售总价
      let coin = 0

      // 初始化分类结果结构
      Object.entries(linkList).forEach(([key, value]) => {
        const number = numbers[key] || ''
        const categoryKey = `${key}${number ? `(${number})` : ''}`
        classificationResult[categoryKey] = new Set()
        categoriesMapping[value] = categoryKey
      })
      classificationResult['其他'] = new Set()

      // 单次遍历处理所有数据
      for (const blok of myblok) {
        // 名称分类处理
        const altName = blok.querySelector('img')?.getAttribute('alt') || ''
        const normalizedName = altName
          .replace(
            /[·‧]/g,
            (s) => (s === '·' ? '‧' : '·') // 统一转换为半角符号进行匹配
          )
          .replace(/【不可购买】/g, '') // 去除【不可购买】
        const category = nameCategoryMap.get(normalizedName) || 'other'
        const displayCategory = categoriesMapping[category] || '其他'

        classificationResult[displayCategory].add(altName)
        blok.setAttribute('data-category', category)

        // 收益数据提取
        if (blok.innerText.includes('已寄售')) continue

        const isTemporary = blok.textContent.includes('有效期')
        const probMatch = blok.innerText.match(/几率 (\d+)%/i)
        const probability = probMatch ? parseInt(probMatch[1]) / 100 : 1

        const extractAttributes = (pattern) =>
          Array.from(blok.innerText.matchAll(pattern)).map((m) => ({
            type: m[1],
            value: (m[2] === '+' ? 1 : -1) * parseInt(m[3]) * probability,
          }))

        blokDataList.push({
          name: altName,
          isTemporary,
          hui: extractAttributes(/回帖\s+(.+?) ([+-])(\d+)/gi),
          fa: extractAttributes(/发帖\s+(.+?) ([+-])(\d+)/gi),
          // huiDuoluo: extractAttributes(/回帖\s+(堕落) ([+-])(\d+)/gi),
        })

        // 计算寄售总价
        const coinMatches = blok.innerText.match(/金币\s+(\d+)寄售/i)
        if (coinMatches) {
          coin += parseInt(coinMatches[1])
        }

        // 显示有效时长
        if (isTemporary) {
          const timeTatches = blok.innerText.match(/\s+(.+?分)\d{1,2}秒有效期/i)
          if (timeTatches) {
            const newP = document.createElement('p')
            newP.textContent = timeTatches[1]
            blok.firstElementChild.appendChild(newP)
          }
        }
      }

      return { classificationResult, blokDataList, coin }
    }

    // 优化后的收益计算函数
    function calculateExpectations(blokDataList) {
      const initStats = () => ({
        ALL: { 金币: 0, 血液: 0, 咒术: 0, 知识: 0, 旅程: 0, 堕落: 0, 灵魂: 0 },
        Permanent: {
          金币: 0,
          血液: 0,
          咒术: 0,
          知识: 0,
          旅程: 0,
          堕落: 0,
          灵魂: 0,
        },
        Temporary: {
          金币: 0,
          血液: 0,
          咒术: 0,
          知识: 0,
          旅程: 0,
          堕落: 0,
          灵魂: 0,
        },
      })

      const result = { hui: initStats(), fa: initStats() }

      blokDataList.forEach(({ isTemporary, hui, fa }) => {
        const types = ['ALL', isTemporary ? 'Temporary' : 'Permanent']

        const process = (source, target) => {
          source.forEach(({ type, value }) => {
            types.forEach((t) => {
              if (target[t][type] !== undefined) {
                target[t][type] += value
              }
            })
          })
        }

        process(hui, result.hui)
        process(fa, result.fa)
      })

      // 数据格式化
      const formatter = (obj) =>
        Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, Number(v.toFixed(4))])
        )

      return {
        hui: Object.fromEntries(
          Object.entries(result.hui).map(([k, v]) => [k, formatter(v)])
        ),
        fa: Object.fromEntries(
          Object.entries(result.fa).map(([k, v]) => [k, formatter(v)])
        ),
      }
    }

    // 显示堕落相关的勋章
    function showDuoluHui(blokDataList) {
      const increaseDuolu = [] // 存储增加堕落的物品名称
      const decreaseDuolu = [] // 存储减少堕落的物品名称

      // 遍历数组
      blokDataList.forEach((e) => {
        const duolu = e.hui.find((h) => h.type === '堕落') // 查找堕落值
        if (duolu) {
          if (duolu.value > 0) {
            increaseDuolu.push(e.name) // 增加堕落
          } else if (duolu.value < 0) {
            decreaseDuolu.push(e.name) // 减少堕落
          }
        }
      })

      // 返回结果
      return {
        increase: increaseDuolu.join(', '),
        decrease: decreaseDuolu.join(', '),
      }
    }

    // 整合后的执行函数
    function optimizedBadgeOrder() {
      const { classificationResult, blokDataList, coin } = processBadges()
      const expectations = calculateExpectations(blokDataList)
      const duoluHui = showDuoluHui(blokDataList)

      // 分类结果格式化
      const classificationText = Object.entries(classificationResult)
        .map(([k, v]) => `${k} : (${v.size}) ${[...v].join(', ')}`)
        .join('<br>')

      // 收益结果格式化
      const formatEarnings = (type, data) =>
        Object.entries(data[type])
          .map(([k, v]) => `${k}:${v.toFixed(2)}`)
          .join('  ')

      const badgeOrderElement = document.querySelector('.badge-order')

      if (badgeOrderElement) {
        badgeOrderElement.innerHTML = [
          '<H3>所有勋章收益</H3>',
          `回帖：${formatEarnings('ALL', expectations.hui)}`,
          `发帖：${formatEarnings('ALL', expectations.fa)}`,
          '<br>',
          '<H3>常驻勋章收益</H3>',
          `回帖：${formatEarnings('Permanent', expectations.hui)}`,
          `发帖：${formatEarnings('Permanent', expectations.fa)}`,
          '<br>',
          '<H3>临时勋章收益</H3>',
          `回帖：${formatEarnings('Temporary', expectations.hui)}`,
          `发帖：${formatEarnings('Temporary', expectations.fa)}`,
          `<div class="badge-warning"></div>`,
          '<br>',
          `寄售最大价格总和：${coin}`,
          // '<H3>分类统计</H3>',
          '<br>',
          classificationText,
          '<br>',
          '回帖增加堕落：' + duoluHui.increase,
          '回帖减少堕落：' + duoluHui.decrease,
        ]
          .map((s) => `<p>${s}</p>`)
          .join('')
      }
    }

    // 临时方案，给真人男从全部加个'.'
    function categoriesFormat(categories) {
      const zhenren = categories.zhenren
      const zhenrenTemporary = zhenren.map((e) => e + '.')
      categories.zhenren = zhenren.concat(zhenrenTemporary)
    }

    // 计算灵魂期望并存本地
    function setlocalStoragelinghun() {
      const xunzhang = document.querySelectorAll('.my_fenlei .myblok')
      if (!xunzhang) return

      const result = {}

      xunzhang.forEach((element) => {
        const linghun = [...element.querySelectorAll('.jiage.shuxing')].find(
          (p) => p.textContent.includes('灵魂')
        )
        const triggerProbability = [...element.querySelectorAll('.jiage')].find(
          (p) => p.textContent.includes('触发几率')
        )

        if (linghun && triggerProbability) {
          const probabilityMatch =
            triggerProbability.textContent.match(/触发几率 (\d+)%/)
          if (probabilityMatch) {
            const probability = parseFloat(probabilityMatch[1]) / 100 // 转换为小数
            const countMatch = linghun.textContent.match(
              /发帖\s*[\u00A0]*灵魂\s*\+\s*(\d+)/
            )
            const count = countMatch ? parseInt(countMatch[1], 10) : 0

            // 记录结果
            if (result[probability]) {
              result[probability] += count // 如果已经存在，累加数量
            } else {
              result[probability] = count // 否则初始化数量
            }
          }
        }
      })

      console.log(result) // 输出结果对象
      localStorage.setItem('灵魂期望', JSON.stringify(result))
    }

    // 添加样式
    GM_addStyle(`
        #presetDialog {
            position: fixed;
            top: 50%;
            left: 50%;
            width: 30%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            z-index: 9999;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
        }
        .dialog-close {
            position: absolute;
            right: 10px;
            top: 5px;
            cursor: pointer;
            font-size: 20px;
        }

        #presetDialog input {
            vertical-align: middle;
        }

        #presetDialog label {
            margin: 5px;
        }
    `)

    const DefaultFormat = '互赠：{missing}'
    // 在对话框HTML结构中添加格式输入框
    const dialog = document.createElement('div')
    dialog.id = 'presetDialog'
    dialog.style.display = 'none'
    dialog.innerHTML = `
        <span class="dialog-close">×</span>
        <h3 style="margin-top: 0;">预设勋章配置</h3>
        <div class="format-config">
            <p>自定义互赠格式：</p>
            <input type="text" id="formatInput" style="width: 100%; margin: 5px 0;">
            <small>可用占位符：{missing} = 互赠勋章列表</small>
        </div>
        <div id="badgeList"></div>
        <button class="save-button" style="margin-top: 15px;">保存配置</button>
    `
    document.body.appendChild(dialog)

    // 事件绑定
    dialog.querySelector('.dialog-close').addEventListener('click', hideDialog)
    dialog.querySelector('.save-button').addEventListener('click', savePreset)

    // 显示/隐藏对话框
    function showDialog() {
      initDialog()
      dialog.style.display = 'block'
    }
    function hideDialog() {
      dialog.style.display = 'none'
    }

    // 初始化对话框内容
    function initDialog() {
      const badgeList = dialog.querySelector('#badgeList')
      const badgeNames = {
        赠礼: categoriesData.Gift,
        咒术: categoriesData.Spell,
      }

      badgeList.innerHTML = ''

      const { badges: preset, format } = getPresetConfig()

      // 遍历所有分类
      Object.entries(badgeNames).forEach(([category, names]) => {
        // 添加分类标题
        const categoryHeader = document.createElement('h4')
        categoryHeader.style.margin = '10px 0 5px'
        categoryHeader.textContent = category
        badgeList.appendChild(categoryHeader)

        // 添加该分类下的勋章
        names.forEach((name) => {
          const label = document.createElement('label')
          label.innerHTML = `
                <input type="checkbox"
                       value="${name}"
                       ${preset.includes(name) ? 'checked' : ''}>
                ${name}
            `
          badgeList.appendChild(label)
        })
      })

      document.getElementById('formatInput').value = format || DefaultFormat
    }

    // 保存时同时保存格式配置
    // 修改后的保存函数
    function savePreset() {
      const selected = Array.from(dialog.querySelectorAll('input:checked')).map(
        (checkbox) => checkbox.value
      )
      const format =
        document.getElementById('formatInput').value || DefaultFormat

      savePresetConfig(selected, format)
      hideDialog()
      checkPreset()
    }

    // 检查预设内容
    function checkPreset() {
      const { badges: preset, format } = getPresetConfig()
      const currentBadges = Array.from(
        document.getElementsByClassName('myblok')
      ).map((blok) => blok.querySelector('img[alt]').getAttribute('alt'))

      const missing = preset.filter((name) => !currentBadges.includes(name))
      const existingWarning = document.getElementById('presetWarning')

      if (existingWarning) existingWarning.remove()

      const warning = document.createElement('div')
      warning.id = 'presetWarning'
      warning.innerHTML = `
            <p style="${missing.length > 0 ? 'color: red;' : 'color: green;'} ">
                缺少预设勋章：${missing.length > 0 ? missing.join(', ') : '无'}
                ${
                  missing.length > 0
                    ? '<a class="copy-button" style="margin-left: 10px; cursor: pointer;">点击一键复制勋章互赠（已过滤不能互赠的勋章）</a>'
                    : ''
                }
            </p>
        `
      warning
        .querySelector('.copy-button')
        ?.addEventListener('click', copyMissing)
      document.querySelector('.badge-warning').appendChild(warning)
    }

    // 复制缺失内容
    function copyMissing() {
      const { badges: preset, format } = getPresetConfig()

      const currentBadges = Array.from(
        document.getElementsByClassName('myblok')
      ).map((blok) => blok.querySelector('img[alt]').getAttribute('alt'))

      // 双重过滤条件：不在当前勋章列表 且 属于可赠送类型
      const missing = preset.filter(
        (name) => !currentBadges.includes(name) && GiftableBadges.includes(name)
      )

      // 替换模板中的占位符
      const text = format.replace(/{missing}/g, missing.join(', '))
      // .replace(/{count}/g, missing.length) // 可扩展其他占位符

      if (missing.length === 0) {
        alert('没有可赠送的勋章')
        return
      } else {
        navigator.clipboard
          .writeText(text)
          .then(() => alert('需要互赠的勋章已复制'))
          .catch((err) => console.error('复制失败:', err))
      }
    }

    // 初始化脚本
    checkPreset()

    // 获取预设项的兼容方法
    function getPresetConfig() {
      const rawData = localStorage.getItem('预设项')
      let badges = []
      let format = DefaultFormat

      try {
        // 解析旧版数组格式
        if (rawData?.startsWith('[')) {
          badges = JSON.parse(rawData)
          // 自动迁移到新版格式
          savePresetConfig(badges, format)
        } else {
          // 解析新版对象格式
          const config = JSON.parse(rawData || '{}')
          badges = config.badges || []
          format = config.format || format
        }
      } catch (e) {
        console.error('解析预设项失败', e)
      }

      return { badges, format }
    }

    // 保存时统一使用新格式
    function savePresetConfig(badges, format) {
      localStorage.setItem(
        '预设项',
        JSON.stringify({
          badges,
          format,
        })
      )
    }

    // 自动开启茉香啤酒
    function 自动开启茉香啤酒() {
      const { key, lv } = findMedal('茉香啤酒')
      if (key && lv === '1') {
        const data = {
          formhash,
          action: 'UPLV',
          jishoujiage: '',
          userMedalid: key,
        }

        const formData = objectToFormData(data)
        const url =
          'https://www.gamemale.com/plugin.php?id=wodexunzhang:showxunzhang'

        fetch(url, {
          method: 'POST',
          body: formData,
        })
      }
    }

    // 展示勋章
    function showTopMedal() {
      function calculateMedals(level) {
        const medals = [1, 6, 6, 6, 7, 7, 8, 8, 9, 9, 10]
        return level >= 1 ? medals[Math.min(level, 10)] : 1
      }

      function getLevel(jifen) {
        const levelThresholds = [3, 10, 35, 70, 120, 200, 300, 450, 650, 900]
        for (let i = levelThresholds.length - 1; i >= 0; i--) {
          if (jifen >= levelThresholds[i]) return i + 1 // 返回对应等级
        }
        return 0 // 积分小于最低等级返回 0
      }
      const jifen = document.querySelector('#extcreditmenu + span').textContent
      const level = getLevel(Number(jifen))
      const showNum = calculateMedals(level)

      const myblok = document.getElementsByClassName('myblok')
      function filterDiv(div, index) {
        const input = div.querySelector('input')
        return input && input.checked
      }

      const container = document.createElement('div')
      container.classList.add('TopMedal-container')
      ;[...myblok]
        .filter(filterDiv)
        .slice(0, showNum)
        .forEach((e) => {
          const newImg = document.createElement('img')
          const src = e.querySelector('img').getAttribute('src')
          const alt = e.querySelector('img').getAttribute('alt')
          newImg.setAttribute('src', src)
          newImg.setAttribute('alt', alt)

          if (e.querySelector('img').onmouseover) {
            newImg.onmouseover = e.querySelector('img').onmouseover
          }

          const key = e.getAttribute('key')
          newImg.setAttribute('key', key)
          container.appendChild(newImg)
        })

      const targetElement = document.querySelector('.appl')
      const existingContainer = document.querySelector(
        '.appl .TopMedal-container'
      )

      if (!existingContainer) {
        targetElement.appendChild(container)
      } else {
        targetElement.replaceChild(container, existingContainer)
      }

      TopMedalDomSticky()
      window.removeEventListener('scroll', TopMedalDomSticky)
      window.addEventListener('scroll', TopMedalDomSticky)
    }

    function TopMedalDomSticky() {
      const TopMedalContainer = document.querySelector(
        '.appl .TopMedal-container'
      )
      const tbnBottom = document
        .querySelector('.appl .tbn')
        .getBoundingClientRect().bottom
      TopMedalContainer.classList.toggle(
        'TopMedal-container__Fixed',
        tbnBottom < 40
      )
    }

    function observeElement() {
      const observer = new MutationObserver(showTopMedal)
      const myElement = document.querySelector(
        '#medalid_f > div.my_fenlei > div.myfldiv.clearfix.ui-sortable'
      )

      const config = {
        childList: true, // 观察直接子节点的变化
      }

      observer.observe(myElement, config)

      myElement.addEventListener('change', (event) => {
        if (
          event.target.tagName === 'INPUT' &&
          event.target.type === 'checkbox'
        ) {
          showTopMedal()
        }
      })
    }

    // 记录展示勋章成功
    function saveTopMedal() {
      const div = document.querySelectorAll('.TopMedal-container img')
      const divName = [...div].map((e) => e.getAttribute('alt'))
      saveArrayToLocalStorage('TopMedal', divName)
      alert('记录展示勋章成功')
    }

    // 置顶展示勋章
    function loadTopMedal() {
      const TopMedal = getArrayFromLocalStorage('TopMedal')
      const TopMedalKey = NameToKey(TopMedal)

      const myblok = document.getElementsByClassName('myblok')
      const keyBlok = [...myblok].map((e) => e.getAttribute('key'))
      const array = mergeArrays(TopMedalKey, keyBlok)
      postNewOrder(array)
    }

    /* =========================================工具函数区域============================================================ */

    /**
     * 将普通对象转换为 FormData 对象
     * @param {Object} obj - 要转换的对象
     * @returns {FormData} - 转换后的 FormData 对象
     */
    function objectToFormData(obj) {
      const formData = new FormData()
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          formData.append(key, obj[key])
        }
      }
      return formData
    }

    /**
     * 查找包含指定名称的 "myblok" 元素，并返回相关信息。
     *
     * @param {string} name - 要查找的名称字符串。函数会在 "myblok" 类的元素中搜索该名称。
     * @returns {Object|null} 如果找到对应的元素，返回一个对象，包括：
     *   - {HTMLElement} div - 找到的包含名称的 HTML 元素。
     *   - {string} name - 传入的名称参数。
     *   - {string} key - 勋章的key
     *   - {string} kind - 勋章的类型
     *   如果未找到匹配的元素，则返回 null。
     */
    function findMedal(name) {
      const myblok = document.getElementsByClassName('myblok')
      const div = [...myblok].find((e) => e.textContent.includes(name))

      if (div) {
        // const name = div.querySelector('img').alt
        const key = div.getAttribute('key')
        const categories = div.getAttribute('categories')
        const lv = getLv(div)
        const checked = div.querySelector('input').checked

        return { div, name, key, categories, lv, checked }
      }

      function getLv(div) {
        const textContent = div.querySelector('.mingcheng').textContent
        const match = textContent.match(/等级\s+(\w+)/)
        if (match && match[1]) {
          return match[1]
        } else {
          return {}
        }
      }
    }

    /**
     * 合并两个数组，重复项只保留第一次出现的元素。
     * @param {Array} arr1 - 第一个待合并的数组。
     * @param {Array} arr2 - 第二个待合并的数组。
     * @returns {Array} - 合并后的数组，包含唯一元素。
     */
    function mergeArrays(arr1, arr2) {
      const seen = new Set()
      const result = []

      function addUniqueElements(arr) {
        for (const item of arr) {
          if (!seen.has(item)) {
            seen.add(item)
            result.push(item)
          }
        }
      }

      addUniqueElements(arr1)
      addUniqueElements(arr2)

      return result
    }
    // ==========================================
    // 1. 样式定义
    // ==========================================
    const css = `
        body { overflow-anchor: none; }

        .myfldiv { padding-bottom: 100px; position: relative; min-height: 300px; }
        .myfldiv:not(.layout-flat) { display: flex; flex-direction: column; }

        .myfldiv.layout-flat {
            display: flex; flex-wrap: wrap; gap: 6px;
            align-content: flex-start; align-items: flex-start;
        }

        /* === 顶部导航栏 === */
        #medal-nav-bar {
            display: flex; flex-wrap: wrap; gap: 8px;
            padding: 10px; margin-bottom: 15px;
            background: #fff; border-bottom: 2px dashed #eee; align-items: center;
            position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 6px -6px rgba(0,0,0,0.1);
            width: 100%; box-sizing: border-box;
        }

        /* 导航标签 */
        .nav-chip {
            padding: 5px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; user-select: none;
            border: 1px solid #ddd; background: #fff; color: #666; transition: all 0.15s;
            display: flex; align-items: center; gap: 6px;
        }
        .nav-chip:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .nav-chip.active { background: #e3f2fd; color: #1565c0; border-color: #90caf9; font-weight: bold; }

        /* 按钮颜色 */
        .nav-chip.btn-toggle { border-color: #4dd0e1; color: #006064; background: #fff; }
        .nav-chip.btn-toggle:hover { background: #e0f7fa; }

        .nav-chip[data-key="_pinned"] { border-color: #ef5350; color: #c62828; background: #fff; }
        .nav-chip[data-key="_pinned"]:hover { background: #ffebee; }
        .nav-chip[data-key="_pinned"].active { background: #ffcdd2; border-color: #e53935; }

        .nav-chip[data-type="custom"]:not([data-key="_pinned"]) { border-color: #ffb74d; color: #e65100; background: #fff; }
        .nav-chip[data-type="custom"]:not([data-key="_pinned"]):hover { background: #fff3e0; }
        .nav-chip[data-type="custom"]:not([data-key="_pinned"]).active { background: #ffe0b2; border-color: #ff9800; }

        .nav-chip.btn-collapse { border-color: #cfd8dc; color: #546e7a; margin-left: 0; background: #fff; }
        .nav-chip.btn-collapse:hover { background: #eceff1; }

        .nav-chip.btn-create { border-color: #ce93d8; color: #8e24aa; margin-left: auto; background: #fff; }
        .nav-chip.btn-create:hover { background: #f3e5f5; }

        .nav-badge { background: rgba(0,0,0,0.08); padding: 0 6px; border-radius: 10px; font-size: 11px; }

        /* === 勋章展示区 === */
        #medal-content-area { display: block; width: 100%; }
        #medal-content-area::after { content: ""; display: table; clear: both; }

        /* 收纳盒 */
        .medal-box {
            float: left; margin: 5px;
            border: 1px solid #dae1f7; border-radius: 4px; background-color: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            width: fit-content; max-width: 100%;
            display: flex; flex-direction: row;
            overflow: hidden;
            animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        .medal-box[data-type="custom"] { border-color: #ffb74d; background: #fff8e1; }
        .medal-box[data-key="_pinned"] { border-color: #ef5350; background: #ffebee; }

        /* 盒子头部 (侧边栏) */
        .medal-box-header {
            writing-mode: vertical-lr; padding: 8px 4px;
            background: #eef2ff; color: #4169e1; font-weight: bold; font-size: 13px;
            border-right: 1px solid #dae1f7;
            display: flex; align-items: center; justify-content: space-between;
            gap: 8px; cursor: move; user-select: none;
            min-height: 80px; /* 增加高度以容纳4个按钮 */
        }
        .medal-box[data-type="custom"] .medal-box-header { background: #ffecb3; color: #d84315; border-right: 1px solid #ffe082; }
        .medal-box[data-key="_pinned"] .medal-box-header { background: #ffcdd2; color: #b71c1c; border-right: 1px solid #ef5350; }

        .header-title-group { display: flex; align-items: center; gap: 6px; }
        .box-title-text { white-space: nowrap; }

        .folder-badge-count {
            writing-mode: horizontal-tb; background: rgba(255,255,255,0.6);
            padding: 2px 4px; border-radius: 4px; font-size: 10px; color: inherit;
        }

        /* 盒子内容 */
        .medal-box-content { padding: 5px; display: flex; flex-wrap: wrap; gap: 4px; align-content: flex-start; }

        /* 操作按钮组 */
        .box-controls {
            display: flex; flex-direction: column; gap: 4px;
            writing-mode: horizontal-tb;
            margin-top: auto;
        }
        .ctrl-btn {
            width: 18px; height: 18px; line-height: 18px; text-align: center;
            border-radius: 3px; cursor: pointer; color: white; font-family: Arial, sans-serif;
            font-size: 14px; font-weight: bold; opacity: 0.8; transition: opacity 0.1s;
        }
        .ctrl-btn:hover { opacity: 1; }
        .btn-add { background: #66bb6a; }
        .btn-del { background: #ef5350; }
        .btn-rename { background: #ff9800; } /* 橙色重命名 */
        .btn-destroy { background: #78909c; font-size: 12px; }

        .myblok { margin: 0 !important; }
        .myfldiv.layout-flat .myblok { float: none !important; }

        .nav-chip.dragging { opacity: 0.3; border: 1px dashed #999; }
        .medal-box.dragging { opacity: 0.4; border: 2px dashed #2196f3; }
        .myblok.dragging-medal { opacity: 0.3; }

        /* 搜索弹窗 */
        .medal-search-modal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: flex-start;
            padding-top: 100px; opacity: 0; visibility: hidden; transition: all 0.2s;
        }
        .medal-search-modal.active { opacity: 1; visibility: visible; }
        .search-box {
            background: white; width: 320px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            overflow: hidden; display: flex; flex-direction: column;
        }
        .search-header { padding: 10px 15px; background: #f5f5f5; border-bottom: 1px solid #eee; font-weight: bold; color: #333; display: flex; justify-content: space-between;}
        .search-header[data-mode="add"] { background: #e8f5e9; color: #2e7d32; }
        .search-header[data-mode="remove"] { background: #ffebee; color: #c62828; }
        .search-close { cursor: pointer; opacity: 0.6; }
        .search-input-wrapper { padding: 10px; border-bottom: 1px solid #eee; }
        #medal-search-input { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; outline: none; }
        .search-list { max-height: 350px; overflow-y: auto; list-style: none; padding: 0; margin: 0; }
        .search-item {
            padding: 8px 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #f9f9f9;
        }
        .search-item:hover { background: #f0f0f0; }
        .search-item img { width: 30px; height: 40px; object-fit: contain; }
        .search-item-remove-icon { margin-left: auto; color: #e57373; font-weight: bold; }
        .search-empty { padding: 20px; text-align: center; color: #999; font-size: 12px; }
    `
    GM_addStyle(css)

    // ==========================================
    // 2. 数据定义
    // ==========================================
    const categoryMap = {
      youxi: '游戏男从',
      zhenren: '真人男从',
      Maid: '女从',
      Equip: '装备',
      Asset: '资产',
      Pet: '宠物',
      Forum: '板块',
      Skill: '天赋',
      Gift: '赠礼',
      Spell: '咒术',
      Plot: '剧情',
      Prize: '奖品',
      Deposit: '储蓄',
      Deco: '装饰',
      Salary: '薪俸',
      Story: '故事',
      other: '其他',
    }

    const limitMap = {
      youxi: 11,
      zhenren: 8,
      Maid: 5,
      Equip: 12,
      Asset: 16,
      Pet: 7,
      Forum: 5,
      Skill: 4,
      Deposit: 1,
      Deco: 6,
      Salary: 1,
    }

    const S_ORDER = 'GM_Medal_V10_Order'
    const S_ACTIVE_STACK = 'GM_Medal_V10_ActiveStack'
    const S_CUSTOM_DATA = 'GM_Medal_V9_Contents'
    const S_USER_FOLDERS = 'GM_Medal_V9_UserFolders'
    const S_LAYOUT_MODE = 'GM_Medal_V9_LayoutMode'
    const S_PINNED_VISIBLE = 'GM_Medal_V10_PinnedVisible'

    let allMedalsMap = new Map()
    let allMedalList = []
    let customData = {}
    let userFolders = {}
    let currentMode = 'folder'

    let navOrder = []
    let activeStack = []
    let isPinnedVisible = false
    let isInitialized = false

    // ==========================================
    // 3. 核心初始化
    // ==========================================
    function init() {
      const container = document.querySelector('.myfldiv')
      if (!container) return

      const testBlock = container.querySelector('.myblok')
      if (
        testBlock &&
        !testBlock.getAttribute('data-category') &&
        !testBlock.getAttribute('categories')
      ) {
        setTimeout(init, 300)
        return
      }

      if (!isInitialized) {
        loadStorage()
        scanPageMedals(container)
        isInitialized = true
      }

      setupLayout(container)

      if (currentMode === 'flat') {
        renderFlatMode()
      } else {
        renderNavMode()
      }

      buildSearchModal()
      bindGlobalDropZone()
    }

    function loadStorage() {
      try {
        customData = JSON.parse(localStorage.getItem(S_CUSTOM_DATA) || '{}')
        const storedFolders = localStorage.getItem(S_USER_FOLDERS)
        if (storedFolders) {
          userFolders = JSON.parse(storedFolders)
        } else {
          userFolders = { _chest: '宝箱', _showcase: '橱窗' }
          localStorage.setItem(S_USER_FOLDERS, JSON.stringify(userFolders))
        }
        if (!customData._pinned) customData._pinned = []
        Object.keys(userFolders).forEach((k) => {
          if (!customData[k]) customData[k] = []
        })

        currentMode = localStorage.getItem(S_LAYOUT_MODE) || 'folder'
        navOrder = JSON.parse(localStorage.getItem(S_ORDER) || '[]')
        activeStack = JSON.parse(localStorage.getItem(S_ACTIVE_STACK) || '[]')
        isPinnedVisible = JSON.parse(
          localStorage.getItem(S_PINNED_VISIBLE) || 'false'
        )
      } catch (e) {
        console.error('存储读取失败', e)
      }
    }

    function scanPageMedals(container) {
      allMedalsMap.clear()
      allMedalList = []
      container
        .querySelectorAll('.medal-search-modal')
        .forEach((e) => e.remove())

      Array.from(container.querySelectorAll('.myblok')).forEach(
        (block, index) => {
          block.querySelectorAll('.medal-hover-btn').forEach((b) => b.remove())
          if (!block.hasAttribute('data-original-index')) {
            block.dataset.originalIndex = index
          }
          const img = block.querySelector('img')
          if (img && img.alt) {
            if (block.dataset.isClone) return
            if (!allMedalsMap.has(img.alt)) {
              allMedalsMap.set(img.alt, block)
              allMedalList.push({ name: img.alt, src: img.src })
            }
          }
        }
      )
    }

    function setupLayout(container) {
      container.innerHTML = ''
      const navBar = document.createElement('div')
      navBar.id = 'medal-nav-bar'
      container.appendChild(navBar)

      const contentArea = document.createElement('div')
      contentArea.id = 'medal-content-area'
      container.appendChild(contentArea)
    }

    // ==========================================
    // 渲染逻辑
    // ==========================================

    function renderNavMode() {
      const container = document.querySelector('.myfldiv')
      container.classList.remove('layout-flat')

      const navBar = document.getElementById('medal-nav-bar')
      const contentArea = document.getElementById('medal-content-area')

      navBar.style.display = 'flex'
      contentArea.style.display = 'block'
      navBar.innerHTML = ''
      contentArea.innerHTML = ''

      const folders = {}
      folders['_pinned'] = {
        key: '_pinned',
        name: '置顶',
        type: 'custom',
        blocks: [],
      }

      Object.keys(categoryMap).forEach((k) => {
        folders[k] = {
          key: k,
          name: categoryMap[k],
          type: 'sys',
          limit: limitMap[k] || 0,
          blocks: [],
        }
      })
      Object.keys(userFolders).forEach((k) => {
        folders[k] = {
          key: k,
          name: userFolders[k],
          type: 'custom',
          blocks: [],
        }
      })

      allMedalsMap.forEach((block) => {
        let catKey =
          block.getAttribute('data-category') ||
          block.getAttribute('categories') ||
          'other'
        if (!categoryMap[catKey]) catKey = 'other'
        block.setAttribute('draggable', 'false')
        folders[catKey].blocks.push(block)
      })
      ;[...Object.keys(userFolders), '_pinned'].forEach((boxKey) => {
        if (!customData[boxKey]) customData[boxKey] = []
        customData[boxKey].forEach((name) => {
          const original = allMedalsMap.get(name)
          if (original) {
            const clone = original.cloneNode(true)
            clone.dataset.isClone = 'true'
            clone.removeAttribute('id')
            const img = clone.querySelector('img')
            img.setAttribute('draggable', 'true')
            bindMedalDrag(img, boxKey, name)
            folders[boxKey].blocks.push(clone)
          }
        })
      })

      let finalKeys = navOrder.filter((k) => folders[k] && k !== '_pinned')
      Object.keys(folders).forEach((k) => {
        if (k !== '_pinned' && !finalKeys.includes(k)) finalKeys.push(k)
      })
      navOrder = finalKeys

      // --- 渲染导航栏 ---

      const btnToggle = createNavChip(
        'btn-toggle',
        '▤ 切换平铺',
        handleToggleLayout
      )
      navBar.appendChild(btnToggle)

      const pinnedData = folders['_pinned']
      const pinnedChip = document.createElement('div')
      pinnedChip.className = `nav-chip ${isPinnedVisible ? 'active' : ''}`
      pinnedChip.dataset.key = '_pinned'
      pinnedChip.dataset.type = 'custom'
      pinnedChip.innerHTML = `${pinnedData.name} <span class="nav-badge">${pinnedData.blocks.length}</span>`
      pinnedChip.onclick = () => {
        isPinnedVisible = !isPinnedVisible
        localStorage.setItem(S_PINNED_VISIBLE, JSON.stringify(isPinnedVisible))
        renderNavMode()
      }
      navBar.appendChild(pinnedChip)

      finalKeys.forEach((key) => {
        const data = folders[key]
        if (data.type === 'sys' && data.blocks.length === 0) return

        const isActive = activeStack.includes(key)
        const chip = document.createElement('div')
        chip.className = `nav-chip ${isActive ? 'active' : ''}`
        if (data.type === 'custom') chip.dataset.type = 'custom'
        chip.dataset.key = key
        chip.draggable = true

        let countText = data.blocks.length
        chip.innerHTML = `${data.name} <span class="nav-badge">${countText}</span>`

        chip.onclick = () => {
          if (activeStack.includes(key)) {
            activeStack = activeStack.filter((k) => k !== key)
          } else {
            activeStack.unshift(key)
          }
          localStorage.setItem(S_ACTIVE_STACK, JSON.stringify(activeStack))
          renderNavMode()
        }

        bindNavChipDrag(chip)
        navBar.appendChild(chip)
      })

      const btnCollapse = createNavChip(
        'btn-collapse',
        '↺ 收起',
        handleCollapseAll
      )
      navBar.appendChild(btnCollapse)

      const btnCreate = createNavChip(
        'btn-create',
        '＋ 新建收纳盒',
        handleCreateFolder
      )
      navBar.appendChild(btnCreate)

      // --- 渲染内容区 ---
      if (isPinnedVisible) {
        const box = createBoxDOM(pinnedData)
        contentArea.appendChild(box)
      }

      activeStack.forEach((key) => {
        const data = folders[key]
        if (!data) return
        if (data.type === 'sys' && data.blocks.length === 0) return
        const box = createBoxDOM(data)
        contentArea.appendChild(box)
      })
    }

    function renderFlatMode() {
      const container = document.querySelector('.myfldiv')
      container.classList.add('layout-flat')

      const navBar = document.getElementById('medal-nav-bar')
      const contentArea = document.getElementById('medal-content-area')

      navBar.style.display = 'flex'
      contentArea.style.display = 'none'
      navBar.innerHTML = ''

      const btnToggle = createNavChip(
        'btn-toggle',
        '▦ 切换收纳',
        handleToggleLayout
      )
      navBar.appendChild(btnToggle)
      const btnCreate = createNavChip(
        'btn-create',
        '＋ 新建收纳盒',
        handleCreateFolder
      )
      navBar.appendChild(btnCreate)

      const blocks = Array.from(allMedalsMap.values())
      blocks.sort(
        (a, b) =>
          (parseInt(a.dataset.originalIndex) || 0) -
          (parseInt(b.dataset.originalIndex) || 0)
      )

      blocks.forEach((block) => {
        block.style.display = ''
        block.removeAttribute('draggable')
        container.appendChild(block)
      })
    }

    function createNavChip(className, text, onClick) {
      const btn = document.createElement('div')
      btn.className = `nav-chip ${className}`
      btn.innerHTML = text
      btn.onclick = onClick
      return btn
    }

    function createBoxDOM(data) {
      const box = document.createElement('div')
      box.className = 'medal-box'
      box.dataset.key = data.key
      if (data.type === 'custom') box.dataset.type = 'custom'

      const header = document.createElement('div')
      header.className = 'medal-box-header'

      // 标题组
      const titleGroup = document.createElement('div')
      titleGroup.className = 'header-title-group'
      titleGroup.style.writingMode = 'vertical-lr'

      let countText = data.blocks.length
      if (data.limit > 0) countText += `/${data.limit}`

      const titleText = document.createElement('span')
      titleText.className = 'box-title-text'
      titleText.innerText = data.name

      titleGroup.appendChild(titleText)
      titleGroup.innerHTML += `<span class="folder-badge-count">${countText}</span>`

      header.appendChild(titleGroup)

      // 操作按钮 (移入Header, 左侧底部)
      if (data.type === 'custom') {
        const controls = document.createElement('div')
        controls.className = 'box-controls'

        // 1. 添加
        const btnAdd = createCtrlBtn('btn-add', '+', (e) => {
          e.stopPropagation()
          openSearchModal(data.key, data.name, 'add')
        })
        btnAdd.title = '添加勋章'
        controls.appendChild(btnAdd)

        // 2. 移除
        const btnDel = createCtrlBtn('btn-del', '-', (e) => {
          e.stopPropagation()
          openSearchModal(data.key, data.name, 'remove')
        })
        btnDel.title = '移除勋章'
        controls.appendChild(btnDel)

        // 3. 重命名 (新功能) - 置顶盒不可重命名
        if (data.key !== '_pinned') {
          const btnRename = createCtrlBtn('btn-rename', '✎', (e) => {
            e.stopPropagation()
            handleRenameFolder(data.key, data.name)
          })
          btnRename.title = '重命名'
          controls.appendChild(btnRename)
        }

        // 4. 删除盒子 - 置顶盒不可删除
        if (data.key !== '_pinned') {
          const btnDestroy = createCtrlBtn('btn-destroy', '×', (e) => {
            e.stopPropagation()
            handleDestroyFolder(data.key, data.name)
          })
          btnDestroy.title = '删除收纳盒'
          controls.appendChild(btnDestroy)
        }

        header.appendChild(controls)
      }

      box.appendChild(header)

      const content = document.createElement('div')
      content.className = 'medal-box-content'
      data.blocks.forEach((b) => content.appendChild(b))
      box.appendChild(content)

      return box
    }

    function createCtrlBtn(cls, text, onClick) {
      const s = document.createElement('span')
      s.className = `ctrl-btn ${cls}`
      s.innerText = text
      s.onclick = onClick
      return s
    }

    // ==========================================
    // 4. 逻辑处理
    // ==========================================

    function handleCollapseAll() {
      activeStack = []
      isPinnedVisible = false
      localStorage.setItem(S_ACTIVE_STACK, JSON.stringify(activeStack))
      localStorage.setItem(S_PINNED_VISIBLE, JSON.stringify(isPinnedVisible))
      renderNavMode()
    }

    function handleToggleLayout() {
      if (currentMode === 'flat') {
        const currentBlocks = Array.from(
          document.querySelectorAll('.myfldiv.layout-flat > .myblok')
        )
        currentBlocks.forEach((block, index) => {
          block.dataset.originalIndex = index
        })
      }

      currentMode = currentMode === 'folder' ? 'flat' : 'folder'
      localStorage.setItem(S_LAYOUT_MODE, currentMode)

      const container = document.querySelector('.myfldiv')
      setupLayout(container)

      if (currentMode === 'flat') renderFlatMode()
      else renderNavMode()
    }

    function handleCreateFolder() {
      const name = prompt('请输入新收纳盒的名称：')
      if (!name || !name.trim()) return
      const id = '_user_' + Date.now()
      userFolders[id] = name.trim()
      localStorage.setItem(S_USER_FOLDERS, JSON.stringify(userFolders))

      if (!navOrder.includes(id)) {
        navOrder.push(id)
        localStorage.setItem(S_ORDER, JSON.stringify(navOrder))
      }
      activeStack.unshift(id)
      localStorage.setItem(S_ACTIVE_STACK, JSON.stringify(activeStack))

      if (currentMode === 'folder') renderNavMode()
      else alert('收纳盒已创建')
    }

    function handleRenameFolder(key, oldName) {
      const newName = prompt('重命名收纳盒:', oldName)
      if (!newName || !newName.trim() || newName === oldName) return

      userFolders[key] = newName.trim()
      localStorage.setItem(S_USER_FOLDERS, JSON.stringify(userFolders))
      renderNavMode()
    }

    function handleDestroyFolder(key, name) {
      if (!confirm(`确定要删除收纳盒【${name}】吗？`)) return
      delete userFolders[key]
      localStorage.setItem(S_USER_FOLDERS, JSON.stringify(userFolders))
      delete customData[key]
      localStorage.setItem(S_CUSTOM_DATA, JSON.stringify(customData))
      activeStack = activeStack.filter((k) => k !== key)
      localStorage.setItem(S_ACTIVE_STACK, JSON.stringify(activeStack))
      renderNavMode()
    }

    // ==========================================
    // 5. 拖拽逻辑
    // ==========================================

    function bindNavChipDrag(chip) {
      chip.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move'
        chip.classList.add('dragging')
      })
      chip.addEventListener('dragend', () => {
        chip.classList.remove('dragging')
        const navBar = document.getElementById('medal-nav-bar')
        const chips = Array.from(navBar.querySelectorAll('.nav-chip[data-key]'))
        navOrder = chips
          .map((c) => c.dataset.key)
          .filter((k) => k !== '_pinned')
        localStorage.setItem(S_ORDER, JSON.stringify(navOrder))
      })
      chip.addEventListener('dragover', (e) => {
        e.preventDefault()
        const dragging = document.querySelector('.nav-chip.dragging')
        if (!dragging || dragging === chip) return

        const navBar = document.getElementById('medal-nav-bar')
        const siblings = [
          ...navBar.querySelectorAll('.nav-chip[data-key]:not(.dragging)'),
        ]
        const nextSibling = siblings.find((sib) => {
          const box = sib.getBoundingClientRect()
          return e.clientX < box.right
        })
        if (nextSibling) navBar.insertBefore(dragging, nextSibling)
        else
          navBar.insertBefore(dragging, document.querySelector('.btn-collapse'))
      })
    }

    function bindMedalDrag(img, boxKey, medalName) {
      img.addEventListener('dragstart', (e) => {
        e.stopPropagation()
        e.dataTransfer.effectAllowed = 'copyMove'
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ type: 'medal-remove', boxKey, name: medalName })
        )
        img.closest('.myblok').classList.add('dragging-medal')
      })
      img.addEventListener('dragend', () => {
        img.closest('.myblok').classList.remove('dragging-medal')
      })
    }

    function bindGlobalDropZone() {
      const zone = document.body
      zone.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      })
      zone.addEventListener('drop', (e) => {
        if (currentMode === 'flat') return
        const rawData = e.dataTransfer.getData('application/json')
        if (!rawData) return
        try {
          const data = JSON.parse(rawData)
          if (
            data.type === 'medal-remove' &&
            !e.target.closest('.medal-box-content')
          ) {
            e.preventDefault()
            if (confirm(`从盒子移除【${data.name}】？`)) {
              customData[data.boxKey] = customData[data.boxKey].filter(
                (n) => n !== data.name
              )
              localStorage.setItem(S_CUSTOM_DATA, JSON.stringify(customData))
              renderNavMode()
            }
          }
        } catch (err) {}
      })
    }

    // ==========================================
    // 6. 搜索弹窗
    // ==========================================
    let currentSearch = { key: null, name: null, mode: 'add' }

    function buildSearchModal() {
      if (document.querySelector('.medal-search-modal')) return
      const modal = document.createElement('div')
      modal.className = 'medal-search-modal'
      modal.innerHTML = `
            <div class="search-box">
                <div class="search-header">
                    <span id="search-modal-title">勋章操作</span>
                    <span class="search-close">✕</span>
                </div>
                <div class="search-input-wrapper">
                    <input type="text" id="medal-search-input" placeholder="输入关键字..." autocomplete="off">
                </div>
                <ul class="search-list" id="medal-search-list"></ul>
            </div>
        `
      document.body.appendChild(modal)
      modal.querySelector('.search-close').onclick = closeSearchModal
      modal.onclick = (e) => {
        if (e.target === modal) closeSearchModal()
      }
      modal
        .querySelector('#medal-search-input')
        .addEventListener('input', (e) => renderSearchList(e.target.value))
    }

    function openSearchModal(boxKey, boxName, mode) {
      currentSearch = { key: boxKey, name: boxName, mode: mode }
      const modal = document.querySelector('.medal-search-modal')
      const title = modal.querySelector('#search-modal-title')
      const header = modal.querySelector('.search-header')
      const listEl = modal.querySelector('#medal-search-list')
      const input = modal.querySelector('#medal-search-input')

      header.dataset.mode = mode
      title.innerText =
        mode === 'add' ? `添加至【${boxName}】` : `从【${boxName}】移除`
      input.placeholder = mode === 'add' ? '搜索背包勋章...' : '搜索盒内勋章...'
      listEl.dataset.mode = mode

      input.value = ''
      modal.classList.add('active')
      renderSearchList('')
      input.focus()
    }

    function closeSearchModal() {
      document.querySelector('.medal-search-modal').classList.remove('active')
      currentSearch.key = null
    }

    function renderSearchList(keyword) {
      const listEl = document.getElementById('medal-search-list')
      listEl.innerHTML = ''
      const key = keyword.trim().toLowerCase()

      let sourceList = []
      if (currentSearch.mode === 'add') {
        sourceList = allMedalList
      } else {
        const names = customData[currentSearch.key] || []
        sourceList = names
          .map((n) => {
            const node = allMedalsMap.get(n)
            return { name: n, src: node ? node.querySelector('img').src : '' }
          })
          .filter((item) => item.src)
      }

      let matches =
        !key && currentSearch.mode === 'remove'
          ? sourceList
          : sourceList.filter((m) => m.name.toLowerCase().includes(key))

      if (matches.length === 0) {
        listEl.innerHTML = '<div class="search-empty">没有找到匹配的勋章</div>'
        return
      }

      matches.forEach((m) => {
        const li = document.createElement('li')
        li.className = 'search-item'
        const actionIcon =
          currentSearch.mode === 'add'
            ? ''
            : '<span class="search-item-remove-icon">×</span>'
        li.innerHTML = `<img src="${m.src}"><span>${m.name}</span>${actionIcon}`
        li.onclick = () => {
          if (currentSearch.mode === 'add') confirmAddMedal(m.name)
          else confirmRemoveMedal(m.name)
        }
        listEl.appendChild(li)
      })
    }

    function confirmAddMedal(medalName) {
      if (customData[currentSearch.key].includes(medalName)) {
        const header = document.querySelector(
          '.medal-search-modal .search-header'
        )
        const oldBg = header.style.background
        header.style.background = '#ffeb3b'
        setTimeout(() => (header.style.background = oldBg), 300)
        return
      }
      customData[currentSearch.key].push(medalName)
      localStorage.setItem(S_CUSTOM_DATA, JSON.stringify(customData))
      renderNavMode()
      closeSearchModal()
    }

    function confirmRemoveMedal(medalName) {
      customData[currentSearch.key] = customData[currentSearch.key].filter(
        (n) => n !== medalName
      )
      localStorage.setItem(S_CUSTOM_DATA, JSON.stringify(customData))
      renderSearchList(document.getElementById('medal-search-input').value)
      renderNavMode()
    }

    // 启动入口
    let retry = 0
    const timer = setInterval(() => {
      const c = document.querySelector('.myfldiv')
      if (
        c &&
        (c.querySelector('[data-category]') || c.querySelector('[categories]'))
      ) {
        clearInterval(timer)
        init()
      } else if (retry > 40) clearInterval(timer)
      retry++
    }, 200)
  }
  if (
    medalRegex.test(currentUrl) ||
    medalRegexEx.test(currentUrl) ||
    postInsideRegex.test(currentUrl) ||
    postRegex.test(currentUrl)
  ) {
    console.log('勋章博物馆')
    // 勋章商城、荣誉勋章、奖励勋章、二手市场和我的勋章页面的勋章图片的点击跳转开关
    const xunzhangSwitch = 1

    // 帖子详情页用户头像下展示的勋章图片的点击跳转开关
    const threadSwitch = 1

    // 二手市场页面的勋章记录的文字的点击跳转开关
    const recordSwitch = 1

    // 勋章名称到帖子的映射表
    const name2url = {
      '詹姆斯·维加': '12025',
      '詹姆斯‧维加': '12025',
      '詹姆斯·维加（James Vega）': '12025',
      奧倫: '12027',
      '奧倫（Auron）': '12027',
      奥伦: '12027',
      '奥伦（Auron）': '12027',
      '希德‧海温特': '12028',
      '希德‧海温特（Cid Highwind）': '12028',
      '吉姆‧雷诺': '12030',
      '吉姆‧雷诺（Jim Raynor）': '12030',
      法卡斯: '12032',
      '法卡斯（Farkas）': '12032',
      维吉尔: '12033',
      '维吉尔（Vergil）': '12033',
      '皮尔斯‧尼凡斯': '12034',
      '皮尔斯‧尼凡斯（Piers Nivans）': '12034',
      '文森特·瓦伦丁': '12035',
      '文森特‧瓦伦丁': '12035',
      '文森特·瓦伦丁（Vincent Valentine）': '12035',
      巴尔弗雷亚: '12036',
      '巴尔弗雷亚（Balthier）': '12036',
      但丁: '12037',
      '但丁（Dante）': '12037',
      盖里: '12040',
      '盖里（Gary）': '12040',
      '杰夫‧莫罗': '12041',
      '杰夫‧莫罗（Jeff Moreau）': '12041',
      威尔卡斯: '12042',
      '威尔卡斯（Vilkas）': '12042',
      '克里斯·雷德菲尔德': '12043',
      '克里斯‧雷德菲尔德': '12043',
      '克里斯·雷德菲尔德（Chris Redfield）': '12043',
      裸体克里斯: '12044',
      一丝不挂克里斯: '12044',
      '一丝不挂克里斯（Naked Chris）': '12044',
      '凯登‧阿兰科': '12045',
      '凯登‧阿兰科（Kaidan Alenko）': '12045',
      肥皂: '12046',
      '肥皂（John“Soap”MacTavish）': '12046',
      '奥利弗‧奎恩': '12047',
      '奥利弗‧奎恩（Oliver Queen）': '12047',
      收到情书: '12048',
      送情书: '12048',
      丢肥皂: '12049',
      捡到了肥皂: '12049',
      千杯不醉: '12050',
      灵光补脑剂: '12051',
      贞洁内裤: '12052',
      炼金之心: '12053',
      黑暗交易: '12054',
      水泡术: '12055',
      召唤古代战士: '12056',
      祈祷术: '12057',
      嗜血斩首斧: '12058',
      符文披风: '12059',
      净化手杖: '12060',
      圣光法杖: '12060',
      十字叶章: '12061',
      刺杀者匕首: '12062',
      药剂背袋: '12063',
      知识大典: '12064',
      怪笑的面具: '12065',
      诡笑的面具: '12065',
      奸笑的面具: '12065',
      恐怖的面具: '12065',
      微笑的面具: '12065',
      邪恶的面具: '12065',
      被踩烂的小草: '12066',
      抖不停小草: '12066',
      抖来抖去小草: '12066',
      微抖小草: '12066',
      种植小草: '12066',
      聚魔花盆: '12067',
      金钱马车: '12068',
      牧羊人: '12069',
      森林羊男: '12070',
      被祝福の新旅程: '12071',
      被祝福的新旅程: '12071',
      另一个身份: '12072',
      神之匠工: '12073',
      'Chris Redfield in Uroboros': '12074',
      站员薪俸: '12075',
      保卫领土: '12075',
      '站员: 保卫领土': '12075',
      实习版主薪俸: '12076',
      神的重量: '12076',
      '见习版主: 神的重量': '12076',
      版主薪俸: '12077',
      一国之主: '12077',
      '版主: 一国之主': '12077',
      梅格: '12085',
      '梅格（Meg）': '12085',
      '里昂·S·甘乃迪': '12086',
      '里昂‧S‧甘乃迪': '12086',
      '里昂·S·甘乃迪（Leon·S·Kennedy）': '12086',
      重磅手环: '12087',
      亚力斯塔尔: '12088',
      '亚力斯塔尔（Alistair）': '12088',
      '罗伯‧史塔克': '12090',
      '罗伯‧史塔克（Robb Stark）': '12090',
      '亚当‧简森': '12091',
      '亚当‧简森（Adam Jensen）': '12091',
      猫化弩哥: '12092',
      '猫化弩哥（Daryl Dixon）': '12092',
      高端噬魂者: '12093',
      魂之佳肴: '12093',
      狼狈噬魂者: '12093',
      吞食魂魄: '12093',
      超级名贵无用宝剑: '12094',
      念念往日士官盔: '12095',
      老旧之椅: '12096',
      灵魂之椅: '12096',
      流失之椅: '12096',
      漂洋小船: '12097',
      菠菜人的尸体: '12098',
      发现菠菜人: '12098',
      元气菠菜人: '12098',
      种植菠菜: '12098',
      洞窟魔蛋: '12099',
      吸血魔蝠: '12099',
      夜灯: '12100',
      诺曼底号: '12101',
      堕落之舞: '12102',
      黄色就是俏皮: '12103',
      骑兽之子: '12104',
      质量效应三部曲: '12105',
      五花八门版块: '12106',
      '辐射：新维加斯': '12107',
      TRPG版块: '12108',
      TRPG版塊: '12108',
      '上古卷轴V：天际': '12109',
      一只可爱的小猫: '12111',
      猫眼: '12112',
      謎の男: '12113',
      站长の守护: '12113',
      '布莱恩·欧康纳': '12121',
      '布莱恩‧欧康纳': '12121',
      '布莱恩·欧康纳（Brian O`Conner）': '12121',
      '迪恩‧温彻斯特': '12122',
      '迪恩‧温彻斯特（Dean Winchester）': '12122',
      '山姆‧温彻斯特': '12123',
      '山姆‧温彻斯特（Sam Winchester）': '12123',
      魔术师奥斯卡: '12124',
      '魔术师奥斯卡（Magician Oscar）': '12124',
      卡斯迪奥: '12125',
      '卡斯迪奥（Castiel）': '12125',
      虎克船长: '12126',
      '虎克船长（Captain Hook）': '12126',
      '卢西亚诺‧科斯塔': '12127',
      '卢西亚诺‧科斯塔（Luciano Costa）': '12127',
      '史蒂夫‧金克斯': '12128',
      '史蒂夫‧金克斯（Steve Jinks）': '12128',
      遗忘之水: '12129',
      咆哮诅咒: '12130',
      充满魔力的种子: '12131',
      闪耀种子: '12131',
      夜魔果实: '12131',
      夜魔护符: '12131',
      夜魔藤: '12131',
      柏木炭: '12132',
      柏树枝: '12132',
      木柴堆: '12132',
      木精灵短弓: '12132',
      暗红矿土: '12133',
      炼化龙血石: '12133',
      龙血水晶: '12133',
      龙血指环: '12133',
      阿呆: '12134',
      鼻涕精灵: '12134',
      不灭的蓝宝石: '12134',
      奇怪的刮刮卡: '12134',
      神秘的邀请函: '12134',
      天然有鸡: '12134',
      指路幽灵: '12134',
      吃饱金币的Doge: '12135',
      吃掉金币的Doge: '12135',
      迷のDoge: '12135',
      喜欢金币的Doge: '12135',
      '龙腾世纪：审判': '12137',
      堕落飨宴: '12139',
      TRPG纪念章: '12140',
      德拉克神圣灵魂瓶: '12141',
      德拉克圣瓶: '12141', // '迷之瓶':'12141',
      // '德拉克魔瓶':'68501',
      '戴蒙‧萨尔瓦托': '12143',
      '戴蒙‧萨尔瓦托（Damon Salvatore）': '12143',
      '库伦 (起源)': '12144',
      '库伦(起源)': '12144',
      '库伦(起源)（Cullen (Origins)）': '12144',
      '安德森‧戴维斯': '12145',
      '安德森‧戴维斯（Anderson Davis）': '12145',
      圣英灵秘银甲: '12146',
      圣英灵凯尔: '12146',
      禽兽扒手: '12147',
      奥兹大陆: '12148',
      海上明月: '12149',
      葛莱分多: '12150',
      赫夫帕夫: '12150',
      霍格沃茨五日游: '12150',
      雷文克劳: '12150',
      麻瓜: '12150',
      史莱哲林: '12150',
      铁杆影迷: '12151',
      '泡沫浮髅(Squirt)': '12152',
      铁牛: '12153',
      '铁牛（Iron Bull）': '12153',
      '康纳‧沃什': '12154',
      '康纳‧沃什（Connor Walsh）': '12154',
      '尼克·贝特曼': '12155',
      '尼克‧贝特曼': '12155',
      '尼克·贝特曼（Nick Bateman）': '12155',
      离去的尤利西斯: '12156',
      尤利西斯: '12156',
      '尤利西斯（Ulises）': '12156',
      布衣: '12157',
      '布衣+1 良好的': '12157',
      '布衣+10 史诗的': '12157',
      '布衣+11 史诗的': '12157',
      '布衣+12 传奇的': '12157',
      '布衣+13 歷战的': '12157',
      '布衣+13 歴战的': '12157',
      '布衣+2 上等的': '12157',
      '布衣+3 精致的': '12157',
      '布衣+4 精致的': '12157',
      '布衣+5 精致的': '12157',
      '布衣+6 精致的': '12157',
      '布衣+7 无暇的': '12157',
      '布衣+8 无暇的': '12157',
      '布衣+9 无暇的': '12157',
      锻造卷轴: '12163',
      '巴特·贝克': '12245',
      '巴特‧贝克': '12245',
      '巴特·贝克（Bart Baker）': '12245',
      被释放的灵魂: '12246',
      诡异的灵魂石: '12246',
      奇怪的紫水晶: '12246',
      预知水晶球: '12248',
      艾尔尤因: '12348',
      名剑艾尔尤因: '12348',
      灵剑艾尔尤因: '12348',
      圣剑艾尔尤因: '12348',
      '杰森·斯坦森': '12349',
      '杰森‧斯坦森': '12349',
      '杰森·斯坦森（Jason Statham）': '12349',
      神圣十字章: '12350',
      '哈尔·乔丹': '12351',
      '哈尔‧乔丹': '12351',
      '哈尔·乔丹（Hal Jordan）': '12351',
      新月护符: '12352',
      发芽的种子: '12353',
      可爱的三叶草: '12353',
      破土而出的嫩芽: '12353',
      神奇四叶草: '12353',
      艾德尔: '12376',
      '艾德尔（Edér Teylecg）': '12376',
      '盖拉斯‧瓦卡瑞安': '12377',
      '盖拉斯‧瓦卡瑞安（Garrus Vakarian）': '12377',
      史莱姆牧场: '12378',
      '史莱姆养殖证书/史莱姆牧场': '12378',
      史莱姆养殖证书: '12378',
      丛林的鸟飞走了: '12379',
      丛林露出来的鸟: '12379',
      非常茂盛的丛林: '12379',
      这是一片丛林: '12379',
      种植菊花: '12380',
      菊花发芽了: '12380',
      菊花等着开花: '12380',
      '啊！菊花开了！': '12380',
      把菊花卖了: '12380',
      秘密森林: '12547',
      '戴尔·芭芭拉': '12645',
      '戴尔‧芭芭拉': '12645',
      '戴尔·芭芭拉（Dale "Barbie" Barbara）': '12645',
      婴儿泪之瓶: '12646',
      雪王的心脏: '12647',
      萨赫的蛋糕: '12653',
      勇者与龙之书: '12655',
      '落雪勇者与龙的传说-封面': '12655',
      '落雪勇者与龙的传说-第一页': '12655',
      '落雪勇者与龙的传说-第二页': '12655',
      '落雪勇者与龙的传说-第三页': '12655',
      '落雪勇者与龙的传说-第四页': '12655',
      '落雪勇者与龙的传说-第五页': '12655',
      '落雪勇者与龙的传说-第六页': '12655',
      '落雪勇者与龙的传说-第七页': '12655',
      '落雪勇者与龙的传说-第八页': '12655',
      '落雪勇者与龙的传说-书尾': '12655',
      破损的旧书: '12655',
      '雪勇者与龙的传说-书尾': '12655',
      'Frank （LBF）': '12658',
      'Frank (LBF)': '12658',
      'BIG BOSS': '12659',
      '詹米·多南': '12670',
      '詹米·多南（Jamie Dornan）': '12670',
      '库伦（审判）': '12700',
      '库伦(审判)': '12700',
      '库伦 (审判)': '12700',
      神秘商店贵宾卡: '12701',
      史莱姆蛋: '12931',
      心之水晶: '13183',
      '阿尔萨斯·米奈希尔': '13286',
      '阿尔萨斯‧米奈希尔': '13286',
      '阿尔萨斯·米奈希尔（Arthas Menethil）': '13286',
      低阶战斗牧师: '13287',
      高阶神圣祭司: '13287',
      渐逝忠诚之魂: '13287',
      '维克多·天火': '13287',
      '维克多‧天火': '13287',
      优雅的圣职者: '13287',
      云游中的助祭: '13287',
      '天涯.此时': '13562',
      '天涯‧此时': '13562',
      快破掉的蛋: '13563',
      偷情的月兔男: '13563',
      小月兔: '13563',
      月亮的蛋: '13563',
      月兔男: '13563',
      骑士遗盔: '13572',
      背弃之证: '14029',
      传承之证: '14029',
      新年小猴: '15171',
      变形软泥: '15284',
      冥界之眼: '15284',
      魔眼护符: '15284',
      冥界魔眼: '15284',
      '克里斯·埃文斯': '15285',
      '克里斯·埃文斯（Chris Evans）': '15285',
      '安德鲁·库珀': '15286',
      '安德鲁·库珀（Andrew Cooper）': '15286',
      '罗宾·西克': '15580',
      '罗宾·西克（Robin Thicke）': '15580',
      章鱼小丸子: '15581',
      华灯初上: '15660',
      岛田半藏: '17946',
      '岛田半藏（Shimada Hanzo）': '17946',
      归途: '68056',
      浪潮之歌: '68056',
      奇怪的鱼: '68056',
      奇异的光线: '68056',
      驱逐: '68056',
      人鱼男子: '68056',
      人鱼之泪: '68056',
      泄密: '68056',
      许愿: '68056',
      罪恶: '68056',
      安静的海边: '68056',
      '生化危机：复仇': '68057',
      '亚瑟·摩根': '68058',
      '亚瑟‧摩根': '68058',
      '亚瑟·摩根（Arthur Morgan）': '68058',
      '亚瑟·库瑞': '68059',
      '亚瑟‧库瑞': '68059',
      '亚瑟·库瑞（海王）': '68059',
      '亚瑟·库瑞（Arthur Curry）': '68059',
      变骚喷雾: '68060',
      网中的皮卡丘: '68061',
      红龙蛋: '68272',
      驯化红龙幼崽: '68272',
      红龙幼崽: '68272',
      黑龙蛋: '68273',
      驯化黑龙幼崽: '68273',
      黑龙幼崽: '68273',
      腐化龙蛋: '68274',
      驯化腐化龙幼崽: '68274',
      腐化龙幼崽: '68274',
      龙之魂火: '68448',
      粗糙的骨锤: '68449',
      红龙精华: '68449',
      华丽的骨锤: '68449',
      烤龙肉: '68449',
      龙骨残余: '68449',
      红龙宝珠碎片: '68451',
      珊瑚色捕梦网: '68451',
      红龙秘宝: '68451',
      '倒吊人(The Hanged Man , XII)': '68452',
      '战车(The Chariot , VII)': '68453',
      '泰凯斯·芬得利': '68497',
      '泰凯斯·芬得利（Tychus Findlay）': '68497',
      '【夏日限定】夏日的泰凯斯': '68498',
      夏日的泰凯斯: '68498',
      野兽之子: '68499',
      康纳: '68500',
      '康纳/Connor': '68500',
      '康纳（Conner）': '68500',
      德拉克魔瓶: '68501',
      迷之瓶: '68501',
      石肤术: '68502',
      '恋人(The Lovers，VI)': '68594',
      恋人: '68594',
      '魔术师（The Magician，I）': '68733',
      恋恋小烹锅: '69034',
      黑曜石赤螯蝎: '69215',
      漆黑的蝎卵: '69215',
      蛮族战士: '69216',
      山猫图腾: '69217',
      猎鹰图腾: '69218',
      眼镜蛇图腾: '69219',
      布莱克沃尔: '69251',
      黑墙: '69251',
      守望者雷涅尔: '69251',
      汤姆雷涅尔: '69251',
      '黑墙（Blackwall）': '69251',
      '汤姆 雷涅尔': '69251',
      守望者徽章: '69252',
      高阶守望者徽章: '69252',
      守望者指挥官徽章: '69252',
      满是血迹的徽章: '69252',
      没有梦想的咸鱼: '69254',
      '内森·德雷克': '69255',
      '内森·德雷克（Nathan Drake）': '69255',
      '丹尼尔·纽曼': '69256',
      '丹尼爾·紐曼': '69256',
      '丹尼尔·纽曼（Daniel Newman）': '69256',
      石鬼面: '69257',
      秋水长天: '69302',
      落霞孤鹜: '69302',
      贝优妮塔: '69503',
      GM村金蛋: '69504',
      生金蛋的鹅: '69504',
      兴奋的鹅: '69504',
      休息的鹅: '69504',
      '【年中限定】GM村金蛋': '69504',
      模拟人生4: '69505',
      模擬人生4: '69505',
      晃晃悠悠小矿车: '69660',
      '空矿车-日': '69660',
      '日-黑曜石': '69660',
      '日-琥珀': '69660',
      '日-精金': '69660',
      '日-蓝宝石 ': '69660',
      '日-煤': '69660',
      '日-山铜': '69660',
      '日-石头': '69660',
      '日-铁': '69660',
      '日-亚历山大石': '69660',
      '夜-电气石': '69660',
      '夜-金': '69660',
      '夜-铁': '69660',
      '夜-亚历山大石': '69660',
      '夜-月光石': '69660',
      英普瑞斯: '69799',
      '杰西·麦克雷': '69800',
      卡德加: '69801',
      '卡德加（Khadgar）': '69801',
      麦迪文: '69802',
      '麦迪文（Medivh）': '69802',
      达拉然: '69803',
      艾尔登法环: '176549',
      德拉克魂匣: '69804',
      圣甲虫秘典: '69805',
      '安杜因·乌瑞恩': '70367',
      '安杜因·乌瑞恩(Anduin Wrynn)': '70367',
      '羅素·托維': '70368',
      冒险专用绳索: '70370',
      红石: '70372',
      可疑的红石: '70372',
      伪造的红石: '70372',
      结晶火鹰幼崽: '70373',
      结晶卵: '70373',
      暮光独角兽幼崽: '70375',
      暮色卵: '70375',
      发光的暮色卵: '70375',
      狂暴的书籍: '70715',
      莱托文本残页: '70715',
      躁动的书籍: '70715',
      '赫尔墨斯·看守者之杖': '70996',
      闪耀的赫尔墨斯之杖: '70996',
      失控的赫尔墨斯之杖: '70996',
      '阿列克西欧斯(Alexios)': '70997',
      '阿列克西欧斯（Alexios）': '70997',
      冰冷的遗骸: '70998',
      '蓝礼·拜拉席恩': '70998',
      '蓝礼·重生鹿三': '70998',
      亲和的列王: '70998',
      英俊的王弟: '70998',
      青鸾: '71001',
      青鸾蛋: '71001',
      电磁巨鳄: '71002',
      电磁卵: '71002',
      风暴磁场之鳄: '71002',
      凶猛的鳄鱼: '71002',
      一只普通的鳄鱼: '71002',
      '荒野大镖客:救赎 II': '71004',
      '荒野大镖客：救赎 II': '71004',
      鬼火竹筒: '71005',
      神秘的竹筒: '71005',
      幽灵竹筒: '71005',
      阿帕茶: '71006',
      强者の茶: '71006',
      神秘的红茶: '71006',
      种植土豆: '71007',
      挖了个坑: '71007',
      土豆发芽了: '71007',
      土豆开花了: '71007',
      收获土豆: '71007',
      静谧的洞窟: '71007',
      巴啦啦小魔仙棒: '71008',
      充能的魔仙棒: '71008',
      闪耀的魔仙棒: '71008',
      失效的魔仙棒: '71008',
      白猪猪储蓄罐: '71514',
      爆炸的储蓄罐: '71514',
      '白猪猪储蓄罐㊖': '71514',
      粉猪猪储蓄罐: '71515',
      碎裂的储蓄罐: '71515',
      '粉猪猪储蓄罐㊖': '71515',
      撑破的储蓄罐: '71516',
      金猪猪储蓄罐: '71516',
      '金猪猪储蓄罐㊖': '71516',
      德拉克的遗物: '71578',
      虹之女神像: '71578',
      破旧的石像: '71578',
      遗物搜寻: '71578',
      展开地图: '71578',
      不败之花: '71579',
      雾都血医: '71885',
      春之歌: '71886',
      冬之歌: '71886',
      秋之歌: '71886',
      四季之歌: '71886',
      夏之歌: '71886',
      喷涌的粪桶: '71887',
      用过的粪桶: '71887',
      箭术卷轴: '71889',
      心心念念小雪人: '71890',
      '【圣诞限定】心心念念小雪人': '71890',
      十字军护盾: '72051',
      龙血之斧: '72052',
      魔法石碑: '72053',
      远古石碑: '72054',
      '莱因哈特·威尔海姆': '72137',
      吃了一半的面包: '72138',
      吃完的面包: '72138',
      冒险用面包: '72138',
      香喷喷的面包: '72138',
      海螺号角: '72139',
      迷之天鹅: '72140',
      天鹅鬼琴: '72140',
      初衷的力量: '72200',
      临危受命: '72200',
      '尼克斯·乌尔里克': '72200',
      曙光下的灰烬: '72200',
      铁汉柔情: '72200',
      王者之剑: '72200',
      '乔纳森·里德': '72201',
      蔷薇骑士之刃: '72202',
      狩猎用小刀: '72203',
      '阿拉喵？神灯': '72204',
      沙漠神灯: '72204',
      老旧的怀表: '72225',
      发光的怀表: '72225',
      无尽的怀表: '72225',
      冒险用指南针: '72226',
      珊瑚泡泡鱼: '72227',
      珊瑚色礁石蛋: '72227',
      草原孤狼: '72228',
      月影蛋: '72228',
      月影狼: '72228',
      藤田優馬: '72920',
      莫瑞甘: '72921',
      荒野女巫: '72921',
      被狩猎的女巫: '72921',
      轻蔑的女术士: '72921',
      秘法顾问: '72921',
      谜踪女巫: '72921',
      钢铁勇士弯刀: '72922',
      海盗弯钩: '72923',
      生锈的海盗刀枪: '72924',
      洗刷的了海盗刀枪: '72924',
      意气风发的海盗刀枪: '72924',
      草原之象: '72925',
      马戏团灰蛋: '72925',
      马戏团狂欢象: '72925',
      迈克尔迈尔斯: '73626',
      Doc: '73627',
      '火柴 - Gamemale': '73628',
      '火柴 - 果体美男子': '73628',
      '火柴 - 美食大全': '73628',
      暖心小火柴: '73628',
      暴风雨中的漂流瓶: '73629',
      繁忙船道上的漂流瓶: '73629',
      孤岛旁的漂流瓶: '73629',
      极地穿越的漂流瓶: '73629',
      秘密森林的漂流瓶: '73629',
      密林仙境中的漂流瓶: '73629',
      秋日麦田的漂流瓶: '73629',
      沙滩上的漂流瓶: '73629',
      神秘的漂流瓶: '73629',
      神秘古城的漂流瓶: '73629',
      驶出水渠的漂流瓶: '73629',
      信仰之心: '73629',
      森林鹿: '73630',
      一只小鹿: '73630',
      郁苍卵: '73630',
      熔岩蛋: '73631',
      熔岩鹰: '73631',
      '杰克·莫里森': '74196',
      '杰克·莫里森/士兵 76': '74196',
      '士兵 76': '74196',
      '索林·橡木盾': '74198',
      '索林·此生挚爱': '74198',
      '索林·孤山之王': '74198',
      '索林·临终一役': '74198',
      陷阱杀手: '74199',
      日荒戒指: '74201',
      月陨戒指: '74202',
      灵鹫蛋: '74203',
      圣光灵鹫: '74203',
      心领神会: '74203',
      御风之灵: '74203',
      滴血认亲: '74204',
      猩红魔鹫: '74204',
      血鹫蛋: '74204',
      血色威仪: '74204',
      月上柳梢: '74206',
      '吉姆·霍普': '75042',
      接近阴谋: '75042',
      警长: '75042',
      老父亲: '75042',
      谜: '75042',
      十一: '75042',
      '沃特·沙利文': '75043',
      '塞巴斯蒂安·斯坦': '75044',
      '魯杰羅·弗雷迪': '75045',
      星芒戒指: '75046',
      冒险用绷带: '75047',
      日渐染血的绷带: '75047',
      逐渐用完的绷带: '75047',
      '绷带内裤？': '75047',
      宝箱内的球: '75048',
      空荡荡的精灵球: '75048',
      迷拟Q: '75048',
      皮卡丘: '75048',
      和你一起飞行的皮卡丘: '75048',
      软泥怪: '75049',
      软泥怪蛋: '75049',
      '寶可夢 Pokémon': '75057',
      血石: '75131',
      恶魔阿蕾莎: '75750',
      莎伦: '75750',
      消失的阿蕾莎: '75750',
      疾风剑豪: '75751',
      亚索: '75751',
      '【新手友好】昆進': '75752',
      昆進: '75752',
      萨菲罗斯: '75753',
      'SCP-s-1889': '75754',
      'SCP-s-1889-第二页': '75754',
      'SCP-s-1889-第六页': '75754',
      'SCP-s-1889-第七页': '75754',
      'SCP-s-1889-第三页': '75754',
      'SCP-s-1889-第四页': '75754',
      'SCP-s-1889-第五页': '75754',
      'SCP-s-1889-第一页': '75754',
      GHOST: '75755',
      最终幻想XIV: '75756',
      掌中雪球瓶: '75757',
      猫猫幽灵: '76082',
      万圣南瓜: '76083',
      '丹·安博尔': '76095',
      '汤姆·赫兰德': '76096',
      超人: '76097',
      '阿尔伯特·威斯克': '76556',
      鬼王酒吞童子: '76557',
      'Scott Ryder': '76558',
      GM论坛初心者毕业证书: '76559',
      GM论坛初心者勋章: '76559',
      GM论坛进阶勋章: '76559',
      GM论坛荣誉勋章: '76559',
      GM论坛勋章: '76559',
      GM論壇初心者勛章: '76559',
      GM論壇勛章: '76559',
      GM論壇進階勛章: '76559',
      GM論壇榮譽勛章: '76559',
      GM論壇初心者畢業證書: '76559',
      社畜专用闹钟: '76560',
      暗纹鲨: '76561',
      螺旋纹卵: '76561',
      邦尼尼: '76562',
      万圣彩蛋: '76562',
      风雪之家: '76563',
      赛博朋克2077: '76564',
      气球带来的礼物: '76565',
      闪亮拐杖糖: '76565',
      神秘的礼物: '76565',
      圣诞袜: '76565',
      '汉克/Hank': '77158',
      'Hank - 推倒': '77158',
      'Hank - 抉择': '77158',
      'Hank - 重逢': '77158',
      三角头: '77159',
      守护者三角头: '77159',
      刽子手三角头: '77159',
      寂静岭三角头: '77159',
      幻象: '77160',
      琉璃玉坠: '77161',
      蠢蠢欲动的宝箱: '77162',
      冒险用宝箱: '77162',
      奇怪的宝箱: '77162',
      不曾寄出的信件: '77163',
      羽毛笔: '77163',
      星光彩虹小粉驼: '77164',
      幽光彩蛋: '77164',
      沙漠鸵鸟: '77165',
      沙漠羽蛋: '77165',
      恶魔城: '77166',
      老旧的书籍: '78151',
      伊波恩之书: '78151',
      凝视夜空: '78151',
      金刚狼: '78152',
      罗根: '78152',
      暮狼归来: '78152',
      逆转未来: '78152',
      克苏鲁: '78153',
      诡秘的雕像: '78153',
      翻卷的海潮: '78153',
      遥远的呼唤: '78153',
      无尽的深渊: '78153',
      '旧日支配者—克苏鲁': '78153',
      士官长: '78154',
      '约翰-117': '78154',
      繁星花: '78711',
      枯黄的种苗: '78711',
      微光苗: '78711',
      '托尼·史塔克': '79451',
      钢铁侠: '79451',
      '加勒特·霍克': '79453',
      艾吉奥: '79454',
      'Chris Mazdzer': '79456',
      武士之魂: '79457',
      削铁如泥的武士刀: '79457',
      乘风破浪的武士刀: '79457',
      超级无敌名贵金卡: '79458',
      林中松鼠: '79459',
      林中之蛋: '79459',
      云上之光: '79525',
      湖面云光: '79525',
      魔法灵药: '80303',
      波板糖: '80304',
      幼儿波板糖: '80304',
      彩虹許願星: '80304',
      '索尔·奥丁森': '81117',
      绯红女巫: '81119',
      泰比里厄斯: '81120',
      大古: '81121',
      GM村蛋糕: '81123',
      缘定仙桥: '81124',
      小小行星: '82408',
      炙热的格拉迪欧拉斯: '82409',
      格拉迪欧拉斯: '82410',
      王者之盾: '82410',
      '卡洛斯·奥利维拉': '82411',
      '巴基 (猎鹰与冬兵)': '82412',
      巴基: '82412',
      冬兵: '82412',
      碎旗者: '82412',
      英雄联盟: '82413',
      Joker: '83981',
      'V (DMC5)': '83983',
      Dante: '83984',
      Vergil: '83985',
      力量腕带: '83986',
      物理学圣剑: '83987',
      男巫之歌: '83988',
      很久很久以前: '83988',
      xx之歌: '83988',
      '××之歌': '83988',
      闪耀圣诞球: '84015',
      压箱底的泡面: '84534',
      岛田源氏: '85513',
      阿拉贡: '85514',
      '阿拉贡·护戒使者': '85514',
      '阿拉贡·疾风之足': '85514',
      '阿拉贡·亡魂之约': '85514',
      '阿拉贡·星辰之鹰': '85514',
      '阿拉贡·王者归来': '85514',
      瑟兰迪尔: '85516',
      异形: '85517',
      '“Space jockey”': '85517',
      '“普罗米修斯”': '85517',
      '威克多尔·克鲁姆': '85519',
      '赫敏·格兰杰': '85520',
      男用贞操带: '85521',
      'One Ring': '85522',
      巴拉多要塞: '85522',
      厄运山谷: '85522',
      烽火: '85522',
      黑暗消融: '85522',
      黑门: '85522',
      卡兰德拉斯: '85522',
      米纳斯提力斯: '85522',
      千军万马: '85522',
      瑞文戴尔: '85522',
      夏尔: '85522',
      成年独角兽: '85523',
      五彩斑斓的蛋: '85523',
      幼年独角兽: '85523',
      大恶魔: '85524',
      小恶魔: '85524',
      血红色的蛋: '85524',
      男色风暴: '85525',
      男色时代: '85525',
      男色诱惑: '85525',
      孔明灯: '87022',
      生命树叶: '88872',
      菀叶狸猫: '88872',
      不起眼的空瓶: '88874',
      大脚板: '88875',
      '小天狼星·布莱克': '88875',
      至情至性: '88875',
      甘道夫: '88876',
      '甘道夫·护戒使者': '88876',
      '甘道夫·涅槃重生': '88876',
      '甘道夫·曙光军师': '88876',
      '甘道夫·先圣仁心': '88876',
      灰袍甘道夫: '88876',
      莱戈拉斯: '88877',
      神灯: '88878',
      黑豹: '88879',
      时间变异管理局: '88880',
      时间尽头的虚空: '88880',
      遗留之人的城堡: '88880',
      缘起星空: '88880',
      '普隆普特·阿金塔姆': '91413',
      '诺克提斯·路西斯·伽拉姆': '91414',
      '阿不思·邓布利多': '91415',
      '魔法不朽·传奇不熄': '91415',
      孤注一掷: '91416',
      混血王子: '91416',
      青梅竹马: '91416',
      '西弗勒斯·斯内普': '91416',
      至死不渝: '91416',
      奥利维尼斯辉石头罩: '91418',
      卡勒罗斯辉石头罩: '91418',
      双贤辉石头罩: '91418',
      贤者头盔: '91418',
      恩惠护符: '91419',
      黄金护符: '91419',
      黄金树的恩惠: '91419',
      秘密空瓶: '91420',
      诺克史黛拉之月: '91420',
      星星泪滴: '91420',
      霍格沃兹魔法学校: '91424',
      霍格沃兹特快列车: '91424',
      梦中的列车: '91424',
      霍格沃茨特快列车: '91424',
      海边的蛋: '91425',
      夏日柯基: '91425',
      海边的邻居: '91427',
      '远亲不如近邻？': '91427',
      1984: '91428',
      疯人院: '91428',
      畸形秀: '91428',
      洛亚洛克: '91428',
      旅馆: '91428',
      '美恐：启程': '91428',
      '美恐：新的开始': '91428',
      女巫集会: '91428',
      启示录: '91428',
      邪教: '91428',
      玄生万物: '91429',
      '莱托·厄崔迪': '91431',
      海的记忆: '92246',
      独眼章鱼: '92248',
      海与天之蛋: '92248',
      豹王: '94945',
      为承父志: '94945',
      化敌为友: '94945',
      双重身份: '94945',
      再会恩师: '94945',
      不灭狂雷: '94946',
      '不灭狂雷-沃利贝尔': '94946',
      霹天雳地: '94946',
      苏醒巨熊: '94946',
      '初入黑道-桐生一马': '94947',
      '传说的黑道-桐生一马': '94947',
      '堂岛之龙-桐生一马': '94947',
      桐生一马: '94947',
      大黄蜂: '94948',
      '大黄蜂（ChevroletCamaro）': '94948',
      '擎天柱（Peterbilt389）': '94949',
      博伊卡: '94950',
      重回格斗场: '94950',
      回旋踢才是男人的浪漫: '94950',
      'The Brave Boyka': '94950',
      自由: '94950',
      飞天小糖果: '94952',
      闪光糖果盒: '94952',
      茉香啤酒: '94953',
      雷霆晶球: '94956',
      思绪骤聚: '94957',
      真理世界: '94957',
      超级幸运无敌辉石: '95016',
      卡利亚权杖: '95016',
      这是怎么辉石呢: '95016',
      香喷喷的烤鸡: '95018',
      小菜鸟: '95018',
      小凤凰: '95018',
      新手蛋: '95018',
      深渊遗物: '95019',
      星辰龙: '95019',
      星尘龙: '95019',
      街头霸王: '95020',
      奇思妙想: '97633',
      '旅行骰子！': '99612',
      埃及: '101343',
      马克: '101343',
      '马克·史贝特': '101343',
      信任: '101343',
      月光化身: '101343',
      月光骑士: '101343',
      '史蒂文·格兰特': '101345',
      史蒂文: '101345',
      幻觉: '101345',
      光化身: '101345',
      骑士先生: '101345', // '月光骑士':'101345',
      果体76: '101775',
      竹村五郎: '103957',
      内在: '103957',
      忠诚: '103957',
      前身: '103957',
      暗影烈焰: '103958',
      苍穹禁城: '103958',
      光之战士: '103958',
      红莲狂潮: '103958',
      晓月终焉: '103958',
      重生之境: '103958',
      Drover: '103959',
      流行巨星GM: '103960',
      '乔治·迈克尔': '103960',
      威猛主唱GM: '103960',
      性感男神GM: '103960',
      蛰伏中的GM: '103960',
      吃饱的小阿尔: '103961',
      饥饿的小阿尔: '103961',
      小阿尔的蛋: '103961',
      幸福的小阿尔: '103961',
      红心玉: '104061',
      '『还乡歌』': '108197',
      '『落樱缤纷』': '108197',
      '『樱花树灵』': '108197',
      '『日心说』': '108200',
      '『星象监测』': '108200',
      '『任天堂Switch』红蓝√': '108201',
      '『崭新的红蓝游戏机』': '108201',
      '『随时随地开启！』': '108201',
      '『任天堂Switch』灰黑√': '108202',
      '『崭新的灰黑游戏机』': '108202', // '『随时随地开启！』':'108202',
      '『私有海域』': '108899',
      '『钜鲸』': '108901',
      '『召唤好运的角笛』': '108903',
      '『圣洁化身』': '108905',
      '『矩阵谜钥Ⓖ』': '108908',
      '『确认购置新居?』': '108911',
      '『新居手册Ⓖ』': '108911',
      '『交钥匙了!』': '108911',
      '『户口本: Lv2~6』': '108918',
      '『居住证: Lv2~6』': '108918',
      '『正在入住GM村』': '108918',
      '『户口本: Lv7+』': '108920',
      '『居住证: Lv7+』': '108920',
      '『住在GM村』': '108920',
      牌中小丑: '109760',
      '牌中小丑 · 呼之欲出': '109760',
      '牌中小丑·呼之欲出': '109760',
      '诡案谜集·黑夜之星': '111098',
      黑夜之星: '111098',
      '诡案谜集·追击者': '111099',
      追击者: '111099',
      艾利克斯: '111280',
      '勒维恩·戴维斯': '111282',
      麻烦: '111282',
      失败: '111282',
      意外: '111282',
      远行: '111282',
      辗转: '111282',
      芝加哥: '111282',
      醉乡民谣: '111282',
      '丹·雷诺斯': '111283',
      '蒂法·洛克哈特': '111292',
      山村贞子: '111293',
      破旧打火机: '111294',
      我的冶金打火机: '111294',
      静置的双向圣杯: '111295',
      '双向圣杯：待焕活': '111295',
      '双向圣杯：焕然意志': '111295',
      '双向圣杯：血液循环仪式I': '111295',
      '双向圣杯：血液循环仪式II': '111295',
      '双向圣杯：咒术循环仪式I': '111295',
      双项圣杯: '111295',
      '双向圣杯：咒术循环仪式II': '111295',
      传送镜: '111680',
      镜中小鸟: '111680',
      神奇传送镜: '111680',
      '『叫价牌』': '111775',
      '『瓶中信』': '111775',
      '『弗霖的琴』': '112426',
      '『 弗霖的琴』': '112426',
      '『伊黎丝的祝福』': '112510',
      '『伊黎丝的赞词』': '112510',
      '『伊黎丝的赞美词』': '112510',
      '【周年限定】克里斯(8)': '112540',
      人到中年: '112540',
      上作剧情: '112540',
      永远的克叔: '112540',
      再次回归: '112540',
      '不屈之枪·阿特瑞斯': '112547',
      'Futūrum（未来）': '112555',
      弗图AI: '112555',
      弗图博士: '112555',
      乐园防御程式: '112555',
      恐惧气味: '112639',
      雷夜啸声: '112639',
      死神: '112639',
      死亡: '112639',
      死亡化身: '112639',
      业火死斗: '112639',
      業火死鬥: '112639',
      雷夜嘯聲: '112639',
      恐懼氣味: '112639',
      '九尾妖狐·阿狸': '112640',
      '丹妮莉丝·坦格利安': '112642',
      '希尔瓦娜斯·风行者': '112645',
      炽天使之拥: '112646',
      大天使之杖: '112646',
      女神之泪: '112646',
      遍江云霞: '112663',
      壶中冰心: '112663',
      千里潋滟: '112663',
      散佚的文集: '112663',
      狱炎蛋: '112666',
      狱炎魔犬: '112666',
      风物长宜: '113518',
      小小舞台: '115919',
      '『灰域来音』': '116029',
      '『开裂囊状物』': '117000',
      '『迷翳结晶：聚合颗粒』': '117000',
      '『迷翳结晶：囊状物』': '117000',
      '『迷翳结晶：收集颗粒』': '117000',
      '『迷翳之中』': '117000',
      '『眼榴』': '117000',
      '『迷翳森林回忆录』': '117679',
      探险三杰士: '117680',
      '『星河碎片』': '118047',
      '桑克瑞德·沃特斯': '118371',
      白野威: '118372',
      不知名的石像: '118372',
      复苏的天照: '118372',
      净化污秽的天照: '118372',
      失去力量的白狼: '118372',
      天照大神: '118372',
      刀锋女王: '118374',
      '刀锋女王 - 诞生': '118374',
      '刀锋女王 - 复仇': '118374',
      '刀锋女王 - 归宿': '118374',
      '刀锋女王 - 晋升': '118374',
      '刀锋女王 - 重生': '118374',
      海德林: '118375',
      你的答案: '118375',
      生死答问: '118375',
      维涅斯: '118375',
      '我已倾听，我已感受，我已思考': '118375',
      萨勒芬妮: '118376',
      星籁歌姬: '118376',
      令人不安的契约书: '118378',
      沼泽黏附者: '118378',
      灵藤蛋: '118380',
      迷你蔓生灵树: '118380',
      白巧克力蛋: '118475',
      猪庇特: '118475',
      猛虎贴贴: '118478',
      情难自抑: '118478',
      永浴爱河: '118478',
      绿茵宝钻: '119472',
      肉垫手套: '119473',
      百相千面: '120387',
      '百相千面-晦': '120387',
      '百相千面-殇': '120387',
      '百相千面-戏': '120387',
      阿齐斯: '120388',
      保加利亚妖王: '120388',
      纯爷们阿齐斯: '120388',
      温暖的小屋: '120388',
      真正的阿齐斯: '120388',
      白骨露于野: '120390',
      感召: '120390',
      涅槃: '120390',
      叛逆者: '120390',
      缘起: '120390',
      '纣王·子受': '120390',
      '阿尔瓦罗·索莱尔': '120391',
      喝奶茶的罗罗: '120391',
      认真练琴的罗罗: '120391',
      '认真练琴的罗罗]': '120391',
      走出失恋阴影的罗罗: '120391',
      自在旅行的罗罗: '120391',
      开心到旋转的罗罗: '120391',
      莫甘娜: '120393',
      凯尔: '120395',
      回忆之物: '120396',
      '露娜弗蕾亚·诺克斯·芙尔雷': '120396',
      未来的黎明: '120396',
      约定守护: '120396',
      众神祭祀: '120396',
      干涸的圣杯: '120397',
      和谐圣杯: '120397',
      邪恶圣杯: '120397',
      被尘封的诅咒之书: '120398',
      被尘封之书: '120398',
      '沉睡之神，拉莱耶之主—克苏鲁': '120398',
      海德拉: '120398',
      '黄衣之主—哈斯塔': '120398',
      黄衣之主召唤仪式: '120398',
      解封的死灵之书: '120398',
      旧日之印: '120398',
      '蠕动的混沌—奈亚拉托提普': '120398',
      '森之黑山羊母神—纱布尼古拉斯': '120398',
      死灵之书: '120398',
      '万物归一者—犹格·索托斯': '120398',
      可爱的小伯: '120400',
      睡着的小伯: '120400',
      我的天使: '120400',
      享受美食的小伯: '120400',
      兴奋的小伯: '120400',
      棕色条纹蛋: '120400',
      沉睡的格罗姆: '120401',
      苏醒的格罗姆: '120401',
      长花的蛋: '120401',
      龙鳞护盾: '121125',
      龙眼指环: '121125',
      龙爪王冠: '121125',
      龙之秘宝: '121125',
      炎龙火舌: '121125',
      图腾饼干: '123613',
      重建熊屋: '123614',
      虎头怪: '126105',
      妙手空空: '126105',
      神力无穷: '126105',
      十年一梦: '126105',
      鹰击: '126105',
      追忆: '126105',
      '克劳斯·迈克尔森': '126107',
      Klaus: '126107',
      'Niklaus Mikaelson': '126107',
      'The Great Evil': '126107',
      'The original vampire': '126107',
      'The hybrid': '126107',
      'As a father': '126107',
      'The king': '126107',
      '凯特尼斯·伊夫狄恩': '126109',
      禁果: '126109',
      破壁: '126109',
      '爱丽丝·盖恩斯巴勒': '126111',
      '你没事吧？': '126111',
      请收下这朵花: '126111',
      辣手姐妹花: '126111',
      跨过这道墙: '126111',
      原来他一直在我身边: '126111',
      喋血日记本: '126113',
      杀意人偶: '126113',
      无法消解的怨恨: '126113',
      邪骸转生: '126113',
      烈焰天使弓: '126115',
      天使之赐: '126115',
      '真·天使之赐': '126115',
      '【二阶】最终棱镜': '126116',
      '【一阶】棱镜': '126116',
      棱镜: '126116',
      哀嚎恶灵: '126119',
      厄运骸骨: '126119',
      黑暗水晶: '126119',
      骷髅勇士: '126119',
      天灾骑士: '126119',
      不朽之恋: '126120',
      创生之柱: '126120',
      璀璨之焰: '126120',
      诞星之所: '126120',
      光子之海: '126120',
      荒原: '126120',
      枯荣明灭: '126120',
      猎户座的明珠: '126120',
      王座的毗邻: '126120',
      无光余烬: '126120',
      无垠: '126120',
      可怖的眼球: '126121',
      可疑的触手: '126121',
      可疑的肉蛋: '126121',
      可疑的眼睛: '126121',
      克苏鲁的眼球: '126121',
      最终幻想XVI: '126122',
      '『金色车票』': '126634',
      '『梦旅存根』': '126634',
      梦旅存根: '126634',
      六出冰花: '126968',
      特供热巧: '126969',
      '极地特快车厢特供 · 热巧 450ml': '126969',
      'HOT CHOC！': '126969',
      '车厢特供 · 热巧 450ml': '126969',
      '『列车长』': '127026',
      '『极地特快列车长』': '127026',
      '『即将抵达终点站』': '127026',
      '『终点站：极地』': '127026',
      岛屿探险家: '128473',
      征服之王: '128474',
      '尼克·王尔德': '129113',
      初遇朱迪: '129113',
      重归于好: '129113',
      实现梦想: '129113',
      '朱迪·霍普斯': '129115',
      初入动物城: '129115',
      卸下警徽: '129115',
      官复原职: '129115',
      '“米凯拉的锋刃”玛莲妮亚': '129118',
      圣树底部的半神: '129118',
      米凯拉的锋刃: '129118',
      猩红恐惧: '129118',
      破碎战争: '129118',
      '“腐败女神”玛莲妮亚': '129118',
      改造后的火枪: '129119',
      黄金之旅: '129119',
      '极·龙の意': '129119',
      射手的火枪: '129119',
      银色飞鹰: '129119',
      冰海钓竿: '129120',
      步行鮟鱇: '129120',
      克苏鲁的仆从: '129120',
      虚空之海的鲸: '129120',
      崩朽龙卵: '129122',
      崩朽青铜龙幼崽: '129122',
      崩朽之青铜龙王: '129122',
      波纹蓝蛋: '129123',
      幽光蓝龙: '129123',
      注入能量的波纹蓝蛋: '129123',
      雄躯的昇格: '129126',
      极客的晚宴: '129127',
      '里昂（RE4）': '129158',
      致命危机: '129158',
      特工里昂的奇幻漂流: '129158',
      衣衫褴褛: '129158',
      终归一人: '129158',
      苇名弦一郎: '129159',
      '巴流·苇名弦一郎': '129159',
      飞渡轻舟: '129159',
      '巴流·雷之矢': '129159',
      '不死斩【开门】': '129159',
      '克莱夫・罗兹菲尔德': '129161',
      '约书亚・罗兹菲尔德': '129162',
      '『不败之花』': '129610',
      龙鳞石: '129790',
      '『先知灵药:真视』': '132585',
      '『先知灵药』': '132585',
      ' 『先知灵药：真视』': '132585',
      ' 『先知灵药』': '132585',
      幽浮起司堡: '133898',
      幽浮起司煲: '133898',
      一只陶瓮: '133899',
      瓮中能言蛙: '133899',
      '『流星赶月：宙刃』': '134127',
      '『流星赶月』': '134127',
      阿怪: '134663',
      生活拍立得: '135530',
      照相机: '135530',
      巴比伦辞典: '135738',
      '巴比伦辞典㊥': '135738',
      金翼使: '136035',
      '金翼使(30d)': '136035',
      '金翼使㊊': '136035',
      '丹雀衔五穗，人间始丰登': '137106',
      '烈日载雨、风禾尽起': '137106',
      '瑞雪兆丰年，生灵万物新': '137106',
      五谷丰年: '137106',
      寻觅: '137106',
      '吉尔·沃瑞克': '137107',
      大罪人希德: '137108',
      雷之显化者: '137108',
      '希德法斯·特拉蒙': '137108',
      召唤兽拉姆: '137108',
      '狄翁·勒萨若': '137110',
      '狄翁・勒萨若': '137110',
      皇子与侍从: '137110',
      弑父者: '137110',
      百万火光: '137110',
      十垓火光: '137110', // '巴哈姆特':'137110',
      'Act of Ultimate Trust': '137117',
      'Awakening Earth': '137117',
      'Birth of Sky': '137117',
      'Emerging Force': '137117',
      'Life of Ice': '137117',
      'Life of Water': '137117',
      'Life of Wind': '137117',
      'Master of Six Lives': '137117',
      神秘挑战书: '137117',
      尾崎八项: '137117',
      敖蜃星: '137113',
      格林星: '137113',
      太空列车: '137113',
      太空列车票: '137113',
      甜点星: '137113',
      坏掉的月亮提灯: '137134',
      月亮提灯: '137134',
      GM吸血伯爵: '137135',
      可爱黑猫: '137135',
      可爱毛团: '137135',
      吸血猫蛋: '137135',
      穿过的白袜: '137137',
      崭新的白袜: '137137',
      装了衣物的纸盒: '137137',
      变身器: '137697',
      月棱镜: '137697',
      近地夜航: '138136',
      '『分析天平』': '139404',
      '巨力橡果(30d)': '139406',
      巨力橡果: '139406',
      '巨力橡果㊊': '139406',
      古老金币: '141060',
      璀璨金币: '141060',
      不洁圣子: '141062',
      '『钟楼日暮』': '141820',
      '『钟楼盐水棒冰』': '141820',
      小小安全帽: '142917',
      金牌矿工: '142919',
      '『泥潭颂唱者』': '143409',
      '莱昂纳多·迪卡普里奥': '144099',
      了不起的盖茨比: '144099',
      盗梦空间: '144099',
      'Forever Titanic': '144099',
      叶卡捷琳娜: '144101',
      叶卡捷琳娜大帝: '144101',
      肃弓: '144103',
      最初的轻语: '144103',
      轻语: '144103',
      最后的轻语: '144103',
      半生黄金种: '144104',
      托莉娜的睡莲: '144104',
      托莉娜的微笑: '144104',
      米凯拉的花: '144104',
      神人的编制发: '144104',
      Zootopia: '144106',
      启程: '144106',
      全景: '144106',
      沙漠: '144106',
      冰原: '144106',
      雨林: '144106',
      御医神兔: '144664',
      脉律辐石: '144944',
      劫掠核芯: '144945',
      幸运女神的微笑: '146144',
      '『逆境中的幸运女神』': '146145',
      '『南瓜拿铁』': '146962',
      梅克军徽: '147987',
      贵族与野兽: '147987',
      占卜与日月: '147987',
      羽人与蜕变: '147987',
      小丑与格雷与星光璀璨: '147987',
      奎兰: '150222',
      无瑕的回忆: '150222',
      水银日报社特约调查员: '150223',
      朴素的誓言: '150223',
      古烈: '150911',
      奇异博士: '150913',
      '史蒂芬·斯特兰奇': '150913',
      午夜悲剧: '150913',
      时间牢笼: '150913',
      至尊法师: '150913',
      '托比·马奎尔': '150914',
      抉择: '150914',
      改变: '150914',
      蜘蛛侠: '150914',
      阿丽塔: '150915',
      重生: '150915',
      天人永隔: '150915',
      剑指撒冷: '150915',
      圣诞有铃: '150917',
      圣诞寻铃: '150917',
      羽毛胸针: '150919',
      苏格兰圆脸胖鸡: '150919',
      '苏格兰圆脸胖鸡[Pro Max]': '150919',
      '都市：天际线2': '150921',
      银色溜冰鞋: '152367',
      '『冰雕马拉橇』': '152369',
      '【新春限定】果体 隆': '153403',
      汉尼拔: '153404',
      晚宴: '153404',
      掌中命运: '153404',
      未散的宴席: '153404',
      梅琳娜Melina: '153407',
      约定立下: '153407',
      明月知心: '153407',
      亭亭如盖: '153407',
      使命终成: '153407',
      宵眼定死: '153407',
      黄粱一梦: '153407',
      '贝儿(Belle)': '153409',
      Belle: '153409',
      'Come across': '153409',
      Crush: '153409',
      'Beauty and the Beast': '153409',
      普通羊毛球: '153411',
      整理好的线团: '153411',
      织好的布料: '153411',
      暖心小斗篷: '153411',
      神秘天球: '153413',
      乐园之初: '153413',
      繁盛之景: '153413',
      人世之始: '153413',
      堕落之实: '153413',
      原罪之初: '153413',
      审判终至: '153413',
      历练人间: '153413',
      堕入地狱: '153413',
      百鬼夜行: '153413',
      婚姻登记册: '153415',
      爱情是一只小鸟: '153415',
      寻求恋爱是我的自由: '153415',
      孤独是一种常态: '153415',
      我有一个暗恋对象: '153415',
      这天我们之间是粉色的: '153415',
      狂热恋爱中: '153415',
      '520认证': '153415',
      组成家庭: '153415',
      健忘礼物盒: '153416',
      打开一个礼物盒: '153416',
      打开又一个礼物盒: '153416',
      打开又亿个礼物盒: '153416',
      变色的礼物盒: '153416',
      智力鉴定书: '153416',
      脏兮兮的蛋: '153419',
      爱你的小蟑螂: '153419',
      螂的诱惑: '153419',
      '神秘Bug！': '153419',
      战螂: '153419',
      一只来自远方的螂: '153419',
      Jo太螂: '153419',
      小狮欢舞: '155113',
      '『搓粉团珠』': '155117',
      永亘环: '155195',
      神奇宝贝大师球: '157540',
      神奇宝贝图鉴: '157542',
      '『道具超市』': '157750',
      '猫咪点唱机㊊': '157787',
      猫咪点唱机: '157787',
      肉乖乖: '159166',
      眠眠茧: '159166',
      璀璨闪蝶: '159166',
      哀恸魔蝶: '159166',
      灵魂残絮聚合法: '159167',
      脏器再生手术: '159167',
      实验体出逃事故: '159167',
      自定义男从Homunculus: '159167',
      'John Reese': '160193',
      穿靴子的猫: '160194',
      万众瞩目: '160194',
      遭遇死神: '160194',
      醉生梦死: '160194',
      迷途羔羊: '160194',
      许愿之星: '160194',
      传奇: '160194',
      狗狗: '160195',
      dog: '160195',
      perrito: '160195',
      '阿加莎·哈克尼斯': '160196',
      女巫起源: '160196',
      深陷混沌: '160196',
      女巫之路传说: '160196',
      圣水瓶: '160197',
      受赐福的圣水瓶: '160197',
      破碎的圣水瓶: '160197',
      重铸的圣水瓶: '160197',
      新神的赐福: '160197',
      弯钩与连枷: '160198',
      木乃伊巨人: '160198',
      巴斯泰托信徒: '160198',
      索贝克信徒: '160198',
      阿努比斯信徒: '160198',
      '黑神话:悟空': '160199',
      猫头鹰守卫: '160795',
      '守卫: 不可选中': '160795',
      '守卫: 轮班侦察': '160795',
      '守卫: 坚守眼位': '160795',
      '『凯旋诺书』': '160797',
      '『林中过夜』': '160798',
      '『绿茵甘露』': '159704',
      位于左侧的随从已派遣远征: '159704',
      胡子贴纸: '161623',
      香蕉特饮: '111748',
      迷之香蕉特饮: '111748',
      ' 迷之香蕉特饮': '111748',
      '特殊-纯真护剑': '112214',
      纯真护剑: '112214',
      '纯真护剑㊕': '112214',
      '纯真护剑 · 这把剑守护每个孩子无论他有没有被神选中': '112214',
      '『活动代币』': '120137',
      '『叫价牌』': '120137',
      '『活动代币兑金币』': '120137',
      '(人)血球蛋白': '121881',
      小型流动血瓶: '121881',
      失去生机的血瓶: '121881',
      中型储蓄血瓶: '121881',
      失去生机的血瓶: '121881',
      大型贮藏血瓶: '121881',
      失活的血瓶: '121881',
      '『酒馆蛋煲』': '122417',
      格雷的扑克牌: '130782',
      格雷的扑克牌: '130782',
      '『厢庭望远』': '161935',
      '十周年扭蛋 - 绿': '113501',
      '十周年扭蛋 - 蓝': '113501',
      '十周年扭蛋 - 橙': '113501',
      '十周年扭蛋 - 紫': '113501',
      '十周年扭蛋 - 红': '113501',
      巴哈姆特: '162881',
      愤怒的巴哈姆特: '162881',
      失败的封印仪式: '162881',
      百万核爆: '162881',
      巴哈姆特大迷宫: '162881',
      龙神巴哈姆特: '162881',
      至尊巴哈姆特: '162881',
      '约翰·康斯坦丁': '162882',
      牛局长博戈: '162885',
      勃然大怒的牛局长: '162885',
      不为人知的小秘密: '162885',
      '亨利.卡维尔': '162886',
      '亨利·卡维尔': '162886',
      仇恋: '162886',
      都铎王朝: '162886',
      惊天战神: '162886',
      明日之子: '162886',
      秘密特工: '162886',
      bvs: '162886',
      猎魔人: '162886',
      死侍: '162886',
      人间之神: '162886',
      红夫人: '162888',
      玛丽: '162888',
      希望的残像: '162888',
      破镜: '162888',
      荣光的残像: '162888',
      '莉莉娅·考尔德（Lilia Calderu）': '162889',
      'QUEEN of CUPS.【圣杯皇后】': '162889',
      'THREE of PENTACLES.【钱币三】': '162889',
      'KNIGHT of WANDS.【权杖骑士】': '162889',
      'THE HIGH PRIESTESS.【女祭司】': '162889',
      'THREE of SWORDS.【宝剑三】': '162889',
      'THE TOWER (REVERSED).【高塔·逆位】': '162889',
      'DEATH.【死神】': '162889',
      'THE TOWER (UP RIGHT).【高塔·正位】': '162889',
      我的路从时间蜿蜒而出: '162889',
      尼特公仔: '162891',
      會動的尼特公仔: '162891',
      健壯的尼特公仔: '162891',
      威猛尼特: '162891',
      黑暗之魂系列: '162893',
      女巫之路: '162894',
      '『狄文卡德的残羽』': '163415',
      鎏彩万幢: '164432',
      呆猫: '167219',
      传说中的黑龙: '167220',
      检定场: '168856',
      命运的轮廓: '168858',
      灯载情绵: '169887',
      '“半狼”布莱泽': '171601',
      合作: '171601',
      相约于群星: '171601',
      发狂: '171601',
      'You Can Pet Blaidd': '171601',
      炽焰咆哮虎: '171602',
      '磨炼！': '176541',
      愤怒: '176541',
      '猎个痛快！': '176541',
      '本・比格': '176542',
      隨機過程隨機過: '176542',
      熊性本善: '176542',
      '帅气的本・比格': '176542',
      高桥剑痴: '176543',
      失明: '176543',
      先祖之魂: '176543',
      隐秘的讯息: '176543',

      火斑喵: '171602',
      炽焰咆哮虎的训练: '171602',
      咆哮虎的冠军之路: '171602',
      '基努·里维斯': '171603',
      生死时速: '171603',
      极速追杀: '171603',
      'The One': '171603',
      黑客帝国: '171603',
      地狱神探: '171603',
      '琴.葛蕾': '171605',
      牺牲: '171605',
      'Honey B Lovely': '171606',
      'Honey Bee': '171606',
      蜜蜂魔物: '171606',
      蜂蜂小甜心: '171606',
      黑暗封印: '171607',
      梅贾的窃魂卷: '171607',
      饱食之戒: '171607',
      躁动之戒: '171607',
      秘法之书: '171607',
      光之少女の魔法书: '171607',
      枯木法杖: '171608',
      蓄能法杖: '171608',
      元灵化法杖: '171608',
      水晶化法杖: '171608',
      结晶化法杖: '171608',
      千年积木: '171609',
      失窃: '176547',
      余烬: '176547',
      逆流: '176547',
      原初魔典: '176547',
      秘林魔典: '176547',
      凛霜魔典: '176547',
      炎狱魔典: '176547',
      沼蚀魔典: '176547',
      幽冥魔典: '176547',
      净灵魔典: '176547',
      魂灵魔典: '176547',
      奥术魔典: '176547',
      祛色: '176547',
      基础维修工具: '176546',
      中级维修工具: '176546',
      高级维修工具: '176546',
      '高级维修工具[附魂]': '176546',
      GM高级技工: '176546',
      寄宿法老王灵魂的容器: '171609',
      辉夜姬的五难题: '171610',
      佛御石之钵: '171610',
      蓬莱的玉枝: '171610',
      火鼠的皮衣: '171610',
      龙头的宝玉: '171610',
      燕的子安贝: '171610',
      竹取物语: '171610',
      末影珍珠: '171611',
      被冰封的头盔: '176545',
      冰冷的电气头盔: '176545',
      永冻土: '176545',
      原初の珍珠: '171611',
      更多的珍珠: '171611',
      隔墙有眼: '171611',
      'The End': '171611',
      双生蛋: '171614',
      双生: '171614',
      图书馆金蛋: '176548',
      可鲁: '176548',
      可鲁贝洛斯: '176548',
      大侦探皮卡丘: '176544',
      淘气的皮卡丘: '176544',
      闯祸的皮卡丘: '176544',
      传说级训练家: '176544',
      三羽蚀鸮: '171614',
      '三羽蚀鸮 ': '171614',
      六翼神鸮: '171614',
    }

    // 判断是否是帖子页面的正则
    const reg = /^https:\/\/www.gamemale.com\/thread/
    const reg2 = /^https:\/\/www.gamemale.com\/forum.php/

    // 勋章商城、荣誉勋章、奖励勋章、二手市场和我的勋章页面修改href
    // <a href="javascript:void(0);"> => <a href="..." target="_blank">
    function modifyHref() {
      if (1 == xunzhangSwitch) {
        // debugger;
        const allDivs = document.getElementsByClassName('myimg')
        for (let i = 0; i < allDivs.length; i++) {
          let aTag = allDivs[i].querySelector('a')
          let href = aTag.getAttribute('href')
          if (href && href.includes('javascript:void')) {
            let alt = aTag.querySelector('img').getAttribute('alt')
            if (alt.endsWith('.')) {
              // 适配真人男从名称加点的修改
              alt = alt.substr(0, alt.length - 1)
            }
            if (alt && name2url[alt]) {
              aTag.setAttribute(
                'href',
                href.replace(
                  'javascript:void(0);',
                  'thread-' + name2url[alt] + '-1-1.html'
                )
              )
              aTag.setAttribute('target', '_blank')
            }
          }
        }
      }
      return 0
    }

    // 帖子详情页为<img>增加Listener
    function addHref() {
      if (1 == threadSwitch) {
        // debugger;
        let pTags = document.getElementsByClassName('md_ctrl wodexunzhang_img')
        for (let i = 0; i < pTags.length; i++) {
          let imgs = pTags[i].getElementsByTagName('img')
          for (let j = 0; j < imgs.length; j++) {
            let alt = imgs[j].getAttribute('alt')
            if (alt) {
              if (alt.includes('『随时随地开启！』')) {
                let tip = imgs[j].getAttribute('tip')
                alt =
                  tip && tip.includes('知识')
                    ? '『任天堂Switch』红蓝√'
                    : '『任天堂Switch』灰黑√' // 旅程
              } else if (alt.includes('月光骑士')) {
                let tip = imgs[j].getAttribute('tip')
                alt =
                  tip && tip.includes('回帖 血液')
                    ? '马克·史贝特'
                    : '史蒂文·格兰特' // 回帖 金币
              } else if (alt.includes('巴哈姆特')) {
                // 与[狄翁·勒萨若 等级Max]重名处理
                let tip = imgs[j].getAttribute('tip')
                alt =
                  tip && tip.includes('回帖 金币') ? '狄翁·勒萨若' : '巴哈姆特'
              }
              if (alt.endsWith('.')) {
                // 适配真人男从名称加点的修改
                alt = alt.substr(0, alt.length - 1)
              }
              if (name2url[alt]) {
                imgs[j].addEventListener('click', function () {
                  window.open('thread-' + name2url[alt] + '-1-1.html', '_blank')
                })
              }
            }
          }
          let aTag = pTags[i].getElementsByTagName('a')[0]
          let href = aTag.getAttribute('href')
          if (href && href.includes('wodexunzhang-showxunzhang.html')) {
            aTag.setAttribute(
              'href',
              href.replace(
                'wodexunzhang-showxunzhang.html',
                'javascript:void(0);'
              )
            )
          }
        }
      }
      return 0
    }

    // 勋章记录为<b>增加<a href...></a>
    function modifyTagB() {
      if (1 == recordSwitch) {
        // debugger;
        let ul = document.getElementsByClassName('mn mymn')
        let li = ul[0].getElementsByTagName('li')
        for (let i = 0; i < li.length; i++) {
          let bTags = li[i].getElementsByTagName('b')
          for (let j = 0; j < bTags.length; j++) {
            if (bTags[j]) {
              let bTextContent = bTags[j].textContent
              if (bTextContent.endsWith('.')) {
                // 适配真人男从名称加点的修改
                bTextContent = bTextContent.substr(0, bTextContent.length - 1)
              }
              if (name2url[bTextContent]) {
                let aElement = document.createElement('a')
                aElement.href = 'thread-' + name2url[bTextContent] + '-1-1.html'
                aElement.textContent = bTextContent
                aElement.target = '_blank'
                bTags[j].textContent = ''
                bTags[j].appendChild(aElement)
                break
              }
            }
          }
        }
      }
      return 0
    }

    function loadModification() {
      if (reg.test(window.location.href) || reg2.test(window.location.href)) {
        addHref()
      } else {
        if (medalShopRegex.test(currentUrl)) {
          // 如果是商城，需要等整合商店加载完毕后再执行,预设3秒
          setTimeout(() => {
            modifyHref()
            modifyTagB()
          }, lazyTimeout)
        } else {
          modifyHref()
          modifyTagB()
        }
      }
    }

    // 页面加载完再执行
    window.onload = function () {
      loadModification()
    }
  }
  //#region 放大镜
  if (
    medalRegex.test(currentUrl) ||
    medalRegexEx.test(currentUrl) ||
    postInsideRegex.test(currentUrl)
  ) {
    console.log('勋章放大镜')
    /**
     * part: 勋章放大镜需要每次匹配
     */
    // 0为原版【上下显示】 1为新版【左右显示】
    // 似乎手机上下显示没问题，那保留一下
    // 判断是否为移动设备（包括 iPhone）
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent)

    if (GM_getValue('toggleSetting') === undefined) {
      // toggleSetting 代表放大镜是否位于标签左右 true为左右，false为上下
      GM_setValue('toggleSetting', !isMobile) // 如果是移动设备，默认为 false；否则为 true
    }

    // 创建菜单命令用于切换设置
    GM_registerMenuCommand('切换放大镜显示位置', toggleSettingFun)
    function toggleSettingFun() {
      const currentValue = GM_getValue('toggleSetting')
      const newValue = !currentValue
      GM_setValue('toggleSetting', newValue)
    }

    // 此外右下角有一个放大器可以显示/隐藏放大镜，解决遮挡原信息问题
    // 估计很多人没法发现过这个东西
    let 放大镜显示 = localStorage.getItem('放大镜显示') !== 'false'

    // @deprecated 已弃用
    // 删掉右下角的勋章显示切换，避免误触。已经有好几个人来问我了
    function 创建控制面板() {
      const 控制面板 = document.createElement('div')
      控制面板.id = '控制面板'
      控制面板.style.position = 'fixed'
      控制面板.style.bottom = '20px'
      控制面板.style.right = '20px'
      控制面板.style.zIndex = '1000'
      控制面板.innerHTML = `<button id="切换放大镜按钮" style="font-size: 18px; background: none; border: none; padding: 0; box-shadow: none; line-height: 1;">${
        放大镜显示 ? '🔎✅' : '🔎🚫'
      }</button>`
      document.body.appendChild(控制面板)
      document
        .getElementById('切换放大镜按钮')
        .addEventListener('click', 切换放大镜显示)
    }

    function 切换放大镜显示() {
      放大镜显示 = !放大镜显示
      this.innerHTML = 放大镜显示 ? '🔎✅' : '🔎🚫'
      localStorage.setItem('放大镜显示', 放大镜显示)
      if (!放大镜显示) {
        隐藏所有放大镜()
      }
    }

    function 创建放大镜() {
      const 放大镜 = document.createElement('div')
      放大镜.id = '泥潭勋章放大镜'
      放大镜.style.position = 'absolute'
      放大镜.style.padding = '10px'
      放大镜.style.background = 'white'
      放大镜.style.border = '1px solid black'
      放大镜.style.borderRadius = '5px'
      放大镜.style.display = 'none'
      放大镜.style.zIndex = '10000'
      放大镜.style.fontWeight = 'bold'
      放大镜.style.color = '#000516'
      放大镜.style.maxHeight = '550px' // 设置最大高度 禽兽扒手无滚动条的高度
      放大镜.style.overflowY = 'auto' // 添加垂直滚动条
      document.body.appendChild(放大镜)
      return 放大镜
    }

    const 放大镜 = 创建放大镜()

    const 属性映射 = {
      金币: { 颜色: '#FFBF00', emoji: '💰' },
      血液: { 颜色: '#ff0000', emoji: '🩸' },
      旅程: { 颜色: '#008000', emoji: '✈️' },
      咒术: { 颜色: '#a52a2a', emoji: '🔮' },
      知识: { 颜色: '#0000ff', emoji: '📖' },
      灵魂: { 颜色: '#add8e6', emoji: '✡️' },
      堕落: { 颜色: '#800080', emoji: '😈' },
      总计: { 颜色: '#ffa500', emoji: '🈴' },
    }

    const 属性颜色映射 = {
      回帖: '#0189ff',
      发帖: 'purple',
    }

    function 计算收益(文本) {
      const 行列表 = 文本.split('\n')
      let 收益详情列表 = []
      let 最大收益 = { 回帖收益: 0, 主题收益: 0, 总收益: 0, 等级: 0 }

      for (let i = 0; i < 行列表.length; i++) {
        const 行 = 行列表[i]
        let 总收益 = 0
        let 行收益详情 = ''
        let 回帖收益 = 0
        let 主题收益 = 0

        // 匹配触发几率
        const 触发几率匹配 = 行.match(/】(\d+)%/)
        if (触发几率匹配) {
          const 触发几率 = parseFloat(触发几率匹配[1]) / 100

          // 匹配回帖属性
          const 回帖属性匹配 = 行.match(/回帖(.*?)(,|$|发帖|升级|▕)/)
          if (回帖属性匹配) {
            const 属性匹配 = [
              ...回帖属性匹配[1].matchAll(
                /(金币|血液|旅程|咒术|知识|灵魂|堕落)(\+|-)(\d+)/g
              ),
            ]
            let 非堕落属性计数 = 0

            for (const 匹配 of 属性匹配) {
              const 属性 = 匹配[1]
              const 符号 = 匹配[2] // '+' 或 '-'
              const 值 = parseInt(匹配[3], 10) * (符号 === '+' ? 1 : -1)

              if (属性 !== '堕落') {
                非堕落属性计数++
                const 权重 = 收益权重映射[属性] || 0
                const 收益 = 触发几率 * 值 * 权重
                回帖收益 += 收益

                if (收益 !== 0) {
                  行收益详情 += `<span style="color:${
                    属性映射[属性].颜色
                  };"><span style="font-family:Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji">${
                    属性映射[属性].emoji
                  }</span>${收益.toFixed(2)}</span> `
                }
              }
            }

            // 如果有多个非堕落属性，显示总收益
            if (非堕落属性计数 > 1) {
              行收益详情 += `<span style="color:${
                属性映射['总计'].颜色
              };"><span style="font-family:Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji">${
                属性映射['总计'].emoji
              }</span>${回帖收益.toFixed(2)}</span>`
            }
          }

          const 主题属性匹配 = 行.match(/发帖(.*?)(升级|▕ | ▕▏|$)/)
          if (主题属性匹配) {
            const 属性匹配 = [
              ...主题属性匹配[1].matchAll(
                /(金币|血液|旅程|咒术|知识|灵魂|堕落)(\+|-)(\d+)/g
              ),
            ]
            let 非堕落属性计数 = 0

            for (const 匹配 of 属性匹配) {
              const 属性 = 匹配[1]
              const 符号 = 匹配[2] // '+' 或 '-'
              const 值 = parseInt(匹配[3], 10) * (符号 === '+' ? 1 : -1)

              if (属性 !== '堕落') {
                非堕落属性计数++
                const 权重 = 收益权重映射[属性] || 0
                const 收益 = 触发几率 * 值 * 权重
                主题收益 += 收益

                if (收益 !== 0) {
                  行收益详情 += `<span style="color:${
                    属性映射[属性].颜色
                  };"><span style="font-family:Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji">${
                    属性映射[属性].emoji
                  }</span>${收益.toFixed(2)}</span> `
                }
              }
            }

            // 如果有多个非堕落属性，显示总收益
            if (非堕落属性计数 > 1) {
              行收益详情 += `<span style="color:${
                属性映射['总计'].颜色
              };"><span style="font-family:Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji">${
                属性映射['总计'].emoji
              }</span>${总收益.toFixed(2)}</span>`
            }
          }
        }
        总收益 = 回帖收益 + 主题收益 * (发帖权重.回帖 / 发帖权重.主题)
        if (总收益 >= 最大收益.总收益) {
          最大收益.总收益 = 总收益
          最大收益.主题收益 = 主题收益
          最大收益.回帖收益 = 回帖收益
          最大收益.等级 = 行.match(/【等级(\d+)】/)?.[1] || 'Max'
        }

        // 将当前行的收益详情加入列表
        收益详情列表.push(行收益详情.trim())
      }

      return {
        收益详情列表,
        // 距离最大等级的非0, 非自动升级收益（因为自动升级收益无法控制且多为彩蛋性质）
        最大收益,
      }
    }

    function 计算回本周期(内容, 升级消耗, 最大收益) {
      const 匹配结果 = 内容.match(
        /商店售价】(\d+)(金币|血液|旅程|咒术|知识|灵魂|堕落)?/
      )

      const 总价 = 升级消耗

      if (最大收益.总收益 > 0 && 总价 > 0) {
        const 回本周期2 = 总价 / 最大收益.总收益
        const 回本周期文本 = `【回本周期】以最大收益等级${
          最大收益.等级
        }计算，回本${Math.ceil(回本周期2)}(二手${Math.ceil(
          回本周期2 * 1.15
        )})贴`
        const 回帖文本 = `【100回帖】期望收益: ${Math.round(
          最大收益.回帖收益 * 100
        )}, 性价比: ${((最大收益.回帖收益 * 100000) / 总价).toFixed(3)}‰`
        const 主题文本 = `【100主题帖】期望收益: ${Math.round(
          最大收益.主题收益 * 100
        )}, 性价比: ${((最大收益.主题收益 * 100000) / 总价).toFixed(3)}‰`
        const 总收益文本 = `【汇总】期望收益: ${(最大收益.总收益 * 100).toFixed(
          2
        )}, 性价比: ${((最大收益.总收益 * 100000) / 总价).toFixed(3)}‰`
        return [回本周期文本, 回帖文本, 主题文本, 总收益文本]
      } else {
        const 回帖文本 = `【100回帖】期望收益: ${Math.round(
          最大收益.回帖收益 * 100
        )}`
        const 主题文本 = `【100主题帖】期望收益: ${Math.round(
          最大收益.主题收益 * 100
        )}`
        const 总收益文本 = `【汇总】期望收益: ${(最大收益.总收益 * 100).toFixed(
          2
        )}`
        return ['', 回帖文本, 主题文本, 总收益文本]
      }
    }

    /**
     * 修改属性颜色
     *
     * 根据内容计算收益详情列表、最大收益、升级消耗和回本周期，并修改内容中的属性颜色。
     *
     * @param {string} 内容 - 要处理的内容字符串
     * @returns {string} - 修改后的新内容字符串
     */
    function 修改属性颜色(内容) {
      const 收益汇总 = 计算收益(内容)
      const 收益详情列表 = 收益汇总.收益详情列表
      const 最大收益 = 收益汇总.最大收益
      const 总消耗 = 统计总消耗(内容)
      const 总消耗文本 = 总消耗.文本
      const [回本周期, 回帖收益, 主题收益, 总收益] = 计算回本周期(
        内容,
        总消耗.数字,
        最大收益
      )

      const 行列表 = 内容.split('\n')
      let 新内容 = ''
      for (let i = 0; i < 行列表.length; i++) {
        const 行 = 行列表[i]
        const 收益详情 = 收益详情列表[i]
        if (收益详情) {
          新内容 += 行.replace(/(】)(\d+)%(\s*)/, `$1${收益详情} $2%$3`)
        } else {
          新内容 += 行
        }
        if (i < 行列表.length - 1) {
          新内容 += '\n'
        }
      }

      // 修改属性颜色
      新内容 = 新内容.replace(
        /(回帖)(.*?)(?=、|\n|$|发帖|升级|▕)/g,
        function (match, p1, p2) {
          return `<span style="color:${属性颜色映射['回帖']}">${p1}${p2}</span>`
        }
      )
      新内容 = 新内容.replace(
        /(发帖)(.*?)(?=、|$|升级|▕)/g,
        function (match, p1, p2) {
          return `<span style="color:${属性颜色映射['发帖']}">${p1}${p2}</span>`
        }
      )

      新内容 += 总消耗文本
      新内容 += '\n' + 回本周期
      新内容 += '\n' + 回帖收益
      新内容 += '\n' + 主题收益
      新内容 += '\n' + 总收益

      return 新内容
    }

    function 显示放大镜(内容, 目标) {
      if (!放大镜显示) return
      const 新内容 = 修改属性颜色(内容)
      放大镜.innerHTML = 新内容.replace(/\n/g, '<br>')
      放大镜.style.display = 'block'
      放大镜.style.visibility = 'hidden'
      放大镜.style.opacity = 0.7

      if (GM_getValue('toggleSetting')) {
        定位放大镜New(目标)
      } else {
        定位放大镜(目标)
      }

      放大镜.style.visibility = 'visible'
    }

    function 定位放大镜(目标) {
      const 放大镜宽度 = 放大镜.offsetWidth
      const 放大镜高度 = 放大镜.offsetHeight
      const 目标矩形 = 目标.getBoundingClientRect()
      let 放大镜左边 =
        window.pageXOffset + 目标矩形.left - 放大镜宽度 / 2 + 目标矩形.width / 2
      let 放大镜顶部 = window.pageYOffset + 目标矩形.top - 放大镜高度 - 10

      if (放大镜顶部 < window.pageYOffset) {
        放大镜顶部 = window.pageYOffset + 目标矩形.bottom + 10
      }
      if (
        放大镜左边 + 放大镜宽度 >
        window.pageXOffset + document.documentElement.clientWidth
      ) {
        放大镜左边 =
          window.pageXOffset +
          document.documentElement.clientWidth -
          放大镜宽度 -
          10
      }
      if (放大镜左边 < window.pageXOffset) {
        放大镜左边 = window.pageXOffset + 10
      }
      if (放大镜顶部 + 放大镜高度 > window.pageYOffset + window.innerHeight) {
        放大镜顶部 = window.pageYOffset + 目标矩形.top - 放大镜高度 - 10
      }
      放大镜.style.left = 放大镜左边 + 'px'
      放大镜.style.top = 放大镜顶部 + 'px'
    }

    function 定位放大镜New(img) {
      document.querySelectorAll('.MyshowTip2').forEach((label) => {
        if (label.style.display != 'none') {
          const 放大镜宽度 = 放大镜.offsetWidth
          const 放大镜高度 = 放大镜.offsetHeight

          // 和原标签顶部对齐
          let 放大镜顶部 = parseInt(label.style.top)

          // 和原来标签的右对齐
          let 放大镜左边 = parseInt(label.style.left) + 200

          // 如果放不下就放左边
          if (放大镜左边 + 放大镜左边 > window.innerWidth) {
            放大镜左边 = parseInt(label.style.left) - 放大镜宽度
          }

          // 原来的标签太高了，直接溢出屏幕外（废弃）
          // 如果原标签在图片上方，从顶部对齐变成底部对齐
          const labelTop = label.getBoundingClientRect().top
          const imgTop = img.getBoundingClientRect().top
          const labelHeight = label.getBoundingClientRect().height
          if (labelTop < imgTop) {
            放大镜顶部 = 放大镜顶部 + labelHeight - 放大镜高度
          }

          放大镜.style.top = 放大镜顶部 + 'px'
          放大镜.style.left = 放大镜左边 + 'px'
        }
      })
    }

    function 隐藏放大镜() {
      放大镜.style.display = 'none'
    }

    function 隐藏所有放大镜() {
      隐藏放大镜()
    }

    let timeoutId
    function 添加悬停监听器(目标, 放大镜内容) {
      目标.addEventListener('mouseover', function () {
        if (放大镜内容) {
          clearTimeout(timeoutId) // 清除之前的隐藏任务
          显示放大镜(放大镜内容, 目标)
        }
      })
      目标.addEventListener('mouseout', () => {
        // 延迟隐藏 B
        timeoutId = setTimeout(() => {
          if (!放大镜.matches(':hover')) {
            隐藏放大镜()
          }
        }, 100) // 延迟时间
      })
    }

    放大镜.addEventListener('mouseleave', () => {
      隐藏放大镜()
    })

    function addHover(img) {
      // 去除【不可购买】并生成基础变体
      const baseAlt = img.getAttribute('alt').replace(/【不可购买】/g, '')
      const variants = [
        baseAlt.replace(/·/g, '‧'), // 全角转半角点
        baseAlt.replace(/‧/g, '·'), // 半角点转全角
      ]

      // 处理可能存在的结尾标点（例如真人男从的. 以及其他各种特殊符号，总之去掉末尾的.是对的）
      const trimEndDot = (str) => str.slice(0, -1)
      const processedVariants = [...variants, ...variants.map(trimEndDot)]

      // 高效查找映射表（去重 + find短路机制）
      const altKey = [...new Set(processedVariants)].find(
        (alt) => alt in 放大镜内容映射表
      )

      // 判断是否需要显示图片内容
      let showText = 放大镜内容映射表[altKey]
      if (showImg && showText) {
        showText = addImgUrl(showText)
      }

      altKey && 添加悬停监听器(img, showText)
    }

    function 初始化放大镜() {
      document.querySelectorAll('.myimg img').forEach(function (img) {
        addHover(img)
      })
      document.querySelectorAll('.md_ctrl img').forEach(function (img) {
        addHover(img)
      })
    }
    function 变化检测() {
      const 观察 = new MutationObserver(function (变化标记) {
        变化标记.forEach(function (变化) {
          变化.addedNodes.forEach(function (节点) {
            if (
              节点.nodeType === Node.ELEMENT_NODE &&
              (节点.matches('.myimg img') || 节点.matches('.md_ctrl img'))
            ) {
              const 替代文本 = 节点.getAttribute('alt')
              if (放大镜内容映射表.hasOwnProperty(替代文本)) {
                添加悬停监听器(节点)
              }
            }
          })
        })
      })
      const 目标容器 = document.querySelector('.my_fenlei')
      if (目标容器) {
        观察.observe(目标容器, { childList: true, subtree: true })
      }
    }

    function 统计总消耗(内容) {
      // 初始化消耗统计对象
      var 消耗统计 = {
        金币: 0,
        血液: 0,
        旅程: 0,
        咒术: 0,
        知识: 0,
        灵魂: 0,
        堕落: 0,
      }
      const 总消耗 = {
        文本: '',
        数字: 0,
      }

      // 提取升级条件
      var 升级条件 = 内容.match(
        /消耗([-\d]+)\s*(金币|血液|旅程|咒术|知识|灵魂|堕落)/g
      )

      if (升级条件) {
        升级条件.forEach(function (条件) {
          var 消耗数值 = parseInt(条件.match(/[-\d]+/)[0])
          var 资源类型 = 条件.match(/金币|血液|旅程|咒术|知识|灵魂|堕落/)[0]
          消耗统计[资源类型] += 消耗数值
        })
      }

      // 生成消耗描述
      var 消耗描述 = Object.entries(消耗统计)
        .filter(([资源类型, 消耗数值]) => 消耗数值 !== 0)
        .map(([资源类型, 消耗数值]) => {
          var 颜色 = 属性映射[资源类型].颜色
          var emoji = 属性映射[资源类型].emoji
          return `消耗<span style="color: ${颜色}">${消耗数值}${资源类型}</span>`
        })
        .join('、')

      // 计算升级消耗
      var 升级消耗 = Object.entries(消耗统计).reduce(
        (总计, [资源类型, 消耗数值]) => {
          var 权重 = 收益权重映射[资源类型] || 0
          return 总计 + 消耗数值 * 权重
        },
        0
      )

      const 匹配结果 = 内容.match(
        /商店售价】(\d+)(金币|血液|旅程|咒术|知识|灵魂|堕落)?/
      )
      let 价格 = parseInt(匹配结果?.[1]) || 0
      const 单位 = 匹配结果?.[2]
      价格 = 价格 * (收益权重映射[单位] || 0)
      const 价格文本 = 价格 > 0 ? ` 商店售价: ${价格} ` : ''

      // 返回结果
      // if (总消耗) {
      总消耗.数字 = 升级消耗 + 价格
      总消耗.文本 = `\n  【消耗】${消耗描述}${价格文本}总计消耗${总消耗.数字}`
      // }
      return 总消耗
    }

    function addImgUrl(text) {
      // debugger;
      let textLines = text.split('\n')
      let name = textLines[0]
      if (!(name in imgs)) {
        return text
      }

      let max_width = 0
      for (let key in imgs[name]) {
        max_width =
          imgs[name][key][1] > max_width ? imgs[name][key][1] : max_width
        if (124 == max_width) {
          break
        }
      }

      for (let i = 1; i < textLines.length; i++) {
        let lv = textLines[i].match(/【等级(\d+)】/)?.[1]
        if (lv) {
          lv = lv.toString()
        } else if (textLines[i].includes('【 Max 】')) {
          lv = 'Max'
        } else if (textLines[i].includes('【等级 初级】')) {
          lv = '初级'
        } else {
          continue
        }
        if (lv in imgs[name]) {
          let addStr = `<img src="${imgs[name][lv][0]}" width="${imgs[name][lv][1]}px" align="middle">`
          if (imgs[name][lv][1] < max_width) {
            addStr =
              addStr +
              `<img width="${max_width - imgs[name][lv][1]}px" align="middle">`
          }
          textLines[i] = addStr + textLines[i]
        }
      }

      return textLines.join('\n')
    }

    var 放大镜内容映射表 = {
      史莱姆蛋: `史莱姆蛋
【勋章类型】宠物
【入手条件】发帖数≥30
【商店售价】220血液
【等级1】3% 回帖咒术+1▕▏升级条件：消耗50金币
【等级2】6% 回帖咒术+1▕▏升级条件：消耗75金币
【等级3】9% 回帖咒术+1▕▏升级条件：消耗100金币
【 Max 】12% 回帖咒术+1、发帖金币+2`,
      迷のDoge: `迷のDoge
【勋章类型】宠物
【入手条件】主题数 >= 6
【商店售价】100金币
【等级1】2% 回帖血液+1 金币+1▕▏升级条件：消耗50金币
【等级2】4% 回帖血液+1 金币+1▕▏升级条件：消耗50金币
【 Max 】6% 回帖血液+1 金币+2 咒术+1`,
      洞窟魔蛋: `洞窟魔蛋
【勋章类型】宠物
【入手条件】咒术≥40
【商店售价】1金币
【等级1】无属性▕▏升级条件：消耗30血液
【等级2】5% 回帖咒术+1▕▏升级条件：消耗70血液
【 Max 】14% 回帖咒术+2 血液-2、发帖咒术+2`,
      红龙蛋: `红龙蛋
【勋章类型】宠物
【入手条件】血液≥200
【商店售价】150金币
【等级1】无属性▕▏升级条件：血液≥20
【等级2】5% 回帖血液+1 金币-1▕▏升级条件：血液≥250
【 Max 】10% 回帖血液+2 金币-1`,
      黑龙蛋: `黑龙蛋
【勋章类型】宠物
【入手条件】咒术≥20
【商店售价】150金币
【等级1】无属性▕▏升级条件：升级条件：咒术≥10
【等级2】5% 回帖咒术+1 金币-1▕▏升级条件：升级条件：咒术≥40
【 Max 】10% 回帖咒术+1 金币-1`,
      腐化龙蛋: `腐化龙蛋
【勋章类型】宠物
【入手条件】金币≥200
【商店售价】150金币
【等级1】无属性▕▏升级条件：堕落≥10
【等级2】5% 回帖金币+1 血液-1▕▏升级条件：堕落≥40
【 Max 】10% 回帖金币+2 血液-1`,
      漆黑的蝎卵: `漆黑的蝎卵
【勋章类型】宠物
【入手条件】血液≥300
【商店售价】200金币
【等级1】4% 回帖咒术+1、发帖咒术+1▕▏升级条件：灵魂≥1
【 Max 】2% 回帖咒术+1、发帖灵魂+1`,
      '【年中限定】GM村金蛋': `【年中限定】GM村金蛋
【勋章类型】宠物
【入手条件】知识≥20
【商店售价】618金币
【等级1】1% 发帖金币+1▕▏升级条件：知识≥35
【等级2】12% 回帖金币+1、发帖金币+2▕▏升级条件：知识≥60
【 Max 】25% 回帖金币+2、发帖金币+4`,
      GM村金蛋: `GM村金蛋
【入手条件】知识≥20
【商店售价】618金币
【等级1】1% 发帖金币+1▕▏升级条件：知识≥35
【等级2】12% 回帖金币+1、发帖金币+2▕▏升级条件：知识≥35
【 Max 】25% 回帖金币+2、发帖金币+4`,
      '詹姆斯‧维加': `詹姆斯‧维加
【勋章类型】游戏男从
【入手条件】无
【商店售价】450金币
【等级1】5% 发帖血液+1▕▏升级条件：追随≥20
【等级2】10% 回帖血液+1、发帖血液+1▕▏升级条件：追随≥55
【 Max 】15% 回帖血液+1、发帖血液+1`,
      奧倫: `奧倫
【勋章类型】游戏男从
【入手条件】无
【商店售价】300金币
【等级1】无属性▕▏升级条件：50旅程
【等级2】10% 发帖金币+1▕▏升级条件：120旅程
【 Max 】20% 发帖金币+3`,
      '希德‧海温特': `希德‧海温特
【勋章类型】游戏男从
【入手条件】无
【商店售价】450金币
【等级1】无属性▕▏升级条件：消耗50金币
【等级2】4% 回帖金币+1▕▏升级条件：消耗100金币
【等级3】8% 回帖金币+1▕▏升级条件：消耗150金币
【 Max 】12% 回帖金币+2`,
      '吉姆‧雷诺': `吉姆‧雷诺
【勋章类型】游戏男从
【入手条件】无
【商店售价】350金币
【 Max 】12% 发帖旅程+1`,
      法卡斯: `法卡斯
【勋章类型】游戏男从
【入手条件】无
【商店售价】300金币
【 Max 】10% 回帖血液+1、发帖血液+1`,
      '皮尔斯‧尼凡斯': `皮尔斯‧尼凡斯
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】无属性▕▏升级条件：消耗50金币
【等级2】无属性▕▏升级条件：消耗50血液
【等级3】无属性▕▏升级条件：消耗50咒术
【等级4】无属性▕▏升级条件：血液≥150
【 Max 】15% 回帖血液+2、发帖血液+2`,
      '文森特‧瓦伦丁': `文森特‧瓦伦丁
【勋章类型】游戏男从
【入手条件】无
【商店售价】350金币
【 Max 】10% 回帖咒术+1、发帖堕落+1`,
      巴尔弗雷亚: `巴尔弗雷亚
【勋章类型】游戏男从
【入手条件】无
【商店售价】350金币
【等级1】4% 回帖金币+2、发帖金币+2▕▏升级条件：知识≥10
【等级2】8% 回帖金币+2、发帖金币+2▕▏升级条件：知识≥30
【 Max 】12% 回帖金币+2、发帖金币+2`,
      但丁: `但丁
【勋章类型】游戏男从
【入手条件】无
【商店售价】450金币
【等级1】5% 发帖咒术+1▕▏升级条件：10血液
【等级2】8% 发帖咒术+1▕▏升级条件：10咒术
【等级3】10% 发帖咒术+2▕▏升级条件：1灵魂
【等级4】15% 发帖咒术+2▕▏升级条件：30咒术
【 Max 】20% 发帖咒术+3`,
      盖里: `盖里
【勋章类型】真人男从
【入手条件】无
【商店售价】420金币
【等级1】2% 发帖旅程+1▕▏升级条件：好友≥10
【等级2】5% 回帖血液+1、发帖旅程+1▕▏升级条件：好友≥30
【 Max 】7% 回帖血液+1 金币+1、发帖旅程+1`,
      梅格: `梅格
【勋章类型】女从
【入手条件】无
【商店售价】300金币
【等级1】5% 回帖堕落+1▕▏升级条件：追随≥22
【等级2】8% 回帖堕落+1▕▏升级条件：追随≥44
【 Max 】12% 回帖堕落+1 血液+1、发帖堕落+1 血液+1`,
      亚力斯塔尔: `亚力斯塔尔
【勋章类型】游戏男从
【入手条件】无
【商店售价】450金币
【等级1】5% 发帖血液+2▕▏升级条件：发帖数≥200
【等级2】10% 发帖血液+2▕▏升级条件：发帖数≥500
【等级3】15% 发帖血液+2▕▏升级条件：消耗1灵魂
【 Max 】40% 发帖血液+3`,
      '罗伯‧史塔克': `罗伯‧史塔克
【勋章类型】真人男从
【入手条件】堕落＜30
【商店售价】500金币
【等级1】1% 回帖金币+1 知识+1▕▏升级条件：堕落≥10
【等级2】2% 回帖金币+1 知识+1▕▏升级条件：消耗200金币
【等级3】5% 回帖金币+1、发帖旅程+1▕▏升级条件：主题≥35
【等级4】8% 回帖金币+1、发帖旅程+1▕▏升级条件：消耗300血液
【等级5】10% 回帖金币+1、发帖旅程+1▕▏升级条件：积分≥300
【等级6】11% 回帖金币+1、发帖旅程+1 金币+3▕▏升级条件：消耗500金币
【等级7】13% 回帖金币+2、发帖旅程+1 金币+3▕▏升级条件：消耗700血液
【 Max 】50% 发帖金币+7 咒术+1`,
      '亚当‧简森': `亚当‧简森
【勋章类型】游戏男从
【入手条件】无
【商店售价】350金币
【等级1】5% 回帖金币+1、发帖血液+1▕▏升级条件：消耗20咒术
【等级2】6% 回帖金币+1、发帖血液+2▕▏升级条件：知识≥15
【等级3】7% 回帖金币+2、发帖血液+3▕▏升级条件：消耗50咒术
【等级4】8% 回帖金币+2、发帖血液+4▕▏升级条件：知识≥45
【 Max 】9% 回帖金币+3、发帖血液+5`,
      '布莱恩·欧康纳': `布莱恩·欧康纳
【入手条件】追随≥20
【商店售价】400金币
【等级1】4% 回帖金币+1▕▏升级条件：消耗100金币
【等级2】6% 回帖金币+1▕▏升级条件：消耗100血液
【等级3】8% 回帖金币+1▕▏升级条件：追随≥101
【 Max 】10% 回帖金币+2、发帖旅程+1`,
      '迪恩·温彻斯特': `迪恩·温彻斯特
【勋章类型】真人男从
【入手条件】无
【商店售价】400金币
【等级1】2% 回帖血液+2、发帖血液+2▕▏升级条件：血液≥100
【等级2】4% 回帖血液+2、发帖血液+2▕▏升级条件：血液≥250
【等级3】6% 回帖血液+2、发帖血液+2▕▏升级条件：血液≥450
【等级4】8% 回帖血液+2、发帖血液+2▕▏升级条件：消耗350金币
【 Max 】10% 回帖血液+2、发帖血液+2`,
      '山姆·温彻斯特': `山姆·温彻斯特
【勋章类型】真人男从
【入手条件】无
【商店售价】400金币
【等级1】2% 回帖金币+2、发帖金币+2▕▏升级条件：咒术≥10
【等级2】4% 回帖金币+2、发帖金币+2▕▏升级条件：咒术≥50
【等级3】6% 回帖金币+2、发帖金币+2▕▏升级条件：咒术≥100
【等级4】8% 回帖金币+2、发帖金币+2▕▏升级条件：消耗350金币
【 Max 】10% 回帖金币+2、发帖金币+2`,
      魔术师奥斯卡: `魔术师奥斯卡
【勋章类型】真人男从
【入手条件】旅程≥10
【商店售价】490金币
【等级1】5% 回帖堕落+1▕▏升级条件：消耗30咒术
【等级2】6% 回帖堕落-1▕▏升级条件：消耗75咒术
【等级3】7% 回帖堕落+1▕▏升级条件：堕落≥20
【等级4】8% 回帖堕落-1、发帖知识+1▕▏升级条件：消耗120咒术
【等级5】9% 回帖堕落+1 咒术+1 发帖咒术+3 知识+1▕▏升级条件：咒术≥100
【 Max 】10% 回帖堕落-1 咒术+1、发帖知识+1 咒术+3`,
      '戴蒙‧萨尔瓦托': `戴蒙‧萨尔瓦托
【勋章类型】真人男从
【入手条件】堕落≥10
【商店售价】450金币
【等级1】5% 回帖血液+5 堕落+1、发帖血液+5 堕落+1▕▏升级条件：血液≥5
【等级2】无属性▕▏升级条件：血液≥20
【等级3】5% 回帖血液+1▕▏升级条件：血液≥50
【等级4】20% 回帖血液+1、发帖血液+3▕▏升级条件：血液≥55
【等级5】5% 回帖血液+1、发帖血液+3▕▏升级条件：血液≥100
【等级6】10% 回帖血液-1、发帖堕落+2 血液+2▕▏升级条件：血液≥108
【等级7】100% 回帖血液+2 堕落+1、发帖血液+2 堕落+1▕▏升级条件：血液≥110
【等级8】无属性▕▏升级条件：血液≥150
【等级9】2% 回帖血液-5 堕落+5、发帖灵魂+1▕▏升级条件：血液≥160
【等级10】20% 回帖血液-1 堕落+1▕▏升级条件：血液≥300
【 Max 】无属性`,
      '库伦(起源)': `库伦(起源)
【入手条件】咒术≤25
【商店售价】480金币
【等级1】18% 回帖血液+2、发帖血液+6▕▏升级条件：咒术≥11
【 Max 】7% 发帖血液+8 咒术-1`,
      铁牛: `铁牛
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】5% 回帖血液-1 金币+2▕▏升级条件：血液≥350
【等级2】7% 回帖血液-1 金币+2▕▏升级条件：消耗200血液
【 Max 】13% 回帖血液-1 金币+3 堕落+1、发帖血液-1 金币+3 堕落+1`,
      '康纳‧沃什': `康纳‧沃什
【勋章类型】真人男从
【入手条件】无
【商店售价】400金币
【等级1】5% 回帖血液+1▕▏升级条件：消耗50血液
【等级2】6% 回帖血液+1、发帖血液+1▕▏升级条件：堕落≥50
【等级3】7% 发帖知识+1 血液+1▕▏升级条件：知识≥50
【 Max 】8% 回帖堕落+1 血液+1、发帖知识+1 血液+1`,
      '尼克·贝特曼': `尼克·贝特曼
【勋章类型】真人男从
【入手条件】无
【商店售价】500金币
【等级1】无属性▕▏升级条件：血液≥600
【等级2】3% 发帖血液+3▕▏升级条件：金币≥600
【等级3】5% 发帖血液+3 咒术+2▕▏升级条件：血液≥900
【等级4】7% 发帖血液+3 旅程+1▕▏升级条件：金币≥900
【等级5】15% 发帖血液+3 金币+2▕▏升级条件：灵魂≥1
【 Max 】20% 发帖血液+4 金币+3`,
      '杰夫‧莫罗': `杰夫‧莫罗
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】无属性▕▏升级条件：消耗20血液
【等级2】3% 发帖知识+1▕▏升级条件：血液≥100
【等级3】3% 回帖知识+1、发帖知识+1▕▏升级条件：血液≥200
【等级4】5% 回帖知识+1、发帖知识+1▕▏升级条件：消耗600金币
【 Max 】7% 回帖知识+1、发帖知识+1 旅程+1`,
      维吉尔: `维吉尔
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】无属性▕▏升级条件：消耗20血液
【等级2】无属性▕▏升级条件：消耗80血液
【等级3】4% 回帖咒术+1、发帖咒术+1▕▏升级条件：堕落-10
【 Max 】6% 回帖咒术+1、发帖咒术+1 知识+1`,
      威尔卡斯: `威尔卡斯
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】无属性▕▏升级条件：消耗10血液
【等级2】无属性▕▏升级条件：消耗30血液
【等级3】无属性▕▏升级条件：消耗60血液
【 Max 】2% 发帖灵魂+1`,
      卡斯迪奥: `卡斯迪奥
【勋章类型】真人男从
【入手条件】堕落≤10
【商店售价】520金币
【等级1】2% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗50血液
【等级2】3% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗80血液
【等级3】4% 回帖堕落-1、发帖堕落-1 血液+1▕▏升级条件：消耗100血液
【等级4】5% 回帖堕落-1、发帖堕落-1 血液+1▕▏升级条件：消耗1灵魂
【等级5】无属性▕▏升级条件：堕落≥1
【等级6】2% 回帖血液+5 堕落-3、发帖灵魂+1 堕落-5▕▏升级条件：堕落≥16
【等级7】15% 回帖血液+2 堕落-1、发帖血液+3 堕落-3▕▏升级条件：堕落≥66
【等级8】15% 回帖金币+2 堕落+1、发帖金币+3 堕落+3▕▏升级条件：堕落≥116
【等级9】2% 回帖金币+5 堕落+3、发帖灵魂+1 堕落+5▕▏升级条件：堕落≥131
【 Max 】无属性`,
      虎克船长: `虎克船长
【勋章类型】真人男从
【入手条件】旅程≥15
【商店售价】320金币
【等级1】1% 发帖旅程+1▕▏升级条件：消耗150金币
【等级2】1% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗200血液
【等级3】2% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗-5堕落
【等级4】2% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗-10咒术
【等级5】3% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗-1知识
【 Max 】3% 回帖旅程+1、发帖旅程+1`,
      '卢西亚诺‧科斯塔': `卢西亚诺‧科斯塔
【勋章类型】真人男从
【入手条件】无
【商店售价】380金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：知识≥100
【 Max 】30% 回帖血液+1、发帖血液+1`,
      '安德森‧戴维斯': `安德森‧戴维斯
【勋章类型】真人男从
【入手条件】无
【商店售价】500金币
【等级1】2% 回帖血液+1、发帖咒术+1▕▏升级条件：堕落≥5
【等级2】4% 回帖血液+1、发帖咒术+1▕▏升级条件：堕落≥10
【等级3】6% 回帖血液+1、发帖咒术+1▕▏升级条件：堕落≥25
【等级4】8% 回帖血液+1、发帖咒术+1▕▏升级条件：堕落≥50
【等级5】10% 回帖金币-1 血液+1、发帖咒术+1▕▏升级条件：堕落≥100
【 Max 】15% 回帖金币-1 血液+1 咒术+1、发帖咒术+2`,
      尤利西斯: `尤利西斯
【勋章类型】真人男从
【入手条件】无
【商店售价】250金币
【等级1】无属性▕▏升级条件：消耗200血液
【等级2】2% 回帖血液+1▕▏升级条件：消耗-10堕落
【等级3】7% 回帖金币+1▕▏升级条件：金币≥600
【 Max 】无属性`,
      '克里斯‧雷德菲尔德': `克里斯‧雷德菲尔德
【勋章类型】游戏男从
【入手条件】无
【商店售价】550金币
【等级1】3% 回帖血液+1、发帖血液+1▕▏升级条件：消耗30血液
【等级2】3% 回帖血液+2、发帖血液+2▕▏升级条件：追随≥50
【等级3】4% 回帖血液+2、发帖血液+2 旅程+1▕▏升级条件：追随≥100
【等级4】5% 回帖血液+2 旅程+1、发帖血液+2 旅程+1▕▏升级条件：消耗100血液
【 Max 】7% 回帖血液+2 旅程+1 金币+1、发帖血液+2 旅程+1`,
      裸体克里斯: `裸体克里斯
【勋章类型】游戏男从
【入手条件】无
【商店售价】888金币
【 Max 】100% 回帖金币+1、发帖金币+1`,
      '凯登‧阿兰科': `凯登‧阿兰科
【勋章类型】游戏男从
【入手条件】无
【商店售价】550金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗20血液
【等级2】5% 回帖金币+1 血液+1▕▏升级条件：血液≥60
【等级3】7% 回帖金币+1 血液+1▕▏升级条件：消耗150金币
【等级4】10% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：灵魂≥1
【等级5】20% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：消耗800金币
【 Max 】50% 回帖金币+1 血液+1、发帖金币+3 血液+3`,
      肥皂: `肥皂
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】无属性▕▏升级条件：消耗60金币
【等级2】3% 回帖金币+1、发帖金币+5▕▏升级条件：消耗150金币
【等级3】7% 回帖金币+1、发帖金币+5▕▏升级条件：追随≥50
【等级4】10% 回帖金币+1、发帖金币+5▕▏升级条件：追随≥80
【等级5】12% 回帖金币+1、发帖金币+5▕▏升级条件：消耗-200金币
【 Max 】12% 回帖金币+2、发帖金币+5 旅程+1`,
      '奥利弗‧奎恩': `奥利弗‧奎恩
【勋章类型】真人男从
【入手条件】堕落＜50
【商店售价】400金币
【等级1】5% 发帖血液+2▕▏升级条件：消耗40血液
【等级2】7% 发帖血液+2▕▏升级条件：消耗65血液
【等级3】9% 发帖血液+2▕▏升级条件：主题数≥15
【等级4】11% 回帖血液+1、发帖血液+2▕▏升级条件：追随≥45
【等级5】13% 回帖血液+1、发帖血液+2▕▏升级条件：消耗30堕落
【等级6】13% 回帖血液+1、发帖血液+2▕▏升级条件：消耗500血液
【 Max 】15% 回帖血液+1 堕落-1、发帖血液+2 堕落-3`,
      猫化弩哥: `猫化弩哥
【勋章类型】真人男从
【入手条件】堕落＞5
【商店售价】200金币
【 Max 】6% 发帖知识+1 咒术+1`,
      '史蒂夫‧金克斯': `史蒂夫‧金克斯
【勋章类型】真人男从
【入手条件】无
【商店售价】230金币
【等级1】3% 回帖咒术+1、发帖咒术+1▕▏升级条件：咒术≥120
【 Max 】5% 回帖堕落+2、发帖堕落+2`,
      '巴特‧贝克': `巴特‧贝克
【勋章类型】真人男从
【入手条件】堕落＜20
【商店售价】180金币
【等级1】2% 回帖堕落+1▕▏升级条件：20堕落
【等级2】4% 回帖堕落+1▕▏升级条件：50堕落
【 Max 】6% 回帖堕落+1 金币+1、发帖堕落+1 金币+1`,
      '杰森·斯坦森': `杰森·斯坦森
【勋章类型】真人男从
【入手条件】无
【商店售价】490金币
【等级1】无属性▕▏升级条件：金币≥50
【等级2】1% 回帖血液+1▕▏升级条件：金币≥300
【等级3】5% 回帖血液+1、发帖血液+1▕▏升级条件：金币≥750
【等级4】10% 回帖堕落-1 血液+1、发帖堕落-1 血液+1▕▏升级条件：血液≥1000
【等级5】15% 回帖堕落-1 血液+2、发帖堕落-1 血液+2▕▏升级条件：消耗1灵魂
【 Max 】25% 回帖堕落-1 血液+2、发帖堕落-1 血液+2`,
      '哈尔‧乔丹': `哈尔‧乔丹
【勋章类型】真人男从
【入手条件】无
【商店售价】550金币
【等级1】无属性▕▏升级条件：知识≥15
【等级2】2% 回帖咒术+1▕▏升级条件：追随≥75
【等级3】5% 回帖咒术+1、发帖咒术+1▕▏升级条件：积分≥100（手动升级，但是无消耗）
【 Max 】7% 回帖咒术+1、发帖咒术+1 旅程+1`,
      艾德尔: `艾德尔
【勋章类型】游戏男从
【入手条件】无
【商店售价】280金币
【 Max 】8% 发帖血液+3 旅程+1`,
      '盖拉斯‧瓦卡瑞安': `盖拉斯‧瓦卡瑞安
【勋章类型】游戏男从
【入手条件】无
【商店售价】450金币
【等级1】5% 回帖金币+1、发帖金币+1▕▏升级条件：灵魂≥2
【等级2】5% 回帖知识+1、发帖知识+1▕▏升级条件：血液≥50
【等级3】8% 回帖血液+1、发帖血液+1▕▏升级条件：血液≥600
【 Max 】12% 回帖金币+1、发帖金币+2`,
      '戴尔‧芭芭拉': `戴尔‧芭芭拉
【勋章类型】真人男从
【入手条件】无
【商店售价】280金币
【等级1】无属性▕▏升级条件：250血液
【等级2】3% 发帖堕落+1▕▏升级条件：10堕落
【 Max 】3% 回帖堕落-1 血液+1、发帖旅程+1`,
      'Frank (LBF)': `Frank (LBF)
【勋章类型】真人男从
【入手条件】无
【商店售价】270金币
【等级1】3% 回帖血液+1▕▏升级条件：10主题数
【等级2】6% 回帖血液+1▕▏升级条件：30追随
【等级3】10% 回帖血液+1▕▏升级条件：90旅程
【 Max 】10% 回帖血液+1 堕落-1、发帖旅程+1`,
      'BIG BOSS': `BIG BOSS
【勋章类型】游戏男从
【入手条件】堕落＞20
【商店售价】600金币
【等级1】3% 回帖堕落+1、发帖堕落+1▕▏升级条件：消耗500血液
【等级2】5% 回帖金币+1 堕落+1、发帖堕落+1▕▏升级条件：消耗1灵魂
【等级3】10% 回帖金币+1 堕落+1、发帖堕落+1▕▏升级条件：金币≥1000
【 Max 】20% 回帖金币+1 血液+1、发帖金币+3 血液+3`,
      '詹米·多南': `詹米·多南
【勋章类型】真人男从
【入手条件】无
【商店售价】320金币
【等级1】5% 回帖血液+1 堕落+1、发帖血液+2 堕落+1▕▏升级条件：消耗60咒术
【 Max 】10% 回帖血液+1 堕落+1、发帖血液+2 堕落+1`,
      '阿尔萨斯‧米奈希尔': `阿尔萨斯‧米奈希尔
【勋章类型】游戏男从
【入手条件】无
【商店售价】350金币
【等级1】7% 回帖堕落+1、发帖咒术+2▕▏升级条件：堕落≥50
【 Max 】15% 回帖血液+1、发帖咒术+2`,
      '克里斯·埃文斯': `克里斯·埃文斯
【勋章类型】真人男从
【入手条件】无
【商店售价】300金币
【等级1】2% 回帖血液+1、发帖血液+1▕▏升级条件：追随≥50
【等级2】3% 回帖血液+2、发帖血液+2▕▏升级条件：消耗300金币
【 Max 】5% 回帖血液+2 旅程+1、发帖血液+2 旅程+1`,
      '安德鲁·库珀': `安德鲁·库珀
【勋章类型】真人男从
【入手条件】无
【商店售价】400金币
【等级1】2% 回帖金币+1 血液-1▕▏升级条件：消耗200血液
【等级2】5% 回帖金币+2 血液-1▕▏升级条件：消耗300血液
【 Max 】10% 回帖金币+3 血液-1、发帖金币+3 血液-1`,
      '罗宾·西克': `罗宾·西克
【勋章类型】真人男从
【入手条件】无
【商店售价】300金币
【等级1】5% 回帖堕落+1▕▏升级条件：堕落≥20
【等级2】5% 回帖堕落+2▕▏升级条件：堕落≥50
【等级3】10% 回帖堕落+2 血液-1▕▏升级条件：消耗200血液
【 Max 】15% 回帖堕落-1 血液+2`,
      岛田半藏: `岛田半藏
【勋章类型】游戏男从
【入手条件】无
【商店售价】500金币
【等级1】2% 回帖血液+1▕▏升级条件：知识≥10
【等级2】5% 回帖血液+1▕▏升级条件：旅程≥25
【等级3】5% 回帖金币+1 血液+1▕▏升级条件：消耗100咒术
【 Max 】10% 回帖金币+1 咒术+1`,
      '泰凯斯·芬得利': `泰凯斯·芬得利
【勋章类型】游戏男从
【入手条件】追随>=10
【商店售价】320金币
【等级1】4% 回帖血液+1▕▏升级条件：血液≥100
【等级2】6% 回帖血液+1、发帖金币+1▕▏升级条件：消耗150血液
【等级3】8% 回帖血液+1、发帖金币+2▕▏升级条件：消耗200金币
【 Max 】8% 回帖血液+2、发帖金币+2 知识+1`,
      '【夏日限定】夏日的泰凯斯': `【夏日限定】夏日的泰凯斯
【勋章类型】游戏男从
【入手条件】堕落>=30
【商店售价】666金币
【等级1】5% 回帖堕落+1▕▏升级条件：堕落≥50
【等级2】10% 回帖堕落+1 血液+1▕▏升级条件：消耗200血液
【等级3】15% 回帖堕落+1 血液+2、发帖血液+3 堕落+1▕▏升级条件：消耗200金币
【 Max 】20% 回帖金币-1 血液+3 堕落+1、发帖血液+5 堕落+1`,
      夏日的泰凯斯: `夏日的泰凯斯
【入手条件】堕落>=30
【商店售价】666金币
【等级1】5% 回帖堕落+1▕▏升级条件：堕落≥50
【等级2】10% 回帖堕落+1 血液+1▕▏升级条件：消耗200血液
【等级3】15% 回帖堕落+1 血液+2、发帖血液+3 堕落+1▕▏升级条件：消耗200金币
【 Max 】20% 回帖金币-1 血液+3 堕落+1、发帖血液+5 堕落+1`,
      '康纳/Connor': `康纳/Connor
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】2% 回帖金币+1▕▏升级条件：消耗75金币
【等级2】4% 回帖金币+1▕▏升级条件：消耗75血液
【等级3】6% 回帖金币+1、发帖金币+1▕▏升级条件：消耗250金币
【等级4】8% 回帖金币+1、发帖金币+1 血液+1▕▏升级条件：消耗250血液
【等级5】8% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：追随≥50
【 Max 】12% 回帖金币+2 血液+1、发帖金币+3 旅程+1`,
      '亚瑟·库瑞（海王）': `亚瑟·库瑞（海王）
【勋章类型】真人男从
【入手条件】咒术≤30
【商店售价】450金币
【等级1】2% 回帖血液+1▕▏升级条件：旅程≥30
【等级2】3% 回帖血液+1、发帖血液+1▕▏升级条件：追随≥100
【等级3】5% 回帖血液+1、发帖血液+2▕▏升级条件：消耗200血液
【等级4】8% 回帖血液+2、发帖血液+2▕▏升级条件：消耗50咒术
【 Max 】12% 回帖血液+3、发帖血液+3 咒术+1`,
      '亚瑟‧摩根': `亚瑟‧摩根
【勋章类型】游戏男从
【入手条件】堕落≥10
【商店售价】500金币
【等级1】4% 发帖金币+1▕▏升级条件：消耗200血液
【等级2】4% 回帖金币+1、发帖金币+1▕▏升级条件：消耗300金币
【等级3】6% 回帖金币+1、发帖金币+1▕▏升级条件：追随≥100
【等级4】8% 回帖金币+1、发帖金币+2 血液+1▕▏升级条件：消耗-2旅程
【等级5】12% 回帖金币+2、发帖金币+2 旅程+1▕▏升级条件：消耗-15堕落
【 Max 】16% 回帖金币+3、发帖金币+3 旅程+1`,
      蛮族战士: `蛮族战士
【勋章类型】游戏男从
【入手条件】无
【商店售价】50金币
【等级1】勋章博物馆资料暂缺
【 Max 】5% 回帖血液+1`,
      黑墙: `黑墙
【勋章类型】游戏男从
【入手条件】旅程≥15
【商店售价】400金币
【等级1】3% 回帖金币+1▕▏升级条件：追随≥20
【等级2】6% 回帖金币+1 血液+1▕▏升级条件：消耗200金币
【等级3】9% 回帖金币+1 血液+1▕▏升级条件：消耗200血液
【等级4】13% 回帖血液+2、发帖金币+1 血液+3▕▏升级条件：堕落≥50
【等级5】13% 回帖金币+1 血液+1、发帖金币+2 血液+2▕▏升级条件：堕落≥100
【 Max 】13% 回帖金币+2、发帖金币+3 血液+1`,
      '内森·德雷克': `内森·德雷克
【勋章类型】游戏男从
【入手条件】旅程≥10
【商店售价】600金币
【等级1】4% 回帖血液+1▕▏升级条件：消耗333血液
【等级2】6% 回帖血液+1▕▏升级条件：消耗10堕落
【等级3】8% 回帖血液+1▕▏升级条件：消耗333血液
【等级4】10% 回帖血液+2▕▏升级条件：消耗333血液
【等级5】20% 回帖血液+3、发帖旅程+1▕▏升级条件：消耗-299金币
【 Max 】15% 回帖血液+3、发帖血液+2 旅程+1`,
      '丹尼爾·紐曼': `丹尼爾·紐曼
【勋章类型】真人男从
【入手条件】主题数≥3
【商店售价】350金币
【等级1】5% 回帖血液+1▕▏升级条件：金币≥400
【等级2】5% 回帖血液+1、发帖金币+1▕▏升级条件：血液≥400
【等级3】8% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：追随≥100
【 Max 】10% 回帖金币+1 血液+1、发帖金币+2 血液+2`,
      贝优妮塔: `贝优妮塔
【勋章类型】女从
【入手条件】咒术≥10
【商店售价】280金币
【等级1】5% 回帖堕落+1▕▏升级条件：堕落-10
【等级2】5% 回帖堕落+1 血液+1▕▏升级条件：70追随
【 Max 】5% 回帖堕落+1 血液+1 咒术+1`,
      英普瑞斯: `英普瑞斯
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】3% 回帖堕落-1▕▏升级条件：追随≥70
【等级2】7% 回帖堕落-1 血液+1、发帖血液+1▕▏升级条件：消耗300金币
【等级3】10% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：血液≥700
【 Max 】17% 回帖金币+1 血液+1、发帖金币+2 血液+2`,
      '杰西·麦克雷': `杰西·麦克雷
【勋章类型】游戏男从
【入手条件】无
【商店售价】500金币
【等级1】5% 回帖金币+1、发帖堕落+1▕▏升级条件：发帖数≥100
【等级2】8% 回帖金币+1、发帖堕落+1▕▏升级条件：主题数≥10
【等级3】10% 回帖金币+1 堕落+1、发帖堕落+1▕▏升级条件：堕落≥40
【等级4】15% 回帖金币+1 堕落+1、发帖旅程+1▕▏升级条件：消耗400血液
【 Max 】15% 回帖金币+2 堕落+1、发帖旅程+1 堕落+1`,
      '卡德加（Khadgar）': `卡德加（Khadgar）
【勋章类型】真人男从
【入手条件】无
【商店售价】350金币
【等级1】3% 发帖堕落-1▕▏升级条件：咒术≥40
【等级2】6% 回帖堕落-1、发帖知识+1 堕落-1▕▏升级条件：消耗80咒术
【等级3】9% 回帖血液+1 堕落-1、发帖知识+1 堕落-1▕▏升级条件：消耗15堕落
【 Max 】12% 回帖血液+2 堕落-1、发帖知识+1 堕落-1`,
      '麦迪文（Medivh）': `麦迪文（Medivh）
【勋章类型】真人男从
【入手条件】无
【商店售价】350金币
【等级1】4% 发帖咒术+1▕▏升级条件: 消耗66咒术
【等级2】6% 回帖咒术+1、发帖咒术+1▕▏升级条件: 堕落≥50
【等级3】8% 回帖咒术+1、发帖咒术+1 堕落+1▕▏升级条件: 堕落≥99
【 Max 】12% 回帖咒术+1、发帖咒术+2 堕落+1`,
      遗忘之水: `遗忘之水
【勋章类型】赠礼
【入手条件】无
【商店售价】180金币
【等级1】无属性▕▏升级条件：消耗10堕落
【等级2】无属性▕▏升级条件：消耗10堕落
【等级3】无属性▕▏升级条件：消耗10堕落
【 Max 】无属性`,
      千杯不醉: `千杯不醉
【勋章类型】赠礼
【入手条件】无
【商店售价】12金币
【 Max 】5% 回帖血液+1 堕落+1、发帖血液+1 堕落+1`,
      送情书: `送情书
【勋章类型】赠礼（只可赠送）
【入手条件】无
【商店售价】15金币
【时效】5天
【 Max 】10% 回帖咒术+1、发帖咒术+1`,
      丢肥皂: `丢肥皂
【勋章类型】赠礼（只可赠送）
【入手条件】无
【商店售价】10金币
【时效】5天
【 Max 】10% 回帖堕落+1、发帖堕落+1`,
      灵光补脑剂: `灵光补脑剂
【勋章类型】赠礼（只可赠送）
【入手条件】无
【商店售价】22金币
【时效】3天
【等级1】升级条件：消耗-1知识
【 Max 】2% 回帖血液-1`,
      萨赫的蛋糕: `萨赫的蛋糕
【勋章类型】赠礼（只可赠送）
【入手条件】知识≥5
【商店售价】40金币
【时效】14天
【 Max 】10% 回帖血液+2、发帖血液+2`,
      神秘商店贵宾卡: `神秘商店贵宾卡
【勋章类型】赠礼（只可赠送）
【入手条件】知识≥10
【商店售价】50金币
【时效】7天
【等级1】10% 回帖金币+2▕▏升级条件：咒术≥20
【等级2】20% 回帖金币+2、发帖旅程+1▕▏升级条件：咒术≥60
【 Max 】30% 回帖金币+3、发帖旅程+1`,
      变骚喷雾: `变骚喷雾
【勋章类型】赠礼（只可赠送）
【入手条件】无
【商店售价】13金币
【时效】5天
【 Max 】5% 回帖堕落+1 金币+1、发帖堕落+1 金币+1`,
      贞洁内裤: `贞洁内裤
【勋章类型】赠礼（只可赠送）（已下架）
【入手条件】无
【商店售价】110金币
【 Max 】13% 回帖堕落-1 血液+3`,
      没有梦想的咸鱼: `没有梦想的咸鱼
【勋章类型】赠礼（只可赠送）
【入手条件】无
【商店售价】1金币
【时效】1天
【 Max 】1% 回帖金币+1、回帖血液+1`,
      石肤术: `石肤术
【勋章类型】咒术
【入手条件】血液≥15
【商店售价】4咒术
【时效】3天
【等级1】10% 回帖血液+1、发帖血液+1▕▏升级条件：血液≥200
【等级2】20% 回帖血液+1、发帖血液+1▕▏升级条件：血液≥400
【 Max 】40% 回帖血液+1、发帖血液+1`,
      吞食魂魄: `吞食魂魄
【勋章类型】咒术
【入手条件】知识≥35
【商店售价】1灵魂
【时效】7天
【等级1】1% 无属性▕▏升级条件：消耗-1001血液
【等级2】10% 无属性▕▏升级条件：堕落≥10
【 Max 】10% 回帖血液-1、发帖血液-1`,
      咆哮诅咒: `咆哮诅咒
【勋章类型】咒术
【入手条件】知识≥28
【商店售价】8咒术
【时效】3天
【等级1】30% 回帖堕落+3 血液-1▕▏升级条件：积分≥35（手动升级，但是无消耗）
【 Max 】无属性`,
      霍格沃茨五日游: `霍格沃茨五日游
【勋章类型】咒术
【入手条件】旅程≥10
【商店售价】8咒术
【时效】5天
【等级1】5% 回帖咒术+2▕▏升级条件：旅程≥10
【等级2】20% 发帖知识+1▕▏升级条件：知识≥20
【等级3】20% 回帖血液+3、发帖知识+1 血液+3▕▏升级条件：追随≥100
【等级4】20% 回帖血液+5、发帖旅程+1 血液+5▕▏升级条件：堕落≥50
【 Max 】20% 回帖血液+3、发帖堕落+1 血液+3`,
      祈祷术: `祈祷术
【勋章类型】咒术
【入手条件】无
【商店售价】8咒术
【时效】3天
【等级1】15% 回帖堕落-1、发帖堕落-1▕▏升级条件：知识≥5
【等级2】15% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗1堕落
【等级3】12% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗1堕落
【等级4】10% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗1堕落
【等级5】8% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗1堕落
【等级6】6% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗1堕落
【 Max 】4% 回帖堕落-1、发帖堕落-1`,
      黑暗交易: `黑暗交易
【勋章类型】咒术
【入手条件】堕落＞10 知识≥10
【商店售价】8咒术
【时效】3天
【等级1】勋章博物馆数据暂缺
【等级2】25% 回帖金币+2 血液-1、发帖金币+2 血液-1▕▏升级条件：堕落≥25
【等级3】勋章博物馆数据暂缺
【等级4】25% 回帖金币+4 血液-2、发帖金币+4 血液-2▕▏升级条件：堕落≥50
【等级5】0%▕▏升级条件：血液≥3
【 Max 】25% 回帖金币+6 血液-3、发帖金币+6 血液-3`,
      炼金之心: `炼金之心
【勋章类型】咒术
【入手条件】无
【商店售价】4咒术
【时效】3天
【等级1】10% 回帖金币+2▕▏升级条件：知识≥3
【等级2】15% 回帖金币+2▕▏升级条件：知识≥15
【等级3】20% 回帖金币+2▕▏升级条件：知识≥30
【 Max 】30% 回帖金币+2`,
      水泡术: `水泡术
【勋章类型】咒术
【入手条件】知识≥3
【商店售价】3咒术
【时效】5天
【等级1】无属性▕▏升级条件：知识≥6
【等级2】无属性▕▏升级条件：消耗-10血液
【 Max 】1% 回帖血液+1`,
      召唤古代战士: `召唤古代战士
【勋章类型】咒术
【入手条件】知识≥6
【商店售价】8咒术
【时效】4天
【等级1】10% 回帖血液+3、发帖血液+3▕▏升级条件：知识≥25
【 Max 】30% 回帖血液+3、发帖血液+3`,
      念念往日士官盔: `念念往日士官盔
【勋章类型】装备
【入手条件】无
【商店售价】125金币
【 Max 】30% 回帖金币-1 血液+1`,
      药剂背袋: `药剂背袋
【勋章类型】装备
【入手条件】无
【商店售价】180金币
【 Max 】8% 回帖血液+1、发帖血液+1`,
      刺杀者匕首: `刺杀者匕首
【勋章类型】装备
【入手条件】堕落＞10
【商店售价】80金币
【 Max 】5% 回帖金币+3`,
      净化手杖: `净化手杖
【勋章类型】装备
【入手条件】堕落＜50
【商店售价】400金币
【等级1】10% 发帖堕落-1▕▏升级条件：在线时间≥800
【 Max 】20% 回帖堕落-1、发帖堕落-1 咒术+1`,
      符文披风: `符文披风
【勋章类型】装备
【入手条件】无
【商店售价】280金币
【 Max 】8% 回帖咒术+1、发帖咒术+1`,
      嗜血斩首斧: `嗜血斩首斧
【勋章类型】装备
【入手条件】无
【商店售价】100金币
【 Max 】5% 回帖堕落+1`,
      圣英灵秘银甲: `圣英灵秘银甲
【勋章类型】装备
【入手条件】无
【商店售价】1350金币
【等级1】11% 回帖血液+2 堕落-1、发帖血液+2 堕落-1▕▏升级条件：消耗1灵魂
【等级2】31% 回帖血液+2 堕落-1、发帖血液+2 堕落-1▕▏升级条件：咒术≥111
【 Max 】41% 回帖血液+2 堕落-1、发帖血液+2 堕落-1 旅程+1`,
      重磅手环: `重磅手环
【勋章类型】装备
【入手条件】无
【商店售价】250金币
【 Max 】20% 发帖血液-5 旅程+1`,
      新月护符: `新月护符
【勋章类型】装备
【入手条件】血液≥50
【商店售价】200金币
【等级1】5% 回帖堕落-1、发帖堕落-1▕▏升级条件：旅程≥90
【 Max 】10% 回帖堕落-2、发帖堕落-2 旅程+1 `,
      布衣: `布衣
【勋章类型】装备
【入手条件】无
【商店售价】45金币
【等级1】1% 回帖血液-1▕▏升级条件：消耗2金币
【等级2】无属性▕▏升级条件：消耗4金币
【等级3】1% 回帖血液+1▕▏升级条件：消耗16金币
【等级4】1% 回帖血液+1▕▏升级条件：消耗18金币
【等级5】1% 回帖血液+1▕▏升级条件：消耗20金币
【等级6】1% 回帖血液+1▕▏升级条件：消耗22金币
【等级7】2% 回帖血液+1▕▏升级条件：消耗34金币
【等级8】2% 回帖血液+1、发帖血液+1▕▏升级条件：消耗36金币
【等级9】2% 回帖血液+2、发帖血液+2▕▏升级条件：消耗38金币
【等级10】2% 回帖血液+2、发帖血液+3▕▏升级条件：消耗50金币
【等级11】2% 回帖血液+2 咒术+1、发帖血液+2 咒术+2▕▏升级条件：消耗52金币
【等级12】2% 回帖血液+2 咒术+1、发帖血液+2 咒术+3▕▏升级条件：消耗64金币
【等级13】2% 回帖血液+3 知识+1、发帖血液+3 知识+1▕▏升级条件：消耗250血液
【 Max 】3% 回帖血液+5 咒术-1、发帖血液+5 咒术-1`,
      骑士遗盔: `骑士遗盔
【勋章类型】装备
【入手条件】无
【商店售价】275金币
【等级1】1% 回帖咒术+1▕▏升级条件：消耗25金币
【等级2】2% 回帖咒术+1、发帖知识+1▕▏升级条件：消耗50金币
【等级3】3% 回帖咒术+1、发帖知识+1▕▏升级条件：消耗100金币
【 Max 】5% 回帖咒术+1 血液+1、发帖知识+1 `,
      艾尔尤因: `艾尔尤因
【勋章类型】装备
【入手条件】无
【商店售价】290金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：血液≥300
【等级2】5% 回帖咒术+1、发帖咒术+1▕▏升级条件：血液≥500
【 Max 】10% 回帖血液+1 堕落-1、发帖血液+1 堕落-1`,
      变形软泥: `变形软泥
【勋章类型】装备
【入手条件】无
【商店售价】66金币
【等级1】无属性▕▏升级条件：堕落≥13
【等级2】3% 回帖堕落+2▕▏升级条件：消耗166金币
【 Max 】6% 回帖堕落+2、发帖咒术+1`,
      神圣十字章: `神圣十字章
【勋章类型】装备
【入手条件】旅程≥12
【商店售价】300金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗8咒术
【等级2】10% 回帖血液+1、发帖血液+1▕▏升级条件：消耗-20血液
【 Max 】5% 回帖血液+2、发帖血液+2`,
      重新充能的神圣十字章: `重新充能的神圣十字章
【勋章类型】装备
【入手条件】未知
【商店售价】300金币
【 Max 】10% 回帖血液+2，发帖血液+1、堕落-1`,
      超级名贵无用宝剑: `超级名贵无用宝剑
【勋章类型】装备
【入手条件】无
【商店售价】1299金币
【 Max 】无属性`,
      十字叶章: `十字叶章
【勋章类型】装备
【入手条件】无
【商店售价】277金币
【等级1】5% 回帖堕落-1▕▏升级条件：追随≥45
【等级2】5% 回帖堕落-1 咒术+1、发帖咒术+1▕▏升级条件：消耗80血液
【 Max 】1% 回帖堕落-5 咒术+5、发帖灵魂+1`,
      守望者徽章: `守望者徽章
【勋章类型】装备
【入手条件】血液≥200
【商店售价】100金币
【等级1】2% 回帖血液+1▕▏升级条件：消耗50血液
【等级2】4% 回帖血液+1▕▏升级条件：消耗50血液
【等级3】6% 回帖血液+2▕▏升级条件：堕落≥30
【 Max 】8% 回帖血液+2 堕落-1`,
      山猫图腾: `山猫图腾
【勋章类型】装备
【入手条件】无
【商店售价】88金币
【 Max 】2% 回帖金币+1、发帖金币+1`,
      眼镜蛇图腾: `眼镜蛇图腾
【勋章类型】装备
【入手条件】无
【商店售价】88金币
【 Max 】1% 回帖咒术+1、发帖咒术+1`,
      猎鹰图腾: `猎鹰图腾
【勋章类型】装备
【入手条件】无
【商店售价】88金币
【 Max 】2% 回帖血液+1、发帖血液+1`,
      石鬼面: `石鬼面
【勋章类型】装备
【入手条件】血液≥30
【商店售价】233金币
【等级1】9% 回帖咒术+1 血液-1▕▏升级条件：血液≥400
【 Max 】18% 回帖咒术+1 血液-3 堕落+1、发帖咒术+1`,
      锻造卷轴: `锻造卷轴
【勋章类型】资产
【入手条件】无
【商店售价】99金币
【 Max 】1% 回帖金币+1 知识+1、发帖金币+1 知识+1`,
      漂洋小船: `漂洋小船
【勋章类型】资产
【入手条件】无
【商店售价】75金币
【 Max 】2% 回帖旅程+1`,
      知识大典: `知识大典
【勋章类型】资产
【入手条件】无
【商店售价】50金币
【 Max 】1% 回帖知识+1`,
      预知水晶球: `预知水晶球
【勋章类型】资产
【入手条件】咒术≥10
【商店售价】150金币
【等级1】4% 回帖金币+1、发帖知识+1▕▏升级条件：消耗40咒术
【 Max 】8% 回帖金币+1、发帖知识+1 旅程+1`,
      种植小草: `种植小草
【勋章类型】资产
【入手条件】无
【商店售价】15金币
【等级1】无属性▕▏升级条件：追随≥5
【等级2】无属性▕▏升级条件：追随≥10
【等级3】无属性▕▏升级条件：追随≥15
【等级4】无属性▕▏升级条件：消耗-1血液
【 Max 】1% 回帖血液+1`,
      聚魔花盆: `聚魔花盆
【勋章类型】资产
【入手条件】无
【商店售价】500金币
【等级1】10% 发帖咒术+3▕▏升级条件：知识≥5
【等级2】20% 发帖咒术+3▕▏升级条件：知识≥10
【等级3】30% 发帖咒术+3▕▏升级条件：知识≥15
【等级4】40% 发帖咒术+3▕▏升级条件：知识≥30
【等级5】50% 发帖咒术+3▕▏升级条件：知识≥50
【等级6】60% 发帖咒术+3▕▏升级条件：堕落≥30
【 Max 】30% 发帖咒术+3`,
      夜灯: `夜灯
【勋章类型】资产
【入手条件】无
【商店售价】40金币
【等级1】1% 回帖血液+1▕▏升级条件：消耗15金币
【等级2】2% 回帖血液+1▕▏升级条件：消耗30金币
【等级3】3% 回帖血液+1▕▏升级条件：消耗45金币
【等级4】4% 回帖血液+1▕▏升级条件：消耗60金币
【等级5】5% 回帖血液+1▕▏升级条件：消耗75金币
【等级6】6% 回帖血液+1▕▏升级条件：消耗90金币
【等级7】7% 回帖血液+1▕▏升级条件：消耗-6旅程
【 Max 】7% 回帖血液+1`,
      种植菊花: `种植菊花
【勋章类型】资产
【入手条件】无
【商店售价】110金币
【等级1】1% 回帖堕落+1▕▏升级条件：消耗20血液
【等级2】3% 回帖堕落+1▕▏升级条件：消耗50血液
【等级3】5% 回帖血液+1 堕落+1▕▏升级条件：消耗-30金币
【 Max 】3% 回帖金币+1 堕落+1、发帖-1血液`,
      发芽的种子: `发芽的种子
【勋章类型】资产
【入手条件】在线时间＞10小时
【商店售价】77金币
【等级1】无属性▕▏升级条件：消耗50血液
【等级2】无属性▕▏升级条件：消耗50血液
【等级3】无属性▕▏升级条件：消耗50血液
【 Max 】7% 回帖金币+1、发帖金币+2`,
      奇怪的紫水晶: `奇怪的紫水晶
【勋章类型】资产
【入手条件】无
【商店售价】299金币
【等级1】5% 回帖血液-1 咒术+2 堕落+1▕▏升级条件：消耗35咒术
【 Max 】1% 回帖知识+1 咒术+1、发帖灵魂+1`,
      婴儿泪之瓶: `婴儿泪之瓶
【勋章类型】资产
【入手条件】无
【商店售价】200金币
【等级1】2% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗50金币
【等级2】2% 回帖堕落-1 知识+1、发帖堕落-1 知识+1▕▏升级条件：消耗100金币
【 Max 】3% 回帖堕落-1 知识+1、发帖堕落-1 知识+1`,
      雪王的心脏: `雪王的心脏
【勋章类型】资产
【入手条件】旅程≥12
【商店售价】180金币
【等级1】2% 回帖旅程+1▕▏升级条件：消耗30咒术
【等级2】2% 回帖知识+1 旅程+1、发帖知识+1 旅程+1▕▏升级条件：消耗50咒术
【 Max 】3% 回帖知识+1 旅程+1、发帖知识+1 旅程+1`,
      这是一片丛林: `这是一片丛林
【勋章类型】资产
【入手条件】无
【商店售价】120金币
【等级1】无属性▕▏升级条件：堕落≥35
【等级2】3% 回帖咒术+1▕▏升级条件：堕落≥70
【 Max 】3% 回帖旅程+1`,
      暗红矿土: `暗红矿土
【勋章类型】资产
【入手条件】堕落≥20
【商店售价】40金币
【等级1】1% 回帖血液+1▕▏升级条件：消耗30金币
【等级2】4% 回帖堕落+1▕▏升级条件：消耗70金币
【等级3】1% 回帖血液+2▕▏升级条件：消耗200金币
【 Max 】12% 回帖血液+1 堕落+1、发帖血液+2 咒术+2`,
      充满魔力的种子: `充满魔力的种子
【勋章类型】资产
【入手条件】旅程≥20 知识≥4
【商店售价】250金币
【等级1】无属性▕▏升级条件：消耗20咒术
【等级2】5% 回帖知识+1▕▏升级条件：在线时间≥240
【等级3】5% 回帖知识+1、发帖知识+2▕▏升级条件：消耗20咒术
【等级4】无属性▕▏升级条件：消耗10咒术
【 Max 】8% 回帖金币+2 咒术+1、发帖知识+2`,
      史莱姆养殖证书: `史莱姆养殖证书
【勋章类型】资产
【入手条件】无
【商店售价】60金币
【等级1】1% 回帖金币+1▕▏升级条件：消耗100金币
【等级2】2% 回帖金币+1▕▏升级条件：消耗100金币
【等级3】3% 回帖金币+1▕▏升级条件：消耗100金币
【等级4】4% 回帖金币+1▕▏升级条件：消耗100金币
【等级5】5% 回帖金币+1▕▏升级条件：消耗100金币
【等级6】8% 回帖金币+1▕▏升级条件：知识≥8
【等级7】8% 回帖金币+1▕▏升级条件：消耗100金币
【等级8】12% 回帖金币+1▕▏升级条件：知识≥12
【等级9】12% 回帖金币+1▕▏升级条件：消耗100金币
【等级10】
【等级11】15% 回帖金币+1▕▏升级条件：消耗100金币
【等级12】
【等级13】18% 回帖金币+1▕▏升级条件：消耗100金币
【等级14】
【等级15】21% 回帖金币+1▕▏升级条件：消耗100金币
【等级16】25% 回帖金币+1▕▏升级条件：知识≥30
【等级17】25% 回帖金币+1▕▏升级条件：消耗100金币
【等级18】
【等级19】28% 回帖金币+1▕▏升级条件：消耗100金币
【等级20】
【等级21】31% 回帖金币+1▕▏升级条件：消耗100金币
【等级22】
【等级23】35% 回帖金币+1▕▏升级条件：消耗100金币
【等级24】
【等级25】38% 回帖金币+1▕▏升级条件：消耗100金币
【等级26】
【等级27】42% 回帖金币+1▕▏升级条件：消耗100金币
【等级28】
【等级29】45% 回帖金币+1▕▏升级条件：消耗100金币
【等级30】48% 回帖金币+1▕▏升级条件：消耗20知识
【等级31】
【等级32】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥160
【等级33】25% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥170
【等级34】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥320
【等级35】70% 回帖金币+1 咒术+1、发帖金币+1▕▏升级条件：血液≥322
【等级36】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥460
【等级37】25% 回帖血液-1▕▏升级条件：血液≥470
【等级38】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥580
【等级39】100% 回帖金币+1 血液+1、发帖金币+1▕▏升级条件：血液≥620
【等级40】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥700
【等级41】15% 回帖咒术+1 金币+1、发帖金币+1▕▏升级条件：血液≥720
【等级42】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥820
【等级43】100% 回帖金币+1 血液+1、发帖金币+1▕▏升级条件：血液≥850
【等级44】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥990
【等级45】25% 回帖血液-1、咒术+1▕▏升级条件：血液≥1000
【等级46】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1130
【等级47】35% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1150
【等级48】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1280
【等级49】100% 回帖金币+1 血液+1、发帖金币+1▕▏升级条件：血液≥1340
【等级50】70% 回帖金币+1 咒术+1、发帖金币+1▕▏升级条件：血液≥1342
【等级51】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1470
【等级52】10% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1500
【等级53】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1610
【等级54】100% 回帖金币+1 血液+1、发帖金币+1▕▏升级条件：血液≥1650
【等级55】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1780
【等级56】25% 回帖血液-1▕▏升级条件：血液≥1790
【等级57】70% 回帖金币+1 咒术+1、发帖金币+1▕▏升级条件：血液≥1792
【等级58】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1880
【等级59】45% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1900
【等级60】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥1920
【等级61】100% 回帖金币+1 血液+1、发帖金币+1▕▏升级条件：血液≥1950
【等级62】70% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥2000
【 Max 】无属性`,
      种植菠菜: `种植菠菜
【勋章类型】资产
【入手条件】主题数≥5
【商店售价】30金币
【等级1】无属性▕▏升级条件：知识≥1
【等级2】无属性▕▏升级条件：消耗10金币
【等级3】无属性▕▏升级条件：知识≥2
【等级4】无属性▕▏升级条件：消耗10金币
【等级5】无属性▕▏升级条件：知识≥3
【等级6】无属性▕▏升级条件：消耗15金币
【等级7】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗-35血液
【 Max 】无属性`,
      勇者与龙之书: `勇者与龙之书
【勋章类型】资产
【入手条件】无
【商店售价】300金币
【等级1】无属性▕▏升级条件：消耗1旅程
【等级2】无属性▕▏升级条件：消耗1旅程
【等级3】无属性▕▏升级条件：消耗1旅程
【等级4】无属性▕▏升级条件：消耗1旅程
【等级5】无属性▕▏升级条件：消耗1旅程
【等级6】无属性▕▏升级条件：消耗1旅程
【等级7】无属性▕▏升级条件：消耗1旅程
【等级8】无属性▕▏升级条件：消耗1旅程
【等级9】无属性▕▏升级条件：消耗1旅程
【等级10】无属性▕▏升级条件：消耗-9旅程
【 Max 】3% 回帖旅程+1`,
      微笑的面具: `微笑的面具
【勋章类型】资产
【入手条件】无
【商店售价】100金币
【等级1】无属性▕▏升级条件：主题数≥10
【等级2】无属性▕▏升级条件：主题数≥20
【等级3】无属性▕▏升级条件：主题数≥30
【等级4】无属性▕▏升级条件：主题数≥40
【等级5】无属性▕▏升级条件：主题数≥50
【 Max 】20% 回帖堕落+1、发帖堕落+1`,
      浪潮之歌: `浪潮之歌
【勋章类型】资产
【入手条件】旅程≥70
【商店售价】300金币
【等级1】无属性▕▏升级条件：消耗1旅程
【等级2】无属性▕▏升级条件：消耗1旅程
【等级3】无属性▕▏升级条件：消耗1旅程
【等级4】无属性▕▏升级条件：消耗1旅程
【等级5】无属性▕▏升级条件：消耗1旅程
【等级6】无属性▕▏升级条件：消耗1旅程
【等级7】无属性▕▏升级条件：消耗1旅程
【等级8】无属性▕▏升级条件：消耗1旅程
【等级9】无属性▕▏升级条件：消耗1旅程
【等级10】无属性▕▏升级条件：消耗-9旅程
【 Max 】3% 回帖金币+1 旅程+1、发帖金币+1 旅程+1`,
      章鱼小丸子: `章鱼小丸子
【勋章类型】资产
【入手条件】无（该勋章不可寄售，仅可回收）
【商店售价】150金币
【等级1】10% 回帖血液+1▕▏升级条件：消耗-10血液
【等级2】7% 回帖血液+1▕▏升级条件：消耗-20血液
【等级3】5% 回帖血液+1▕▏升级条件：消耗-20血液
【等级4】3% 回帖血液+2▕▏升级条件：消耗-30血液
【 Max 】无属性`,
      流失之椅: `流失之椅
【勋章类型】资产
【入手条件】无
【商店售价】320金币
【等级1】40% 回帖血液+1、发帖旅程+1▕▏升级条件：在线时间≥80
【等级2】32% 回帖血液+1、发帖旅程+1▕▏升级条件：在线时间≥150
【等级3】24% 回帖血液+1、发帖旅程+1▕▏升级条件：在线时间≥300
【等级4】17% 回帖血液+1、发帖旅程+1▕▏升级条件：在线时间≥500
【等级5】9% 回帖血液+1、发帖旅程+1▕▏升级条件：在线时间≥800
【等级6】3% 回帖血液+1、发帖旅程+1▕▏升级条件：在线时间≥1000
【等级7】无属性▕▏升级条件：消耗1灵魂
【 Max 】50% 回帖血液+1、发帖旅程+1`,
      金钱马车: `金钱马车
【勋章类型】资产
【入手条件】旅程≥10
【商店售价】200金币
【等级1】无属性▕▏升级≥1金币
【等级2】23% 回帖金币+1▕▏升级≥50金币
【等级3】15% 回帖金币+2▕▏升级≥100金币
【等级4】26% 回帖金币+2▕▏升级≥187金币
【等级5】55% 回帖咒术+1▕▏升级≥189金币
【等级6】40% 回帖金币+3▕▏升级≥250金币
【等级7】7% 回帖金币+1▕▏升级≥345金币
【等级8】60% 回帖金币+10▕▏升级≥346金币
【等级9】10% 回帖血液-1▕▏升级≥360金币
【等级10】15% 回帖金币+2▕▏升级≥501金币
【等级11】18% 回帖知识+1▕▏升级≥502金币
【等级12】7% 回帖金币+1▕▏升级≥617金币
【等级13】26% 回帖金币+2▕▏升级≥749金币
【等级14】2% 发帖灵魂+1▕▏升级≥750金币
【等级15】30% 回帖金币+3 血液+1▕▏升级≥823金币
【等级16】23% 回帖金币+1▕▏升级≥978金币
【等级17】无属性▕▏升级≥1000金币
【等级18】15% 回帖金币+2▕▏升级≥1092金币
【等级19】26% 回帖金币+2▕▏升级≥1202金币
【等级20】55% 回帖咒术+1▕▏升级≥1204金币
【等级21】40% 回帖金币+3▕▏升级≥1250金币
【等级22】7% 回帖金币+1▕▏升级≥1334金币
【等级23】60% 回帖金币+10▕▏升级≥1335金币
【等级24】23% 回帖金币+1▕▏升级≥1500金币
【等级25】15% 回帖金币+2▕▏升级≥1666金币
【等级26】2% 发帖灵魂+1▕▏升级≥1667金币
【等级27】无属性▕▏升级≥1699金币
【等级28】23% 回帖金币+1▕▏升级≥1750金币
【等级29】10% 回帖血液-1▕▏升级≥1763金币
【等级30】30% 回帖金币+3 血液+1▕▏升级≥1811金币
【等级31】7% 回帖金币+1▕▏升级≥1888金币
【等级32】18% 回帖知识+1▕▏升级≥1889金币
【等级33】26% 回帖金币+2▕▏升级≥2000金币
【等级34】23% 回帖金币+1▕▏升级≥2073金币
【等级35】无属性▕▏升级≥2101金币
【等级36】27% 回帖金币+3▕▏升级≥2250金币
【等级37】15% 回帖金币+2▕▏升级≥2348金币
【等级38】60% 回帖金币+10▕▏升级≥2349金币
【等级39】40% 回帖金币+3▕▏升级≥2401金币
【等级40】7% 回帖金币+1▕▏升级≥2500金币
【等级41】18% 回帖知识+1▕▏升级≥2501金币
【等级42】26% 回帖金币+2▕▏升级≥2615金币
【等级43】23% 回帖金币+1▕▏升级≥2748金币
【等级44】55% 回帖咒术+1▕▏升级≥2750金币
【等级45】10% 回帖血液-1▕▏升级≥2866金币
【等级46】7% 回帖金币+1▕▏升级≥2903金币
【等级47】2% 发帖灵魂+1▕▏升级≥2904金币
【等级48】15% 回帖金币+2▕▏升级≥2962金币
【等级49】30% 回帖金币+3 血液+1▕▏升级≥3000金币
【 Max 】无属性`,
      木柴堆: `木柴堆
【勋章类型】资产
【入手条件】旅程≥18
【商店售价】90金币
【等级1】1% 回帖金币+1▕▏升级条件：消耗5血液
【等级2】5% 回帖金币+1▕▏升级条件：消耗150金币
【等级3】1% 无属性▕▏升级条件：消耗30血液
【 Max 】10% 回帖金币+1、发帖金币+3 旅程+1`,
      神秘的邀请函: `神秘的邀请函
【勋章类型】资产
【入手条件】主题≥3 在线时间＞12小时
【商店售价】100金币
【等级1】1% 回帖金币+1、发帖金币+1▕▏升级条件：消耗80血液
【等级2】1% 回帖血液+1、发帖血液+1▕▏升级条件：消耗80金币
【等级3】5% 回帖血液-1▕▏升级条件：追随≥30
【等级4】5% 回帖金币+3 血液-1、发帖金币+3 血液-1▕▏升级条件：知识≥10
【等级5】10% 回帖血液+1 金币+1、发帖血液+2 金币+3▕▏升级条件：消耗-100金币
【 Max 】无属性`,
      诺曼底号: `诺曼底号
【勋章类型】资产
【入手条件】无
【商店售价】8700金币
【等级1】无属性▕▏升级条件：金币≥100
【等级2】50% 发帖血液+7▕▏升级条件：金币≥1000
【等级3】50% 发帖血液+7 旅程+1▕▏升级条件：金币≥5000
【等级4】50% 发帖血液+7 旅程+1 咒术+3▕▏升级条件：金币≥10000
【等级5】50% 发帖血液+7 旅程+1 咒术+3 知识+1▕▏升级条件：金币≥20000
【 Max 】无属性`,
      德拉克魂匣: `德拉克魂匣
【勋章类型】资产
【入手条件】知识≥10
【商店售价】350血液
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：知识≥60（猜测）
【等级2】8% 回帖血液+1、发帖血液+2▕▏升级条件：知识≥120
【等级3】14% 回帖血液+1、发帖血液+2 咒术+1  ▕▏升级条件：知识≥180
【 Max 】20% 回帖血液+2、发帖血液+3 咒术+1`,
      圣甲虫秘典: `圣甲虫秘典
【勋章类型】资产
【入手条件】知识≥10
【商店售价】350金币
【等级1】5% 回帖金币+1、发帖金币+1▕▏升级条件：消耗50咒术
【等级2】10% 回帖金币+1、发帖金币+2▕▏升级条件：知识≥100
【等级3】15% 回帖金币+2、发帖金币+3▕▏升级条件：知识≥200
【 Max 】20% 回帖金币+3、发帖金币+4`,
      '生化危机：复仇': `生化危机：复仇
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】1% 回帖金币+1 血液+1 `,
      五花八门版块: `五花八门版块
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖咒术+1`,
      奥兹大陆: `奥兹大陆
【勋章类型】板块
【入手条件】旅程＞25 在线时间＞255小时
【商店售价】100金币
【 Max 】2% 回帖咒术+1、发帖咒术+1`,
      '龙腾世纪：审判': `龙腾世纪：审判
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】1% 回帖旅程+1`,
      质量效应三部曲: `质量效应三部曲
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖血液+2`,
      '辐射:新维加斯': `辐射:新维加斯
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖堕落+1`,
      TRPG纪念章: `TRPG纪念章
【勋章类型】奖品
【入手条件】完成TRPG版块内的跑团任务
【商店售价】无
【等级1】无属性▕▏升级条件:-100金币
【 Max 】2% 回帖金币+1 血液+1`,
      '上古卷轴V:天际': `上古卷轴V:天际
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖金币+2`,
      堕落飨宴: `堕落飨宴
【勋章类型】板块
【入手条件】旅程≥20 在线时间≥100小时 发帖数≥100 主题≥10
【商店售价】9999金币
【等级1】无属性▕▏升级条件：堕落-10
【等级2】无属性▕▏升级条件：血液-500
【等级3】无属性▕▏升级条件：堕落-20
【等级4】无属性▕▏升级条件：咒术-200
【等级5】无属性▕▏升级条件：堕落-30
【等级6】无属性▕▏升级条件：旅程-30
【等级7】无属性▕▏升级条件：堕落-40
【等级8】无属性▕▏升级条件：知识-20
【等级9】无属性▕▏升级条件：堕落-50
【等级10】无属性▕▏升级条件：金币-500
【等级11】无属性▕▏升级条件：堕落-60
【等级12】无属性▕▏升级条件：血液-1500
【等级13】无属性▕▏升级条件：堕落-70
【等级14】无属性▕▏升级条件：咒术-300
【等级15】无属性▕▏升级条件：堕落-80
【等级16】无属性▕▏升级条件：旅程-50
【等级17】无属性▕▏升级条件：堕落-90
【等级18】无属性▕▏升级条件：知识-30
【等级19】无属性▕▏升级条件：堕落-100
【等级20】无属性▕▏升级条件：金币-2500
【等级21】1% 回帖金币+5 血液+5 堕落+5、发帖灵魂+1 咒术+10▕▏升级条件：堕落-200
【等级22】1% 回帖金币+5 血液+5 堕落+5、发帖灵魂+1 咒术+10▕▏升级条件：灵魂-2
【 Max 】1% 回帖金币+5 血液+5 堕落+5、发帖灵魂+1 咒术+10`,
      模擬人生4: `模擬人生4
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖金币+1`,
      达拉然: `达拉然
【勋章类型】板块
【入手条件】旅程≥25 知识≥25
【商店售价】100金币
【 Max 】2% 回帖知识+1`,
      艾尔登法环: `艾尔登法环
【【勋章类型】板块
【入手条件】无
【商店售价】100金币
【等级Max】1% 回帖旅程+1`,
      牧羊人: `牧羊人
【勋章类型】天赋
【入手条件】发帖数>=100
【商店售价】无
【等级1】5% 发帖旅程+1▕▏升级条件：发帖数>250
【等级2】8% 发帖旅程+1▕▏升级条件：发帖数>500
【 Max 】10% 发帖旅程+1`,
      森林羊男: `森林羊男
【勋章类型】天赋
【入手条件】注册天数>45 并且 在线时间(小时)>200 井且 血液>150井且 旅程>50
【商店售价】无
【 Max 】5% 回帖知识+1、发帖知识+1`,
      堕落之舞: `堕落之舞
【勋章类型】天赋
【入手条件】堕落>40
【商店售价】无
【 Max 】35% 发帖金币+3`,
      黄色就是俏皮: `黄色就是俏皮
【勋章类型】天赋
【入手条件】堕落>20 幷且 血液>60 并且主题数 >= 6
【商店售价】无
【等级1】3% 回帖血液+1、发帖血液+1▕▏升级条件：50主题数
【 Max 】10% 回帖血液+1、发帖血液+1`,
      骑兽之子: `骑兽之子
【勋章类型】天赋
【入手条件】旅程 >= 120 井且 灵魂 >=1
【商店售价】无
【等级1】20% 回帖血液+1、发帖血液+3 咒术+1▕▏升级条件：灵魂 ≥3
【 Max 】50% 回帖血液+1、发帖血液+3 咒术+1`,
      禽兽扒手: `禽兽扒手
【勋章类型】天赋
【入手条件】追随 >= 35 幷且 旅程 >= 45 并且 知识 >= 15
【商店售价】无
【等级1】10% 回帖血液-1 咒术+1▕▏升级条件：101在线时间
【等级2】30% 回帖血液-1 咒术+1▕▏升级条件：110在线时间
【等级3】10% 回帖血液-1 咒术+1▕▏升级条件：201在线时间
【等级4】30% 回帖血液-1 咒术+1▕▏升级条件：210在线时间
【等级5】10% 回帖血液-1 咒术+1▕▏升级条件：301在线时间
【等级6】30% 回帖血液-1 咒术+1▕▏升级条件：310在线时间
【等级7】10% 回帖血液-1 咒术+1▕▏升级条件：401在线时间
【等级8】30% 回帖血液-1 咒术+1▕▏升级条件：410在线时间
【等级9】10% 回帖血液-1 咒术+1▕▏升级条件：501在线时间
【等级10】30% 回帖血液-1 咒术+1▕▏升级条件：510在线时间
【等级11】10% 回帖血液-1 咒术+1▕▏升级条件：601在线时间
【等级12】30% 回帖血液-1 咒术+1▕▏升级条件：610在线时间
【等级13】10% 回帖血液-1 咒术+1▕▏升级条件：701在线时间
【等级14】10% 回帖血液-1 咒术+1▕▏升级条件：710在线时间
【等级15】10% 回帖血液-1 咒术+1▕▏升级条件：801在线时间
【等级16】30% 回帖血液-1 咒术+1▕▏升级条件：810在线时间
【等级17】10% 回帖血液-1 咒术+1▕▏升级条件：901在线时间
【等级18】30% 回帖血液-1 咒术+1▕▏升级条件：910在线时间
【等级19】10% 回帖血液-1 咒术+1▕▏升级条件：1001在线时间
【等级20】30% 回帖血液-1 咒术+1▕▏升级条件：1100在线时间
【等级21】10% 回帖血液-1 咒术+1▕▏升级条件：2001在线时间
【等级22】30% 回帖血液-1 咒术+1▕▏升级条件：2100在线时间
【等级23】10% 回帖血液-1 咒术+1▕▏升级条件：3001在线时间
【 Max 】35% 回帖血液-1 咒术+1`,
      野兽之子: `野兽之子
【勋章类型】天赋
【入手条件】在线时间(小时) >= 200 井且 旅程 >= 20 井且 知识 >= 20 并且追随>= 20
【商店售价】无
【等级1】无属性▕▏升级条件：金币≥200
【等级2】3% 回帖知识+1 血液-1▕▏升级条件：金币≥400
【等级3】5% 回帖知识+1 血液-1▕▏升级条件：金币≥600
【等级4】7% 回帖知识+1 血液-1▕▏升级条件：金币≥800
【 Max 】9% 回帖知识+1 血液-1`,
      结晶卵: `结晶卵
【勋章类型】宠物
【入手条件】知识≥15
【商店售价】280金币
【等级1】2% 发帖知识+1▕▏升级条件：咒术≥40
【等级2】4% 回帖咒术+1、发帖知识+1▕▏升级条件：咒术≥80
【 Max 】8% 回帖咒术+2、发帖知识+1 咒术+2`,
      暮色卵: `暮色卵
【勋章类型】宠物
【入手条件】旅程≥15
【商店售价】260金币
【等级1】4% 回帖堕落+1▕▏升级条件：堕落≥80
【等级2】7% 回帖堕落+1、发帖血液+2▕▏升级条件：堕落≥150
【 Max 】15% 回帖堕落+1 血液+1、发帖血液+3`,
      青鸾蛋: `青鸾蛋
【勋章类型】宠物
【入手条件】旅程≥29
【商店售价】220金币
【等级1】6% 回帖金币+1▕▏升级条件：主题数≥20
【 Max 】12% 回帖血液+1 金币+1、发帖旅程+1`,
      电磁卵: `电磁卵
【勋章类型】宠物
【入手条件】咒术≥30
【商店售价】240金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗11咒术
【等级2】7% 回帖金币+2▕▏升级条件：消耗22咒术
【等级3】10% 回帖金币+2▕▏升级条件：消耗33咒术
【 Max 】15% 回帖金币+2`,
      珊瑚色礁石蛋: `珊瑚色礁石蛋
【勋章类型】宠物
【入手条件】发帖数≥150
【商店售价】260金币
【等级1】4% 回帖咒术+1 血液+1、发帖咒术+2▕▏升级条件：消耗188金币
【 Max 】8% 回帖咒术+1 血液+2、发帖咒术+2`,
      月影蛋: `月影蛋
【勋章类型】宠物
【入手条件】血液≥303
【商店售价】310金币
【等级1】5% 回帖血液+2、发帖咒术+1▕▏升级条件：消耗30咒术
【等级2】10% 回帖血液+2、发帖咒术+1▕▏升级条件：血液≥388
【 Max 】15% 回帖血液+2、发帖咒术+1`,
      马戏团灰蛋: `马戏团灰蛋
【勋章类型】宠物
【入手条件】旅程≥25
【商店售价】270金币
【等级1】5% 回帖金币+1、发帖堕落+1▕▏升级条件：消耗180血液
【等级2】10% 回帖金币+2、发帖堕落+1▕▏升级条件：消耗150金币
【 Max 】12% 回帖血液+2、发帖旅程+1`,
      郁苍卵: `郁苍卵
【勋章类型】宠物
【入手条件】旅程≥35
【商店售价】350金币
【等级1】5% 回帖血液+2▕▏升级条件：消耗369金币
【 Max 】15% 回帖血液+2、发帖血液+3`,
      熔岩蛋: `熔岩蛋
【勋章类型】宠物
【入手条件】旅程≥35
【商店售价】350金币
【等级1】5% 回帖金币+2▕▏升级条件：消耗369血液
【 Max 】15% 回帖金币+2、发帖金币+3`,
      灵鹫蛋: `灵鹫蛋
【勋章类型】宠物
【入手条件】堕落≤19
【商店售价】310金币
【等级1】3% 回帖血液+1、发帖知识+1▕▏升级条件：主题≥10
【等级2】6% 回帖血液+1、发帖知识+1▕▏升级条件：消耗210金币
【等级3】10% 回帖血液+2 堕落-1、发帖知识+1▕▏升级条件：主题≥50
【 Max 】15% 回帖血液+2 堕落-1、发帖知识+1`,
      血鹫蛋: `血鹫蛋
【勋章类型】宠物
【入手条件】堕落≥25
【商店售价】310金币
【等级1】3% 回帖金币+1、发帖旅程+1▕▏升级条件：咒术≥50
【等级2】6% 回帖金币+1、发帖旅程+1▕▏升级条件：消耗210血液
【等级3】10% 回帖金币+2 堕落+1、发帖旅程+1▕▏升级条件：咒术≥150
【 Max 】15% 回帖金币+2 堕落+1、发帖旅程+1`,
      软泥怪蛋: `软泥怪蛋
【勋章类型】宠物
【入手条件】主题≥30
【商店售价】150金币
【等级1】4% 回帖血液+2▕▏升级条件：消耗220金币
【 Max 】4% 回帖血液+1 旅程+1`,
      螺旋纹卵: `螺旋纹卵
【勋章类型】宠物
【入手条件】旅程≥33
【商店售价】270金币
【等级1】5% 回帖堕落+1 金币+1▕▏升级条件：消耗188血液
【 Max 】11% 回帖堕落+1 金币+1`,
      万圣彩蛋: `万圣彩蛋
【勋章类型】宠物
【入手条件】追随≥35
【商店售价】310金币
【等级1】6% 回帖金币+2、发帖金币+2▕▏升级条件：消耗33咒术
【 Max 】12% 回帖金币+2、发帖金币+2`,
      幽光彩蛋: `幽光彩蛋
【勋章类型】宠物
【入手条件】知识≥22
【商店售价】300金币
【等级1】5% 回帖血液+1、发帖咒术+1▕▏升级条件：消耗25咒术
【等级2】8% 回帖血液+2、发帖咒术+1▕▏升级条件：旅程≥77
【 Max 】14% 回帖血液+2、发帖咒术+1`,
      沙漠羽蛋: `沙漠羽蛋
【勋章类型】宠物
【入手条件】旅程≥25
【商店售价】250金币
【等级1】5% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗173金币
【 Max 】10% 回帖血液+2、发帖旅程+1`,
      林中之蛋: `林中之蛋
【勋章类型】宠物
【入手条件】旅程≥35
【商店售价】275金币
【等级1】6% 回帖金币+1 血液+1▕▏升级条件：消耗213血液
【 Max 】12% 回帖金币+1 血液+1`,
      五彩斑斓的蛋: `五彩斑斓的蛋
【勋章类型】宠物
【入手条件】堕落≤100 旅程≥50
【商店售价】220金币
【等级1】2% 回帖血液+1▕▏升级条件：消耗100血液
【等级2】5% 回帖咒术+1 血液-1▕▏升级条件：消耗50咒术
【 Max 】8% 回帖咒术+2 堕落-1`,
      血红色的蛋: `血红色的蛋
【勋章类型】宠物
【入手条件】堕落≥60
【商店售价】290金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗75血液
【等级2】10% 回帖金币+1 堕落+1▕▏升级条件：消耗100血液
【 Max 】15% 回帖金币+1 堕落+1`,
      海边的蛋: `海边的蛋
【勋章类型】宠物
【入手条件】在线时间≥300小时
【商店售价】288金币
【等级1】10% 回帖金币+1▕▏升级条件：消耗100金币
【 Max 】20% 回帖金币+1、发帖金币+3`,
      新手蛋: `新手蛋
【勋章类型】宠物
【入手条件】发帖数＞＝50 主题数＞＝ 2
【商店售价】120金币
【等级1】10% 回帖金币+1▕▏升级条件：发帖数≥150
【等级2】20% 回帖金币+1▕▏升级条件：发帖数≥300
【等级3】30% 回帖金币+1▕▏升级条件：发帖数≥500
【 Max 】5% 回帖金币+1`,
      深渊遗物: `深渊遗物
【勋章类型】奖品
【入手条件】【星尘月陨】活动奖励
【等级1】1% 回帖血液+1▕▏升级条件：消耗50血液
【等级2】1% 回帖血液+2▕▏升级条件：消耗10咒术
【 Max 】1% 回帖血液+3`,
      '【限定】深渊遗物': `【限定】深渊遗物
【勋章类型】宠物
【入手条件】【星尘月陨】活动奖励
【等级1】1% 回帖血液+3▕▏升级条件：消耗-1旅程
【 Max 】10% 回帖血液+3、发帖旅程+1`,
      小阿尔的蛋: `小阿尔的蛋
【勋章类型】宠物
【入手条件】在线时间≥200小时
【商店售价】388金币
【等级1】5% 回帖血液+1、发帖金币+2▕▏升级条件：消耗150金币
【等级2】8% 回帖血液+1、发帖金币+2▕▏升级条件：消耗200血液
【等级3】10% 回帖血液+2、发帖金币+2▕▏升级条件：在线时间≥1000小时
【 Max 】15% 回帖血液+2、发帖金币+3`,
      红石: `红石
【勋章类型】资产
【入手条件】血液≥30
【商店售价】177金币
【等级1】4% 回帖血液+1、发帖血液+1▕▏升级条件：血液≥233
【 Max 】8% 回帖血液+2、发帖旅程+1`,
      幽灵竹筒: `幽灵竹筒
【勋章类型】资产
【入手条件】在线时间≥20小时
【商店售价】280金币
【等级1】4% 回帖血液+1、发帖血液+1▕▏升级条件：在线时间≥100小时
【等级2】8% 回帖血液+2、发帖血液+1▕▏升级条件：在线时间≥300小时
【 Max 】4% 回帖旅程+1 血液+1、发帖旅程+1 血液+1`,
      神秘的红茶: `神秘的红茶
【勋章类型】资产
【入手条件】无
【商店售价】77金币
【等级1】3% 回帖血液+1、发帖血液+1▕▏升级条件：消耗30血液
【等级2】7% 回帖血液+1▕▏升级条件：堕落≥33
【 Max 】7% 回帖血液+1 堕落+1`,
      种植土豆: `种植土豆
【勋章类型】资产
【入手条件】无
【商店售价】140金币
【等级1】2% 回帖血液+1▕▏升级条件：消耗25血液
【等级2】4% 回帖血液+1▕▏升级条件：知识≥5
【等级3】6% 回帖血液+1▕▏升级条件：消耗35血液
【等级4】8% 回帖血液+1▕▏升级条件：知识≥15
【等级5】10% 回帖血液+1、发帖血液+2▕▏升级条件：消耗-88金币
【 Max 】3% 回帖血液+1`,
      用过的粪桶: `用过的粪桶
【勋章类型】资产
【入手条件】旅程≥10
【商店售价】111金币
【等级1】3% 回帖血液-2 金币+2▕▏升级条件：消耗30血液
【 Max 】6% 回帖血液-1 金币+2`,
      箭术卷轴: `箭术卷轴
【勋章类型】资产
【入手条件】无
【商店售价】70金币
【 Max 】4% 回帖血液+1、发帖血液+1`,
      '【圣诞限定】心心念念小雪人': `【圣诞限定】心心念念小雪人
【勋章类型】资产
【入手条件】无
【商店售价】666金币
【 Max 】1% 发帖旅程+1 金币+5 血液+5 咒术+3 知识+1 灵魂+1`,
      心心念念小雪人: `心心念念小雪人
【勋章类型】资产
【入手条件】无
【商店售价】666金币
【 Max 】1% 发帖旅程+1 金币+5 血液+5 咒术+3 知识+1 灵魂+1`,
      魔法石碑: `魔法石碑
【勋章类型】资产
【入手条件】无
【商店售价】130金币
【 Max 】7% 回帖血液+1，发帖咒术+1`,
      远古石碑: `远古石碑
【勋章类型】资产
【入手条件】无
【商店售价】140金币
【 Max 】7% 回帖金币+1，发帖咒术+1`,
      冒险用面包: `冒险用面包
【勋章类型】资产
【入手条件】无
【商店售价】150金币
【等级1】6% 回帖血液+1▕▏升级条件：旅程≥18
【等级2】6% 回帖血液+2▕▏升级条件：消耗-25血液
【 Max 】2% 回帖血液+2`,
      海螺号角: `海螺号角
【勋章类型】资产
【入手条件】旅程≥15
【商店售价】277金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗177血液
【等级2】10% 回帖金币+1▕▏升级条件：旅程≥77
【 Max 】10% 回帖金币+1、发帖旅程+1 金币+3`,
      沙漠神灯: `沙漠神灯
【勋章类型】资产
【入手条件】知识≥20
【商店售价】250金币
【等级1】2% 回帖咒术+1▕▏升级条件：消耗25咒术
【等级2】3% 回帖咒术+1、发帖知识+1▕▏升级条件：金币≥433
【 Max 】3% 回帖咒术+1 知识+1、发帖咒术+1 知识+1`,
      冒险用指南针: `冒险用指南针
【勋章类型】资产
【入手条件】无
【商店售价】150金币
【 Max 】3% 回帖旅程+1`,
      暖心小火柴: `暖心小火柴
【勋章类型】资产
【入手条件】旅程≥15
【商店售价】333金币
【等级1】勋章博物馆资料暂缺
【等级2】11% 回帖金币+1 血液-1、发帖金币+2▕▏升级条件：消耗33血液
【等级3】11% 回帖金币-1 血液+1、发帖血液+2▕▏升级条件：消耗33血液
【 Max 】11% 回帖金币+1 血液+1、发帖血液+1 金币+1`,
      神秘的漂流瓶: `神秘的漂流瓶
【勋章类型】资产
【入手条件】旅程≥66
【商店售价】500金币
【等级1】无属性▕▏升级条件：消耗1旅程
【等级2】无属性▕▏升级条件：消耗1旅程
【等级3】无属性▕▏升级条件：消耗1旅程
【等级4】无属性▕▏升级条件：消耗1旅程
【等级5】无属性▕▏升级条件：消耗1旅程
【等级6】无属性▕▏升级条件：消耗1旅程
【等级7】无属性▕▏升级条件：消耗1旅程
【等级8】无属性▕▏升级条件：消耗1旅程
【等级9】无属性▕▏升级条件：消耗1旅程
【等级10】无属性▕▏升级条件：消耗-9旅程
【 Max 】12% 发帖旅程+1 知识+1`,
      冒险用绷带: `冒险用绷带
【勋章类型】资产
【入手条件】无
【商店售价】211金币
【等级1】10% 回帖血液+1▕▏升级条件：消耗-10血液
【等级2】8% 回帖血液+1▕▏升级条件：消耗-15血液
【等级3】6% 回帖血液+1▕▏升级条件：消耗-20血液
【 Max 】4% 回帖血液+2`,
      宝箱内的球: `宝箱内的球
【勋章类型】资产
【入手条件】旅程≥15
【商店售价】350金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗100金币
【等级2】6% 回帖金币+1、发帖金币+1▕▏升级条件：消耗150血液
【等级3】2% 回帖旅程+1 金币-1、发帖金币+2▕▏升级条件：知识≥60
【等级4】10% 回帖金币+2 血液-1、发帖金币+3▕▏升级条件：旅程≥77
【 Max 】12% 回帖金币+3 血液-1、发帖金币+3`,
      'SCP-s-1889': `SCP-s-1889
【勋章类型】资产
【入手条件】旅程≥20
【商店售价】450金币
【等级1】无属性▕▏升级条件：消耗1旅程
【等级2】无属性▕▏升级条件：消耗1旅程
【等级3】无属性▕▏升级条件：消耗1旅程
【等级4】无属性▕▏升级条件：消耗1旅程
【等级5】无属性▕▏升级条件：消耗1旅程
【等级6】无属性▕▏升级条件：消耗-5旅程
【 Max 】3% 回帖知识+1 血液+2`,
      GHOST: `GHOST
【勋章类型】资产
【入手条件】堕落≥10
【商店售价】200金币
【等级1】1% 回帖血液-1 金币+1、发帖血液-1 金币+1▕▏升级条件：消耗10血液
【等级2】2% 回帖血液-1 金币+1、发帖血液-1 金币+1▕▏升级条件：消耗10血液
【等级3】3% 回帖血液-1 金币+1、发帖血液-1 金币+1▕▏升级条件：消耗10血液
【等级4】4% 回帖血液-1 金币+2、发帖血液-1 金币+2▕▏升级条件：消耗10血液
【等级5】5% 回帖血液-1 金币+2、发帖血液-1 金币+2▕▏升级条件：消耗10血液
【等级6】6% 回帖血液-1 金币+2、发帖血液-1 金币+2▕▏升级条件：消耗10血液
【 Max 】7% 回帖血液-1 金币+3、发帖血液-1 金币+3`,
      GM論壇初心者勛章: `GM論壇初心者勛章
【勋章类型】资产
【入手条件】无
【商店售价】100金币
【等级1】15% 回帖金币+1 血液+1、发帖金币+3 血液+3▕▏升级条件：在线时间≥72
【等级2】12% 回帖金币+1 血液+1、发帖金币+3 血液+3▕▏升级条件：在线时间≥150
【等级3】8% 回帖金币+1 血液+1、发帖金币+3 血液+3▕▏升级条件：在线时间≥280
【等级4】5% 回帖金币+1 血液+1、发帖金币+3 血液+3▕▏升级条件：在线时间≥560
【 Max 】2% 回帖金币+1 血液+1、发帖金币+5 血液+5`,
      社畜专用闹钟: `社畜专用闹钟
【勋章类型】资产
【入手条件】无
【商店售价】150金币
【等级1】20% 回帖金币+1 血液-1▕▏升级条件：金币＞996
【 Max 】20% 回帖金币-1 血液+1`,
      冒险用宝箱: `冒险用宝箱
【勋章类型】资产
【入手条件】无
【商店售价】200金币
【等级1】5% 回帖血液+1▕▏升级条件：旅程≥25
【等级2】5% 回帖血液+1、发帖旅程+1▕▏升级条件：消耗15咒术
【 Max 】10% 回帖血液+1、发帖知识+1`,
      羽毛笔: `羽毛笔
【勋章类型】资产
【入手条件】知识≥5
【商店售价】280金币
【等级1】1% 回帖旅程+1 血液+1▕▏升级条件：消耗33血液
【等级2】2% 回帖旅程+1 血液+1▕▏升级条件：消耗66血液
【等级3】3% 回帖旅程+1 血液+1▕▏升级条件：消耗99血液
【 Max 】4% 回帖旅程+1 血液+1`,
      超级无敌名贵金卡: `超级无敌名贵金卡
【勋章类型】资产
【入手条件】无
【商店售价】688金币
【 Max 】100% 回帖金币+0`,
      'One Ring': `One Ring
【勋章类型】资产
【入手条件】旅程≥25
【商店售价】500金币
【等级1】无属性▕▏升级条件：消耗200金币
【等级2】无属性▕▏升级条件：消耗-1堕落
【等级3】无属性▕▏升级条件：消耗-1堕落
【等级4】无属性▕▏升级条件：消耗-1堕落
【等级5】无属性▕▏升级条件：消耗-1堕落
【等级6】无属性▕▏升级条件：消耗-1堕落
【等级7】无属性▕▏升级条件：消耗-1堕落
【等级8】无属性▕▏升级条件：消耗-1堕落
【等级9】无属性▕▏升级条件：消耗-1堕落
【等级10】无属性▕▏升级条件：消耗-1堕落
【等级11】无属性▕▏升级条件：消耗10堕落
【 Max 】50% 发帖血液+1 堕落-1`,
      秘密空瓶: `秘密空瓶
【勋章类型】资产
【入手条件】追随≥42
【商店售价】666金币
【等级1】15% 回帖血液+1▕▏升级条件：消耗1灵魂
【等级2】100% 发帖血液+2▕▏升级条件：灵魂≥1
【 Max 】100% 发帖金币+2 血液+1`,
      梦中的列车: `梦中的列车
【勋章类型】资产
【入手条件】旅程≥25
【商店售价】350金币
【等级1】无属性▕▏升级条件：消耗1旅程
【等级2】无属性▕▏升级条件：消耗1旅程
【等级3】无属性▕▏升级条件：消耗1旅程
【等级4】无属性▕▏升级条件：消耗1旅程
【等级5】无属性▕▏升级条件：消耗1旅程
【等级6】无属性▕▏升级条件：消耗1旅程
【等级7】无属性▕▏升级条件：消耗1旅程
【等级8】无属性▕▏升级条件：消耗1旅程
【等级9】无属性▕▏升级条件：消耗1旅程
【等级10】无属性▕▏升级条件：消耗1旅程
【等级11】无属性▕▏升级条件：消耗-10旅程
【 Max 】3% 回帖知识+1、发帖知识+1`,
      冒险专用绳索: `冒险专用绳索
【勋章类型】装备
【入手条件】堕落＞10
【商店售价】220金币
【等级1】4% 回帖堕落+1▕▏升级条件：堕落≥66
【 Max 】8% 回帖堕落+1 金币+1`,
      '赫尔墨斯·看守者之杖': `赫尔墨斯·看守者之杖
【勋章类型】装备
【入手条件】知识≥8
【商店售价】288金币
【等级1】3% 回帖血液+1▕▏升级条件：消耗200血液
【等级2】1% 回帖知识+1、发帖知识+1▕▏升级条件：知识≥20
【等级3】8% 回帖知识+1 堕落+2、发帖知识+1 堕落+2▕▏升级条件：堕落≥30
【等级4】6% 回帖知识+1 堕落+1、发帖知识+1 堕落+1▕▏升级条件：堕落≥60
【等级5】4% 回帖知识+1 堕落+1、发帖知识+1 堕落+1▕▏升级条件：堕落≥90
【 Max 】2% 回帖知识+1 血液-1、发帖知识+1 血液-1`,
      巴啦啦小魔仙棒: `巴啦啦小魔仙棒
【勋章类型】装备
【入手条件】无
【商店售价】130金币
【等级1】3% 回帖知识+1▕▏升级条件：知识≥13
【等级2】6% 回帖咒术+1▕▏升级条件：消耗39咒术
【 Max 】9% 回帖咒术+1、发帖咒术+1`,
      十字军护盾: `十字军护盾
【勋章类型】装备
【入手条件】无
【商店售价】190金币
【 Max 】8% 回帖金币+1、发帖金币+1`,
      龙血之斧: `龙血之斧
【勋章类型】装备
【入手条件】无
【商店售价】210金币
【 Max 】15% 发帖血液+3`,
      蔷薇骑士之刃: `蔷薇骑士之刃
【勋章类型】装备
【入手条件】追随≥10
【商店售价】320金币
【等级1】4% 回帖金币+1 血液+1、发帖知识+1▕▏升级条件：追随≥87
【 Max 】8% 回帖金币+1 血液+1、发帖知识+1`,
      狩猎用小刀: `狩猎用小刀
【勋章类型】装备
【入手条件】知识≥10
【商店售价】230金币
【等级1】4% 回帖堕落+1▕▏升级条件：消耗100血液
【等级2】8% 回帖血液+2▕▏升级条件：消耗-5堕落
【等级3】8% 回帖金币+2▕▏升级条件：消耗-5堕落
【 Max 】4% 回帖堕落+1、发帖旅程+1`,
      钢铁勇士弯刀: `钢铁勇士弯刀
【勋章类型】装备
【入手条件】无
【商店售价】140金币
【 Max 】4% 回帖金币+1 堕落-1`,
      海盗弯钩: `海盗弯钩
【勋章类型】装备
【入手条件】无
【商店售价】130金币
【 Max 】4% 回帖血液+1 堕落+1`,
      生锈的海盗刀枪: `生锈的海盗刀枪
【勋章类型】装备
【入手条件】堕落≥15
【商店售价】310金币
【等级1】5% 回帖堕落+1、发帖金币+3▕▏升级条件：旅程≥60
【等级2】10% 回帖堕落+1、发帖金币+3▕▏升级条件：消耗180金币
【 Max 】15% 回帖堕落+1、发帖金币+3`,
      日荒戒指: `日荒戒指
【勋章类型】装备
【入手条件】无
【商店售价】300金币
【等级1】5% 回帖金币+1、发帖金币+1▕▏升级条件：消耗88金币
【 Max 】10% 回帖金币+1、发帖金币+2`,
      月陨戒指: `月陨戒指
【勋章类型】装备
【入手条件】无
【商店售价】300金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗88血液
【 Max 】10% 回帖血液+1、发帖血液+2`,
      星芒戒指: `星芒戒指
【勋章类型】装备
【入手条件】无
【商店售价】300金币
【等级1】4% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗18咒术
【 Max 】8% 回帖咒术+1、发帖咒术+1`,
      琉璃玉坠: `琉璃玉坠
【勋章类型】装备
【入手条件】无
【商店售价】180金币
【等级1】7% 回帖金币+1▕▏升级条件：消耗88血液
【 Max 】7% 回帖血液+1 金币+1`,
      武士之魂: `武士之魂
【勋章类型】装备
【入手条件】知识≥30
【商店售价】999金币
【等级1】10% 回帖血液+1、发帖血液+2▕▏升级条件：知识≥50
【等级2】12% 回帖血液+2、发帖血液+3▕▏升级条件：消耗130血液
【等级3】15% 回帖血液+2 金币+1、发帖旅程+1▕▏升级条件：消耗1灵魂
【 Max 】2% 回帖金币+1 血液+3 旅程+1 知识+1 、发帖灵魂+1`,
      力量腕带: `力量腕带
【勋章类型】装备
【入手条件】无
【商店售价】125金币
【 Max 】8% 回帖金币+1`,
      物理学圣剑: `物理学圣剑
【勋章类型】装备
【入手条件】无
【商店售价】188金币
【 Max 】6% 回帖血液+1、发帖知识+1`,
      男用贞操带: `男用贞操带
【勋章类型】装备
【入手条件】无
【商店售价】180金币
【 Max 】3% 回帖旅程+1 堕落-1`,
      贤者头盔: `贤者头盔
【勋章类型】装备
【入手条件】知识≥1
【商店售价】200金币
【等级1】8% 回帖金币-1 咒术+1、发帖金币+1▕▏升级条件：消耗100血液
【等级2】10% 回帖血液-1 咒术+1、发帖咒术+1▕▏升级条件：消耗100金币
【 Max 】8% 回帖咒术+1、发帖知识+1`,
      恩惠护符: `恩惠护符
【勋章类型】装备
【入手条件】旅程≥10
【商店售价】250金币
【等级1】3% 回帖金币+1、发帖金币+1▕▏升级条件：消耗350金币
【等级2】6% 回帖金币+2，发帖金币+3▕▏升级条件：旅程≥69
【 Max 】9% 回帖金币+3、发帖金币+5`,
      超级幸运无敌辉石: `超级幸运无敌辉石
【勋章类型】装备
【入手条件】无
【商店售价】1088金币
【等级1】1% 回帖血液+5、发帖血液+5▕▏升级条件：消耗1188血液
【 Max 】1% 回帖金币+20、发帖金币+20`,
      '安杜因·乌瑞恩': `安杜因·乌瑞恩
【勋章类型】游戏男从
【入手条件】旅程≥10
【商店售价】480金币
【等级1】10% 发帖堕落-1▕▏升级条件：血液≥200
【等级2】10% 回帖堕落-1、发帖堕落-1▕▏升级条件：咒术≥40
【等级3】10% 回帖堕落-1 血液+1、发帖堕落-1 血液+1▕▏升级条件：消耗280血液
【 Max 】13% 回帖堕落-1 血液+2、发帖堕落-1 血液+3`,
      '羅素·托維': `羅素·托維
【勋章类型】真人男从
【入手条件】无
【商店售价】240金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗50血液
【等级2】5% 回帖金币+1、发帖金币+1▕▏升级条件：金币≥100
【等级3】15% 回帖金币+3、发帖金币+3▕▏升级条件：金币≥200
【等级4】10% 回帖金币+2、发帖金币+2▕▏升级条件：金币≥300
【 Max 】5% 回帖金币+1 血液+1、发帖金币+1 血液+1`,
      '蓝礼·拜拉席恩': `蓝礼·拜拉席恩
【勋章类型】真人男从
【入手条件】堕落≤35
【商店售价】520金币
【等级1】5% 回帖金币+1、发帖金币+2▕▏升级条件：主题≥5
【等级2】10% 回帖金币+1 血液+1、发帖金币+2▕▏升级条件：追随≥22
【等级3】10% 回帖金币+1 血液+1、发帖旅程+1 金币+2▕▏升级条件：金币≥520
【等级4】5% 回帖血液-1、发帖血液-1▕▏升级条件：消耗520金币
【 Max 】13% 回帖金币+1 血液+1、发帖金币+2 血液+2`,
      '阿列克西欧斯（Alexios）': `阿列克西欧斯（Alexios）
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】3% 发帖知识+1▕▏升级条件：主题≥10
【等级2】3% 回帖堕落-1 血液+1、发帖知识+1▕▏升级条件：消耗200金币
【等级3】5% 回帖堕落-1 血液+1、发帖知识+1▕▏升级条件：消耗220血液
【等级4】7% 回帖堕落-1 血液+2、发帖知识+1▕▏升级条件：消耗-3知识
【等级5】7% 发帖知识+1▕▏升级条件：知识≥50
【 Max 】10% 回帖堕落-1 血液+2、发帖堕落-1 血液+3`,
      '莱因哈特·威尔海姆': `莱因哈特·威尔海姆
【勋章类型】游戏男从
【入手条件】无
【商店售价】449金币
【等级1】勋章博物馆资料暂缺▕▏升级条件：旅程≥31
【等级2】7% 回帖血液+1、发帖旅程+1 血液+2▕▏升级条件：旅程≥61
【 Max 】10% 回帖血液+2、发帖旅程+1 血液+3`,
      '尼克斯·乌尔里克': `尼克斯·乌尔里克
【勋章类型】游戏男从
【入手条件】堕落≤39
【商店售价】520金币
【等级1】6% 回帖血液+1、发帖咒术+1▕▏升级条件：咒术≥15
【等级2】6% 回帖血液+2、发帖咒术+1▕▏升级条件：消耗333金币
【等级3】10% 回帖血液+2、发帖咒术+2▕▏升级条件：消耗333血液
【等级4】14% 回帖血液+1 堕落-1、发帖血液+1 堕落-2▕▏升级条件：血液≥1000
【等级5】18% 回帖咒术+1 血液-2、发帖咒术+3 血液-3▕▏升级条件：堕落≥13
【 Max 】10% 发帖堕落-1`,
      '乔纳森·里德': `乔纳森·里德
【勋章类型】游戏男从
【入手条件】血液≥50
【商店售价】360金币
【等级1】3% 回帖血液+1▕▏升级条件：消耗200血液
【等级2】6% 回帖血液+1▕▏升级条件：发帖数≥300
【等级3】9% 回帖血液+2▕▏升级条件：知识≥40
【等级4】12% 回帖血液+2 金币-1、发帖知识+1▕▏升级条件：消耗365血液
【 Max 】15% 回帖血液+3 金币-1、发帖知识+1`,
      藤田優馬: `藤田優馬
【勋章类型】真人男从
【入手条件】主题≥3
【商店售价】298金币
【等级1】3% 回帖金币+1、发帖金币+2▕▏升级条件：消耗129金币
【等级2】9% 回帖堕落+1 金币-1、发帖堕落+2▕▏升级条件：消耗129血液
【 Max 】9% 回帖血液+1 堕落-1、发帖血液+2`,
      莫瑞甘: `莫瑞甘
【勋章类型】女从
【入手条件】咒术≥40
【商店售价】360金币
【等级1】3% 回帖堕落+1▕▏升级条件：消耗150血液
【等级2】5% 回帖咒术+1▕▏升级条件：消耗220金币
【等级3】7% 回帖咒术+1 堕落+1 血液-1▕▏升级条件：旅程≥60
【等级4】10% 回帖咒术+1 血液-2、发帖血液-2 咒术+2▕▏升级条件：消耗200血液
【 Max 】10% 回帖咒术+1 血液-1、发帖血液-3 咒术+3`,
      迈克尔迈尔斯: `迈克尔迈尔斯
【勋章类型】真人男从
【入手条件】旅程≥10
【商店售价】450金币
【等级1】3% 回帖血液+1、发帖堕落+1▕▏升级条件：消耗200血液
【等级2】5% 回帖血液+2、发帖堕落+1 血液+1▕▏升级条件：主题≥20
【等级3】7% 回帖血液+1 堕落+1、发帖堕落+1 血液+2▕▏升级条件：堕落≥40
【 Max 】10% 回帖血液+2 堕落+1、发帖堕落+1 血液+3`,
      Doc: `Doc
【勋章类型】游戏男从
【入手条件】旅程≥10
【商店售价】500金币
【等级1】3% 回帖金币+1、发帖金币+1▕▏升级条件：旅程≥20
【等级2】5% 回帖金币+2 血液-1、发帖金币+2 血液-1▕▏升级条件：知识≥10
【等级3】8% 回帖金币+2、发帖金币+2▕▏升级条件：消耗250金币
【 Max 】10% 回帖金币+2 血液+1、发帖金币+2 知识+1`,
      '杰克·莫里森/士兵 76': `杰克·莫里森/士兵 76
【勋章类型】游戏男从
【入手条件】无
【商店售价】476金币
【等级1】3% 回帖血液+1▕▏升级条件：堕落≥30
【等级2】6% 回帖血液+1、发帖旅程+1▕▏升级条件：堕落≥76
【等级3】76% 回帖血液+3 堕落+2、发帖血液+7 金币+6 堕落+2▕▏升级条件：堕落≥77
【等级4】12% 回帖血液+2 金币-1、发帖旅程+1▕▏升级条件：消耗376血液
【 Max 】15% 回帖血液+3 金币-1、发帖旅程+1`,
      '索林·橡木盾': `索林·橡木盾
【勋章类型】真人男从
【入手条件】追随≥14
【商店售价】520金币
【等级1】5% 回帖血液+1、发帖旅程+1▕▏升级条件：旅程≥15
【等级2】7% 回帖血液+1、发帖旅程+1▕▏升级条件：消耗333血液
【等级3】10% 回帖血液+2、发帖旅程+1▕▏升级条件：旅程-1
【等级4】12% 回帖血液+2、发帖旅程+1▕▏升级条件：金币≥1314
【等级5】15% 回帖金币+1 血液-1、发帖金币+3 血液-3▕▏升级条件：消耗1314金币
【 Max 】18% 回帖血液+3、发帖血液+5`,
      陷阱杀手: `陷阱杀手
【勋章类型】游戏男从
【入手条件】堕落≥10
【商店售价】280金币
【等级1】3% 回帖血液+1、发帖血液+1▕▏升级条件：消耗134金币
【等级2】5% 回帖堕落+1、发帖堕落+1▕▏升级条件：堕落≥30
【 Max 】8% 回帖血液+2、发帖血液+2`,
      '吉姆·霍普': `吉姆·霍普
【勋章类型】真人男从
【入手条件】在线时间≥100
【商店售价】300金币
【等级1】25% 回帖血液+1▕▏升级条件：血液≥35
【等级2】6% 回帖血液+1 堕落+1▕▏升级条件：消耗100血液
【等级3】8% 回帖血液+1 堕落+1▕▏升级条件：追随≥50
【等级4】10% 回帖血液+1 堕落+1▕▏升级条件：消耗250金币
【 Max 】12% 回帖血液+2 堕落+1`,
      '沃特·沙利文': `沃特·沙利文
【勋章类型】游戏男从
【入手条件】堕落≥24
【商店售价】302金币
【等级1】2% 回帖血液+2▕▏升级条件：消耗173金币
【等级2】4% 回帖血液+2、发帖咒术+1▕▏升级条件：追随≥40
【等级3】6% 回帖咒术+1、发帖咒术+1▕▏升级条件：旅程≥60
【等级4】8% 回帖咒术+1、发帖咒术+1▕▏升级条件：知识≥60
【等级5】8% 回帖咒术+1、发帖咒术+1 血液+1▕▏升级条件：堕落≥91
【 Max 】8% 回帖咒术+1 血液+1、发帖咒术+1 血液+1`,
      '塞巴斯蒂安·斯坦': `塞巴斯蒂安·斯坦
【勋章类型】真人男从
【入手条件】无
【商店售价】450金币
【等级1】5% 回帖金币+1▕▏升级条件：追随≥50
【 Max 】8% 回帖金币+2、发帖金币+2`,
      '魯杰羅·弗雷迪': `魯杰羅·弗雷迪
【勋章类型】真人男从
【入手条件】堕落≥30
【商店售价】300金币
【等级1】1% 回帖血液+3 堕落-1、发帖血液+3 堕落-1▕▏升级条件：消耗100血液
【等级2】2% 回帖血液+3 堕落-1、发帖知识+1 堕落-1▕▏升级条件：主题≥30
【等级3】2% 回帖知识+1 血液+1 堕落-1、发帖知识+1 血液+3▕▏升级条件：主题≥60
【 Max 】3% 回帖知识+1 血液+1 堕落-1、发帖知识+1 血液+5`,
      莎伦: `莎伦
【勋章类型】女从
【入手条件】知识≥10
【商店售价】350金币
【等级1】4% 回帖血液+1▕▏升级条件：堕落≥50
【等级2】4% 回帖血液+1 咒术+1▕▏升级条件：消耗50咒术
【等级3】8% 回帖金币+2 咒术+1▕▏升级条件：咒术≥15
【 Max 】10% 回帖金币+2`,
      疾风剑豪: `疾风剑豪
【勋章类型】游戏男从
【入手条件】无
【商店售价】450金币
【等级1】3% 回帖血液+1▕▏升级条件：旅程≥20
【等级2】6% 回帖血液+1▕▏升级条件：堕落≥50
【等级3】8% 回帖血液+1、发帖旅程+1▕▏升级条件：追随≥100
【等级4】10% 回帖血液+1 金币+1、发帖旅程+1▕▏升级条件：消耗300金币
【等级5】13% 回帖血液+1 金币+1、发帖旅程+1▕▏升级条件：灵魂≥1
【 Max 】5% 回帖旅程+1`,
      '【新手友好】昆進': `【新手友好】昆進
【勋章类型】游戏男从
【入手条件】无
【商店售价】250金币
【等级1】20% 回帖金币+1 血液+1、发帖金币+3 血液+3▕▏升级条件：总积分≥20
【等级2】15% 回帖金币+1 血液+1、发帖金币+3 血液+3▕▏升级条件：总积分≥35
【等级3】10% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：总积分≥50
【 Max 】5% 回帖金币+1 血液+1、发帖金币+1 血液+1`,
      萨菲罗斯: `萨菲罗斯
【勋章类型】游戏男从
【入手条件】在线时间＞150小时
【商店售价】440金币
【等级1】4% 回帖血液+1、发帖血液+1▕▏升级条件：消耗130金币
【等级2】7% 回帖堕落+1、发帖血液+2▕▏升级条件：消耗40咒术
【等级3】8% 回帖血液+1 堕落+1、发帖血液+2 堕落+1▕▏升级条件：堕落≥100
【等级4】10% 回帖血液+1 堕落+1、发帖血液+3▕▏升级条件：堕落≥150
【等级5】12% 回帖血液+3 金币-1、发帖堕落+3▕▏升级条件：旅程≥100
【等级6】14% 回帖血液+2 堕落+1、发帖血液+3▕▏升级条件：知识≥150
【 Max 】16% 回帖血液+3 堕落+1、发帖血液+4`,
      '丹·安博尔': `丹·安博尔
【勋章类型】真人男从
【入手条件】无
【商店售价】300金币
【等级1】3% 回帖血液+1、发帖血液+2▕▏升级条件：追随≥10
【等级2】4% 回帖金币+1 血液+1、发帖金币+1 血液+2▕▏升级条件：追随≥50
【等级3】5% 回帖金币+1 血液+1、发帖金币+2 血液+2▕▏升级条件：消耗260血液
【 Max 】6% 回帖金币+1 血液+2、发帖金币+2 血液+3`,
      '汤姆·赫兰德': `汤姆·赫兰德
【勋章类型】真人男从
【入手条件】知识≥5
【商店售价】450金币
【等级1】4% 回帖血液+1▕▏升级条件：消耗50金币
【等级2】8% 回帖血液+1、发帖知识+1▕▏升级条件：知识≥20
【等级3】10% 回帖血液+1、发帖知识+1▕▏升级条件：旅程≥50
【 Max 】12% 回帖血液+1、发帖知识+1`,
      超人: `超人
【勋章类型】真人男从
【入手条件】堕落＜500
【商店售价】450金币
【等级1】4% 回帖金币+1、堕落-1、发帖血液+1▕▏升级条件：血液≥200
【等级2】6% 回帖金币+1、堕落-1、发帖血液+1▕▏升级条件：血液≥400
【等级3】8% 回帖金币+2、发帖血液+2▕▏升级条件：血液≥600
【 Max 】10% 回帖金币+3、发帖血液+3`,
      '阿尔伯特·威斯克': `阿尔伯特·威斯克
【勋章类型】游戏男从
【入手条件】知识≥10
【商店售价】400金币
【等级1】3% 回帖血液+1、发帖血液+1▕▏升级条件：消耗100金币
【等级2】5% 回帖血液+1、发帖血液+1▕▏升级条件：堕落≥30
【等级3】8% 回帖血液+1、发帖血液+2▕▏升级条件：知识≥50
【等级4】10% 回帖血液+1、发帖知识+1▕▏升级条件：知识≥100
【 Max 】13% 回帖血液+2、发帖知识+1`,
      鬼王酒吞童子: `鬼王酒吞童子
【勋章类型】游戏男从
【入手条件】在线时间≥100小时
【商店售价】300金币
【等级1】4% 回帖血液+1▕▏升级条件：消耗50金币
【等级2】勋章博物馆资料暂缺
【等级3】8% 回帖血液+1、发帖堕落+1▕▏升级条件：堕落≥50
【 Max 】10% 回帖血液+1、发帖堕落+2`,
      'Scott Ryder': `Scott Ryder
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】4% 回帖金币+2▕▏升级条件：消耗80血液
【等级2】4% 回帖金币+2、发帖旅程+1▕▏升级条件：追随≥40
【等级3】6% 回帖金币+2、发帖旅程+1▕▏升级条件：消耗120金币
【 Max 】8% 回帖金币+2、发帖旅程+1`,
      '汉克/Hank': `汉克/Hank
【勋章类型】游戏男从
【入手条件】主题≥5
【商店售价】500金币
【等级1】5% 回帖血液+1▕▏升级条件：知识≥20
【等级2】7% 回帖血液+1、发帖血液+1▕▏升级条件：追随≥40
【等级3】9% 回帖血液+1、发帖血液+2▕▏升级条件：旅程≥60
【等级4】11% 回帖血液+1、发帖血液+3▕▏升级条件：消耗500血液
【等级5】13% 回帖血液+1、发帖旅程+1▕▏升级条件：消耗500金币
【 Max 】25% 回帖血液+1、发帖旅程+1`,
      三角头: `三角头
【勋章类型】真人男从
【入手条件】主题≥20
【商店售价】450金币
【等级1】6% 回帖血液+1、发帖堕落+1▕▏升级条件：主题≥20
【等级2】8% 回帖血液+2、发帖堕落+1▕▏升级条件：堕落≥50
【 Max 】11% 回帖血液+2、发帖堕落+1 血液+2`,
      幻象: `幻象
【勋章类型】游戏男从
【入手条件】无
【商店售价】350金币
【等级1】3% 回帖金币+1、发帖金币+1▕▏升级条件：追随≥40
【等级2】6% 回帖金币+1、发帖金币+2▕▏升级条件：知识≥40
【等级3】8% 回帖金币+2、发帖金币+2▕▏升级条件：消耗200金币
【 Max 】10% 回帖金币+2、发帖金币+3`,
      金刚狼: `金刚狼
【勋章类型】真人男从
【入手条件】在线时间≥240小时
【商店售价】400金币
【等级1】5% 回帖堕落+1▕▏升级条件：堕落≥10
【等级2】5% 回帖金币+1 血液+1▕▏升级条件：金币≥500
【等级3】8% 回帖金币+1 血液+1▕▏升级条件：血液≥500
【 Max 】10% 回帖金币+1 血液+1 堕落-1`,
      克苏鲁: `克苏鲁
【勋章类型】真人男从
【入手条件】堕落≥15
【商店售价】666金币
【等级1】4% 回帖堕落+1、发帖堕落+1▕▏升级条件：堕落≥33
【等级2】6% 回帖堕落+1、发帖知识+1▕▏升级条件：消耗666血液
【等级3】8% 回帖堕落+2、发帖堕落+1 堕落+1▕▏升级条件：知识≥33
【等级4】10% 回帖堕落+1 血液+1、发帖堕落+1▕▏升级条件：消耗1灵魂
【 Max 】33% 回帖堕落+1 血液+1、发帖堕落+2 血液+2`,
      士官长: `士官长
【勋章类型】游戏男从
【入手条件】旅程≥10
【商店售价】450金币
【等级1】6% 回帖金币+1、发帖旅程+1▕▏升级条件：消耗200血液
【等级2】8% 回帖金币+2 血液-1、发帖旅程+1▕▏升级条件：旅程≥50
【 Max 】11% 回帖血液+3 金币-1、发帖旅程+1`,
      '托尼·史塔克': `托尼·史塔克
【勋章类型】真人男从
【入手条件】旅程≥20
【商店售价】650金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗50血液
【等级2】6% 回帖血液+2、发帖血液+2▕▏升级条件：消耗100金币
【等级3】7% 回帖血液+2、发帖血液+3▕▏升级条件：旅程≥40
【等级4】8% 回帖血液+2、发帖知识+1▕▏升级条件：消耗150金币
【等级5】9% 回帖血液+2、发帖知识+1▕▏升级条件：知识≥20
【等级6】10% 回帖血液+2、发帖知识+1 血液+1▕▏升级条件：消耗200金币
【等级7】11% 回帖血液+3 金币-1、发帖知识+1 血液+2▕▏升级条件：消耗200血液
【等级8】12% 回帖血液+3 金币-1、发帖知识+1 血液+3▕▏升级条件：知识≥50
【等级9】15% 发帖知识+1 血液+5▕▏升级条件：消耗999血液
【 Max 】6% 回帖知识+1 血液+3、发帖知识+1 血液+5`,
      '加勒特·霍克': `加勒特·霍克
【勋章类型】游戏男从
【入手条件】无
【商店售价】300金币
【等级1】4% 回帖金币+1、发帖金币+2▕▏升级条件：消耗150金币
【等级2】6% 回帖金币+1、发帖金币+3▕▏升级条件：消耗200血液
【等级3】8% 回帖金币+1 血液+1、发帖金币+3▕▏升级条件：追随≥100
【 Max 】10% 回帖金币+1 血液+1、发帖旅程+1 金币+3`,
      艾吉奥: `艾吉奥
【勋章类型】游戏男从
【入手条件】旅程≥15
【商店售价】500金币
【等级1】4% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：消耗200金币
【等级2】6% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：消耗200血液
【等级3】8% 回帖金币+2 血液+1、发帖金币+2 血液+1▕▏升级条件：消耗50咒术
【等级4】3% 回帖金币+1 旅程+1 血液+1、发帖金币+1 旅程+1 血液+1▕▏升级条件：知识≥50
【等级5】4% 回帖金币+2 旅程+1 血液+1、发帖金币+2 旅程+1 血液+1▕▏升级条件：知识≥120
【 Max 】4% 回帖金币+3 旅程+1 血液+1、发帖金币+3 旅程+1 血液+1`,
      'Chris Mazdzer': `Chris Mazdzer
【勋章类型】真人男从
【入手条件】主题数≥5
【商店售价】300金币
【等级1】5% 回帖血液+1▕▏升级条件：消耗150金币
【等级2】7% 回帖血液+2▕▏升级条件：消耗200金币
【 Max 】10% 回帖血液+2`,
      '索尔·奥丁森': `索尔·奥丁森
【勋章类型】真人男从
【入手条件】知识≥5
【商店售价】500金币
【等级1】2% 回帖咒术+1、发帖旅程+1▕▏升级条件：消耗88金币
【等级2】3% 回帖咒术+1 金币+1、发帖旅程+1▕▏升级条件：消耗88血液
【等级3】4% 回帖咒术+1 金币+1、发帖旅程+1▕▏升级条件：消耗120金币
【等级4】5% 回帖咒术+1 金币+2、发帖旅程+1▕▏升级条件：消耗66咒术
【等级5】6% 回帖咒术+1 金币+2、发帖旅程+1▕▏升级条件：消耗188金币
【等级6】7% 回帖咒术+1 金币+3、发帖旅程+1▕▏升级条件：旅程≥88
【 Max 】8% 回帖咒术+1 金币+3、发帖旅程+1`,
      绯红女巫: `绯红女巫
【勋章类型】女从
【入手条件】堕落≥10
【商店售价】400金币
【等级1】2% 回帖堕落+1、发帖咒术+1▕▏升级条件：消耗100血液
【等级2】4% 回帖堕落+1、发帖咒术+1▕▏升级条件：堕落≥33
【等级3】4% 回帖堕落+1 金币+1、发帖咒术+2▕▏升级条件：消耗66咒术
【等级4】6% 回帖堕落+1 金币+1、发帖咒术+2▕▏升级条件：堕落≥88
【等级5】8% 回帖堕落+1 金币+2、发帖咒术+2▕▏升级条件：知识≥88
【 Max 】10% 回帖堕落+1 金币+2、发帖咒术+2`,
      泰比里厄斯: `泰比里厄斯
【勋章类型】游戏男从
【入手条件】咒术≥35
【商店售价】555金币
【等级1】5% 回帖血液+1、发帖咒术+1▕▏升级条件：消耗355金币
【等级2】10% 回帖金币+1、发帖咒术+1▕▏升级条件：消耗255血液
【等级3】12% 回帖血液+1、发帖咒术+1▕▏升级条件：咒术≥155
【 Max 】15% 回帖血液+2、发帖旅程+1 咒术+1`,
      大古: `大古
【勋章类型】真人男从
【入手条件】主题数≥20
【商店售价】300金币
【等级1】2% 回帖金币+1 血液+1▕▏升级条件：血液≥100
【等级2】4% 回帖金币+1 血液+1▕▏升级条件：消耗100血液
【等级3】6% 回帖金币+1 血液+1▕▏升级条件：堕落≥50
【等级4】8% 回帖血液+1 堕落+1▕▏升级条件：消耗200血液
【等级5】10% 回帖金币+1 血液+1▕▏升级条件：血液≥666
【 Max 】12% 回帖金币+1 血液+1、发帖旅程+1`,
      炙热的格拉迪欧拉斯: `炙热的格拉迪欧拉斯
【勋章类型】游戏男从
【入手条件】主题数≥15
【商店售价】666金币
【等级1】25% 回帖血液+2▕▏升级条件：咒术≥66
【 Max 】50% 回帖血液+1`,
      格拉迪欧拉斯: `格拉迪欧拉斯
【勋章类型】游戏男从
【入手条件】血液≥100
【商店售价】450金币
【等级1】2% 回帖血液+1▕▏升级条件：消耗80金币
【等级2】4% 回帖血液+1▕▏升级条件：追随≥50
【等级3】8% 回帖血液+1、发帖血液+1▕▏升级条件：消耗120金币
【等级4】11% 回帖血液+2、发帖血液+2▕▏升级条件：消耗330金币
【 Max 】14% 回帖血液+2、发帖知识+1 血液+2`,
      '卡洛斯·奥利维拉': `卡洛斯·奥利维拉
【勋章类型】游戏男从
【入手条件】追随≥10
【商店售价】600金币
【等级1】4% 回帖金币+1▕▏升级条件：消耗200血液
【等级2】4% 回帖咒术+1▕▏升级条件：知识≥20
【等级3】6% 回帖金币+1 咒术+1▕▏升级条件：消耗500金币
【等级4】8% 回帖金币+1 咒术+1、发帖旅程+1▕▏升级条件：知识≥100
【 Max 】10% 回帖金币+2 咒术+1 血液-1、发帖旅程+1`,
      '巴基 (猎鹰与冬兵)': `巴基 (猎鹰与冬兵)
【勋章类型】真人男从
【入手条件】无
【商店售价】500金币
【等级1】4% 回帖血液+1、发帖血液+1▕▏升级条件：消耗100血液
【等级2】6% 回帖血液+1、发帖血液+1▕▏升级条件：消耗200血液
【等级3】8% 回帖血液+2、发帖血液+2▕▏升级条件：消耗400血液
【 Max 】12% 回帖血液+3、发帖血液+3`,
      Joker: `Joker
【勋章类型】真人男从
【入手条件】追随≥1
【商店售价】400金币
【等级1】6% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：追随≥30
【等级2】8% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：追随≥60
【等级3】10% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：追随≥90
【等级4】2% 回帖旅程+1 知识+1、发帖旅程+1 知识+1▕▏升级条件：追随≥180
【 Max 】3% 回帖旅程+1 知识+1、发帖旅程+1 知识+1`,
      'V (DMC5)': `V (DMC5)
【勋章类型】游戏男从
【入手条件】堕落≤42
【商店售价】500金币
【等级1】4% 回帖堕落-1、发帖血液+2▕▏升级条件：金币≥200
【等级2】6% 回帖堕落-1、发帖血液+2▕▏升级条件：知识≥30
【等级3】8% 回帖血液+1 堕落-1、发帖血液+2▕▏升级条件：消耗150金币
【等级4】10% 回帖血液+1 堕落-1、发帖血液+2▕▏升级条件：消耗150血液
【等级5】13% 回帖血液+1 堕落-1、发帖血液+2▕▏升级条件：消耗66咒术
【 Max 】13% 回帖血液+2 堕落-1、发帖血液+3`,
      Dante: `Dante
【勋章类型】游戏男从
【入手条件】主题数≥5
【商店售价】666金币
【等级1】4% 回帖血液+1、发帖血液+1▕▏升级条件：消耗150金币
【等级2】6% 回帖血液+1、发帖血液+1▕▏升级条件：消耗150血液
【等级3】8% 回帖血液+1、发帖血液+1▕▏升级条件：旅程≥50
【等级4】10% 回帖血液+1、发帖血液+1▕▏升级条件：消耗88咒术
【等级5】12% 回帖血液+2、发帖血液+2▕▏升级条件：血液≥666
【等级6】15% 回帖血液+2 堕落-1、发帖血液+2▕▏升级条件：血液≥999
【 Max 】13% 回帖金币+3、发帖血液+3`,
      Vergil: `Vergil
【勋章类型】游戏男从
【入手条件】咒术≥15
【商店售价】500金币
【等级1】4% 回帖血液+1、发帖血液+2▕▏升级条件：消耗150金币
【等级2】4% 回帖血液+1、发帖咒术+2▕▏升级条件：追随≥50
【等级3】5% 回帖咒术+1、发帖咒术+2▕▏升级条件：消耗150血液
【等级4】6% 回帖咒术+1、发帖咒术+2▕▏升级条件：消耗88咒术
【等级5】8% 回帖咒术+1、发帖咒术+2▕▏升级条件：咒术≥130
【 Max 】15% 回帖血液+2、发帖咒术+3`,
      '威克多尔·克鲁姆': `威克多尔·克鲁姆
【勋章类型】真人男从
【入手条件】血液≥100
【商店售价】300金币
【等级1】6% 回帖金币+1、发帖金币+1 咒术+1▕▏升级条件：消耗100金币
【等级2】8% 回帖金币+1、发帖金币+1 咒术+1▕▏升级条件：消耗150金币
【等级3】10% 回帖金币+1、发帖金币+1 咒术+1▕▏升级条件：消耗30咒术
【 Max 】10% 回帖金币+2、发帖金币+2 咒术+1`,
      '赫敏·格兰杰': `赫敏·格兰杰
【勋章类型】女从
【入手条件】发帖数≥30
【商店售价】300金币
【等级1】6% 回帖血液+1、发帖 血液+1 咒术+1▕▏升级条件：消耗100血液
【等级2】8% 回帖血液+1、发帖血液+1 咒术+1▕▏升级条件：消耗150血液
【等级3】10% 回帖血液+1、发帖血液+1 咒术+1▕▏升级条件：消耗30咒术
【 Max 】10% 回帖血液+2、发帖血液+2 咒术+1`,
      阿拉贡: `阿拉贡
【勋章类型】真人男从
【入手条件】主题数≥15
【商店售价】680金币
【等级1】10% 回帖血液+1、发帖血液+3▕▏升级条件：消耗365血液
【等级2】12% 回帖血液+1、发帖血液+3▕▏升级条件：旅程≥88
【等级3】12% 回帖血液+2、发帖旅程+1▕▏升级条件：追随≥365
【等级4】16% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗1413金币
【 Max 】18% 回帖血液+3、发帖旅程+1`,
      瑟兰迪尔: `瑟兰迪尔
【勋章类型】真人男从
【入手条件】在线时间≥99小时
【商店售价】400金币
【等级1】5% 回帖金币+1、发帖金币+3▕▏升级条件：消耗130金币
【等级2】8% 回帖金币+1、发帖金币+3▕▏升级条件：消耗130血液
【等级3】10% 回帖金币+1、发帖金币+3▕▏升级条件：知识≥40
【 Max 】10% 回帖金币+2、发帖金币+3`,
      异形: `异形
【勋章类型】真人男从
【入手条件】堕落≥20
【商店售价】580金币
【等级1】6% 回帖血液+1▕▏升级条件：堕落≥44
【等级2】8% 回帖血液+1▕▏升级条件：消耗188血液
【等级3】10% 回帖血液+2▕▏升级条件：追随≥108
【等级4】12% 回帖血液+2 金币-1▕▏升级条件：金币＞999
【 Max 】15% 回帖血液+3 金币-1、发帖旅程+1`,
      岛田源氏: `岛田源氏
【勋章类型】游戏男从
【入手条件】旅程≥20
【商店售价】600金币
【等级1】6% 回帖血液+1、发帖血液+1▕▏升级条件：消耗300血液
【等级2】8% 回帖血液+1、发帖血液+1▕▏升级条件：消耗300金币
【等级3】10% 回帖血液+1、发帖血液+2▕▏升级条件：旅程≥60
【等级4】11% 回帖血液+1、发帖血液+3▕▏升级条件：消耗300血液
【等级5】13% 回帖血液+2、发帖血液+4▕▏升级条件：知识≥130
【 Max 】15% 回帖血液+3、发帖血液+5`,
      '小天狼星·布莱克': `小天狼星·布莱克
【勋章类型】真人男从
【入手条件】堕落≤30
【商店售价】520金币
【等级1】10% 回帖血液+1、发帖血液+3▕▏升级条件：消耗123咒术
【等级2】8% 回帖血液-1 咒术+1、发帖血液-3 咒术+3▕▏升级条件：血液≥520
【 Max 】10% 回帖咒术+1、发帖知识+1`,
      甘道夫: `甘道夫
【勋章类型】真人男从
【入手条件】知识≥18
【商店售价】700金币
【等级1】8% 回帖血液+1 、发帖知识+1▕▏升级条件：旅程≥60
【等级2】10% 发帖血液+2 知识+1▕▏升级条件：灵魂≥2
【等级3】1% 发帖灵魂+1▕▏升级条件：消耗1点堕落
【等级4】12% 回帖血液+2、发帖咒术+1▕▏升级条件：消耗111咒术
【 Max 】15% 回帖血液+3、发帖咒术+2`,
      莱戈拉斯: `莱戈拉斯
【勋章类型】真人男从
【入手条件】无
【商店售价】300金币
【等级1】5% 回帖金币+1、发帖血液+1▕▏升级条件：消耗50金币
【等级2】6% 回帖金币+1、发帖血液+2▕▏升级条件：消耗50血液
【等级3】7% 回帖金币+2、发帖血液+2▕▏升级条件：消耗100金币
【 Max 】8% 回帖金币+2、发帖血液+3`,
      神灯: `神灯
【勋章类型】真人男从
【入手条件】无
【商店售价】300金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗100金币
【等级2】8% 回帖血液+1、发帖血液+1▕▏升级条件：消耗150金币
【等级3】10% 回帖血液+1、发帖血液+1▕▏升级条件：消耗200金币
【等级4】12% 回帖血液+2、发帖血液+2▕▏升级条件：消耗300金币
【 Max 】8% 回帖血液+2 咒术+1、发帖血液+2 咒术+1`,
      黑豹: `黑豹
【勋章类型】真人男从
【入手条件】知识≥5
【商店售价】320金币
【等级1】6% 回帖血液+1 堕落-1、发帖咒术+1▕▏升级条件：消耗100血液
【等级2】8% 回帖血液+1 堕落-1、发帖咒术+1▕▏升级条件：消耗200金币
【等级3】10% 回帖血液+1 堕落-1、发帖咒术+1▕▏升级条件：消耗50咒术
【 Max 】12% 回帖血液+2 堕落-1、发帖咒术+1`,
      '莱托·厄崔迪': `莱托·厄崔迪
【勋章类型】真人男从
【入手条件】无
【商店售价】350金币
【等级1】6% 回帖血液+2▕▏升级条件：消耗50金币
【等级2】8% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗50血液
【等级3】10% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗150金币
【 Max 】12% 回帖血液+2、发帖知识+1`,
      '西弗勒斯·斯内普': `西弗勒斯·斯内普
【勋章类型】真人男从
【入手条件】旅程≥38
【商店售价】666金币
【等级1】12% 回帖血液+1、发帖旅程+1▕▏升级条件：消耗99血液
【等级2】10% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗99金币
【等级3】8% 回帖血液+3、发帖旅程+1▕▏升级条件：消耗1314血液
【等级4】6% 回帖旅程+1▕▏升级条件：金币≥999
【 Max 】2% 回帖旅程+1、发帖灵魂+1`,
      '阿不思·邓布利多': `阿不思·邓布利多
【勋章类型】真人男从
【入手条件】旅程≥10
【商店售价】250金币
【等级1】6% 回帖血液+1、发帖血液+3▕▏升级条件：消耗333金币
【等级2】8% 回帖血液+1、发帖血液+3▕▏升级条件：消耗444血液
【等级3】10% 回帖血液+2、发帖血液+3▕▏升级条件：消耗77咒术
【等级4】15% 回帖血液+2、发帖知识+1▕▏升级条件：旅程≥115
【 Max 】16% 回帖血液+3、发帖知识+1`,
      '普隆普特·阿金塔姆': `普隆普特·阿金塔姆
【勋章类型】游戏男从
【入手条件】知识≥10
【商店售价】500金币
【等级1】3% 回帖金币+1、发帖旅程+1▕▏升级条件：知识≥30
【等级2】6% 回帖金币+2、发帖旅程+1▕▏升级条件：消耗100金币
【等级3】9% 回帖金币+2、发帖旅程+1▕▏升级条件：消耗200金币
【等级4】12% 回帖金币+2、发帖旅程+1▕▏升级条件：咒术≥188
【 Max 】15% 回帖金币+2、发帖旅程+1`,
      '诺克提斯·路西斯·伽拉姆': `诺克提斯·路西斯·伽拉姆
【勋章类型】游戏男从
【入手条件】旅程≥15
【商店售价】666金币
【等级1】4% 回帖血液+1、发帖旅程+1▕▏升级条件：旅程≥30
【等级2】8% 回帖血液+1、发帖旅程+1▕▏升级条件：消耗200血液
【等级3】12% 回帖血液+1、发帖旅程+1▕▏升级条件：消耗350血液
【等级4】15% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗1灵魂
【 Max 】18% 回帖血液+3、发帖旅程+1`,
      豹王: `豹王
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】2% 回帖金币+2▕▏升级条件：追随≥50
【等级2】5% 回帖金币+2▕▏升级条件：消耗100金币
【等级3】8% 回帖金币+2、发帖旅程+1▕▏升级条件：消耗100血液
【 Max 】11% 回帖金币+2、发帖旅程+1`,
      '不灭狂雷-沃利贝尔': `不灭狂雷-沃利贝尔
【勋章类型】游戏男从
【入手条件】堕落≥20
【商店售价】500金币
【等级1】2% 回帖血液+1、发帖血液+2 堕落+1▕▏升级条件：消耗200血液
【等级2】5% 回帖血液+1 堕落+1、发帖血液+3 堕落+1▕▏升级条件：咒术≥100
【 Max 】10% 回帖血液+2 堕落+1、发帖血液+3 堕落+1`,
      桐生一马: `桐生一马
【勋章类型】游戏男从
【入手条件】追随≥20
【商店售价】500金币
【等级1】8% 回帖金币+1▕▏升级条件：消耗200血液
【等级2】8% 回帖金币+1 血液+1▕▏升级条件：追随≥88
【 Max 】15% 回帖金币+1 血液+1`,
      '大黄蜂（ChevroletCamaro）': `大黄蜂（ChevroletCamaro）
【勋章类型】真人男从
【入手条件】旅程≥10
【商店售价】300金币
【等级1】4% 回帖金币+1 血液+1、发帖咒术+1▕▏升级条件：消耗100金币
【等级2】6% 回帖金币+1 血液+1、发帖咒术+1▕▏升级条件：消耗100血液
【等级3】8% 回帖金币+1 血液+1、发帖咒术+1▕▏升级条件：消耗30咒术
【 Max 】10% 回帖血液+1 金币+1、发帖咒术+1`,
      博伊卡: `博伊卡
【勋章类型】真人男从
【入手条件】追随≥20
【商店售价】550金币
【等级1】5% 回帖金币+1、发帖金币+2▕▏升级条件：消耗200血液
【等级2】10% 回帖金币+1、发帖金币+2▕▏升级条件：消耗400血液
【等级3】10% 回帖金币+2 血液-1、发帖金币+3 血液-1▕▏升级条件：消耗-100金币
【等级4】13% 回帖金币+3 血液-1、发帖金币+5 血液-1▕▏升级条件：消耗600血液
【 Max 】15% 回帖金币+3、发帖金币+5`,
      '史蒂文·格兰特': `史蒂文·格兰特
【勋章类型】真人男从
【入手条件】无
【商店售价】500金币
【等级1】4% 回帖金币+1、发帖血液+1▕▏升级条件：消耗100血液
【等级2】6% 回帖金币+1、发帖血液+1▕▏升级条件：消耗150金币
【等级3】8% 回帖金币+1、发帖血液+1▕▏升级条件：消耗200血液
【等级4】10% 回帖金币+2、发帖血液+2▕▏升级条件：消耗251金币
【等级5】12% 回帖金币+2、发帖血液+2▕▏升级条件：消耗400血液
【 Max 】14% 回帖金币+3、发帖血液+3`,
      '马克·史贝特': `马克·史贝特
【勋章类型】真人男从
【入手条件】无
【商店售价】500金币
【等级1】4% 回帖血液+1、发帖金币+1▕▏升级条件：消耗100金币
【等级2】6% 回帖血液+1、发帖金币+1▕▏升级条件：消耗150血液
【等级3】8% 回帖血液+1、发帖金币+1▕▏升级条件：消耗200金币
【等级4】10% 回帖血液+2、发帖金币+2▕▏升级条件：消耗251血液
【等级5】12% 回帖血液+2、发帖金币+2▕▏升级条件：消耗400金币
【 Max 】14% 回帖血液+3、发帖金币+3`,
      果体76: `果体76
【勋章类型】游戏男从
【入手条件】活动产出
【商店售价】766
【 Max 】76% 回帖血液+1`,
      竹村五郎: `竹村五郎
【勋章类型】游戏男从
【入手条件】无
【商店售价】400金币
【等级1】5% 回帖咒术+1▕▏升级条件：消耗50咒术
【等级2】8% 回帖咒术+1▕▏升级条件：消耗100咒术
【 Max 】10% 回帖咒术+1`,
      光之战士: `光之战士
【勋章类型】游戏男从
【入手条件】旅程≥15
【商店售价】600金币
【等级1】5% 回帖金币+1 发帖血液+2▕▏升级条件：消耗200金币
【等级2】8% 回帖金币+2 发帖血液+3▕▏升级条件：消耗300金币
【等级3】10% 回帖金币+2 发帖血液+3▕▏升级条件：消耗300血液
【等级4】12% 回帖血液+2 发帖金币+3▕▏升级条件：消耗400金币
【等级5】4% 回帖旅程+1 发帖金币+3▕▏升级条件：消耗500金币
【 Max 】5% 回帖旅程+1 发帖金币+5`,
      Drover: `Drover
【勋章类型】真人男从
【入手条件】无
【商店售价】380金币
【等级1】4% 回帖血液+1、发帖血液+1▕▏升级条件：消耗80血液
【等级2】4% 回帖血液+2、发帖血液+2▕▏升级条件：消耗180血液
【等级3】6% 回帖血液+2、发帖血液+2▕▏升级条件：消耗280血液
【 Max 】8% 回帖血液+3、发帖血液+3`,
      '乔治·迈克尔': `乔治·迈克尔
【勋章类型】真人男从
【入手条件】旅程≥30
【商店售价】600金币
【等级1】6% 回帖血液+2、发帖血液+5▕▏升级条件：追随≥99
【等级2】9% 回帖血液+2、发帖血液+5▕▏升级条件：在线时间≥666
【等级3】12% 回帖血液+2、发帖血液+5▕▏升级条件：消耗666金币
【等级4】15% 回帖血液+2、发帖血液+5▕▏升级条件：消耗888血液
【 Max 】18% 回帖血液+3、发帖血液+5`,
      '荒野大镖客：救赎 II': `荒野大镖客：救赎 II
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】1% 回帖旅程+1`,
      雾都血医: `雾都血医
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖血液+1`,
      '寶可夢 Pokémon': `寶可夢 Pokémon
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖金币+1`,
      最终幻想XIV: `最终幻想XIV
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】1% 回帖旅程+1`,
      赛博朋克2077: `赛博朋克2077
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】1% 回帖旅程+1`,
      TRPG版塊: `TRPG版塊
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖咒术+1`,
      恶魔城: `恶魔城
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖血液+1`,
      英雄联盟: `英雄联盟
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖金币+1`,
      男巫之歌: `男巫之歌
【勋章类型】板块
【入手条件】金币≥888 追随≥100 知识≥20
【商店售价】100金币
【等级1】无属性▕▏升级条件：消耗150金币
【等级2】无属性▕▏升级条件：消耗150金币
【等级3】无属性▕▏升级条件：消耗150金币
【等级4】无属性▕▏升级条件：消耗150金币
【等级5】无属性▕▏升级条件：消耗150金币
【等级6】无属性▕▏升级条件：消耗150金币
【等级7】无属性▕▏升级条件：消耗-1旅程
【等级8】15% 回帖血液+1、发帖血液+1▕▏升级条件：消耗1灵魂
【 Max 】50% 回帖血液+1、发帖血液+2`,
      男色诱惑: `男色诱惑
【勋章类型】天赋
【入手条件】堕落≥100、知识≥50
【商店售价】无
【等级1】11% 发帖血液+3▕▏升级条件：堕落≥200
【等级2】22% 发帖血液+4▕▏升级条件：堕落≥300
【 Max 】33% 发帖血液+5`,
      '美恐：启程': `美恐：启程
【勋章类型】板块
【入手条件】旅程≥15、知识≥15、血液≥200
【商店售价】100金币
【等级1】1% 回帖旅程+1▕▏升级条件：消耗1旅程
【等级2】2% 回帖血液+1▕▏升级条件：消耗50血液
【等级3】1% 回帖知识+1▕▏升级条件：消耗1旅程
【等级4】1% 回帖血液+2▕▏升级条件：消耗50金币
【等级5】1% 回帖旅程+1▕▏升级条件：消耗1旅程
【等级6】1% 回帖血液+2▕▏升级条件：消耗50血液
【等级7】2% 回帖血液+1▕▏升级条件：消耗50金币
【等级8】1% 回帖知识+1▕▏升级条件：消耗-1知识
【等级9】2% 回帖血液+2▕▏升级条件：消耗-3旅程
【 Max 】3% 回帖旅程+1`,
      街头霸王: `街头霸王
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【等级1】2% 回帖金币+1`,
      海边的邻居: `海边的邻居
【勋章类型】天赋
【入手条件】金币≥1500、追随≥150
【商店售价】无
【等级1】5% 发帖咒术+1▕▏升级条件：在线时间≥888
【等级2】15% 发帖咒术+1▕▏升级条件：知识≥60
【 Max 】30% 发帖咒术+1`,
      四季之歌: `四季之歌
【勋章类型】天赋
【入手条件】旅程≥40、知识≥40、追随≥40、咒术≥40
【商店售价】无
【等级1】10% 回帖血液+1、发帖咒术+2▕▏升级条件：消耗1咒术
【等级2】10% 回帖金币+1、发帖旅程+1▕▏升级条件：消耗1咒术
【等级3】10% 回帖血液+1、发帖知识+1▕▏升级条件：消耗1咒术
【 Max 】10% 回帖金币+1、发帖知识+1`,
      风雪之家: `风雪之家
【勋章类型】天赋
【入手条件】注册天数>=365、追随>=50
【商店售价】无
【 Max 】1% 回帖血液+5 金币+5、发帖灵魂+1`,
      龙鳞石: `龙鳞石
【勋章类型】奖品
【入手条件】春节活动获取
【商店售价】无
【 Max 】1% 发帖金币+6`,
      '『不败之花』': `『不败之花』
【勋章类型】剧情
【入手条件】灵魂>=1并且堕落>=1
【商店售价】1血液
【 Max 】无属性`,
      '约书亚・罗兹菲尔德': `约书亚・罗兹菲尔德
【勋章类型】游戏男从
【入手条件】堕落>=160
【商店售价】500金币
【等级1】1% 回帖血液+1▕▏升级条件：1600金币
【等级2】2% 回帖血液+1 堕落+2、发帖灵魂+1 堕落+3▕▏升级条件：堕落>=16
【等级3】10% 回帖血液+3 堕落+1、发帖血液+3▕▏升级条件：堕落>=32
【等级4】10% 回帖血液+2、发帖血液+2▕▏升级条件：堕落>=80
【等级5】6% 回帖堕落-1、发帖堕落-1▕▏升级条件：堕落>=160
【等级6】8% 回帖堕落-1、发帖堕落-1▕▏升级条件：堕落>=250
【 Max 】10% 回帖堕落-2、发帖堕落-2`,
      '克莱夫・罗兹菲尔德': `克莱夫・罗兹菲尔德
【勋章类型】游戏男从
【入手条件】主题数>=16
【商店售价】622金币
【等级1】3% 回帖金币+1▕▏升级条件：消耗320金币
【等级2】5% 回帖金币+1▕▏升级条件：消耗480血液
【等级3】7% 回帖金币+2、发帖咒术+1▕▏升级条件：消耗640血液
【等级4】9% 回帖金币+2、发帖咒术+1▕▏升级条件：消耗640血液
【等级5】13% 回帖金币+2、发帖咒术+1▕▏升级条件：消耗1灵魂
【 Max 】16% 回帖金币+2 血液+1、发帖咒术+1`,
      苇名弦一郎: `苇名弦一郎
【勋章类型】游戏男从
【入手条件】追随>=15
【商店售价】666金币
【等级1】3% 回帖咒术+1、发帖旅程+1▕▏升级条件：消耗666血液
【等级2】5% 回帖咒术+1、发帖旅程+1▕▏升级条件：消耗999血液
【等级3】8% 回帖咒术+1、发帖旅程+1▕▏升级条件：消耗169咒术
【 Max 】5% 回帖旅程+1、发帖咒术+2`,
      '里昂（RE4）': `里昂（RE4）
【勋章类型】游戏男从
【入手条件】主题数>=5
【商店售价】600金币
【等级1】3% 回帖金币+1▕▏升级条件：消耗300血液
【等级2】5% 回帖金币+1 发帖咒术+1▕▏升级条件：消耗600血液
【等级3】10% 回帖金币+2 发帖咒术+1▕▏升级条件：消耗600金币
【等级4】18% 回帖金币+3▕▏升级条件：金币≥444
【 Max 】12% 回帖金币+3 发帖咒术+1`,
      '尼克·王尔德': `尼克·王尔德
【勋章类型】真人男从
【入手条件】堕落≥30
【商店售价】500金币
【等级1】5% 回帖血液+1、发帖金币+1▕▏升级条件：知识≥50
【等级2】7% 回帖血液+1、发帖金币+1▕▏升级条件：消耗550血液
【等级3】10% 回帖血液+2、发帖金币+2▕▏升级条件：消耗600金币
【 Max 】13% 回帖血液+2 金币+1、发帖金币+1`,
      极客的晚宴: `极客的晚宴
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 发帖知识+1`,
      雄躯的昇格: `雄躯的昇格
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 发帖知识+1`,
      波纹蓝蛋: `波纹蓝蛋
【勋章类型】宠物
【入手条件】旅程>=25
【商店售价】500金币
【等级1】1% 回帖知识+1▕▏升级条件：消耗400血液
【等级2】2% 回帖知识+1、发帖知识+1▕▏升级条件：消耗800血液
【 Max 】4% 回帖知识+1、发帖知识+1`,
      崩朽龙卵: `崩朽龙卵
【勋章类型】宠物
【入手条件】主题数>=10
【商店售价】500金币
【等级1】3% 回帖咒术+1▕▏升级条件：消耗400血液
【等级2】5% 回帖咒术+1▕▏升级条件：消耗800血液
【 Max 】2% 回帖咒术+1、发帖灵魂+1`,
      冰海钓竿: `冰海钓竿
【勋章类型】资产
【入手条件】追随>=30
【商店售价】500金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗300金币
【等级2】8% 回帖金币+2▕▏升级条件：消耗600金币
【等级3】10% 回帖金币+3▕▏升级条件：消耗900金币
【 Max 】15% 回帖金币+3`,
      射手的火枪: `射手的火枪
【勋章类型】装备
【入手条件】咒术≥30
【商店售价】550金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗100金币
【等级2】7% 回帖金币+1▕▏升级条件：消耗200金币
【等级3】5% 回帖金币+2▕▏升级条件：消耗300金币
【等级4】10% 回帖金币+2▕▏升级条件：消耗650金币
【 Max 】12% 回帖金币+3`,
      '“米凯拉的锋刃”玛莲妮亚': `“米凯拉的锋刃”玛莲妮亚
【勋章类型】女从
【入手条件】血液>=200
【商店售价】480金币
【等级1】5% 回帖堕落+1、发帖堕落+1▕▏升级条件：堕落≥50
【等级2】6% 回帖血液+1 堕落+1、发帖堕落+1▕▏升级条件：堕落≥100
【等级3】6% 回帖血液+2 堕落+1、发帖堕落+1▕▏升级条件：消耗222血液
【等级4】8% 回帖血液+3、发帖堕落+1▕▏升级条件：消耗444血液
【等级5】10% 回帖堕落-1▕▏升级条件：消耗111咒术
【 Max 】10% 回帖血液+3 堕落+1、发帖血液+3 堕落+1`,
      '朱迪·霍普斯': `朱迪·霍普斯
【勋章类型】女从
【入手条件】知识>=15
【商店售价】500金币
【等级1】5% 回帖金币+1、发帖血液+1▕▏升级条件：知识≥50
【等级2】7% 回帖金币+1、发帖血液+1▕▏升级条件：消耗550金币
【等级3】10% 回帖金币+2、发帖血液+2▕▏升级条件：消耗600血液
【 Max 】13% 回帖金币+2 血液+1、发帖旅程+1`,
      征服之王: `征服之王
【勋章类型】奖品
【入手条件】2024年论坛活动【七日之屿】资源数排名前列
【商店售价】无
【 Max 】10% 回帖金币+1 血液-1`,
      岛屿探险家: `岛屿探险家
【勋章类型】奖品
【入手条件】2024年论坛活动【七日之屿】全程参与
【商店售价】无
【 Max 】1% 回帖金币+1、发帖旅程+1`,
      '『列车长』': `『列车长』
【入手条件】【极地特快】活动中，拼车成功的列车长奖励等级
【商店售价】无
【等级 初级】无属性▕▏升级条件：好友数≥6
【等级1】1% 回帖旅程+1 血液+1、发帖旅程+1 血液+1▕▏升级条件：消耗12旅程
【等级2】1% 回帖旅程+1 血液+1、发帖旅程+1 血液+1▕▏升级条件：消耗-12旅程
【等级3】1% 回帖旅程+1 血液+1、发帖旅程+1 血液+1▕▏升级条件：灵魂≥1
【 Max 】1% 回帖旅程+1 血液+1、发帖旅程+1 血液+1`,
      特供热巧: `特供热巧
【勋章类型】奖品
【入手条件】【极地特快】活动中，拼车成功的车厢乘务员奖励
【商店售价】无
【等级1】1% 回帖血液+1、发帖血液+1▕▏升级条件：消耗1金币
【 Max 】1% 回帖血液+1、发帖血液+1`,
      六出冰花: `六出冰花
【勋章类型】奖品
【入手条件】【雪中飞舞】发帖奖励、【极地特快】未拼车成功的列车长和车厢乘务员留念
【商店售价】无
【 Max 】1% 发帖旅程+1`,
      '『金色车票』': `『金色车票』
【入手条件】2023年【极地特快】活动隐藏奖励，成功触发隐藏剧情：平安夜前发出“相信”的声音
【商店售价】无
【等级 初级】无属性▕▏升级条件：消耗1旅程
【等级1】无属性▕▏升级条件：消耗-1旅程
【等级2】无属性▕▏升级条件：灵魂≥1
【 Max 】无属性`,
      最终幻想XVI: `最终幻想XVI
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】1% 回帖旅程+1`,
      可疑的肉蛋: `可疑的肉蛋
【勋章类型】宠物
【入手条件】堕落≥50
【商店售价】500金币
【等级1】 3% 回帖堕落+1▕▏升级条件：消耗49咒术
【等级2】 5% 回帖堕落+1▕▏升级条件：消耗-1知识
【等级3】 7% 回帖堕落+1▕▏升级条件：知识≥49
【等级4】10% 回帖堕落+1▕▏升级条件：消耗1灵魂
【 Max 】2% 回帖知识+1、发帖灵魂+1`,
      无垠: `无垠
【勋章类型】资产
【入手条件】无
【商店售价】2000金币
【等级1】1% 回帖血液+1、发帖血液+1▕▏升级条件:血液≥1
【等级2】1% 回帖旅程+1、发帖旅程+1▕▏升级条件:堕落≥800
【等级3】无属性▕▏升级条件:消耗1血液
【等级4】5% 回帖旅程+1、发帖旅程+1▕▏升级条件:堕落≥100
【等级5】4% 回帖旅程+1 血液+1、发帖旅程+1 血液+1▕▏升级条件:堕落≥200
【等级6】3% 回帖旅程+1 血液+1、发帖旅程+1 血液+1▕▏升级条件:堕落≥300
【等级7】3% 回帖旅程+1、发帖旅程+1▕▏升级条件:堕落≥400
【等级8】2% 回帖旅程+1 血液+1、发帖旅程+1 血液+1▕▏升级条件:堕落≥500
【等级9】4% 回帖旅程+1、发帖旅程+1▕▏升级条件:堕落≥600
【等级10】2% 回帖旅程+1、发帖旅程+1▕▏升级条件:堕落≥700
【 Max 】1% 回帖血液+1 旅程+1、发帖血液+1 旅程+1`,
      黑暗水晶: `黑暗水晶
【勋章类型】资产
【入手条件】堕落≥36
【商店售价】300金币
【等级1】6% 回帖堕落+1、发帖堕落+1▕▏升级条件：消耗200金币
【等级2】6% 回帖堕落+1 金币+1、发帖堕落+1 金币+1▕▏升级条件：消耗200血液
【等级3】12% 回帖堕落+1 金币+1、发帖堕落+1 金币+1▕▏升级条件：消耗66咒术
【等级4】12% 回帖堕落+2 金币+1、发帖堕落+2 金币+1▕▏升级条件：灵魂≥1
【等级5】18% 回帖金币+1、发帖金币+1`,
      棱镜: `棱镜
【勋章类型】装备
【入手条件】咒术≥20
【商店售价】666金币
【等级1】10% 回帖金币+2▕▏升级条件：堕落≥100
【 Max 】12% 回帖堕落-1`,
      天使之赐: `天使之赐
【勋章类型】装备
【入手条件】堕落≥30
【商店售价】288金币
【等级1】4% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗48咒术
【等级2】10% 回帖金币+2▕▏升级条件：消耗300金币
【 Max 】8% 回帖咒术+1、发帖咒术+1`,
      '爱丽丝·盖恩斯巴勒': `爱丽丝·盖恩斯巴勒
【勋章类型】女从
【入手条件】知识≥30
【商店售价】400金币
【等级1】5% 回帖金币+1、发帖金币+1▕▏升级条件：消耗30咒术
【等级2】5% 发帖金币+2▕▏升级条件：消耗400血液
【等级3】8% 回帖金币+2、发帖金币+2▕▏升级条件：消耗66咒术
【等级4】14% 回帖血液+3▕▏升级条件：血液≥199
【等级5】9% 回帖金币+3、发帖金币+3▕▏升级条件：消耗1金币
【 Max 】9% 回帖金币+3、发帖金币+3▕▏升级条件：消耗1金币`,
      '凯特尼斯·伊夫狄恩': `凯特尼斯·伊夫狄恩
【勋章类型】女从
【入手条件】堕落≥10
【商店售价】450金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗150血液
【等级2】勋章博物馆资料暂缺
【等级3】28% 回帖血液-1 堕落+1▕▏升级条件：堕落≥444
【 Max 】18% 回帖金币+1`,
      '克劳斯·迈克尔森': `克劳斯·迈克尔森
【勋章类型】真人男从
【入手条件】堕落≥5
【商店售价】516金币
【等级1】10% 回帖堕落+1▕▏升级条件：消耗111血液
【等级2】5% 回帖血液+1▕▏升级条件：消耗222血液
【等级3】8% 回帖血液+1▕▏升级条件：消耗333血液
【等级4】10% 回帖血液+2、发帖金币+1▕▏升级条件：金币≥920
【等级5】11% 回帖血液+2、发帖金币+2▕▏升级条件：血液≥920
【等级6】12% 回帖血液+2、发帖金币+3▕▏升级条件：消耗1灵魂
【 Max 】15% 回帖血液+3、发帖金币+5`,
      虎头怪: `虎头怪
【勋章类型】游戏男从
【入手条件】旅程≥20
【商店售价】500金币
【等级1】8% 回帖血液+1、发帖旅程+1▕▏升级条件：追随≥50
【等级2】1% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗600血液
【等级3】2% 回帖旅程+1、发帖旅程+1▕▏升级条件：知识≥60
【等级4】3% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗1灵魂
【等级5】4% 回帖旅程+1、发帖旅程+1▕▏升级条件：在线时间≥2400
【 Max 】2% 回帖旅程+1、发帖灵魂+1`,
      重建熊屋: `重建熊屋
【勋章类型】奖品
【入手条件】【丰饶山麓】重建村镇大厅的兑换奖品
【商店售价】无
【 Max 】2% 回帖金币+1`,
      图腾饼干: `图腾饼干
【勋章类型】奖品
【入手条件】参与【丰饶山麓】救援重建熊人村的谢礼
【商店售价】无
【 Max 】1% 回帖血液+2`,
      龙之秘宝: `龙之秘宝
【勋章类型】奖品
【入手条件】在【秋园庆丰】活动第一阶段的发帖中消耗-10追随
【商店售价】无
【等级1】无属性▕▏升级条件：消耗1血液
【等级2】2% 发帖堕落+1、回帖堕落+1▕▏升级条件：消耗1血液
【等级3】2% 发帖血液+1、回帖血液+1▕▏升级条件：消耗1血液
【等级4】2% 发帖金币+1、回帖金币+1▕▏升级条件：消耗1血液
【 Max 】2% 发帖咒术+1、回帖咒术+1`,
      长花的蛋: `长花的蛋
【勋章类型】宠物
【入手条件】知识≥10
【商店售价】366金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗72咒术
【等级2】10% 回帖金币+1▕▏升级条件：咒术≥36
【 Max 】15% 回帖金币+2`,
      棕色条纹蛋: `棕色条纹蛋
【勋章类型】宠物
【入手条件】追随≥35
【商店售价】520金币
【等级1】1% 回帖咒术+1▕▏升级条件：消耗80血液
【等级2】3% 回帖咒术+1▕▏升级条件：消耗150血液
【等级3】5% 回帖咒术+1▕▏升级条件：消耗-1旅程
【等级4】8% 回帖咒术+1▕▏升级条件：消耗150金币
【等级5】3% 回帖知识+1▕▏升级条件：在线时间≥1999
【 Max 】1% 回帖知识+1、发帖灵魂+1`,
      被尘封之书: `被尘封之书
【勋章类型】资产
【入手条件】堕落≥99
【商店售价】999金币
【等级1】3% 回帖血液+2▕▏升级条件：消耗1000血液
【等级2】6% 回帖血液+2▕▏升级条件：消耗1000血液
【等级3】勋章博物馆资料暂缺
【等级4】12% 回帖血液+2▕▏升级条件：堕落≥200
【等级5】15% 回帖血液+2▕▏升级条件：堕落≥300
【等级6】18% 回帖血液+2▕▏升级条件：堕落≥400
【等级7】21% 回帖血液+2▕▏升级条件：堕落≥500
【等级8】24% 回帖血液+2▕▏升级条件：堕落≥600
【等级9】27% 回帖血液+2▕▏升级条件：堕落≥700
【等级10】30% 回帖血液+2▕▏升级条件：堕落≥800
【等级11】35% 回帖血液+2▕▏升级条件：消耗1灵魂
【 Max 】50% 回帖血液+2`,
      和谐圣杯: `和谐圣杯
【勋章类型】装备
【入手条件】知识≥15
【商店售价】300金币
【等级1】5% 回帖堕落-1、发帖堕落-2▕▏升级条件：消耗88咒术
【等级2】10% 回帖堕落-2、发帖堕落-3▕▏升级条件：消耗400血液
【 Max 】10% 回帖血液+2 堕落+1、发帖血液+3 堕落+3`,
      双项圣杯: `双项圣杯
【勋章类型】资产
【入手条件】咒术＞=20
【商店售价】100金币
【等级1】无属性▕▏升级条件：消耗1金币
【等级2】1% 回帖血液+1、发帖血液+1▕▏升级条件：消耗1金币
【等级3】1% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗10金币
【等级4】2% 回帖血液+2、发帖血液+2▕▏升级条件：消耗10金币
【等级5】2% 回帖咒术+2、发帖咒术+2▕▏升级条件：金币≥1000
【等级6】8% 回帖血液+1、发帖血液+1▕▏升级条件：消耗1000金币
【 Max 】8% 回帖血液+2 咒术+2、发帖血液+2 咒术+2`,
      '露娜弗蕾亚·诺克斯·芙尔雷': `露娜弗蕾亚·诺克斯·芙尔雷
【勋章类型】女从
【入手条件】知识≥20
【商店售价】500金币
【等级1】4% 回帖咒术+1、发帖血液+1▕▏升级条件：消耗150金币
【等级2】6% 回帖血液+1、发帖血液+2▕▏升级条件：消耗200金币
【等级3】8% 回帖血液+1、发帖血液+2▕▏升级条件：消耗300金币
【等级4】10% 回帖血液+2、发帖血液+3▕▏升级条件：消耗120咒术
【 Max 】13% 回帖血液+3、发帖血液+5`,
      凯尔: `凯尔
【勋章类型】女从
【入手条件】主题数>=10
【商店售价】300金币
【等级1】8% 回帖血液+1、发帖旅程+1▕▏升级条件：灵魂≥1
【等级2】15% 回帖血液+1、发帖旅程+2▕▏升级条件：消耗300金币
【等级3】15% 回帖血液+2、发帖旅程+1▕▏升级条件：堕落≥10
【 Max 】12% 回帖血液+2、发帖旅程+1`,
      莫甘娜: `莫甘娜
【勋章类型】女从
【入手条件】主题数>=10
【商店售价】300金币
【等级1】8% 回帖金币+1、发帖旅程+1▕▏升级条件：灵魂≥1
【等级2】10% 回帖金币+1、发帖旅程+1▕▏升级条件：消耗300血液
【等级3】15% 回帖金币+2、发帖旅程+1▕▏升级条件：堕落≥10
【 Max 】12% 回帖金币+2、发帖旅程+1`,
      '阿尔瓦罗·索莱尔': `阿尔瓦罗·索莱尔
【勋章类型】真人男从
【入手条件】追随≥10
【商店售价】500金币
【等级1】6% 回帖金币+1▕▏升级条件：消耗50金币
【等级2】6% 回帖金币+2▕▏升级条件：追随≥50
【等级3】6% 回帖金币+3▕▏升级条件：追随≥150
【等级4】8% 回帖金币+3▕▏升级条件：消耗150金币
【 Max 】12% 回帖金币+2、发帖金币+3`,
      '纣王·子受': `纣王·子受
【勋章类型】真人男从
【入手条件】无
【商店售价】500金币
【等级1】5% 回帖金币+1、发帖金币+2▕▏升级条件：消耗400金币
【等级2】10% 回帖金币+1、发帖金币+2▕▏升级条件：消耗400血液
【等级3】10% 回帖金币+1 堕落+1、发帖金币+3▕▏升级条件：消耗100咒术
【等级4】15% 回帖金币+1 堕落-1、发帖旅程+1▕▏升级条件：消耗1灵魂
【等级5】20% 回帖金币+2、发帖旅程+1▕▏升级条件：堕落≥100
【 Max 】3% 回帖旅程+1、发帖旅程+1`,
      阿齐斯: `阿齐斯
【勋章类型】真人男从
【入手条件】堕落≥60
【商店售价】480金币
【等级1】8% 回帖血液+1、发帖血液+2▕▏升级条件：消耗300金币
【等级2】10% 回帖血液+2 金币-1、发帖堕落+1▕▏升级条件：消耗600金币
【等级3】12% 回帖血液+3 金币-1▕▏升级条件：消耗900金币
【 Max 】18% 回帖血液+3、发帖堕落+1`,
      百相千面: `百相千面
【勋章类型】游戏男从
【入手条件】发帖数≥100
【商店售价】1000金币
【等级1】5% 回帖金币+1 血液+1、发帖旅程+1▕▏升级条件：消耗100金币
【等级2】5% 回帖金币+1 血液+1、发帖旅程+1▕▏升级条件：消耗1000血液
【等级3】5% 回帖金币+2 血液+2、发帖金币+3 血液+3▕▏升级条件：消耗1000金币
【 Max 】5% 回帖旅程+1、发帖金币+3 血液+3`,
      肉垫手套: `肉垫手套
【勋章类型】奖品
【入手条件】参与【河谷寻奇】活动，用70枚游戏金币兑换
【商店售价】无
【 Max 】2% 回帖金币+1、发帖金币+1`,
      绿茵宝钻: `绿茵宝钻
【勋章类型】奖品
【入手条件】参与【河谷寻奇】活动，获得的游戏金币数量排名前10%
【商店售价】无
【 Max 】1% 回帖金币+6、发帖金币+6`,
      猛虎贴贴: `猛虎贴贴
【勋章类型】奖品
【入手条件】参与【巧夕之月】，发布的帖子在各板块中追随数排名前五，或者在活动贴留言抽奖中奖
【商店售价】无
【等级1】1% 回帖血液+1▕▏升级条件：消耗1血液
【等级2】3% 回帖血液+1▕▏升级条件：消耗1血液
【 Max 】5% 回帖血液+1`,
      白巧克力蛋: `白巧克力蛋
【勋章类型】奖品
【入手条件】参与【巧夕之月】，发布符合活动主题条件的帖子LV1
【商店售价】无
【等级1】1% 回帖金币+1▕▏升级条件：1金币
【 Max 】3% 回帖金币+1`,
      灵藤蛋: `灵藤蛋
【勋章类型】宠物
【入手条件】知识≥5
【商店售价】350金币
【等级1】5% 回帖血液+1▕▏升级条件：知识≥30
【 Max 】3% 回帖知识+1`,
      令人不安的契约书: `令人不安的契约书
【勋章类型】资产
【入手条件】咒术≥5
【商店售价】200金币
【等级1】1% 回帖咒术+1▕▏升级条件：消耗15咒术
【等级2】2% 回帖咒术+1▕▏升级条件：消耗-20金币
【 Max 】3% 回帖咒术+1 金币+1`,
      星籁歌姬: `星籁歌姬
【勋章类型】女从
【入手条件】追随≥10
【商店售价】500金币
【等级1】3% 回帖血液+1▕▏升级条件：消耗30咒术
【等级2】6% 回帖血液+1、发帖血液+1▕▏升级条件：消耗270金币
【等级3】9% 回帖血液+1、发帖血液+2▕▏升级条件：追随≥100
【等级4】12% 回帖血液+2、发帖血液+3▕▏升级条件：追随≥200
【 Max 】15% 回帖血液+2、发帖知识+1 血液-3`,
      维涅斯: `维涅斯
【勋章类型】女从
【入手条件】旅程≥14
【商店售价】700金币
【等级1】4% 回帖咒术+1、发帖知识+1▕▏升级条件：主题数≥14
【等级2】6% 回帖咒术+1、发帖知识+1▕▏升级条件：消耗140金币
【等级3】8% 回帖咒术+1、发帖知识+1▕▏升级条件：知识≥140
【等级4】3% 回帖旅程+1、发帖知识+1▕▏升级条件：消耗1144血液
【 Max 】2% 回帖知识+1、发帖灵魂+1`,
      刀锋女王: `刀锋女王
【勋章类型】女从
【入手条件】咒术≥50
【商店售价】600金币
【等级1】3% 回帖咒术+1、发帖咒术+1▕▏升级条件：咒术≥120
【等级2】6% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗60咒术
【等级3】9% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗200金币
【等级4】12% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗200血液
【等级5】15% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗350血液
【 Max 】15% 回帖血液+3、发帖旅程+1`,
      天照大神: `天照大神
【勋章类型】游戏男从
【入手条件】追随≥13
【商店售价】500金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗130血液
【等级2】7% 回帖金币+1、发帖知识+1▕▏升级条件：血液≥1300
【等级3】9% 回帖金币+1、发帖知识+1▕▏升级条件：消耗130血液
【等级4】12% 回帖金币+2、发帖知识+1▕▏升级条件：消耗1300血液
【 Max 】12% 回帖咒术+1、发帖知识+1`,
      '桑克瑞德·沃特斯': `桑克瑞德·沃特斯
【勋章类型】游戏男从
【入手条件】旅程≥21
【商店售价】520金币
【等级1】1% 回帖血液+7▕▏升级条件：消耗52血液
【等级2】1% 回帖血液+8▕▏升级条件：堕落≥52
【等级3】2% 回帖血液+8▕▏升级条件：消耗52咒术
【等级4】2% 回帖血液+9▕▏升级条件：咒术≥180
【 Max 】3% 回帖血液+9`,
      '『星河碎片』': `『星河碎片』
【入手条件】灵魂≥1且主题数≥1且知识≥7且旅程≥7
【商店售价】1知识
【等级1】无属性▕▏升级条件：消耗-1知识
【 Max 】无属性`,
      探险三杰士: `探险三杰士
【勋章类型】奖品
【入手条件】扮演战士、游侠、法师三大职业，参与【迷翳森林】探险活动
【商店售价】无
【 Max 】1% 回帖血液+2`,
      '『迷翳森林回忆录』': `『迷翳森林回忆录』
【勋章类型】剧情
【入手条件】在『迷翳森林』探险活动中，收集15枚迷翳结晶兑换获得
【商店售价】无
【 Max 】2% 回帖金币+2、发帖旅程+1`,
      '『迷翳之中』': `『迷翳之中』
【勋章类型】剧情
【入手条件】灵魂≥1并且旅程≥10并且主题数≥1
【商店售价】10旅程
【等级 初级】无属性▕▏升级条件：消耗-2旅程
【等级1】无属性▕▏升级条件：消耗-3旅程
【等级2】无属性▕▏升级条件：消耗-5旅程
【等级3】无属性▕▏升级条件：旅程≥50
【等级4】无属性▕▏升级条件：消耗1知识
【 Max 】无属性`,
      '『灰域来音』': `『灰域来音』
【勋章类型】剧情
【入手条件】灵魂≥1
【商店售价】10旅程
【等级1】无属性▕▏升级条件：消耗-10旅程
【 Max 】无属性`,
      狱炎蛋: `狱炎蛋
【勋章类型】宠物
【入手条件】堕落≥66
【商店售价】266血液
【等级1】4% 回帖血液+1 堕落+1、发帖血液+1 堕落+1▕▏升级条件：堕落≥100
【 Max 】7% 回帖血液+1 堕落+1、发帖血液+1 堕落+1`,
      散佚的文集: `散佚的文集
【勋章类型】资产
【入手条件】知识≥10
【商店售价】250金币
【等级1】2% 回帖知识+1、发帖知识+1▕▏升级条件：知识≥25
【等级2】5% 回帖血液+2 堕落-1、发帖血液+2 堕落-1▕▏升级条件：消耗200血液
【等级3】6% 回帖血液+3 堕落-1、发帖血液+3 堕落-1▕▏升级条件：消耗300血液
【 Max 】7% 回帖咒术+1 堕落-1、发帖咒术+1 堕落-1`,
      女神之泪: `女神之泪
【勋章类型】装备
【入手条件】咒术≥36
【商店售价】500金币
【等级1】5% 回帖血液+1、发帖血液+3▕▏升级条件：消耗360血液
【等级2】10% 回帖血液+2、发帖血液+3▕▏升级条件：咒术≥360
【 Max 】10% 回帖血液+3、发帖血液+5`,
      '希尔瓦娜斯·风行者': `希尔瓦娜斯·风行者
【勋章类型】女从
【入手条件】知识≥30
【商店售价】500金币
【等级1】3% 回帖血液+2、发帖金币+3▕▏升级条件：追随≥50
【等级2】6% 回帖血液+2、发帖金币+3▕▏升级条件：在线时间≥666
【等级3】9% 回帖血液+2、发帖金币+3▕▏升级条件：消耗500金币
【等级4】12% 回帖血液+2、发帖金币+3▕▏升级条件：消耗666血液
【 Max 】15% 回帖血液+3、发帖金币+3`,
      死亡: `死亡
【勋章类型】真人男从
【入手条件】追随≥10
【商店售价】444金币
【等级1】13% 回帖金币-1▕▏升级条件：消耗130血液
【等级2】13% 回帖血液+1 金币-1▕▏升级条件：知识≥80
【等级3】13% 回帖血液+1 金币+1、发帖旅程+1▕▏升级条件：消耗1300血液
【等级4】2% 回帖旅程+1、发帖灵魂+1▕▏升级条件：灵魂≥2
【 Max 】15% 回帖金币+3、发帖旅程+1`,
      弗图博士: `弗图博士
【勋章类型】游戏男从
【入手条件】无
【商店售价】1024金币
【等级1】10% 回帖金币+1 血液+1▕▏升级条件：旅程≥40
【等级2】10% 回帖金币+1 血液+1、发帖知识+1▕▏升级条件：堕落≥40
【等级3】10% 回帖金币+2 血液+1、发帖知识+1▕▏升级条件：咒术≥40
【 Max 】2% 回帖知识+1 血液+1、发帖灵魂+1`,
      '不屈之枪·阿特瑞斯': `不屈之枪·阿特瑞斯
【勋章类型】游戏男从
【入手条件】堕落≤450
【商店售价】450金币
【等级1】3% 回帖旅程+1▕▏升级条件：旅程≥88
【等级2】1% 发帖灵魂+1▕▏升级条件：灵魂≥1
【 Max 】8% 回帖血液+2、发帖旅程+1`,
      '【周年限定】克里斯(8)': `【周年限定】克里斯(8)
【勋章类型】游戏男从
【入手条件】主题数≥5
【商店售价】600金币
【等级1】10% 回帖金币+1▕▏升级条件：消耗200金币
【等级2】20% 回帖金币+1▕▏升级条件：消耗200血液
【等级3】30% 回帖金币+1▕▏升级条件：消耗1灵魂
【 Max 】66% 回帖金币+1`,
      破旧打火机: `破旧打火机
【勋章类型】装备
【入手条件】无
【商店售价】25金币
【等级1】无属性▕▏升级条件：消耗1金币
【等级2】无属性▕▏升级条件：消耗1血液
【等级3】无属性▕▏升级条件：消耗1咒术
【等级4】无属性▕▏升级条件：消耗1知识
【等级5】无属性▕▏升级条件：消耗1旅程
【等级6】5% 回帖金币+1▕▏升级条件：灵魂≥1
【 Max 】15% 回帖金币+1`,
      山村贞子: `山村贞子
【勋章类型】女从
【入手条件】咒术≥44
【商店售价】300金币
【等级1】10% 回帖血液+1、发帖咒术+1▕▏升级条件：消耗250血液
【等级2】15% 回帖血液+1、发帖咒术+1▕▏升级条件：消耗500血液
【 Max 】15% 回帖血液+2、发帖咒术+2`,
      '蒂法·洛克哈特': `蒂法·洛克哈特
【勋章类型】女从
【入手条件】堕落≥30
【商店售价】400金币
【等级1】1% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗100血液
【等级2】2% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗200血液
【等级3】3% 回帖旅程+1、发帖旅程+1▕▏升级条件：消耗300血液
【 Max 】4% 回帖旅程+1、发帖旅程+1`,
      '九尾妖狐·阿狸': `九尾妖狐·阿狸
【勋章类型】女从
【入手条件】血液≥350
【商店售价】350金币
【等级1】4% 回帖血液+1、发帖咒术+1▕▏升级条件：旅程≥89
【等级2】8% 回帖血液+2、发帖咒术+1▕▏升级条件：消耗89咒术
【 Max 】13% 回帖血液+2、发帖咒术+2`,
      '勒维恩·戴维斯': `勒维恩·戴维斯
【勋章类型】真人男从
【入手条件】无
【商店售价】400金币
【等级1】10% 无属性▕▏升级条件：消耗1金币
【等级2】10% 回帖金币+2、发帖金币+2▕▏升级条件：消耗1金币
【等级3】10% 回帖金币+2、发帖金币+2▕▏升级条件：消耗1金币
【等级4】10% 回帖金币+2、发帖金币+2▕▏升级条件：消耗1金币
【等级5】10% 回帖金币+2、发帖金币+2▕▏升级条件：消耗1金币
【等级6】10% 回帖金币+2、发帖金币+2▕▏升级条件：消耗1金币
【等级7】10% 回帖金币+2、发帖金币+2▕▏金币＜85
【等级8】10% 回帖金币+2、发帖金币+2▕▏金币≥85且金币＜233
【 Max 】10% 回帖金币+2、发帖金币+2▕▏≥233金币`,
      '擎天柱（Peterbilt389）': `擎天柱（Peterbilt389）
【勋章类型】真人男从
【入手条件】追随≥20
【商店售价】400金币
【等级1】4% 回帖血液+1、发帖咒术+1▕▏升级条件：消耗233血液
【等级2】5% 回帖咒术+1 血液+1、发帖咒术+1▕▏升级条件：消耗233金币
【等级3】6% 回帖咒术+1 血液+1、发帖咒术+1▕▏升级条件：消耗66咒术
【等级4】7% 回帖咒术+1 血液+2、发帖旅程+1▕▏升级条件：旅程≥80
【 Max 】8% 回帖咒术+1 血液+3、发帖旅程+1`,
      '丹·雷诺斯': `丹·雷诺斯
【勋章类型】真人男从
【入手条件】主题数≥5
【商店售价】400金币
【等级1】4% 回帖堕落-1▕▏升级条件：消耗100金币
【等级2】6% 回帖堕落-1▕▏升级条件：消耗200金币
【等级3】8% 回帖堕落-1▕▏升级条件：消耗40咒术
【等级4】11% 回帖堕落-1 血液+2▕▏升级条件：消耗80咒术
【等级5】13% 回帖堕落-1 血液+2、发帖血液+2▕▏升级条件：追随≥250
【等级6】15% 回帖堕落-1 血液+2、发帖堕落-1 血液+2▕▏升级条件：消耗1金币（切换卡面）
【 Max 】15% 回帖堕落-1 血液+2、发帖堕落-1 血液+2`,
      謎の男: `謎の男
【勋章类型】奖品
【入手条件】募捐活动奖励，凡募捐一次即可获得。
【商店售价】无
【 Max 】100% 回帖血液+1、发帖金币+1`,
      'Chris Redfield in Uroboros': `Chris Redfield in Uroboros
【入手条件】"重口味学习小组"群组勋章，由群主颁发。
【商店售价】无
【 Max 】1% 回帖知识+1、发帖知识+1`,
      杀意人偶: `杀意人偶
【勋章类型】咒术
【入手条件】在线时间(小时)≥72
【商店售价】8咒术
【持续时间】7天
【等级1】1% 回帖血液+1▕▏升级条件：消耗2咒术
【等级2】10% 回帖血液+2▕▏升级条件：旅程≥59
【等级3】11% 回帖血液+3▕▏升级条件：旅程≥219
【 Max 】8% 回帖堕落+1 金币-1`,
      雷霆晶球: `雷霆晶球
【勋章类型】咒术
【入手条件】咒术≥14
【商店售价】7咒术
【持续时间】7天
【等级1】无属性▕▏升级条件：消耗7咒术
【等级2】7% 回帖血液+1 咒术+1、发帖血液+1 咒术+1▕▏升级条件：消耗-7咒术
【 Max 】无属性`,
      思绪骤聚: `思绪骤聚
【勋章类型】咒术
【入手条件】咒术≥20 知识≥10
【商店售价】15咒术
【持续时间】5天
【等级1】3% 回帖知识+1、发帖知识+1▕▏升级条件：消耗-1知识
【等级2】无属性▕▏升级条件：知识≥500
【 Max 】无属性`,
      闪光糖果盒: `闪光糖果盒
【勋章类型】赠礼
【入手条件】无
【商店售价】70金币
【 Max 】17% 发帖咒术+1 血液+3`,
      茉香啤酒: `茉香啤酒
【勋章类型】赠礼
【入手条件】无
【商店售价】25金币
【等级1】无属性▕▏升级条件：消耗-1血液
【 Max 】15% 回帖血液+1 堕落-1、发帖血液-1 堕落+1`,
      太空列车票: `太空列车票
【勋章类型】咒术
【入手条件】知识>=10
【商店售价】5咒术
【持续时间】5天
【等级1】1% 回帖血液+1▕▏升级条件：旅程≥30
【等级2】5% 回帖血液+1▕▏升级条件：旅程≥50
【等级3】7% 回帖血液+1 金币+1▕▏升级条件：知识≥40
【等级4】12% 回帖血液+1 金币+1▕▏升级条件：消耗30金币
【 Max 】1% 回帖旅程+1`,
      艾利克斯: `艾利克斯
【勋章类型】真人男从
【入手条件】堕落≥50
【商店售价】600金币
【等级1】4% 回帖血液+1 堕落+1▕▏升级条件：消耗150金币
【等级2】6% 回帖血液+2 堕落+1▕▏升级条件：堕落≥120
【等级3】8% 回帖血液+2 堕落+1▕▏升级条件：消耗150金币
【等级4】10% 回帖血液+2 堕落+1▕▏升级条件：消耗-1旅程
【等级5】11% 回帖血液+2 堕落+1▕▏升级条件：血液≥666
【 Max 】12% 回帖血液+3 金币-1、发帖旅程+1`,
      巴比伦辞典: `巴比伦辞典
【勋章类型】故事
【入手条件】<a href="/thread-162802-1-1.html" target="_blank">单机游戏区激励活动（点击跳转）</a>
【商店售价】不可购买
【 Max 】100% 回帖金币+1、发帖金币+1`,
      金翼使: `金翼使
【勋章类型】奖品
【入手条件】<a href="/thread-167739-1-1.html" target="_blank">单机游戏区激励活动（点击跳转）</a>
【商店售价】不可购买
【 Max 】20% 回帖金币+1 血液+1`,
      巨力橡果: `巨力橡果
【勋章类型】奖品
【入手条件】<a href="/thread-167764-1-1.html" target="_blank">动漫区激励活动（点击跳转）</a>
【商店售价】不可购买
【 Max 】20% 回帖金币+1 血液+1`,
      照相机: `照相机
【勋章类型】奖品
【入手条件】【瞬时映景】活动奖励
【商店售价】无
【 Max 】2% 回帖血液+1`,
      阿怪: `阿怪
【勋章类型】奖品
【入手条件】【夜影迷踪】活动参与奖
【商店售价】无
【 Max 】2% 发帖血液+1`,
      '吉尔·沃瑞克': `吉尔·沃瑞克
【勋章类型】女从
【入手条件】知识>=16
【商店售价】460金币
【等级1】无属性▕▏升级条件： 消耗80金币
【等级2】6% 回帖金币+2、发帖血液+1▕▏升级条件：消耗80血液
【等级3】5% 回帖金币+3、发帖血液+2▕▏升级条件：消耗160血液
【等级4】4% 回帖金币+4、发帖血液+3▕▏升级条件：消耗320血液
【 Max 】8% 回帖金币+3、发帖血液+2`,
      '希德法斯·特拉蒙': `希德法斯·特拉蒙
【勋章类型】游戏男从
【入手条件】旅程>=16
【商店售价】720金币
【等级1】无属性▕▏升级条件：消耗48咒术
【等级2】3% 回帖咒术+1 血液+1、发帖咒术+1▕▏升级条件：消耗160血液
【等级3】5% 回帖咒术+1 血液+1、发帖咒术+1▕▏升级条件：消耗320血液
【 Max 】8% 回帖咒术+1 血液+2、发帖咒术+1`,
      神秘挑战书: `神秘挑战书
【勋章类型】资产
【入手条件】旅程>=28
【商店售价】348金币
【等级1】8% 回帖血液+1▕▏升级条件：消耗2旅程
【等级2】8% 回帖血液+1▕▏升级条件：消耗2旅程
【等级3】8% 回帖血液+1▕▏升级条件：消耗2旅程
【等级4】8% 回帖血液+1▕▏升级条件：消耗2旅程
【等级5】8% 回帖血液+1▕▏升级条件：消耗-2旅程
【等级6】8% 回帖血液+1▕▏升级条件：消耗-2旅程
【等级7】8% 回帖血液+1▕▏升级条件：消耗-2旅程
【等级8】8% 回帖血液+1▕▏升级条件：消耗-2旅程
【等级9】8% 回帖血液+1▕▏升级条件：在线时间≥2888
【 Max 】1% 回帖血液+8、发帖血液+8`,
      坏掉的月亮提灯: `坏掉的月亮提灯
【勋章类型】装备
【入手条件】无
【商店售价】380金币
【等级1】4% 回帖咒术+1 血液+1、发帖咒术+1▕▏升级条件：咒术≥100
【 Max 】6% 回帖咒术+1 血液+1、发帖咒术+2`,
      吸血猫蛋: `吸血猫蛋
【勋章类型】宠物
【入手条件】无
【商店售价】333金币
【等级1】5% 回帖血液+1▕▏升级条件：消耗66血液
【等级2】6% 回帖血液+2、发帖血液+1▕▏升级条件：消耗666血液
【等级3】7% 回帖血液+2、发帖血液+2▕▏升级条件：咒术≥123
【 Max 】8% 回帖血液+2 咒术+1、发帖咒术+3`,
      装了衣物的纸盒: `装了衣物的纸盒
【勋章类型】装备
【入手条件】无
【商店售价】99金币
【等级1】无属性▕▏升级条件：消耗69血液
【等级2】6% 回帖堕落+1、发帖堕落+1▕▏升级条件：旅程≥69
【 Max 】10% 回帖血液-1 堕落+1、发帖血液-1 堕落+1`,
      '狄翁・勒萨若': `狄翁・勒萨若
【勋章类型】游戏男从
【入手条件】在线时间（小时）>=160
【商店售价】480金币
【等级1】无属性▕▏升级条件：消耗160金币
【等级2】2% 回帖血液+1 发帖血液+1▕▏升级条件：消耗160金币
【等级3】4% 回帖血液+1 发帖咒术+1▕▏升级条件：消耗320血液
【等级4】6% 回帖血液+2 发帖咒术+1▕▏升级条件：消耗48咒术
【等级5】8% 回帖血液+2 金币+1、发帖咒术+2 金币+3▕▏升级条件：消耗64咒术
【 Max 】10% 回帖血液+2 金币+2、发帖知识+1 金币+3`,
      五谷丰年: `五谷丰年
【勋章类型】天赋
【入手条件】在线时间>=120小时，注册天数>=24，旅程>=24
【商店售价】无
【等级1】4% 回帖血液+2 金币-1、发帖血液+4▕▏升级条件：血液≥365
【等级2】5% 回帖血液+2 金币-1、发帖血液+4▕▏升级条件：知识≥365
【等级3】12% 回帖血液+2 金币-1、发帖血液+4▕▏升级条件：旅程≥365
【 Max 】24% 回帖金币+1、发帖金币+4`,
      '库伦 (审判)': `库伦 (审判)
【勋章类型】游戏男从
【入手条件】无
【商店售价】450金币
【等级1】5% 回帖血液+1▕▏升级条件：知识≥16
【等级2】7% 回帖血液+1、发帖血液+1▕▏升级条件：消耗350血液
【等级3】15% 回帖血液+2、发帖血液+2▕▏升级条件：血液≥200
【 Max 】10% 回帖血液+1、发帖血液+1 金币+1 旅程+1`,
      '库伦 (起源)': `库伦 (起源)
【勋章类型】游戏男从
【入手条件】咒术≤25
【商店售价】480金币
【等级1】18% 回帖血液+2、发帖血液+6▕▏升级条件：咒术≥11
【 Max 】7% 发帖血液+6 咒术-1`,
      变身器: `变身器
【勋章类型】奖品
【入手条件】【细语欢歌】活动期间根据抽取到的主题在音乐区发布翻唱歌曲
【商店售价】无
【等级1】2% 回帖咒术+1、发帖咒术+1▕▏升级条件：咒术≥1000
【 Max 】2% 回帖咒术+1、发帖咒术+1`,
      GM村蛋糕: `GM村蛋糕
【勋章类型】奖品
【入手条件】<a href="/thread-80460-1-1.html" target="_blank">符合发放条件的用户（点击跳转）</a>
【商店售价】无
【 Max 】30% 回帖金币+1 血液+1
【特别说明】兔兔只按大家站内资料填写的出生日期的月日来给大家制作蛋糕哦
【特别说明】所以记得把站内资料填写完整并且公开`,
      近地夜航: `近地夜航
【勋章类型】奖品
【入手条件】在【十一周年】活动期间于论坛任意符合规定的版块发表主题帖，符合活动规定即可免费获得
【商店售价】无
【 Max 】11% 发帖知识+1`,
      半生黄金种: `半生黄金种
【勋章类型】资产
【入手条件】无
【商店售价】120金币
【等级1】2% 回帖金币+1、发帖金币+1▕▏升级条件：消耗1知识
【等级2】2% 回帖咒术+1、发帖咒术+1▕▏升级条件：堕落≥22
【等级3】20% 回帖金币+2 堕落+1、发帖金币+3▕▏升级条件：堕落≥23
【等级4】3% 回帖咒术+1、发帖咒术+1▕▏升级条件：堕落≥123
【 Max 】12% 回帖金币+1、发帖金币+1`,
      Zootopia: `Zootopia
【勋章类型】板块
【入手条件】旅程 >= 15
【商店售价】100金币
【等级1】3% 回帖咒术+1▕▏升级条件：消耗1旅程
【等级2】3% 回帖咒术+1▕▏升级条件：消耗1旅程
【等级3】3% 回帖咒术+1▕▏升级条件：消耗1旅程
【等级4】3% 回帖咒术+1▕▏升级条件：消耗1旅程
【等级5】3% 回帖咒术+1▕▏升级条件：消耗-4旅程
【 Max 】3% 回帖咒术+1`,
      肃弓: `肃弓
【勋章类型】装备
【入手条件】无
【商店售价】299金币
【等级1】3% 回帖金币+1 堕落-1▕▏升级条件：消耗188血液
【等级2】5% 回帖金币+1 堕落-1▕▏升级条件：消耗66咒术
【 Max 】10% 回帖金币+1 血液-1 堕落-1`,
      叶卡捷琳娜: `叶卡捷琳娜
【勋章类型】女从
【入手条件】主题数>=3
【商店售价】480金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗200金币
【等级2】8% 回帖金币+1▕▏升级条件：消耗350血液
【等级3】12% 回帖金币+1 血液+1、发帖金币+1 血液+1 金币+2▕▏升级条件：消耗66咒术
【 Max 】12% 回帖金币+2 血液+1、发帖血液+1`,
      '莱昂纳多·迪卡普里奥': `莱昂纳多·迪卡普里奥
【勋章类型】真人男从
【入手条件】知识 >= 10
【商店售价】666金币
【等级1】8% 回帖金币+1、发帖金币+2▕▏升级条件：金币≥666
【等级2】18% 回帖金币+3、发帖金币+3  升级条件：金币≥688
【等级3】12% 回帖金币+2、发帖金币+2▕▏升级条件：消耗1灵魂
【 Max 】15% 回帖金币+3、发帖旅程+1`,
      迷之瓶: `迷之瓶
【勋章类型】资产
【入手条件】注册天数>=1700（天）, 堕落>=20, 旅程>=38,知识>=4
【商店售价】120金币
【 Max 】5% 回帖堕落+1、发帖金币+1 堕落+1
【特别备注】另有一个奖品类型的同名勋章，效果十分强力，但是不在二手市场出现，故不在这里列出。`,
      '布莱恩‧欧康纳': `布莱恩‧欧康纳
【勋章类型】真人男从
【入手条件】追随≥20
【商店售价】400金币
【等级1】4% 回帖金币+1▕▏升级条件：消耗100金币
【等级2】6% 回帖金币+1▕▏升级条件：消耗100血液
【等级3】8% 回帖金币+1▕▏升级条件：追随≥101
【 Max 】10% 回帖金币+2、发帖旅程+1`,
      老旧的怀表: `老旧的怀表
【勋章类型】资产
【入手条件】在线时间>=280
【商店售价】280金币
【等级1】5% 回帖血液+1、发帖知识+1▕▏升级条件：消耗120金币
【等级2】10% 回帖血液+1、发帖知识+1▕▏升级条件：消耗200血液
【 Max 】2% 回帖知识+1、发帖灵魂+1`,
      '辐射：新维加斯': `辐射：新维加斯
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖堕落+1`,
      '上古卷轴V：天际': `上古卷轴V：天际
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】2% 回帖金币+2`,
      '『居住证: Lv2~6』': `『居住证: Lv2~6』
【勋章类型】剧情
【入手条件】Lv2＜=等级＜=Lv6，旅程＞=10，发帖数＞=2
【商店售价】无
【时限】7天
【等级 初级】无属性▕▏升级条件：消耗-10金币
【 Max 】1% 回帖旅程+1、发帖旅程+1，`,
      '『户口本: Lv7+』': `『户口本: Lv7+』
【勋章类型】剧情
【入手条件】等级＞=Lv7 灵魂＞=1
【商店售价】无
【时限】30天
【等级 初级】无属性▕▏升级条件：消耗-100金币
【 Max 】1% 回帖金币+1 血液+1 咒术+1 知识+1 堕落+1、发帖旅程+1 灵魂+1`,
      '里昂‧S‧甘乃迪': `里昂‧S‧甘乃迪
【勋章类型】游戏男从
【入手条件】无
【商店售价】450金币
【等级1】8% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥100
【等级2】10% 回帖金币+1、发帖金币+1▕▏升级条件：血液≥180
【等级3】10% 回帖金币+1 血液+1、发帖金币+1 血液+1▕▏升级条件：消耗300金币
【等级4】12% 回帖金币+2 血液+1、发帖金币+2 血液+1▕▏升级条件：血液≥300
【 Max 】16% 回帖血液+3、发帖血液+3`,
      '维克多‧天火': `维克多‧天火
【勋章类型】游戏男从
【入手条件】堕落≤50
【商店售价】460金币
【等级1】3% 回帖金币-1 血液+2 ▕▏升级条件：需求150血液
【等级2】3% 回帖金币+1、发帖血液+2▕▏升级条件：消耗55堕落
【等级3】10% 回帖金币+1 血液+1、发帖血液+2▕▏升级条件：知识≥30
【等级4】25% 发帖金币+10▕▏升级条件：旅程≥99
【 Max 】1% 回帖血液+5、发帖灵魂+1`,
      '『任天堂Switch』灰黑√': `『任天堂Switch』灰黑√
【勋章类型】剧情
【入手条件】咒术＞=20
【商店售价】100金币
【等级 初级】无属性▕▏升级条件：消耗0灵魂
【等级1】2% 回帖旅程+1▕▏升级条件：灵魂≥1
【 Max 】2% 回帖旅程+1、发帖灵魂+1`,
      '『任天堂Switch』红蓝√': `『任天堂Switch』红蓝√
【勋章类型】剧情
【入手条件】咒术＞=20
【商店售价】100金币
【等级 初级】无属性▕▏升级条件：消耗0灵魂
【等级1】2% 回帖知识+1▕▏升级条件：灵魂≥1
【 Max 】2% 回帖知识+1、发帖灵魂+1`,
      '丹妮莉丝·坦格利安': `丹妮莉丝·坦格利安
【勋章类型】女从
【入手条件】旅程＞＝30
【商店售价】400金币
【等级1】6% 回帖金币+1、发帖血液+1▕▏升级条件：消耗150血液
【等级2】8% 回帖金币+1、发帖血液+1▕▏升级条件：消耗300血液
【等级3】10% 回帖金币+2、发帖血液+2▕▏升级条件：消耗400血液
【 Max 】12% 回帖金币+3、发帖血液+3`,
      时间变异管理局: `时间变异管理局
【勋章类型】板块
【入手条件】在线时间≥199 且 知识≥19 且 旅程≥19
【商店售价】100金币
【等级1】2% 回帖血液+1、发帖金币+1▕▏升级条件：在线时间≥999
【等级2】2% 回帖金币+2、发帖血液+2▕▏升级条件：在线时间≥1999
【等级3】3% 回帖咒术+1、发帖咒术+1▕▏升级条件：在线时间≥2999
【 Max 】3% 回帖旅程+1、发帖旅程+1`,
      白猪猪储蓄罐: `白猪猪储蓄罐
【勋章类型】储蓄
【入手条件】无，但是有时限，过期消失
【商店售价】100金币
【等级1】50% 回帖金币+1、发帖金币+1▕▏升级条件：消耗-101金币
【 Max 】无属性`,
      粉猪猪储蓄罐: `粉猪猪储蓄罐
【勋章类型】储蓄
【入手条件】无，但是有时限，过期消失
【商店售价】1000金币
【等级1】50% 回帖金币+1、发帖金币+1▕▏升级条件：消耗-1025金币
【 Max 】无属性`,
      金猪猪储蓄罐: `金猪猪储蓄罐
【勋章类型】储蓄
【入手条件】无，但是有时限，过期消失
【商店售价】10000金币
【等级1】50% 回帖金币+1、发帖金币+1▕▏升级条件：消耗-10100金币
【 Max 】无属性`,
      不起眼的空瓶: `不起眼的空瓶
【勋章类型】储蓄
【入手条件】无，但是有时限，过期消失
【商店售价】10咒术
【等级1】8% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗-13咒术
【 Max 】无属性`,
      古烈: `古烈
【勋章类型】游戏男从
【入手条件】旅程≥20
【商店售价】560金币
【等级1】2% 回帖咒术+1▕▏升级条件：追随≥33
【等级2】4% 回帖血液+1 咒术+1▕▏升级条件：消耗88咒术
【等级3】5% 回帖血液+1 咒术+1▕▏升级条件：消耗360血液
【 Max 】8% 回帖血液+2 咒术+1`,
      奇异博士: `奇异博士
【勋章类型】真人男从
【入手条件】旅程≥14
【商店售价】700金币
【等级1】2% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗777血液
【等级2】6% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗777血液
【等级3】8% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗1400血液
【 Max 】14% 回帖咒术+1、发帖咒术+1`,
      '托比·马奎尔': `托比·马奎尔
【勋章类型】真人男从
【入手条件】无
【商店售价】800金币
【等级1】10% 回帖金币+2、发帖金币+2▕▏升级条件：消耗10咒术
【等级2】10% 回帖堕落+2、发帖堕落+2▕▏升级条件：消耗10咒术
【等级3】10% 回帖堕落-2、发帖堕落-2▕▏升级条件：消耗10咒术
【 Max 】12% 回帖金币+2、发帖金币+2`,
      阿丽塔: `阿丽塔
【勋章类型】女从
【入手条件】知识≥20
【商店售价】700金币
【等级1】6% 回帖血液+1、发帖血液+1▕▏升级条件：消耗450金币
【等级2】12% 回帖血液+1、发帖金币+2▕▏升级条件：消耗450血液
【等级3】12% 回帖血液+2、发帖金币+2▕▏升级条件：消耗1灵魂
【 Max 】16% 回帖血液+3、发帖旅程+1`,
      圣诞有铃: `圣诞有铃
【勋章类型】装备
【入手条件】无
【商店售价】100金币
【等级1】2% 回帖血液+1 堕落+1、发帖堕落+1▕▏升级条件：堕落≥99
【 Max 】6% 回帖血液+1 堕落-1、发帖堕落-1 咒术+1`,
      羽毛胸针: `羽毛胸针
【勋章类型】资产
【入手条件】无
【商店售价】149金币
【等级1】1% 回帖血液+1 旅程+1、发帖血液+1▕▏升级条件：好友数≥30
【等级2】2% 回帖血液+1 旅程+1、发帖血液+1 旅程+1▕▏升级条件：好友数≥100
【 Max 】3% 回帖血液+1 旅程+1、发帖血液+1 旅程+1`,
      '都市：天际线2': `都市：天际线2
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】1% 回帖旅程+1`,
      '【新春限定】果体 隆': `【新春限定】果体 隆
【勋章类型】游戏男从
【入手条件】无
【商店售价】555金币
【等级1】5%  回帖金币+1、发帖金币+1▕▏升级条件：消耗100血液
【等级2】15% 回帖金币+1、发帖金币+1▕▏升级条件：消耗555血液
【 Max 】50% 回帖金币+1、发帖金币+1`,
      汉尼拔: `汉尼拔
【勋章类型】真人男从
【入手条件】追随 >= 10
【商店售价】650金币
【等级1】3%  回帖血液+1▕▏升级条件：消耗400金币
【等级2】5%  回帖血液+1、发帖堕落+1▕▏升级条件：知识≥101
【等级3】10% 回帖血液+1、发帖堕落+1▕▏升级条件：追随≥202
【等级4】13% 回帖血液+2、发帖知识+1▕▏升级条件：消耗600血液
【等级5】16% 回帖血液+2、发帖知识+1▕▏升级条件：消耗1灵魂
【 Max 】18% 回帖血液+3、发帖知识+1`,
      梅琳娜Melina: `梅琳娜Melina
【勋章类型】女从
【入手条件】无
【商店售价】999血液
【等级1】8%  回帖金币+1 血液+1▕▏升级条件：消耗1灵魂
【等级2】10% 回帖金币+1 血液+1▕▏升级条件：消耗-888血液
【等级3】2%  回帖旅程+1、发帖灵魂+1▕▏升级条件：消耗1金币
【等级4】25% 回帖金币+1▕▏升级条件：消耗1金币
【等级5】20% 回帖金币+2 血液-1▕▏升级条件：消耗1金币
【 Max 】25% 回帖血液+1`,
      '贝儿(Belle)': `贝儿(Belle)
【勋章类型】女从
【入手条件】旅程 >= 20
【商店售价】666金币
【等级1】5%  回帖金币+2、发帖血液+2▕▏升级条件：消耗99咒术
【等级2】10% 回帖金币+2、发帖血液+2▕▏升级条件：消耗1314血液
【等级3】15% 回帖金币+2、发帖血液+2▕▏升级条件：消耗1灵魂
【 Max 】16% 回帖金币+2 血液+1、发帖旅程+1`,
      普通羊毛球: `普通羊毛球
【勋章类型】装备
【入手条件】无
【商店售价】200金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗120血液
【等级2】7% 回帖金币+1▕▏升级条件：消耗180血液
【等级3】9% 回帖金币+1▕▏升级条件：在线时间≥1200
【 Max 】11% 回帖金币+1 血液+1、发帖旅程+1`,
      神秘天球: `神秘天球
【勋章类型】资产
【入手条件】知识 >= 10
【商店售价】650金币
【等级1】5%  回帖血液+1、发帖血液+1▕▏升级条件：消耗66咒术
【等级2】10% 回帖血液+1、发帖血液+2▕▏升级条件：消耗66咒术
【等级3】15% 回帖血液+1、发帖血液+2▕▏升级条件：消耗66咒术
【等级4】20% 回帖血液+1、发帖血液+2▕▏升级条件：消耗-1知识
【等级5】1%  回帖知识+1、发帖知识+1▕▏升级条件：知识≥100
【等级6】20% 回帖堕落+1、发帖堕落+1▕▏升级条件：消耗1旅程
【等级7】20% 回帖堕落-1、发帖堕落-1▕▏升级条件：消耗-1旅程
【等级8】20% 回帖血液+1、发帖血液+2▕▏升级条件：消耗1灵魂
【等级9】30% 回帖血液+1、发帖血液+2▕▏升级条件：血液≥666
【 Max 】2% 发帖灵魂+1`,
      婚姻登记册: `婚姻登记册
【勋章类型】资产
【入手条件】血液 >= 52
【商店售价】52金币
【等级1】2% 回帖血液+1▕▏升级条件：消耗9血液
【等级2】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗11血液
【等级3】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗11血液
【等级4】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗21血液
【等级5】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗21血液
【等级6】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗52血液
【等级7】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗52血液
【 Max 】5% 回帖血液+2、发帖血液+2`,
      健忘礼物盒: `健忘礼物盒
【勋章类型】资产
【入手条件】无
【商店售价】123金币
【等级1】10% 回帖血液+1▕▏升级条件：消耗1知识
【等级2】8% 回帖血液+1▕▏升级条件：消耗1知识
【等级3】6% 回帖血液+1▕▏升级条件：知识≥50
【等级4】4% 回帖血液+1▕▏升级条件：消耗-2知识
【 Max 】3% 回帖血液+2 知识+1`,
      脏兮兮的蛋: `脏兮兮的蛋
【勋章类型】宠物
【入手条件】发帖数 >= 200
【商店售价】404金币
【等级1】10% 回帖血液+1▕▏升级条件：消耗404金币
【等级2】10% 回帖血液-1 堕落+1▕▏升级条件：发帖数≥404
【等级3】10% 回帖血液+4 咒术-1▕▏升级条件：血液≥404
【等级4】10% 回帖血液-3 金币+3▕▏升级条件：金币≥404
【等级5】无属性▕▏升级条件：主题数≥4
【等级6】10% 回帖血液-4 咒术+1▕▏升级条件：发帖数≥1000
【 Max 】10% 回帖血液+3`,
      猫咪点唱机: `猫咪点唱机
【勋章类型】奖品
【入手条件】<a href="/thread-157767-1-1.html" target="_blank">音乐交流区激励活动（点击跳转）</a>
【商店售价】无
【 Max 】10% 回帖金币+1`,
      'John Reese': `John Reese
【勋章类型】真人男从
【入手条件】金币 >= 1500
【商店售价】1000金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：金币≥2000
【等级2】10% 回帖血液+1、发帖血液+1▕▏升级条件：消耗600血液
【等级3】10% 回帖血液+2、发帖血液+1▕▏升级条件：金币≥2500
【等级4】12% 回帖血液+1、发帖血液+1▕▏升级条件：消耗700金币
【等级5】12% 回帖血液+2、发帖血液+1▕▏升级条件：金币≥3000
【 Max 】15% 回帖血液+3、发帖血液+3`,
      穿靴子的猫: `穿靴子的猫
【勋章类型】真人男从
【入手条件】旅程 >= 9
【商店售价】666金币
【等级1】6% 回帖金币+1、发帖金币+1▕▏升级条件：消耗444血液
【等级2】9% 回帖金币+1、发帖金币+1▕▏升级条件：消耗444金币
【等级3】13% 回帖金币+3 血液-2、发帖金币+3 血液-2▕▏升级条件：在线时间≥365
【等级4】12% 回帖血液+2、发帖血液+2▕▏升级条件：消耗666血液
【等级5】12% 回帖血液+2 金币+1、发帖血液+2 金币+1▕▏升级条件：消耗88咒术
【 Max 】12% 回帖血液+2 金币+2、发帖血液+2 金币+2`,
      狗狗: `狗狗
【勋章类型】真人男从
【入手条件】主题数 >= 1
【商店售价】300金币
【等级1】5% 回帖血液+1、发帖旅程+1▕▏升级条件：消耗300金币
【等级2】8% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗550血液
【等级3】10% 回帖血液+2、发帖旅程+1▕▏升级条件：金币≥1314
【 Max 】12% 回帖血液+3、发帖血液+3`,
      '阿加莎·哈克尼斯': `阿加莎·哈克尼斯
【勋章类型】女从
【入手条件】堕落 >= 94
【商店售价】400金币
【等级1】1% 回帖咒术+1、发帖知识+1▕▏升级条件：消耗500血液
【等级2】4% 回帖咒术+1 血液+1、发帖知识+1▕▏升级条件：消耗88咒术
【等级3】8% 回帖咒术+1 血液+1、发帖知识+1▕▏升级条件：知识≥69
【 Max 】8% 回帖金币+1 血液+2 堕落+1、发帖知识+1`,
      圣水瓶: `圣水瓶
【勋章类型】装备
【入手条件】无
【商店售价】999金币
【等级1】2% 回帖金币+1、发帖金币+1▕▏升级条件：消耗1血液
【等级2】4% 回帖金币+1、发帖金币+1▕▏升级条件：消耗10血液
【等级3】8% 回帖金币+1、发帖金币+1▕▏升级条件：主题数≥100
【等级4】25% 回帖金币+1、发帖金币+1▕▏升级条件：消耗1000血液
【 Max 】50% 回帖金币+1、发帖金币+1`,
      弯钩与连枷: `弯钩与连枷
【勋章类型】资产
【入手条件】旅程 >= 20
【商店售价】330金币
【等级1】3% 回帖堕落+1、发帖堕落+1▕▏升级条件：消耗60血液
【等级2】6% 回帖堕落+1、发帖血液+1 堕落+1▕▏升级条件：消耗90金币
【等级3】9% 回帖血液+1 堕落+1、发帖血液+1 堕落+1▕▏升级条件：消耗80咒术
【等级4】12% 回帖血液+1 堕落+1、发帖血液+1 堕落+1▕▏升级条件：消耗180血液
【 Max 】18% 回帖血液+1、发帖血液+1`,
      '黑神话:悟空': `黑神话:悟空
【勋章类型】板块
【入手条件】无
【商店售价】100金币
【 Max 】5% 发帖旅程+1`,
      巴哈姆特: `巴哈姆特
【勋章类型】游戏男从
【入手条件】知识 >= 20
【商店售价】700金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：好友数≥24
【等级2】8% 回帖血液+1、发帖血液+1▕▏升级条件：消耗500血液
【等级3】8% 回帖血液+2、发帖血液+2▕▏升级条件：知识≥100
【等级4】12% 回帖血液+2、发帖血液+2▕▏升级条件：消耗100咒术
【等级5】13% 回帖血液+3、发帖血液+3▕▏升级条件：消耗1堕落
【等级6】13% 回帖血液+3、发帖血液+3▕▏升级条件：消耗1灵魂
【 Max 】16% 回帖血液+3、发帖血液+3`,
      '约翰·康斯坦丁': `约翰·康斯坦丁
【勋章类型】真人男从
【入手条件】堕落 >= 25
【商店售价】450金币
【等级1】3% 回帖血液+1▕▏升级条件：堕落≥50
【等级2】10% 回帖血液+2、发帖堕落+1▕▏升级条件：消耗1血液
【等级3】5% 回帖血液+1▕▏升级条件：堕落≥100
【等级4】9% 回帖血液+1、发帖堕落+1▕▏升级条件：堕落≥150
【等级5】13% 回帖血液+1、发帖堕落+1▕▏升级条件：堕落≥200
【等级6】15% 回帖血液+1、发帖堕落+1▕▏升级条件：堕落≥350
【 Max 】20% 回帖血液+1、发帖咒术+1`,
      牛局长博戈: `牛局长博戈
【勋章类型】真人男从
【入手条件】咒术 >= 20
【商店售价】200金币
【等级1】5% 回帖金币+1、发帖金币+1▕▏升级条件：消耗350血液
【等级2】8% 回帖咒术+1、发帖咒术+1▕▏升级条件：咒术≥40
【 Max 】40% 发帖堕落+1`,
      '亨利.卡维尔': `亨利.卡维尔
【勋章类型】真人男从
【入手条件】无
【商店售价】500金币
【等级1】1% 回帖金币+5▕▏升级条件：消耗400血液
【等级2】10% 回帖金币+3▕▏升级条件：消耗1金币
【等级3】10% 回帖金币+3▕▏升级条件：消耗1金币
【等级4】10% 回帖金币+3▕▏升级条件：消耗1金币
【等级5】10% 回帖金币+3▕▏升级条件：消耗1金币
【等级6】10% 回帖金币+3▕▏升级条件：消耗1金币
【等级7】10% 回帖金币+3▕▏升级条件：消耗1金币
【等级8】10% 回帖金币+3▕▏升级条件：消耗1金币
【等级9】10% 回帖金币+3▕▏升级条件：消耗1金币
【 Max 】10% 回帖金币+3`,
      红夫人: `红夫人
【勋章类型】女从
【入手条件】追随 >= 15
【商店售价】688金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗99咒术
【等级2】9% 回帖金币+2▕▏升级条件：消耗399血液
【等级3】13% 回帖金币+2▕▏升级条件：堕落≥399
【 Max 】13% 回帖金币+3`,
      '莉莉娅·考尔德（Lilia Calderu）': `莉莉娅·考尔德（Lilia Calderu）
【勋章类型】女从
【入手条件】咒术 >= 77
【商店售价】777金币
【等级1】无属性▕▏升级条件：消耗177咒术
【等级2】1% 回帖咒术+1▕▏升级条件：消耗1旅程
【等级3】2% 回帖旅程+1▕▏升级条件：消耗177金币
【等级4】3% 回帖金币+1▕▏升级条件：消耗1旅程
【等级5】4% 回帖金币+1▕▏升级条件：消耗177血液
【等级6】5% 回帖金币+1▕▏升级条件：消耗-2旅程
【等级7】6% 回帖金币+2 血液-1▕▏升级条件：在线时长≥777
【等级8】7% 回帖金币+2▕▏升级条件：灵魂≥1
【等级9】10% 回帖金币+2▕▏升级条件：灵魂≥3
【 Max 】17% 回帖金币+2`,
      尼特公仔: `尼特公仔
【勋章类型】资产
【入手条件】无
【商店售价】188金币
【等级1】6% 回帖血液-1 金币+1、发帖血液-1 金币+1▕▏升级条件：消耗288金币
【等级2】8% 回帖血液+2 金币-1、发帖血液-1 金币+2▕▏升级条件：消耗288血液
【 Max 】10% 回帖金币+3 血液-1 堕落+1、发帖血液+3 金币-1 堕落-1`,
      黑暗之魂系列: `黑暗之魂系列
【勋章类型】场景&版块
【入手条件】无
【商店售价】100金币
【 Max 】1% 回帖血液+1 堕落+1、发帖血液+1 堕落-1`,
      女巫之路: `女巫之路
【勋章类型】场景&版块
【入手条件】咒术 >= 77
【商店售价】100金币
【等级1】1% 回帖咒术+1▕▏升级条件：消耗7旅程
【等级2】1% 回帖旅程+1▕▏升级条件：消耗7咒术
【等级3】2% 回帖咒术+1▕▏升级条件：消耗-7旅程
【等级4】2% 回帖旅程+1▕▏升级条件：在线时间≥777
【等级5】3% 回帖咒术+1▕▏升级条件：消耗7咒术
【 Max 】3% 回帖旅程+1`,
      '站员: 保卫领土': `站员: 保卫领土
【勋章类型】薪俸与其他
【入手条件】仅“站员”可领取
【商店售价】无
【时限】30天
【等级1】无属性▕▏升级条件：消耗-100金币
【 Max 】100% 回帖金币+1、发帖金币+1`,
      '见习版主: 神的重量': `见习版主: 神的重量
【勋章类型】薪俸与其他
【入手条件】仅“见习版主”可领取
【商店售价】无
【时限】30天
【等级1】无属性▕▏升级条件：消耗-130金币
【 Max 】100% 回帖金币+1、发帖金币+1`,
      '版主: 一国之主': `版主: 一国之主
【勋章类型】薪俸与其他
【入手条件】仅“版主”可领取
【商店售价】无
【时限】30天
【等级1】无属性▕▏升级条件：消耗-200金币
【 Max 】100% 回帖金币+1、发帖金币+1`,
      '『还乡歌』': `『还乡歌』
【勋章类型】剧情
【入手条件】注册天数≥1825
【商店售价】无
【等级 初级】无属性▕▏升级条件：灵魂≥1
【等级1】无属性▕▏升级条件：总积分≥300
【等级2】无属性▕▏升级条件：在线时间≥1000
【 Max 】无属性`,
      '纯真护剑㊕': `纯真护剑㊕
【勋章类型】装饰/特殊
【入手条件】灵魂≥1（儿童节限时获取）
【商店售价】无
【等级1】无属性▕▏升级条件：？？？
【等级2】无属性▕▏升级条件：？？？
【等级3】无属性▕▏升级条件：？？？
【 Max 】无属性`,
      '『日心说』': `『日心说』
【勋章类型】剧情
【入手条件】【星楼钟塔】成功报名参加占星仪式
【商店售价】无
【等级 初级】无属性▕▏升级条件：消耗-1知识
【 Max 】1% 回帖知识+1、发帖知识+1`,
      '『圣洁化身』': `『圣洁化身』
【勋章类型】剧情
【入手条件】Level 10 max， 堕落≤1并且灵魂≥1
【商店售价】1堕落
【时限】1天
【 Max 】1% 回帖堕落-1、发帖堕落-1`,
      '『搓粉团珠』': `『搓粉团珠』
【勋章类型】剧情
【入手条件】灵魂≥1或者主题数≥15（2025年元宵节限时购买）
【商店售价】15金币
【 Max 】无属性`,
      '『冰雕马拉橇』': `『冰雕马拉橇』
【勋章类型】剧情
【入手条件】在游戏大区，根据自身等级完成【冰上飞贼】或【名门圆舞】等发帖剧情任务
【商店售价】无
【 Max 】无属性`,
      '『南瓜拿铁』': `『南瓜拿铁』
【勋章类型】剧情
【入手条件】主题数≥1并且发帖数≥1并且注册天数≥1并且在线时间(小时)≥1并且旅程≥1（2024年10月31日~11月10日 限时获取）
【商店售价】5金币
【时限】5天（可续期）
【 Max 】无属性`,
      '『逆境中的幸运女神』': `『逆境中的幸运女神』
【勋章类型】剧情
【入手条件】【英雄再聚】活动中战功卓著的小队获得
【商店售价】无
【 Max 】无属性`,
      '『泥潭颂唱者』': `『泥潭颂唱者』
【勋章类型】剧情
【入手条件】灵魂≥1并且咒术≥10并且在线时间(小时)≥100
【商店售价】1咒术
【时限】7天（可续期）
【 Max 】无属性`,
      '『钟楼日暮』': `『钟楼日暮』
【勋章类型】剧情
【入手条件】灵魂≥1并且在线时间(小时)≥300并且发帖数≥30并且主题数≥3（限时获取）
【商店售价】1旅程
【时限】30天（可续期）
【等级0】无属性▕▏升级条件：好友数≥3
【等级1】无属性▕▏升级条件：消耗1金币
【 Max 】无属性`,
      '『流星赶月』': `『流星赶月』
【勋章类型】剧情
【入手条件】灵魂≥1并且发帖数≥5并且主题数≥1（2024年5月1日~5月31日 限时获取）
【商店售价】1旅程（2024年5月1日~5月11日）/ 5旅程（2024年5月12日~5月31日）
【时限】30天（可续期）
【等级1】无属性▕▏升级条件：主题数≥10
【等级2】无属性▕▏升级条件：主题数≥50
【等级3】无属性▕▏升级条件：主题数≥100
【 Max 】无属性`,
      '『先知灵药』': `『先知灵药』
【勋章类型】剧情
【入手条件】灵魂≥1并且知识≥10（2024年4月2日~4月30日 限时获取）
【商店售价】10金币
【等级1】无属性▕▏升级条件：旅程≥100
【 Max 】无属性`,
      '『酒馆蛋煲』': `『酒馆蛋煲』
【勋章类型】剧情
【入手条件】灵魂≥1或者发帖数≥10（限时获取）
【商店售价】10金币
【时限】1天（可续期）
【 Max 】无属性`,
      '『活动代币』': `『活动代币』
【勋章类型】剧情
【入手条件】无（限时获取）
【商店售价】1金币
【时限】7天
【等级 初级】无属性▕▏升级条件：消耗0金币
【等级1】无属性▕▏升级条件：消耗0金币
【等级2】无属性▕▏升级条件：消耗0金币
【 Max 】无属性`,
      '『伊黎丝的祝福』': `『伊黎丝的祝福』
【勋章类型】剧情
【入手条件】灵魂≥1（限时获取）
【商店售价】1咒术
【时限】30天（可续期）
【等级 初级】无属性▕▏升级条件：消耗-1咒术
【 Max 】无属性`,
      '『 弗霖的琴』': `『弗霖的琴』
【勋章类型】剧情
【入手条件】【旷世奇珍】酒会：内定密谋，猜中成交价
【商店售价】1旅程
【 Max 】无属性`,
      '『瓶中信』': `『瓶中信』
【勋章类型】剧情
【入手条件】发帖数≥1并且主题数≥1（限时获取）
【商店售价】1金币
【时限】21天
【等级1】无属性▕▏升级条件：消耗1旅程
【等级2】无属性▕▏升级条件：消消耗-1旅程
【等级3】无属性▕▏升级条件：消耗-20金币
【 Max 】无属性`,
      '『林中过夜』': `『林中过夜』
【勋章类型】剧情
【入手条件】灵魂≥1并且主题数≥2并且旅程≥16
【商店售价】1旅程
【 Max 】无属性`,
      '『凯旋诺书』': `『凯旋诺书』
【勋章类型】剧情
【入手条件】【派遣远征s1】派遣先锋的天选仪式
【商店售价】无
【 Max 】无属性`,
      '『绿茵甘露』': `『绿茵甘露』
【勋章类型】剧情
【入手条件】【派遣远征s1】主题数≥1
【商店售价】1金币
【时限】14天
【 Max 】无属性`,
      '『道具超市』': `『道具超市』
【勋章类型】剧情
【入手条件】灵魂≥1并且在线时间(小时)≥100并且主题数≥1并且发帖数≥1
【商店售价】1旅程
【等级1】无属性▕▏升级条件：消耗75金币
【 Max 】无属性`,
      '『狄文卡德的残羽』': `『狄文卡德的残羽』
【勋章类型】剧情
【入手条件】无
【商店售价】1堕落
【 Max 】无属性`,
      '『厢庭望远』': `『厢庭望远』
【勋章类型】剧情
【入手条件】无
【商店售价】无
【等级1】无属性▕▏升级条件：总积分≥1000
【 Max 】无属性`,
      '『转生经筒』': `『转生经筒』
【勋章类型】剧情
【入手条件】签到天数≥1460天并且灵魂≥1
【商店售价】1旅程
【 Max 】无属性`,
      '“半狼”布莱泽': `“半狼”布莱泽
【勋章类型】游戏男从
【入手条件】旅程 >= 5
【商店售价】496金币
【等级1】5% 回帖金币+1、发帖金币+1▕▏升级条件：消耗99金币
【等级2】9% 回帖金币+1、发帖金币+1▕▏升级条件：咒术≥399
【等级3】9% 回帖金币+2、发帖金币+2▕▏升级条件：消耗1199金币
【等级4】12% 回帖金币+2、发帖金币+2▕▏升级条件：血液≥521
【 Max 】13% 回帖金币+3、发帖金币+3`,
      炽焰咆哮虎: `炽焰咆哮虎
【勋章类型】游戏男从
【入手条件】旅程 >= 30
【商店售价】500金币
【等级1】5% 回帖血液+1、发帖血液+1▕▏升级条件：消耗100金币
【等级2】7% 回帖血液+1、发帖血液+1▕▏升级条件：消耗50咒术
【等级3】8% 回帖血液+2、发帖血液+2▕▏升级条件：消耗300金币
【 Max 】10% 回帖血液+3、发帖血液+3 堕落+2`,

      '傲之追猎者·雷恩加尔': `傲之追猎者·雷恩加尔
【勋章类型】游戏男从
【入手条件】无
【商店售价】680金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗80金币
【等级2】10% 回帖金币+1▕▏升级条件：血液≥300
【等级3】10% 回帖金币+2▕▏升级条件：追随≥78
【 Max 】11% 回帖金币+3`,
      '本・比格': `本・比格
【勋章类型】游戏男从
【入手条件】追随 >= 10
【商店售价】666金币
【等级1】4% 回帖金币+1 血液-1、发帖金币+1 血液-1▕▏升级条件：消耗150金币
【等级2】8% 回帖金币+1 血液-1、发帖金币+1 血液-1▕▏升级条件：消耗150血液
【等级3】10% 回帖金币+2、发帖金币+2▕▏升级条件：消耗88咒术
【 Max 】12% 回帖金币+3、发帖金币+3`,
      高桥剑痴: `高桥剑痴
【勋章类型】游戏男从
【入手条件】无
【商店售价】700金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗300金币
【等级2】10% 回帖金币+2▕▏升级条件：消耗1灵魂
【等级3】13% 回帖金币+3▕▏升级条件：堕落≥700
【 Max 】15% 回帖金币+3`,
      '基努·里维斯': `基努·里维斯
【勋章类型】真人男从
【入手条件】堕落 <= 999
【商店售价】666金币
【等级1】1% 回帖血液+1▕▏升级条件：消耗99金币
【等级2】5% 回帖血液+1▕▏升级条件：消耗99金币
【等级3】15% 回帖血液+1 金币-1▕▏升级条件：血液≥1964
【等级4】10% 回帖血液+2▕▏升级条件：消耗99血液
【等级5】20% 回帖血液+1 金币-1▕▏升级条件：消耗99咒术
【 Max 】2% 回贴堕落-1、发帖灵魂+1 堕落-3`,
      '琴.葛蕾': `琴.葛蕾
【勋章类型】女从
【入手条件】咒术 >= 30
【商店售价】500金币
【等级1】10% 回帖堕落+1▕▏升级条件：堕落≥600
【等级2】10% 回帖堕落+2▕▏升级条件：消耗66咒术
【等级3】勋章博物馆资料暂缺
【等级4】3% 回帖旅程+1▕▏升级条件：堕落≥600
【 Max 】10% 回帖堕落-2`,
      'Honey B Lovely': `Honey B Lovely
【勋章类型】女从
【入手条件】无
【商店售价】520金币
【等级1】勋章博物馆资料暂缺
【等级2】10% 回帖金币+1、发帖金币+1▕▏升级条件：消耗710金币
【等级3】11% 回帖金币+2、发帖金币+2▕▏升级条件：消耗198金币
【 Max 】12% 回帖金币+3、发帖金币+3`,
      黑暗封印: `黑暗封印
【勋章类型】装备
【入手条件】堕落 >= 130
【商店售价】350金币
【等级1】3% 回帖咒术+1 血液-3▕▏升级条件：消耗1250金币
【等级2】10% 回帖咒术+1 血液-3▕▏升级条件：好友数≥13
【等级3】8% 回帖血液-3 咒术+1▕▏升级条件：好友数≥130
【等级4】6% 回帖血液-3 咒术+1▕▏升级条件：知识≥130
【等级5】5% 回帖咒术+2、发帖咒术+2▕▏升级条件：灵魂≥25
【 Max 】8% 回帖咒术+2 堕落+1`,
      枯木法杖: `枯木法杖
【勋章类型】装备
【入手条件】无
【商店售价】500金币
【等级1】5% 回帖金币+1▕▏升级条件：消耗1000血液
【等级2】10% 回帖金币+1▕▏升级条件：堕落≥100
【等级3】10% 回帖金币+3 堕落-1▕▏升级条件：堕落≥300
【等级4】10% 回帖金币+2▕▏升级条件：堕落≥500
【 Max 】10% 回帖金币+2 堕落+1`,
      千年积木: `千年积木
【勋章类型】装备
【入手条件】无
【商店售价】200金币
【等级1】3% 回帖咒术+1▕▏升级条件：消耗30咒术
【 Max 】4% 回帖咒术+2`,
      无限魔典: `无限魔典
【勋章类型】资产
【入手条件】无
【商店售价】200金币
【等级1】1% 回帖咒术+1 旅程+1▕▏升级条件： 咒术≥75
【等级2】无属性▕▏升级条件：咒术≥175
【等级3】3% 回帖血液-1▕▏升级条件：咒术≥350
【等级4】2% 回帖咒术+1▕▏升级条件：咒术≥450
【等级5】2% 回帖旅程+1▕▏升级条件：咒术≥525
【等级6-8】勋章博物馆资料暂缺
【等级9】8% 回帖咒术+1▕▏升级条件：咒术≥775
【等级10-19】勋章博物馆资料暂缺
【等级20】2% 回帖旅程+1▕▏升级条件：升级条件：咒术≥1300
【等级21】6% ?▕▏升级条件：咒术≥1375
【等级22】7% 回帖堕落+2▕▏升级条件：咒术≥1450
【等级23-32】勋章博物馆资料暂缺
【等级33】8% 回帖血液-1 金币+1▕▏升级条件：咒术≥2070
【等级34-38】勋章博物馆资料暂缺
【等级39】9% 回帖金币-1 堕落+1▕▏升级条件：咒术≥2400
【等级40】10% 回帖金币-2 堕落+2▕▏升级条件：咒术≥2500
【等级41】10% 回帖血液-1 堕落+2▕▏升级条件：咒术≥2550
【等级42】50% 回帖堕落+1 咒术+1、发帖堕落+5▕▏升级条件：咒术≥2553
【等级43】50% 回帖堕落-1 咒术+1、发帖堕落-3▕▏升级条件：咒术≥2556
【等级44】2% 回帖咒术+1、发帖灵魂+1 咒术+5▕▏升级条件：咒术≥2559
【等级45】55% 回帖咒术+1、发帖咒术+5 知识+1▕▏升级条件：咒术≥2561
【等级46】5% 回帖咒术+1、发帖咒术+1▕▏升级条件：咒术≥2700
【 Max 】1% 回帖咒术+1 旅程+1`,
      基础维修工具: `基础维修工具
【勋章类型】资产
【入手条件】无
【商店售价】120金币
【等级1】2% 回帖咒术+1 金币+1、发帖咒术+1 金币+1▕▏升级条件：发帖数≥499
【等级2】3% 回帖咒术+1 金币+1、发帖咒术+1 金币+1▕▏升级条件：发帖数≥2999
【等级3】6% 回帖咒术+1 金币+1、发帖咒术+1 金币+1▕▏升级条件：消耗1灵魂
【等级4】9% 回帖咒术+1 金币+2、发帖咒术+1 金币+2▕▏升级条件：消耗-120金币
【 Max 】1% 回帖咒术+1 金币+1、发帖咒术+1 金币+1`,
      辉夜姬的五难题: `辉夜姬的五难题
【勋章类型】资产
【入手条件】无
【商店售价】500金币
【等级1】5% 回帖血液+1▕▏升级条件：消耗125金币
【等级2】5% 回帖金币+1▕▏升级条件：消耗125血液
【等级3】5% 回帖血液+2、发帖旅程+1▕▏升级条件：消耗125金币
【等级4】5% 回帖金币+3、发帖旅程+1▕▏升级条件：消耗125血液
【等级5】5% 回帖血液+4、发帖旅程+1▕▏升级条件：消耗500金币
【 Max 】5% 回帖金币+5`,
      末影珍珠: `末影珍珠
【勋章类型】资产
【入手条件】知识 >= 16
【商店售价】256金币
【等级1】1% 回帖咒术+1▕▏升级条件：消耗64血液
【等级2】3% 回帖咒术+1▕▏升级条件：消耗128血液
【等级3】2% 回帖旅程+1▕▏升级条件：在线时间≥999
【 Max 】3% 回帖旅程+1`,
      被冰封的头盔: `被冰封的头盔
【勋章类型】装备
【入手条件】旅程 >= 30
【商店售价】400金币
【等级1】勋章博物馆资料暂缺
【等级2】10% 回帖金币+2 血液-1▕▏升级条件：消耗500金币
【 Max 】10% 回帖金币+3`,
      双生蛋: `双生蛋
【勋章类型】宠物
【入手条件】堕落 >= 177
【商店售价】377金币
【等级1】3% 回帖堕落+1▕▏升级条件：消耗377血液
【等级2】15% 回帖堕落+1 金币+3▕▏升级条件：堕落≥17
【 Max 】10% 回帖堕落-1 金币+1`,
      图书馆金蛋: `图书馆金蛋
【勋章类型】宠物
【入手条件】追随 >= 10
【商店售价】666金币
【等级1】3% 回帖咒术+1、发帖咒术+1▕▏升级条件：消耗100金币
【等级2】5% 回帖金币+1 咒术+1、发帖金币+1 咒术+1]▕▏升级条件：消耗20咒术
【 Max 】7% 回帖金币+2 咒术+1、发帖金币+2 咒术+1`,
      大侦探皮卡丘: `大侦探皮卡丘
【勋章类型】宠物
【入手条件】无
【商店售价】300金币
【等级1】回帖+2%金币
【等级2】4% 回帖知识+1▕▏升级条件：知识≥30
【等级3】3% 回帖 知识+1▕▏升级条件：知识≥100
【 Max 】50% 发帖金币+1`,
    }
    var imgs = {
      史莱姆蛋: {
        1: [
          'https://img.gamemale.com/album/201905/29/221541e62b7qx0m6lyho7x.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/29/221542tzogir48pzlfl88f.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201905/29/221542qr11qay13qbbqkut.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/29/221542d3pgoo0zozcg3g0o.gif',
          40,
        ],
      },
      迷のDoge: {
        1: [
          'https://img.gamemale.com/album/201905/29/221555kk44ch4rcbxtyk04.gif',
          82,
        ],
        2: [
          'https://img.gamemale.com/album/201905/29/221555kv9dcrcj6kyob44z.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/29/221555f727is9hhtehdl92.gif',
          82,
        ],
      },
      洞窟魔蛋: {
        1: [
          'https://img.gamemale.com/album/201905/29/221527hmxxffh1kqt21x1q.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/29/221526psususo2scunfnul.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/29/221526p9fcrklr9r1rccf3.gif',
          40,
        ],
      },
      红龙蛋: {
        1: [
          'https://img.gamemale.com/album/201905/29/221511ipvssp898p8hc3c8.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/29/221511qq76xzqs69ecww6x.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/29/232224ebv13yqbonyaji33.gif',
          40,
        ],
      },
      黑龙蛋: {
        1: [
          'https://img.gamemale.com/album/201905/29/221510np6i8yhy9ij97dae.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/29/221510lacb4yydd5sar98a.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/29/221511xr8zyyk40ykz0rrk.gif',
          40,
        ],
      },
      腐化龙蛋: {
        1: [
          'https://img.gamemale.com/album/201905/29/221508dnthzuhb4vjtjhrk.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/29/221509oxk3x1xrv3ekbexb.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/29/221510cud528wqukfiuhui.gif',
          40,
        ],
      },
      漆黑的蝎卵: {
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201905/29/221614vo15i74rqzr5jgme.gif',
          40,
        ],
      },
      '【年中限定】GM村金蛋': {
        1: [
          'https://img.gamemale.com/album/201906/15/135724lqku3qsckaxsakak.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201906/15/135723aez6hejh6s8655ej.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/135722mej8lc8ehc85hzty.gif',
          40,
        ],
      },
      GM村金蛋: {
        1: [
          'https://img.gamemale.com/album/201906/15/135724lqku3qsckaxsakak.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201906/15/135723aez6hejh6s8655ej.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/135722mej8lc8ehc85hzty.gif',
          40,
        ],
      },
      '詹姆斯‧维加': {
        1: [
          'https://img.gamemale.com/album/201401/01/115249eysm4cpyhmahsnty.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/115253turw1vwznzrwwr4r.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/115258pn61f6nvz2n2fvbw.gif',
          82,
        ],
      },
      奧倫: {
        1: [
          'https://img.gamemale.com/album/201401/01/114811j0odt762t862bt8c.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/115218n44q65c4mn4fs5f5.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/115223te3i7wb454wkkwz5.gif',
          40,
        ],
      },
      '希德‧海温特': {
        1: [
          'https://img.gamemale.com/album/201401/01/110948xqvczqf8vqfczj9t.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/110951gw7pzyrnzj4g63v7.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/110954wzwqpcwc1pvtgntk.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/110957t9yeke4eooy8t6oo.gif',
          40,
        ],
      },
      '皮尔斯‧尼凡斯': {
        1: [
          'https://img.gamemale.com/album/201401/01/110613xyiyof70titsui7z.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/110619ezopcradfkkoitvi.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/110624i11ketiun46tjz3p.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201401/01/110628yz8lg9vgd4q7zgrq.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/110633hpv4p6wrlbwcfbvf.gif',
          40,
        ],
      },
      巴尔弗雷亚: {
        1: [
          'https://img.gamemale.com/album/201401/01/110513dz9mkjrqvq6j7h9g.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/110516mjvrhbu2nbnkt7ux.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/110519b99d0xdud0zmt0e4.gif',
          40,
        ],
      },
      但丁: {
        1: [
          'https://img.gamemale.com/album/201401/01/110804vggzi3ccwigd44wb.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/110807ahwc1p5zz7idx64h.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/110811m2jtc2ikc8mv83c6.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201401/01/110816m336766736ek6wg5.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/110823j9ky9ib99cnxm7mc.gif',
          40,
        ],
      },
      盖里: {
        1: [
          'https://img.gamemale.com/album/201401/01/115306fd5tw9db50g0dk9g.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/115309du9mmexq1m2zmx2g.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/115312t6qoofzxm6s6fu1s.gif',
          82,
        ],
      },
      梅格: {
        1: [
          'https://img.gamemale.com/album/202303/01/145426xq55pqpgwm5iy7yi.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202303/01/145426tj3jtms47xk9djmj.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202303/01/145427xrhhccqqccawckzr.gif',
          40,
        ],
      },
      亚力斯塔尔: {
        1: [
          'https://img.gamemale.com/album/201405/01/173025wsibxvs0ywtbqpeq.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201405/01/173032x0ywemw6kt0wnr9c.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201405/01/173038jf8x3tvxtjz87jf3.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/01/173102zpf3rstrzs1u7zum.gif',
          82,
        ],
      },
      '罗伯‧史塔克': {
        1: [
          'https://img.gamemale.com/album/201405/01/173405o3cw5ffxy72e6s4v.gif',
          40,
        ],
        2: ['', 40],
        3: [
          'https://img.gamemale.com/album/201405/01/173419sb9vv2vs22x9ecjd.gif',
          40,
        ],
        4: ['', 82],
        5: ['', 82],
        6: ['', 82],
        7: [
          'https://img.gamemale.com/album/201405/01/173530zr7urj4zyao4oxjy.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/01/182625yxx81zzbkk8bcb4b.gif',
          82,
        ],
      },
      '亚当‧简森': {
        1: [
          'https://img.gamemale.com/album/201405/29/181315fwq0uf7s99bqh2b3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201405/29/181317el4efflbuaju4zlw.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201405/29/181319lld99jd9zww9mx9a.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201405/29/181325tlnvry79zv56vipi.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/29/181340nt55mrrxthxxmml0.gif',
          124,
        ],
      },
      '布莱恩·欧康纳': {
        1: ['', 82],
        2: ['', 82],
        3: [
          'https://img.gamemale.com/album/201406/22/044722kicxs72q2aczqzu2.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/22/044725arsuzrs4vgweluwv.gif',
          82,
        ],
      },
      '迪恩·温彻斯特': {
        1: [
          'https://img.gamemale.com/album/201406/22/042344dkrz0eha01vfr98f.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201406/22/042345xe3vljnc8jsdpeew.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/22/042346m0m72d7e5lun2w2l.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201406/22/042348n4oekow0w8tmuj0w.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/22/042349gichiorsh5huj77w.gif',
          124,
        ],
      },
      '山姆·温彻斯特': {
        1: [
          'https://img.gamemale.com/album/201406/22/042331zbo7uoul9j9909u4.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201406/22/042331dh9zin91n7ahznhe.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/22/042333v4ohb8w9ort7axaa.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201406/22/042335l31xcfw1g7bbg7gg.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/22/042336dvpcv0di1gcycbll.gif',
          124,
        ],
      },
      魔术师奥斯卡: {
        1: [
          'https://img.gamemale.com/album/201406/30/220946kqztt1qp5xq4q5x7.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201406/30/220955rbefrbyymjymvjmt.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/30/221002we5ai18815izy1xo.gif',
          82,
        ],
        4: ['', 82],
        5: [
          'https://img.gamemale.com/forum/202104/25/112905gvvc8ucovcleozmu.gif',
          124,
        ],
        Max: ['', 82],
      },
      '戴蒙‧萨尔瓦托': {
        1: ['', 82],
        2: ['', 82],
        3: [
          'https://img.gamemale.com/album/201407/15/031655o0krqgsqats9mfma.gif',
          82,
        ],
        4: ['', 82],
        5: [
          'https://img.gamemale.com/album/201407/15/031659lwvsvwswzvumwohv.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/201407/15/031701fprrrr64zwtt6rcw.gif',
          82,
        ],
        7: [
          'https://img.gamemale.com/album/201407/15/162329n0nd3jeecoqq766e.gif',
          82,
        ],
        8: ['', 82],
        9: ['', 82],
        10: ['', 82],
        Max: [
          'https://img.gamemale.com/album/201407/15/031712md6ydg1la83z5dy9.gif',
          82,
        ],
      },
      '库伦(起源)': {
        1: [
          'https://img.gamemale.com/album/201407/16/104751vvazr322erx6gh5w.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201407/16/104753wu8ss9spsc9sww8w.gif',
          40,
        ],
      },
      铁牛: {
        1: [
          'https://img.gamemale.com/album/201503/02/215947gyk5wjk7ah7h3aaw.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201503/02/215950g9xu9f9f9nsxi6xs.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201503/02/215954du988aao6w8xf4o6.gif',
          82,
        ],
      },
      '康纳‧沃什': {
        1: [
          'https://img.gamemale.com/album/201503/09/012316nn7lnzbryrf2lcot.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201503/09/012322qsppxypx8vxjosnk.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201503/09/012328nb2sp7d1pp4wzmlm.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201503/09/012333t0bqlrwcrc30erq3.gif',
          82,
        ],
      },
      '尼克·贝特曼': {
        1: [
          'https://img.gamemale.com/album/201503/16/144604vnabcbnc56f1cnzb.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201503/16/144605wq0f0t09wllp9x4k.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201503/16/144612ktv96hwszcz91ch8.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201503/16/144649r9gl1r6gfc99zqm6.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201503/16/144654bn2rgzkxkrxb9tjl.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201503/16/144659tzrqrl4g9gs9uuwi.gif',
          124,
        ],
      },
      '杰夫‧莫罗': {
        1: [
          'https://img.gamemale.com/forum/202008/15/102849spm9cjzf61bkmca8.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/114350l0smwjesszperj2y.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/114353ayzqlwphkha7p74a.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201401/01/114357ilefiqmozi3fbhco.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/114404jwzw19yg9wg929ws.gif',
          82,
        ],
      },
      维吉尔: {
        1: [
          'https://img.gamemale.com/album/201507/04/202526he2n0d56fd8zd87a.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201507/04/202527epacq0c0zca0drcp.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/04/062215sqk4z5m5gc54q8gz.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/110724dnsnn9vohsdnsvwo.gif',
          40,
        ],
      },
      威尔卡斯: {
        1: [
          'https://img.gamemale.com/album/201401/01/114250lsaw2aynywna6gae.gif',
          40,
        ],
        2: ['', 40],
        3: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201401/01/114310kilorynyn51o1p44.gif',
          40,
        ],
      },
      卡斯迪奥: {
        1: [
          'https://img.gamemale.com/album/201406/22/042226pcx22u43l84pdslx.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201406/22/042228add94qdrh4hm88m7.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/22/042232yedvd9be1nfz1eam.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201406/22/042236oa44wwaudaee9kek.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/forum/202112/12/010415k8m0109p4wum0uum.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/201406/22/042245gi30m4j0jn53wj54.gif',
          124,
        ],
        7: ['', 124],
        8: [
          'https://img.gamemale.com/album/201406/22/042253bxcdjddyyguyymy1.gif',
          124,
        ],
        9: ['', 124],
        Max: [
          'https://img.gamemale.com/album/201406/22/042302n6dszl6ialg4het4.gif',
          124,
        ],
      },
      虎克船长: {
        1: [
          'https://img.gamemale.com/album/201507/04/201345hjeja2qedk2lqzlx.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201406/30/220919pa1bb2chg8g1v2rc.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/30/220925kdwcj4wwnw0fnopj.gif',
          40,
        ],
        4: ['', 40],
        5: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201406/30/220937t1ghq6hn6jsjush6.gif',
          40,
        ],
      },
      '卢西亚诺‧科斯塔': {
        1: [
          'https://img.gamemale.com/album/201406/30/220855w7cyd7rztkfjfc8e.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/30/220858qv2nanaczbfc0mmm.gif',
          82,
        ],
      },
      '安德森‧戴维斯': {
        1: [
          'https://img.gamemale.com/album/201407/15/085920xxy109ofq90fyc0n.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201407/15/085922luac88f03c6c3ci0.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201407/15/085923ox4r8laxbk98fqjq.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201407/15/085925cxwy9wxywy5ujdjx.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201407/15/085926tfq5ohmwp09ep019.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201407/15/085929njwr63y4hnb43y32.gif',
          82,
        ],
      },
      尤利西斯: {
        1: [
          'https://img.gamemale.com/album/201507/04/201826l92ld6egd3egqkii.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201507/04/201826z56c36z6q5jefy60.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201504/03/153558ue0f4fisvk02i2fg.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201504/03/153558b05r1od2opovhhhr.gif',
          40,
        ],
      },
      '克里斯‧雷德菲尔德': {
        1: [
          'https://img.gamemale.com/album/201401/01/110854wecejl2082gbhg3c.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/110859kr82uubuy4q25cr5.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/110904gxcccooo51hz733h.gif',
          40,
        ],
        4: ['', 82],
        Max: [
          'https://img.gamemale.com/album/201401/01/110916nrxt3tztmta1axzr.gif',
          82,
        ],
      },
      '凯登‧阿兰科': {
        1: [
          'https://img.gamemale.com/album/201401/01/114439r1ppqs7ssh0etw5w.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/114444vlzkj3k94rhr9m5k.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/114448waxs6u72ntccuxul.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201401/01/114453v68m922av4a5mtaa.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201401/01/114459jaerdccmdrbeplcm.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/114516anrkkka88jfkfh0i.gif',
          124,
        ],
      },
      肥皂: {
        1: [
          'https://img.gamemale.com/album/201401/01/111041k86xnhzoeevvs8mh.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/111048aaqakl5ctsg8drtk.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/111053odf49up8du744s9u.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201401/01/111057p89vmdmt9dd4hv19.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/forum/202405/01/003840b989579tiybc0b90.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/111106dc2x6f1uk2dcu0ig.gif',
          82,
        ],
      },
      '奥利弗‧奎恩': {
        1: [
          'https://img.gamemale.com/album/201401/04/121410iocnbobhqdrdraoq.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/04/121414piiwnawiaknaitgm.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/04/121418fswmv8vg2v6ov2w6.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201401/04/121426l39rbb8i9gm8iz38.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201401/04/121434tud538ov9d99d009.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/201401/04/121449uku50dup6odxkho5.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/04/123010brrtjrtntmzp5j3z.gif',
          124,
        ],
      },
      '史蒂夫‧金克斯': {
        1: [
          'https://img.gamemale.com/album/201406/22/042417b936kgugjuzud266.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/22/042418qn1514k5ydb8z1k4.gif',
          82,
        ],
      },
      '巴特‧贝克': {
        1: [
          'https://img.gamemale.com/album/201505/10/154847opjqhpb8kjycikjc.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/10/154847q9f7fb9izezyp7ze.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/10/154848f6jo2zyp732r173x.gif',
          40,
        ],
      },
      '杰森·斯坦森': {
        1: [
          'https://img.gamemale.com/forum/202311/10/171152edqemllma1b34bgb.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202311/10/171202uphzhe2pks61f1kh.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201505/23/082854r5ronno1o5o61010.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201505/23/082855f5fccek6p5yjf5j6.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201505/23/082856hgookqbcc0k8vvjc.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/082856it4zstqdddanaxtt.gif',
          124,
        ],
      },
      '哈尔‧乔丹': {
        1: [
          'https://img.gamemale.com/album/201505/23/111325tfe6dfehe9mxhmef.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/23/111325gdz7lldkdwnbtnax.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201505/23/111325b6ymw5peznygp618.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/111326xqwszoupjf3fww63.gif',
          82,
        ],
      },
      '盖拉斯‧瓦卡瑞安': {
        1: [
          'https://img.gamemale.com/album/201505/23/211219cyfcl27mmgn9929z.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/23/211222dg1tva0hlbccjce0.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201505/23/211223r9l1ex18p1pszaxi.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/211224kws3ysvpinesp59y.gif',
          40,
        ],
      },
      '戴尔‧芭芭拉': {
        1: [
          'https://img.gamemale.com/album/201506/29/235058iuzdrrmrwnn25m7g.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201506/29/235059pjth6nn75txh3t5n.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201506/29/235100c0sbkrsmldu80wmh.gif',
          82,
        ],
      },
      'Frank (LBF)': {
        1: [
          'https://img.gamemale.com/album/201506/30/071640migik8q248qyii22.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201506/30/071641dbzqnkn7in8zt8pn.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201506/30/071641t302dm1mfnwff1mi.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201506/30/071642wq9fqxqc2xss9fs4.gif',
          40,
        ],
      },
      'BIG BOSS': {
        1: [
          'https://img.gamemale.com/album/201506/30/084906nh183f8ffmz2008m.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201506/30/084907o6jcmbo2jlcpnvrr.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201506/30/084908mj6fhkzkx0p184fg.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201506/30/084909kzw2ato99959o5nt.gif',
          124,
        ],
      },
      '詹米·多南': {
        1: [
          'https://img.gamemale.com/album/201506/30/092042fmhmkpquik3kifu2.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201506/30/092043t1qsm2t42m2sshfx.gif',
          82,
        ],
      },
      '阿尔萨斯‧米奈希尔': {
        1: [
          'https://img.gamemale.com/album/201508/29/062410iizv9pimopiffe5d.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201508/29/062410wqfw2l25dzl32d3a.gif',
          40,
        ],
      },
      '克里斯·埃文斯': {
        1: [
          'https://img.gamemale.com/album/201602/20/134918obx15k16jr1z9289.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201602/20/134920l1v1zmcb5hcphbh8.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201602/20/134923vzoej3ktzjfdfjoy.gif',
          40,
        ],
      },
      '安德鲁·库珀': {
        1: [
          'https://img.gamemale.com/album/201602/20/154456o7n5yw25svraaray.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201602/20/154520mnndxpplv03vygiz.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201602/20/154600zvbkq6ap88u8cb82.gif',
          82,
        ],
      },
      '罗宾·西克': {
        1: [
          'https://img.gamemale.com/album/201605/02/192230msgyjyk28ygyfsz2.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201605/02/192231x0062ad60a2nzxaa.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201605/02/192233idmhdmetnznuznig.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201605/02/192236gla0r2kxk582ikaa.gif',
          82,
        ],
      },
      岛田半藏: {
        1: [
          'https://img.gamemale.com/album/201903/25/124807ilv7ukppsly5xzvs.gif',
          40,
        ],
        2: ['', 124],
        3: [
          'https://img.gamemale.com/album/201903/25/124830atf2tt6r7rk6p222.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201903/25/124839q9icp8ngo8b9oopd.gif',
          124,
        ],
      },
      '泰凯斯·芬得利': {
        1: [
          'https://img.gamemale.com/album/201904/25/220125weugylhuu0devlgh.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201904/25/220124ji0zacxs4v77njby.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201904/25/220124znuounld3adujqe0.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201904/25/220123zsvo8j4vc3vv4lb2.gif',
          82,
        ],
      },
      '【夏日限定】夏日的泰凯斯': {
        1: [
          'https://img.gamemale.com/album/201904/25/220138bdd8slgridi8nzm4.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201904/25/220139t8rrr68868roc288.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201904/25/220139v20f8ccfv02hv78h.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201904/25/220139xhmwzhscmm2qppwc.gif',
          124,
        ],
      },
      夏日的泰凯斯: {
        1: [
          'https://img.gamemale.com/album/201904/25/220138bdd8slgridi8nzm4.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201904/25/220139t8rrr68868roc288.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201904/25/220139v20f8ccfv02hv78h.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201904/25/220139xhmwzhscmm2qppwc.gif',
          124,
        ],
      },
      '康纳/Connor': {
        1: [
          'https://img.gamemale.com/album/201904/25/220108t5htttd3ttkkxsd5.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201904/25/220108aind1aia4quizki1.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201904/25/220108e4kjmoj4o4xk4hdj.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201904/25/220107yf1mnxaz5311m0cc.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201904/25/220107vxtl6jijx96qir6a.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201904/25/220108i9re7b6pbrsh5b67.gif',
          82,
        ],
      },
      '亚瑟·库瑞（海王）': {
        1: ['', 40],
        2: [
          'https://img.gamemale.com/album/201903/30/221924mzczyqqwbwb6ydd3.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201903/30/225516atxf4bxba0ng7bs4.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201903/30/225516l56llaodn6alxlwa.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201903/30/221924z0pcz7i0imphziep.gif',
          124,
        ],
      },
      '亚瑟‧摩根': {
        1: [
          'https://img.gamemale.com/album/202410/28/144101dzbf6jb1fbhk1vq1.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/01/212353bvkfigugvnal66ay.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201910/03/155946zhuz8xqvudj84zro.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/forum/202303/14/052233lpa2spsmt4pqk1jj.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201905/01/211213qzdjyc62uaajpvdw.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201903/30/134405f7rx7vpphocupvr9.gif',
          124,
        ],
      },
      蛮族战士: {
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/forum/201912/23/124906rogngtdnng8qggqg.gif',
          82,
        ],
      },
      黑墙: {
        1: [
          'https://img.gamemale.com/album/201905/13/161743os11sof45ybrme1v.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/13/161742a7zbvtqzioditot0.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201905/13/161742sdt0ku33u4dvwwnb.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201905/13/161741mbzwshwbf1mssq81.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201905/13/161741zykk71kvoxfxnv5r.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/13/162332i7g2znagk1mupqpg.gif',
          82,
        ],
      },
      '内森·德雷克': {
        1: [
          'https://img.gamemale.com/album/201905/14/151624ennn7ni4o0gb0b4o.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/15/003906xcepjsobv9cveegj.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201905/15/003908ntvs5s9sn9nswsws.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201905/14/151630dr5qq16505ap1qqb.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201909/12/222140mfizhhp14ghfyf04.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/09/152457mpoz7oayd7t0cpmz.gif',
          124,
        ],
      },
      '丹尼爾·紐曼': {
        1: [
          'https://img.gamemale.com/album/201905/27/163959k72aczsn6xnpv7xd.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202308/10/000830iv14tj909qessjne.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/forum/202308/10/000826g3e3ecoor35hi7hn.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/27/164001f2ecryel2olmtgeo.gif',
          82,
        ],
      },
      贝优妮塔: {
        1: [
          'https://img.gamemale.com/album/202303/01/152747k8u5ujhh14z4b41h.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202303/01/152748ol96hyxzlddix9ql.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202303/01/152749zozo7ybk8n2bk4n7.gif',
          82,
        ],
      },
      英普瑞斯: {
        1: [
          'https://img.gamemale.com/album/201906/15/173436igg9unnun4fa3kkf.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202312/28/165816frtmueegxoexozno.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201906/15/173440ew6lnuwken6wn6ve.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/173444wno2c6oe1o1zxe1k.gif',
          82,
        ],
      },
      '杰西·麦克雷': {
        1: [
          'https://img.gamemale.com/album/201906/15/161024p33tfxtaxacfydvw.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201906/15/161029ghu340b94o99yy3b.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201906/15/161051bxw9gc9wc0d7qq1e.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201906/15/161126nfgwga5j5xevggew.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/161013kdb5i5t55t099502.gif',
          124,
        ],
      },
      '卡德加（Khadgar）': {
        1: [
          'https://img.gamemale.com/album/201906/15/165004x52a222uu29a9g22.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201906/15/164639ina7rnpkjejrnl81.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201906/15/164644dopsytovbbbdcdby.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/164652eslmh9x9m1gdm9d3.gif',
          82,
        ],
      },
      '麦迪文（Medivh）': {
        1: [
          'https://img.gamemale.com/album/201906/15/164740vi5aqudsrab3kak7.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202307/04/164256qff2s3glzfmsbag3.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201906/15/164748jqcbfc5ddtqiuyy5.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/164751asnjhhgbnm3tzrzg.gif',
          82,
        ],
      },
      遗忘之水: {
        1: [
          'https://img.gamemale.com/album/201507/02/113359nsaaatonossri6h6.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201507/02/113359pbxnjjnxsjzljtxj.gif',
          40,
        ],
        3: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201507/02/113400kqv0z0i0didl60a8.gif',
          40,
        ],
      },
      灵光补脑剂: {
        1: [
          'https://img.gamemale.com/album/201507/02/113409l7tzet09qgx7uzpt.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/113408hctqvcqz0wjooqco.gif',
          40,
        ],
      },
      神秘商店贵宾卡: {
        1: [
          'https://img.gamemale.com/album/201507/02/113510j9kkzz91hb091zy0.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201507/02/113511txf3f8fihqst2q1f.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/113511lc67q9rjxjr3u6oj.gif',
          40,
        ],
      },
      变骚喷雾: {
        Max: [
          'https://img.gamemale.com/album/201905/13/141915cv3595x475qhqg2v.gif',
          40,
        ],
      },
      贞洁内裤: {
        Max: [
          'https://img.gamemale.com/album/201401/01/191959nyfyv2b6v1hppbp6.gif',
          40,
        ],
      },
      没有梦想的咸鱼: {
        Max: [
          'https://img.gamemale.com/album/201905/13/141900afyeyyf5yd1777q7.gif',
          40,
        ],
      },
      石肤术: {
        1: [
          'https://img.gamemale.com/album/201904/25/215911w0mosld7ioygoetl.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201904/25/215911s9p2292z0n2p1k1k.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201904/25/215911f1ezqwuqrpqau6if.gif',
          40,
        ],
      },
      吞食魂魄: {
        1: [
          'https://img.gamemale.com/album/201507/02/114453pdfdd3pnfut2uqxd.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201507/02/114452vbww9wpt9cr8n999.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/114453rn7kkne7371e0ok7.gif',
          40,
        ],
      },
      咆哮诅咒: {
        1: [
          'https://img.gamemale.com/album/201507/02/114500rdiddgbttibdbiaa.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/114501dlkkbbncsk52zzkh.gif',
          40,
        ],
      },
      霍格沃茨五日游: {
        1: [
          'https://img.gamemale.com/album/201507/02/114541trdrr3dle4jkkzbj.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/201507/02/114542ehzt9tnwh72n2txc.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/201507/02/114542n5491t4dtfbph4tx.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/201507/02/114541msk0olpz48t8utun.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/114540oy7474tc07zof0fz.gif',
          124,
        ],
      },
      祈祷术: {
        1: ['', 40],
        2: [
          'https://img.gamemale.com/album/201507/02/114508t313555p7xjj5bof.gif',
          40,
        ],
        3: ['', 40],
        4: ['', 40],
        5: ['', 40],
        6: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201507/02/114510xiw6tseiytig6sii.gif',
          40,
        ],
      },
      黑暗交易: {
        1: ['', 82],
        2: [
          'https://img.gamemale.com/album/201507/02/114520o7x23c7c3cgbcy4y.gif',
          82,
        ],
        3: ['', 82],
        4: [
          'https://img.gamemale.com/album/201507/02/114521mpss1ns8zoffs7fp.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201507/02/114521i6ooexrb6bvjbseu.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/114522rdpozgrb218crrkd.gif',
          82,
        ],
      },
      炼金之心: {
        1: [
          'https://img.gamemale.com/album/201507/02/114531ntxydovsnsxdqdov.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201507/02/114531d2bkaq1zq1atk9va.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201507/02/114531jwy1hteehzmvra8g.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/114532co4iziicnc04ck8m.gif',
          40,
        ],
      },
      水泡术: {
        1: [
          'https://img.gamemale.com/album/201507/02/114428v66p06kdhy0zbcad.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/201507/02/114428kgmamyizamwjjl1g.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/114429w2htftmmmzz4l696.gif',
          40,
        ],
      },
      召唤古代战士: {
        1: [
          'https://img.gamemale.com/album/201507/02/114441t4f5yx5yxuuybu65.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201507/02/114441c23iwtt088tq3pb7.gif',
          82,
        ],
      },
      净化手杖: {
        1: [
          'https://img.gamemale.com/forum/202303/11/034543gk9k2d39fj1ujnnz.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/forum/202303/11/034544auumpv1im1i2apcy.gif',
          40,
        ],
      },
      圣英灵秘银甲: {
        1: [
          'https://img.gamemale.com/forum/202310/03/211510s75nraq5m8tymmru.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202310/03/211518sp196gghh5d6ccjc.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201407/15/161138szkk9gk4fkux4jlg.gif',
          40,
        ],
      },
      新月护符: {
        1: [
          'https://img.gamemale.com/album/201505/23/122642ltvvradt566wartw.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/122644dslwzmsvvebl5uju.gif',
          40,
        ],
      },
      布衣: {
        1: [
          'https://img.gamemale.com/album/201505/23/071003ayvccyri4td65td6.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/23/071004p1ml9cymrl83kc6l.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201505/23/071004f80d20maued6n90h.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201505/23/071005l3274cjxb8t1oj97.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201505/23/071006p8o75kz4xyxvv7d8.gif',
          40,
        ],
        6: [
          'https://img.gamemale.com/album/201505/23/071006ibzazt7r0nn0gnbg.gif',
          40,
        ],
        7: [
          'https://img.gamemale.com/album/201505/23/071006gthpf50r0mvv5m5h.gif',
          40,
        ],
        8: [
          'https://img.gamemale.com/album/201505/23/071007wchlhtx6ce1ht5sc.gif',
          40,
        ],
        9: [
          'https://img.gamemale.com/album/201505/23/071007c8ib2ukuo56z8xic.gif',
          40,
        ],
        10: [
          'https://img.gamemale.com/album/201505/23/071007q19qdizoavidsqs1.gif',
          40,
        ],
        11: [
          'https://img.gamemale.com/album/201505/23/071008pbb5yaibkiivkv9i.gif',
          40,
        ],
        12: [
          'https://img.gamemale.com/album/201505/23/071008r9a354l1eel9aigg.gif',
          40,
        ],
        13: [
          'https://img.gamemale.com/album/201505/23/071009ssqlcmm5xm5gopsl.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/071009omhorl7bo2pyrhmp.gif',
          40,
        ],
      },
      骑士遗盔: {
        1: [
          'https://img.gamemale.com/album/201509/26/024157gndzyd7479b9bnb3.jpg',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201509/26/024157pwzikwik96gwo9wg.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201509/26/024157hkroo2cmhi25rhko.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201509/26/024158edglovvmomaj3a5v.gif',
          124,
        ],
      },
      艾尔尤因: {
        1: [
          'https://img.gamemale.com/album/201505/23/074332lrsjpeiz6epkzrjo.gif',
          82,
        ],
        2: [
          'https://img.gamemale.com/album/201505/23/074333fnvb37ob03t0ccuk.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/074333lif901j98xgcf11n.gif',
          82,
        ],
      },
      变形软泥: {
        1: [
          'https://img.gamemale.com/album/201602/17/173704elkqqcgulk7zk7l0.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201602/17/173706j9bxb16kp9rrbnp8.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201602/17/173708agqrxjycxttbrtqx.gif',
          40,
        ],
      },
      神圣十字章: {
        1: [
          'https://img.gamemale.com/album/201505/24/235452kjo7oxo7bu2me2ud.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/24/235453eg944j41q4t8q9uq.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/24/235453geqduzdpkohvlohd.gif',
          82,
        ],
      },
      超级名贵无用宝剑: {
        Max: [
          'https://img.gamemale.com/album/201405/01/175015mnobpnnpp88apyzu.gif',
          124,
        ],
      },
      十字叶章: {
        1: [
          'https://img.gamemale.com/album/201401/01/115605pg9ckg8u5goaz4u8.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/115607ukyssasdxhz48n2l.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/115609nau1lkwad7czd4dd.gif',
          40,
        ],
      },
      守望者徽章: {
        1: [
          'https://img.gamemale.com/album/201905/13/143550p26bib0lg688030z.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201905/13/143550pppz76pzmaa65ar5.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201905/13/143551whb3qnhp4gqe8led.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/13/143645pumizv3ivt5043xf.gif',
          40,
        ],
      },
      山猫图腾: {
        Max: [
          'https://img.gamemale.com/album/201905/27/163930k6o7szvyahz5tyov.gif',
          40,
        ],
      },
      眼镜蛇图腾: {
        Max: [
          'https://img.gamemale.com/album/201905/27/163944v16xxxcjvzlwf1x1.gif',
          40,
        ],
      },
      猎鹰图腾: {
        Max: [
          'https://img.gamemale.com/album/201905/27/163917k92k7ls57kyu9lll.gif',
          40,
        ],
      },
      石鬼面: {
        1: [
          'https://img.gamemale.com/album/201905/13/143512w4rjuijnorrrrpnz.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201905/13/143512y3drvvdv6r74hvdy.gif',
          40,
        ],
      },
      预知水晶球: {
        1: [
          'https://img.gamemale.com/album/201505/10/220233ogisshvwioolglve.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/10/220234q7plyphspk63hgk8.gif',
          40,
        ],
      },
      种植小草: {
        1: [
          'https://img.gamemale.com/album/201401/04/053001k5nhfhrhh24h05lr.png',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/191259gm9fs7u5wb5oltfk.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/191137xup7up18fuopgelj.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201401/01/191141q8lfb25s1u89nu48.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/191252tta07z10ed7tf0d3.png',
          40,
        ],
      },
      聚魔花盆: {
        1: ['', 40],
        2: [
          'https://img.gamemale.com/album/201401/01/135948mvv4vt11rakirty9.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201401/01/135955kkzx01gjgi8bjg0o.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201401/01/140003tq130jt00f5f0tv1.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201401/01/140012np4zzv4pn4vm4jch.gif',
          40,
        ],
        6: [
          'https://img.gamemale.com/album/201401/01/140020jpjnqc2nykzll38j.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/140037ny9sih0ik9qiabei.gif',
          40,
        ],
      },
      夜灯: {
        1: [
          'https://img.gamemale.com/album/201405/01/171125n1t9yotlyziz8dio.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201405/01/171128gyeeleedylau7elo.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201405/01/171132uvidi5auyda6iyv1.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201405/01/171136kqjtn7095qome00q.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201405/01/171139f5m5ab49llyllktb.gif',
          40,
        ],
        6: [
          'https://img.gamemale.com/album/201405/01/171142gcxbqooz0xjyo9pj.gif',
          40,
        ],
        7: [
          'https://img.gamemale.com/album/201405/01/171144q8mghewnhcoo8rwn.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/01/171148g6hn26jgilljulgz.gif',
          40,
        ],
      },
      种植菊花: {
        1: [
          'https://img.gamemale.com/album/201505/23/212248whtdbdmaandajnzq.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/23/212248kckqovkeqcvvfixt.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201505/23/212247sby8m8z8v78lnvh1.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/212247l4bir5tr8cb884le.gif',
          40,
        ],
      },
      发芽的种子: {
        1: [
          'https://img.gamemale.com/album/201505/23/132101kkhbt7ngbhgbghh8.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/23/132101oie1jw22mcwgxtdm.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201505/23/132102flcu1250sezkvs08.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/132102t7vkjukf3vzcj3mj.gif',
          40,
        ],
      },
      奇怪的紫水晶: {
        1: [
          'https://img.gamemale.com/album/201505/10/155736ve7lbebzve65vell.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/10/155736l65w95cbkk7c5w5d.gif',
          40,
        ],
      },
      婴儿泪之瓶: {
        1: [
          'https://img.gamemale.com/album/201506/30/022601prkzkzyv3xzdgx89.gif',
          40,
        ],
        2: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201506/30/022602qk3u3zx5b6vx66bw.gif',
          40,
        ],
      },
      雪王的心脏: {
        1: [
          'https://img.gamemale.com/album/201506/30/022607ascozyvzegz08y8x.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201506/30/022607g6k7i7aeazva9jce.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201506/30/022608hqvtsv2qs3t77sm0.gif',
          40,
        ],
      },
      这是一片丛林: {
        1: [
          'https://img.gamemale.com/album/201505/23/212240v28sdqczjd8sdqfg.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/23/212241gh8t1lyeew8ylt9y.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/212241brrmb3idbjzlkbqj.gif',
          40,
        ],
      },
      暗红矿土: {
        1: [
          'https://img.gamemale.com/album/201406/04/062921v240xqigc6mxqzgk.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202303/14/060826tkoxo80luuoqqeml.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/04/062915c1617j261rb122bj.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/04/062916lhphzyhue8w8qcjr.gif',
          40,
        ],
      },
      充满魔力的种子: {
        1: [
          'https://img.gamemale.com/album/201406/04/062928sm3l7875n3aambka.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202310/02/211843g0ldl970elxsxb97.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/04/062925s8d8rlrfxxms7be9.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201406/04/062924zm5staumrs2le7us.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/04/062922l09qfc010czbf64s.gif',
          40,
        ],
      },
      史莱姆养殖证书: {
        1: [
          'https://img.gamemale.com/album/201505/23/063533w0mhz847r606mb8g.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201505/23/063534e6xllv3felz4jf8j.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/201505/23/063534vopw46zku4ewy9oe.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/201505/23/063535nf11la4azia64ipi.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/201505/23/063535n0ca9c1w6pwdj161.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/201505/23/063536bs4737nnnn7uhhuq.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/album/201505/23/063536i13ukuxd73o1nfb1.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/201505/23/063537mnurnupldx7rlzol.gif',
          124,
        ],
        9: [
          'https://img.gamemale.com/album/201505/23/063537hnhhmlm13fmbzni9.gif',
          124,
        ],
        10: [
          'https://img.gamemale.com/album/201505/23/063538plh0b3akeizglogb.gif',
          124,
        ],
        11: [
          'https://img.gamemale.com/album/201505/23/063551s1duk5vmuwzronnt.gif',
          124,
        ],
        12: [
          'https://img.gamemale.com/album/201505/23/063552b1l1rlt62ag4tsg4.gif',
          124,
        ],
        13: [
          'https://img.gamemale.com/album/201505/23/063552kqwcczzy3bqpyg3g.gif',
          124,
        ],
        14: [
          'https://img.gamemale.com/album/201505/23/063553b74ydwo6y3addvad.gif',
          124,
        ],
        15: [
          'https://img.gamemale.com/album/201505/23/063553k5el0ffgxfvf0v9f.gif',
          124,
        ],
        16: [
          'https://img.gamemale.com/album/201505/23/063554xdn955b755ekxlq0.gif',
          124,
        ],
        17: [
          'https://img.gamemale.com/album/201505/23/063554a4vnwaxaxq84xezt.gif',
          124,
        ],
        18: [
          'https://img.gamemale.com/album/201505/23/063555tii4xn9r9s4wrr8n.gif',
          124,
        ],
        19: [
          'https://img.gamemale.com/album/201505/23/063555t4edb44njdb9nfd4.gif',
          124,
        ],
        20: [
          'https://img.gamemale.com/album/201505/23/063555uv2nhu2vzo2o66mz.gif',
          124,
        ],
        21: [
          'https://img.gamemale.com/album/201505/23/063619y4eyxz843h4l4efv.gif',
          124,
        ],
        22: [
          'https://img.gamemale.com/album/201505/23/063620cts5zw8e1ud8o4ee.gif',
          124,
        ],
        23: [
          'https://img.gamemale.com/album/201505/23/063620srr7wwnnfevk7r7v.gif',
          124,
        ],
        24: [
          'https://img.gamemale.com/album/201505/23/063621ao45vefejd4qdaoo.gif',
          124,
        ],
        25: [
          'https://img.gamemale.com/album/201505/23/063622qlcizj314zes3jhz.gif',
          124,
        ],
        26: [
          'https://img.gamemale.com/album/201505/23/063622rrarwnhtwtt2wnat.gif',
          124,
        ],
        27: [
          'https://img.gamemale.com/album/201505/23/063623w5oh5gysysvhayxs.gif',
          124,
        ],
        28: [
          'https://img.gamemale.com/album/201505/23/063623rlkuzupxdd5lbvkd.gif',
          124,
        ],
        29: [
          'https://img.gamemale.com/album/201505/23/063624caziipu7utht7n7m.gif',
          124,
        ],
        30: [
          'https://img.gamemale.com/album/201505/23/063624rcucoalg5daktjnl.gif',
          124,
        ],
        31: [
          'https://img.gamemale.com/album/201505/23/063701bk9o5wwbmztovtom.gif',
          124,
        ],
        32: [
          'https://img.gamemale.com/album/201505/23/063702g86u5m8sduhj8s6d.gif',
          124,
        ],
        33: [
          'https://img.gamemale.com/album/201505/23/063703evrsagajsqpvaunr.gif',
          124,
        ],
        34: [
          'https://img.gamemale.com/album/201505/23/063703rftedd4r7mgdfjj8.gif',
          124,
        ],
        35: [
          'https://img.gamemale.com/album/201505/23/063704pft0x0o1zoocxndn.gif',
          124,
        ],
        36: [
          'https://img.gamemale.com/album/201505/23/063704w6d6326abab5i12r.gif',
          124,
        ],
        37: [
          'https://img.gamemale.com/album/201505/23/063705uuqk1liisup6u061.gif',
          124,
        ],
        38: [
          'https://img.gamemale.com/album/201505/23/063705mnypennn3pppvdr3.gif',
          124,
        ],
        39: [
          'https://img.gamemale.com/album/201505/23/063705wazf16pzfcara1r7.gif',
          124,
        ],
        40: [
          'https://img.gamemale.com/album/201505/23/063706n2ak0i6hui2ytiz5.gif',
          124,
        ],
        41: [
          'https://img.gamemale.com/album/201505/23/063730pw6r84rij6el9lza.gif',
          124,
        ],
        42: [
          'https://img.gamemale.com/album/201505/23/063730i8ovhzm3oh7ibmzw.gif',
          124,
        ],
        43: [
          'https://img.gamemale.com/album/201505/23/063731wmoqv42jvof2mk94.gif',
          124,
        ],
        44: [
          'https://img.gamemale.com/album/201505/23/063731kui0ttgz08d0595u.gif',
          124,
        ],
        45: [
          'https://img.gamemale.com/album/201505/23/063732nffi4p84l1y8p1ym.gif',
          124,
        ],
        46: [
          'https://img.gamemale.com/album/201505/23/063732tl3tgnxz0gwt4ty7.gif',
          124,
        ],
        47: [
          'https://img.gamemale.com/album/201505/23/063733uqdk0idnoxgbcbia.gif',
          124,
        ],
        48: [
          'https://img.gamemale.com/album/201505/23/063733lgzrfbe57utp4pp4.gif',
          124,
        ],
        49: [
          'https://img.gamemale.com/album/201505/23/063734lnb48m6bna566a46.gif',
          124,
        ],
        50: [
          'https://img.gamemale.com/album/201505/23/063734ne9oae4apo4gcang.gif',
          124,
        ],
        51: [
          'https://img.gamemale.com/album/201505/23/063748vnnaafyfzd80d0b0.gif',
          124,
        ],
        52: [
          'https://img.gamemale.com/album/201505/23/063749pwkjwgqqicewhhr9.gif',
          124,
        ],
        53: [
          'https://img.gamemale.com/album/201505/23/063749vgagnxyvqrsg3ssd.gif',
          124,
        ],
        54: [
          'https://img.gamemale.com/album/201505/23/063750ixithzbhr6nb6iid.gif',
          124,
        ],
        55: [
          'https://img.gamemale.com/album/201505/23/063750vqrqzghg187h0rbp.gif',
          124,
        ],
        56: [
          'https://img.gamemale.com/album/201505/23/063751kgjtjmeipsqm6xsi.gif',
          124,
        ],
        57: [
          'https://img.gamemale.com/album/201505/23/063751lq74qx9722cc9zyd.gif',
          124,
        ],
        58: [
          'https://img.gamemale.com/album/201505/23/063752aggqbhcpg8k7q9pe.gif',
          124,
        ],
        59: [
          'https://img.gamemale.com/album/201505/23/063752k05081n3zmn5xtl9.gif',
          124,
        ],
        60: [
          'https://img.gamemale.com/album/201505/23/063753ocrzkgrtkrsbckrk.gif',
          124,
        ],
        61: [
          'https://img.gamemale.com/album/201505/23/063753hoya6uccff1o3duy.gif',
          124,
        ],
        62: [
          'https://img.gamemale.com/album/201505/23/063754r9n79l2zzeq9pqfe.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/063754nbgeezibyi48bkog.gif',
          124,
        ],
      },
      种植菠菜: {
        1: [
          'https://img.gamemale.com/album/201405/01/171301kqvy6dvkkcdgdgi3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201405/01/171302sxzsi3kd3xhobonn.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201405/01/171303crqorqqd6zq9bzb6.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201405/01/171306n9lk1ko5yq1ggd5k.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201405/01/171311mjj9mc9lsbc7kj9z.gif',
          40,
        ],
        6: [
          'https://img.gamemale.com/album/201405/01/171257iz5qaphahad4prdp.gif',
          40,
        ],
        7: [
          'https://img.gamemale.com/album/201405/01/171255jxvggkywixsh7qez.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/01/171258fmvd0qdqqh5d3wcd.gif',
          40,
        ],
      },
      勇者与龙之书: {
        1: [
          'https://img.gamemale.com/album/201506/30/052451g28wj4d8xkahdl6z.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201506/30/052453w9md0sd32kd53mm3.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/201506/30/052454e4path6a4pt5akp6.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/201506/30/052456q3skbmybryymrssa.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/201506/30/052457g8k9dwuoekouo279.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/201506/30/052458cresf1dzq8l8d88a.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/album/201506/30/052459pnqhuhxqhxu9nv90.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/201506/30/052500wnuom40997tn0pbt.gif',
          124,
        ],
        9: [
          'https://img.gamemale.com/album/201506/30/052500s10gjrr8j158m8a1.gif',
          124,
        ],
        10: [
          'https://img.gamemale.com/album/201506/30/052501f9rprb4hj9uhvb9u.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201506/30/052502dvq83ddrq08xc33d.gif',
          40,
        ],
      },
      微笑的面具: {
        1: [
          'https://img.gamemale.com/album/201401/01/191034vvnpn72cimmfvci7.png',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/191023istdd3vsvkfsitt3.png',
          40,
        ],
        3: ['', 40],
        4: [
          'https://img.gamemale.com/album/201401/01/191037ixz77stdxx4ihzsm.png',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201401/01/191026pzq1qlsmkqmy15mm.png',
          40,
        ],
        Max: ['', 40],
      },
      浪潮之歌: {
        1: [
          'https://img.gamemale.com/album/201903/25/125728xneaguzlbhdbgfnz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202201/30/185253p7p1puhphkluzj5p.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201903/23/152214aa2z2bsjfb31onjn.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201903/23/152213iz2opzd1ddridu8a.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201903/23/152213ra44h7coenacuvzf.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/forum/202201/30/185239jbbhsxs8hnrb3dxv.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/forum/202201/30/185236ugggahhjuhaffexo.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/forum/202201/30/185235fy8krl3ipryyr3ry.gif',
          124,
        ],
        9: [
          'https://img.gamemale.com/forum/202201/30/185235o1vv0g4m6g4wz7hv.gif',
          124,
        ],
        10: [
          'https://img.gamemale.com/album/201909/12/223433t8xo5cke7v2222lz.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/24/230649r0a8qd8jv3xx4rx3.gif',
          40,
        ],
      },
      章鱼小丸子: {
        1: [
          'https://img.gamemale.com/album/201605/02/190017xrggpmz5mm540fbf.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201605/02/190018sse467j756l6ku6k.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201605/02/190018yprf2grlre5k5ll7.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201605/02/190018oj1a1az9nnag8alb.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201605/02/190019q51b50e7rb33crj5.gif',
          40,
        ],
      },
      流失之椅: {
        1: [
          'https://img.gamemale.com/album/201405/01/171208sb6cvvb4c4gxlcrv.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201405/01/171210mzycvmree4rc2xh2.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201405/01/171211ykqzb3vjvtz3grjj.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201405/01/171217n5hjsj68p37xj5sw.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201405/01/171222mng6y1m6gymf1qhg.gif',
          40,
        ],
        6: [
          'https://img.gamemale.com/album/201405/01/171223xjo99zq55nprqxwq.gif',
          40,
        ],
        7: [
          'https://img.gamemale.com/album/201405/01/171224d21s8w8vmw717avs.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/01/171226g8b8dzdnhgfqh7gf.gif',
          40,
        ],
      },
      金钱马车: {
        1: [
          'https://img.gamemale.com/album/201401/03/051322sfammplfp8j0xflf.gif',
          82,
        ],
        2: [
          'https://img.gamemale.com/album/201401/03/051333jgkmzk8i8g4m74vv.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201401/03/051359a12uq20iiss0i9x6.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201401/03/051443df7gfcr4r1jc1tgv.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/201401/03/051451ebn2b7l5b9nlp8x5.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/201401/03/051521k7nna23nzm4zp0dd.gif',
          82,
        ],
        7: [
          'https://img.gamemale.com/album/201401/03/051547cyzgohq5jzm2kqlo.gif',
          82,
        ],
        8: [
          'https://img.gamemale.com/album/201401/03/051556pht63z236nnnjpvs.gif',
          82,
        ],
        9: [
          'https://img.gamemale.com/album/201401/03/051559eyrcq8q0209sssc5.gif',
          82,
        ],
        10: [
          'https://img.gamemale.com/album/201401/03/051620b08ia7p58tr3nt3n.gif',
          82,
        ],
        11: [
          'https://img.gamemale.com/album/201406/12/004129f3vfmmvgy8zvffyk.gif',
          82,
        ],
        12: [
          'https://img.gamemale.com/album/201401/03/051642ullldgw8ugmxbgcu.gif',
          82,
        ],
        13: [
          'https://img.gamemale.com/album/201401/03/051707ukaqc1ikc20fiigf.gif',
          82,
        ],
        14: [
          'https://img.gamemale.com/album/201401/03/051713rxf98quv4b4tn9no.gif',
          82,
        ],
        15: [
          'https://img.gamemale.com/album/201401/03/051738i23x7gqg06lnxs0q.gif',
          82,
        ],
        16: [
          'https://img.gamemale.com/album/201401/03/051749umhhqhqhhb1um4c4.gif',
          82,
        ],
        17: [
          'https://img.gamemale.com/album/201401/03/051812j0w9xux0q3lclb0u.gif',
          82,
        ],
        18: [
          'https://img.gamemale.com/album/201401/03/051843athyoxqh8xys550e.gif',
          82,
        ],
        19: [
          'https://img.gamemale.com/album/201401/03/051914ewsjmgw2arz2zwdh.gif',
          82,
        ],
        20: [
          'https://img.gamemale.com/album/201401/03/051920fa3no2p9n8p2hn3z.gif',
          82,
        ],
        21: [
          'https://img.gamemale.com/album/201401/03/051947w7thlgigc076701l.gif',
          82,
        ],
        22: [
          'https://img.gamemale.com/album/201401/03/052011zy88fabfucby8s21.gif',
          82,
        ],
        23: [
          'https://img.gamemale.com/album/201401/03/052019a1vr3tde11t109t1.gif',
          82,
        ],
        24: [
          'https://img.gamemale.com/album/201401/03/052029c25bybpx3xh455y3.gif',
          82,
        ],
        25: [
          'https://img.gamemale.com/album/201401/03/052049yhhqr5zgqg1c6j2o.gif',
          82,
        ],
        26: [
          'https://img.gamemale.com/album/201401/03/052054plla35mllm66i0jl.gif',
          82,
        ],
        27: [
          'https://img.gamemale.com/album/201401/03/052401lubbjblm3l8jlblj.gif',
          82,
        ],
        28: [
          'https://img.gamemale.com/album/201401/03/052407j41nzi94uh4c15qf.gif',
          82,
        ],
        29: [
          'https://img.gamemale.com/album/201401/03/052411oym2hc942242cz2o.gif',
          82,
        ],
        30: [
          'https://img.gamemale.com/album/201401/03/052437mmu45rmpca4ncme4.gif',
          82,
        ],
        31: [
          'https://img.gamemale.com/album/201401/03/052538kvzpk5ubyxpxyzxt.gif',
          82,
        ],
        32: [
          'https://img.gamemale.com/album/201406/12/004130egg0hghh6hh4495g.gif',
          82,
        ],
        33: [
          'https://img.gamemale.com/album/201401/03/052605skx8825jl8khp4ul.gif',
          82,
        ],
        34: [
          'https://img.gamemale.com/album/201401/03/052613py0fhdtt7cphtovt.gif',
          82,
        ],
        35: [
          'https://img.gamemale.com/album/201401/03/052633wu11q1k1omsuu3qb.gif',
          82,
        ],
        36: [
          'https://img.gamemale.com/album/201401/03/052701e5dbdbn045zrs00u.gif',
          82,
        ],
        37: [
          'https://img.gamemale.com/album/201401/03/052730mgy5yogtorr3ytzu.gif',
          82,
        ],
        38: [
          'https://img.gamemale.com/album/201401/03/052739wqvcsuwe4chl4v1v.gif',
          82,
        ],
        39: [
          'https://img.gamemale.com/album/201401/03/052800musl2iqk93ls9gxq.gif',
          82,
        ],
        40: [
          'https://img.gamemale.com/album/201401/03/052819zyhncyhxhcohvnxn.gif',
          82,
        ],
        41: [
          'https://img.gamemale.com/album/201406/12/004131azu88b2unhb8bh3s.gif',
          82,
        ],
        42: [
          'https://img.gamemale.com/album/201401/03/052917retef7xfeyf7feff.gif',
          82,
        ],
        43: [
          'https://img.gamemale.com/album/201401/03/052923mtiqiqomafmncdli.gif',
          82,
        ],
        44: [
          'https://img.gamemale.com/album/201401/03/052927tsq4lbqsjvs9lpqj.gif',
          82,
        ],
        45: [
          'https://img.gamemale.com/album/201401/03/052930xkj9yqykd7k77nly.gif',
          82,
        ],
        46: [
          'https://img.gamemale.com/album/201401/03/052950ijb7i0iymiw0jb2x.gif',
          82,
        ],
        47: [
          'https://img.gamemale.com/album/201401/03/052955zgrlj5pnigmm0wmj.gif',
          82,
        ],
        48: [
          'https://img.gamemale.com/album/201401/03/053015h9o90i890wz0nwio.gif',
          82,
        ],
        49: [
          'https://img.gamemale.com/album/201401/03/053042cak7kbxz6aaaxxbz.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/03/053047fxx0k3j7y88728mx.gif',
          82,
        ],
      },
      木柴堆: {
        1: [
          'https://img.gamemale.com/album/201406/04/062908a274wdv8h4phhn55.jpg',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201406/04/062913f6lc9r9z1qv9vqpc.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/04/062911x57nm5tnurffbeun.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/04/062910ru601j1miimzumbm.gif',
          40,
        ],
      },
      神秘的邀请函: {
        1: [
          'https://img.gamemale.com/album/201406/04/062955tkrrg9r2oy29ddl2.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201406/04/062958d80pgig70igdyy0g.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201406/04/062957lvvffoqufhkz1h5d.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201406/04/063001n3d2e3oro82d2i37.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201406/04/062951c99sgjwk7hwhp49g.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/04/062953at6pb6z6zgfz6gfu.gif',
          40,
        ],
      },
      诺曼底号: {
        1: [
          'https://img.gamemale.com/album/201405/01/171603c3w7yxde7ygs2ww2.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/201405/01/181512scdxbdc3uf0ucf0c.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/201405/01/181516bmbckkmpbj3tmjw5.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/201405/01/181521thx5ivpgufmffuev.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/201405/01/181526k0fv0eup7fe5pecq.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/01/171624ef8ab4bwzrrrrbqf.gif',
          124,
        ],
      },
      德拉克魂匣: {
        1: ['', 40],
        2: [
          'https://img.gamemale.com/album/201906/15/135827j1q81hlxgmx2vmut.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201906/15/135828a39ugg996e5qu898.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/135829wj5j7qf7kq3qmmdz.gif',
          40,
        ],
      },
      圣甲虫秘典: {
        1: [
          'https://img.gamemale.com/album/201906/15/135814k2bz24ts5s26ob2i.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201906/15/135815pfogpnp5sfdyqqaw.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201906/15/135815ff9202zxw9lgzr3f.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/135817nbizvr1i51ia55sh.gif',
          40,
        ],
      },
      TRPG纪念章: {
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/forum/202309/20/155731pqv5hhq0wi5558eh.gif',
          40,
        ],
      },
      堕落飨宴: {
        1: ['', 124],
        2: ['', 124],
        3: ['', 124],
        4: ['', 124],
        5: ['', 124],
        6: ['', 124],
        7: ['', 124],
        8: ['', 124],
        9: ['', 124],
        10: ['', 124],
        11: ['', 124],
        12: ['', 124],
        13: ['', 124],
        14: ['', 124],
        15: ['', 124],
        16: ['', 124],
        17: ['', 124],
        18: ['', 124],
        19: ['', 124],
        20: ['', 124],
        21: ['', 124],
        22: ['', 124],
        Max: [
          'https://img.gamemale.com/album/201406/30/212947ownnplliaopkoon1.gif',
          124,
        ],
      },
      牧羊人: {
        1: [
          'https://img.gamemale.com/album/201401/01/192055w11popewpdedxoxp.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201401/01/192058zt7pjdbdwkadrcbz.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201401/01/192101yex7ui47hvb4jaln.gif',
          40,
        ],
      },
      黄色就是俏皮: {
        1: [
          'https://img.gamemale.com/album/201405/01/171901esspa6ssj9pzo7j9.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/01/171908qgoakyepa3d55eoy.gif',
          82,
        ],
      },
      骑兽之子: {
        1: [
          'https://img.gamemale.com/album/201405/01/171924l2fl22hk9lojbod7.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201405/01/181923pyw1tojy1d66dffw.gif',
          124,
        ],
      },
      禽兽扒手: {
        1: ['', 40],
        2: ['', 124],
        3: ['', 40],
        4: [
          'https://img.gamemale.com/album/201505/23/070312d2g4ijd442izjjjh.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/201505/23/070312s65z653wzc3lvq63.gif',
          40,
        ],
        6: ['', 124],
        7: [
          'https://img.gamemale.com/album/201505/23/070314ru4zanqch73ua7vz.gif',
          40,
        ],
        8: ['', 124],
        9: [
          'https://img.gamemale.com/album/201505/23/070316o9jcfoz4eg98842m.gif',
          40,
        ],
        10: [
          'https://img.gamemale.com/album/201505/23/070317qtrutra15rujjdu5.gif',
          124,
        ],
        11: [
          'https://img.gamemale.com/album/201505/23/070317afka3a331r3gao2f.gif',
          40,
        ],
        12: ['', 124],
        13: [
          'https://img.gamemale.com/album/201505/23/070319zhydy6lm5ndcmbml.gif',
          40,
        ],
        14: [
          'https://img.gamemale.com/album/201505/23/070320lbenfgxc7sxz2e2b.gif',
          124,
        ],
        15: [
          'https://img.gamemale.com/album/201505/23/070320lifezxjfqpw4hx0h.gif',
          40,
        ],
        16: [
          'https://img.gamemale.com/album/201505/23/070321uqsw1rs5kv8xkrys.gif',
          124,
        ],
        17: [
          'https://img.gamemale.com/album/201505/23/070322j2x5nxvn27vxbimb.gif',
          40,
        ],
        18: ['', 124],
        19: [
          'https://img.gamemale.com/album/201505/23/070323dnnynyocyyhc7yz5.gif',
          40,
        ],
        20: [
          'https://img.gamemale.com/album/201505/23/070324c8sazsfzjaigj77i.gif',
          124,
        ],
        21: [
          'https://img.gamemale.com/album/201505/23/070324fhqhqjvubkkb1mqz.gif',
          40,
        ],
        22: [
          'https://img.gamemale.com/album/201505/23/070325snuznu8ubur8n3tu.gif',
          124,
        ],
        23: [
          'https://img.gamemale.com/album/201505/23/070325xyqdtu0psewyzka8.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201505/23/070327ye9mgewqi9ieqm9g.gif',
          124,
        ],
      },
      野兽之子: {
        1: [
          'https://img.gamemale.com/album/201904/25/215934nntg7rcecucmnstr.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201904/25/215933tfonxf5xigig6f11.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201904/25/215933v44se4lk8vqattzx.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201904/25/215932hj3prjjmzoxpzx6b.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201904/25/215932j062t60xte4s76rm.gif',
          40,
        ],
      },
      结晶卵: {
        1: [
          'https://img.gamemale.com/album/201908/07/000510brxu5527532dtj5n.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201908/07/000511ft7zaarazsfsmtfb.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201908/07/000511zzaxrerhlllxexac.gif',
          40,
        ],
      },
      暮色卵: {
        1: [
          'https://img.gamemale.com/album/201908/07/000518cdhiz6zidwgf80a4.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201908/07/000519zdrihlu7z87uh7dr.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201908/07/000520jogqhe954y1h4lel.gif',
          40,
        ],
      },
      青鸾蛋: {
        1: [
          'https://img.gamemale.com/album/201910/14/153359x6d9nffaspwpvzn7.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/14/153359ej8aajzjr0f9r0ov.gif',
          40,
        ],
      },
      电磁卵: {
        1: [
          'https://img.gamemale.com/album/201910/06/150702zttt5q0ctv6f6zzl.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201910/06/150702bv698oii21e07sn8.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201910/06/150702wi3lszvsbthlhdxs.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/06/150702cb18pzdqcqkccudc.gif',
          40,
        ],
      },
      珊瑚色礁石蛋: {
        1: [
          'https://img.gamemale.com/album/201912/14/153936wrv7qcockbpbvbvb.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202001/26/122212itz6u146rt1c4144.gif',
          40,
        ],
      },
      月影蛋: {
        1: [
          'https://img.gamemale.com/album/201912/12/141004j1gf13h1nscccsp3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201912/12/141004pk1e1dk2kyq1j995.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/12/141005yetz9z2xnmlketlb.gif',
          40,
        ],
      },
      马戏团灰蛋: {
        1: [
          'https://img.gamemale.com/album/201912/16/151813vt3p30t3pgzq3wt3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201912/16/151814hxha9qez6067ja7z.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/16/155350owigb0u0ggjdkwkk.gif',
          40,
        ],
      },
      郁苍卵: {
        1: [
          'https://img.gamemale.com/album/201910/06/152248t7hxs70s76tsiwsz.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/06/152248jk2zlg924uk6kxj2.gif',
          40,
        ],
      },
      熔岩蛋: {
        1: [
          'https://img.gamemale.com/album/201912/12/140920xybvdi99sqibpa1b.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/12/140921uai9l80aaaxifluc.gif',
          40,
        ],
      },
      灵鹫蛋: {
        1: [
          'https://img.gamemale.com/album/202006/04/184708vzi1quais050ksm0.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202006/04/184708wpk4667r6j7k99kg.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202006/04/184709rivf16faiok6wvzv.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202006/04/184710hs3ktk7tgkr6fby6.gif',
          40,
        ],
      },
      血鹫蛋: {
        1: [
          'https://img.gamemale.com/album/202006/04/184720i8moca3cfk1x39yo.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202006/04/184721x2p54ia5fvqd5i5q.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202006/04/184721sqs6g2e0ge0hyhqd.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202006/04/184722anwvqcqc9qp7qdqv.gif',
          40,
        ],
      },
      软泥怪蛋: {
        1: [
          'https://img.gamemale.com/album/202008/03/121119fs0bbom2jbct10mn.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202008/03/121120b1mi5ixqkqzc4nji.gif',
          40,
        ],
      },
      螺旋纹卵: {
        1: [
          'https://img.gamemale.com/album/202012/17/201031hi4bx04vngl4b22x.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202012/17/201031xsvslzy1ib414zk4.gif',
          40,
        ],
      },
      万圣彩蛋: {
        1: [
          'https://img.gamemale.com/album/202012/06/161531trqiireccyazvejn.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202012/06/161536ti15txzxg80ko59y.gif',
          40,
        ],
      },
      幽光彩蛋: {
        1: [
          'https://img.gamemale.com/album/202012/17/201101rmmmmbyygsc8rcmm.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202012/17/201101lcnvskqkqiilnide.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202012/17/201102ftzmlu4jmkcsy49z.gif',
          40,
        ],
      },
      沙漠羽蛋: {
        1: [
          'https://img.gamemale.com/album/202012/17/201039nkzrsg6qm1u6icqp.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202012/17/201039iuxf76n57n9iz7sn.gif',
          40,
        ],
      },
      林中之蛋: {
        1: [
          'https://img.gamemale.com/album/202106/12/193544i2z7dicpd9luaia4.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/12/193544i424grt2dx4ty1c7.gif',
          40,
        ],
      },
      五彩斑斓的蛋: {
        1: [
          'https://img.gamemale.com/album/202201/26/151626cu9rb9llfglib0df.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202201/26/151627cxot0t0xvccuxeoi.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/26/151627g1yz9ms5kysrdad8.gif',
          40,
        ],
      },
      血红色的蛋: {
        1: [
          'https://img.gamemale.com/forum/202504/22/171504ltsuhpbh1qzh4b9q.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202201/26/151635e053o6qyxkq0oo3k.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/26/151636d8ri6g5orkx6hyzu.gif',
          40,
        ],
      },
      海边的蛋: {
        1: [
          'https://img.gamemale.com/album/202205/30/153834dox77eo4y847xez4.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/153834oox4apxcrxxriprf.gif',
          40,
        ],
      },
      新手蛋: {
        1: [
          'https://img.gamemale.com/album/202209/08/220411r4ykckemz4e1kirc.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/220412gxl96sx00bs9l90p.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202209/08/220412tod17jolwuj4d4lo.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220412ix799xdawmmz7ycm.gif',
          40,
        ],
      },
      深渊遗物: {
        1: [
          'https://img.gamemale.com/album/202209/08/220425nw6klwk5kl86li6l.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/220425kmbqxbfboo6m6xms.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220426ouunnj2rujd2rdro.gif',
          40,
        ],
      },
      '【限定】深渊遗物': {
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/album/202209/08/220424iwn7hkdmhdmn6vnv.gif',
          40,
        ],
      },
      小阿尔的蛋: {
        1: [
          'https://img.gamemale.com/album/202301/20/210106yuor25o3sq73oxl2.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202301/20/210107stmsdtkj3buntn5n.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202301/20/210107sktki9pov99z2wtk.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202301/20/210107p5215jn25r1zuj55.gif',
          40,
        ],
      },
      红石: {
        1: [
          'https://img.gamemale.com/album/201908/07/000502nx9hzsvsvvctrsva.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201908/07/000502v9s77su755oflf5s.gif',
          40,
        ],
      },
      幽灵竹筒: {
        1: [
          'https://img.gamemale.com/album/201910/06/143356aerlyal44ygoaztd.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201910/06/143356p3beubn981613g6u.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/06/143356ibiyky6in6dizsns.gif',
          40,
        ],
      },
      神秘的红茶: {
        1: [
          'https://img.gamemale.com/album/201910/06/134346tesirrn14it4e3z1.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201910/06/134347mnvsnq9be8pespe2.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/06/134023ibsp0pthowg4bojo.gif',
          40,
        ],
      },
      种植土豆: {
        1: [
          'https://img.gamemale.com/album/201910/06/135615qfbjr0g0r115fswo.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201910/06/141001rrlyrj1xodzz1yjp.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201910/06/141001a55nx8h8dign55dd.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201910/06/135342p3xz63odr8cu33s3.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201910/06/135342ku1h6mrycnyw1wdo.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/06/135343szu77bbubn7awaca.gif',
          40,
        ],
      },
      用过的粪桶: {
        1: [
          'https://img.gamemale.com/album/201911/21/175026ujxgk8ck463qcqrr.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201911/21/175026o6fuf0g96fxuit97.gif',
          40,
        ],
      },
      冒险用面包: {
        1: [
          'https://img.gamemale.com/forum/202001/16/130553fpjncjphz90hnnh8.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201912/12/141705lzy8em9ueeedasmq.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/12/141705qkbza5b6b8ds6mm1.gif',
          40,
        ],
      },
      海螺号角: {
        1: [
          'https://img.gamemale.com/album/201912/23/151131pb6w8dw6eebewwe1.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201912/23/151132gttw79m7boxb5ttt.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/14/153848f5x6robaqp2k46l2.gif',
          40,
        ],
      },
      沙漠神灯: {
        1: [
          'https://img.gamemale.com/album/201912/12/141637yxk7xoyt86ux5g8g.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201912/12/141637cnvo4v3ssf36uqtn.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/12/141638ya87yxvakkvvraxr.gif',
          40,
        ],
      },
      暖心小火柴: {
        1: ['', 40],
        2: [
          'https://img.gamemale.com/forum/202106/18/001234cozvb7foio88otfd.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201912/12/141650czkwlrccg5vi5d5o.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/13/024024jpf7zm43n6ytyat2.gif',
          40,
        ],
      },
      神秘的漂流瓶: {
        1: [
          'https://img.gamemale.com/album/201912/12/141958nmoqz5nno4o2ctmm.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201912/12/142000q4sesx9ky4xdhdye.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201912/12/143936kkkngg5i6gvne3ze.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201912/12/142004i1bc8gok2kp1aa1b.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201912/12/142008zjxmcjmea8pakzyr.gif',
          40,
        ],
        6: [
          'https://img.gamemale.com/album/201912/12/142009dzwm525ar5fnhzam.gif',
          40,
        ],
        7: [
          'https://img.gamemale.com/album/201912/12/142010pr0zuodsrod7j9jk.gif',
          40,
        ],
        8: [
          'https://img.gamemale.com/album/201912/12/142011htgjejmc2s11676p.gif',
          40,
        ],
        9: [
          'https://img.gamemale.com/album/201912/12/142012f18b0rnebboj0m0z.gif',
          40,
        ],
        10: [
          'https://img.gamemale.com/album/201912/12/143625zscxxvrx5mskcrdo.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/22/132618l128k5vr4x865o88.gif',
          40,
        ],
      },
      冒险用绷带: {
        1: [
          'https://img.gamemale.com/album/202008/03/121107sv0blbsvhmmxvt5m.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202008/03/121107kekxz2hbxld2dalh.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202008/03/121108wfozx6gnnqfg3aad.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202008/03/121108t10ojih1ihhjztc4.gif',
          40,
        ],
      },
      宝箱内的球: {
        1: [
          'https://img.gamemale.com/album/202008/03/120938hilzyauj1h1xyelx.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202008/03/120938axx77jfdjt0m7dtf.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202008/03/120939sysss74uzszssu8q.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202008/03/120939rnodx43xgrz4arfe.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202008/03/120940xo5bswtt0dtvzt09.gif',
          40,
        ],
      },
      'SCP-s-1889': {
        1: [
          'https://img.gamemale.com/album/202008/03/120829e2syrwzli153i3a1.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202008/03/120831ggoz7u857e5lo56g.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202008/03/120835hw00k1qi3kw68ioz.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202008/03/120840lfsxynxlyfx3ofqa.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202008/03/120842udt1t3id3l29xvu2.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202008/03/120846y2ocn2752ccvnccy.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202008/03/120847xyrwyxxhehxumwhp.gif',
          40,
        ],
      },
      GHOST: {
        1: [
          'https://img.gamemale.com/album/202008/03/120817g9965sausau596r4.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202008/03/120817hbhv9b1db5hxrdk1.gif',
          40,
        ],
        3: ['', 40],
        4: ['', 40],
        5: ['', 40],
        6: ['', 40],
        Max: [
          'https://img.gamemale.com/album/202008/03/120819f85b558m8ess56zv.gif',
          40,
        ],
      },
      GM論壇初心者勛章: {
        1: [
          'https://img.gamemale.com/album/202009/19/001839hluuahzsf8g32aau.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202009/19/001841iyii41izo7o112a2.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202009/19/001846k88tvpth9jus9yzu.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202009/19/001848q8qhul8qumemf48n.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202009/19/001905w2mh2725z4sj3226.gif',
          40,
        ],
      },
      社畜专用闹钟: {
        1: [
          'https://img.gamemale.com/album/202012/17/200945ow3wdwmm25zvr022.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202012/17/200945wywvyivu00qlsugl.gif',
          40,
        ],
      },
      冒险用宝箱: {
        1: [
          'https://img.gamemale.com/album/202102/09/095347taa34iwsrsacnfj8.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202102/09/093538tj29vsi3ajat7sz7.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202102/09/093539wiw4o8fta4m98hzy.gif',
          40,
        ],
      },
      羽毛笔: {
        1: [
          'https://img.gamemale.com/album/202102/09/093558b88k3sp23402q2k8.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202102/09/093558rt272wu7wmvkmt5c.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202102/09/093558nk9cba0kkcc8cqpp.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202102/09/093559dyxaqhv73np7nqph.gif',
          40,
        ],
      },
      'One Ring': {
        1: [
          'https://img.gamemale.com/album/202201/26/150826buuemmvgsrsb9xms.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202201/26/150827vufzeeauuuc4s5uz.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202201/26/150828z2261fak9t28gfkb.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202201/26/151514jnn2hro3r3op3vrg.gif',
          124,
        ],
        5: ['https://thumbsnap.com/i/PMiQHtNk.gif?0527', 124],
        6: ['https://thumbsnap.com/i/WkpmxzrZ.gif?0527', 124],
        7: ['https://thumbsnap.com/i/1YooFb2Z.gif?0527', 124],
        8: [
          'https://img.gamemale.com/album/202201/26/150830ra2abgt2ctqzbazj.gif',
          124,
        ],
        9: ['https://thumbsnap.com/i/LiDVpRtA.gif?0527', 124],
        10: ['https://thumbsnap.com/i/KGvThK9R.gif?0527', 124],
        11: [
          'https://img.gamemale.com/album/202201/26/150831tgtddztx3akitxxa.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/26/150831fkmzx8zbbkb5k68e.gif',
          82,
        ],
      },
      秘密空瓶: {
        1: [
          'https://img.gamemale.com/album/202205/30/153853iqmkalb0ij184z2o.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/153853acmf2noesd8k9fzf.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/153854mpo39w3zaxouiktp.gif',
          40,
        ],
      },
      梦中的列车: {
        1: [
          'https://img.gamemale.com/album/202205/30/153950wp84cj31jfq8nr9e.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/153951wnzuu0k30q21k221.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202205/30/153954zaknwoqlhoiiwilc.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202205/30/153957iapykb3fq55b5tjp.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/forum/202206/11/012441ktg13gxg34tggtgi.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202205/30/154002gguxp9yjzxgnnjjz.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/forum/202206/11/012448zdxaahx3xdyy3va4.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/202205/30/154011rwzs30aslssscere.gif',
          124,
        ],
        9: [
          'https://img.gamemale.com/album/202205/30/154016hh16ods26t9p2tp2.gif',
          124,
        ],
        10: [
          'https://img.gamemale.com/forum/202206/11/012457thwqzq44hvhhm8hh.gif',
          124,
        ],
        11: [
          'https://img.gamemale.com/forum/202206/11/012501xlwxj3282e6q2kq6.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/154024iwff9hfi5b30i05u.gif',
          40,
        ],
      },
      冒险专用绳索: {
        1: [
          'https://img.gamemale.com/album/201907/27/193222pr6tpstpjd9sru29.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201907/27/193338gdzwwauweaziwzed.gif',
          40,
        ],
      },
      '赫尔墨斯·看守者之杖': {
        1: [
          'https://img.gamemale.com/album/201908/07/000452mvzwvbnkw7l6vgcj.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/201910/15/155122f6ois6l66o97l66t.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201908/07/000452bjfvd127665pxm2x.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201908/07/000452ztxxhahio8tdvdx1.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201908/07/000453r24zutgt9z9zqt9g.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201908/07/000453r45ll444400c8r4z.gif',
          40,
        ],
      },
      巴啦啦小魔仙棒: {
        1: [
          'https://img.gamemale.com/album/201910/06/142623cftvcecoed9lj8jl.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201910/06/142404ih2t7ovgozpwxxoa.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/06/142404a9tg6jeo94ju4oig.gif',
          40,
        ],
      },
      蔷薇骑士之刃: {
        1: [
          'https://img.gamemale.com/album/201912/16/151737ohl7t7ph7at7lsaa.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/16/151737siyiq7wbr49y9bgf.gif',
          40,
        ],
      },
      狩猎用小刀: {
        1: [
          'https://img.gamemale.com/album/201912/22/233522ndao49lr7ogroboj.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201912/22/233523kqy5x66w115oaooy.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201912/22/233524nzccirm32qm9rcol.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/22/233525ln04agzzn7hn771p.gif',
          40,
        ],
      },
      生锈的海盗刀枪: {
        1: [
          'https://img.gamemale.com/album/201912/21/010703hqgwwlwkkqjrgkj2.gif',
          82,
        ],
        2: [
          'https://img.gamemale.com/album/201912/21/010303vvu4ggpk6x39nkdm.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/21/010306i7t1w7xvc749ccyt.gif',
          82,
        ],
      },
      日荒戒指: {
        1: [
          'https://img.gamemale.com/album/201912/12/142022fhwmpww2mh5nv8xv.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/12/142022heuozgz7a1214am6.gif',
          40,
        ],
      },
      月陨戒指: {
        1: [
          'https://img.gamemale.com/album/201912/12/142024syr4x15d525yoo5d.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/12/142025gervz2pc0x60efrz.gif',
          40,
        ],
      },
      星芒戒指: {
        1: [
          'https://img.gamemale.com/album/201912/12/142023s57s3bgiiz7z7ir8.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/12/142023peeeabemvj2jb1jt.gif',
          40,
        ],
      },
      琉璃玉坠: {
        1: [
          'https://img.gamemale.com/album/202102/09/093529pn4nhh36hjeccq3o.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202102/09/093530k7fjko007qmnsfwh.gif',
          40,
        ],
      },
      武士之魂: {
        1: ['', 82],
        2: ['', 82],
        3: [
          'https://img.gamemale.com/album/202106/11/192931mnv296weukv6bv6v.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/11/192931k1juobk53jz1pt88.gif',
          82,
        ],
      },
      贤者头盔: {
        1: [
          'https://img.gamemale.com/album/202205/30/153916ilgnbqq3llo0v07q.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/153916rvyyicmvf9q9yi2k.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/153917jclcft842c8jucfc.gif',
          40,
        ],
      },
      恩惠护符: {
        1: [
          'https://img.gamemale.com/album/202205/30/153903g1s39nitd8rq8szn.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/153904pdk3nkt7f6fhjxls.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/153904di2vg1g33z43fj31.gif',
          40,
        ],
      },
      超级幸运无敌辉石: {
        1: [
          'https://img.gamemale.com/album/202209/08/220307s4ebll4uyehlusbr.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220320x2qvaza0g81nha00.gif',
          124,
        ],
      },
      '安杜因·乌瑞恩': {
        1: [
          'https://img.gamemale.com/album/201907/27/193142bqqek1ueo7kko27e.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201907/27/193143ee6icntqvecxfvuq.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201907/27/193145n9kv5nk0jk9xz9zi.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201907/27/193147he7pmn03vsezf3h1.gif',
          124,
        ],
      },
      '羅素·托維': {
        1: [
          'https://img.gamemale.com/album/201907/27/193208yoddaakdpadndkhe.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201907/27/193209f9zhr9z9ljbauksa.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201907/27/193210wom7s3ojwoo4mojm.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201907/27/193212yxd7g4i69bh6xgfg.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201907/27/193213hg4q5b32bpbe342p.gif',
          82,
        ],
      },
      '蓝礼·拜拉席恩': {
        1: [
          'https://img.gamemale.com/album/201910/06/131805o11aeeva16c17xve.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201910/06/131806npbubmcd3m43n3bp.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201910/06/131806xpjjnjr3bxoxtzjo.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201910/06/131807ccu066uwyyj6hdr6.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/06/131807xie1rg3g9itzlll1.gif',
          82,
        ],
      },
      '阿列克西欧斯（Alexios）': {
        1: [
          'https://img.gamemale.com/album/201908/07/000439c4ys4khmukll4rgr.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201908/07/000440nlllwslrlwmllxis.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201908/07/000440q6ak4doawyfobou3.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/forum/202001/31/134831p0zfhhgtvj1tb12a.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201908/07/000441q33c0232mgg1jp2u.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201908/07/000441fod52mmdddmklwo1.gif',
          40,
        ],
      },
      '莱因哈特·威尔海姆': {
        1: ['', 40],
        2: [
          'https://img.gamemale.com/album/201910/07/021148pezyimysjsx9rgp9.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201910/07/022936lrreqxmmbribkmgr.gif',
          124,
        ],
      },
      '尼克斯·乌尔里克': {
        1: [
          'https://img.gamemale.com/album/201911/10/134615hjkihjlqipqkcqiq.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201911/10/134615vc6tx3bzbmqts2e2.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201911/10/134616s9w368emw68666hm.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201911/10/134616aq09qqqaa4226zrq.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/201911/10/134617go9iy9tsbyhhco7b.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201911/10/134617tyc9r2jrjtybygha.gif',
          40,
        ],
      },
      '乔纳森·里德': {
        1: [
          'https://img.gamemale.com/album/201911/10/134641fy6sijz6yf5sfwsi.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201911/10/134641ehnttpn77tolcui4.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201911/10/134642bt851ueqz9qw9wx1.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201911/10/134642yc95og94fc89yth8.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201911/10/134643bc375a3ppb7d73tw.gif',
          124,
        ],
      },
      藤田優馬: {
        1: [
          'https://img.gamemale.com/album/202003/07/202919w69k3pj8nvn68nz6.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202003/07/202919vijeebbz06n8l6q0.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202003/07/202921y44gpq14chga2pnc.gif',
          82,
        ],
      },
      莫瑞甘: {
        1: [
          'https://img.gamemale.com/album/202303/01/140812byqmt7q2uuqqm2me.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202303/01/140812nz3itra9q5aww93q.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202303/01/140813wtokc7ya90j0cfjt.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/forum/202102/21/144803mw0wyr5500nwiwi0.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202303/01/140814zd55rrd08so3udfo.gif',
          82,
        ],
      },
      迈克尔迈尔斯: {
        1: [
          'https://img.gamemale.com/album/202003/07/202903bpu1zq6i11gn9ogm.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202003/07/202904xoml17pjp888rmpd.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202003/07/202905wfcxfusrav6ojwbx.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202003/07/202907o1sqelf1uzefrzp0.gif',
          82,
        ],
      },
      Doc: {
        1: [
          'https://img.gamemale.com/album/202003/07/202911ow3ldyqo8ly3yr1y.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202003/07/202911l8vk3vjka6u9bvk6.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202003/07/202912pana2k9zah9r97v2.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202003/07/202913kdd0zd7bodt0golb.gif',
          82,
        ],
      },
      '杰克·莫里森/士兵 76': {
        1: [
          'https://img.gamemale.com/album/201906/15/163053p8rq2ttx6f6z204g.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201906/15/154716mzenzbh0be1ie6z1.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/201906/15/154718v3k1buetufekn2op.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/201906/15/154720ycy999gh11375c7i.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/201906/15/154723a3zzrww4kgzya6k5.gif',
          124,
        ],
      },
      '索林·橡木盾': {
        1: [
          'https://img.gamemale.com/album/202006/04/184808bdomk3o8okzb0tbl.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202006/04/184809fq74a6u660gaf68l.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202006/04/184812cd0igigj4bn1nn0q.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202006/04/184815tvvlvjv1mv2zmbmv.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202006/04/184817uf3o0pa3aaccpgmm.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202006/04/184820o26xv4j2z4bs4zdi.gif',
          124,
        ],
      },
      陷阱杀手: {
        1: [
          'https://img.gamemale.com/album/202006/04/184750m7arxhpxxek7m77o.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202006/04/184751le7phhbh37tbp3ka.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202006/04/184753io2w2dx6gbdf26om.gif',
          82,
        ],
      },
      '吉姆·霍普': {
        1: [
          'https://img.gamemale.com/album/202006/04/184828uzhdghhp6u2lxcth.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202006/04/184832pzgccucy7cfd1fc8.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202006/04/184834n22z2ava3kzwkwca.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202006/04/184838wg3hhg933ck33h4h.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202006/04/184842utju1hjhcu1sbnzs.gif',
          124,
        ],
      },
      '沃特·沙利文': {
        1: [
          'https://img.gamemale.com/album/202008/08/123422gv2t44ssx90xgs2s.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202008/03/121213nv71ssberh7vtssk.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/forum/202403/08/190216h1wlqqdt5dtsz9az.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202008/03/121217fi8r7cj813xjjeqi.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/forum/202306/09/040011o6vrz5kfkrk6wj1h.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202008/03/121219vtetgcvtu6us60gg.gif',
          124,
        ],
      },
      '塞巴斯蒂安·斯坦': {
        1: [
          'https://img.gamemale.com/album/202008/03/121130z2i9iz8meydjdvzc.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202008/10/115124u95b9igfgbdvf9zn.gif',
          124,
        ],
      },
      '魯杰羅·弗雷迪': {
        1: [
          'https://img.gamemale.com/album/202008/03/121045lzw4bvrnnrhlrbvo.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202008/03/121047uv7wzjnvnjv8u46e.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202105/11/200012lr1wpddgp7hewdfh.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202008/03/121049rzpdm9k7i99w3wmp.gif',
          82,
        ],
      },
      莎伦: {
        1: [
          'https://img.gamemale.com/album/202303/01/153619kqzrxwzrzht2tith.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202303/01/153619ekknv0700hihoa2g.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202303/01/153620iocqmismipo9i99f.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202303/01/153621m7ktzc11ji7icrjc.gif',
          40,
        ],
      },
      疾风剑豪: {
        1: [
          'https://img.gamemale.com/album/202008/03/121025lmm1zxrrkk7x2t39.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202008/03/121025pc2pm4zjuk2ypjmw.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202008/03/121026nrm32o4qr4zq4ggo.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202008/03/121027g3udgnx4gwlzuwgl.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202008/03/121029zh3shps7piqzhv1h.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202008/03/121031gzv4qiqk4czvq1qq.gif',
          82,
        ],
      },
      '【新手友好】昆進': {
        1: [
          'https://img.gamemale.com/album/202009/19/002308g7dw7biybnt9iwdb.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202009/19/002156y6g6ryp9im3so9ym.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202009/19/002402kydjpdd0gf0v0tap.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202009/19/002436vvdq10m5gmuugp0t.gif',
          82,
        ],
      },
      萨菲罗斯: {
        1: [
          'https://img.gamemale.com/album/202009/19/002515ofbv7sqfqssvq9cz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202009/19/002519vh3hh53f7hrwkkb1.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202009/19/002522w2qy7dugdezqql22.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202009/19/002531i99l3a71k81jujnu.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/forum/202011/07/070857cv3jz44fa1qnn1ut.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/202009/19/002546gzbe8e0t378bun5n.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202009/19/002559mdz650pz57ng7xxf.gif',
          82,
        ],
      },
      '丹·安博尔': {
        1: [
          'https://img.gamemale.com/album/202009/19/001918g1icicc716ljcbiu.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202009/19/001943y5jk5v49j5lilimm.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202009/19/001959kjfnsdlno9fdod6g.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202009/19/002321w0hvrmrgkgeqhqee.gif',
          82,
        ],
      },
      '汤姆·赫兰德': {
        1: ['', 40],
        2: [
          'https://img.gamemale.com/album/202011/10/183320imbqtp5qqprq82rg.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/forum/202307/11/193123gjs63rwjpr3s4zs1.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202011/10/183326pzlfkfxkfxtrrkp0.gif',
          82,
        ],
      },
      超人: {
        1: [
          'https://img.gamemale.com/album/202011/10/234117x67cbtst7cwft7b3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202011/10/234118cwuicwwlvcuhh0ph.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202011/10/235613prw6ojwzlsmrjlrj.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202011/10/235617fsoio1ljlolsihwo.gif',
          124,
        ],
      },
      '阿尔伯特·威斯克': {
        1: [
          'https://img.gamemale.com/album/202012/04/130038w45fff6yc556sxcz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202012/04/130038p5j88h565zyyzjn0.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202012/04/130039qho53u656qxf5qwf.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202012/04/130045t9g7ng8unl6mml1s.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202012/04/130059iadfthdarahhz2dy.gif',
          82,
        ],
      },
      鬼王酒吞童子: {
        1: [
          'https://img.gamemale.com/album/202012/06/123041sgugi00i0ab3f1ii.gif',
          40,
        ],
        2: ['', 40],
        3: [
          'https://img.gamemale.com/album/202012/06/123044spkppqn25n55inzl.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202012/04/130019jwbo3zwl04izetdb.gif',
          124,
        ],
      },
      'Scott Ryder': {
        1: [
          'https://img.gamemale.com/album/202012/17/200506p2yujjeygn9sem8c.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202012/17/200508pbmmlg91gg0ybq9y.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202012/17/200509pdruudbgrdd8f5ru.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202012/24/010127t64uwtv4bbt696ej.gif',
          82,
        ],
      },
      '汉克/Hank': {
        1: [
          'https://img.gamemale.com/album/202012/17/200959l080lp10gdeyvvgw.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202103/08/004348f2smvbmmbc6oubrb.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/forum/202103/08/004351aczawf7n7enafe5w.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202012/17/201007wtnahz27t79t27a7.gif',
          82,
        ],
        5: ['', 82],
        Max: [
          'https://img.gamemale.com/album/202012/17/201010d7pqktgqxqqrzett.gif',
          82,
        ],
      },
      三角头: {
        1: [
          'https://img.gamemale.com/album/202102/09/091726ecy2ym6vacri2gur.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202102/09/091727g4ka33kd4t3j3ll3.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202102/09/091727m3qg862qxwgqwwcq.gif',
          124,
        ],
      },
      幻象: {
        1: [
          'https://img.gamemale.com/album/202102/09/091736ghwajftgtbovt73g.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202102/09/091736yhngp3nl29pppmzq.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202102/09/091738qhk4chh5g96gkuds.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202102/09/091739youoo0j6lvlt22ai.gif',
          82,
        ],
      },
      金刚狼: {
        1: [
          'https://img.gamemale.com/album/202103/16/113005qo07ox6nsvz17vin.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202103/13/145217whpbaspuoszmqa89.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202103/13/145458c96oezoomzomk2m1.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202103/13/145459ebg982wg7fyv0av2.gif',
          124,
        ],
      },
      克苏鲁: {
        1: [
          'https://img.gamemale.com/forum/202102/15/181437myoz5hv7qhm1c3v1.gif',
          82,
        ],
        2: [
          'https://img.gamemale.com/forum/202102/15/181437zm32llokfx73ppqr.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/forum/202102/15/181437na6xdxsh06rtzfaq.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/forum/202102/15/181438yqnojohgijlv1ell.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202103/13/145548karafmsnrlfnfjnn.gif',
          124,
        ],
      },
      士官长: {
        1: [
          'https://img.gamemale.com/album/202103/13/150429xqfi6ew0fz4aaef6.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202103/13/150436oncbsaxl2bssab43.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202103/13/150441ouvh4quqqgq0r4h7.gif',
          124,
        ],
      },
      '托尼·史塔克': {
        1: [
          'https://img.gamemale.com/album/202103/13/150447bfaajyw5f3j3j2f2.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202103/13/150443zcisi45n4bziu0ll.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/forum/202102/11/174545wumvuhxj4ixmpvhu.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/forum/202102/11/174545gh13hoh332haz5el.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202103/16/113937yewee9gls94bsz40.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/forum/202102/11/174545kzt2rv2mmt1vv3mp.gif',
          82,
        ],
        7: [
          'https://img.gamemale.com/album/202103/13/150633szdzaao15t1xofno.gif',
          82,
        ],
        8: [
          'https://img.gamemale.com/forum/202102/11/174546u1166fpp3630w1g6.gif',
          82,
        ],
        9: [
          'https://img.gamemale.com/album/202103/13/150646vy1e4n0o0e7tl3bc.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202103/13/150644oy6ukbjtu8kbohuy.gif',
          124,
        ],
      },
      '加勒特·霍克': {
        1: [
          'https://img.gamemale.com/album/202106/14/230458pm917hqp7z70qeqh.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202104/29/203510d889pdfdvf7t7r8f.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202106/14/230458eqfsbsmbbniqoz2b.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/14/230623vdqbqici9sr8r7fs.gif',
          82,
        ],
      },
      艾吉奥: {
        1: [
          'https://img.gamemale.com/album/202104/29/205131brjl9gdmf9r9og28.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202104/29/195037qgzjgvz5czhs1vn1.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202104/29/195038b78azy9fnnhkunnr.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202104/29/195038yaaao17y1lz6ubqt.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202104/29/195038iqpgleezwve1lvz1.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202104/29/195039f372n11766697abh.gif',
          82,
        ],
      },
      'Chris Mazdzer': {
        1: [
          'https://img.gamemale.com/album/202106/11/192755poo3o3lktbet3vu3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202106/11/192756at7tvvn7ex1d12ql.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/11/192756vhe5n0ppeu0ahf09.gif',
          40,
        ],
      },
      '索尔·奥丁森': {
        1: [
          'https://img.gamemale.com/album/202106/11/192910fz1ps1wsdb3x1dpk.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202106/11/192911pucsks7fa7ist7tk.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202106/11/192910n8g3y7m4d4g3czj5.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202106/11/192910gbvpzs50zs8tuwpz.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202106/11/192911bs4h48dvph3z4vuu.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/202106/11/192911fllt3ndiiiyl9lg4.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/11/192911r5645j5ztf45jxxz.gif',
          82,
        ],
      },
      绯红女巫: {
        1: [
          'https://img.gamemale.com/album/202303/01/144153dffbgfbwang0fgww.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202303/01/144154l6g7hn2a7znvfn5r.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202303/01/144155mm16iymicfszauay.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202303/01/144155of2nddzxe5dfmxhd.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202303/01/144156jpjj9oh3shop2v4g.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202303/01/144153vsz59ggssug9295k.gif',
          82,
        ],
      },
      泰比里厄斯: {
        1: [
          'https://img.gamemale.com/album/202106/11/192919ttc8xt7y5jjtxmim.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202106/11/192919necmklebcd9dw9qq.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202106/11/192919ma98v49w82u848j8.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/11/192919a3foswsvhbwe6j5e.gif',
          124,
        ],
      },
      大古: {
        1: [
          'https://img.gamemale.com/album/202106/11/192808ens3apntt5gsy3qq.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202106/11/192807tqxuw0djvclwwelw.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202106/11/192809el2m5l3rln9m3ri5.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202106/11/192808kydxuk0wwwoo0od4.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202106/11/192809rr5duzb5u6q5uqu5.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/11/192809xlpd52bf3eilile1.gif',
          82,
        ],
      },
      炙热的格拉迪欧拉斯: {
        1: [
          'https://img.gamemale.com/album/202106/11/192858c3gf3rz3f13ypwys.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/11/192859lfaag0a7eokkpkse.gif',
          124,
        ],
      },
      格拉迪欧拉斯: {
        1: [
          'https://img.gamemale.com/album/202106/11/192835q1e7b6bccoce7m5c.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202106/11/192835cwflsbslooebwrv7.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202106/11/192836alehglnvuuyg1i16.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202106/11/192835ibe0n404nvn4ngqu.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/11/192836piqppwj2qz8jw5xq.gif',
          124,
        ],
      },
      '卡洛斯·奥利维拉': {
        1: [
          'https://img.gamemale.com/album/202106/11/192845gwwk03k0gcc9haew.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202106/11/192845kpeqeybi8n64unqp.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202106/11/192846rrbqblrmojhrrbhe.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202106/11/192846w8amf4t8o1a1nt0o.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202106/11/192847gwbfnegfyewvsyiu.gif',
          124,
        ],
      },
      '巴基 (猎鹰与冬兵)': {
        1: [
          'https://img.gamemale.com/album/202110/03/194238q1641b46ur4d1x6s.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202110/05/012019ln2vfav92qvvm3fu.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202110/03/194241of5p45znfa3atwpv.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202110/03/194242avrvgbcvcygc6rhh.gif',
          124,
        ],
      },
      Joker: {
        1: [
          'https://img.gamemale.com/album/202111/30/162244ax1axloxxsb5d5ww.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202111/30/162245nnxx8hjxxrxxme00.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202111/30/162245o6bqb7vxzydwyy1d.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202111/30/162245zbnnitjmvjbbbpww.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202111/30/162246wirzo82vyr68392h.gif',
          124,
        ],
      },
      'V (DMC5)': {
        1: [
          'https://img.gamemale.com/album/202111/30/151917opanbpgg92cpc9bc.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202111/30/151918olbud4uj81zb6ju1.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202111/30/151919j1lrltclo6t1vovl.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/forum/202307/12/132752fn32vp8om5hzoumz.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202111/30/151920t778hpkdgho8padr.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202111/30/151921kfcode2q9f9qu9qc.gif',
          124,
        ],
      },
      Dante: {
        1: [
          'https://img.gamemale.com/album/202111/30/151900kvzfun3z38x3l333.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202111/30/151901tmf6k6m6v7v7pnaj.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202111/30/151902qhrer72cg7wvhe3c.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202111/30/151903psl1lb33s3z14lis.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202111/30/151905jaiftgfimt4xr95a.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202201/08/192225hljqfk4pig4gz4or.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202111/30/151908h95rntntha8hnnuh.gif',
          124,
        ],
      },
      Vergil: {
        1: [
          'https://img.gamemale.com/album/202111/30/151928k7yqq4tcctvxechh.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202111/30/151929l3zim66nw5m5ig6i.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202111/30/151930hra9qkvh3mqzzlrb.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202111/30/151931jp5b56parah05jab.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202111/30/151932wq3rttmxytmqxoqc.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202111/30/151933wkbara8esaaru8nf.gif',
          124,
        ],
      },
      '威克多尔·克鲁姆': {
        1: [
          'https://img.gamemale.com/album/202201/26/145555tlcoyoejsyqoxxud.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202201/26/145555foee4n2ddeazq9o5.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202201/26/145555vl9eldja2c721lal.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/26/145556p37yydcyay6m3rc6.gif',
          82,
        ],
      },
      '赫敏·格兰杰': {
        1: [
          'https://img.gamemale.com/album/202303/01/142839y5z2i5i1pztr9k9i.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202303/01/142837fuhuqee9zefqib9z.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202303/01/142838pnuf7fposn75sfsp.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202303/01/142838xprp7pwr7w18v19w.gif',
          82,
        ],
      },
      阿拉贡: {
        1: [
          'https://img.gamemale.com/album/202201/26/145528f000sv8lc9ngl1i8.gif',
          40,
        ],
        2: ['https://s2.loli.net/2023/07/05/imM8XEuPte7ySbV.gif', 82],
        3: [
          'https://img.gamemale.com/album/202201/26/145529vrq6y4g869b988zz.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202201/26/145529ksz77q9gor3lrq3x.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/26/145529fjwr6gs7jxsnvwir.gif',
          82,
        ],
      },
      瑟兰迪尔: {
        1: [
          'https://img.gamemale.com/album/202201/26/145605yccizcccznclcgwc.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202201/26/145605jzvf7hckfwsdv1k1.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202201/26/145606uayygzqvxxnqxtav.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/26/145606qq34ojeoeejbh6bd.gif',
          82,
        ],
      },
      异形: {
        1: [
          'https://img.gamemale.com/album/202201/26/145612cvhualf6lhhfvg4g.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202201/26/145612d8opc5zqlaiy5qpl.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202201/26/145613dndd7newhhdhch9n.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202201/26/145613e5ilod8s8ot55odc.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/26/145613rctymovht7j9zqcc.gif',
          82,
        ],
      },
      岛田源氏: {
        1: [
          'https://img.gamemale.com/album/202201/26/145519evmbk8tmxdgjdrc6.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202201/26/145519iqy2gg8gekk8a28k.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202201/26/145519z73drufbl6yy3w73.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202201/26/145520cp4v6ittkpplbf33.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202201/26/145520lm6bzbmdzyl5pf8b.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/26/145520ofl9n1wjsbbf9wjw.gif',
          124,
        ],
      },
      '小天狼星·布莱克': {
        1: [
          'https://img.gamemale.com/album/202204/29/211640l3t4gtg44733vqtb.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202204/29/211640ca8fijs28yfsxy89.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202204/29/211640bvqj6fjlfv1v6f19.gif',
          40,
        ],
      },
      甘道夫: {
        1: [
          'https://img.gamemale.com/album/202204/29/211549weth15b90b1b159e.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202204/29/211549zg4txfldvx45vmxu.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202204/29/211550s3x55wwh5thxh0w3.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/forum/202406/20/010806pwinqi7x7qw2vwnt.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202204/29/211550m7h33ikh9w0zk0id.gif',
          82,
        ],
      },
      莱戈拉斯: {
        1: [
          'https://img.gamemale.com/album/202204/29/211616q5zakqkk5hyy5slq.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202204/29/211617jikv11464f6m364e.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202204/29/211617egjeh6h0eyye2y2a.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202204/29/211617cnrq9ozblzuuosfp.gif',
          82,
        ],
      },
      神灯: {
        1: [
          'https://img.gamemale.com/album/202204/29/211630uf6wd7ljn7f9n4wj.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202204/29/211630hq4sqwg4810n8haq.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202204/29/211630g661zqd168vl3dcc.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202204/29/211630hv88dh8er22hxe9v.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202204/29/211631bads43zu2ze4esa4.gif',
          124,
        ],
      },
      黑豹: {
        1: [
          'https://img.gamemale.com/album/202204/29/211558iniaibiduyiudzwu.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202204/29/211559kf83ssoli9f3ivr8.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202204/29/211559mqkz8bnclzmdbmfc.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202204/29/211559zr5grxr8ew8bezdg.gif',
          82,
        ],
      },
      '莱托·厄崔迪': {
        1: [
          'https://img.gamemale.com/album/202205/30/153010hllprzpfrlx6offp.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/153010y7es4e079sgiz4iq.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202205/30/153011elqem2szl60lwpz0.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/153011cyrff4y559yj4wfy.gif',
          40,
        ],
      },
      '西弗勒斯·斯内普': {
        1: [
          'https://img.gamemale.com/album/202205/30/152920jp2g696p9t72t2p9.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/152920aprfmp08rnqdnr5i.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202205/30/152920feaj4bx8zhx4hje5.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202205/30/152921b5jqv665xxmst6v8.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/152921rpu6qr0jugqj4ue5.gif',
          82,
        ],
      },
      '阿不思·邓布利多': {
        1: [
          'https://img.gamemale.com/album/202205/30/152901xndc1ll91zn1cv11.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/152902chitnyijds3d3tjj.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202205/30/152902bluus3t6zz77zsjx.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202205/30/152902eiisdiidjrmremt2.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/152903ltu34trptivuww7w.gif',
          124,
        ],
      },
      '普隆普特·阿金塔姆': {
        1: [
          'https://img.gamemale.com/album/202205/30/152955zzclmn646306ni6n.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/152956gz47dh4ex57617h7.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202205/30/152956dy1159k1s4y1ld9c.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202205/30/152956ly2t2cbzwbyxn2qb.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/152957do9uwh95k8azkukz.gif',
          124,
        ],
      },
      '诺克提斯·路西斯·伽拉姆': {
        1: ['', 40],
        2: [
          'https://img.gamemale.com/album/202205/30/152940jni00g5z4spf5fu6.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202205/30/152941wbzi7mupqps3gl7q.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202205/30/152941ok2hf26nkbn2piaz.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/152941uwpa98c2cf98ocjg.gif',
          124,
        ],
      },
      豹王: {
        1: [
          'https://img.gamemale.com/album/202209/08/220052tash88iz4rydihtz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/220053ume4s2sgqglg2of4.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202209/08/220053ymnon6ouuz69nmxj.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220054qnrp315ykr3gskdk.gif',
          82,
        ],
      },
      '不灭狂雷-沃利贝尔': {
        1: [
          'https://img.gamemale.com/album/202209/08/220126m92xhg1wndwhljxl.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/220130pvn0n333jnmvv90q.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220134e01aoeaw8p5ewznm.gif',
          82,
        ],
      },
      桐生一马: {
        1: [
          'https://img.gamemale.com/album/202209/08/220241negi31y53g3n53t5.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/220244lozfrlrrorn9fouz.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220245b72iyatiyii2kqb9.gif',
          82,
        ],
      },
      '大黄蜂（ChevroletCamaro）': {
        1: [
          'https://img.gamemale.com/album/202209/08/220142qo17q7pej5qjlb88.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/220150l6yh6r5ynn8rh9yy.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202209/08/220200xyw8folffw9rldon.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220205mlvvspiizbqzmmws.gif',
          82,
        ],
      },
      博伊卡: {
        1: [
          'https://img.gamemale.com/album/202209/08/220112eikaik5ic7sete5w.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/220112hz6solemsmeux1mo.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202209/08/220113g82vs1kq8srs9sy9.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202209/08/220114ldccrgmjttc5r7gc.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220116dlurf4fh4i5iiw54.gif',
          124,
        ],
      },
      '史蒂文·格兰特': {
        1: [
          'https://img.gamemale.com/album/202212/23/203749czvoecat8j88ugxa.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202212/23/203750jqenw76662z6uuss.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202212/23/203750nu0uf0xfemamas05.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202212/23/203751bn18tooo4t4it8vh.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202212/23/203751i9535lqpmu3qi9ju.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202212/23/203752i5g3yplznttgagup.gif',
          124,
        ],
      },
      '马克·史贝特': {
        1: [
          'https://img.gamemale.com/album/202212/23/203739xqa28mvhd32ytm95.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202212/23/203739ae7ej646ecmtjz1p.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202212/23/203740hddep8ffqec4ezoc.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202212/23/210109t1sg7cntdmcs1zam.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202212/23/203742hq5zq55kvv511zqq.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202212/23/203743i7vp44fx4p2bxxxu.gif',
          124,
        ],
      },
      竹村五郎: {
        1: [
          'https://img.gamemale.com/album/202301/20/210115shqo42ohz1ff4vq1.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202301/20/210115vzo5ibdrvmzdpedm.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202301/20/210116co07yazyiqoo0yr3.gif',
          82,
        ],
      },
      光之战士: {
        1: [
          'https://img.gamemale.com/album/202301/20/210048n0ias5x5dkaa93d1.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202301/20/210049s2g5ddv52zlvavy5.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202301/20/210049meciva5ohoz2jeoi.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202301/20/210049pa4hthfvhhir1htu.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202301/20/210050ygrxuxy2artokuth.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202301/20/210050tijxj1x4nxnxdfff.gif',
          82,
        ],
      },
      Drover: {
        1: [
          'https://img.gamemale.com/album/202301/20/210041rwf9wrr6om9q0zue.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202301/20/210041vlhoarrlro57akml.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202301/20/210042zuktth44bvk9h960.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202301/20/210042h4jjguwp5yej67uw.gif',
          82,
        ],
      },
      '乔治·迈克尔': {
        1: [
          'https://img.gamemale.com/album/202301/20/210057z394b16ff4079o79.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202301/20/210057my58hmyhrwy881wx.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202301/20/210058b03pz77y0pyjhxg0.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202301/20/210058vton58og1l8zjtn1.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202301/20/210058s1h45s2ob2b4uovo.gif',
          124,
        ],
      },
      男巫之歌: {
        1: [
          'https://img.gamemale.com/album/202111/30/152021yn4gg2eyu8u8lb8y.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/202111/30/152021lqz8vgqfqss77qt1.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202111/30/152021djx7b94b92zo9wwh.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/forum/202201/30/100903l97yaqan99gmgima.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/forum/202201/30/100905kz1ztzt8i0u18qaz.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/forum/202201/30/100909xrx7s5ssakj573sj.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/forum/202201/30/100910wnf3nzdede5j955f.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/202111/30/152022vd2dws6rrsre9z2d.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202111/30/152022nddshwwhdiistihc.gif',
          124,
        ],
      },
      男色诱惑: {
        1: [
          'https://img.gamemale.com/album/202201/27/150358qq49stoxstitr6fq.gif',
          82,
        ],
        2: [
          'https://img.gamemale.com/album/202201/27/150400xpyj3f2o0u2yjgjr.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202201/27/150402jh27jrhqshljlvre.gif',
          82,
        ],
      },
      '美恐：启程': {
        1: [
          'https://img.gamemale.com/album/202205/30/153935wjcjqt3lrt50tfm0.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/153937mpya4jdy43a963bc.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202205/30/153938o5rr11t11fjtd1ud.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202205/30/153940e1bhjae1half1xd1.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202205/30/153941lzlmxhv92odlzd9g.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202205/30/153943uf10ui7nwi4kdzir.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/album/202205/30/153945gdfc57lpcfb5m3y7.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/202205/30/153946geza35dxru62r5aa.gif',
          124,
        ],
        9: [
          'https://img.gamemale.com/album/202205/30/153948bscjjx7xe7zag5a3.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/153949dp9i5999vd2d7ysv.gif',
          124,
        ],
      },
      海边的邻居: {
        1: [
          'https://img.gamemale.com/album/202205/30/154028qq6j9ssj6a43zqz6.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202205/30/154030xhh88h4hn84gghf0.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202205/30/154032yau40u4hz3huwsud.gif',
          40,
        ],
      },
      四季之歌: {
        1: [
          'https://img.gamemale.com/album/201912/19/200741x6tieg9ziopxpziz.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/201912/19/194025bnglbu8j4uljgl8g.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/201912/19/194015uco030s1ps4300on.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201912/19/193959uwlhbtghdojz00hb.gif',
          124,
        ],
      },
      '『不败之花』': {
        Max: [
          'https://img.gamemale.com/album/202402/13/185914blucl6txxplhgp6q.gif',
          40,
        ],
      },
      '约书亚・罗兹菲尔德': {
        1: [
          'https://img.gamemale.com/forum/202402/12/113425k93x7s939xjvs1y3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010523nud6mc32f8vqqgtp.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/forum/202402/15/124123w0dw5b1xoznb1bwd.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/forum/202402/12/194407v96eq9gyqtb6qx61.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/forum/202402/12/113841i189z7p6mz1p4947.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/forum/202402/12/113427f082z542u4enjc22.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010523nud6mc32f8vqqgtp.gif',
          124,
        ],
      },
      '克莱夫・罗兹菲尔德': {
        1: [
          'https://img.gamemale.com/album/202402/09/010326gggncgrozz9c4zun.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010326owtattfffat40swv.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202402/10/011317j2xji14dff2z6x11.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202402/09/010329p8xczcg8vhhvxpx8.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202402/09/010330cige681moemjxmm1.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010331n5ddk93t4ss7ckt8.gif',
          124,
        ],
      },
      苇名弦一郎: {
        1: [
          'https://img.gamemale.com/album/202402/09/010511rjampzaa0ddllddo.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010512johogsl2l22qutsv.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202402/09/010513cwb8eyi3n5r5wnkl.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010515p0w7gar1wauth3ym.gif',
          82,
        ],
      },
      '里昂（RE4）': {
        1: [
          'https://img.gamemale.com/album/202402/09/010352s95pn3c4ug4u49lz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010353tu8qeqjqquc1qv33.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202402/09/010354isskvigw00dd6p0v.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202402/09/010355liauwkivvbijwbkw.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010356thhv8uecu9e5vvmr.gif',
          124,
        ],
      },
      '尼克·王尔德': {
        1: [
          'https://img.gamemale.com/album/202402/09/010403ywyppzmwm8s73zxw.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010404lnfiz3xftnw42vny.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202402/09/010405m55m1wr63d1ougm1.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010406m0bl2az02o0d2ja2.gif',
          124,
        ],
      },
      波纹蓝蛋: {
        1: [
          'https://img.gamemale.com/album/202402/09/010315fwzwwj3z6wpj66jj.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010315z88al8c628f6m2l7.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010316bdicvfvf1zp7354z.gif',
          40,
        ],
      },
      崩朽龙卵: {
        1: [
          'https://img.gamemale.com/album/202402/09/010244u08b5q0q8nbgigqb.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010245wycidw9ggeg62vd2.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010245hmuurzvzuyhjzwmm.gif',
          124,
        ],
      },
      冰海钓竿: {
        1: [
          'https://img.gamemale.com/album/202402/09/010305w0d00iggdqh1agik.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010305csjwucys2cayqgjc.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202402/09/010306txcdhook4wfbqwwh.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010306sh44zaiajlic40nb.gif',
          124,
        ],
      },
      射手的火枪: {
        1: [
          'https://img.gamemale.com/album/202402/09/010501f11dxtmk8pttm6zz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010501lnh22s6q6jd6vahf.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202402/09/010502gl1k0ib1eqqiqyb8.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202402/09/010502ln4j3gpiz4383nip.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010502kh0q0x7wwpw1x07o.gif',
          82,
        ],
      },
      '“米凯拉的锋刃”玛莲妮亚': {
        1: [
          'https://img.gamemale.com/album/202402/09/010225kp909y4kjjpzylly.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010226g58rar3tlr8wwnjw.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202402/09/010227sw5sm5m5frjozumm.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202402/09/010227kk2xn98nhdki8hbg.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202402/09/010230o5vss5ibvps9es0t.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010231l15c89y44096y5ne.gif',
          124,
        ],
      },
      '朱迪·霍普斯': {
        1: [
          'https://img.gamemale.com/album/202402/09/010535f41h4y44pis47c5s.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202402/09/010536guz959pcw70hs7u7.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202402/09/010537w91j10j7b1z5jby0.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010538rny4g1yy8ks8bzb1.gif',
          124,
        ],
      },
      '『列车长』': {
        初级: ['', 40],
        1: [
          'https://img.gamemale.com/album/202312/21/194233wvjmxvvqiglnxvwl.png',
          40,
        ],
        2: ['', 40],
        3: ['', 40],
        Max: [
          'https://img.gamemale.com/album/202312/26/153217fdhxe2dx8fxx59fx.gif',
          124,
        ],
      },
      特供热巧: {
        1: [
          'https://img.gamemale.com/album/202312/25/112145mmd9i9come9o4edm.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/26/152945wolwikymmhh3tdod.gif',
          82,
        ],
      },
      '『金色车票』': {
        初级: ['', 82],
        1: [
          'https://img.gamemale.com/album/202312/26/153359c315l2kvzqclz5z1.gif',
          40,
        ],
        2: ['', 82],
        Max: [
          'https://img.gamemale.com/album/202312/26/153431efmcz94cfhf0e4z6.gif',
          82,
        ],
      },
      可疑的肉蛋: {
        1: [
          'https://img.gamemale.com/album/202312/20/205711pf8g8k4r7p4a67l4.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202312/20/205712lxc6eefehyzenezy.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202312/20/205712punr95d523pn9lpn.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202312/20/205845an3czunah2c0b3a5.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/20/205845u0v55mxhsnvhyyk0.gif',
          40,
        ],
      },
      无垠: {
        1: [
          'https://img.gamemale.com/album/202312/21/181357fxtci2iuplv9vt2l.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202312/21/181358cbyhylp1l05phh7a.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202312/21/181359tpxd016f90vh68tf.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202312/21/181359k00x6u9hyt8706ul.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/202312/21/181401fiiiwi8wdqaaawax.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202312/21/181403n9m5uuttl5q9s0x8.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/album/202312/21/181405d5n4ftmgk6n44nfj.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/202312/21/181406q5dnipcw0i1o1eoc.gif',
          124,
        ],
        9: [
          'https://img.gamemale.com/album/202312/21/181408jhiyiib955rfi9pi.gif',
          124,
        ],
        10: [
          'https://img.gamemale.com/album/202312/21/181409qpxmkiikzhlwcc3r.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/21/181411o8bz954c94sc4t4c.gif',
          124,
        ],
      },
      黑暗水晶: {
        1: [
          'https://img.gamemale.com/album/202312/20/205455h8zu284mu2iuaqqz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202312/20/205456oxxxev1x1xxixdmx.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202312/20/205456u3hy27326mk7fdly.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202312/20/205456jof1ff01ri2z21oa.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/20/205457zjeejmy9fef8v218.gif',
          40,
        ],
      },
      棱镜: {
        1: [
          'https://img.gamemale.com/album/202312/20/210413o2e71vgo7c3jepd3.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/20/210414y2hdq7w23luqhqyq.gif',
          82,
        ],
      },
      天使之赐: {
        1: [
          'https://img.gamemale.com/album/202312/20/210427ajoj93i34oz73bo3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202312/20/210428rffohoy571nx575g.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/20/210429ve46wv42p4wezljp.gif',
          82,
        ],
      },
      '爱丽丝·盖恩斯巴勒': {
        1: [
          'https://img.gamemale.com/album/202312/20/205532k2dyuc12f2d2252f.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202312/20/205602tp1hsble99lwtqew.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202312/20/205604tn7sqsx5oj5qqtqy.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/forum/202401/06/235740tdpjptnnddydpoep.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202312/20/205607znj9lvnn21sr140n.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/20/205609o0ewcd5fdazfeao8.gif',
          124,
        ],
      },
      '凯特尼斯·伊夫狄恩': {
        1: [
          'https://img.gamemale.com/album/202312/20/205446gjmq0j1i1j71xl1k.gif',
          40,
        ],
        2: ['', 82],
        3: [
          'https://img.gamemale.com/album/202312/20/205450yycyhece5xnxxxxc.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202401/30/120450e41turn8gj6zul7e.gif',
          82,
        ],
      },
      '克劳斯·迈克尔森': {
        1: [
          'https://img.gamemale.com/album/202312/20/205846tq2zg1zvv2rt3a3q.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202312/20/205848o7p1p1xnpepxqx6q.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202312/21/174418c8xhhh9kllkn4glw.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202312/20/210050vm8z5megww7coe2r.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/forum/202405/14/005835r35yx3b6gsg5qrhu.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202312/21/174304xtwq2vzgbgtqbvbf.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/20/210410v67n5lzada06w6wa.gif',
          124,
        ],
      },
      虎头怪: {
        1: [
          'https://img.gamemale.com/album/202312/20/205610gj9fix52zdacdczz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202312/20/205611sru4r33znqz4nwp2.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202312/25/162350ja7irqbni2lj93bi.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202312/25/162351gcokj6r8sasosk6j.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202312/25/162352khzhwtlwpoewjmle.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/20/205710wmuqu05q9ckvc5i1.gif',
          124,
        ],
      },
      龙之秘宝: {
        1: [
          'https://img.gamemale.com/album/202310/09/105229qxknooolcrg2hx4p.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202310/09/105229mzu4c0aa24uqnlcl.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202310/09/105231quppkbdedpf1ekxf.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202310/09/105233phoiwhdcbcccnmm6.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202310/09/105234y1m8pmjmiqmr8ggm.gif',
          40,
        ],
      },
      长花的蛋: {
        1: [
          'https://img.gamemale.com/album/202309/27/171413azzzv9pvbalbz9yp.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171414b5bg8vmsco9tu4fo.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/27/171415qzggp9oggimip7ai.gif',
          40,
        ],
      },
      棕色条纹蛋: {
        1: [
          'https://img.gamemale.com/album/202309/27/171353w9sh9i8momll7l8l.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171353zfpjls57l55aql75.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202309/27/171354zx9zqdx88bnemnzn.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202309/28/155631jui5o83g1xojs89j.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/202309/27/171355s6ffysnn30pcfqna.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/27/171359ur703jj03qqerior.gif',
          82,
        ],
      },
      被尘封之书: {
        1: [
          'https://img.gamemale.com/album/202309/27/171452rhhf00whhi6f2724.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171453m55vcpv4qvdtvdqo.gif',
          40,
        ],
        3: ['', 82],
        4: [
          'https://img.gamemale.com/album/202309/27/171507wv9dsdvdjsnj87j9.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202309/27/171515td82z87sx8zsr2qe.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/202309/27/171519iqdzqnzld0d2jjfn.gif',
          82,
        ],
        7: [
          'https://img.gamemale.com/album/202309/27/171535lnfhaaow6nstnooc.gif',
          82,
        ],
        8: [
          'https://img.gamemale.com/album/202309/27/171543antn803f3mgfgsmn.gif',
          82,
        ],
        9: [
          'https://img.gamemale.com/album/202309/27/171551vcgceuqnpwwqwn5e.gif',
          82,
        ],
        10: [
          'https://img.gamemale.com/album/202309/27/171605ljmzt3qqqf3z6c6g.gif',
          82,
        ],
        11: [
          'https://img.gamemale.com/album/202309/27/171658k6wn5qinkw4w541j.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/27/171659n5pq80jxx608qjdx.gif',
          40,
        ],
      },
      和谐圣杯: {
        1: [
          'https://img.gamemale.com/album/202309/27/171418gnzqnwrh3lsknsbl.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171421sh3j3yjyjyufhfjb.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/27/171427px141o11vc31z6ck.gif',
          40,
        ],
      },
      双项圣杯: {
        1: [
          'https://img.gamemale.com/album/202304/30/170353mqqq6lsjdu18n1d9.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202304/30/170353ebrnkg36n9zpkrdk.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202304/30/170354qkcc9294kpt92l92.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202304/30/170354p6gyo9gkr3oykkrk.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/202304/30/170355ksdz7hxku987k8jd.gif',
          40,
        ],
        6: [
          'https://img.gamemale.com/album/202304/30/170355sxlyjzsxclvecxs3.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202304/30/170356yatphtptwnhquahq.gif',
          40,
        ],
      },
      '露娜弗蕾亚·诺克斯·芙尔雷': {
        1: [
          'https://img.gamemale.com/album/202309/28/155639obu4tuggngzzbtnz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/28/155640pvv6g46bs37t49h5.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202309/28/155641wvfv34vmccm3pdvg.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202309/28/155641pagzkwu23sof86yz.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/28/155642wmcbk015n17rbnwo.gif',
          124,
        ],
      },
      凯尔: {
        1: [
          'https://img.gamemale.com/album/202309/27/171120kxsyx8zuqese68u3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171123wvveijv3um23if5i.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202309/27/171151u8kklutm89muxqrr.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/28/143403rtxrvkl5x71zeklk.gif',
          82,
        ],
      },
      莫甘娜: {
        1: [
          'https://img.gamemale.com/album/202309/27/171051pgnanjgkfnnkjype.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171052uk4szyx4f982okux.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202309/27/171054keztg7755pzezgve.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/28/143356q1dvdavay7g2m275.gif',
          82,
        ],
      },
      '阿尔瓦罗·索莱尔': {
        1: [
          'https://img.gamemale.com/album/202309/27/171257xrz2r72ab558wbb2.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171259gy0guguk0bybb50n.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202309/27/171303ms4yv6ovjfffc6bf.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202309/27/171307rrlt2lykktpn2r5p.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/27/171315bv98lhv0oh0k9xmh.gif',
          82,
        ],
      },
      '纣王·子受': {
        1: [
          'https://img.gamemale.com/album/202309/27/171212jq39t0jq22j9t7tx.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171215dkaj7re0ohwneoho.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202309/27/171218mjh122k3yiqqqaxr.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202309/27/171223pbyyjbybiv5bbhbv.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202309/27/171245uzbsx1trn666ssxq.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/27/171251me1q5s0ca5ul2sjn.gif',
          82,
        ],
      },
      阿齐斯: {
        1: [
          'https://img.gamemale.com/album/202309/27/171154boz3e3oab2s65oos.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/171155wnjvybtjh5ozthxi.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202309/27/171157mmjj5afy5jgtamff.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/27/171203ojdxjmftqxxw4fhx.gif',
          124,
        ],
      },
      百相千面: {
        1: [
          'https://img.gamemale.com/album/202309/27/174058owss14ie1x44ak1y.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202309/27/174121xns2rqbbl0yzql1n.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202309/27/174149vax9ea01z0aj82a2.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202309/27/174241t4pk4gb9pk4jggpb.gif',
          124,
        ],
      },
      猛虎贴贴: {
        1: [
          'https://img.gamemale.com/forum/202308/27/160606llqdux7jqoxm7itj.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202308/23/225040zkkhhk51abk4kmaz.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202308/23/225041pqeqqzzfbpfpbgfh.gif',
          124,
        ],
      },
      白巧克力蛋: {
        1: [
          'https://img.gamemale.com/forum/202308/27/160217p7tp706nvn7eyeni.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202308/23/225006lfeiz94efe94fe4y.gif',
          40,
        ],
      },
      灵藤蛋: {
        1: [
          'https://img.gamemale.com/album/202402/09/010216v9r22kq9qqeeoqvk.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202402/09/010216h0rfrngv7fdzazzn.gif',
          40,
        ],
      },
      令人不安的契约书: {
        1: [
          'https://img.gamemale.com/album/202308/23/225031ghmrdmrhborbi4ir.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202308/23/225031amakkrn6u88vxo6b.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202409/16/142957ygjff54olmpp8u57.gif',
          40,
        ],
      },
      星籁歌姬: {
        1: [
          'https://img.gamemale.com/album/202308/23/225950v1tnkkz4ucfzku4k.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202308/23/225125atclopop44watwbc.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202308/23/225125tox7qydlqlrvlxur.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202308/23/225126r1r4ujsuq6y7m44q.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202308/23/225129ur03szcrwzxopjj0.gif',
          124,
        ],
      },
      维涅斯: {
        1: [
          'https://img.gamemale.com/album/202308/23/225107iznk8qhhv45nhh4e.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202308/23/225108rk2ux2nsmuakx2xs.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202308/23/225954hv50rn58v7js58j0.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202308/23/225111zdl8b4aa2fif46bl.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202308/23/225112c7t3reez7t3rg0kt.gif',
          82,
        ],
      },
      刀锋女王: {
        1: [
          'https://img.gamemale.com/album/202308/23/225014s5i6ikgiz4gkkmk0.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202308/23/225016zqhuvbaeuv75umvv.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202308/23/225017z0z651k4k1xu06lx.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202308/23/225019t53i3bxxihchhb3u.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202308/23/225021egttqdzd01d1s1v3.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202308/23/225022ffm0k7tuvuttd7mo.gif',
          124,
        ],
      },
      天照大神: {
        1: [
          'https://img.gamemale.com/album/202308/23/225100kcrbpeodpfq3rayr.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202308/23/225101k0r0s0tls00ursss.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202308/23/225103tmedmppbtezutr7w.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202308/23/225959pgdxha00nuzifean.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202308/23/230001or552oyq57wz4o2o.gif',
          124,
        ],
      },
      '桑克瑞德·沃特斯': {
        1: [
          'https://img.gamemale.com/album/202308/23/225046fztqwr4yrtqpsysp.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202308/23/225047zulkkwdxewwcek0f.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202308/23/225048c8fkfr0lwh2nl88r.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202308/23/225050dguvtddpdxp8ldqu.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202308/23/225051e3hcl8ecycwl3u8h.gif',
          82,
        ],
      },
      '『星河碎片』': {
        1: [
          'https://img.gamemale.com/album/202308/21/112642ks1p19sz2f73y3p3.gif',
          40,
        ],
        Max: ['', 40],
      },
      '『迷翳森林回忆录』': {
        Max: [
          'https://img.gamemale.com/album/202308/08/230549joklkzk9ub3ofigg.gif',
          40,
        ],
      },
      '『迷翳之中』': {
        初级: ['', 40],
        1: [
          'https://img.gamemale.com/album/202307/29/174031micetmtirimibi1d.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202307/29/174035px6mn7xssl5gm5mx.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202308/08/155653p419ac9jj91y1z9c.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202308/13/064645eiw9g11gwkgoiz6m.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202308/08/155705bx4h1r3t4577175v.gif',
          40,
        ],
      },
      '『灰域来音』': {
        1: [
          'https://img.gamemale.com/album/202307/14/225151e4hbl6r2el6hl6bh.gif',
          40,
        ],
        Max: ['', 40],
      },
      狱炎蛋: {
        1: [
          'https://img.gamemale.com/album/202409/16/143228usv5ci9i5lj4csn4.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202409/16/143007gaei9vnnp5ae9gga.gif',
          82,
        ],
      },
      散佚的文集: {
        1: [
          'https://img.gamemale.com/album/202306/05/200907iiuk6kq7ii6m1kou.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202306/05/200907kjky2bwxdbhylgch.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202306/05/200908l8utbdzqc8okuz7m.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202306/05/200908vdekoukd1xuifkxx.gif',
          82,
        ],
      },
      女神之泪: {
        1: [
          'https://img.gamemale.com/album/202306/05/200900c758hbr54p55g5gb.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202306/17/212524pb9auww3t6yz59w9.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202306/17/212525ollay9nl7b02bq7n.gif',
          40,
        ],
      },
      '希尔瓦娜斯·风行者': {
        1: [
          'https://img.gamemale.com/forum/202303/02/072938r8mamoh4agyyjxn1.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202306/05/200932rhhp1726fgae74lf.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202306/05/200935ryni4xtaz433zxtx.gif',
          124,
        ],
        4: ['https://thumbsnap.com/i/JN72ke36.gif', 124],
        Max: [
          'https://img.gamemale.com/album/202306/05/200940fz4141p0b33abbm0.gif',
          124,
        ],
      },
      死亡: {
        1: [
          'https://img.gamemale.com/album/202306/05/200916hr7qsou1rgvqovvr.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202306/05/200917ev4nkccjzp5jp5qv.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202306/05/200919fs9rwenni65o959a.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202306/05/200920x6xq1ei40upu16pb.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202306/05/200921bakmikksmz8v3ko6.gif',
          124,
        ],
      },
      弗图博士: {
        1: [
          'https://img.gamemale.com/album/202306/05/200849ilvrrv8yrlvr8nqh.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202306/05/200851vvwk8p5m885majm6.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202306/05/200853c1vymmm2jx7j7iox.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202306/05/200855jyf25vvy62rvyv5c.gif',
          82,
        ],
      },
      '不屈之枪·阿特瑞斯': {
        1: [
          'https://img.gamemale.com/album/202306/15/221212d7lakywkxowo0jaz.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202306/05/200827lwmwvfw3nvzbibdx.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202306/15/221221ji2tt4u7h4tpp27t.gif',
          82,
        ],
      },
      '【周年限定】克里斯(8)': {
        1: [
          'https://img.gamemale.com/album/202304/30/170318hive1hsql2dzxjtc.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202304/30/170319olg9tb846okddv18.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202304/30/170320tkzj1jkkweashgj8.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202306/15/220534osku6fxfv95cxvak.gif',
          124,
        ],
      },
      破旧打火机: {
        1: [
          'https://img.gamemale.com/album/202304/30/170357h572s7bc9jbd3zon.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202304/30/170358vgc9sp6cfiz6zy9z.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202304/30/170359di11bbbisws1i13z.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202304/30/170359sd1y39rqay3h26y0.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/202304/30/170400r9ssrslg9g2skw12.gif',
          40,
        ],
        6: [
          'https://img.gamemale.com/album/202304/30/170400jz8i1fxnhd71uhmn.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202304/30/170401kxxgajfqnkk8q7kn.gif',
          40,
        ],
      },
      山村贞子: {
        1: [
          'https://img.gamemale.com/album/202304/30/170345t51dvc4zdw7xwddn.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202304/30/170346mmw4d774dhzh4h7w.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202304/30/170347lq9z9pv3vtehvwpp.gif',
          82,
        ],
      },
      '蒂法·洛克哈特': {
        1: [
          'https://img.gamemale.com/album/202304/30/170305w66a6geyihgl1m31.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202304/30/170306rgcc8bgl9osofssf.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202304/30/170307fyxez3s6l97vze03.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202304/30/170309nm779bzmnd937dz9.gif',
          82,
        ],
      },
      '九尾妖狐·阿狸': {
        1: [
          'https://img.gamemale.com/album/202306/05/200857sjjbu55f6ydsujfc.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202306/05/200857n1y3fksqeeqza3yy.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202306/15/220517dc8nkquysppqum8h.gif',
          82,
        ],
      },
      '勒维恩·戴维斯': {
        1: [
          'https://img.gamemale.com/album/202304/30/170325qsx06znn672bfzts.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202304/30/170327h5dihajilfih2f42.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202304/30/170329zv4f0yqg64yufv4u.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202304/30/170330oihi8hihn8fxuisl.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202304/30/170332jj33yo39iqw6pwzr.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202304/30/170334zid5t5dktrxxxrg7.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/album/202304/30/170336r5kavq96ekkssze0.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/202304/30/170338ol5knba5o1ajp6jk.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202304/30/170339idhwogaflzsstked.gif',
          124,
        ],
      },
      '擎天柱（Peterbilt389）': {
        1: [
          'https://img.gamemale.com/album/202209/08/220208d63m8xp7fcmms0s6.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/220214ia71cc6k6j6ck1cz.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202209/08/220219jyj18g3sc5c2szyg.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/forum/202306/09/052307xdkw8ida9wdpwzp7.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220237iu2eys9heee4cuer.gif',
          82,
        ],
      },
      '丹·雷诺斯': {
        1: [
          'https://img.gamemale.com/album/202304/30/170250g8n1829k07r36vqw.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202304/30/170252ia3aji55jlwwiiww.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202304/30/170253innxg3ocvxlx99n7.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202304/30/170255kd7y4i7mnccfidh4.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202304/30/170257glxiao449tiqzahi.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202304/30/170258b960vvn0kkrgcjbm.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202304/30/170259sx8ocrcnzwocsygk.gif',
          124,
        ],
      },
      謎の男: {
        Max: [
          'https://img.gamemale.com/album/201405/27/053852jwsj9l9ztt9rwhsj.gif',
          40,
        ],
      },
      'Chris Redfield in Uroboros': {
        Max: [
          'https://img.gamemale.com/album/201505/23/100504y3jplburl1zk5l2u.gif',
          40,
        ],
      },
      杀意人偶: {
        1: [
          'https://img.gamemale.com/album/202312/20/210418m3ba2etec3tmh3nv.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202312/20/210420zbct69htehxe63v1.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202312/20/210422drmbh856mnhbmrxn.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202312/20/210425ssyt7nl9nhj7j1kz.gif',
          82,
        ],
      },
      雷霆晶球: {
        1: [
          'https://img.gamemale.com/album/202209/08/233422tkiq6aa6ypy6ilnx.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/08/233422h99ccgcddz4cczpd.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/233423fshlbbdyh5ayfuek.gif',
          40,
        ],
      },
      思绪骤聚: {
        1: [
          'https://img.gamemale.com/album/202209/08/233429fjwuucg8081nsujw.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202209/10/112912rflnu3koumyn52sm.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/233429hfrm5f4fjf47rm4j.gif',
          124,
        ],
      },
      闪光糖果盒: {
        Max: [
          'https://img.gamemale.com/album/202209/08/220404nxj7eqjzr66ul7uj.gif',
          40,
        ],
      },
      茉香啤酒: {
        1: [
          'https://img.gamemale.com/album/202209/08/220344nxn1i33r930xnlii.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202209/08/220345t07gtdb7zdlpsmls.gif',
          40,
        ],
      },
      太空列车票: {
        1: [
          'https://img.gamemale.com/album/202406/07/175254x3pg346a3r0aph7h.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202406/07/175255z1948s303e3o4t41.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202406/07/175255jcxvaozv3vm5ycyz.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202406/07/175258pdrcqdu07lvy0uvc.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/175259sg0tnb6xmjtvcjxv.gif',
          82,
        ],
      },
      艾利克斯: {
        1: ['', 82],
        2: [
          'https://img.gamemale.com/album/202304/30/170234q338jm2ow9k2v24t.gif',
          82,
        ],
        3: ['', 82],
        4: [
          'https://img.gamemale.com/album/202305/01/151527c2qaqzqlm4x2l802.gif',
          82,
        ],
        5: ['', 82],
        Max: [
          'https://img.gamemale.com/album/202304/30/170240l5e5ee2aaqz5zp52.gif',
          82,
        ],
      },
      金翼使: {
        Max: [
          'https://img.gamemale.com/album/202405/30/104609wjzazru8lsaa4bza.gif',
          40,
        ],
      },
      照相机: {
        Max: [
          'https://img.gamemale.com/album/202405/21/111620tshz4cnc6kfsk36x.gif',
          40,
        ],
      },
      '吉尔·沃瑞克': {
        1: [
          'https://img.gamemale.com/album/202406/07/175326ewom7pmvg8n8878j.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202406/07/175327cgzp88cjljepaoqe.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202406/07/175328gak384jr0qku4610.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202406/07/175329pkumhmuxqwzmwuwu.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/175331rsra1a4wqak8puzr.gif',
          124,
        ],
      },
      '希德法斯·特拉蒙': {
        1: [
          'https://img.gamemale.com/album/202406/07/175409ab60kf4o3o4jbdut.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202406/07/175411qwtcw2w19r2u4hfs.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202406/07/175412huxhwu3g435u3f00.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/175415w552ty5e2oosqtt8.gif',
          124,
        ],
      },
      神秘挑战书: {
        1: [
          'https://img.gamemale.com/album/202406/07/175339ugwzt9y65i7tz3jy.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202406/07/175340qp9yib26wmzw6r2m.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202406/07/175341ckazei4t4kjkatoo.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202406/07/175342yz0a8kjpn9ii43jp.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202406/07/175343vlu7llurj10lrgqj.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202406/07/175344qnuwx7ee7zj5ln7x.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/album/202406/07/175345v5ubrggvnb1ggsbg.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/202406/07/175346h3ffjjfo3ofgv2fj.gif',
          124,
        ],
        9: [
          'https://img.gamemale.com/album/202406/07/175347npnp3ph2zfppqxoz.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/175347fg7acj3rajgcmlqm.gif',
          40,
        ],
      },
      坏掉的月亮提灯: {
        1: [
          'https://img.gamemale.com/album/202406/07/175315htzt1kzrx7xwnthe.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/175315ktt311toutu3z53u.gif',
          40,
        ],
      },
      吸血猫蛋: {
        1: [
          'https://img.gamemale.com/album/202406/07/175359ynnx4omm45xmm8u5.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202406/07/175400kclgtlj6c2fej37v.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202406/07/175400rkyhf0zvkyh81xkm.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/175401ejl62lwaub8n2nr8.gif',
          40,
        ],
      },
      装了衣物的纸盒: {
        1: [
          'https://img.gamemale.com/album/202406/07/175444b09ca8u138uz301a.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202406/07/175444ibbsmzvyy1b77v5r.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/175445iflefeaj4enafknz.gif',
          40,
        ],
      },
      '狄翁・勒萨若': {
        1: [
          'https://img.gamemale.com/album/202406/07/175304re1d73zno19n37pn.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202406/07/175305lf3uwwfvqwat2wqk.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202406/07/175306r8tert08y8ws9dwk.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202406/07/175308jki23rz8z38s2r83.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202406/07/175309hyal99plxwanxpna.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/175311zmnhmmn9m9ymeu9m.gif',
          124,
        ],
      },
      五谷丰年: {
        1: [
          'https://img.gamemale.com/album/202406/09/002607r5tnl5kmhlz959ky.gif',
          82,
        ],
        2: [
          'https://img.gamemale.com/album/202406/07/204132kz1rjrx7a0b09x1l.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202406/07/204132roou661udo1borrj.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/07/205420sdk9871c4qeedu4e.gif',
          124,
        ],
      },
      '库伦 (审判)': {
        1: [
          'https://img.gamemale.com/album/201506/30/100229gqdnldqo1pdyouyp.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201506/30/100231lnikkp2yah8rk8ns.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/201506/30/100233xkttdtsss9e94bdb.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201506/30/100236nlx10m5j5nq6hqnx.gif',
          82,
        ],
      },
      '库伦 (起源)': {
        1: [
          'https://img.gamemale.com/album/201407/16/104751vvazr322erx6gh5w.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/201407/16/104753wu8ss9spsc9sww8w.gif',
          40,
        ],
      },
      变身器: {
        1: [
          'https://img.gamemale.com/album/202406/12/191431hrdjr2wwrjs2aals.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202406/12/191250bphrvoy0vc65v8i9.gif',
          40,
        ],
      },
      GM村蛋糕: {
        Max: [
          'https://img.gamemale.com/album/202107/19/221939iuudd2nzuzrum3nu.gif',
          40,
        ],
      },
      半生黄金种: {
        1: [
          'https://img.gamemale.com/album/202409/16/140404o83gefe3h359zy5p.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202409/16/140404zary8xxas7y8yk88.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202409/16/140405dgucuc8v8wmiv8u8.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202409/16/140405mxddk0zeeex4cc4e.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202409/16/140406l5r28tp9u9t5ctcu.gif',
          40,
        ],
      },
      Zootopia: {
        1: [
          'https://img.gamemale.com/album/202409/16/140353vctzzx24yibo72yz.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/202409/16/140354qn1fclyasgr1zaal.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202409/16/140355mpqbw29bqiqpqzz7.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202409/16/140355q606wmwm655hu61c.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202409/16/140356hzqhdxmo6oo9cnbu.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202409/16/140357q3y3cyhqdz747y43.gif',
          124,
        ],
      },
      肃弓: {
        1: [
          'https://img.gamemale.com/album/202409/15/173905mvtfxplpppk17eem.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202409/15/173905azn6osbxk6keerwr.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202409/15/173906t84iogk8g3cym4ip.gif',
          40,
        ],
      },
      叶卡捷琳娜: {
        1: [
          'https://img.gamemale.com/album/202409/16/140425lccavwcaa5y0w9we.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202409/16/140425fcpc86m2jj2cicmp.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202409/16/140426lvgzooqmxnyqomrk.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202409/16/140428jxnzncsu2ncaypka.gif',
          124,
        ],
      },
      '莱昂纳多·迪卡普里奥': {
        1: [
          'https://img.gamemale.com/album/202409/16/140418fwkwz38bqmtbj3i9.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202409/16/140418dxnldwo8xpnf0a0d.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202409/16/140419g00xxtd64ceewh6v.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202409/16/140420jclmmp0ofl2ipstn.gif',
          124,
        ],
      },
      迷之瓶: {
        Max: [
          'https://img.gamemale.com/album/201904/25/220040n3u53zuebuaa10a3.gif',
          40,
        ],
      },
      '布莱恩‧欧康纳': {
        1: [
          'https://img.gamemale.com/album/201406/22/044720ul88z5dldl1odwxr.gif',
          40,
        ],
        2: ['', 82],
        3: [
          'https://img.gamemale.com/album/201406/22/044722kicxs72q2aczqzu2.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201406/22/044725arsuzrs4vgweluwv.gif',
          82,
        ],
      },
      老旧的怀表: {
        1: [
          'https://img.gamemale.com/album/201912/18/134204wcx44hqqa4xr4xcd.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201912/18/133654lk3vpwjvkthi2ui3.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202001/26/135105odnqnnzi99iixncz.gif',
          40,
        ],
      },
      '里昂‧S‧甘乃迪': {
        1: [
          'https://img.gamemale.com/album/202305/01/151513emxqggcf0qbbt9b2.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202305/01/151514vssr59s95brgllci.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202305/01/151515zkp1k65h8pbjuv60.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202305/01/151802hyiww7ter7dwtwgd.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202305/01/151516ke4gxwhh45rx77k9.gif',
          40,
        ],
      },
      '维克多‧天火': {
        1: [
          'https://img.gamemale.com/album/201508/29/061434xqhzkxed59mzzuon.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/201508/29/061434x2lngcl8lz62v2d6.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/forum/202209/15/222129x2cj2f906000905s.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/201508/29/061435lcfkyy1ywbg5fpww.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201508/29/061435ebbaab1jczbn64nn.gif',
          40,
        ],
      },
      '『任天堂Switch』灰黑√': {
        初级: [
          'https://img.gamemale.com/album/202303/02/123318m1vu898ponxx9jp3.gif',
          82,
        ],
        1: [
          'https://img.gamemale.com/album/202303/02/125534hntc1o7nioiv0ekz.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202303/02/124057tl9kz0ahcwczcnid.gif',
          82,
        ],
      },
      '『任天堂Switch』红蓝√': {
        初级: [
          'https://img.gamemale.com/album/202303/02/123315m5czjrpjp5pcjwek.gif',
          82,
        ],
        1: [
          'https://img.gamemale.com/album/202303/02/125534e3zc5ch9suoifucs.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202303/02/124057qvnd5ct6hldcl6si.gif',
          82,
        ],
      },
      '丹妮莉丝·坦格利安': {
        1: [
          'https://img.gamemale.com/album/202306/05/200836mysbnlb3s3soul0s.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202306/05/200838rnk3k6t5b662kj3m.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202306/05/200841ds1jsxzxjs4ernpj.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202306/05/200845r40hhaw3yya43fad.gif',
          124,
        ],
      },
      时间变异管理局: {
        1: [
          'https://img.gamemale.com/album/202204/29/211647njii9gpu9qjzjwye.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/202204/29/211647dvnmpvvm7vr114vq.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202204/29/211648w24t6pm1ie41wlmh.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202204/29/211648ooll00l3lef6qj7z.gif',
          124,
        ],
      },
      白猪猪储蓄罐: {
        1: [
          'https://img.gamemale.com/forum/201911/11/165635wd5bcebtdjaebepa.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/201911/09/214507q8opzuoppdzi7mpp.gif',
          40,
        ],
      },
      粉猪猪储蓄罐: {
        1: [
          'https://img.gamemale.com/forum/201911/11/165647dgkfk5qvkzfgwk0l.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/forum/201911/22/133725tppgcu4v2mpxuw4c.gif',
          40,
        ],
      },
      金猪猪储蓄罐: {
        1: [
          'https://img.gamemale.com/forum/201911/11/165658y2ssspe297cptwk9.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/forum/201911/24/191657xgogg0alz9zoazle.gif',
          40,
        ],
      },
      古烈: {
        1: [
          'https://img.gamemale.com/album/202412/23/163416jie6vbi4h2ldaldd.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202412/23/163417gljxiexrpxjijmnh.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/forum/202412/25/112901rzla8rttgnt88b8l.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202412/23/163419g6z8chx8ht46shje.gif',
          82,
        ],
      },
      奇异博士: {
        1: [
          'https://img.gamemale.com/album/202412/23/095416x8a312vrzh112rvt.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202308/06/210941v12xuljt1hu8hhux.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202308/06/210934ez617h4s3353f3z3.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202412/23/095418my80lg8zyz8vm00t.gif',
          124,
        ],
      },
      '托比·马奎尔': {
        1: [
          'https://img.gamemale.com/album/202412/23/163425ofaqmggiupaamq9j.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202412/23/163426h6e144o5i4vwvaea.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202412/23/163427opzekrrplre2es06.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202412/23/163428y7ov4bzb11qho1v7.gif',
          82,
        ],
      },
      阿丽塔: {
        1: [
          'https://img.gamemale.com/album/202412/23/095404ugtagdho9anott2s.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202412/23/095405gy2o58m8mryrm0z2.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202412/23/095406a9574coxlyxcxy08.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202412/23/095407yg789q3nr9jyru8h.gif',
          124,
        ],
      },
      圣诞有铃: {
        1: [
          'https://img.gamemale.com/album/202412/23/095426suun7z8kv8g6qprt.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202412/23/095427djnuus0gjnp4kpn1.gif',
          40,
        ],
      },
      羽毛胸针: {
        1: [
          'https://img.gamemale.com/album/202412/23/095434xzlgkosq7glpdppl.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202412/23/095435bzpwtp68ps44t2pv.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202412/23/095436g9jeewz4hahg42pp.gif',
          40,
        ],
      },
      '【新春限定】果体 隆': {
        1: [
          'https://img.gamemale.com/album/202412/23/095408ykewseqs3kvs3ofs.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202412/23/095409m131uul13j6rjrrs.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202412/23/192101lgkmzaurp2vljkn4.gif',
          82,
        ],
      },
      汉尼拔: {
        1: [
          'https://img.gamemale.com/album/202501/27/150200nnlkqxrdtrw9i7tr.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202501/27/150202u6i3yn4b1ybo81c8.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202501/27/150203cep1xf5gxxf2pogo.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202501/27/150203p7ybm2vjn2t7ul5f.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202501/27/150204hwysuurum3a2wa3s.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202501/27/150205fmppqvndidmqxy4q.gif',
          82,
        ],
      },
      梅琳娜Melina: {
        1: [
          'https://img.gamemale.com/album/202501/27/150301apgg7lfldzdfgy7z.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202501/27/150302elj2ngkceo6z8e6r.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202501/27/150303qvpcr0rr0ze44ivd.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202501/27/150303fjmfx733a6pm1j6j.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202501/27/150304mmbcfxt5tbmw8ata.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202501/27/150305sd1zi3l1gi431ls3.gif',
          124,
        ],
      },
      '贝儿(Belle)': {
        1: [
          'https://img.gamemale.com/album/202501/27/195024f3w3439syy9mhbzy.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202501/27/195025s23swd1cqg5wsngw.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202501/27/195026f29w92jbdall99ke.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202501/27/195027tyxex9dymf7qz9f8.gif',
          82,
        ],
      },
      普通羊毛球: {
        1: [
          'https://img.gamemale.com/album/202501/27/131014lijfad666oxd26a3.gif',
          40,
        ],
        2: ['', 40],
        3: [
          'https://img.gamemale.com/album/202501/27/131955nzc7v6vjw744k26c.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202501/27/132947foobk4oar9opbrci.gif',
          40,
        ],
      },
      神秘天球: {
        1: [
          'https://img.gamemale.com/album/202501/27/150316yk83gh2vkwvh2h33.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202501/27/150316p6p5x6zb51iuktog.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202501/27/150317uzsl63blllziueso.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202501/27/150318hbbbjry1yxafpxcx.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202501/27/150318okp8zfevfzpubs1j.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/202501/27/150325xdl061ykky6lyv0r.gif',
          82,
        ],
        7: [
          'https://img.gamemale.com/album/202501/27/150326u7f9qwxxel7h7wld.gif',
          82,
        ],
        8: [
          'https://img.gamemale.com/album/202501/27/150327mqhh7q45h0erabyq.gif',
          82,
        ],
        9: [
          'https://img.gamemale.com/album/202501/27/150328mj3zee1j32888ban.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202501/27/150329v30p5vva8485p113.gif',
          124,
        ],
      },
      婚姻登记册: {
        1: [
          'https://img.gamemale.com/album/202501/27/150249heu2zbzlb5rkhhzh.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202501/27/150250odm1kbhrqftc5d51.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202501/27/150250rzoq8xd5ao89c95o.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202501/27/150251xggsydawwgzyywls.gif',
          40,
        ],
        5: ['', 40],
        6: [
          'https://img.gamemale.com/album/202501/27/150252wkfnfug2cgu2fue1.gif',
          40,
        ],
        7: [
          'https://img.gamemale.com/album/202501/27/150253b5syidtzdb7i857m.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202501/27/150253de4nywy1qnyz233e.gif',
          40,
        ],
      },
      健忘礼物盒: {
        1: [
          'https://img.gamemale.com/album/202501/27/150043v68l4oo4tzovf8va.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202501/27/150043ient9wehont94knh.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202501/27/150043le6srpd0vmr90sz6.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202501/27/150044d41s5sh7qahshqsq.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202501/27/150044dkzbbyz3d9gg2gad.gif',
          40,
        ],
      },
      脏兮兮的蛋: {
        1: [
          'https://img.gamemale.com/album/202501/27/150400injmnyggygo7y8mx.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202501/27/150401lkk57h7pkghk35h5.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202501/27/151231q9ipy325gsow6hzj.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202501/27/151412g7qzd77z3fsxabd7.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/202501/27/151412b34d6r4ped3z860m.gif',
          40,
        ],
        6: ['', 40],
        Max: [
          'https://img.gamemale.com/album/202501/27/150402l52szqvsqlgpytsl.gif',
          40,
        ],
      },
      'John Reese': {
        1: [
          'https://img.gamemale.com/album/202505/01/004248quy2mf2qpae7hpq7.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202505/01/004250et2ws5t1ht00w1ws.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202505/07/182955pp8844puzrto56ir.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202505/01/004257c6htuohdtc6uucla.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202505/07/183000nyzny30rl35ho5ru.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202505/01/004300onmynzz53nx06q4r.gif',
          124,
        ],
      },
      穿靴子的猫: {
        1: [
          'https://img.gamemale.com/album/202505/01/004325yyifpuf9tptlnhk9.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202505/01/004327i13uxooqn2eounht.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/forum/202505/06/211024yohp98glplhrhepz.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202505/01/004332j1wgew8nvnywna1n.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202505/01/004334kkp4yqpwf5qqwppr.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202505/01/004337umagz9s1z9cgg8zf.gif',
          124,
        ],
      },
      狗狗: {
        1: [
          'https://img.gamemale.com/album/202505/02/002033bfzr5qpq2prtzhq5.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202505/02/002035gfod11fdspdb3osd.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202505/02/002038pzhc80okc8cn0io5.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202505/01/004344ayzuz2yqy6396t26.gif',
          82,
        ],
      },
      '阿加莎·哈克尼斯': {
        1: [
          'https://img.gamemale.com/album/202505/01/004308olixxxlgxikxehr4.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202505/01/004313oqmzi3zt6zshgiir.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/forum/202505/02/010838z4l0szgqsll2qges.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202505/01/004319qqak34jahahmi294.gif',
          124,
        ],
      },
      圣水瓶: {
        1: [
          'https://img.gamemale.com/album/202505/01/004402n7ysdyodzaa5spd3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202505/01/004404cdhchnzsbdys2zns.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202505/01/004405zvmqsddzcbaaxpqq.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202505/01/004406jen4f4f5p4a7fxnp.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202505/01/004408c9999akrclzao9cz.gif',
          40,
        ],
      },
      弯钩与连枷: {
        1: [
          'https://img.gamemale.com/album/202505/01/004428sgh1zz1cjrdgdqhj.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202505/01/004429ze1dgefej66eq66v.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202505/01/004429ekyzdamczdzaoyeo.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202505/01/004430ozb5jt1wwccekdc1.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202505/01/004430f3wtkwjdd5rwetzq.gif',
          40,
        ],
      },
      巴哈姆特: {
        1: [
          'https://img.gamemale.com/album/202506/09/013056yuk6ktfkk5idx6f3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202506/09/013057n1mlblmlm52my2kg.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202506/09/013059comd45ch7eemm44u.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202506/09/013101r909mlb0fjkb5lkm.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202506/09/013102upwttdt7t2h3t95m.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202506/09/013103i4ewz5hel0lesb1b.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202506/09/013104n3xgk21x3vveg5gg.gif',
          124,
        ],
      },
      '约翰·康斯坦丁': {
        1: [
          'https://img.gamemale.com/album/202506/08/195324p9s5ftjlt0vdtfml.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202506/08/195327bw8blev6c846llzx.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202506/08/195328pj1dlf1def5uh7me.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202506/08/195330rnltblybyb7jpnnr.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202506/08/195332ajgmqogjgz2bo2a2.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/202506/08/195333bdhhqgpj3fgyl3x6.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202506/08/195334r90ussyyy3gyes6y.gif',
          124,
        ],
      },
      牛局长博戈: {
        1: [
          'https://img.gamemale.com/album/202506/08/195014is28hp78w8wf7zrc.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202506/08/195015kgjhh2lxfgz2jlhk.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202506/08/195017cyyly3grl7lwapig.gif',
          82,
        ],
      },
      '亨利.卡维尔': {
        1: [
          'https://img.gamemale.com/album/202506/08/203801rbrb85pyx75tkl5y.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202506/08/194946fmmhaozsa3pw5mgl.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202506/08/194947h7fkz0wf11ge3hfz.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202506/08/194948ks0gt7zgujgggmos.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202506/08/194950lf0wsdzcbcswb1st.gif',
          124,
        ],
        6: [
          'https://img.gamemale.com/album/202506/08/194951x2yg1dm1lyn2h11h.gif',
          124,
        ],
        7: [
          'https://img.gamemale.com/album/202506/08/194952lg6mp2g3p12c6pfm.gif',
          124,
        ],
        8: [
          'https://img.gamemale.com/album/202506/08/194954prn3kt7rq55wr3pw.gif',
          124,
        ],
        9: [
          'https://img.gamemale.com/album/202506/08/194956rfkfafaofakoaxno.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202506/08/194957e1vq1tseqvea3i33.gif',
          124,
        ],
      },
      红夫人: {
        1: [
          'https://img.gamemale.com/album/202506/08/195002czeqbafiwb93waaa.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202506/08/195003ssuijyy0ui4vi0bj.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202506/08/195004pueou0pr01zende3.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202506/08/195006mlirnsx7yxzoasxf.gif',
          124,
        ],
      },
      '莉莉娅·考尔德（Lilia Calderu）': {
        1: [
          'https://img.gamemale.com/album/202506/08/194859o5978ztrzfy7877q.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202506/08/194900ix8z8t3cucudz843.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202506/08/194901agw28ogwy60zyglj.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202506/08/194902pnsg1kxx66te6stv.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202506/08/194904h95iyqri99iiraf0.gif',
          82,
        ],
        6: [
          'https://img.gamemale.com/album/202506/08/194905a8fhlhjjl3m7xfjl.gif',
          82,
        ],
        7: [
          'https://img.gamemale.com/album/202506/08/194906cmy715p7e628s3ve.gif',
          82,
        ],
        8: [
          'https://img.gamemale.com/forum/202506/09/102518t2ql1gy2e9qssz2i.gif',
          82,
        ],
        9: [
          'https://img.gamemale.com/album/202506/08/194909qwf84m7wwzl877on.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202506/08/194910hmt4t3s009lmsb0z.gif',
          124,
        ],
      },
      尼特公仔: {
        1: [
          'https://img.gamemale.com/album/202506/08/173307lrimmij9h9krghpx.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202506/08/173308odt7gwlwgc2zgw6t.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202506/08/173309f36ks66jkp6nxr8r.gif',
          40,
        ],
      },
      女巫之路: {
        1: [
          'https://img.gamemale.com/album/202506/08/195022o5gmfjlwzg2jw6ju.gif',
          124,
        ],
        2: [
          'https://img.gamemale.com/album/202506/08/195024eo3v86w16uoh1n3w.gif',
          124,
        ],
        3: [
          'https://img.gamemale.com/album/202506/08/213529uozqagbc9nolwnfq.gif',
          124,
        ],
        4: [
          'https://img.gamemale.com/album/202506/08/195027n86ob7jw64fnr0p7.gif',
          124,
        ],
        5: [
          'https://img.gamemale.com/album/202506/08/195028tpaaacmbll000rbp.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202506/08/195030vjltsxkyytx0osvt.gif',
          124,
        ],
      },
      '站员: 保卫领土': {
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201405/01/180018mo7huror8mzm7t7c.gif',
          40,
        ],
      },
      '见习版主: 神的重量': {
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201405/01/180032jpqlthqtqwlqhq3l.gif',
          40,
        ],
      },
      '版主: 一国之主': {
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/album/201405/01/180003ndvk1od2edda4bi1.gif',
          40,
        ],
      },
      '『还乡歌』': {
        初级: ['', 40],
        1: [
          'https://img.gamemale.com/album/202302/06/111902plsfztidxxxthnho.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202302/02/215205divfid6iiqivtf79.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202302/02/215208i9rbobbzolct7rkb.gif',
          40,
        ],
      },
      '纯真护剑㊕': {
        1: [
          'https://img.gamemale.com/album/202305/30/225653vhbtcxpzhmpcephh.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202305/30/230430rcfe70wfhcc227ch.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202405/31/215051dao7q8kxb8ckyb76.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202505/25/142732mx57txt4huugxt78.gif',
          40,
        ],
      },
      '『日心说』': {
        初级: ['', 40],
        Max: [
          'https://img.gamemale.com/album/202302/28/145327jebo3te43x6vegzx.gif',
          40,
        ],
      },
      '『搓粉团珠』': {
        Max: [
          'https://img.gamemale.com/album/202502/12/142803aq6uewseoouu6ei9.gif',
          40,
        ],
      },
      '『冰雕马拉橇』': {
        Max: [
          'https://img.gamemale.com/album/202501/05/123612ufb4m31zzm9kppmd.gif',
          82,
        ],
      },
      '『南瓜拿铁』': {
        Max: [
          'https://img.gamemale.com/album/202410/29/123843sl3l5l6f35tp6gf9.gif',
          40,
        ],
      },
      '『逆境中的幸运女神』': {
        Max: [
          'https://img.gamemale.com/album/202410/15/105948d0yik711643klqsp.gif',
          40,
        ],
      },
      '『钟楼日暮』': {
        0: [
          'https://img.gamemale.com/album/202407/29/161455conqqbfcbvonpizc.gif',
          40,
        ],
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/album/202407/29/163739p9ya9ky612dbpfyg.gif',
          40,
        ],
      },
      '『流星赶月』': {
        1: [
          'https://img.gamemale.com/album/202405/01/104737h8u40k09yb1buvhs.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202405/01/104737hf66ydgq417yp1pq.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202405/01/104738zbemlbquqcbhbew1.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202405/01/104738xr7w9rc9c9wkooo5.gif',
          40,
        ],
      },
      '『先知灵药』': {
        1: [
          'https://img.gamemale.com/album/202403/21/130027nqhli96ll11h9u2g.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202403/21/130053cgz5zto94bg5gbq9.gif',
          40,
        ],
      },
      '『酒馆蛋煲』': {
        Max: [
          'https://img.gamemale.com/album/202311/03/120708iaw8la01kii0ivl5.gif',
          40,
        ],
      },
      '『活动代币』': {
        初级: [
          'https://img.gamemale.com/album/202310/07/000733qml4gvgpclnv4up4.gif',
          40,
        ],
        1: [
          'https://img.gamemale.com/album/202310/07/000733qml4gvgpclnv4up4.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202305/20/185602szvpqoukkt131qm1.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202310/07/000733qml4gvgpclnv4up4.gif',
          40,
        ],
      },
      '『伊黎丝的祝福』': {
        初级: ['', 40],
        Max: [
          'https://img.gamemale.com/album/202306/08/011901dp5lhljtdtkkjhoh.gif',
          40,
        ],
      },
      '『弗霖的琴』': {
        Max: [
          'https://img.gamemale.com/album/202306/03/100026pr0bbg9g9g9dpnd8.gif',
          40,
        ],
      },
      '『瓶中信』': {
        1: [
          'https://img.gamemale.com/album/202305/15/213548uz03kdqqyd6iyrqh.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202305/20/112800hmp2pj8msp6wz2rj.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202305/20/185602szvpqoukkt131qm1.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202305/15/213548uz03kdqqyd6iyrqh.gif',
          40,
        ],
      },
      '『林中过夜』': {
        Max: [
          'https://img.gamemale.com/album/202505/10/121633so0o9ow80oxjt3xm.gif',
          40,
        ],
      },
      '『凯旋诺书』': {
        Max: [
          'https://img.gamemale.com/album/202505/10/152410e8mv881bg8b0bixw.gif',
          40,
        ],
      },
      '『绿茵甘露』': {
        Max: [
          'https://img.gamemale.com/album/202504/22/150929asgg6iuggqunggq6.gif',
          40,
        ],
      },
      '『道具超市』': {
        1: ['', 40],
        Max: [
          'https://img.gamemale.com/album/202503/22/124623xqwr8aww4q4wwa41.gif',
          40,
        ],
      },
      '『狄文卡德的残羽』': {
        Max: [
          'https://img.gamemale.com/album/202506/07/204727k4ecjcm9lg4i5ndb.gif',
          40,
        ],
      },
      '『厢庭望远』': {
        1: [
          'https://img.gamemale.com/album/202505/27/164710yzg8pkk1jqzxg28m.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202505/27/164130pfwowm6ufc1f0ycj.gif',
          40,
        ],
      },
      '『转生经筒』': {
        Max: [
          'https://img.gamemale.com/album/202307/01/075509auuke2lwximkxlwm.gif',
          40,
        ],
      },
      '“半狼”布莱泽': {
        1: [
          'https://img.gamemale.com/album/202510/01/143947yi5qlynxnnx9x5nx.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202510/01/143949v23dy8s28r6zuyta.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202510/01/143950e9i0d9fjpyqf00jd.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202510/01/143951egsqxxgshzxqxqph.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/143952jnjnd5xmknkj99aa.gif',
          124,
        ],
      },
      炽焰咆哮虎: {
        1: [
          'https://img.gamemale.com/album/202510/01/144038zo411cc2ewyywsss.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202510/01/144039fyyfsjtxa6ffgd08.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202510/01/144040fmhmgm60qjk3q7km.gif',
          124,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144041s9zstskkn86eeoo9.gif',
          124,
        ],
      },
      '傲之追猎者·雷恩加尔': {
        1: [
          'https://img.gamemale.com/album/202512/24/180340aoly1wozey22lmlo.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202512/24/180341xt4yx243wgukywcj.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202512/24/180342mvvkdp2rvz0ddvhd.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202512/24/180347fuu0x47g3gef30gg.gif',
          82,
        ],
      },
      '本・比格': {
        1: [
          'https://img.gamemale.com/album/202512/24/180400o3qdxbgd3xf3mxmg.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202512/24/180401xcsesc15dsr5szvf.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202512/24/180402qo4um80ioma1d314.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202512/24/180403c7jgq7ux7vua7x2x.gif',
          82,
        ],
      },
      高桥剑痴: {
        1: [
          'https://img.gamemale.com/album/202512/24/180702xqiqqag87ar52pj3.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202512/24/180703c5q54tn55h22255q.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202512/24/180704leraidpaewdwk08d.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202512/24/180705daa2ggcbtgs4bhk5.gif',
          82,
        ],
      },
      '基努·里维斯': {
        1: [
          'https://img.gamemale.com/album/202510/01/144130eaksgett6d4amets.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202510/01/144131fyz7nii59iaa5vyq.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202510/01/144133v3yd2gafjbb8u7yu.gif',
          82,
        ],
        4: [
          'https://img.gamemale.com/album/202510/01/144140xwej9dq0juqmjju8.gif',
          82,
        ],
        5: [
          'https://img.gamemale.com/album/202510/01/144136v56jse1c1zpps5ds.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144138r589ursw1z4p3ng6.gif',
          82,
        ],
      },
      '琴.葛蕾': {
        1: ['', 82],
        2: [
          'https://img.gamemale.com/album/202510/01/144212cc5fncef1cedlzlc.gif',
          82,
        ],
        3: ['', 82],
        4: ['', 82],
        Max: [
          'https://img.gamemale.com/album/202510/01/144221wp5886c8kk84fh6h.gif',
          82,
        ],
      },
      'Honey B Lovely': {
        1: ['', 82],
        2: [
          'https://img.gamemale.com/album/202510/01/144029vesqhohaidfs9nki.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202510/01/144030vxcjyx1yjcz202ww.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144031vzugutuwvu92lc8f.gif',
          82,
        ],
      },
      黑暗封印: {
        1: [
          'https://img.gamemale.com/album/202510/01/144057mdtrhy7kki44kuqe.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202505/25/160908ffjjmmbvjb4fc4vf.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202510/01/144059rsgw5kh6ssgvst34.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/forum/202505/25/160920qc2gp2dcp7decpg2.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/202510/01/144101m2assar0yfaluah0.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144102ovfggmf3cf44vfhv.gif',
          40,
        ],
      },
      枯木法杖: {
        1: [
          'https://img.gamemale.com/album/202510/01/144150n2r1bremrhxxbbn0.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/forum/202510/04/001631m5hug9ogyg5qoz55.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202510/01/144153ovv3q6vvjs01qees.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/forum/202510/04/001634dr1wwg8l36jy5w1q.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144155z99b87958zv1ex7m.gif',
          40,
        ],
      },
      千年积木: {
        1: [
          'https://img.gamemale.com/album/202510/01/144202w2mxg6rg33gr8532.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144203wbgg2cuv4u24c6uu.gif',
          40,
        ],
      },

      无限魔典: {
        1: [
          'https://img.gamemale.com/album/202512/24/180829oxqsxxxxnfprfxxd.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202512/24/180830fe4wdvcwwhx7vwdo.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202512/24/180831k2j94y19gyzs8mjg.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202512/24/180832c4damg4mpukbpblp.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/202512/24/180833h0sk183knceeskek.gif',
          40,
        ],
        9: [
          'https://img.gamemale.com/album/202512/24/180836c344jdzf4putu3jz.gif',
          40,
        ],
        20: [
          'https://img.gamemale.com/album/202512/24/180846xstt7drrz6yc6tty.gif',
          40,
        ],
        21: [
          'https://img.gamemale.com/album/202512/24/180847pf169fsw77f59ffr.gif',
          40,
        ],
        22: [
          'https://img.gamemale.com/album/202512/24/180848m4ssrwwwr1rse4so.gif',
          40,
        ],
        33: [
          'https://img.gamemale.com/album/202512/24/181000sc779mynn979nuc6.gif',
          40,
        ],
        39: [
          'https://img.gamemale.com/album/202512/24/181014ye3dd0m83q8xzxvs.gif',
          40,
        ],
        40: [
          'https://img.gamemale.com/album/202512/24/181017zz1ei1uj88i1e9bi.gif',
          40,
        ],
        41: [
          'https://img.gamemale.com/album/202512/24/181019e1ff78fs8il99f9l.gif',
          40,
        ],
        42: [
          'https://img.gamemale.com/album/202512/24/181021u8vgi5y79v9ggpi7.gif',
          40,
        ],
        43: [
          'https://img.gamemale.com/album/202512/24/181022zdpipjfj9vvu9jzi.gif',
          40,
        ],
        44: [
          'https://img.gamemale.com/album/202512/24/181024i6s1wf1xkawk1ne4.gif',
          40,
        ],
        45: [
          'https://img.gamemale.com/album/202512/24/181027tjjjkogoxfivsfil.gif',
          40,
        ],
        46: [
          'https://img.gamemale.com/album/202512/24/181029cq7bq8x08tjyy81q.gif',
          40,
        ],

        Max: [
          'https://img.gamemale.com/album/202510/01/144203wbgg2cuv4u24c6uu.gif',
          40,
        ],
      },
      基础维修工具: {
        1: [
          'https://img.gamemale.com/album/202512/24/180654vlchrcrcs3rlo3ce.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202512/24/180655yeepsz2o1oe23oyl.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202512/24/180655achjepc1h2bzoj9c.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202512/24/180656oz44fqssstqpzbjy.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202512/24/180657ef8q7ybqz4tbqeub.gif',
          40,
        ],
      },
      辉夜姬的五难题: {
        1: [
          'https://img.gamemale.com/album/202510/01/144105t7lj61znze9z97kr.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202510/01/144106ooyxoyv9aete84o4.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202510/01/144107gpeqkdd654fb5flk.gif',
          40,
        ],
        4: [
          'https://img.gamemale.com/album/202510/01/144108giqp1h6xxxpgxmp6.gif',
          40,
        ],
        5: [
          'https://img.gamemale.com/album/202510/01/144109w56hhzdfk1khg84d.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144111sav05zjjb0ffb884.gif',
          82,
        ],
      },
      末影珍珠: {
        1: [
          'https://img.gamemale.com/album/202510/01/144157peeo6e22se6rgse2.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202510/01/144157jbzf3lp6hhf3bbxv.gif',
          40,
        ],
        3: [
          'https://img.gamemale.com/album/202510/01/144158oouv6y2xpblvbm2f.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144159aypgkmkx0c6kt60d.gif',
          82,
        ],
      },
      被冰封的头盔: {
        2: [
          'https://img.gamemale.com/album/202512/24/180350ryrvypeaze2jn9y9.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202512/24/180351a63ehmcgcamhgm2z.gif',
          40,
        ],
      },
      双生蛋: {
        1: [
          'https://img.gamemale.com/album/202510/01/144224dklyukkhl51k0f5o.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202510/01/144230u7f7fqo1zmvoob3h.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202510/01/144239ui7kzhd0ywt7voja.gif',
          40,
        ],
      },
      图书馆金蛋: {
        1: [
          'https://img.gamemale.com/album/202512/24/183023qk0xv6es3wsgsb6v.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202512/24/180813f85z93koo23oocn1.gif',
          40,
        ],
        Max: [
          'https://img.gamemale.com/album/202512/24/180814xpumddm4icnezpnw.gif',
          82,
        ],
      },
      大侦探皮卡丘: {
        1: [
          'https://img.gamemale.com/album/202512/24/180711xleje0rdyczipmmi.gif',
          40,
        ],
        2: [
          'https://img.gamemale.com/album/202512/24/180712t2hic1c6ptcn57ct.gif',
          82,
        ],
        3: [
          'https://img.gamemale.com/album/202512/24/180713e00fzjfin8gz1xwf.gif',
          82,
        ],
        Max: [
          'https://img.gamemale.com/album/202512/24/180714bjpus00mr5hi0dop.gif',
          82,
        ],
      },
      艾尔登法环: {
        Max: [
          'https: //img.gamemale.com/album/202512/24/180334koivirot5tba8goi.gif',
          124,
        ],
      },
    }

    function 使用放大镜() {
      if (medalShopRegex.test(currentUrl)) {
        // 如果是商城，需要等整合商店加载完毕后再执行,预设3秒
        setTimeout(() => {
          初始化放大镜()
          变化检测()
        }, lazyTimeout)
      } else {
        初始化放大镜()
        变化检测()
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', 使用放大镜)
    } else {
      使用放大镜()
    }
  }
  //#endregion
})()
