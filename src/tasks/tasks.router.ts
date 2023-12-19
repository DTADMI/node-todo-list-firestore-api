/**
 * Required External Modules and Interfaces
 */

import express, { Request, Response } from "express";
import * as TaskService from "./tasks.service.js";
import {BaseTask, Task} from "./task.interface.js";
import {TaskResult} from "./tasks.interface.js";
import {tryCatch} from "../utils/tryCatch.js";
import HttpException from "../common/http-exception.js";

/**
 * Router Definition
 */

export const tasksRouter = express.Router();

const NOT_FOUND_MESSAGE = "😅 Resource not found! 🏳️";

const cleanTaskDto = (task: Task) : Task => {
    const result: Task = {} as Task;
    
    result.id = task.id;
    result.name = task.name;
    result.isDone = task.isDone;
    result.userId = task.userId;
    result.uri = "/api/todolist/tasks/" + task.id;
    result.creationDate = task.creationDate;
    if(task.description) {
        result.description = task.description;
    }
    if(task.dueDate) {
        result.dueDate = task.dueDate;
    }
    if(task.subtasks) {
        result.subtasks = [...task.subtasks];
    }
    if(task.superTask) {
        result.superTask = task.superTask;
    }
    if(task.lastModificationDate) {
        result.lastModificationDate = task.lastModificationDate;
    }

    return result;
}

/**
 * Paginating function
 * */
const paginateResults = (page: string, limit: string, showMedata: boolean, tasks: Task[]) => {
    const results: TaskResult = { data: [] as Task[]};
    if(page === "0") {
        console.log("Pages start at 1. Rectifying the page number from 0 to 1");
        page = "1";
    }
    if (page && limit) {
        console.log(`Getting sliced tasks with ${limit} elements starting at page ${page}`);
        const pageInt = Math.floor(parseInt(page.toString()));
        const limitInt = Math.floor(parseInt(limit.toString()));
        const startIndex = (pageInt - 1) * limitInt;
        const endIndex = (pageInt) * limitInt;
        console.log(`Getting sliced tasks from ${startIndex} to ${endIndex} excluded`);

        if (showMedata) {
            const pageCount = Math.ceil(tasks.length / limitInt);
            results._metadata = {
                page: pageInt,
                per_page: limitInt,
                page_count: pageCount,
                total_count: tasks.length,
                Links: [
                    {self: `/api/todolist/tasks?page=${pageInt}&limit=${limitInt}`},
                    {first: `/api/todolist/tasks?page=1&limit=${limitInt}`},
                    {last: `/api/todolist/tasks?page=${pageCount!==0 ? pageCount : 1}&limit=${limitInt}`},
                ]
            };
            if (startIndex > 0) {
                results._metadata.Links.push({previous: `/api/todolist/tasks?page=${pageInt - 1}&limit=${limitInt}`});
            }
            if (endIndex < tasks.length) {
                results._metadata.Links.push({next: `/api/todolist/tasks?page=${pageInt + 1}&limit=${limitInt}`});
            }
        }
        tasks = tasks.slice(startIndex, endIndex);
    }
    tasks = tasks.map(task => {
        console.log(`creationDate: ${JSON.stringify(task.creationDate)}`)
        return cleanTaskDto(task);
    });
    results.data = tasks;
    return results;
}

/**
 * Controller Definitions
 */


// GET tasks/
tasksRouter.get(
    "/",
    tryCatch((req: Request, res: Response) => {
        console.log("starting get all");
        const page= req.query?.page ?? "";
        const limit= req.query?.limit ?? "";
        const showMedata= req.query?.showMedata ? ((req.query?.showMedata + "").toLowerCase?.() === 'true') : true;
        let results: TaskResult;
        TaskService.findAll().then((tasks: Task[])=> {
            if(!tasks?.length){
                console.log("no result");
            }
            results = paginateResults(page.toString(), limit.toString(), showMedata, tasks);
            res.status(200).send(results);
        }).catch((error) => {
            const errorMessage = "Error getting document ";
            console.error(errorMessage, error);
            throw new HttpException(errorMessage, JSON.stringify(error));
        });
    })
);

// GET tasks/:id

