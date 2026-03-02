// Runs in page context (injected via <script src> by soft-reload.js) to
// re-initialise the Agile plugin's drag-and-drop after a board innerHTML swap.
if (typeof agileBoard !== "undefined") {
  agileBoard.initSortable();
  agileBoard.initDraggable();
  agileBoard.initDroppable();
}
