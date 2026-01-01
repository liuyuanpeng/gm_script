// src/scripts/index.js
import { exampleScript } from './example'
import { homeScript } from './homeScript'
import { aiReply } from './aiReply'
import { replyLimitTracker } from './reply-limit-tracker.js'

// 导出所有脚本
export const allScripts = [
  exampleScript,
  homeScript,
  aiReply,
  replyLimitTracker,
]
