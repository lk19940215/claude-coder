import { useCallback, useMemo } from 'react'
import { useTagContext } from '../context/TagContext'
import type { Tag, CreateTagParams, TagFilterMode } from '../types'
import { BUILTIN_TAG_IDS } from '../types/constants'

/**
 * 标签管理 Hook
 * 封装标签筛选、多标签关联等逻辑
 */
export function useTags() {
  const { state, actions } = useTagContext()

  // 获取排序后的标签列表
  const sortedTags = useMemo(() => {
    return [...state.tags].sort((a, b) => a.order - b.order)
  }, [state.tags])

  // 获取内置标签
  const builtInTags = useMemo(() => {
    return sortedTags.filter((tag) => tag.isBuiltIn)
  }, [sortedTags])

  // 获取自定义标签
  const customTags = useMemo(() => {
    return sortedTags.filter((tag) => !tag.isBuiltIn)
  }, [sortedTags])

  // 当前选中的标签列表
  const selectedTags = useMemo(() => {
    return actions.getTagsByIds(state.selectedTagIds)
  }, [actions, state.selectedTagIds])

  // 是否选中"全部任务"
  const isAllSelected = useMemo(() => {
    return state.selectedTagIds.includes(BUILTIN_TAG_IDS.ALL)
  }, [state.selectedTagIds])

  // 是否处于多选模式
  const isMultiSelectMode = useMemo(() => {
    return state.filterMode === 'multi' && state.selectedTagIds.length > 1
  }, [state.filterMode, state.selectedTagIds])

  // 选中的标签数量
  const selectedCount = useMemo(() => {
    return state.selectedTagIds.filter((id) => id !== BUILTIN_TAG_IDS.ALL).length
  }, [state.selectedTagIds])

  // 标签总数
  const tagCounts = useMemo(() => {
    return {
      total: state.tags.length,
      builtIn: builtInTags.length,
      custom: customTags.length,
    }
  }, [state.tags, builtInTags, customTags])

  // ==================== 操作方法 ====================

  // 添加标签
  const addTag = useCallback((params: CreateTagParams) => {
    if (!params.name.trim()) {
      console.warn('Tag name cannot be empty')
      return
    }
    actions.addTag(params)
  }, [actions])

  // 更新标签
  const updateTag = useCallback((id: string, updates: Partial<Tag>) => {
    if (updates.name !== undefined && !updates.name.trim()) {
      console.warn('Tag name cannot be empty')
      return
    }
    actions.updateTag(id, updates)
  }, [actions])

  // 删除标签
  const deleteTag = useCallback((id: string) => {
    actions.deleteTag(id)
  }, [actions])

  // 选择标签（单选或多选取决于当前模式）
  const selectTag = useCallback((tagId: string) => {
    actions.selectTag(tagId)
  }, [actions])

  // 切换标签选择（用于多选模式）
  const toggleTagSelection = useCallback((tagId: string) => {
    actions.toggleTagSelection(tagId)
  }, [actions])

  // 设置筛选模式
  const setFilterMode = useCallback((mode: TagFilterMode) => {
    actions.setFilterMode(mode)
  }, [actions])

  // 清除选择（重置为"全部任务"）
  const clearSelection = useCallback(() => {
    actions.clearSelection()
  }, [actions])

  // 选择"全部任务"
  const selectAll = useCallback(() => {
    actions.selectTag(BUILTIN_TAG_IDS.ALL)
  }, [actions])

  // 根据 ID 获取标签
  const getTagById = useCallback((id: string): Tag | undefined => {
    return actions.getTagById(id)
  }, [actions])

  // 根据多个 ID 获取标签
  const getTagsByIds = useCallback((ids: string[]): Tag[] => {
    return actions.getTagsByIds(ids)
  }, [actions])

  // 检查标签是否被选中
  const isTagSelected = useCallback((tagId: string): boolean => {
    return actions.isTagSelected(tagId)
  }, [actions])

  // 检查是否为内置标签
  const isBuiltInTag = useCallback((tagId: string): boolean => {
    const tag = actions.getTagById(tagId)
    return tag?.isBuiltIn ?? false
  }, [actions])

  // 根据名称搜索标签
  const searchTags = useCallback((query: string): Tag[] => {
    const lowerQuery = query.toLowerCase().trim()
    if (!lowerQuery) return sortedTags

    return sortedTags.filter((tag) =>
      tag.name.toLowerCase().includes(lowerQuery)
    )
  }, [sortedTags])

  // 检查标签名称是否存在
  const isTagNameExists = useCallback((name: string, excludeId?: string): boolean => {
    return state.tags.some(
      (tag) => tag.name.toLowerCase() === name.toLowerCase() && tag.id !== excludeId
    )
  }, [state.tags])

  return {
    // 状态
    tags: sortedTags,
    builtInTags,
    customTags,
    selectedTags,
    selectedTagIds: state.selectedTagIds,
    filterMode: state.filterMode,
    isLoading: state.isLoading,
    tagCounts,

    // 选中状态
    isAllSelected,
    isMultiSelectMode,
    selectedCount,

    // 操作
    addTag,
    updateTag,
    deleteTag,
    selectTag,
    toggleTagSelection,
    setFilterMode,
    clearSelection,
    selectAll,

    // 查询
    getTagById,
    getTagsByIds,
    isTagSelected,
    isBuiltInTag,
    searchTags,
    isTagNameExists,
  }
}

/**
 * 单个标签操作 Hook
 * 用于操作特定标签
 */
export function useTag(tagId: string) {
  const { state, actions } = useTagContext()

  const tag = useMemo(() => {
    return state.tags.find((t) => t.id === tagId)
  }, [state.tags, tagId])

  const isSelected = useMemo(() => {
    return state.selectedTagIds.includes(tagId)
  }, [state.selectedTagIds, tagId])

  const updateTag = useCallback((updates: Partial<Tag>) => {
    actions.updateTag(tagId, updates)
  }, [actions, tagId])

  const deleteTag = useCallback(() => {
    actions.deleteTag(tagId)
  }, [actions, tagId])

  const select = useCallback(() => {
    actions.selectTag(tagId)
  }, [actions, tagId])

  const toggleSelection = useCallback(() => {
    actions.toggleTagSelection(tagId)
  }, [actions, tagId])

  return {
    tag,
    exists: !!tag,
    isSelected,
    isBuiltIn: tag?.isBuiltIn ?? false,
    updateTag,
    deleteTag,
    select,
    toggleSelection,
  }
}

/**
 * 标签筛选 Hook
 * 用于根据选中标签筛选任务
 */
export function useTagFilter<T extends { tagIds: string[] }>(items: T[]): T[] {
  const { state } = useTagContext()

  const filteredItems = useMemo(() => {
    // 如果选中"全部任务"，返回所有项目
    if (state.selectedTagIds.includes(BUILTIN_TAG_IDS.ALL)) {
      return items
    }

    // 否则返回包含任一选中标签的项目
    return items.filter((item) =>
      item.tagIds.some((tagId) => state.selectedTagIds.includes(tagId))
    )
  }, [items, state.selectedTagIds])

  return filteredItems
}