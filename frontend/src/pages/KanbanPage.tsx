import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, Trash2 } from 'lucide-react';
import { kanbanService } from '@/features/kanban/kanban.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { KanbanBoard, KanbanCard, KanbanStatus } from '@/types';
import { cn } from '@/lib/utils';

const COLUMNS: { id: KanbanStatus; label: string; accent: string }[] = [
  { id: 'TODO', label: 'To do', accent: 'border-t-muted-foreground/60' },
  { id: 'IN_PROGRESS', label: 'In progress', accent: 'border-t-accent' },
  { id: 'DONE', label: 'Done', accent: 'border-t-primary' },
];

export const KanbanPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const qc = useQueryClient();
  const boardsQ = useQuery({
    queryKey: ['boards', teamId],
    queryFn: () => kanbanService.listBoards(teamId!),
    enabled: !!teamId,
  });
  const [boardId, setBoardId] = useState<string | null>(null);
  const activeBoardId = boardId ?? boardsQ.data?.[0]?.id ?? null;
  const boardQ = useQuery({
    queryKey: ['board', activeBoardId],
    queryFn: () => kanbanService.getBoard(activeBoardId!),
    enabled: !!activeBoardId,
  });

  const [newBoard, setNewBoard] = useState({ name: '', description: '' });
  const [newBoardOpen, setNewBoardOpen] = useState(false);

  const createBoard = async () => {
    if (!teamId) return;
    try {
      await kanbanService.createBoard({ teamId, ...newBoard });
      toast.success('Board created');
      setNewBoardOpen(false);
      setNewBoard({ name: '', description: '' });
      qc.invalidateQueries({ queryKey: ['boards', teamId] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !boardQ.data) return;
    const toStatus = result.destination.droppableId as KanbanStatus;
    const cardId = result.draggableId;
    try {
      await kanbanService.moveCard(cardId, {
        status: toStatus,
        position: result.destination.index,
      });
      qc.invalidateQueries({ queryKey: ['board', activeBoardId] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const cardsByStatus = useMemo(() => {
    const map: Record<KanbanStatus, KanbanCard[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const c of boardQ.data?.cards ?? []) map[c.status].push(c);
    return map;
  }, [boardQ.data]);

  return (
    <div className="container max-w-7xl py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">Kanban</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            {boardQ.data?.name ?? 'Boards'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {boardQ.data?.team?.name} · drag cards to change status
          </p>
        </div>
        <div className="flex items-center gap-2">
          {boardsQ.data && boardsQ.data.length > 1 && (
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={activeBoardId ?? ''}
              onChange={(e) => setBoardId(e.target.value)}
              data-testid="board-switch"
            >
              {boardsQ.data.map((b: KanbanBoard) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <Dialog open={newBoardOpen} onOpenChange={setNewBoardOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="create-board-button">
                <Plus className="h-4 w-4" /> Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New board</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    data-testid="board-name"
                    value={newBoard.name}
                    onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    data-testid="board-description"
                    value={newBoard.description}
                    onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createBoard} disabled={!newBoard.name} data-testid="board-submit">
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {!activeBoardId && (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          No boards for this team yet — create your first board.
        </div>
      )}

      {boardQ.data && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                boardId={boardQ.data.id}
                column={col}
                cards={cardsByStatus[col.id]}
                onChanged={() => qc.invalidateQueries({ queryKey: ['board', activeBoardId] })}
              />
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

const Column = ({
  boardId,
  column,
  cards,
  onChanged,
}: {
  boardId: string;
  column: { id: KanbanStatus; label: string; accent: string };
  cards: KanbanCard[];
  onChanged: () => void;
}) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const add = async () => {
    if (!title.trim()) return;
    try {
      await kanbanService.createCard({ boardId, title: title.trim(), status: column.id });
      setTitle('');
      setAdding(false);
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className={cn('rounded-lg border-t-4 bg-muted/30 p-3', column.accent)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold uppercase tracking-wider">{column.label}</div>
        <div className="text-xs text-muted-foreground">{cards.length}</div>
      </div>
      <Droppable droppableId={column.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="min-h-[100px] space-y-2"
            data-testid={`column-${column.id}`}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(prov, snap) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                    className={cn(
                      'rounded-md border border-border bg-card p-3 shadow-sm transition-shadow',
                      snap.isDragging && 'shadow-lg',
                    )}
                    data-testid={`card-${card.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium leading-snug">{card.title}</div>
                      <button
                        onClick={async () => {
                          await kanbanService.deleteCard(card.id);
                          onChanged();
                        }}
                        className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        data-testid={`delete-card-${card.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {card.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                    )}
                    {card.assignee && (
                      <div className="mt-2 flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={card.assignee.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[9px]">
                            {card.assignee.name
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-muted-foreground">
                          {card.assignee.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {adding ? (
        <div className="mt-2 space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            data-testid={`new-card-input-${column.id}`}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={add} data-testid={`new-card-submit-${column.id}`}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex w-full items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent/10 hover:text-accent"
          data-testid={`new-card-${column.id}`}
        >
          <Plus className="h-3 w-3" /> Add card
        </button>
      )}
    </div>
  );
};
