---
name: beads
description: Track complex, multi-session work with dependency graphs using beads issue tracker. Use when work spans multiple sessions, has complex dependencies, or requires persistent context across compaction cycles. For simple single-session linear tasks, TodoWrite remains appropriate.
---

# Beads

## Overview

bd is a graph-based issue tracker for persistent memory across sessions. Use for multi-session work with complex dependencies; use TodoWrite for simple single-session tasks.

## When to Use bd vs TodoWrite

### Use bd when:
- **Multi-session work** - Tasks spanning multiple compaction cycles or days
- **Complex dependencies** - Work with blockers, prerequisites, or hierarchical structure
- **Knowledge work** - Strategic documents, research, or tasks with fuzzy boundaries
- **Side quests** - Exploratory work that might pause the main task
- **Project memory** - Need to resume work after weeks away with full context

### Use TodoWrite when:
- **Single-session tasks** - Work that completes within current session
- **Linear execution** - Straightforward step-by-step tasks with no branching
- **Immediate context** - All information already in conversation
- **Simple tracking** - Just need a checklist to show progress

**Key insight**: If resuming work after 2 weeks would be difficult without bd, use bd. If the work can be picked up from a markdown skim, TodoWrite is sufficient.

### Test Yourself: bd or TodoWrite?

Ask these questions to decide:

**Choose bd if:**
- ❓ "Will I need this context in 2 weeks?" → Yes = bd
- ❓ "Could conversation history get compacted?" → Yes = bd
- ❓ "Does this have blockers/dependencies?" → Yes = bd
- ❓ "Is this fuzzy/exploratory work?" → Yes = bd

**Choose TodoWrite if:**
- ❓ "Will this be done in this session?" → Yes = TodoWrite
- ❓ "Is this just a task list for me right now?" → Yes = TodoWrite
- ❓ "Is this linear with no branching?" → Yes = TodoWrite

**When in doubt**: Use bd. Better to have persistent memory you don't need than to lose context you needed.

**For detailed decision criteria and examples, read:** [references/BOUNDARIES.md](references/BOUNDARIES.md)

## Surviving Compaction Events

**Critical**: Compaction events delete conversation history but preserve beads. After compaction, bd state is your only persistent memory.

**What survives compaction:**
- All bead data (issues, notes, dependencies, status)
- Complete work history and context

**What doesn't survive:**
- Conversation history
- TodoWrite lists
- Recent discussion context

**Writing notes for post-compaction recovery:**

Write notes as if explaining to a future agent with zero conversation context:

**Pattern:**
```markdown
notes field format:
- COMPLETED: Specific deliverables ("implemented JWT refresh endpoint + rate limiting")
- IN PROGRESS: Current state + next immediate step ("testing password reset flow, need user input on email template")
- BLOCKERS: What's preventing progress
- KEY DECISIONS: Important context or user guidance
```

**After compaction:** `bd show <issue-id>` reconstructs full context from notes field.

### Notes Quality Self-Check

Before checkpointing (especially pre-compaction), verify your notes pass these tests:

❓ **Future-me test**: "Could I resume this work in 2 weeks with zero conversation history?"
- [ ] What was completed? (Specific deliverables, not "made progress")
- [ ] What's in progress? (Current state + immediate next step)
- [ ] What's blocked? (Specific blockers with context)
- [ ] What decisions were made? (Why, not just what)

❓ **Stranger test**: "Could another developer understand this without asking me?"
- [ ] Technical choices explained (not just stated)
- [ ] Trade-offs documented (why this approach vs alternatives)
- [ ] User input captured (decisions that came from discussion)

**Good note example:**
```
COMPLETED: JWT auth with RS256 (1hr access, 7d refresh tokens)
KEY DECISION: RS256 over HS256 per security review - enables key rotation
IN PROGRESS: Password reset flow - email service working, need rate limiting
BLOCKERS: Waiting on user decision: reset token expiry (15min vs 1hr trade-off)
NEXT: Implement rate limiting (5 attempts/15min) once expiry decided
```

**Bad note example:**
```
Working on auth. Made some progress. More to do.
```

