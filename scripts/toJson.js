const fs = require('fs')

jsonList = ['勋章图片', '勋章内容映射', '勋章博物馆']

jsonList.forEach((fName) => {
  // 读取文件
  const fileContent = fs.readFileSync(`${fName}.js`, 'utf8')

  // 尝试多种正则模式
  const patterns = [
    /(?:const|let|var)\s+(\w+)\s*=\s*({[\s\S]*?})\s*;?\s*$/m,
    /(?:const|let|var)\s+(\w+)\s*=\s*({[\s\S]*?})\s*(?:;|$)/,
    /=\s*({[\s\S]*})/,  // 只匹配对象部分
  ]

  let params = null
  let matched = false

  for (let pattern of patterns) {
    const match = fileContent.match(pattern)
    if (match) {
      try {
        // 如果匹配到变量名和值
        const objString = match[2] || match[1]
        params = new Function('return ' + objString)()
        matched = true
        break
      } catch (e) {
        continue
      }
    }
  }

  if (matched && params) {
    fs.writeFileSync(`${fName}.json`, JSON.stringify(params, null, 2), 'utf8')
    console.log(`✓ ${fName}.json 转换完成！`)
  } else {
    console.error(`✗ ${fName}.js 未找到变量，文件内容预览：`)
    console.log(fileContent.substring(0, 200)) // 打印前200个字符帮助调试
  }
})
