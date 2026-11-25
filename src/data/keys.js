// 《知否》8 位人物标准答案矩阵（钥匙算法）
// 12 题标准答案，按 questions.js 顺序对应

import { simpleIndex } from './questions.js'

export const keys = {
  明兰: 'AAAABACCABBD',
  顾廷烨: 'CDBCADAADBCA',
  齐衡: 'DCDCACDBADAA',
  墨兰: 'BCCDDBBDBCDD',
  如兰: 'DDDDCDDDCDAB',
  华兰: 'BBBBCBBBBABC',
  盛老太太: 'AAAABAAACADC',
  长柏: 'CBCBDCCCDCCB',
}

// 简版 key：取 Q1 Q2 Q7 Q8 Q12
export const simpleKeys = Object.fromEntries(
  Object.entries(keys).map(([n, k]) => [n, simpleIndex.map((i) => k[i]).join('')])
)
