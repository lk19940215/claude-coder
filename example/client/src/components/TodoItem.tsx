import {
  Paper,
  Group,
  Checkbox,
  Text,
  Badge,
  ActionIcon,
  rem,
} from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { type Todo } from '../lib/api'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <Paper
      p="md"
      mb="sm"
      radius="md"
      withBorder
      className="transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: todo.completed ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-white)',
      }}
    >
      <Group wrap="nowrap">
        <Checkbox
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          color="blue"
          size="lg"
          className="mt-2"
        />
        <Text
          flex={1}
          style={{
            textDecoration: todo.completed ? 'line-through' : 'none',
            color: todo.completed ? 'var(--mantine-color-dimmed)' : 'var(--mantine-color-black)',
            transition: 'all 0.2s ease',
          }}
          lineClamp={2}
        >
          {todo.title}
        </Text>
        <Badge
          color={todo.completed ? 'green' : 'blue'}
          variant={todo.completed ? 'light' : 'filled'}
          size="sm"
        >
          {todo.completed ? '已完成' : '进行中'}
        </Badge>
        <ActionIcon
          color="red"
          variant="subtle"
          onClick={() => onDelete(todo.id)}
          size="lg"
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <IconTrash style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
        </ActionIcon>
      </Group>
    </Paper>
  )
}
