/**
 * Required External Modules and Interfaces
 */

import express, { Request, Response } from "express";
import * as TaskService from "./tasks.service";
import {BaseTask, Task} from "./task.interface";
import {TaskResult} from "./tasks.interface";

/**
 * Router Definition
 */

export const tasksRouter = express.Router();

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
    tasks.forEach(task => {
        console.log(`creationDate: ${JSON.stringify(task.creationDate)}`)
        task.uri = "/api/todolist/tasks/" + task.id;
    })
    results.data = tasks;
    return results;
}

/**
 * Controller Definitions
 */


// GET tasks/
tasksRouter.get("/", (req: Request, res: Response) => {
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
        console.error("Error getting documents: ", error);
        res.status(500).json(`Error getting documents: ${error}`);
    });
});

// GET tasks/:id

tasksRouter.get("/:id", (req: Request, res: Response) => {

    const { id } = req.params;
    console.log(`In Get by id with id : ${id}`)
    if (!id) {
        console.log(`id ${id} not given`)
        res.sendStatus(400)
        return;
    }

    TaskService.findInCacheById(id.toString()).then((task: Task | null) => {
        if (!task) {
            console.log("No such document!");
            res.sendStatus(404);
            return;
        }
        console.log("Task Document data:", task);
        res.status(200).send(task);
    }).catch((error) => {
        console.error("Error getting document: ", error);
        res.status(500).send(`Error getting document: ${error}`);
    });
});

// GET tasks/name/?name

tasksRouter.get("/name/:name", (req: Request, res: Response) => {

    let { name } = req.params;
    console.log(`In Get by name with name : ${name}`)
    if (!name) {
        console.log(`id ${name} not provided`)
        res.sendStatus(400)
        return;
    }

    name = name.toString();
    TaskService.findInCacheByName(name).then((task) => {
        if(!task) {
            console.log("No such document!!!");
            res.sendStatus(404);
            return;
        }
        console.log("Task Document data:", JSON.stringify(task));
        res.status(200).send(task);
    }).catch((error) => {
        console.error("Error getting document: ", error);
        res.status(500).send(`Error getting document: ${error}`);
    });
});

// POST tasks/task

tasksRouter.post("/task", (req: Request, res: Response) => {
    const task: BaseTask = req.body;

    if(!task?.name) {
        res.sendStatus(400);
        return;
    }
    console.log(`Creating task ${task}`);
    TaskService.create(task)
        .then((newTask) => {
            console.log("Task Document written with ID: ", newTask.id);
            res.status(201).json(newTask);
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
            res.status(500).send(`Error adding document: ${error}`);
        });
});

// POST tasks/

tasksRouter.post("/", (req: Request, res: Response) => {
    const { user } = req.body;
    const page=req.query?.page ?? "";
    const limit=req.query?.limit ?? "";
    const showMedata= req.query?.showMedata ? ((req.query?.showMedata + "").toLowerCase?.() === 'true') : true;
    let results: TaskResult;

    if(!user) {
        console.log("User missing")
        res.sendStatus(400);
        return;
    }
    console.log(`Getting all owned tasks from ${user}`);

    TaskService.findAllFromUser(user)
        .then((tasks: Task[]) => {
            if(!tasks?.length){
                console.log("no result");
            }
            results = paginateResults(page.toString(), limit.toString(), showMedata, tasks);

            res.status(200).send(results);
        })
        .catch((error) => {
            console.error("Error while getting all owned document: ", error);
            res.status(500).send(`Error while getting all user documents: ${error}`);
        });
});

// PUT tasks/

tasksRouter.put("/", (req: Request, res: Response) => {
    const taskUpdate: Task = req.body;
    console.log(`In update! data sent : ${JSON.stringify(taskUpdate)}`)
    if(!taskUpdate?.name || !taskUpdate?.id) {
        console.log("Missing data in request body!")
        res.sendStatus(400);
        return;
    }
    TaskService.update(taskUpdate)
        .then((task) => {
            if(!task) {
                console.log("No such document!!");
                res.sendStatus(404);
                return;
            }
            console.log("Task Document successfully updated!");
            res.status(200).json(task);
        })
        .catch((error) => {
            console.error("Error writing document: ", error);
            res.status(500).send(`Error writing document: ${error}`);
        });
});

// PUT tasks/subtasks

tasksRouter.put("/subtasks", (req: Request, res: Response) => {
    const taskUpdate: Task = req.body;
    if(!taskUpdate?.name || !taskUpdate?.id || !taskUpdate?.subtasks) {
        res.sendStatus(400);
        return;
    }
    TaskService.updateSubtasks(taskUpdate)
        .then((task) => {
            if(!task) {
                console.log("No such document!!!!");
                res.sendStatus(404);
                return;
            }
            console.log("Task Document successfully updated!");
            res.status(200).json(task);
        })
        .catch((error) => {
            console.error("Error writing document: ", error);
            res.status(500).send(`Error writing document: ${error}`);
        });
});

// DELETE /tasks/:id

tasksRouter.delete("/:id", (req: Request, res: Response) => {
    /** Front end has to handle the cascade
     => force user to delete character in all stories and relationships
     before being able to delete object
     **/
    const { id } = req.params;
    console.log(`In delete with id : ${id}`)
    if (!id) {
        console.log(`id ${id} not given`)
        res.sendStatus(400)
        return;
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
                    res.status(204).send(id);
                }).catch((error) => {
                    console.log("Error deleting document:", error);
                    res.status(500).send(`Error deleting document: ${error}`);
                });
            } else {
                console.log("No such document!!!!");
                res.sendStatus(404);
            }
        });
});

// DELETE /tasks?name=name

tasksRouter.delete("/", (req: Request, res: Response) => {
    /** Front end has to handle the cascade
     => force user to delete character in all stories and relationships
     before being able to delete object
     **/
    let name = req.query?.name ?? "";
    console.log(`In delete by name with name : ${name}`);
    if (!name) {
        console.log("Name not provided!")
        res.sendStatus(400);
        return;
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
                    res.status(204).send(id);
                }).catch((error) => {
                    console.log("Error deleting document:", error);
                    res.status(500).send(`Error deleting document: ${error}`);
                });
            } else {
                console.log("No such document!!!!");
                res.sendStatus(404);
            }
        });
});
