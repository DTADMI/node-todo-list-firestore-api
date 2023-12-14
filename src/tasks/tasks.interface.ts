// src/maps/maps.interface.ts

import { Task } from "./task.interface";

export interface Tasks {
    [key: number]: Task;
}

export interface TaskResult {
    /**
     * {
     *   "_metadata":
     *   {
     *       "page": 5,
     *       "per_page": 20,
     *       "page_count": 20,
     *       "total_count": 521,
     *       "Links": [
     *         {"self": "/products?page=5&per_page=20"},
     *         {"first": "/products?page=0&per_page=20"},
     *         {"previous": "/products?page=4&per_page=20"},
     *         {"next": "/products?page=6&per_page=20"},
     *         {"last": "/products?page=26&per_page=20"},
     *       ]
     *   },
     *   "data": [
     *     {
     *       "id": 1,
     *       "name": "Widget #1",
     *       "uri": "/products/1"
     *     },
     *     {
     *       "id": 2,
     *       "name": "Widget #2",
     *       "uri": "/products/2"
     *     },
     *     {
     *       "id": 3,
     *       "name": "Widget #3",
     *       "uri": "/products/3"
     *     }
     *   ]
     * }
     * **/
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