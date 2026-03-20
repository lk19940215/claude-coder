import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import type { Tag, CreateTagParams, TagFilterMode } from '../types'
import { storage } from '../utils/storage'
import { STORAGE_KEYS, BUILTIN_TAGS, BUILTIN_TAG_IDS } from '../types/constants'

// ==================== 类型定义 ====================

/** 标签状态 */
interface TagState {
  tags: Tag[]
  selectedTagIds: string[]
  filterMode: TagFilterMode
  isLoading: boolean
}

/** 标签 Action 类型 */
type TagAction =
  | { type: 'SET_TAGS'; payload: Tag[] }
  | { type: 'ADD_TAG'; payload: Tag }
  | { type: 'UPDATE_TAG'; payload: { id: string; updates: Partial<Tag> } }
  | { type: 'DELETE_TAG'; payload: string }
  | { type: 'SELECT_TAG'; payload: string }
  | { type: 'TOGGLE_TAG_SELECTION'; payload: string }
  | { type: 'SET_FILTER_MODE'; payload: TagFilterMode }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_LOADING'; payload: boolean }

/** 标签上下文值 */
interface TagContextValue {
  state: TagState
  actions: {
    addTag: (params: CreateTagParams) => void
    updateTag: (id: string, updates: Partial<Tag>) => void
    deleteTag: (id: string) => void
    selectTag: (tagId: string) => void
    toggleTagSelection: (tagId: string) => void
    setFilterMode: (mode: TagFilterMode) => void
    clearSelection: () => void
    getTagById: (id: string) => Tag | undefined
    getTagsByIds: (ids: string[]) => Tag[]
    isTagSelected: (tagId: string) => boolean
  }
}

// ==================== 初始状态 ====================

const initialState: TagState = {
  tags: [],
  selectedTagIds: [BUILTIN_TAG_IDS.ALL], // 默认选中"全部任务"
  filterMode: 'single',
  isLoading: true,
}

// ==================== Reducer ====================

function tagReducer(state: TagState, action: TagAction): TagState {
  switch (action.type) {
    case 'SET_TAGS':
      return {
        ...state,
        tags: action.payload,
        isLoading: false,
      }

    case 'ADD_TAG':
      return {
        ...state,
        tags: [...state.tags, action.payload],
      }

    case 'UPDATE_TAG': {
      const { id, updates } = action.payload
      return {
        ...state,
        tags: state.tags.map((tag) =>
          tag.id === id ? { ...tag, ...updates } : tag
        ),
      }
    }

    case 'DELETE_TAG': {
      const deletedId = action.payload
      return {
        ...state,
        tags: state.tags.filter((tag) => tag.id !== deletedId),
        selectedTagIds: state.selectedTagIds.filter((id) => id !== deletedId),
      }
    }

    case 'SELECT_TAG': {
      const tagId = action.payload

      // 点击"全部任务"时，清除其他选择
      if (tagId === BUILTIN_TAG_IDS.ALL) {
        return {
          ...state,
          selectedTagIds: [BUILTIN_TAG_IDS.ALL],
          filterMode: 'single',
        }
      }

      // 单选模式下，替换当前选择
      if (state.filterMode === 'single') {
        return {
          ...state,
          selectedTagIds: [tagId],
        }
      }

      // 多选模式下，切换选择
      const isSelected = state.selectedTagIds.includes(tagId)
      const newSelection = isSelected
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds.filter((id) => id !== BUILTIN_TAG_IDS.ALL), tagId]

      // 如果没有选中任何标签，默认选中"全部任务"
      return {
        ...state,
        selectedTagIds: newSelection.length === 0 ? [BUILTIN_TAG_IDS.ALL] : newSelection,
      }
    }

    case 'TOGGLE_TAG_SELECTION': {
      const tagId = action.payload

      // "全部任务"不能切换，只能单独选中
      if (tagId === BUILTIN_TAG_IDS.ALL) {
        return {
          ...state,
          selectedTagIds: [BUILTIN_TAG_IDS.ALL],
          filterMode: 'single',
        }
      }

      const isSelected = state.selectedTagIds.includes(tagId)
      let newSelection: string[]

      if (isSelected) {
        newSelection = state.selectedTagIds.filter((id) => id !== tagId)
      } else {
        // 移除"全部任务"选择，添加新标签
        newSelection = [...state.selectedTagIds.filter((id) => id !== BUILTIN_TAG_IDS.ALL), tagId]
      }

      // 如果没有选中任何标签，默认选中"全部任务"
      return {
        ...state,
        selectedTagIds: newSelection.length === 0 ? [BUILTIN_TAG_IDS.ALL] : newSelection,
        filterMode: 'multi',
      }
    }

    case 'SET_FILTER_MODE':
      return {
        ...state,
        filterMode: action.payload,
      }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedTagIds: [BUILTIN_TAG_IDS.ALL],
        filterMode: 'single',
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }

    default:
      return state
  }
}

