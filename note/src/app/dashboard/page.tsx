'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, database } from '@/framework/firebase';
import { signOut } from 'firebase/auth';
import { ref, push, update, remove, onValue } from 'firebase/database';

type Note = {
  id: string;
  content: string;
  category: string;
};

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('all'); // Default to 'all'
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [copiedNoteContent, setCopiedNoteContent] = useState('');
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const userNotesRef = ref(database, `notes/${user.uid}`);
    const userCategoriesRef = ref(database, `categories/${user.uid}`);

    // Fetch notes
    onValue(userNotesRef, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((childSnapshot) => {
        const note = childSnapshot.val();
        notesData.push({
          id: childSnapshot.key as string,
          content: note.content,
          category: note.category || 'Uncategorized', // Default category
        });
      });
      setNotes(notesData);
    });

    // Fetch categories
    onValue(userCategoriesRef, (snapshot) => {
      const categoriesData: { id: string; name: string }[] = [];
      snapshot.forEach((childSnapshot) => {
        const category = childSnapshot.val();
        categoriesData.push({ id: childSnapshot.key as string, name: category.name });
      });
      setCategories(categoriesData);
    });
  }, [router, user]);

  const handleAddNote = async () => {
    if (newNote.trim() === '' || selectedTab === '') return;

    const userNotesRef = ref(database, `notes/${user.uid}`);
    await push(userNotesRef, {
      content: newNote,
      category: selectedTab !== 'all' ? selectedTab : 'Uncategorized',
    });
    setNewNote('');
  };

  const handleUpdateNote = async (noteId: string) => {
    if (editContent.trim() === '' || selectedTab === '') return;

    const noteRef = ref(database, `notes/${user.uid}/${noteId}`);
    await update(noteRef, {
      content: editContent,
      category: selectedTab !== 'all' ? selectedTab : 'Uncategorized',
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

  // Function to handle copying note content to clipboard
  const handleCopyNote = (noteContent: string) => {
    navigator.clipboard
      .writeText(noteContent)
      .then(() => {
        alert('ノートがコピーされました!');
      })
      .catch((err) => {
        console.error('コピーに失敗しました: ', err);
      });
  };

  // Function to handle setting note content in the edit area
  const handleCreateNote = (noteContent: string) => {
    setCopiedNoteContent(noteContent);
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

  // Convert newlines to <br> tags
  const formatNoteContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() === '') return;

    const userCategoriesRef = ref(database, `categories/${user.uid}`);
    await push(userCategoriesRef, { name: newCategory });
    setNewCategory('');
  };

  const filteredNotes =
    selectedTab === 'all'
      ? notes
      : notes.filter((note) => note.category === selectedTab);

  return (
    <div className="w-screen h-screen p-4">
      <h1 className="text-red text-3xl mb-4">Your Dashboard</h1>
      <button
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4"
        onClick={handleSignOut}
      >
        Sign Out
      </button>

      <div className="bg-white p-4 rounded mb-4">
        <h2 className="text-xl mb-2">Add Note</h2>
        <textarea
          className="border rounded w-full py-2 px-3 mb-2"
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

      <div className="bg-white p-4 rounded mb-4">
        <h2 className="text-xl mb-2">Add Category</h2>
        <input
          className="border rounded w-full py-2 px-3 mb-2"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Enter new category"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleAddCategory}
        >
          Add Category
        </button>
      </div>

      <div className="bg-white p-4 rounded mb-4">
        <h2 className="text-xl mb-2">Edit Copied Note</h2>
        <textarea
          className="border rounded w-full py-2 px-3 mb-2"
          value={copiedNoteContent}
          onChange={(e) => setCopiedNoteContent(e.target.value)}
          placeholder="Edit copied note here"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            navigator.clipboard
              .writeText(copiedNoteContent)
              .then(() => {
                alert('編集したノートがコピーされました!');
              })
              .catch((err) => {
                console.error('コピーに失敗しました: ', err);
              });
          }}
        >
          Copy Edited Note
        </button>
      </div>

      {/* Tab Navigation for Categories */}
      <div className="bg-white p-4 rounded mb-4">
        <h2 className="text-xl mb-2">Categories</h2>
        <div className="flex">
          <button
            className={`py-2 px-4 rounded mr-2 ${
              selectedTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setSelectedTab('all')}
          >
            View All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`py-2 px-4 rounded mr-2 ${
                selectedTab === category.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setSelectedTab(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded">
        <h2 className="text-xl mb-2">Your Notes</h2>
        {filteredNotes.map((note) => (
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
                <span className="flex-1">{formatNoteContent(note.content)}</span>
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
                  onClick={() => setNoteToDelete(note.id)}
                >
                  Delete
                </button>
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                  onClick={() => handleCreateNote(note.content)}
                >
                  Create
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
