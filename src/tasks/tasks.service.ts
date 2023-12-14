// src/maps/maps.service.ts

/**
 * Data Model Interfaces
 */

import {BaseTask, Task} from "./task.interface";
import {db} from "../common/firebase";
import NodeCache from "node-cache";

/**
 * Firebase Store
 */

const TaskCollection = db.collection("Task");

/**
 * Cache initialization
 * **/
const cache = new NodeCache( { stdTTL: 120, checkperiod: 600 } );
const CACHE_KEYS = {
    ALL_TASKS : "All tasks",
    USER_TASKS: "User tasks",
    TASK: "Task_"
}

/**
 * Service Methods
 */


export const find = async (/*orderByField?: string, orderByOrder?: string, limit?: number, startAfter?: string, showMedata: boolean*/): Promise<Task[]> => {

    /*const orderBField = orderByField ?? "creationDate";
    const orderBOrder = orderByOrder ?? "asc";
    const lim = limit ?? 0;
    const startFieldValue = startAfter ?? "";*/
    return TaskCollection/*.orderBy(orderBField, orderBOrder as OrderByDirection).startAfter(startFieldValue).limit(lim)*/.get().then((snapshot)=>{
        /*let results = {};
        results.data = */
        return snapshot.docs.map((doc) => doc.data() as Task);
        //return results;
    })
};

export const findAll = async (): Promise<Task[]> => {
    const cacheKey = CACHE_KEYS.ALL_TASKS;
    if(cache.has(cacheKey)){
        return Promise.resolve(cache.get<Task[]>(cacheKey) as Task[]);
    }

    return TaskCollection.get().then((snapshot) => {
        const tasks: Task[] = snapshot.docs.map((doc) => {
            return doc.data() as Task;
        });
        cache.set<Task[]>(cacheKey, tasks);
        return tasks;
    })
};

export const findAllFromUser = async (user: string): Promise<Task[]> => {
    console.log(`findAllFromUser with user: ${user}`);
    const cacheKey = CACHE_KEYS.USER_TASKS;
    if(cache.has(cacheKey)){
        return Promise.resolve(cache.get<Task[]>(cacheKey) as Task[]);
    }

    return TaskCollection.where('user', '==', user).get().then((snapshot)=>{
        const tasks: Task[] = snapshot.docs.map((doc) => {
            return doc.data() as Task;
        });
        cache.set<Task[]>(cacheKey, tasks);
        return tasks;
    })
}

export const findById = async (id: string): Promise<Task | null> => {
    const cacheKey = CACHE_KEYS.TASK + id;
    if(cache.has(cacheKey)) {
        return Promise.resolve(cache.get<Task>(cacheKey) as Task);
    }
    const docRef = TaskCollection.doc(id);
    return docRef.get().then((doc) => {
        if (doc.exists) {
            console.log("Task Document data:", doc.data());
            const task: Task = doc.data() as Task;
            cache.set<Task>(cacheKey, task);
            return task;
        } else {
            console.log("No such document!!!!!");
            return null;
        }
    })
};

export const findInCacheById = async (id: string): Promise<Task | null> => {
    const cacheKey = CACHE_KEYS.ALL_TASKS;
    if(cache.has(cacheKey)) {
        const tasks = cache.get<Task[]>(cacheKey) as Task[];
        return Promise.resolve(tasks?.find(task => task.id === id) ?? null);
    }
    const docRef = TaskCollection.doc(id);
    return docRef.get().then((doc) => {
        if (doc.exists) {
            console.log("Task Document data:", doc.data());
            return doc.data() as Task;
        } else {
            console.log("No such document!!!!!");
            return null;
        }
    })
};

export const findByName = async (name: string): Promise<Task | null> => {
    const cacheKey = CACHE_KEYS.TASK + name;
    if(cache.has(cacheKey)) {
        return Promise.resolve(cache.get<Task>(cacheKey) as Task);
    }

    return TaskCollection.where('name', '==', name).get().then((snapshot)=>{
        const task: Task | null = snapshot.docs.map((doc) => {
            return doc.data() as Task;
        }).find((task: Task) => task.name === name) ?? null;
        if(task){
            cache.set<Task>(cacheKey, task);
        }
        return task;
    })
};


