export interface Task {
    id: string,
    name: string,
    description?: string,
    isDone: boolean,
    creationDate: string,
    dueDate?: string,
    subtasks?: Array<string>,
    superTask?: string,
    lastModificationDate?: string,
    userId: string,
    uri?: string
}

export interface TaskResult {
    _metadata? : {
        page: number,
        per_page: number,
        page_count: number,
        total_count: number,
        Links: (
            {self: string}|
            {first: string}|
            {previous : string}|
            {next: string}|
            {last: string}
            )[]
    },
    data: Task[],
}