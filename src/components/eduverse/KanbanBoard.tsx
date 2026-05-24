'use client';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Task {
  id: string;
  title: string;
  deadline: string;
  type: string;
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

interface KanbanData {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

const initialData: KanbanData = {
  tasks: {
    'task-1': { id: 'task-1', title: 'Baca Jurnal Relativitas Einstein', type: 'Materi', deadline: '2 Jam lagi' },
    'task-2': { id: 'task-2', title: 'Kerjakan Soal Latihan Bab 4', type: 'Esai', deadline: 'Besok' },
    'task-3': { id: 'task-3', title: 'Tonton Video Reaksi Kimia', type: 'Video', deadline: 'Lusa' },
  },
  columns: {
    'col-1': { id: 'col-1', title: 'To Do (Misi Tertunda)', taskIds: ['task-1', 'task-2', 'task-3'] },
    'col-2': { id: 'col-2', title: 'In Progress (Dikerjakan)', taskIds: [] },
    'col-3': { id: 'col-3', title: 'Submitted (Menunggu Nilai)', taskIds: [] },
  },
  columnOrder: ['col-1', 'col-2', 'col-3'],
};

export default function KanbanBoard() {
  const [data, setData] = useState<KanbanData>(initialData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, taskIds: newTaskIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    // Moving between columns
    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    setData({
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  };

  if (!mounted) return null; // Prevent hydration error with react-beautiful-dnd/@hello-pangea/dnd

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 h-full overflow-x-auto p-4 hide-scrollbar">
        {data.columnOrder.map((columnId) => {
          const column = data.columns[columnId];
          const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

          return (
            <div key={column.id} className="min-w-[320px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col shadow-2xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[var(--neon-green)] shadow-[0_0_10px_var(--neon-green)]"></span>
                {column.title}
              </h3>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 transition-colors rounded-2xl ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                  >
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-4 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all 
                              ${snapshot.isDragging ? 'shadow-[0_0_30px_rgba(222,255,154,0.4)] scale-105 border-[var(--neon-green)]/50' : 'hover:border-white/20'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-mono px-2 py-1 rounded bg-white/10 text-white/70">{task.type}</span>
                              <span className={`text-xs font-bold ${task.deadline.includes('Jam') ? 'text-[var(--neon-red)] animate-pulse' : 'text-[var(--neon-green)]'}`}>
                                ⌛ {task.deadline}
                              </span>
                            </div>
                            <h4 className="font-semibold text-[15px]">{task.title}</h4>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