export const findInCacheByName = async (name: string): Promise<Task | null> => {
    const cacheKey = CACHE_KEYS.ALL_TASKS;
    if(cache.has(cacheKey)) {
        const tasks = cache.get<Task[]>(cacheKey) as Task[];
        return Promise.resolve(tasks?.find(task => task.name === name) ?? null);
    }

    return TaskCollection.where('name', '==', name).get().then((snapshot)=>{
        return snapshot.docs.map((doc) => {
            return doc.data() as Task;
        }).find((task: Task) => task.name === name) ?? null;
    })
};

export const create = (newBaseTask: BaseTask): Promise<Task> => {
    console.log(`Creating task ${JSON.stringify(newBaseTask)}`);
    const newTask = { ...newBaseTask, creationDate: new Date().toUTCString()}
    return TaskCollection.add(newTask)
        .then((docRef) => {
            console.log("Task Document written with ID: ", docRef.id);
            cache.del(CACHE_KEYS.ALL_TASKS);
            cache.del(CACHE_KEYS.USER_TASKS);
            TaskCollection.doc(docRef.id).update({
                id: docRef.id
            }).then(() => {
                console.log("Task Document id successfully updated!");
            });
            const task = {...newTask} as Task;
            task.id = docRef.id;
            return task;
        });
};

export const update = async (
    taskUpdate: Task
): Promise<Task | null> => {
    console.log(`Update started with : ${JSON.stringify(taskUpdate)}`);
    const dataUpdate = { ...taskUpdate, lastModificationDate: new Date().toUTCString()}
    const docRef = TaskCollection.doc(dataUpdate.id);
    return docRef.set(dataUpdate, {merge: true})
        .then(() => {
            console.log("Task Document successfully updated!");
            cache.del(CACHE_KEYS.TASK + dataUpdate.id);
            cache.del(CACHE_KEYS.TASK + dataUpdate.name);
            cache.del(CACHE_KEYS.ALL_TASKS);
            cache.del(CACHE_KEYS.USER_TASKS);
            return docRef.get().then((doc) => {
                if (doc.exists) {
                    console.log("Task Document data:", doc.data());
                    return doc.data() as Task;
                } else {
                    console.log("No such document!!!!!!");
                    return null;
                }
            });
        });
};

export const updateSubtasks = async (
    taskUpdate: Task
): Promise<Task | null> => {
    const docRef = TaskCollection.doc(taskUpdate.id);
    const dataUpdate = {
        subtasks: taskUpdate.subtasks ?? [] as string[],
        lastModificationDate: new Date().toUTCString()
    };
    return docRef.set(dataUpdate, {merge: true})
        .then(() => {
            console.log(`Task Document ${taskUpdate.id} successfully updated with subtasks ${JSON.stringify(dataUpdate.subtasks)}!`);
            cache.del(CACHE_KEYS.TASK + taskUpdate.id);
            cache.del(CACHE_KEYS.TASK + taskUpdate.name);
            cache.del(CACHE_KEYS.ALL_TASKS);
            cache.del(CACHE_KEYS.USER_TASKS);
            dataUpdate.subtasks.forEach((subtaskId) => {
                const subtaskDocRef = TaskCollection.doc(subtaskId);
                const subtaskDataUpdate = {
                    superTask: taskUpdate.id,
                    lastModificationDate: new Date().toUTCString()
                };
                subtaskDocRef.set(subtaskDataUpdate, {merge: true})
                    .then(() => {
                        console.log(`Subtask Document ${subtaskId} successfully updated with superTask ${taskUpdate.id}!`);
                        cache.del(CACHE_KEYS.TASK + subtaskId);
                    });
            });
            return docRef.get().then((doc) => {
                if (doc.exists) {
                    console.log("Task Document data:", doc.data());
                    return doc.data() as Task;
                } else {
                    console.log("No such document!!!!!!!");
                    return null;
                }
            });
        });
};


export const remove = async (id: string): Promise<string | void> => {
    console.log(`Deletion started for id : ${id}`)
    const docRef = TaskCollection.doc(id);
    return docRef.delete().then(() => {
        console.log("Task Document deleted");
        cache.del(CACHE_KEYS.TASK + id);
        cache.del(CACHE_KEYS.USER_TASKS);
        cache.del(CACHE_KEYS.ALL_TASKS);
        return id;
    })
};