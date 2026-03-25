/**
 * 计算数值的总和，支持负数检测
 * 支持多种调用方式：
 * - sum(1, 2, 3) - 多个参数
 * - sum([1, 2, 3]) - 数组参数
 * - sum(1, 2, [3, 4], 5) - 混合参数
 * 
 * @param {...(number|number[])} args - 数字或数字数组
 * @returns {object} 包含总和和统计信息的对象
 */
function sum(...args) {
  // 展平所有参数（处理数组嵌套）
  const flatten = (arr) => {
    return arr.reduce((acc, val) => {
      if (Array.isArray(val)) {
        return acc.concat(flatten(val));
      }
      return acc.concat(val);
    }, []);
  };

  const numbers = flatten(args);

  // 验证所有值都是数字
  for (const num of numbers) {
    if (typeof num !== 'number' || isNaN(num)) {
      throw new TypeError(`Invalid number: ${num}`);
    }
  }

  // 分离正数、负数和零
  const positiveNumbers = numbers.filter(n => n > 0);
  const negativeNumbers = numbers.filter(n => n < 0);
  const zeros = numbers.filter(n => n === 0);

  // 计算各种统计信息
  const total = numbers.reduce((sum, num) => sum + num, 0);
  const positiveSum = positiveNumbers.reduce((sum, num) => sum + num, 0);
  const negativeSum = negativeNumbers.reduce((sum, num) => sum + num, 0);

  // 返回详细结果
  return {
    total,                                    // 总和
    positive: {
      count: positiveNumbers.length,          // 正数数量
      sum: positiveSum,                       // 正数总和
      numbers: positiveNumbers                // 正数列表
    },
    negative: {
      count: negativeNumbers.length,          // 负数数量
      sum: negativeSum,                       // 负数总和
      numbers: negativeNumbers                // 负数列表
    },
    zeros: zeros.length,                      // 零的数量
    hasNegative: negativeNumbers.length > 0,  // 是否包含负数
    count: numbers.length                     // 总数量
  };
}

export default sum;

// 使用示例
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== Sum 函数测试（支持负数检测）===\n');

  // 测试 1: 只有正数
  console.log('测试 1 - 只有正数:');
  const result1 = sum(1, 2, 3, 4, 5);
  console.log(`sum(1, 2, 3, 4, 5)`);
  console.log(JSON.stringify(result1, null, 2));

  // 测试 2: 包含负数
  console.log('\n测试 2 - 包含负数:');
  const result2 = sum(-1, 2, -3, 4, -5);
  console.log(`sum(-1, 2, -3, 4, -5)`);
  console.log(JSON.stringify(result2, null, 2));

  // 测试 3: 数组参数（包含负数）
  console.log('\n测试 3 - 数组参数（包含负数）:');
  const result3 = sum([1, -2, 3, -4, 5]);
  console.log(`sum([1, -2, 3, -4, 5])`);
  console.log(JSON.stringify(result3, null, 2));

  // 测试 4: 混合参数（包含负数）
  console.log('\n测试 4 - 混合参数（包含负数）:');
  const result4 = sum(-1, 2, [-3, 4], -5);
  console.log(`sum(-1, 2, [-3, 4], -5)`);
  console.log(JSON.stringify(result4, null, 2));

  // 测试 5: 空参数
  console.log('\n测试 5 - 空参数:');
  const result5 = sum();
  console.log(`sum()`);
  console.log(JSON.stringify(result5, null, 2));

  // 测试 6: 全是负数
  console.log('\n测试 6 - 全是负数:');
  const result6 = sum(-1, -2, -3);
  console.log(`sum(-1, -2, -3)`);
  console.log(JSON.stringify(result6, null, 2));

  // 测试 7: 包含零
  console.log('\n测试 7 - 包含零:');
  const result7 = sum(1, 0, -1, 0);
  console.log(`sum(1, 0, -1, 0)`);
  console.log(JSON.stringify(result7, null, 2));

  // 测试 8: 嵌套数组（包含负数）
  console.log('\n测试 8 - 嵌套数组（包含负数）:');
  const result8 = sum([1, [-2, [3, [-4, 5]]]]);
  console.log(`sum([1, [-2, [3, [-4, 5]]]])`);
  console.log(JSON.stringify(result8, null, 2));

  // 测试 9: 检测是否有负数
  console.log('\n测试 9 - 检测是否有负数:');
  const result9 = sum(1, 2, 3, 4, 5);
  console.log(`sum(1, 2, 3, 4, 5).hasNegative = ${result9.hasNegative}`);
  const result10 = sum(-1, 2, 3, 4, 5);
  console.log(`sum(-1, 2, 3, 4, 5).hasNegative = ${result10.hasNegative}`);
}