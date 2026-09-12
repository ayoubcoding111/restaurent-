// Graphify auto-update — rebuilds the knowledge graph after file edits.
// Complements `graphify hook install` (post-commit rebuild).
// Runs `graphify update .` with no API cost; never blocks the edit on failure.

export const GraphifyAuto = async ({ $, directory }) => {
  let running = false;

  const rebuild = async (reason) => {
    if (running) return;
    running = true;
    try {
      // Debounce rapid successive edits into one rebuild.
      await new Promise((r) => setTimeout(r, 2000));
      await $`graphify update .`.cwd(directory).nothrow();
    } catch {
      // Graph rebuild must never break the editing session.
    } finally {
      running = false;
    }
  };

  return {
    "file.edited": async () => {
      await rebuild("file.edited");
    },
    "tool.execute.after": async (input) => {
      if (input.tool === "edit" || input.tool === "write") {
        await rebuild(input.tool);
      }
    },
  };
};
