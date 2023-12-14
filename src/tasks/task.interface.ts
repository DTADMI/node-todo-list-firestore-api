export interface BaseTask {
    name: string,
    isDone: boolean,
    creationDate: string,
    dueDate?: string,
    subtasks?: Array<string>,
    superTask?: string,
    lastModificationDate?: string,
    user: string
}

export interface Task extends BaseTask {
    id: string,
    uri?: string
}