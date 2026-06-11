-- State store for the command centre. The agents and the dashboard both read/write this.
-- Single source of truth. The agent's internal context is never trusted over these tables.

-- One row, id = 'singleton'. The ground-truth world model the orchestrator reads first every tick.
create table if not exists world_state (
  id            text primary key default 'singleton',
  paused        boolean not null default false,        -- global kill switch
  world_model   jsonb  not null default '{}'::jsonb,    -- active threads, free-text ground truth
  budget_cap    numeric not null default 5.0,           -- daily USD ceiling
  spent_today   numeric not null default 0,
  spend_date    date    not null default current_date,
  updated_at    timestamptz not null default now()
);

-- Work the orchestrator dispatches to workers.
create table if not exists task_queue (
  id          uuid primary key default gen_random_uuid(),
  role        text not null,                            -- watcher | researcher | drafter | ops
  bucket      text not null default 'GREEN',            -- GREEN | RED
  task        jsonb not null,                           -- scoped instructions + inputs
  status      text not null default 'pending',          -- pending | in_progress | done | failed
  confidence  text,                                     -- high | medium | low
  created_at  timestamptz not null default now()
);

-- RED actions produced to READY state, waiting for a human tap. Nothing here executes itself.
create table if not exists approval_queue (
  id           uuid primary key default gen_random_uuid(),
  summary      text not null,                           -- what it does, why now
  reversible   text,                                    -- what's reversible if wrong
  confidence   text,
  artifact     jsonb not null,                          -- the drafted action (e.g. email body)
  status       text not null default 'pending',         -- pending | approved | rejected | executed
  decided_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- Append-only audit log of everything the loop did.
create table if not exists decision_log (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  bucket      text,
  confidence  text,
  model       text,
  cost_usd    numeric default 0,
  result      jsonb,
  created_at  timestamptz not null default now()
);

insert into world_state (id) values ('singleton') on conflict (id) do nothing;
