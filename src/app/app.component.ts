import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { Task } from './task/task';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { Firestore, collection, addDoc, doc, deleteDoc, updateDoc, runTransaction, query, onSnapshot } from '@angular/fire/firestore';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'GDGWeb';
  todo: Task[] = [];

  inProgress: Task[] = [];
  done: Task[] = [];

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult|undefined) => {
      if (!result) {
        return;
      }
      if (result.delete) {
        deleteDoc(doc(this.firestore, `${list}/${task.id}`));
      } else {
        updateDoc(doc(this.firestore, `${list}/${task.id}`), { ...task });
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    if (!event.container.data || !event.previousContainer.data) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    runTransaction(this.firestore, async (transaction) => {
      transaction.delete(doc(this.firestore, `${event.previousContainer.id}/${item.id}`))
      transaction.set(doc(collection(this.firestore, event.container.id)), item)
    });
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }
  constructor(private dialog: MatDialog, private firestore: Firestore) {
    onSnapshot(query(collection(firestore, 'todo')), snap => {
      const data: Task[] = [];
      snap.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id } as Task);
      });
      this.todo = data
    });
    onSnapshot(query(collection(firestore, 'inProgress')), snap => {
      const data: Task[] = [];
      snap.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id } as Task);
      });
      this.inProgress = data
    });
    onSnapshot(query(collection(firestore, 'done')), snap => {
      const data: Task[] = [];
      snap.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id } as Task);
      });
      this.done = data
    });
  }

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult|undefined) => {
        if (!result) {
          return;
        }
        addDoc(collection(this.firestore, 'todo'), result.task)
      });
  }
}
