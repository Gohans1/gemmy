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

# Workflows and Checklists

Detailed step-by-step workflows for common bd usage patterns with checklists.

## Contents

- [Session Start Workflow](#session-start) - Check bd ready, establish context
- [Compaction Survival](#compaction-survival) - Recovering after compaction events
- [Discovery and Issue Creation](#discovery) - Proactive issue creation during work
- [Status Maintenance](#status-maintenance) - Keeping bd status current
- [Epic Planning](#epic-planning) - Structuring complex work with dependencies
- [Side Quest Handling](#side-quests) - Discovery during main task, assessing blocker vs deferrable, resuming
- [Multi-Session Resume](#resume) - Returning after days/weeks away
- [Session Handoff Workflow](#session-handoff) - Collaborative handoff between sessions
- [Unblocking Work](#unblocking) - Handling blocked issues
- [Integration with TodoWrite](#integration-with-todowrite) - Using both tools together
- [Common Workflow Patterns](#common-workflow-patterns)
  - Systematic Exploration, Bug Investigation, Refactoring with Dependencies, Spike Investigation
- [Checklist Templates](#checklist-templates)
  - Starting Any Work Session, Creating Issues During Work, Completing Work, Planning Complex Features
- [Decision Points](#decision-points)
- [Troubleshooting Workflows](#troubleshooting-workflows)

## Session Start Workflow {#session-start}

**bd is available when**:
- Project has `.beads/` directory (project-local), OR
- `~/.beads/` exists (global fallback for any directory)

**Automatic checklist at session start:**

```
Session Start (when bd is available):
- [ ] Run bv --robot-insights
- [ ] Run bd ready --json
- [ ] Report: "X items ready to work on: [summary]"
- [ ] If using global ~/.beads, note this in report
- [ ] If none ready, check bd blocked --json
- [ ] Suggest next action based on findings
```

**Pattern**: Always run `bv --robot-insights`, `bd ready` when starting work where bd is available. Report status immediately to establish shared context.

**Database selection**: bd auto-discovers which database to use (project-local `.beads/` takes precedence over global `~/.beads/`).

---

## Compaction Survival {#compaction-survival}

**Critical**: After compaction events, conversation history is deleted but bd state persists. Beads are your only memory.

**Post-compaction recovery checklist:**

```
After Compaction:
- [ ] Run bd list --status in_progress to see active work
- [ ] Run bd show <issue-id> for each in_progress issue
- [ ] Read notes field to understand: COMPLETED, IN PROGRESS, BLOCKERS, KEY DECISIONS
- [ ] Check dependencies: bd dep tree <issue-id> for context
- [ ] If notes insufficient, check bd list --status open for related issues
- [ ] Reconstruct TodoWrite list from notes if needed
```

**Pattern**: Well-written notes enable full context recovery even with zero conversation history.

**Writing notes for compaction survival:**

**Good note (enables recovery):**
```
bd update issue-42 --notes "COMPLETED: User authentication - added JWT token
generation with 1hr expiry, implemented refresh token endpoint using rotating
tokens pattern. IN PROGRESS: Password reset flow. Email service integration
working. NEXT: Need to add rate limiting to reset endpoint (currently unlimited
requests). KEY DECISION: Using bcrypt with 12 rounds after reviewing OWASP
recommendations, tech lead concerned about response time but benchmarks show <100ms."
```

**Bad note (insufficient for recovery):**
```
bd update issue-42 --notes "Working on auth feature. Made some progress.
More to do later."
```

The good note contains:
- Specific accomplishments (what was implemented/configured)
- Current state (which part is working, what's in progress)
- Next concrete step (not just "continue")
- Key context (team concerns, technical decisions with rationale)

**After compaction**: `bd show issue-42` reconstructs the full context needed to continue work.

---

## Discovery and Issue Creation {#discovery}

**When encountering new work during implementation:**

```
Discovery Workflow:
- [ ] Notice bug, improvement, or follow-up work
- [ ] Assess: Can defer or is blocker?
- [ ] Create issue with bd create "Issue title"
- [ ] Add discovered-from dependency: bd dep add current-id new-id --type discovered-from
- [ ] If blocker: pause and switch; if not: continue current work
- [ ] Issue persists for future sessions
```

**Pattern**: Proactively file issues as you discover work. Context captured immediately instead of lost when session ends.

**When to ask first**:
- Knowledge work with fuzzy scope
- User intent unclear
- Multiple valid approaches

**When to create directly**:
- Clear bug found
- Obvious follow-up work
- Technical debt with clear scope

---

## Status Maintenance {#status-maintenance}

**Throughout work on an issue:**

```
Issue Lifecycle:
- [ ] Start: Update status to in_progress
- [ ] During: Add design notes as decisions made
- [ ] During: Update acceptance criteria if requirements clarify
- [ ] During: Add dependencies if blockers discovered
- [ ] Complete: Close with summary of what was done
- [ ] After: Check `bv --robot-insights` `bd ready` to see what unblocked
```

**Pattern**: Keep bd status current so project state is always accurate.

**Status transitions**:
- `open` → `in_progress` when starting work
- `in_progress` → `blocked` if blocker discovered
- `blocked` → `in_progress` when unblocked
- `in_progress` → `closed` when complete

---

## Epic Planning {#epic-planning}

**For complex multi-step features:**

```
Epic Planning Workflow:
- [ ] Create epic issue for high-level goal
- [ ] Break down into child task issues
- [ ] Create each child task
- [ ] Add parent-child dependencies from epic to each child
- [ ] Add blocks dependencies between children if needed
- [ ] Use bv --robot-insights, bd ready to work through tasks in dependency order
```

**Example**: OAuth Integration Epic

```bash
1. Create epic:
   bd create "Implement OAuth integration" -t epic -d "OAuth with Google and GitHub"
     design: "Support Google and GitHub providers"

2. Create child tasks:
   bd create "Set up OAuth client credentials" -t task
   bd create "Implement authorization code flow" -t task
   bd create "Add token storage and refresh" -t task
   bd create "Create login/logout endpoints" -t task

3. Link children to parent:
   bd dep add oauth-epic oauth-setup --type parent-child
   bd dep add oauth-epic oauth-flow --type parent-child
   bd dep add oauth-epic oauth-storage --type parent-child
   bd dep add oauth-epic oauth-endpoints --type parent-child

4. Add blocks between children:
   bd dep add oauth-setup oauth-flow
   # Setup blocks flow implementation
```

---

## Side Quest Handling {#side-quests}

**When discovering work that pauses main task:**

```
Side Quest Workflow:
- [ ] During main work, discover problem or opportunity
- [ ] Create issue for side quest
- [ ] Add discovered-from dependency linking to main work
- [ ] Assess: blocker or can defer?
- [ ] If blocker: mark main work blocked, switch to side quest
- [ ] If deferrable: note in issue, continue main work
- [ ] Update statuses to reflect current focus
```

**Example**: During feature implementation, discover architectural issue

```
Main task: Adding user profiles

Discovery: Notice auth system should use role-based access

Actions:
1. Create issue: "Implement role-based access control"
2. Link: discovered-from "user-profiles-feature"
3. Assess: Blocker for profiles feature
4. Mark profiles as blocked
5. Switch to RBAC implementation
6. Complete RBAC, unblocks profiles
7. Resume profiles work
```

---

## Multi-Session Resume {#resume}

**Starting work after days/weeks away:**

```
Resume Workflow:
- [ ] Run bv --robot-insights, bd ready to see available work
- [ ] Run bd stats for project overview
- [ ] List recent closed issues for context
- [ ] Show details on issue to work on
- [ ] Review design notes and acceptance criteria
- [ ] Update status to in_progress
- [ ] Begin work with full context
```

**Why this works**: bd preserves design decisions, acceptance criteria, and dependency context. No scrolling conversation history or reconstructing from markdown.

---

## Session Handoff Workflow {#session-handoff}

**Collaborative handoff between sessions using notes field:**

This workflow enables smooth work resumption by updating beads notes when stopping, then reading them when resuming. Works in conjunction with compaction survival - creates continuity even after conversation history is deleted.

### At Session Start (Claude's responsibility)

```
Session Start with in_progress issues:
- [ ] Run bd list --status in_progress
- [ ] For each in_progress issue: bd show <issue-id>
- [ ] Read notes field to understand: COMPLETED, IN PROGRESS, NEXT
- [ ] Report to user with context from notes field
- [ ] Example: "workspace-mcp-server-2 is in_progress. Last session:
       completed tidying. No code written yet. Next step: create
       markdown_to_docs.py. Should I continue with that?"
- [ ] Wait for user confirmation or direction
```

**Pattern**: Notes field is the "read me first" guide for resuming work.

### At Session End (Claude prompts user)

When wrapping up work on an issue:

```
Session End Handoff:
- [ ] Notice work reaching a stopping point
- [ ] Prompt user: "We just completed X and started Y on <issue-id>.
       Should I update the beads notes for next session?"
- [ ] If yes, suggest command:
       bd update <issue-id> --notes "COMPLETED: X. IN PROGRESS: Y. NEXT: Z"
- [ ] User reviews and confirms
- [ ] Claude executes the update
- [ ] Notes saved for next session's resumption
```

**Pattern**: Update notes at logical stopping points, not after every keystroke.

### Notes Format (Current State, Not Cumulative)

```
Good handoff note (current state):
COMPLETED: Parsed markdown into structured format
IN PROGRESS: Implementing Docs API insertion
NEXT: Debug batchUpdate call - getting 400 error on formatting
BLOCKER: None
KEY DECISION: Using two-phase approach (insert text, then apply formatting) based on reference implementation

Bad handoff note (not useful):
Updated some stuff. Will continue later.
```

**Rules for handoff notes:**
- Current state only (overwrite previous notes, not append)
- Specific accomplishments (not vague progress)
- Concrete next step (not "continue working")
- Optional: Blockers, key decisions, references
- Written for someone with zero conversation context

### Session Handoff Checklist

For Claude at session end:

```
Session End Checklist:
- [ ] Work reaching logical stopping point
- [ ] Prompt user about updating notes
- [ ] If approved:
  - [ ] Craft note with COMPLETED/IN_PROGRESS/NEXT
  - [ ] Include blocker if stuck
  - [ ] Include key decisions if relevant
  - [ ] Suggest bd update command
- [ ] Execute approved update
- [ ] Confirm: "Saved handoff notes for next session"
```

For user (optional, but helpful):

```
User Tips:
- [ ] When stopping work: Let Claude suggest notes update
- [ ] When resuming: Let Claude read notes and report context
- [ ] Avoid: Trying to remember context manually (that's what notes are for!)
- [ ] Trust: Well-written notes will help next session pick up instantly
```

### Example: Real Session Handoff

**Scenario:** Implementing markdown→Docs feature (workspace-mcp-server-2)

**At End of Session 1:**
```bash
bd update workspace-mcp-server-2 --notes "COMPLETED: Set up skeleton with Docs
API connection verified. Markdown parsing logic 80% done (handles *, _ modifiers).
IN PROGRESS: Testing edge cases for nested formatting. NEXT: Implement
batchUpdate call structure for text insertion. REFERENCE: Reference pattern at
docs/markdown-to-docs-reference.md. No blockers, moving well."
```

**At Start of Session 2:**
```bash
bd show workspace-mcp-server-2
# Output includes notes field showing exactly where we left off
# Claude reports: "Markdown→Docs feature is 80% parsed. We were testing
# edge cases and need to implement batchUpdate next. Want to continue?"
```

Session resumes instantly with full context, no history scrolling needed.

---

## Unblocking Work {#unblocking}

**When ready list is empty:**

```
Unblocking Workflow:
- [ ] Run bd blocked --json to see what's stuck
- [ ] Show details on blocked issues: bd show issue-id
- [ ] Identify blocker issues
- [ ] Choose: work on blocker, or reassess dependency
- [ ] If reassess: remove incorrect dependency
- [ ] If work on blocker: close blocker, check ready again
- [ ] Blocked issues automatically become ready when blockers close
```

**Pattern**: bd automatically maintains ready state based on dependencies. Closing a blocker makes blocked work ready.

**Example**:

```
Situation: bd ready shows nothing

Actions:
1. bd blocked shows: "api-endpoint blocked by db-schema"
2. Show db-schema: "Create user table schema"
3. Work on db-schema issue
4. Close db-schema when done
5. bd ready now shows: "api-endpoint" (automatically unblocked)
```

---

## Integration with TodoWrite

**Using both tools in one session:**

```
Hybrid Workflow:
- [ ] Check bd for high-level context
- [ ] Choose bd issue to work on
- [ ] Mark bd issue in_progress
- [ ] Create TodoWrite from acceptance criteria for execution
- [ ] Work through TodoWrite items
- [ ] Update bd design notes as you learn
- [ ] When TodoWrite complete, close bd issue
```

**Why hybrid**: bd provides persistent structure, TodoWrite provides visible progress.

---

## Common Workflow Patterns

### Pattern: Systematic Exploration

Research or investigation work:

```
1. Create research issue with question to answer
2. Update design field with findings as you go
3. Create new issues for discoveries
4. Link discoveries with discovered-from
5. Close research issue with conclusion
```

### Pattern: Bug Investigation

```
1. Create bug issue
2. Reproduce: note steps in description
3. Investigate: track hypotheses in design field
4. Fix: implement solution
5. Test: verify in acceptance criteria
6. Close with explanation of root cause and fix
```

### Pattern: Refactoring with Dependencies

```
1. Create issues for each refactoring step
2. Add blocks dependencies for correct order
3. Work through in dependency order
4. bv --robot-insights, bd ready automatically shows next step
5. Each completion unblocks next work
```

### Pattern: Spike Investigation

```
1. Create spike issue: "Investigate caching options"
2. Time-box exploration
3. Document findings in design field
4. Create follow-up issues for chosen approach
5. Link follow-ups with discovered-from
6. Close spike with recommendation
```

---

## Checklist Templates

### Starting Any Work Session

```
- [ ] Check for .beads/ directory
- [ ] If exists: bd ready
- [ ] Report status to user
- [ ] Get user input on what to work on
- [ ] Show issue details
- [ ] Update to in_progress
- [ ] Begin work
```

### Creating Issues During Work

```
- [ ] Notice new work needed
- [ ] Create issue with clear title
- [ ] Add context in description
- [ ] Link with discovered-from to current work
- [ ] Assess blocker vs deferrable
- [ ] Update statuses appropriately
```

### Completing Work

```
- [ ] Implementation done
- [ ] Tests passing
- [ ] Close issue with summary
- [ ] Check bv --robot-insights, bd ready for unblocked work
- [ ] Report completion and next available work
```

### Planning Complex Features

```
- [ ] Create epic for overall goal
- [ ] Break into child tasks
- [ ] Create all child issues
- [ ] Link with parent-child dependencies
- [ ] Add blocks between children if order matters
- [ ] Work through in dependency order
```

---

## Decision Points

**Should I create a bd issue or use TodoWrite?**
→ See [BOUNDARIES.md](BOUNDARIES.md) for decision matrix

**Should I ask user before creating issue?**
→ Ask if scope unclear; create if obvious follow-up work

**Should I mark work as blocked or just note dependency?**
→ Blocked = can't proceed; dependency = need to track relationship

**Should I create epic or just tasks?**
→ Epic if 5+ related tasks; tasks if simpler structure

**Should I update status frequently or just at start/end?**
→ Start and end minimum; during work if significant changes

---

## Troubleshooting Workflows

**"I can't find any ready work"**
1. Run bd blocked
2. Identify what's blocking progress
3. Either work on blockers or create new work

**"I created an issue but it's not showing in ready"**
1. Run bd show on the issue
2. Check dependencies field
3. If blocked, resolve blocker first
4. If incorrectly blocked, remove dependency

**"Work is more complex than expected"**
1. Transition from TodoWrite to bd mid-session
2. Create bd issue with current context
3. Note: "Discovered complexity during implementation"
4. Add dependencies as discovered
5. Continue with bd tracking

**"I closed an issue but work isn't done"**
1. Reopen with bd update status=open
2. Or create new issue linking to closed one
3. Note what's still needed
4. Closed issues can't be reopened in some systems, so create new if needed

**"Too many issues, can't find what matters"**
1. Use bd list with filters (priority, issue_type)
2. Use bd ready to focus on unblocked work
3. Consider closing old issues that no longer matter
4. Use labels for organization
