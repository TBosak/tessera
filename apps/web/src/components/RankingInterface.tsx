import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './Button';
import { Card, CardContent } from './Card';

interface Candidate {
  id: number;
  name: string;
  info?: string;
  image_url?: string;
}

interface RankingInterfaceProps {
  candidates: Candidate[];
  rankings: number[];
  onChange: (rankings: number[]) => void;
  maxRank?: number;
}

export function RankingInterface({ 
  candidates, 
  rankings, 
  onChange, 
  maxRank 
}: RankingInterfaceProps) {
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const rankedCandidates = rankings
    .map(id => candidates.find(c => c.id === id))
    .filter(Boolean) as Candidate[];

  const availableCandidates = candidates.filter(
    candidate => !rankings.includes(candidate.id)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const candidate = candidates.find(c => c.id === event.active.id);
    setActiveCandidate(candidate || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCandidate(null);
    
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    // If dragging from available candidates to ranking area
    if (!rankings.includes(activeId)) {
      // Check max rank limit
      if (maxRank && rankings.length >= maxRank) {
        return;
      }
      
      // Add to rankings
      if (over.id === 'ranking-area' || over.id === 'placeholder') {
        // Add to end
        onChange([...rankings, activeId]);
      } else if (rankings.includes(overId)) {
        // Insert at specific position
        const targetIndex = rankings.indexOf(overId);
        const newRankings = [...rankings];
        newRankings.splice(targetIndex, 0, activeId);
        onChange(newRankings);
      }
      return;
    }

    // Reordering within rankings
    if (rankings.includes(activeId) && rankings.includes(overId) && activeId !== overId) {
      const oldIndex = rankings.indexOf(activeId);
      const newIndex = rankings.indexOf(overId);
      
      const newRankings = [...rankings];
      newRankings.splice(oldIndex, 1);
      newRankings.splice(newIndex, 0, activeId);
      
      onChange(newRankings);
    }
  };

  const addCandidate = (candidateId: number) => {
    if (maxRank && rankings.length >= maxRank) {
      return;
    }
    onChange([...rankings, candidateId]);
  };

  const removeCandidate = (candidateId: number) => {
    onChange(rankings.filter(id => id !== candidateId));
  };

  const moveUp = (candidateId: number) => {
    const index = rankings.indexOf(candidateId);
    if (index > 0) {
      const newRankings = [...rankings];
      [newRankings[index - 1], newRankings[index]] = [newRankings[index], newRankings[index - 1]];
      onChange(newRankings);
    }
  };

  const moveDown = (candidateId: number) => {
    const index = rankings.indexOf(candidateId);
    if (index < rankings.length - 1) {
      const newRankings = [...rankings];
      [newRankings[index], newRankings[index + 1]] = [newRankings[index + 1], newRankings[index]];
      onChange(newRankings);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Candidates */}
        <div>
          <h3 className="text-xl font-bold mb-4">Available Candidates</h3>
          <div className="space-y-3">
            {availableCandidates.map(candidate => (
              <AvailableCandidate
                key={candidate.id}
                candidate={candidate}
                onAdd={() => addCandidate(candidate.id)}
                disabled={maxRank ? rankings.length >= maxRank : false}
              />
            ))}
          </div>
        </div>

        {/* Ranking Area */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Your Rankings</h3>
            {maxRank && (
              <span className="text-sm text-gray-600">
                {rankings.length}/{maxRank}
              </span>
            )}
          </div>

          <SortableContext 
            items={rankings.length > 0 ? rankings : ['placeholder']} 
            strategy={verticalListSortingStrategy}
          >
            <div
              id="ranking-area"
              className="min-h-[200px] border-3 border-dashed border-gray-300 rounded-brutal p-4 space-y-3"
            >
              {rankedCandidates.length === 0 ? (
                <PlaceholderDropZone />
              ) : (
                rankedCandidates.map((candidate, index) => (
                  <RankedCandidate
                    key={candidate.id}
                    candidate={candidate}
                    rank={index + 1}
                    onRemove={() => removeCandidate(candidate.id)}
                    onMoveUp={() => moveUp(candidate.id)}
                    onMoveDown={() => moveDown(candidate.id)}
                    canMoveUp={index > 0}
                    canMoveDown={index < rankedCandidates.length - 1}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </div>
      </div>

      <DragOverlay>
        {activeCandidate ? (
          <CandidateCard candidate={activeCandidate} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function AvailableCandidate({ 
  candidate, 
  onAdd, 
  disabled 
}: { 
  candidate: Candidate; 
  onAdd: () => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <CandidateCard
        candidate={candidate}
        dragProps={{ ...attributes, ...listeners }}
        actions={
          <Button
            size="sm"
            onClick={onAdd}
            disabled={disabled}
            aria-label={`Add ${candidate.name} to ranking`}
          >
            Add
          </Button>
        }
      />
    </div>
  );
}

function RankedCandidate({
  candidate,
  rank,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  candidate: Candidate;
  rank: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <CandidateCard
        candidate={candidate}
        rank={rank}
        dragProps={{ ...attributes, ...listeners }}
        actions={
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={`Move ${candidate.name} up`}
            >
              ↑
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={`Move ${candidate.name} down`}
            >
              ↓
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onRemove}
              aria-label={`Remove ${candidate.name} from ranking`}
            >
              ×
            </Button>
          </div>
        }
      />
    </div>
  );
}

function PlaceholderDropZone() {
  const {
    setNodeRef,
    isOver
  } = useSortable({ id: 'placeholder' });

  return (
    <div
      ref={setNodeRef}
      className={`text-center text-gray-500 py-8 rounded-lg transition-colors ${
        isOver ? 'bg-primary/10 text-primary' : ''
      }`}
    >
      Drag candidates here or use the "Add" buttons to create your ranking
    </div>
  );
}

function CandidateCard({
  candidate,
  rank,
  dragProps,
  actions,
  isDragging = false,
}: {
  candidate: Candidate;
  rank?: number;
  dragProps?: any;
  actions?: React.ReactNode;
  isDragging?: boolean;
}) {
  return (
    <Card className={`${isDragging ? 'shadow-brutal-lg' : ''}`}>
      <CardContent className="flex items-center gap-4 p-4">
        {rank && (
          <div className="w-8 h-8 bg-primary text-paper rounded-brutal flex items-center justify-center font-bold">
            {rank}
          </div>
        )}
        
        <div className="flex-1">
          <h4 className="font-semibold">{candidate.name}</h4>
          {candidate.info && (
            <p className="text-sm text-gray-600 mt-1">{candidate.info}</p>
          )}
        </div>

        {actions}
        
        <div
          {...dragProps}
          className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600"
          aria-label={`Drag ${candidate.name}`}
        >
          ⋮⋮
        </div>
      </CardContent>
    </Card>
  );
}