// ==================== Context ====================

const TagContext = createContext<TagContextValue | null>(null)

// ==================== Provider ====================

interface TagProviderProps {
  children: React.ReactNode
}

/** 生成唯一 ID */
function generateId(): string {
  return `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function TagProvider({ children }: TagProviderProps) {
  const [state, dispatch] = useReducer(tagReducer, initialState)

  // 初始化：从 localStorage 加载标签，合并内置标签
  useEffect(() => {
    const savedTags = storage.getTyped(STORAGE_KEYS.TAGS, [])
    const savedSelection = storage.get<string[]>('flowtask_selected_tags', [BUILTIN_TAG_IDS.ALL])

    // 合并内置标签和自定义标签
    const customTags = savedTags.filter((tag: Tag) => !tag.isBuiltIn)
    const allTags = [...BUILTIN_TAGS, ...customTags]

    dispatch({ type: 'SET_TAGS', payload: allTags })

    // 恢复选择状态
    if (savedSelection.length > 0) {
      // 验证选中的标签是否存在
      const validSelection = savedSelection.filter((id: string) =>
        id === BUILTIN_TAG_IDS.ALL || allTags.some((tag: Tag) => tag.id === id)
      )
      if (validSelection.length > 0) {
        dispatch({ type: 'SET_TAGS', payload: allTags })
      }
    }
  }, [])

  // 自动保存：标签变化时持久化（只保存自定义标签）
  useEffect(() => {
    if (!state.isLoading) {
      const customTags = state.tags.filter((tag) => !tag.isBuiltIn)
      storage.setTyped(STORAGE_KEYS.TAGS, customTags)
      storage.set('flowtask_selected_tags', state.selectedTagIds)
    }
  }, [state.tags, state.selectedTagIds, state.isLoading])

  // ==================== Actions ====================

  const addTag = useCallback((params: CreateTagParams) => {
    const newTag: Tag = {
      id: generateId(),
      name: params.name,
      icon: params.icon || '🏷️',
      color: params.color,
      isBuiltIn: false,
      order: state.tags.filter((t) => !t.isBuiltIn).length + BUILTIN_TAGS.length + 1,
    }
    dispatch({ type: 'ADD_TAG', payload: newTag })
  }, [state.tags])

  const updateTag = useCallback((id: string, updates: Partial<Tag>) => {
    // 不允许修改内置标签
    const tag = state.tags.find((t) => t.id === id)
    if (tag?.isBuiltIn) {
      console.warn('Cannot update built-in tags')
      return
    }
    dispatch({ type: 'UPDATE_TAG', payload: { id, updates } })
  }, [state.tags])

  const deleteTag = useCallback((id: string) => {
    // 不允许删除内置标签
    const tag = state.tags.find((t) => t.id === id)
    if (tag?.isBuiltIn) {
      console.warn('Cannot delete built-in tags')
      return
    }
    dispatch({ type: 'DELETE_TAG', payload: id })
  }, [state.tags])

  const selectTag = useCallback((tagId: string) => {
    dispatch({ type: 'SELECT_TAG', payload: tagId })
  }, [])

  const toggleTagSelection = useCallback((tagId: string) => {
    dispatch({ type: 'TOGGLE_TAG_SELECTION', payload: tagId })
  }, [])

  const setFilterMode = useCallback((mode: TagFilterMode) => {
    dispatch({ type: 'SET_FILTER_MODE', payload: mode })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }, [])

  const getTagById = useCallback((id: string) => {
    return state.tags.find((tag) => tag.id === id)
  }, [state.tags])

  const getTagsByIds = useCallback((ids: string[]) => {
    return ids.map((id) => state.tags.find((tag) => tag.id === id)).filter(Boolean) as Tag[]
  }, [state.tags])

  const isTagSelected = useCallback((tagId: string) => {
    return state.selectedTagIds.includes(tagId)
  }, [state.selectedTagIds])

  // ==================== Context Value ====================

  const value = useMemo<TagContextValue>(() => ({
    state,
    actions: {
      addTag,
      updateTag,
      deleteTag,
      selectTag,
      toggleTagSelection,
      setFilterMode,
      clearSelection,
      getTagById,
      getTagsByIds,
      isTagSelected,
    },
  }), [
    state,
    addTag,
    updateTag,
    deleteTag,
    selectTag,
    toggleTagSelection,
    setFilterMode,
    clearSelection,
    getTagById,
    getTagsByIds,
    isTagSelected,
  ])

  return (
    <TagContext.Provider value={value}>
      {children}
    </TagContext.Provider>
  )
}

// ==================== Hook ====================

export function useTagContext(): TagContextValue {
  const context = useContext(TagContext)
  if (!context) {
    throw new Error('useTagContext must be used within a TagProvider')
  }
  return context
}