**For complete compaction recovery workflow, read:** [references/WORKFLOWS.md](references/WORKFLOWS.md#compaction-survival)

## Session Start Protocol

**bd is available when:**
- Project has a `.beads/` directory (project-local database), OR
- `~/.beads/` exists (global fallback database for any directory)

**At session start, always check for bd availability and run ready check.**

### Session Start Checklist

Copy this checklist when starting any session where bd is available:

```
Session Start:
- [ ] Run bv --robot-insights, bd ready --json to see available work
- [ ] Run bd list --status in_progress --json for active work
- [ ] If in_progress exists: bd show <issue-id> to read notes
- [ ] Report context to user: "X items ready: [summary]"
- [ ] If using global ~/.beads, mention this in report
- [ ] If nothing ready: bd blocked --json to check blockers
```

**Pattern**: Always check `bv --robot-insights` AND `bd ready` AND `bd list --status in_progress`. Read notes field first to understand where previous session left off.

**Report format**:
- "I can see X items ready to work on: [summary]"
- "Issue Y is in_progress. Last session: [summary from notes]. Next: [from notes]. Should I continue with that?"

This establishes immediate shared context about available and active work without requiring user prompting.

**For detailed collaborative handoff process, read:** [references/WORKFLOWS.md](references/WORKFLOWS.md#session-handoff)

**Note**: bd auto-discovers the database:
- Uses `.beads/*.db` in current project if exists
- Falls back to `~/.beads/default.db` otherwise
- No configuration needed

### When No Work is Ready

If `bd ready` returns empty but issues exist:

```bash
bd blocked --json
```

Report blockers and suggest next steps.

---

## Progress Checkpointing

Update bd notes at these checkpoints (don't wait for session end):

**Critical triggers:**
- ⚠️ **Context running low** - User says "running out of context" / "approaching compaction" / "close to token limit"
- 📊 **Token budget > 70%** - Proactively checkpoint when approaching limits
- 🎯 **Major milestone reached** - Completed significant piece of work
- 🚧 **Hit a blocker** - Can't proceed, need to capture what was tried
- 🔄 **Task transition** - Switching issues or about to close this one
- ❓ **Before user input** - About to ask decision that might change direction

**Proactive monitoring during session:**
- At 70% token usage: "We're at 70% token usage - good time to checkpoint bd notes?"
- At 85% token usage: "Approaching token limit (85%) - checkpointing current state to bd"
- At 90% token usage: Automatically checkpoint without asking

**Current token usage**: Check `<system-warning>Token usage:` messages to monitor proactively.

**Checkpoint checklist:**

```
Progress Checkpoint:
- [ ] Update notes with COMPLETED/IN_PROGRESS/NEXT format
- [ ] Document KEY DECISIONS or BLOCKERS since last update
- [ ] Mark current status (in_progress/blocked/closed)
- [ ] If discovered new work: create issues with discovered-from
- [ ] Verify notes are self-explanatory for post-compaction resume
```

**Most important**: When user says "running out of context" OR when you see >70% token usage - checkpoint immediately, even if mid-task.

**Test yourself**: "If compaction happened right now, could future-me resume from these notes?"

---

### Database Selection

bd automatically selects the appropriate database:
- **Project-local** (`.beads/` in project): Used for project-specific work
- **Global fallback** (`~/.beads/`): Used when no project-local database exists

**Use case for global database**: Cross-project tracking, personal task management, knowledge work that doesn't belong to a specific project.

**When to use --db flag explicitly:**
- Accessing a specific database outside current directory
- Working with multiple databases (e.g., project database + reference database)
- Example: `bd --db /path/to/reference/terms.db list`

**Database discovery rules:**
- bd looks for `.beads/*.db` in current working directory
- If not found, uses `~/.beads/default.db`
- Shell cwd can reset between commands - use absolute paths with --db when operating on non-local databases

**For complete session start workflows, read:** [references/WORKFLOWS.md](references/WORKFLOWS.md#session-start)

## Core Operations

All bd commands support `--json` flag for structured output when needed for programmatic parsing.

### Essential Operations

**Check ready work:**
```bash
bd ready
bd ready --json              # For structured output
bd ready --priority 0        # Filter by priority
bd ready --assignee alice    # Filter by assignee
```

**Create new issue:**

**IMPORTANT**: Always quote title and description arguments with double quotes, especially when containing spaces or special characters.

```bash
bd create "Fix login bug"
bd create "Add OAuth" -p 0 -t feature
bd create "Write tests" -d "Unit tests for auth module" --assignee alice
bd create "Research caching" --design "Evaluate Redis vs Memcached"

# Examples with special characters (requires quoting):
bd create "Fix: auth doesn't handle edge cases" -p 1
bd create "Refactor auth module" -d "Split auth.go into separate files (handlers, middleware, utils)"
```

**Update issue status:**
```bash
bd update issue-123 --status in_progress
bd update issue-123 --priority 0
bd update issue-123 --assignee bob
bd update issue-123 --design "Decided to use Redis for persistence support"
```

**Close completed work:**
```bash
bd close issue-123
bd close issue-123 --reason "Implemented in PR #42"
bd close issue-1 issue-2 issue-3 --reason "Bulk close related work"
```

**Show issue details:**
```bash
bd show issue-123
bd show issue-123 --json
```

**List issues:**
```bash
bd list
bd list --status open
bd list --priority 0
bd list --type bug
bd list --assignee alice
```

**For complete CLI reference with all flags and examples, read:** [references/CLI_REFERENCE.md](references/CLI_REFERENCE.md)

## Field Usage Reference

Quick guide for when and how to use each bd field:

| Field | Purpose | When to Set | Update Frequency |
|-------|---------|-------------|------------------|
| **description** | Immutable problem statement | At creation | Never (fixed forever) |
| **design** | Initial approach, architecture, decisions | During planning | Rarely (only if approach changes) |
| **acceptance-criteria** | Concrete deliverables checklist (`- [ ]` syntax) | When design is clear | Mark `- [x]` as items complete |
| **notes** | Session handoff (COMPLETED/IN_PROGRESS/NEXT) | During work | At session end, major milestones |
| **status** | Workflow state (open→in_progress→closed) | As work progresses | When changing phases |
| **priority** | Urgency level (0=highest, 3=lowest) | At creation | Adjust if priorities shift |

**Key pattern**: Notes field is your "read me first" at session start. See [WORKFLOWS.md](references/WORKFLOWS.md#session-handoff) for session handoff details.

---

## Issue Lifecycle Workflow

### 1. Discovery Phase (Proactive Issue Creation)

**During exploration or implementation, proactively file issues for:**
- Bugs or problems discovered
- Potential improvements noticed
- Follow-up work identified
- Technical debt encountered
- Questions requiring research

**Pattern:**
```bash
# When encountering new work during a task:
bd create "Found: auth doesn't handle profile permissions"
bd dep add current-task-id new-issue-id --type discovered-from

# Continue with original task - issue persists for later
```

**Key benefit**: Capture context immediately instead of losing it when conversation ends.

### 2. Execution Phase (Status Maintenance)

**Mark issues in_progress when starting work:**
```bash
bd update issue-123 --status in_progress
```

**Update throughout work:**
```bash
# Add design notes as implementation progresses
bd update issue-123 --design "Using JWT with RS256 algorithm"

# Update acceptance criteria if requirements clarify
bd update issue-123 --acceptance "- JWT validation works\n- Tests pass\n- Error handling returns 401"
```

**Close when complete:**
```bash
bd close issue-123 --reason "Implemented JWT validation with tests passing"
```

**Important**: Closed issues remain in database - they're not deleted, just marked complete for project history.

### 3. Planning Phase (Dependency Graphs)

For complex multi-step work, structure issues with dependencies before starting:

**Create parent epic:**
```bash
bd create "Implement user authentication" -t epic -d "OAuth integration with JWT tokens"
```

**Create subtasks:**
```bash
bd create "Set up OAuth credentials" -t task
bd create "Implement authorization flow" -t task
bd create "Add token refresh" -t task
```

**Link with dependencies:**
```bash
# parent-child for epic structure
bd dep add auth-epic auth-setup --type parent-child
bd dep add auth-epic auth-flow --type parent-child

# blocks for ordering
bd dep add auth-setup auth-flow
```

**For detailed dependency patterns and types, read:** [references/DEPENDENCIES.md](references/DEPENDENCIES.md)

## Dependency Types Reference

bd supports four dependency types:

1. **blocks** - Hard blocker (issue A blocks issue B from starting)
2. **related** - Soft link (issues are related but not blocking)
3. **parent-child** - Hierarchical (epic/subtask relationship)
4. **discovered-from** - Provenance (issue B discovered while working on A)

**For complete guide on when to use each type with examples and patterns, read:** [references/DEPENDENCIES.md](references/DEPENDENCIES.md)

## Integration with TodoWrite

**Both tools complement each other at different timescales:**

### Temporal Layering Pattern

**TodoWrite** (short-term working memory - this hour):
- Tactical execution: "Review Section 3", "Expand Q&A answers"
- Marked completed as you go
- Present/future tense ("Review", "Expand", "Create")
- Ephemeral: Disappears when session ends

**Beads** (long-term episodic memory - this week/month):
- Strategic objectives: "Continue work on strategic planning document"
- Key decisions and outcomes in notes field
- Past tense in notes ("COMPLETED", "Discovered", "Blocked by")
- Persistent: Survives compaction and session boundaries

### The Handoff Pattern

1. **Session start**: Read bead → Create TodoWrite items for immediate actions
2. **During work**: Mark TodoWrite items completed as you go
3. **Reach milestone**: Update bead notes with outcomes + context
4. **Session end**: TodoWrite disappears, bead survives with enriched notes

**After compaction**: TodoWrite is gone forever, but bead notes reconstruct what happened.

### Example: TodoWrite tracks execution, Beads capture meaning

**TodoWrite:**
```
[completed] Implement login endpoint
[in_progress] Add password hashing with bcrypt
[pending] Create session middleware
```

**Corresponding bead notes:**
```
bd update issue-123 --notes "COMPLETED: Login endpoint with bcrypt password
hashing (12 rounds). KEY DECISION: Using JWT tokens (not sessions) for stateless
auth - simplifies horizontal scaling. IN PROGRESS: Session middleware implementation.
NEXT: Need user input on token expiry time (1hr vs 24hr trade-off)."
```

**Don't duplicate**: TodoWrite tracks execution, Beads captures meaning and context.

**For patterns on transitioning between tools mid-session, read:** [references/BOUNDARIES.md](references/BOUNDARIES.md#integration-patterns)

## Common Patterns

### Pattern 1: Knowledge Work Session

**Scenario**: User asks "Help me write a proposal for expanding the analytics platform"

**What you see**:
```bash
$ bd ready
# Returns: bd-42 "Research analytics platform expansion proposal" (in_progress)

$ bd show bd-42
Notes: "COMPLETED: Reviewed current stack (Mixpanel, Amplitude)
IN PROGRESS: Drafting cost-benefit analysis section
NEXT: Need user input on budget constraints before finalizing recommendations"
```

**What you do**:
1. Read notes to understand current state
2. Create TodoWrite for immediate work:
   ```
   - [ ] Draft cost-benefit analysis
   - [ ] Ask user about budget constraints
   - [ ] Finalize recommendations
   ```
3. Work on tasks, mark TodoWrite items completed
4. At milestone, update bd notes:
   ```bash
   bd update bd-42 --notes "COMPLETED: Cost-benefit analysis drafted.
   KEY DECISION: User confirmed $50k budget cap - ruled out enterprise options.
   IN PROGRESS: Finalizing recommendations (Posthog + custom ETL).
   NEXT: Get user review of draft before closing issue."
   ```

**Outcome**: TodoWrite disappears at session end, but bd notes preserve context for next session.

### Pattern 2: Side Quest Handling

During main task, discover a problem:
1. Create issue: `bd create "Found: inventory system needs refactoring"`
2. Link using discovered-from: `bd dep add main-task new-issue --type discovered-from`
3. Assess: blocker or can defer?
4. If blocker: `bd update main-task --status blocked`, work on new issue
5. If deferrable: note in issue, continue main task

### Pattern 3: Multi-Session Project Resume

Starting work after time away:
1. Run `bv --robot-insights`,`bd ready` to see available work
2. Run `bd blocked` to understand what's stuck
3. Run `bd list --status closed --limit 10` to see recent completions
4. Run `bd show issue-id` on issue to work on
5. Update status and begin work

**For complete workflow walkthroughs with checklists, read:** [references/WORKFLOWS.md](references/WORKFLOWS.md)

## Issue Creation

**Quick guidelines:**
- Ask user first for knowledge work with fuzzy boundaries
- Create directly for clear bugs, technical debt, or discovered work
- Use clear titles, sufficient context in descriptions
- Design field: HOW to build (can change during implementation)
- Acceptance criteria: WHAT success looks like (should remain stable)

### Issue Creation Checklist

Copy when creating new issues:

```
Creating Issue:
- [ ] Title: Clear, specific, action-oriented
- [ ] Description: Problem statement (WHY this matters) - immutable
- [ ] Design: HOW to build (can change during work)
- [ ] Acceptance: WHAT success looks like (stays stable)
- [ ] Priority: 0=critical, 1=high, 2=normal, 3=low
- [ ] Type: bug/feature/task/epic/chore
```

**Self-check for acceptance criteria:**

❓ "If I changed the implementation approach, would these criteria still apply?"
- → **Yes** = Good criteria (outcome-focused)
- → **No** = Move to design field (implementation-focused)

**Example:**
- ✅ Acceptance: "User tokens persist across sessions and refresh automatically"
- ❌ Wrong: "Use JWT tokens with 1-hour expiry" (that's design, not acceptance)

**For detailed guidance on when to ask vs create, issue quality, resumability patterns, and design vs acceptance criteria, read:** [references/ISSUE_CREATION.md](references/ISSUE_CREATION.md)

## Alternative Use Cases

bd is primarily for work tracking, but can also serve as queryable database for static reference data (glossaries, terminology) with adaptations.

**For guidance on using bd for reference databases and static data, read:** [references/STATIC_DATA.md](references/STATIC_DATA.md)

## Statistics and Monitoring

**Check project health:**
```bash
bd stats
bd stats --json
```

Returns: total issues, open, in_progress, closed, blocked, ready, avg lead time

**Find blocked work:**
```bash
bd blocked
bd blocked --json
```

Use stats to:
- Report progress to user
- Identify bottlenecks
- Understand project velocity

## Advanced Features

### Issue Types

```bash
bd create "Title" -t task        # Standard work item (default)
bd create "Title" -t bug         # Defect or problem
bd create "Title" -t feature     # New functionality
bd create "Title" -t epic        # Large work with subtasks
bd create "Title" -t chore       # Maintenance or cleanup
```

### Priority Levels

```bash
bd create "Title" -p 0    # Highest priority (critical)
bd create "Title" -p 1    # High priority
bd create "Title" -p 2    # Normal priority (default)
bd create "Title" -p 3    # Low priority
```

### Bulk Operations

```bash
# Close multiple issues at once
bd close issue-1 issue-2 issue-3 --reason "Completed in sprint 5"

# Create multiple issues from markdown file
bd create --file issues.md
```

### Dependency Visualization

```bash
# Show full dependency tree for an issue
bd dep tree issue-123

# Check for circular dependencies
bd dep cycles
```

### Built-in Help

```bash
# Quick start guide (comprehensive built-in reference)
bd quickstart

# Command-specific help
bd create --help
bd dep --help
```

## JSON Output

All bd commands support `--json` flag for structured output:

```bash
bd ready --json
bd show issue-123 --json
bd list --status open --json
bd stats --json
```

Use JSON output when you need to parse results programmatically or extract specific fields.

## Troubleshooting

**If bd command not found:**
- Check installation: `bd version`
- Verify PATH includes bd binary location

**If issues seem lost:**
- Use `bd list` to see all issues
- Filter by status: `bd list --status closed`
- Closed issues remain in database permanently

**If bd show can't find issue by name:**
- `bd show` requires issue IDs, not issue titles
- Workaround: `bd list | grep -i "search term"` to find ID first
- Then: `bd show issue-id` with the discovered ID
- For glossaries/reference databases where names matter more than IDs, consider using markdown format alongside the database

**If dependencies seem wrong:**
- Use `bd show issue-id` to see full dependency tree
- Use `bd dep tree issue-id` for visualization
- Dependencies are directional: `bd dep add from-id to-id` means from-id blocks to-id
- See [references/DEPENDENCIES.md](references/DEPENDENCIES.md#common-mistakes)

**If database seems out of sync:**
- bd auto-syncs JSONL after each operation (5s debounce)
- bd auto-imports JSONL when newer than DB (after git pull)
- Manual operations: `bd export`, `bd import`

## Reference Files

Detailed information organized by topic:

| Reference | Read When |
|-----------|-----------|
| [references/BOUNDARIES.md](references/BOUNDARIES.md) | Need detailed decision criteria for bd vs TodoWrite, or integration patterns |
| [references/CLI_REFERENCE.md](references/CLI_REFERENCE.md) | Need complete command reference, flag details, or examples |
| [references/WORKFLOWS.md](references/WORKFLOWS.md) | Need step-by-step workflows with checklists for common scenarios |
| [references/DEPENDENCIES.md](references/DEPENDENCIES.md) | Need deep understanding of dependency types or relationship patterns |
| [references/ISSUE_CREATION.md](references/ISSUE_CREATION.md) | Need guidance on when to ask vs create issues, issue quality, or design vs acceptance criteria |
| [references/STATIC_DATA.md](references/STATIC_DATA.md) | Want to use bd for reference databases, glossaries, or static data instead of work tracking |

## issues.jsonl file EXAMPLES FROM THE GRANDMASTER: How to use Beads like a pro.

{"id":"bd-fb95094c.6","title":"Extract normalizeLabels to shared utility package","description":"The `normalizeLabels` function appears in multiple locations with identical implementation. Extract to a shared utility package.\n\nCurrent locations:\n- `internal/rpc/server.go:37` (53 lines) - full implementation\n- `cmd/bd/list.go:50-52` - uses the server version (needs to use new shared version)\n\nFunction purpose:\n- Trims whitespace from labels\n- Removes empty strings\n- Deduplicates labels\n- Preserves order\n\nTarget structure:\n```\ninternal/util/\n├── strings.go         # String utilities\n    └── NormalizeLabels([]string) []string\n```\n\nImpact: DRY principle, single source of truth, easier to test","status":"closed","priority":2,"issue_type":"task","created_at":"2025-10-27T20:31:19.078622-07:00","updated_at":"2025-12-14T12:12:46.498018-08:00","closed_at":"2025-11-06T19:58:59.467567-08:00","dependencies":[{"issue_id":"bd-fb95094c.6","depends_on_id":"bd-fb95094c","type":"parent-child","created_at":"2025-10-27T20:31:19.08015-07:00","created_by":"daemon"}]}
{"id":"bd-e16b","title":"Replace BEADS_DB with BEADS_DIR environment variable","description":"Implement BEADS_DIR as a replacement for BEADS_DB to point to the .beads directory instead of the database file directly.\n\nRationale:\n- With --no-db mode, there's no .db file to point to\n- The .beads directory is the logical unit (contains config.yaml, db files, jsonl files)\n- More intuitive: point to the beads directory not the database file\n\nImplementation:\n1. Add BEADS_DIR environment variable support\n2. Maintain backward compatibility with BEADS_DB\n3. Priority order: BEADS_DIR \u003e BEADS_DB \u003e auto-discovery\n4. If BEADS_DIR is set, look for config.yaml in that directory to find actual database path\n5. Update documentation and migration guide\n\nFiles to modify:\n- beads.go (FindDatabasePath function)\n- cmd/bd/main.go (initialization)\n- Documentation (CLI_REFERENCE.md, TROUBLESHOOTING.md, etc.)\n- MCP integration (integrations/beads-mcp/src/beads_mcp/config.py)\n\nTesting:\n- Ensure BEADS_DB still works (backward compatibility)\n- Test BEADS_DIR with both db and --no-db modes\n- Test priority order when both are set\n- Update integration tests\n\nRelated to GitHub issue #179","status":"closed","priority":2,"issue_type":"feature","created_at":"2025-11-02T18:19:26.131948-08:00","updated_at":"2025-11-02T18:27:14.545162-08:00","closed_at":"2025-11-02T18:27:14.545162-08:00"}
{"id":"bd-fx7v","title":"Improve test coverage for cmd/bd/doctor/fix (23.9% → 50%)","description":"The doctor/fix package has only 23.9% test coverage. The doctor fix functionality is important for troubleshooting.\n\nCurrent coverage: 23.9%\nTarget coverage: 50%","status":"open","priority":2,"issue_type":"task","created_at":"2025-12-13T20:43:05.67127-08:00","updated_at":"2025-12-13T21:01:20.839298-08:00"}
{"id":"bd-9f1fce5d","title":"Add internal/ai package for LLM integration","description":"Shared AI client for repair commands.\n\nProviders:\n- Anthropic (Claude)\n- OpenAI (GPT)\n- Ollama (local)\n\nEnv vars:\n- BEADS_AI_PROVIDER\n- BEADS_AI_API_KEY\n- BEADS_AI_MODEL\n\nFiles: internal/ai/client.go (new)","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-28T14:48:29.072473-07:00","updated_at":"2025-12-14T12:12:46.567174-08:00","closed_at":"2025-11-06T19:27:19.128093-08:00"}
{"id":"bd-sjmr","title":"Fix inconsistent error handling in multi-repo deletion tracking","description":"From bd-xo6b code review: Multi-repo deletion tracking has mixed failure modes that can leave system in inconsistent state.\n\n**Current behavior (daemon_sync.go):**\n- Snapshot capture (L505-514): Hard fail → aborts sync\n- Merge/prune (L575-584): Hard fail → aborts sync  \n- Base snapshot update (L613-619): Soft fail → logs warning, continues\n\n**Critical problem:**\nIf merge fails on repo 3 of 5:\n- Repos 1-2 have already merged and deleted issues (irreversible)\n- Repos 3-5 are untouched\n- Database is in partially-updated state\n- No rollback mechanism\n\n**Real-world scenario:**\n```\nSync with repos [A, B, C]:\n1. Capture snapshots A ✓, B ✓, C ✗ → ABORT (good)\n2. Merge A ✓, B ✗ → ABORT but A already deleted issues (BAD - no rollback)\n3. Update base A ⚠, B ⚠ → Warnings only (inconsistent with 1 \u0026 2)\n```\n\n**Solution options:**\n1. **Two-phase commit:**\n   - Phase 1: Validate all repos (check files exist, readable, parseable)\n   - Phase 2: Apply changes atomically (or fail entirely before any mutations)\n\n2. **Fail-fast validation:**\n   - Before any snapshot/merge operations, validate all repos upfront\n   - Abort entire sync if any repo fails validation\n\n3. **Make base snapshot update consistent:**\n   - Either make it hard-fail like the others, or make all soft-fail\n\n**Files:**\n- cmd/bd/daemon_sync.go:505-514 (snapshot capture)\n- cmd/bd/daemon_sync.go:575-584 (merge/prune)\n- cmd/bd/daemon_sync.go:613-619 (base snapshot update)\n\n**Recommendation:** Use option 1 (two-phase) or option 2 (fail-fast validation) + fix base snapshot inconsistency.","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-06T19:31:29.538092-08:00","updated_at":"2025-11-06T19:35:41.268584-08:00","closed_at":"2025-11-06T19:35:41.268584-08:00","dependencies":[{"issue_id":"bd-sjmr","depends_on_id":"bd-xo6b","type":"discovered-from","created_at":"2025-11-06T19:32:12.310033-08:00","created_by":"daemon"}]}
{"id":"bd-mdw","title":"Add integration test for cross-clone deletion propagation","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-25T14:56:38.997009-08:00","updated_at":"2025-11-25T16:35:59.052914-08:00","closed_at":"2025-11-25T16:35:59.052914-08:00"}
{"id":"bd-8507","title":"Publish bd-wasm to npm","description":"Package and publish WASM build to npm. Child of epic bd-44d0.\n\n## Tasks\n- [ ] Optimize WASM bundle (compression)\n- [ ] Create README for npm package\n- [ ] Set up npm publishing workflow\n- [ ] Publish v0.1.0-alpha\n- [ ] Test installation in clean environment\n- [ ] Update beads AGENTS.md with installation instructions\n\n## Package Name\nbd-wasm (or @beads/wasm-cli)","status":"closed","issue_type":"task","created_at":"2025-11-02T18:33:31.371535-08:00","updated_at":"2025-12-14T12:12:46.488027-08:00","closed_at":"2025-11-05T00:55:48.757494-08:00","dependencies":[{"issue_id":"bd-8507","depends_on_id":"bd-197b","type":"blocks","created_at":"2025-11-02T18:33:31.372224-08:00","created_by":"daemon"},{"issue_id":"bd-8507","depends_on_id":"bd-374e","type":"blocks","created_at":"2025-11-02T22:27:56.025207-08:00","created_by":"daemon"}]}
{"id":"bd-pdwz","title":"Add t.Parallel() to slow hash multiclone tests","description":"Add t.Parallel() to TestHashIDs_MultiCloneConverge and TestHashIDs_IdenticalContentDedup so they run concurrently.\n\nExpected savings: ~10 seconds (from 20s to ~11s)\n\nImplementation:\n- Add t.Parallel() call at start of each test function\n- Verify tests don't share resources that would cause conflicts\n- Run tests to confirm they work in parallel\n\nFile: beads_hash_multiclone_test.go:34, :101","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-04T01:24:15.705228-08:00","updated_at":"2025-11-04T09:52:31.945545-08:00","closed_at":"2025-11-04T09:52:31.945545-08:00","dependencies":[{"issue_id":"bd-pdwz","depends_on_id":"bd-l5gq","type":"blocks","created_at":"2025-11-04T01:24:15.706149-08:00","created_by":"daemon"}]}
{"id":"bd-f8b764c9.8","title":"Update JSONL format to use hash IDs","description":"Update JSONL import/export to use hash IDs, store aliases separately.\n\n## Current JSONL Format\n```jsonl\n{\"id\":\"bd-1c63eb84\",\"title\":\"Fix bug\",\"status\":\"open\",...}\n{\"id\":\"bd-9063acda\",\"title\":\"Add test\",\"status\":\"open\",...}\n```\n\n## New JSONL Format (Option A: Include Alias)\n```jsonl\n{\"id\":\"bd-af78e9a2\",\"alias\":1,\"title\":\"Fix bug\",\"status\":\"open\",...}\n{\"id\":\"bd-e5f6a7b8\",\"alias\":2,\"title\":\"Add test\",\"status\":\"open\",...}\n```\n\n## New JSONL Format (Option B: Hash ID Only)\n```jsonl\n{\"id\":\"bd-af78e9a2\",\"title\":\"Fix bug\",\"status\":\"open\",...}\n{\"id\":\"bd-e5f6a7b8\",\"title\":\"Add test\",\"status\":\"open\",...}\n```\n\nStore aliases in separate .beads/aliases.jsonl (local only, git-ignored):\n```jsonl\n{\"hash\":\"bd-af78e9a2\",\"alias\":1}\n{\"hash\":\"bd-e5f6a7b8\",\"alias\":2}\n```\n\n**Recommendation**: Option B (hash only in main JSONL)\n- Cleaner git diffs (no alias conflicts)\n- Aliases are workspace-local preference\n- Main JSONL is canonical, portable\n\n## Export Changes\nFile: cmd/bd/export.go\n```go\n// Export issues with hash IDs\nfor _, issue := range issues {\n    json := marshalIssue(issue)  // Uses issue.ID (hash)\n    // Don't include alias in JSONL\n}\n\n// Separately export aliases to .beads/aliases.jsonl\nexportAliases(issues)\n```\n\n## Import Changes  \nFile: cmd/bd/import.go, internal/importer/importer.go\n```go\n// Import issues by hash ID\nissue := unmarshalIssue(line)\n// Assign new alias on import (don't use incoming alias)\nissue.Alias = getNextAlias()\n\n// No collision detection needed! Hash IDs are globally unique\n```\n\n## Dependency Reference Format\nNo change needed - already uses issue IDs:\n```json\n{\"depends_on_id\":\"bd-af78e9a2\",\"type\":\"blocks\"}\n```\n\n## Files to Modify\n- cmd/bd/export.go (use hash IDs)\n- cmd/bd/import.go (import hash IDs, assign aliases)\n- internal/importer/importer.go (remove collision detection!)\n- .gitignore (add .beads/aliases.jsonl)\n\n## Testing\n- Test export produces hash IDs\n- Test import assigns new aliases\n- Test dependencies preserved with hash IDs\n- Test no collision detection triggered","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-29T21:24:47.408106-07:00","updated_at":"2025-10-31T12:32:32.609925-07:00","closed_at":"2025-10-31T12:32:32.609925-07:00","dependencies":[{"issue_id":"bd-f8b764c9.8","depends_on_id":"bd-f8b764c9","type":"parent-child","created_at":"2025-10-29T21:24:47.409489-07:00","created_by":"stevey"},{"issue_id":"bd-f8b764c9.8","depends_on_id":"bd-f8b764c9.9","type":"blocks","created_at":"2025-10-29T21:24:47.409977-07:00","created_by":"stevey"},{"issue_id":"bd-f8b764c9.8","depends_on_id":"bd-f8b764c9.10","type":"blocks","created_at":"2025-10-29T21:29:45.975499-07:00","created_by":"stevey"}]}
{"id":"bd-c83r","title":"Prevent multiple daemons from running on the same repo","description":"Multiple bd daemons running on the same repo clone causes race conditions and data corruption risks.\n\n**Problem:**\n- Nothing prevents spawning multiple daemons for the same repository\n- Multiple daemons watching the same files can conflict during sync operations\n- Observed: 4 daemons running simultaneously caused sync race condition\n\n**Solution:**\nImplement daemon singleton enforcement per repo:\n1. Use a lock file (e.g., .beads/.daemon.lock) with PID\n2. On daemon start, check if lock exists and process is alive\n3. If stale lock (dead PID), clean up and acquire lock\n4. If active daemon exists, either:\n   - Exit with message 'daemon already running (PID xxx)'\n   - Or offer --replace flag to kill existing and take over\n5. Release lock on graceful shutdown\n\n**Edge cases to handle:**\n- Daemon crashes without releasing lock (stale PID detection)\n- Multiple repos in same directory tree (each repo gets own lock)\n- Race between two daemons starting simultaneously (atomic lock acquisition)","status":"closed","priority":2,"issue_type":"bug","created_at":"2025-12-13T06:37:23.377131-08:00","updated_at":"2025-12-14T17:34:14.990077-08:00","closed_at":"2025-12-14T17:34:14.990077-08:00"}
{"id":"bd-j6lr","title":"GH#402: Add --parent flag documentation to bd onboard","description":"bd onboard output is missing --parent flag for epic subtasks. Agents guess wrong syntax (--deps parent:). See GitHub issue #402.","status":"open","priority":2,"issue_type":"task","created_at":"2025-12-16T01:03:56.594829-08:00","updated_at":"2025-12-16T01:03:56.594829-08:00"}
{"id":"bd-e1d645e8","title":"Rapid 4","status":"closed","priority":3,"issue_type":"task","created_at":"2025-10-29T19:11:57.484329-07:00","updated_at":"2025-12-14T12:12:46.554853-08:00","closed_at":"2025-11-07T23:18:52.316948-08:00"}
{"id":"bd-zai","title":"bd init resets metadata.json jsonl_export to beads.jsonl, ignoring existing issues.jsonl","description":"When running 'bd init --prefix bd' in a repo that already has .beads/issues.jsonl, the init command overwrites metadata.json and sets jsonl_export back to 'beads.jsonl' instead of detecting and respecting the existing issues.jsonl file.\n\nSteps to reproduce:\n1. Have a repo with .beads/issues.jsonl (canonical) and metadata.json pointing to issues.jsonl\n2. Delete beads.db and run 'bd init --prefix bd'\n3. Check metadata.json - it now says jsonl_export: beads.jsonl\n\nExpected: Init should detect existing issues.jsonl and use it.\n\nWorkaround: Manually edit metadata.json after init.","status":"closed","priority":2,"issue_type":"bug","created_at":"2025-11-26T22:27:41.653287-08:00","updated_at":"2025-12-02T17:11:19.752292588-05:00","closed_at":"2025-11-28T21:54:32.52461-08:00"}
{"id":"bd-wfmw","title":"Integration Layer Implementation","description":"Build the adapter layer that makes Agent Mail optional and non-intrusive.","notes":"Progress: bd-m9th (Python adapter library) completed with full test coverage. Next: bd-fzbg (update python-agent example with Agent Mail integration).","status":"closed","priority":1,"issue_type":"epic","created_at":"2025-11-07T22:42:09.356429-08:00","updated_at":"2025-11-08T00:20:30.888756-08:00","closed_at":"2025-11-08T00:20:30.888756-08:00","dependencies":[{"issue_id":"bd-wfmw","depends_on_id":"bd-spmx","type":"blocks","created_at":"2025-11-07T22:42:09.357488-08:00","created_by":"daemon"}]}
{"id":"bd-833559b3","title":"bd validate - Comprehensive health check","description":"Run all validation checks in one command.\n\nChecks:\n- Duplicates\n- Orphaned dependencies\n- Test pollution\n- Git conflicts\n\nSupports --fix-all for auto-repair.\n\nDepends on bd-cbed9619.1, bd-0dcea000, bd-2752a7a2, bd-9826b69a.\n\nFiles: cmd/bd/validate.go (new)","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-29T20:02:47.957692-07:00","updated_at":"2025-12-14T12:12:46.507297-08:00","closed_at":"2025-11-05T00:16:42.294117-08:00"}
{"id":"bd-8b65","title":"Add depth-based batch creation in upsertIssues","description":"Replace single batch creation with depth-level batching (max depth 3). Create issues at depth 0, then 1, then 2, then 3. Prevents parent validation errors when importing hierarchical issues in same batch. File: internal/importer/importer.go:534-546","status":"closed","issue_type":"task","created_at":"2025-11-04T12:31:42.267746-08:00","updated_at":"2025-11-05T00:08:42.813239-08:00","closed_at":"2025-11-05T00:08:42.813246-08:00"}
{"id":"bd-0447029c","title":"bd find-duplicates - AI-powered duplicate detection","description":"Find semantically duplicate issues.\n\nApproaches:\n1. Mechanical: Exact title/description matching\n2. Embeddings: Cosine similarity (cheap, scalable)\n3. AI: LLM-based semantic comparison (expensive, accurate)\n\nUses embeddings by default for \u003e100 issues.\n\nFiles: cmd/bd/find_duplicates.go (new)","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-29T16:43:28.182327-07:00","updated_at":"2025-10-30T17:12:58.188016-07:00","closed_at":"2025-10-29T16:15:10.64719-07:00"}
{"id":"bd-bob","title":"Missing test: base is tombstone, both left and right are live","description":"The tombstone merge tests do not cover the case where the base version is a tombstone but both left and right have resurrected/live versions. This scenario could occur if: 1) Clone A deletes an issue, 2) Clone B and Clone C both sync from A (getting tombstone), 3) Both B and C independently recreate an issue with same ID. The current code would likely fall through to standard mergeIssue() which may not be correct. Need to add test and verify behavior. Files: internal/merge/merge_test.go, internal/merge/merge.go:347-387","status":"closed","priority":3,"issue_type":"task","created_at":"2025-12-05T16:36:34.895944-08:00","updated_at":"2025-12-12T18:12:51.82264-08:00","closed_at":"2025-12-07T02:27:40.788701-08:00"}
{"id":"bd-37dd","title":"Add topological sort utility functions","description":"Create internal/importer/sort.go with utilities for depth-based sorting of issues. Functions: GetHierarchyDepth(id), SortByDepth(issues), GroupByDepth(issues). Include stable sorting for same-depth issues.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-04T12:31:42.309207-08:00","updated_at":"2025-11-05T00:08:42.812378-08:00","closed_at":"2025-11-05T00:08:42.81238-08:00"}
{"id":"bd-bgm","title":"Fix unparam unused parameter in cmd/bd/doctor.go:1879","description":"Linting issue: checkGitHooks - path is unused (unparam) at cmd/bd/doctor.go:1879:20. Error: func checkGitHooks(path string) doctorCheck {","status":"open","issue_type":"bug","created_at":"2025-12-07T15:35:25.270293252-07:00","updated_at":"2025-12-07T15:35:25.270293252-07:00"}
{"id":"bd-hxou","title":"Daemon performAutoImport should update jsonl_content_hash after import","description":"The daemon's performAutoImport function was not updating jsonl_content_hash after successful import, unlike the CLI import path. This could cause repeated imports if the file hash and DB hash diverge.\n\nFix: Added hash update after validatePostImport succeeds, using repoKey for multi-repo support.","status":"closed","priority":2,"issue_type":"bug","created_at":"2025-12-13T06:44:04.442976-08:00","updated_at":"2025-12-13T06:44:09.546976-08:00","closed_at":"2025-12-13T06:44:09.546976-08:00"}
{"id":"bd-2997","title":"bd-hv01: No snapshot versioning or timestamps causes stale data usage","description":"Problem: If sync is interrupted (crash, kill -9, power loss), stale snapshots persist indefinitely. Next sync uses stale data leading to incorrect deletions.\n\nFix: Add metadata to snapshots with timestamp, version, and commit SHA. Validate snapshots are recent (\u003c 1 hour old), from compatible version, and from expected git commit.\n\nFiles: cmd/bd/deletion_tracking.go (all snapshot functions)","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-06T18:16:21.816748-08:00","updated_at":"2025-11-06T19:34:51.677442-08:00","closed_at":"2025-11-06T19:34:51.677442-08:00","dependencies":[{"issue_id":"bd-2997","depends_on_id":"bd-rbxi","type":"parent-child","created_at":"2025-11-06T18:19:14.968471-08:00","created_by":"daemon"}]}
{"id":"bd-6rf","title":"bd doctor: detect and fix stale beads-sync branch","description":"## Problem\n\nWhen beads-sync diverges significantly from main (on source code, not just .beads/), it needs to be reset. After a force-push reset, other clones/contributors will have orphaned local beads-sync branches.\n\n## Symptoms\n- Local beads-sync is many commits behind main on source files\n- Local beads-sync doesn't share recent history with remote beads-sync (after force-push)\n- bd sync may behave unexpectedly\n\n## Proposed bd doctor checks\n\n1. **Check beads-sync alignment with main**\n   - If beads-sync exists and is \u003eN commits behind main on non-.beads/ files, warn\n   - Suggests: reset beads-sync to main\n\n2. **Check beads-sync alignment with remote**\n   - If local beads-sync has diverged from origin/beads-sync (no common recent ancestor)\n   - This happens after someone force-pushed a reset\n   - Suggests: reset local beads-sync to origin/beads-sync\n\n## Proposed fixes (--fix)\n\n- Reset local beads-sync branch to origin/beads-sync or main\n- Handle worktree if present (git worktree remove, then recreate on next sync)\n\n## Context\nDiscovered when beads-sync drifted 126 commits behind main. Required manual reset and force-push. Contributors will need to reset their local branches too.","status":"closed","priority":2,"issue_type":"feature","created_at":"2025-12-02T23:45:40.607538-08:00","updated_at":"2025-12-13T08:15:21.911768+11:00","closed_at":"2025-12-03T22:13:21.727319-08:00"}
{"id":"bd-69bce74a","title":"Platform tests: Linux, macOS, Windows","description":"Test event-driven mode on all platforms. Verify inotify (Linux), FSEvents (macOS), ReadDirectoryChangesW (Windows). Test fallback behavior on each.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-29T19:42:29.85636-07:00","updated_at":"2025-10-30T17:12:58.193697-07:00","closed_at":"2025-10-29T15:33:22.149551-07:00"}
{"id":"bd-1fkr","title":"bd-hv01: Storage backend extensibility broken by type assertion","description":"Problem: deletion_tracking.go:69-82 uses type assertion for DeleteIssue which breaks if someone adds a new storage backend.\n\nFix: Check capability before starting merge or add DeleteIssue to Storage interface.\n\nFiles: cmd/bd/deletion_tracking.go:69-82, internal/storage/storage.go","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-06T18:16:20.770662-08:00","updated_at":"2025-11-06T18:55:08.666253-08:00","closed_at":"2025-11-06T18:55:08.666253-08:00","dependencies":[{"issue_id":"bd-1fkr","depends_on_id":"bd-rbxi","type":"parent-child","created_at":"2025-11-06T18:19:14.925961-08:00","created_by":"daemon"}]}
{"id":"bd-z3s3","title":"Create deployment scripts for GCP","description":"Automated provisioning scripts for GCP Compute Engine deployment.\n\nAcceptance Criteria:\n- Terraform/gcloud scripts\n- Static IP allocation\n- Firewall rules\n- NGINX reverse proxy config\n- TLS setup (Let's Encrypt)\n- Systemd service file\n\nFile: deployment/agent-mail/gcp/","status":"closed","priority":3,"issue_type":"task","created_at":"2025-11-07T22:43:43.294839-08:00","updated_at":"2025-12-14T00:32:11.049764-08:00","closed_at":"2025-12-13T23:30:58.727475-08:00","dependencies":[{"issue_id":"bd-z3s3","depends_on_id":"bd-9li4","type":"blocks","created_at":"2025-11-07T23:04:27.982336-08:00","created_by":"daemon"}]}
{"id":"bd-z0yn","title":"Channel isolation test - beads","notes":"Resetting stale in_progress status from old executor run (13 days old)","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-08T04:21:17.327983-08:00","updated_at":"2025-12-14T00:32:11.046547-08:00","closed_at":"2025-12-13T23:29:56.876192-08:00"}
{"id":"bd-l0pg","title":"GH#483: Pre-commit hook should not fail when .beads exists but bd sync fails","description":"Pre-commit hook exit 1 on bd sync --flush-only failure blocks commits even when user removed beads but .beads dir reappears. Should warn not fail. See: https://github.com/steveyegge/beads/issues/483","status":"in_progress","priority":2,"issue_type":"bug","created_at":"2025-12-14T16:32:22.759225-08:00","updated_at":"2025-12-16T01:05:56.14251-08:00"}
{"id":"bd-n25","title":"Speed up main_test.go - tests hang indefinitely due to nil rootCtx","description":"## Problem\n\nmain_test.go tests are hanging indefinitely, making them unusable and blocking development.\n\n## Root Cause\n\nTests that call flushToJSONL() or autoImportIfNewer() hang forever because:\n- rootCtx is nil in test environment (defined in cmd/bd/main.go:67)\n- flushToJSONL() uses rootCtx for DB operations (autoflush.go:503)\n- When rootCtx is nil, DB calls timeout/hang indefinitely\n\n## Affected Tests (10+)\n\n- TestAutoFlushOnExit\n- TestAutoFlushJSONLContent  \n- TestAutoFlushErrorHandling\n- TestAutoImportIfNewer\n- TestAutoImportDisabled\n- TestAutoImportWithUpdate\n- TestAutoImportNoUpdate\n- TestAutoImportMergeConflict\n- TestAutoImportConflictMarkerFalsePositive\n- TestAutoImportClosedAtInvariant\n\n## Proof\n\n```bash\n# Before fix: TestAutoFlushJSONLContent HANGS (killed after 2+ min)\n# After adding rootCtx init: Completes in 0.04s\n# Speedup: ∞ → 0.04s\n```\n\n## Solution\n\nSee MAIN_TEST_OPTIMIZATION_PLAN.md for complete fix plan.\n\n**Quick Fix (5 min)**: Add to each hanging test:\n```go\nctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)\ndefer cancel()\noldRootCtx := rootCtx\nrootCtx = ctx\ndefer func() { rootCtx = oldRootCtx }()\n```\n\n**Full Optimization (40 min total)**:\n1. Fix rootCtx (5 min) - unblocks tests\n2. Reduce sleep durations 10x (2 min) - saves ~280ms\n3. Use in-memory DBs (10 min) - saves ~1s\n4. Share test fixtures (15 min) - saves ~1.2s\n5. Fix skipped debounce test (5 min)\n\n## Expected Results\n\n- Tests go from hanging → \u003c5s total runtime\n- Keep critical integration test coverage\n- Tests caught real bugs: bd-270, bd-206, bd-160\n\n## Files\n\n- Analysis: MAIN_TEST_REFACTOR_NOTES.md\n- Solution: MAIN_TEST_OPTIMIZATION_PLAN.md\n- Tests: cmd/bd/main_test.go (18 tests, 1322 LOC)\n\n## Priority\n\nP1 - Blocking development, tests unusable in current state","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-21T18:27:48.942814-05:00","updated_at":"2025-11-21T18:44:21.944901-05:00","closed_at":"2025-11-21T18:44:21.944901-05:00"}
{"id":"bd-0e3","title":"Remove duplicate countIssuesInJSONLFile function","description":"init.go and doctor.go both defined countIssuesInJSONLFile. Removed the init.go version which is now unused. The doctor.go version (which calls countJSONLIssues) is the canonical implementation.","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-29T00:35:52.359237464-07:00","updated_at":"2025-11-29T00:36:18.03477857-07:00","closed_at":"2025-11-29T00:36:18.034782016-07:00","dependencies":[{"issue_id":"bd-0e3","depends_on_id":"bd-63l","type":"discovered-from","created_at":"2025-11-29T00:35:52.366221162-07:00","created_by":"matt"}]}
{"id":"bd-3bg","title":"Add performance optimization to hasJSONLChanged with mtime fast-path","description":"hasJSONLChanged() reads entire JSONL file to compute SHA256 hash on every check. For large databases (50MB+), this is expensive and called frequently by daemon.\n\nOptimization: Check mtime first as fast-path. Only compute hash if mtime changed. This catches git operations (mtime changes but content doesn't) while avoiding expensive hash computation in common case (mtime unchanged = content unchanged).\n\nPerformance impact: 99% of checks will use fast path, only git operations need slow path.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-20T21:31:04.577264-05:00","updated_at":"2025-11-20T21:33:31.499918-05:00","closed_at":"2025-11-20T21:33:31.499918-05:00","dependencies":[{"issue_id":"bd-3bg","depends_on_id":"bd-khnb","type":"blocks","created_at":"2025-11-20T21:31:04.578768-05:00","created_by":"daemon"}]}
{"id":"bd-kla1","title":"Add bd init --contributor wizard","description":"Interactive wizard for OSS contributor setup. Guides user through: fork workflow setup, separate planning repo configuration, auto-detection of fork relationships, examples of common OSS workflows.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-05T18:04:29.958409-08:00","updated_at":"2025-11-05T19:27:33.07529-08:00","closed_at":"2025-11-05T18:53:51.267625-08:00","dependencies":[{"issue_id":"bd-kla1","depends_on_id":"bd-8rd","type":"parent-child","created_at":"2025-11-05T18:04:39.120064-08:00","created_by":"daemon"}]}
{"id":"bd-ge7","title":"Improve Beads test coverage from 46% to 80%","status":"closed","priority":1,"issue_type":"epic","created_at":"2025-11-20T21:21:03.700271-05:00","updated_at":"2025-12-09T18:38:37.691262172-05:00","closed_at":"2025-11-28T21:56:04.085939-08:00"}
{"id":"bd-59er","title":"Add --lock-timeout global flag","description":"Add new global flag to control SQLite busy_timeout.\n\n## Implementation\n1. Add to cmd/bd/main.go:\n   - `lockTimeout time.Duration` global variable  \n   - Register flag: `--lock-timeout=\u003cduration\u003e` (default 30s)\n\n2. Add config support in internal/config/config.go:\n   - `v.SetDefault(\"lock-timeout\", \"30s\")`\n   - Read from config.yaml if not set via flag\n\n3. Pass timeout to sqlite.New() - see next task\n\n## Acceptance Criteria\n- `bd --lock-timeout=0 list` fails immediately if DB is locked\n- `bd --lock-timeout=100ms list` waits max 100ms\n- Config file setting works: `lock-timeout: 100ms`\n- Default remains 30s for backward compatibility\n\nPart of bd-olc1","status":"closed","priority":1,"issue_type":"task","created_at":"2025-12-13T17:54:36.277179-08:00","updated_at":"2025-12-13T18:05:19.367765-08:00","closed_at":"2025-12-13T18:05:19.367765-08:00"}
{"id":"bd-f0n","title":"Git history fallback missing timeout - could hang on large repos","description":"## Problem\n\nThe git commands in `checkGitHistoryForDeletions` have no timeout. On large repos with extensive history, `git log --all -S` or `git log --all -G` can take a very long time (minutes).\n\n## Location\n`internal/importer/importer.go:899` and `:930`\n\n## Impact\n- Import could hang indefinitely\n- User has no feedback that git search is running\n- No way to cancel except killing the process\n\n## Fix\nAdd context with timeout to git commands:\n\n```go\nctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)\ndefer cancel()\ncmd := exec.CommandContext(ctx, \"git\", ...)\n```\n\nAlso consider adding a `--since` flag to bound the git history search.","status":"closed","priority":2,"issue_type":"bug","created_at":"2025-11-25T12:48:24.388639-08:00","updated_at":"2025-11-25T15:04:53.669714-08:00","closed_at":"2025-11-25T15:04:53.669714-08:00"}
{"id":"bd-6cxz","title":"Fix MCP tools failing to load in Claude Code (GH#346)","description":"Fix FastMCP schema generation bug by refactoring `Issue` model to avoid recursion.\n    \n    - Refactored `Issue` in `models.py` to use `LinkedIssue` for dependencies/dependents.\n    - Restored missing `Mail*` models to `models.py`.\n    - Fixed `tests/test_mail.py` mock assertion.\n    \n    Fixes GH#346.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-20T18:53:40.229801-05:00","updated_at":"2025-11-20T18:53:44.280296-05:00","closed_at":"2025-11-20T18:53:44.280296-05:00"}
{"id":"bd-g9eu","title":"Investigate TestRoutingIntegration failure","description":"TestRoutingIntegration/maintainer_with_SSH_remote failed during pre-commit check with \"expected role maintainer, got contributor\".\nThis occurred while running `go test -short ./...` on darwin/arm64.\nThe failure appears unrelated to storage/sqlite changes.\nNeed to investigate if this is a flaky test or environmental issue.","status":"open","priority":2,"issue_type":"task","created_at":"2025-11-20T15:55:19.337094-08:00","updated_at":"2025-11-20T15:55:19.337094-08:00"}
{"id":"bd-u8j","title":"Clarify exclusive lock protocol compatibility with multi-repo","description":"The contributor-workflow-analysis.md proposes per-repo file locking (Decision #7) using flock on JSONL files. However, VC (a downstream library consumer) uses an exclusive lock protocol (vc-195, requires Beads v0.17.3+) that allows bd daemon and VC executor to coexist.\n\nNeed to clarify:\n- Does the proposed per-repo file locking work with VC's existing exclusive lock protocol?\n- Do library consumers like VC need to adapt their locking logic?\n- Can multiple repos be locked atomically for cross-repo operations?\n\nContext: contributor-workflow-analysis.md lines 662-681","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-03T20:24:08.257493-08:00","updated_at":"2025-11-05T14:15:01.506885-08:00","closed_at":"2025-11-05T14:15:01.506885-08:00"}
{"id":"bd-qs4p","title":"bd import fails on duplicate external_ref with no resolution options","description":"When JSONL contains duplicate external_ref values (e.g., two issues both have external_ref='BS-170'), bd import fails entirely with no resolution options.\n\nUser must manually edit JSONL to remove duplicates, which is error-prone.\n\nExample error:\n```\nbatch import contains duplicate external_ref values:\nexternal_ref 'BS-170' appears in issues: [opal-39 opal-43]\n```\n\nShould handle this similar to duplicate issue detection - offer to merge, pick one, or clear duplicates.","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-06T10:53:41.906165-08:00","updated_at":"2025-11-06T11:03:16.975041-08:00","closed_at":"2025-11-06T11:03:16.975041-08:00"}
{"id":"bd-bdhn","title":"bd message: Add input validation for --importance flag","description":"The --importance flag accepts any string without validation, leading to confusing server errors.\n\n**Location:** cmd/bd/message.go:256-258\n\n**Fix:**\n- Add flag validation for: low, normal, high, urgent\n- Add shell completion support\n- Validate in runMessageSend before sending\n\n**Impact:** Better UX, prevents confusing errors","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-08T12:54:26.43027-08:00","updated_at":"2025-11-08T12:57:59.65367-08:00","closed_at":"2025-11-08T12:57:59.65367-08:00","dependencies":[{"issue_id":"bd-bdhn","depends_on_id":"bd-6uix","type":"parent-child","created_at":"2025-11-08T12:55:54.910841-08:00","created_by":"daemon"}]}
{"id":"bd-c13f","title":"Add unit tests for parent resurrection","description":"Test resurrection with deleted parent (should succeed), resurrection with never-existed parent (should fail gracefully), multi-level resurrection (bd-abc.1.2 with both parents missing). Verify tombstone creation and is_tombstone flag.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-04T12:32:21.325335-08:00","updated_at":"2025-11-05T00:08:42.813728-08:00","closed_at":"2025-11-05T00:08:42.813731-08:00"}
{"id":"bd-710a4916","title":"CRDT-based architecture for guaranteed convergence (v2.0)","description":"## Vision\nRedesign beads around Conflict-Free Replicated Data Types (CRDTs) to provide mathematical guarantees for N-way collision resolution at arbitrary scale.\n\n## Current Limitations\n- Content-hash based collision resolution fails at 5+ clones\n- Non-deterministic convergence in multi-round scenarios\n- UNIQUE constraint violations during rename operations\n- No formal proof of convergence properties\n\n## CRDT Benefits\n- Provably convergent (Strong Eventual Consistency)\n- Commutative/Associative/Idempotent operations\n- No coordination required between clones\n- Scales to 100+ concurrent workers\n- Well-understood mathematical foundations\n\n## Proposed Architecture\n\n### 1. UUID-Based IDs\nReplace sequential IDs with UUIDs:\n- Current: bd-1c63eb84, bd-9063acda, bd-4d80b7b1\n- CRDT: bd-a1b2c3d4-e5f6-7890-abcd-ef1234567890\n- Human aliases maintained separately: #42 maps to UUID\n\n### 2. Last-Write-Wins (LWW) Elements\nEach field becomes an LWW register:\n- title: (timestamp, clone_id, value)\n- status: (timestamp, clone_id, value)\n- Deterministic conflict resolution via Lamport timestamp + clone_id tiebreaker\n\n### 3. Operation Log\nTrack all operations as CRDT ops:\n- CREATE(uuid, timestamp, clone_id, fields)\n- UPDATE(uuid, field, timestamp, clone_id, value)\n- DELETE(uuid, timestamp, clone_id) - tombstone, not hard delete\n\n### 4. Sync as Merge\nSyncing becomes merging two CRDT states:\n- No merge conflicts possible\n- Deterministic merge function\n- Guaranteed convergence\n\n## Implementation Phases\n\n### Phase 1: Research \u0026 Design (4 weeks)\n- Study existing CRDT implementations (Automerge, Yjs, Loro)\n- Design schema for CRDT-based issue tracking\n- Prototype LWW-based Issue CRDT\n- Benchmark performance vs current system\n\n### Phase 2: Parallel Implementation (6 weeks)\n- Implement CRDT storage layer alongside SQLite\n- Build conversion tools: SQLite ↔ CRDT\n- Maintain backward compatibility with v1.x format\n- Migration path for existing databases\n\n### Phase 3: Testing \u0026 Validation (4 weeks)\n- Formal verification of convergence properties\n- Stress testing with 100+ clone scenario\n- Performance profiling and optimization\n- Documentation and examples\n\n### Phase 4: Migration \u0026 Rollout (4 weeks)\n- Release v2.0-beta with CRDT backend\n- Gradual migration from v1.x\n- Monitoring and bug fixes\n- Final v2.0 release\n\n## Risks \u0026 Mitigations\n\n**Risk 1: Performance overhead**\n- Mitigation: Benchmark early, optimize hot paths\n- CRDTs can be slower than append-only logs\n- May need compaction strategy\n\n**Risk 2: Storage bloat**\n- Mitigation: Implement operation log compaction\n- Tombstone garbage collection for deleted issues\n- Periodic snapshots to reduce log size\n\n**Risk 3: Breaking changes**\n- Mitigation: Maintain v1.x compatibility layer\n- Gradual migration tools\n- Dual-mode operation during transition\n\n**Risk 4: Complexity**\n- Mitigation: Use battle-tested CRDT libraries\n- Comprehensive documentation\n- Clear migration guide\n\n## Success Criteria\n- 100-clone collision test passes without failures\n- Formal proof of convergence properties\n- Performance within 2x of current system\n- Zero manual conflict resolution required\n- Backward compatible with v1.x databases\n\n## Timeline\n18-20 weeks total (4-5 months)\n\n## References\n- Automerge: https://automerge.org\n- Yjs: https://docs.yjs.dev\n- Loro: https://loro.dev\n- CRDT theory: Shapiro et al, A comprehensive study of CRDTs\n- Related issues: bd-e6d71828, bd-7a2b58fc,-1","status":"closed","priority":3,"issue_type":"feature","created_at":"2025-10-29T10:23:57.978339-07:00","updated_at":"2025-12-14T12:12:46.52828-08:00","closed_at":"2025-11-08T00:54:51.171319-08:00"}
{"id":"bd-wmo","title":"PruneDeletions iterates map non-deterministically","description":"## Problem\n\n`PruneDeletions` iterates over `loadResult.Records` which is a map. Go maps iterate in random order, so:\n\n1. `result.PrunedIDs` order is non-deterministic\n2. `kept` slice order is non-deterministic → `WriteDeletions` output order varies\n\n## Location\n`internal/deletions/deletions.go:213`\n\n## Impact\n- Git diffs are noisy (file changes order on each prune)\n- Tests could be flaky if they depend on order\n- Harder to debug/audit\n\n## Fix\nSort by ID or timestamp before iterating:\n\n```go\n// Convert map to slice and sort\nvar records []DeletionRecord\nfor _, r := range loadResult.Records {\n    records = append(records, r)\n}\nsort.Slice(records, func(i, j int) bool {\n    return records[i].ID \u003c records[j].ID\n})\n```","status":"closed","priority":3,"issue_type":"bug","created_at":"2025-11-25T12:49:11.290916-08:00","updated_at":"2025-11-25T15:15:21.903649-08:00","closed_at":"2025-11-25T15:15:21.903649-08:00"}
{"id":"bd-0a43","title":"Split monolithic sqlite.go into focused files","description":"internal/storage/sqlite/sqlite.go is 1050 lines containing initialization, 20+ CRUD methods, query building, and schema management.\n\nSplit into:\n- store.go: Store struct \u0026 initialization (150 lines)\n- bead_queries.go: Bead CRUD (300 lines)\n- work_queries.go: Work queries (200 lines)  \n- stats_queries.go: Statistics (150 lines)\n- schema.go: Schema \u0026 migrations (150 lines)\n- helpers.go: Common utilities (100 lines)\n\nImpact: Impossible to understand at a glance; hard to find specific functionality; high cognitive load\n\nEffort: 6-8 hours","status":"open","issue_type":"task","created_at":"2025-11-16T14:51:16.520465-08:00","updated_at":"2025-11-16T14:51:16.520465-08:00"}
{"id":"bd-vw8","title":"Switch from deletions manifest to inline tombstones","description":"Replace the current deletions.jsonl manifest with inline tombstone records in issues.jsonl.\n\n## Problem Statement\n\nThe current deletions manifest approach has several issues:\n\n1. **Wild poisoning** - A stale clone's deletions manifest can poison fresh databases when synced\n2. **Two-level merge inconsistency** - Git content merge and beads snapshot merge use different bases\n3. **SyncJSONLToWorktree overwrites** - Blindly copies local JSONL to worktree, losing remote issues\n4. **3-day TTL too aggressive** - Deletions expire before dormant branches get merged\n\n## Proposed Solution: Inline Tombstones\n\nInstead of a separate deletions.jsonl file, embed deletion records directly in issues.jsonl:\n\n```json\n{\"id\":\"beads-abc\",\"status\":\"tombstone\",\"title\":\"Original title\",\"deleted_at\":\"2025-12-01T...\",\"deleted_by\":\"user\",\"expires_at\":\"2025-12-31T...\"}\n```\n\n### Benefits\n\n1. **Single source of truth** - No separate manifest to sync/merge\n2. **Participates in normal 3-way merge** - Deletion conflicts resolved same as other fields\n3. **Atomic with issue data** - Can't have orphaned deletions or missing tombstones\n4. **Preserves metadata** - Can optionally keep title/type for audit trail\n\n### Design Decisions Needed\n\n1. **TTL duration** - 30 days default? Configurable via config.yaml?\n2. **Tombstone content** - Minimal (just ID + timestamps) vs. full issue preservation?\n3. **Migration path** - How to handle existing deletions.jsonl files?\n4. **Status value** - Use \"tombstone\" or \"deleted\"? (tombstone clearer, deleted more intuitive)\n5. **Merge semantics** - Does tombstone always win, or use updated_at like other fields?\n\n### Migration Strategy\n\n1. On import, convert deletions.jsonl entries to tombstones in JSONL\n2. Deprecate but still read deletions.jsonl for backward compatibility\n3. Stop writing to deletions.jsonl after N versions\n\n## Related Issues\n\n- GitHub #464: Beads deletes issues (fresh clone sync problem)\n- bd-2e0: Add TTL to deletions manifest entries (current 3-day TTL)\n- bd-53c: bd sync corrupts issues.jsonl in multi-clone environments","status":"closed","priority":1,"issue_type":"epic","created_at":"2025-12-05T13:42:24.384792-08:00","updated_at":"2025-12-14T12:12:46.502955-08:00","closed_at":"2025-12-13T07:25:56.968329-08:00","dependencies":[{"issue_id":"bd-vw8","depends_on_id":"bd-1r5","type":"blocks","created_at":"2025-12-05T14:57:31.111259-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-2m7","type":"blocks","created_at":"2025-12-05T14:57:33.57722-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-dli","type":"blocks","created_at":"2025-12-05T14:57:34.902784-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-zvg","type":"blocks","created_at":"2025-12-05T14:57:36.665817-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-fbj","type":"blocks","created_at":"2025-12-05T15:14:59.081452-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-olt","type":"blocks","created_at":"2025-12-05T15:14:59.118268-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-0ih","type":"blocks","created_at":"2025-12-05T15:14:59.155689-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-3b4","type":"blocks","created_at":"2025-12-05T15:14:59.192575-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-dve","type":"blocks","created_at":"2025-12-05T15:14:59.227233-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-8f9","type":"blocks","created_at":"2025-12-05T15:14:59.262816-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-s3v","type":"blocks","created_at":"2025-12-05T15:14:59.299481-08:00","created_by":"daemon"},{"issue_id":"bd-vw8","depends_on_id":"bd-okh","type":"blocks","created_at":"2025-12-05T15:14:59.337656-08:00","created_by":"daemon"}]}
{"id":"bd-cb64c226.9","title":"Remove Cache-Related Tests","description":"Delete or update tests that assume multi-repo caching","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-27T22:55:44.511897-07:00","updated_at":"2025-12-16T01:00:43.240689-08:00","closed_at":"2025-10-28T14:08:38.065118-07:00"}
{"id":"bd-dli","title":"Design migration path from deletions.jsonl to tombstones","description":"Plan the migration from current deletions manifest to inline tombstones. Steps: 1) Read existing deletions.jsonl and convert to tombstones during import, 2) Continue reading deletions.jsonl for backward compat, 3) Stop writing to deletions.jsonl, 4) Eventually remove deletions.jsonl support. Consider version flags and deprecation warnings.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-12-05T13:43:26.856406-08:00","updated_at":"2025-12-05T15:02:58.521601-08:00","closed_at":"2025-12-05T15:02:58.521601-08:00"}
{"id":"bd-f8b764c9.3","title":"Test: N-clone scenario with hash IDs (no collisions)","description":"Comprehensive test to verify hash IDs eliminate collision problems.\n\n## Test: TestHashIDsNClones\n\n### Purpose\nVerify that N clones can work offline and sync without ID collisions using hash IDs.\n\n### Test Scenario\n```\nSetup:\n- 1 bare remote repo\n- 5 clones (A, B, C, D, E)\n\nOffline Work:\n- Each clone creates 10 issues with different titles\n- No coordination, no network access\n- Total: 50 unique issues\n\nSync:\n- Clones sync in random order\n- Each pull/import other clones' issues\n\nExpected Result:\n- All 5 clones converge to 50 issues\n- Zero ID collisions\n- Zero remapping needed\n- Alias conflicts resolved deterministically\n```\n\n### Implementation\nFile: cmd/bd/beads_hashid_test.go (new)\n\n```go\nfunc TestHashIDsFiveClones(t *testing.T) {\n    tmpDir := t.TempDir()\n    remoteDir := setupBareRepo(t, tmpDir)\n    \n    // Setup 5 clones\n    clones := make(map[string]string)\n    for _, name := range []string{\"A\", \"B\", \"C\", \"D\", \"E\"} {\n        clones[name] = setupClone(t, tmpDir, remoteDir, name)\n    }\n    \n    // Each clone creates 10 issues offline\n    for name, dir := range clones {\n        for i := 0; i \u003c 10; i++ {\n            createIssue(t, dir, fmt.Sprintf(\"%s-issue-%d\", name, i))\n        }\n        // No sync yet!\n    }\n    \n    // Sync in random order\n    syncOrder := []string{\"C\", \"A\", \"E\", \"B\", \"D\"}\n    for _, name := range syncOrder {\n        syncClone(t, clones[name], name)\n    }\n    \n    // Final convergence round\n    for _, name := range []string{\"A\", \"B\", \"C\", \"D\", \"E\"} {\n        finalPull(t, clones[name], name)\n    }\n    \n    // Verify all clones have all 50 issues\n    for name, dir := range clones {\n        issues := getIssues(t, dir)\n        if len(issues) != 50 {\n            t.Errorf(\"Clone %s: expected 50 issues, got %d\", name, len(issues))\n        }\n        \n        // Verify all issue IDs are hash-based\n        for _, issue := range issues {\n            if !strings.HasPrefix(issue.ID, \"bd-\") || len(issue.ID) != 11 {\n                t.Errorf(\"Invalid hash ID: %s\", issue.ID)\n            }\n        }\n    }\n    \n    // Verify no collision resolution occurred\n    // (This would be in logs if it happened)\n    \n    t.Log(\"✓ All 5 clones converged to 50 issues with zero collisions\")\n}\n```\n\n### Edge Case Tests\n\n#### Test: Hash Collision Detection (Artificial)\n```go\nfunc TestHashCollisionDetection(t *testing.T) {\n    // Artificially inject collision by mocking hash function\n    // Verify system detects and handles it\n}\n```\n\n#### Test: Alias Conflicts Resolved Deterministically\n```go\nfunc TestAliasConflictsNClones(t *testing.T) {\n    // Two clones assign same alias to different issues\n    // Verify deterministic resolution (content-hash ordering)\n    // Verify all clones converge to same alias assignments\n}\n```\n\n#### Test: Mixed Sequential and Hash IDs (Should Fail)\n```go\nfunc TestMixedIDsRejected(t *testing.T) {\n    // Try to import JSONL with sequential IDs into hash-ID database\n    // Verify error or warning\n}\n```\n\n### Performance Test\n\n#### Benchmark: Hash ID Generation\n```go\nfunc BenchmarkHashIDGeneration(b *testing.B) {\n    for i := 0; i \u003c b.N; i++ {\n        GenerateHashID(\"title\", \"description\", time.Now(), \"workspace-id\")\n    }\n}\n\n// Expected: \u003c 1μs per generation\n```\n\n#### Benchmark: N-Clone Convergence Time\n```go\nfunc BenchmarkNCloneConvergence(b *testing.B) {\n    for _, n := range []int{3, 5, 10, 20} {\n        b.Run(fmt.Sprintf(\"N=%d\", n), func(b *testing.B) {\n            // Measure total convergence time\n        })\n    }\n}\n\n// Expected: Linear scaling O(N)\n```\n\n### Acceptance Criteria\n- TestHashIDsFiveClones passes reliably (10/10 runs)\n- Zero ID collisions in any scenario\n- All clones converge in single round (not multi-round like old system)\n- Alias conflicts resolved deterministically\n- Performance benchmarks meet targets (\u003c1μs hash gen)\n\n## Files to Create\n- cmd/bd/beads_hashid_test.go\n\n## Comparison to Old System\nThis test replaces:\n- TestTwoCloneCollision (bd-71107098) - no longer needed\n- TestThreeCloneCollision (bd-cbed9619) - no longer needed\n- TestFiveCloneCollision (bd-a40f374f) - no longer needed\n\nOld system required complex collision resolution and multi-round convergence.\nNew system: single-round convergence with zero collisions.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-29T21:27:26.954107-07:00","updated_at":"2025-10-31T12:32:32.608225-07:00","closed_at":"2025-10-31T12:32:32.608225-07:00","dependencies":[{"issue_id":"bd-f8b764c9.3","depends_on_id":"bd-f8b764c9","type":"parent-child","created_at":"2025-10-29T21:27:26.955522-07:00","created_by":"stevey"},{"issue_id":"bd-f8b764c9.3","depends_on_id":"bd-f8b764c9.5","type":"blocks","created_at":"2025-10-29T21:27:26.956175-07:00","created_by":"stevey"}]}
{"id":"bd-8an","title":"bd import auto-detects wrong prefix from directory name instead of issue IDs","description":"When importing issues.jsonl into a fresh database, 'bd import' prints:\n\n  ✓ Initialized database with prefix 'beads' (detected from issues)\n\nBut the issues all have prefix 'bd-' (e.g., bd-03r). It appears to be detecting the prefix from the directory name (.beads/) rather than from the actual issue IDs in the JSONL.\n\nThis causes import to fail with:\n  validate ID prefix for bd-03r: issue ID 'bd-03r' does not match configured prefix 'beads'\n\nWorkaround: Run 'bd config set issue_prefix bd' before import, or use 'bd init --prefix bd'.","status":"closed","priority":2,"issue_type":"bug","created_at":"2025-11-26T22:28:01.582564-08:00","updated_at":"2025-12-02T17:11:19.734136748-05:00","closed_at":"2025-11-27T22:38:48.971617-08:00"}
{"id":"bd-c9a482db","title":"Add internal/ai package for AI-assisted repairs","description":"Add AI integration package to support AI-powered repair commands.\n\nProviders:\n- Anthropic (Claude)\n- OpenAI\n- Ollama (local)\n\nFeatures:\n- Conflict resolution analysis\n- Duplicate detection via embeddings\n- Configuration via env vars (BEADS_AI_PROVIDER, BEADS_AI_API_KEY, etc.)\n\nSee repair_commands.md lines 357-425 for design.","status":"closed","priority":2,"issue_type":"task","created_at":"2025-10-28T19:37:55.722841-07:00","updated_at":"2025-12-14T12:12:46.503526-08:00","closed_at":"2025-11-06T19:27:19.150657-08:00"}
{"id":"bd-8nz","title":"Merge timestamp tie-breaker should prefer local (left)","description":"In mergeFieldByUpdatedAt, when timestamps are exactly equal, right wins. For consistency with IssueType (where local/left wins), equal timestamps should prefer left. Minor inconsistency.","status":"closed","priority":4,"issue_type":"task","created_at":"2025-12-02T20:14:59.898345-08:00","updated_at":"2025-12-13T08:15:21.91226+11:00","closed_at":"2025-12-03T22:18:17.242011-08:00"}
{"id":"bd-alz","title":"bd doctor: add configuration value validation","description":"Currently bd doctor checks for missing config files but doesn't validate config values. Add validation for: invalid priority values, malformed sync intervals, invalid branch names, unsupported storage backends, etc. This would catch misconfigurations before they cause runtime errors.","status":"closed","priority":3,"issue_type":"feature","created_at":"2025-12-02T12:52:31.852532-08:00","updated_at":"2025-12-07T01:24:31.62945-08:00","closed_at":"2025-12-07T01:24:31.62945-08:00"}
{"id":"bd-51jl","title":"Feature P1","status":"closed","priority":1,"issue_type":"feature","created_at":"2025-11-07T19:04:24.852171-08:00","updated_at":"2025-11-07T22:07:17.343481-08:00","closed_at":"2025-11-07T21:55:09.426728-08:00"}
{"id":"bd-9f20","title":"DetectCycles SQL query has bug preventing cycle detection","description":"The DetectCycles function's SQL query has a bug in the LIKE filter that prevents it from detecting cycles.\n\nCurrent code (line 571):\n```sql\nAND p.path NOT LIKE '%' || d.depends_on_id || '→%'\n```\n\nThis prevents ANY revisit to nodes, including returning to the start node to complete a cycle.\n\nFix:\n```sql\nAND (d.depends_on_id = p.start_id OR p.path NOT LIKE '%' || d.depends_on_id || '→%')\n```\n\nThis allows revisiting the start node (to detect the cycle) while still preventing intermediate node revisits.\n\nImpact: Currently DetectCycles cannot detect any cycles, but this hasn't been noticed because AddDependency prevents cycles from being created. The function would only matter if cycles were manually inserted into the database.","status":"closed","priority":3,"issue_type":"bug","created_at":"2025-11-01T22:50:32.552763-07:00","updated_at":"2025-11-01T22:52:02.247443-07:00","closed_at":"2025-11-01T22:52:02.247443-07:00"}
{"id":"bd-l7u","title":"Duplicate DefaultRetentionDays constants","description":"## Problem\n\nThere are now two constants for the same value:\n\n1. `deletions.DefaultRetentionDays = 7` in `internal/deletions/deletions.go:184`\n2. `configfile.DefaultDeletionsRetentionDays = 7` in `internal/configfile/configfile.go:102`\n\n## Impact\n- DRY violation\n- Risk of values getting out of sync\n- Confusing which one to use\n\n## Fix\nRemove the constant from `deletions` package and have it import from `configfile`, or create a shared constants package.","status":"closed","priority":3,"issue_type":"task","created_at":"2025-11-25T12:49:38.356211-08:00","updated_at":"2025-11-25T15:15:21.964842-08:00","closed_at":"2025-11-25T15:15:21.964842-08:00"}
{"id":"bd-f8b764c9.13","title":"Add bd alias command for manual alias control","description":"Add command for users to manually view and reassign aliases.\n\n## Command: bd alias\n\n### Subcommands\n\n#### 1. bd alias list\nShow all alias mappings:\n```bash\n$ bd alias list\n#1    → bd-af78e9a2  Fix authentication bug\n#2    → bd-e5f6a7b8  Add logging to daemon\n#42   → bd-1a2b3c4d  Investigate jujutsu integration\n#100  → bd-9a8b7c6d  (reassigned after conflict)\n```\n\n#### 2. bd alias set \u003calias\u003e \u003chash-id\u003e\nManually assign alias to specific issue:\n```bash\n$ bd alias set 42 bd-1a2b3c4d\n✓ Assigned alias #42 to bd-1a2b3c4d\n\n$ bd alias set 1 bd-af78e9a2\n✗ Error: Alias #1 already assigned to bd-e5f6a7b8\nUse --force to override\n```\n\n#### 3. bd alias compact\nRenumber all aliases to fill gaps:\n```bash\n$ bd alias compact [--dry-run]\n\nCurrent aliases: #1, #2, #5, #7, #100, #101\nAfter compacting: #1, #2, #3, #4, #5, #6\n\nRenumbering:\n  #5   → #3\n  #7   → #4\n  #100 → #5\n  #101 → #6\n\nApply changes? [y/N]\n```\n\n#### 4. bd alias reset\nRegenerate all aliases (sequential from 1):\n```bash\n$ bd alias reset [--sort-by=priority|created|id]\n\nWARNING: This will reassign ALL aliases. Continue? [y/N]\n\nReassigning 150 issues by priority:\n  bd-a1b2c3d4 → #1   (P0: Critical security bug)\n  bd-e5f6a7b8 → #2   (P0: Data loss fix)\n  bd-1a2b3c4d → #3   (P1: Jujutsu integration)\n  ...\n```\n\n#### 5. bd alias find \u003chash-id\u003e\nLook up alias for hash ID:\n```bash\n$ bd alias find bd-af78e9a2\n#1\n\n$ bd alias find bd-nonexistent\n✗ Error: Issue not found\n```\n\n## Use Cases\n\n### 1. Keep Important Issues Low-Numbered\n```bash\n# After closing many P0 issues, compact to free low numbers\nbd alias compact\n\n# Or manually set\nbd alias set 1 bd-\u003ccritical-bug-hash\u003e\n```\n\n### 2. Consistent Aliases Across Clones\n```bash\n# After migration, coordinator assigns canonical aliases\nbd alias reset --sort-by=id\ngit add .beads/aliases.jsonl\ngit commit -m \"Canonical alias assignments\"\ngit push\n\n# Other clones pull and adopt\ngit pull\nbd import  # Alias conflicts resolved automatically\n```\n\n### 3. Debug Alias Conflicts\n```bash\n# See which aliases were reassigned\nbd alias list | grep \"#100\"\n```\n\n## Flags\n\n### Global\n- `--dry-run`: Preview changes without applying\n- `--force`: Override existing alias assignments\n\n### bd alias reset\n- `--sort-by=priority`: Assign by priority (P0 first)\n- `--sort-by=created`: Assign by creation time (oldest first)\n- `--sort-by=id`: Assign by hash ID (lexicographic)\n\n## Implementation\n\nFile: cmd/bd/alias.go\n```go\nfunc aliasListCmd() *cobra.Command {\n    return \u0026cobra.Command{\n        Use:   \"list\",\n        Short: \"List all alias mappings\",\n        Run: func(cmd *cobra.Command, args []string) {\n            aliases := storage.GetAllAliases()\n            for _, a := range aliases {\n                fmt.Printf(\"#%-4d → %s  %s\\n\", \n                    a.Alias, a.IssueID, a.Title)\n            }\n        },\n    }\n}\n\nfunc aliasSetCmd() *cobra.Command {\n    return \u0026cobra.Command{\n        Use:   \"set \u003calias\u003e \u003chash-id\u003e\",\n        Short: \"Manually assign alias to issue\",\n        Args:  cobra.ExactArgs(2),\n        Run: func(cmd *cobra.Command, args []string) {\n            alias, _ := strconv.Atoi(args[0])\n            hashID := args[1]\n            \n            force, _ := cmd.Flags().GetBool(\"force\")\n            if err := storage.SetAlias(alias, hashID, force); err != nil {\n                fmt.Fprintf(os.Stderr, \"Error: %v\\n\", err)\n                os.Exit(1)\n            }\n            fmt.Printf(\"✓ Assigned alias #%d to %s\\n\", alias, hashID)\n        },\n    }\n}\n```\n\n## Files to Create\n- cmd/bd/alias.go\n\n## Testing\n- Test alias list output\n- Test alias set with/without force\n- Test alias compact removes gaps\n- Test alias reset with different sort orders\n- Test alias find lookup","status":"closed","priority":2,"issue_type":"task","created_at":"2025-10-29T21:26:53.751795-07:00","updated_at":"2025-10-31T12:32:32.611358-07:00","closed_at":"2025-10-31T12:32:32.611358-07:00","dependencies":[{"issue_id":"bd-f8b764c9.13","depends_on_id":"bd-f8b764c9","type":"parent-child","created_at":"2025-10-29T21:26:53.753259-07:00","created_by":"stevey"},{"issue_id":"bd-f8b764c9.13","depends_on_id":"bd-f8b764c9.7","type":"blocks","created_at":"2025-10-29T21:26:53.753733-07:00","created_by":"stevey"},{"issue_id":"bd-f8b764c9.13","depends_on_id":"bd-f8b764c9.6","type":"blocks","created_at":"2025-10-29T21:26:53.754112-07:00","created_by":"stevey"}]}
{"id":"bd-17d5","title":"bd sync false positive: conflict detection triggers on JSON-encoded angle brackets in issue content","description":"The bd sync --import-only command incorrectly detects conflict markers when issue descriptions contain the text '\u003c\u003c\u003c\u003c\u003c\u003c\u003c' or '\u003e\u003e\u003e\u003e\u003e\u003e\u003e' as legitimate content (e.g., documentation about git conflict markers).\n\n**Reproduction:**\n1. Create issue with design field containing: 'Read file, extract \u003c\u003c\u003c\u003c\u003c\u003c\u003c / ======= / \u003e\u003e\u003e\u003e\u003e\u003e\u003e markers'\n2. Export to JSONL (gets JSON-encoded as \\u003c\\u003c\\u003c...)\n3. Commit and push\n4. Pull from remote\n5. bd sync --import-only fails with: 'Git conflict markers detected in JSONL file'\n\n**Root cause:**\nThe conflict detection appears to decode JSON before checking for conflict markers, causing false positives when issue content legitimately contains these strings.\n\n**Expected behavior:**\nConflict detection should only trigger on actual git conflict markers (literal '\u003c\u003c\u003c\u003c\u003c\u003c\u003c' bytes in the raw file), not on JSON-encoded content within issue fields.\n\n**Test case:**\nVC project at ~/src/dave/vc has vc-85 'JSONL Conflict Parser' which documents conflict parsing and triggers this bug.\n\n**Suggested fixes:**\n1. Only scan for literal '\u003c\u003c\u003c\u003c\u003c\u003c\u003c' bytes (not decoded JSON content)\n2. Parse JSONL first and only flag unparseable lines\n3. Check git merge state (git status) to confirm actual conflict\n4. Add --skip-conflict-check flag for override","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-08T13:02:54.730745-08:00","updated_at":"2025-11-08T13:07:37.108225-08:00","closed_at":"2025-11-08T13:07:37.108225-08:00"}
{"id":"bd-tuqd","title":"bd init overwrites existing git hooks without detection or chaining","description":"GH #254: bd init silently overwrites existing git hooks (like pre-commit framework) without detecting them, backing them up, or offering to chain. This breaks workflows and can result in committed code with failing tests.\n\nFix: Detect existing hooks, prompt user with options to chain/overwrite/skip.","status":"closed","issue_type":"bug","created_at":"2025-11-07T15:51:17.582882-08:00","updated_at":"2025-11-07T15:55:01.330531-08:00","closed_at":"2025-11-07T15:55:01.330531-08:00"}
{"id":"bd-20j","title":"sync branch not match config","description":"./bd sync\n→ Exporting pending changes to JSONL...\n→ No changes to commit\n→ Pulling from sync branch 'gh-386'...\nError pulling from sync branch: failed to create worktree: failed to create worktree parent directory: mkdir /var/home/matt/dev/beads/worktree-db-fail/.git: not a directory\nmatt@blufin-framation ~/d/b/worktree-db-fail (worktree-db-fail) [1]\u003e bd config list\n\nConfiguration:\n  auto_compact_enabled = false\n  compact_batch_size = 50\n  compact_model = claude-3-5-haiku-20241022\n  compact_parallel_workers = 5\n  compact_tier1_days = 30\n  compact_tier1_dep_levels = 2\n  compact_tier2_commits = 100\n  compact_tier2_days = 90\n  compact_tier2_dep_levels = 5\n  compaction_enabled = false\n  issue_prefix = worktree-db-fail\n  sync.branch = worktree-db-fail","status":"open","priority":2,"issue_type":"task","created_at":"2025-12-08T06:49:04.449094018-07:00","updated_at":"2025-12-08T06:49:04.449094018-07:00"}
{"id":"bd-nq41","title":"Fix Homebrew warning about Ruby file location","description":"Homebrew warning: Found Ruby file outside steveyegge/beads tap formula directory.\nWarning points to: /opt/homebrew/Library/Taps/steveyegge/homebrew-beads/bd.rb\nIt should likely be inside a Formula/ directory or similar structure expected by Homebrew taps.\n","status":"closed","priority":2,"issue_type":"chore","created_at":"2025-11-20T18:56:21.226579-05:00","updated_at":"2025-12-09T18:38:37.701783372-05:00","closed_at":"2025-11-26T22:25:37.362928-08:00"}
{"id":"bd-e3w","title":"bd sync: use worktree for sync.branch commits (non-daemon mode)","description":"## Summary\n\nWhen `sync.branch` is configured (e.g., `beads-sync`), `bd sync` should commit beads changes to that branch via git worktree, even when the user's working directory is on a different branch (e.g., `main`).\n\nCurrently:\n- `bd sync` always commits to the current branch\n- Daemon with `--auto-commit` uses worktrees to commit to sync branch\n- Gap: `bd sync` ignores sync.branch config\n\n## Goal\n\nWorkers stay on `main` (or feature branches) while beads metadata automatically flows to `beads-sync` branch. No daemon required.\n\n## Design Considerations\n\n1. **Worktree lifecycle**: Create on first use, reuse thereafter\n2. **Daemon interaction**: Ensure daemon and bd sync don't conflict\n3. **MCP server**: Uses daemon or direct mode - needs same behavior\n4. **Pull semantics**: Pull from sync branch, not current branch\n5. **Push semantics**: Push to sync branch remote\n6. **Error handling**: Worktree corruption, missing branch, etc.\n\n## Affected Components\n\n- `cmd/bd/sync.go` - Main changes\n- `cmd/bd/daemon_sync_branch.go` - Reuse existing functions\n- `internal/git/worktree.go` - Already implemented\n- MCP server (if it bypasses daemon)\n\n## Edge Cases\n\n- Fresh clone (no sync branch exists yet)\n- Worktree exists but is corrupted\n- Concurrent bd sync from multiple processes\n- sync.branch configured but remote doesn't have that branch\n- User switches sync.branch config mid-session","status":"closed","priority":1,"issue_type":"feature","created_at":"2025-11-30T00:31:20.026356-08:00","updated_at":"2025-12-07T21:25:07.141293+11:00","closed_at":"2025-11-30T00:41:35.335791-08:00"}
{"id":"bd-9cdc","title":"Update docs for import bug fix","description":"Update AGENTS.md, README.md, TROUBLESHOOTING.md with import.orphan_handling config documentation. Document resurrection behavior, tombstones, config modes. Add troubleshooting section for import failures with deleted parents.","status":"open","priority":2,"issue_type":"task","created_at":"2025-11-04T12:32:30.770415-08:00","updated_at":"2025-11-04T12:32:30.770415-08:00"}
{"id":"bd-tru","title":"Update documentation for bd prime and Claude integration","description":"Update AGENTS.md, README.md, and QUICKSTART.md to document the new `bd prime` command, `bd setup claude` command, and tip system.","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-11T23:30:22.77349-08:00","updated_at":"2025-12-09T18:38:37.706700072-05:00","closed_at":"2025-11-25T17:47:30.807069-08:00","dependencies":[{"issue_id":"bd-tru","depends_on_id":"bd-rpn","type":"blocks","created_at":"2025-11-11T23:30:22.774216-08:00","created_by":"daemon"},{"issue_id":"bd-tru","depends_on_id":"bd-br8","type":"blocks","created_at":"2025-11-11T23:30:22.774622-08:00","created_by":"daemon"},{"issue_id":"bd-tru","depends_on_id":"bd-90v","type":"parent-child","created_at":"2025-11-11T23:31:35.277819-08:00","created_by":"daemon"}]}
{"id":"bd-dcd6f14b","title":"Batch test 4","status":"closed","priority":2,"issue_type":"task","created_at":"2025-10-29T15:29:02.053523-07:00","updated_at":"2025-10-31T12:00:43.182861-07:00","closed_at":"2025-10-31T12:00:43.182861-07:00"}
{"id":"bd-7c831c51","title":"Run final validation and cleanup checks","description":"Final validation pass to ensure all cleanup objectives met and no regressions introduced.\n\nValidation checklist:\n1. Dead code verification: `go run golang.org/x/tools/cmd/deadcode@latest -test ./...`\n2. Test coverage: `go test -cover ./...`\n3. Build verification: `go build ./cmd/bd/`\n4. Linting: `golangci-lint run`\n5. Integration tests\n6. Metrics verification\n7. Git clean check\n\nFinal metrics to report:\n- LOC removed: ~____\n- Files deleted: ____\n- Files created: ____\n- Test coverage: ____%\n- Build time: ____ (before/after)\n- Test run time: ____ (before/after)\n\nImpact: Confirms all cleanup objectives achieved successfully","notes":"## Validation Results\n\n**Dead Code:** ✅ Found and removed 1 unreachable function (`DroppedEventsCount`)  \n**Tests:** ✅ All pass  \n**Coverage:**  \n- Main: 39.6%\n- cmd/bd: 20.2%\n- Created follow-up issues (bd-85487065 through bd-bc2c6191) to improve coverage\n  \n**Build:** ✅ Clean  \n**Linting:** 73 issues (up from 34 baseline)  \n- Increase due to unused functions from refactoring\n- Need cleanup in separate issue\n  \n**Integration Tests:** ✅ All pass  \n**Metrics:** 56,464 LOC across 193 Go files  \n**Git:** 2 files modified (deadcode fix + auto-synced JSONL)\n\n## Follow-up Issues Created\n- bd-85487065: Add tests for internal/autoimport (0% coverage)\n- bd-0dcea000: Add tests for internal/importer (0% coverage)\n- bd-4d7fca8a: Add tests for internal/utils (0% coverage)\n- bd-6221bdcd: Improve cmd/bd coverage (20.2% -\u003e target higher)\n- bd-bc2c6191: Improve internal/daemon coverage (22.5% -\u003e target higher)","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-29T20:02:47.956276-07:00","updated_at":"2025-10-30T17:12:58.193468-07:00","closed_at":"2025-10-29T14:19:35.095553-07:00"}
{"id":"bd-8g8","title":"Fix G304 potential file inclusion in cmd/bd/tips.go:259","description":"Linting issue: G304: Potential file inclusion via variable (gosec) at cmd/bd/tips.go:259:18. Error: if data, err := os.ReadFile(settingsPath); err == nil {","status":"open","issue_type":"bug","created_at":"2025-12-07T15:34:57.189730843-07:00","updated_at":"2025-12-07T15:34:57.189730843-07:00"}
{"id":"bd-4ms","title":"Multi-repo contributor workflow support","description":"Implement separate repository support for OSS contributors to prevent PR pollution while maintaining git ledger and multi-clone sync. Based on contributor-workflow-analysis.md Solution #4.","status":"closed","priority":1,"issue_type":"epic","created_at":"2025-11-04T11:21:19.515776-08:00","updated_at":"2025-11-05T00:08:42.812659-08:00","closed_at":"2025-11-05T00:08:42.812662-08:00"}
{"id":"bd-ola6","title":"Implement transaction retry logic for SQLITE_BUSY","description":"BEGIN IMMEDIATE fails immediately on SQLITE_BUSY instead of retrying with exponential backoff.\n\nLocation: internal/storage/sqlite/sqlite.go:223-225\n\nProblem:\n- Under concurrent write load, BEGIN IMMEDIATE can fail with SQLITE_BUSY\n- Current implementation fails immediately instead of retrying\n- Results in spurious failures under normal concurrent usage\n\nSolution: Implement exponential backoff retry:\n- Retry up to N times (e.g., 5)\n- Backoff: 10ms, 20ms, 40ms, 80ms, 160ms\n- Check for context cancellation between retries\n- Only retry on SQLITE_BUSY/database locked errors\n\nImpact: Spurious failures under concurrent write load\n\nEffort: 3 hours","status":"open","priority":1,"issue_type":"feature","created_at":"2025-11-16T14:51:31.247147-08:00","updated_at":"2025-11-16T14:51:31.247147-08:00"}
{"id":"bd-fb95094c.3","title":"Update documentation after code health cleanup","description":"Update all documentation to reflect code structure changes after cleanup phases complete.\n\nDocumentation to update:\n1. **AGENTS.md** - Update file structure references\n2. **CONTRIBUTING.md** (if exists) - Update build/test instructions\n3. **Code comments** - Update any outdated references\n4. **Package documentation** - Update godoc for reorganized packages\n\nNew documentation to add:\n1. **internal/util/README.md** - Document shared utilities\n2. **internal/debug/README.md** - Document debug logging\n3. **internal/rpc/README.md** - Document new file organization\n4. **internal/storage/sqlite/migrations/README.md** - Migration system docs\n\nImpact: Keeps documentation in sync with code","status":"closed","priority":2,"issue_type":"task","created_at":"2025-10-27T20:32:00.141028-07:00","updated_at":"2025-12-14T12:12:46.504215-08:00","closed_at":"2025-11-08T18:15:48.644285-08:00","dependencies":[{"issue_id":"bd-fb95094c.3","depends_on_id":"bd-fb95094c","type":"parent-child","created_at":"2025-10-27T20:32:00.1423-07:00","created_by":"daemon"}]}
{"id":"bd-azqv","title":"Ready issue","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-07T19:04:22.247039-08:00","updated_at":"2025-11-07T22:07:17.344986-08:00","closed_at":"2025-11-07T21:55:09.429024-08:00"}
{"id":"bd-bxha","title":"Default to YES for git hooks and merge driver installation","description":"Currently bd init prompts user to install git hooks and merge driver, but setup is incomplete if user declines. Change to install by default unless --skip-hooks or --skip-merge-driver flags are passed. Better safe defaults. If installation fails, warn user and suggest bd doctor --fix.","status":"open","priority":1,"issue_type":"feature","created_at":"2025-11-21T23:16:10.172238-08:00","updated_at":"2025-11-21T23:16:28.369137-08:00","dependencies":[{"issue_id":"bd-bxha","depends_on_id":"bd-tbz3","type":"parent-child","created_at":"2025-11-21T23:16:10.173034-08:00","created_by":"daemon"}]}
{"id":"bd-hv01","title":"Deletions not propagated across multi-workspace sync","description":"## Problem\n\nWhen working with multiple beads workspaces (clones) sharing the same git remote, deleted issues keep coming back.\n\n## Reproduction\n\n1. Clone A deletes issue `bd-xyz` via `bd delete bd-xyz --force`\n2. Clone A daemon syncs and pushes to GitHub\n3. Clone B still has `bd-xyz` in its database\n4. Clone B daemon exports and pushes its JSONL\n5. Clone A pulls and imports → `bd-xyz` comes back!\n\n## Root Cause\n\n**No deletion tracking mechanism.** The system has no way to distinguish between:\n- \"Issue doesn't exist in JSONL because it was deleted\" \n- \"Issue doesn't exist in JSONL because the export is stale\"\n\nImport treats missing issues as \"not in this export\" rather than \"explicitly deleted.\"\n\n## Solution Options\n\n1. **Tombstone records** - Keep deleted issues in JSONL with `\"status\":\"deleted\"` or `\"deleted_at\"` field\n2. **Deletion log** - Separate `.beads/deletions.jsonl` file tracking all deleted IDs\n3. **Three-way merge** - Import compares: DB state, old JSONL, new JSONL\n4. **Manual conflict resolution** - Detect resurrection and prompt user\n\n## Related\n\n- Similar to resurrection logic for orphaned children (bd-cc4f)\n- beads-merge tool handles this better with 3-way merge","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-05T18:34:24.094474-08:00","updated_at":"2025-11-06T18:19:16.233949-08:00","closed_at":"2025-11-06T17:52:24.860716-08:00","dependencies":[{"issue_id":"bd-hv01","depends_on_id":"bd-qqvw","type":"blocks","created_at":"2025-11-05T18:42:35.485002-08:00","created_by":"daemon"}]}
{"id":"bd-fasa","title":"Prefix detection treats embedded hyphens as prefix delimiters","description":"The prefix detection logic in bd import incorrectly identifies issues like 'vc-baseline-test' and 'vc-92cl-gate-test' as having different prefixes ('vc-baseline-' and 'vc-92cl-gate-') instead of recognizing them as having the standard 'vc-' prefix with hyphenated suffixes.\n\nThis breaks import with error: 'prefix mismatch detected: database uses vc- but found issues with prefixes: [vc-92cl-gate- (1 issues) vc-baseline- (1 issues)]'\n\nThe prefix should be determined by the pattern: prefix is everything up to and including the first hyphen. The suffix can contain hyphens without being treated as part of the prefix.\n\nExample problematic IDs:\n- vc-baseline-test (detected as prefix: vc-baseline-)\n- vc-92cl-gate-test (detected as prefix: vc-92cl-gate-)\n- vc-test (correctly detected as prefix: vc-)\n\nImpact: Users cannot use descriptive multi-part IDs without triggering false prefix mismatch errors.","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-09T14:27:19.046489-08:00","updated_at":"2025-11-09T14:53:53.22312-08:00","closed_at":"2025-11-09T14:53:53.22312-08:00"}
{"id":"bd-ar2.3","title":"Fix TestExportUpdatesMetadata to test actual daemon functions","description":"## Problem\nTestExportUpdatesMetadata (daemon_sync_test.go:296) manually replicates the metadata update logic rather than calling the fixed functions (createExportFunc/createSyncFunc).\n\nThis means:\n- Test verifies the CONCEPT works\n- But doesn't verify the IMPLEMENTATION in the actual daemon functions\n- If daemon code is wrong, test still passes\n\n## Current Test Flow\n```go\n// Test does:\nexportToJSONLWithStore()  // ← Direct call\n// ... manual metadata update ...\nexportToJSONLWithStore()  // ← Direct call again\n```\n\n## Should Be\n```go\n// Test should:\ncreateExportFunc(...)()  // ← Call actual daemon function\n// ... verify metadata was updated by the function ...\ncreateExportFunc(...)()  // ← Call again, should not fail\n```\n\n## Challenge\ncreateExportFunc returns a closure that's run by the daemon. Testing this requires:\n- Mock logger\n- Proper context setup\n- Git operations might need mocking\n\n## Files\n- cmd/bd/daemon_sync_test.go\n\n## Acceptance Criteria\n- Test calls actual createExportFunc and createSyncFunc\n- Test verifies metadata updated by daemon code, not test code\n- Both functions tested (export and sync)","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-21T10:24:46.756315-05:00","updated_at":"2025-11-22T14:57:44.504497625-05:00","closed_at":"2025-11-21T11:07:25.321289-05:00","dependencies":[{"issue_id":"bd-ar2.3","depends_on_id":"bd-ar2","type":"parent-child","created_at":"2025-11-21T10:24:46.757622-05:00","created_by":"daemon"}]}
{"id":"bd-7a00c94e","title":"Rapid 2","status":"closed","priority":3,"issue_type":"task","created_at":"2025-10-29T19:11:57.430725-07:00","updated_at":"2025-12-14T12:12:46.53405-08:00","closed_at":"2025-11-07T23:18:52.352188-08:00"}
{"id":"bd-aydr","title":"Add bd reset command for clean slate restart","description":"Implement a `bd reset` command to reset beads to a clean starting state.\n\n## Context\nGitHub issue #479 - users sometimes get beads into an invalid state after updates, and there's no clean way to start fresh. The git backup/restore mechanism that protects against accidental deletion also makes it hard to intentionally reset.\n\n## Design\n\n### Command Interface\n```\nbd reset [--hard] [--force] [--backup] [--dry-run] [--no-init]\n```\n\n| Flag | Effect |\n|------|--------|\n| `--hard` | Also remove from git index and commit |\n| `--force` | Skip confirmation prompt |\n| `--backup` | Create `.beads-backup-{timestamp}/` first |\n| `--dry-run` | Preview what would happen |\n| `--no-init` | Don't re-initialize after clearing |\n\n### Reset Levels\n1. **Soft Reset (default)** - Kill daemons, clear .beads/, re-init. Git history unchanged.\n2. **Hard Reset (`--hard`)** - Also git rm and commit the removal, then commit fresh state.\n\n### Implementation Flow\n1. Validate .beads/ exists\n2. If not --force: show impact summary, prompt confirmation\n3. If --backup: copy .beads/ to .beads-backup-{timestamp}/\n4. Kill daemons\n5. If --hard: git rm + commit\n6. rm -rf .beads/*\n7. If not --no-init: bd init (and git add+commit if --hard)\n8. Print summary\n\n### Safety Mechanisms\n- Confirmation prompt (skip with --force)\n- Impact summary (issue/tombstone counts)\n- Backup option\n- Dry-run preview\n- Git dirty check warning\n\n### Code Structure\n- `cmd/bd/reset.go` - CLI command\n- `internal/reset/` - Core logic package","status":"closed","priority":2,"issue_type":"epic","created_at":"2025-12-13T08:44:01.38379+11:00","updated_at":"2025-12-14T11:59:26.763667-08:00","closed_at":"2025-12-13T10:18:19.965287+11:00"}
{"id":"bd-kazt","title":"Add tests for 3-way merge scenarios","description":"Comprehensive test coverage for merge logic.\n\n**Test cases**:\n- Simple field updates (left vs right)\n- Dependency merging (union + dedup)\n- Timestamp handling (max wins)\n- Deletion detection (deleted in one, modified in other)\n- Conflict generation (incompatible changes)\n- Issue resurrection prevention (bd-hv01 regression test)\n\n**Files**:\n- `internal/merge/merge_test.go`\n- `cmd/bd/merge_test.go`","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-05T18:42:20.472275-08:00","updated_at":"2025-11-06T15:52:41.863426-08:00","closed_at":"2025-11-06T15:52:41.863426-08:00","dependencies":[{"issue_id":"bd-kazt","depends_on_id":"bd-qqvw","type":"parent-child","created_at":"2025-11-05T18:42:28.740517-08:00","created_by":"daemon"},{"issue_id":"bd-kazt","depends_on_id":"bd-oif6","type":"blocks","created_at":"2025-11-05T18:42:35.469582-08:00","created_by":"daemon"}]}
{"id":"bd-62a0","title":"Create WASM build infrastructure (Makefile, scripts)","description":"Set up build tooling for WASM compilation:\n- Add GOOS=js GOARCH=wasm build target\n- Copy wasm_exec.js from Go distribution\n- Create wrapper script for Node.js execution\n- Add build task to Makefile or build script","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-02T21:58:07.286826-08:00","updated_at":"2025-11-02T22:23:49.376789-08:00","closed_at":"2025-11-02T22:23:49.376789-08:00","dependencies":[{"issue_id":"bd-62a0","depends_on_id":"bd-44d0","type":"parent-child","created_at":"2025-11-02T22:23:49.423064-08:00","created_by":"stevey"}]}
{"id":"bd-zpnq","title":"Daemons don't exit when parent process dies, causing accumulation and race conditions","description":"Multiple daemon processes accumulate over time because daemons don't automatically stop when their parent process (e.g., coding agent) is killed. This causes:\n\n1. Race conditions: 8+ daemons watching same .beads/beads.db, each with own 30s debounce timer\n2. Git conflicts: Multiple daemons racing to commit/push .beads/issues.jsonl\n3. Resource waste: Orphaned daemons from sessions days/hours old still running\n\nExample: User had 8 daemons from multiple sessions (12:37AM, 7:20PM, 7:22PM, 7:47PM, 9:19PM yesterday + 9:54AM, 10:55AM today).\n\nSolutions to consider:\n1. Track parent PID and exit when parent dies\n2. Use single global daemon instead of per-session\n3. Document manual cleanup: pkill -f \"bd daemon\"\n4. Add daemon lifecycle management (auto-cleanup of stale daemons)","notes":"Implementation complete:\n\n1. Added ParentPID field to DaemonLockInfo struct (stored in daemon.lock JSON)\n2. Daemon now tracks parent PID via os.Getppid() at startup\n3. Both event loops (polling and event-driven) check parent process every 10 seconds\n4. Daemon gracefully exits if parent process dies (detected via isProcessRunning check)\n5. Handles edge cases:\n   - ParentPID=0: Older daemons without tracking (ignored)\n   - ParentPID=1: Adopted by init means parent died (exits)\n   - Otherwise checks if parent process is still running\n\nThe fix prevents daemon accumulation by ensuring orphaned daemons automatically exit within 10 seconds of parent death.","status":"closed","priority":1,"issue_type":"bug","created_at":"2025-11-07T18:48:41.65456-08:00","updated_at":"2025-11-07T18:53:26.382573-08:00","closed_at":"2025-11-07T18:53:26.382573-08:00"}
{"id":"bd-790","title":"Document which files to commit after bd init --branch","description":"GH #312 reported confusion about which files should be committed after running 'bd init --branch beads-metadata'. Updated PROTECTED_BRANCHES.md to clearly document:\n\n1. Files that should be committed to protected branch (main):\n   - .beads/.gitignore\n   - .gitattributes\n\n2. Files that are automatically gitignored\n3. Files that live in the sync branch (beads-metadata)\n\nChanges:\n- Added step-by-step instructions in Quick Start section\n- Added 'What lives in each branch' section to How It Works\n- Clarified the directory structure diagram\n\nFixes: https://github.com/steveyegge/beads/issues/312","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-20T21:47:25.813954-05:00","updated_at":"2025-11-20T21:47:33.567649-05:00","closed_at":"2025-11-20T21:47:33.567651-05:00"}
{"id":"bd-y2v","title":"Refactor duplicate JSONL-from-git parsing code","description":"Both readFirstIssueFromGit() in init.go and importFromGit() in autoimport.go have similar code patterns for:\n1. Running git show \u003cref\u003e:\u003cpath\u003e\n2. Scanning the output with bufio.Scanner\n3. Parsing JSON lines\n\nCould be refactored to share a helper like:\n- readJSONLFromGit(gitRef, path string) ([]byte, error)\n- Or a streaming version: streamJSONLFromGit(gitRef, path string) (io.Reader, error)\n\nFiles:\n- cmd/bd/autoimport.go:225-256 (importFromGit)\n- cmd/bd/init.go:1212-1243 (readFirstIssueFromGit)\n\nPriority is low since code duplication is minimal and both functions work correctly.","status":"open","priority":2,"issue_type":"task","created_at":"2025-12-05T14:51:18.41124-08:00","updated_at":"2025-12-05T14:51:18.41124-08:00"}
{"id":"bd-3sz0","title":"Auto-repair stale merge driver configs with invalid placeholders","description":"Old bd versions (\u003c0.24.0) installed merge driver with invalid placeholders %L %R instead of %A %B. Add detection to bd doctor --fix: check if git config merge.beads.driver contains %L or %R, auto-repair to 'bd merge %A %O %A %B'. One-time migration for users who initialized with old versions.","status":"open","priority":2,"issue_type":"feature","created_at":"2025-11-21T23:16:10.762808-08:00","updated_at":"2025-11-21T23:16:28.892655-08:00","dependencies":[{"issue_id":"bd-3sz0","depends_on_id":"bd-tbz3","type":"parent-child","created_at":"2025-11-21T23:16:10.763612-08:00","created_by":"daemon"}]}
{"id":"bd-d33c","title":"Separate process/lock/PID concerns into process.go","description":"Create internal/daemonrunner/process.go with: acquireDaemonLock, PID file read/write, stopDaemon, isDaemonRunning, getPIDFilePath, socket path helpers, version check.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-01T11:41:14.871122-07:00","updated_at":"2025-11-01T23:43:55.66159-07:00","closed_at":"2025-11-01T23:43:55.66159-07:00"}
{"id":"bd-wgu4","title":"Standardize daemon detection: use tryDaemonLock probe before RPC","description":"Before attempting RPC connection, call tryDaemonLock() to check if lock is held:\n- If lock NOT held: skip RPC attempt (no daemon running)\n- If lock IS held: proceed with RPC + short timeout\n\nThis is extremely cheap and eliminates unnecessary connection attempts.\n\nApply across all client entry points that probe for daemon.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-07T16:42:12.709802-08:00","updated_at":"2025-11-07T20:15:23.282181-08:00","closed_at":"2025-11-07T20:15:23.282181-08:00","dependencies":[{"issue_id":"bd-wgu4","depends_on_id":"bd-ndyz","type":"discovered-from","created_at":"2025-11-07T16:42:12.710564-08:00","created_by":"daemon"}]}
{"id":"bd-0702","title":"Consolidate ID generation and validation into ids.go","description":"Extract ID logic into ids.go: ValidateIssueIDPrefix, GenerateIssueID, EnsureIDs. Move GetAdaptiveIDLength here. Unify single and bulk ID generation flows.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-01T11:41:14.877886-07:00","updated_at":"2025-11-02T15:28:11.996618-08:00","closed_at":"2025-11-02T15:28:11.996624-08:00"}
{"id":"bd-e6d71828","title":"Add transaction + retry logic for N-way collision resolution","description":"## Problem\nCurrent N-way collision resolution fails on UNIQUE constraint violations during convergence rounds when 5+ clones sync. The RemapCollisions function is non-atomic and performs operations sequentially:\n1. Delete old issues (CASCADE deletes dependencies)\n2. Create remapped issues (can fail with UNIQUE constraint)\n3. Recreate dependencies\n4. Update text references\n\nFailure at step 2 leaves database in inconsistent state.\n\n## Solution\nWrap collision resolution in database transaction with retry logic:\n- Make entire RemapCollisions operation atomic\n- Retry up to 3 times on UNIQUE constraint failures\n- Re-sync counters between retries\n- Add better error messages for debugging\n\n## Implementation\nLocation: internal/storage/sqlite/collision.go:342 (RemapCollisions function)\n\n```go\n// Retry up to 3 times on UNIQUE constraint failures\nfor attempt := 0; attempt \u003c 3; attempt++ {\n    err := s.db.ExecInTransaction(func(tx *sql.Tx) error {\n        // All collision resolution operations\n    })\n    if !isUniqueConstraintError(err) {\n        return err\n    }\n    s.SyncAllCounters(ctx)\n}\n```\n\n## Success Criteria\n- 5-clone collision test passes reliably\n- No partial state on UNIQUE constraint errors\n- Automatic recovery from transient ID conflicts\n\n## References\n- See beads_nway_test.go:124 for the KNOWN LIMITATION comment\n- Related to-7c5915ae (transaction support)","notes":"## Progress Made\n\n1. Added `ExecInTransaction` helper to SQLiteStorage for atomic database operations\n2. Added `IsUniqueConstraintError` function to detect UNIQUE constraint violations\n3. Wrapped `RemapCollisions` with retry logic (up to 3 attempts) with counter sync between retries\n4. Enhanced `handleRename` to detect and handle race conditions where target ID already exists\n5. Added defensive checks for when old ID has been deleted by another clone\n\n## Test Results\n\nThe changes improve N-way collision handling but don't fully solve the problem:\n- Original error: `UNIQUE constraint failed: issues.id` during first convergence round\n- With changes: Test proceeds further but encounters different collision scenarios\n- New error: `target ID already exists with different content` in later convergence rounds\n\n## Root Cause Analysis\n\nThe issue is more complex than initially thought. In N-way scenarios:\n1. Clone A remaps bd-1c63eb84 → test-2 → test-4\n2. Clone B remaps bd-1c63eb84 → test-3 → test-4  \n3. Both try to create test-4, but with different intermediate states\n4. This creates legitimate content collisions that require additional resolution\n\n## Next Steps  \n\nThe full solution requires:\n1. Making remapping fully deterministic across clones (same input → same remapped ID)\n2. OR making `handleRename` more tolerant of mid-flight collisions\n3. OR implementing full transaction support for multi-step collision resolution -7c5915ae)\n\nThe retry logic added here provides a foundation but isn't sufficient for complex N-way scenarios.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-29T10:22:32.716678-07:00","updated_at":"2025-11-02T17:08:52.043475-08:00","closed_at":"2025-11-02T17:08:52.043477-08:00","dependencies":[{"issue_id":"bd-e6d71828","depends_on_id":"bd-cbed9619.1","type":"related","created_at":"2025-10-29T10:44:44.14653-07:00","created_by":"daemon"}]}
{"id":"bd-a40f374f","title":"bd validate - Comprehensive health check","description":"Run all validation checks in one command.\n\nChecks:\n- Duplicates\n- Orphaned dependencies\n- Test pollution\n- Git conflicts\n\nSupports --fix-all for auto-repair.\n\nDepends on bd-cbed9619.1, bd-0dcea000, bd-31aab707, bd-9826b69a.\n\nFiles: cmd/bd/validate.go (new)","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-29T20:02:47.956664-07:00","updated_at":"2025-10-30T17:12:58.195108-07:00","closed_at":"2025-10-29T20:02:15.318966-07:00"}
{"id":"bd-mql4","title":"getLocalSyncBranch silently ignores YAML parse errors","description":"In autoimport.go:170-172, YAML parsing errors are silently ignored. If a user has malformed YAML in config.yaml, sync-branch will just silently be empty with no feedback.\n\nRecommendation: Add debug logging since this function is only called during auto-import, and debugging silent failures is painful.\n\nAdd: debug.Logf(\"Warning: failed to parse config.yaml: %v\", err)","status":"open","priority":4,"issue_type":"task","created_at":"2025-12-07T02:03:44.217728-08:00","updated_at":"2025-12-07T02:03:44.217728-08:00"}
{"id":"bd-6hji","title":"Test exclusive file reservations with two agents","description":"Simulate two agents racing to claim the same issue and verify that exclusive reservations prevent collision.\n\nAcceptance Criteria:\n- Agent A reserves bd-123 → succeeds\n- Agent B tries to reserve bd-123 → fails with clear error message\n- Agent B can see who has the reservation\n- Reservation expires after TTL\n- Agent B can claim after expiration","notes":"Successfully tested file reservations:\n- Agent BrownBear reserved bd-123 → granted\n- Agent ChartreuseHill tried same → conflicts returned\n- System correctly prevents collision","status":"closed","issue_type":"task","created_at":"2025-11-07T22:41:59.963468-08:00","updated_at":"2025-11-08T00:03:18.004972-08:00","closed_at":"2025-11-08T00:03:18.004972-08:00","dependencies":[{"issue_id":"bd-6hji","depends_on_id":"bd-muls","type":"blocks","created_at":"2025-11-07T23:03:52.897843-08:00","created_by":"daemon"},{"issue_id":"bd-6hji","depends_on_id":"bd-27xm","type":"blocks","created_at":"2025-11-07T23:20:21.911222-08:00","created_by":"daemon"},{"issue_id":"bd-6hji","depends_on_id":"bd-spmx","type":"parent-child","created_at":"2025-11-08T00:02:47.904652-08:00","created_by":"daemon"}]}
{"id":"bd-febc","title":"npm package for bd with native binaries","description":"Create an npm package that wraps native bd binaries for easy installation in Claude Code for Web and other Node.js environments.\n\n## Problem\nClaude Code for Web sandboxes are full Linux VMs with npm support, but cannot easily download binaries from GitHub releases due to network restrictions or tooling limitations.\n\n## Solution\nPublish bd as an npm package that:\n- Downloads platform-specific native binaries during postinstall\n- Provides a CLI wrapper that invokes the native binary\n- Works seamlessly in Claude Code for Web SessionStart hooks\n- Maintains full feature parity (uses native SQLite)\n\n## Benefits vs WASM\n- ✅ Full SQLite support (no custom VFS needed)\n- ✅ All features work identically to native bd\n- ✅ Better performance (native vs WASM overhead)\n- ✅ ~4 hours effort vs ~2 days for WASM\n- ✅ Minimal maintenance burden\n\n## Success Criteria\n- npm install @beads/bd works in Claude Code for Web\n- All bd commands function identically to native binary\n- SessionStart hook documented for auto-installation\n- Package published to npm registry","status":"closed","priority":1,"issue_type":"epic","created_at":"2025-11-02T23:39:37.684109-08:00","updated_at":"2025-11-03T10:39:44.932565-08:00","closed_at":"2025-11-03T10:39:44.932565-08:00"}
{"id":"bd-cbed9619.4","title":"Make DetectCollisions read-only (separate detection from modification)","description":"**Summary:** The project restructured the collision detection process in the database to separate read-only detection from state modification, eliminating race conditions and improving system reliability. This was achieved by introducing a two-phase approach: first detecting potential collisions, then applying resolution separately.\n\n**Key Decisions:**\n- Create read-only DetectCollisions method\n- Add RenameDetail to track potential issue renames\n- Implement atomic ApplyCollisionResolution function\n- Separate detection logic from database modification\n\n**Resolution:** The refactoring creates a more robust, composable collision handling mechanism that prevents partial failures and maintains database consistency during complex issue import scenarios.","status":"closed","priority":1,"issue_type":"task","created_at":"2025-10-28T18:37:09.652326-07:00","updated_at":"2025-12-16T01:14:35.524041-08:00","closed_at":"2025-10-28T19:08:17.715416-07:00","dependencies":[{"issue_id":"bd-cbed9619.4","depends_on_id":"bd-325da116","type":"parent-child","created_at":"2025-10-28T18:39:20.570276-07:00","created_by":"daemon"},{"issue_id":"bd-cbed9619.4","depends_on_id":"bd-cbed9619.5","type":"blocks","created_at":"2025-10-28T18:39:28.285653-07:00","created_by":"daemon"}]}
{"id":"bd-thgk","title":"Improve test coverage for internal/compact (18.2% → 70%)","description":"The compact package has only 18.2% test coverage. This is a core package handling issue compaction and should have at least 70% coverage.\n\nKey functions needing tests:\n- runCompactSingle (0%)\n- runCompactAll (0%)\n- runCompactRPC (0%)\n- runCompactStatsRPC (0%)\n- runCompactAnalyze (0%)\n- runCompactApply (0%)\n- pruneDeletionsManifest (0%)\n\nCurrent coverage: 18.2%\nTarget coverage: 70%","status":"open","priority":1,"issue_type":"task","created_at":"2025-12-13T20:42:58.455767-08:00","updated_at":"2025-12-13T21:01:15.070551-08:00"}
{"id":"bd-87a0","title":"Publish @beads/bd package to npm registry","description":"Publish the npm package to the public npm registry:\n\n## Prerequisites\n- npm account created\n- Organization @beads created (or use different namespace)\n- npm login completed locally\n- Package tested locally (bd-f282 completed)\n\n## Publishing steps\n1. Verify package.json version matches current bd version\n2. Run npm pack and inspect tarball contents\n3. Test installation from tarball one more time\n4. Run npm publish --access public\n5. Verify package appears on https://www.npmjs.com/package/@beads/bd\n6. Test installation from registry: npm install -g @beads/bd\n\n## Post-publish\n- Add npm badge to README.md\n- Update CHANGELOG.md with npm package release\n- Announce in release notes\n\n## Note\n- May need to choose different name if @beads namespace unavailable\n- Alternative: beads-cli, bd-cli, or unscoped beads-issue-tracker","status":"closed","priority":1,"issue_type":"task","created_at":"2025-11-02T23:40:25.263569-08:00","updated_at":"2025-11-03T10:39:41.772338-08:00","closed_at":"2025-11-03T10:39:41.772338-08:00","dependencies":[{"issue_id":"bd-87a0","depends_on_id":"bd-febc","type":"parent-child","created_at":"2025-11-02T23:40:33.014043-08:00","created_by":"daemon"}]}
{"id":"bd-s0z","title":"Consider extracting error handling helpers","description":"Evaluate creating FatalError() and WarnError() helpers as suggested in ERROR_HANDLING.md to reduce boilerplate and enforce consistency. Prototype in a few files first to validate the approach.","status":"closed","priority":4,"issue_type":"task","created_at":"2025-11-24T00:28:57.248959-08:00","updated_at":"2025-12-02T17:11:19.748387872-05:00","closed_at":"2025-11-28T23:28:00.886536-08:00"}
{"id":"bd-l5gq","title":"Optimize test suite performance - cut runtime by 50%+","description":"## Problem\nTest suite takes ~20.8 seconds, with 95% of time spent in just 2 tests:\n- TestHashIDs_MultiCloneConverge: 11.08s (53%)\n- TestHashIDs_IdenticalContentDedup: 8.78s (42%)\n\nBoth tests in beads_hash_multiclone_test.go perform extensive Git operations (bare repos, multiple clones, sync rounds).\n\n## Goal\nCut total test time by at least 50% (to ~10 seconds or less).\n\n## Analysis\nTests already have some optimizations:\n- --shared --depth=1 --no-tags for fast cloning\n- Disabled hooks, gc, fsync\n- Support -short flag\n\n## Impact\n- Faster development feedback loop\n- Reduced CI costs and time\n- Better developer experience","status":"closed","priority":2,"issue_type":"epic","created_at":"2025-11-04T01:23:14.410648-08:00","updated_at":"2025-11-04T11:23:13.683213-08:00","closed_at":"2025-11-04T11:23:13.683213-08:00"}
{"id":"bd-mnap","title":"Investigate performance issues in VS Code Copilot (Windows)","description":"Beads unusable in Windows 11 VS Code Copilot chat with Sonnet 4.5.\nSummary event happens every 3-4 turns, taking 3 minutes.\nCopilot summarizes after ~125k tokens despite model supporting 1M.\nLarge context size of beads might be triggering aggressive summarization.\nNeed workaround or optimization for context size.\n","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-20T18:56:30.124918-05:00","updated_at":"2025-12-09T18:38:37.700698972-05:00","closed_at":"2025-11-28T23:37:52.199294-08:00"}
{"id":"bd-ciu","title":"formatVanishedIssues output order is non-deterministic","status":"closed","priority":3,"issue_type":"bug","created_at":"2025-12-02T21:55:32.897206-08:00","updated_at":"2025-12-02T22:07:23.677332-08:00","closed_at":"2025-12-02T22:07:23.677332-08:00"}
{"id":"bd-kdoh","title":"Add tests for getMultiRepoJSONLPaths() edge cases","description":"From bd-xo6b code review: Missing test coverage for getMultiRepoJSONLPaths() edge cases.\n\nCurrent test gaps:\n- No tests for empty paths in config\n- No tests for duplicate paths\n- No tests for tilde expansion\n- No tests for relative paths\n- No tests for symlinks\n- No tests for paths with spaces\n- No tests for invalid/non-existent paths\n\nTest cases needed:\n\n1. Empty path handling:\n   Primary = empty, Additional = [empty]\n   Expected: Should either use . as default or error gracefully\n\n2. Duplicate detection:\n   Primary = ., Additional = [., ./]\n   Expected: Should return unique paths only\n\n3. Path normalization:\n   Primary = ~/repos/main, Additional = [../other, ./foo/../bar]\n   Expected: Should expand to absolute canonical paths\n\n4. Partial failure scenarios:\n   What if snapshot capture succeeds for repos 1-2 but fails on repo 3?\n   Test that system does not end up in inconsistent state\n\nFiles:\n- cmd/bd/deletion_tracking_test.go (add new tests)\n\nDependencies:\nDepends on fixing getMultiRepoJSONLPaths() path normalization first.","status":"closed","priority":2,"issue_type":"task","created_at":"2025-11-06T19:31:52.921241-08:00","updated_at":"2025-11-06T20:06:49.220334-08:00","closed_at":"2025-11-06T19:53:34.515411-08:00","dependencies":[{"issue_id":"bd-kdoh","depends_on_id":"bd-xo6b","type":"discovered-from","created_at":"2025-11-06T19:32:12.353459-08:00","created_by":"daemon"},{"issue_id":"bd-kdoh","depends_on_id":"bd-iye7","type":"blocks","created_at":"2025-11-06T19:32:13.688686-08:00","created_by":"daemon"}]}
{"id":"bd-r46","title":"Support --reason flag in daemon mode for reopen command","description":"The reopen.go command has a TODO at line 61 to add reason as a comment once RPC supports AddComment. Currently --reason flag is ignored in daemon mode with a warning.","status":"open","priority":2,"issue_type":"feature","created_at":"2025-11-21T18:55:10.773626-05:00","updated_at":"2025-11-21T18:55:10.773626-05:00"}
{"id":"bd-6y5","title":"Add unit tests for getLocalSyncBranch","description":"The new getLocalSyncBranch() function in autoimport.go (bd-0is fix) has no dedicated unit tests.\n\nShould test:\n- Returns empty string when no config.yaml exists\n- Returns empty string when config.yaml has no sync-branch key\n- Returns value when sync-branch is set with double quotes\n- Returns value when sync-branch is set with single quotes\n- Returns value when sync-branch is set without quotes\n- Returns BEADS_SYNC_BRANCH env var when set (takes precedence)\n- Handles edge cases: empty file, whitespace-only lines, comments\n\nLocation: cmd/bd/autoimport_test.go","status":"closed","priority":2,"issue_type":"task","created_at":"2025-12-05T14:51:07.129329-08:00","updated_at":"2025-12-07T18:04:18.833869-08:00","closed_at":"2025-12-07T01:57:11.69579-08:00"}
