'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PipelineStage, Deal, MarketingLead } from '@/types';
import { DealCard } from './DealCard';
import { LeadCard } from './LeadCard';

export type PipelineItem = { type: 'deal'; data: Deal } | { type: 'lead'; data: MarketingLead };

interface KanbanBoardProps {
  stages: PipelineStage[];
  itemsByStage: Record<string, PipelineItem[]>;
  onDragEnd: (result: DropResult) => void;
}

const stageColors: Record<number, string> = {
  0: '#3b82f6',
  1: '#f59e0b',
  2: '#8b5cf6',
  3: '#ec4899',
  4: '#10b981',
  5: '#06b6d4',
};

export function KanbanBoard({ stages, itemsByStage, onDragEnd }: KanbanBoardProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
        {stages.map((stage, idx) => {
          const items = itemsByStage[stage.id] ?? [];
          const color = stage.color || stageColors[idx % 6] || '#6b7280';

          return (
            <div key={stage.id} className="flex-shrink-0 w-72 flex flex-col">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-t-xl mb-0"
                style={{ backgroundColor: color + '18', borderBottom: `3px solid ${color}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <h3 className="text-sm font-semibold text-gray-800">{stage.name}</h3>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              {/* Drop zone */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-b-xl p-2 space-y-2 min-h-[120px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'bg-gray-100/60'
                    }`}
                  >
                    {items.map((item, index) => {
                      const id = item.type === 'deal' ? item.data.id : `lead-${item.data.id}`;
                      return (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'rotate-1 scale-105' : ''}
                            >
                              {item.type === 'deal' ? (
                                <DealCard deal={item.data} />
                              ) : (
                                <LeadCard lead={item.data} />
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {items.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-center text-xs text-gray-400 py-6">Drop items here</p>
                    )}
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
