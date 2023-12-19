// src/maps/maps.interface.ts

import { Task } from "./task.interface.js";

export interface Tasks {
    [key: number]: Task;
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