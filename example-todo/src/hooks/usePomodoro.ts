import { useState, useEffect, useCallback, useRef } from 'react'
import type { PomodoroMode, PomodoroStatus, PomodoroStats, PomodoroConfig } from '../types'
import { DEFAULT_POMODORO_CONFIG, STORAGE_KEYS, getTodayString } from '../types/constants'
import { storage } from '../utils/storage'

type TimerCallback = () => void

/** 默认今日统计 */
const DEFAULT_TODAY_STATS: PomodoroStats = {
  date: getTodayString(),
  completedPomodoros: 0,
  totalWorkTime: 0,
  totalBreakTime: 0,
  taskStats: {},
}

/**
 * 番茄钟计时 Hook
 * 实现 25 分钟工作 + 5 分钟休息循环逻辑
 * 使用 requestAnimationFrame 精确倒计时
 */
export function usePomodoro() {
  // ==================== 状态 ====================

  const [mode, setMode] = useState<PomodoroMode>('work')
  const [status, setStatus] = useState<PomodoroStatus>('idle')
  const [remainingTime, setRemainingTime] = useState(DEFAULT_POMODORO_CONFIG.workDuration)
  const [taskId, setTaskId] = useState<string | undefined>()
  const [completedCount, setCompletedCount] = useState(0)
  const [todayStats, setTodayStats] = useState<PomodoroStats>(() => loadTodayStats())
  const [config, setConfig] = useState<PomodoroConfig>(() => loadConfig())

  // Refs
  const startTimeRef = useRef<number | null>(null)
  const pausedTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const onModeCompleteRef = useRef<TimerCallback | null>(null)

  // ==================== 持久化 ====================

  function loadTodayStats(): PomodoroStats {
    const today = getTodayString()
    const saved = storage.getTyped(STORAGE_KEYS.POMODORO_STATS, DEFAULT_TODAY_STATS)
    if (saved && saved.date === today) {
      return saved
    }
    return {
      date: today,
      completedPomodoros: 0,
      totalWorkTime: 0,
      totalBreakTime: 0,
      taskStats: {},
    }
  }

  function loadConfig(): PomodoroConfig {
    return storage.getTyped(STORAGE_KEYS.POMODORO_CONFIG, DEFAULT_POMODORO_CONFIG)
  }

  function saveStats(stats: PomodoroStats) {
    storage.setTyped(STORAGE_KEYS.POMODORO_STATS, stats)
  }

  function saveConfig(newConfig: PomodoroConfig) {
    storage.setTyped(STORAGE_KEYS.POMODORO_CONFIG, newConfig)
  }

  // ==================== 计时器逻辑 ====================

  // 获取当前模式时长
  const getDuration = useCallback((currentMode: PomodoroMode): number => {
    switch (currentMode) {
      case 'work':
        return config.workDuration
      case 'short_break':
        return config.shortBreakDuration
      case 'long_break':
        return config.longBreakDuration
    }
  }, [config])

  // 倒计时循环
  const tick = useCallback(() => {
    if (status !== 'running' || !startTimeRef.current) return

    const now = performance.now()
    const elapsed = (now - startTimeRef.current) / 1000
    const newRemaining = Math.max(0, getDuration(mode) - elapsed)

    setRemainingTime(newRemaining)

    if (newRemaining <= 0) {
      // 计时完成
      handleModeComplete()
    } else {
      // 继续下一帧
      animationFrameRef.current = requestAnimationFrame(tick)
    }
  }, [status, mode, getDuration])

  // 模式完成处理
  const handleModeComplete = useCallback(() => {
    // 停止计时器
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // 更新统计
    if (mode === 'work') {
      const newCount = completedCount + 1
      setCompletedCount(newCount)

      // 更新今日统计
      const newStats: PomodoroStats = {
        ...todayStats,
        completedPomodoros: todayStats.completedPomodoros + 1,
        totalWorkTime: todayStats.totalWorkTime + config.workDuration,
        taskStats: taskId
          ? { ...todayStats.taskStats, [taskId]: (todayStats.taskStats[taskId] || 0) + 1 }
          : todayStats.taskStats,
      }
      setTodayStats(newStats)
      saveStats(newStats)

      // 切换到休息模式
      const nextMode: PomodoroMode = newCount % config.longBreakInterval === 0
        ? 'long_break'
        : 'short_break'
      setMode(nextMode)
      setRemainingTime(getDuration(nextMode))
    } else {
      // 休息完成，切换到工作模式
      const newStats: PomodoroStats = {
        ...todayStats,
        totalBreakTime: todayStats.totalBreakTime + getDuration(mode),
      }
      setTodayStats(newStats)
      saveStats(newStats)

      setMode('work')
      setRemainingTime(config.workDuration)
    }

    setStatus('idle')
    startTimeRef.current = null

    // 调用完成回调
    onModeCompleteRef.current?.()
  }, [mode, completedCount, todayStats, taskId, config, getDuration])

  // 开始计时
  const start = useCallback((taskToFocus?: string) => {
    if (status === 'running') return

    if (taskToFocus) {
      setTaskId(taskToFocus)
    }

    setStatus('running')
    startTimeRef.current = performance.now() - ((getDuration(mode) - remainingTime) * 1000)
    animationFrameRef.current = requestAnimationFrame(tick)
  }, [status, mode, remainingTime, getDuration, tick])

  // 暂停
  const pause = useCallback(() => {
    if (status !== 'running') return

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    pausedTimeRef.current = performance.now()
    setStatus('paused')
  }, [status])

  // 继续
  const resume = useCallback(() => {
    if (status !== 'paused') return

    const pausedDuration = pausedTimeRef.current
      ? performance.now() - pausedTimeRef.current
      : 0

    startTimeRef.current = (startTimeRef.current || performance.now()) + pausedDuration
    setStatus('running')
    animationFrameRef.current = requestAnimationFrame(tick)
  }, [status, tick])

  // 重置
  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setStatus('idle')
    setMode('work')
    setRemainingTime(config.workDuration)
    setTaskId(undefined)
    startTimeRef.current = null
    pausedTimeRef.current = null
  }, [config.workDuration])

  // 跳过当前阶段
  const skip = useCallback(() => {
    handleModeComplete()
  }, [handleModeComplete])

  // 设置完成回调
  const setOnComplete = useCallback((callback: TimerCallback) => {
    onModeCompleteRef.current = callback
  }, [])

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<PomodoroConfig>) => {
    const updated = { ...config, ...newConfig }
    setConfig(updated)
    saveConfig(updated)

    // 如果当前是 idle 状态，更新剩余时间
    if (status === 'idle') {
      setRemainingTime(getDuration(mode))
    }
  }, [config, status, mode, getDuration])

  // 效果：启动/停止计时
  useEffect(() => {
    if (status === 'running') {
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [status, tick])

  // 效果：日期变化时重置统计
  useEffect(() => {
    const today = getTodayString()
    if (todayStats.date !== today) {
      const newStats: PomodoroStats = {
        date: today,
        completedPomodoros: 0,
        totalWorkTime: 0,
        totalBreakTime: 0,
        taskStats: {},
      }
      setTodayStats(newStats)
      saveStats(newStats)
      setCompletedCount(0)
    }
  }, [todayStats.date])

  // ==================== 计算属性 ====================

  // 进度百分比
  const progress = mode === 'work'
    ? ((config.workDuration - remainingTime) / config.workDuration) * 100
    : mode === 'short_break'
      ? ((config.shortBreakDuration - remainingTime) / config.shortBreakDuration) * 100
      : ((config.longBreakDuration - remainingTime) / config.longBreakDuration) * 100

  // 格式化时间显示
  const formattedTime = formatTime(remainingTime)

  // 当前模式标签
  const modeLabel = mode === 'work' ? '专注中...' : mode === 'short_break' ? '短休息' : '长休息'

  // 当前模式颜色
  const modeColor = mode === 'work' ? '#5A9A6D' : mode === 'short_break' ? '#60A5FA' : '#8B5CF6'

  return {
    // 状态
    mode,
    status,
    remainingTime,
    taskId,
    completedCount,
    progress,
    formattedTime,
    modeLabel,
    modeColor,
    config,
    todayStats,

    // 操作
    start,
    pause,
    resume,
    reset,
    skip,
    setOnComplete,
    updateConfig,
  }
}

/**
 * 格式化时间显示 (MM:SS)
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default usePomodoro