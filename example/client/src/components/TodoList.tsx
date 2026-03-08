import { Paper, Title, Text, Center, Divider, Group, Badge } from '@mantine/core'
import { IconCheck, IconInbox } from '@tabler/icons-react'
import { type Todo } from '../lib/api'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  loading: boolean
  error: string | null
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export function TodoList({ todos, loading, error, onToggle, onDelete }: TodoListProps) {
  // 加载中状态
  if (loading && todos.length === 0) {
    return (
      <Paper p="lg" radius="lg" shadow="md" className="card-custom">
        <Center py="xl">
          <div className="text-center">
            <Text c="dimmed" size="lg">加载中...</Text>
          </div>
        </Center>
      </Paper>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Paper p="lg" radius="lg" shadow="md" className="card-custom">
        <Center py="xl">
          <div className="text-center">
            <Text c="red" size="lg">{error}</Text>
          </div>
        </Center>
      </Paper>
    )
  }

  // 空状态
  if (todos.length === 0) {
    return (
      <Paper p="lg" radius="lg" shadow="md" className="card-custom">
        <Center py="xl">
          <div className="text-center">
            <IconInbox size={48} stroke={1.5} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" size="lg" mt="md">
              暂无任务
            </Text>
            <Text c="dimmed" size="sm">
              点击上方"添加新任务"按钮创建你的第一个任务
            </Text>
          </div>
        </Center>
      </Paper>
    )
  }

  // 任务列表
  return (
    <Paper p="lg" radius="lg" shadow="md" className="card-custom">
      <Group justify="space-between" mb="md">
        <Title order={3} className="flex items-center gap-2">
          <IconCheck size={24} stroke={1.5} />
          任务列表
        </Title>
        <Badge size="lg" color="blue" variant="light">
          {todos.length} 个任务
        </Badge>
      </Group>

      <Divider mb="md" />

      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </Paper>
  )
}
