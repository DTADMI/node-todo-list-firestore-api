// src/maps/maps.service.ts

/**
 * Data Model Interfaces
 */

import {BaseTask, Task} from "./task.interface.js";
import {db} from "../common/firebase.js";
import {cache, CACHE_KEYS, clearAllCache} from "../common/cache.service";
import {writeLog} from "../common/logger.service";

/**
 * Firebase Store
 */

const TaskCollection = db.collection("Task");

/**
 * Service Methods
 */


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

export const findAllFromUser = async (userId: string): Promise<Task[]> => {
    writeLog(`findAllFromUser with userId: ${userId}`);
    const cacheKey = CACHE_KEYS.USER_TASKS;
    if(cache.has(cacheKey)){
        return Promise.resolve(cache.get<Task[]>(cacheKey) as Task[]);
    }

    return TaskCollection.where('userId', '==', userId).get().then((snapshot)=>{
        const tasks: Task[] = snapshot.docs.map((doc) => {
            return doc.data() as Task;
        });
        cache.set<Task[]>(cacheKey, tasks);
        return tasks;
    })
}

export const findById = async (id: string): Promise<Task | null> => {
    const cacheKey = CACHE_KEYS.ALL_TASKS;
    if(cache.has(cacheKey)) {
        const tasks = cache.get<Task[]>(cacheKey) as Task[];
        return Promise.resolve(tasks?.find(task => task.id === id) ?? null);
    }
    const docRef = TaskCollection.doc(id);
    return docRef.get().then((doc) => {
        if (doc.exists) {
            writeLog(`Task Document data: ${doc.data()}`);
            return doc.data() as Task;
        } else {
            writeLog("No such document!!!!!");
            return null;
        }
    })
};

export const findByName = async (name: string): Promise<Task | null> => {
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

export const create = async (newBaseTask: BaseTask): Promise<Task> => {
    writeLog(`Creating task ${JSON.stringify(newBaseTask)}`);
    const now = new Date().toUTCString();
    const newTask = {...newBaseTask, creationDate: now, lastModificationDate: now}
    const docRef = await TaskCollection.add(newTask);
    writeLog(`Task Document written with ID: ${docRef.id}`);
    clearAllCache();
    TaskCollection.doc(docRef.id).update({
        id: docRef.id
    }).then(() => {
        writeLog("Task Document id successfully updated!");
    });
    const task = {...newTask} as Task;
    task.id = docRef.id;
    return task;
};

export const update = async (
    taskUpdate: Task
): Promise<Task | null> => {
    writeLog(`Update started with : ${JSON.stringify(taskUpdate)}`);
    const dataUpdate = { ...taskUpdate, lastModificationDate: new Date().toUTCString()}
    const docRef = TaskCollection.doc(dataUpdate.id);
    return docRef.set(dataUpdate, {merge: true})
        .then(async () => {
            writeLog("Task Document successfully updated!");
            clearAllCache();
            const doc = await docRef.get();
            if (doc.exists) {
                writeLog(`Task Document data: ${doc.data()}`);
                return doc.data() as Task;
            } else {
                writeLog("No such document!!!!!!");
                return null;
            }
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
        .then(async () => {
            writeLog(`Task Document ${taskUpdate.id} successfully updated with subtasks ${JSON.stringify(dataUpdate.subtasks)}!`);
            clearAllCache();
            dataUpdate.subtasks.forEach((subtaskId) => {
                const subtaskDocRef = TaskCollection.doc(subtaskId);
                const subtaskDataUpdate = {
                    superTask: taskUpdate.id,
                    lastModificationDate: new Date().toUTCString()
                };
                subtaskDocRef.set(subtaskDataUpdate, {merge: true})
                    .then(() => {
                        writeLog(`Subtask Document ${subtaskId} successfully updated with superTask ${taskUpdate.id}!`);
                    });
            });
            const doc = await docRef.get();
            if (doc.exists) {
                writeLog(`Task Document data: ${doc.data()}`);
                return doc.data() as Task;
            } else {
                writeLog("No such document!!!!!!!");
                return null;
            }
        });
};


export const remove = async (id: string): Promise<void> => {
    writeLog(`Deletion started for id : ${id}`)
    const docRef = TaskCollection.doc(id);
    return docRef.delete().then(() => {
        writeLog("Task Document deleted");
        clearAllCache();
    })
};