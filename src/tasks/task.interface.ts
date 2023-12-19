export interface BaseTask {
    name: string,
    description?: string,
    isDone: boolean,
    creationDate: string,
    dueDate?: string,
    subtasks?: Array<string>,
    superTask?: string,
    lastModificationDate?: string,
    userId: string
}

export interface Task extends BaseTask {
    id: string,
    uri?: string
}