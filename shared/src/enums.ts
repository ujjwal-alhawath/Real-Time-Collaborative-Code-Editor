export enum Language {
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Python = 'python',
  Cpp = 'cpp',
  Java = 'java',
}

export enum Role {
  Owner = 'owner',
  Editor = 'editor',
  Viewer = 'viewer',
}

export enum ExecutionStatus {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Timeout = 'timeout',
}