tasksRouter.get(
    "/:id",
    tryCatch((req: Request, res: Response) => {

        const { id } = req.params;
        console.log(`In Get by id with id : ${id}`);
        let errorMessage: string;
        if (!id) {
            errorMessage = `id parameter not provided`;
            console.log(errorMessage);
            throw new HttpException(errorMessage, null, 400);
        }

        TaskService.findInCacheById(id.toString()).then((task: Task | null) => {
            if (!task) {
                console.log(NOT_FOUND_MESSAGE);
                throw new HttpException(NOT_FOUND_MESSAGE, null, 404);
            }
            console.log("Task Document data:", task);
            res.status(200).send(cleanTaskDto(task));
        }).catch((error) => {
            errorMessage = "Error getting document ";
            console.error(errorMessage, error);
            throw new HttpException(errorMessage, JSON.stringify(error));
        });
    })
);

// GET tasks/name/?name

tasksRouter.get(
    "/name/:name",
    tryCatch((req: Request, res: Response) => {

        let { name } = req.params;
        console.log(`In Get by name with name : ${name}`);
        let errorMessage: string;
        if (!name) {
            errorMessage = `name parameter not provided`;
            console.log(errorMessage);
            throw new HttpException(errorMessage, null, 400);
        }

        name = name.toString();
        TaskService.findInCacheByName(name).then((task: Task | null) => {
            if(!task) {
                console.log(NOT_FOUND_MESSAGE);
                throw new HttpException(NOT_FOUND_MESSAGE, null, 404);
            }
            console.log("Task Document data:", JSON.stringify(task));
            res.status(200).send(cleanTaskDto(task));
        }).catch((error) => {
            errorMessage = "Error getting document ";
            console.error(errorMessage, error);
            throw new HttpException(errorMessage, JSON.stringify(error));
        });
    })
);

// POST tasks/task

tasksRouter.post(
    "/task",
    tryCatch((req: Request, res: Response) => {
        const task: BaseTask = req.body;

        if(!task?.name) {
            throw new HttpException("task parameter must contain a name", null, 400);
        }
        console.log(`Creating task ${task}`);
        TaskService.create(task)
            .then((newTask) => {
                console.log("Task Document written with ID: ", newTask.id);
                res.status(201).json(cleanTaskDto(newTask));
            })
            .catch((error) => {
                const errorMessage = "Error adding document ";
                console.error(errorMessage, error);
                throw new HttpException(errorMessage, JSON.stringify(error));
            });
    })
);

// POST tasks/

tasksRouter.post(
    "/",
    tryCatch((req: Request, res: Response) => {
        const { userId } = req.body;
        const page=req.query?.page ?? "";
        const limit=req.query?.limit ?? "";
        const showMedata= req.query?.showMedata ? ((req.query?.showMedata + "").toLowerCase?.() === 'true') : true;
        let results: TaskResult;

        let errorMessage: string;
        if(!userId) {
            errorMessage = "User parameter missing";
            console.log(errorMessage);
            throw new HttpException(errorMessage,null, 400);
        }
        console.log(`Getting all owned tasks from ${userId}`);

        TaskService.findAllFromUser(userId)
            .then((tasks: Task[]) => {
                if(!tasks?.length){
                    console.log("no result");
                }
                results = paginateResults(page.toString(), limit.toString(), showMedata, tasks);

                res.status(200).send(results);
            })
            .catch((error) => {
                errorMessage = "Error while getting all owned document "
                console.error(errorMessage, error);
                throw new HttpException(errorMessage, JSON.stringify(error));
            });
    })
);

// PUT tasks/

tasksRouter.put(
    "/",
    tryCatch((req: Request, res: Response) => {
        const taskUpdate: Task = req.body;
        console.log(`In update! data sent : ${JSON.stringify(taskUpdate)}`);
        let errorMessage: string;
        if(!taskUpdate?.name || !taskUpdate?.id) {
            errorMessage = "Missing data in request body!";
            console.log(errorMessage);
            throw new HttpException(errorMessage, null, 400);
        }
        TaskService.update(taskUpdate)
            .then((task) => {
                if(!task) {
                    console.log(NOT_FOUND_MESSAGE);
                    throw new HttpException(NOT_FOUND_MESSAGE, null, 404);
                }
                console.log("Task Document successfully updated!");
                res.status(200).json(cleanTaskDto(task));
            })
            .catch((error) => {
                errorMessage = "Error writing document ";
                console.error(errorMessage, error);
                throw new HttpException(errorMessage, JSON.stringify(error));
            });
    })
);

// PUT tasks/subtasks

