'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, database } from '@/framework/firebase';
import { signOut } from 'firebase/auth';
import {
  ref,
  push,
  update,
  remove,
  onValue,
} from 'firebase/database';

type Note = {
  id: string;
  content: string;
};

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const userNotesRef = ref(database, `notes/${user.uid}`);

    onValue(userNotesRef, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((childSnapshot) => {
        const note = childSnapshot.val();
        notesData.push({ id: childSnapshot.key as string, content: note.content });
      });
      setNotes(notesData);
    });
  }, [router, user, database]);

  const handleAddNote = async () => {
    if (newNote.trim() === '') return;

    const userNotesRef = ref(database, `notes/${user.uid}`);
    await push(userNotesRef, {
      content: newNote,
    });
    setNewNote('');
  };

  const handleUpdateNote = async (noteId: string) => {
    if (editContent.trim() === '') return;

    const noteRef = ref(database, `notes/${user.uid}/${noteId}`);
    await update(noteRef, {
      content: editContent,
    });
    setEditNoteId(null);
    setEditContent('');
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    const noteRef = ref(database, `notes/${user.uid}/${noteToDelete}`);
    await remove(noteRef);
    setNoteToDelete(null);
  };

  const handleCopyNote = (noteContent: string) => {
    navigator.clipboard.writeText(noteContent).then(() => {
      alert('ノートがコピーされました!');
    }).catch((err) => {
      console.error('コピーに失敗しました: ', err);
    });
  };

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        router.push('/');
      })
      .catch((error) => {
        console.error('ログアウトに失敗しました: ', error);
      });
  };

  return (
    <div className="bg-green-600 w-screen h-screen p-4">
      <h1 className="text-white text-3xl mb-4">Your Dashboard</h1>
      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4"
        onClick={handleSignOut}
      >
        Sign Out
      </button>

      <div className="bg-white p-4 rounded mb-4">
        <h2 className="text-xl mb-2">Add Note</h2>
        <input
          className="border rounded w-full py-2 px-3 mb-2"
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Enter your note"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleAddNote}
        >
          Add
        </button>
      </div>

      <div className="bg-white p-4 rounded">
        <h2 className="text-xl mb-2">Your Notes</h2>
        {notes.map((note) => (
          <div
            key={note.id}
            className="border-b border-gray-200 py-2 flex items-center"
          >
            {editNoteId === note.id ? (
              <>
                <input
                  className="border rounded w-full py-2 px-3 mr-2"
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your note"
                />
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                  onClick={() => handleUpdateNote(note.id)}
                >
                  Save
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => {
                    setEditNoteId(null);
                    setEditContent('');
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1">{note.content}</span>
                <button
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
                  onClick={() => {
                    setEditNoteId(note.id);
                    setEditContent(note.content);
                  }}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                  onClick={() => setNoteToDelete(note.id)} // モーダルを表示
                >
                  Delete
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => handleCopyNote(note.content)}
                >
                  Copy
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 削除確認モーダル */}
      {noteToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">ノートを削除しますか？</h3>
            <p className="mb-4">この操作は元に戻せません。</p>
            <div className="flex justify-end">
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() => setNoteToDelete(null)}
              >
                キャンセル
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleDeleteNote}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
