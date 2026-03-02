async function softReloadBoard(featureResult, selectedIds = []) {
  const indicator = document.getElementById("ajax-indicator");
  if (indicator) indicator.style.display = "block";
  try {
    const res = await fetch(window.location.href, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("fetch failed");
    const html = await res.text();

    const parser = new DOMParser();
    const fetchedDoc = parser.parseFromString(html, "text/html");
    const newTable = fetchedDoc.querySelector("table.issues-board");
    const curTable = findBoardTable();
    if (!newTable || !curTable) throw new Error("no agile board table");

    curTable.innerHTML = newTable.innerHTML;

    // The agile plugin's page-init code adds .hascontextmenu to issue cards
    // at runtime; it's absent from freshly-fetched HTML. Without it,
    // Redmine's contextMenuRightClick silently exits on every right-click.
    curTable.querySelectorAll(".issue-card").forEach((card) => {
      card.classList.add("hascontextmenu");
    });

    // Re-apply any card selection that existed before the action.
    selectedIds.forEach((id) => {
      const card = curTable.querySelector(
        `.issue-card[data-id="${CSS.escape(id)}"]`,
      );
      if (!card || card.classList.contains("context-menu-selection")) return;
      card.classList.add("context-menu-selection");
      const cb = card.querySelector('input[name="ids[]"]');
      if (cb) cb.checked = true;
    });

    // Re-run features that inject DOM into the board.
    if (featureResult[ENHANCED_AGILE_BOARD_FEATURE_KEY]) {
      runCollapsedGroupsFeature();
    }
    if (featureResult[GITLAB_MR_FEATURE_KEY]) {
      await runGitlabMrStatusFeature();
    }

    // Re-initialise the Agile plugin's drag-and-drop last, after all DOM
    // manipulation is complete. The innerHTML swap destroys the sortable/
    // droppable bindings attached to the old nodes. Loaded as an extension
    // script file (not inline) so it passes the page's CSP, and runs in the
    // page JS context where agileBoard lives.
    const reinitScript = document.createElement("script");
    reinitScript.onload = () => reinitScript.remove();
    reinitScript.src = browserAPI.runtime.getURL("content/reinit-agile-board.js");
    document.head.appendChild(reinitScript);
  } catch (_e) {
    // Any failure falls back to a full page reload.
    window.location.reload();
    return;
  }
  if (indicator) indicator.style.display = "none";
}
