import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TaskProvider } from './context/TaskContext'
import { TagProvider } from './context/TagContext'
import { AppLayout } from './components/layout/AppLayout'
import './styles/globals.css'

function App() {
  return (
    <TaskProvider>
      <TagProvider>
        <DndProvider backend={HTML5Backend}>
          <AppLayout />
        </DndProvider>
      </TagProvider>
    </TaskProvider>
  )
}

export default App