tasksRouter.put(
    "/subtasks",
    tryCatch((req: Request, res: Response) => {
        const taskUpdate: Task = req.body;
        if(!taskUpdate?.name || !taskUpdate?.id || !taskUpdate?.subtasks) {
            res.sendStatus(400);
            return;
        }
        TaskService.updateSubtasks(taskUpdate)
            .then((task) => {
                if(!task) {
                    console.log(NOT_FOUND_MESSAGE);
                    throw new HttpException(NOT_FOUND_MESSAGE, null, 404);
                }
                console.log("Task Document successfully updated!");
                res.status(200).json(cleanTaskDto(task));
            })
            .catch((error) => {
                const errorMessage = "Error writing document ";
                console.error(errorMessage, error);
                throw new HttpException(errorMessage, JSON.stringify(error));
            });
    })
);

// DELETE /tasks/:id

tasksRouter.delete("/:id", (req: Request, res: Response) => {
    /** Front end has to handle the cascade
     => force user to delete character in all stories and relationships
     before being able to delete object
     **/
    const { id } = req.params;
    console.log(`In delete with id : ${id}`);
    let errorMessage: string;
    if (!id) {
        errorMessage = `id parameter not provided`;
        console.log(errorMessage);
        throw new HttpException(errorMessage, null, 400);
    }
    TaskService.findInCacheById(id)
        .then(task => {
            if(task){
                //Delete its subtasks
                task.subtasks?.forEach(subtaskId =>{
                    TaskService.remove(subtaskId).then((subtaskId) => {
                        console.log(`Subtask Document ${subtaskId} deleted`);
                    }).catch((error) => {
                        console.log("Error deleting document:", error);
                    });
                })
                //Delete it from its supertask list of subtasks
                if(task.superTask){
                    TaskService.findInCacheById(task.superTask).then((superTask)=>{
                        if(superTask){
                            const subtasks = superTask.subtasks?.filter((subtask)=>subtask!==task.id);
                            superTask = {...superTask, subtasks}
                            TaskService.updateSubtasks(superTask).then(() => {
                                console.log(`SuperTask ${superTask?.id} subtasks updated to remove ${task.id}. New subtasks : ${JSON.stringify(superTask?.subtasks)}`);
                            });
                        }
                    })
                }
                TaskService.remove(id).then((id) => {
                    console.log("Task Document deleted");
                    res.status(202).send(id);
                }).catch((error) => {
                    errorMessage = "Error deleting document ";
                    console.log(errorMessage, error);
                    throw new HttpException(errorMessage, JSON.stringify(error));
                });
            } else {
                console.log("No such document!!!!");
                res.sendStatus(204);
            }
        });
});

// DELETE /tasks?name=name

tasksRouter.delete(
    "/",
    tryCatch((req: Request, res: Response) => {
        let name = req.query?.name ?? "";
        console.log(`In delete by name with name : ${name}`);
        let errorMessage: string;
        if (!name) {
            errorMessage = "Name not provided!";
            console.log(errorMessage);
            throw new HttpException(errorMessage, null, 400);
        }
        name = name.toString();
        TaskService.findInCacheByName(name)
            .then(task => {
                if(task){
                    //Delete its subtasks
                    task.subtasks?.forEach(subtaskId =>{
                        TaskService.remove(subtaskId).then((subtaskId) => {
                            console.log(`Subtask Document ${subtaskId} deleted`);
                        }).catch((error) => {
                            console.log("Error deleting document:", error);
                        });
                    })
                    //Delete it from its supertask list of subtasks
                    if(task.superTask){
                        TaskService.findInCacheById(task.superTask).then((superTask)=>{
                            if(superTask){
                                const subtasks = superTask.subtasks?.filter((subtask)=>subtask!==task.id);
                                superTask = {...superTask, subtasks}
                                TaskService.updateSubtasks(superTask).then(() => {
                                    console.log(`SuperTask ${superTask?.id} subtasks updated to remove ${task.id}. New subtasks : ${JSON.stringify(superTask?.subtasks)}`);
                                });
                            }
                        })
                    }

                    TaskService.remove(task.id).then((id) => {
                        console.log("Task Document deleted");
                        res.status(202).send(id);
                    }).catch((error) => {
                        errorMessage = "Error deleting document ";
                        console.log(errorMessage, error);
                        throw new HttpException(errorMessage, JSON.stringify(error))
                    });
                } else {
                    console.log("No such document!!!!");
                    res.sendStatus(204);
                }
            });
        })
);
